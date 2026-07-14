import { useRef, useState, useEffect, useCallback } from 'react';

const DEFAULT_MAX_MS = 12000;
/** Shorter holds often yield header-less / truncated containers Chrome can't fix on stop. */
const MIN_RECORD_MS = 700;
const MIN_BLOB_BYTES = 800;

const RECORDER_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
];

const WEBM_MAGIC = [0x1a, 0x45, 0xdf, 0xa3];
const OGG_MAGIC = [0x4f, 0x67, 0x67, 0x53]; // OggS

export function extensionForMime(mime) {
  const m = (mime || '').toLowerCase();
  if (m.includes('ogg')) return 'ogg';
  if (m.includes('mp4') || m.includes('m4a') || m.includes('aac')) return 'mp4';
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  if (m.includes('wav')) return 'wav';
  return 'webm';
}

export function normalizeAudioMime(mime) {
  const m = (mime || '').toLowerCase().split(';')[0].trim();
  if (m === 'audio/mp4' || m === 'video/mp4') return 'audio/mp4';
  if (m === 'audio/ogg' || m === 'application/ogg') return 'audio/ogg';
  if (m === 'audio/mpeg') return 'audio/mpeg';
  if (m === 'audio/wav' || m === 'audio/wave' || m === 'audio/x-wav') return 'audio/wav';
  if (m.startsWith('audio/webm') || m === 'video/webm') return 'audio/webm';
  return m || 'audio/webm';
}

function pickRecorderMime() {
  if (typeof MediaRecorder === 'undefined') return '';
  return RECORDER_MIME_CANDIDATES.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || '';
}

function bytesMatch(arr, offset, magic) {
  if (!arr || arr.length < offset + magic.length) return false;
  return magic.every((b, i) => arr[offset + i] === b);
}

/**
 * True if blob looks like a container Whisper/ffmpeg can open.
 * WebM must start with EBML; MP4 has ftyp at offset 4; Ogg starts with OggS.
 */
export async function isValidAudioContainer(blob) {
  if (!blob || blob.size < MIN_BLOB_BYTES) return false;
  const head = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  if (bytesMatch(head, 0, WEBM_MAGIC)) return true;
  if (bytesMatch(head, 0, OGG_MAGIC)) return true;
  if (head.length >= 8 && head[4] === 0x66 && head[5] === 0x74 && head[6] === 0x79 && head[7] === 0x70) {
    return true; // ....ftyp
  }
  if (head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46) {
    return true; // RIFF
  }
  return false;
}

/**
 * If WebM EBML magic is mid-file (bad chunk order), slice from the first magic.
 */
function findMagicOffset(buf, magic, maxScan) {
  const limit = Math.min(buf.length - magic.length, maxScan);
  for (let i = 0; i <= limit; i += 1) {
    if (bytesMatch(buf, i, magic)) return i;
  }
  return -1;
}

export async function repairAudioBlobIfNeeded(blob, mimeType) {
  if (!blob || blob.size < 16) return blob;
  const mime = normalizeAudioMime(mimeType || blob.type);
  const buf = new Uint8Array(await blob.arrayBuffer());
  const maxScan = 512 * 1024;

  if (mime.includes('webm') || (!bytesMatch(buf, 0, WEBM_MAGIC) && !bytesMatch(buf, 0, OGG_MAGIC))) {
    const idx = findMagicOffset(buf, WEBM_MAGIC, maxScan);
    if (idx > 0) {
      return new Blob([buf.slice(idx)], { type: 'audio/webm' });
    }
  }

  if (mime.includes('ogg')) {
    const idx = findMagicOffset(buf, OGG_MAGIC, maxScan);
    if (idx > 0) {
      return new Blob([buf.slice(idx)], { type: 'audio/ogg' });
    }
  }

  return blob;
}

/**
 * Hold-to-talk MediaRecorder. stopRecording resolves to
 * { blob, mimeType, filename } or null.
 */
