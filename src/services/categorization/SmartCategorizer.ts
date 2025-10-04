// SmartCategorizer - Orchestrates the three-tier categorization approach
// Priority: User History → System Keywords → AI Fallback
import { UserHistoryMatcher } from './UserHistoryMatcher';
import { SystemKeywordMatcher } from './SystemKeywordMatcher';
import { AICategorizer } from './AICategorizer';
import { categorizationMonitor } from './CategorizationMonitor';
import type { TransactionData, CategoryDiscoveryResult } from './types';

export class SmartCategorizer {
  private userId: string;
  private userHistoryMatcher: UserHistoryMatcher;
  private systemKeywordMatcher: SystemKeywordMatcher;
  private aiCategorizer: AICategorizer;

  constructor(userId: string) {
    this.userId = userId;
    this.userHistoryMatcher = new UserHistoryMatcher(userId);
    this.systemKeywordMatcher = new SystemKeywordMatcher();
    this.aiCategorizer = new AICategorizer(userId);
  }

  async categorizeTransaction(transaction: TransactionData): Promise<CategoryDiscoveryResult> {
    console.log(`🎯 SmartCategorizer: Categorizing "${transaction.description}"`);
    
    // Tier 1: User History Lookup (90-95% accuracy)
    const userHistoryResult = await this.userHistoryMatcher.findSimilarTransaction(transaction);
    if (userHistoryResult) {
      console.log(`🎯 Using User History: ${userHistoryResult.category} (${(userHistoryResult.confidence * 100).toFixed(1)}%)`);
      return userHistoryResult;
    }

    // Tier 2: System Keyword Rules (80-85% accuracy)
    const systemKeywordResult = await this.systemKeywordMatcher.findKeywordMatch(transaction);
    if (systemKeywordResult) {
      console.log(`🎯 Using System Keywords: ${systemKeywordResult.category} (${(systemKeywordResult.confidence * 100).toFixed(1)}%)`);
      return systemKeywordResult;
    }

    // Tier 3: AI Categorization (70-80% accuracy)
    console.log(`🎯 Falling back to AI categorization`);
    const aiResult = await this.aiCategorizer.categorize(transaction);
    if (aiResult) {
      console.log(`🎯 Using AI: ${aiResult.category} (${(aiResult.confidence * 100).toFixed(1)}%)`);
      return aiResult;
    }

    // Final fallback: Uncategorized
    console.log(`🎯 No categorization found, marking as uncategorized`);
    return {
      category: 'Uncategorized',
      confidence: 0.5,
      is_new_category: false,
      source: 'uncategorized',
      group_name: 'Other'
    };
  }

  async categorizeTransactions(transactions: TransactionData[]): Promise<CategoryDiscoveryResult[]> {
    console.log(`🎯 SmartCategorizer: Processing ${transactions.length} transactions`);
    
    const startTime = Date.now();
    const results: CategoryDiscoveryResult[] = [];
    const stats = {
      userHistory: 0,
      systemKeywords: 0,
      ai: 0,
      uncategorized: 0
    };

    for (const transaction of transactions) {
      const result = await this.categorizeTransaction(transaction);
      results.push(result);

      // Update stats
      switch (result.source) {
        case 'user_history':
          stats.userHistory++;
          break;
        case 'system_keywords':
          stats.systemKeywords++;
          break;
        case 'ai':
          stats.ai++;
          break;
        case 'uncategorized':
          stats.uncategorized++;
          break;
      }
    }

    const totalTime = Date.now() - startTime;

    // Log summary
    console.log(`📊 SmartCategorizer Summary:`);
    console.log(`   🧠 User History: ${stats.userHistory} (${((stats.userHistory / transactions.length) * 100).toFixed(1)}%)`);
    console.log(`   🔑 System Keywords: ${stats.systemKeywords} (${((stats.systemKeywords / transactions.length) * 100).toFixed(1)}%)`);
    console.log(`   🤖 AI: ${stats.ai} (${((stats.ai / transactions.length) * 100).toFixed(1)}%)`);
    console.log(`   ❓ Uncategorized: ${stats.uncategorized} (${((stats.uncategorized / transactions.length) * 100).toFixed(1)}%)`);
    console.log(`   📈 Total: ${transactions.length} transactions`);
    console.log(`   ⏱️ Processing time: ${totalTime}ms`);

    // Record metrics for monitoring
    categorizationMonitor.recordCategorizationSession(
      this.userId,
      results.map(r => ({ source: r.source, confidence: r.confidence })),
      totalTime
    );

    return results;
  }
}
