
import { pipeline, env } from '@huggingface/transformers';

// Disable local model loading to use CDN
env.allowLocalModels = false;

// Define the categories we want to classify into with improved descriptions
const CATEGORY_MAPPING = {
  'This is a food or dining related expense': 'Food',
  'This is a transportation or travel expense': 'Transport', 
  'This is a shopping or retail purchase': 'Shopping',
  'This is a utility bill or regular service payment': 'Bills',
  'This is entertainment or leisure spending': 'Entertainment',
  'This is a health or medical expense': 'Health',
  'This is a travel or accommodation expense': 'Travel',
  'This is an education or learning expense': 'Education',
  'This is income, salary, or money received': 'Income',
  'This is an investment or trading transaction': 'Investment',
  'This is a banking transaction, credit card payment, transfer, or financial service fee': 'Banking',
  'This does not fit into any specific category': 'Other'
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
