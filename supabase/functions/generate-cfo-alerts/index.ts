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

    console.log('Generating CFO alerts for user:', user.id)

    const alerts = []

    // Load user's financial profile
    const { data: profile } = await supabaseClient
      .from('user_financial_profile')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const knowledge = profile?.knowledge_document || {}

    // Get recent transactions (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentTransactions } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])

    // Alert 1: High spending detection
    const recentExpenses = recentTransactions
      ?.filter(t => parseFloat(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0) || 0

    const avgWeeklyExpenses = (knowledge.spendingBehavior?.averageMonthlyExpenses || 0) / 4

    if (recentExpenses > avgWeeklyExpenses * 1.5) {
      alerts.push({
        user_id: user.id,
        alert_type: 'overspending',
        severity: recentExpenses > avgWeeklyExpenses * 2 ? 'critical' : 'warning',
        title: 'High spending detected this week',
        message: `You've spent $${recentExpenses.toFixed(2)} this week, which is ${Math.round((recentExpenses / avgWeeklyExpenses - 1) * 100)}% above your usual weekly spending of $${avgWeeklyExpenses.toFixed(2)}.`,
        data: { current: recentExpenses, average: avgWeeklyExpenses }
      })
    }

    // Alert 2: Goal progress check
    const { data: goals } = await supabaseClient
      .from('user_financial_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (goals) {
      for (const goal of goals) {
        const progress = goal.current_amount / goal.target_amount
        if (progress < 0.5 && goal.target_date) {
          const daysLeft = Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          if (daysLeft < 90 && daysLeft > 0) {
            alerts.push({
              user_id: user.id,
              alert_type: 'goal_progress',
              severity: 'info',
              title: `Goal "${goal.name}" needs attention`,
              message: `You're ${Math.round(progress * 100)}% towards your goal with ${daysLeft} days remaining. Consider increasing your contributions to stay on track.`,
              data: { goalId: goal.id, progress, daysLeft }
            })
          }
        }
      }
    }

    // Alert 3: Savings opportunity
    const savingsRate = parseFloat(knowledge.spendingBehavior?.savingsRate || '0')
    if (savingsRate < 10 && savingsRate >= 0) {
      alerts.push({
        user_id: user.id,
        alert_type: 'opportunity',
        severity: 'info',
        title: 'Savings opportunity identified',
        message: `Your current savings rate is ${savingsRate.toFixed(1)}%. Consider setting aside 10-15% of your income to build financial resilience.`,
        data: { currentRate: savingsRate, targetRate: 15 }
      })
    }

    // Alert 4: Positive reinforcement
    if (savingsRate > 20) {
      alerts.push({
        user_id: user.id,
        alert_type: 'insight',
        severity: 'info',
        title: 'Excellent savings rate!',
        message: `You're saving ${savingsRate.toFixed(1)}% of your income - well above the recommended 15%. Keep up the great work!`,
        data: { savingsRate }
      })
    }

    // Save alerts to database
    if (alerts.length > 0) {
      const { error } = await supabaseClient
        .from('cfo_alerts')
        .insert(alerts)

      if (error) throw error
    }

    console.log(`Generated ${alerts.length} alerts for user:`, user.id)

    return new Response(
      JSON.stringify({ success: true, alertsGenerated: alerts.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating alerts:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})