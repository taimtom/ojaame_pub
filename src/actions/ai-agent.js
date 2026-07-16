import axiosInstance, { endpoints } from 'src/utils/axios';
import { extensionForMime, normalizeAudioMime } from 'src/sections/voice/use-voice-capture';

// ----------------------------------------------------------------------

function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `ai-agent-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function filenameForBlob(audioBlob, filename) {
  if (filename && /\.(webm|ogg|mp3|mp4|m4a|wav|mpeg)$/i.test(filename)) {
    return filename;
  }
  const mime = normalizeAudioMime(audioBlob?.type);
  return `voice.${extensionForMime(mime)}`;
}

export async function fetchAiAgentStatus() {
  const res = await axiosInstance.get(endpoints.aiAgent.status);
  return res.data;
}

export async function listAiAgentSessions({ storeId, limit = 50 } = {}) {
  const res = await axiosInstance.get(endpoints.aiAgent.sessions, {
    params: {
      ...(storeId != null ? { store_id: storeId } : {}),
      limit,
    },
  });
  return res.data?.sessions || [];
}

export async function createAiAgentSession({ storeId } = {}) {
  const res = await axiosInstance.post(endpoints.aiAgent.sessions, {
    store_id: storeId ?? null,
  });
  return res.data;
}

export async function getAiAgentSession(sessionId) {
  const res = await axiosInstance.get(endpoints.aiAgent.session(sessionId));
  return res.data;
}

export async function sendAiAgentMessage(sessionId, content) {
  const res = await axiosInstance.post(endpoints.aiAgent.message(sessionId), { content });
  return res.data;
}

export async function sendAiAgentVoice(sessionId, { language = 'auto', audioBlob, transcript, filename = 'audio.webm' } = {}) {
  const form = new FormData();
  form.append('language', language || 'auto');
  if (transcript) {
    form.append('transcript', transcript);
  }
  if (audioBlob) {
    // Accept either a raw Blob/File or { blob, mimeType, filename } from useVoiceCapture
    const raw = audioBlob?.blob instanceof Blob ? audioBlob.blob : audioBlob;
    const nameHint = audioBlob?.filename || filename;
    if (!(raw instanceof Blob)) {
      throw new Error('Invalid audio payload — expected a Blob');
    }
    const safeName = filenameForBlob(raw, nameHint);
    const mime = normalizeAudioMime(raw.type || audioBlob?.mimeType);
    const typedBlob = raw.type === mime ? raw : new Blob([raw], { type: mime });
    form.append('audio', typedBlob, safeName);
  }

  const res = await axiosInstance.post(endpoints.aiAgent.voice(sessionId), form, {
    headers: {
      // Let the browser set multipart boundary — do not force Content-Type
      'Idempotency-Key': newIdempotencyKey(),
    },
  });
  return res.data;
}

export async function confirmAiAgentAction(actionId, payload) {
  const body = payload ? { payload } : {};
  const res = await axiosInstance.post(endpoints.aiAgent.confirm(actionId), body);
  return res.data;
}

export async function cancelAiAgentAction(actionId) {
  const res = await axiosInstance.post(endpoints.aiAgent.cancel(actionId));
  return res.data;
}
