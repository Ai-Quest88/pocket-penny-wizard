
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BudgetCategory {
  category: string;
  spent: number;
  total: number;
}

export const useBudgetData = (entityId?: string, timeframe: string = '3m') => {
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBudgetData = async () => {
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
            startDate.setMonth(now.getMonth() - 12);
            break;
          default:
            startDate.setMonth(now.getMonth() - 3);
        }

        console.log('Fetching transactions for budget from:', startDate.toISOString().split('T')[0]);

        // Fetch transactions from the specified date range
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('*')
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', now.toISOString().split('T')[0]);

        if (error) {
          console.error('Error fetching transactions for budget:', error);
          return;
        }

        console.log('Fetched transactions for budget:', transactions);

        // Group transactions by category and calculate spent amounts
        const categorySpending: Record<string, number> = {};
        
        transactions?.forEach(transaction => {
          // Only include expense categories (negative amounts or expense categories)
          if (transaction.category !== 'Income' && transaction.category !== 'Banking') {
            if (!categorySpending[transaction.category]) {
              categorySpending[transaction.category] = 0;
            }
            // Use absolute value for spending amounts
            categorySpending[transaction.category] += Math.abs(transaction.amount);
          }
        });

        console.log('Category spending:', categorySpending);

        // Define budget limits for each category (you can make this configurable later)
        const budgetLimits: Record<string, number> = {
          'Food': 1000,
          'Transport': 600,
          'Shopping': 800,
          'Bills': 1500,
          'Entertainment': 500,
          'Other': 400,
        };

        // Create budget categories with actual spending data
        const categories = Object.keys(budgetLimits).map(category => ({
          category,
          spent: categorySpending[category] || 0,
          total: budgetLimits[category],
        }));

        setBudgetCategories(categories);
      } catch (error) {
        console.error('Error processing budget data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBudgetData();
  }, [entityId, timeframe]);

  return { budgetCategories, isLoading };
};
