
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { categoryBuckets, CategoryBucket } from "@/types/transaction-forms";
import { AddCategoryDialog } from "./AddCategoryDialog";
import { Plus } from "lucide-react";

const editTransactionSchema = z.object({
  category: z.string().min(1, "Please select a category"),
  comment: z.string().optional(),
});

type EditTransactionData = z.infer<typeof editTransactionSchema>;

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  currency: string;
  comment?: string;
}

interface EditTransactionDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditTransactionDialog = ({ transaction, open, onOpenChange }: EditTransactionDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [availableBuckets, setAvailableBuckets] = useState<CategoryBucket[]>(categoryBuckets);
  const queryClient = useQueryClient();

  const form = useForm<EditTransactionData>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: {
      category: "",
      comment: "",
    },
  });

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction) {
      console.log("Resetting form with transaction:", transaction);
      form.reset({
        category: transaction.category || "",
        comment: transaction.comment || "",
      });
    }
  }, [transaction, form]);

  const handleAddCategory = (categoryName: string, bucketName: string) => {
    setAvailableBuckets(prev => 
      prev.map(bucket => 
        bucket.name === bucketName 
          ? { ...bucket, categories: [...bucket.categories, categoryName] }
          : bucket
      )
    );

    // Set the newly added category as selected
    form.setValue("category", categoryName);

    toast({
      title: "Category Added",
      description: `"${categoryName}" has been added to ${bucketName}.`,
    });
  };

  const onSubmit = async (data: EditTransactionData) => {
    if (!transaction) return;

    console.log("Submitting transaction update:", data);
    setIsSubmitting(true);

    try {
      const updateData = {
        category: data.category,
        comment: data.comment || null,
        updated_at: new Date().toISOString(),
      };

      console.log("Update data:", updateData);

      const { data: result, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transaction.id)
        .select();

      if (error) {
        console.error("Supabase error updating transaction:", error);
        throw error;
      }

      console.log("Transaction updated successfully:", result);
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
        description: `Failed to update transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!transaction) return null;

  return (
    <>
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

                <div className="bg-muted p-3 rounded-lg mb-4">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{transaction.description}</p>
                </div>

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Category</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAddCategoryOpen(true)}
                          className="h-8 px-2"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-80">
                          {availableBuckets.map((bucket, bucketIndex) => (
                            <div key={bucket.name}>
                              {bucketIndex > 0 && <div className="h-px bg-border my-1" />}
                              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted/30">
                                {bucket.name}
                              </div>
                              {bucket.categories.map((category) => (
                                <SelectItem key={category} value={category} className="pl-6">
                                  {category}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comment (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add a comment about this transaction..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
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

      <AddCategoryDialog
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onAddCategory={handleAddCategory}
      />
    </>
  );
};
