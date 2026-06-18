// ----------------------------------------------------------------------

export const RECEIPT_FORMAT_STORAGE_KEY = 'pos_receipt_format';
export const THERMAL_WIDTH_STORAGE_KEY = 'pos_thermal_width_mm';
export const BLUETOOTH_PRINTER_ID_KEY = 'pos_bluetooth_printer_id';
export const BLUETOOTH_PRINTER_NAME_KEY = 'pos_bluetooth_printer_name';
export const AUTO_PRINT_BLUETOOTH_KEY = 'pos_auto_print_bluetooth';
export const SHARE_FORMAT_STORAGE_KEY = 'pos_share_format';

export const THERMAL_WIDTH_OPTIONS_MM = [80, 58];
export const DEFAULT_THERMAL_WIDTH_MM = 58;
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

export function getBluetoothPrinterId() {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(BLUETOOTH_PRINTER_ID_KEY) || '';
  } catch {
    return '';
  }
}

export function getBluetoothPrinterName() {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(BLUETOOTH_PRINTER_NAME_KEY) || '';
  } catch {
    return '';
  }
}

export function setBluetoothPrinter(deviceId, deviceName) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BLUETOOTH_PRINTER_ID_KEY, deviceId || '');
    window.localStorage.setItem(BLUETOOTH_PRINTER_NAME_KEY, deviceName || '');
    if (deviceId && window.localStorage.getItem(AUTO_PRINT_BLUETOOTH_KEY) === null) {
      window.localStorage.setItem(AUTO_PRINT_BLUETOOTH_KEY, 'true');
    }
  } catch {
    /* quota / private mode */
  }
}

export function clearBluetoothPrinter() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(BLUETOOTH_PRINTER_ID_KEY);
    window.localStorage.removeItem(BLUETOOTH_PRINTER_NAME_KEY);
  } catch {
    /* quota / private mode */
  }
}

export function getAutoPrintBluetooth() {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(AUTO_PRINT_BLUETOOTH_KEY);
    if (raw === null) return Boolean(getBluetoothPrinterId());
    return raw === 'true';
  } catch {
    return false;
  }
}

export function setAutoPrintBluetooth(enabled) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AUTO_PRINT_BLUETOOTH_KEY, enabled ? 'true' : 'false');
  } catch {
    /* quota / private mode */
  }
}

export function canUseBluetoothPrint() {
  return Boolean(getBluetoothPrinterId());
}

export function getPreferredShareFormat() {
  if (typeof window === 'undefined') return 'pdf';
  try {
    const raw = window.localStorage.getItem(SHARE_FORMAT_STORAGE_KEY);
    return raw === 'png' ? 'png' : 'pdf';
  } catch {
    return 'pdf';
  }
}

export function setPreferredShareFormat(format) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SHARE_FORMAT_STORAGE_KEY, format === 'png' ? 'png' : 'pdf');
  } catch {
    /* quota / private mode */
  }
}
