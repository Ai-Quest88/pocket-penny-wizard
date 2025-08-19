import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'https://pocket-penny-wizard.lovable.app',
]);

const buildCorsHeaders = (origin: string | null) => {
  const isDev = (Deno.env.get('DENO_ENV') || Deno.env.get('ENV') || 'development') !== 'production';
  const allowOrigin = (origin && allowedOrigins.has(origin))
    || (isDev && origin?.startsWith('http://localhost:'))
    ? (origin as string)
    : 'https://pocket-penny-wizard.lovable.app';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  } as Record<string, string>;
};

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

interface Category {
  id: string;
  name: string;
  description?: string;
  merchant_patterns?: string[];
  transaction_count: number;
  total_amount: number;
}

interface GroupingSuggestion {
  group_name: string;
  group_description: string;
  group_color: string;
  group_icon: string;
  bucket_name: string;
  bucket_description: string;
  bucket_color: string;
  bucket_icon: string;
  categories: string[];
  confidence: number;
  reasoning: string;
}

const createGroupingPrompt = (categories: Category[]): string => {
  const categoryList = categories.map(c => 
    `"${c.name}" (${c.transaction_count} transactions, $${c.total_amount.toFixed(2)})`
  ).join('\n');

  return `You are an AI financial advisor organizing spending categories into logical groups and buckets.

Analyze these categories and suggest an optimal organizational structure:

CATEGORIES:
${categoryList}

TASK: Organize these categories into logical groups and buckets for financial planning.

RULES:
- Group similar spending patterns together
- Use clear, descriptive names
- Consider transaction frequency and amounts
- Australian context (Coles, Woolworths, Linkt, etc.)
- Focus on financial planning and budgeting
- Include confidence scores (0-1) for each grouping

SUGGESTED STRUCTURE:
- Income (money coming in)
- Expenses (money going out) 
- Assets (things you own)
- Liabilities (money you owe)
- Transfers (internal movements)

OUTPUT FORMAT (JSON):
{
  "groupings": [
    {
      "group_name": "Expenses",
      "group_description": "Money going out",
      "group_color": "bg-red-100",
      "group_icon": "💸",
      "bucket_name": "Groceries",
      "bucket_description": "Food and household items",
      "bucket_color": "bg-green-100",
      "bucket_icon": "🛒",
      "categories": ["Coles Groceries", "Woolworths Food"],
      "confidence": 0.95,
      "reasoning": "Both are major Australian supermarkets with similar spending patterns"
    }
  ]
}

Focus on creating a structure that makes sense for financial planning, budgeting, and reporting.`;
};

const groupCategoriesWithAI = async (categories: Category[]): Promise<GroupingSuggestion[]> => {
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const prompt = createGroupingPrompt(categories);
  
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
    
    if (!parsed.groupings || !Array.isArray(parsed.groupings)) {
      throw new Error('Invalid response format: missing groupings array');
    }
    
    return parsed.groupings;
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    console.error('Raw content:', content);
    throw new Error('Failed to parse AI category grouping response');
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
    
    if (!body.categories || !Array.isArray(body.categories)) {
      throw new Error('Categories array is required');
    }

    const categories: Category[] = body.categories;
    console.log(`Grouping ${categories.length} categories`);

    // Group categories using AI
    const groupings = await groupCategoriesWithAI(categories);
    
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

    // Apply groupings to database
    const result = await applyCategoryGroupings(supabase, user.id, groupings, categories);

    return new Response(JSON.stringify({
      success: true,
      groupings: groupings,
      applied: result,
      message: `Grouped ${categories.length} categories into ${groupings.length} logical structures`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in group-categories function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function applyCategoryGroupings(
  supabase: any, 
  userId: string, 
  groupings: GroupingSuggestion[], 
  categories: Category[]
): Promise<any> {
  const results = [];

  for (const grouping of groupings) {
    try {
      // Find or create group
      let { data: groupData } = await supabase
        .from('category_groups')
        .select('id')
        .eq('user_id', userId)
        .eq('name', grouping.group_name)
        .single();

      if (!groupData) {
        const { data: newGroup, error: groupError } = await supabase
          .from('category_groups')
          .insert([{
            user_id: userId,
            name: grouping.group_name,
            description: grouping.group_description,
            color: grouping.group_color,
            icon: grouping.group_icon,
            sort_order: 0,
            is_ai_generated: true
          }])
          .select('id')
          .single();

        if (groupError) {
          console.error('Failed to create group:', groupError);
          continue;
        }
        groupData = newGroup;
      }

      // Find or create bucket
      let { data: bucketData } = await supabase
        .from('category_buckets')
        .select('id')
        .eq('user_id', userId)
        .eq('group_id', groupData.id)
        .eq('name', grouping.bucket_name)
        .single();

      if (!bucketData) {
        const { data: newBucket, error: bucketError } = await supabase
          .from('category_buckets')
          .insert([{
            user_id: userId,
            group_id: groupData.id,
            name: grouping.bucket_name,
            description: grouping.bucket_description,
            color: grouping.bucket_color,
            icon: grouping.bucket_icon,
            sort_order: 0,
            is_ai_generated: true
          }])
          .select('id')
          .single();

        if (bucketError) {
          console.error('Failed to create bucket:', bucketError);
          continue;
        }
        bucketData = newBucket;
      }

      // Move categories to this bucket
      for (const categoryName of grouping.categories) {
        const category = categories.find(c => c.name === categoryName);
        if (category) {
          const { error: updateError } = await supabase
            .from('categories')
            .update({ bucket_id: bucketData.id })
            .eq('id', category.id)
            .eq('user_id', userId);

          if (updateError) {
            console.error('Failed to update category bucket:', updateError);
          }
        }
      }

      results.push({
        group: grouping.group_name,
        bucket: grouping.bucket_name,
        categories_moved: grouping.categories.length,
        confidence: grouping.confidence
      });

    } catch (error) {
      console.error('Error applying grouping:', error);
      results.push({
        group: grouping.group_name,
        bucket: grouping.bucket_name,
        error: error.message
      });
    }
  }

  return results;
}

