import { PatternMatcher } from './PatternMatcher';
import type { TransactionData, CategorizationRule } from './types';

export class UserRulesCategorizer {
  private rules: CategorizationRule[];

  constructor(rules: CategorizationRule[]) {
    this.rules = rules;
  }

  categorize(transaction: TransactionData): string | null {
    if (!this.rules.length) return null;

    for (const rule of this.rules) {
      if (PatternMatcher.matchesPattern(transaction.description, rule.pattern)) {
        return rule.category;
      }
    }

    return null;
  }
}