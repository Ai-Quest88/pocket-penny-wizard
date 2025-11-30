import { supabase } from "@/integrations/supabase/client";

export class UserLearningService {
  /**
   * Record when user corrects a category
   */
  async recordCorrection(
    userId: string,
    transactionId: string,
    originalCategory: string,
    correctedCategory: string,
    description: string,
    amount: number
  ) {
    const merchantPattern = this.extractMerchant(description);

    // 1. Save correction to database
    const { error: correctionError } = await supabase
      .from('user_category_corrections')
      .insert({
        user_id: userId,
        transaction_id: transactionId,
        original_category: originalCategory,
        corrected_category: correctedCategory,
        description,
        merchant_pattern: merchantPattern,
        amount
      });

    if (correctionError) {
      console.error('Error saving correction:', correctionError);
      throw correctionError;
    }

    // 2. Update merchant mapping
    await this.updateMerchantMapping(userId, merchantPattern, correctedCategory, amount);

    // 3. Update transaction as user_corrected
    const { error: txError } = await supabase
      .from('transactions')
      .update({ 
        user_corrected: true, 
        original_ai_category_id: originalCategory 
      })
      .eq('id', transactionId);

    if (txError) {
      console.error('Error updating transaction:', txError);
    }

    // 4. Trigger knowledge recompilation (async, don't wait)
    supabase.functions.invoke('compile-user-knowledge', {
      body: { userId, trigger: 'correction' }
    }).catch(err => console.error('Knowledge compilation failed:', err));
  }

  /**
   * Record when user confirms AI suggestion
   */
  async recordConfirmation(userId: string, description: string, categoryId: string) {
    const merchantPattern = this.extractMerchant(description);

    // Check if mapping exists
    const { data: existing } = await supabase
      .from('user_merchant_mappings')
      .select('*')
      .eq('user_id', userId)
      .eq('merchant_pattern', merchantPattern)
      .single();

    if (existing) {
      // Update times_confirmed
      await supabase
        .from('user_merchant_mappings')
        .update({ 
          times_confirmed: existing.times_confirmed + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new mapping
      await supabase
        .from('user_merchant_mappings')
        .insert({
          user_id: userId,
          merchant_pattern: merchantPattern,
          preferred_category_id: categoryId,
          times_confirmed: 1
        });
    }
  }

  /**
   * Update or create merchant mapping
   */
  private async updateMerchantMapping(
    userId: string, 
    merchantPattern: string, 
    categoryName: string, 
    amount: number
  ) {
    // Get category ID from name
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('name', categoryName)
      .single();

    if (!category) {
      console.warn('Category not found for mapping:', categoryName);
      return;
    }

    const { data: existing } = await supabase
      .from('user_merchant_mappings')
      .select('*')
      .eq('user_id', userId)
      .eq('merchant_pattern', merchantPattern)
      .single();

    if (existing) {
      // Update existing mapping
      const newTimesUsed = existing.times_used + 1;
      const newAvgAmount = existing.average_amount
        ? (existing.average_amount * existing.times_used + Math.abs(amount)) / newTimesUsed
        : Math.abs(amount);

      await supabase
        .from('user_merchant_mappings')
        .update({
          preferred_category_id: category.id,
          times_used: newTimesUsed,
          average_amount: newAvgAmount,
          last_used_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new mapping
      await supabase
        .from('user_merchant_mappings')
        .insert({
          user_id: userId,
          merchant_pattern: merchantPattern,
          preferred_category_id: category.id,
          average_amount: Math.abs(amount),
          times_used: 1
        });
    }
  }

  /**
   * Extract merchant pattern from transaction description
   * Examples:
   * "WOOLWORTHS 1234 SYDNEY" → "WOOLWORTHS"
   * "UBER *EATS TRIP" → "UBER EATS"
   * "AMZN Mktp AU*ABC123" → "AMAZON"
   */
  extractMerchant(description: string): string {
    if (!description) return 'UNKNOWN';

    // Clean up description
    let cleaned = description.toUpperCase()
      .replace(/[0-9]+/g, '') // Remove numbers
      .replace(/\*/g, ' ') // Replace * with space
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();

    // Handle common merchant patterns
    if (cleaned.includes('AMZN')) return 'AMAZON';
    if (cleaned.includes('WOOLWORTHS') || cleaned.includes('WOW')) return 'WOOLWORTHS';
    if (cleaned.includes('COLES')) return 'COLES';
    if (cleaned.includes('UBER')) {
      if (cleaned.includes('EATS')) return 'UBER EATS';
      return 'UBER';
    }
    if (cleaned.includes('NETFLIX')) return 'NETFLIX';
    if (cleaned.includes('SPOTIFY')) return 'SPOTIFY';

    // Take first meaningful word(s)
    const words = cleaned.split(' ').filter(w => w.length > 2);
    return words.slice(0, 2).join(' ').trim() || 'UNKNOWN';
  }

  /**
   * Trigger knowledge recompilation manually
   */
  async triggerKnowledgeCompile(userId: string) {
    return await supabase.functions.invoke('compile-user-knowledge', {
      body: { userId }
    });
  }
}

export const userLearningService = new UserLearningService();