import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactions } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log('📊 Analyzing uploaded transactions:', transactions.length);

    // Prepare transaction summary for AI
    const transactionSummary = transactions.slice(0, 50).map((t: any) => 
      `${t.date}: ${t.description} - $${t.amount}`
    ).join('\n');

    const prompt = `You are a financial AI assistant analyzing uploaded transaction data. 
Provide a concise, insightful summary covering:
1. Total transaction count and date range
2. Top spending categories (estimate from descriptions)
3. Largest expenses and income
4. Notable patterns or anomalies
5. Key financial insights

Be specific with numbers and dates. Keep the summary under 300 words.

Analyze these transactions:

${transactionSummary}

Total transactions: ${transactions.length}`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate summary.';

    console.log('✅ Analysis complete');

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Analysis error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});