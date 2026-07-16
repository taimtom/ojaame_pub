import { useCallback, useEffect, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { fetchVoiceStatus, submitVoiceCommand } from 'src/actions/voice';

import { useVoiceCapture } from './use-voice-capture';
import { createBrowserSpeechSession } from './use-browser-speech';
import {
  VOICE_LANGUAGES,
  getStickyVoiceLanguage,
  setStickyVoiceLanguage,
} from './voice-storage';

// ----------------------------------------------------------------------

const MAX_RECORD_MS = 24000;
/** Below this, treat as accidental tap — cancel silently (no toast). */
const SILENT_CANCEL_MS = 350;

function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  return `0:${String(s).padStart(2, '0')}`;
}

export function VoiceMicButton({
  storeId,
  intentHint = 'sale',
  disabled = false,
  offline = false,
  onDraft,
  onStatusChange,
  sx,
}) {
  const [language, setLanguage] = useState(() => getStickyVoiceLanguage());
  // idle | starting | recording | processing
  const [phase, setPhase] = useState('idle');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [langAnchor, setLangAnchor] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const browserSessionRef = useRef(null);
  const browserPromiseRef = useRef(null);
  const pressActiveRef = useRef(false);
  const recorderReadyRef = useRef(false);
  const pressStartedAtRef = useRef(0);
  const submittingRef = useRef(false);
  const buttonRef = useRef(null);
  const elapsedTimerRef = useRef(null);

  const {
    isRecording,
    level,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceCapture({ maxMs: MAX_RECORD_MS });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await fetchVoiceStatus();
        if (!cancelled) {
          setVoiceEnabled(Boolean(status?.enabled));
          onStatusChange?.(status);
        }
      } catch {
        if (!cancelled) setVoiceEnabled(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onStatusChange]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (phase !== 'recording') {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
      if (phase === 'idle' || phase === 'starting') setElapsedMs(0);
      return undefined;
    }
    setElapsedMs(0);
    const started = Date.now();
    elapsedTimerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - started);
    }, 200);
    return () => {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    };
  }, [phase]);

  const abortBrowserHint = useCallback(() => {
    browserSessionRef.current?.abort?.();
    browserSessionRef.current = null;
    browserPromiseRef.current = null;
  }, []);

  const changeLanguage = (value) => {
    setLanguage(value);
    setStickyVoiceLanguage(value);
    setLangAnchor(null);
  };

  const handlePointerDown = useCallback(
    async (e) => {
      e.preventDefault();
      if (disabled || offline || !voiceEnabled || !storeId || phase !== 'idle') return;
      if (submittingRef.current) return;

      pressActiveRef.current = true;
      recorderReadyRef.current = false;
      pressStartedAtRef.current = Date.now();
      setPhase('starting');

      try {
        e.currentTarget?.setPointerCapture?.(e.pointerId);
      } catch {
        // ignore — capture optional
      }

      if (language === 'en') {
        const session = createBrowserSpeechSession({ lang: 'en-NG' });
        browserSessionRef.current = session;
        if (session.supported) {
          browserPromiseRef.current = session.start();
        }
      } else {
        abortBrowserHint();
      }

      const ok = await startRecording();
      if (!pressActiveRef.current) {
        // Released while starting — already cancelled in pointerUp
        if (ok) await cancelRecording();
        abortBrowserHint();
        setPhase('idle');
        return;
      }
      if (!ok) {
        pressActiveRef.current = false;
        abortBrowserHint();
        setPhase('idle');
        return;
      }

      recorderReadyRef.current = true;
      setPhase('recording');
    },
    [
      disabled,
      offline,
      voiceEnabled,
      storeId,
      phase,
      language,
      startRecording,
      cancelRecording,
      abortBrowserHint,
    ]
  );

  const finishSubmit = useCallback(
    async (blob, filename) => {
      submittingRef.current = true;
      setPhase('processing');

      let browserHint = null;
      if (browserPromiseRef.current) {
        try {
          const spoken = await Promise.race([
            browserPromiseRef.current,
            new Promise((resolve) => setTimeout(() => resolve(null), 500)),
          ]);
          browserHint = spoken?.transcript || null;
        } catch {
          browserHint = null;
        }
      }
      abortBrowserHint();

      try {
        const result = await submitVoiceCommand({
          storeId,
          language,
          intentHint,
          audioBlob: blob,
          transcript: browserHint || undefined,
          filename,
        });

        if (result?.warnings?.length) {
          result.warnings.forEach((w) => {
            if (w) toast.warning(w);
          });
        }

        if (!result?.draft) {
          toast.error("Couldn't catch that — try again or type the product");
        } else {
          onDraft?.(result);
        }
      } catch (err) {
        const detail =
          err?.response?.data?.detail ||
          "Couldn't catch that — try again or type the product";
        toast.error(
          typeof detail === 'string'
            ? detail
            : "Couldn't catch that — try again or type the product"
        );
      } finally {
        submittingRef.current = false;
        pressActiveRef.current = false;
        recorderReadyRef.current = false;
        setPhase('idle');
      }
    },
    [storeId, language, intentHint, onDraft, abortBrowserHint]
  );

  const handlePointerUp = useCallback(async () => {
    if (!pressActiveRef.current && phase !== 'starting' && phase !== 'recording') {
      return;
    }
    if (submittingRef.current || phase === 'processing') return;

    pressActiveRef.current = false;
    const heldMs = Date.now() - (pressStartedAtRef.current || 0);
    const hadRecorder = recorderReadyRef.current || isRecording;

    // Accidental tap / released before mic ready — silent cancel
    if (!hadRecorder || heldMs < SILENT_CANCEL_MS || phase === 'starting') {
      abortBrowserHint();
      await cancelRecording();
      recorderReadyRef.current = false;
      setPhase('idle');
      return;
    }

    setPhase('processing');
    const recorded = await stopRecording();
    const blob = recorded?.blob || null;
    const filename = recorded?.filename || 'voice.webm';
    recorderReadyRef.current = false;

    if (!blob || blob.size < 800) {
      abortBrowserHint();
      setPhase('idle');
      toast.error('Hold the mic a bit longer, then try again');
      return;
    }

    if (recorded?.hitMaxDuration) {
      toast.info('Max recording length reached (24s) — sending what you said');
    }

    await finishSubmit(blob, filename);
  }, [
    phase,
    isRecording,
    stopRecording,
    cancelRecording,
    abortBrowserHint,
    finishSubmit,
  ]);

  const handlePointerCancel = useCallback(async () => {
    if (submittingRef.current || phase === 'processing') return;
    pressActiveRef.current = false;
    recorderReadyRef.current = false;
    abortBrowserHint();
    await cancelRecording();
    setPhase('idle');
  }, [phase, cancelRecording, abortBrowserHint]);

  if (!voiceEnabled && phase === 'idle') {
    return (
      <Tooltip title="Voice minutes used up for this month — type instead">
        <span>
          <IconButton disabled size="medium" sx={sx}>
            <Iconify icon="solar:microphone-bold" width={22} />
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  const statusLabel =
    phase === 'starting'
      ? 'Starting…'
      : phase === 'recording'
        ? `Listening… ${formatElapsed(elapsedMs)}`
        : phase === 'processing'
          ? 'Transcribing…'
          : 'Hold to talk';

  const isBusy = phase === 'starting' || phase === 'recording' || phase === 'processing';
  const showPulse = phase === 'recording' && isRecording;
  const progress = Math.min(100, (elapsedMs / MAX_RECORD_MS) * 100);

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, ...sx }}>
      <Chip
        size="small"
        label={VOICE_LANGUAGES.find((l) => l.value === language)?.label || 'Auto'}
        onClick={(e) => setLangAnchor(e.currentTarget)}
        sx={{ height: 28, fontWeight: 600 }}
      />
      <Menu
        anchorEl={langAnchor}
        open={Boolean(langAnchor)}
        onClose={() => setLangAnchor(null)}
      >
        {VOICE_LANGUAGES.map((l) => (
          <MenuItem
            key={l.value}
            selected={l.value === language}
            onClick={() => changeLanguage(l.value)}
          >
            {l.label}
          </MenuItem>
        ))}
      </Menu>

      <Tooltip title={offline ? 'Voice needs network' : statusLabel}>
        <span>
          <IconButton
            ref={buttonRef}
            color={phase === 'recording' || phase === 'starting' ? 'error' : 'primary'}
            disabled={disabled || offline || !storeId || phase === 'processing'}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onLostPointerCapture={handlePointerCancel}
            onContextMenu={(e) => e.preventDefault()}
            sx={{
              touchAction: 'none',
              position: 'relative',
              bgcolor:
                phase === 'recording'
                  ? 'error.lighter'
                  : phase === 'starting'
                    ? 'warning.lighter'
                    : 'action.hover',
              transform: showPulse ? `scale(${1 + level * 0.15})` : 'none',
              transition: 'transform 80ms linear, background-color 120ms ease',
            }}
          >
            {phase === 'processing' || phase === 'starting' ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Iconify icon="solar:microphone-bold" width={22} />
            )}
          </IconButton>
        </span>
      </Tooltip>

      {isBusy && (
        <Box sx={{ minWidth: 110, maxWidth: 140 }}>
          <Typography
            variant="caption"
            color={phase === 'recording' ? 'error.main' : 'text.secondary'}
            sx={{ fontWeight: phase === 'recording' ? 700 : 500, display: 'block' }}
          >
            {phase === 'recording'
              ? 'Listening… release to send'
              : phase === 'processing'
                ? 'Transcribing…'
                : 'Starting…'}
          </Typography>
          {phase === 'recording' && (
            <>
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                {formatElapsed(elapsedMs)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progress}
                color="error"
                sx={{ height: 3, borderRadius: 1, mt: 0.25 }}
              />
            </>
          )}
          {phase === 'processing' && (
            <LinearProgress sx={{ height: 3, borderRadius: 1, mt: 0.5 }} />
          )}
        </Box>
      )}
    </Box>
  );
}
