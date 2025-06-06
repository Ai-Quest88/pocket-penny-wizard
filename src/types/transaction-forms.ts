
import { z } from "zod";

export const transactionFormSchema = z.object({
  description: z.string().min(2, {
    message: "Description must be at least 2 characters.",
  }),
  amount: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Amount must be a valid number.",
  }),
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
  date: z.string(),
  currency: z.string().min(1, {
    message: "Please select a currency.",
  }),
  account_id: z.string().optional(),
});

export type TransactionFormData = z.infer<typeof transactionFormSchema>;

export interface Transaction {
  id?: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  currency: string;
  account: string;
  comment?: string;
}

export interface ManualTransactionFormProps {
  onTransactionAdded: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
}

export interface CsvUploadProps {
  onTransactionsUploaded: (transactions: Omit<Transaction, 'id'>[]) => Promise<void>;
}

export interface CategoryBucket {
  name: string;
  categories: string[];
}

export const categoryBuckets: CategoryBucket[] = [
  {
    name: "Living Expenses",
    categories: ["Food", "Transport", "Bills", "Shopping"]
  },
  {
    name: "Lifestyle",
    categories: ["Entertainment", "Health", "Travel", "Education"]
  },
  {
    name: "Financial",
    categories: ["Income", "Banking", "Investment", "Insurance"]
  },
  {
    name: "Other",
    categories: ["Other", "Gifts", "Charity"]
  }
];

// Flatten all categories for backward compatibility
export const categories = categoryBuckets.flatMap(bucket => bucket.categories);

export const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "AUD", symbol: "$", name: "Australian Dollar" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar" },
];
