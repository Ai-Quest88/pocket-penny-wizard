import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'https://pocket-penny-wizard.lovable.app',
  'https://ea5a8953-f452-4559-8101-648db6e66270.lovableproject.com',
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

const createServiceSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

// Simplified category result with confidence
interface CategoryResult {
  category: string;
  confidence: number;
}

// Check learned patterns first (highest priority)
const checkLearnedPatterns = async (userId: string, description: string): Promise<CategoryResult | null> => {
  try {
    const supabaseClient = createServiceSupabaseClient();
    const normalizedDesc = normalizeDescription(description);
    
    const { data, error } = await supabaseClient
      .from('learned_patterns')
      .select('category_name, pattern')
      .eq('user_id', userId);
    
    if (error || !data || data.length === 0) {
      return null;
    }
    
    // Find best matching pattern using fuzzy match
    for (const pattern of data) {
      if (fuzzyMatch(normalizedDesc, pattern.pattern)) {
        console.log(`✓ Learned pattern match: "${pattern.pattern}" -> ${pattern.category_name}`);
        return {
          category: pattern.category_name,
          confidence: 0.95 // High confidence for learned patterns
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error checking learned patterns:', error);
    return null;
  }
};

// Normalize description for pattern matching
const normalizeDescription = (description: string): string => {
  return description
    .toLowerCase()
    .replace(/[0-9]+/g, '') // Remove numbers (like reference IDs)
    .replace(/\s+/g, ' ')   // Normalize whitespace
    .trim();
};

// Fuzzy match for descriptions
const fuzzyMatch = (description: string, pattern: string): boolean => {
  const normalizedPattern = pattern.toLowerCase().trim();
  const normalizedDesc = description.toLowerCase().trim();
  
  // Exact substring match
  if (normalizedDesc.includes(normalizedPattern) || normalizedPattern.includes(normalizedDesc)) {
    return true;
  }
  
  // Word-based matching (at least 80% of pattern words found)
  const patternWords = normalizedPattern.split(/\s+/).filter(w => w.length > 2);
  const descWords = normalizedDesc.split(/\s+/);
  
  if (patternWords.length === 0) return false;
  
  const matchedWords = patternWords.filter(pw => 
    descWords.some(dw => dw.includes(pw) || pw.includes(dw))
  );
  
  return matchedWords.length / patternWords.length >= 0.8;
};

// Function to get user's categories
const getUserCategories = async (userId: string): Promise<string[]> => {
  try {
    const supabaseClient = createServiceSupabaseClient();
    
    const { data, error } = await supabaseClient
      .from('categories')
      .select('name')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return getDefaultCategories();
    }

    const userCategories = data.map(cat => cat.name);
    if (!userCategories.includes('Uncategorized')) {
      userCategories.push('Uncategorized');
    }

    return userCategories;
  } catch (error) {
    console.error('Error in getUserCategories:', error);
    return getDefaultCategories();
  }
};

const getDefaultCategories = (): string[] => [
  'Food & Dining', 'Groceries', 'Shopping', 'Transportation', 'Fuel',
  'Bills & Utilities', 'Entertainment', 'Healthcare', 'Income', 
  'Transfer', 'Subscriptions', 'Fast Food', 'Tolls', 'Uncategorized'
];

const GEMINI_MODEL = 'gemini-2.0-flash-exp';

// Create AI categorization prompt with confidence scoring
const createCategorizationPrompt = (descriptions: string[], availableCategories: string[], userContext?: { mostUsedCategories?: string[] }) => {
  const categoriesText = availableCategories.join(', ');
  const transactionsList = descriptions.map((desc, index) => `${index + 1}. "${desc}"`).join('\n');
  
  const contextHint = userContext?.mostUsedCategories?.length 
    ? `\nUser's frequently used categories: ${userContext.mostUsedCategories.slice(0, 5).join(', ')}`
    : '';

  return `You are a financial transaction categorization AI for Australian users. Categorize each transaction and rate your confidence.

AVAILABLE CATEGORIES:
${categoriesText}
${contextHint}

CATEGORIZATION RULES:
1. ONLY use categories from the list above - never create new ones
2. Australian merchants:
   - Woolworths, Coles, IGA, ALDI → Groceries or Supermarket
   - Shell, BP, Caltex, Ampol, 7-Eleven → Fuel
   - McDonald's, KFC, Subway, Hungry Jack's → Fast Food
   - Linkt, Etoll, toll → Tolls
   - Opal, Myki, Metro → Public Transport
   - Netflix, Spotify, Disney+ → Subscriptions or Entertainment
3. If uncertain, use "Uncategorized"

CONFIDENCE SCORING:
- 0.9-1.0: Exact merchant match, very clear category
- 0.7-0.9: High confidence based on keywords
- 0.5-0.7: Moderate confidence, multiple categories possible
- Below 0.5: Low confidence, use Uncategorized

Return ONLY valid JSON array (no markdown):
[{"index": 1, "category": "Groceries", "confidence": 0.95}]

TRANSACTIONS:
${transactionsList}`;
};

// Helper function to chunk array into smaller batches
const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// Process batch with AI, returning categories with confidence scores
const processAIBatch = async (
  descriptions: string[], 
  userCategories: string[],
  userContext?: { mostUsedCategories?: string[] }
): Promise<CategoryResult[]> => {
  const prompt = createCategorizationPrompt(descriptions, userCategories, userContext);
  
  const requestBody = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.1,
      topK: 1,
      topP: 0.8,
      maxOutputTokens: 4096,
    }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Gemini API Error:', errorBody);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  let content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  
  if (!content) {
    throw new Error('No content in Gemini response');
  }

  // Clean markdown formatting
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    const parsed = JSON.parse(content);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }
    
    // Sort by index and map to CategoryResult
    const sorted = parsed.sort((a: any, b: any) => (a.index || 0) - (b.index || 0));
    
    return sorted.map((item: any, idx: number) => {
      const category = item.category?.trim();
      let confidence = Number(item.confidence) || 0.7;
      
      // Validate category exists in user's list
      const validCategory = findMatchingCategory(category, userCategories);
      
      if (!validCategory) {
        return { category: 'Uncategorized', confidence: 0.3 };
      }
      
      // Adjust confidence if we had to fuzzy match
      if (validCategory !== category) {
        confidence = Math.min(confidence, 0.8);
      }
      
      return { category: validCategory, confidence };
    });
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    return descriptions.map(() => ({ category: 'Uncategorized', confidence: 0.3 }));
  }
};

