import axiosInstance, { endpoints } from 'src/utils/axios';
import { extensionForMime, normalizeAudioMime } from 'src/sections/voice/use-voice-capture';

// ----------------------------------------------------------------------

function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `voice-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function filenameForBlob(audioBlob, filename) {
  if (filename && /\.(webm|ogg|mp3|mp4|m4a|wav|mpeg)$/i.test(filename)) {
    return filename;
  }
  const mime = normalizeAudioMime(audioBlob?.type);
  return `voice.${extensionForMime(mime)}`;
}

/**
 * Submit a voice command (audio and/or browser transcript).
 * Does not write sales/stock — returns a draft for UI confirm.
 */
export async function submitVoiceCommand({
  storeId,
  language = 'auto',
  intentHint = 'sale',
  audioBlob,
  transcript,
  filename = 'audio.webm',
}) {
  const form = new FormData();
  form.append('store_id', String(storeId));
  form.append('language', language || 'auto');
  form.append('intent_hint', intentHint || 'sale');
  if (transcript) {
    form.append('transcript', transcript);
  }
  if (audioBlob) {
    const safeName = filenameForBlob(audioBlob, filename);
    // Pass a Blob with a clean type so multipart Content-Type is Whisper-friendly
    const mime = normalizeAudioMime(audioBlob.type);
    const typedBlob =
      audioBlob.type === mime ? audioBlob : new Blob([audioBlob], { type: mime });
    form.append('audio', typedBlob, safeName);
  }

  const res = await axiosInstance.post(endpoints.voice.command, form, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Idempotency-Key': newIdempotencyKey(),
    },
  });
  return res.data;
}

export async function saveVoiceAlias({ storeId, spokenPhrase, productId }) {
  const res = await axiosInstance.post(endpoints.voice.alias, {
    store_id: storeId,
    spoken_phrase: spokenPhrase,
    product_id: productId,
  });
  return res.data;
}

export async function fetchVoiceStatus() {
  const res = await axiosInstance.get(endpoints.voice.status);
  return res.data;
}
