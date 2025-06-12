
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

// Initialize the Groq classifier (no actual initialization needed for API calls)
export const initializeAIClassifier = async () => {
  if (isInitialized) return true;
  
  console.log('Groq AI classifier ready');
  isInitialized = true;
  return true;
};

// AI-only categorization using Groq
export const categorizeTransactionWithAI = async (description: string): Promise<string> => {
  try {
    console.log(`Categorizing transaction with Groq: "${description}"`);

    // Clean and preprocess the description
    const cleanDescription = description
      .replace(/\b\d+\b/g, '') // Remove standalone numbers
      .replace(/[^\w\s]/g, ' ') // Replace special characters with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    console.log(`Cleaned description for AI: "${cleanDescription}"`);

    const prompt = `Categorize this financial transaction into one of these categories: ${CATEGORIES.join(', ')}.

Transaction: "${cleanDescription}"

Rules:
- Food businesses (restaurants, cafes, bakeries, kebab shops, grocery stores like Woolworths, Coles) should be "Food"
- Transport (fuel, parking, public transport, rideshare) should be "Transport"  
- Shopping (retail stores, online purchases) should be "Shopping"
- Bills (utilities, subscriptions, phone bills) should be "Bills"
- Entertainment (movies, games, streaming) should be "Entertainment"
- Health (medical, pharmacy, dental) should be "Health"
- Banking (fees, transfers, ATM) should be "Banking"
- Travel (hotels, flights, booking sites) should be "Travel"
- Education (schools, courses, books) should be "Education"
- Income (salary, wages, refunds) should be "Income"
- Investment (stocks, funds, crypto) should be "Investment"
- If unsure, use "Other"

Respond with ONLY the category name, nothing else.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are a financial transaction categorization expert. Always respond with only the category name.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, response.statusText);
      return 'Other';
    }

    const data = await response.json();
    const category = data.choices[0]?.message?.content?.trim();
    
    console.log(`Groq categorized "${description}" as: ${category}`);

    // Validate the response is one of our categories
    if (CATEGORIES.includes(category)) {
      return category;
    } else {
      console.warn(`Groq returned invalid category "${category}", defaulting to Other`);
      return 'Other';
    }
    
  } catch (error) {
    console.error('Error in Groq categorization:', error);
    return 'Other';
  }
};

// Check if AI categorization is available
export const isAICategorizationAvailable = () => {
  return !!import.meta.env.VITE_GROQ_API_KEY;
};
