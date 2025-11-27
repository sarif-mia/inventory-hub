import { useState, useEffect } from 'react';
import { getCurrencySymbol, formatCurrency } from '@/shared/utils';
import { apiClient } from '@/shared/utils/api';

export function useCurrency() {
  const [currency, setCurrency] = useState<string>('USD');
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCurrency();
  }, []);

  const loadCurrency = async () => {
    try {
      setLoading(true);
      const currencyValue = await apiClient.getSetting('currency');
      const currencyCode = currencyValue || 'USD';
      setCurrency(currencyCode);
      setCurrencySymbol(getCurrencySymbol(currencyCode));
      setError(null);
    } catch (err) {
      console.error('Failed to load currency:', err);
      // Fallback to USD
      setCurrency('USD');
      setCurrencySymbol('$');
      setError('Failed to load currency setting');
    } finally {
      setLoading(false);
    }
  };

  return { currency, currencySymbol, formatCurrency: (amount: number | string) => formatCurrency(amount, currencySymbol), loading, error };
}