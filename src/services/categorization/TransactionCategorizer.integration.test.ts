import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TransactionCategorizer } from './TransactionCategorizer'
import { AICategorizer } from './AICategorizer'
import { FallbackCategorizer } from './FallbackCategorizer'
import { SystemRulesCategorizer } from './SystemRulesCategorizer'
import { UserRulesCategorizer } from './UserRulesCategorizer'

// Mock the AI categorizer
vi.mock('./AICategorizer')
vi.mock('./FallbackCategorizer')
vi.mock('./SystemRulesCategorizer')
vi.mock('./UserRulesCategorizer')

describe('TransactionCategorizer Integration', () => {
  let categorizer: TransactionCategorizer
  let mockAICategorizer: any
  let mockFallbackCategorizer: any
  let mockSystemRulesCategorizer: any
  let mockUserRulesCategorizer: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup mocks
    mockAICategorizer = {
      categorize: vi.fn(),
      categorizeBatch: vi.fn()
    }
    
    mockFallbackCategorizer = {
      categorize: vi.fn()
    }
    
    mockSystemRulesCategorizer = {
      categorize: vi.fn()
    }
    
    mockUserRulesCategorizer = {
      categorize: vi.fn()
    }

    // Mock the constructors
    vi.mocked(AICategorizer).mockImplementation(() => mockAICategorizer)
    vi.mocked(FallbackCategorizer).mockImplementation(() => mockFallbackCategorizer)
    vi.mocked(SystemRulesCategorizer).mockImplementation(() => mockSystemRulesCategorizer)
    vi.mocked(UserRulesCategorizer).mockImplementation(() => mockUserRulesCategorizer)

    categorizer = new TransactionCategorizer('test-user-id')
  })

  describe('categorizeTransaction', () => {
    it('should prioritize user rules over system rules', async () => {
      const transaction = {
        description: 'COLES SUPERMARKET',
        amount: -50.00,
        currency: 'AUD'
      }

      mockUserRulesCategorizer.categorize.mockResolvedValue({
        category: 'Groceries',
        confidence: 1.0,
        source: 'user_rules'
      })

      const result = await categorizer.categorizeTransaction(transaction)

      expect(mockUserRulesCategorizer.categorize).toHaveBeenCalledWith(transaction)
      expect(mockSystemRulesCategorizer.categorize).not.toHaveBeenCalled()
      expect(mockAICategorizer.categorize).not.toHaveBeenCalled()
      expect(mockFallbackCategorizer.categorize).not.toHaveBeenCalled()
      
      expect(result).toEqual({
        category: 'Groceries',
        confidence: 1.0,
        source: 'user_rules'
      })
    })

    it('should fall back to system rules when user rules fail', async () => {
      const transaction = {
        description: 'WOOLWORTHS',
        amount: -75.00,
        currency: 'AUD'
      }

      mockUserRulesCategorizer.categorize.mockResolvedValue(null)
      mockSystemRulesCategorizer.categorize.mockResolvedValue({
        category: 'Groceries',
        confidence: 0.9,
        source: 'system_rules'
      })

      const result = await categorizer.categorizeTransaction(transaction)

      expect(mockUserRulesCategorizer.categorize).toHaveBeenCalledWith(transaction)
      expect(mockSystemRulesCategorizer.categorize).toHaveBeenCalledWith(transaction)
      expect(mockAICategorizer.categorize).not.toHaveBeenCalled()
      expect(mockFallbackCategorizer.categorize).not.toHaveBeenCalled()
      
      expect(result).toEqual({
        category: 'Groceries',
        confidence: 0.9,
        source: 'system_rules'
      })
    })

    it('should fall back to AI when system rules fail', async () => {
      const transaction = {
        description: 'UNKNOWN MERCHANT',
        amount: -25.00,
        currency: 'AUD'
      }

      mockUserRulesCategorizer.categorize.mockResolvedValue(null)
      mockSystemRulesCategorizer.categorize.mockResolvedValue(null)
      mockAICategorizer.categorize.mockResolvedValue({
        category: 'Entertainment',
        confidence: 0.8,
        source: 'ai'
      })

      const result = await categorizer.categorizeTransaction(transaction)

      expect(mockUserRulesCategorizer.categorize).toHaveBeenCalledWith(transaction)
      expect(mockSystemRulesCategorizer.categorize).toHaveBeenCalledWith(transaction)
      expect(mockAICategorizer.categorize).toHaveBeenCalledWith(transaction)
      expect(mockFallbackCategorizer.categorize).not.toHaveBeenCalled()
      
      expect(result).toEqual({
        category: 'Entertainment',
        confidence: 0.8,
        source: 'ai'
      })
    })

    it('should fall back to fallback categorizer when all else fails', async () => {
      const transaction = {
        description: 'COMPLETELY UNKNOWN',
        amount: -10.00,
        currency: 'AUD'
      }

      mockUserRulesCategorizer.categorize.mockResolvedValue(null)
      mockSystemRulesCategorizer.categorize.mockResolvedValue(null)
      mockAICategorizer.categorize.mockResolvedValue(null)
      mockFallbackCategorizer.categorize.mockResolvedValue({
        category: 'Uncategorized',
        confidence: 0.1,
        source: 'fallback'
      })

      const result = await categorizer.categorizeTransaction(transaction)

      expect(mockUserRulesCategorizer.categorize).toHaveBeenCalledWith(transaction)
      expect(mockSystemRulesCategorizer.categorize).toHaveBeenCalledWith(transaction)
      expect(mockAICategorizer.categorize).toHaveBeenCalledWith(transaction)
      expect(mockFallbackCategorizer.categorize).toHaveBeenCalledWith(transaction)
      
      expect(result).toEqual({
        category: 'Uncategorized',
        confidence: 0.1,
        source: 'fallback'
      })
    })

    it('should handle errors gracefully', async () => {
      const transaction = {
        description: 'ERROR TRANSACTION',
        amount: -100.00,
        currency: 'AUD'
      }

      mockUserRulesCategorizer.categorize.mockRejectedValue(new Error('User rules error'))
      mockSystemRulesCategorizer.categorize.mockResolvedValue(null)
      mockAICategorizer.categorize.mockResolvedValue(null)
      mockFallbackCategorizer.categorize.mockResolvedValue({
        category: 'Uncategorized',
        confidence: 0.1,
        source: 'fallback'
      })

      const result = await categorizer.categorizeTransaction(transaction)

      expect(result).toEqual({
        category: 'Uncategorized',
        confidence: 0.1,
        source: 'fallback'
      })
    })
  })

  describe('categorizeBatch', () => {
    it('should categorize multiple transactions efficiently', async () => {
      const transactions = [
        { description: 'COLES', amount: -50.00, currency: 'AUD' },
        { description: 'WOOLWORTHS', amount: -75.00, currency: 'AUD' },
        { description: 'UNKNOWN', amount: -25.00, currency: 'AUD' }
      ]

      mockUserRulesCategorizer.categorize
        .mockResolvedValueOnce({ category: 'Groceries', confidence: 1.0, source: 'user_rules' })
        .mockResolvedValueOnce({ category: 'Groceries', confidence: 1.0, source: 'user_rules' })
        .mockResolvedValueOnce(null)

      mockSystemRulesCategorizer.categorize
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ category: 'Entertainment', confidence: 0.8, source: 'system_rules' })

      const results = await categorizer.categorizeBatch(transactions)

      expect(results).toHaveLength(3)
      expect(results[0]).toEqual({ category: 'Groceries', confidence: 1.0, source: 'user_rules' })
      expect(results[1]).toEqual({ category: 'Groceries', confidence: 1.0, source: 'user_rules' })
      expect(results[2]).toEqual({ category: 'Entertainment', confidence: 0.8, source: 'system_rules' })
    })

    it('should handle batch processing with AI fallback', async () => {
      const transactions = [
        { description: 'UNKNOWN1', amount: -25.00, currency: 'AUD' },
        { description: 'UNKNOWN2', amount: -30.00, currency: 'AUD' }
      ]

      mockUserRulesCategorizer.categorize.mockResolvedValue(null)
      mockSystemRulesCategorizer.categorize.mockResolvedValue(null)
      mockAICategorizer.categorizeBatch.mockResolvedValue([
        { category: 'Entertainment', confidence: 0.8, source: 'ai' },
        { category: 'Transportation', confidence: 0.7, source: 'ai' }
      ])

      const results = await categorizer.categorizeBatch(transactions)

      expect(results).toHaveLength(2)
      expect(results[0]).toEqual({ category: 'Entertainment', confidence: 0.8, source: 'ai' })
      expect(results[1]).toEqual({ category: 'Transportation', confidence: 0.7, source: 'ai' })
    })
  })

  describe('performance', () => {
    it('should handle large batches efficiently', async () => {
      const transactions = Array.from({ length: 100 }, (_, i) => ({
        description: `TRANSACTION_${i}`,
        amount: -Math.random() * 100,
        currency: 'AUD'
      }))

      mockUserRulesCategorizer.categorize.mockResolvedValue(null)
      mockSystemRulesCategorizer.categorize.mockResolvedValue(null)
      mockAICategorizer.categorizeBatch.mockResolvedValue(
        transactions.map(() => ({ category: 'Uncategorized', confidence: 0.1, source: 'ai' }))
      )

      const startTime = Date.now()
      const results = await categorizer.categorizeBatch(transactions)
      const endTime = Date.now()

      expect(results).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })
})
