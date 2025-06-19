
import { Card } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function DigestReport() {
  const { session } = useAuth();

  const { data: digestData, isLoading } = useQuery({
    queryKey: ['digest-report', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return null;

      const currentDate = new Date();
      const sixMonthsAgo = subMonths(currentDate, 6);

      // Get transactions for the last 6 months
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('date', sixMonthsAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (!transactions || transactions.length === 0) {
        return null;
      }

      // Category breakdown for pie chart
      const categoryTotals: Record<string, number> = {};
      const monthlyData: Record<string, { income: number; expenses: number }> = {};

      transactions.forEach(transaction => {
        const amount = Number(transaction.amount);
        const category = transaction.category;
        const month = format(new Date(transaction.date), 'MMM yyyy');

        // Category totals (only expenses for pie chart)
        if (amount < 0) {
          categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(amount);
        }

        // Monthly data
        if (!monthlyData[month]) {
          monthlyData[month] = { income: 0, expenses: 0 };
        }

        if (amount > 0) {
          monthlyData[month].income += amount;
        } else {
          monthlyData[month].expenses += Math.abs(amount);
        }
      });

      // Convert to chart format
      const expensesByCategory = Object.entries(categoryTotals)
        .map(([category, amount]) => ({ name: category, value: amount }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6); // Top 6 categories

      const monthlyTrends = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          income: data.income,
          expenses: data.expenses,
          net: data.income - data.expenses
        }));

      // Calculate summary stats
      const totalIncome = transactions.filter(t => Number(t.amount) > 0).reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpenses = transactions.filter(t => Number(t.amount) < 0).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      const avgMonthlyIncome = totalIncome / 6;
      const avgMonthlyExpenses = totalExpenses / 6;
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

      return {
        expensesByCategory,
        monthlyTrends,
        summary: {
          totalIncome,
          totalExpenses,
          avgMonthlyIncome,
          avgMonthlyExpenses,
          savingsRate,
          netWorth: totalIncome - totalExpenses
        }
      };
    },
    enabled: !!session?.user,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Digest Report</h2>
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading digest report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!digestData) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Digest Report</h2>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No data available for digest report</p>
          <p className="text-sm text-muted-foreground mt-2">
            Add some transactions to see your financial insights
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Digest Report</h2>
        <p className="text-sm text-muted-foreground">
          Comprehensive report with graphs, charts, and visual representations of your financial habits.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground">Total Income</h4>
          <p className="text-2xl font-bold text-green-600">${digestData.summary.totalIncome.toFixed(0)}</p>
        </Card>
        <Card className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground">Total Expenses</h4>
          <p className="text-2xl font-bold text-red-600">${digestData.summary.totalExpenses.toFixed(0)}</p>
        </Card>
        <Card className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground">Savings Rate</h4>
          <p className="text-2xl font-bold">{digestData.summary.savingsRate.toFixed(1)}%</p>
        </Card>
        <Card className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground">Net Position</h4>
          <p className={`text-2xl font-bold ${digestData.summary.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${digestData.summary.netWorth.toFixed(0)}
          </p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Expenses by Category Pie Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={digestData.expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {digestData.expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Monthly Income vs Expenses */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Income vs Expenses</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={digestData.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Bar dataKey="income" fill="#22c55e" name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Net Worth Trend */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Net Cash Flow Trend</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={digestData.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Line
                type="monotone"
                dataKey="net"
                stroke="#8884d8"
                strokeWidth={2}
                name="Net Cash Flow"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Financial Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Financial Insights</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Average Monthly Performance</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Average Income:</span>
                <span className="font-medium text-green-600">${digestData.summary.avgMonthlyIncome.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Expenses:</span>
                <span className="font-medium text-red-600">${digestData.summary.avgMonthlyExpenses.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Savings:</span>
                <span className="font-medium">${(digestData.summary.avgMonthlyIncome - digestData.summary.avgMonthlyExpenses).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Top Expense Categories</h4>
            <div className="space-y-2 text-sm">
              {digestData.expensesByCategory.slice(0, 3).map((category, index) => (
                <div key={index} className="flex justify-between">
                  <span className="capitalize">{category.name}:</span>
                  <span className="font-medium">${category.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
