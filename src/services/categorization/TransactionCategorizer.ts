import { RulesLoader } from './RulesLoader';
import { UserRulesCategorizer } from './UserRulesCategorizer';
import { SystemRulesCategorizer } from './SystemRulesCategorizer';
import { AICategorizer } from './AICategorizer';
import { FallbackCategorizer } from './FallbackCategorizer';
import { CategoryGroupHelper } from './CategoryGroupHelper';
import type { TransactionData, CategoryDiscoveryResult, CategorizationStats } from './types';

export class TransactionCategorizer {
  private userId: string;
  private rulesLoader: RulesLoader;
  private categoryGroupHelper: CategoryGroupHelper | null = null;

  constructor(userId: string) {
    this.userId = userId;
    this.rulesLoader = new RulesLoader(userId);
  }

  async categorizeTransactions(transactions: TransactionData[]): Promise<CategoryDiscoveryResult[]> {
    console.log(`🚀 Starting clean categorization flow for ${transactions.length} transactions`);
    
    // Load all rules and categories upfront
    const [userRules, systemRules, systemCategories] = await Promise.all([
      this.rulesLoader.loadUserRules(),
      this.rulesLoader.loadSystemRules(),
      this.rulesLoader.loadSystemCategories()
    ]);

    this.categoryGroupHelper = new CategoryGroupHelper(systemCategories);
    
    console.log(`📋 Loaded ${userRules.length} user rules, ${systemRules.length} system rules`);

    const results: CategoryDiscoveryResult[] = [];
    const uncategorizedAfterUserRules: { transaction: TransactionData; index: number }[] = [];
    const uncategorizedAfterSystemRules: { transaction: TransactionData; index: number }[] = [];
    
    const stats: CategorizationStats = {
      userRules: 0,
      systemRules: 0,
      aiCategorized: 0,
      uncategorized: 0,
      total: transactions.length
    };

    // Initialize results array with nulls
    for (let i = 0; i < transactions.length; i++) {
      results[i] = null as any;
    }

    // Step 1: Apply user rules
    console.log('👤 Step 1: Applying user rules...');
    const userCategorizer = new UserRulesCategorizer(userRules);
    
    transactions.forEach((transaction, index) => {
      const category = userCategorizer.categorize(transaction);
      if (category) {
        results[index] = {
          category,
          confidence: 0.95,
          is_new_category: false,
          source: 'user_rule',
          group_name: this.categoryGroupHelper!.getGroupName(category)
        };
        stats.userRules++;
      } else {
        uncategorizedAfterUserRules.push({ transaction, index });
      }
    });

    console.log(`✅ User rules categorized: ${stats.userRules}/${transactions.length} transactions`);

    // Step 2: Apply system rules to remaining transactions
    console.log('🔧 Step 2: Applying system rules...');
    const systemCategorizer = new SystemRulesCategorizer(systemRules);
    
    uncategorizedAfterUserRules.forEach(({ transaction, index }) => {
      const category = systemCategorizer.categorize(transaction);
      if (category) {
        results[index] = {
          category,
          confidence: 0.9,
          is_new_category: false,
          source: 'system_rule',
          group_name: this.categoryGroupHelper!.getGroupName(category)
        };
        stats.systemRules++;
      } else {
        uncategorizedAfterSystemRules.push({ transaction, index });
      }
    });

    console.log(`✅ System rules categorized: ${stats.systemRules}/${transactions.length} transactions`);

    // Step 3: Apply AI categorization to remaining transactions
    if (uncategorizedAfterSystemRules.length > 0) {
      console.log(`🤖 Step 3: Applying AI categorization to ${uncategorizedAfterSystemRules.length} transactions...`);
      
      try {
        const aiCategorizer = new AICategorizer();
        const uncategorizedTransactions = uncategorizedAfterSystemRules.map(item => item.transaction);
        const aiResults = await aiCategorizer.categorize(uncategorizedTransactions);
        
        uncategorizedAfterSystemRules.forEach(({ index }, aiIndex) => {
          const aiResult = aiResults[aiIndex];
          if (aiResult) {
            results[index] = {
              category: aiResult.category_name,
              confidence: aiResult.confidence,
              is_new_category: true,
              source: 'ai'
            };
            stats.aiCategorized++;
          }
        });

        console.log(`✅ AI categorized: ${stats.aiCategorized} transactions`);
      } catch (error) {
        console.log('❌ AI categorization failed, using fallback rules');
      }
    }

    // Step 4: Apply fallback categorization to any remaining uncategorized transactions
    for (let i = 0; i < results.length; i++) {
      if (results[i] === null) {
        const category = FallbackCategorizer.categorize(transactions[i]);
        results[i] = {
          category,
          confidence: 0.6,
          is_new_category: false,
          source: category === 'Uncategorized' ? 'uncategorized' : 'fallback',
          group_name: this.categoryGroupHelper!.getGroupName(category)
        };
        
        if (category === 'Uncategorized') {
          stats.uncategorized++;
        }
      }
    }

    // Log final statistics
    console.log('📊 CATEGORIZATION SUMMARY:');
    console.log(`   👤 User Rules:     ${stats.userRules} (${(stats.userRules/stats.total*100).toFixed(1)}%)`);
    console.log(`   🔧 System Rules:   ${stats.systemRules} (${(stats.systemRules/stats.total*100).toFixed(1)}%)`);
    console.log(`   🤖 AI Categorized: ${stats.aiCategorized} (${(stats.aiCategorized/stats.total*100).toFixed(1)}%)`);
    console.log(`   ❓ Uncategorized:  ${stats.uncategorized} (${(stats.uncategorized/stats.total*100).toFixed(1)}%)`);
    console.log(`   📈 Total:          ${stats.total} transactions`);

    return results;
  }

  clearCache(): void {
    this.rulesLoader.clearCache();
    this.categoryGroupHelper = null;
  }
}