
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

    // Simpler, more direct prompt without thinking instructions
    const prompt = `Categorize this transaction into exactly one category: ${CATEGORIES.join(', ')}.

Transaction: "${cleanDescription}"

Rules:
- Grocery stores (Woolworths, Coles, IGA, Aldi) = Grocery
- Restaurants, cafes, takeaway, food delivery = Food
- Transport (fuel, public transport, Uber) = Transport
- Retail stores (Bunnings, Officeworks) = Shopping
- Utilities, subscriptions = Bills
- Entertainment venues = Entertainment
- Medical, pharmacy = Health
- Banking fees = Banking
- Education = Education
- Salary, refunds = Income
- If unsure = Other

Answer with only the category name:`;

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
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.1,
            max_tokens: 10
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
        
        // Clean up the response more thoroughly
        if (category) {
          // Remove any thinking tags and their content
          category = category.replace(/<think>[\s\S]*?<\/think>/gi, '');
          category = category.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
          // Remove any remaining XML-like tags
          category = category.replace(/<[^>]*>/g, '');
          // Remove common prefixes/suffixes
          category = category.replace(/^(category:|answer:|response:)\s*/i, '');
          category = category.replace(/\.$/, ''); // Remove trailing period
          // Get first word only and clean punctuation
          category = category.split(/[\s\n,]+/)[0];
          category = category.replace(/[^\w]/g, '');
        }
        
        console.log('Cleaned AI response:', category);
        
        // Direct category validation
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
          console.warn('Invalid category returned:', category);
          
          // Try partial matching as last resort
          const partialMatch = CATEGORIES.find(cat => 
            cat.toLowerCase().includes(category?.toLowerCase() || '') ||
            category?.toLowerCase().includes(cat.toLowerCase())
          );
          
          if (partialMatch) {
            console.log('Found partial match:', partialMatch);
            return new Response(
              JSON.stringify({ category: partialMatch }), 
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
