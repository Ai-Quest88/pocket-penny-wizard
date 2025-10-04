import { http, HttpResponse } from 'msw'

export const handlers = [
  // Supabase Auth endpoints
  http.post('https://test.supabase.co/auth/v1/signup', () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z'
      },
      session: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600
      }
    })
  }),

  http.post('https://test.supabase.co/auth/v1/token', () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z'
      },
      session: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600
      }
    })
  }),

  // Supabase Database endpoints
  http.get('https://test.supabase.co/rest/v1/entities', () => {
    return HttpResponse.json([
      {
        id: 'entity-1',
        name: 'Personal',
        type: 'Individual',
        country_of_residence: 'AU',
        user_id: 'test-user-id'
      }
    ])
  }),

  http.get('https://test.supabase.co/rest/v1/transactions', () => {
    return HttpResponse.json([
      {
        id: 'transaction-1',
        description: 'Test Transaction',
        amount: -50.00,
        currency: 'AUD',
        date: '2024-01-01',
        category: 'Groceries',
        user_id: 'test-user-id'
      }
    ])
  }),

  http.get('https://test.supabase.co/rest/v1/assets', () => {
    return HttpResponse.json([
      {
        id: 'asset-1',
        name: 'Savings Account',
        category: 'Cash',
        value: 10000.00,
        currency: 'AUD',
        user_id: 'test-user-id'
      }
    ])
  }),

  http.get('https://test.supabase.co/rest/v1/liabilities', () => {
    return HttpResponse.json([
      {
        id: 'liability-1',
        name: 'Credit Card',
        category: 'Credit Card',
        amount: 2000.00,
        currency: 'AUD',
        user_id: 'test-user-id'
      }
    ])
  }),

  // Google Gemini AI endpoints
  http.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', () => {
    return HttpResponse.json({
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              category: 'Groceries',
              confidence: 0.95
            })
          }]
        }
      }]
    })
  }),

  // Exchange rate API
  http.get('https://open.er-api.com/v6/latest/USD', () => {
    return HttpResponse.json({
      base: 'USD',
      rates: {
        AUD: 1.5,
        EUR: 0.85,
        GBP: 0.75,
        JPY: 110
      },
      timestamp: Date.now()
    })
  }),

  // Supabase Database endpoints for smart categorization
  http.get('https://test.supabase.co/rest/v1/system_keyword_rules', () => {
    return HttpResponse.json([
      {
        id: 'rule-1',
        keywords: ['uber eats', 'ubereats'],
        category_name: 'Food & Dining',
        confidence: 0.95,
        priority: 1,
        is_active: true
      },
      {
        id: 'rule-2',
        keywords: ['woolworths', 'coles'],
        category_name: 'Food & Dining',
        confidence: 0.90,
        priority: 1,
        is_active: true
      },
      {
        id: 'rule-3',
        keywords: ['netflix'],
        category_name: 'Entertainment',
        confidence: 0.90,
        priority: 1,
        is_active: true
      }
    ])
  }),

  // Supabase Edge Functions
  http.post('https://test.supabase.co/functions/v1/categorize-transaction', () => {
    return HttpResponse.json({
      categories: [
        {
          category_name: 'Entertainment',
          confidence: 0.8
        },
        {
          category_name: 'Transportation', 
          confidence: 0.7
        }
      ]
    })
  }),

  http.post('https://test.supabase.co/functions/v1/discover-categories', () => {
    return HttpResponse.json({
      categories: ['Groceries', 'Transportation', 'Entertainment'],
      groups: {
        'Living Expenses': ['Groceries', 'Transportation'],
        'Lifestyle': ['Entertainment']
      }
    })
  })
]
