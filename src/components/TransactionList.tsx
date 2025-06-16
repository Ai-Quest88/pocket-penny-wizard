import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchExchangeRates } from "@/utils/currencyUtils";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TransactionListHeader } from "./transactions/TransactionListHeader";
import { TransactionTable } from "./transactions/TransactionTable";
import { TransactionSearch } from "./transactions/TransactionSearch";
import { BulkEditActions } from "./transactions/BulkEditActions";
import { EditTransactionDialog } from "./transactions/EditTransactionDialog";
import { categorizeTransaction } from "@/utils/transactionCategories";
import { initializeAIClassifier } from "@/utils/aiCategorization";
import { useAuth } from "@/contexts/AuthContext";

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
  showBalance?: boolean;
  readOnly?: boolean;
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

export const TransactionList = ({ entityId, showBalance = true, readOnly = false }: TransactionListProps) => {
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
  const { session } = useAuth();

  // Initialize AI classifier when component mounts
  useEffect(() => {
    initializeAIClassifier().catch(error => {
      console.warn('Failed to initialize AI classifier:', error);
    });
  }, []);

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['transactions', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) {
        console.log('No authenticated user, returning empty transactions');
        return [];
      }

      console.log('Fetching transactions for user:', session.user.id);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }
      
      console.log('Fetched transactions:', data?.length);

      // Only process transactions that have NO category at all or are completely empty
      // DO NOT re-process transactions that already have any category assigned
      const transactionsToUpdate = data.filter(
        transaction => !transaction.category || transaction.category.trim() === ''
      );

      console.log(`Found ${transactionsToUpdate.length} transactions that need initial categorization`);

      if (transactionsToUpdate.length > 0) {
        // Process only the transactions that actually need updating
        const updatePromises = transactionsToUpdate.map(async (transaction) => {
          const newCategory = await categorizeTransaction(transaction.description, session.user.id);
          console.log(`Initial categorizing "${transaction.description}" to: ${newCategory}`);
          
          // Update the transaction in the database
          const { error: updateError } = await supabase
            .from('transactions')
            .update({ category: newCategory })
            .eq('id', transaction.id);

          if (updateError) {
            console.error('Error updating transaction category:', updateError);
            return transaction;
          }
          
          return { ...transaction, category: newCategory };
        });

        const updatedTransactions = await Promise.all(updatePromises);

        // Return the data with updated categories
        return data.map(transaction => {
          const updatedTransaction = updatedTransactions.find(t => t.id === transaction.id);
          return updatedTransaction || transaction;
        });
      }

      return data;
    },
    enabled: !!session?.user,
  });

  const { data: exchangeRates, isLoading: ratesLoading } = useQuery({
    queryKey: ["exchangeRates", displayCurrency],
    queryFn: () => fetchExchangeRates(displayCurrency),
    staleTime: 1000 * 60 * 60,
  });

  // Filter transactions based on search criteria
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (searchFilters.searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchFilters.searchTerm.toLowerCase())
      );
    }

    if (searchFilters.category) {
      filtered = filtered.filter(transaction => transaction.category === searchFilters.category);
    }

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
    if (!readOnly) {
      setSelectedTransaction(transaction);
      setEditDialogOpen(true);
    }
  };

  const handleTransactionDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['account-balances'] });
    queryClient.invalidateQueries({ queryKey: ['assets'] });
    queryClient.invalidateQueries({ queryKey: ['liabilities'] });
    queryClient.invalidateQueries({ queryKey: ['netWorth'] });
    setSelectedTransactions([]);
  };

  const handleSelectionChange = (transactionId: string, isSelected: boolean) => {
    if (!readOnly) {
      setSelectedTransactions(prev => 
        isSelected 
          ? [...prev, transactionId]
          : prev.filter(id => id !== transactionId)
      );
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (!readOnly) {
      setSelectedTransactions(isSelected ? filteredTransactions.map(t => t.id) : []);
    }
  };

  const handleClearSelection = () => {
    setSelectedTransactions([]);
  };

  const handleBulkUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['account-balances'] });
    queryClient.invalidateQueries({ queryKey: ['assets'] });
    queryClient.invalidateQueries({ queryKey: ['liabilities'] });
    queryClient.invalidateQueries({ queryKey: ['netWorth'] });
  };

  const selectedTransactionObjects = filteredTransactions.filter(t => 
    selectedTransactions.includes(t.id)
  );

  if (!session?.user) {
    return (
      <Card className="animate-fadeIn">
        <div className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground">Please log in to view your transactions</p>
          </div>
        </div>
      </Card>
    );
  }

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
        {showBalance && (
          <TransactionListHeader
            displayCurrency={displayCurrency}
            onCurrencyChange={setDisplayCurrency}
            currencySymbols={currencySymbols}
          />
        )}
        <TransactionSearch
          onFiltersChange={setSearchFilters}
          totalResults={filteredTransactions.length}
        />
        {!readOnly && (
          <BulkEditActions
            selectedTransactions={selectedTransactionObjects}
            onClearSelection={handleClearSelection}
            onBulkUpdate={handleBulkUpdate}
          />
        )}
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
                calculateBalance={showBalance ? calculateBalance : undefined}
                displayCurrency={displayCurrency}
                currencySymbols={currencySymbols}
                onTransactionClick={handleTransactionClick}
                onTransactionDeleted={handleTransactionDeleted}
                selectedTransactions={readOnly ? [] : selectedTransactions}
                onSelectionChange={handleSelectionChange}
                onSelectAll={handleSelectAll}
                showBalance={showBalance}
                readOnly={readOnly}
              />
            )}
          </div>
        </ScrollArea>
      </Card>

      {!readOnly && (
        <EditTransactionDialog
          transaction={selectedTransaction}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}
    </>
  );
};
