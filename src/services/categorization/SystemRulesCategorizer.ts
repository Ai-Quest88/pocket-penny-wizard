import { PatternMatcher } from './PatternMatcher';
import type { TransactionData, CategorizationRule } from './types';

export class SystemRulesCategorizer {
  private rules: CategorizationRule[];

  constructor(rules: CategorizationRule[]) {
    this.rules = rules;
  }

  categorize(transaction: TransactionData): string | null {
    console.log('🔧 SystemRulesCategorizer: Processing transaction:', transaction.description);
    console.log('🔧 Available system rules:', this.rules.length);
    
    if (!this.rules.length) {
      console.log('🔧 No system rules available');
      return null;
    }

    // Rules are already sorted by confidence DESC, so first match wins
    for (const rule of this.rules) {
      console.log(`🔧 Testing rule: "${rule.pattern}" -> "${rule.category}" (confidence: ${rule.confidence})`);
      if (PatternMatcher.matchesPattern(transaction.description, rule.pattern)) {
        console.log(`✅ MATCHED: "${rule.pattern}" -> "${rule.category}"`);
        return rule.category;
      }
    }

    console.log('❌ No system rules matched for:', transaction.description);
    return null;
  }
}