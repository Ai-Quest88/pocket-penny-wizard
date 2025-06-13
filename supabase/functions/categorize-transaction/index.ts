
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
          model: 'llama-3.3-70b-versatile',
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

    // More structured prompt with JSON format request
    const prompt = `You are a transaction categorizer. Categorize this transaction into exactly one of these categories: ${CATEGORIES.join(', ')}.

Transaction: "${cleanDescription}"

Categorization rules:
- Grocery stores (Woolworths, Coles, IGA, Aldi, Safeway) = Grocery
- Restaurants, cafes, takeaway, food delivery (McDonald's, KFC, Uber Eats) = Food  
- Transport (fuel, petrol, public transport, Uber, taxi) = Transport
- Retail stores (Bunnings, Officeworks, Target, Kmart) = Shopping
- Utilities, phone bills, subscriptions, rent = Bills
- Entertainment venues, streaming services = Entertainment
- Medical, pharmacy, health insurance = Health
- Banking fees, ATM fees = Banking
- Education fees, courses = Education
- Salary, wages, refunds, cashback = Income
- Investment, trading, dividends = Investment
- If uncertain or unclear = Other

IMPORTANT: Respond with ONLY the category name. No explanations, no extra text, no punctuation. Just the single word category name.

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
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: 'You are a transaction categorizer. You respond ONLY with the category name, nothing else. No explanations, no extra words, no punctuation.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.1,
            max_tokens: 5 // Reduced to force shorter responses
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
        
        // More aggressive response cleaning
        if (category) {
          // Remove any common prefixes and unwanted text
          category = category.replace(/^(category:|answer:|response:|result:)\s*/i, '');
          category = category.replace(/\.$/, ''); // Remove trailing period
          category = category.replace(/[^\w]/g, ''); // Remove all non-word characters
          // Take only the first word
          category = category.split(/\s+/)[0];
        }
        
        console.log('Cleaned AI response:', category);
        
        // Direct exact match validation (case insensitive)
        const validCategory = CATEGORIES.find(cat => 
          cat.toLowerCase() === category?.toLowerCase()
        );
        
        if (validCategory) {
          console.log('Valid category found:', validCategory);
          return new Response(
            JSON.stringify({ category: validCategory }), 
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } else {
          console.warn('Invalid category returned:', category, 'Retrying...');
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
