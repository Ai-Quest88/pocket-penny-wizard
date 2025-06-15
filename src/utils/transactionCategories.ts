
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

// Enhanced rule-based categorization for common patterns (now exported for direct use)
export const categorizeByBuiltInRules = (description: string): string | null => {
  const lowerDesc = description.toLowerCase();
  
  // Government and tax payments - higher priority
  if (lowerDesc.includes('revenue') || lowerDesc.includes('tax office') || 
      lowerDesc.includes('ato') || lowerDesc.includes('act revenue') || 
      lowerDesc.includes('nsw revenue') || lowerDesc.includes('vic revenue')) {
    console.log(`Built-in rule matched: "${description}" -> Taxes`);
    return 'Taxes';
  }
  
  // Australian toll roads and transport
  if (lowerDesc.includes('linkt') || lowerDesc.includes('e-tag') || lowerDesc.includes('etag') || 
      lowerDesc.includes('transurban') || lowerDesc.includes('toll')) {
    console.log(`Built-in rule matched: "${description}" -> Tolls`);
    return 'Tolls';
  }
  
  // Fuel stations
  if (lowerDesc.includes('caltex') || lowerDesc.includes('shell') || lowerDesc.includes('bp ') || 
      lowerDesc.includes('7-eleven') || lowerDesc.includes('united petroleum') || 
      lowerDesc.includes('mobil') || lowerDesc.includes('ampol') || lowerDesc.includes('fuel') || 
      lowerDesc.includes('petrol') || lowerDesc.includes('gas station')) {
    console.log(`Built-in rule matched: "${description}" -> Gas & Fuel`);
    return 'Gas & Fuel';
  }
  
  // Australian supermarkets
  if (lowerDesc.includes('woolworths') || lowerDesc.includes('coles') || 
      lowerDesc.includes('iga ') || lowerDesc.includes('aldi') || lowerDesc.includes('supermarket')) {
    console.log(`Built-in rule matched: "${description}" -> Groceries`);
    return 'Groceries';
  }
  
  // Bank transfers (not generic banking)
  if (lowerDesc.includes('transfer to') || lowerDesc.includes('transfer from') ||
      lowerDesc.includes('bpay') || lowerDesc.includes('direct credit')) {
    console.log(`Built-in rule matched: "${description}" -> Transfer`);
    return 'Transfer';
  }
  
  // Public transport
  if (lowerDesc.includes('opal') || lowerDesc.includes('myki') || lowerDesc.includes('go card') ||
      lowerDesc.includes('transport') || lowerDesc.includes('train') || lowerDesc.includes('bus')) {
    console.log(`Built-in rule matched: "${description}" -> Public Transport`);
    return 'Public Transport';
  }
  
  return null;
};

// Function to find similar existing transactions in the database
const findSimilarTransactionCategory = async (description: string, userId: string): Promise<string | null> => {
  try {
    console.log(`Searching for similar transactions to: "${description}"`);
    
    // Search for transactions with similar descriptions
    const { data: similarTransactions, error } = await supabase
      .from('transactions')
      .select('category, description')
      .eq('user_id', userId)
      .ilike('description', `%${description.substring(0, 20)}%`) // Match first 20 characters
      .not('category', 'is', null)
      .not('category', 'eq', 'Miscellaneous')
      .not('category', 'eq', 'Other')
      .not('category', 'eq', 'Banking') // Don't use generic Banking as a reference
      .limit(5);

    if (error) {
      console.error('Error searching similar transactions:', error);
      return null;
    }

    if (similarTransactions && similarTransactions.length > 0) {
      // Find the most common category among similar transactions
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
  // Extract meaningful words from the description
  const keywords = description
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2) // Only words longer than 2 characters
    .slice(0, 3); // Take first 3 meaningful words

  console.log(`Adding user rule: "${keywords.join(', ')}" -> ${category}`);
  
  // Check if a similar rule already exists
  const existingRule = userDefinedRules.find(rule => 
    rule.category === category && 
    rule.keywords.some(keyword => keywords.includes(keyword))
  );

  if (existingRule) {
    // Merge keywords with existing rule
    existingRule.keywords = [...new Set([...existingRule.keywords, ...keywords])];
  } else {
    // Add new rule
    userDefinedRules.push({
      keywords,
      category
    });
  }

  // Store in localStorage for persistence
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

// Legacy batch process function (kept for compatibility but not used in optimized flow)
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

// Main categorization function with enhanced rule checking
export const categorizeTransaction = async (description: string, userId?: string): Promise<string> => {
  console.log(`Categorizing: "${description}"`);
  
  // First check built-in rules (highest priority for common patterns)
  const builtInCategory = categorizeByBuiltInRules(description);
  if (builtInCategory) {
    return builtInCategory;
  }
  
  // Then check user-defined rules
  const lowerDescription = description.toLowerCase();
  for (const rule of userDefinedRules) {
    if (rule.keywords.some(keyword => lowerDescription.includes(keyword))) {
      console.log(`Matched user rule: "${description}" -> ${rule.category}`);
      return rule.category;
    }
  }

  // Check existing similar transactions in database if userId is provided
  if (userId) {
    const similarCategory = await findSimilarTransactionCategory(description, userId);
    if (similarCategory) {
      return similarCategory;
    }
  }

  try {
    // Use AI categorization as final fallback
    const aiCategory = await categorizeTransactionWithAI(description);
    console.log(`AI categorized: "${description}" -> ${aiCategory}`);
    
    // Validate that the AI category is in our allowed categories list
    if (categories.includes(aiCategory)) {
      return aiCategory;
    } else {
      console.warn(`AI returned invalid category "${aiCategory}", using Miscellaneous`);
      return 'Miscellaneous';
    }
  } catch (error) {
    console.warn('AI categorization failed:', error);
    return 'Miscellaneous';
  }
};

// Synchronous version for backward compatibility
export const categorizeTransactionSync = (description: string): string => {
  // Check built-in rules first
  const builtInCategory = categorizeByBuiltInRules(description);
  if (builtInCategory) {
    return builtInCategory;
  }
  
  // Check user-defined rules
  const lowerDescription = description.toLowerCase();
  for (const rule of userDefinedRules) {
    if (rule.keywords.some(keyword => lowerDescription.includes(keyword))) {
      console.log(`Matched user rule (sync): "${description}" -> ${rule.category}`);
      return rule.category;
    }
  }
  
  console.log(`No rule match found for: "${description}" -> Miscellaneous`);
  return 'Miscellaneous';
};

// Initialize user rules on module load
loadUserCategoryRules();
