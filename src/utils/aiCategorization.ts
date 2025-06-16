
import { categories } from '@/types/transaction-forms';
import { supabase } from '@/integrations/supabase/client';

let isInitialized = false;

// Test Groq API connectivity via edge function
export const testGroqConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Testing Groq API connection via edge function...');
    
    const response = await fetch('https://nqqbvlvuzyctmysablzw.supabase.co/functions/v1/categorize-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcWJ2bHZ1enljdG15c2FibHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzODY0NTIsImV4cCI6MjA1Mzk2MjQ1Mn0.2Z6_5YBxzfsJga8n2vOiTTE3nxPjPpiUcRZe7dpA1V4`
      },
      body: JSON.stringify({
        testMode: true
      })
    });

    console.log('Edge function response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge function error details:', errorText);
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${response.statusText} - ${errorText}` 
      };
    }

    const data = await response.json();
    console.log('Groq API test successful via edge function:', data);
    
    if (data.success) {
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
    
  } catch (error) {
    console.error('Groq connection test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Initialize the Groq classifier
export const initializeAIClassifier = async () => {
  if (isInitialized) return true;
  
  console.log('Groq AI classifier ready (using edge function)');
  isInitialized = true;
  return true;
};

// Find similar transactions in database and return their category
const findSimilarTransactionCategory = async (description: string, userId: string): Promise<string | null> => {
  try {
    console.log(`Searching database for similar transactions to: "${description}"`);
    
    // Extract key words from description for better matching
    const keywords = description.toLowerCase().split(/[\s\*]+/).filter(word => word.length > 2);
    
    // Search for transactions with similar descriptions that have categories
    const { data: similarTransactions, error } = await supabase
      .from('transactions')
      .select('category, description')
      .eq('user_id', userId)
      .not('category', 'is', null)
      .not('category', 'eq', 'Miscellaneous')
      .not('category', 'eq', 'Other')
      .limit(20);

    if (error) {
      console.error('Error searching similar transactions:', error);
      return null;
    }

    if (similarTransactions && similarTransactions.length > 0) {
      // Find transactions that share keywords with current description
      const matches = similarTransactions.filter(transaction => {
        const transactionWords = transaction.description.toLowerCase().split(/[\s\*]+/);
        return keywords.some(keyword => 
          transactionWords.some(word => 
            word.includes(keyword) || keyword.includes(word)
          )
        );
      });

      if (matches.length > 0) {
        // Return the most common category among matches
        const categoryCount: Record<string, number> = {};
        matches.forEach(transaction => {
          if (transaction.category) {
            categoryCount[transaction.category] = (categoryCount[transaction.category] || 0) + 1;
          }
        });

        const mostCommonCategory = Object.entries(categoryCount)
          .sort(([,a], [,b]) => b - a)[0]?.[0];

        if (mostCommonCategory) {
          console.log(`Found similar transaction in DB: "${description}" -> ${mostCommonCategory}`);
          return mostCommonCategory;
        }
      }
    }

    console.log(`No similar transactions found in DB for: "${description}"`);
    return null;
  } catch (error) {
    console.error('Error in findSimilarTransactionCategory:', error);
    return null;
  }
};

// Enhanced built-in rules for fallback
const enhancedBuiltInRules = (description: string): string | null => {
  const lowerDesc = description.toLowerCase();
  
  // Food establishments - expanded patterns
  if (lowerDesc.includes('kebab') || lowerDesc.includes('pizza') || lowerDesc.includes('burger') ||
      lowerDesc.includes('cafe') || lowerDesc.includes('coffee') || lowerDesc.includes('restaurant') ||
      lowerDesc.includes('bakery') || lowerDesc.includes('bake') || lowerDesc.includes('donut') ||
      lowerDesc.includes('mcdonalds') || lowerDesc.includes('kfc') || lowerDesc.includes('subway') ||
      lowerDesc.includes('dominos') || lowerDesc.includes('hungry jacks') || lowerDesc.includes('red rooster')) {
    return 'Restaurants';
  }
  
  // Fast food chains and takeaway prefixes
  if (lowerDesc.includes('smp*') && (lowerDesc.includes('kebab') || lowerDesc.includes('bake') || 
      lowerDesc.includes('pizza') || lowerDesc.includes('burger'))) {
    return 'Fast Food';
  }
  
  // Australian toll roads and transport
  if (lowerDesc.includes('linkt') || lowerDesc.includes('e-tag') || lowerDesc.includes('etag')) {
    return 'Tolls';
  }
  
  // Fuel stations
  if (lowerDesc.includes('caltex') || lowerDesc.includes('shell') || lowerDesc.includes('bp ') || 
      lowerDesc.includes('7-eleven') || lowerDesc.includes('united petroleum') || 
      lowerDesc.includes('mobil') || lowerDesc.includes('ampol')) {
    return 'Gas & Fuel';
  }
  
  // Australian supermarkets
  if (lowerDesc.includes('woolworths') || lowerDesc.includes('coles') || 
      lowerDesc.includes('iga ') || lowerDesc.includes('aldi')) {
    return 'Groceries';
  }
  
  return null;
};

// Smart delay with exponential backoff for rate limiting
const smartDelay = (attempt: number, baseDelay: number = 2000) => {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), 60000); // Max 60 seconds
  const jitter = Math.random() * 0.1 * delay;
  return new Promise(resolve => setTimeout(resolve, delay + jitter));
};

// Categorize single transaction with proper retry logic for rate limits
const categorizeWithAI = async (description: string, userId: string, maxRetries: number = 5): Promise<string> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`AI retry attempt ${attempt} for: ${description}`);
        await smartDelay(attempt);
      }
      
      const response = await fetch('https://nqqbvlvuzyctmysablzw.supabase.co/functions/v1/categorize-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcWJ2bHZ1enljdG15c2FibHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzODY0NTIsImV4cCI6MjA1Mzk2MjQ1Mn0.2Z6_5YBxzfsJga8n2vOiTTE3nxPjPpiUcRZe7dpA1V4`
        },
        body: JSON.stringify({ description, userId })
      });

      if (response.status === 429) {
        console.log(`Rate limited on attempt ${attempt + 1}, retrying after delay...`);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.category && categories.includes(data.category)) {
        console.log(`AI categorized "${description}" -> ${data.category} (attempt ${attempt + 1})`);
        return data.category;
      }
      
    } catch (error) {
      console.warn(`AI attempt ${attempt + 1} failed for "${description}":`, error);
    }
  }
  
  console.log(`All AI retries exhausted for "${description}", using built-in rules`);
  return enhancedBuiltInRules(description) || 'Miscellaneous';
};