// Find matching category with fallback strategies
const findMatchingCategory = (category: string | undefined, userCategories: string[]): string | null => {
  if (!category) return null;
  
  // Exact match
  if (userCategories.includes(category)) {
    return category;
  }
  
  // Case-insensitive match
  const lowerCategory = category.toLowerCase();
  const caseMatch = userCategories.find(c => c.toLowerCase() === lowerCategory);
  if (caseMatch) return caseMatch;
  
  // Partial match
  const partialMatch = userCategories.find(c => {
    const lower = c.toLowerCase();
    return lower.includes(lowerCategory) || lowerCategory.includes(lower);
  });
  if (partialMatch) return partialMatch;
  
  return null;
};

// Process batch with learned patterns first, then AI for remaining
const processBatchWithLearning = async (
  descriptions: string[],
  userId: string,
  userContext?: { mostUsedCategories?: string[] }
): Promise<CategoryResult[]> => {
  const results: (CategoryResult | null)[] = new Array(descriptions.length).fill(null);
  const needsAI: { index: number; description: string }[] = [];
  
  // First pass: Check learned patterns
  for (let i = 0; i < descriptions.length; i++) {
    const learnedResult = await checkLearnedPatterns(userId, descriptions[i]);
    if (learnedResult) {
      results[i] = learnedResult;
    } else {
      needsAI.push({ index: i, description: descriptions[i] });
    }
  }
  
  console.log(`Learned patterns: ${descriptions.length - needsAI.length}, Need AI: ${needsAI.length}`);
  
  // Second pass: AI for remaining
  if (needsAI.length > 0) {
    const userCategories = await getUserCategories(userId);
    const aiDescriptions = needsAI.map(n => n.description);
    const aiResults = await processAIBatch(aiDescriptions, userCategories, userContext);
    
    needsAI.forEach((item, idx) => {
      results[item.index] = aiResults[idx];
    });
  }
  
  // Ensure all results have values
  return results.map(r => r || { category: 'Uncategorized', confidence: 0.3 });
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = buildCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    if (body.testMode) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'AI categorization with learning ready (Gemini)' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const userId = body.userId || '';
    const userContext = body.userContext as { mostUsedCategories?: string[] } | undefined;

    // Handle batch processing
    if (body.batchMode && body.descriptions && Array.isArray(body.descriptions)) {
      console.log(`Processing ${body.descriptions.length} transactions with learning + AI`);
      
      const BATCH_SIZE = 50; // Smaller batches for better accuracy
      const chunks = chunkArray(body.descriptions, BATCH_SIZE);
      const allResults: CategoryResult[] = [];
      
      let learnedCount = 0;
      let aiCount = 0;
      
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Processing chunk ${i + 1}/${chunks.length}`);
        
        try {
          const chunkResults = await processBatchWithLearning(chunks[i], userId, userContext);
          allResults.push(...chunkResults);
          
          // Count sources
          chunkResults.forEach(r => {
            if (r.confidence >= 0.95) learnedCount++;
            else aiCount++;
          });
          
          // Rate limit delay
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (chunkError) {
          console.error(`Chunk ${i + 1} error:`, chunkError);
          allResults.push(...chunks[i].map(() => ({ category: 'Uncategorized', confidence: 0.3 })));
        }
      }
      
      console.log(`Complete: ${allResults.length} categorized (${learnedCount} learned, ${aiCount} AI)`);
      
      return new Response(JSON.stringify({ 
        categories: allResults.map(r => r.category),
        confidences: allResults.map(r => r.confidence),
        results: allResults,
        source: 'gemini_ai_with_learning',
        stats: {
          total: allResults.length,
          learnedPatterns: learnedCount,
          aiCategorized: aiCount,
          lowConfidence: allResults.filter(r => r.confidence < 0.7).length
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle single transaction
    if (!body.description) {
      throw new Error('Description is required');
    }

    // Check learned patterns first
    const learnedResult = await checkLearnedPatterns(userId, body.description);
    if (learnedResult) {
      return new Response(JSON.stringify({ 
        category: learnedResult.category,
        confidence: learnedResult.confidence,
        source: 'learned_pattern'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fall back to AI
    const userCategories = await getUserCategories(userId);
    const aiResults = await processAIBatch([body.description], userCategories, userContext);
    const result = aiResults[0] || { category: 'Uncategorized', confidence: 0.3 };

    return new Response(JSON.stringify({ 
      category: result.category,
      confidence: result.confidence,
      source: 'gemini_ai'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Categorization error:', error);
    return new Response(JSON.stringify({ 
      category: 'Uncategorized',
      confidence: 0.3,
      source: 'error',
      error: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
