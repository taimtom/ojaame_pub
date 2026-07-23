import { useCallback, useEffect, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { useVoiceCapture } from 'src/sections/voice/use-voice-capture';
import {
  VOICE_LANGUAGES,
  getStickyVoiceLanguage,
  setStickyVoiceLanguage,
  voiceCoachExamples,
} from 'src/sections/voice/voice-storage';

// ----------------------------------------------------------------------

const MAX_RECORD_MS = 24000;
/** Accidental tap — cancel silently (matches Quick Sale voice). */
const SILENT_CANCEL_MS = 350;

function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  return `0:${String(s).padStart(2, '0')}`;
}

/** Bar heights as fractions of the live mic level (0–1). */
const LEVEL_BAR_WEIGHTS = [0.35, 0.55, 0.85, 1, 0.75, 0.5, 0.4];

function VoiceLevelBars({ level, active }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.4} sx={{ height: 28, px: 0.25 }}>
      {LEVEL_BAR_WEIGHTS.map((weight, index) => {
        const height = active
          ? Math.max(4, Math.round(4 + level * weight * 24))
          : 4;
        return (
          <Box
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            sx={{
              width: 3,
              height,
              borderRadius: 1,
              bgcolor: active ? 'error.main' : 'action.disabledBackground',
              opacity: active ? 0.55 + weight * 0.45 : 0.5,
              transition: 'height 70ms linear, opacity 70ms linear',
            }}
          />
        );
      })}
    </Stack>
  );
}

