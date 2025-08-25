import { Database } from '@/integrations/supabase/types';

export type Category = Database['public']['Tables']['categories']['Row'];
export type CategoryBucket = Database['public']['Tables']['category_buckets']['Row'];
export type CategoryGroup = Database['public']['Tables']['category_groups']['Row'];

export interface CategoryBucketWithRelations extends CategoryBucket {
  categories: Category[];
}

export interface CategoryGroupWithRelations extends CategoryGroup {
  buckets: CategoryBucketWithRelations[];
}