// Main categorization logic following the specified flow
export const categorizeTransaction = async (description: string, userId: string): Promise<string> => {
  console.log(`Starting categorization for: "${description}"`);
  
  // Step 1: Check database for similar transactions with existing categories
  const dbCategory = await findSimilarTransactionCategory(description, userId);
  if (dbCategory) {
    console.log(`Using DB category: "${description}" -> ${dbCategory}`);
    return dbCategory;
  }
  
  // Step 2: Use AI categorization with retry logic for rate limits
  console.log(`No DB match found, trying AI categorization for: "${description}"`);
  const aiCategory = await categorizeWithAI(description, userId);
  
  return aiCategory;
};

// Progressive batch processing with responsive UI updates
export const categorizeTransactionsBatch = async (
  descriptions: string[], 
  userId: string,
  onProgress?: (processed: number, total: number, results: string[]) => void
): Promise<string[]> => {
  const results: string[] = [];
  const batchSize = 3; // Smaller batches for better responsiveness
  const batchDelay = 1000; // 1 second between batches
  
  console.log(`Starting progressive batch categorization of ${descriptions.length} transactions`);
  
  for (let i = 0; i < descriptions.length; i += batchSize) {
    const batch = descriptions.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(descriptions.length / batchSize)}`);
    
    // Process batch items sequentially to avoid overwhelming the API
    for (let j = 0; j < batch.length; j++) {
      const description = batch[j];
      const category = await categorizeTransaction(description, userId);
      results.push(category);
      
      // Update progress after each transaction
      if (onProgress) {
        onProgress(results.length, descriptions.length, [...results]);
      }
      
      // Small delay between individual requests within batch
      if (j < batch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    // Delay between batches (except for the last batch)
    if (i + batchSize < descriptions.length) {
      console.log(`Waiting ${batchDelay}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, batchDelay));
    }
  }
  
  console.log(`Progressive batch categorization completed: ${results.length} transactions processed`);
  return results;
};

// Legacy function for backward compatibility
export const categorizeTransactionWithAI = async (description: string): Promise<string> => {
  // For legacy calls without userId, use enhanced rules only
  return enhancedBuiltInRules(description) || 'Miscellaneous';
};

// Check if AI categorization is available
export const isAICategorizationAvailable = () => {
  return true;
};
