import { useRef, useState, useEffect, useCallback } from 'react';

// ----------------------------------------------------------------------

const READ_ALOUD_KEY = 'ojaame.aiAgent.readAloud';

export function getStickyReadAloud() {
  try {
    const raw = localStorage.getItem(READ_ALOUD_KEY);
    if (raw === null) return true;
    return raw === '1' || raw === 'true';
  } catch {
    return true;
  }
}

export function setStickyReadAloud(enabled) {
  try {
    localStorage.setItem(READ_ALOUD_KEY, enabled ? '1' : '0');
  } catch {
    // ignore
  }
}

/**
 * Format a money amount for speech: "₦2,450.50" → "2,450 naira 50 kobo"
 * (engines already pronounce comma-grouped numbers fairly well).
 */
function moneyToSpeech(raw) {
  const cleaned = String(raw).replace(/[₦,\s]/g, '');
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return `${cleaned} naira`;
  const whole = Math.floor(Math.abs(num));
  const kobo = Math.round((Math.abs(num) - whole) * 100);
  const sign = num < 0 ? 'minus ' : '';
  const wholeStr = whole.toLocaleString('en-US');
  if (kobo > 0) {
    return `${sign}${wholeStr} naira ${kobo} kobo`;
  }
  return `${sign}${wholeStr} naira`;
}

