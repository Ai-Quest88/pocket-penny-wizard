export class CategoryGroupHelper {
  private systemCategoriesMap: Map<string, string>;

  constructor(systemCategoriesMap: Map<string, string>) {
    this.systemCategoriesMap = systemCategoriesMap;
  }

  getGroupName(categoryName: string): string {
    if (this.systemCategoriesMap.has(categoryName)) {
      return this.systemCategoriesMap.get(categoryName)!;
    }
    
    // Fallback mapping for common categories
    const typeMap: Record<string, string> = {
      'Salary': 'Income',
      'Investment Income': 'Income',
      'Account Transfer': 'Transfer',
      'Transportation': 'Expense',
      'Food & Dining': 'Expense',
      'Housing': 'Expense',
      'Healthcare': 'Expense',
      'Entertainment': 'Expense',
      'Shopping': 'Expense',
      'Cash Withdrawal': 'Expense',
      'Government & Tax': 'Expense',
      'Supermarket': 'Expense',
      'Transport': 'Expense',
      'Transfers': 'Transfer'
    };
    
    return typeMap[categoryName] || 'Expense';
  }
}