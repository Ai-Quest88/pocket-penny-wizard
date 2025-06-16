
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

// Enhanced rule-based categorization for common Australian services and patterns
const categorizeByRules = (description: string): string | null => {
  const lowerDesc = description.toLowerCase();
  
  // Food establishments - expanded patterns
  if (lowerDesc.includes('kebab') || lowerDesc.includes('pizza') || lowerDesc.includes('burger') ||
      lowerDesc.includes('cafe') || lowerDesc.includes('coffee') || lowerDesc.includes('restaurant') ||
      lowerDesc.includes('bakery') || lowerDesc.includes('bake') || lowerDesc.includes('donut') ||
      lowerDesc.includes('mcdonalds') || lowerDesc.includes('kfc') || lowerDesc.includes('subway') ||
      lowerDesc.includes('dominos') || lowerDesc.includes('hungry jacks') || lowerDesc.includes('red rooster')) {
    return 'Restaurants';
  }
  
  // Fast food chains and takeaway prefixes (SMP* is a payment processor)
  if (lowerDesc.includes('smp*') && (lowerDesc.includes('kebab') || lowerDesc.includes('bake') || 
      lowerDesc.includes('pizza') || lowerDesc.includes('burger') || lowerDesc.includes('food'))) {
    return 'Fast Food';
  }
  
  // Donut King specifically
  if (lowerDesc.includes('donut king')) {
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
  
  // Hardware and home improvement
  if (lowerDesc.includes('bunnings')) {
    return 'Home & Garden';
  }
  
  // Office supplies
  if (lowerDesc.includes('officeworks')) {
    return 'Office Supplies';
  }
  
  // Education and books
  if (lowerDesc.includes('scholastic')) {
    return 'Books';
  }
  
  // Australian banks and transfers
  if (lowerDesc.includes('commbank') || lowerDesc.includes('commonwealth bank') ||
      lowerDesc.includes('transfer to') || lowerDesc.includes('transfer from')) {
    return 'Transfer';
  }
  
  // Public transport
  if (lowerDesc.includes('opal') || lowerDesc.includes('myki') || lowerDesc.includes('go card') ||
      lowerDesc.includes('transport') || lowerDesc.includes('train') || lowerDesc.includes('bus')) {
    return 'Public Transport';
  }
  
  // Utilities
  if (lowerDesc.includes('ausgrid') || lowerDesc.includes('energy australia') || 
      lowerDesc.includes('origin energy') || lowerDesc.includes('agl')) {
    return 'Electricity';
  }
  
  // Direct debits for common services
  if (lowerDesc.includes('direct debit')) {
    if (lowerDesc.includes('linkt')) return 'Tolls';
    if (lowerDesc.includes('insurance')) return 'Insurance';
    if (lowerDesc.includes('phone') || lowerDesc.includes('telstra') || lowerDesc.includes('optus')) return 'Phone';
  }
  
  return null;
};

// Smart delay utility with exponential backoff and jitter
const smartDelay = (attempt: number, baseDelay: number = 1000) => {
  const delay = Math.min(baseDelay * Math.pow(1.5, attempt), 10000); // More conservative exponential backoff, max 10 seconds
  const jitter = Math.random() * 0.2 * delay; // Add 20% jitter
  return new Promise(resolve => setTimeout(resolve, delay + jitter));
};

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

    // First try enhanced rule-based categorization
    const ruleBasedCategory = categorizeByRules(description);
    if (ruleBasedCategory) {
      console.log('Enhanced rule-based categorization successful:', ruleBasedCategory);
      return new Response(
        JSON.stringify({ category: ruleBasedCategory }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Clean and preprocess the description for AI
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
- Restaurants, cafes, takeaway, food delivery, kebab shops = Restaurants or Fast Food
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
    const maxRetries = 3; // Increased retries with better backoff

    while (retryCount < maxRetries) {
      try {
        // Smart delay between retries
        if (retryCount > 0) {
          console.log(`Retry ${retryCount}, applying smart delay...`);
          await smartDelay(retryCount);
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
          console.log('Rate limit hit, will retry with exponential backoff...');
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
        
        // If this is a network or timeout error, apply additional delay
        if (error.name === 'TypeError' || error.message.includes('timeout')) {
          await smartDelay(retryCount, 2000); // Longer delay for network issues
        }
      }
    }

    // Enhanced fallback categorization if AI fails
    console.warn('AI categorization failed after all retries, using enhanced fallback logic');
    
    // Try one more comprehensive rule-based attempt
    const enhancedFallback = (desc: string): string => {
      const lower = desc.toLowerCase();
      
      // More comprehensive food patterns
      if (lower.includes('kebab') || lower.includes('donut') || lower.includes('pizza') || 
          lower.includes('burger') || lower.includes('sandwich') || lower.includes('takeaway')) return 'Fast Food';
      if (lower.includes('restaurant') || lower.includes('cafe') || lower.includes('bistro')) return 'Restaurants';
      if (lower.includes('bakery') || lower.includes('bake')) return 'Fast Food';
      
      // Transport patterns
      if (lower.includes('toll') || lower.includes('linkt') || lower.includes('transurban')) return 'Tolls';
      if (lower.includes('fuel') || lower.includes('petrol') || lower.includes('gas station')) return 'Gas & Fuel';
      
      // Shopping patterns
      if (lower.includes('supermarket') || lower.includes('grocery')) return 'Groceries';
      if (lower.includes('bunnings')) return 'Home & Garden';
      if (lower.includes('officeworks')) return 'Office Supplies';
      
      // Education
      if (lower.includes('scholastic') || lower.includes('school') || lower.includes('education')) return 'Books';
      
      // Financial
      if (lower.includes('transfer') || lower.includes('payment')) return 'Transfer';
      if (lower.includes('direct debit') && lower.includes('insurance')) return 'Insurance';
      
      // Utilities
      if (lower.includes('electricity') || lower.includes('power')) return 'Electricity';
      if (lower.includes('phone') || lower.includes('mobile')) return 'Phone';
      
      return 'Miscellaneous';
    };
    
    const fallbackCategory = enhancedFallback(description);
    console.log('Using enhanced fallback category:', fallbackCategory);
    
    return new Response(
      JSON.stringify({ 
        category: fallbackCategory,
        warning: 'AI categorization failed, used enhanced rule-based fallback' 
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
