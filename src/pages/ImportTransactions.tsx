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

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!values.category) {
      values.category = categorizeTransaction(values.description);
    }
    
    console.log(values);
    toast({
      title: "Transaction added",
      description: "Your transaction has been successfully recorded.",
    });
    onSuccess?.();
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const transactions: ParsedTransaction[] = parseCSV(content);

      if (transactions.length === 0) {
        toast({
          title: "Error",
          description: "No valid transactions found in the CSV file.",
          variant: "destructive",
        });
        return;
      }

      const firstTransaction = transactions[0];
      const suggestedCategory = categorizeTransaction(firstTransaction.description);
      
      form.reset({
        description: firstTransaction.description,
        amount: firstTransaction.amount,
        category: suggestedCategory,
        date: firstTransaction.date,
        currency: firstTransaction.currency || "USD",
      });

      toast({
        title: "CSV Imported",
        description: `Successfully loaded ${transactions.length} transaction(s).`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse the CSV file. Please check the format.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Upload className="h-4 w-4" />
        <AlertTitle>CSV Import</AlertTitle>
        <AlertDescription>
          Upload a CSV file from your bank with the following columns: Date, Description, Amount
        </AlertDescription>
      </Alert>

      <div className="flex items-center space-x-4">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="flex-1"
        />
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