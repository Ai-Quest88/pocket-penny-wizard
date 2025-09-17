import { supabase } from '@/integrations/supabase/client';
import type { TransactionData } from './types';

export interface AICategoryResult {
  category_name: string;
  confidence: number;
}

export class AICategorizer {
  async categorize(transactions: TransactionData[], userId?: string): Promise<AICategoryResult[]> {
    console.log('🤖 AICategorizer: Processing', transactions.length, 'transactions');
    
    // Use the categorize-transaction edge function with batch mode
    const { data, error } = await supabase.functions.invoke('categorize-transaction', {
      body: { 
        batchMode: true,
        descriptions: transactions.map(t => t.description),
        userId: userId || ''
      }
    });

    if (!error && data?.categories) {
      console.log('✅ AI categorization successful:', data.categories.length, 'categories returned');
      
      // Convert the response to match our expected format
      return data.categories.map((categoryName: string, index: number) => ({
        category_name: categoryName,
        confidence: 0.85 // Default confidence for AI categorization
      }));
    }

    console.error('❌ AI categorization failed:', error);
    throw new Error(error?.message || 'AI categorization failed');
  }
}