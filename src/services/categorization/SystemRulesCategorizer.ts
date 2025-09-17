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
    
    // SPECIAL DEBUG: Log if this is the problematic transaction
    const isProblematicTransaction = transaction.description.toLowerCase().includes('devesh salary');
    if (isProblematicTransaction) {
      console.log('🚨 PROBLEMATIC TRANSACTION DETECTED!');
      console.log('🚨 Transaction description:', transaction.description);
      console.log('🚨 Will test all rules and show matches...');
    }
    
    if (!this.rules.length) {
      console.log('🔧 No system rules available');
      return null;
    }

    // Rules are already sorted by confidence DESC, so first match wins
    for (const rule of this.rules) {
      if (isProblematicTransaction) {
        console.log(`🚨 TESTING RULE: "${rule.pattern}" -> "${rule.category}" (confidence: ${rule.confidence})`);
      } else {
        console.log(`🔧 Testing rule: "${rule.pattern}" -> "${rule.category}" (confidence: ${rule.confidence})`);
      }
      
      const matches = PatternMatcher.matchesPattern(transaction.description, rule.pattern);
      
      if (isProblematicTransaction) {
        console.log(`🚨 Rule "${rule.pattern}" matches? ${matches}`);
      }
      
      if (matches) {
        if (isProblematicTransaction) {
          console.log(`🚨 FIRST MATCH WINS: "${rule.pattern}" -> "${rule.category}" (confidence: ${rule.confidence})`);
        } else {
          console.log(`✅ MATCHED: "${rule.pattern}" -> "${rule.category}"`);
        }
        return rule.category;
      }
    }

    console.log('❌ No system rules matched for:', transaction.description);
    return null;
  }
}