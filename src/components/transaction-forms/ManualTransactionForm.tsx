
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { categorizeTransaction } from "@/utils/transactionCategories";
import { linkYodleeAccount } from "@/utils/yodlee";
import { 
  transactionFormSchema, 
  TransactionFormData, 
  categories, 
  currencies 
} from "@/types/transaction-forms";

interface ManualTransactionFormProps {
  onSuccess?: () => void;
  initialValues?: Partial<TransactionFormData>;
}

export const ManualTransactionForm = ({ onSuccess, initialValues }: ManualTransactionFormProps) => {
  const { toast } = useToast();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      description: initialValues?.description || "",
      amount: initialValues?.amount || "",
      category: initialValues?.category || "",
      date: initialValues?.date || new Date().toISOString().split('T')[0],
      currency: initialValues?.currency || "USD",
    },
  });

  async function onSubmit(values: TransactionFormData) {
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

      await linkYodleeAccount({
        id: "manual",
        accountName: "Manual Transactions",
        accountType: "manual",
        providerName: "Manual Entry"
      });

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

  return (
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
  );
};
