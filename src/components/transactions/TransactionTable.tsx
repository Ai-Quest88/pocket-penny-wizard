
import React from 'react';
import { TransactionTableRow } from './TransactionTableRow';
import { Transaction } from '../TransactionList';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card } from '../ui/card';

interface TransactionTableProps {
  transactions: Transaction[];
  selectedTransactions: string[];
  onTransactionSelect: (selectedIds: string[]) => void;
  onTransactionUpdate: (transaction: Transaction) => void;
  onTransactionDelete: (transactionId: string) => void;
  readOnly?: boolean;
  onTransactionClick?: (transaction: Transaction) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  selectedTransactions,
  onTransactionSelect,
  onTransactionUpdate,
  onTransactionDelete,
  readOnly = false,
  onTransactionClick
}) => {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onTransactionSelect(transactions.map(t => t.id));
    } else {
      onTransactionSelect([]);
    }
  };

  const handleRowSelect = (transactionId: string, checked: boolean) => {
    if (checked) {
      onTransactionSelect([...selectedTransactions, transactionId]);
    } else {
      onTransactionSelect(selectedTransactions.filter(id => id !== transactionId));
    }
  };

  if (transactions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No transactions found.</p>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            {!readOnly && (
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded"
                />
              </TableHead>
            )}
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Account</TableHead>
            {!readOnly && <TableHead className="w-12"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TransactionTableRow
              key={transaction.id}
              transaction={transaction}
              isSelected={selectedTransactions.includes(transaction.id)}
              onSelect={(checked) => handleRowSelect(transaction.id, checked)}
              onUpdate={onTransactionUpdate}
              onDelete={onTransactionDelete}
              readOnly={readOnly}
              onClick={onTransactionClick}
            />
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
