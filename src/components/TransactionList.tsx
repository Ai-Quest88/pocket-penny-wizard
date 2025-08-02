import React, { useState, useEffect } from 'react';
import { TransactionTable } from './transactions/TransactionTable';
import { TransactionListHeader } from './transactions/TransactionListHeader';
import { BulkEditActions } from './transactions/BulkEditActions';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { useCurrency } from '@/contexts/CurrencyContext';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  currency: string;
  comment?: string;
  asset_account_id?: string;
  liability_account_id?: string;
  created_at?: string;
  updated_at?: string;
  user_id: string;
}

interface SearchFilters {
  searchTerm: string;
  category: string;
  dateRange: string;
  amountRange: string;
}

interface TransactionListProps {
  accountId?: string;
  entityId?: string;
  showBalance?: boolean;
  readOnly?: boolean;
  initialCategoryFilter?: string | string[];
  filterCategory?: string;
  onTransactionSelect?: (transaction: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  accountId,
  entityId,
  showBalance = false,
  readOnly = false,
  initialCategoryFilter,
  filterCategory,
  onTransactionSelect
}) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const { displayCurrency, setDisplayCurrency } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchTerm: "",
    category: Array.isArray(initialCategoryFilter) ? "" : (initialCategoryFilter || filterCategory || ""),
    dateRange: "",
    amountRange: ""
  });

  const fetchTransactions = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      console.log('Fetching transactions for user:', session.user.id);
      
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id);

      if (accountId) {
        query = query.or(`asset_account_id.eq.${accountId},liability_account_id.eq.${accountId}`);
      }

      if (entityId) {
        const { data: accounts, error: accountsError } = await supabase
          .from('assets')
          .select('id')
          .eq('entity_id', entityId);

        if (accountsError) throw accountsError;

        const accountIds = accounts?.map(acc => acc.id) || [];
        if (accountIds.length > 0) {
          query = query.in('asset_account_id', accountIds);
        }
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;

      console.log(`Fetched ${data?.length || 0} transactions`);
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [session?.user?.id, accountId, entityId]);

  const handleTransactionUpdate = (updatedTransaction: Transaction) => {
    setTransactions(prev => 
      prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
    );
  };

  const handleTransactionDelete = (deletedTransactionId: string) => {
    setTransactions(prev => prev.filter(t => t.id !== deletedTransactionId));
    setSelectedTransactions(prev => prev.filter(id => id !== deletedTransactionId));
  };

  const handleBulkUpdate = (updates: Partial<Transaction>) => {
    const updatedTransactions = transactions.map(transaction => 
      selectedTransactions.includes(transaction.id) 
        ? { ...transaction, ...updates }
        : transaction
    );
    setTransactions(updatedTransactions);
    setSelectedTransactions([]);
  };

  const handleTransactionClick = (transaction: Transaction) => {
    if (onTransactionSelect) {
      onTransactionSelect(transaction);
    }
  };

  let filtered = [...transactions];

  if (searchFilters.searchTerm) {
    filtered = filtered.filter(transaction =>
      transaction.description.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchFilters.searchTerm.toLowerCase())
    );
  }

  if (searchFilters.category) {
    filtered = filtered.filter(transaction => transaction.category === searchFilters.category);
  }

  // Handle array-based category filtering (for components that pass multiple categories)
  if (Array.isArray(initialCategoryFilter)) {
    filtered = filtered.filter(transaction => initialCategoryFilter.includes(transaction.category));
  }

  if (searchFilters.dateRange) {
    const now = new Date();
    const startDate = new Date();
    
    switch (searchFilters.dateRange) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    filtered = filtered.filter(transaction => 
      new Date(transaction.date) >= startDate
    );
  }

  if (searchFilters.amountRange) {
    const [min, max] = searchFilters.amountRange.split('-').map(Number);
    filtered = filtered.filter(transaction => {
      const amount = Math.abs(transaction.amount);
      if (max) {
        return amount >= min && amount <= max;
      } else {
        return amount >= min;
      }
    });
  }

  // Handle specific category filter (for pages like UncategorizedTransactions)
  if (filterCategory) {
    filtered = filtered.filter(transaction => transaction.category === filterCategory);
  }

  const totalAmount = filtered.reduce((sum, transaction) => sum + transaction.amount, 0);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <TransactionListHeader
        displayCurrency={displayCurrency}
        onCurrencyChange={setDisplayCurrency}
        searchFilters={searchFilters}
        onSearchFiltersChange={setSearchFilters}
        totalTransactions={filtered.length}
        totalAmount={totalAmount}
        showBalance={showBalance}
      />
      
      {selectedTransactions.length > 0 && (
        <BulkEditActions
          selectedTransactions={filtered.filter(t => selectedTransactions.includes(t.id))}
          onBulkUpdate={() => {
            fetchTransactions();
            setSelectedTransactions([]);
          }}
          onClearSelection={() => setSelectedTransactions([])}
        />
      )}
      
      <TransactionTable
        transactions={filtered}
        selectedTransactions={selectedTransactions}
        onTransactionSelect={setSelectedTransactions}
        onTransactionUpdate={handleTransactionUpdate}
        onTransactionDelete={handleTransactionDelete}
        readOnly={readOnly}
        onTransactionClick={handleTransactionClick}
      />
    </div>
  );
};
