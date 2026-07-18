/**
 * Connection quality helpers — distinguish offline / poor / slow / good
 * so users don't blame the app for network problems.
 */

export const NETWORK_QUALITY = {
  OFFLINE: 'offline',
  POOR: 'poor',
  SLOW: 'slow',
  GOOD: 'good',
};

const LATENCY_SAMPLES = [];
const MAX_SAMPLES = 8;

/** Rolling request latencies from axios (ms). */
export function recordRequestLatency(ms) {
  if (!Number.isFinite(ms) || ms < 0) return;
  LATENCY_SAMPLES.push(ms);
  if (LATENCY_SAMPLES.length > MAX_SAMPLES) {
    LATENCY_SAMPLES.shift();
  }
}

export function getRecentAverageLatency() {
  if (!LATENCY_SAMPLES.length) return null;
  const sum = LATENCY_SAMPLES.reduce((a, b) => a + b, 0);
  return sum / LATENCY_SAMPLES.length;
}

export function clearLatencySamples() {
  LATENCY_SAMPLES.length = 0;
}

function getNavigatorConnection() {
  if (typeof navigator === 'undefined') return null;
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
}

/**
 * Snapshot of browser-reported connection info (Network Information API when available).
 */
export function getBrowserConnectionSnapshot() {
  const online = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
  const conn = getNavigatorConnection();
  return {
    online,
    effectiveType: conn?.effectiveType || null, // 'slow-2g' | '2g' | '3g' | '4g'
    rtt: typeof conn?.rtt === 'number' ? conn.rtt : null,
    downlink: typeof conn?.downlink === 'number' ? conn.downlink : null,
    saveData: Boolean(conn?.saveData),
  };
}

/**
 * Classify connection quality from browser signals + recent API latency.
 */
export function classifyConnection({
  online,
  effectiveType,
  rtt,
  downlink,
  recentLatencyMs,
} = getBrowserConnectionSnapshot()) {
  if (online === false) {
    return NETWORK_QUALITY.OFFLINE;
  }

  const type = (effectiveType || '').toLowerCase();
  if (type === 'slow-2g' || type === '2g') {
    return NETWORK_QUALITY.POOR;
  }

  if (
    (typeof rtt === 'number' && rtt >= 800) ||
    (typeof downlink === 'number' && downlink > 0 && downlink < 0.4)
  ) {
    return NETWORK_QUALITY.POOR;
  }

  if (typeof recentLatencyMs === 'number' && recentLatencyMs >= 8000) {
    return NETWORK_QUALITY.POOR;
  }

  if (type === '3g') {
    return NETWORK_QUALITY.SLOW;
  }

  if (
    (typeof rtt === 'number' && rtt >= 350) ||
    (typeof downlink === 'number' && downlink > 0 && downlink < 1.2) ||
    (typeof recentLatencyMs === 'number' && recentLatencyMs >= 3500)
  ) {
    return NETWORK_QUALITY.SLOW;
  }

  return NETWORK_QUALITY.GOOD;
}

export function getConnectionQualityMessage(quality) {
  switch (quality) {
    case NETWORK_QUALITY.OFFLINE:
      return 'You appear to be offline. Check your internet connection and try again.';
    case NETWORK_QUALITY.POOR:
      return 'Your internet connection looks weak. Actions may fail or take longer than usual — this is a network issue, not the app.';
    case NETWORK_QUALITY.SLOW:
      return 'Your internet connection is slow. Pages and actions may take longer to load.';
    default:
      return null;
  }
}

/** True when axios failed before getting an HTTP response (or timed out). */
export function isAxiosNetworkFailure(error) {
  if (!error) return false;
  if (error.isNetworkError) return true;

  const code = error.code || error?.cause?.code;
  if (code === 'ERR_NETWORK' || code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
    return true;
  }

  const message = String(error.message || '').toLowerCase();
  if (
    message.includes('network error') ||
    message.includes('failed to fetch') ||
    message.includes('timeout') ||
    message.includes('networkrequestfailed')
  ) {
    return true;
  }

  // Axios: no response object usually means connectivity / CORS / DNS / abort
  if (error.request && !error.response) {
    return true;
  }

  return false;
}

/**
 * User-facing message for login / API failures caused by connectivity.
 */
export function getAxiosNetworkErrorMessage(error) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return getConnectionQualityMessage(NETWORK_QUALITY.OFFLINE);
  }

  const code = error?.code || error?.cause?.code;
  if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
    return 'The request timed out. Your internet connection looks slow or unstable — please try again on a stronger network.';
  }

  const quality = classifyConnection({
    ...getBrowserConnectionSnapshot(),
    recentLatencyMs: getRecentAverageLatency(),
  });

  if (quality === NETWORK_QUALITY.POOR || quality === NETWORK_QUALITY.SLOW) {
    return getConnectionQualityMessage(quality);
  }

  return 'Could not reach the server. Please check your internet connection and try again.';
}

/**
 * Lightweight reachability probe against the API host.
 * A 401/404 still counts as reachable; abort/network errors do not.
 */
export async function probeApiReachability(baseUrl, { timeoutMs = 6000 } = {}) {
  if (!baseUrl || typeof fetch === 'undefined') {
    return { ok: navigator?.onLine !== false, latencyMs: null };
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;
  const started = typeof performance !== 'undefined' ? performance.now() : Date.now();

  try {
    const url = `${String(baseUrl).replace(/\/$/, '')}/api/auth/me`;
    await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'omit',
      signal: controller?.signal,
    });
    const latencyMs =
      (typeof performance !== 'undefined' ? performance.now() : Date.now()) - started;
    recordRequestLatency(latencyMs);
    return { ok: true, latencyMs };
  } catch (err) {
    const latencyMs =
      (typeof performance !== 'undefined' ? performance.now() : Date.now()) - started;
    const aborted = err?.name === 'AbortError';
    return {
      ok: false,
      latencyMs: aborted ? latencyMs : null,
      timedOut: aborted,
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
