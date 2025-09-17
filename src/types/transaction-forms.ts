export const currencies = [
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'NZD', name: 'New Zealand Dollar' }
];

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  currency: string;
  comment?: string;
  account?: string;
}

export interface CsvUploadProps {
  onTransactionsUploaded: (transactions: Omit<Transaction, 'id'>[]) => void;
}

export interface ManualTransactionFormProps {
  onTransactionAdded?: () => void;
}

// Legacy categories for backward compatibility
export const categories = [
  'Groceries', 'Restaurants', 'Gas & Fuel', 'Shopping', 'Entertainment',
  'Healthcare', 'Insurance', 'Utilities', 'Transportation', 'Education',
  'Travel', 'Gifts & Donations', 'Personal Care', 'Professional Services',
  'Home & Garden', 'Electronics', 'Clothing', 'Books', 'Subscriptions',
  'Banking', 'Investment', 'Taxes', 'Legal', 'Uncategorized'
];