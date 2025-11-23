import { useState, useEffect } from 'react';
import { shopifyAPI } from '@/lib/shopify';
import { getCurrencySymbol, formatCurrency } from '@/lib/utils';

export function useCurrency() {
  const [currency, setCurrency] = useState<string>('USD');
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const shopInfo = await shopifyAPI.getShopInfo();
        const currencyCode = shopInfo.shop.currency;
        setCurrency(currencyCode);
        setCurrencySymbol(getCurrencySymbol(currencyCode));
      } catch (err) {
        console.warn('Failed to fetch shop currency, using fallback:', err);
        setError('Failed to load currency');
        // Keep default USD and $
      } finally {
        setLoading(false);
      }
    };

    fetchCurrency();
  }, []);

  return { currency, currencySymbol, formatCurrency: (amount: number | string) => formatCurrency(amount, currencySymbol), loading, error };
}