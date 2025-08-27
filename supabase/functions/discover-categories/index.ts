import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:8082',
  'https://pocket-penny-wizard.lovable.app',
]);

const buildCorsHeaders = (origin: string | null) => {
  const isDev = (Deno.env.get('DENO_ENV') || Deno.env.get('ENV') || 'development') !== 'production';
  const isLocal = origin?.startsWith('http://localhost:') || origin?.startsWith('http://127.0.0.1:');
  const isLovableSandbox = origin?.includes('.sandbox.lovable.dev');
  const allowOrigin = (origin && allowedOrigins.has(origin)) || (isDev && isLocal) || isLovableSandbox
    ? (origin as string)
    : 'https://pocket-penny-wizard.lovable.app';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  } as Record<string, string>;
};

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

interface Transaction {
  description: string;
  amount: number;
  date?: string;
}

interface DiscoveredCategory {
  name: string;
  description: string;
  confidence: number;
  merchant_patterns: string[];
  suggested_group: string;
}

interface CategoryGroup {
  name: string;
  type: 'income' | 'expense' | 'asset' | 'liability' | 'transfer';
  description: string;
  color: string;
  icon: string;
  categories: DiscoveredCategory[];
}

const createCategoryDiscoveryPrompt = (transactions: Transaction[]): string => {
  const sampleTransactions = transactions.slice(0, 20).map(t => 
    `"${t.description}" ($${t.amount})`
  ).join('\n');

  return `You are an AI financial advisor analyzing transaction data to discover and organize spending categories.

Analyze these transactions and create a logical category structure:

TRANSACTIONS:
${sampleTransactions}

TASK: Create a simple category structure with:
1. High-level groups classified by type (income, expense, asset, liability, transfer)
2. Specific categories within each group (no sub-buckets)

CLASSIFICATION RULES:
- INCOME: Salary, wages, dividends, interest, rental income, business income
- EXPENSE: All spending (groceries, utilities, entertainment, etc.)
- ASSET: Property purchases, investments, savings deposits
- LIABILITY: Loan payments, credit card payments, mortgage payments
- TRANSFER: Movement between own accounts (no financial impact)

CATEGORIZATION RULES:
- Group similar spending patterns together - do NOT create specific categories for individual payment recipients
- Use clear, descriptive names
- Consider merchant patterns for categorization
- Australian context (Coles, Woolworths, Linkt, etc.)
- Include confidence scores (0-1) for each category
- Classify each group with proper type
- For payments/transfers: Use generic categories like "Personal Transfers", "Bill Payments", not specific recipient names
- Avoid creating categories for individual people or specific payment recipients

OUTPUT FORMAT (JSON):
{
  "groups": [
    {
      "name": "Food & Dining",
      "type": "expense",
      "description": "All food-related spending",
      "color": "bg-red-100",
      "icon": "🍽️",
      "categories": [
        {
          "name": "Groceries",
          "description": "Food and household items from supermarkets",
          "confidence": 0.95,
          "merchant_patterns": ["Coles", "Woolworths", "IGA"],
          "suggested_group": "Food & Dining"
        },
        {
          "name": "Restaurants",
          "description": "Dining out and takeaway food",
          "confidence": 0.90,
          "merchant_patterns": ["McDonalds", "KFC", "Restaurant"],
          "suggested_group": "Food & Dining"
        }
      ]
    }
  ]
}

Focus on creating a structure that makes sense for financial planning and reporting.`;
};

