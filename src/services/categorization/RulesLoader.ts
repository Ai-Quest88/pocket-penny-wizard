import { supabase } from '@/integrations/supabase/client';
import type { CategorizationRule } from './types';

export class RulesLoader {
  private userId: string;
  private userRulesCache: CategorizationRule[] | null = null;
  private systemRulesCache: CategorizationRule[] | null = null;
  private systemCategoriesCache: Map<string, string> | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  async loadUserRules(): Promise<CategorizationRule[]> {
    if (this.userRulesCache) return this.userRulesCache;

    const { data: userRules, error } = await supabase
      .from('user_categorization_rules')
      .select('pattern, category, confidence')
      .eq('user_id', this.userId)
      .order('confidence', { ascending: false });

    this.userRulesCache = error ? [] : (userRules || []);
    return this.userRulesCache;
  }

  async loadSystemRules(): Promise<CategorizationRule[]> {
    if (this.systemRulesCache) return this.systemRulesCache;

    const { data: systemRules, error } = await supabase
      .from('system_categorization_rules')
      .select('pattern, category, confidence')
      .eq('is_active', true)
      .order('confidence', { ascending: false });

    this.systemRulesCache = error ? [] : (systemRules || []);
    return this.systemRulesCache;
  }

  async loadSystemCategories(): Promise<Map<string, string>> {
    if (this.systemCategoriesCache) return this.systemCategoriesCache;

    const { data: systemCategories, error } = await supabase
      .from('categories')
      .select('name, group_id, category_groups(name)')
      .eq('is_system', true);

    this.systemCategoriesCache = new Map();
    if (!error && systemCategories) {
      for (const cat of systemCategories) {
        const groupName = (cat as any).category_groups?.name || 'Expense';
        this.systemCategoriesCache.set(cat.name, groupName);
      }
    }

    return this.systemCategoriesCache;
  }

  clearCache(): void {
    this.userRulesCache = null;
    this.systemRulesCache = null;
    this.systemCategoriesCache = null;
  }
}