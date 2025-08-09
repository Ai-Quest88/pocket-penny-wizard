
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { categoryBuckets, CategoryBucket } from "@/types/transaction-forms";
import { TransactionInfo } from "./TransactionInfo";
import { CategorySelect } from "./CategorySelect";
import { CommentField } from "./CommentField";
import { Trash2 } from "lucide-react";
import { addUserCategoryRule } from "@/utils/transactionCategories";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Brain } from "lucide-react";

const editTransactionSchema = z.object({
  category: z.string().min(1, "Please select a category"),
  comment: z.string().optional(),
  createRule: z.boolean().optional(),
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [availableBuckets, setAvailableBuckets] = useState<CategoryBucket[]>(categoryBuckets);

  // Load buckets from Category Manager (localStorage) if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem('categoryGroups');
      if (stored) {
        const groups = JSON.parse(stored);
        if (Array.isArray(groups) && groups.length) {
          const mapped: CategoryBucket[] = groups
            .flatMap((g: any) => Array.isArray(g?.buckets) ? g.buckets : [])
            .map((b: any) => ({
              name: String(b?.name || '').trim(),
              categories: Array.isArray(b?.categories)
                ? b.categories.map((c: any) => String(c?.name || '').trim()).filter((n: string) => n.length > 0)
                : []
            }))
            .filter((b: CategoryBucket) => b.name.length > 0 && b.categories.length > 0);
          if (mapped.length) setAvailableBuckets(mapped);
        }
      }
    } catch (e) {
      console.warn('Failed to load categoryGroups from localStorage:', e);
    }
  }, []);
  const queryClient = useQueryClient();
  
  const isUncategorized = transaction?.category === 'Uncategorized';

  const form = useForm<EditTransactionData>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: {
      category: "",
      comment: "",
      createRule: true, // Default to creating rule for uncategorized transactions
    },
  });

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction) {
      console.log("Resetting form with transaction:", transaction);
      form.reset({
        category: transaction.category || "",
        comment: transaction.comment || "",
        createRule: transaction.category === 'Uncategorized', // Default to true for uncategorized
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

  const handleDelete = async () => {
    if (!transaction) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);

      if (error) {
        console.error('Error deleting transaction:', error);
        toast({
          title: "Error",
          description: "Failed to delete transaction. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Transaction deleted successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const onSubmit = async (data: EditTransactionData) => {
    if (!transaction) return;

    console.log("Submitting transaction update:", data);
    setIsSubmitting(true);

    try {
      // Check if category was changed and user wants to create rule
      if (data.category !== transaction.category && transaction.description && data.createRule) {
        console.log(`Category changed from "${transaction.category}" to "${data.category}" for "${transaction.description}"`);
        
        // Add the user-defined rule for future similar transactions
        addUserCategoryRule(transaction.description, data.category);
        
        toast({
          title: "Smart Learning Applied! 🧠",
          description: `Future transactions similar to "${transaction.description.substring(0, 30)}..." will automatically be categorized as "${data.category}".`,
          duration: 5000,
        });
      }

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Edit Transaction
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this transaction? This action cannot be undone.
                    <br />
                    <br />
                    <strong>{transaction.description}</strong>
                    <br />
                    Amount: ${Math.abs(transaction.amount).toFixed(2)}
                    <br />
                    Date: {new Date(transaction.date).toLocaleDateString()}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <TransactionInfo transaction={transaction} />

              <CategorySelect
                control={form.control}
                name="category"
                availableBuckets={availableBuckets}
                onAddCategory={handleAddCategory}
              />

              <CommentField control={form.control} name="comment" />

              {isUncategorized && (
                <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Checkbox
                    id="createRule"
                    checked={form.watch("createRule")}
                    onCheckedChange={(checked) => form.setValue("createRule", checked as boolean)}
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor="createRule" 
                      className="text-sm font-medium text-blue-900 cursor-pointer flex items-center gap-2"
                    >
                      <Brain className="h-4 w-4" />
                      Create categorization rule
                    </label>
                    <p className="text-xs text-blue-700 mt-1">
                      Future transactions with similar descriptions will be automatically categorized as "{form.watch("category") || "this category"}".
                    </p>
                  </div>
                </div>
              )}

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
