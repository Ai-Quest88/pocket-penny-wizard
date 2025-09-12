import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { initializeSystemRules } from '@/utils/systemRulesInitializer';

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
  source: 'user_rule' | 'system_rule' | 'ai' | 'fallback' | 'uncategorized';
}

export class TransactionInsertionHelper {
  private supabase;
  private userId: string;
  private accessToken: string;

  constructor(userId: string, accessToken: string) {
    this.supabase = supabase;
    this.userId = userId;
    this.accessToken = accessToken;
    
    // Initialize system rules if needed
    initializeSystemRules(userId).catch(console.error);
  }

  /**
   * Funnel-based categorization: User Rules → System Rules → AI
   */
  async discoverCategories(transactions: TransactionData[]): Promise<CategoryDiscoveryResult[]> {
    try {
      console.log('🚀 Starting funnel categorization for', transactions.length, 'transactions');
      
      const results: CategoryDiscoveryResult[] = [];
      let uncategorizedTransactions: TransactionData[] = [];
      
      // Track statistics
      const stats = {
        userRules: 0,
        systemRules: 0,
        aiCategorized: 0,
        fallback: 0,
        total: transactions.length
      };
      
      // Step 1: Try User-defined rules first
      console.log('📋 Step 1: Applying user-defined rules...');
      for (const transaction of transactions) {
        const userCategory = await this.categorizeWithUserRules(transaction);
        if (userCategory) {
          results.push({
            category: userCategory,
            confidence: 0.95,
            is_new_category: false,
            source: 'user_rule'
          });
          stats.userRules++;
        } else {
          uncategorizedTransactions.push(transaction);
          results.push(null as any); // Placeholder
        }
      }
      
      console.log(`✅ User rules categorized: ${stats.userRules}/${transactions.length} transactions`);
      
      // Step 2: Try System rules for remaining transactions
      console.log('🔧 Step 2: Applying system rules...');
      const systemCategorized: TransactionData[] = [];
      let resultIndex = 0;
      
      for (const transaction of transactions) {
        if (results[resultIndex] === null) {
          const systemCategory = await this.categorizeWithSystemRules(transaction);
          if (systemCategory) {
            results[resultIndex] = {
              category: systemCategory,
              confidence: 0.9,
              is_new_category: false,
              source: 'system_rule'
            };
            systemCategorized.push(transaction);
            stats.systemRules++;
          }
        }
        resultIndex++;
      }
      
      // Update uncategorized list
      uncategorizedTransactions = uncategorizedTransactions.filter((_, index) => {
        const originalIndex = transactions.findIndex(t => 
          t.description === uncategorizedTransactions[index].description &&
          t.amount === uncategorizedTransactions[index].amount &&
          t.date === uncategorizedTransactions[index].date
        );
        return results[originalIndex] === null;
      });
      
      console.log(`✅ System rules categorized: ${stats.systemRules}/${transactions.length} transactions`);
      console.log(`⏳ Remaining uncategorized: ${uncategorizedTransactions.length} transactions`);
      
      // Step 3: Use AI for remaining uncategorized transactions
      if (uncategorizedTransactions.length > 0) {
        console.log('Step 3: Applying AI categorization...');
        const { data, error } = await this.supabase.functions.invoke('discover-categories', {
          body: { 
            transactions: uncategorizedTransactions.map(t => ({
              description: t.description,
              amount: t.amount,
              date: t.date
            }))
          }
        });

        if (!error && data?.success && data?.categorized_transactions) {
          console.log('✅ AI categorization succeeded');
          let aiResultIndex = 0;
          resultIndex = 0;
          
          for (const transaction of transactions) {
            if (results[resultIndex] === null) {
              const aiResult = data.categorized_transactions[aiResultIndex];
              results[resultIndex] = {
                category: aiResult?.category_name || 'Uncategorized',
                confidence: aiResult?.confidence || 0.8,
                is_new_category: true,
                source: 'ai'
              };
              stats.aiCategorized++;
              aiResultIndex++;
            }
            resultIndex++;
          }
        } else {
          console.log('❌ AI categorization failed, using fallback rules');
          // Use fallback categorization for remaining uncategorized
          resultIndex = 0;
          for (const transaction of transactions) {
            if (results[resultIndex] === null) {
              results[resultIndex] = {
                category: this.getFallbackCategory(transaction.description),
                confidence: 0.6,
                is_new_category: false,
                source: 'fallback'
              };
              stats.fallback++;
            }
            resultIndex++;
          }
        }
      }
      
      // Fill any remaining nulls with 'Uncategorized'
      for (let i = 0; i < results.length; i++) {
        if (results[i] === null) {
          results[i] = {
            category: 'Uncategorized',
            confidence: 0.1,
            is_new_category: false,
            source: 'uncategorized'
          };
          stats.fallback++;
        }
      }

      // Log final statistics
      console.log('📊 CATEGORIZATION SUMMARY:');
      console.log(`   👤 User Rules:     ${stats.userRules} transactions (${(stats.userRules/stats.total*100).toFixed(1)}%)`);
      console.log(`   🔧 System Rules:   ${stats.systemRules} transactions (${(stats.systemRules/stats.total*100).toFixed(1)}%)`);
      console.log(`   🤖 AI Categorized: ${stats.aiCategorized} transactions (${(stats.aiCategorized/stats.total*100).toFixed(1)}%)`);
      console.log(`   📝 Fallback:       ${stats.fallback} transactions (${(stats.fallback/stats.total*100).toFixed(1)}%)`);
      console.log(`   📈 Total:          ${stats.total} transactions`);
      
      console.log('🎉 Funnel categorization completed!');
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
        is_new_category: false,
        source: 'fallback' as const
      }));
    }
  }

  /**
   * Find category in hierarchical system (categories should already be created by AI discovery)
   */
  async findCategoryByName(categoryName: string): Promise<string | null> {
    try {
      // Find existing category by name
      const { data: existingCategory, error: findError } = await this.supabase
        .from('categories')
        .select('id')
        .eq('user_id', this.userId)
        .eq('name', categoryName)
        .maybeSingle();

      if (!findError && existingCategory) {
        console.log(`Found category: ${categoryName} -> ${existingCategory.id}`);
        return existingCategory.id;
      }

      console.log(`Category not found: ${categoryName}, using Uncategorized instead`);
      
      // Instead of creating complex categories, just return null for now
      // This will let transactions be saved without categories
      return null;
    } catch (error) {
      console.error('Error finding/creating category:', error);
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
    try {
      const { data: existing, error: findError } = await this.supabase
        .from('category_groups')
        .select('id')
        .eq('user_id', this.userId)
        .eq('name', name)
        .maybeSingle();

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

      if (createError) {
        console.error('Category group creation error:', createError);
        throw new Error(`Failed to create category group: ${name} - ${createError.message}`);
      }

      if (!newGroup) {
        throw new Error(`Failed to create category group: ${name} - No data returned`);
      }

      return newGroup.id;
    } catch (error) {
      console.error('Error in ensureCategoryGroup:', error);
      throw error;
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
        // Find or create the category
        const categoryId = await this.findCategoryByName(category.category);
        
        console.log(`Inserting transaction ${i + 1}/${transactions.length}:`, {
          description: transaction.description,
          amount: transaction.amount,
          date: transaction.date,
          account_id: transaction.asset_account_id || transaction.liability_account_id,
          category_id: categoryId,
          type: transaction.amount >= 0 ? 'income' : 'expense'
        });

        // Determine the correct account references - no longer need account_id as it's nullable
        const hasAssetAccount = !!transaction.asset_account_id;
        const hasLiabilityAccount = !!transaction.liability_account_id;
        
        if (!hasAssetAccount && !hasLiabilityAccount) {
          console.error('❌ No account reference provided for transaction:', transaction);
          failed++;
          continue;
        }

        // Use the correct database schema for transactions
        const { error } = await this.supabase
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
              category: category.category,
              category_id: categoryId
            }
          });
          failed++;
        } else {
          console.log(`✅ Successfully inserted transaction: ${transaction.description}`);
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

        // Find or create a default category
        const categoryId = await this.findCategoryByName('Uncategorized');
        
        // Determine the correct account references - no longer need account_id as it's nullable
        const hasAssetAccount = !!transaction.asset_account_id;
        const hasLiabilityAccount = !!transaction.liability_account_id;
        
        if (!hasAssetAccount && !hasLiabilityAccount) {
          console.error('❌ No account reference provided for transaction:', transaction);
          failed++;
          continue;
        }

        // Insert if not duplicate
        const { error } = await this.supabase
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
   * Categorize using user-defined rules with improved pattern matching
   */
  private async categorizeWithUserRules(transaction: TransactionData): Promise<string | null> {
    try {
      const { data: userRules, error } = await this.supabase
        .from('user_categorization_rules')
        .select('pattern, category, confidence')
        .eq('user_id', this.userId)
        .order('confidence', { ascending: false });

      if (error || !userRules) {
        console.log('No user rules found:', error);
        return null;
      }

      const description = transaction.description.toLowerCase();
      console.log(`Checking user rules for: "${description}"`);
      
      for (const rule of userRules) {
        const pattern = rule.pattern.toLowerCase();
        
        if (this.matchesPattern(description, pattern)) {
          console.log(`✅ User rule matched: "${pattern}" -> "${rule.category}" for "${description}"`);
          return rule.category;
        }
      }
      
      console.log(`❌ No user rules matched for: "${description}"`);
      return null;
    } catch (error) {
      console.error('Error applying user rules:', error);
      return null;
    }
  }

  /**
   * Categorize using system-defined rules with improved pattern matching
   */
  private async categorizeWithSystemRules(transaction: TransactionData): Promise<string | null> {
    try {
      const { data: systemRules, error } = await this.supabase
        .from('system_categorization_rules')
        .select('pattern, category, confidence')
        .eq('is_active', true)
        .order('confidence', { ascending: false });

      if (error || !systemRules) {
        console.log('No system rules found:', error);
        return null;
      }

      const description = transaction.description.toLowerCase();
      console.log(`Checking system rules for: "${description}"`);
      
      for (const rule of systemRules) {
        const pattern = rule.pattern.toLowerCase();
        
        // Try multiple matching strategies
        if (this.matchesPattern(description, pattern)) {
          console.log(`✅ System rule matched: "${pattern}" -> "${rule.category}" for "${description}"`);
          return rule.category;
        }
      }
      
      console.log(`❌ No system rules matched for: "${description}"`);
      return null;
    } catch (error) {
      console.error('Error applying system rules:', error);
      return null;
    }
  }

  /**
   * Improved pattern matching with multiple strategies
   */
  private matchesPattern(description: string, pattern: string): boolean {
    // Strategy 1: Exact substring match
    if (description.includes(pattern)) {
      return true;
    }

    // Strategy 2: Word boundary matching (e.g., "woolworths" matches "woolworths chatswood")
    const words = description.split(/\s+/);
    for (const word of words) {
      if (word.includes(pattern) || pattern.includes(word)) {
        return true;
      }
    }

    // Strategy 3: Partial matches for common variations
    // Remove common suffixes/prefixes that might interfere
    const cleanDescription = description
      .replace(/\b(pty ltd|ltd|inc|corp|group|store|shop)\b/g, '')
      .replace(/\d+/g, '') // Remove numbers
      .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    const cleanPattern = pattern
      .replace(/\b(pty ltd|ltd|inc|corp|group|store|shop)\b/g, '')
      .replace(/\d+/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanDescription.includes(cleanPattern)) {
      return true;
    }

    // Strategy 4: Check if any word in pattern appears in description
    const patternWords = cleanPattern.split(/\s+/);
    const descWords = cleanDescription.split(/\s+/);
    
    for (const patternWord of patternWords) {
      if (patternWord.length >= 3) { // Only check words with 3+ chars
        for (const descWord of descWords) {
          if (descWord.includes(patternWord) || patternWord.includes(descWord)) {
            return true;
          }
        }
      }
    }

    return false;
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