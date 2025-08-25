import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CategoryGroupWithRelations, CategoryBucketWithRelations, Category } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export const useCategories = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all category data with nested relationships
  const { data: categoryData, isLoading, error, refetch } = useQuery({
    queryKey: ['categories-with-relations', session?.user?.id],
    queryFn: async (): Promise<Record<string, CategoryGroupWithRelations[]>> => {
      if (!session?.user?.id) return { income: [], expense: [], asset: [], liability: [], transfer: [] };

      // Fetch all data in parallel
      const [groupsResult, bucketsResult, categoriesResult] = await Promise.all([
        supabase
          .from('category_groups')
          .select('*')
          .eq('user_id', session.user.id)
          .order('sort_order', { ascending: true }),
        
        supabase
          .from('category_buckets')
          .select('*')
          .eq('user_id', session.user.id)
          .order('sort_order', { ascending: true }),
        
        supabase
          .from('categories')
          .select('*')
          .eq('user_id', session.user.id)
          .order('sort_order', { ascending: true })
      ]);

      if (groupsResult.error) throw groupsResult.error;
      if (bucketsResult.error) throw bucketsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      const groups = groupsResult.data || [];
      const buckets = bucketsResult.data || [];
      const categories = categoriesResult.data || [];

      // Build nested structure
      const groupsWithBuckets: CategoryGroupWithRelations[] = groups.map(group => ({
        ...group,
        buckets: buckets
          .filter(bucket => bucket.group_id === group.id)
          .map(bucket => ({
            ...bucket,
            categories: categories.filter(category => category.bucket_id === bucket.id)
          }))
      }));

      // Group by category type
      const result = {
        income: groupsWithBuckets.filter(g => g.category_type === 'income'),
        expense: groupsWithBuckets.filter(g => g.category_type === 'expense'),
        asset: groupsWithBuckets.filter(g => g.category_type === 'asset'),
        liability: groupsWithBuckets.filter(g => g.category_type === 'liability'),
        transfer: groupsWithBuckets.filter(g => g.category_type === 'transfer')
      };

      console.log('=== CATEGORIES WITH RELATIONS ===');
      console.log('Built nested structure:', result);

      return result;
    },
    enabled: !!session?.user?.id
  });

  // Add new category
  const addCategoryMutation = useMutation({
    mutationFn: async ({ category, bucketId }: { category: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>, bucketId: string }) => {
      if (!session?.user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...category,
          bucket_id: bucketId,
          user_id: session.user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-with-relations'] });
      toast({
        title: "Category Added",
        description: "Your new category has been added successfully.",
      });
    },
    onError: (error) => {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Add new bucket
  const addBucketMutation = useMutation({
    mutationFn: async ({ bucket, groupId }: { bucket: Omit<CategoryBucketWithRelations, 'id' | 'user_id' | 'group_id' | 'created_at' | 'updated_at'>, groupId: string }) => {
      if (!session?.user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('category_buckets')
        .insert({
          ...bucket,
          group_id: groupId,
          user_id: session.user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-with-relations'] });
      toast({
        title: "Bucket Added",
        description: "Your new bucket has been added successfully.",
      });
    },
    onError: (error) => {
      console.error('Error adding bucket:', error);
      toast({
        title: "Error",
        description: "Failed to add bucket. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Add new group
  const addGroupMutation = useMutation({
    mutationFn: async (group: Omit<CategoryGroupWithRelations, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!session?.user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('category_groups')
        .insert({
          ...group,
          user_id: session.user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-with-relations'] });
      toast({
        title: "Group Added",
        description: "Your new group has been added successfully.",
      });
    },
    onError: (error) => {
      console.error('Error adding group:', error);
      toast({
        title: "Error",
        description: "Failed to add group. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    categoryData,
    isLoading,
    error,
    refetch,
    addCategory: addCategoryMutation.mutate,
    addBucket: addBucketMutation.mutate,
    addGroup: addGroupMutation.mutate,
    isAddingCategory: addCategoryMutation.isPending,
    isAddingBucket: addBucketMutation.isPending,
    isAddingGroup: addGroupMutation.isPending
  };
};

