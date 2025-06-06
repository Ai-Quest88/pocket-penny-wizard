
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BudgetCategory } from '@/types/budget';

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
        console.log('To date:', now.toISOString().split('T')[0]);

        // Fetch ALL transactions from the specified date range (don't filter by entity here yet)
        const { data: allTransactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', now.toISOString().split('T')[0]);

        if (transactionsError) {
          console.error('Error fetching transactions for budget:', transactionsError);
          return;
        }

        console.log('All fetched transactions for budget:', allTransactions);

        // Fetch active budgets
        let budgetsQuery = supabase
          .from('budgets')
          .select('*')
          .eq('is_active', true);

        // Only filter by entity if a specific entity is selected
        if (entityId && entityId !== 'all') {
          budgetsQuery = budgetsQuery.eq('entity_id', entityId);
        }

        const { data: budgets, error: budgetsError } = await budgetsQuery;

        if (budgetsError) {
          console.error('Error fetching budgets:', budgetsError);
          return;
        }

        console.log('Fetched budgets:', budgets);

        // Filter transactions based on entity selection (if any)
        let transactions = allTransactions || [];
        if (entityId && entityId !== 'all') {
          // If a specific entity is selected, we would need to filter transactions by entity
          // For now, we'll use all transactions since transactions don't have entity_id field
          console.log('Entity filtering not implemented for transactions yet');
        }

        // Group transactions by category and calculate spent amounts
        const categorySpending: Record<string, number> = {};
        
        transactions.forEach(transaction => {
          // Include all expense transactions (exclude only Income)
          if (transaction.category !== 'Income') {
            if (!categorySpending[transaction.category]) {
              categorySpending[transaction.category] = 0;
            }
            // Use absolute value for spending amounts to handle negative amounts
            categorySpending[transaction.category] += Math.abs(Number(transaction.amount));
          }
        });

        console.log('Category spending calculated:', categorySpending);

        // Create budget categories with actual budget data
        const categories: BudgetCategory[] = [];

        // Add categories from active budgets
        budgets?.forEach(budget => {
          // Use the budget amount as-is from the database
          const budgetAmount = Number(budget.amount);
          
          console.log(`Processing budget for ${budget.category}: amount=${budget.amount}, period=${budget.period}`);
          console.log(`Using budget amount as-is: ${budgetAmount}`);

          categories.push({
            category: budget.category,
            spent: categorySpending[budget.category] || 0,
            total: budgetAmount,
            budgetId: budget.id,
          });
        });

        // Add categories with spending but no budget (to show unbudgeted spending)
        Object.keys(categorySpending).forEach(category => {
          if (!categories.find(cat => cat.category === category)) {
            categories.push({
              category,
              spent: categorySpending[category],
              total: 0, // No budget set
            });
          }
        });

        console.log('Final budget categories:', categories);
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
