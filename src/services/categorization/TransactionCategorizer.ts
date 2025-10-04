// Smart Transaction Categorizer - Uses the new three-tier approach with feature flag
import { SmartCategorizer } from './SmartCategorizer';
import { ImprovedHybridCategorizer } from './ImprovedHybridCategorizer';
import { featureFlags } from './FeatureFlags';
import type { TransactionData, CategoryDiscoveryResult } from './types';

export class TransactionCategorizer {
  private userId: string;
  private smartCategorizer?: SmartCategorizer;
  private improvedCategorizer?: ImprovedHybridCategorizer;

  constructor(userId: string) {
    this.userId = userId;
    
    // Initialize both categorizers
    this.smartCategorizer = new SmartCategorizer(userId);
    this.improvedCategorizer = new ImprovedHybridCategorizer(userId);
  }

  async categorizeTransactions(transactions: TransactionData[]): Promise<CategoryDiscoveryResult[]> {
    // Check feature flag to determine which system to use
    const useSmartCategorization = featureFlags.shouldUseSmartCategorization(this.userId);
    
    console.log(`🎯 TransactionCategorizer: Using ${useSmartCategorization ? 'Smart' : 'Improved Hybrid'} categorization for user ${this.userId}`);
    
    if (useSmartCategorization) {
      return this.smartCategorizer!.categorizeTransactions(transactions);
    } else {
      // Convert ImprovedHybridCategorizer result to CategoryDiscoveryResult format
      const results = await this.improvedCategorizer!.categorizeTransactions(transactions);
      
      // Handle case where results might be undefined
      if (!results || !Array.isArray(results)) {
        console.error('ImprovedHybridCategorizer returned invalid results:', results);
        return transactions.map(() => ({
          category: 'Uncategorized',
          confidence: 0.5,
          is_new_category: false,
          source: 'uncategorized' as const,
          group_name: 'Other'
        }));
      }
      
      // Map old source types to new ones
      return results.map(result => ({
        ...result,
        source: this.mapOldSourceToNew(result.source)
      }));
    }
  }

  private mapOldSourceToNew(oldSource: string): CategoryDiscoveryResult['source'] {
    switch (oldSource) {
      case 'keyword_match':
        return 'system_keywords';
      case 'ai':
        return 'ai';
      case 'uncategorized':
        return 'uncategorized';
      default:
        return 'ai';
    }
  }
}