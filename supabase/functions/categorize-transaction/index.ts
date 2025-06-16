
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

    // Handle batch processing - AI-first approach
    if (batchMode && batchDescriptions.length > 0) {
      console.log(`Processing AI-first batch of ${batchDescriptions.length} transactions`);
      
      const results = [];
      const descriptionsNeedingAI: string[] = [];
      const aiIndexMap: number[] = []; // Maps AI array index to results array index
      
      // First pass: Check database for similar transactions
      for (let i = 0; i < batchDescriptions.length; i++) {
        const desc = batchDescriptions[i];
        
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

        // Mark for AI processing (prioritize AI over built-in rules)
        descriptionsNeedingAI.push(desc);
        aiIndexMap.push(results.length);
        results.push({ description: desc, category: null, source: null }); // Placeholder
      }

      // Second pass: AI processing for remaining descriptions
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
          
          // Fallback for AI failures - use essential rules then Miscellaneous
          for (let i = 0; i < descriptionsNeedingAI.length; i++) {
            const resultIndex = aiIndexMap[i];
            if (resultIndex !== undefined) {
              const fallbackCategory = essentialBuiltInRules(descriptionsNeedingAI[i]) || 'Miscellaneous';
              results[resultIndex] = {
                description: descriptionsNeedingAI[i],
                category: fallbackCategory,
                source: 'fallback-rules'
              };
            }
          }
        }
      }

      console.log(`AI-first batch processing completed: ${results.length} transactions processed`);
      
      return new Response(JSON.stringify({ 
        results,
        processedCount: results.length,
        remainingCount: 0,
        nextBatch: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Single transaction processing - AI-first approach
    if (!description) {
      return new Response(JSON.stringify({ error: 'Description is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`AI-first categorizing transaction: "${description}"`);

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

    // Use AI as primary categorization method
    console.log(`No DB match found, using AI for: "${description}"`);
    const category = await categorizeWithAI(description);
    
    return new Response(JSON.stringify({ category, source: 'ai' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in categorize-transaction function:', error);
    
    try {
      const { description } = await req.json();
      const fallbackCategory = essentialBuiltInRules(description) || 'Miscellaneous';
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

// AI categorization helper function with improved prompts
async function categorizeWithAI(description: string): Promise<string> {
  const groqApiKey = Deno.env.get('VITE_GROQ_API_KEY');
  if (!groqApiKey) {
    console.error('VITE_GROQ_API_KEY not found in environment');
    return essentialBuiltInRules(description) || 'Miscellaneous';
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
      console.log(`Rate limited by Groq API with model ${model}, using fallback rules`);
      return essentialBuiltInRules(description) || 'Miscellaneous';
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error with model ${model}:`, errorText);
      return essentialBuiltInRules(description) || 'Miscellaneous';
    }

    const data = await response.json();
    const category = data.choices?.[0]?.message?.content?.trim();

    if (category && categories.includes(category)) {
      console.log(`AI categorized "${description}" -> ${category} using model: ${model}`);
      return category;
    } else {
      console.warn(`AI returned invalid category "${category}" using model ${model}, using fallback rules`);
      return essentialBuiltInRules(description) || 'Miscellaneous';
    }

  } catch (error) {
    console.error(`Error with AI categorization using model ${model}:`, error);
    return essentialBuiltInRules(description) || 'Miscellaneous';
  }
}

// Batch AI categorization with improved prompts
async function batchCategorizeWithAI(descriptions: string[]): Promise<string[]> {
  const groqApiKey = Deno.env.get('VITE_GROQ_API_KEY');
  if (!groqApiKey) {
    console.error('VITE_GROQ_API_KEY not found in environment');
    return descriptions.map(desc => essentialBuiltInRules(desc) || 'Miscellaneous');
  }

  const prompt = `Categorize these transaction descriptions. Return ONLY a JSON array with the category names in the same order.

Available categories: ${categories.join(', ')}

Instructions:
- Analyze each transaction description carefully to understand what type of expense or income it represents
- For transport-related transactions (like "TRANSPORTFORNSW OPAL CHIPPENDALE"), use "Public Transport"
- For food delivery services (Uber Eats, DoorDash, etc.), use "Food Delivery"
- For restaurants, cafes, and dining, use "Restaurants"
- For fast food chains, use "Fast Food"
- For fuel stations, use "Gas & Fuel"
- For supermarkets and grocery stores, use "Groceries"
- For toll roads and electronic tags, use "Tolls"
- Consider the business name and context to make the best categorization
- If genuinely unsure, use "Miscellaneous"

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
      return descriptions.map(desc => essentialBuiltInRules(desc) || 'Miscellaneous');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error with model ${model}:`, errorText);
      return descriptions.map(desc => essentialBuiltInRules(desc) || 'Miscellaneous');
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
    return descriptions.map(desc => essentialBuiltInRules(desc) || 'Miscellaneous');

  } catch (error) {
    console.error(`Error with AI batch categorization using model ${model}:`, error);
    return descriptions.map(desc => essentialBuiltInRules(desc) || 'Miscellaneous');
  }
}
