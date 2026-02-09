import { supabase } from '@/integrations/supabase/client';
import type { TransactionData, CategoryDiscoveryResult } from './types';

const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 1000;

export class AICategorizer {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Batch categorize multiple transactions at once.
   * Sends as {transactions: [{description}]} to match Express /api/ai/categorize shape.
   * Express returns [{category, confidence, group_name, source, is_new_category}].
   */
  async batchCategorize(transactions: TransactionData[]): Promise<(CategoryDiscoveryResult | null)[]> {
    try {
      console.log(`[AICategorizer] Batch processing ${transactions.length} transactions`);

      // Get user context for better categorization
      const userContext = await this.getUserContextFromTransactions();

      // Shape the request to match Express /api/ai/categorize endpoint
      const payload = {
        transactions: transactions.map(t => ({
          description: t.description,
          amount: t.amount,
          date: t.date,
        })),
        userContext,
      };

      const result = await this.invokeWithRetry(payload);
      if (!result) {
        console.warn('[AICategorizer] Batch failed after retries, returning nulls');
        return transactions.map(() => null);
      }

      // Express returns an array of {category, confidence, group_name, source, is_new_category}
      const categories: any[] = Array.isArray(result) ? result : [];
      console.log(`[AICategorizer] Batch success: ${categories.length} categories returned`);

      return transactions.map((_, i) => {
        const cat = categories[i];
        if (!cat?.category) return null;
        return {
          category: cat.category,
          confidence: typeof cat.confidence === 'number' ? cat.confidence : 0.75,
          is_new_category: cat.is_new_category ?? true,
          source: 'ai' as const,
          group_name: cat.group_name || this.inferGroupName(cat.category),
        };
      });
    } catch (error) {
      console.error('[AICategorizer] Batch error:', error instanceof Error ? error.message : error);
      return transactions.map(() => null);
    }
  }

  /**
   * Categorize a single transaction.
   */
  async categorize(transaction: TransactionData): Promise<CategoryDiscoveryResult | null> {
    try {
      console.log(`[AICategorizer] Processing "${transaction.description}"`);

      const userContext = await this.getUserContextFromTransactions();

      const payload = {
        transactions: [{
          description: transaction.description,
          amount: transaction.amount,
          date: transaction.date,
        }],
        userContext,
      };

      const result = await this.invokeWithRetry(payload);
      if (!result) {
        console.warn(`[AICategorizer] Failed for "${transaction.description}" after retries`);
        return null;
      }

      const categories: any[] = Array.isArray(result) ? result : [];
      const cat = categories[0];
      if (!cat?.category) return null;

      console.log(`[AICategorizer] Success: "${transaction.description}" -> ${cat.category}`);
      return {
        category: cat.category,
        confidence: typeof cat.confidence === 'number' ? cat.confidence : 0.75,
        is_new_category: cat.is_new_category ?? true,
        source: 'ai',
        group_name: cat.group_name || this.inferGroupName(cat.category),
      };
    } catch (error) {
      console.error(`[AICategorizer] Error for "${transaction.description}":`, error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Invoke the categorize-transaction function with retry logic.
   * Returns the parsed response data or null on failure.
   */
  private async invokeWithRetry(payload: any, attempt = 0): Promise<any[] | null> {
    const { data, error } = await supabase.functions.invoke('categorize-transaction', {
      body: payload,
    });

    if (!error && data) {
      // Express may return the array directly or wrapped
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.categories)) return data.categories;
      // Single result wrapped
      if (data.category) return [data];
      return data;
    }

    if (attempt < MAX_RETRIES) {
      console.warn(`[AICategorizer] Attempt ${attempt + 1} failed, retrying in ${RETRY_DELAY_MS}ms...`, error?.message);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return this.invokeWithRetry(payload, attempt + 1);
    }

    console.error(`[AICategorizer] All ${MAX_RETRIES + 1} attempts failed:`, error?.message);
    return null;
  }

  /**
   * Fetch user's most-used categories to provide context to the AI.
   */
  private async getUserContextFromTransactions() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('category_id, categories(name)')
        .eq('user_id', this.userId)
        .not('category_id', 'is', null)
        .limit(50);

      if (error || !data) {
        return { mostUsedCategories: [] };
      }

      const categoryCounts: Record<string, number> = {};
      data.forEach(tx => {
        const categories = tx.categories as any;
        const categoryName = categories?.name;
        if (categoryName) {
          categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
        }
      });

      const mostUsedCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([category]) => category);

      return { mostUsedCategories };
    } catch (error) {
      console.error('[AICategorizer] Error getting user context:', error);
      return { mostUsedCategories: [] };
    }
  }

  /**
   * Infer group name from category if the AI response doesn't include one.
   */
  private inferGroupName(categoryName: string): string {
    const lower = categoryName.toLowerCase();

    // Income indicators
    if (/salary|wages|income|dividend|interest.*income|freelance|bonus|refund|reimbursement/.test(lower)) {
      return 'Income';
    }
    // Transfer indicators
    if (/transfer|tfr|xfer/.test(lower)) {
      return 'Transfer';
    }
    // Everything else is likely an expense
    return 'Expenses';
  }
}
