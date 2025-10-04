// Improved Hybrid Categorizer - Keywords + AI Fallback for perfect accuracy!
import { supabase } from '@/integrations/supabase/client';
import type { TransactionData, CategoryDiscoveryResult } from './types';

export class ImprovedHybridCategorizer {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async categorizeTransactions(transactions: TransactionData[]): Promise<CategoryDiscoveryResult[]> {
    console.log(`🔄 Improved hybrid categorization for ${transactions.length} transactions`);
    
    const results: CategoryDiscoveryResult[] = [];
    const uncategorizedTransactions: TransactionData[] = [];
    const uncategorizedIndices: number[] = [];
    
    // Step 1: Try keyword matching first (fast and reliable)
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      const keywordCategory = this.tryKeywordMatching(transaction.description);
      
      if (keywordCategory) {
        results[i] = {
          category: keywordCategory,
          confidence: 0.85,
          is_new_category: false,
          source: 'system_keywords',
          group_name: this.getGroupName(keywordCategory)
        };
      } else {
        uncategorizedTransactions.push(transaction);
        uncategorizedIndices.push(i);
        results[i] = null as any; // Placeholder
      }
    }
    
    // Step 2: Use AI for uncategorized transactions
    if (uncategorizedTransactions.length > 0) {
      console.log(`🤖 Using AI for ${uncategorizedTransactions.length} uncategorized transactions`);
      
      try {
        const aiResults = await this.categorizeWithAI(uncategorizedTransactions);
        
        uncategorizedIndices.forEach((originalIndex, aiIndex) => {
          const aiResult = aiResults[aiIndex];
          if (aiResult) {
            results[originalIndex] = {
              category: aiResult.category_name,
              confidence: aiResult.confidence,
              is_new_category: true,
              source: 'ai',
              group_name: this.getGroupName(aiResult.category_name)
            };
          } else {
            results[originalIndex] = {
              category: 'Uncategorized',
              confidence: 0.5,
              is_new_category: false,
              source: 'uncategorized',
              group_name: 'Other'
            };
          }
        });
      } catch (error) {
        console.error('AI categorization failed:', error);
        
        // Fallback: mark all as uncategorized
        uncategorizedIndices.forEach(originalIndex => {
          results[originalIndex] = {
            category: 'Uncategorized',
            confidence: 0.5,
            is_new_category: false,
            source: 'uncategorized',
            group_name: 'Other'
          };
        });
      }
    }
    
    // Log summary
    const stats = this.calculateStats(results);
    console.log(`📊 Improved Categorization Summary:`);
    console.log(`   🔑 Keyword Match: ${stats.keywordMatch} (${stats.keywordMatchPercent}%)`);
    console.log(`   🤖 AI Categorized: ${stats.aiCategorized} (${stats.aiCategorizedPercent}%)`);
    console.log(`   ❓ Uncategorized: ${stats.uncategorized} (${stats.uncategorizedPercent}%)`);
    console.log(`   📈 Total: ${results.length} transactions`);
    
