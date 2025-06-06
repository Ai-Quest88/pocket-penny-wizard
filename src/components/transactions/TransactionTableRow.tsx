
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

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
}

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
}: TransactionTableRowProps) => {
  return (
    <TableRow 
      key={transaction.id} 
      className={cn(
        "hover:bg-muted/50 transition-colors group",
        isSelected && "bg-blue-50 hover:bg-blue-100"
      )}
    >
      <TableCell className="w-8">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => 
            onSelectionChange(transaction.id, checked as boolean)
          }
          aria-label="Select transaction"
        />
      </TableCell>
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
      {showBalance && (
        <TableCell className="text-right">
          <p className="font-semibold">
            {currencySymbols[displayCurrency]}
            {Math.abs(balance).toFixed(2)}
          </p>
        </TableCell>
      )}
    </TableRow>
  );
};
