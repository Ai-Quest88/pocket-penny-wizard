
import { categorizeTransactionWithAI } from './aiCategorization';

type CategoryRule = {
  keywords: string[];
  category: string;
};

// Store user-defined categorization rules
let userDefinedRules: CategoryRule[] = [];

// Export the categories array - added Grocery
export const categories = [
  'Banking',
  'Food', 
  'Grocery',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Travel',
  'Education',
  'Income',
  'Investment',
  'Other',
  'Gifts', 
  'Charity', 
  'Insurance'
];

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

// Main categorization function that uses AI with user rule priority
export const categorizeTransaction = async (description: string): Promise<string> => {
  // First check user-defined rules (they always take priority)
  const lowerDescription = description.toLowerCase();
  for (const rule of userDefinedRules) {
    if (rule.keywords.some(keyword => lowerDescription.includes(keyword))) {
      console.log(`Matched user rule: "${description}" -> ${rule.category}`);
      return rule.category;
    }
  }

  try {
    // Use AI categorization
    const aiCategory = await categorizeTransactionWithAI(description);
    console.log(`AI categorized: "${description}" -> ${aiCategory}`);
    return aiCategory;
  } catch (error) {
    console.warn('AI categorization failed:', error);
    return 'Other';
  }
};

// Synchronous version for backward compatibility (now returns 'Other' by default)
export const categorizeTransactionSync = (description: string): string => {
  // Check user-defined rules only
  const lowerDescription = description.toLowerCase();
  for (const rule of userDefinedRules) {
    if (rule.keywords.some(keyword => lowerDescription.includes(keyword))) {
      console.log(`Matched user rule (sync): "${description}" -> ${rule.category}`);
      return rule.category;
    }
  }
  
  console.log(`No user rule match found for: "${description}" -> Other`);
  return 'Other';
};

// Initialize user rules on module load
loadUserCategoryRules();
