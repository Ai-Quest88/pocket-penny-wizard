
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { fetchExchangeRates } from "@/utils/currencyUtils";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TransactionListHeader } from "./transactions/TransactionListHeader";
import { TransactionTable } from "./transactions/TransactionTable";
import { EditTransactionDialog } from "./transactions/EditTransactionDialog";
import { categorizeTransaction } from "@/utils/transactionCategories";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  currency: string;
}

interface TransactionListProps {
  entityId?: string;
}

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "$"
};

export const TransactionList = ({ entityId }: TransactionListProps) => {
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      console.log('Fetching transactions...');
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }
      
      console.log('Fetched transactions:', data);

      // Only re-categorize transactions that have 'Other' or empty categories
      const transactionsToUpdate = data.filter(
        transaction => !transaction.category || transaction.category === 'Other'
      );

      console.log(`Found ${transactionsToUpdate.length} transactions to re-categorize`);

      if (transactionsToUpdate.length > 0) {
        // Update only the transactions that need re-categorization
        for (const transaction of transactionsToUpdate) {
          const newCategory = categorizeTransaction(transaction.description);
          console.log(`Re-categorizing "${transaction.description}" as: ${newCategory}`);
          
          const { error: updateError } = await supabase
            .from('transactions')
            .update({ category: newCategory })
            .eq('id', transaction.id);

          if (updateError) {
            console.error('Error updating transaction category:', updateError);
          }
        }

        // Return updated data
        return data.map(transaction => {
          if (transactionsToUpdate.find(t => t.id === transaction.id)) {
            return {
              ...transaction,
              category: categorizeTransaction(transaction.description)
            };
          }
          return transaction;
        });
      }

      return data;
    },
  });

  const { data: exchangeRates, isLoading: ratesLoading } = useQuery({
    queryKey: ["exchangeRates", displayCurrency],
    queryFn: () => fetchExchangeRates(displayCurrency),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const convertAmount = (amount: number, fromCurrency: string): number => {
    if (!exchangeRates || fromCurrency === displayCurrency) return amount;
    const rate = exchangeRates[fromCurrency];
    return amount / rate * exchangeRates[displayCurrency];
  };

  // Calculate running balance
  const calculateBalance = (index: number): number => {
    let balance = 0;
    for (let i = transactions.length - 1; i >= index; i--) {
      const convertedAmount = convertAmount(transactions[i].amount, transactions[i].currency);
      balance += convertedAmount;
    }
    return balance;
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="animate-fadeIn">
        <div className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading transactions...</p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    console.error('Transaction loading error:', error);
    return (
      <Card className="animate-fadeIn">
        <div className="p-6">
          <div className="text-center">
            <p className="text-destructive">Error loading transactions</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="animate-fadeIn">
        <TransactionListHeader
          displayCurrency={displayCurrency}
          onCurrencyChange={setDisplayCurrency}
          currencySymbols={currencySymbols}
        />
        <ScrollArea className="h-[400px]">
          <div className="p-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No transactions found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add your first transaction or upload a CSV file to get started
                </p>
              </div>
            ) : (
              <TransactionTable
                transactions={transactions}
                convertAmount={convertAmount}
                calculateBalance={calculateBalance}
                displayCurrency={displayCurrency}
                currencySymbols={currencySymbols}
                onTransactionClick={handleTransactionClick}
              />
            )}
          </div>
        </ScrollArea>
      </Card>

      <EditTransactionDialog
        transaction={selectedTransaction}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </>
  );
};
