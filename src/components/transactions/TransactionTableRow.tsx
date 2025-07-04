
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyUtils";

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
  isSelected: boolean;
  onSelectionChange: (transactionId: string, isSelected: boolean) => void;
  showBalance?: boolean;
  readOnly?: boolean;
}

const formatDateForDisplay = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    // Format as DD/MM/YYYY for Australian/UK format
    return date.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return dateString;
  }
};

export const TransactionTableRow = ({
  transaction,
  convertedAmount,
  balance,
  displayCurrency,
  currencySymbols,
  onTransactionClick,
  isSelected,
  onSelectionChange,
  showBalance = true,
  readOnly = false,
}: TransactionTableRowProps) => {
  return (
    <TableRow 
      key={transaction.id} 
      className={cn(
        readOnly ? "hover:bg-muted/30" : "hover:bg-muted/50 transition-colors group",
        isSelected && "bg-blue-50 hover:bg-blue-100"
      )}
    >
      {!readOnly && (
        <TableCell className="w-8">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => 
              onSelectionChange(transaction.id, checked as boolean)
            }
            aria-label="Select transaction"
          />
        </TableCell>
      )}
      <TableCell className="font-medium">
        {formatDateForDisplay(transaction.date)}
      </TableCell>
      <TableCell>
        <div 
          className={readOnly ? "" : "cursor-pointer"}
          onClick={() => !readOnly && onTransactionClick(transaction)}
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
            {formatCurrency(Math.abs(convertedAmount), displayCurrency)}
          </p>
          {transaction.currency !== displayCurrency && (
            <p className="text-xs text-muted-foreground">
              {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
            </p>
          )}
        </div>
      </TableCell>
      {showBalance && (
        <TableCell className="text-right">
          <p className="font-semibold">
            {formatCurrency(Math.abs(balance), displayCurrency)}
          </p>
        </TableCell>
      )}
    </TableRow>
  );
};
