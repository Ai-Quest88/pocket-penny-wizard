
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
  
  console.log('Groq AI classifier ready (using edge function with model alternation)');
  isInitialized = true;
  return true;
};

// Enhanced built-in rules for fallback
const enhancedBuiltInRules = (description: string): string | null => {
  const lowerDesc = description.toLowerCase();
  
  // Food delivery services - highest priority for consistency
  if (lowerDesc.includes('uber') && lowerDesc.includes('eats')) {
    return 'Food Delivery';
  }
  
  if (lowerDesc.includes('doordash') || lowerDesc.includes('deliveroo') || 
      lowerDesc.includes('menulog') || lowerDesc.includes('food delivery') ||
      lowerDesc.includes('grubhub') || lowerDesc.includes('skip the dishes')) {
    return 'Food Delivery';
  }
  
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
  
  // Public transport - Enhanced to catch NSW Transport, Opal, and other transport cards
  if (lowerDesc.includes('opal') || lowerDesc.includes('myki') || lowerDesc.includes('go card') ||
      lowerDesc.includes('transportfornsw') || lowerDesc.includes('transport for nsw') ||
      lowerDesc.includes('translink') || lowerDesc.includes('ptv') ||
      lowerDesc.includes('transport') || lowerDesc.includes('train') || lowerDesc.includes('bus') ||
      lowerDesc.includes('metro') || lowerDesc.includes('ferry') || lowerDesc.includes('tram')) {
    return 'Public Transport';
  }
  
  return null;
};

// Optimized bulk processing with database lookup first, then AI batch processing
export const categorizeTransactionsBatch = async (
  descriptions: string[], 
  userId: string,
  onProgress?: (processed: number, total: number, results: string[]) => void
): Promise<string[]> => {
  const results: string[] = [];
  const uncategorizedDescriptions: { index: number; description: string }[] = [];
  
  console.log(`Starting optimized bulk categorization of ${descriptions.length} transactions`);
  
  // Phase 1: Check built-in rules and database for each transaction
  for (let i = 0; i < descriptions.length; i++) {
    const description = descriptions[i];
    
    // First check built-in rules
    const builtInCategory = enhancedBuiltInRules(description);
    if (builtInCategory) {
      console.log(`Built-in rule matched: "${description}" -> ${builtInCategory}`);
      results[i] = builtInCategory;
      continue;
    }
    
    // Check database for similar transactions
    try {
      const { data: similarTransactions, error } = await supabase
        .from('transactions')
        .select('category, description')
        .eq('user_id', userId)
        .not('category', 'is', null)
        .not('category', 'eq', 'Miscellaneous')
        .not('category', 'eq', 'Other')
        .not('category', 'eq', 'Banking')
        .limit(10);

      if (!error && similarTransactions && similarTransactions.length > 0) {
        const keywords = description.toLowerCase().split(/[\s\*]+/).filter(word => word.length > 2);
        
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
            console.log(`Found similar transaction in DB: "${description}" -> ${mostCommonCategory}`);
            results[i] = mostCommonCategory;
            continue;
          }
        }
      }
    } catch (error) {
      console.error('Error checking database for similar transactions:', error);
    }
    
    // If no built-in rule or DB match, mark for AI processing
    uncategorizedDescriptions.push({ index: i, description });
    
    // Update progress for processed items (built-in rules + DB matches)
    if (onProgress && results[i]) {
      const processedCount = results.filter(r => r !== undefined).length;
      onProgress(processedCount, descriptions.length, [...results]);
    }
  }
  
  console.log(`Found ${uncategorizedDescriptions.length} transactions that need AI categorization`);
  
  // Phase 2: Batch process remaining transactions with AI
  if (uncategorizedDescriptions.length > 0) {
    try {
      const aiDescriptions = uncategorizedDescriptions.map(item => item.description);
      
      const response = await fetch('https://nqqbvlvuzyctmysablzw.supabase.co/functions/v1/categorize-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcWJ2bHZ1enljdG15c2FibHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzODY0NTIsImV4cCI6MjA1Mzk2MjQ1Mn0.2Z6_5YBxzfsJga8n2vOiTTE3nxPjPpiUcRZe7dpA1V4`
        },
        body: JSON.stringify({ 
          batchMode: true,
          batchDescriptions: aiDescriptions,
          userId 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Map AI results back to original positions
      if (data.results && Array.isArray(data.results)) {
        data.results.forEach((result: any, aiIndex: number) => {
          const originalIndex = uncategorizedDescriptions[aiIndex]?.index;
          if (originalIndex !== undefined) {
            results[originalIndex] = result.category || 'Miscellaneous';
          }
        });
      }
      
      console.log(`AI categorized ${uncategorizedDescriptions.length} transactions`);
      
    } catch (error) {
      console.error('Error in AI batch processing:', error);
      
      // Fallback: use Miscellaneous for remaining transactions
      uncategorizedDescriptions.forEach(({ index }) => {
        results[index] = 'Miscellaneous';
      });
    }
  }
  
  // Fill any remaining undefined results
  for (let i = 0; i < descriptions.length; i++) {
    if (!results[i]) {
      results[i] = 'Miscellaneous';
    }
  }
  
  // Final progress update
  if (onProgress) {
    onProgress(results.length, descriptions.length, results);
  }
  
  console.log(`Bulk categorization completed: ${results.length} transactions processed`);
  return results;
};

// Single transaction categorization (for backward compatibility)
export const categorizeTransaction = async (description: string, userId: string): Promise<string> => {
  console.log(`Starting categorization for: "${description}"`);
  
  try {
    const response = await fetch('https://nqqbvlvuzyctmysablzw.supabase.co/functions/v1/categorize-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcWJ2bHZ1enljdG15c2FibHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzODY0NTIsImV4cCI6MjA1Mzk2MjQ1Mn0.2Z6_5YBxzfsJga8n2vOiTTE3nxPjPpiUcRZe7dpA1V4`
      },
      body: JSON.stringify({ description, userId })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.category && categories.includes(data.category)) {
      console.log(`Categorized "${description}" -> ${data.category} (source: ${data.source})`);
      return data.category;
    }
    
  } catch (error) {
    console.warn(`Categorization failed for "${description}":`, error);
  }
  
  console.log(`Using built-in rules for "${description}"`);
  return enhancedBuiltInRules(description) || 'Miscellaneous';
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
