/**
 * Currency formatting utilities
 */

/**
 * Format amount with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code (USD, EUR, NGN, etc.)
 * @param {object} options - Formatting options
 * @returns {string} Formatted amount with symbol
 */
export const formatCurrency = (amount, currencyCode = 'USD', options = {}) => {
  const {
    locale = 'en-US',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    useSymbol = true
  } = options;

  const currencies = {
    USD: { symbol: '$', position: 'before' },
    EUR: { symbol: '€', position: 'before' },
    GBP: { symbol: '£', position: 'before' },
    NGN: { symbol: '₦', position: 'before' },
    GHS: { symbol: '₵', position: 'before' },
    KES: { symbol: 'KSh', position: 'before' },
    ZAR: { symbol: 'R', position: 'before' },
    CAD: { symbol: 'C$', position: 'before' },
    AUD: { symbol: 'A$', position: 'before' },
    JPY: { symbol: '¥', position: 'before', decimals: 0 },
    CNY: { symbol: '¥', position: 'before' },
    INR: { symbol: '₹', position: 'before' },
  };

  const currency = currencies[currencyCode] || { symbol: currencyCode, position: 'before' };
  const decimals = currency.decimals ?? minimumFractionDigits;

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  if (!useSymbol) {
    return `${formatted} ${currencyCode}`;
  }

  return currency.position === 'before' 
    ? `${currency.symbol}${formatted}`
    : `${formatted}${currency.symbol}`;
};

/**
 * Parse formatted currency string to number
 * @param {string} formattedAmount - Formatted currency string
 * @returns {number} Parsed amount
 */
export const parseCurrency = (formattedAmount) => {
  if (typeof formattedAmount === 'number') return formattedAmount;
  
  // Remove currency symbols and thousands separators
  const cleaned = formattedAmount.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
};

/**
 * Convert amount between currencies using exchange rate
 * @param {number} amount - Amount to convert
 * @param {number} exchangeRate - Exchange rate
 * @returns {number} Converted amount
 */
export const convertCurrency = (amount, exchangeRate) => amount * exchangeRate;

/**
 * Get currency symbol
 * @param {string} currencyCode - Currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currencyCode) => {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    NGN: '₦',
    GHS: '₵',
    KES: 'KSh',
    ZAR: 'R',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '¥',
    CNY: '¥',
    INR: '₹',
  };
  
  return symbols[currencyCode] || currencyCode;
};

/**
 * Format amount as compact (1K, 1M, etc.)
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code
 * @returns {string} Compact formatted amount
 */
export const formatCompactCurrency = (amount, currencyCode = 'USD') => {
  const symbol = getCurrencySymbol(currencyCode);
  
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  
  return `${symbol}${formatter.format(amount)}`;
};

export default {
  formatCurrency,
  parseCurrency,
  convertCurrency,
  getCurrencySymbol,
  formatCompactCurrency
};
