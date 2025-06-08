
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

// Enhanced banking keywords for better detection
const BANKING_KEYWORDS = [
  'citibank', 'commbank', 'westpac', 'anz', 'nab', 'suncorp', 'macquarie',
  'creditcard', 'credit card', 'bpay', 'visa', 'mastercard', 'amex',
  'bank transfer', 'atm', 'bank fee', 'service fee', 'monthly fee',
  'netbank', 'internet banking', 'eftpos', 'card payment', 'banking',
  'direct debit', 'autopay', 'bill payment', 'loan payment', 'mortgage'
];

const FOOD_KEYWORDS = [
  'restaurant', 'cafe', 'mcdonalds', 'kfc', 'subway', 'pizza', 'uber eats',
  'deliveroo', 'menulog', 'grocery', 'woolworths', 'coles', 'iga', 'aldi',
  'food', 'dining', 'takeaway', 'bakery', 'butcher', 'deli'
];

const TRANSPORT_KEYWORDS = [
  'petrol', 'fuel', 'shell', 'bp', 'caltex', 'parking', 'uber', 'taxi',
  'train', 'bus', 'ferry', 'toll', 'rego', 'registration', 'mechanic',
  'car service', 'tyres', 'automotive'
];

// Rule-based classification with keyword matching
const classifyWithRules = (description: string): string | null => {
  const lowerDesc = description.toLowerCase();
  
  // Check for banking indicators first (highest priority)
  if (BANKING_KEYWORDS.some(keyword => lowerDesc.includes(keyword))) {
    console.log(`Rule-based classification: "${description}" -> Banking (matched banking keywords)`);
    return 'Banking';
  }
  
  // Check for food indicators
  if (FOOD_KEYWORDS.some(keyword => lowerDesc.includes(keyword))) {
    console.log(`Rule-based classification: "${description}" -> Food (matched food keywords)`);
    return 'Food';
  }
  
  // Check for transport indicators
  if (TRANSPORT_KEYWORDS.some(keyword => lowerDesc.includes(keyword))) {
    console.log(`Rule-based classification: "${description}" -> Transport (matched transport keywords)`);
    return 'Transport';
  }
  
  return null; // No rule matched, will fallback to AI
};

// Initialize a better AI classifier
export const initializeAIClassifier = async () => {
  if (classifier) return classifier;
  
  try {
    console.log('Loading AI classification model...');
    // Using DistilBERT for better text classification
    classifier = await pipeline(
      'zero-shot-classification',
      'Xenova/distilbert-base-uncased-mnli',
      { 
        revision: 'main'
      }
    );
    console.log('AI classification model loaded successfully');
    return classifier;
  } catch (error) {
    console.error('Failed to load AI classification model:', error);
    // Fallback to Facebook BART model
    try {
      console.log('Trying fallback classification model...');
      classifier = await pipeline(
        'zero-shot-classification',
        'Xenova/bart-large-mnli',
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

// Enhanced categorization with rule-based fallback
export const categorizeTransactionWithAI = async (description: string): Promise<string> => {
  try {
    console.log(`Categorizing transaction: "${description}"`);

    // First, try rule-based classification
    const ruleBasedCategory = classifyWithRules(description);
    if (ruleBasedCategory) {
      return ruleBasedCategory;
    }

    // If no rule matches, try AI classification
    if (!classifier) {
      classifier = await initializeAIClassifier();
    }
    
    if (!classifier) {
      console.warn('AI classifier not available, falling back to Other');
      return 'Other';
    }

    // Enhanced preprocessing
    const cleanDescription = description
      .toLowerCase()
      .replace(/\b\d+\b/g, '') // Remove numbers
      .replace(/[^\w\s]/g, ' ') // Replace special characters with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    // More specific category labels for better AI classification
    const categoryLabels = [
      'banking and financial services including credit card payments and bank transfers',
      'food and dining including restaurants groceries and takeaway',
      'transportation including fuel parking and vehicle expenses',
      'shopping and retail purchases',
      'utility bills and regular payments',
      'entertainment and leisure activities',
      'healthcare and medical expenses',
      'travel and accommodation',
      'education and learning',
      'income and salary payments',
      'investment and financial planning',
      'miscellaneous other expenses'
    ];

    const result = await classifier(cleanDescription, categoryLabels);
    
    // Map back to our simple category names
    const topCategory = result.labels[0];
    const confidence = result.scores[0];
    
    console.log(`AI classification result for "${description}": ${topCategory} (confidence: ${(confidence * 100).toFixed(1)}%)`);
    
    // Map the detailed labels back to our categories
    if (topCategory.includes('banking') || topCategory.includes('financial services')) {
      return 'Banking';
    } else if (topCategory.includes('food') || topCategory.includes('dining')) {
      return 'Food';
    } else if (topCategory.includes('transportation') || topCategory.includes('fuel')) {
      return 'Transport';
    } else if (topCategory.includes('shopping') || topCategory.includes('retail')) {
      return 'Shopping';
    } else if (topCategory.includes('utility') || topCategory.includes('bills')) {
      return 'Bills';
    } else if (topCategory.includes('entertainment') || topCategory.includes('leisure')) {
      return 'Entertainment';
    } else if (topCategory.includes('healthcare') || topCategory.includes('medical')) {
      return 'Health';
    } else if (topCategory.includes('travel') || topCategory.includes('accommodation')) {
      return 'Travel';
    } else if (topCategory.includes('education') || topCategory.includes('learning')) {
      return 'Education';
    } else if (topCategory.includes('income') || topCategory.includes('salary')) {
      return 'Income';
    } else if (topCategory.includes('investment') || topCategory.includes('financial planning')) {
      return 'Investment';
    } else {
      return 'Other';
    }
    
  } catch (error) {
    console.error('Error in AI categorization:', error);
    // Final fallback to rule-based classification
    const ruleBasedCategory = classifyWithRules(description);
    return ruleBasedCategory || 'Other';
  }
};

// Check if AI categorization is available
export const isAICategorizationAvailable = () => {
  return classifier !== null;
};
