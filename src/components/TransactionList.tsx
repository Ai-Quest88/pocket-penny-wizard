import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchExchangeRates } from "@/utils/currencyUtils";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TransactionListHeader } from "./transactions/TransactionListHeader";
import { TransactionTable } from "./transactions/TransactionTable";
import { TransactionSearch } from "./transactions/TransactionSearch";
import { BulkEditActions } from "./transactions/BulkEditActions";
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

interface SearchFilters {
  searchTerm: string;
  category: string;
  dateRange: string;
  amountRange: string;
}

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "$"
};

export const TransactionList = ({ entityId }: TransactionListProps) => {
  const [displayCurrency, setDisplayCurrency] = useState("AUD");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchTerm: "",
    category: "",
    dateRange: "",
    amountRange: ""
  });
  const queryClient = useQueryClient();

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

  // Filter transactions based on search criteria
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Search by description
    if (searchFilters.searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchFilters.searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (searchFilters.category) {
      filtered = filtered.filter(transaction => transaction.category === searchFilters.category);
    }

    // Filter by date range
    if (searchFilters.dateRange) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        
        switch (searchFilters.dateRange) {
          case 'today':
            return transactionDate >= startOfToday;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return transactionDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            return transactionDate >= monthAgo;
          case 'quarter':
            const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            return transactionDate >= quarterAgo;
          case 'year':
            const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            return transactionDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    // Filter by amount range
    if (searchFilters.amountRange) {
      filtered = filtered.filter(transaction => {
        const amount = Math.abs(transaction.amount);
        
        switch (searchFilters.amountRange) {
          case 'income':
            return transaction.amount > 0;
          case 'expense':
            return transaction.amount < 0;
          case 'small':
            return amount < 100;
          case 'medium':
            return amount >= 100 && amount <= 1000;
          case 'large':
            return amount > 1000;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [transactions, searchFilters]);

  const convertAmount = (amount: number, fromCurrency: string): number => {
    if (!exchangeRates || fromCurrency === displayCurrency) return amount;
    const rate = exchangeRates[fromCurrency];
    return amount / rate * exchangeRates[displayCurrency];
  };

  // Calculate running balance
  const calculateBalance = (index: number): number => {
    let balance = 0;
    for (let i = filteredTransactions.length - 1; i >= index; i--) {
      const convertedAmount = convertAmount(filteredTransactions[i].amount, filteredTransactions[i].currency);
      balance += convertedAmount;
    }
    return balance;
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditDialogOpen(true);
  };

  const handleTransactionDeleted = () => {
    // Invalidate and refetch the transactions query
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    // Clear any selected transactions that might have been deleted
    setSelectedTransactions([]);
  };

  const handleSelectionChange = (transactionId: string, isSelected: boolean) => {
    setSelectedTransactions(prev => 
      isSelected 
        ? [...prev, transactionId]
        : prev.filter(id => id !== transactionId)
    );
  };

  const handleSelectAll = (isSelected: boolean) => {
    setSelectedTransactions(isSelected ? filteredTransactions.map(t => t.id) : []);
  };

  const handleClearSelection = () => {
    setSelectedTransactions([]);
  };

  const handleBulkUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  const selectedTransactionObjects = filteredTransactions.filter(t => 
    selectedTransactions.includes(t.id)
  );

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
        <TransactionSearch
          onFiltersChange={setSearchFilters}
          totalResults={filteredTransactions.length}
        />
        <BulkEditActions
          selectedTransactions={selectedTransactionObjects}
          onClearSelection={handleClearSelection}
          onBulkUpdate={handleBulkUpdate}
        />
        <ScrollArea className="h-[400px]">
          <div className="p-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {transactions.length === 0 ? "No transactions found" : "No transactions match your search criteria"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {transactions.length === 0 
                    ? "Add your first transaction or upload a CSV file to get started"
                    : "Try adjusting your search filters"
                  }
                </p>
              </div>
            ) : (
              <TransactionTable
                transactions={filteredTransactions}
                convertAmount={convertAmount}
                calculateBalance={calculateBalance}
                displayCurrency={displayCurrency}
                currencySymbols={currencySymbols}
                onTransactionClick={handleTransactionClick}
                onTransactionDeleted={handleTransactionDeleted}
                selectedTransactions={selectedTransactions}
                onSelectionChange={handleSelectionChange}
                onSelectAll={handleSelectAll}
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
