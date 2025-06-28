import { Card } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useCurrency } from "@/contexts/CurrencyContext"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"

interface TrendData {
  month: string;
  actualIncome: number;
  budgetedIncome: number;
  actualExpenses: number;
  budgetedExpenses: number;
}

export function TrendsReport() {
  const { session } = useAuth();
  const { displayCurrency, formatCurrency, convertAmount } = useCurrency();

  const { data: trendsData, isLoading } = useQuery({
    queryKey: ['trends-report', session?.user?.id, displayCurrency],
    queryFn: async () => {
      if (!session?.user) return [];

      const months: TrendData[] = [];
      const currentDate = new Date();

      // Get data for last 12 months
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(currentDate, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        // Get transactions for this month
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount, currency')
          .eq('user_id', session.user.id)
          .gte('date', monthStart.toISOString().split('T')[0])
          .lte('date', monthEnd.toISOString().split('T')[0]);

        // Get budgets
        const { data: budgets } = await supabase
          .from('budgets')
          .select('amount')
          .eq('user_id', session.user.id)
          .eq('is_active', true);

        let actualIncome = 0;
        let actualExpenses = 0;

        if (transactions) {
          transactions.forEach(transaction => {
            // Convert transaction amount to display currency
            const convertedAmount = convertAmount(
              Number(transaction.amount),
              transaction.currency || 'AUD'
            );
            
            if (convertedAmount > 0) {
              actualIncome += convertedAmount;
            } else {
              actualExpenses += Math.abs(convertedAmount);
            }
          });
        }

        let budgetedIncome = 0;
        let budgetedExpenses = 0;

        if (budgets) {
          budgets.forEach(budget => {
            // Convert budget amount to display currency (assuming stored in AUD)
            const convertedAmount = convertAmount(Number(budget.amount), 'AUD');
            
            if (convertedAmount > 0) {
              budgetedIncome += convertedAmount;
            } else {
              budgetedExpenses += Math.abs(convertedAmount);
            }
          });
        }

        months.push({
          month: format(monthDate, 'MMM yy'),
          actualIncome: Math.round(actualIncome),
          budgetedIncome: Math.round(budgetedIncome),
          actualExpenses: Math.round(actualExpenses),
          budgetedExpenses: Math.round(budgetedExpenses)
        });
      }

      return months;
    },
    enabled: !!session?.user,
  });

  // Calculate averages and accuracy
  const avgActualIncome = trendsData?.length ? 
    trendsData.reduce((sum, month) => sum + month.actualIncome, 0) / trendsData.length : 0;
  
  const avgActualExpenses = trendsData?.length ? 
    trendsData.reduce((sum, month) => sum + month.actualExpenses, 0) / trendsData.length : 0;
  
  const avgBudgetAccuracy = trendsData?.length ? 
    (trendsData.reduce((sum, month) => {
      const totalActual = month.actualIncome + month.actualExpenses;
      const totalBudgeted = month.budgetedIncome + month.budgetedExpenses;
      return sum + (totalBudgeted > 0 ? (totalActual / totalBudgeted) : 0);
    }, 0) / trendsData.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Trends Analysis ({displayCurrency})</h2>
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading trends data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Trends Analysis ({displayCurrency})</h2>
        <p className="text-sm text-muted-foreground">
          Identify patterns in earnings and spending with interactive bar charts and budget comparisons.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 bg-green-50 border-green-200">
          <h4 className="font-medium mb-2 text-green-700">Average Monthly Income</h4>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(avgActualIncome)}
          </p>
        </Card>
        <Card className="p-6 bg-red-50 border-red-200">
          <h4 className="font-medium mb-2 text-red-700">Average Monthly Expenses</h4>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(avgActualExpenses)}
          </p>
        </Card>
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h4 className="font-medium mb-2 text-blue-700">Budget Accuracy</h4>
          <p className="text-2xl font-bold text-blue-600">
            {avgBudgetAccuracy.toFixed(1)}%
          </p>
        </Card>
      </div>

      {/* Income vs Budget Trend */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Income Trends</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'actualIncome' ? 'Actual Income' : 'Budgeted Income'
                ]}
              />
              <Legend />
              <Bar dataKey="actualIncome" fill="#22c55e" name="Actual Income" />
              <Bar dataKey="budgetedIncome" fill="#86efac" name="Budgeted Income" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Expenses vs Budget Trend */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Expense Trends</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'actualExpenses' ? 'Actual Expenses' : 'Budgeted Expenses'
                ]}
              />
              <Legend />
              <Bar dataKey="actualExpenses" fill="#ef4444" name="Actual Expenses" />
              <Bar dataKey="budgetedExpenses" fill="#fca5a5" name="Budgeted Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
