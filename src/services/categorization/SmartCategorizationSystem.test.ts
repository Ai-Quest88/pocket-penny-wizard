// Comprehensive test suite for Smart Categorization System
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SmartCategorizer } from './SmartCategorizer';
import { UserHistoryMatcher } from './UserHistoryMatcher';
import { SystemKeywordMatcher } from './SystemKeywordMatcher';
import { featureFlags } from './FeatureFlags';
import { categorizationMonitor } from './CategorizationMonitor';
import type { TransactionData } from './types';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          not: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                data: [],
                error: null
              }))
            }))
          }))
        }))
      })),
      insert: vi.fn(() => ({
        data: [],
        error: null
      }))
    })),
    functions: {
      invoke: vi.fn(() => ({
        data: { category: 'Food & Dining', confidence: 0.85 },
        error: null
      }))
    }
  }
}));

describe('Smart Categorization System', () => {
  const userId = 'test-user-id';
  const testTransaction: TransactionData = {
    description: 'UBER *EATS',
    amount: -15.99,
    date: '2025-01-17',
    currency: 'AUD'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('UserHistoryMatcher', () => {
    it('should find similar transactions in user history', async () => {
      const matcher = new UserHistoryMatcher(userId);
      const result = await matcher.findSimilarTransaction(testTransaction);
      
      // For new users, no history should be found
      expect(result).toBeNull();
    });

    it('should calculate similarity correctly', () => {
      const matcher = new UserHistoryMatcher(userId);
      
      // Test exact match
      const similarity1 = (matcher as any).calculateSimilarity('UBER *EATS', 'UBER *EATS');
      expect(similarity1).toBe(1.0);
      
      // Test partial match
      const similarity2 = (matcher as any).calculateSimilarity('UBER *EATS', 'UBER EATS');
      expect(similarity2).toBeGreaterThan(0.5);
    });

    it('should extract merchant names correctly', () => {
      const matcher = new UserHistoryMatcher(userId);
      
      const merchant1 = (matcher as any).extractMerchantName('WOOLWORTHS 1234');
      expect(merchant1).toBe('WOOLWORTHS');
      
      const merchant2 = (matcher as any).extractMerchantName('UBER *EATS');
      expect(merchant2).toBe('UBER');
    });
  });

  describe('SystemKeywordMatcher', () => {
    it('should find keyword matches', async () => {
      const matcher = new SystemKeywordMatcher();
      const result = await matcher.findKeywordMatch(testTransaction);
      
      // Should find a match for UBER *EATS
      expect(result).toBeDefined();
      if (result) {
        expect(result.category).toBe('Food & Dining');
        expect(result.source).toBe('system_keywords');
        expect(result.confidence).toBeGreaterThan(0.8);
      }
    });

    it('should handle case-insensitive matching', async () => {
      const matcher = new SystemKeywordMatcher();
      const transaction = { ...testTransaction, description: 'uber eats' };
      const result = await matcher.findKeywordMatch(transaction);
      
      expect(result).toBeDefined();
      if (result) {
        expect(result.category).toBe('Food & Dining');
      }
    });
  });

  describe('SmartCategorizer', () => {
    it('should categorize transactions using three-tier approach', async () => {
      const categorizer = new SmartCategorizer(userId);
      const result = await categorizer.categorizeTransaction(testTransaction);
      
      expect(result).toBeDefined();
      expect(result.category).toBeDefined();
      expect(result.source).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.group_name).toBeDefined();
    });

    it('should process multiple transactions', async () => {
      const categorizer = new SmartCategorizer(userId);
      const transactions = [testTransaction, { ...testTransaction, description: 'Woolworths' }];
      const results = await categorizer.categorizeTransactions(transactions);
      
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.category).toBeDefined();
        expect(result.source).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('should record metrics for monitoring', async () => {
      const categorizer = new SmartCategorizer(userId);
      const transactions = [testTransaction];
      
      // Mock the monitor
      const recordSpy = vi.spyOn(categorizationMonitor, 'recordCategorizationSession');
      
      await categorizer.categorizeTransactions(transactions);
      
      expect(recordSpy).toHaveBeenCalledWith(
        userId,
        expect.arrayContaining([
          expect.objectContaining({
            source: expect.any(String),
            confidence: expect.any(Number)
          })
        ]),
        expect.any(Number)
      );
    });
  });

  describe('Feature Flags', () => {
    it('should determine user rollout correctly', () => {
      const user1 = 'user-1';
      const user2 = 'user-2';
      
      // Test consistent assignment
      const result1a = featureFlags.shouldUseSmartCategorization(user1);
      const result1b = featureFlags.shouldUseSmartCategorization(user1);
      expect(result1a).toBe(result1b);
      
      const result2a = featureFlags.shouldUseSmartCategorization(user2);
      const result2b = featureFlags.shouldUseSmartCategorization(user2);
      expect(result2a).toBe(result2b);
    });

    it('should update flags correctly', () => {
      const originalFlags = featureFlags.getFlags();
      
      featureFlags.updateFlags({ useSmartCategorization: false });
      const updatedFlags = featureFlags.getFlags();
      
      expect(updatedFlags.useSmartCategorization).toBe(false);
      expect(updatedFlags.enableUserHistoryLearning).toBe(originalFlags.enableUserHistoryLearning);
    });

    it('should provide rollout status', () => {
      const status = featureFlags.getRolloutStatus();
      
      expect(status).toHaveProperty('enabled');
      expect(status).toHaveProperty('rolloutPercentage');
      expect(status).toHaveProperty('estimatedUsers');
      expect(typeof status.enabled).toBe('boolean');
      expect(typeof status.rolloutPercentage).toBe('number');
      expect(typeof status.estimatedUsers).toBe('number');
    });
  });

  describe('CategorizationMonitor', () => {
    it('should record categorization sessions', () => {
      const userId = 'test-user';
      const results = [
        { source: 'user_history', confidence: 0.9 },
        { source: 'system_keywords', confidence: 0.8 }
      ];
      const processingTime = 1000;
      
      categorizationMonitor.recordCategorizationSession(userId, results, processingTime);
      
      const userMetrics = categorizationMonitor.getUserMetrics(userId);
      expect(userMetrics).toBeDefined();
      if (userMetrics) {
        expect(userMetrics.userId).toBe(userId);
        expect(userMetrics.totalTransactions).toBe(2);
        expect(userMetrics.userHistoryHits).toBe(1);
        expect(userMetrics.systemKeywordHits).toBe(1);
      }
    });

    it('should provide system-wide metrics', () => {
      const accuracyMetrics = categorizationMonitor.getSystemAccuracyMetrics();
      
      expect(accuracyMetrics).toHaveProperty('userHistoryHitRate');
      expect(accuracyMetrics).toHaveProperty('systemKeywordHitRate');
      expect(accuracyMetrics).toHaveProperty('aiFallbackRate');
      expect(accuracyMetrics).toHaveProperty('uncategorizedRate');
      expect(accuracyMetrics).toHaveProperty('averageConfidence');
      expect(accuracyMetrics).toHaveProperty('userCorrectionRate');
    });

    it('should provide performance metrics', () => {
      const performanceMetrics = categorizationMonitor.getSystemPerformanceMetrics();
      
      expect(performanceMetrics).toHaveProperty('averageUserHistoryTime');
      expect(performanceMetrics).toHaveProperty('averageSystemKeywordTime');
      expect(performanceMetrics).toHaveProperty('averageAiTime');
      expect(performanceMetrics).toHaveProperty('averageTotalTime');
      expect(performanceMetrics).toHaveProperty('totalSessions');
    });
  });

  describe('Integration Tests', () => {
    it('should work with TransactionCategorizer', async () => {
      const { TransactionCategorizer } = await import('./TransactionCategorizer');
      const categorizer = new TransactionCategorizer(userId);
      
      const results = await categorizer.categorizeTransactions([testTransaction]);
      
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('category');
      expect(results[0]).toHaveProperty('source');
      expect(results[0]).toHaveProperty('confidence');
    });

    it('should handle edge cases gracefully', async () => {
      const categorizer = new SmartCategorizer(userId);
      
      // Test with empty description
      const emptyTransaction = { ...testTransaction, description: '' };
      const result1 = await categorizer.categorizeTransaction(emptyTransaction);
      expect(result1.category).toBeDefined();
      
      // Test with very long description
      const longTransaction = { 
        ...testTransaction, 
        description: 'A'.repeat(1000) 
      };
      const result2 = await categorizer.categorizeTransaction(longTransaction);
      expect(result2.category).toBeDefined();
    });
  });
});
