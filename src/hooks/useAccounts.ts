
import { useState, useEffect } from 'react';
import { Asset } from '@/types/assets-liabilities';

interface Account {
  id: string;
  name: string;
  type: string;
}

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    const savedAssets = localStorage.getItem('assets');
    if (savedAssets) {
      const assets: Asset[] = JSON.parse(savedAssets);
      
      // Filter for cash-type assets (bank accounts)
      const cashAccounts = assets
        .filter(asset => asset.type === 'cash')
        .map(asset => ({
          id: asset.id,
          name: asset.name,
          type: asset.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
        }));
      
      setAccounts(cashAccounts);
    }
  }, []);

  return accounts;
};
