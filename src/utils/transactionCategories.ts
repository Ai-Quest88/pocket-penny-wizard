
import { categorizeTransactionWithAI } from './aiCategorization';
import { categories } from '@/types/transaction-forms';

type CategoryRule = {
  keywords: string[];
  category: string;
};

// Store user-defined categorization rules
let userDefinedRules: CategoryRule[] = [];

// Export the comprehensive categories array from transaction-forms
export { categories };

// Enhanced rule-based categorization for common patterns
const categorizeByBuiltInRules = (description: string): string | null => {
  const lowerDesc = description.toLowerCase();
  
  // Australian toll roads and transport - this should catch your Linkt transaction
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
  
  // Australian banks and transfers
  if (lowerDesc.includes('commbank') || lowerDesc.includes('commonwealth bank') ||
      lowerDesc.includes('transfer to') || lowerDesc.includes('transfer from')) {
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

// Batch process transactions with retry logic
export const categorizeBatchTransactions = async (
  descriptions: string[], 
  batchSize: number = 3,
  maxRetries: number = 2
): Promise<string[]> => {
  const results: string[] = [];
  
  console.log(`Starting batch categorization of ${descriptions.length} transactions in batches of ${batchSize}`);
  
  for (let i = 0; i < descriptions.length; i += batchSize) {
    const batch = descriptions.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(descriptions.length / batchSize)}`);
    
    const batchResults = await Promise.all(
      batch.map(async (description, index) => {
        let retryCount = 0;
        
        while (retryCount <= maxRetries) {
          try {
            // Add delay between requests to avoid rate limiting
            if (index > 0 || i > 0) {
              await delay(1000 + (retryCount * 2000)); // Increasing delay with retries
            }
            
            const category = await categorizeTransaction(description);
            return category;
          } catch (error) {
            console.warn(`Retry ${retryCount + 1} for "${description}":`, error);
            retryCount++;
            
            if (retryCount > maxRetries) {
              console.error(`Failed to categorize "${description}" after ${maxRetries} retries, using fallback`);
              return categorizeTransactionSync(description);
            }
            
            // Exponential backoff for retries
            await delay(Math.pow(2, retryCount) * 3000);
          }
        }
        
        return 'Miscellaneous'; // Final fallback
      })
    );
    
    results.push(...batchResults);
    
    // Add delay between batches to be respectful of rate limits
    if (i + batchSize < descriptions.length) {
      console.log('Waiting between batches...');
      await delay(2000);
    }
  }
  
  console.log(`Batch categorization completed. Results: ${results.length} categories assigned`);
  return results;
};

// Main categorization function with enhanced rule checking
export const categorizeTransaction = async (description: string): Promise<string> => {
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

  try {
    // Use AI categorization as fallback
    const aiCategory = await categorizeTransactionWithAI(description);
    console.log(`AI categorized: "${description}" -> ${aiCategory}`);
    return aiCategory;
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
