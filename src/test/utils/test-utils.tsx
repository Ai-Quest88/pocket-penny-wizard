import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import { CurrencyProvider } from '../../contexts/CurrencyContext'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  currency_preference: 'AUD',
  created_at: '2024-01-01T00:00:00Z'
}

// Mock entity data
export const mockEntity = {
  id: 'entity-1',
  name: 'Personal',
  type: 'Individual' as const,
  country_of_residence: 'AU',
  user_id: 'test-user-id'
}

// Mock transaction data
export const mockTransaction = {
  id: 'transaction-1',
  description: 'Test Transaction',
  amount: -50.00,
  currency: 'AUD',
  date: '2024-01-01',
  category: 'Groceries',
  user_id: 'test-user-id',
  entity_id: 'entity-1'
}

// Mock asset data
export const mockAsset = {
  id: 'asset-1',
  name: 'Savings Account',
  category: 'Cash' as const,
  value: 10000.00,
  currency: 'AUD',
  user_id: 'test-user-id',
  entity_id: 'entity-1'
}

// Mock liability data
export const mockLiability = {
  id: 'liability-1',
  name: 'Credit Card',
  category: 'Credit Card' as const,
  amount: 2000.00,
  currency: 'AUD',
  user_id: 'test-user-id',
  entity_id: 'entity-1'
}

// Mock budget data
export const mockBudget = {
  id: 'budget-1',
  category: 'Groceries',
  amount: 500.00,
  period: 'monthly' as const,
  start_date: '2024-01-01',
  user_id: 'test-user-id',
  entity_id: 'entity-1'
}

// Helper function to create mock data arrays
export const createMockTransactions = (count: number) => 
  Array.from({ length: count }, (_, i) => ({
    ...mockTransaction,
    id: `transaction-${i + 1}`,
    description: `Transaction ${i + 1}`,
    amount: -Math.random() * 100,
    date: `2024-01-${String(i + 1).padStart(2, '0')}`
  }))

export const createMockAssets = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    ...mockAsset,
    id: `asset-${i + 1}`,
    name: `Asset ${i + 1}`,
    value: Math.random() * 50000
  }))

export const createMockLiabilities = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    ...mockLiability,
    id: `liability-${i + 1}`,
    name: `Liability ${i + 1}`,
    amount: Math.random() * 10000
  }))

// Helper function to wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper function to mock API responses
export const mockApiResponse = <T>(data: T, delay = 0) => 
  new Promise<T>(resolve => setTimeout(() => resolve(data), delay))

// Helper function to create mock file
export const createMockFile = (name: string, content: string, type = 'text/csv') => {
  const file = new File([content], name, { type })
  return file
}

// Helper function to create mock CSV content
export const createMockCSVContent = (transactions: any[]) => {
  const headers = ['Date', 'Description', 'Amount', 'Currency']
  const rows = transactions.map(t => [
    t.date,
    t.description,
    t.amount.toString(),
    t.currency
  ])
  
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
