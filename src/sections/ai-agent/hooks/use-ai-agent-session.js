import { useCallback, useEffect, useState } from 'react';

import {
  cancelAiAgentAction,
  confirmAiAgentAction,
  createAiAgentSession,
  fetchAiAgentStatus,
  getAiAgentSession,
  listAiAgentSessions,
  sendAiAgentMessage,
  sendAiAgentVoice,
} from 'src/actions/ai-agent';

// ----------------------------------------------------------------------

export function useAiAgentSession(initialStoreId, options = {}) {
  const storesReady = options.storesReady !== false;
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [backendEnabled, setBackendEnabled] = useState(null);
  const [storeId, setStoreId] = useState(initialStoreId ?? null);

  const refreshSessionList = useCallback(async (sid) => {
    try {
      setSessionsLoading(true);
      const list = await listAiAgentSessions({ storeId: sid ?? storeId });
      setSessions(list);
    } catch (err) {
      console.error(err);
    } finally {
      setSessionsLoading(false);
    }
  }, [storeId]);

  const refreshSession = useCallback(async (sid) => {
    if (!sid) return;
    const data = await getAiAgentSession(sid);
    setMessages(data.messages || []);
    setPendingAction(data.pending_action || null);
    if (data.session?.store_id != null) {
      setStoreId(data.session.store_id);
    }
  }, []);

  useEffect(() => {
    if (initialStoreId != null && storeId == null) {
      setStoreId(initialStoreId);
    }
  }, [initialStoreId, storeId]);

  useEffect(() => {
    let cancelled = false;
    if (!storeId) {
      setLoading(storesReady);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        setLoading(true);
        const status = await fetchAiAgentStatus();
        if (cancelled) return;
        setBackendEnabled(Boolean(status?.enabled));
        if (!status?.enabled) {
          setLoading(false);
          return;
        }

        const list = await listAiAgentSessions({ storeId });
        if (cancelled) return;
        setSessions(list);

        if (list.length > 0) {
          const latest = list[0];
          setSessionId(latest.id);
          await refreshSession(latest.id);
        } else {
          const session = await createAiAgentSession({ storeId });
          if (cancelled) return;
          setSessionId(session.id);
          setMessages([]);
          setPendingAction(null);
          await refreshSessionList(storeId);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setBackendEnabled(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSession, refreshSessionList, storeId, storesReady]);

  const sendMessage = useCallback(
    async (content) => {
      if (!sessionId || !content?.trim()) return;
      setSending(true);
      try {
        const data = await sendAiAgentMessage(sessionId, content.trim());
        setMessages(data.messages || []);
        setPendingAction(data.pending_action || null);
        await refreshSessionList();
      } finally {
        setSending(false);
      }
    },
    [refreshSessionList, sessionId]
  );

  const sendVoice = useCallback(
    async ({ audioBlob, language, transcript, filename }) => {
      if (!sessionId) return;
      setSending(true);
      try {
        const data = await sendAiAgentVoice(sessionId, {
          audioBlob,
          language,
          transcript,
          filename,
        });
        setMessages(data.messages || []);
        setPendingAction(data.pending_action || null);
        await refreshSessionList();
      } finally {
        setSending(false);
      }
    },
    [refreshSessionList, sessionId]
  );

  const confirmAction = useCallback(async () => {
    if (!pendingAction?.id) return;
    setSending(true);
    try {
      const data = await confirmAiAgentAction(pendingAction.id);
      setMessages(data.messages || []);
      setPendingAction(null);
      await refreshSessionList();
    } finally {
      setSending(false);
    }
  }, [pendingAction, refreshSessionList]);

  const cancelAction = useCallback(async () => {
    if (!pendingAction?.id) return;
    setSending(true);
    try {
      await cancelAiAgentAction(pendingAction.id);
      setPendingAction(null);
      if (sessionId) await refreshSession(sessionId);
    } finally {
      setSending(false);
    }
  }, [pendingAction, refreshSession, sessionId]);

  const resetSession = useCallback(async () => {
    setSending(true);
    try {
      const session = await createAiAgentSession({ storeId });
      setSessionId(session.id);
      setMessages([]);
      setPendingAction(null);
      await refreshSessionList();
    } finally {
      setSending(false);
    }
  }, [refreshSessionList, storeId]);

  const selectSession = useCallback(
    async (sid) => {
      if (!sid || sid === sessionId) return;
      setSending(true);
      try {
        setSessionId(sid);
        await refreshSession(sid);
      } finally {
        setSending(false);
      }
    },
    [refreshSession, sessionId]
  );

  return {
    sessionId,
    messages,
    pendingAction,
    sessions,
    sessionsLoading,
    loading,
    sending,
    backendEnabled,
    storeId,
    setStoreId,
    sendMessage,
    sendVoice,
    confirmAction,
    cancelAction,
    resetSession,
    selectSession,
    refreshSessionList,
  };
}
