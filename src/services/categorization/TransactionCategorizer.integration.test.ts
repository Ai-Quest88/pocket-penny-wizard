import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TransactionCategorizer } from './TransactionCategorizer'
import { SmartCategorizer } from './SmartCategorizer'
import { ImprovedHybridCategorizer } from './ImprovedHybridCategorizer'
import { featureFlags } from './FeatureFlags'

// Mock the new categorization system
vi.mock('./SmartCategorizer')
vi.mock('./ImprovedHybridCategorizer')
vi.mock('./FeatureFlags', () => ({
  featureFlags: {
    shouldUseSmartCategorization: vi.fn()
  }
}))

describe('TransactionCategorizer Integration', () => {
  let categorizer: TransactionCategorizer
  let mockSmartCategorizer: any
  let mockImprovedCategorizer: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup mocks
    mockSmartCategorizer = {
      categorizeTransactions: vi.fn()
    }
    
    mockImprovedCategorizer = {
      categorizeTransactions: vi.fn()
    }

    // Mock the constructors
    vi.mocked(SmartCategorizer).mockImplementation(() => mockSmartCategorizer)
    vi.mocked(ImprovedHybridCategorizer).mockImplementation(() => mockImprovedCategorizer)

    // Mock feature flags to use smart categorization by default
    vi.mocked(featureFlags.shouldUseSmartCategorization).mockReturnValue(true)

    categorizer = new TransactionCategorizer('test-user-id')
  })

  describe('categorizeTransaction', () => {
    it('should use smart categorization when feature flag is enabled', async () => {
      const transaction = {
        description: 'COLES SUPERMARKET',
        amount: -45.50,
        currency: 'AUD'
      }

      // Mock smart categorizer to return a category
      mockSmartCategorizer.categorizeTransactions.mockResolvedValue([{
        category: 'Food & Dining',
        confidence: 0.90,
        is_new_category: false,
        source: 'system_keywords',
        group_name: 'Expenses'
      }])

      const result = await categorizer.categorizeTransactions([transaction])

      expect(mockSmartCategorizer.categorizeTransactions).toHaveBeenCalledWith([transaction])
      expect(result[0]).toEqual({
        category: 'Food & Dining',
        confidence: 0.90,
        is_new_category: false,
        source: 'system_keywords',
        group_name: 'Expenses'
      })
    })

    it('should use improved hybrid categorization when feature flag is disabled', async () => {
      // Mock feature flags to use improved categorization
      vi.mocked(featureFlags.shouldUseSmartCategorization).mockReturnValue(false)

      const transaction = {
        description: 'WOOLWORTHS',
        amount: -32.00,
        currency: 'AUD'
      }

      // Mock improved categorizer to return a category with old source type
      mockImprovedCategorizer.categorizeTransactions.mockResolvedValue([{
        category: 'Food & Dining',
        confidence: 0.85,
        is_new_category: false,
        source: 'keyword_match', // This will be mapped to 'system_keywords'
        group_name: 'Expenses'
      }])

      const result = await categorizer.categorizeTransactions([transaction])

      expect(mockImprovedCategorizer.categorizeTransactions).toHaveBeenCalledWith([transaction])
      expect(result[0]).toEqual({
        category: 'Food & Dining',
        confidence: 0.85,
        is_new_category: false,
        source: 'system_keywords',
        group_name: 'Expenses'
      })
    })

    it('should handle errors gracefully', async () => {
      const transaction = {
        description: 'ERROR TRANSACTION',
        amount: -10.00,
        currency: 'AUD'
      }

      // Mock smart categorizer to return uncategorized (handles errors internally)
      mockSmartCategorizer.categorizeTransactions.mockResolvedValue([{
        category: 'Uncategorized',
        confidence: 0.5,
        is_new_category: false,
        source: 'uncategorized',
        group_name: 'Other'
      }])

      const result = await categorizer.categorizeTransactions([transaction])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        category: 'Uncategorized',
        confidence: 0.5,
        is_new_category: false,
        source: 'uncategorized',
        group_name: 'Other'
      })
    })
  })

  describe('categorizeBatch', () => {
    it('should categorize multiple transactions efficiently', async () => {
      const transactions = [
        { description: 'COLES', amount: -45.50, currency: 'AUD' },
        { description: 'WOOLWORTHS', amount: -32.00, currency: 'AUD' },
        { description: 'NETFLIX', amount: -15.99, currency: 'AUD' }
      ]

      mockSmartCategorizer.categorizeTransactions.mockResolvedValue([
        {
          category: 'Food & Dining',
          confidence: 0.90,
          is_new_category: false,
          source: 'system_keywords',
          group_name: 'Expenses'
        },
        {
          category: 'Food & Dining',
          confidence: 0.90,
          is_new_category: false,
          source: 'system_keywords',
          group_name: 'Expenses'
        },
        {
          category: 'Entertainment',
          confidence: 0.90,
          is_new_category: false,
          source: 'system_keywords',
          group_name: 'Expenses'
        }
      ])

      const results = await categorizer.categorizeTransactions(transactions)

      expect(results).toHaveLength(3)
      expect(results[0]).toEqual({ 
        category: 'Food & Dining', 
        confidence: 0.90, 
        is_new_category: false,
        source: 'system_keywords',
        group_name: 'Expenses'
      })
      expect(results[1]).toEqual({ 
        category: 'Food & Dining', 
        confidence: 0.90, 
        is_new_category: false,
        source: 'system_keywords',
        group_name: 'Expenses'
      })
      expect(results[2]).toEqual({ 
        category: 'Entertainment', 
        confidence: 0.90, 
        is_new_category: false,
        source: 'system_keywords',
        group_name: 'Expenses'
      })
    })

    it('should handle batch processing with AI fallback', async () => {
      const transactions = [
        { description: 'UNKNOWN MERCHANT 1', amount: -25.00, currency: 'AUD' },
        { description: 'UNKNOWN MERCHANT 2', amount: -35.00, currency: 'AUD' }
      ]

      mockSmartCategorizer.categorizeTransactions.mockResolvedValue([
        {
          category: 'Entertainment',
          confidence: 0.8,
          is_new_category: true,
          source: 'ai',
          group_name: 'Expenses'
        },
        {
          category: 'Transportation',
          confidence: 0.7,
          is_new_category: true,
          source: 'ai',
          group_name: 'Expenses'
        }
      ])

      const results = await categorizer.categorizeTransactions(transactions)

      expect(results).toHaveLength(2)
      expect(results[0]).toEqual({ 
        category: 'Entertainment', 
        confidence: 0.8, 
        is_new_category: true,
        source: 'ai',
        group_name: 'Expenses'
      })
      expect(results[1]).toEqual({ 
        category: 'Transportation', 
        confidence: 0.7, 
        is_new_category: true,
        source: 'ai',
        group_name: 'Expenses'
      })
    })
  })

  describe('performance', () => {
    it('should handle large batches efficiently', async () => {
      const startTime = Date.now()
      
      // Create 100 test transactions
      const transactions = Array.from({ length: 100 }, (_, i) => ({
        description: `TRANSACTION_${i}`,
        amount: -Math.random() * 100,
        currency: 'AUD'
      }))

      // Mock smart categorizer to return uncategorized for all
      mockSmartCategorizer.categorizeTransactions.mockResolvedValue(
        transactions.map(() => ({
          category: 'Uncategorized',
          confidence: 0.5,
          is_new_category: false,
          source: 'uncategorized',
          group_name: 'Other'
        }))
      )

      const results = await categorizer.categorizeTransactions(transactions)
      const endTime = Date.now()
      const processingTime = endTime - startTime

      expect(results).toHaveLength(100)
      expect(processingTime).toBeLessThan(5000) // Should complete within 5 seconds
      
      // All results should be uncategorized
      results.forEach(result => {
        expect(result.category).toBe('Uncategorized')
        expect(result.confidence).toBe(0.5)
        expect(result.source).toBe('uncategorized')
      })
    })
  })
})