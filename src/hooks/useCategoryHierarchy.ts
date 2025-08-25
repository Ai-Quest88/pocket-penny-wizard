import { useCategories } from "@/hooks/useCategories";

export const useCategoryHierarchy = () => {
  const { categoryData } = useCategories();

  const getCategoryHierarchy = (categoryName: string): string => {
    if (!categoryData || !categoryName || categoryName === 'Uncategorized') {
      return 'Uncategorized';
    }

    // Search through all groups, buckets, and categories to find the hierarchy
    for (const categoryType in categoryData) {
      const groups = categoryData[categoryType as keyof typeof categoryData];
      
      for (const group of groups) {
        for (const bucket of group.buckets || []) {
          for (const category of bucket.categories || []) {
            if (category.name === categoryName) {
              return `${category.name} → ${bucket.name} → ${group.name}`;
            }
          }
        }
      }
    }

    // If not found in hierarchy, return the original category name
    return categoryName;
  };

  const predictCategoryHierarchy = (description: string): string => {
    const lowerDesc = description.toLowerCase();
    
    // Enhanced mapping to predict AI categories based on description
    if (lowerDesc.includes('salary') || lowerDesc.includes('wage') || lowerDesc.includes('pay')) {
      return getCategoryHierarchy('Salary');
    }
    if (lowerDesc.includes('grocery') || lowerDesc.includes('supermarket') || lowerDesc.includes('coles') || 
        lowerDesc.includes('woolworths') || lowerDesc.includes('grocery store')) {
      return getCategoryHierarchy('Groceries');
    }
    if (lowerDesc.includes('coffee') || lowerDesc.includes('cafe') || lowerDesc.includes('starbucks')) {
      return getCategoryHierarchy('Coffee Shops');
    }
    if (lowerDesc.includes('gas') || lowerDesc.includes('petrol') || lowerDesc.includes('fuel') || 
        lowerDesc.includes('bp') || lowerDesc.includes('caltex') || lowerDesc.includes('gas station')) {
      return getCategoryHierarchy('Fuel');
    }
    if (lowerDesc.includes('restaurant') || lowerDesc.includes('dining') || lowerDesc.includes('food')) {
      return getCategoryHierarchy('Dining');
    }
    if (lowerDesc.includes('transport') || lowerDesc.includes('taxi') || lowerDesc.includes('uber')) {
      return getCategoryHierarchy('Transportation');
    }
    
    return 'Will be categorized by AI';
  };

  return {
    getCategoryHierarchy,
    predictCategoryHierarchy,
    categoryData
  };
};