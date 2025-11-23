import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category_id: string;
  type: string;
  currency: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Insight {
  type: 'warning' | 'savings' | 'trend' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { dateRange = 90 } = await req.json().catch(() => ({ dateRange: 90 }));

    console.log(`Analyzing transactions for user ${user.id} over ${dateRange} days`);

    // Fetch transactions from the last N days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);

    const { data: transactions, error: transError } = await supabaseClient
      .from('transactions')
      .select('id, description, amount, date, category_id, type, currency')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (transError) {
      console.error('Error fetching transactions:', transError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch transactions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch categories
    const { data: categories, error: catError } = await supabaseClient
      .from('categories')
      .select('id, name, type')
      .or(`user_id.eq.${user.id},is_system.eq.true`);

    if (catError) {
      console.error('Error fetching categories:', catError);
    }

    const categoryMap = new Map(categories?.map(c => [c.id, c]) || []);

    // Aggregate transaction data
    const aggregatedData = aggregateTransactions(transactions || [], categoryMap);

    console.log('Aggregated data:', JSON.stringify(aggregatedData, null, 2));

    // Call Gemini API for insights
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = buildAnalysisPrompt(aggregatedData, dateRange);
    
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('AI Response:', aiResponse);

    // Parse AI response into structured insights
    const insights = parseAIInsights(aiResponse, aggregatedData);

    return new Response(
      JSON.stringify({
        insights,
        summary: aggregatedData,
        analyzedTransactions: transactions?.length || 0,
        dateRange
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-transactions function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function aggregateTransactions(transactions: Transaction[], categoryMap: Map<string, Category>) {
  let totalIncome = 0;
  let totalExpenses = 0;
  const categorySpending: Record<string, { amount: number; count: number; name: string }> = {};
  const monthlyTrend: Record<string, { income: number; expenses: number }> = {};
  const merchantFrequency: Record<string, number> = {};

  transactions.forEach(t => {
    const amount = Math.abs(t.amount);
    const category = categoryMap.get(t.category_id || '');
    const categoryName = category?.name || 'Uncategorized';
    const month = t.date.substring(0, 7); // YYYY-MM

    if (t.type === 'income') {
      totalIncome += amount;
      monthlyTrend[month] = monthlyTrend[month] || { income: 0, expenses: 0 };
      monthlyTrend[month].income += amount;
    } else if (t.type === 'expense') {
      totalExpenses += amount;
      monthlyTrend[month] = monthlyTrend[month] || { income: 0, expenses: 0 };
      monthlyTrend[month].expenses += amount;

      categorySpending[categoryName] = categorySpending[categoryName] || { amount: 0, count: 0, name: categoryName };
      categorySpending[categoryName].amount += amount;
      categorySpending[categoryName].count += 1;
    }

    // Track merchant frequency
    if (t.description) {
      const merchant = t.description.split(/[^a-zA-Z0-9]/)[0] || t.description;
      merchantFrequency[merchant] = (merchantFrequency[merchant] || 0) + 1;
    }
  });

  const topCategories = Object.values(categorySpending)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const topMerchants = Object.entries(merchantFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    totalIncome,
    totalExpenses,
    netCashFlow: totalIncome - totalExpenses,
    topCategories,
    topMerchants,
    monthlyTrend: Object.entries(monthlyTrend).map(([month, data]) => ({ month, ...data })),
    transactionCount: transactions.length,
    averageTransaction: transactions.length > 0 ? totalExpenses / transactions.length : 0
  };
}

function buildAnalysisPrompt(data: any, dateRange: number): string {
  return `You are a financial advisor analyzing ${dateRange} days of transaction data. Generate 3-5 actionable financial insights in JSON format.

Transaction Summary:
- Total Income: $${data.totalIncome.toFixed(2)}
- Total Expenses: $${data.totalExpenses.toFixed(2)}
- Net Cash Flow: $${data.netCashFlow.toFixed(2)}
- Transaction Count: ${data.transactionCount}
- Average Transaction: $${data.averageTransaction.toFixed(2)}

Top Spending Categories:
${data.topCategories.map((c: any, i: number) => `${i + 1}. ${c.name}: $${c.amount.toFixed(2)} (${c.count} transactions)`).join('\n')}

Top Merchants:
${data.topMerchants.map((m: any, i: number) => `${i + 1}. ${m.name}: ${m.count} transactions`).join('\n')}

Monthly Trend:
${data.monthlyTrend.map((m: any) => `${m.month}: Income $${m.income.toFixed(2)}, Expenses $${m.expenses.toFixed(2)}`).join('\n')}

Provide insights as a JSON array with this structure:
[
  {
    "type": "warning|savings|trend|recommendation",
    "title": "Short insight title",
    "description": "Detailed explanation with specific numbers and actionable advice",
    "confidence": 0.0-1.0,
    "impact": "high|medium|low",
    "actionable": true|false
  }
]

Focus on:
1. Spending patterns and unusual activity
2. Opportunities to save money
3. Budget recommendations
4. Cash flow trends
5. Category-specific insights

Return ONLY valid JSON array, no markdown or extra text.`;
}

function parseAIInsights(aiResponse: string, data: any): Insight[] {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error('Failed to parse AI insights:', error);
  }

  // Fallback: Generate basic insights from data
  const insights: Insight[] = [];

  if (data.netCashFlow < 0) {
    insights.push({
      type: 'warning',
      title: 'Negative Cash Flow',
      description: `Your expenses exceeded income by $${Math.abs(data.netCashFlow).toFixed(2)} over the analyzed period. Consider reviewing your top spending categories.`,
      confidence: 0.95,
      impact: 'high',
      actionable: true
    });
  }

  if (data.topCategories.length > 0) {
    const topCategory = data.topCategories[0];
    insights.push({
      type: 'trend',
      title: `Highest Spending: ${topCategory.name}`,
      description: `You spent $${topCategory.amount.toFixed(2)} in ${topCategory.name} (${topCategory.count} transactions). This represents ${((topCategory.amount / data.totalExpenses) * 100).toFixed(1)}% of your total expenses.`,
      confidence: 0.9,
      impact: 'medium',
      actionable: true
    });
  }

  return insights;
}
