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

// Available models - removed decommissioned model
const MODELS = [
  'llama-3.1-8b-instant',
  'llama3-8b-8192'
];

// Track model usage (simple rotation)
let currentModelIndex = 0;

// Enhanced built-in rules for common merchants and categories
const enhancedBuiltInRules = (description: string): string | null => {
  const lowerDesc = description.toLowerCase();
  
  // Critical financial categories first
  if (lowerDesc.includes('transfer to') || lowerDesc.includes('transfer from') ||
      lowerDesc.includes('bpay') || lowerDesc.includes('direct credit')) {
    return 'Transfer';
  }
  
  if (lowerDesc.includes('revenue') || lowerDesc.includes('tax office') || 
      lowerDesc.includes('ato') || lowerDesc.includes('act revenue') || 
      lowerDesc.includes('nsw revenue') || lowerDesc.includes('vic revenue')) {
    return 'Taxes';
  }

  // Transportation and tolls - MUST come before gas & fuel to prevent misclassification
  if (lowerDesc.includes('linkt') || lowerDesc.includes('toll') ||
      lowerDesc.includes('e-toll') || lowerDesc.includes('etoll') ||
      lowerDesc.includes('citylink') || lowerDesc.includes('eastlink') ||
      lowerDesc.includes('m1 toll') || lowerDesc.includes('m2 toll') ||
      lowerDesc.includes('m4 toll') || lowerDesc.includes('m5 toll') ||
      lowerDesc.includes('m7 toll') || lowerDesc.includes('m8 toll')) {
    return 'Tolls';
  }

  if (lowerDesc.includes('uber') || lowerDesc.includes('taxi') ||
      lowerDesc.includes('transport') || lowerDesc.includes('opal') ||
      lowerDesc.includes('myki') || lowerDesc.includes('go card') ||
      lowerDesc.includes('flix bus') || lowerDesc.includes('greyhound')) {
    return 'Transportation';
  }

  // Healthcare and pharmacies
  if (lowerDesc.includes('chemist warehouse') || lowerDesc.includes('pharmacy') ||
      lowerDesc.includes('medical') || lowerDesc.includes('doctor') ||
      lowerDesc.includes('hospital') || lowerDesc.includes('dental')) {
    return 'Healthcare';
  }

  // Groceries
  if (lowerDesc.includes('woolworths') || lowerDesc.includes('coles') ||
      lowerDesc.includes('aldi') || lowerDesc.includes('iga') ||
      lowerDesc.includes('supermarket')) {
    return 'Groceries';
  }

  // Gas stations - MUST come after transportation to avoid misclassifying toll payments
  if (lowerDesc.includes('shell') || lowerDesc.includes('bp') ||
      lowerDesc.includes('caltex') || lowerDesc.includes('ampol') ||
      lowerDesc.includes('gas station') || lowerDesc.includes('fuel')) {
    return 'Gas & Fuel';
  }

  // Home improvement
  if (lowerDesc.includes('bunnings') || lowerDesc.includes('hardware')) {
    return 'Home & Garden';
  }

  // Fast food
  if (lowerDesc.includes('mcdonald') || lowerDesc.includes('kfc') ||
      lowerDesc.includes('subway') || lowerDesc.includes('domino')) {
    return 'Fast Food';
  }

  // Coffee shops
  if (lowerDesc.includes('starbucks') || lowerDesc.includes('coffee')) {
    return 'Restaurants';
  }

  // Utilities
  if (lowerDesc.includes('electricity') || lowerDesc.includes('energy') ||
      lowerDesc.includes('origin') || lowerDesc.includes('agl')) {
    return 'Utilities';
  }

  // Income
  if (lowerDesc.includes('salary') || lowerDesc.includes('wage') ||
      lowerDesc.includes('freelance') || lowerDesc.includes('payment') && 
      description.toLowerCase().includes('work')) {
    return 'Income';
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

// Extract category from AI response that might contain reasoning
const extractCategoryFromResponse = (content: string): string | null => {
  if (!content) return null;
  
  // Remove any thinking tags and content
  let cleaned = content.replace(/<think>.*?<\/think>/gs, '').trim();
  
  // If response starts with reasoning, try to find the final category
  if (cleaned.includes('\n')) {
    const lines = cleaned.split('\n').map(line => line.trim()).filter(line => line);
    // Look for the last line that might be a category
    for (let i = lines.length - 1; i >= 0; i--) {
      if (categories.includes(lines[i])) {
        return lines[i];
      }
    }
    // If no exact match, try the last non-empty line
    const lastLine = lines[lines.length - 1];
    if (lastLine && categories.includes(lastLine)) {
      return lastLine;
    }
  }
  
  // Check if the cleaned response is directly a category
  if (categories.includes(cleaned)) {
    return cleaned;
  }
  
  // Try to find any category mentioned in the response
  for (const category of categories) {
    if (cleaned.toLowerCase().includes(category.toLowerCase())) {
      return category;
    }
  }
  
  return null;
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

    // Handle batch processing
    if (batchMode && batchDescriptions.length > 0) {
      console.log(`Processing batch: ${batchDescriptions.length} transactions`);
      
      const results = [];
      
      for (let i = 0; i < batchDescriptions.length; i++) {
        const desc = batchDescriptions[i];
        console.log(`\n=== PROCESSING TRANSACTION ${i + 1}/${batchDescriptions.length}: "${desc}" ===`);
        
        // Priority 1: Database lookup
        let category = null;
        if (userId && userId !== 'legacy-call') {
          category = await findSimilarTransactionInDB(desc, userId);
          if (category) {
            console.log(`✅ Priority 1 - DB lookup: "${desc}" -> ${category}`);
            results.push({ description: desc, category, source: 'database' });
            continue;
          } else {
            console.log(`❌ Priority 1 - DB lookup: No similar transactions found for "${desc}"`);
          }
        }

        // Priority 2: Enhanced built-in rules (MOVED UP in priority for better accuracy)
        category = enhancedBuiltInRules(desc);
        if (category) {
          console.log(`✅ Priority 2 - Enhanced rules: "${desc}" -> ${category}`);
          results.push({ description: desc, category, source: 'enhanced-rules' });
          continue;
        } else {
          console.log(`❌ Priority 2 - Enhanced rules: No match for "${desc}"`);
        }

        // Priority 3: AI categorization
        console.log(`🤖 Priority 3 - Attempting AI categorization for: "${desc}"`);
        try {
          category = await categorizeWithAI(desc);
          if (category && categories.includes(category)) {
            console.log(`✅ Priority 3 - AI SUCCESS: "${desc}" -> ${category}`);
            results.push({ description: desc, category, source: 'ai' });
            continue;
          } else {
            console.log(`❌ Priority 3 - AI FAILED: Invalid category returned: "${category}" for "${desc}"`);
          }
        } catch (error) {
          console.log(`❌ Priority 3 - AI ERROR for "${desc}":`, error.message);
          console.log(`Full AI error details:`, error);
        }

        // Priority 4: Miscellaneous fallback
        console.log(`⚠️ Priority 4 - Using fallback: "${desc}" -> Miscellaneous`);
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

    // Single transaction processing
    if (!description) {
      return new Response(JSON.stringify({ error: 'Description is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`\n=== PROCESSING SINGLE TRANSACTION: "${description}" ===`);

    // Priority 1: Database lookup
    if (userId && userId !== 'legacy-call') {
      const dbCategory = await findSimilarTransactionInDB(description, userId);
      if (dbCategory) {
        console.log(`✅ Priority 1 - DB lookup: "${description}" -> ${dbCategory}`);
        return new Response(JSON.stringify({ category: dbCategory, source: 'database' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        console.log(`❌ Priority 1 - DB lookup: No similar transactions found for "${description}"`);
      }
    }

    // Priority 2: Enhanced built-in rules (MOVED UP in priority for better accuracy)
    const enhancedCategory = enhancedBuiltInRules(description);
    if (enhancedCategory) {
      console.log(`✅ Priority 2 - Enhanced rules: "${description}" -> ${enhancedCategory}`);
      return new Response(JSON.stringify({ category: enhancedCategory, source: 'enhanced-rules' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.log(`❌ Priority 2 - Enhanced rules: No match for "${description}"`);
    }

    // Priority 3: AI categorization
    console.log(`🤖 Priority 3 - Attempting AI categorization for: "${description}"`);
    try {
      const aiCategory = await categorizeWithAI(description);
      if (aiCategory && categories.includes(aiCategory)) {
        console.log(`✅ Priority 3 - AI SUCCESS: "${description}" -> ${aiCategory}`);
        return new Response(JSON.stringify({ category: aiCategory, source: 'ai' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        console.log(`❌ Priority 3 - AI FAILED: Invalid category returned: "${aiCategory}" for "${description}"`);
      }
    } catch (error) {
      console.log(`❌ Priority 3 - AI ERROR for "${description}":`, error.message);
      console.log(`Full AI error details:`, error);
    }

    // Priority 4: Miscellaneous fallback
    console.log(`⚠️ Priority 4 - Using fallback: "${description}" -> Miscellaneous`);
    return new Response(JSON.stringify({ category: 'Miscellaneous', source: 'fallback' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ CRITICAL ERROR in categorize-transaction function:', error);
    
    try {
      const { description } = await req.json();
      const fallbackCategory = enhancedBuiltInRules(description) || 'Miscellaneous';
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

// AI categorization helper function with enhanced error logging
async function categorizeWithAI(description: string): Promise<string> {
  const groqApiKey = Deno.env.get('VITE_GROQ_API_KEY');
  if (!groqApiKey) {
    console.error('❌ AI SETUP ERROR: VITE_GROQ_API_KEY not found in environment');
    throw new Error('AI API key not configured');
  }

  const prompt = `Categorize this transaction into exactly one of these categories:
${categories.join(', ')}

Transaction: "${description}"

Examples:
- "WOOLWORTHS 1348 GLENWOOD AUS" -> Groceries
- "TRANSPORTFORNSW OPAL CHIPPENDALE" -> Public Transport  
- "BUNNINGS 746000 SEVEN HILLS" -> Home & Garden
- "AMPOL PARKLEA GLENWOOD" -> Gas & Fuel
- "CHEMIST WAREHOUSE" -> Healthcare
- "Direct Debit 408856 Linkt Sydney" -> Tolls

Important: Linkt is a toll road service in Sydney, Australia - always categorize as "Tolls", not "Gas & Fuel".

Respond with ONLY the category name, nothing else.`;

  const model = getNextModel();
  
  console.log(`🤖 Making AI request for "${description}" using model: ${model}`);
  
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
        stop: "\n"
      }),
    });

    console.log(`🤖 Groq API response status: ${response.status} for "${description}" using model: ${model}`);

    if (response.status === 429) {
      const rateLimitError = `Rate limited by Groq API with model ${model}`;
      console.log(`❌ ${rateLimitError}`);
      throw new Error(rateLimitError);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Groq API HTTP error for "${description}" with model ${model}:`, {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`API HTTP error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim();
    
    console.log(`🤖 Raw AI response for "${description}": "${rawContent}" using model: ${model}`);
    
    if (!rawContent) {
      const emptyResponseError = `Empty response from AI using model ${model}`;
      console.warn(`❌ ${emptyResponseError}`);
      throw new Error(emptyResponseError);
    }

    // Extract category from potentially complex response
    const category = extractCategoryFromResponse(rawContent);

    if (category && categories.includes(category)) {
      console.log(`✅ AI successfully categorized "${description}" -> ${category} using model: ${model}`);
      return category;
    } else {
      const invalidCategoryError = `AI returned invalid/unparseable category "${rawContent}" for "${description}" using model ${model}. Valid categories: ${categories.join(', ')}`;
      console.warn(`❌ ${invalidCategoryError}`);
      throw new Error(invalidCategoryError);
    }

  } catch (error) {
    console.error(`❌ AI categorization failed for "${description}" using model ${model}:`, {
      errorMessage: error.message,
      errorStack: error.stack,
      description: description,
      model: model
    });
    throw error;
  }
}
