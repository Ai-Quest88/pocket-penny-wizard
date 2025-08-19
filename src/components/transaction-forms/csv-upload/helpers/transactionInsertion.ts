import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TransactionData {
  date: string;
  description: string;
  amount: number;
  category?: string;
  comment?: string;
  currency?: string;
  asset_account_id?: string;
  liability_account_id?: string;
}

export interface CategoryDiscoveryResult {
  category: string;
  confidence: number;
  is_new_category: boolean;
  group_name?: string;
  bucket_name?: string;
}

export class TransactionInsertionHelper {
  private supabase;
  private userId: string;

  constructor(userId: string) {
    this.supabase = supabase;
    this.userId = userId;
  }

  /**
   * Discover categories for transactions using AI
   */
  async discoverCategories(transactions: TransactionData[]): Promise<CategoryDiscoveryResult[]> {
    try {
      // Extract unique descriptions for AI analysis
      const uniqueDescriptions = [...new Set(transactions.map(t => t.description))];
      
      const { data: { session } } = await this.supabase.auth.getSession();
      
      const response = await fetch(`https://nqqbvlvuzyctmysablzw.supabase.co/functions/v1/discover-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          descriptions: uniqueDescriptions,
          user_id: this.userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to discover categories');
      }

      const result = await response.json();
      return result.categories;
    } catch (error) {
      console.error('Category discovery failed:', error);
      // Fallback to basic categorization
      return transactions.map(t => ({
        category: this.getFallbackCategory(t.description),
        confidence: 0.5,
        is_new_category: false
      }));
    }
  }

  /**
   * Group discovered categories into logical structure
   */
  async groupCategories(categories: CategoryDiscoveryResult[]): Promise<void> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      
      const response = await fetch(`https://nqqbvlvuzyctmysablzw.supabase.co/functions/v1/group-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          categories: categories,
          user_id: this.userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to group categories');
      }
    } catch (error) {
      console.error('Category grouping failed:', error);
    }
  }

  /**
   * Insert transactions with discovered categories
   */
  async insertTransactions(transactions: TransactionData[], discoveredCategories: CategoryDiscoveryResult[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      const category = discoveredCategories[i];

      try {
        const { error } = await this.supabase
          .from('transactions')
          .insert({
            date: transaction.date,
            description: transaction.description,
            amount: transaction.amount,
            category: category.category,
            comment: transaction.comment,
            currency: transaction.currency || 'AUD',
            asset_account_id: transaction.asset_account_id,
            liability_account_id: transaction.liability_account_id,
            user_id: this.userId
          });

        if (error) {
          console.error('Transaction insertion failed:', error);
          failed++;
        } else {
          success++;
        }
      } catch (error) {
        console.error('Transaction insertion error:', error);
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Insert transactions with duplicate checking
   */
  async insertTransactionsWithDuplicateCheck(transactions: TransactionData[]): Promise<{ success: number; failed: number; duplicates: number }> {
    let success = 0;
    let failed = 0;
    let duplicates = 0;

    for (const transaction of transactions) {
      try {
        // Check for duplicates based on description, amount, and date
        const { data: existingTransactions, error: checkError } = await this.supabase
          .from('transactions')
          .select('id')
          .eq('user_id', this.userId)
          .eq('description', transaction.description)
          .eq('amount', transaction.amount)
          .eq('date', transaction.date)
          .limit(1);

        if (checkError) {
          console.error('Duplicate check failed:', checkError);
          failed++;
          continue;
        }

        if (existingTransactions && existingTransactions.length > 0) {
          duplicates++;
          continue;
        }

        // Insert if not duplicate
        const { error } = await this.supabase
          .from('transactions')
          .insert({
            date: transaction.date,
            description: transaction.description,
            amount: transaction.amount,
            category: transaction.category || 'Uncategorized',
            comment: transaction.comment,
            currency: transaction.currency || 'AUD',
            asset_account_id: transaction.asset_account_id,
            liability_account_id: transaction.liability_account_id,
            user_id: this.userId
          });

        if (error) {
          console.error('Transaction insertion failed:', error);
          failed++;
        } else {
          success++;
        }
      } catch (error) {
        console.error('Transaction insertion error:', error);
        failed++;
      }
    }

    return { success, failed, duplicates };
  }

  /**
   * Process CSV upload with AI category discovery
   */
  async processCsvUpload(transactions: TransactionData[]): Promise<{
    success: number;
    failed: number;
    categories_discovered: number;
    new_categories_created: number;
  }> {
    try {
      // Step 1: Discover categories using AI
      console.log('Discovering categories...');
      const discoveredCategories = await this.discoverCategories(transactions);
      
      // Step 2: Group categories into logical structure
      console.log('Grouping categories...');
      await this.groupCategories(discoveredCategories);
      
      // Step 3: Insert transactions with discovered categories
      console.log('Inserting transactions...');
      const { success, failed } = await this.insertTransactions(transactions, discoveredCategories);
      
      // Count new categories
      const newCategoriesCount = discoveredCategories.filter(c => c.is_new_category).length;
      
      return {
        success,
        failed,
        categories_discovered: discoveredCategories.length,
        new_categories_created: newCategoriesCount
      };
    } catch (error) {
      console.error('CSV upload processing failed:', error);
      throw error;
    }
  }

  /**
   * Fallback category mapping for when AI fails
   */
  private getFallbackCategory(description: string): string {
    const lowerDesc = description.toLowerCase();
    
    // Basic pattern matching
    if (lowerDesc.includes('woolworths') || lowerDesc.includes('coles') || lowerDesc.includes('supermarket')) {
      return 'Groceries';
    }
    if (lowerDesc.includes('petrol') || lowerDesc.includes('fuel') || lowerDesc.includes('bp') || lowerDesc.includes('shell')) {
      return 'Transport';
    }
    if (lowerDesc.includes('netflix') || lowerDesc.includes('spotify') || lowerDesc.includes('streaming')) {
      return 'Entertainment';
    }
    if (lowerDesc.includes('salary') || lowerDesc.includes('wage') || lowerDesc.includes('income')) {
      return 'Income';
    }
    
    return 'Uncategorized';
  }
}

// Hook for using the transaction insertion helper
export const useTransactionInsertion = () => {
  const { session } = useAuth();
  
  if (!session) {
    throw new Error('User must be authenticated to use transaction insertion');
  }
  
  return new TransactionInsertionHelper(session.user.id);
};

// Standalone function for inserting transactions with duplicate checking
export async function insertTransactionsWithDuplicateCheck(transactions: TransactionData[]) {
  const authResult = await supabase.auth.getSession();
  
  if (!authResult.data.session?.user) {
    throw new Error('User must be authenticated');
  }
  
  const helper = new TransactionInsertionHelper(authResult.data.session.user.id);
  return await helper.insertTransactionsWithDuplicateCheck(transactions);
}