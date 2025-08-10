import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/currencyUtils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Transaction } from '@/components/TransactionList';

interface CashFlowTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  month: string;
  type: 'income' | 'expenses';
  totalAmount: number;
}

export const CashFlowTransactionDialog: React.FC<CashFlowTransactionDialogProps> = ({
  isOpen,
  onClose,
  transactions,
  month,
  type,
  totalAmount,
}) => {
  const { displayCurrency } = useCurrency();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'income' ? 'Income' : 'Expenses'} for {month}
            <Badge variant="outline">
              {formatCurrency(totalAmount, displayCurrency)}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found for this period
              </div>
            ) : (
              transactions.map((transaction) => (
                <Card key={transaction.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {transaction.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {transaction.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(transaction.date)}
                          </span>
                          {transaction.asset_account_name && (
                            <span className="text-xs text-muted-foreground">
                              • {transaction.asset_account_name}
                            </span>
                          )}
                          {transaction.liability_account_name && (
                            <span className="text-xs text-muted-foreground">
                              • {transaction.liability_account_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}
                          {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                        </p>
                        {transaction.currency !== displayCurrency && (
                          <p className="text-xs text-muted-foreground">
                            {transaction.currency}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};