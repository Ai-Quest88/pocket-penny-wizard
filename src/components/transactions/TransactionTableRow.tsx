
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
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
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  currency: string;
}

interface TransactionTableRowProps {
  transaction: Transaction;
  index: number;
  convertedAmount: number;
  balance: number;
  displayCurrency: string;
  currencySymbols: Record<string, string>;
  onTransactionClick: (transaction: Transaction) => void;
  onTransactionDeleted?: () => void;
}

export const TransactionTableRow = ({
  transaction,
  convertedAmount,
  balance,
  displayCurrency,
  currencySymbols,
  onTransactionClick,
  onTransactionDeleted,
}: TransactionTableRowProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
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

      // Call the callback to refresh the transaction list
      onTransactionDeleted?.();
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

  return (
    <TableRow 
      key={transaction.id} 
      className="hover:bg-muted/50 transition-colors group"
    >
      <TableCell className="font-medium">
        {new Date(transaction.date).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <div 
          className="cursor-pointer"
          onClick={() => onTransactionClick(transaction)}
        >
          <p className="font-medium">{transaction.description}</p>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="text-xs">
          {transaction.category}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div>
          <p className={cn(
            "font-semibold",
            convertedAmount > 0 ? "text-green-600" : "text-red-600"
          )}>
            {convertedAmount > 0 ? "+" : ""}
            {currencySymbols[displayCurrency]}
            {Math.abs(convertedAmount).toFixed(2)}
          </p>
          {transaction.currency !== displayCurrency && (
            <p className="text-xs text-muted-foreground">
              {currencySymbols[transaction.currency]}{Math.abs(transaction.amount).toFixed(2)}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <p className="font-semibold">
          {currencySymbols[displayCurrency]}
          {Math.abs(balance).toFixed(2)}
        </p>
      </TableCell>
      <TableCell className="text-right">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
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
                Amount: {currencySymbols[transaction.currency]}{Math.abs(transaction.amount).toFixed(2)}
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
      </TableCell>
    </TableRow>
  );
};
