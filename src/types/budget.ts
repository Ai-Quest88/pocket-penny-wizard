
export interface Budget {
  id: string;
  userId: string;
  entityId?: string;
  category: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategory {
  category: string;
  spent: number;
  total: number;
  budgetId?: string;
}
