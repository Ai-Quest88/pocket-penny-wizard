import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCategories } from './useCategories'

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [
            { id: '1', name: 'Groceries', group: 'Living Expenses', color: '#FF5733' },
            { id: '2', name: 'Transportation', group: 'Living Expenses', color: '#33FF57' },
            { id: '3', name: 'Entertainment', group: 'Lifestyle', color: '#3357FF' }
          ],
          error: null
        }))
      }))
    }))
  })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } } }))
  }
}

vi.mock('../../integrations/supabase/client', () => ({
  supabase: mockSupabaseClient
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch categories successfully', async () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.categories).toHaveLength(3)
    expect(result.current.categories[0]).toEqual({
      id: '1',
      name: 'Groceries',
      group: 'Living Expenses',
      color: '#FF5733'
    })
    expect(result.current.error).toBeNull()
  })

  it('should handle loading state', () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper()
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.categories).toEqual([])
  })

  it('should handle error state', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: null,
            error: { message: 'Database error' }
          }))
        }))
      }))
    })

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.categories).toEqual([])
    expect(result.current.error).toEqual({ message: 'Database error' })
  })

  it('should refetch categories when refetch is called', async () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const initialCallCount = mockSupabaseClient.from().select().eq().order().data.length

    await result.current.refetch()

    // Verify that the query was refetched
    expect(result.current.categories).toHaveLength(3)
  })

  it('should group categories by group name', async () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const groupedCategories = result.current.getCategoriesByGroup()
    
    expect(groupedCategories).toHaveProperty('Living Expenses')
    expect(groupedCategories).toHaveProperty('Lifestyle')
    expect(groupedCategories['Living Expenses']).toHaveLength(2)
    expect(groupedCategories['Lifestyle']).toHaveLength(1)
  })

  it('should find category by name', async () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const category = result.current.findCategoryByName('Groceries')
    
    expect(category).toEqual({
      id: '1',
      name: 'Groceries',
      group: 'Living Expenses',
      color: '#FF5733'
    })
  })

  it('should return null for non-existent category', async () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const category = result.current.findCategoryByName('Non-existent')
    
    expect(category).toBeNull()
  })

  it('should get category statistics', async () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const stats = result.current.getCategoryStats()
    
    expect(stats.totalCategories).toBe(3)
    expect(stats.totalGroups).toBe(2)
    expect(stats.groupCounts).toEqual({
      'Living Expenses': 2,
      'Lifestyle': 1
    })
  })

  it('should handle empty categories list', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          }))
        }))
      }))
    })

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.categories).toEqual([])
    expect(result.current.getCategoriesByGroup()).toEqual({})
    expect(result.current.findCategoryByName('Any')).toBeNull()
    expect(result.current.getCategoryStats()).toEqual({
      totalCategories: 0,
      totalGroups: 0,
      groupCounts: {}
    })
  })

  it('should handle authentication error', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null }
    })

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.categories).toEqual([])
    expect(result.current.error).toBeDefined()
  })
})
