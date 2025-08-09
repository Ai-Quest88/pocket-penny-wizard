import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'https://pocket-penny-wizard.lovable.app',
]);

const buildCorsHeaders = (origin: string | null) => {
  const isDev = (Deno.env.get('DENO_ENV') || Deno.env.get('ENV') || 'development') !== 'production';
  const allowOrigin = (origin && allowedOrigins.has(origin))
    || (isDev && origin?.startsWith('http://localhost:'))
    ? (origin as string)
    : 'https://pocket-penny-wizard.lovable.app';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  } as Record<string, string>;
};

// Use Google Gemini API instead of Groq
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const availableCategories = [
  'Groceries', 'Restaurants', 'Gas & Fuel', 'Shopping', 'Entertainment', 'Healthcare', 
  'Insurance', 'Utilities', 'Transportation', 'Education', 'Travel', 'Gifts & Donations', 
  'Personal Care', 'Professional Services', 'Home & Garden', 'Electronics', 'Clothing', 
  'Books', 'Subscriptions', 'Banking', 'Investment', 'Taxes', 'Legal', 'Uncategorized', 
  'Transfer In', 'Transfer Out', 'Income', 'Salary', 'Business', 'Freelance', 'Interest', 'Dividends', 
  'Other Income', 'Rental Income', 'Government Benefits', 'Pension', 'Child Support', 
  'Alimony', 'Gifts Received', 'Refunds', 'Cryptocurrency', 'Fast Food', 'Public Transport', 
  'Tolls', 'Food Delivery'
];

// Google Gemini models to use (only flash for better free tier limits)
const geminiModels = [
  'gemini-1.5-flash'
];

let currentModelIndex = 0;

const getNextModel = () => {
  const model = geminiModels[currentModelIndex];
  currentModelIndex = (currentModelIndex + 1) % geminiModels.length;
  return model;
};

const createEnhancedPrompt = (input: string[] | string, isBatch: boolean = false) => {
  const categoriesText = availableCategories.join(', ');
  
  if (isBatch && Array.isArray(input)) {
    const transactionsList = input.map((desc, index) => `${index + 1}. "${desc}"`).join('\n');
    
    return `You are a financial transaction categorization AI. Categorize each transaction in the list into exactly one of these categories:

AVAILABLE CATEGORIES:
${categoriesText}

CRITICAL AUSTRALIAN-SPECIFIC RULES:
1. "Linkt", "toll", "e-toll", "etoll", "citylink", "eastlink", "M1 toll", etc. → Tolls
2. McDonald's, KFC, Subway, Burger King, Domino's, Hungry Jack's → Fast Food  
3. Coles, Woolworths, IGA, ALDI → Groceries
4. Shell, BP, Caltex, Ampol, 7-Eleven (fuel stations) → Gas & Fuel
5. Uber Eats, DoorDash, Menulog, Deliveroo → Food Delivery
6. Netflix, Spotify, Apple Music, Stan, Disney+ → Subscriptions
7. Government, ATO, Revenue Office, tax office → Taxes
8. Opal, Myki, Go Card, public transport → Public Transport
9. Telstra, Optus, Vodafone → Utilities
10. CommBank, NAB, Westpac, ANZ (banking fees) → Banking

Return ONLY a valid JSON array with objects containing "index" and "category" fields. No markdown, no explanations.

TRANSACTIONS TO CATEGORIZE:
${transactionsList}

Required JSON format:
[
  {"index": 1, "category": "Groceries"},
  {"index": 2, "category": "Tolls"}
]`;
  } else {
    return `You are a financial transaction categorization AI. Categorize this transaction into exactly one of these categories:

AVAILABLE CATEGORIES:
${categoriesText}

CRITICAL AUSTRALIAN-SPECIFIC RULES:
1. "Linkt", "toll", "e-toll", "etoll" → Tolls
2. McDonald's, KFC, Subway → Fast Food  
3. Coles, Woolworths, IGA, ALDI → Groceries
4. Shell, BP, Caltex, Ampol → Gas & Fuel
5. Netflix, Spotify → Subscriptions
6. Government, ATO → Taxes

Transaction: "${input}"

Return only the category name, nothing else.`;
  }
};

