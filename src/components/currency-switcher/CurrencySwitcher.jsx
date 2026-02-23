/**
 * Currency Switcher Component
 * 
 * Dropdown component for selecting and switching between enabled currencies.
 */

import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip
} from '@mui/material';
import { useCurrency } from '../../contexts/CurrencyContext';

const CurrencySwitcher = ({ 
  variant = 'standard',
  size = 'medium',
  showSymbol = true,
  fullWidth = false,
  disabled = false,
  onChange
}) => {
  const { 
    currentCurrency, 
    availableCurrencies, 
    switchCurrency,
    loading 
  } = useCurrency();

  const handleChange = (event) => {
    const newCurrency = event.target.value;
    switchCurrency(newCurrency);
    
    if (onChange) {
      onChange(newCurrency);
    }
  };

  if (loading) {
    return <Typography variant="caption">Loading currencies...</Typography>;
  }

  if (!availableCurrencies || availableCurrencies.length === 0) {
    return null;
  }

  return (
    <FormControl 
      variant={variant} 
      size={size} 
      fullWidth={fullWidth}
      disabled={disabled}
    >
      <InputLabel id="currency-switcher-label">Currency</InputLabel>
      <Select
        labelId="currency-switcher-label"
        id="currency-switcher"
        value={currentCurrency?.code || ''}
        onChange={handleChange}
        label="Currency"
        renderValue={(selected) => {
          const currency = availableCurrencies.find(c => c.code === selected);
          if (!currency) return selected;
          
          return (
            <Box display="flex" alignItems="center" gap={1}>
              {showSymbol && <span>{currency.symbol}</span>}
              <span>{currency.code}</span>
            </Box>
          );
        }}
      >
        {availableCurrencies.map((currency) => (
          <MenuItem key={currency.code} value={currency.code}>
            <Box display="flex" alignItems="center" gap={1} width="100%">
              <Typography variant="body1" component="span" fontWeight="bold">
                {currency.symbol}
              </Typography>
              <Typography variant="body2" component="span">
                {currency.code}
              </Typography>
              <Typography variant="caption" component="span" sx={{ ml: 'auto', color: 'text.secondary' }}>
                {currency.name}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default CurrencySwitcher;
