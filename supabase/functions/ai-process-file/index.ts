import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessFileRequest {
  fileContent: string;
  fileType: 'csv' | 'excel' | 'pdf' | 'image';
  mimeType: string;
  userCategories: { name: string; type: string }[];
  accountCurrency: string;
}

interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  confidence: number;
  reasoning: string;
}

interface ProcessFileResponse {
  success: boolean;
  transactions: ExtractedTransaction[];
  summary: string;
  detectedFormat: string;
  warnings: string[];
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { fileContent, fileType, mimeType, userCategories, accountCurrency } = await req.json() as ProcessFileRequest;

    console.log(`Processing ${fileType} file with mime type: ${mimeType}`);
    console.log(`User has ${userCategories.length} categories available`);

    // Build category list for the prompt
    const categoryList = userCategories
      .map(c => `- ${c.name} (${c.type})`)
      .join('\n');

    // Build the extraction prompt
    const extractionPrompt = `You are a financial data extraction AI assistant. Your task is to extract transaction data from the provided file and categorize each transaction.

AVAILABLE CATEGORIES (you MUST use ONLY these exact category names):
${categoryList}

IMPORTANT INSTRUCTIONS:
1. Extract ALL transactions from the file
2. For each transaction, determine:
   - Date (convert to YYYY-MM-DD format)
   - Description (the merchant/payee name or transaction description)
   - Amount (negative for expenses/debits, positive for income/credits)
   - Category (MUST be one of the available categories listed above)
   - Confidence (0.0 to 1.0, how confident you are in the categorization)
   - Reasoning (brief explanation of why you chose this category)

3. If a transaction doesn't fit any category well, use the closest match or "Other Expenses" / "Other Income"
4. Detect the file format (e.g., "Commonwealth Bank CSV", "Westpac PDF Statement", etc.)
5. Note any warnings (duplicates, missing data, unclear entries)

RESPOND WITH VALID JSON ONLY in this exact format:
{
  "detectedFormat": "Bank Name - Format Type",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Original description from file",
      "amount": -45.50,
      "category": "Category Name",
      "confidence": 0.95,
      "reasoning": "Brief explanation"
    }
  ],
  "summary": "Found X transactions from DATE to DATE. Total income: $X, Total expenses: $X",
  "warnings": ["Any issues found"]
}

Currency context: ${accountCurrency}`;

    let requestBody: any;

    // Determine if we need to use multimodal (vision) API
    if (fileType === 'pdf' || fileType === 'image') {
      // Use multimodal API with base64 content
      console.log('Using multimodal API for binary file');
      requestBody = {
        contents: [{
          parts: [
            { text: extractionPrompt },
            {
              inlineData: {
                data: fileContent,
                mimeType: mimeType
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        }
      };
    } else {
      // Use text-only API for CSV/Excel (already converted to text)
      console.log('Using text API for text file');
      requestBody = {
        contents: [{
          parts: [
            { text: `${extractionPrompt}\n\nFILE CONTENT:\n${fileContent}` }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        }
      };
    }

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `AI processing failed: ${geminiResponse.status}`,
          transactions: [],
          summary: '',
          detectedFormat: '',
          warnings: ['AI service temporarily unavailable']
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response received');

    // Extract text content from response
    const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textContent) {
      console.error('No text content in Gemini response:', JSON.stringify(geminiData));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'AI returned empty response',
          transactions: [],
          summary: '',
          detectedFormat: '',
          warnings: ['Could not extract data from file']
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON from response (handle markdown code blocks)
    let parsedResult: ProcessFileResponse;
    try {
      // Remove markdown code blocks if present
      let jsonText = textContent;
      const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }
      
      parsedResult = JSON.parse(jsonText);
      console.log(`Successfully extracted ${parsedResult.transactions?.length || 0} transactions`);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      console.error('Raw response:', textContent.substring(0, 500));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to parse AI response',
          transactions: [],
          summary: '',
          detectedFormat: '',
          warnings: ['AI response was not in expected format']
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and normalize transactions
    const validTransactions = (parsedResult.transactions || []).map((tx, index) => ({
      date: tx.date || new Date().toISOString().split('T')[0],
      description: tx.description || `Transaction ${index + 1}`,
      amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount) || 0,
      category: tx.category || 'Other Expenses',
      confidence: typeof tx.confidence === 'number' ? Math.min(1, Math.max(0, tx.confidence)) : 0.5,
      reasoning: tx.reasoning || 'No reasoning provided'
    }));

    const response: ProcessFileResponse = {
      success: true,
      transactions: validTransactions,
      summary: parsedResult.summary || `Extracted ${validTransactions.length} transactions`,
      detectedFormat: parsedResult.detectedFormat || 'Unknown format',
      warnings: parsedResult.warnings || []
    };

    console.log(`Returning ${response.transactions.length} transactions`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-process-file:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        transactions: [],
        summary: '',
        detectedFormat: '',
        warnings: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
