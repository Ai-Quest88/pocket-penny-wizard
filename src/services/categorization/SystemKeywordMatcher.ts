// SystemKeywordMatcher - Database-driven keyword rules for common patterns
// This handles universal patterns that apply to all users with 80-85% accuracy
import { supabase } from '@/integrations/supabase/client';
import type { TransactionData, CategoryDiscoveryResult } from './types';

export class SystemKeywordMatcher {
  async findKeywordMatch(transaction: TransactionData): Promise<CategoryDiscoveryResult | null> {
    try {
      console.log(`🔑 SystemKeywordMatcher: Looking for keyword match in "${transaction.description}"`);
      
      const lowerDescription = transaction.description.toLowerCase();
      
      // Query system keyword rules from database
      const { data, error } = await supabase
        .from('system_keyword_rules')
        .select('keywords, category_name, confidence, priority')
        .eq('is_active', true)
        .order('priority', { ascending: true }); // Lower priority = higher precedence

      if (error) {
        console.error('Error querying system keyword rules:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.log('🔑 No system keyword rules found');
        return null;
      }

      // Check each rule for keyword matches
      for (const rule of data) {
        for (const keyword of rule.keywords) {
          if (lowerDescription.includes(keyword.toLowerCase())) {
            const result: CategoryDiscoveryResult = {
              category: rule.category_name,
              confidence: rule.confidence,
              is_new_category: false,
              source: 'system_keywords',
              group_name: this.getGroupName(rule.category_name)
            };

            console.log(`✅ SystemKeywordMatcher: Found match "${keyword}" -> "${result.category}" (${(rule.confidence * 100).toFixed(1)}% confidence)`);
            return result;
          }
        }
      }
      
      console.log('🔑 No keyword matches found');
      return null;
    } catch (error) {
      console.error('SystemKeywordMatcher error:', error);
      return null;
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
      'Shopping': 'Expenses',
      'Other Expenses': 'Expenses'
    };
    
    return groupMapping[categoryName] || 'Other';
  }
}
