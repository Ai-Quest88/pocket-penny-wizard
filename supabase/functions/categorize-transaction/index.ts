
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Categories list - must match frontend
const categories = [
  'Groceries', 'Restaurants', 'Gas & Fuel', 'Shopping', 'Entertainment',
  'Healthcare', 'Insurance', 'Utilities', 'Transportation', 'Education',
  'Travel', 'Gifts & Donations', 'Personal Care', 'Professional Services',
  'Home & Garden', 'Electronics', 'Clothing', 'Books', 'Subscriptions',
  'Banking', 'Investment', 'Taxes', 'Legal', 'Miscellaneous', 'Transfer',
  'Income', 'Salary', 'Business', 'Freelance', 'Interest', 'Dividends',
  'Other Income', 'Rental Income', 'Government Benefits', 'Pension',
  'Child Support', 'Alimony', 'Gifts Received', 'Refunds',
  'Cryptocurrency', 'Fast Food', 'Public Transport', 'Tolls', 'Food Delivery'
];

// Available models with their rate limits
const MODELS = [
  'deepseek-r1-distill-llama-70b',
  'meta-llama/llama-4-scout-17b-16e-instruct'
];

// Track model usage (simple rotation)
let currentModelIndex = 0;

// Minimal essential built-in rules for critical financial categories only
const essentialBuiltInRules = (description: string): string | null => {
  const lowerDesc = description.toLowerCase();
  
  // Only absolute essentials - let AI handle everything else
  if (lowerDesc.includes('transfer to') || lowerDesc.includes('transfer from') ||
      lowerDesc.includes('bpay') || lowerDesc.includes('direct credit')) {
    return 'Transfer';
  }
  
  if (lowerDesc.includes('revenue') || lowerDesc.includes('tax office') || 
      lowerDesc.includes('ato') || lowerDesc.includes('act revenue') || 
      lowerDesc.includes('nsw revenue') || lowerDesc.includes('vic revenue')) {
    return 'Taxes';
  }
  
  return null;
};

