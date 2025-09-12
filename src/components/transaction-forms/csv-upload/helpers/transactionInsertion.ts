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

// Mapping of subcategories to their parent groups
const CATEGORY_TO_GROUP_MAPPING: Record<string, string> = {
  // Expense subcategories
  'Transportation': 'Expense',
  'Food & Dining': 'Expense',
  'Shopping': 'Expense',
  'Entertainment': 'Expense',
  'Healthcare': 'Expense',
  'Housing': 'Expense',
  'Government & Tax': 'Expense',
  'Cash Withdrawal': 'Expense',
  
  // Income subcategories
  'Salary': 'Income',
  'Investment Income': 'Income',
  
  // Transfer subcategories
  'Account Transfer': 'Transfer',
  
  // Default to Expense for unknown categories
};

/**
 * Maps a category to its parent group
 */
function getCategoryGroup(category: string): string {
  return CATEGORY_TO_GROUP_MAPPING[category] || 'Expense';
}

export class TransactionInsertionHelper {
  private supabase;
  private userId: string;
  private accessToken: string;
  private systemRulesCache: any[] | null = null;
  private userRulesCache: any[] | null = null;

  constructor(userId: string, accessToken: string) {
    this.supabase = supabase;
    this.userId = userId;
    this.accessToken = accessToken;
    
    // Initialize system rules if needed
    initializeSystemRules(userId).catch(console.error);
  }

