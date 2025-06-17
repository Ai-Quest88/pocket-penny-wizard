
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const groqApiKey = Deno.env.get('GROQ_API_KEY');

const availableCategories = [
  'Groceries', 'Restaurants', 'Gas & Fuel', 'Shopping', 'Entertainment', 'Healthcare', 
  'Insurance', 'Utilities', 'Transportation', 'Education', 'Travel', 'Gifts & Donations', 
  'Personal Care', 'Professional Services', 'Home & Garden', 'Electronics', 'Clothing', 
  'Books', 'Subscriptions', 'Banking', 'Investment', 'Taxes', 'Legal', 'Miscellaneous', 
  'Transfer', 'Income', 'Salary', 'Business', 'Freelance', 'Interest', 'Dividends', 
  'Other Income', 'Rental Income', 'Government Benefits', 'Pension', 'Child Support', 
  'Alimony', 'Gifts Received', 'Refunds', 'Cryptocurrency', 'Fast Food', 'Public Transport', 
  'Tolls', 'Food Delivery'
];

const models = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile', 
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768'
];

let currentModelIndex = 0;

const getNextModel = () => {
  const model = models[currentModelIndex];
  currentModelIndex = (currentModelIndex + 1) % models.length;
  return model;
};

const createEnhancedPrompt = (input: string[] | string, isBatch: boolean = false) => {
  const categoriesText = availableCategories.join(', ');
  
  if (isBatch && Array.isArray(input)) {
    const transactionsList = input.map((desc, index) => `  "${desc}"`).join(',\n');
    
    return `Categorize each transaction in the list into exactly one of these categories:
${categoriesText}

CRITICAL RULES:
1. "Linkt", "toll", "e-toll", "etoll", "citylink", "eastlink", "M1 toll", etc. → Tolls
2. McDonald's, KFC, Subway, Burger King, Domino's → Fast Food  
3. Coles, Woolworths, IGA, ALDI → Groceries
4. Shell, BP, Caltex, Ampol, 7-Eleven (fuel) → Gas & Fuel
5. Uber Eats, DoorDash, Menulog → Food Delivery
6. Netflix, Spotify, Apple Music → Subscriptions
7. Government, ATO, Revenue Office → Taxes
8. Opal, Myki, Go Card, public transport → Public Transport

Return ONLY a JSON array with objects containing "transaction" and "category" fields. NO other text.

Input transactions:
[
${transactionsList}
]

Output format:
[
  {"transaction": "WOOLWORTHS 1348 GLENWOOD AUS", "category": "Groceries"},
  {"transaction": "Direct Debit 408856 Linkt Sydney", "category": "Tolls"}
]`;
  } else {
    return `Categorize this transaction into exactly one of these categories:
${categoriesText}

CRITICAL RULES:
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    if (body.testMode) {
      return new Response(JSON.stringify({ success: true, message: 'AI categorization ready' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    // Handle batch processing
    if (body.batchMode && body.descriptions && Array.isArray(body.descriptions)) {
      console.log(`Processing batch of ${body.descriptions.length} transactions`);
      
      const prompt = createEnhancedPrompt(body.descriptions, true);
      const model = getNextModel();
      
      console.log(`Using model: ${model}`);
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { 
              role: 'system', 
              content: 'You are a financial transaction categorization AI. Always return valid JSON arrays for batch requests and single category names for individual requests.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let content = data.choices[0]?.message?.content?.trim();
      
      if (!content) {
        throw new Error('No content in Groq response');
      }

      try {
        // Clean up the response - remove markdown formatting if present
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        const parsed = JSON.parse(content);
        
        if (Array.isArray(parsed)) {
          const categories = parsed.map(item => {
            if (item.category && availableCategories.includes(item.category)) {
              return item.category;
            }
            return 'Miscellaneous';
          });
          
          console.log(`Batch processing completed: ${categories.length} categories returned`);
          
          return new Response(JSON.stringify({ 
            categories,
            source: 'ai_batch',
            model: model 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          throw new Error('Response is not an array');
        }
      } catch (parseError) {
        console.error('Failed to parse batch response as JSON:', parseError);
        console.error('Raw content:', content);
        
        // Fallback for batch processing
        const fallbackCategories = body.descriptions.map(() => 'Miscellaneous');
        return new Response(JSON.stringify({ 
          categories: fallbackCategories,
          source: 'fallback_batch' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Handle single transaction
    if (!body.description) {
      throw new Error('Description is required');
    }

    const prompt = createEnhancedPrompt(body.description, false);
    const model = getNextModel();
    
    console.log(`Categorizing single transaction with model: ${model}`);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { 
            role: 'system', 
            content: 'You are a financial transaction categorization AI. Return only the category name for single transactions.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const category = data.choices[0]?.message?.content?.trim();

    if (category && availableCategories.includes(category)) {
      return new Response(JSON.stringify({ 
        category,
        source: 'ai',
        model: model 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      category: 'Miscellaneous',
      source: 'fallback' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in categorize-transaction function:', error);
    return new Response(JSON.stringify({ 
      category: 'Miscellaneous',
      source: 'error',
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
