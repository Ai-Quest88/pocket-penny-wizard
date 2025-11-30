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

    console.log('Compiling knowledge for user:', user.id)

    // 1. Gather transaction data
    const { data: transactions } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    // 2. Get user corrections
    const { data: corrections } = await supabaseClient
      .from('user_category_corrections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    // 3. Get merchant mappings
    const { data: merchants } = await supabaseClient
      .from('user_merchant_mappings')
      .select('*, categories(name, type)')
      .eq('user_id', user.id)

    // 4. Get active goals
    const { data: goals } = await supabaseClient
      .from('user_financial_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')

    // 5. Get assets and liabilities for net worth
    const { data: assets } = await supabaseClient
      .from('assets')
      .select('value, type')
      .eq('user_id', user.id)

    const { data: liabilities } = await supabaseClient
      .from('liabilities')
      .select('amount, type')
      .eq('user_id', user.id)

    // Calculate financial metrics
    const incomeTransactions = transactions?.filter(t => parseFloat(t.amount) > 0) || []
    const expenseTransactions = transactions?.filter(t => parseFloat(t.amount) < 0) || []
    
    const avgMonthlyIncome = incomeTransactions.length > 0
      ? incomeTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0) / 3
      : 0

    const avgMonthlyExpenses = expenseTransactions.length > 0
      ? expenseTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0) / 3
      : 0

    const totalAssets = assets?.reduce((sum, a) => sum + parseFloat(a.value), 0) || 0
    const totalLiabilities = liabilities?.reduce((sum, l) => sum + parseFloat(l.amount), 0) || 0
    const netWorth = totalAssets - totalLiabilities

    const savingsRate = avgMonthlyIncome > 0
      ? ((avgMonthlyIncome - avgMonthlyExpenses) / avgMonthlyIncome * 100)
      : 0

    // Determine financial personality
    let financialPersonality = 'Balanced'
    if (savingsRate > 30) financialPersonality = 'Aggressive Saver'
    else if (savingsRate > 15) financialPersonality = 'Conscious Saver'
    else if (savingsRate < 5) financialPersonality = 'Active Spender'

    // Build knowledge document
    const knowledgeDocument = {
      lastUpdated: new Date().toISOString(),
      profile: {
        financialPersonality,
        totalTransactionsAnalyzed: transactions?.length || 0,
        memberSince: user.created_at,
      },
      merchantKnowledge: merchants?.map(m => ({
        pattern: m.merchant_pattern,
        preferredCategory: m.categories?.name || 'Uncategorized',
        confidence: m.times_confirmed / Math.max(m.times_used, 1),
        averageAmount: m.average_amount,
        timesUsed: m.times_used,
      })) || [],
      spendingBehavior: {
        averageMonthlyIncome: avgMonthlyIncome,
        averageMonthlyExpenses: avgMonthlyExpenses,
        savingsRate: savingsRate.toFixed(1),
      },
      recentLearnings: corrections?.map(c => ({
        description: c.description,
        from: c.original_category,
        to: c.corrected_category,
        learnedAt: c.created_at,
      })) || [],
      financialPosition: {
        netWorth,
        totalAssets,
        totalLiabilities,
      },
      activeGoals: goals?.map(g => ({
        name: g.name,
        progress: (g.current_amount / g.target_amount * 100).toFixed(1) + '%',
        onTrack: g.current_amount >= g.target_amount * 0.8,
      })) || [],
    }

    // Save to user_financial_profile
    const { error: upsertError } = await supabaseClient
      .from('user_financial_profile')
      .upsert({
        user_id: user.id,
        knowledge_document: knowledgeDocument,
        typical_monthly_income: avgMonthlyIncome,
        typical_monthly_expenses: avgMonthlyExpenses,
        spending_personality: financialPersonality,
        total_transactions_analyzed: transactions?.length || 0,
        corrections_count: corrections?.length || 0,
        last_compiled_at: new Date().toISOString(),
      })

    if (upsertError) throw upsertError

    console.log('Knowledge compiled successfully for user:', user.id)

    return new Response(
      JSON.stringify({ success: true, knowledge: knowledgeDocument }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error compiling knowledge:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})