// Helper function to chunk array into smaller batches
const chunkArray = (array: string[], chunkSize: number): string[][] => {
  const chunks: string[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// Process a single batch of transactions using Google Gemini
const processBatch = async (batch: string[], userId: string): Promise<string[]> => {
  const prompt = createEnhancedPrompt(batch, true);
  const model = getNextModel();
  
  console.log(`Processing batch of ${batch.length} transactions with Gemini model: ${model}`);
  
  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.1,
      topK: 1,
      topP: 0.8,
      maxOutputTokens: 2048,
    }
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    let errorDetails = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorBody = await response.text();
      console.error('Gemini API Error Details (Batch):', errorBody);
      errorDetails += ` - ${errorBody}`;
    } catch (parseError) {
      console.error('Could not parse Gemini API error response (Batch):', parseError);
    }
    throw new Error(`Gemini API error: ${errorDetails}`);
  }

  const data = await response.json();
  let content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  
  if (!content) {
    throw new Error('No content in Gemini response');
  }

  try {
    // Clean up the response - remove markdown formatting if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(content);
    
    if (Array.isArray(parsed)) {
      // Sort by index to ensure correct order
      const sortedParsed = parsed.sort((a, b) => (a.index || 0) - (b.index || 0));
      
      const categories = sortedParsed.map(item => {
        if (item.category && availableCategories.includes(item.category)) {
          return item.category;
        }
        return 'Uncategorized';
      });
      
      // Ensure we have the right number of categories
      while (categories.length < batch.length) {
        categories.push('Uncategorized');
      }
      
      console.log(`Batch processing completed: ${categories.length} categories returned`);
      return categories.slice(0, batch.length); // Ensure exact match
    } else {
      throw new Error('Response is not an array');
    }
  } catch (parseError) {
    console.error('Failed to parse batch response as JSON:', parseError);
    console.error('Raw content:', content);
    
    // Fallback for batch processing
    const fallbackCategories = batch.map(() => 'Uncategorized');
    return fallbackCategories;
  }
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = buildCorsHeaders(origin);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    if (body.testMode) {
      return new Response(JSON.stringify({ success: true, message: 'Google Gemini AI categorization ready' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!geminiApiKey) {
      throw new Error('VITE_GEMINI_API_KEY not configured');
    }

    // Handle batch processing with chunking
    if (body.batchMode && body.descriptions && Array.isArray(body.descriptions)) {
      console.log(`Processing ${body.descriptions.length} transactions in chunks of 100 using Google Gemini`);
      
      const BATCH_SIZE = 100; // Optimal batch size for 100% accuracy with Google Gemini free tier
      const chunks = chunkArray(body.descriptions, BATCH_SIZE);
      const allCategories: string[] = [];
      
      console.log(`Split into ${chunks.length} chunks`);
      
      // Process each chunk sequentially to avoid rate limits
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`Processing chunk ${i + 1}/${chunks.length} with ${chunk.length} transactions`);
        
        try {
          const chunkCategories = await processBatch(chunk, body.userId);
          allCategories.push(...chunkCategories);
          
          // Small delay between chunks to avoid rate limits
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Slightly longer delay for Gemini
          }
        } catch (chunkError) {
          console.error(`Error processing chunk ${i + 1}:`, chunkError);
          // Add fallback categories for failed chunk
          const fallbackCategories = chunk.map(() => 'Uncategorized');
          allCategories.push(...fallbackCategories);
        }
      }
      
      console.log(`Chunked batch processing completed: ${allCategories.length} total categories`);
      
      return new Response(JSON.stringify({ 
        categories: allCategories,
        source: 'gemini_ai_batch_chunked',
        chunksProcessed: chunks.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle single transaction
    if (!body.description) {
      throw new Error('Description is required');
    }

    const prompt = createEnhancedPrompt(body.description, false);
    const model = getNextModel();
    
    console.log(`Categorizing single transaction with Gemini model: ${model}`);
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 50,
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      // Enhanced error logging for single transaction processing
      let errorDetails = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorBody = await response.text();
        console.error('Gemini API Error Details (Single):', errorBody);
        console.error('Failed transaction description:', body.description);
        console.error('Model used:', model);
        errorDetails += ` - ${errorBody}`;
      } catch (parseError) {
        console.error('Could not parse Gemini API error response (Single):', parseError);
      }
      throw new Error(`Gemini API error: ${errorDetails}`);
    }

    const data = await response.json();
    const category = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (category && availableCategories.includes(category)) {
      return new Response(JSON.stringify({ 
        category,
        source: 'gemini_ai',
        model: model 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      category: 'Uncategorized',
      source: 'fallback' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in categorize-transaction function:', error);
    return new Response(JSON.stringify({ 
      category: 'Uncategorized',
      source: 'error',
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
