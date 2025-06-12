
// Define our transaction categories
const CATEGORIES = [
  'Banking',
  'Food', 
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Travel',
  'Education',
  'Income',
  'Investment',
  'Other'
];

let isInitialized = false;

// Test Groq API connectivity via edge function
export const testGroqConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Testing Groq API connection via edge function...');
    
    const response = await fetch('/functions/v1/categorize-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

// AI-only categorization using Groq via edge function
export const categorizeTransactionWithAI = async (description: string): Promise<string> => {
  try {
    console.log(`Categorizing transaction via edge function: "${description}"`);

    const response = await fetch('/functions/v1/categorize-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: description
      })
    });

    if (!response.ok) {
      console.error('Edge function error:', response.status, response.statusText);
      return 'Other';
    }

    const data = await response.json();
    const category = data.category;
    
    console.log(`Edge function categorized "${description}" as: ${category}`);
    
    if (data.error) {
      console.warn('Edge function warning:', data.error);
    }
    
    if (data.warning) {
      console.warn('Edge function warning:', data.warning);
    }

    return category || 'Other';
    
  } catch (error) {
    console.error('Error in edge function categorization:', error);
    return 'Other';
  }
};

// Check if AI categorization is available (always true since we use edge function)
export const isAICategorizationAvailable = () => {
  return true;
};
