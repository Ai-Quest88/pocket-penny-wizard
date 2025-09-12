import { supabase } from '@/integrations/supabase/client';
import { TransactionCategorizer } from './TransactionCategorizer';
import type { TransactionData, CategoryDiscoveryResult } from './types';

export class TransactionProcessor {
  private userId: string;
  private categorizer: TransactionCategorizer;

  constructor(userId: string) {
    this.userId = userId;
    this.categorizer = new TransactionCategorizer(userId);
  }

  async processCsvUpload(transactions: TransactionData[]): Promise<{
    success: number;
    failed: number;
    categories_discovered: number;
    new_categories_created: number;
  }> {
    try {
      console.log('🔄 Processing CSV upload with clean categorization flow...');
      
      // Step 1: Categorize all transactions
      const discoveredCategories = await this.categorizer.categorizeTransactions(transactions);
      
      // Step 2: Insert transactions with discovered categories
      const { success, failed } = await this.insertTransactions(transactions, discoveredCategories);
      
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

  private async findCategoryByName(categoryName: string): Promise<string | null> {
    try {
      const { data: existingCategory, error } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', this.userId)
        .eq('name', categoryName)
        .maybeSingle();

      if (!error && existingCategory) {
        return existingCategory.id;
      }

      return null;
    } catch (error) {
      console.error('Error finding category:', error);
      return null;
    }
  }

  private async insertTransactions(
    transactions: TransactionData[], 
    discoveredCategories: CategoryDiscoveryResult[]
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      const category = discoveredCategories[i];

      try {
        const categoryId = await this.findCategoryByName(category.category);
        
        const hasAssetAccount = !!transaction.asset_account_id;
        const hasLiabilityAccount = !!transaction.liability_account_id;
        
        if (!hasAssetAccount && !hasLiabilityAccount) {
          console.error('❌ No account reference provided for transaction:', transaction.description);
          failed++;
          continue;
        }

        const { error } = await supabase
          .from('transactions')
          .insert({
            date: transaction.date,
            description: transaction.description,
            amount: transaction.amount,
            asset_account_id: transaction.asset_account_id || null,
            liability_account_id: transaction.liability_account_id || null,
            category_id: categoryId,
            type: transaction.amount >= 0 ? 'income' : 'expense',
            currency: transaction.currency || 'AUD',
            notes: transaction.comment,
            user_id: this.userId,
            categorization_source: category.source
          });

        if (error) {
          console.error('🚨 Transaction insertion failed:', error);
          failed++;
        } else {
          success++;
        }
      } catch (error) {
        console.error('Transaction insertion error:', error);
        failed++;
      }
    }

    console.log(`✅ Transaction insertion completed: ${success} successful, ${failed} failed`);
    return { success, failed };
  }
}