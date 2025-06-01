
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionTableRow } from "./TransactionTableRow";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  currency: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  convertAmount: (amount: number, fromCurrency: string) => number;
  calculateBalance: (index: number) => number;
  displayCurrency: string;
  currencySymbols: Record<string, string>;
}

export const TransactionTable = ({
  transactions,
  convertAmount,
  calculateBalance,
  displayCurrency,
  currencySymbols,
}: TransactionTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Balance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction, index) => {
          const convertedAmount = convertAmount(
            transaction.amount,
            transaction.currency
          );
          const balance = calculateBalance(index);
          
          return (
            <TransactionTableRow
              key={transaction.id}
              transaction={transaction}
              index={index}
              convertedAmount={convertedAmount}
              balance={balance}
              displayCurrency={displayCurrency}
              currencySymbols={currencySymbols}
            />
          );
        })}
      </TableBody>
    </Table>
  );
};
