
import { supabase } from "@/integrations/supabase/client";

export interface AccountBalance {
  accountId: string;
  accountName: string;
  entityName: string;
  accountType: 'asset' | 'liability';
  calculatedBalance: number;
}

export const calculateAccountBalances = async (userId: string): Promise<AccountBalance[]> => {
  console.log('Calculating account balances for user:', userId);

  // Fetch all assets and liabilities to get account info
  const [assetsResponse, liabilitiesResponse] = await Promise.all([
    supabase
      .from('assets')
      .select(`
        id, name, type, category, account_number, value,
        entities!inner(name, type)
      `)
      .eq('user_id', userId),
    supabase
      .from('liabilities')
      .select(`
        id, name, type, category, account_number, amount,
        entities!inner(name, type)
      `)
      .eq('user_id', userId)
  ]);

  if (assetsResponse.error) {
    console.error('Error fetching assets:', assetsResponse.error);
    throw assetsResponse.error;
  }

  if (liabilitiesResponse.error) {
    console.error('Error fetching liabilities:', liabilitiesResponse.error);
    throw liabilitiesResponse.error;
  }

  const assets = assetsResponse.data || [];
  const liabilities = liabilitiesResponse.data || [];
  const balances: AccountBalance[] = [];

  // For now, use the initial values from assets and liabilities
  // TODO: In the future, we need to add an account_id field to transactions
  // to properly associate transactions with specific accounts

  // Calculate balances for assets
  assets.forEach(asset => {
    balances.push({
      accountId: asset.id,
      accountName: asset.name,
      entityName: asset.entities.name,
      accountType: 'asset',
      calculatedBalance: Number(asset.value)
    });

    console.log(`Asset ${asset.name}: Balance ${asset.value}`);
  });

  // Calculate balances for liabilities  
  liabilities.forEach(liability => {
    balances.push({
      accountId: liability.id,
      accountName: liability.name,
      entityName: liability.entities.name,
      accountType: 'liability',
      calculatedBalance: Number(liability.amount)
    });

    console.log(`Liability ${liability.name}: Balance ${liability.amount}`);
  });

  console.log('Calculated balances:', balances);
  return balances;
};

export const getAccountBalance = async (accountId: string, userId: string): Promise<number> => {
  const balances = await calculateAccountBalances(userId);
  const accountBalance = balances.find(b => b.accountId === accountId);
  return accountBalance?.calculatedBalance || 0;
};