export function useVoiceCapture({ maxMs = DEFAULT_MAX_MS } = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const audioCtxRef = useRef(null);
  const maxTimerRef = useRef(null);
  const resolveStopRef = useRef(null);
  const mimeRef = useRef('audio/webm');
  const startedAtRef = useRef(0);
  const minHoldTimerRef = useRef(null);
  const pendingStopRef = useRef(false);

  const cleanupStream = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    if (minHoldTimerRef.current) {
      clearTimeout(minHoldTimerRef.current);
      minHoldTimerRef.current = null;
    }
    if (analyserRef.current) analyserRef.current = null;
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {
        // ignore
      }
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setLevel(0);
  }, []);

  useEffect(() => () => cleanupStream(), [cleanupStream]);

  const tickLevel = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    setLevel(Math.min(1, rms * 4));
    rafRef.current = requestAnimationFrame(tickLevel);
  }, []);

  const finishStop = useCallback(
    (recorder) => {
      if (!recorder || recorder.state === 'inactive') return;
      try {
        // Do NOT call requestData() before stop — it can emit a cluster
        // without the EBML header and corrupt the concatenated blob.
        recorder.stop();
      } catch {
        cleanupStream();
        setIsRecording(false);
        if (resolveStopRef.current) {
          resolveStopRef.current(null);
          resolveStopRef.current = null;
        }
      }
    },
    [cleanupStream]
  );

  const startRecording = useCallback(async () => {
    setError(null);
    pendingStopRef.current = false;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Microphone is not available on this device.');
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        rafRef.current = requestAnimationFrame(tickLevel);
      } catch {
        // level meter optional
      }

      const mime = pickRecorderMime();
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      mimeRef.current = normalizeAudioMime(recorder.mimeType || mime || 'audio/webm');
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const mimeType = normalizeAudioMime(
          recorder.mimeType || mimeRef.current || 'audio/webm'
        );
        let blob = new Blob(chunksRef.current, { type: mimeType });
        try {
          blob = await repairAudioBlobIfNeeded(blob, mimeType);
        } catch {
          // keep original
        }
        const outMime = normalizeAudioMime(blob.type || mimeType);
        const filename = `voice.${extensionForMime(outMime)}`;
        cleanupStream();
        setIsRecording(false);
        if (resolveStopRef.current) {
          const ok =
            blob.size >= MIN_BLOB_BYTES && (await isValidAudioContainer(blob));
          resolveStopRef.current(ok ? { blob, mimeType: outMime, filename } : null);
          resolveStopRef.current = null;
        }
      };

      // No timeslice: one complete container on stop (avoids header-less clusters).
      recorder.start();
      startedAtRef.current = Date.now();
      setIsRecording(true);

      maxTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          finishStop(mediaRecorderRef.current);
        }
      }, maxMs);

      return true;
    } catch (err) {
      cleanupStream();
      setIsRecording(false);
      setError('Microphone permission is needed for voice.');
      return false;
    }
  }, [cleanupStream, finishStop, maxMs, tickLevel]);

  const stopRecording = useCallback(
    () =>
      new Promise((resolve) => {
        const recorder = mediaRecorderRef.current;
        if (!recorder || recorder.state === 'inactive') {
          cleanupStream();
          setIsRecording(false);
          resolve(null);
          return;
        }
        resolveStopRef.current = resolve;

        const elapsed = Date.now() - (startedAtRef.current || 0);
        const waitMs = Math.max(0, MIN_RECORD_MS - elapsed);

        const doStop = () => {
          minHoldTimerRef.current = null;
          finishStop(recorder);
        };

        if (waitMs > 0) {
          // Keep recording briefly so Chrome writes a real init segment.
          pendingStopRef.current = true;
          minHoldTimerRef.current = setTimeout(doStop, waitMs);
        } else {
          doStop();
        }
      }),
    [cleanupStream, finishStop]
  );

  const cancelRecording = useCallback(async () => {
    if (resolveStopRef.current) {
      resolveStopRef.current(null);
      resolveStopRef.current = null;
    }
    pendingStopRef.current = false;
    if (minHoldTimerRef.current) {
      clearTimeout(minHoldTimerRef.current);
      minHoldTimerRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.stop();
      } catch {
        // ignore
      }
    }
    chunksRef.current = [];
    cleanupStream();
    setIsRecording(false);
  }, [cleanupStream]);

  return {
    isRecording,
    level,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
