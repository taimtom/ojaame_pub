/**
 * Opportunistic browser SpeechRecognition for English only.
 * Returns null transcript if unsupported or weak — caller uploads audio instead.
 */
export function createBrowserSpeechSession({ lang = 'en-NG', timeoutMs = 14000 } = {}) {
  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  if (!SpeechRecognition) {
    return { supported: false, start: async () => null, abort: () => {} };
  }

  let recognition = null;
  let settled = false;

  const abort = () => {
    try {
      recognition?.abort?.();
    } catch {
      // ignore
    }
  };

  const start = () =>
    new Promise((resolve) => {
      settled = false;
      recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      const finish = (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      };

      const timer = setTimeout(() => {
        abort();
        finish(null);
      }, timeoutMs);

      recognition.onresult = (event) => {
        const result = event.results?.[0]?.[0];
        const transcript = (result?.transcript || '').trim();
        const confidence = typeof result?.confidence === 'number' ? result.confidence : 0.7;
        if (transcript && confidence >= 0.55) {
          finish({ transcript, confidence });
        } else {
          finish(null);
        }
      };
      recognition.onerror = () => finish(null);
      recognition.onend = () => finish(null);

      try {
        recognition.start();
      } catch {
        finish(null);
      }
    });

  return { supported: true, start, abort };
}
