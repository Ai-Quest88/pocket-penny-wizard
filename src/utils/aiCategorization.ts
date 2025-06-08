
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

// Initialize the specialized banking transaction classification model
export const initializeAIClassifier = async () => {
  if (classifier) return classifier;
  
  try {
    console.log('Loading specialized banking transaction classification model...');
    
    // Use the specialized model for banking transaction classification
    classifier = await pipeline(
      'text-classification',
      'wanadzhar913/debertav3-finetuned-banking-transaction-classification-text-only',
      { 
        revision: 'main'
      }
    );
    console.log('Specialized banking transaction classification model loaded successfully');
    return classifier;
  } catch (error) {
    console.error('Failed to load specialized model:', error);
    // Fallback to zero-shot classification
    try {
      console.log('Trying fallback zero-shot classification model...');
      classifier = await pipeline(
        'zero-shot-classification',
        'Xenova/distilbert-base-uncased-mnli',
        { 
          revision: 'main'
        }
      );
      console.log('Fallback classification model loaded successfully');
      return classifier;
    } catch (fallbackError) {
      console.error('Failed to load fallback model:', fallbackError);
      return null;
    }
  }
};

// Map the specialized model's output to our categories
const mapSpecializedModelOutput = (prediction: any): string => {
  const label = prediction.label.toLowerCase();
  const score = prediction.score;
  
  console.log(`Specialized model prediction: ${prediction.label} (confidence: ${(score * 100).toFixed(1)}%)`);
  
  // Map the model's labels to our categories
  // The model likely outputs specific banking transaction types
  if (label.includes('bank') || label.includes('credit') || label.includes('payment') || label.includes('transfer')) {
    return 'Banking';
  }
  
  // For other predictions, we'll need to see what labels the model actually outputs
  // and map them accordingly. For now, we'll return the original label if it matches our categories
  const matchingCategory = CATEGORIES.find(cat => 
    cat.toLowerCase() === label || label.includes(cat.toLowerCase())
  );
  
  return matchingCategory || 'Other';
};

// Enhanced categorization with specialized model
export const categorizeTransactionWithAI = async (description: string): Promise<string> => {
  try {
    console.log(`Categorizing transaction: "${description}"`);

    // First, try rule-based classification for high-confidence matches
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

    // Clean and preprocess the description
    const cleanDescription = description
      .replace(/\b\d+\b/g, '') // Remove standalone numbers
      .replace(/[^\w\s]/g, ' ') // Replace special characters with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    console.log(`Cleaned description for AI: "${cleanDescription}"`);

    // Check if we're using the specialized model or fallback
    if (classifier.task === 'text-classification') {
      // Using specialized banking transaction model
      const result = await classifier(cleanDescription);
      
      // Handle both single prediction and array of predictions
      const topPrediction = Array.isArray(result) ? result[0] : result;
      return mapSpecializedModelOutput(topPrediction);
      
    } else {
      // Using fallback zero-shot classification
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
      const topCategory = result.labels[0];
      const confidence = result.scores[0];
      
      console.log(`Fallback AI classification result for "${description}": ${topCategory} (confidence: ${(confidence * 100).toFixed(1)}%)`);
      
      // Map back to our simple category names
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
