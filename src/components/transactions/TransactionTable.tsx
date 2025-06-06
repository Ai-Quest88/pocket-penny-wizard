
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { TransactionTableRow } from "./TransactionTableRow";
import { useEffect, useRef } from "react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  currency: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  convertAmount: (amount: number, fromCurrency: string) => number;
  calculateBalance?: (index: number) => number;
  displayCurrency: string;
  currencySymbols: Record<string, string>;
  onTransactionClick: (transaction: Transaction) => void;
  onTransactionDeleted?: () => void;
  selectedTransactions: string[];
  onSelectionChange: (transactionId: string, isSelected: boolean) => void;
  onSelectAll: (isSelected: boolean) => void;
  showBalance?: boolean;
}

export const TransactionTable = ({
  transactions,
  convertAmount,
  calculateBalance,
  displayCurrency,
  currencySymbols,
  onTransactionClick,
  onTransactionDeleted,
  selectedTransactions,
  onSelectionChange,
  onSelectAll,
  showBalance = true,
}: TransactionTableProps) => {
  const allSelected = transactions.length > 0 && selectedTransactions.length === transactions.length;
  const someSelected = selectedTransactions.length > 0 && selectedTransactions.length < transactions.length;
  const checkboxRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      const inputElement = checkboxRef.current.querySelector('input[type="checkbox"]') as HTMLInputElement;
      if (inputElement) {
        inputElement.indeterminate = someSelected;
      }
    }
  }, [someSelected]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8">
            <Checkbox
              ref={checkboxRef}
              checked={allSelected}
              onCheckedChange={onSelectAll}
              aria-label="Select all transactions"
            />
          </TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          {showBalance && <TableHead className="text-right">Balance</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction, index) => {
          const convertedAmount = convertAmount(
            transaction.amount,
            transaction.currency
          );
          const balance = showBalance && calculateBalance ? calculateBalance(index) : 0;
          
          return (
            <TransactionTableRow
              key={transaction.id}
              transaction={transaction}
              index={index}
              convertedAmount={convertedAmount}
              balance={balance}
              displayCurrency={displayCurrency}
              currencySymbols={currencySymbols}
              onTransactionClick={onTransactionClick}
              onTransactionDeleted={onTransactionDeleted}
              isSelected={selectedTransactions.includes(transaction.id)}
              onSelectionChange={onSelectionChange}
              showBalance={showBalance}
            />
          );
        })}
      </TableBody>
    </Table>
  );
};
