import { fNumber } from 'src/utils/format-number';

// ----------------------------------------------------------------------

// Unicode ₦ (U+20A6) is not in CP437 and prints as "?" on most thermal printers.
// Use plain "N" for NGN — readable on every ESC/POS device (e.g. N1,000).
const ESCPOS_CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: 'EUR ',
  GBP: '\u00a3',
  NGN: 'N',
  GHS: 'GHS ',
  KES: 'KSh ',
  ZAR: 'R',
  CAD: 'C$',
  AUD: 'A$',
  JPY: 'Y',
  CNY: 'Y',
  INR: 'INR ',
};

function processInput(inputValue) {
  if (inputValue == null || Number.isNaN(inputValue)) return null;
  return Number(inputValue);
}

function getCurrencyCode() {
  if (typeof window !== 'undefined') {
    const storedCode = localStorage.getItem('current_currency');
    if (storedCode) return storedCode;
  }
  return 'NGN';
}

/**
 * Format currency for ESC/POS thermal printers (single-byte code pages).
 * Avoids Unicode symbols that print as "?".
 */
export function fCurrencyEscPos(inputValue, options) {
  const number = processInput(inputValue);
  if (number === null) return '';

  const currencyCode = getCurrencyCode();
  const symbol = ESCPOS_CURRENCY_SYMBOLS[currencyCode] || `${currencyCode} `;
  const formatted = fNumber(number, options);

  return `${symbol}${formatted}`;
}
