import React, { useState } from 'react';
import { TableCell, TableRow } from '../ui/table';
import { Transaction } from '../TransactionList';
import { formatCurrency, getCurrencyByCode } from '@/utils/currencyUtils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { EditTransactionDialog } from './EditTransactionDialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TransactionTableRowProps {
  transaction: Transaction;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onUpdate: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
  readOnly?: boolean;
  onClick?: (transaction: Transaction) => void;
}

export const TransactionTableRow: React.FC<TransactionTableRowProps> = ({
  transaction,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  readOnly = false,
  onClick
}) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const { displayCurrency, convertAmount } = useCurrency();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (!session?.user?.id) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);

      if (error) throw error;

      onDelete(transaction.id);
      toast({
        title: "Transaction deleted",
        description: "Transaction has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    }
  };

  const getAccountName = (transaction: Transaction) => {
    if (transaction.asset_account_name) return transaction.asset_account_name;
    if (transaction.liability_account_name) return transaction.liability_account_name;
    return 'Unknown Account';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Transfer In':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'Transfer Out':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'Uncategorized':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    }
  };

  const handleRowClick = () => {
    if (onClick) {
      onClick(transaction);
    }
  };

  return (
    <TableRow 
      className={`${isSelected ? 'bg-muted/50' : ''} ${onClick ? 'cursor-pointer hover:bg-muted/30' : ''}`}
      onClick={onClick ? handleRowClick : undefined}
    >
      {!readOnly && (
        <TableCell onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="rounded"
          />
        </TableCell>
      )}
      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
      <TableCell className="max-w-xs truncate" title={transaction.description}>
        {transaction.description}
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className={getCategoryColor(transaction.category)}>
          {transaction.category}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-medium">
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            {transaction.currency !== displayCurrency && (
              <Badge variant="outline" className="text-xs">
                {getCurrencyByCode(transaction.currency)?.symbol || transaction.currency}
              </Badge>
            )}
            <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(transaction.amount, transaction.currency)}
            </span>
          </div>
          {transaction.currency !== displayCurrency && (
            <span className="text-xs text-muted-foreground">
              ≈ {formatCurrency(convertAmount(transaction.amount, transaction.currency), displayCurrency)}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {getAccountName(transaction)}
      </TableCell>
      {!readOnly && (
        <TableCell onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onSelect={(e) => {
                  e.preventDefault();
                  console.log('Edit transaction:', transaction);
                  setEditDialogOpen(true);
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )}
      <EditTransactionDialog
        transaction={transaction}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </TableRow>
  );
};
