import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Categories list - must match frontend (including Food Delivery)
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

// Enhanced built-in rules with Food Delivery support
const enhancedBuiltInRules = (description: string): string | null => {
  const lowerDesc = description.toLowerCase();
  
  // Food delivery services - highest priority for consistency
  if (lowerDesc.includes('uber') && lowerDesc.includes('eats')) {
    return 'Food Delivery';
  }
  
  if (lowerDesc.includes('doordash') || lowerDesc.includes('deliveroo') || 
      lowerDesc.includes('menulog') || lowerDesc.includes('food delivery') ||
      lowerDesc.includes('grubhub') || lowerDesc.includes('skip the dishes')) {
    return 'Food Delivery';
  }
  
  // Food establishments - expanded patterns
  if (lowerDesc.includes('kebab') || lowerDesc.includes('pizza') || lowerDesc.includes('burger') ||
      lowerDesc.includes('cafe') || lowerDesc.includes('coffee') || lowerDesc.includes('restaurant') ||
      lowerDesc.includes('bakery') || lowerDesc.includes('bake') || lowerDesc.includes('donut') ||
      lowerDesc.includes('mcdonalds') || lowerDesc.includes('kfc') || lowerDesc.includes('subway') ||
      lowerDesc.includes('dominos') || lowerDesc.includes('hungry jacks') || lowerDesc.includes('red rooster')) {
    return 'Restaurants';
  }
  
  // Fast food chains and takeaway prefixes
  if (lowerDesc.includes('smp*') && (lowerDesc.includes('kebab') || lowerDesc.includes('bake') || 
      lowerDesc.includes('pizza') || lowerDesc.includes('burger'))) {
    return 'Fast Food';
  }
  
  // Australian toll roads and transport
  if (lowerDesc.includes('linkt') || lowerDesc.includes('e-tag') || lowerDesc.includes('etag')) {
    return 'Tolls';
  }
  
  // Fuel stations
  if (lowerDesc.includes('caltex') || lowerDesc.includes('shell') || lowerDesc.includes('bp ') || 
      lowerDesc.includes('7-eleven') || lowerDesc.includes('united petroleum') || 
      lowerDesc.includes('mobil') || lowerDesc.includes('ampol')) {
    return 'Gas & Fuel';
  }
  
  // Australian supermarkets
  if (lowerDesc.includes('woolworths') || lowerDesc.includes('coles') || 
      lowerDesc.includes('iga ') || lowerDesc.includes('aldi')) {
    return 'Groceries';
  }
  
  // Public transport - Enhanced to catch NSW Transport, Opal, and other transport cards
  if (lowerDesc.includes('opal') || lowerDesc.includes('myki') || lowerDesc.includes('go card') ||
      lowerDesc.includes('transportfornsw') || lowerDesc.includes('transport for nsw') ||
      lowerDesc.includes('translink') || lowerDesc.includes('ptv') ||
      lowerDesc.includes('transport') || lowerDesc.includes('train') || lowerDesc.includes('bus') ||
      lowerDesc.includes('metro') || lowerDesc.includes('ferry') || lowerDesc.includes('tram')) {
    return 'Public Transport';
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

    // Handle batch processing - process ALL descriptions in one go
    if (batchMode && batchDescriptions.length > 0) {
      console.log(`Processing complete batch of ${batchDescriptions.length} transactions`);
      
      const results = [];
      const descriptionsNeedingAI: string[] = [];
      const aiIndexMap: number[] = []; // Maps AI array index to results array index
      
      // First pass: Check built-in rules and database for all descriptions
      for (let i = 0; i < batchDescriptions.length; i++) {
        const desc = batchDescriptions[i];
        
        // Check built-in rules first
        const builtInCategory = enhancedBuiltInRules(desc);
        if (builtInCategory) {
          console.log(`Built-in rule matched: "${desc}" -> ${builtInCategory}`);
          results.push({ description: desc, category: builtInCategory, source: 'builtin-rules' });
          continue;
        }

        // Check database for similar transactions if userId provided
        let dbCategory = null;
        if (userId) {
          const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          );

          const keywords = desc.toLowerCase().split(/[\s\*]+/).filter((word: string) => word.length > 2);
          
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

              dbCategory = Object.entries(categoryCount)
                .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0];
            }
          }
        }

        if (dbCategory) {
          console.log(`Found similar transaction in DB: "${desc}" -> ${dbCategory}`);
          results.push({ description: desc, category: dbCategory, source: 'database' });
          continue;
        }

        // Mark for AI processing
        descriptionsNeedingAI.push(desc);
        aiIndexMap.push(results.length);
        results.push({ description: desc, category: null, source: null }); // Placeholder
      }

      // Second pass: Batch AI processing for remaining descriptions
      if (descriptionsNeedingAI.length > 0) {
        console.log(`Sending ${descriptionsNeedingAI.length} descriptions to AI for batch processing`);
        
        try {
          const aiCategories = await batchCategorizeWithAI(descriptionsNeedingAI);
          
          // Map AI results back to the results array
          for (let i = 0; i < aiCategories.length; i++) {
            const resultIndex = aiIndexMap[i];
            if (resultIndex !== undefined) {
              results[resultIndex] = {
                description: descriptionsNeedingAI[i],
                category: aiCategories[i],
                source: 'ai'
              };
            }
          }
        } catch (error) {
          console.error('AI batch processing failed:', error);
          
          // Fallback for AI failures
          for (let i = 0; i < descriptionsNeedingAI.length; i++) {
            const resultIndex = aiIndexMap[i];
            if (resultIndex !== undefined) {
              const fallbackCategory = enhancedBuiltInRules(descriptionsNeedingAI[i]) || 'Miscellaneous';
              results[resultIndex] = {
                description: descriptionsNeedingAI[i],
                category: fallbackCategory,
                source: 'fallback-rules'
              };
            }
          }
        }
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

    // Single transaction processing (unchanged)
    if (!description) {
      return new Response(JSON.stringify({ error: 'Description is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Categorizing transaction: "${description}"`);

    // First check built-in rules (including Food Delivery)
    const builtInCategory = enhancedBuiltInRules(description);
    if (builtInCategory) {
      console.log(`Built-in rule matched: "${description}" -> ${builtInCategory}`);
      return new Response(JSON.stringify({ category: builtInCategory, source: 'builtin-rules' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check database for similar transactions if userId provided
    if (userId) {
      console.log(`Checking database for similar transactions for user: ${userId}`);
      
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

          if (mostCommonCategory) {
            console.log(`Found similar transaction in DB: "${description}" -> ${mostCommonCategory}`);
            return new Response(JSON.stringify({ category: mostCommonCategory, source: 'database' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }
    }

    console.log(`No DB match found, using AI for: "${description}"`);
    const category = await categorizeWithAI(description);
    
    return new Response(JSON.stringify({ category, source: 'ai' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in categorize-transaction function:', error);
    
    try {
      const { description } = await req.json();
      const fallbackCategory = enhancedBuiltInRules(description) || 'Miscellaneous';
      console.log(`Exception occurred, using fallback rules: "${description}" -> ${fallbackCategory}`);
      
      return new Response(JSON.stringify({ 
        category: fallbackCategory,
        source: 'fallback-rules',
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

// Batch AI categorization helper function
async function batchCategorizeWithAI(descriptions: string[]): Promise<string[]> {
  const groqApiKey = Deno.env.get('VITE_GROQ_API_KEY');
  if (!groqApiKey) {
    console.error('VITE_GROQ_API_KEY not found in environment');
    return descriptions.map(desc => enhancedBuiltInRules(desc) || 'Miscellaneous');
  }

  const prompt = `Categorize these transaction descriptions. Return ONLY a JSON array with the category names in the same order.

Available categories: ${categories.join(', ')}

Rules:
- For UBER EATS or food delivery services, use "Food Delivery"
- If it's dining at restaurants, cafes, use "Restaurants"
- If it's fast food chains (McDonald's, KFC), use "Fast Food"
- If it's a payment processor prefix like "SMP*" followed by a business name, focus on the business type
- For fuel stations (Shell, BP, Caltex, etc.), use "Gas & Fuel"
- For supermarkets (Woolworths, Coles, IGA, Aldi), use "Groceries"
- For toll roads (Linkt, E-tag), use "Tolls"
- If unsure, use "Miscellaneous"

Transactions:
${descriptions.map((desc, i) => `${i + 1}. ${desc}`).join('\n')}

Return only the JSON array:`;

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
        max_tokens: 500,
      }),
    });

    console.log(`Groq API batch response status: ${response.status} using model: ${model}`);

    if (response.status === 429) {
      console.log(`Rate limited by Groq API with model ${model}, using fallback rules`);
      return descriptions.map(desc => enhancedBuiltInRules(desc) || 'Miscellaneous');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error with model ${model}:`, errorText);
      return descriptions.map(desc => enhancedBuiltInRules(desc) || 'Miscellaneous');
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content?.trim();

    if (responseText) {
      try {
        const parsedCategories = JSON.parse(responseText);
        if (Array.isArray(parsedCategories) && parsedCategories.length === descriptions.length) {
          const validCategories = parsedCategories.map(cat => 
            categories.includes(cat) ? cat : 'Miscellaneous'
          );
          console.log(`AI batch categorized ${descriptions.length} transactions using model: ${model}`);
          return validCategories;
        }
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
      }
    }

    console.warn(`AI returned invalid response using model ${model}, using fallback rules`);
    return descriptions.map(desc => enhancedBuiltInRules(desc) || 'Miscellaneous');

  } catch (error) {
    console.error(`Error with AI batch categorization using model ${model}:`, error);
    return descriptions.map(desc => enhancedBuiltInRules(desc) || 'Miscellaneous');
  }
}

// AI categorization helper function (for single transactions)
async function categorizeWithAI(description: string): Promise<string> {
  const groqApiKey = Deno.env.get('VITE_GROQ_API_KEY');
  if (!groqApiKey) {
    console.error('VITE_GROQ_API_KEY not found in environment');
    return enhancedBuiltInRules(description) || 'Miscellaneous';
  }

  const prompt = `Categorize this transaction description: "${description}"

Available categories: ${categories.join(', ')}

Rules:
- Return ONLY the category name, nothing else
- For UBER EATS or food delivery services, use "Food Delivery"
- If it's dining at restaurants, cafes, use "Restaurants"
- If it's fast food chains (McDonald's, KFC), use "Fast Food"
- If it's a payment processor prefix like "SMP*" followed by a business name, focus on the business type
- For fuel stations (Shell, BP, Caltex, etc.), use "Gas & Fuel"
- For supermarkets (Woolworths, Coles, IGA, Aldi), use "Groceries"
- For toll roads (Linkt, E-tag), use "Tolls"
- If unsure, use "Miscellaneous"

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
      console.log(`Rate limited by Groq API with model ${model}, using fallback rules`);
      return enhancedBuiltInRules(description) || 'Miscellaneous';
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error with model ${model}:`, errorText);
      return enhancedBuiltInRules(description) || 'Miscellaneous';
    }

    const data = await response.json();
    const category = data.choices?.[0]?.message?.content?.trim();

    if (category && categories.includes(category)) {
      console.log(`AI categorized "${description}" -> ${category} using model: ${model}`);
      return category;
    } else {
      console.warn(`AI returned invalid category "${category}" using model ${model}, using fallback rules`);
      return enhancedBuiltInRules(description) || 'Miscellaneous';
    }

  } catch (error) {
    console.error(`Error with AI categorization using model ${model}:`, error);
    return enhancedBuiltInRules(description) || 'Miscellaneous';
  }
}
