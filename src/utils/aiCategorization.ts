
import { categories } from '@/types/transaction-forms';

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

// Initialize the Groq classifier (no actual initialization needed for edge function calls)
export const initializeAIClassifier = async () => {
  if (isInitialized) return true;
  
  console.log('Groq AI classifier ready (using edge function)');
  isInitialized = true;
  return true;
};

// Enhanced built-in rules including food establishments
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
  
  // Hardware and home improvement
  if (lowerDesc.includes('bunnings') || lowerDesc.includes('officeworks')) {
    return 'Home & Garden';
  }
  
  // Education and books
  if (lowerDesc.includes('scholastic')) {
    return 'Books';
  }
  
  // Public transport
  if (lowerDesc.includes('opal') || lowerDesc.includes('myki') || lowerDesc.includes('go card') ||
      lowerDesc.includes('transport') || lowerDesc.includes('train') || lowerDesc.includes('bus')) {
    return 'Public Transport';
  }
  
  return null;
};

// Smart delay function with exponential backoff
const smartDelay = (attempt: number, baseDelay: number = 1000) => {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
  const jitter = Math.random() * 0.1 * delay; // Add 10% jitter to avoid thundering herd
  return new Promise(resolve => setTimeout(resolve, delay + jitter));
};

// Categorize single transaction with retries
const categorizeWithRetries = async (description: string, maxRetries: number = 3): Promise<string> => {
  // First try enhanced built-in rules
  const builtInCategory = enhancedBuiltInRules(description);
  if (builtInCategory) {
    console.log(`Built-in rule matched "${description}" -> ${builtInCategory}`);
    return builtInCategory;
  }
  
  // Try AI categorization with retries
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} for: ${description}`);
        await smartDelay(attempt);
      }
      
      const response = await fetch('https://nqqbvlvuzyctmysablzw.supabase.co/functions/v1/categorize-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcWJ2bHZ1enljdG15c2FibHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzODY0NTIsImV4cCI6MjA1Mzk2MjQ1Mn0.2Z6_5YBxzfsJga8n2vOiTTE3nxPjPpiUcRZe7dpA1V4`
        },
        body: JSON.stringify({ description })
      });

      if (response.status === 429) {
        console.log(`Rate limited on attempt ${attempt + 1}, will retry...`);
        continue; // Retry on rate limit
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.category) {
        console.log(`AI categorized "${description}" -> ${data.category} (attempt ${attempt + 1})`);
        return data.category;
      }
      
    } catch (error) {
      console.warn(`Attempt ${attempt + 1} failed for "${description}":`, error);
      if (attempt === maxRetries - 1) {
        console.log(`All retries exhausted for "${description}", using fallback pattern matching`);
      }
    }
  }
  
  // Final fallback
  return 'Miscellaneous';
};

// Batch processing with intelligent rate limiting
export const categorizeTransactionsBatch = async (
  descriptions: string[], 
  onProgress?: (processed: number, total: number, results: string[]) => void
): Promise<string[]> => {
  const batchSize = 5; // Smaller batches to avoid rate limits
  const batchDelay = 2000; // 2 seconds between batches
  const results: string[] = [];
  
  console.log(`Starting batch categorization of ${descriptions.length} transactions in batches of ${batchSize}`);
  
  for (let i = 0; i < descriptions.length; i += batchSize) {
    const batch = descriptions.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(descriptions.length / batchSize)}`);
    
    // Process batch in parallel but with controlled concurrency
    const batchPromises = batch.map(async (description, index) => {
      // Stagger requests within batch to avoid burst rate limiting
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, index * 200)); // 200ms stagger
      }
      return categorizeWithRetries(description);
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Report progress
    if (onProgress) {
      onProgress(results.length, descriptions.length, [...results]);
    }
    
    // Delay between batches (except for the last batch)
    if (i + batchSize < descriptions.length) {
      console.log(`Waiting ${batchDelay}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, batchDelay));
    }
  }
  
  console.log(`Batch categorization completed: ${results.length} transactions processed`);
  return results;
};

// Legacy function for backward compatibility - now uses batch processing
export const categorizeTransactionWithAI = async (description: string): Promise<string> => {
  const results = await categorizeTransactionsBatch([description]);
  return results[0] || 'Miscellaneous';
};

// Check if AI categorization is available (always true since we use edge function)
export const isAICategorizationAvailable = () => {
  return true;
};
