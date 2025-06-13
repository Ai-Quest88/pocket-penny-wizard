import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define our transaction categories - added Grocery
const CATEGORIES = [
  'Banking',
  'Food', 
  'Grocery',
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

// Add delay utility for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    // Updated prompt to distinguish between grocery stores and restaurants
    const prompt = `You are a financial transaction categorization expert. Categorize this transaction into EXACTLY ONE of these categories: ${CATEGORIES.join(', ')}.

Transaction: "${cleanDescription}"

IMPORTANT RULES:
- Respond with ONLY the category name (one word)
- No explanations, no thinking process, no additional text
- Grocery vs Food distinction:
  * Supermarkets/Grocery stores (Woolworths, Coles, IGA, Aldi, supermarket) = Grocery
  * Restaurants, cafes, takeaway, food delivery, fast food chains, food trucks = Food
  * Bakeries, kebab shops = Food
- Transport (fuel stations like Ampol, public transport, Uber, parking) = Transport  
- Shopping (retail stores, Bunnings, Officeworks, clothing, electronics) = Shopping
- Bills (utilities, phone, subscriptions, insurance) = Bills
- Entertainment (movies, games, streaming, bars, clubs) = Entertainment
- Health (medical, pharmacy, dental, fitness) = Health
- Banking (fees, transfers, ATM, bank charges) = Banking
- Travel (hotels, flights, booking, accommodation) = Travel
- Education (schools, Scholastic, courses, books) = Education
- Income (salary, wages, refunds, government payments) = Income
- Investment (stocks, funds, crypto, trading) = Investment
- If completely unsure = Other

Category:`;

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        // Add delay between retries to handle rate limiting
        if (retryCount > 0) {
          const delayMs = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`Retry ${retryCount}, waiting ${delayMs}ms`);
          await delay(delayMs);
        }

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
                content: prompt
              }
            ],
            temperature: 0.1,
            max_tokens: 20
          })
        });

        console.log('Groq API categorization response status:', response.status);

        if (response.status === 429) {
          console.log('Rate limit hit, retrying...');
          retryCount++;
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Groq API categorization failed:', errorText);
          retryCount++;
          continue;
        }

        const data = await response.json();
        let category = data.choices[0]?.message?.content?.trim();
        
        console.log('Raw AI response:', category);
        
        // Clean up the response - remove thinking tags and extra text
        if (category) {
          // Remove any <think> tags and content
          category = category.replace(/<think>[\s\S]*?<\/think>/gi, '');
          // Remove any remaining XML-like tags
          category = category.replace(/<[^>]*>/g, '');
          // Get first word only
          category = category.split(/\s+/)[0];
          // Clean up any remaining punctuation
          category = category.replace(/[^\w]/g, '');
        }
        
        console.log('Cleaned AI response:', category);
        
        // Validate the response is one of our categories
        if (CATEGORIES.includes(category)) {
          console.log('Valid category found:', category);
          return new Response(
            JSON.stringify({ category }), 
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } else {
          console.warn('Invalid category returned:', category);
          // Try to match partial category names
          const matchedCategory = CATEGORIES.find(cat => 
            cat.toLowerCase().includes(category?.toLowerCase() || '') ||
            category?.toLowerCase().includes(cat.toLowerCase())
          );
          
          if (matchedCategory) {
            console.log('Found partial match:', matchedCategory);
            return new Response(
              JSON.stringify({ category: matchedCategory }), 
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
          
          retryCount++;
        }
        
      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed:`, error);
        retryCount++;
      }
    }

    // If all retries failed, return Other as fallback
    console.warn('All retry attempts failed, defaulting to Other');
    return new Response(
      JSON.stringify({ 
        category: 'Other',
        warning: 'AI categorization failed after retries, defaulted to Other' 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
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