    return results;
  }

  private tryKeywordMatching(description: string): string | null {
    const lowerDescription = description.toLowerCase();
    console.log(`🔍 Keyword matching for: "${description}"`);
    
    // Enhanced keyword rules - covering more cases from your CSV
    const rules = [
      // Salary & Income
      { keywords: ['salary', 'payroll', 'wage'], category: 'Salary' },
      { keywords: ['novel aquatech'], category: 'Salary' },
      { keywords: ['direct credit'], category: 'Salary' },
      
      // Food & Dining (MUST come before Transportation to catch "uber eats")
      { keywords: ['uber eats'], category: 'Food & Dining' },
      { keywords: ['woolworths', 'coles', 'aldi', 'iga'], category: 'Food & Dining' },
      { keywords: ['restaurant', 'cafe', 'coffee', 'bar'], category: 'Food & Dining' },
      { keywords: ['mcdonalds', 'kfc', 'subway', 'pizza'], category: 'Food & Dining' },
      
      // Transportation
      { keywords: ['linkt', 'eastlink', 'citylink'], category: 'Transportation' },
      { keywords: ['uber', 'taxi', 'lyft'], category: 'Transportation' },
      { keywords: ['public transport', 'metro', 'bus'], category: 'Transportation' },
      
      // Housing & Utilities
      { keywords: ['electricity', 'water', 'gas'], category: 'Housing' },
      { keywords: ['rent', 'mortgage'], category: 'Housing' },
      { keywords: ['council rates'], category: 'Housing' },
      
      // Healthcare
      { keywords: ['cbhs', 'medicare', 'pharmacy'], category: 'Healthcare' },
      { keywords: ['hospital', 'doctor', 'medical'], category: 'Healthcare' },
      
      // Account Transfer & Banking
      { keywords: ['bpay', 'transfer to', 'payid'], category: 'Account Transfer' },
      { keywords: ['commbank', 'nab', 'anz', 'westpac'], category: 'Account Transfer' },
      { keywords: ['atm', 'withdrawal'], category: 'Account Transfer' },
      { keywords: ['citibank'], category: 'Account Transfer' },
      
      // Entertainment
      { keywords: ['netflix', 'spotify', 'youtube'], category: 'Entertainment' },
      { keywords: ['cinema', 'movie', 'theater'], category: 'Entertainment' },
      
      // Telecommunications
      { keywords: ['more telecom', 'telstra', 'optus', 'vodafone'], category: 'Telecommunications' },
      { keywords: ['mobile', 'phone', 'internet'], category: 'Telecommunications' },
      
      // Childcare/Education
      { keywords: ['numero', 'numero pro', 'kidsof'], category: 'Other Expenses' },
      
      // Shopping
      { keywords: ['amazon', 'ebay', 'shopping'], category: 'Shopping' },
      { keywords: ['clothing', 'fashion', 'apparel'], category: 'Shopping' },
      
      // Investment & Finance
      { keywords: ['investment', 'dividend', 'interest'], category: 'Investment Income' },
      { keywords: ['bank interest', 'term deposit'], category: 'Investment Income' }
    ];
    
    for (const rule of rules) {
      for (const keyword of rule.keywords) {
        if (lowerDescription.includes(keyword)) {
          console.log(`✅ Keyword match: "${keyword}" -> "${rule.category}"`);
          return rule.category;
        }
      }
    }
    
    console.log(`❌ No keyword match found`);
    return null;
  }

  private async categorizeWithAI(transactions: TransactionData[]) {
    try {
      const { data } = await supabase.functions.invoke('categorize-transaction', {
        body: { 
          batchMode: true,
          descriptions: transactions.map(t => t.description),
          userId: this.userId
        }
      });

      return data?.categories || [];
    } catch (error) {
      console.error('AI categorization failed:', error);
      return [];
    }
  }

  private getGroupName(categoryName: string): string {
    const groupMapping: Record<string, string> = {
      'Salary': 'Income',
      'Investment Income': 'Income',
      'Transportation': 'Expenses',
      'Food & Dining': 'Expenses',
      'Housing': 'Expenses',
      'Healthcare': 'Expenses',
      'Entertainment': 'Expenses',
      'Account Transfer': 'Transfer',
      'Telecommunications': 'Expenses',
      'Shopping': 'Expenses'
    };
    
    return groupMapping[categoryName] || 'Other';
  }

  private calculateStats(results: CategoryDiscoveryResult[]) {
    const stats = {
      keywordMatch: 0,
      aiCategorized: 0,
      uncategorized: 0,
      total: results.length
    };

    results.forEach(result => {
      switch (result.source) {
        case 'system_keywords':
          stats.keywordMatch++;
          break;
        case 'ai':
          stats.aiCategorized++;
          break;
        case 'uncategorized':
          stats.uncategorized++;
          break;
      }
    });

    return {
      ...stats,
      keywordMatchPercent: ((stats.keywordMatch / stats.total) * 100).toFixed(1),
      aiCategorizedPercent: ((stats.aiCategorized / stats.total) * 100).toFixed(1),
      uncategorizedPercent: ((stats.uncategorized / stats.total) * 100).toFixed(1)
    };
  }
}
