import { useCallback, useEffect, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { DashboardContent } from 'src/layouts/dashboard';
import { EmptyContent } from 'src/components/empty-content';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

import { AiAgentInput } from '../ai-agent-input';
import { AiAgentMessageList } from '../ai-agent-message-list';
import { AiAgentPendingAction } from '../ai-agent-pending-action';
import { AiAgentSessionSidebar } from '../ai-agent-session-sidebar';
import { useAiAgentSession } from '../hooks/use-ai-agent-session';
import {
  getStickyReadAloud,
  setStickyReadAloud,
  useBrowserTts,
} from '../hooks/use-browser-tts';

// ----------------------------------------------------------------------

function getStoreIdFromStorage() {
  try {
    const raw = localStorage.getItem('activeWorkspace');
    if (raw) {
      const { id } = JSON.parse(raw);
      return id ? Number(id) : null;
    }
  } catch {
    // ignore
  }
  return null;
}

function buildSpeakText(assistantContent, pendingAction) {
  const parts = [];
  if ((assistantContent || '').trim()) parts.push(assistantContent.trim());
  if (pendingAction?.summary) {
    parts.push(pendingAction.summary);
    parts.push('Please confirm or cancel.');
  }
  return parts.join('\n\n');
}

export function AiAgentView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeStoreId, setActiveStoreId] = useState(() => getStoreIdFromStorage());

  // Keep store in sync with the main app workspace switcher
  useEffect(() => {
    const sync = () => setActiveStoreId(getStoreIdFromStorage());
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    const interval = setInterval(sync, 2500);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
      clearInterval(interval);
    };
  }, []);

  const {
    sessionId,
    messages,
    pendingAction,
    sessions,
    sessionsLoading,
    loading,
    sending,
    backendEnabled,
    sendMessage,
    sendVoice,
    confirmAction,
    cancelAction,
    resetSession,
    selectSession,
  } = useAiAgentSession(activeStoreId);

  const { supported: ttsSupported, speaking, speak, cancel: cancelSpeech } = useBrowserTts();
  const [readAloud, setReadAloud] = useState(() => getStickyReadAloud());

  const lastInputWasVoiceRef = useRef(false);
  const lastSpokenKeyRef = useRef(null);
  const skipSpeakRef = useRef(true);

  const markSpokenCursor = useCallback((msgs, pending) => {
    const last = [...(msgs || [])].reverse().find(
      (m) => m.role === 'assistant' && (m.content || '').trim()
    );
    lastSpokenKeyRef.current = last
      ? `${last.id}:${pending?.id || ''}:${(last.content || '').slice(0, 40)}`
      : pending?.id
        ? `pending:${pending.id}`
        : null;
  }, []);

  useEffect(() => {
    skipSpeakRef.current = true;
    markSpokenCursor(messages, pendingAction);
    cancelSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on session change
  }, [sessionId]);

  useEffect(() => {
    setStickyReadAloud(readAloud);
  }, [readAloud]);

  useEffect(() => {
    if (!readAloud || !ttsSupported) return undefined;
    if (skipSpeakRef.current) {
      skipSpeakRef.current = false;
      return undefined;
    }
    if (!lastInputWasVoiceRef.current) return undefined;

    const last = [...(messages || [])].reverse().find(
      (m) => m.role === 'assistant' && (m.content || '').trim()
    );
    if (!last && !pendingAction) return undefined;

    const key = last
      ? `${last.id}:${pendingAction?.id || ''}:${(last.content || '').slice(0, 40)}`
      : `pending:${pendingAction.id}`;
    if (key === lastSpokenKeyRef.current) return undefined;

    const text = buildSpeakText(last?.content || '', pendingAction);
    if (!text) return undefined;

    lastSpokenKeyRef.current = key;
    speak(text);
    return undefined;
  }, [messages, pendingAction, readAloud, ttsSupported, speak]);

  const toggleReadAloud = () => {
    const next = !readAloud;
    setReadAloud(next);
    setStickyReadAloud(next);
    if (!next) cancelSpeech();
  };

  const handleSendText = async (content) => {
    lastInputWasVoiceRef.current = false;
    cancelSpeech();
    try {
      await sendMessage(content);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : detail?.message || err?.message || 'Failed to send');
      throw err;
    }
  };

  const handleSendVoice = async (payload) => {
    lastInputWasVoiceRef.current = true;
    cancelSpeech();
    try {
      await sendVoice(payload);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : detail?.message || err?.message || 'Voice failed');
      throw err;
    }
  };

  const handleConfirm = async (payloadOverride) => {
    cancelSpeech();
    try {
      await confirmAction(payloadOverride);
      toast.success('Action completed');
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Confirm failed');
    }
  };

  const handleCancel = async () => {
    cancelSpeech();
    try {
      await cancelAction();
      if (readAloud && lastInputWasVoiceRef.current) {
        speak('Cancelled.');
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Cancel failed');
    }
  };

  const handleResetSession = async () => {
    cancelSpeech();
    skipSpeakRef.current = true;
    lastInputWasVoiceRef.current = false;
    try {
      await resetSession();
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Could not start a new chat');
    }
  };

  const handleSelectSession = async (sid) => {
    cancelSpeech();
    skipSpeakRef.current = true;
    lastInputWasVoiceRef.current = false;
    setHistoryOpen(false);
    try {
      await selectSession(sid);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Could not open chat');
    }
  };

  if (!activeStoreId) {
    return (
      <DashboardContent maxWidth={false}>
        <EmptyContent
          title="Select a store"
          description="Choose a store from the workspace switcher in the top bar, then open AI Assistant again."
        />
      </DashboardContent>
    );
  }

  if (loading) {
    return (
      <DashboardContent maxWidth={false}>
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 360 }}>
          <CircularProgress />
        </Stack>
      </DashboardContent>
    );
  }

  if (backendEnabled === false) {
    return (
      <DashboardContent maxWidth={false}>
        <EmptyContent
          title="AI Assistant unavailable"
          description="This feature is disabled in this environment. Enable AI_AGENT_ENABLED on the backend and VITE_AI_AGENT_ENABLED on the frontend for local development."
        />
      </DashboardContent>
    );
  }

  const ttsControls = (
    <>
      {ttsSupported && (
        <Tooltip
          title={
            readAloud
              ? 'Read aloud on — replies after voice will be spoken. Hold mic to interrupt.'
              : 'Read aloud off'
          }
        >
          <IconButton
            color={readAloud ? 'primary' : 'default'}
            onClick={toggleReadAloud}
            aria-label="Toggle read aloud"
            size={isMobile ? 'small' : 'medium'}
          >
            <Iconify icon={readAloud ? 'solar:volume-loud-bold' : 'solar:volume-cross-bold'} />
          </IconButton>
        </Tooltip>
      )}

      {speaking && (
        <Tooltip title="Stop speaking">
          <IconButton color="error" onClick={cancelSpeech} aria-label="Stop speaking" size={isMobile ? 'small' : 'medium'}>
            <Iconify icon="solar:stop-circle-bold" />
          </IconButton>
        </Tooltip>
      )}
    </>
  );

  const chatPane = (
    <Box
      sx={{
        flex: '1 1 auto',
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AiAgentMessageList messages={messages} loading={sending} compact={isMobile} />

      <AiAgentPendingAction
        action={pendingAction}
        disabled={sending}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        compact={isMobile}
      />

      <AiAgentInput
        disabled={sending || Boolean(pendingAction)}
        onSendText={handleSendText}
        onSendVoice={handleSendVoice}
        onBargeIn={cancelSpeech}
        compact={isMobile}
      />
    </Box>
  );

  const sidebarProps = {
    sessions,
    activeSessionId: sessionId,
    loading: sessionsLoading,
    disabled: sending,
    onSelect: handleSelectSession,
    onNewChat: handleResetSession,
  };

  return (
    <DashboardContent
      maxWidth={false}
      disablePadding={isMobile}
      sx={{
        display: 'flex',
        flex: '1 1 auto',
        flexDirection: 'column',
        minHeight: 0,
        ...(isMobile && {
          height: 'calc(100dvh - var(--layout-header-mobile-height, 64px))',
          maxHeight: 'calc(100dvh - var(--layout-header-mobile-height, 64px))',
          overflow: 'hidden',
        }),
      }}
    >
      {isMobile ? (
        <Stack
          spacing={1}
          sx={{
            px: 1.5,
            pt: 1,
            pb: 1,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            flexShrink: 0,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <IconButton
              onClick={() => setHistoryOpen(true)}
              aria-label="Open chat history"
              size="small"
              sx={{ bgcolor: 'background.neutral' }}
            >
              <Iconify icon="solar:history-bold" width={20} />
            </IconButton>

            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
              <Iconify icon="solar:stars-bold" width={22} sx={{ color: 'primary.main', flexShrink: 0 }} />
              <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700 }}>
                AI Assistant
              </Typography>
              {speaking && (
                <Chip
                  size="small"
                  color="info"
                  variant="soft"
                  label="Speaking"
                  onDelete={cancelSpeech}
                  sx={{ height: 22, flexShrink: 0 }}
                />
              )}
            </Stack>

            {ttsControls}

            <IconButton
              onClick={handleResetSession}
              title="New conversation"
              disabled={sending}
              size="small"
              color="primary"
              sx={{ bgcolor: 'primary.lighter' }}
            >
              <Iconify icon="solar:pen-new-square-bold" width={20} />
            </IconButton>
          </Stack>
        </Stack>
      ) : (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 2, flexWrap: 'wrap', rowGap: 1.5 }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
            <Iconify icon="solar:stars-bold" width={28} sx={{ color: 'primary.main' }} />
            <Typography variant="h4" noWrap>
              AI Assistant
            </Typography>
            {speaking && (
              <Chip
                size="small"
                color="info"
                variant="soft"
                icon={<Iconify icon="solar:volume-loud-bold" width={16} />}
                label="Speaking…"
                onDelete={cancelSpeech}
                deleteIcon={<Iconify icon="solar:stop-circle-bold" width={16} />}
              />
            )}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            {ttsControls}
            <IconButton onClick={handleResetSession} title="New conversation" disabled={sending}>
              <Iconify icon="solar:pen-new-square-bold" />
            </IconButton>
          </Stack>
        </Stack>
      )}

      <Box
        sx={{
          flex: '1 1 0',
          minHeight: 0,
          display: 'flex',
          gap: 2,
          ...(isMobile
            ? { flexDirection: 'column', overflow: 'hidden' }
            : { height: 'calc(100vh - 200px)' }),
        }}
      >
        {!isMobile && (
          <Box sx={{ width: 280, flexShrink: 0, minHeight: 0 }}>
            <AiAgentSessionSidebar {...sidebarProps} />
          </Box>
        )}
        {chatPane}
      </Box>

      {isMobile && (
        <Drawer
          anchor="left"
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          PaperProps={{ sx: { width: 'min(320px, 88vw)' } }}
        >
          <AiAgentSessionSidebar {...sidebarProps} />
        </Drawer>
      )}
    </DashboardContent>
  );
}
