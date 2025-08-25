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
  suggested_bucket: string;
}

interface CategoryGroup {
  name: string;
  type: 'income' | 'expense' | 'asset' | 'liability' | 'transfer';
  description: string;
  color: string;
  icon: string;
  buckets: {
    name: string;
    description: string;
    color: string;
    icon: string;
    categories: DiscoveredCategory[];
  }[];
}

const createCategoryDiscoveryPrompt = (transactions: Transaction[]): string => {
  const sampleTransactions = transactions.slice(0, 20).map(t => 
    `"${t.description}" ($${t.amount})`
  ).join('\n');

  return `You are an AI financial advisor analyzing transaction data to discover and organize spending categories.

Analyze these transactions and create a logical category structure:

TRANSACTIONS:
${sampleTransactions}

TASK: Create a hierarchical category structure with:
1. High-level groups classified by type (income, expense, asset, liability, transfer)
2. Logical buckets within each group
3. Specific categories with merchant patterns

CLASSIFICATION RULES:
- INCOME: Salary, wages, dividends, interest, rental income, business income
- EXPENSE: All spending (groceries, utilities, entertainment, etc.)
- ASSET: Property purchases, investments, savings deposits
- LIABILITY: Loan payments, credit card payments, mortgage payments
- TRANSFER: Movement between own accounts (no financial impact)

CATEGORIZATION RULES:
- Group similar spending patterns together
- Use clear, descriptive names
- Consider merchant patterns for categorization
- Australian context (Coles, Woolworths, Linkt, etc.)
- Include confidence scores (0-1) for each category
- Classify each group with proper type

OUTPUT FORMAT (JSON):
{
  "groups": [
    {
      "name": "Food & Dining",
      "type": "expense",
      "description": "All food-related spending",
      "color": "bg-red-100",
      "icon": "🍽️",
      "buckets": [
        {
          "name": "Groceries",
          "description": "Food and household items",
          "color": "bg-green-100",
          "icon": "🛒",
          "categories": [
            {
              "name": "Supermarket",
              "description": "Major grocery stores",
              "confidence": 0.95,
              "merchant_patterns": ["Coles", "Woolworths", "IGA"],
              "suggested_group": "Expenses",
              "suggested_bucket": "Groceries"
            }
          ]
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

    return new Response(JSON.stringify({
      success: true,
      categories: discoveredCategories,
      session_id: sessionId,
      message: `Discovered ${discoveredCategories.length} category groups with ${discoveredCategories.reduce((sum, g) => sum + g.buckets.length, 0)} buckets`
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
      session_type: 'initial',
      transactions_processed: transactionsProcessed,
      new_categories_created: 0,
      categories_grouped: 0,
      ai_confidence_score: 0.9
    }])
    .select('id')
    .single();

  if (sessionError) {
    console.error('Failed to create discovery session:', sessionError);
    throw new Error('Failed to create discovery session');
  }

  let totalCategories = 0;
  let totalBuckets = 0;

  // Store category groups (check for existing first)
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
        sort_order: 0,
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
    }

    // Store buckets within this group
    for (const bucket of group.buckets) {
      // Check if bucket already exists
      const { data: existingBucket, error: findBucketError } = await supabase
        .from('category_buckets')
        .select('id')
        .eq('user_id', userId)
        .eq('group_id', groupId)
        .eq('name', bucket.name)
        .single();

      let bucketId;
      if (existingBucket) {
        // Use existing bucket
        bucketId = existingBucket.id;
        console.log(`Using existing bucket: ${bucket.name}`);
      } else {
        // Create new bucket
        const { data: bucketData, error: bucketError } = await supabase
          .from('category_buckets')
          .insert([{
            user_id: userId,
            group_id: groupId,
            name: bucket.name,
            description: bucket.description,
            color: bucket.color,
            icon: bucket.icon,
          sort_order: 0,
          is_ai_generated: true
        }])
        .select('id')
        .single();

      if (bucketError) {
        console.error('Failed to create category bucket:', bucketError);
        continue;
      }

        bucketId = bucketData.id;
        console.log(`Created new bucket: ${bucket.name}`);
        totalBuckets++;
      }

      // Store categories within this bucket
      for (const category of bucket.categories) {
        // Check if category already exists
        const { data: existingCategory, error: findCategoryError } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', userId)
          .eq('bucket_id', bucketId)
          .eq('name', category.name)
          .single();

        if (!existingCategory) {
          // Create new category only if it doesn't exist
          const { error: categoryError } = await supabase
            .from('categories')
            .insert([{
              user_id: userId,
              bucket_id: bucketId,
              name: category.name,
              description: category.description,
              merchant_patterns: category.merchant_patterns,
              sort_order: 0,
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
  }

  // Update session with counts
  await supabase
    .from('category_discovery_sessions')
    .update({
      new_categories_created: totalCategories,
      categories_grouped: totalBuckets
    })
    .eq('id', session.id);

  return session.id;
}

