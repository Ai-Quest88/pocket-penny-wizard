import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CategoryGroupWithRelations, Category } from "@/types/categories";
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

      // Check if user has any categories, if not create defaults
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1);

      if (!existingCategories || existingCategories.length === 0) {
        // Create default categories for new user
        const { error: defaultError } = await supabase.rpc('create_default_categories_for_user', {
          target_user_id: session.user.id
        });
        
        if (defaultError) {
          console.error('Error creating default categories:', defaultError);
        }
      }

      // Fetch all data in parallel - include both user and system categories
      const [groupsResult, categoriesResult] = await Promise.all([
        supabase
          .from('category_groups')
          .select('*')
          .or(`user_id.eq.${session.user.id},is_system.eq.true`)
          .order('created_at', { ascending: true }),
        
        supabase
          .from('categories')
          .select('*')
          .or(`user_id.eq.${session.user.id},is_system.eq.true`)
          .order('sort_order', { ascending: true })
      ]);

      if (groupsResult.error) throw groupsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      const groups = groupsResult.data || [];
      const categories = categoriesResult.data || [];

      // Remove duplicate groups - prioritize system groups over user groups for same category_type
      const uniqueGroups = groups.filter((group, index, array) => {
        // If this is a user group, check if there's a system group with the same category_type
        if (!group.is_system && group.user_id) {
          const hasSystemGroup = array.some(g => 
            g.is_system && g.category_type === group.category_type
          );
          return !hasSystemGroup;
        }
        return true;
      });

      // Build nested structure - simplified 2-tier
      const groupsWithCategories: CategoryGroupWithRelations[] = uniqueGroups.map(group => ({
        ...group,
        categories: categories.filter(category => category.group_id === group.id)
      }));

      // Group by category type
      const result = {
        income: groupsWithCategories.filter(g => g.category_type === 'income'),
        expense: groupsWithCategories.filter(g => g.category_type === 'expense'),
        asset: groupsWithCategories.filter(g => g.category_type === 'asset'),
        liability: groupsWithCategories.filter(g => g.category_type === 'liability'),
        transfer: groupsWithCategories.filter(g => g.category_type === 'transfer')
      };

      console.log('=== CATEGORIES WITH RELATIONS (2-TIER) ===');
      console.log('Built nested structure:', result);

      return result;
    },
    enabled: !!session?.user?.id
  });

  // Add new category
  const addCategoryMutation = useMutation({
    mutationFn: async ({ category, groupId }: { category: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>, groupId: string }) => {
      if (!session?.user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...category,
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

  // Add new group
  const addGroupMutation = useMutation({
    mutationFn: async (group: Omit<CategoryGroupWithRelations, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'categories'>) => {
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

  // Delete category
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      if (!session?.user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', session.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-with-relations'] });
      toast({
        title: "Category Deleted",
        description: "The category has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete group
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      if (!session?.user?.id) throw new Error('User not authenticated');

      // First, delete all categories in this group
      const { error: categoriesError } = await supabase
        .from('categories')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', session.user.id);

      if (categoriesError) throw categoriesError;

      // Then delete the group
      const { error: groupError } = await supabase
        .from('category_groups')
        .delete()
        .eq('id', groupId)
        .eq('user_id', session.user.id);

      if (groupError) throw groupError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-with-relations'] });
      toast({
        title: "Group Deleted",
        description: "The group and all its categories have been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: "Failed to delete group. Please try again.",
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
    addGroup: addGroupMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
    deleteGroup: deleteGroupMutation.mutate,
    isAddingCategory: addCategoryMutation.isPending,
    isAddingGroup: addGroupMutation.isPending,
    isDeletingCategory: deleteCategoryMutation.isPending,
    isDeletingGroup: deleteGroupMutation.isPending
  };
};