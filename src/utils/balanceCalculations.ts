
import { supabase } from "@/integrations/supabase/client";

export interface AccountBalance {
  accountId: string;
  accountName: string;
  entityName: string;
  accountType: 'asset' | 'liability';
  calculatedBalance: number;
}

export const calculateAccountBalances = async (userId: string): Promise<AccountBalance[]> => {
  console.log('Calculating dynamic account balances for user:', userId);

  // Fetch all transactions
  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId);

  if (transactionsError) {
    console.error('Error fetching transactions:', transactionsError);
    throw transactionsError;
  }

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

  // Calculate balances for assets
  assets.forEach(asset => {
    // Find all transactions for this asset account
    const accountTransactions = transactions.filter(t => t.account_id === asset.id);
    const transactionSum = accountTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    
    // For assets, start with initial value and add transaction amounts
    const calculatedBalance = Number(asset.value) + transactionSum;

    balances.push({
      accountId: asset.id,
      accountName: asset.name,
      entityName: asset.entities.name,
      accountType: 'asset',
      calculatedBalance
    });

    console.log(`Asset ${asset.name}: Initial ${asset.value} + Transactions ${transactionSum} = ${calculatedBalance}`);
  });

  // Calculate balances for liabilities  
  liabilities.forEach(liability => {
    // Find all transactions for this liability account
    const accountTransactions = transactions.filter(t => t.account_id === liability.id);
    const transactionSum = accountTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    
    // For liabilities, start with initial amount and subtract transaction amounts (payments reduce liability)
    const calculatedBalance = Number(liability.amount) - transactionSum;

    balances.push({
      accountId: liability.id,
      accountName: liability.name,
      entityName: liability.entities.name,
      accountType: 'liability',
      calculatedBalance
    });

    console.log(`Liability ${liability.name}: Initial ${liability.amount} - Transactions ${transactionSum} = ${calculatedBalance}`);
  });

  console.log('Calculated balances:', balances);
  return balances;
};

export const getAccountBalance = async (accountId: string, userId: string): Promise<number> => {
  const balances = await calculateAccountBalances(userId);
  const accountBalance = balances.find(b => b.accountId === accountId);
  return accountBalance?.calculatedBalance || 0;
};
