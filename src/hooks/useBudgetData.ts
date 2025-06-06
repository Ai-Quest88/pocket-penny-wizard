
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

        // Fetch transactions from the specified date range
        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', now.toISOString().split('T')[0]);

        if (transactionsError) {
          console.error('Error fetching transactions for budget:', transactionsError);
          return;
        }

        console.log('Fetched transactions for budget:', transactions);

        // Fetch active budgets
        let budgetsQuery = supabase
          .from('budgets')
          .select('*')
          .eq('is_active', true);

        if (entityId) {
          budgetsQuery = budgetsQuery.eq('entity_id', entityId);
        }

        const { data: budgets, error: budgetsError } = await budgetsQuery;

        if (budgetsError) {
          console.error('Error fetching budgets:', budgetsError);
          return;
        }

        console.log('Fetched budgets:', budgets);

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

        // Create budget categories with actual budget data
        const categories: BudgetCategory[] = [];

        // Add categories from active budgets
        budgets?.forEach(budget => {
          // Calculate budget amount based on period and timeframe
          let adjustedBudgetAmount = budget.amount;
          
          // Adjust budget amount based on period
          if (budget.period === 'yearly') {
            if (timeframe === '1m') adjustedBudgetAmount = budget.amount / 12;
            else if (timeframe === '3m') adjustedBudgetAmount = budget.amount / 4;
            else if (timeframe === '6m') adjustedBudgetAmount = budget.amount / 2;
          } else if (budget.period === 'quarterly') {
            if (timeframe === '1m') adjustedBudgetAmount = budget.amount / 3;
            else if (timeframe === '6m') adjustedBudgetAmount = budget.amount * 2;
            else if (timeframe === '12m') adjustedBudgetAmount = budget.amount * 4;
          } else { // monthly
            if (timeframe === '3m') adjustedBudgetAmount = budget.amount * 3;
            else if (timeframe === '6m') adjustedBudgetAmount = budget.amount * 6;
            else if (timeframe === '12m') adjustedBudgetAmount = budget.amount * 12;
          }

          categories.push({
            category: budget.category,
            spent: categorySpending[budget.category] || 0,
            total: adjustedBudgetAmount,
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
