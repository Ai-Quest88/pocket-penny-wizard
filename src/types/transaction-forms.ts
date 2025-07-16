
export const categories = [
  'Groceries', 'Restaurants', 'Gas & Fuel', 'Shopping', 'Entertainment',
  'Healthcare', 'Insurance', 'Utilities', 'Transportation', 'Education',
  'Travel', 'Gifts & Donations', 'Personal Care', 'Professional Services',
  'Home & Garden', 'Electronics', 'Clothing', 'Books', 'Subscriptions',
  'Banking', 'Investment', 'Taxes', 'Legal', 'Uncategorized', 'Transfer In', 'Transfer Out', 'Internal Transfer',
  'Income', 'Salary', 'Business', 'Freelance', 'Interest', 'Dividends',
  'Other Income', 'Rental Income', 'Government Benefits', 'Pension',
  'Child Support', 'Alimony', 'Gifts Received', 'Refunds',
  'Cryptocurrency', 'Fast Food', 'Public Transport', 'Tolls', 'Food Delivery'
];

export const currencies = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'NZD', name: 'New Zealand Dollar' }
];

export interface CategoryBucket {
  name: string;
  categories: string[];
}

export const categoryBuckets: CategoryBucket[] = [
  {
    name: "Living Expenses",
    categories: [
      "Groceries", "Restaurants", "Gas & Fuel", "Utilities", "Healthcare",
      "Insurance", "Transportation", "Public Transport", "Tolls", "Fast Food", "Food Delivery"
    ]
  },
  {
    name: "Lifestyle",
    categories: [
      "Shopping", "Entertainment", "Travel", "Personal Care", "Electronics",
      "Clothing", "Books", "Subscriptions"
    ]
  },
  {
    name: "Financial",
    categories: [
      "Banking", "Investment", "Taxes", "Legal", "Transfer", "Internal Transfer", "Income",
      "Salary", "Business", "Freelance", "Interest", "Dividends",
      "Other Income", "Rental Income", "Government Benefits", "Pension",
      "Child Support", "Alimony", "Gifts Received", "Refunds", "Cryptocurrency"
    ]
  },
  {
    name: "Other",
    categories: [
      "Education", "Gifts & Donations", "Professional Services", "Home & Garden",
      "Uncategorized"
    ]
  }
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
