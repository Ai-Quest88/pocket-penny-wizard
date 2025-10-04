// Improved Transaction Categorizer - Keywords + AI for perfect accuracy!
import { ImprovedHybridCategorizer } from './ImprovedHybridCategorizer';
import type { TransactionData, CategoryDiscoveryResult } from './types';

export class ImprovedTransactionCategorizer {
  private hybridCategorizer: ImprovedHybridCategorizer;

  constructor(userId: string) {
    this.hybridCategorizer = new ImprovedHybridCategorizer(userId);
  }

  async categorizeTransactions(transactions: TransactionData[]): Promise<CategoryDiscoveryResult[]> {
    return this.hybridCategorizer.categorizeTransactions(transactions);
  }
}
