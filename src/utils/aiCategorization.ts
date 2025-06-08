
import { pipeline, env } from '@huggingface/transformers';

// Disable local model loading to use CDN
env.allowLocalModels = false;

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

let classifier: any = null;

// Initialize the AI classifier with a better model for classification
export const initializeAIClassifier = async () => {
  if (classifier) return classifier;
  
  try {
    console.log('Loading AI classification model...');
    // Using a lightweight, fast classification model specifically designed for this task
    classifier = await pipeline(
      'text-classification',
      'microsoft/DialoGPT-medium',
      { 
        revision: 'main'
      }
    );
    console.log('AI classification model loaded successfully');
    return classifier;
  } catch (error) {
    console.error('Failed to load AI classification model:', error);
    // Fallback to zero-shot classification if the primary model fails
    try {
      console.log('Trying fallback classification model...');
      classifier = await pipeline(
        'zero-shot-classification',
        'facebook/bart-large-mnli',
        { 
          revision: 'main'
        }
      );
      console.log('Fallback AI classification model loaded successfully');
      return classifier;
    } catch (fallbackError) {
      console.error('Failed to load fallback AI classification model:', fallbackError);
      return null;
    }
  }
};

// Enhanced categorization with better preprocessing and model selection
export const categorizeTransactionWithAI = async (description: string): Promise<string> => {
  try {
    // Initialize classifier if not already done
    if (!classifier) {
      classifier = await initializeAIClassifier();
    }
    
    if (!classifier) {
      console.warn('AI classifier not available, falling back to Other');
      return 'Other';
    }

    console.log(`Categorizing transaction with AI: "${description}"`);

    // Enhanced preprocessing - clean and normalize the description
    const cleanDescription = description
      .toLowerCase()
      .replace(/\b\d+\b/g, '') // Remove reference numbers
      .replace(/[^\w\s]/g, ' ') // Replace special characters with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    // Quick keyword-based pre-filtering for obvious banking transactions
    const bankingIndicators = [
      'citibank', 'commbank', 'westpac', 'anz', 'nab', 'suncorp',
      'creditcard', 'credit card', 'bpay', 'visa', 'mastercard', 'amex',
      'bank transfer', 'atm', 'bank fee', 'service fee', 'monthly fee',
      'netbank', 'internet banking', 'eftpos'
    ];
    
    if (bankingIndicators.some(indicator => cleanDescription.includes(indicator))) {
      console.log(`Clear banking transaction detected: "${description}" -> Banking`);
      return 'Banking';
    }

    // Create a more descriptive prompt for better classification
    const enhancedPrompt = `Transaction: ${cleanDescription}. Categorize this financial transaction.`;

    let result;
    
    // Try zero-shot classification first (more accurate for our use case)
    if (classifier.task === 'zero-shot-classification') {
      // Create detailed category descriptions for better classification
      const categoryDescriptions = [
        'Banking and financial services: credit card payments, bank transfers, fees, ATM transactions',
        'Food and dining: restaurants, groceries, takeaway, cafes, food delivery',
        'Transportation: fuel, parking, public transport, rideshare, vehicle expenses',
        'Shopping and retail: clothing, electronics, general purchases, online shopping',
        'Bills and utilities: rent, electricity, water, gas, phone, internet, insurance',
        'Entertainment: movies, streaming, gaming, music, recreational activities',
        'Health and medical: doctor visits, pharmacy, medical expenses, fitness',
        'Travel and accommodation: hotels, flights, vacation expenses, booking fees',
        'Education: school fees, courses, books, training, educational expenses',
        'Income: salary, wages, refunds, payments received, dividends',
        'Investment: stock purchases, trading, retirement funds, investment fees',
        'Other: miscellaneous expenses that don\'t fit other categories'
      ];
      
      result = await classifier(enhancedPrompt, categoryDescriptions);
      
      // Map the result back to our simple category names
      const topCategory = result.labels[0];
      const categoryIndex = categoryDescriptions.findIndex(desc => desc === topCategory);
      const finalCategory = CATEGORIES[categoryIndex] || 'Other';
      
      console.log(`AI categorization result for "${description}": ${finalCategory} (confidence: ${(result.scores[0] * 100).toFixed(1)}%)`);
      
      // Return the category if confidence is reasonable
      return result.scores[0] > 0.3 ? finalCategory : 'Other';
      
    } else {
      // Fallback to basic text classification
      result = await classifier(enhancedPrompt);
      
      // Map the result to our categories (this would need a more sophisticated mapping)
      console.log(`Basic classification result for "${description}":`, result);
      return 'Other'; // Default fallback for now
    }
    
  } catch (error) {
    console.error('Error in AI categorization:', error);
    return 'Other';
  }
};

// Check if AI categorization is available
export const isAICategorizationAvailable = () => {
  return classifier !== null;
};
