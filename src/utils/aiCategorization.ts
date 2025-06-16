
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

// Optimized batch processing with alternating models
export const categorizeTransactionsBatch = async (
  descriptions: string[], 
  userId: string,
  onProgress?: (processed: number, total: number, results: string[]) => void
): Promise<string[]> => {
  const results: string[] = [];
  const batchSize = 30; // Process 30 at a time to respect rate limits
  
  console.log(`Starting optimized batch categorization of ${descriptions.length} transactions with alternating models`);
  
  let remainingDescriptions = [...descriptions];
  
  while (remainingDescriptions.length > 0) {
    console.log(`Processing batch of ${Math.min(batchSize, remainingDescriptions.length)} transactions`);
    
    try {
      const response = await fetch('https://nqqbvlvuzyctmysablzw.supabase.co/functions/v1/categorize-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcWJ2bHZ1enljdG15c2FibHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzODY0NTIsImV4cCI6MjA1Mzk2MjQ1Mn0.2Z6_5YBxzfsJga8n2vOiTTE3nxPjPpiUcRZe7dpA1V4`
        },
        body: JSON.stringify({ 
          batchMode: true,
          batchDescriptions: remainingDescriptions,
          userId 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Add results from this batch
      const batchResults = data.results.map((item: any) => item.category);
      results.push(...batchResults);
      
      // Update progress
      if (onProgress) {
        onProgress(results.length, descriptions.length, [...results]);
      }
      
      // Update remaining descriptions for next batch
      remainingDescriptions = data.nextBatch || [];
      
      console.log(`Processed ${data.processedCount} transactions, ${data.remainingCount} remaining`);
      
      // If there are more batches and we processed the full batch size, 
      // add a delay to respect rate limits and allow model switching
      if (remainingDescriptions.length > 0 && data.processedCount === batchSize) {
        console.log('Waiting 2 seconds before next batch to respect rate limits...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      console.error('Error in batch processing:', error);
      
      // Fallback: process remaining descriptions individually with built-in rules
      const fallbackResults = remainingDescriptions.map(desc => {
        return enhancedBuiltInRules(desc) || 'Miscellaneous';
      });
      
      results.push(...fallbackResults);
      
      if (onProgress) {
        onProgress(results.length, descriptions.length, [...results]);
      }
      
      break;
    }
  }
  
  console.log(`Optimized batch categorization completed: ${results.length} transactions processed`);
  return results;
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
