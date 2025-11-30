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

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
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
    console.log('Gemini API full response:', JSON.stringify(data, null, 2));
    
    // Check if content was blocked by safety filters
    if (data.candidates?.[0]?.finishReason === 'SAFETY') {
      throw new Error('Content was blocked by Gemini safety filters');
    }
    
    // Extract the summary text if present
    const summaryFromGemini = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    let summary = summaryFromGemini;

    // Fallback: if Gemini returned no visible text (e.g. only internal "thoughts" tokens),
    // generate a simple statistical summary directly in the function so the user still
    // gets useful output instead of an error.
    if (!summary) {
      console.warn('No summary text found in response, generating fallback summary. Full response:', data);

      const totalCount = transactions.length;
      const amounts = transactions.map((t: any) => Number(t.amount) || 0);
      const incomeTotal = amounts.filter(a => a > 0).reduce((a, b) => a + b, 0);
      const expenseTotal = amounts.filter(a => a < 0).reduce((a, b) => a + b, 0);

      const dates = transactions
        .map((t: any) => t.date)
        .filter((d: any) => typeof d === 'string' && d.trim().length > 0)
        .sort();

      const dateRange = dates.length > 0
        ? `${dates[0]} to ${dates[dates.length - 1]}`
        : 'Unknown (no valid dates found)';

      const sortedByAmount = [...transactions].sort((a: any, b: any) => Math.abs(b.amount) - Math.abs(a.amount));
      const topSample = sortedByAmount.slice(0, 3).map((t: any) => `${t.date || 'N/A'} - ${t.description || 'No description'}: $${t.amount}`);

      summary = [
        'AI summary was unavailable from Gemini, so a basic statistical summary was generated instead.',
        '',
        `1. Total transaction count: ${totalCount}`,
        `2. Date range: ${dateRange}`,
        `3. Total income (positive amounts): $${incomeTotal.toFixed(2)}`,
        `4. Total expenses (negative amounts): $${expenseTotal.toFixed(2)}`,
        topSample.length > 0
          ? `5. Largest transactions (by absolute amount):\n   - ${topSample.join('\n   - ')}`
          : '5. Largest transactions: Not enough data to determine.',
      ].join('\n');
    }

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