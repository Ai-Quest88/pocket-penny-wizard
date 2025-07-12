import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TransactionListHeader } from "./transactions/TransactionListHeader";
import { TransactionTable } from "./transactions/TransactionTable";
import { TransactionSearch } from "./transactions/TransactionSearch";
import { BulkEditActions } from "./transactions/BulkEditActions";
import { EditTransactionDialog } from "./transactions/EditTransactionDialog";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, TrendingUp, TrendingDown } from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  currency: string;
  asset_account_id?: string;
  liability_account_id?: string;
}

interface TransferTransactionListProps {
  searchTerm?: string;
  dateFilter?: string;
}

interface SearchFilters {
  searchTerm: string;
  category: string;
  dateRange: string;
  amountRange: string;
}

export const TransferTransactionList = ({ 
  searchTerm = "", 
  dateFilter = "" 
}: TransferTransactionListProps) => {
  const { displayCurrency, setDisplayCurrency, convertAmount, currencySymbols } = useCurrency();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchTerm: searchTerm,
    category: "Transfer", // Always filter for Transfer category
    dateRange: dateFilter,
    amountRange: ""
  });
  const queryClient = useQueryClient();
  const { session } = useAuth();

  // Update search filters when props change
  useEffect(() => {
    setSearchFilters(prev => ({
      ...prev,
      searchTerm,
      dateRange: dateFilter
    }));
  }, [searchTerm, dateFilter]);

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['transfer-transactions', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) {
        return [];
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('category', 'Transfer') // Only fetch Transfer category transactions
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transfer transactions:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!session?.user,
  });

  // Filter transactions based on search criteria
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (searchFilters.searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchFilters.searchTerm.toLowerCase())
      );
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

  // Analyze potential internal transfers
  const transferAnalysis = useMemo(() => {
    const potentialMatches: Array<{
      positive: Transaction[];
      negative: Transaction[];
      amount: number;
      date: string;
    }> = [];

    // Group transactions by date and amount
    const grouped = new Map<string, { positive: Transaction[]; negative: Transaction[] }>();
    
    filteredTransactions.forEach(transaction => {
      const key = `${transaction.date}-${Math.abs(transaction.amount)}`;
      if (!grouped.has(key)) {
        grouped.set(key, { positive: [], negative: [] });
      }
      
      const group = grouped.get(key)!;
      if (transaction.amount > 0) {
        group.positive.push(transaction);
      } else {
        group.negative.push(transaction);
      }
    });

    // Find potential matches (same amount and date, opposite signs)
    grouped.forEach((group, key) => {
      if (group.positive.length > 0 && group.negative.length > 0) {
        const [date, amount] = key.split('-');
        potentialMatches.push({
          positive: group.positive,
          negative: group.negative,
          amount: parseFloat(amount),
          date
        });
      }
    });

    return {
      totalTransfers: filteredTransactions.length,
      potentialInternalTransfers: potentialMatches.length,
      potentialMatches,
      incomingTransfers: filteredTransactions.filter(t => t.amount > 0).length,
      outgoingTransfers: filteredTransactions.filter(t => t.amount < 0).length,
    };
  }, [filteredTransactions]);

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditDialogOpen(true);
  };

  const handleTransactionDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ['transfer-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
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

  const handleBulkUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['transfer-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  const selectedTransactionObjects = filteredTransactions.filter(t => 
    selectedTransactions.includes(t.id)
  );

  if (!session?.user) {
    return (
      <Card className="animate-fadeIn">
        <div className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground">Please log in to view transfer transactions</p>
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
              <p className="mt-2 text-sm text-muted-foreground">Loading transfer transactions...</p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="animate-fadeIn">
        <div className="p-6">
          <div className="text-center">
            <p className="text-destructive">Error loading transfer transactions</p>
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
      {/* Transfer Analysis Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Total Transfers</p>
              <p className="text-2xl font-bold">{transferAnalysis.totalTransfers}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium">Incoming</p>
              <p className="text-2xl font-bold text-green-600">{transferAnalysis.incomingTransfers}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium">Outgoing</p>
              <p className="text-2xl font-bold text-red-600">{transferAnalysis.outgoingTransfers}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-yellow-600 flex items-center justify-center">
              <span className="text-xs text-white font-bold">!</span>
            </div>
            <div>
              <p className="text-sm font-medium">Potential Internal</p>
              <p className="text-2xl font-bold text-yellow-600">{transferAnalysis.potentialInternalTransfers}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Potential Internal Transfers Alert */}
      {transferAnalysis.potentialInternalTransfers > 0 && (
        <Card className="p-4 mb-6 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-yellow-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-white font-bold">!</span>
            </div>
            <div>
              <h3 className="font-medium text-yellow-900 dark:text-yellow-100">
                Potential Internal Transfers Detected
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Found {transferAnalysis.potentialInternalTransfers} potential internal transfer pairs. 
                These are transactions with matching amounts and dates but opposite signs, which might represent 
                transfers between your own accounts.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="animate-fadeIn">
        <TransactionSearch
          onFiltersChange={setSearchFilters}
          totalResults={filteredTransactions.length}
        />
        <BulkEditActions
          selectedTransactions={selectedTransactionObjects}
          onClearSelection={() => setSelectedTransactions([])}
          onBulkUpdate={handleBulkUpdate}
        />
        <ScrollArea className="h-[400px]">
          <div className="p-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <ArrowLeftRight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No transfer transactions found</p>
                <p className="text-sm text-muted-foreground">
                  Transfer transactions will appear here once you have transactions categorized as "Transfer"
                </p>
              </div>
            ) : (
              <TransactionTable
                transactions={filteredTransactions}
                convertAmount={convertAmount}
                displayCurrency={displayCurrency}
                currencySymbols={currencySymbols}
                onTransactionClick={handleTransactionClick}
                onTransactionDeleted={handleTransactionDeleted}
                selectedTransactions={selectedTransactions}
                onSelectionChange={handleSelectionChange}
                onSelectAll={handleSelectAll}
                showBalance={false}
                readOnly={false}
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