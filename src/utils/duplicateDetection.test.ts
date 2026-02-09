import { describe, it, expect } from 'vitest'
import {
  detectDuplicateTransactions,
  filterDuplicatesByConfidence,
} from './duplicateDetection'

const makeTransaction = (overrides: Partial<{
  id: string; amount: number; date: string; description: string; category: string
}> = {}) => ({
  id: overrides.id || `tx-${Math.random().toString(36).slice(2, 8)}`,
  user_id: 'user-1',
  amount: overrides.amount ?? -50,
  date: overrides.date || '2024-01-15',
  description: overrides.description || 'Coffee Shop',
  category: overrides.category || 'Food & Dining',
  currency: 'AUD',
  category_id: null,
  asset_account_id: null,
  liability_account_id: null,
  comment: null,
  created_at: null,
  updated_at: null,
})

describe('duplicateDetection', () => {
  describe('detectDuplicateTransactions', () => {
    it('should return empty when no transactions', () => {
      const result = detectDuplicateTransactions([])
      expect(result.duplicateGroups).toHaveLength(0)
      expect(result.totalDuplicates).toBe(0)
      expect(result.potentialSavings).toBe(0)
    })

    it('should return empty when no duplicates', () => {
      const transactions = [
        makeTransaction({ id: 'tx-1', description: 'Coffee', amount: -5, date: '2024-01-01' }),
        makeTransaction({ id: 'tx-2', description: 'Grocery', amount: -120, date: '2024-01-02' }),
        makeTransaction({ id: 'tx-3', description: 'Salary', amount: 3000, date: '2024-01-15' }),
      ]
      const result = detectDuplicateTransactions(transactions)
      expect(result.duplicateGroups).toHaveLength(0)
      expect(result.totalDuplicates).toBe(0)
    })

    it('should detect exact duplicates (same amount, date, description)', () => {
      const transactions = [
        makeTransaction({ id: 'tx-1', description: 'Woolworths', amount: -85.50, date: '2024-01-15' }),
        makeTransaction({ id: 'tx-2', description: 'Woolworths', amount: -85.50, date: '2024-01-15' }),
      ]
      const result = detectDuplicateTransactions(transactions)
      expect(result.duplicateGroups).toHaveLength(1)
      expect(result.duplicateGroups[0].confidence).toBe('high')
      expect(result.totalDuplicates).toBe(1)
      expect(result.potentialSavings).toBe(85.50)
    })

    it('should detect near-duplicates (same amount, similar description, close date)', () => {
      // Similarity > 0.8 required: 5/6 shared words = 0.833, dates within 1 day
      const transactions = [
        makeTransaction({ id: 'tx-1', description: 'WOOLWORTHS SUPERMARKET TOWN HALL SYDNEY', amount: -85.50, date: '2024-01-15' }),
        makeTransaction({ id: 'tx-2', description: 'WOOLWORTHS SUPERMARKET TOWN HALL SYDNEY NSW', amount: -85.50, date: '2024-01-16' }),
      ]
      const result = detectDuplicateTransactions(transactions)
      expect(result.duplicateGroups.length).toBeGreaterThanOrEqual(1)
      expect(result.totalDuplicates).toBeGreaterThanOrEqual(1)
    })

    it('should NOT flag transactions with different amounts as duplicates', () => {
      const transactions = [
        makeTransaction({ id: 'tx-1', description: 'Coffee Shop', amount: -5, date: '2024-01-15' }),
        makeTransaction({ id: 'tx-2', description: 'Coffee Shop', amount: -10, date: '2024-01-15' }),
      ]
      const result = detectDuplicateTransactions(transactions)
      expect(result.duplicateGroups).toHaveLength(0)
    })

    it('should NOT flag transactions with very different dates as duplicates', () => {
      const transactions = [
        makeTransaction({ id: 'tx-1', description: 'Coffee Shop', amount: -5, date: '2024-01-01' }),
        makeTransaction({ id: 'tx-2', description: 'Coffee Shop', amount: -5, date: '2024-06-01' }),
      ]
      const result = detectDuplicateTransactions(transactions)
      expect(result.duplicateGroups).toHaveLength(0)
    })

    it('should handle multiple duplicate groups', () => {
      const transactions = [
        makeTransaction({ id: 'tx-1', description: 'Coffee', amount: -5, date: '2024-01-15' }),
        makeTransaction({ id: 'tx-2', description: 'Coffee', amount: -5, date: '2024-01-15' }),
        makeTransaction({ id: 'tx-3', description: 'Grocery', amount: -120, date: '2024-01-20' }),
        makeTransaction({ id: 'tx-4', description: 'Grocery', amount: -120, date: '2024-01-20' }),
      ]
      const result = detectDuplicateTransactions(transactions)
      expect(result.duplicateGroups).toHaveLength(2)
      expect(result.totalDuplicates).toBe(2)
    })

    it('should calculate correct potential savings', () => {
      const transactions = [
        makeTransaction({ id: 'tx-1', description: 'Rent', amount: -2000, date: '2024-01-01' }),
        makeTransaction({ id: 'tx-2', description: 'Rent', amount: -2000, date: '2024-01-01' }),
        makeTransaction({ id: 'tx-3', description: 'Rent', amount: -2000, date: '2024-01-01' }),
      ]
      const result = detectDuplicateTransactions(transactions)
      expect(result.duplicateGroups).toHaveLength(1)
      // 2 duplicates beyond the first = 2 * 2000 = 4000
      expect(result.potentialSavings).toBe(4000)
      expect(result.totalDuplicates).toBe(2)
    })

    it('should match regardless of amount sign (absolute comparison)', () => {
      const transactions = [
        makeTransaction({ id: 'tx-1', description: 'Refund', amount: 50, date: '2024-01-15' }),
        makeTransaction({ id: 'tx-2', description: 'Refund', amount: -50, date: '2024-01-15' }),
      ]
      const result = detectDuplicateTransactions(transactions)
      // Both amounts have same absolute value, same date, same description => duplicate
      expect(result.duplicateGroups).toHaveLength(1)
    })
  })

  describe('filterDuplicatesByConfidence', () => {
    it('should filter by minimum confidence level', () => {
      // Create a result with mixed confidence levels
      const mockResult = {
        duplicateGroups: [
          {
            id: 'group-1',
            transactions: [
              makeTransaction({ id: 'tx-1', amount: -50 }),
              makeTransaction({ id: 'tx-2', amount: -50 }),
            ],
            criteria: 'Exact match',
            confidence: 'high' as const,
          },
          {
            id: 'group-2',
            transactions: [
              makeTransaction({ id: 'tx-3', amount: -30 }),
              makeTransaction({ id: 'tx-4', amount: -30 }),
            ],
            criteria: 'Potential match',
            confidence: 'low' as const,
          },
        ],
        totalDuplicates: 2,
        potentialSavings: 80,
      }

      const filtered = filterDuplicatesByConfidence(mockResult, 'high')
      expect(filtered.duplicateGroups).toHaveLength(1)
      expect(filtered.duplicateGroups[0].confidence).toBe('high')
      expect(filtered.totalDuplicates).toBe(1)
    })

    it('should include all levels when min is low', () => {
      const mockResult = {
        duplicateGroups: [
          { id: 'g1', transactions: [makeTransaction(), makeTransaction()], criteria: '', confidence: 'high' as const },
          { id: 'g2', transactions: [makeTransaction(), makeTransaction()], criteria: '', confidence: 'medium' as const },
          { id: 'g3', transactions: [makeTransaction(), makeTransaction()], criteria: '', confidence: 'low' as const },
        ],
        totalDuplicates: 3,
        potentialSavings: 150,
      }

      const filtered = filterDuplicatesByConfidence(mockResult, 'low')
      expect(filtered.duplicateGroups).toHaveLength(3)
    })

    it('should recalculate totals after filtering', () => {
      const mockResult = {
        duplicateGroups: [
          {
            id: 'g1',
            transactions: [
              makeTransaction({ id: 'tx-1', amount: -100 }),
              makeTransaction({ id: 'tx-2', amount: -100 }),
            ],
            criteria: '',
            confidence: 'high' as const,
          },
          {
            id: 'g2',
            transactions: [
              makeTransaction({ id: 'tx-3', amount: -25 }),
              makeTransaction({ id: 'tx-4', amount: -25 }),
            ],
            criteria: '',
            confidence: 'low' as const,
          },
        ],
        totalDuplicates: 2,
        potentialSavings: 125,
      }

      const filtered = filterDuplicatesByConfidence(mockResult, 'medium')
      expect(filtered.totalDuplicates).toBe(1) // only high group
      expect(filtered.potentialSavings).toBe(100) // only from high group
    })
  })
})
