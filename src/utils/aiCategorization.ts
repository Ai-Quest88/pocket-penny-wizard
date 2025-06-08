
import { pipeline, env } from '@huggingface/transformers';

// Disable local model loading to use CDN
env.allowLocalModels = false;

// Define the categories we want to classify into with improved descriptions
const CATEGORY_MAPPING = {
  'This transaction involves a bank, credit card company, payment processor, or financial institution for fees, transfers, or card payments': 'Banking',
  'This is a purchase of food, groceries, restaurant meals, or dining expenses': 'Food',
  'This is a transportation expense like fuel, parking, public transport, rideshare, or vehicle costs': 'Transport', 
  'This is a retail purchase of goods, clothing, electronics, or general shopping': 'Shopping',
  'This is a utility bill, rent payment, insurance premium, or regular service payment': 'Bills',
  'This is entertainment spending like movies, streaming, music, gaming, or recreational activities': 'Entertainment',
  'This is a health or medical expense including doctor visits, pharmacy, or wellness services': 'Health',
  'This is a travel or accommodation expense like hotels, flights, or vacation bookings': 'Travel',
  'This is an education expense like school fees, courses, books, or training': 'Education',
  'This is income, salary, wages, refunds, or money received': 'Income',
  'This is an investment, trading, stock purchase, or retirement fund transaction': 'Investment',
  'This does not clearly fit into any specific spending category': 'Other'
};

const CATEGORY_LABELS = Object.keys(CATEGORY_MAPPING);

let classifier: any = null;

// Initialize the AI classifier
export const initializeAIClassifier = async () => {
  if (classifier) return classifier;
  
  try {
    console.log('Loading AI classification model...');
    classifier = await pipeline(
      'zero-shot-classification',
      'facebook/bart-large-mnli',
      { 
        revision: 'main'
      }
    );
    console.log('AI classification model loaded successfully');
    return classifier;
  } catch (error) {
    console.error('Failed to load AI classification model:', error);
    return null;
  }
};

// Categorize transaction using AI
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

    // Enhanced preprocessing with banking keyword detection
    const lowerDescription = description.toLowerCase();
    
    // Check for clear banking indicators first
    const bankingKeywords = [
      'citibank', 'commbank', 'westpac', 'anz', 'nab', 'suncorp',
      'creditcard', 'credit card', 'bpay', 'visa', 'mastercard', 'amex',
      'transfer', 'atm', 'bank fee', 'service fee', 'monthly fee',
      'netbank', 'internet banking', 'eftpos', 'payment to', 'payment from'
    ];
    
    const hasBankingKeywords = bankingKeywords.some(keyword => 
      lowerDescription.includes(keyword)
    );
    
    // If clear banking indicators are present, bias towards banking
    if (hasBankingKeywords) {
      console.log(`Banking keywords detected in "${description}", returning Banking category`);
      return 'Banking';
    }

    // Clean up the description for better classification
    const cleanDescription = description
      .toLowerCase()
      .replace(/\b\d+\b/g, '') // Remove numbers
      .replace(/[^\w\s]/g, ' ') // Replace special characters with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    // Use the improved category labels
    const result = await classifier(cleanDescription, CATEGORY_LABELS);
    
    // Get the category from the mapping
    const topLabel = result.labels[0];
    const category = CATEGORY_MAPPING[topLabel as keyof typeof CATEGORY_MAPPING];
    
    console.log(`AI categorization result for "${description}": ${category} (confidence: ${(result.scores[0] * 100).toFixed(1)}%)`);
    
    // Return the category if confidence is reasonable, otherwise return 'Other'
    return result.scores[0] > 0.4 ? category : 'Other';
    
  } catch (error) {
    console.error('Error in AI categorization:', error);
    return 'Other';
  }
};

// Check if AI categorization is available
export const isAICategorizationAvailable = () => {
  return classifier !== null;
};
