import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const { messages } = await req.json()
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    // Load user's financial knowledge
    const { data: profile } = await supabaseClient
      .from('user_financial_profile')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const knowledge = profile?.knowledge_document || {}

    // Build enhanced CFO system prompt with user's specific data
    const systemPrompt = `You are ${user.email?.split('@')[0]}'s Personal CFO - a trusted financial advisor who knows them deeply.

USER'S FINANCIAL PROFILE:
========================
Financial Personality: ${profile?.spending_personality || 'Unknown'}
Risk Tolerance: ${profile?.risk_tolerance || 'moderate'}
Member Since: ${knowledge.profile?.memberSince || 'Recently'}
Transactions Analyzed: ${knowledge.profile?.totalTransactionsAnalyzed || 0}

FINANCIAL POSITION:
==================
Net Worth: $${knowledge.financialPosition?.netWorth?.toFixed(2) || '0.00'}
Total Assets: $${knowledge.financialPosition?.totalAssets?.toFixed(2) || '0.00'}
Total Liabilities: $${knowledge.financialPosition?.totalLiabilities?.toFixed(2) || '0.00'}

SPENDING BEHAVIOR:
=================
Average Monthly Income: $${knowledge.spendingBehavior?.averageMonthlyIncome?.toFixed(2) || '0.00'}
Average Monthly Expenses: $${knowledge.spendingBehavior?.averageMonthlyExpenses?.toFixed(2) || '0.00'}
Savings Rate: ${knowledge.spendingBehavior?.savingsRate || '0'}%

ACTIVE GOALS:
=============
${knowledge.activeGoals?.length > 0 
  ? knowledge.activeGoals.map(g => `- ${g.name}: ${g.progress} (${g.onTrack ? 'On Track' : 'Behind'})`).join('\n')
  : 'No active goals set yet'}

KNOWN PREFERENCES (from past corrections):
==========================================
${knowledge.recentLearnings?.length > 0
  ? knowledge.recentLearnings.map(l => `- "${l.description}": User prefers "${l.to}" over "${l.from}"`).join('\n')
  : 'No learned preferences yet'}

MERCHANT KNOWLEDGE:
==================
${knowledge.merchantKnowledge?.length > 0
  ? knowledge.merchantKnowledge.slice(0, 10).map(m => 
      `- "${m.pattern}" → ${m.preferredCategory} (${(m.confidence * 100).toFixed(0)}% confidence, used ${m.timesUsed} times)`
    ).join('\n')
  : 'No merchant patterns learned yet'}

CFO INSTRUCTIONS:
================
- You KNOW this user. Reference their specific patterns and history.
- Give advice tailored to their financial personality (${profile?.spending_personality || 'Unknown'})
- Be proactive about concerns you see in their data
- Use specific numbers from their actual finances
- Remember their preferences from past interactions
- Be conversational, supportive, and act as a trusted advisor
- If they ask about spending or savings, reference their actual patterns
- Help them achieve their goals with concrete, actionable advice`

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: systemPrompt }]
            },
            ...messages.map((msg: any) => ({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }]
            }))
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I encountered an error generating a response.'

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in cfo-chat:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})