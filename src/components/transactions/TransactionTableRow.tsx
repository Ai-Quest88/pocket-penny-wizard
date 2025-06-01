
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Transaction {
  id: number;
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
}

export const TransactionTableRow = ({
  transaction,
  convertedAmount,
  balance,
  displayCurrency,
  currencySymbols,
}: TransactionTableRowProps) => {
  return (
    <TableRow key={transaction.id}>
      <TableCell className="font-medium">
        {new Date(transaction.date).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{transaction.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {transaction.category}
            </span>
          </div>
        </div>
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
    </TableRow>
  );
};
