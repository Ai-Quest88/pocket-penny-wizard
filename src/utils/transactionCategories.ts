import { categorizeTransactionWithAI } from './aiCategorization';
import { categories } from '@/types/transaction-forms';
import { supabase } from '@/integrations/supabase/client';

type CategoryRule = {
  keywords: string[];
  category: string;
  description: string; // Store the original description for better matching
  priority: number; // Higher priority = more important
};

// Store user-defined categorization rules
let userDefinedRules: CategoryRule[] = [];

// Export the comprehensive categories array from transaction-forms
export { categories };

// Enhanced essential rules for critical financial categories
export const categorizeByBuiltInRules = (description: string, amount?: number): string | null => {
  const lowerDesc = description.toLowerCase();
  
  // Critical financial categories first - comprehensive transfer detection
  if (lowerDesc.includes('transfer to') || lowerDesc.includes('transfer from') ||
      lowerDesc.includes('bpay') || lowerDesc.includes('direct credit') ||
      lowerDesc.includes('commbank app') || lowerDesc.includes('payid') ||
      lowerDesc.includes('fast transfer') || lowerDesc.includes('bank transfer') ||
      lowerDesc.includes('online transfer') || lowerDesc.includes('mobile transfer') ||
      lowerDesc.includes('internal transfer') || lowerDesc.includes('account transfer') ||
      lowerDesc.includes('fund transfer') || lowerDesc.includes('instant transfer') ||
      lowerDesc.includes('osko') || lowerDesc.includes('npp') ||
      lowerDesc.includes('atm withdrawal') || lowerDesc.includes('wdl atm') ||
      lowerDesc.includes('non cba atm') || lowerDesc.includes('cash withdrawal') ||
      (lowerDesc.includes('transfer') && !lowerDesc.includes('travel')) ||
      (lowerDesc.includes('payment') && lowerDesc.includes('ref:'))) {
    
    if (amount !== undefined) {
      const category = amount > 0 ? 'Transfer In' : 'Transfer Out';
      console.log(`Transfer rule matched: "${description}" (${amount}) -> ${category}`);
      return category;
    } else {
      // Default to Transfer Out for unknown amounts (most transfers are outgoing)
      console.log(`Transfer rule matched: "${description}" -> Transfer Out (fallback)`);
      return 'Transfer Out';
    }
  }
  
  // Government and tax payments - critical for tax purposes
  if (lowerDesc.includes('revenue') || lowerDesc.includes('tax office') || 
      lowerDesc.includes('ato') || lowerDesc.includes('act revenue') || 
      lowerDesc.includes('nsw revenue') || lowerDesc.includes('vic revenue')) {
    console.log(`Essential rule matched: "${description}" -> Taxes`);
    return 'Taxes';
  }

  // Transportation and tolls - MUST come before gas & fuel to prevent misclassification
  if (lowerDesc.includes('linkt') || lowerDesc.includes('toll') ||
      lowerDesc.includes('e-toll') || lowerDesc.includes('etoll') ||
      lowerDesc.includes('citylink') || lowerDesc.includes('eastlink') ||
      lowerDesc.includes('m1 toll') || lowerDesc.includes('m2 toll') ||
      lowerDesc.includes('m4 toll') || lowerDesc.includes('m5 toll') ||
      lowerDesc.includes('m7 toll') || lowerDesc.includes('m8 toll')) {
    console.log(`Essential rule matched: "${description}" -> Tolls`);
    return 'Tolls';
  }

  if (lowerDesc.includes('uber') || lowerDesc.includes('taxi') ||
      lowerDesc.includes('transport') || lowerDesc.includes('opal') ||
      lowerDesc.includes('myki') || lowerDesc.includes('go card')) {
    console.log(`Essential rule matched: "${description}" -> Transportation`);
    return 'Transportation';
  }
  
  return null;
};

