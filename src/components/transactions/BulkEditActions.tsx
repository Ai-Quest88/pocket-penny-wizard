
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Trash2, Edit, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  currency: string;
}

interface BulkEditActionsProps {
  selectedTransactions: Transaction[];
  onClearSelection: () => void;
  onBulkUpdate: () => void;
}

export const BulkEditActions = ({ 
  selectedTransactions, 
  onClearSelection, 
  onBulkUpdate 
}: BulkEditActionsProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [deleteProgress, setDeleteProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    setDeleteProgress(0);
    try {
      const transactionIds = selectedTransactions.map(t => t.id);
      
      // Simulate progress for better UX
      setDeleteProgress(30);
      
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', transactionIds);

      setDeleteProgress(70);

      if (error) {
        console.error('Error deleting transactions:', error);
        toast({
          title: "Error",
          description: "Failed to delete transactions. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setDeleteProgress(90);

      // Invalidate all relevant queries when transactions are deleted
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['account-balances'] });
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
      await queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      await queryClient.invalidateQueries({ queryKey: ['netWorth'] });

      setDeleteProgress(100);

      toast({
        title: "Success",
        description: `${selectedTransactions.length} transactions deleted successfully.`,
      });

      onBulkUpdate();
      onClearSelection();
    } catch (error) {
      console.error('Error deleting transactions:', error);
      toast({
        title: "Error",
        description: "Failed to delete transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteProgress(0);
    }
  };

  const handleBulkCategoryUpdate = async () => {
    if (!newCategory) {
      toast({
        title: "Error",
        description: "Please select a category.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const transactionIds = selectedTransactions.map(t => t.id);
      
      const { error } = await supabase
        .from('transactions')
        .update({ category: newCategory })
        .in('id', transactionIds);

      if (error) {
        console.error('Error updating transactions:', error);
        toast({
          title: "Error",
          description: "Failed to update transactions. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `${selectedTransactions.length} transactions updated successfully.`,
      });

      onBulkUpdate();
      onClearSelection();
      setNewCategory("");
    } catch (error) {
      console.error('Error updating transactions:', error);
      toast({
        title: "Error",
        description: "Failed to update transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (selectedTransactions.length === 0) return null;

  // Comprehensive filtering to prevent empty categories
  const validCategories = ['Groceries', 'Restaurants', 'Gas & Fuel', 'Shopping', 'Entertainment', 'Healthcare', 'Insurance', 'Utilities', 'Transportation', 'Education', 'Travel', 'Gifts & Donations', 'Personal Care', 'Professional Services', 'Home & Garden', 'Electronics', 'Clothing', 'Books', 'Subscriptions', 'Banking', 'Investment', 'Taxes', 'Legal', 'Uncategorized', 'Transfer In', 'Transfer Out', 'Internal Transfer', 'Income', 'Salary', 'Business', 'Freelance', 'Interest', 'Dividends', 'Other Income', 'Rental Income', 'Government Benefits', 'Pension', 'Child Support', 'Alimony', 'Gifts Received', 'Refunds', 'Cryptocurrency', 'Fast Food', 'Public Transport', 'Tolls', 'Food Delivery'].filter(cat => cat && typeof cat === 'string' && cat.trim() !== "");

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {selectedTransactions.length} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="w-[160px] h-8">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {validCategories.map((category) => {
                  // Extra safety check
                  if (!category || category.trim() === "") {
                    console.error("Attempting to render empty category in BulkEditActions:", category);
                    return null;
                  }
                  return (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            <Button
              size="sm"
              onClick={handleBulkCategoryUpdate}
              disabled={isUpdating || !newCategory}
              className="h-8"
            >
              {isUpdating && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {!isUpdating && <Edit className="h-3 w-3 mr-1" />}
              {isUpdating ? "Updating..." : "Update Category"}
            </Button>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                className="h-8"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Transactions</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {selectedTransactions.length} selected transaction{selectedTransactions.length !== 1 ? 's' : ''}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <div className="space-y-3">
                  {isDeleting && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Deleting transactions...</span>
                        <span>{deleteProgress}%</span>
                      </div>
                      <Progress value={deleteProgress} className="w-full" />
                    </div>
                  )}
                  <AlertDialogAction
                    onClick={handleBulkDelete}
                    className="bg-red-600 hover:bg-red-700 text-white w-full"
                    disabled={isDeleting}
                  >
                    {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {isDeleting ? "Deleting..." : "Delete All"}
                  </AlertDialogAction>
                </div>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};
