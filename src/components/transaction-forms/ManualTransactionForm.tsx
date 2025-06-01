
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { categorizeTransaction } from "@/utils/transactionCategories";
import { transactionFormSchema, TransactionFormData, categories, currencies } from "@/types/transaction-forms";

interface ManualTransactionFormProps {
  onSuccess?: () => void;
  initialValues?: Partial<TransactionFormData>;
}

export const ManualTransactionForm = ({ onSuccess, initialValues = {} }: ManualTransactionFormProps) => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  console.log("ManualTransactionForm component rendering");

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      description: initialValues.description || "",
      amount: initialValues.amount || "",
      category: initialValues.category || "",
      date: initialValues.date || new Date().toISOString().split('T')[0],
      currency: initialValues.currency || "USD",
      account_id: initialValues.account_id || "",
    },
  });

  const onSubmit = async (data: TransactionFormData) => {
    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to add transactions.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const transactionData = {
        user_id: session.user.id,
        description: data.description,
        amount: parseFloat(data.amount),
        category: data.category || categorizeTransaction(data.description),
        date: data.date,
        currency: data.currency,
        yodlee_account_id: data.account_id === "none" ? null : data.account_id,
      };

      console.log("Submitting transaction:", transactionData);

      const { error } = await supabase
        .from('transactions')
        .insert([transactionData]);

      if (error) {
        console.error("Error inserting transaction:", error);
        throw error;
      }

      console.log("Transaction inserted successfully");
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      toast({
        title: "Transaction Added",
        description: "Your transaction has been added successfully.",
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Transaction description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                    <SelectItem key={category} value={category}>
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

        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code} - {currency.name}
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
          name="account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account (Optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No specific account</SelectItem>
                  <SelectItem value="default">Default Account</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Transaction"}
        </Button>
      </form>
    </Form>
  );
};
