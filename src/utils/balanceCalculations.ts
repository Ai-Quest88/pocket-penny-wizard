
import { supabase } from "@/integrations/supabase/client";

export interface AccountBalance {
  accountId: string;
  accountName: string;
  entityName: string;
  accountType: 'asset' | 'liability';
  openingBalance: number;
  transactionSum: number;
  calculatedBalance: number; // This is the closing balance
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
        id, name, type, category, account_number, value, opening_balance, opening_balance_date,
        entities!inner(name, type)
      `)
      .eq('user_id', userId),
    supabase
      .from('liabilities')
      .select(`
        id, name, type, category, account_number, amount, opening_balance, opening_balance_date,
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
    // Find all transactions for this asset account that are after opening balance date
    const openingBalanceDate = new Date(asset.opening_balance_date);
    const accountTransactions = transactions.filter(t => 
      t.account_id === asset.id && 
      new Date(t.date) >= openingBalanceDate
    );
    const transactionSum = accountTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    
    // For assets: Closing Balance = Opening Balance + Transactions
    const openingBalance = Number(asset.opening_balance);
    const calculatedBalance = openingBalance + transactionSum;

    balances.push({
      accountId: asset.id,
      accountName: asset.name,
      entityName: asset.entities.name,
      accountType: 'asset',
      openingBalance,
      transactionSum,
      calculatedBalance // This is the closing balance
    });

    console.log(`Asset ${asset.name}: Opening ${openingBalance} + Transactions ${transactionSum} = Closing ${calculatedBalance}`);
  });

  // Calculate balances for liabilities  
  liabilities.forEach(liability => {
    // Find all transactions for this liability account that are after opening balance date
    const openingBalanceDate = new Date(liability.opening_balance_date);
    const accountTransactions = transactions.filter(t => 
      t.account_id === liability.id && 
      new Date(t.date) >= openingBalanceDate
    );
    const transactionSum = accountTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    
    // For liabilities: Closing Balance = Opening Balance - Transactions (payments reduce liability)
    const openingBalance = Number(liability.opening_balance);
    const calculatedBalance = openingBalance - transactionSum;

    balances.push({
      accountId: liability.id,
      accountName: liability.name,
      entityName: liability.entities.name,
      accountType: 'liability',
      openingBalance,
      transactionSum,
      calculatedBalance // This is the closing balance
    });

    console.log(`Liability ${liability.name}: Opening ${openingBalance} - Transactions ${transactionSum} = Closing ${calculatedBalance}`);
  });

  console.log('Calculated balances with opening/closing:', balances);
  return balances;
};

export const getAccountBalance = async (accountId: string, userId: string): Promise<number> => {
  const balances = await calculateAccountBalances(userId);
  const accountBalance = balances.find(b => b.accountId === accountId);
  return accountBalance?.calculatedBalance || 0;
};

export const getAccountOpeningBalance = async (accountId: string, userId: string): Promise<number> => {
  const balances = await calculateAccountBalances(userId);
  const accountBalance = balances.find(b => b.accountId === accountId);
  return accountBalance?.openingBalance || 0;
};

export const getAccountClosingBalance = async (accountId: string, userId: string): Promise<number> => {
  // Closing balance is the same as calculated balance
  return getAccountBalance(accountId, userId);
};
