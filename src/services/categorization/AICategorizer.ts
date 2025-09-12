import { supabase } from '@/integrations/supabase/client';
import type { TransactionData } from './types';

export interface AICategoryResult {
  category_name: string;
  confidence: number;
}

export class AICategorizer {
  async categorize(transactions: TransactionData[]): Promise<AICategoryResult[]> {
    const { data, error } = await supabase.functions.invoke('discover-categories', {
      body: { 
        transactions: transactions.map(t => ({
          description: t.description,
          amount: t.amount,
          date: t.date
        }))
      }
    });

    if (!error && data?.success && data?.categorized_transactions) {
      return data.categorized_transactions;
    }

    throw new Error(error?.message || 'AI categorization failed');
  }
}