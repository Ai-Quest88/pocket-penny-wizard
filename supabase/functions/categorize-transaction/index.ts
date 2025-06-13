
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  console.log('Categorize transaction function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const groqApiKey = Deno.env.get('VITE_GROQ_API_KEY');
    console.log('API key available:', !!groqApiKey);
    
    if (!groqApiKey) {
      console.error('No Groq API key found in environment');
      return new Response(
        JSON.stringify({ error: 'No Groq API key found in secrets' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { description, testMode = false } = await req.json();
    console.log('Request data:', { description, testMode });

    if (testMode) {
      console.log('Running test mode');
      // Test connection with a simple request
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-r1-distill-llama-70b',
          messages: [
            {
              role: 'user',
              content: 'Test message'
            }
          ],
          temperature: 0.1,
          max_tokens: 10
        })
      });

      console.log('Groq API test response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API test failed:', errorText);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `HTTP ${response.status}: ${response.statusText} - ${errorText}` 
          }), 
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Groq API test successful');
      return new Response(
        JSON.stringify({ success: true }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Categorize transaction
    if (!description) {
      return new Response(
        JSON.stringify({ error: 'Description is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Categorizing transaction:', description);

    // Clean and preprocess the description
    const cleanDescription = description
      .replace(/\b\d+\b/g, '') // Remove standalone numbers
      .replace(/[^\w\s]/g, ' ') // Replace special characters with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

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
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-r1-distill-llama-70b',
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

    console.log('Groq API categorization response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API categorization failed:', errorText);
      return new Response(
        JSON.stringify({ 
          category: 'Other',
          error: `Groq API error: ${response.status} ${response.statusText}` 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    const category = data.choices[0]?.message?.content?.trim();
    
    console.log('AI categorized as:', category);
    
    // Validate the response is one of our categories
    if (CATEGORIES.includes(category)) {
      return new Response(
        JSON.stringify({ category }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      console.warn('Invalid category returned:', category);
      return new Response(
        JSON.stringify({ 
          category: 'Other',
          warning: `Invalid category "${category}" returned by AI` 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
  } catch (error) {
    console.error('Error in categorize-transaction function:', error);
    return new Response(
      JSON.stringify({ 
        category: 'Other',
        error: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
