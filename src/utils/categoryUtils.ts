/**
 * Centralized category utilities for consistent categorization logic
 */

import { supabase } from "@/integrations/supabase/client";

export interface CategoryRule {
  pattern: string;
  category: string;
  userId: string;
}

/**
 * Built-in categorization rules for common transaction patterns
 */
export const builtInCategoryRules = [
  // Cash withdrawal patterns (check first)
  { pattern: /atm|withdrawal/i, category: 'Cash Withdrawal' },
  
  // Transfer patterns
  { pattern: /deposit|transfer/i, category: 'Account Transfer' },
  
  // Income patterns
  { pattern: /salary|wage|payroll|employment/i, category: 'Salary' },
  { pattern: /dividend|interest|investment/i, category: 'Investment Income' },
  { pattern: /refund|cashback|rebate/i, category: 'Other Income' },
  
  // Expense patterns
  { pattern: /grocery|supermarket|coles|woolworths|iga/i, category: 'Food & Dining' },
  { pattern: /restaurant|dining|cafe|coffee|mcdonalds|kfc/i, category: 'Food & Dining' },
  { pattern: /fuel|petrol|gas|bp|caltex|shell/i, category: 'Transportation' },
  { pattern: /uber|taxi|transport|train|bus/i, category: 'Transportation' },
  { pattern: /electricity|water|gas|internet|phone/i, category: 'Housing' },
  { pattern: /rent|mortgage|property/i, category: 'Housing' },
  { pattern: /medical|doctor|pharmacy|health/i, category: 'Healthcare' },
  { pattern: /shopping|retail|amazon|ebay/i, category: 'Shopping' },
  { pattern: /entertainment|movie|netflix|spotify/i, category: 'Entertainment' },
];

/**
 * Categorize a transaction description using built-in rules
 */
export const categorizeByBuiltInRules = (description: string): string | null => {
  const lowerDesc = description.toLowerCase();
  
  for (const rule of builtInCategoryRules) {
    if (rule.pattern.test(lowerDesc)) {
      return rule.category;
    }
  }
  
  return null;
};

/**
 * Find similar transaction category from database history
 */
export const findSimilarTransactionCategory = async (
  description: string, 
  userId: string
): Promise<string | null> => {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('category')
      .eq('user_id', userId)
      .ilike('description', `%${description.slice(0, 10)}%`)
      .not('category', 'is', null)
      .limit(1);

    if (error) {
      console.error('Error finding similar transactions:', error);
      return null;
    }

    return transactions?.[0]?.category || null;
  } catch (error) {
    console.error('Error in findSimilarTransactionCategory:', error);
    return null;
  }
};

/**
 * Main categorization function with fallback hierarchy
 */
export const categorizeTransaction = async (
  description: string,
  userId?: string,
  amount?: number
): Promise<string> => {
  // 1. Try built-in rules first (fastest)
  const builtInCategory = categorizeByBuiltInRules(description);
  if (builtInCategory) {
    return builtInCategory;
  }

  // 2. Try database history if user ID is available
  if (userId) {
    const historicalCategory = await findSimilarTransactionCategory(description, userId);
    if (historicalCategory) {
      return historicalCategory;
    }
  }

  // 3. Fallback to uncategorized
  return 'Uncategorized';
};

/**
 * Synchronous version of categorizeTransaction for immediate use
 */
export const categorizeTransactionSync = (
  description: string,
  amount?: number
): string => {
  const builtInCategory = categorizeByBuiltInRules(description);
  return builtInCategory || 'Uncategorized';
};

/**
 * Validate category name format
 */
export const isValidCategoryName = (name: string): boolean => {
  return typeof name === 'string' && 
         name.trim().length > 0 && 
         name.trim().length <= 100 &&
         !/[<>\"'&]/.test(name); // Avoid potentially dangerous characters
};

/**
 * Clean and normalize category name
 */
export const normalizeCategoryName = (name: string): string => {
  return name.trim()
             .replace(/\s+/g, ' ') // Replace multiple spaces with single space
             .replace(/[<>\"'&]/g, '') // Remove dangerous characters
             .slice(0, 100); // Limit length
};