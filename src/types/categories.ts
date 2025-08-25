import { Database } from '@/integrations/supabase/types';

export type Category = Database['public']['Tables']['categories']['Row'];
export type CategoryGroup = Database['public']['Tables']['category_groups']['Row'];
export type BudgetCategory = Database['public']['Tables']['budget_categories']['Row'];

export interface CategoryGroupWithRelations extends CategoryGroup {
  categories: Category[];
}