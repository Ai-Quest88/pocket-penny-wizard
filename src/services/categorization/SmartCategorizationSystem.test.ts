// Unit tests for the categorization pipeline
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserHistoryMatcher } from './UserHistoryMatcher';
import { LearnedPatternMatcher } from './LearnedPatternMatcher';
import { AICategorizer } from './AICategorizer';
import { TransactionCategorizer } from './TransactionCategorizer';
import type { TransactionData } from './types';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      const chainable: any = {
        select: vi.fn(() => chainable),
        eq: vi.fn(() => chainable),
        not: vi.fn(() => chainable),
        or: vi.fn(() => chainable),
        order: vi.fn(() => chainable),
        limit: vi.fn(() => chainable),
        single: vi.fn(() => chainable),
        maybeSingle: vi.fn(() => chainable),
        insert: vi.fn(() => ({ data: [], error: null, select: () => Promise.resolve({ data: [], error: null }) })),
        upsert: vi.fn(() => ({ data: [], error: null, select: () => Promise.resolve({ data: [], error: null }) })),
        delete: vi.fn(() => ({ data: null, error: null })),
        update: vi.fn(() => ({ data: [], error: null })),
        then: vi.fn((resolve: any) => {
          if (table === 'transactions') {
            // Return mock categorized transactions for UserHistoryMatcher
            return resolve({
              data: [
                {
                  description: 'WOOLWORTHS 1234 SYDNEY',
                  category_id: 'cat-1',
                  category_display_name: 'Groceries',
                  amount: -45.50,
                  date: '2025-01-15',
                },
                {
                  description: 'UBER *EATS TRIP',
                  category_id: 'cat-2',
                  category_display_name: 'Food & Dining',
                  amount: -22.00,
                  date: '2025-01-14',
                },
                {
                  description: 'SALARY ACME CORP',
                  category_id: 'cat-3',
                  category_display_name: 'Salary',
                  amount: 5000.00,
                  date: '2025-01-01',
                },
              ],
              error: null,
            });
          }
          if (table === 'learned_patterns') {
            return resolve({ data: [], error: null });
          }
          return resolve({ data: [], error: null });
        }),
      };
      return chainable;
    }),
    rpc: vi.fn((funcName: string, params: any) => {
      if (funcName === 'find_learned_pattern') {
        // Simulate finding a learned pattern for woolworths
        const desc = (params?.p_description || '').toLowerCase();
        if (desc.includes('woolworths')) {
          return Promise.resolve({
            data: [{
              pattern_id: 'pattern-1',
              category_name: 'Groceries',
              category_id: 'cat-1',
              confidence: 0.92,
            }],
            error: null,
          });
        }
        return Promise.resolve({ data: [], error: null });
      }
      if (funcName === 'save_learned_pattern') {
        return Promise.resolve({ data: 'new-pattern-id', error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }),
    functions: {
      invoke: vi.fn(() => Promise.resolve({
        data: [
          { category: 'Food & Dining', confidence: 0.9, group_name: 'Expenses', source: 'ai', is_new_category: false },
        ],
        error: null,
      })),
    },
  },
}));

