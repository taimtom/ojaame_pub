import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'src/utils/axios';
import { useAuthContext } from 'src/auth/hooks';

const CurrencyContext = createContext(null);

const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', NGN: '₦', GHS: '₵',
  KES: 'KSh', ZAR: 'R', CAD: 'C$', AUD: 'A$', JPY: '¥', CNY: '¥', INR: '₹',
};

function enrichCurrency(c) {
  if (!c) return c;
  return { ...c, symbol: c.symbol || CURRENCY_SYMBOLS[c.code] || c.code };
}

export const CurrencyProvider = ({ children }) => {
  const { user } = useAuthContext();
  const [currentCurrency, setCurrentCurrency] = useState(null);
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  const [baseCurrency, setBaseCurrency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const companyId = user?.company_id;

  const fetchCurrencies = useCallback(async () => {
    if (!companyId) { setLoading(false); return; }
    try {
      setLoading(true);
      const response = await axios.get(`/api/currency/company/${companyId}/enabled`);
      const enriched = (response.data.enabled_currencies || []).map(enrichCurrency);
      setBaseCurrency(response.data.base_currency);
      setAvailableCurrencies(enriched);

      const savedCode = localStorage.getItem('current_currency');
      const chosen = savedCode
        ? enriched.find(c => c.code === savedCode) || enriched[0]
        : enriched.find(c => c.code === response.data.base_currency) || enriched[0];

      setCurrentCurrency(chosen || null);
      if (chosen) {
        localStorage.setItem('current_currency', chosen.code);
        localStorage.setItem('current_currency_symbol', chosen.symbol);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch currencies:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetchCurrencies(); }, [fetchCurrencies]);

  const switchCurrency = useCallback((currencyCode) => {
    const currency = availableCurrencies.find(c => c.code === currencyCode);
    if (currency) {
      setCurrentCurrency(currency);
      localStorage.setItem('current_currency', currencyCode);
      localStorage.setItem('current_currency_symbol', currency.symbol);
    }
  }, [availableCurrencies]);

  const convert = useCallback(async (amount, fromCurrency, toCurrency) => {
    const response = await axios.post('/api/currency/convert', {
      amount,
      from_currency: fromCurrency || currentCurrency?.code,
      to_currency: toCurrency,
    });
    return response.data;
  }, [currentCurrency]);

  const formatAmount = useCallback((amount, currencyCode) => {
    const currency = currencyCode
      ? availableCurrencies.find(c => c.code === currencyCode)
      : currentCurrency;
    if (!currency) return `${amount}`;
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${currency.symbol}${formatted}`;
  }, [currentCurrency, availableCurrencies]);

  const enableCurrency = useCallback(async (currencyCode) => {
    await axios.post('/api/currency/enable', {
      company_id: companyId,
      currency_code: currencyCode,
    });
    await fetchCurrencies();
  }, [companyId, fetchCurrencies]);

  const value = {
    currentCurrency,
    availableCurrencies,
    baseCurrency,
    loading,
    error,
    switchCurrency,
    convert,
    formatAmount,
    enableCurrency,
    refreshCurrencies: fetchCurrencies,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};

export default CurrencyContext;
