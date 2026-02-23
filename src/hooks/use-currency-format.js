import { useContext } from 'react';
import CurrencyContext from 'src/contexts/CurrencyContext';

const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', NGN: '₦', GHS: '₵',
  KES: 'KSh', ZAR: 'R', CAD: 'C$', AUD: 'A$', JPY: '¥', CNY: '¥', INR: '₹',
};

export function useCurrencyFormat() {
  const ctx = useContext(CurrencyContext);
  const code =
    ctx?.currentCurrency?.code ||
    (typeof window !== 'undefined' ? localStorage.getItem('current_currency') : null) ||
    'NGN';
  const symbol = ctx?.currentCurrency?.symbol || CURRENCY_SYMBOLS[code] || code;

  const fCurrency = (amount) => {
    if (amount == null || Number.isNaN(Number(amount))) return '';
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));
    return `${symbol}${formatted}`;
  };

  return { fCurrency, currencySymbol: symbol, currencyCode: code };
}

export default useCurrencyFormat;
