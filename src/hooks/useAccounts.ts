
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
  currency?: string;
}

export const useAccounts = () => {
  const { session } = useAuth();
  const { data: calculatedBalances = [] } = useAccountBalances();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return [];

      // Fetch assets (Express returns flat fields with entity_name from JOIN)
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', session.user.id);

      if (assetsError) {
        console.error('Error fetching cash accounts:', assetsError);
      }

      // Fetch liabilities
      const { data: liabilities, error: liabilitiesError } = await supabase
        .from('liabilities')
        .select('*')
        .eq('user_id', session.user.id);

      if (liabilitiesError) {
        console.error('Error fetching liability accounts:', liabilitiesError);
      }

      const allAccounts: Account[] = [];

      // Transform assets into account format with calculated balances
      if (assets) {
        (assets as any[]).forEach((asset: any) => {
          const calculatedBalance = calculatedBalances.find((b: any) => b.accountId === asset.id);
          allAccounts.push({
            id: asset.id,
            name: asset.name,
            type: (asset.category || asset.type || 'bank_account').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            entityName: asset.entity_name || 'Unknown',
            entityType: 'individual',
            accountNumber: asset.account_number,
            currentBalance: calculatedBalance?.calculatedBalance || Number(asset.value) || 0,
            accountType: 'asset',
            currency: asset.currency,
          });
        });
      }

      // Transform liabilities into account format with calculated balances
      if (liabilities) {
        (liabilities as any[]).forEach((liability: any) => {
          const calculatedBalance = calculatedBalances.find((b: any) => b.accountId === liability.id);
          allAccounts.push({
            id: liability.id,
            name: liability.name,
            type: (liability.category || liability.type || 'credit_card').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            entityName: liability.entity_name || 'Unknown',
            entityType: 'individual',
            accountNumber: liability.account_number,
            currentBalance: calculatedBalance?.calculatedBalance || Number(liability.amount) || 0,
            accountType: 'liability',
            currency: liability.currency,
          });
        });
      }

      return allAccounts;
    },
    enabled: !!session?.user,
  });

  return { accounts, isLoading };
};