function stripMarkdownKeepStructure(text) {
  let t = String(text || '');

  // Code blocks → brief placeholder pause (drop noisy content)
  t = t.replace(/```[\s\S]*?```/g, '\n\n');
  t = t.replace(/`([^`]+)`/g, '$1');

  // Images / links → link text only
  t = t.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Headings → their own breath
  t = t.replace(/^#{1,6}\s+/gm, '\n\n');

  // Blockquotes
  t = t.replace(/^>\s?/gm, '');

  // Bold / italic / underline (keep words)
  t = t.replace(/\*\*\*(.+?)\*\*\*/g, '$1');
  t = t.replace(/\*\*(.+?)\*\*/g, '$1');
  t = t.replace(/\*(.+?)\*/g, '$1');
  t = t.replace(/___(.+?)___/g, '$1');
  t = t.replace(/__(.+?)__/g, '$1');
  t = t.replace(/_(.+?)_/g, '$1');
  t = t.replace(/~~(.+?)~~/g, '$1');

  // Horizontal rules → paragraph break
  t = t.replace(/^-{3,}$/gm, '\n\n');
  t = t.replace(/^\*{3,}$/gm, '\n\n');

  return t;
}

function endSentence(row) {
  let r = (row || '').trim();
  if (!r) return '';
  if (!/[.!?…:;]$/.test(r)) r = `${r}.`;
  return r;
}

/**
 * Turn chat/markdown text into paced spoken prose.
 * Newlines, bullets, and currency become punctuation engines can pause on.
 */
export function stripForSpeech(text) {
  if (!text) return '';

  let t = stripMarkdownKeepStructure(text);

  // Normalize Windows newlines
  t = t.replace(/\r\n/g, '\n');

  // Sale-cart symbols common in confirm cards
  t = t.replace(/×/g, ' by ');
  t = t.replace(/(?<![A-Za-z])x(?=\s*\d)/gi, ' by ');
  t = t.replace(/\s*@\s*/g, ' at ');
  t = t.replace(/\s*=\s*/g, ' equals ');

  // Currency: ₦1,234.56 or NGN 1234 — do this before digit punctuation cleanup
  t = t.replace(/₦\s*([\d,]+(?:\.\d+)?)/g, (_, n) => moneyToSpeech(n));
  t = t.replace(/\bNGN\s*([\d,]+(?:\.\d+)?)/gi, (_, n) => moneyToSpeech(n));

  // Line-by-line: bullets / numbered lists become spoken list items with pauses
  const lines = t.split('\n');
  const blocks = [];
  let paragraph = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const joined = paragraph.map(endSentence).filter(Boolean).join(' ');
    if (joined) blocks.push(joined);
    paragraph = [];
  };

  const pushSolo = (raw) => {
    flushParagraph();
    const cleaned = raw
      .replace(/^[-•*–—]\s+/, '')
      .replace(/^\d+[.)]\s+/, '')
      .trim();
    const ended = endSentence(cleaned);
    if (ended) blocks.push(ended);
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      return;
    }
    if (/^[-•*–—]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed)) {
      pushSolo(trimmed);
      return;
    }
    paragraph.push(trimmed);
  });
  flushParagraph();

  // Separate paragraphs with a long pause cue; chunking also adds gaps between utterances
  t = blocks.join(' ... ');

  // Tidy whitespace / punctuation (never break thousand separators like 1,500)
  t = t.replace(/[ \t\f\v]+/g, ' ');
  t = t.replace(/\s{2,}/g, ' ');
  // Space after sentence punctuation when next is a letter (not after digit commas)
  t = t.replace(/([.!?])(?=[A-Za-z])/g, '$1 ');
  t = t.replace(/:(?=[A-Za-z])/g, ': ');
  // Collapse runaway dots but keep ellipsis pause markers
  t = t.replace(/\.{4,}/g, '...');
  t = t.replace(/(?:\s*\.\.\.\s*)+/g, ' ... ');
  t = t.replace(/\s+([.!?])/g, '$1');
  t = t.replace(/\s+/g, ' ').trim();

  return t;
}

/**
 * Split prepared speech into short utterance chunks so the engine
 * inserts natural gaps between sentences / paragraphs.
 */
export function chunkSpeechText(text, { maxLen = 180 } = {}) {
  const prepared = stripForSpeech(text);
  if (!prepared) return [];

  // Prefer sentence boundaries; also split on ellipsis pause markers
  const rough = prepared
    .split(/(?<=[.!?])\s+|(?<=\.\.\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const { chunks, buf } = rough.reduce(
    (acc, part) => {
      if (!acc.buf) {
        return { chunks: acc.chunks, buf: part };
      }
      if (acc.buf.length + 1 + part.length <= maxLen) {
        return { chunks: acc.chunks, buf: `${acc.buf} ${part}` };
      }
      return { chunks: [...acc.chunks, acc.buf], buf: part };
    },
    { chunks: [], buf: '' }
  );
  const withTail = buf ? [...chunks, buf] : chunks;

  // Absolute safety for rare huge tokens
  return withTail.flatMap((c) => {
    if (c.length <= maxLen * 1.5) return [c];
    const bits = [];
    let rest = c;
    while (rest.length > maxLen) {
      let cut = rest.lastIndexOf(' ', maxLen);
      if (cut < maxLen * 0.4) cut = maxLen;
      bits.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) bits.push(rest);
    return bits;
  });
}

function pickVoice(voices, langHint = 'en') {
  if (!voices?.length) return null;
  const prefer = [
    /en-NG/i,
    /en-GB/i,
    /en-US/i,
    /Samantha|Daniel|Google UK|Google US|Microsoft Aria|Microsoft Guy|Karen|Moira/i,
  ];
  const lang = (langHint || 'en').toLowerCase();
  const byLang = voices.filter((v) => (v.lang || '').toLowerCase().startsWith(lang.slice(0, 2)));
  const pool = byLang.length ? byLang : voices;
  const matched = prefer
    .map((re) => pool.find((v) => re.test(v.lang) || re.test(v.name)))
    .find(Boolean);
  return matched || pool[0] || voices[0];
}

/**
 * Browser SpeechSynthesis TTS with cancel support (barge-in).
 * Speaks in sentence/paragraph chunks for mature pacing.
 */
export function useBrowserTts() {
  const [supported, setSupported] = useState(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window
  );
  const [speaking, setSpeaking] = useState(false);
  const queueRef = useRef([]);
  const generationRef = useRef(0);
  const voicesRef = useRef([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false);
      return undefined;
    }
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      voicesRef.current = synth.getVoices() || [];
    };
    loadVoices();
    synth.addEventListener?.('voiceschanged', loadVoices);
    // Chrome sometimes pauses the queue forever after tab backgrounding
    const resume = () => {
      if (synth.paused) synth.resume();
    };
    const interval = setInterval(resume, 4000);
    return () => {
      clearInterval(interval);
      synth.removeEventListener?.('voiceschanged', loadVoices);
      generationRef.current += 1;
      synth.cancel();
    };
  }, []);

  const cancel = useCallback(() => {
    generationRef.current += 1;
    queueRef.current = [];
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (rawText, { lang = 'en-NG', rate = 0.96, pitch = 1 } = {}) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        setSupported(false);
        return false;
      }

      const chunks = chunkSpeechText(rawText);
      if (!chunks.length) return false;

      const synth = window.speechSynthesis;
      // Bump generation so any in-flight onend handlers bail out
      generationRef.current += 1;
      const gen = generationRef.current;
      synth.cancel();
      queueRef.current = chunks;

      const voice = pickVoice(voicesRef.current, lang);

      const speakNext = () => {
        if (generationRef.current !== gen) return;
        const next = queueRef.current.shift();
        if (!next) {
          setSpeaking(false);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(next);
        utterance.lang = lang;
        // Slightly slower + even pitch reads more “settled”
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = 1;
        if (voice) utterance.voice = voice;

        utterance.onstart = () => {
          if (generationRef.current === gen) setSpeaking(true);
        };
        utterance.onend = () => {
          if (generationRef.current !== gen) return;
          // Tiny gap between chunks via macrotask so engines don't run sentences together
          setTimeout(() => {
            if (generationRef.current === gen) speakNext();
          }, 180);
        };
        utterance.onerror = () => {
          if (generationRef.current !== gen) return;
          setSpeaking(false);
          queueRef.current = [];
        };

        synth.speak(utterance);
      };

      setSpeaking(true);
      speakNext();
      return true;
    },
    []
  );

  return {
    supported,
    speaking,
    speak,
    cancel,
  };
}
