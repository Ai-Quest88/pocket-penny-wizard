import React from 'react';
import { TableCell, TableRow } from '../ui/table';
import { Transaction } from '../TransactionList';
import { formatCurrency } from '@/utils/currencyUtils';
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
  const { currency } = useCurrency();

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
    // This would need to be enhanced to actually fetch account names
    // For now, just show the account type
    if (transaction.asset_account_id) return 'Asset Account';
    if (transaction.liability_account_id) return 'Liability Account';
    return 'Unknown';
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
        <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
          {formatCurrency(transaction.amount, currency)}
        </span>
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
              <EditTransactionDialog
                transaction={transaction}
                onUpdate={onUpdate}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Edit
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )}
    </TableRow>
  );
};
