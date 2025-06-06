
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
import { Trash2, Edit, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { categories } from "@/types/transaction-forms";

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
  const { toast } = useToast();

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const transactionIds = selectedTransactions.map(t => t.id);
      
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', transactionIds);

      if (error) {
        console.error('Error deleting transactions:', error);
        toast({
          title: "Error",
          description: "Failed to delete transactions. Please try again.",
          variant: "destructive",
        });
        return;
      }

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

  // Filter out any empty categories
  const validCategories = categories.filter(cat => cat && cat.trim() !== "");

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
                {validCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              size="sm"
              onClick={handleBulkCategoryUpdate}
              disabled={isUpdating || !newCategory}
              className="h-8"
            >
              <Edit className="h-3 w-3 mr-1" />
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
                <AlertDialogAction
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete All"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};
