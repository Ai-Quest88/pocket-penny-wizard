
import { categorizeTransactionWithAI } from './aiCategorization';
import { categories } from '@/types/transaction-forms';
import { supabase } from '@/integrations/supabase/client';

type CategoryRule = {
  keywords: string[];
  category: string;
};

// Store user-defined categorization rules
let userDefinedRules: CategoryRule[] = [];

// Export the comprehensive categories array from transaction-forms
export { categories };

// Minimal essential rules for critical financial categories only
export const categorizeByBuiltInRules = (description: string): string | null => {
  const lowerDesc = description.toLowerCase();
  
  // Only keep absolute essentials that should never be miscategorized
  // Bank transfers - these are critical for financial accuracy
  if (lowerDesc.includes('transfer to') || lowerDesc.includes('transfer from') ||
      lowerDesc.includes('bpay') || lowerDesc.includes('direct credit')) {
    console.log(`Essential rule matched: "${description}" -> Transfer`);
    return 'Transfer';
  }
  
  // Government and tax payments - critical for tax purposes
  if (lowerDesc.includes('revenue') || lowerDesc.includes('tax office') || 
      lowerDesc.includes('ato') || lowerDesc.includes('act revenue') || 
      lowerDesc.includes('nsw revenue') || lowerDesc.includes('vic revenue')) {
    console.log(`Essential rule matched: "${description}" -> Taxes`);
    return 'Taxes';
  }
  
  return null;
};

// Function to find similar existing transactions in the database
const findSimilarTransactionCategory = async (description: string, userId: string): Promise<string | null> => {
  try {
    console.log(`Searching for similar transactions to: "${description}"`);
    
    const { data: similarTransactions, error } = await supabase
      .from('transactions')
      .select('category, description')
      .eq('user_id', userId)
      .ilike('description', `%${description.substring(0, 20)}%`)
      .not('category', 'is', null)
      .not('category', 'eq', 'Miscellaneous')
      .not('category', 'eq', 'Other')
      .not('category', 'eq', 'Banking')
      .limit(5);

    if (error) {
      console.error('Error searching similar transactions:', error);
      return null;
    }

    if (similarTransactions && similarTransactions.length > 0) {
      const categoryCount: Record<string, number> = {};
      
      similarTransactions.forEach(transaction => {
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

    return null;
  } catch (error) {
    console.error('Error in findSimilarTransactionCategory:', error);
    return null;
  }
};

// Function to add a user-defined rule
export const addUserCategoryRule = (description: string, category: string) => {
  const keywords = description
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 3);

  console.log(`Adding user rule: "${keywords.join(', ')}" -> ${category}`);
  
  const existingRule = userDefinedRules.find(rule => 
    rule.category === category && 
    rule.keywords.some(keyword => keywords.includes(keyword))
  );

  if (existingRule) {
    existingRule.keywords = [...new Set([...existingRule.keywords, ...keywords])];
  } else {
    userDefinedRules.push({
      keywords,
      category
    });
  }

  try {
    localStorage.setItem('userCategoryRules', JSON.stringify(userDefinedRules));
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
      console.log('Loaded user category rules:', userDefinedRules);
    }
  } catch (error) {
    console.error('Failed to load user category rules:', error);
    userDefinedRules = [];
  }
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
          return await categorizeTransaction(description, userId);
        } catch (error) {
          console.error(`Failed to categorize "${description}":`, error);
          return categorizeTransactionSync(description);
        }
      })
    );
    
    results.push(...batchResults);
  }
  
  return results;
};

// Main categorization function with correct priority order
export const categorizeTransaction = async (description: string, userId?: string): Promise<string> => {
  console.log(`Categorizing with priority order: "${description}"`);
  
  // Priority 1: User-defined rules (highest priority for user preferences)
  const lowerDescription = description.toLowerCase();
  for (const rule of userDefinedRules) {
    if (rule.keywords.some(keyword => lowerDescription.includes(keyword))) {
      console.log(`Priority 1 - User rule matched: "${description}" -> ${rule.category}`);
      return rule.category;
    }
  }

  // Priority 2: Database lookup (similar past transactions) if userId is provided
  if (userId) {
    const similarCategory = await findSimilarTransactionCategory(description, userId);
    if (similarCategory) {
      console.log(`Priority 2 - Database lookup matched: "${description}" -> ${similarCategory}`);
      return similarCategory;
    }
  }

  // Priority 3: AI categorization (primary method)
  try {
    const aiCategory = await categorizeTransactionWithAI(description);
    console.log(`Priority 3 - AI categorized: "${description}" -> ${aiCategory}`);
    
    if (categories.includes(aiCategory)) {
      return aiCategory;
    }
  } catch (error) {
    console.warn('AI categorization failed, continuing to next priority:', error);
  }

  // Priority 4: Essential built-in rules (only for transfers/taxes)
  const essentialCategory = categorizeByBuiltInRules(description);
  if (essentialCategory) {
    console.log(`Priority 4 - Essential rule matched: "${description}" -> ${essentialCategory}`);
    return essentialCategory;
  }

  // Priority 5: Miscellaneous (fallback)
  console.log(`Priority 5 - Fallback: "${description}" -> Miscellaneous`);
  return 'Miscellaneous';
};

// Synchronous version for backward compatibility
export const categorizeTransactionSync = (description: string): string => {
  // Priority 1: User-defined rules
  const lowerDescription = description.toLowerCase();
  for (const rule of userDefinedRules) {
    if (rule.keywords.some(keyword => lowerDescription.includes(keyword))) {
      console.log(`Sync Priority 1 - User rule matched: "${description}" -> ${rule.category}`);
      return rule.category;
    }
  }
  
  // Priority 2: Essential built-in rules (skip DB and AI in sync mode)
  const essentialCategory = categorizeByBuiltInRules(description);
  if (essentialCategory) {
    console.log(`Sync Priority 2 - Essential rule matched: "${description}" -> ${essentialCategory}`);
    return essentialCategory;
  }
  
  // Priority 3: Miscellaneous (fallback)
  console.log(`Sync Priority 3 - Fallback: "${description}" -> Miscellaneous`);
  return 'Miscellaneous';
};

// Initialize user rules on module load
loadUserCategoryRules();
