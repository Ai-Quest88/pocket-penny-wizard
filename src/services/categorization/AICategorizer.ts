import { supabase } from '@/integrations/supabase/client';
import type { TransactionData, CategoryDiscoveryResult } from './types';

export class AICategorizer {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Batch categorize multiple transactions at once to avoid rate limits
   */
  async batchCategorize(transactions: TransactionData[]): Promise<(CategoryDiscoveryResult | null)[]> {
    try {
      console.log(`🤖 AICategorizer: Batch processing ${transactions.length} transactions`);
      
      // Get user context from transactions table
      const userContext = await this.getUserContextFromTransactions();
      
      // Use the categorize-transaction edge function in batch mode
      const { data, error } = await supabase.functions.invoke('categorize-transaction', {
        body: { 
          batchMode: true,
          descriptions: transactions.map(t => t.description),
          userId: this.userId,
          userContext: userContext
        }
      });

      if (!error && data?.categories && Array.isArray(data.categories)) {
        console.log(`✅ AI batch categorization successful: ${data.categories.length} categories returned`);
        
        return data.categories.map((category: string) => ({
          category: category,
          confidence: 0.75,
          is_new_category: true,
          source: 'ai' as const,
          group_name: this.getGroupName(category)
        }));
      }

      console.error('❌ AI batch categorization failed:', error);
      return transactions.map(() => null);
    } catch (error) {
      console.error('AICategorizer batch error:', error);
      return transactions.map(() => null);
    }
  }

  async categorize(transaction: TransactionData): Promise<CategoryDiscoveryResult | null> {
    try {
      console.log(`🤖 AICategorizer: Processing "${transaction.description}"`);
      
      // Get user context from transactions table
      const userContext = await this.getUserContextFromTransactions();
      
      // Use the categorize-transaction edge function
      const { data, error } = await supabase.functions.invoke('categorize-transaction', {
        body: { 
          batchMode: false,
          description: transaction.description,
          amount: transaction.amount,
          date: transaction.date,
          userId: this.userId,
          userContext: userContext
        }
      });

      if (!error && data?.category) {
        console.log(`✅ AI categorization successful: ${data.category}`);
        
        return {
          category: data.category,
          confidence: data.confidence || 0.75,
          is_new_category: true,
          source: 'ai',
          group_name: this.getGroupName(data.category)
        };
      }

      console.error('❌ AI categorization failed:', error);
      return null;
    } catch (error) {
      console.error('AICategorizer error:', error);
      return null;
    }
  }

  private async getUserContextFromTransactions() {
    try {
      // Get user's most used categories from transactions
      const { data, error } = await supabase
        .from('transactions')
        .select('category_id, categories(name)')
        .eq('user_id', this.userId)
        .not('category_id', 'is', null)
        .limit(50);

      if (error || !data) {
        return { mostUsedCategories: [] };
      }

      // Count category usage
      const categoryCounts: Record<string, number> = {};
      data.forEach(tx => {
        const categories = tx.categories as any;
        const categoryName = categories?.name;
        if (categoryName) {
          categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
        }
      });

      // Return most used categories
      const mostUsedCategories = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([category]) => category);

      return { mostUsedCategories };
    } catch (error) {
      console.error('Error getting user context:', error);
      return { mostUsedCategories: [] };
    }
  }

  private getGroupName(categoryName: string): string {
    const groupMapping: Record<string, string> = {
      'Salary': 'Income',
      'Investment Income': 'Income',
      'Transportation': 'Expenses',
      'Food & Dining': 'Expenses',
      'Housing': 'Expenses',
      'Healthcare': 'Expenses',
      'Entertainment': 'Expenses',
      'Account Transfer': 'Transfer',
      'Telecommunications': 'Expenses',
      'Shopping': 'Expenses',
      'Other Expenses': 'Expenses'
    };
    
    return groupMapping[categoryName] || 'Other';
  }
}