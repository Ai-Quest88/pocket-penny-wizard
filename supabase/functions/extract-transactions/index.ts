import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
}

interface ExtractionResult {
  transactions: ExtractedTransaction[];
  success: boolean;
  error?: string;
  rawCount?: number;
  extractedCount?: number;
}

// Chunk CSV text into smaller pieces for processing
const chunkCsvText = (csvText: string, rowsPerChunk: number = 50): string[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];
  
  const headerLine = lines[0];
  const dataLines = lines.slice(1);
  const chunks: string[] = [];
  
  for (let i = 0; i < dataLines.length; i += rowsPerChunk) {
    const chunkLines = dataLines.slice(i, i + rowsPerChunk);
    chunks.push([headerLine, ...chunkLines].join('\n'));
  }
  
  return chunks;
};

// Create the extraction prompt for Gemini
const createExtractionPrompt = (csvChunk: string): string => {
  return `You are a CSV transaction extraction AI. Extract transactions from this CSV data and return them as a JSON array.

RULES:
1. Detect the date format automatically (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, "01 Jan 2025", etc.)
2. Convert all dates to ISO format (YYYY-MM-DD)
3. If there are separate credit/debit columns, combine into single amount (negative for expenses)
4. Clean descriptions (remove extra spaces, trailing reference numbers)
5. Determine type from amount sign or column headers:
   - Negative amounts or "debit" columns = expense
   - Positive amounts or "credit" columns = income
   - Keywords like "transfer", "tfr", "xfer" = transfer
6. Remove currency symbols from amounts, return as numbers
7. Skip empty rows or header-only rows
8. Handle quoted fields with commas inside

CSV DATA:
${csvChunk}

Return ONLY a valid JSON array with this exact structure (no markdown, no explanations):
[
  {
    "date": "2024-01-15",
    "description": "Woolworths Sydney",
    "amount": -85.50,
    "type": "expense"
  }
]

If a row cannot be parsed, skip it. Return empty array [] if no valid transactions found.`;
};

// Process a single CSV chunk with Gemini
const processChunk = async (csvChunk: string): Promise<ExtractedTransaction[]> => {
  const prompt = createExtractionPrompt(csvChunk);
  
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
      maxOutputTokens: 8192,
    }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Gemini API error:', errorBody);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  let content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  
  if (!content) {
    console.error('No content in Gemini response');
    return [];
  }

  // Clean up response - remove markdown formatting
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      // Validate and normalize each transaction
      return parsed
        .filter((tx: any) => tx.date && tx.description && typeof tx.amount === 'number')
        .map((tx: any) => ({
          date: tx.date,
          description: tx.description.trim(),
          amount: Number(tx.amount),
          type: tx.type || (tx.amount >= 0 ? 'income' : 'expense')
        }));
    }
    return [];
  } catch (parseError) {
    console.error('Failed to parse chunk response:', parseError);
    console.error('Raw content:', content);
    return [];
  }
};

// Main extraction function with chunked processing
const extractTransactions = async (csvText: string): Promise<ExtractionResult> => {
  try {
    const lines = csvText.trim().split('\n');
    const rawCount = lines.length - 1; // Exclude header
    
    console.log(`Starting extraction for ${rawCount} rows`);
    
    // Split into chunks for processing
    const chunks = chunkCsvText(csvText, 50);
    console.log(`Split into ${chunks.length} chunks`);
    
    const allTransactions: ExtractedTransaction[] = [];
    
    // Process chunks sequentially to avoid rate limits
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);
      
      try {
        const chunkTransactions = await processChunk(chunks[i]);
        allTransactions.push(...chunkTransactions);
        
        // Small delay between chunks to avoid rate limits
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (chunkError) {
        console.error(`Error processing chunk ${i + 1}:`, chunkError);
        // Continue with next chunk
      }
    }
    
    console.log(`Extraction complete: ${allTransactions.length} transactions from ${rawCount} rows`);
    
    return {
      transactions: allTransactions,
      success: true,
      rawCount,
      extractedCount: allTransactions.length
    };
  } catch (error) {
    console.error('Extraction error:', error);
    return {
      transactions: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
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
    
    // Test mode
    if (body.testMode) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'AI CSV Extraction ready (Gemini)' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    if (!body.csvText || typeof body.csvText !== 'string') {
      throw new Error('csvText is required and must be a string');
    }

    const result = await extractTransactions(body.csvText);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in extract-transactions function:', error);
    return new Response(JSON.stringify({ 
      transactions: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});




