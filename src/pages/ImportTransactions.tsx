
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload } from "lucide-react";
import { parseCSV, ParsedTransaction } from "@/utils/csvParser";
import { categorizeTransaction } from "@/utils/transactionCategories";
import { linkYodleeAccount } from "@/utils/yodlee";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface ImportTransactionsProps {
  onSuccess?: () => void;
}

const formSchema = z.object({
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
});

const categories = [
  "Food",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Bills",
  "Income",
  "Other",
];

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
];

export default function ImportTransactions({ onSuccess }: ImportTransactionsProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      date: new Date().toISOString().split('T')[0],
      currency: "USD",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (!session?.user?.id) {
        toast({
          title: "Error",
          description: "You must be logged in to add transactions.",
          variant: "destructive"
        });
        return;
      }

      console.log('Adding single transaction:', values);

      if (!values.category) {
        values.category = categorizeTransaction(values.description);
      }

      const { error } = await supabase
        .from('transactions')
        .insert([{
          user_id: session.user.id,
          description: values.description,
          amount: parseFloat(values.amount),
          category: values.category,
          date: values.date,
          currency: values.currency
        }]);

      if (error) {
        console.error('Error inserting transaction:', error);
        throw error;
      }

      console.log('Transaction added successfully');

      // Link a new Yodlee account
      await linkYodleeAccount({
        id: "manual",
        accountName: "Manual Transactions",
        accountType: "manual",
        providerName: "Manual Entry"
      });

      // Invalidate and refetch transactions
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      toast({
        title: "Transaction added",
        description: "Your transaction has been successfully recorded.",
      });
      
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive"
      });
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to upload transactions.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress('Reading file...');

    try {
      const content = await file.text();
      console.log('CSV file content:', content.substring(0, 200) + '...');
      
      setUploadProgress('Parsing transactions...');
      const { transactions, errors } = parseCSV(content);

      console.log(`Parsed ${transactions.length} transactions with ${errors.length} errors`);

      if (errors.length > 0) {
        console.warn('CSV parsing errors:', errors);
        
        // Show errors to user but continue if we have some valid transactions
        const errorMessage = errors.slice(0, 3).map(e => 
          `Row ${e.row}: ${e.message}`
        ).join('\n');
        
        toast({
          title: `Found ${errors.length} parsing error(s)`,
          description: errorMessage + (errors.length > 3 ? '\n...and more' : ''),
          variant: "destructive",
        });
      }

      if (transactions.length === 0) {
        toast({
          title: "No valid transactions",
          description: "No valid transactions found in the CSV file. Please check the format and try again.",
          variant: "destructive",
        });
        setIsUploading(false);
        setUploadProgress('');
        return;
      }

      setUploadProgress(`Uploading ${transactions.length} transactions...`);

      // Prepare transactions for database insertion
      const transactionsToInsert = transactions.map(transaction => ({
        user_id: session.user.id,
        description: transaction.description,
        amount: parseFloat(transaction.amount),
        category: transaction.category || categorizeTransaction(transaction.description),
        date: transaction.date,
        currency: transaction.currency || "USD"
      }));

      console.log('Inserting transactions:', transactionsToInsert);

      // Insert all transactions in bulk
      const { error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (error) {
        console.error('Error bulk inserting transactions:', error);
        throw error;
      }

      console.log('Bulk insert successful');

      // Invalidate and refetch transactions to show updated list
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      toast({
        title: "CSV Upload Successful",
        description: `Successfully imported ${transactions.length} transaction(s) to your account.${errors.length > 0 ? ` ${errors.length} rows had errors and were skipped.` : ''}`,
      });

      // Clear the file input
      event.target.value = '';
      
      // Optionally populate the form with the first transaction for preview
      if (transactions.length > 0) {
        const firstTransaction = transactions[0];
        const suggestedCategory = categorizeTransaction(firstTransaction.description);
        
        form.reset({
          description: firstTransaction.description,
          amount: firstTransaction.amount,
          category: suggestedCategory,
          date: firstTransaction.date,
          currency: firstTransaction.currency || "USD",
        });
      }

    } catch (error) {
      console.error('Error processing CSV file:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to process the CSV file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Upload className="h-4 w-4" />
        <AlertTitle>CSV Import</AlertTitle>
        <AlertDescription>
          Upload a CSV file with columns: Date (DD/MM/YYYY, MM/DD/YYYY, or YYYY-MM-DD), Description, Amount, Currency (optional).
          <br />
          Example: "20/11/2024,Grocery Shopping,-50.00,USD"
        </AlertDescription>
      </Alert>

      <div className="flex items-center space-x-4">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="flex-1"
          disabled={isUploading}
        />
        {isUploading && (
          <div className="text-sm text-muted-foreground">
            {uploadProgress}
          </div>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Grocery shopping" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category.toLowerCase()}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit">Add Transaction</Button>
            <Button type="button" variant="outline" onClick={() => onSuccess?.()}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
