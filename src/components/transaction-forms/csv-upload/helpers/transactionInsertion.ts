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
      
      // Call the discover-categories edge function for AI-powered categorization
      const { data, error } = await this.supabase.functions.invoke('discover-categories', {
        body: { 
          transactions: transactions.map(t => ({
            description: t.description,
            amount: t.amount,
            date: t.date
          }))
        }
      });

      if (error) {
        console.error('AI discovery failed:', error);
        // Fall back to rule-based categorization
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
      }

      // If AI discovery succeeded, process the results
      console.log('AI discovery succeeded:', data);
      
      if (data?.success && data?.categorized_transactions) {
        // Use the actual AI categorization results
        const results = data.categorized_transactions.map((categorizedTransaction: any, index: number) => ({
          category: categorizedTransaction.category_name || 'Uncategorized',
          confidence: categorizedTransaction.confidence || 0.9,
          is_new_category: true
        }));
        
        console.log('AI categorization results:', results);
        return results;
      } else {
        // Fall back to rule-based categorization if AI didn't return expected format
        const results = transactions.map(transaction => {
          const category = this.getFallbackCategory(transaction.description);
          return {
            category,
            confidence: 0.8,
            is_new_category: false
          };
        });

        console.log('Fallback categorization results:', results);
        return results;
      }

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

      console.log(`Category not found: ${categoryName}, creating fallback category`);
      
      // Create appropriate category based on the category name
      let groupId, bucketId;
      
      if (categoryName === 'ATM & Cash Withdrawals') {
        // Create Banking & ATM group and bucket
        groupId = await this.ensureCategoryGroup('Banking & ATM', 'expense', 'ATM withdrawals and banking fees', 'bg-gray-100', '🏧');
        bucketId = await this.ensureCategoryBucket(groupId, 'ATM & Cash', 'ATM withdrawals and cash handling', 'bg-gray-200', '💸');
      } else if (categoryName === 'Groceries') {
        // Create Food & Dining group and grocery bucket
        groupId = await this.ensureCategoryGroup('Food & Dining', 'expense', 'Food and dining expenses', 'bg-green-100', '🍽️');
        bucketId = await this.ensureCategoryBucket(groupId, 'Groceries', 'Supermarket and grocery shopping', 'bg-green-200', '🛒');
      } else if (categoryName === 'Fuel & Transportation') {
        // Create Transportation group and fuel bucket
        groupId = await this.ensureCategoryGroup('Transportation', 'expense', 'Transportation and travel expenses', 'bg-blue-100', '🚗');
        bucketId = await this.ensureCategoryBucket(groupId, 'Fuel', 'Petrol and fuel expenses', 'bg-blue-200', '⛽');
      } else if (categoryName === 'Coffee & Cafes') {
        // Add to Food & Dining group
        groupId = await this.ensureCategoryGroup('Food & Dining', 'expense', 'Food and dining expenses', 'bg-green-100', '🍽️');
        bucketId = await this.ensureCategoryBucket(groupId, 'Coffee & Cafes', 'Coffee shops and cafes', 'bg-amber-200', '☕');
      } else if (categoryName === 'Pharmacy & Health') {
        // Create Health group
        groupId = await this.ensureCategoryGroup('Health & Medical', 'expense', 'Health and medical expenses', 'bg-red-100', '🏥');
        bucketId = await this.ensureCategoryBucket(groupId, 'Pharmacy', 'Pharmacy and health products', 'bg-red-200', '💊');
      } else {
        // Fallback: create in "Uncategorized" bucket (should be rare since AI creates categories)
        groupId = await this.ensureUncategorizedGroup();
        bucketId = await this.ensureUncategorizedBucket(groupId);
      }

      // Create the category
      const { data: newCategory, error: createError } = await this.supabase
        .from('categories')
        .insert({
          user_id: this.userId,
          bucket_id: bucketId,
          name: categoryName,
          description: `Auto-created category for ${categoryName}`,
          merchant_patterns: this.getMerchantPatternsForCategory(categoryName),
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
   * Get merchant patterns for enhanced fallback categories
   */
  private getMerchantPatternsForCategory(categoryName: string): string[] {
    switch (categoryName) {
      case 'ATM & Cash Withdrawals':
        return ['ATM', 'Wdl ATM', 'Withdrawal Fee', 'Cash Out'];
      case 'Groceries':
        return ['ALDI', 'Woolworths', 'Coles', 'IGA'];
      case 'Fuel & Transportation':
        return ['BP ', 'Shell', 'Caltex', 'Ampol', 'Petrol', 'Fuel'];
      case 'Coffee & Cafes':
        return ['Starbucks', 'Coffee', 'Cafe', 'McCafe'];
      case 'Pharmacy & Health':
        return ['Chemist', 'Pharmacy', 'Priceline', 'Terry White'];
      default:
        return [];
    }
  }

  /**
   * Ensure a category group exists or create it
   */
  async ensureCategoryGroup(name: string, type: string, description: string, color: string, icon: string): Promise<string> {
    const { data: existing, error: findError } = await this.supabase
      .from('category_groups')
      .select('id')
      .eq('user_id', this.userId)
      .eq('name', name)
      .limit(1)
      .single();

    if (!findError && existing) {
      return existing.id;
    }

    // Create new group
    const { data: newGroup, error: createError } = await this.supabase
      .from('category_groups')
      .insert({
        user_id: this.userId,
        name: name,
        category_type: type,
        description: description,
        color: color,
        icon: icon,
        sort_order: 0,
        is_ai_generated: false
      })
      .select('id')
      .single();

    if (createError || !newGroup) {
      throw new Error(`Failed to create category group: ${name}`);
    }

    return newGroup.id;
  }

  /**
   * Ensure a category bucket exists or create it
   */
  async ensureCategoryBucket(groupId: string, name: string, description: string, color: string, icon: string): Promise<string> {
    const { data: existing, error: findError } = await this.supabase
      .from('category_buckets')
      .select('id')
      .eq('user_id', this.userId)
      .eq('group_id', groupId)
      .eq('name', name)
      .limit(1)
      .single();

    if (!findError && existing) {
      return existing.id;
    }

    // Create new bucket
    const { data: newBucket, error: createError } = await this.supabase
      .from('category_buckets')
      .insert({
        user_id: this.userId,
        group_id: groupId,
        name: name,
        description: description,
        color: color,
        icon: icon,
        sort_order: 0,
        is_ai_generated: false
      })
      .select('id')
      .single();

    if (createError || !newBucket) {
      throw new Error(`Failed to create category bucket: ${name}`);
    }

    return newBucket.id;
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
        // Use the correct database schema for transactions
        const { error } = await this.supabase
          .from('transactions')
          .insert({
            date: transaction.date,
            description: transaction.description,
            amount: transaction.amount,
            account_id: transaction.asset_account_id || transaction.liability_account_id,
            asset_account_id: transaction.asset_account_id || null,
            liability_account_id: transaction.liability_account_id || null,
            type: transaction.amount >= 0 ? 'income' : 'expense', // Required field
            currency: transaction.currency || 'AUD',
            notes: transaction.comment,
            user_id: this.userId
          });

        if (error) {
          console.error('🚨 Transaction insertion failed:', {
            error: error,
            errorMessage: error.message,
            errorCode: error.code,
            errorDetails: error.details,
            transaction: {
              description: transaction.description,
              amount: transaction.amount,
              asset_account_id: transaction.asset_account_id,
              liability_account_id: transaction.liability_account_id,
              category: category.category
            }
          });
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
            account_id: transaction.asset_account_id || transaction.liability_account_id,
            asset_account_id: transaction.asset_account_id || null,
            liability_account_id: transaction.liability_account_id || null,
            type: transaction.amount >= 0 ? 'income' : 'expense', // Required field
            currency: transaction.currency || 'AUD',
            notes: transaction.comment,
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
    // Transfers
    if (lowerDesc.includes('transfer to') || lowerDesc.includes('transfer from') || 
        lowerDesc.includes('payid') || lowerDesc.includes('bpay') || 
        lowerDesc.includes('commbank app') || lowerDesc.includes('bank transfer')) {
      return 'Transfers';
    }
    
    // Government and tax payments
    if (lowerDesc.includes('revenue') || lowerDesc.includes('tax') || lowerDesc.includes('ato') ||
        lowerDesc.includes('council') || lowerDesc.includes('govt') || lowerDesc.includes('government')) {
      return 'Government & Tax';
    }
    
    // Toll roads
    if (lowerDesc.includes('linkt') || lowerDesc.includes('toll') || lowerDesc.includes('etag') ||
        lowerDesc.includes('e-tag') || lowerDesc.includes('motorway')) {
      return 'Toll Roads';
    }
    
    // Health and insurance
    if (lowerDesc.includes('cbhs') || lowerDesc.includes('medicare') || lowerDesc.includes('health fund') ||
        lowerDesc.includes('insurance') || lowerDesc.includes('medical') || lowerDesc.includes('dental')) {
      return 'Health Insurance';
    }
    
    // Telecommunications  
    if (lowerDesc.includes('telstra') || lowerDesc.includes('optus') || lowerDesc.includes('vodafone') ||
        lowerDesc.includes('mobile') || lowerDesc.includes('internet') || lowerDesc.includes('phone')) {
      return 'Telecommunications';
    }
    
    // Salary and income
    if (lowerDesc.includes('salary') || lowerDesc.includes('wage') || lowerDesc.includes('income') ||
        lowerDesc.includes('direct credit') || lowerDesc.includes('payroll') ||
        (lowerDesc.includes('novel aquatech') || lowerDesc.includes('aquatech'))) {
      return 'Salary';
    }
    
    // Supermarkets and groceries
    if (lowerDesc.includes('woolworths') || lowerDesc.includes('coles') || lowerDesc.includes('iga') || 
        lowerDesc.includes('supermarket') || lowerDesc.includes('groceries') || lowerDesc.includes('grocery')) {
      return 'Supermarket';
    }
    
    // Fuel and transport
    if (lowerDesc.includes('petrol') || lowerDesc.includes('fuel') || lowerDesc.includes('bp') || 
        lowerDesc.includes('shell') || lowerDesc.includes('ampol') || lowerDesc.includes('caltex') ||
        lowerDesc.includes('gas station') || lowerDesc.includes('gas')) {
      return 'Fuel';
    }
    
    // Coffee and cafes
    if (lowerDesc.includes('starbucks') || lowerDesc.includes('coffee') || lowerDesc.includes('cafe')) {
      return 'Coffee Shops';
    }
    
    // Streaming and entertainment
    if (lowerDesc.includes('netflix') || lowerDesc.includes('spotify') || lowerDesc.includes('streaming')) {
      return 'Streaming Services';
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