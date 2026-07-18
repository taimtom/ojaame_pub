import { toast as sonnerToast } from 'sonner';

import {
  NETWORK_QUALITY,
  getConnectionQualityMessage,
  getAxiosNetworkErrorMessage,
} from 'src/utils/network-quality';

// ----------------------------------------------------------------------

/** Phrases that OfflineBanner already covers — never show as top-right toasts. */
const ADVISORY_SNIPPETS = [
  getConnectionQualityMessage(NETWORK_QUALITY.SLOW),
  getConnectionQualityMessage(NETWORK_QUALITY.POOR),
  getConnectionQualityMessage(NETWORK_QUALITY.OFFLINE),
  getAxiosNetworkErrorMessage({ code: 'ECONNABORTED' }),
  getAxiosNetworkErrorMessage({}),
  'Slow internet connection detected',
  'Weak internet connection detected',
  'Your internet connection is slow',
  'Your internet connection looks weak',
  'Your internet connection looks slow',
  'You appear to be offline',
  'You are offline',
  'Could not reach the server',
  'check your internet connection',
  'request timed out',
].filter(Boolean);

const ADVISORY_KEYWORDS = [
  'internet connection',
  'slow internet',
  'weak internet',
  'you are offline',
  'you appear to be offline',
  'could not reach the server',
  'network issue, not the app',
  'stronger network',
];

function extractMessage(payload) {
  if (payload == null) return '';
  if (typeof payload === 'string') return payload;
  if (typeof payload === 'object') {
    if (payload instanceof Error) return String(payload.message || '');
    return String(payload.message || payload.title || payload.description || '');
  }
  return String(payload);
}

/** True when OfflineBanner already communicates this network advisory. */
export function isNetworkAdvisoryMessage(payload) {
  const msg = extractMessage(payload);
  if (!msg) return false;
  const lower = msg.toLowerCase();

  if (ADVISORY_SNIPPETS.some((snippet) => lower.includes(String(snippet).toLowerCase().slice(0, 24)))) {
    return true;
  }

  // Connectivity advisories (not generic "Network Error" from unrelated failures)
  const hitKeyword = ADVISORY_KEYWORDS.some((kw) => lower.includes(kw));
  if (!hitKeyword) return false;

  // Avoid suppressing unrelated copy that happens to mention "network"
  return (
    lower.includes('connection') ||
    lower.includes('offline') ||
    lower.includes('timed out') ||
    lower.includes('reach the server')
  );
}

function wrapToastFn(fn) {
  return (message, data) => {
    if (isNetworkAdvisoryMessage(message) || isNetworkAdvisoryMessage(data?.description)) {
      // Bottom OfflineBanner already shows connection quality — skip duplicate toasts.
      return undefined;
    }
    return fn(message, data);
  };
}

export const toast = Object.assign(wrapToastFn(sonnerToast), {
  success: sonnerToast.success.bind(sonnerToast),
  error: wrapToastFn(sonnerToast.error.bind(sonnerToast)),
  warning: wrapToastFn(sonnerToast.warning.bind(sonnerToast)),
  info: wrapToastFn(sonnerToast.info.bind(sonnerToast)),
  message: wrapToastFn(sonnerToast.message.bind(sonnerToast)),
  custom: sonnerToast.custom.bind(sonnerToast),
  promise: sonnerToast.promise.bind(sonnerToast),
  dismiss: sonnerToast.dismiss.bind(sonnerToast),
  loading: sonnerToast.loading.bind(sonnerToast),
});

export { Snackbar } from './snackbar';
