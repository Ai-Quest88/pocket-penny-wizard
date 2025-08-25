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
  private accessToken: string;

  constructor(userId: string, accessToken: string) {
    this.supabase = supabase;
    this.userId = userId;
    this.accessToken = accessToken;
  }

  /**
   * Discover categories for transactions using AI
   */
  async discoverCategories(transactions: TransactionData[]): Promise<CategoryDiscoveryResult[]> {
    try {
      console.log('Calling AI category discovery for', transactions.length, 'transactions');
      
      // For now, use rule-based categorization that matches existing system
      const results = transactions.map(transaction => {
        const category = this.getFallbackCategory(transaction.description);
        return {
          category,
          confidence: 0.8,
          is_new_category: false
        };
      });

      console.log('Rule-based categorization results:', results);
      return results;

      /* TODO: Re-enable AI discovery once hierarchical system is working
      const { data, error } = await this.supabase.functions.invoke('discover-categories', {
        body: {
          transactions: transactions.map(t => ({
            description: t.description,
            amount: t.amount,
            date: t.date
          })),
          user_id: this.userId
        },
        headers: {
          authorization: `Bearer ${this.accessToken}`
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'AI category discovery failed');
      }

      console.log('AI discovered categories:', data.categories);
      
      // Convert the hierarchical structure to flat categories for backwards compatibility
      const flatCategories: CategoryDiscoveryResult[] = [];
      
      if (data.categories && Array.isArray(data.categories)) {
        for (const group of data.categories) {
          for (const bucket of group.buckets || []) {
            for (const category of bucket.categories || []) {
              flatCategories.push({
                category: category.name,
                confidence: category.confidence || 0.9,
                is_new_category: true,
                group_name: group.name,
                bucket_name: bucket.name
              });
            }
          }
        }
      }

      console.log('Converted to flat categories:', flatCategories);
      return flatCategories;
      */
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
   * Find category in hierarchical system (categories should already be created by AI discovery)
   */
  async findCategoryByName(categoryName: string): Promise<string | null> {
    try {
      // Find existing category by name - categories should already be created by AI discovery
      const { data: existingCategory, error: findError } = await this.supabase
        .from('categories')
        .select('id')
        .eq('user_id', this.userId)
        .eq('name', categoryName)
        .limit(1)
        .single();

      if (!findError && existingCategory) {
        console.log(`Found AI-created category: ${categoryName} -> ${existingCategory.id}`);
        return existingCategory.id;
      }

      console.log(`Category not found: ${categoryName}, falling back to uncategorized`);
      
      // Fallback: create in "Uncategorized" bucket (should be rare since AI creates categories)
      let uncategorizedGroupId = await this.ensureUncategorizedGroup();
      let uncategorizedBucketId = await this.ensureUncategorizedBucket(uncategorizedGroupId);

      // Create the category
      const { data: newCategory, error: createError } = await this.supabase
        .from('categories')
        .insert({
          user_id: this.userId,
          bucket_id: uncategorizedBucketId,
          name: categoryName,
          description: `Fallback category for ${categoryName}`,
          merchant_patterns: [],
          sort_order: 0,
          is_ai_generated: false
        })
        .select('id')
        .single();

      if (createError || !newCategory) {
        console.error('Failed to create fallback category:', createError);
        return null;
      }

      return newCategory.id;
    } catch (error) {
      console.error('Error finding category:', error);
      return null;
    }
  }

  /**
   * Ensure "Uncategorized" group exists
   */
  async ensureUncategorizedGroup(): Promise<string> {
    const { data: existing, error: findError } = await this.supabase
      .from('category_groups')
      .select('id')
      .eq('user_id', this.userId)
      .eq('name', 'Uncategorized')
      .limit(1)
      .single();

    if (!findError && existing) {
      return existing.id;
    }

    // Create uncategorized group
    const { data: newGroup, error: createError } = await this.supabase
      .from('category_groups')
      .insert({
        user_id: this.userId,
        name: 'Uncategorized',
        category_type: 'expense', // Default to expense
        description: 'Transactions that need manual categorization',
        color: 'bg-gray-100',
        icon: '❓',
        sort_order: 999,
        is_ai_generated: false
      })
      .select('id')
      .single();

    if (createError || !newGroup) {
      throw new Error('Failed to create uncategorized group');
    }

    return newGroup.id;
  }

  /**
   * Ensure "Uncategorized" bucket exists within a group
   */
  async ensureUncategorizedBucket(groupId: string): Promise<string> {
    const { data: existing, error: findError } = await this.supabase
      .from('category_buckets')
      .select('id')
      .eq('user_id', this.userId)
      .eq('group_id', groupId)
      .eq('name', 'Uncategorized')
      .limit(1)
      .single();

    if (!findError && existing) {
      return existing.id;
    }

    // Create uncategorized bucket
    const { data: newBucket, error: createError } = await this.supabase
      .from('category_buckets')
      .insert({
        user_id: this.userId,
        group_id: groupId,
        name: 'Uncategorized',
        description: 'Transactions that need manual categorization',
        color: 'bg-gray-100',
        icon: '❓',
        sort_order: 999,
        is_ai_generated: false
      })
      .select('id')
      .single();

    if (createError || !newBucket) {
      throw new Error('Failed to create uncategorized bucket');
    }

    return newBucket.id;
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
        // Use flat category system (same as existing transactions)
        const { error } = await this.supabase
          .from('transactions')
          .insert({
            date: transaction.date,
            description: transaction.description,
            amount: transaction.amount,
            category_name: category.category || 'Uncategorized',
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
            category_name: transaction.category || 'Uncategorized',
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
      // Step 1: Discover categories using AI (this creates hierarchical structure in DB)
      console.log('Discovering categories with AI...');
      const discoveredCategories = await this.discoverCategories(transactions);
      
      // Step 2: Insert transactions with discovered categories
      console.log('Inserting transactions with AI-discovered categories...');
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
   * Enhanced categorization using the same rules as existing transactions
   */
  private getFallbackCategory(description: string): string {
    const lowerDesc = description.toLowerCase();
    
    // Use the same comprehensive rules as the existing system
    // Supermarkets and groceries
    if (lowerDesc.includes('woolworths') || lowerDesc.includes('coles') || lowerDesc.includes('iga') || 
        lowerDesc.includes('supermarket') || lowerDesc.includes('groceries')) {
      return 'Supermarket';
    }
    
    // Fuel and transport
    if (lowerDesc.includes('petrol') || lowerDesc.includes('fuel') || lowerDesc.includes('bp') || 
        lowerDesc.includes('shell') || lowerDesc.includes('ampol') || lowerDesc.includes('caltex')) {
      return 'Fuel';
    }
    
    // Coffee and cafes
    if (lowerDesc.includes('starbucks') || lowerDesc.includes('coffee') || lowerDesc.includes('cafe')) {
      return 'Coffee';
    }
    
    // Streaming and entertainment
    if (lowerDesc.includes('netflix') || lowerDesc.includes('spotify') || lowerDesc.includes('streaming')) {
      return 'Streaming Services';
    }
    
    // Income and salary
    if (lowerDesc.includes('salary') || lowerDesc.includes('wage') || lowerDesc.includes('income') ||
        lowerDesc.includes('deposit') && !lowerDesc.includes('withdrawal')) {
      return 'Salary';
    }
    
    // Electronics
    if (lowerDesc.includes('jb') || lowerDesc.includes('electronics') || lowerDesc.includes('hi-fi')) {
      return 'Electronics';
    }
    
    // Home and garden
    if (lowerDesc.includes('bunnings') || lowerDesc.includes('warehouse') || lowerDesc.includes('garden')) {
      return 'Home & Garden';
    }
    
    // Fast food
    if (lowerDesc.includes('mcdonald') || lowerDesc.includes('kfc') || lowerDesc.includes('kebab') ||
        lowerDesc.includes('pizza') || lowerDesc.includes('donut')) {
      return 'Fast Food';
    }
    
    // Transport
    if (lowerDesc.includes('opal') || lowerDesc.includes('transport') || lowerDesc.includes('uber')) {
      return 'Public Transport';
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
  
  return new TransactionInsertionHelper(session.user.id, session.access_token);
};

// Standalone function for inserting transactions with duplicate checking
export async function insertTransactionsWithDuplicateCheck(transactions: TransactionData[]) {
  const authResult = await supabase.auth.getSession();
  
  if (!authResult.data.session?.user) {
    throw new Error('User must be authenticated');
  }
  
  const helper = new TransactionInsertionHelper(authResult.data.session.user.id, authResult.data.session.access_token);
  return await helper.insertTransactionsWithDuplicateCheck(transactions);
}