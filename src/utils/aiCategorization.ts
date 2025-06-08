
import { pipeline, env } from '@huggingface/transformers';

// Disable local model loading to use CDN
env.allowLocalModels = false;

// Define the categories we want to classify into
const CATEGORY_LABELS = [
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
  'Banking',
  'Other'
];

// Category descriptions to help the model understand context
const CATEGORY_DESCRIPTIONS = {
  'Food': 'food, restaurants, groceries, dining, meals, cafes, takeaway',
  'Transport': 'transportation, fuel, parking, public transport, car expenses, uber, taxi',
  'Shopping': 'retail purchases, clothing, electronics, general shopping, stores',
  'Bills': 'utilities, rent, electricity, water, gas, internet, phone bills, insurance',
  'Entertainment': 'movies, streaming services, music, gaming, concerts, events',
  'Health': 'medical expenses, pharmacy, doctor visits, healthcare, fitness, gym',
  'Travel': 'hotels, flights, vacation, accommodation, travel bookings',
  'Education': 'school fees, courses, books, training, educational expenses',
  'Income': 'salary, wages, payments received, refunds, dividends, interest',
  'Investment': 'stocks, trading, crypto, investments, retirement funds',
  'Banking': 'bank fees, transfers, credit card payments, financial services',
  'Other': 'miscellaneous expenses not fitting other categories'
};

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
      console.warn('AI classifier not available, falling back to keyword-based categorization');
      return 'Other';
    }

    console.log(`Categorizing transaction with AI: "${description}"`);

    // Prepare the hypothesis template for better classification
    const candidateLabels = CATEGORY_LABELS.map(category => 
      `This transaction is related to ${CATEGORY_DESCRIPTIONS[category as keyof typeof CATEGORY_DESCRIPTIONS]}`
    );

    // Run the classification
    const result = await classifier(description, candidateLabels);
    
    // Extract the category from the highest scoring label
    const topLabel = result.labels[0];
    const category = CATEGORY_LABELS[candidateLabels.indexOf(topLabel)];
    
    console.log(`AI categorization result for "${description}": ${category} (confidence: ${(result.scores[0] * 100).toFixed(1)}%)`);
    
    // Return the category if confidence is reasonable, otherwise return 'Other'
    return result.scores[0] > 0.3 ? category : 'Other';
    
  } catch (error) {
    console.error('Error in AI categorization:', error);
    return 'Other';
  }
};

// Check if AI categorization is available
export const isAICategorizationAvailable = () => {
  return classifier !== null;
};
