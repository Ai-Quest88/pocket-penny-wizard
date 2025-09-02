import { useCategories } from "@/hooks/useCategories";

export const useCategoryHierarchy = () => {
  const { categoryData } = useCategories();

  const getCategoryHierarchy = (categoryName: string, transactionType?: string): string => {
    if (!categoryData || !categoryName || categoryName === 'Uncategorized') {
      return 'Uncategorized';
    }

    const matches = [];

    // Search through all groups and categories to find all matches
    for (const categoryType in categoryData) {
      const groups = categoryData[categoryType as keyof typeof categoryData];
      
      for (const group of groups) {
        for (const category of group.categories || []) {
          if (category.name === categoryName) {
            matches.push({
              categoryName: category.name,
              groupName: group.name,
              categoryType: category.type,
              hierarchy: `${category.name} → ${group.name}`
            });
          }
        }
      }
    }

    // If we have multiple matches, try to pick the best one
    if (matches.length > 1) {
      // Prefer matches based on transaction context
      if (transactionType) {
        const typeMatch = matches.find(m => m.categoryType === transactionType);
        if (typeMatch) return typeMatch.hierarchy;
      }
      
      // If no type match, prefer non-system categories or most specific groups
      const preferredMatch = matches.find(m => 
        !['Expenses', 'Income', 'Transfers'].includes(m.groupName)
      ) || matches[0];
      
      return preferredMatch.hierarchy;
    }

    // Single match or no matches
    if (matches.length === 1) {
      return matches[0].hierarchy;
    }

    // If not found in hierarchy, return the original category name
    return categoryName;
  };

  const predictCategoryHierarchy = (description: string): string => {
    const lowerDesc = description.toLowerCase();
    
    // Enhanced mapping to predict AI categories based on description
    if (lowerDesc.includes('salary') || lowerDesc.includes('wage') || lowerDesc.includes('pay')) {
      return getCategoryHierarchy('Salary', 'income');
    }
    if (lowerDesc.includes('grocery') || lowerDesc.includes('supermarket') || lowerDesc.includes('coles') || 
        lowerDesc.includes('woolworths') || lowerDesc.includes('grocery store')) {
      return getCategoryHierarchy('Groceries', 'expense');
    }
    if (lowerDesc.includes('coffee') || lowerDesc.includes('cafe') || lowerDesc.includes('starbucks')) {
      return getCategoryHierarchy('Coffee Shops', 'expense');
    }
    if (lowerDesc.includes('gas') || lowerDesc.includes('petrol') || lowerDesc.includes('fuel') || 
        lowerDesc.includes('bp') || lowerDesc.includes('caltex') || lowerDesc.includes('gas station')) {
      return getCategoryHierarchy('Transport', 'expense');
    }
    if (lowerDesc.includes('restaurant') || lowerDesc.includes('dining') || lowerDesc.includes('food')) {
      return getCategoryHierarchy('Restaurants', 'expense');
    }
    if (lowerDesc.includes('transport') || lowerDesc.includes('taxi') || lowerDesc.includes('uber')) {
      return getCategoryHierarchy('Transport', 'expense');
    }
    
    return 'Will be categorized by AI';
  };

  return {
    getCategoryHierarchy,
    predictCategoryHierarchy,
    categoryData
  };
};