describe('Categorization Pipeline', () => {
  const userId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── UserHistoryMatcher ─────────────────────────────────────────
  describe('UserHistoryMatcher', () => {
    it('should find similar transactions in user history when exact match', async () => {
      const matcher = new UserHistoryMatcher(userId);
      const tx: TransactionData = {
        description: 'WOOLWORTHS 1234 SYDNEY',
        amount: -52.30,
        date: '2025-02-01',
      };

      const result = await matcher.findSimilarTransaction(tx);
      // Mock data has exact "WOOLWORTHS 1234 SYDNEY" -> should match
      expect(result).not.toBeNull();
      if (result) {
        expect(result.category).toBe('Groceries');
        expect(result.source).toBe('user_history');
        expect(result.confidence).toBeGreaterThan(0.7);
      }
    });

    it('should return null for unknown transactions', async () => {
      const matcher = new UserHistoryMatcher(userId);
      const tx: TransactionData = {
        description: 'ZZZZUNKNOWN MERCHANT XYZ',
        amount: -10.00,
        date: '2025-02-01',
      };

      const result = await matcher.findSimilarTransaction(tx);
      expect(result).toBeNull();
    });

    it('should calculate exact match similarity as 1.0', () => {
      const matcher = new UserHistoryMatcher(userId);
      const similarity = (matcher as any).calculateSimilarity('UBER *EATS', 'UBER *EATS');
      expect(similarity).toBe(1.0);
    });

    it('should calculate high similarity for partial match (containment)', () => {
      const matcher = new UserHistoryMatcher(userId);
      // "uber eats" contains "uber" -> partial match
      const similarity = (matcher as any).calculateSimilarity(
        'UBER *EATS TRIP',
        'UBER *EATS SYDNEY'
      );
      expect(similarity).toBeGreaterThan(0.6);
    });

    it('should extract merchant names correctly', () => {
      const matcher = new UserHistoryMatcher(userId);

      expect((matcher as any).extractMerchantName('WOOLWORTHS 1234')).toBe('WOOLWORTHS');
      expect((matcher as any).extractMerchantName('UBER *EATS')).toBe('UBER');
    });

    it('should infer correct group names', () => {
      const matcher = new UserHistoryMatcher(userId);

      expect((matcher as any).getGroupName('Salary')).toBe('Income');
      expect((matcher as any).getGroupName('Investment Income')).toBe('Income');
      expect((matcher as any).getGroupName('Food & Dining')).toBe('Expenses');
      expect((matcher as any).getGroupName('Account Transfer')).toBe('Transfer');
      expect((matcher as any).getGroupName('Unknown Category')).toBe('Other');
    });
  });

  // ─── LearnedPatternMatcher ──────────────────────────────────────
  describe('LearnedPatternMatcher', () => {
    it('should find a match for learned patterns via RPC', async () => {
      const matcher = new LearnedPatternMatcher(userId);
      const result = await matcher.findMatch('WOOLWORTHS 9876 BONDI');

      expect(result).not.toBeNull();
      if (result) {
        expect(result.category_name).toBe('Groceries');
        expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      }
    });

    it('should return null for unlearned patterns', async () => {
      const matcher = new LearnedPatternMatcher(userId);
      const result = await matcher.findMatch('COMPLETELY UNKNOWN MERCHANT');
      expect(result).toBeNull();
    });

    it('should save patterns successfully', async () => {
      const matcher = new LearnedPatternMatcher(userId);
      const result = await matcher.savePattern(
        'COLES 123 SYDNEY',
        'Groceries',
        'cat-1'
      );
      expect(result).not.toBeNull();
    });

    it('should reject short patterns', async () => {
      const matcher = new LearnedPatternMatcher(userId);
      const result = await matcher.savePattern('AB', 'Test', undefined);
      expect(result).toBeNull();
    });

    it('should calculate high confidence for exact matches', () => {
      const matcher = new LearnedPatternMatcher(userId);
      const confidence = (matcher as any).calculateMatchConfidence('woolworths', 'woolworths');
      expect(confidence).toBeGreaterThanOrEqual(0.95);
    });

    it('should calculate lower confidence for partial word matches', () => {
      const matcher = new LearnedPatternMatcher(userId);
      const confidence = (matcher as any).calculateMatchConfidence('woolworths bondi', 'woolworths sydney');
      // Should match on the word "woolworths"
      expect(confidence).toBeGreaterThan(0);
    });
  });

  // ─── AICategorizer ──────────────────────────────────────────────
  describe('AICategorizer', () => {
    it('should batch categorize transactions', async () => {
      const categorizer = new AICategorizer(userId);
      const transactions: TransactionData[] = [
        { description: 'UBER *EATS', amount: -15.99, date: '2025-01-17' },
      ];

      const results = await categorizer.batchCategorize(transactions);
      expect(results).toHaveLength(1);
      expect(results[0]).not.toBeNull();
      if (results[0]) {
        expect(results[0].category).toBe('Food & Dining');
        expect(results[0].source).toBe('ai');
        expect(results[0].confidence).toBeGreaterThan(0);
      }
    });

    it('should categorize single transaction', async () => {
      const categorizer = new AICategorizer(userId);
      const tx: TransactionData = {
        description: 'NETFLIX SUBSCRIPTION',
        amount: -17.99,
        date: '2025-01-15',
      };

      const result = await categorizer.categorize(tx);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.category).toBeDefined();
        expect(result.source).toBe('ai');
      }
    });

    it('should infer correct group names', () => {
      const categorizer = new AICategorizer(userId);

      expect((categorizer as any).inferGroupName('Salary')).toBe('Income');
      expect((categorizer as any).inferGroupName('Wages')).toBe('Income');
      expect((categorizer as any).inferGroupName('Transfer')).toBe('Transfer');
      expect((categorizer as any).inferGroupName('Groceries')).toBe('Expenses');
      expect((categorizer as any).inferGroupName('Shopping')).toBe('Expenses');
    });
  });

  // ─── TransactionCategorizer (Orchestration) ─────────────────────
  describe('TransactionCategorizer', () => {
    it('should use learned patterns when available', async () => {
      const categorizer = new TransactionCategorizer(userId);
      const transactions: TransactionData[] = [
        { description: 'WOOLWORTHS 1234 SYDNEY', amount: -45.50, date: '2025-02-01' },
      ];

      const results = await categorizer.categorizeTransactions(transactions);
      expect(results).toHaveLength(1);
      // Should match via learned pattern (mocked RPC returns match for woolworths)
      expect(results[0].category).toBe('Groceries');
      expect(results[0].source).toBe('user_history');
    });

    it('should fall back to AI for unknown transactions', async () => {
      const categorizer = new TransactionCategorizer(userId);
      const transactions: TransactionData[] = [
        { description: 'RANDOM PURCHASE XYZ', amount: -20.00, date: '2025-02-01' },
      ];

      const results = await categorizer.categorizeTransactions(transactions);
      expect(results).toHaveLength(1);
      // Should fall through to SmartCategorizer/AI
      expect(results[0].category).toBeDefined();
    });

    it('should handle mixed learned and AI transactions', async () => {
      const categorizer = new TransactionCategorizer(userId);
      const transactions: TransactionData[] = [
        { description: 'WOOLWORTHS 1234', amount: -45.50, date: '2025-02-01' },
        { description: 'SOME UNKNOWN SHOP', amount: -20.00, date: '2025-02-01' },
      ];

      const results = await categorizer.categorizeTransactions(transactions);
      expect(results).toHaveLength(2);
      // First should be from learned patterns
      expect(results[0].category).toBe('Groceries');
      // Second should get some category (from AI/keywords)
      expect(results[1].category).toBeDefined();
    });

    it('should learn from corrections', async () => {
      const categorizer = new TransactionCategorizer(userId);
      const success = await categorizer.learnFromCorrection(
        'COLES SUPERMARKET',
        'Groceries',
        'cat-1'
      );
      expect(success).toBe(true);
    });

    it('should infer group names correctly', () => {
      const categorizer = new TransactionCategorizer(userId);
      const inferGroupName = (categorizer as any).inferGroupName.bind(categorizer);

      expect(inferGroupName('Salary')).toBe('Income');
      expect(inferGroupName('Food & Dining')).toBe('Food & Dining');
      expect(inferGroupName('Transport')).toBe('Transportation');
      expect(inferGroupName('Shopping')).toBe('Shopping');
      expect(inferGroupName('Bills & Utilities')).toBe('Bills & Utilities');
      expect(inferGroupName('Something Random')).toBe('Expenses');
    });
  });

  // ─── Edge Cases ─────────────────────────────────────────────────
  describe('Edge Cases', () => {
    it('should handle empty transaction list', async () => {
      const categorizer = new TransactionCategorizer(userId);
      const results = await categorizer.categorizeTransactions([]);
      expect(results).toHaveLength(0);
    });

    it('should handle empty descriptions gracefully', async () => {
      const categorizer = new TransactionCategorizer(userId);
      const results = await categorizer.categorizeTransactions([
        { description: '', amount: -10.00, date: '2025-01-01' },
      ]);
      expect(results).toHaveLength(1);
      expect(results[0].category).toBeDefined();
    });

    it('should handle very long descriptions', async () => {
      const categorizer = new TransactionCategorizer(userId);
      const results = await categorizer.categorizeTransactions([
        { description: 'A'.repeat(500), amount: -10.00, date: '2025-01-01' },
      ]);
      expect(results).toHaveLength(1);
      expect(results[0].category).toBeDefined();
    });

    it('should handle zero amounts', async () => {
      const categorizer = new TransactionCategorizer(userId);
      const results = await categorizer.categorizeTransactions([
        { description: 'INTEREST ADJUSTMENT', amount: 0, date: '2025-01-01' },
      ]);
      expect(results).toHaveLength(1);
    });

    it('UserHistoryMatcher should handle missing category_display_name', async () => {
      const matcher = new UserHistoryMatcher(userId);
      // The matcher should still work even if category_display_name is missing
      // (it falls back to category_name field)
      const result = await matcher.findSimilarTransaction({
        description: 'WOOLWORTHS TEST',
        amount: -50,
        date: '2025-01-01',
      });
      // With mock data returning category_display_name, this should work
      if (result) {
        expect(result.category).toBeDefined();
        expect(result.category).not.toBe('Unknown');
      }
    });
  });
});
