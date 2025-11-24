import { useState, useEffect } from 'react';
import { getCurrencySymbol, formatCurrency } from '@/shared/utils';

export function useCurrency() {
  const [currency, setCurrency] = useState<string>('USD');
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // For now, use default USD currency
    // TODO: Implement currency fetching from shop API when available
    setCurrency('USD');
    setCurrencySymbol(getCurrencySymbol('USD'));
  }, []);

  return { currency, currencySymbol, formatCurrency: (amount: number | string) => formatCurrency(amount, currencySymbol), loading, error };
}