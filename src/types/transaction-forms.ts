
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

// Helper function to filter out empty strings
const filterEmptyStrings = (arr: string[]): string[] => {
  return arr.filter(item => item && typeof item === 'string' && item.trim() !== '');
};

export const categoryBuckets: CategoryBucket[] = [
  {
    name: "Food & Dining",
    categories: filterEmptyStrings(["Groceries", "Restaurants", "Fast Food", "Coffee & Cafes", "Alcohol & Bars", "Food Delivery"])
  },
  {
    name: "Transportation", 
    categories: filterEmptyStrings(["Gas & Fuel", "Public Transport", "Taxi & Rideshare", "Car Maintenance", "Car Insurance", "Parking", "Tolls"])
  },
  {
    name: "Shopping",
    categories: filterEmptyStrings(["Clothing", "Electronics", "Home & Garden", "Pharmacy", "Books", "Gifts", "Online Shopping", "Department Stores"])
  },
  {
    name: "Bills & Utilities",
    categories: filterEmptyStrings(["Electricity", "Gas", "Water", "Internet", "Phone", "Rent", "Mortgage", "Insurance", "Subscriptions"])
  },
  {
    name: "Entertainment",
    categories: filterEmptyStrings(["Movies", "Streaming Services", "Gaming", "Sports", "Hobbies", "Events & Tickets", "Music"])
  },
  {
    name: "Health & Fitness",
    categories: filterEmptyStrings(["Medical", "Dental", "Pharmacy", "Gym", "Sports Equipment", "Health Insurance"])
  },
  {
    name: "Travel",
    categories: filterEmptyStrings(["Flights", "Hotels", "Car Rental", "Travel Insurance", "Vacation"])
  },
  {
    name: "Education",
    categories: filterEmptyStrings(["Tuition", "Books & Supplies", "Online Courses", "Training"])
  },
  {
    name: "Financial",
    categories: filterEmptyStrings(["Banking Fees", "ATM Fees", "Investment", "Savings", "Loan Payment", "Credit Card Payment", "Transfer"])
  },
  {
    name: "Income",
    categories: filterEmptyStrings(["Salary", "Freelance", "Business Income", "Investment Income", "Refund", "Cashback", "Bonus"])
  },
  {
    name: "Personal Care",
    categories: filterEmptyStrings(["Haircut", "Beauty", "Spa", "Personal Items"])
  },
  {
    name: "Family & Kids",
    categories: filterEmptyStrings(["Childcare", "School Fees", "Kids Activities", "Baby Items"])
  },
  {
    name: "Business",
    categories: filterEmptyStrings(["Office Supplies", "Business Meals", "Professional Services", "Marketing", "Equipment"])
  },
  {
    name: "Charity & Gifts",
    categories: filterEmptyStrings(["Donations", "Charity", "Gifts Given"])
  },
  {
    name: "Other",
    categories: filterEmptyStrings(["Miscellaneous", "Cash Withdrawal", "Other"])
  }
].filter(bucket => bucket.name && bucket.name.trim() !== "" && bucket.categories.length > 0);

// Flatten all categories for backward compatibility - with additional filtering
export const categories = filterEmptyStrings(categoryBuckets.flatMap(bucket => bucket.categories));

export const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "AUD", symbol: "$", name: "Australian Dollar" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar" },
].filter(curr => curr.code && curr.code.trim() !== "");