// Get next model to use (alternating)
const getNextModel = (): string => {
  const model = MODELS[currentModelIndex];
  currentModelIndex = (currentModelIndex + 1) % MODELS.length;
  console.log(`Using model: ${model}`);
  return model;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, userId, testMode, batchMode = false, batchDescriptions = [] } = await req.json();
    
    if (testMode) {
      console.log('Test mode - Groq API connection successful');
      return new Response(JSON.stringify({ success: true, message: 'Groq API connection test successful' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle batch processing with correct priority order
    if (batchMode && batchDescriptions.length > 0) {
      console.log(`Processing batch with priority order: ${batchDescriptions.length} transactions`);
      
      const results = [];
      
      // Process each description with full priority order
      for (let i = 0; i < batchDescriptions.length; i++) {
        const desc = batchDescriptions[i];
        
        // Priority 2: Database lookup (Priority 1 user rules handled on frontend)
        let category = null;
        if (userId && userId !== 'legacy-call') {
          category = await findSimilarTransactionInDB(desc, userId);
          if (category) {
            console.log(`Priority 2 - DB lookup: "${desc}" -> ${category}`);
            results.push({ description: desc, category, source: 'database' });
            continue;
          }
        }

        // Priority 3: AI categorization
        try {
          category = await categorizeWithAI(desc);
          if (category && categories.includes(category)) {
            console.log(`Priority 3 - AI: "${desc}" -> ${category}`);
            results.push({ description: desc, category, source: 'ai' });
            continue;
          }
        } catch (error) {
          console.error(`AI failed for "${desc}":`, error);
        }

        // Priority 4: Essential rules
        category = essentialBuiltInRules(desc);
        if (category) {
          console.log(`Priority 4 - Essential rules: "${desc}" -> ${category}`);
          results.push({ description: desc, category, source: 'essential-rules' });
          continue;
        }

        // Priority 5: Miscellaneous fallback
        console.log(`Priority 5 - Fallback: "${desc}" -> Miscellaneous`);
        results.push({ description: desc, category: 'Miscellaneous', source: 'fallback' });
      }

      console.log(`Batch processing completed: ${results.length} transactions processed`);
      
      return new Response(JSON.stringify({ 
        results,
        processedCount: results.length,
        remainingCount: 0,
        nextBatch: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Single transaction processing with correct priority order
    if (!description) {
      return new Response(JSON.stringify({ error: 'Description is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing single transaction with priority order: "${description}"`);

    // Priority 2: Database lookup (Priority 1 user rules handled on frontend)
    if (userId && userId !== 'legacy-call') {
      const dbCategory = await findSimilarTransactionInDB(description, userId);
      if (dbCategory) {
        console.log(`Priority 2 - DB lookup: "${description}" -> ${dbCategory}`);
        return new Response(JSON.stringify({ category: dbCategory, source: 'database' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Priority 3: AI categorization
    const aiCategory = await categorizeWithAI(description);
    if (aiCategory && categories.includes(aiCategory)) {
      console.log(`Priority 3 - AI: "${description}" -> ${aiCategory}`);
      return new Response(JSON.stringify({ category: aiCategory, source: 'ai' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Priority 4: Essential rules
    const essentialCategory = essentialBuiltInRules(description);
    if (essentialCategory) {
      console.log(`Priority 4 - Essential rules: "${description}" -> ${essentialCategory}`);
      return new Response(JSON.stringify({ category: essentialCategory, source: 'essential-rules' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Priority 5: Miscellaneous fallback
    console.log(`Priority 5 - Fallback: "${description}" -> Miscellaneous`);
    return new Response(JSON.stringify({ category: 'Miscellaneous', source: 'fallback' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in categorize-transaction function:', error);
    
    try {
      const { description } = await req.json();
      const fallbackCategory = essentialBuiltInRules(description) || 'Miscellaneous';
      console.log(`Exception occurred, using fallback: "${description}" -> ${fallbackCategory}`);
      
      return new Response(JSON.stringify({ 
        category: fallbackCategory,
        source: 'fallback-error',
        error: error.message || 'Unknown error'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      return new Response(JSON.stringify({ 
        error: error.message || 'Unknown error',
        category: 'Miscellaneous'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
});

// Database lookup helper function
async function findSimilarTransactionInDB(description: string, userId: string): Promise<string | null> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const keywords = description.toLowerCase().split(/[\s\*]+/).filter((word: string) => word.length > 2);
    
    const { data: similarTransactions, error } = await supabase
      .from('transactions')
      .select('category, description')
      .eq('user_id', userId)
      .not('category', 'is', null)
      .not('category', 'eq', 'Miscellaneous')
      .not('category', 'eq', 'Other')
      .limit(20);

    if (!error && similarTransactions && similarTransactions.length > 0) {
      const matches = similarTransactions.filter((transaction: any) => {
        const transactionWords = transaction.description.toLowerCase().split(/[\s\*]+/);
        return keywords.some((keyword: string) => 
          transactionWords.some((word: string) => 
            word.includes(keyword) || keyword.includes(word)
          )
        );
      });

      if (matches.length > 0) {
        const categoryCount: Record<string, number> = {};
        matches.forEach((transaction: any) => {
          if (transaction.category) {
            categoryCount[transaction.category] = (categoryCount[transaction.category] || 0) + 1;
          }
        });

        const mostCommonCategory = Object.entries(categoryCount)
          .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0];

        return mostCommonCategory || null;
      }
    }

    return null;
  } catch (error) {
    console.error('Error in database lookup:', error);
    return null;
  }
}

// AI categorization helper function with improved prompts
async function categorizeWithAI(description: string): Promise<string> {
  const groqApiKey = Deno.env.get('VITE_GROQ_API_KEY');
  if (!groqApiKey) {
    console.error('VITE_GROQ_API_KEY not found in environment');
    throw new Error('AI API key not configured');
  }

  const prompt = `Categorize this transaction description: "${description}"

Available categories: ${categories.join(', ')}

Instructions:
- Return ONLY the category name, nothing else
- Analyze the transaction description carefully to understand what type of expense or income it represents
- For transport-related transactions (like "TRANSPORTFORNSW OPAL CHIPPENDALE"), use "Public Transport"
- For food delivery services (Uber Eats, DoorDash, etc.), use "Food Delivery"
- For restaurants, cafes, and dining, use "Restaurants"
- For fast food chains, use "Fast Food"
- For fuel stations, use "Gas & Fuel"
- For supermarkets and grocery stores, use "Groceries"
- For toll roads and electronic tags, use "Tolls"
- Consider the business name and context to make the best categorization
- If genuinely unsure, use "Miscellaneous"

Category:`;

  const model = getNextModel();
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 20,
      }),
    });

    console.log(`Groq API response status: ${response.status} using model: ${model}`);

    if (response.status === 429) {
      console.log(`Rate limited by Groq API with model ${model}`);
      throw new Error('Rate limited');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error with model ${model}:`, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const category = data.choices?.[0]?.message?.content?.trim();

    if (category && categories.includes(category)) {
      console.log(`AI categorized "${description}" -> ${category} using model: ${model}`);
      return category;
    } else {
      console.warn(`AI returned invalid category "${category}" using model ${model}`);
      throw new Error('Invalid category returned');
    }

  } catch (error) {
    console.error(`Error with AI categorization using model ${model}:`, error);
    throw error;
  }
}
