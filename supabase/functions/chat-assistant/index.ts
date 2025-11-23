import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
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

    const { message, conversationHistory = [] } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Chat assistant request from user ${user.id}: ${message}`);

    // Fetch relevant financial context
    const financialContext = await gatherFinancialContext(supabaseClient, user.id);

    // Build conversation with context
    const systemPrompt = buildSystemPrompt(financialContext);
    const messages = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...conversationHistory.map((msg: Message) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    console.log('Sending request to Gemini with context');

    // Call Gemini API with streaming
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages,
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
        JSON.stringify({ error: 'AI response failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return the streaming response
    return new Response(geminiResponse.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in chat-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function gatherFinancialContext(supabaseClient: any, userId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch recent transactions
  const { data: transactions } = await supabaseClient
    .from('transactions')
    .select('id, description, amount, date, type, currency, category_id')
    .eq('user_id', userId)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: false })
    .limit(50);

  // Fetch categories
  const { data: categories } = await supabaseClient
    .from('categories')
    .select('id, name, type')
    .or(`user_id.eq.${userId},is_system.eq.true`);

  const categoryMap = new Map(categories?.map((c: any) => [c.id, c]) || []);

  // Fetch budgets
  const { data: budgets } = await supabaseClient
    .from('budgets')
    .select('name, amount, period, start_date, end_date, currency')
    .eq('user_id', userId)
    .eq('is_active', true);

  // Fetch assets
  const { data: assets } = await supabaseClient
    .from('assets')
    .select('name, value, type, currency')
    .eq('user_id', userId);

  // Fetch liabilities
  const { data: liabilities } = await supabaseClient
    .from('liabilities')
    .select('name, amount, type, interest_rate, currency')
    .eq('user_id', userId);

  // Aggregate transaction data
  let totalIncome = 0;
  let totalExpenses = 0;
  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  const categorySpending: Record<string, number> = {};

  transactions?.forEach((t: any) => {
    const amount = Math.abs(t.amount);
    const category = categoryMap.get(t.category_id);
    const categoryName = category?.name || 'Uncategorized';
    const transDate = new Date(t.date);

    if (t.type === 'income') {
      totalIncome += amount;
      if (transDate >= startOfMonth) monthlyIncome += amount;
    } else if (t.type === 'expense') {
      totalExpenses += amount;
      if (transDate >= startOfMonth) monthlyExpenses += amount;
      categorySpending[categoryName] = (categorySpending[categoryName] || 0) + amount;
    }
  });

  const topCategories = Object.entries(categorySpending)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }));

  const totalAssets = assets?.reduce((sum: number, a: any) => sum + a.value, 0) || 0;
  const totalLiabilities = liabilities?.reduce((sum: number, a: any) => sum + a.amount, 0) || 0;

  return {
    summary: {
      totalIncome,
      totalExpenses,
      netCashFlow: totalIncome - totalExpenses,
      monthlyIncome,
      monthlyExpenses,
      monthlyNetCashFlow: monthlyIncome - monthlyExpenses,
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      transactionCount: transactions?.length || 0,
    },
    topCategories,
    budgets: budgets || [],
    recentTransactions: transactions?.slice(0, 10) || [],
  };
}

function buildSystemPrompt(context: any): string {
  const { summary, topCategories, budgets, recentTransactions } = context;

  return `You are a knowledgeable financial assistant helping a user manage their personal finances. You have access to their real financial data and should provide personalized, actionable advice.

FINANCIAL CONTEXT (Last 30 Days):
- Total Income: $${summary.totalIncome.toFixed(2)}
- Total Expenses: $${summary.totalExpenses.toFixed(2)}
- Net Cash Flow: $${summary.netCashFlow.toFixed(2)}
- This Month Income: $${summary.monthlyIncome.toFixed(2)}
- This Month Expenses: $${summary.monthlyExpenses.toFixed(2)}
- This Month Net: $${summary.monthlyNetCashFlow.toFixed(2)}
- Total Assets: $${summary.totalAssets.toFixed(2)}
- Total Liabilities: $${summary.totalLiabilities.toFixed(2)}
- Net Worth: $${summary.netWorth.toFixed(2)}
- Transactions Analyzed: ${summary.transactionCount}

TOP SPENDING CATEGORIES:
${topCategories.map((c: any, i: number) => `${i + 1}. ${c.name}: $${c.amount.toFixed(2)}`).join('\n')}

ACTIVE BUDGETS:
${budgets.length > 0 ? budgets.map((b: any) => `- ${b.name}: $${b.amount} (${b.period})`).join('\n') : 'No active budgets'}

RECENT TRANSACTIONS (Last 10):
${recentTransactions.map((t: any) => `- ${t.date}: ${t.description || 'Unknown'} - $${Math.abs(t.amount).toFixed(2)} (${t.type})`).join('\n')}

INSTRUCTIONS:
- Answer questions about their finances using the data above
- Provide specific insights with actual numbers from their data
- Give actionable recommendations based on their spending patterns
- Be conversational and friendly, but professional
- If asked about something not in the data, be honest about limitations
- Keep responses concise but informative (2-4 paragraphs max)
- Use bullet points for lists or multiple suggestions
- When discussing money, always include dollar amounts for context

User's question follows:`;
}