export function AiAgentInput({ disabled, onSendText, onSendVoice, onBargeIn, compact = false }) {
  const [text, setText] = useState('');
  // idle | starting | recording | processing
  const [phase, setPhase] = useState('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [language, setLanguage] = useState(() => getStickyVoiceLanguage());
  const [langAnchor, setLangAnchor] = useState(null);

  const pressActiveRef = useRef(false);
  const recorderReadyRef = useRef(false);
  const pressStartedAtRef = useRef(0);
  const submittingRef = useRef(false);
  const elapsedTimerRef = useRef(null);

  const {
    startRecording,
    stopRecording,
    cancelRecording,
    isRecording,
    level,
    error,
  } = useVoiceCapture({
    maxMs: MAX_RECORD_MS,
  });

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

  const changeLanguage = (value) => {
    setLanguage(value);
    setStickyVoiceLanguage(value);
    setLangAnchor(null);
  };

  const handleSend = useCallback(async () => {
    const value = text.trim();
    if (!value || disabled || phase !== 'idle') return;
    setText('');
    try {
      await onSendText(value);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to send message');
    }
  }, [disabled, onSendText, phase, text]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handlePointerDown = useCallback(
    async (e) => {
      e.preventDefault();
      // Barge-in: stop any read-aloud immediately when user starts talking
      onBargeIn?.();
      if (disabled || phase !== 'idle' || submittingRef.current) return;

      pressActiveRef.current = true;
      recorderReadyRef.current = false;
      pressStartedAtRef.current = Date.now();
      setPhase('starting');

      try {
        e.currentTarget?.setPointerCapture?.(e.pointerId);
      } catch {
        // optional
      }

      const ok = await startRecording();
      if (!pressActiveRef.current) {
        if (ok) await cancelRecording();
        setPhase('idle');
        return;
      }
      if (!ok) {
        pressActiveRef.current = false;
        setPhase('idle');
        toast.error('Microphone access denied');
        return;
      }

      recorderReadyRef.current = true;
      setPhase('recording');
    },
    [disabled, phase, startRecording, cancelRecording, onBargeIn]
  );

  const handlePointerUp = useCallback(async () => {
    if (!pressActiveRef.current && phase !== 'starting' && phase !== 'recording') {
      return;
    }
    if (submittingRef.current || phase === 'processing') return;

    pressActiveRef.current = false;
    const heldMs = Date.now() - (pressStartedAtRef.current || 0);
    const hadRecorder = recorderReadyRef.current || isRecording;

    if (!hadRecorder || heldMs < SILENT_CANCEL_MS || phase === 'starting') {
      await cancelRecording();
      recorderReadyRef.current = false;
      setPhase('idle');
      return;
    }

    setPhase('processing');
    const recorded = await stopRecording();
    const blob = recorded?.blob || null;
    recorderReadyRef.current = false;

    if (!blob || blob.size < 800) {
      setPhase('idle');
      toast.error('Hold the mic a bit longer, then try again');
      return;
    }

    if (recorded?.hitMaxDuration) {
      toast.info('Max recording length reached (24s) — sending what you said');
    }

    submittingRef.current = true;
    try {
      await onSendVoice({
        audioBlob: blob,
        language,
        filename: recorded?.filename,
      });
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Voice failed');
    } finally {
      submittingRef.current = false;
      setPhase('idle');
    }
  }, [phase, isRecording, stopRecording, cancelRecording, onSendVoice, language]);

  const handlePointerCancel = useCallback(async () => {
    if (submittingRef.current || phase === 'processing') return;
    pressActiveRef.current = false;
    recorderReadyRef.current = false;
    await cancelRecording();
    setPhase('idle');
  }, [phase, cancelRecording]);

  const isBusy = phase === 'starting' || phase === 'recording' || phase === 'processing';
  const showPulse = phase === 'recording' && isRecording;
  const progress = Math.min(100, (elapsedMs / MAX_RECORD_MS) * 100);
  const saleExample =
    voiceCoachExamples(language).find((ex) => /sell|ta |sayi|ree/i.test(ex)) ||
    voiceCoachExamples(language)[0];
  const statusLabel =
    phase === 'starting'
      ? 'Starting…'
      : phase === 'recording'
        ? `Listening… ${formatElapsed(elapsedMs)} — release to send`
        : phase === 'processing'
          ? 'Transcribing…'
          : saleExample
            ? `Hold to speak — e.g. “${saleExample}”`
            : 'Hold to speak';

  return (
    <Box
      sx={{
        px: compact ? 1.5 : 2,
        pt: compact ? 1 : 1.5,
        pb: compact
          ? 'calc(12px + env(safe-area-inset-bottom, 0px))'
          : 1.5,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        flexShrink: 0,
      }}
    >
      {isBusy && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            mb: 1,
            px: 1.5,
            py: 1,
            borderRadius: 1.5,
            bgcolor: phase === 'recording' ? 'error.lighter' : 'action.hover',
            border: 1,
            borderColor: phase === 'recording' ? 'error.light' : 'divider',
          }}
        >
          <VoiceLevelBars level={level} active={phase === 'recording'} />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              color={phase === 'recording' ? 'error.main' : 'text.secondary'}
              sx={{ fontWeight: phase === 'recording' ? 700 : 500, display: 'block' }}
            >
              {phase === 'recording'
                ? 'Listening… release to send'
                : phase === 'processing'
                  ? 'Transcribing…'
                  : 'Starting mic…'}
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
        </Stack>
      )}

      <Stack
        direction="row"
        alignItems="flex-end"
        spacing={0.75}
        sx={{
          px: compact ? 1.25 : 1.5,
          py: compact ? 0.75 : 1,
          borderRadius: compact ? 3 : 2,
          border: 1,
          borderColor: phase === 'recording' ? 'error.main' : 'divider',
          bgcolor: phase === 'recording' ? 'error.lighter' : 'background.neutral',
          transition: 'border-color 120ms ease, background-color 120ms ease',
        }}
      >
        <Chip
          size="small"
          label={VOICE_LANGUAGES.find((l) => l.value === language)?.label || 'Auto'}
          onClick={(e) => setLangAnchor(e.currentTarget)}
          disabled={disabled || isBusy}
          sx={{ height: 28, fontWeight: 600, alignSelf: 'center', flexShrink: 0 }}
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

        <InputBase
          multiline
          maxRows={compact ? 3 : 4}
          fullWidth
          placeholder={
            phase === 'recording'
              ? 'Listening…'
              : phase === 'processing'
                ? 'Sending voice…'
                : 'Ask anything about your store…'
          }
          value={text}
          disabled={disabled || isBusy}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{
            flex: 1,
            fontSize: compact ? 15 : 14,
            py: 0.5,
            lineHeight: 1.45,
          }}
        />

        <Tooltip title={statusLabel}>
          <span>
            <IconButton
              color={phase === 'recording' || phase === 'starting' ? 'error' : 'default'}
              disabled={disabled || phase === 'processing'}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onLostPointerCapture={handlePointerCancel}
              onContextMenu={(e) => e.preventDefault()}
              sx={{
                touchAction: 'none',
                width: compact ? 40 : 36,
                height: compact ? 40 : 36,
                bgcolor:
                  phase === 'recording'
                    ? 'error.main'
                    : phase === 'starting'
                      ? 'warning.lighter'
                      : 'background.paper',
                color: phase === 'recording' ? 'error.contrastText' : 'inherit',
                boxShadow: compact && phase === 'idle' ? 0 : undefined,
                transform: showPulse ? `scale(${1 + level * 0.2})` : 'none',
                transition: 'transform 80ms linear, background-color 120ms ease',
                '&:hover': {
                  bgcolor:
                    phase === 'recording'
                      ? 'error.dark'
                      : phase === 'starting'
                        ? 'warning.light'
                        : 'action.selected',
                },
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

        <IconButton
          color="primary"
          disabled={disabled || isBusy || !text.trim()}
          onClick={handleSend}
          sx={{
            width: compact ? 40 : 36,
            height: compact ? 40 : 36,
            bgcolor: text.trim() && !disabled && !isBusy ? 'primary.main' : 'transparent',
            color: text.trim() && !disabled && !isBusy ? 'primary.contrastText' : 'action.disabled',
            '&:hover': {
              bgcolor: text.trim() && !disabled && !isBusy ? 'primary.dark' : 'action.hover',
            },
            '&.Mui-disabled': {
              bgcolor: 'transparent',
            },
          }}
        >
          <Iconify icon="solar:plain-2-bold" width={22} />
        </IconButton>
      </Stack>
    </Box>
  );
}
