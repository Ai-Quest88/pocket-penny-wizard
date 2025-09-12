/**
 * Initialize system categorization rules in the database
 */

import { supabase } from "@/integrations/supabase/client";

export interface SystemRule {
  pattern: string;
  category: string;
  confidence: number;
  mcc_codes?: string[];
  country?: string;
}

/**
 * Default system categorization rules based on Australian banking patterns
 */
export const defaultSystemRules: SystemRule[] = [
  // ATM and Cash
  { pattern: 'atm', category: 'Cash Withdrawal', confidence: 0.95 },
  { pattern: 'withdrawal', category: 'Cash Withdrawal', confidence: 0.9 },
  { pattern: 'wdl atm', category: 'Cash Withdrawal', confidence: 0.95 },
  
  // Transfers
  { pattern: 'transfer to', category: 'Account Transfer', confidence: 0.95 },
  { pattern: 'transfer from', category: 'Account Transfer', confidence: 0.95 },
  { pattern: 'payid', category: 'Account Transfer', confidence: 0.9 },
  { pattern: 'bpay', category: 'Account Transfer', confidence: 0.9 },
  
  // Income
  { pattern: 'salary', category: 'Salary', confidence: 0.95 },
  { pattern: 'wage', category: 'Salary', confidence: 0.9 },
  { pattern: 'payroll', category: 'Salary', confidence: 0.9 },
  { pattern: 'direct credit', category: 'Salary', confidence: 0.8 },
  { pattern: 'dividend', category: 'Investment Income', confidence: 0.9 },
  { pattern: 'interest', category: 'Investment Income', confidence: 0.8 },
  
  // Groceries & Supermarkets
  { pattern: 'woolworths', category: 'Food & Dining', confidence: 0.95 },
  { pattern: 'coles', category: 'Food & Dining', confidence: 0.95 },
  { pattern: 'iga', category: 'Food & Dining', confidence: 0.95 },
  { pattern: 'aldi', category: 'Food & Dining', confidence: 0.95 },
  { pattern: 'supermarket', category: 'Food & Dining', confidence: 0.9 },
  
  // Restaurants & Cafes
  { pattern: 'mcdonald', category: 'Food & Dining', confidence: 0.9 },
  { pattern: 'kfc', category: 'Food & Dining', confidence: 0.9 },
  { pattern: 'starbucks', category: 'Food & Dining', confidence: 0.9 },
  { pattern: 'coffee', category: 'Food & Dining', confidence: 0.8 },
  { pattern: 'restaurant', category: 'Food & Dining', confidence: 0.8 },
  { pattern: 'cafe', category: 'Food & Dining', confidence: 0.8 },
  
  // Food delivery services (must come before general transportation)
  { pattern: 'uber eats', category: 'Food & Dining', confidence: 0.95 },
  { pattern: 'ubereats', category: 'Food & Dining', confidence: 0.95 },
  { pattern: 'deliveroo', category: 'Food & Dining', confidence: 0.95 },
  { pattern: 'menulog', category: 'Food & Dining', confidence: 0.95 },
  { pattern: 'doordash', category: 'Food & Dining', confidence: 0.95 },
  
  // Fuel & Transportation
  { pattern: 'bp ', category: 'Transportation', confidence: 0.95 },
  { pattern: 'shell', category: 'Transportation', confidence: 0.95 },
  { pattern: 'caltex', category: 'Transportation', confidence: 0.95 },
  { pattern: 'ampol', category: 'Transportation', confidence: 0.95 },
  { pattern: 'petrol', category: 'Transportation', confidence: 0.9 },
  { pattern: 'fuel', category: 'Transportation', confidence: 0.9 },
  { pattern: 'uber', category: 'Transportation', confidence: 0.9 },
  { pattern: 'taxi', category: 'Transportation', confidence: 0.9 },
  
  // Utilities & Housing
  { pattern: 'electricity', category: 'Housing', confidence: 0.9 },
  { pattern: 'water', category: 'Housing', confidence: 0.9 },
  { pattern: 'gas bill', category: 'Housing', confidence: 0.9 },
  { pattern: 'internet', category: 'Housing', confidence: 0.8 },
  { pattern: 'rent', category: 'Housing', confidence: 0.95 },
  { pattern: 'mortgage', category: 'Housing', confidence: 0.95 },
  
  // Telecommunications
  { pattern: 'telstra', category: 'Housing', confidence: 0.9 },
  { pattern: 'optus', category: 'Housing', confidence: 0.9 },
  { pattern: 'vodafone', category: 'Housing', confidence: 0.9 },
  { pattern: 'mobile', category: 'Housing', confidence: 0.8 },
  
  // Healthcare
  { pattern: 'medicare', category: 'Healthcare', confidence: 0.95 },
  { pattern: 'chemist', category: 'Healthcare', confidence: 0.9 },
  { pattern: 'pharmacy', category: 'Healthcare', confidence: 0.9 },
  { pattern: 'doctor', category: 'Healthcare', confidence: 0.9 },
  { pattern: 'medical', category: 'Healthcare', confidence: 0.8 },
  
  // Entertainment
  { pattern: 'netflix', category: 'Entertainment', confidence: 0.95 },
  { pattern: 'spotify', category: 'Entertainment', confidence: 0.95 },
  { pattern: 'amazon prime', category: 'Entertainment', confidence: 0.9 },
  { pattern: 'movie', category: 'Entertainment', confidence: 0.8 },
  
  // Shopping
  { pattern: 'amazon', category: 'Shopping', confidence: 0.8 },
  { pattern: 'ebay', category: 'Shopping', confidence: 0.8 },
  { pattern: 'target', category: 'Shopping', confidence: 0.8 },
  { pattern: 'kmart', category: 'Shopping', confidence: 0.8 },
  
  // Government & Tax
  { pattern: 'ato', category: 'Government & Tax', confidence: 0.95 },
  { pattern: 'council', category: 'Government & Tax', confidence: 0.9 },
  { pattern: 'government', category: 'Government & Tax', confidence: 0.8 },
  { pattern: 'tax office', category: 'Government & Tax', confidence: 0.9 },
];

/**
 * Initialize system categorization rules if the table is empty
 */
export async function initializeSystemRules(userId?: string): Promise<void> {
  try {
    // Check if system rules already exist
    const { data: existingRules, error: checkError } = await supabase
      .from('system_categorization_rules')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking system rules:', checkError);
      return;
    }

    // If rules already exist, don't initialize
    if (existingRules && existingRules.length > 0) {
      console.log('System rules already exist, skipping initialization');
      return;
    }

    console.log('Initializing system categorization rules...');
    
    // Insert default system rules
    const rulesToInsert = defaultSystemRules.map(rule => ({
      pattern: rule.pattern,
      category: rule.category,
      confidence: rule.confidence,
      mcc_codes: rule.mcc_codes || null,
      country: rule.country || 'AU',
      is_active: true,
      conditions: {}
    }));

    const { error: insertError } = await supabase
      .from('system_categorization_rules')
      .insert(rulesToInsert);

    if (insertError) {
      console.error('Error inserting system rules:', insertError);
      return;
    }

    console.log(`Successfully initialized ${defaultSystemRules.length} system categorization rules`);
  } catch (error) {
    console.error('Error initializing system rules:', error);
  }
}