const discoverCategoriesWithAI = async (transactions: Transaction[]): Promise<CategoryGroup[]> => {
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const prompt = createCategoryDiscoveryPrompt(transactions);
  
  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.1,
      topK: 1,
      topP: 0.8,
      maxOutputTokens: 4096,
    }
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  
  if (!content) {
    throw new Error('No content in Gemini response');
  }

  try {
    // Clean up the response
    const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedContent);
    
    if (!parsed.groups || !Array.isArray(parsed.groups)) {
      throw new Error('Invalid response format: missing groups array');
    }
    
    return parsed.groups;
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    console.error('Raw content:', content);
    throw new Error('Failed to parse AI category discovery response');
  }
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = buildCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    if (!body.transactions || !Array.isArray(body.transactions)) {
      throw new Error('Transactions array is required');
    }

    const transactions: Transaction[] = body.transactions;
    console.log(`Discovering categories for ${transactions.length} transactions`);

    // Discover categories using AI
    const discoveredCategories = await discoverCategoriesWithAI(transactions);
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Store discovered categories in database
    const sessionId = await storeDiscoveredCategories(supabase, user.id, discoveredCategories, transactions.length);

    // Categorize individual transactions using the discovered categories
    const categorizedTransactions = await categorizeTransactions(transactions, discoveredCategories, user.id);

    return new Response(JSON.stringify({
      success: true,
      categories: discoveredCategories,
      categorized_transactions: categorizedTransactions,
      session_id: sessionId,
      message: `Discovered ${discoveredCategories.length} category groups with ${discoveredCategories.reduce((sum, g) => sum + g.categories.length, 0)} categories and categorized ${categorizedTransactions.length} transactions`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in discover-categories function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Normalize category type to match database enum
function normalizeGroupType(input: string): 'income' | 'expense' | 'asset' | 'liability' | 'transfer' {
  const v = (input || '').toLowerCase().trim();
  if (v.startsWith('income')) return 'income';
  if (v.startsWith('expense')) return 'expense';
  if (v.startsWith('asset')) return 'asset';
  if (v.startsWith('liability')) return 'liability';
  if (v.startsWith('transfer')) return 'transfer';
  return 'expense'; // default fallback
}

async function storeDiscoveredCategories(
  supabase: any, 
  userId: string, 
  categories: CategoryGroup[], 
  transactionsProcessed: number
): Promise<string> {
  // Create discovery session
  const { data: session, error: sessionError } = await supabase
    .from('category_discovery_sessions')
    .insert([{
      user_id: userId,
      transaction_count: transactionsProcessed,
      categories_created: 0,
      groups_created: 0
    }])
    .select('id')
    .single();

  if (sessionError) {
    console.error('Failed to create discovery session:', sessionError);
    throw new Error('Failed to create discovery session');
  }

  let totalCategories = 0;
  let totalGroups = 0;

  // Store category groups and categories (simplified 2-tier structure)
  for (const group of categories) {
    // Check if group already exists
    const { data: existingGroup, error: findError } = await supabase
      .from('category_groups')
      .select('id')
      .eq('user_id', userId)
      .eq('name', group.name)
      .eq('category_type', normalizeGroupType(group.type))
      .single();

    let groupId;
    if (existingGroup) {
      // Use existing group
      groupId = existingGroup.id;
      console.log(`Using existing group: ${group.name}`);
    } else {
      // Create new group
      const { data: groupData, error: groupError } = await supabase
        .from('category_groups')
        .insert([{
          user_id: userId,
          name: group.name,
          category_type: normalizeGroupType(group.type),
          description: group.description,
          color: group.color,
          icon: group.icon,
          is_ai_generated: true
        }])
        .select('id')
        .single();

      if (groupError) {
        console.error('Failed to create category group:', groupError);
        continue;
      }
      
      groupId = groupData.id;
      console.log(`Created new group: ${group.name}`);
      totalGroups++;
    }

    // Store categories directly under the group (no buckets)
    for (const category of group.categories) {
      // Check if category already exists
      const { data: existingCategory, error: findCategoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .eq('group_id', groupId)
        .eq('name', category.name)
        .single();

      if (!existingCategory) {
        // Create new category only if it doesn't exist
        const { error: categoryError } = await supabase
          .from('categories')
          .insert([{
            user_id: userId,
            group_id: groupId,
            name: category.name,
            description: category.description,
            type: normalizeGroupType(group.type),
            merchant_patterns: category.merchant_patterns,
            is_ai_generated: true
          }]);

        if (categoryError) {
          console.error('Failed to create category:', categoryError);
          continue;
        }

        totalCategories++;
        console.log(`Created new category: ${category.name}`);
      } else {
        console.log(`Using existing category: ${category.name}`);
      }
    }
  }

  // Update session with counts
  await supabase
    .from('category_discovery_sessions')
    .update({
      categories_created: totalCategories,
      groups_created: totalGroups
    })
    .eq('id', session.id);

  return session.id;
}

// Function to categorize individual transactions using discovered categories
async function categorizeTransactions(
  transactions: Transaction[], 
  discoveredCategories: CategoryGroup[], 
  userId: string
): Promise<{ transaction_description: string; category_name: string; confidence: number }[]> {
  const categorizedTransactions = [];
  
  // Build a flat list of all categories from the simplified structure
  const allCategories: { name: string; patterns: string[] }[] = [];
  
  for (const group of discoveredCategories) {
    for (const category of group.categories) {
      allCategories.push({
        name: category.name,
        patterns: category.merchant_patterns || []
      });
    }
  }
  
  // Enhanced fallback categorization with common Australian patterns
  const getEnhancedFallbackCategory = (description: string): { name: string; confidence: number } | null => {
    const lowerDesc = description.toLowerCase();
    
    // ATM Withdrawals and Fees
    if (lowerDesc.includes('atm') || lowerDesc.includes('withdrawal fee') || 
        (lowerDesc.includes('wdl') && lowerDesc.includes('atm'))) {
      return { name: 'ATM & Cash Withdrawals', confidence: 0.95 };
    }
    
    // Major Australian Supermarkets
    if (lowerDesc.includes('aldi') || lowerDesc.includes('woolworths') || 
        lowerDesc.includes('coles') || lowerDesc.includes('iga')) {
      return { name: 'Groceries', confidence: 0.95 };
    }
    
    // Fuel stations
    if (lowerDesc.includes('bp ') || lowerDesc.includes('shell') || 
        lowerDesc.includes('caltex') || lowerDesc.includes('ampol') ||
        lowerDesc.includes('petrol') || lowerDesc.includes('fuel')) {
      return { name: 'Fuel & Transportation', confidence: 0.9 };
    }
    
    // Coffee shops
    if (lowerDesc.includes('starbucks') || lowerDesc.includes('coffee') || 
        lowerDesc.includes('cafe') || lowerDesc.includes('mccafe')) {
      return { name: 'Coffee & Cafes', confidence: 0.9 };
    }
    
    // Pharmacies
    if (lowerDesc.includes('chemist') || lowerDesc.includes('pharmacy') || 
        lowerDesc.includes('priceline') || lowerDesc.includes('terry white')) {
      return { name: 'Pharmacy & Health', confidence: 0.9 };
    }
    
    return null;
  };
  
  // Categorize each transaction
  for (const transaction of transactions) {
    const description = transaction.description.toLowerCase();
    let bestMatch = null;
    let bestConfidence = 0.5;
    
    // First priority: Try to match against AI-discovered merchant patterns
    for (const category of allCategories) {
      for (const pattern of category.patterns) {
        if (description.includes(pattern.toLowerCase())) {
          bestMatch = category.name;
          bestConfidence = 0.9;
          break;
        }
      }
      if (bestConfidence === 0.9) break;
    }
    
    // Second priority: Try enhanced fallback categorization for common patterns
    if (bestConfidence < 0.9) {
      const fallbackResult = getEnhancedFallbackCategory(transaction.description);
      if (fallbackResult) {
        bestMatch = fallbackResult.name;
        bestConfidence = fallbackResult.confidence;
      }
    }
    
    // Third priority: Try to match against AI category names with better logic
    if (bestConfidence < 0.9) {
      for (const category of allCategories) {
        const categoryName = category.name.toLowerCase();
        
        // Direct exact match or contains match
        if (description.includes(categoryName) || categoryName.includes(description.split(' ')[0])) {
          bestMatch = category.name;
          bestConfidence = 0.85;
          break;
        }
        
        // Semantic matching for common variations
        if (categoryName.includes('supermarket') && description.includes('grocery')) {
          bestMatch = category.name;
          bestConfidence = 0.8;
          break;
        }
        
        if (categoryName.includes('fuel') && description.includes('gas')) {
          bestMatch = category.name;
          bestConfidence = 0.8;
          break;
        }
      }
    }
    
    // Fourth priority: Enhanced specific matching for salary and transfer transactions
    if (bestConfidence < 0.8) {
      const lowerDesc = description.toLowerCase();
      
      // Look for specific AI categories first before falling back to generic names
      if (lowerDesc.includes('novel aquatech') || lowerDesc.includes('aquatech')) {
        // Find the specific salary category in AI categories
        const salaryCategory = allCategories.find(cat => 
          cat.name.toLowerCase().includes('salary') && 
          (cat.name.toLowerCase().includes('novel') || cat.name.toLowerCase().includes('aquatech'))
        );
        if (salaryCategory) {
          bestMatch = salaryCategory.name;
          bestConfidence = 0.95;
        }
      } else if (lowerDesc.includes('salary') || lowerDesc.includes('wage') || 
                 lowerDesc.includes('direct credit') || lowerDesc.includes('payroll')) {
        // Find any salary category in AI categories
        const salaryCategory = allCategories.find(cat => 
          cat.name.toLowerCase().includes('salary')
        );
        if (salaryCategory) {
          bestMatch = salaryCategory.name;
          bestConfidence = 0.9;
        }
      } else if (lowerDesc.includes('transfer') || lowerDesc.includes('payid') || 
                 lowerDesc.includes('bpay') || lowerDesc.includes('bank transfer')) {
        // Find specific transfer categories in AI categories
        const transferCategory = allCategories.find(cat => {
          const catName = cat.name.toLowerCase();
          return catName.includes('transfer') || catName.includes('payment') || 
                 cat.patterns.some(pattern => lowerDesc.includes(pattern.toLowerCase()));
        });
        if (transferCategory) {
          bestMatch = transferCategory.name;
          bestConfidence = 0.9;
        }
      }
    }
    
    // Final fallback: use a default category
    if (!bestMatch) {
      bestMatch = 'Other Expenses';
      bestConfidence = 0.3;
    }
    
    categorizedTransactions.push({
      transaction_description: transaction.description,
      category_name: bestMatch,
      confidence: bestConfidence
    });
  }
  
  return categorizedTransactions;
}
