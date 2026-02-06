// Smart Transaction Categorizer - Learned patterns first, then AI
import { SmartCategorizer } from './SmartCategorizer';
import { LearnedPatternMatcher } from './LearnedPatternMatcher';
import { featureFlags } from './FeatureFlags';
import type { TransactionData, CategoryDiscoveryResult } from './types';

export class TransactionCategorizer {
  private userId: string;
  private smartCategorizer: SmartCategorizer;
  private learnedPatternMatcher: LearnedPatternMatcher;

  constructor(userId: string) {
    this.userId = userId;
    this.smartCategorizer = new SmartCategorizer(userId);
    this.learnedPatternMatcher = new LearnedPatternMatcher(userId);
  }

  async categorizeTransactions(transactions: TransactionData[]): Promise<CategoryDiscoveryResult[]> {
    console.log(`🎯 TransactionCategorizer: Processing ${transactions.length} transactions with learning + AI`);
    
    const results: CategoryDiscoveryResult[] = [];
    const needsAI: { index: number; transaction: TransactionData }[] = [];
    const stats = { learned: 0, ai: 0 };

    // First pass: Check learned patterns
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      
      try {
        const learnedMatch = await this.learnedPatternMatcher.findMatch(transaction.description);
        
        if (learnedMatch && learnedMatch.confidence >= 0.85) {
          results[i] = {
            category: learnedMatch.category_name,
            confidence: learnedMatch.confidence,
            is_new_category: false,
            source: 'user_history',
            group_name: this.inferGroupName(learnedMatch.category_name)
          };
          stats.learned++;
          continue;
        }
      } catch (error) {
        // Learned patterns table might not exist yet, continue to AI
        console.log('Learned pattern check skipped (table may not exist)');
      }
      
      // Mark for AI processing
      needsAI.push({ index: i, transaction });
    }

    // Second pass: Use SmartCategorizer for remaining transactions
    if (needsAI.length > 0) {
      console.log(`🤖 Processing ${needsAI.length} transactions with AI`);
      
      const aiTransactions = needsAI.map(item => item.transaction);
      const aiResults = await this.smartCategorizer.categorizeTransactions(aiTransactions);
      
      needsAI.forEach((item, aiIndex) => {
        results[item.index] = aiResults[aiIndex] || {
          category: 'Uncategorized',
          confidence: 0.5,
          is_new_category: false,
          source: 'uncategorized',
          group_name: 'Other'
        };
        stats.ai++;
      });
    }

    console.log(`📊 Categorization complete: ${stats.learned} learned, ${stats.ai} AI`);
    
    return results;
  }

  /**
   * Learn a pattern from a user correction
   */
  async learnFromCorrection(
    description: string,
    categoryName: string,
    categoryId?: string
  ): Promise<boolean> {
    try {
      const patternId = await this.learnedPatternMatcher.savePattern(
        description,
        categoryName,
        categoryId
      );
      return !!patternId;
    } catch (error) {
      console.error('Failed to learn from correction:', error);
      return false;
    }
  }

  /**
   * Learn multiple patterns from batch corrections
   */
  async learnFromCorrections(
    corrections: Array<{ description: string; categoryName: string; categoryId?: string }>
  ): Promise<number> {
    return this.learnedPatternMatcher.savePatterns(corrections);
  }

  /**
   * Infer group name from category name
   */
  private inferGroupName(categoryName: string): string {
    const lower = categoryName.toLowerCase();
    
    if (['salary', 'wage', 'income', 'dividend', 'interest'].some(w => lower.includes(w))) {
      return 'Income';
    }
    if (['transfer', 'tfr', 'xfer'].some(w => lower.includes(w))) {
      return 'Transfers';
    }
    if (['food', 'dining', 'restaurant', 'grocery', 'groceries'].some(w => lower.includes(w))) {
      return 'Food & Dining';
    }
    if (['transport', 'fuel', 'gas', 'parking', 'toll'].some(w => lower.includes(w))) {
      return 'Transportation';
    }
    if (['entertainment', 'movie', 'subscription', 'streaming'].some(w => lower.includes(w))) {
      return 'Entertainment';
    }
    if (['bill', 'utility', 'electric', 'water', 'internet'].some(w => lower.includes(w))) {
      return 'Bills & Utilities';
    }
    if (['shopping', 'retail', 'clothing'].some(w => lower.includes(w))) {
      return 'Shopping';
    }
    
    return 'Expenses';
  }
}