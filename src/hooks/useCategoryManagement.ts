import { useCategories } from "@/hooks/useCategories";
import { useCategoryHierarchy } from "@/hooks/useCategoryHierarchy";

export interface CategoryGroup {
  id: string;
  name: string;
  categories: CategoryItem[];
  type: 'income' | 'expense' | 'asset' | 'liability' | 'transfer';
}

export interface CategoryItem {
  id: string;
  name: string;
  groupName: string;
  hierarchy: string;
}

/**
 * Centralized category management hook
 * Provides a consistent interface for all category operations
 */
export const useCategoryManagement = () => {
  const { categoryData, isLoading, addCategory, addGroup, deleteCategory, deleteGroup } = useCategories();
  const { getCategoryHierarchy, predictCategoryHierarchy } = useCategoryHierarchy();

  // Transform category data into a flat structure for form components
  const getFlatCategoriesList = (): CategoryItem[] => {
    if (!categoryData) return [];

    const flatCategories: CategoryItem[] = [];
    
    Object.entries(categoryData).forEach(([type, groups]) => {
      groups.forEach(group => {
        group.categories?.forEach(category => {
          flatCategories.push({
            id: category.id,
            name: category.name,
            groupName: group.name,
            hierarchy: getCategoryHierarchy(category.name)
          });
        });
      });
    });

    return flatCategories.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Transform category data into grouped structure for advanced components
  const getGroupedCategories = (): CategoryGroup[] => {
    if (!categoryData) return [];

    const groupedCategories: CategoryGroup[] = [];
    
    Object.entries(categoryData).forEach(([type, groups]) => {
      groups.forEach(group => {
        const categories: CategoryItem[] = group.categories?.map(category => ({
          id: category.id,
          name: category.name,
          groupName: group.name,
          hierarchy: getCategoryHierarchy(category.name)
        })) || [];

        groupedCategories.push({
          id: group.id,
          name: group.name,
          categories,
          type: type as 'income' | 'expense' | 'asset' | 'liability' | 'transfer'
        });
      });
    });

    return groupedCategories;
  };

  // Get categories for a specific type (income, expense, etc.)
  const getCategoriesByType = (type: 'income' | 'expense' | 'asset' | 'liability' | 'transfer'): CategoryItem[] => {
    if (!categoryData || !categoryData[type]) return [];

    const flatCategories: CategoryItem[] = [];
    categoryData[type].forEach(group => {
      group.categories?.forEach(category => {
        flatCategories.push({
          id: category.id,
          name: category.name,
          groupName: group.name,
          hierarchy: getCategoryHierarchy(category.name)
        });
      });
    });

    return flatCategories.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Find category by name
  const findCategoryByName = (categoryName: string): CategoryItem | null => {
    const flatCategories = getFlatCategoriesList();
    return flatCategories.find(cat => cat.name === categoryName) || null;
  };

  // Add new category to a group
  const addCategoryToGroup = async (categoryName: string, groupId: string) => {
    try {
      // Find the group to get its type
      const currentGroupedCategories = getGroupedCategories();
      const targetGroup = currentGroupedCategories.find(group => group.id === groupId);
      const groupType = targetGroup?.type || 'expense';
      
      await addCategory({ 
        category: { 
          name: categoryName,
          description: '',
          type: groupType,
          group_id: groupId,
          color: '#6366f1',
          icon: '📝',
          is_ai_generated: false,
          is_system: false,
          merchant_patterns: [],
          sort_order: 0
        }, 
        groupId 
      });
      return true;
    } catch (error) {
      console.error('Error adding category:', error);
      return false;
    }
  };

  return {
    // Data
    categoryData,
    isLoading,
    
    // Transformed data
    flatCategories: getFlatCategoriesList(),
    groupedCategories: getGroupedCategories(),
    
    // Utility functions
    getCategoriesByType,
    findCategoryByName,
    getCategoryHierarchy,
    predictCategoryHierarchy,
    
    // Actions
    addCategoryToGroup,
    addGroup,
    deleteCategory,
    deleteGroup
  };
};