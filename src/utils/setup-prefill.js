const STORAGE_KEY = 'setup_prefill';

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const ascii = atob(padded);
  const percentEncoded = ascii
    .split('')
    .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
    .join('');
  return decodeURIComponent(percentEncoded);
}

export function parseSetupPrefillParam(encodedValue) {
  if (!encodedValue) return null;

  try {
    const json = fromBase64Url(encodedValue);
    const payload = JSON.parse(json);
    if (!payload || typeof payload !== 'object') return null;
    return payload;
  } catch (error) {
    return null;
  }
}

export function saveSetupPrefill(payload) {
  if (!payload || typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function getSetupPrefill() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

export function clearSetupPrefill() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
