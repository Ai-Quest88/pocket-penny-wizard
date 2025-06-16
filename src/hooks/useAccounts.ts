
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountBalances } from './useAccountBalances';

interface Account {
  id: string;
  name: string;
  type: string;
  entityName?: string;
  entityType?: string;
  accountNumber?: string;
  currentBalance: number;
  accountType: 'asset' | 'liability';
}

export const useAccounts = () => {
  const { session } = useAuth();
  const { data: calculatedBalances = [] } = useAccountBalances();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return [];

      // Fetch assets (cash accounts)
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select(`
          id,
          name,
          type,
          category,
          account_number,
          value,
          entity_id,
          entities!inner(
            id,
            name,
            type
          )
        `)
        .eq('user_id', session.user.id)
        .eq('type', 'cash')
        .order('name');

      if (assetsError) {
        console.error('Error fetching cash accounts:', assetsError);
      }

      // Fetch liabilities (debt accounts)
      const { data: liabilities, error: liabilitiesError } = await supabase
        .from('liabilities')
        .select(`
          id,
          name,
          type,
          category,
          account_number,
          amount,
          entity_id,
          entities!inner(
            id,
            name,
            type
          )
        `)
        .eq('user_id', session.user.id)
        .order('name');

      if (liabilitiesError) {
        console.error('Error fetching liability accounts:', liabilitiesError);
      }

      const allAccounts: Account[] = [];

      // Transform assets into account format with calculated balances
      if (assets) {
        assets.forEach(asset => {
          const calculatedBalance = calculatedBalances.find(b => b.accountId === asset.id);
          allAccounts.push({
            id: asset.id,
            name: asset.name,
            type: asset.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            entityName: asset.entities.name,
            entityType: asset.entities.type,
            accountNumber: asset.account_number,
            currentBalance: calculatedBalance?.calculatedBalance || Number(asset.value),
            accountType: 'asset'
          });
        });
      }

      // Transform liabilities into account format with calculated balances
      if (liabilities) {
        liabilities.forEach(liability => {
          const calculatedBalance = calculatedBalances.find(b => b.accountId === liability.id);
          allAccounts.push({
            id: liability.id,
            name: liability.name,
            type: liability.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            entityName: liability.entities.name,
            entityType: liability.entities.type,
            accountNumber: liability.account_number,
            currentBalance: calculatedBalance?.calculatedBalance || Number(liability.amount),
            accountType: 'liability'
          });
        });
      }

      return allAccounts;
    },
    enabled: !!session?.user,
  });

  return { accounts, isLoading };
};
