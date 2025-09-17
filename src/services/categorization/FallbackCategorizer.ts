import type { TransactionData } from './types';

export class FallbackCategorizer {
  static categorize(transaction: TransactionData): string {
    const description = transaction.description.toLowerCase();
    
    // Banking and transfers
    if (description.includes('transfer') || description.includes('payid') || description.includes('bpay')) {
      return 'Transfers';
    }
    
    // ATM and cash
    if (description.includes('atm') || description.includes('withdrawal') || description.includes('cash')) {
      return 'Cash Withdrawal';
    }
    
    // Supermarkets
    if (description.includes('woolworths') || description.includes('coles') || description.includes('aldi') || description.includes('iga')) {
      return 'Supermarket';
    }
    
    // Transport
    if (description.includes('uber') || description.includes('opal') || description.includes('transport')) {
      return 'Transport';
    }
    
    return 'Uncategorized';
  }
}