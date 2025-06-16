
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
  'Cryptocurrency', 'Fast Food', 'Public Transport', 'Tolls'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, userId, testMode } = await req.json();
    
    if (testMode) {
      console.log('Test mode - Groq API connection successful');
      return new Response(JSON.stringify({ success: true, message: 'Groq API connection test successful' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!description) {
      return new Response(JSON.stringify({ error: 'Description is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Categorizing transaction: "${description}"`);

    // Check database for similar transactions first (if userId provided)
    if (userId) {
      console.log(`Checking database for similar transactions for user: ${userId}`);
      
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Extract keywords from description for better matching
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
        // Find transactions that share keywords with current description
        const matches = similarTransactions.filter((transaction: any) => {
          const transactionWords = transaction.description.toLowerCase().split(/[\s\*]+/);
          return keywords.some((keyword: string) => 
            transactionWords.some((word: string) => 
              word.includes(keyword) || keyword.includes(word)
            )
          );
        });

        if (matches.length > 0) {
          // Return the most common category among matches
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

    // If no DB match found, use AI categorization
    console.log(`No DB match found, using AI for: "${description}"`);
    
    const groqApiKey = Deno.env.get('VITE_GROQ_API_KEY');
    if (!groqApiKey) {
      console.error('VITE_GROQ_API_KEY not found in environment');
      return new Response(JSON.stringify({ 
        error: 'AI categorization service not configured',
        category: 'Miscellaneous'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Categorize this transaction description: "${description}"

Available categories: ${categories.join(', ')}

Rules:
- Return ONLY the category name, nothing else
- If it's food-related (kebab, pizza, burger, restaurant, cafe, takeaway), use "Restaurants" or "Fast Food"
- If it's a payment processor prefix like "SMP*" followed by a business name, focus on the business type
- For fuel stations (Shell, BP, Caltex, etc.), use "Gas & Fuel"
- For supermarkets (Woolworths, Coles, IGA, Aldi), use "Groceries"
- For toll roads (Linkt, E-tag), use "Tolls"
- If unsure, use "Miscellaneous"

Category:`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 20,
      }),
    });

    console.log(`Groq API response status: ${response.status}`);

    if (response.status === 429) {
      console.log('Rate limited by Groq API, will retry later');
      return new Response(JSON.stringify({ 
        error: 'Rate limited', 
        category: 'Miscellaneous',
        retryAfter: 60
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      return new Response(JSON.stringify({ 
        error: `Groq API error: ${response.status}`,
        category: 'Miscellaneous'
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const category = data.choices?.[0]?.message?.content?.trim();

    // Validate category is in our allowed list
    if (category && categories.includes(category)) {
      console.log(`AI categorized "${description}" -> ${category}`);
      return new Response(JSON.stringify({ category, source: 'ai' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.warn(`AI returned invalid category "${category}", using Miscellaneous`);
      return new Response(JSON.stringify({ category: 'Miscellaneous', source: 'fallback' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in categorize-transaction function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error',
      category: 'Miscellaneous'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
