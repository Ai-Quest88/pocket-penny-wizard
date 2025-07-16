import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, Download } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { useState } from "react"
import { CurrencySelector } from "@/components/transactions/CurrencySelector"
import { fetchExchangeRates, convertAmount, formatCurrency } from "@/utils/currencyUtils"

interface CategoryData {
  category: string;
  actual: number;
  budgeted: number;
  variance: number;
}

interface ReportData {
  income: CategoryData[];
  expenses: CategoryData[];
  totalIncome: number;
  totalExpenses: number;
  budgetedIncome: number;
  budgetedExpenses: number;
  period: string;
}

export function IncomeExpenseReport() {
  const { session } = useAuth();
  const [displayCurrency, setDisplayCurrency] = useState("AUD");
  const currentMonth = startOfMonth(new Date());

  const { data: exchangeRates, isLoading: ratesLoading } = useQuery({
    queryKey: ["exchangeRates", displayCurrency],
    queryFn: () => fetchExchangeRates(displayCurrency),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const { data: reportData, isLoading } = useQuery<ReportData>({
    queryKey: ['income-expense-report', session?.user?.id, displayCurrency, currentMonth],
    queryFn: async () => {
      if (!session?.user) throw new Error('No authenticated user');

      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      // Fetch transactions for the current month (excluding internal transfers only)
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .neq('category', 'Internal Transfer');

      if (transactionsError) throw transactionsError;

      // Fetch budgets for the current month
      const { data: budgets, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .lte('start_date', monthEnd)
        .or(`end_date.gte.${monthStart},end_date.is.null`);

      if (budgetsError) throw budgetsError;

      // Group transactions by category with currency conversion
      const transactionsByCategory: Record<string, number> = {};
      transactions?.forEach(transaction => {
        const category = transaction.category || 'Other';
        const convertedAmount = exchangeRates
          ? convertAmount(transaction.amount, transaction.currency, displayCurrency, exchangeRates)
          : transaction.amount;
        transactionsByCategory[category] = (transactionsByCategory[category] || 0) + convertedAmount;
      });

      // Group budgets by category
      const budgetsByCategory: Record<string, number> = {};
      budgets?.forEach(budget => {
        const category = budget.category;
        budgetsByCategory[category] = (budgetsByCategory[category] || 0) + budget.amount;
      });

      // Get all unique categories
      const allCategories = Array.from(new Set([
        ...Object.keys(transactionsByCategory),
        ...Object.keys(budgetsByCategory)
      ]));

      const incomeCategories: CategoryData[] = [];
      const expenseCategories: CategoryData[] = [];

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
    enabled: !!session?.user && !!exchangeRates,
  });

  const convertToDisplayCurrency = (amount: number, fromCurrency: string = "AUD"): number => {
    if (!exchangeRates || fromCurrency === displayCurrency) return amount;
    return convertAmount(amount, fromCurrency, displayCurrency, exchangeRates);
  };

  if (isLoading || ratesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Income and Expense Statement</h2>
          <div className="flex items-center gap-4">
            <CurrencySelector
              displayCurrency={displayCurrency}
              onCurrencyChange={setDisplayCurrency}
              variant="compact"
            />
          </div>
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
          <div className="flex items-center gap-4">
            <CurrencySelector
              displayCurrency={displayCurrency}
              onCurrencyChange={setDisplayCurrency}
              variant="compact"
            />
          </div>
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
        <div className="flex items-center gap-4">
          <CurrencySelector
            displayCurrency={displayCurrency}
            onCurrencyChange={setDisplayCurrency}
            variant="compact"
          />
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
                <span className="text-right">{formatCurrency(category.actual, displayCurrency)}</span>
                <span className="text-right">{formatCurrency(category.budgeted, displayCurrency)}</span>
                <span className={`text-right ${category.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(category.variance, displayCurrency)}
                </span>
              </div>
            ))}
            <div className="grid grid-cols-4 gap-2 text-sm font-semibold border-t pt-2">
              <span>Total Income</span>
              <span className="text-right">{formatCurrency(reportData.totalIncome, displayCurrency)}</span>
              <span className="text-right">{formatCurrency(reportData.budgetedIncome, displayCurrency)}</span>
              <span className={`text-right ${(reportData.totalIncome - reportData.budgetedIncome) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(reportData.totalIncome - reportData.budgetedIncome, displayCurrency)}
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
                <span className="text-right">{formatCurrency(Math.abs(category.actual), displayCurrency)}</span>
                <span className="text-right">{formatCurrency(Math.abs(category.budgeted), displayCurrency)}</span>
                <span className={`text-right ${Math.abs(category.variance) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(category.variance), displayCurrency)}
                </span>
              </div>
            ))}
            <div className="grid grid-cols-4 gap-2 text-sm font-semibold border-t pt-2">
              <span>Total Expenses</span>
              <span className="text-right">{formatCurrency(reportData.totalExpenses, displayCurrency)}</span>
              <span className="text-right">{formatCurrency(reportData.budgetedExpenses, displayCurrency)}</span>
              <span className={`text-right ${(reportData.budgetedExpenses - reportData.totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(reportData.budgetedExpenses - reportData.totalExpenses), displayCurrency)}
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
              {formatCurrency(reportData.totalIncome - reportData.totalExpenses, displayCurrency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Budgeted Net</p>
            <p className="text-2xl font-bold">
              {formatCurrency(reportData.budgetedIncome - reportData.budgetedExpenses, displayCurrency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Variance</p>
            <p className={`text-2xl font-bold ${((reportData.totalIncome - reportData.totalExpenses) - (reportData.budgetedIncome - reportData.budgetedExpenses)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency((reportData.totalIncome - reportData.totalExpenses) - (reportData.budgetedIncome - reportData.budgetedExpenses), displayCurrency)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
