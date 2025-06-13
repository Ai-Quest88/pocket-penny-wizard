import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive transaction categories
const CATEGORIES = [
  // Food & Dining
  'Groceries', 'Restaurants', 'Fast Food', 'Coffee & Cafes', 'Alcohol & Bars', 'Food Delivery',
  // Transportation
  'Gas & Fuel', 'Public Transport', 'Taxi & Rideshare', 'Car Maintenance', 'Car Insurance', 'Parking', 'Tolls',
  // Shopping
  'Clothing', 'Electronics', 'Home & Garden', 'Pharmacy', 'Books', 'Gifts', 'Online Shopping', 'Department Stores',
  // Bills & Utilities
  'Electricity', 'Gas', 'Water', 'Internet', 'Phone', 'Rent', 'Mortgage', 'Insurance', 'Subscriptions',
  // Entertainment
  'Movies', 'Streaming Services', 'Gaming', 'Sports', 'Hobbies', 'Events & Tickets', 'Music',
  // Health & Fitness
  'Medical', 'Dental', 'Pharmacy', 'Gym', 'Sports Equipment', 'Health Insurance',
  // Travel
  'Flights', 'Hotels', 'Car Rental', 'Travel Insurance', 'Vacation',
  // Education
  'Tuition', 'Books & Supplies', 'Online Courses', 'Training',
  // Financial
  'Banking Fees', 'ATM Fees', 'Investment', 'Savings', 'Loan Payment', 'Credit Card Payment', 'Transfer',
  // Income
  'Salary', 'Freelance', 'Business Income', 'Investment Income', 'Refund', 'Cashback', 'Bonus',
  // Personal Care
  'Haircut', 'Beauty', 'Spa', 'Personal Items',
  // Family & Kids
  'Childcare', 'School Fees', 'Kids Activities', 'Baby Items',
  // Business
  'Office Supplies', 'Business Meals', 'Professional Services', 'Marketing', 'Equipment',
  // Charity & Gifts
  'Donations', 'Charity', 'Gifts Given',
  // Other
  'Miscellaneous', 'Cash Withdrawal', 'Other'
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

    // More structured prompt with comprehensive category list
    const prompt = `Categorize this transaction into exactly one of these categories:

${CATEGORIES.join(', ')}

Transaction: "${cleanDescription}"

Rules:
- Grocery stores (Woolworths, Coles, IGA, Aldi, Safeway, supermarket) = Groceries
- Restaurants, cafes, takeaway, food delivery (McDonald's, KFC, Uber Eats, DoorDash) = Restaurants or Fast Food
- Coffee shops, cafes = Coffee & Cafes
- Petrol, fuel, gas station = Gas & Fuel
- Public transport, train, bus, metro = Public Transport
- Uber, taxi, rideshare = Taxi & Rideshare
- Retail stores (Target, Kmart, Bunnings, Officeworks) = Department Stores or Home & Garden
- Utilities (electricity, gas, water) = use specific utility category
- Phone, internet bills = Phone or Internet
- Rent, mortgage = Rent or Mortgage
- Banking fees, ATM = Banking Fees or ATM Fees
- Salary, wages = Salary
- Medical, doctor, hospital = Medical
- Pharmacy, chemist = Pharmacy
- If uncertain = Miscellaneous

RESPOND WITH ONLY THE CATEGORY NAME. NO EXPLANATIONS.`;

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
                content: 'You are a transaction categorizer. You respond ONLY with the exact category name from the provided list, nothing else.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.1,
            max_tokens: 5 // Very limited to force short responses
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
          category = category.replace(/[^\w\s&]/g, ''); // Remove special chars except & and spaces
          category = category.trim();
          
          // Handle multi-word categories - try to find exact match first
          let validCategory = CATEGORIES.find(cat => 
            cat.toLowerCase() === category.toLowerCase()
          );
          
          // If no exact match, try partial matching
          if (!validCategory) {
            validCategory = CATEGORIES.find(cat => 
              cat.toLowerCase().includes(category.toLowerCase()) ||
              category.toLowerCase().includes(cat.toLowerCase())
            );
          }
          
          if (validCategory) {
            console.log('Valid category found:', validCategory);
            return new Response(
              JSON.stringify({ category: validCategory }), 
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
        }
        
        console.warn('Invalid category returned:', category, 'Retrying...');
        retryCount++;
        
      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed:`, error);
        retryCount++;
      }
    }

    // If all retries failed, return Miscellaneous as fallback
    console.warn('All retry attempts failed, defaulting to Miscellaneous');
    return new Response(
      JSON.stringify({ 
        category: 'Miscellaneous',
        warning: 'AI categorization failed after retries, defaulted to Miscellaneous' 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Error in categorize-transaction function:', error);
    return new Response(
      JSON.stringify({ 
        category: 'Miscellaneous',
        error: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
