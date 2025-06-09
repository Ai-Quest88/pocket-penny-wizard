
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
  
  // Check if the prediction matches any of our categories directly
  const matchingCategory = CATEGORIES.find(cat => 
    cat.toLowerCase() === label || label.includes(cat.toLowerCase())
  );
  
  if (matchingCategory) {
    return matchingCategory;
  }
  
  // For food-related predictions
  if (label.includes('food') || label.includes('restaurant') || label.includes('dining') || label.includes('grocery')) {
    return 'Food';
  }
  
  // For transport-related predictions
  if (label.includes('transport') || label.includes('fuel') || label.includes('gas') || label.includes('parking')) {
    return 'Transport';
  }
  
  // For shopping-related predictions
  if (label.includes('retail') || label.includes('shopping') || label.includes('store')) {
    return 'Shopping';
  }
  
  // For entertainment-related predictions
  if (label.includes('entertainment') || label.includes('leisure') || label.includes('recreation')) {
    return 'Entertainment';
  }
  
  // For health-related predictions
  if (label.includes('health') || label.includes('medical') || label.includes('pharmacy')) {
    return 'Health';
  }
  
  // For travel-related predictions
  if (label.includes('travel') || label.includes('hotel') || label.includes('flight')) {
    return 'Travel';
  }
  
  // For education-related predictions
  if (label.includes('education') || label.includes('school') || label.includes('university')) {
    return 'Education';
  }
  
  // For income-related predictions
  if (label.includes('income') || label.includes('salary') || label.includes('wage')) {
    return 'Income';
  }
  
  // For investment-related predictions
  if (label.includes('investment') || label.includes('stock') || label.includes('fund')) {
    return 'Investment';
  }
  
  // For bills-related predictions
  if (label.includes('bill') || label.includes('utility') || label.includes('subscription')) {
    return 'Bills';
  }
  
  return 'Other';
};

// AI-only categorization
export const categorizeTransactionWithAI = async (description: string): Promise<string> => {
  try {
    console.log(`Categorizing transaction with AI: "${description}"`);

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
    return 'Other';
  }
};

// Check if AI categorization is available
export const isAICategorizationAvailable = () => {
  return classifier !== null;
};
