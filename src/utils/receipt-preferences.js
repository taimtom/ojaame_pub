// ----------------------------------------------------------------------

export const RECEIPT_FORMAT_STORAGE_KEY = 'pos_receipt_format';
export const THERMAL_WIDTH_STORAGE_KEY = 'pos_thermal_width_mm';

export const THERMAL_WIDTH_OPTIONS_MM = [80, 58];
export const DEFAULT_THERMAL_WIDTH_MM = 80;
export const DEFAULT_RECEIPT_FORMAT = 'thermal';

// ----------------------------------------------------------------------

export function normalizeThermalWidthMm(value) {
  const n = Number(value);
  return n === 58 ? 58 : 80;
}

export function getPreferredReceiptFormat() {
  if (typeof window === 'undefined') return DEFAULT_RECEIPT_FORMAT;
  try {
    const raw = window.localStorage.getItem(RECEIPT_FORMAT_STORAGE_KEY);
    return raw === 'a4' ? 'a4' : 'thermal';
  } catch {
    return DEFAULT_RECEIPT_FORMAT;
  }
}

export function setPreferredReceiptFormat(format) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RECEIPT_FORMAT_STORAGE_KEY, format === 'a4' ? 'a4' : 'thermal');
  } catch {
    /* quota / private mode */
  }
}

export function getPreferredThermalWidthMm() {
  if (typeof window === 'undefined') return DEFAULT_THERMAL_WIDTH_MM;
  try {
    return normalizeThermalWidthMm(window.localStorage.getItem(THERMAL_WIDTH_STORAGE_KEY));
  } catch {
    return DEFAULT_THERMAL_WIDTH_MM;
  }
}

export function setPreferredThermalWidthMm(widthMm) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      THERMAL_WIDTH_STORAGE_KEY,
      String(normalizeThermalWidthMm(widthMm))
    );
  } catch {
    /* quota / private mode */
  }
}
