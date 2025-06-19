
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { Download, FileSpreadsheet } from "lucide-react"

interface CategoryData {
  category: string;
  actual: number;
  budgeted: number;
  variance: number;
}

export function IncomeExpenseReport() {
  const { session } = useAuth();

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['income-expense-report', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return null;

      const currentMonth = new Date();
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      // Get transactions for current month
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('date', monthStart.toISOString().split('T')[0])
        .lte('date', monthEnd.toISOString().split('T')[0]);

      // Get budgets for current month
      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true);

      // Process income and expense categories
      const incomeCategories: CategoryData[] = [];
      const expenseCategories: CategoryData[] = [];

      // Group transactions by category
      const transactionsByCategory = (transactions || []).reduce((acc, transaction) => {
        if (!acc[transaction.category]) {
          acc[transaction.category] = 0;
        }
        acc[transaction.category] += Number(transaction.amount);
        return acc;
      }, {} as Record<string, number>);

      // Group budgets by category
      const budgetsByCategory = (budgets || []).reduce((acc, budget) => {
        acc[budget.category] = Number(budget.amount);
        return acc;
      }, {} as Record<string, number>);

      // Combine all categories
      const allCategories = new Set([
        ...Object.keys(transactionsByCategory),
        ...Object.keys(budgetsByCategory)
      ]);

      allCategories.forEach(category => {
        const actual = transactionsByCategory[category] || 0;
        const budgeted = budgetsByCategory[category] || 0;
        const variance = actual - budgeted;

        const categoryData: CategoryData = {
          category,
          actual,
          budgeted,
          variance
        };

        if (actual >= 0) {
          incomeCategories.push(categoryData);
        } else {
          expenseCategories.push(categoryData);
        }
      });

      return {
        income: incomeCategories,
        expenses: expenseCategories,
        totalIncome: incomeCategories.reduce((sum, cat) => sum + cat.actual, 0),
        totalExpenses: Math.abs(expenseCategories.reduce((sum, cat) => sum + cat.actual, 0)),
        budgetedIncome: incomeCategories.reduce((sum, cat) => sum + cat.budgeted, 0),
        budgetedExpenses: Math.abs(expenseCategories.reduce((sum, cat) => sum + cat.budgeted, 0)),
        period: format(currentMonth, 'MMMM yyyy')
      };
    },
    enabled: !!session?.user,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Income and Expense Statement</h2>
        </div>
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading report data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Income and Expense Statement</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No data available for the selected period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Income and Expense Statement</h2>
          <p className="text-sm text-muted-foreground">Period: {reportData.period}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Income Section */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-green-600">Income</h3>
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2 text-sm font-medium border-b pb-2">
              <span>Category</span>
              <span className="text-right">Actual</span>
              <span className="text-right">Budget</span>
              <span className="text-right">Variance</span>
            </div>
            {reportData.income.map((category, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 text-sm">
                <span className="capitalize">{category.category}</span>
                <span className="text-right">${category.actual.toFixed(2)}</span>
                <span className="text-right">${category.budgeted.toFixed(2)}</span>
                <span className={`text-right ${category.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${category.variance.toFixed(2)}
                </span>
              </div>
            ))}
            <div className="grid grid-cols-4 gap-2 text-sm font-semibold border-t pt-2">
              <span>Total Income</span>
              <span className="text-right">${reportData.totalIncome.toFixed(2)}</span>
              <span className="text-right">${reportData.budgetedIncome.toFixed(2)}</span>
              <span className={`text-right ${(reportData.totalIncome - reportData.budgetedIncome) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${(reportData.totalIncome - reportData.budgetedIncome).toFixed(2)}
              </span>
            </div>
          </div>
        </Card>

        {/* Expenses Section */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-600">Expenses</h3>
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2 text-sm font-medium border-b pb-2">
              <span>Category</span>
              <span className="text-right">Actual</span>
              <span className="text-right">Budget</span>
              <span className="text-right">Variance</span>
            </div>
            {reportData.expenses.map((category, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 text-sm">
                <span className="capitalize">{category.category}</span>
                <span className="text-right">${Math.abs(category.actual).toFixed(2)}</span>
                <span className="text-right">${Math.abs(category.budgeted).toFixed(2)}</span>
                <span className={`text-right ${Math.abs(category.variance) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(category.variance).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="grid grid-cols-4 gap-2 text-sm font-semibold border-t pt-2">
              <span>Total Expenses</span>
              <span className="text-right">${reportData.totalExpenses.toFixed(2)}</span>
              <span className="text-right">${reportData.budgetedExpenses.toFixed(2)}</span>
              <span className={`text-right ${(reportData.budgetedExpenses - reportData.totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(reportData.budgetedExpenses - reportData.totalExpenses).toFixed(2)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Net Income Summary */}
      <Card className="p-6">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Net Income</p>
            <p className="text-2xl font-bold text-green-600">
              ${(reportData.totalIncome - reportData.totalExpenses).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Budgeted Net</p>
            <p className="text-2xl font-bold">
              ${(reportData.budgetedIncome - reportData.budgetedExpenses).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Variance</p>
            <p className={`text-2xl font-bold ${((reportData.totalIncome - reportData.totalExpenses) - (reportData.budgetedIncome - reportData.budgetedExpenses)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${((reportData.totalIncome - reportData.totalExpenses) - (reportData.budgetedIncome - reportData.budgetedExpenses)).toFixed(2)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
