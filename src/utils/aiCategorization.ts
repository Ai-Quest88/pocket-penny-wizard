
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

// Minimal essential rules for critical financial categories only (as fallback)
const essentialBuiltInRules = (description: string): string | null => {
  const lowerDesc = description.toLowerCase();
  
  // Only absolute essentials - let AI handle everything else
  if (lowerDesc.includes('transfer to') || lowerDesc.includes('transfer from') ||
      lowerDesc.includes('bpay') || lowerDesc.includes('direct credit')) {
    return 'Transfer';
  }
  
  if (lowerDesc.includes('revenue') || lowerDesc.includes('tax office') || 
      lowerDesc.includes('ato') || lowerDesc.includes('act revenue') || 
      lowerDesc.includes('nsw revenue') || lowerDesc.includes('vic revenue')) {
    return 'Taxes';
  }
  
  return null;
};

// AI-first bulk processing
export const categorizeTransactionsBatch = async (
  descriptions: string[], 
  userId: string,
  onProgress?: (processed: number, total: number, results: string[]) => void
): Promise<string[]> => {
  const results: string[] = [];
  const uncategorizedDescriptions: { index: number; description: string }[] = [];
  
  console.log(`Starting AI-first bulk categorization of ${descriptions.length} transactions`);
  
  // Phase 1: Check database for similar transactions first
  for (let i = 0; i < descriptions.length; i++) {
    const description = descriptions[i];
    
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
    
    // If no DB match, mark for AI processing (prioritize AI over built-in rules)
    uncategorizedDescriptions.push({ index: i, description });
    
    // Update progress for processed items
    if (onProgress && results[i]) {
      const processedCount = results.filter(r => r !== undefined).length;
      onProgress(processedCount, descriptions.length, [...results]);
    }
  }
  
  console.log(`Found ${uncategorizedDescriptions.length} transactions that need AI categorization`);
  
  // Phase 2: AI processing for remaining transactions
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
      
      // Fallback: use essential rules then Miscellaneous for remaining transactions
      uncategorizedDescriptions.forEach(({ index, description }) => {
        const essentialCategory = essentialBuiltInRules(description);
        results[index] = essentialCategory || 'Miscellaneous';
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
  
  console.log(`AI-first bulk categorization completed: ${results.length} transactions processed`);
  return results;
};

// AI-first single transaction categorization
export const categorizeTransaction = async (description: string, userId: string): Promise<string> => {
  console.log(`Starting AI-first categorization for: "${description}"`);
  
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
    console.warn(`AI categorization failed for "${description}":`, error);
  }
  
  console.log(`Using essential rules fallback for "${description}"`);
  return essentialBuiltInRules(description) || 'Miscellaneous';
};

// Legacy function for backward compatibility
export const categorizeTransactionWithAI = async (description: string): Promise<string> => {
  // For legacy calls without userId, use essential rules only
  return essentialBuiltInRules(description) || 'Miscellaneous';
};

// Check if AI categorization is available
export const isAICategorizationAvailable = () => {
  return true;
};
