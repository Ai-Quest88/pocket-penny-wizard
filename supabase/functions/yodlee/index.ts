
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

async function getYodleeToken() {
  const clientId = Deno.env.get('YODLEE_CLIENT_ID')!
  const clientSecret = Deno.env.get('YODLEE_SECRET')!
  const apiUrl = Deno.env.get('YODLEE_API_URL')!

  const authString = btoa(`${clientId}:${clientSecret}`)
  
  const response = await fetch(`${apiUrl}/auth/token`, {
    method: 'POST',
    headers: {
      'Api-Version': '1.1',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${authString}`
    },
    body: 'grant_type=client_credentials'
  })

  if (!response.ok) {
    throw new Error('Failed to get Yodlee token')
  }

  const data = await response.json()
  return data.access_token
}

async function linkYodleeAccount(token: string, accountData: any, userId: string) {
  const { data, error } = await supabase
    .from('yodlee_accounts')
    .insert({
      user_id: userId,
      yodlee_account_id: accountData.id,
      account_name: accountData.accountName,
      account_type: accountData.accountType,
      provider_name: accountData.providerName,
    })
    .select()
    .single()

  if (error) {
    throw new Error('Failed to link account: ' + error.message)
  }

  return data
}

async function syncTransactions(token: string, accountId: string, userId: string) {
  const apiUrl = Deno.env.get('YODLEE_API_URL')!
  
  const response = await fetch(`${apiUrl}/transactions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Api-Version': '1.1'
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch transactions')
  }

  const transactions = await response.json()
  
  // Insert transactions into our database
  const { data, error } = await supabase
    .from('transactions')
    .insert(
      transactions.transaction.map((t: any) => ({
        user_id: userId,
        yodlee_account_id: accountId,
        description: t.description.original,
        amount: t.amount.amount,
        currency: t.amount.currency,
        category: t.category.detailed,
        date: t.date,
      }))
    )

  if (error) {
    throw new Error('Failed to sync transactions: ' + error.message)
  }

  return data
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const token = await getYodleeToken()
    const { action, accountData } = await req.json()
    const authHeader = req.headers.get('Authorization')!
    const userToken = authHeader.replace('Bearer ', '')
    
    // Get the user ID from the JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(userToken)
    if (userError || !user) throw new Error('Unauthorized')

    let result
    switch (action) {
      case 'linkAccount':
        result = await linkYodleeAccount(token, accountData, user.id)
        break
      case 'syncTransactions':
        result = await syncTransactions(token, accountData.accountId, user.id)
        break
      default:
        throw new Error('Invalid action')
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  }
})
