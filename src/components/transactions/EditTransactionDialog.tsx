
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/types/transaction-forms";

const editTransactionSchema = z.object({
  description: z.string().min(2, "Description must be at least 2 characters"),
  category: z.string().min(1, "Please select a category"),
});

type EditTransactionData = z.infer<typeof editTransactionSchema>;

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  currency: string;
}

interface EditTransactionDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditTransactionDialog = ({ transaction, open, onOpenChange }: EditTransactionDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<EditTransactionData>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: {
      description: transaction?.description || "",
      category: transaction?.category || "",
    },
  });

  // Reset form when transaction changes
  useState(() => {
    if (transaction) {
      form.reset({
        description: transaction.description,
        category: transaction.category,
      });
    }
  });

  const onSubmit = async (data: EditTransactionData) => {
    if (!transaction) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          description: data.description,
          category: data.category,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);

      if (error) {
        console.error("Error updating transaction:", error);
        throw error;
      }

      console.log("Transaction updated successfully");
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      toast({
        title: "Transaction Updated",
        description: "Your transaction has been updated successfully.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast({
        title: "Error",
        description: "Failed to update transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-lg font-semibold">
                    {transaction.amount > 0 ? "+" : ""}
                    ${Math.abs(transaction.amount).toFixed(2)}
                  </p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="text-lg font-semibold">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
              </div>

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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
