
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

// Enhanced batch processing with improved AI prompt
export const categorizeTransactionsBatch = async (
  descriptions: string[], 
  userId: string,
  onProgress?: (processed: number, total: number, results: string[]) => void
): Promise<string[]> => {
  console.log(`Starting enhanced batch categorization for ${descriptions.length} transactions`);
  
  try {
    const response = await fetch('https://nqqbvlvuzyctmysablzw.supabase.co/functions/v1/categorize-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcWJ2bHZ1enljdG15c2FibHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzODY0NTIsImV4cCI6MjA1Mzk2MjQ1Mn0.2Z6_5YBxzfsJga8n2vOiTTE3nxPjPpiUcRZe7dpA1V4`
      },
      body: JSON.stringify({ 
        descriptions,
        userId,
        batchMode: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.categories && Array.isArray(data.categories)) {
      console.log(`Batch categorization completed: ${data.categories.length} transactions processed`);
      
      // Update progress with final results
      if (onProgress) {
        onProgress(data.categories.length, descriptions.length, data.categories);
      }
      
      return data.categories;
    }
    
    throw new Error('Invalid response format from AI categorization');
    
  } catch (error) {
    console.error('Batch AI categorization failed:', error);
    
    // Fallback to individual processing with essential rules
    const results: string[] = [];
    for (let i = 0; i < descriptions.length; i++) {
      const description = descriptions[i];
      const essentialCategory = essentialBuiltInRules(description);
      results[i] = essentialCategory || 'Miscellaneous';
      
      // Update progress
      if (onProgress) {
        onProgress(i + 1, descriptions.length, [...results]);
      }
    }
    
    console.log(`Fallback categorization completed: ${results.length} transactions processed`);
    return results;
  }
};

// Single transaction categorization with correct priority order
export const categorizeTransaction = async (description: string, userId: string): Promise<string> => {
  console.log(`AI categorization for: "${description}"`);
  
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
  try {
    const response = await fetch('https://nqqbvlvuzyctmysablzw.supabase.co/functions/v1/categorize-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcWJ2bHZ1enljdG15c2FibHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzODY0NTIsImV4cCI6MjA1Mzk2MjQ1Mn0.2Z6_5YBxzfsJga8n2vOiTTE3nxPjPpiUcRZe7dpA1V4`
      },
      body: JSON.stringify({ description, userId: 'legacy-call' })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.category && categories.includes(data.category)) {
      return data.category;
    }
    
    throw new Error('Invalid category returned from AI');
  } catch (error) {
    console.warn(`Legacy AI categorization failed for "${description}":`, error);
    return essentialBuiltInRules(description) || 'Miscellaneous';
  }
};

// Check if AI categorization is available
export const isAICategorizationAvailable = () => {
  return true;
};
