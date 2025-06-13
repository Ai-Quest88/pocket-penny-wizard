
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  currency: string;
}

interface CategoryTransactionsListProps {
  category: string;
  timeframe?: string;
}

export const CategoryTransactionsList = ({ category, timeframe = '3m' }: CategoryTransactionsListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    const fetchCategoryTransactions = async () => {
      if (!session?.user) return;
      
      setIsLoading(true);
      try {
        // Calculate date range based on timeframe
        const now = new Date();
        let startDate = new Date();
        
        switch (timeframe) {
          case '1m':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case '3m':
            startDate.setMonth(now.getMonth() - 3);
            break;
          case '6m':
            startDate.setMonth(now.getMonth() - 6);
            break;
          case '12m':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }

        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('category', category)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', now.toISOString().split('T')[0])
          .order('date', { ascending: false });

        if (error) {
          console.error('Error fetching category transactions:', error);
          return;
        }

        setTransactions(data || []);
      } catch (error) {
        console.error('Error processing category transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryTransactions();
  }, [category, timeframe, session?.user]);

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading {category} transactions...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-center py-8">
          <p className="text-muted-foreground">No {category} transactions found</p>
          <p className="text-sm text-muted-foreground mt-2">
            for the selected timeframe
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h4 className="text-lg font-semibold mb-4">{category} Transactions ({transactions.length})</h4>
      <ScrollArea className="h-[300px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="text-sm">
                  {new Date(transaction.date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-sm">{transaction.description}</TableCell>
                <TableCell className="text-right text-sm">
                  <span className={transaction.amount < 0 ? "text-red-600" : "text-green-600"}>
                    ${Math.abs(transaction.amount).toFixed(2)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
};
