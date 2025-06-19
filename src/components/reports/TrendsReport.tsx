
import { Card } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
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

  const { data: trendsData, isLoading } = useQuery({
    queryKey: ['trends-report', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return [];

      const months: TrendData[] = [];
      const currentDate = new Date();

      // Get data for last 6 months
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(currentDate, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        // Get transactions for this month
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount')
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
            const amount = Number(transaction.amount);
            if (amount > 0) {
              actualIncome += amount;
            } else {
              actualExpenses += Math.abs(amount);
            }
          });
        }

        let budgetedIncome = 0;
        let budgetedExpenses = 0;

        if (budgets) {
          budgets.forEach(budget => {
            const amount = Number(budget.amount);
            if (amount > 0) {
              budgetedIncome += amount;
            } else {
              budgetedExpenses += Math.abs(amount);
            }
          });
        }

        months.push({
          month: format(monthDate, 'MMM'),
          actualIncome,
          budgetedIncome,
          actualExpenses,
          budgetedExpenses
        });
      }

      return months;
    },
    enabled: !!session?.user,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Trends Analysis</h2>
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
      <h2 className="text-2xl font-semibold">Trends Analysis</h2>
      <p className="text-sm text-muted-foreground">
        Identify patterns in earnings and spending with interactive bar charts and budget comparisons.
      </p>

      {/* Income vs Budget Trend */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Income Trends</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString()}`,
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
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString()}`,
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

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h4 className="font-medium mb-2">Average Monthly Income</h4>
          <p className="text-2xl font-bold text-green-600">
            ${trendsData?.length ? (trendsData.reduce((sum, month) => sum + month.actualIncome, 0) / trendsData.length).toFixed(0) : '0'}
          </p>
        </Card>
        <Card className="p-6">
          <h4 className="font-medium mb-2">Average Monthly Expenses</h4>
          <p className="text-2xl font-bold text-red-600">
            ${trendsData?.length ? (trendsData.reduce((sum, month) => sum + month.actualExpenses, 0) / trendsData.length).toFixed(0) : '0'}
          </p>
        </Card>
        <Card className="p-6">
          <h4 className="font-medium mb-2">Budget Accuracy</h4>
          <p className="text-2xl font-bold">
            {trendsData?.length ? 
              ((trendsData.reduce((sum, month) => sum + (month.actualIncome + month.actualExpenses), 0) / 
                trendsData.reduce((sum, month) => sum + (month.budgetedIncome + month.budgetedExpenses), 0)) * 100).toFixed(1) 
              : '0'}%
          </p>
        </Card>
      </div>
    </div>
  );
}