  /**
   * Funnel-based categorization: User Rules → System Rules → AI (Optimized)
   */
  async discoverCategories(transactions: TransactionData[]): Promise<CategoryDiscoveryResult[]> {
    try {
      console.log('🚀 Starting optimized funnel categorization for', transactions.length, 'transactions');
      
      // Load rules once at the beginning
      await this.loadRulesCache();
      
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
      console.log('📋 Step 1: Applying cached user-defined rules...');
      for (const transaction of transactions) {
        const userCategory = this.categorizeWithCachedUserRules(transaction);
        if (userCategory) {
          results.push({
            category: userCategory,
            confidence: 0.95,
            is_new_category: false,
            source: 'user_rule',
            group_name: getCategoryGroup(userCategory)
          });
          stats.userRules++;
        } else {
          uncategorizedTransactions.push(transaction);
          results.push(null as any); // Placeholder
        }
      }
      
      console.log(`✅ User rules categorized: ${stats.userRules}/${transactions.length} transactions`);
      
      // Step 2: Try System rules for remaining transactions
      console.log('🔧 Step 2: Applying cached system rules...');
      const systemCategorized: TransactionData[] = [];
      let resultIndex = 0;
      
      for (const transaction of transactions) {
        if (results[resultIndex] === null) {
          const systemCategory = this.categorizeWithCachedSystemRules(transaction);
          if (systemCategory) {
            results[resultIndex] = {
              category: systemCategory,
              confidence: 0.9,
              is_new_category: false,
              source: 'system_rule',
              group_name: getCategoryGroup(systemCategory)
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
        console.log('🤖 Step 3: Applying AI categorization...');
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
   * Load and cache rules to avoid repeated database calls
   */
  private async loadRulesCache() {
    if (!this.userRulesCache) {
      const { data: userRules, error: userError } = await this.supabase
        .from('user_categorization_rules')
        .select('pattern, category, confidence')
        .eq('user_id', this.userId)
        .order('confidence', { ascending: false });

      this.userRulesCache = userError ? [] : (userRules || []);
      console.log(`📋 Loaded ${this.userRulesCache.length} user rules`);
    }

    if (!this.systemRulesCache) {
      const { data: systemRules, error: systemError } = await this.supabase
        .from('system_categorization_rules')
        .select('pattern, category, confidence')
        .eq('is_active', true)
        .order('confidence', { ascending: false });

      this.systemRulesCache = systemError ? [] : (systemRules || []);
      console.log(`🔧 Loaded ${this.systemRulesCache.length} system rules`);
    }
  }

  /**
   * Categorize using cached user rules (no database calls)
   */
  private categorizeWithCachedUserRules(transaction: TransactionData): string | null {
    if (!this.userRulesCache?.length) return null;

    const description = transaction.description.toLowerCase();
    
    for (const rule of this.userRulesCache) {
      const pattern = rule.pattern.toLowerCase();
      
      if (this.matchesPattern(description, pattern)) {
        console.log(`✅ User rule matched: "${pattern}" -> "${rule.category}"`);
        return rule.category;
      }
    }
    
    return null;
  }

  /**
   * Categorize using cached system rules (no database calls)
   */
  private categorizeWithCachedSystemRules(transaction: TransactionData): string | null {
    if (!this.systemRulesCache?.length) return null;

    const description = transaction.description.toLowerCase();
    
    for (const rule of this.systemRulesCache) {
      const pattern = rule.pattern.toLowerCase();
      
      if (this.matchesPattern(description, pattern)) {
        console.log(`✅ System rule matched: "${pattern}" -> "${rule.category}"`);
        return rule.category;
      }
    }
    
    return null;
  }

  /**
   * Improved pattern matching with multiple strategies
   */
  private matchesPattern(description: string, pattern: string): boolean {
    // Strategy 1: Exact substring match
    if (description.includes(pattern)) {
      return true;
    }

    // Strategy 2: Word boundary matching
    const words = description.split(/\s+/);
    for (const word of words) {
      if (word.includes(pattern) || pattern.includes(word)) {
        return true;
      }
    }

    // Strategy 3: Partial matches for common variations
    const cleanDescription = description
      .replace(/\b(pty ltd|ltd|inc|corp|group|store|shop)\b/g, '')
      .replace(/\d+/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
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
      if (patternWord.length >= 3) {
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
   * Enhanced categorization using fallback rules
   */
  private getFallbackCategory(description: string): string {
    const lowerDesc = description.toLowerCase();
    
    // Banking and transfers
    if (lowerDesc.includes('transfer') || lowerDesc.includes('payid') || lowerDesc.includes('bpay')) {
      return 'Transfers';
    }
    
    // ATM and cash
    if (lowerDesc.includes('atm') || lowerDesc.includes('withdrawal') || lowerDesc.includes('cash')) {
      return 'Cash Withdrawal';
    }
    
    // Supermarkets
    if (lowerDesc.includes('woolworths') || lowerDesc.includes('coles') || lowerDesc.includes('aldi') || lowerDesc.includes('iga')) {
      return 'Supermarket';
    }
    
    // Transport
    if (lowerDesc.includes('uber') || lowerDesc.includes('opal') || lowerDesc.includes('transport')) {
      return 'Transport';
    }
    
    return 'Uncategorized';
  }

  async findCategoryByName(categoryName: string): Promise<string | null> {
    try {
      const { data: existingCategory, error: findError } = await this.supabase
        .from('categories')
        .select('id')
        .eq('user_id', this.userId)
        .eq('name', categoryName)
        .maybeSingle();

      if (!findError && existingCategory) {
        return existingCategory.id;
      }

      return null;
    } catch (error) {
      console.error('Error finding/creating category:', error);
      return null;
    }
  }

  async insertTransactions(transactions: TransactionData[], discoveredCategories: CategoryDiscoveryResult[]): Promise<{ success: number; failed: number }> {
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
          console.error('❌ No account reference provided for transaction:', transaction);
          failed++;
          continue;
        }

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
            user_id: this.userId,
            categorization_source: category.source
          });

        if (error) {
          console.error('🚨 Transaction insertion failed:', error);
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

  async processCsvUpload(transactions: TransactionData[]): Promise<{
    success: number;
    failed: number;
    categories_discovered: number;
    new_categories_created: number;
  }> {
    try {
      console.log('Discovering categories with optimized funnel...');
      const discoveredCategories = await this.discoverCategories(transactions);
      
      console.log('Inserting transactions with discovered categories...');
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
}

// Hook for using the transaction insertion helper
export const useTransactionInsertion = () => {
  const { session } = useAuth();
  
  if (!session) {
    throw new Error('User must be authenticated to use transaction insertion');
  }
  
  return new TransactionInsertionHelper(session.user.id, session.access_token);
};