// Function to find similar existing transactions in the database
const findSimilarTransactionCategory = async (description: string, userId: string): Promise<string | null> => {
  try {
    console.log(`Searching for similar transactions to: "${description}"`);
    
    // Extract meaningful keywords from the description
    const keywords = description.toLowerCase().split(/[\s\*]+/).filter(word => word.length > 2);
    
    const { data: similarTransactions, error } = await supabase
      .from('transactions')
      .select('category, description')
      .eq('user_id', userId)
      .not('category', 'is', null)
      .not('category', 'eq', 'Uncategorized')
      .not('category', 'eq', 'Other')
      .limit(20);

    if (error) {
      console.error('Error searching similar transactions:', error);
      return null;
    }

    if (similarTransactions && similarTransactions.length > 0) {
      const matches = similarTransactions.filter(transaction => {
        const transactionWords = transaction.description.toLowerCase().split(/[\s\*]+/);
        return keywords.some(keyword => 
          transactionWords.some(word => 
            word.includes(keyword) || keyword.includes(word)
          )
        );
      });

      if (matches.length > 0) {
        const categoryCount: Record<string, number> = {};
        matches.forEach(transaction => {
          if (transaction.category) {
            categoryCount[transaction.category] = (categoryCount[transaction.category] || 0) + 1;
          }
        });

        const mostCommonCategory = Object.entries(categoryCount)
          .sort(([,a], [,b]) => b - a)[0]?.[0];

        if (mostCommonCategory) {
          console.log(`Found similar transaction category: "${description}" -> ${mostCommonCategory}`);
          return mostCommonCategory;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error in findSimilarTransactionCategory:', error);
    return null;
  }
};

// Enhanced function to add a user-defined rule with better matching
export const addUserCategoryRule = (description: string, category: string) => {
  const keywords = description
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace special characters with spaces
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 5); // Take up to 5 most relevant keywords

  console.log(`Adding enhanced user rule: "${keywords.join(', ')}" -> ${category} for "${description}"`);
  
  // Check if we already have a rule for this exact description
  const existingRuleIndex = userDefinedRules.findIndex(rule => 
    rule.description.toLowerCase() === description.toLowerCase()
  );

  if (existingRuleIndex !== -1) {
    // Update existing rule
    userDefinedRules[existingRuleIndex] = {
      keywords,
      category,
      description,
      priority: Date.now() // More recent = higher priority
    };
    console.log(`Updated existing rule for "${description}"`);
  } else {
    // Add new rule
    userDefinedRules.push({
      keywords,
      category,
      description,
      priority: Date.now()
    });
    console.log(`Added new rule for "${description}"`);
  }

  // Sort rules by priority (most recent first)
  userDefinedRules.sort((a, b) => b.priority - a.priority);

  try {
    localStorage.setItem('userCategoryRules', JSON.stringify(userDefinedRules));
    console.log(`Saved ${userDefinedRules.length} user category rules to localStorage`);
  } catch (error) {
    console.error('Failed to save user category rules:', error);
  }
};

// Load user-defined rules from localStorage
export const loadUserCategoryRules = () => {
  try {
    const stored = localStorage.getItem('userCategoryRules');
    if (stored) {
      userDefinedRules = JSON.parse(stored);
      // Ensure rules are sorted by priority
      userDefinedRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      console.log(`Loaded ${userDefinedRules.length} user category rules from localStorage`);
    }
  } catch (error) {
    console.error('Failed to load user category rules:', error);
    userDefinedRules = [];
  }
};

// Enhanced user rule matching with better algorithm
const matchUserDefinedRule = (description: string): string | null => {
  const lowerDescription = description.toLowerCase();
  
  for (const rule of userDefinedRules) {
    // First check for exact description match (highest priority)
    if (rule.description.toLowerCase() === lowerDescription) {
      console.log(`Exact description match: "${description}" -> ${rule.category}`);
      return rule.category;
    }
    
    // Then check for keyword matches (requires at least 2 keywords to match for accuracy)
    const matchingKeywords = rule.keywords.filter(keyword => 
      lowerDescription.includes(keyword)
    );
    
    if (matchingKeywords.length >= Math.min(2, rule.keywords.length)) {
      console.log(`Keyword match (${matchingKeywords.length}/${rule.keywords.length}): "${description}" -> ${rule.category}`);
      return rule.category;
    }
  }
  
  return null;
};

// Utility function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Batch process function with correct priority order
export const categorizeBatchTransactions = async (
  descriptions: string[], 
  userId: string,
  batchSize: number = 20,
  maxRetries: number = 1
): Promise<string[]> => {
  const results: string[] = [];
  
  for (let i = 0; i < descriptions.length; i += batchSize) {
    const batch = descriptions.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(async (description) => {
        try {
          return await categorizeTransaction(description, userId, undefined); // Amount not available in batch processing
        } catch (error) {
          console.error(`Failed to categorize "${description}":`, error);
          return categorizeTransactionSync(description, undefined);
        }
      })
    );
    
    results.push(...batchResults);
  }
  
  return results;
};

// Main categorization function with updated priority order
export const categorizeTransaction = async (description: string, userId?: string, amount?: number): Promise<string> => {
  console.log(`Categorizing with proper rule-then-AI flow: "${description}"`);
  
  // Priority 1: User-defined rules (HIGHEST priority - user preferences override everything)
  const userRuleCategory = matchUserDefinedRule(description);
  if (userRuleCategory) {
    console.log(`Priority 1 - User rule matched: "${description}" -> ${userRuleCategory}`);
    return userRuleCategory;
  }

  // Priority 2: Database lookup (similar past transactions)
  if (userId) {
    const similarCategory = await findSimilarTransactionCategory(description, userId);
    if (similarCategory) {
      console.log(`Priority 2 - Database lookup matched: "${description}" -> ${similarCategory}`);
      return similarCategory;
    }
  }

  // Priority 3: Built-in rules (for specific patterns like transfers, tolls)
  const essentialCategory = categorizeByBuiltInRules(description, amount);
  if (essentialCategory) {
    console.log(`Priority 3 - Built-in rule matched: "${description}" -> ${essentialCategory}`);
    return essentialCategory;
  }

  // Priority 4: AI categorization (fallback when rules fail)
  if (userId) {
    try {
      const { categorizeTransactionWithAI } = await import('@/utils/aiCategorization');
      const aiCategory = await categorizeTransactionWithAI(description);
      console.log(`Priority 4 - AI categorized: "${description}" -> ${aiCategory}`);
      
      // Trust the AI result since it uses the user's actual categories
      if (aiCategory && aiCategory.trim() !== '') {
        return aiCategory;
      }
    } catch (error) {
      console.warn('AI categorization failed, going to fallback:', error);
    }
  }

  // Priority 5: Uncategorized (final fallback)
  console.log(`Priority 5 - Fallback: "${description}" -> Uncategorized`);
  return 'Uncategorized';
};

// Synchronous version for backward compatibility
export const categorizeTransactionSync = (description: string, amount?: number): string => {
  // Priority 1: User-defined rules
  const userRuleCategory = matchUserDefinedRule(description);
  if (userRuleCategory) {
    console.log(`Sync Priority 1 - User rule matched: "${description}" -> ${userRuleCategory}`);
    return userRuleCategory;
  }
  
  // Priority 2: Enhanced built-in rules (skip DB and AI in sync mode)
  const essentialCategory = categorizeByBuiltInRules(description, amount);
  if (essentialCategory) {
    console.log(`Sync Priority 2 - Enhanced built-in rule matched: "${description}" -> ${essentialCategory}`);
    return essentialCategory;
  }
  
  // Priority 3: Uncategorized (fallback)
  console.log(`Sync Priority 3 - Fallback: "${description}" -> Uncategorized`);
  return 'Uncategorized';
};

// Initialize user rules on module load
loadUserCategoryRules();
