import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useCurrency } from "@/contexts/CurrencyContext"
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { Calendar, TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle, Download } from "lucide-react"

export function DigestReport() {
  const { session } = useAuth();
  const { displayCurrency, formatCurrency, convertAmount } = useCurrency();

  const { data: digestData, isLoading } = useQuery({
    queryKey: ['digest-report', session?.user?.id, displayCurrency],
    queryFn: async () => {
      if (!session?.user) return null;

      const today = new Date();
      const lastWeek = subDays(today, 7);
      const thisWeekStart = startOfWeek(today);
      const thisWeekEnd = endOfWeek(today);
      const thisMonthStart = startOfMonth(today);
      const thisMonthEnd = endOfMonth(today);

      // Get transactions for different periods
      const [thisWeekTransactions, lastWeekTransactions, thisMonthTransactions] = await Promise.all([
        supabase
          .from('transactions')
          .select('amount, currency, category, date')
          .eq('user_id', session.user.id)
          .gte('date', thisWeekStart.toISOString().split('T')[0])
          .lte('date', thisWeekEnd.toISOString().split('T')[0])
          .then(({ data }) => data || []),
        
        supabase
          .from('transactions')
          .select('amount, currency, category')
          .eq('user_id', session.user.id)
          .gte('date', subDays(thisWeekStart, 7).toISOString().split('T')[0])
          .lte('date', subDays(thisWeekEnd, 7).toISOString().split('T')[0])
          .then(({ data }) => data || []),
        
        supabase
          .from('transactions')
          .select('amount, currency, category, date')
          .eq('user_id', session.user.id)
          .gte('date', thisMonthStart.toISOString().split('T')[0])
          .lte('date', thisMonthEnd.toISOString().split('T')[0])
          .then(({ data }) => data || [])
      ]);

      // Convert amounts and calculate totals
      const convertTransactions = (transactions: any[]) => 
        transactions.map(t => ({
          ...t,
          convertedAmount: convertAmount(Number(t.amount), t.currency || 'AUD')
        }));

      const thisWeekConverted = convertTransactions(thisWeekTransactions);
      const lastWeekConverted = convertTransactions(lastWeekTransactions);
      const thisMonthConverted = convertTransactions(thisMonthTransactions);

      // Calculate weekly totals
      const thisWeekIncome = thisWeekConverted
        .filter(t => t.convertedAmount > 0)
        .reduce((sum, t) => sum + t.convertedAmount, 0);
      
      const thisWeekExpenses = Math.abs(thisWeekConverted
        .filter(t => t.convertedAmount < 0)
        .reduce((sum, t) => sum + t.convertedAmount, 0));

      const lastWeekIncome = lastWeekConverted
        .filter(t => t.convertedAmount > 0)
        .reduce((sum, t) => sum + t.convertedAmount, 0);
      
      const lastWeekExpenses = Math.abs(lastWeekConverted
        .filter(t => t.convertedAmount < 0)
        .reduce((sum, t) => sum + t.convertedAmount, 0));

      // Calculate monthly totals
      const monthlyIncome = thisMonthConverted
        .filter(t => t.convertedAmount > 0)
        .reduce((sum, t) => sum + t.convertedAmount, 0);
      
      const monthlyExpenses = Math.abs(thisMonthConverted
        .filter(t => t.convertedAmount < 0)
        .reduce((sum, t) => sum + t.convertedAmount, 0));

      // Category analysis
      const categoryData = thisMonthConverted
        .filter(t => t.convertedAmount < 0)
        .reduce((acc: Record<string, number>, t) => {
          const category = t.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + Math.abs(t.convertedAmount);
          return acc;
        }, {});

      const topCategories = Object.entries(categoryData)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([category, amount]) => ({ category, amount }));

      // Daily spending pattern
      const dailySpending = thisWeekConverted
        .filter(t => t.convertedAmount < 0)
        .reduce((acc: Record<string, number>, t) => {
          const day = format(new Date(t.date), 'EEE');
          acc[day] = (acc[day] || 0) + Math.abs(t.convertedAmount);
          return acc;
        }, {});

      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dailyChart = weekDays.map(day => ({
        day,
        amount: Math.round(dailySpending[day] || 0)
      }));

      // Calculate changes
      const incomeChange = lastWeekIncome > 0 
        ? ((thisWeekIncome - lastWeekIncome) / lastWeekIncome) * 100 
        : 0;
      
      const expenseChange = lastWeekExpenses > 0 
        ? ((thisWeekExpenses - lastWeekExpenses) / lastWeekExpenses) * 100 
        : 0;

      return {
        thisWeek: {
          income: thisWeekIncome,
          expenses: thisWeekExpenses,
          net: thisWeekIncome - thisWeekExpenses
        },
        lastWeek: {
          income: lastWeekIncome,
          expenses: lastWeekExpenses,
          net: lastWeekIncome - lastWeekExpenses
        },
        monthly: {
          income: monthlyIncome,
          expenses: monthlyExpenses,
          net: monthlyIncome - monthlyExpenses
        },
        changes: {
          income: incomeChange,
          expenses: expenseChange
        },
        topCategories,
        dailyChart,
        insights: generateInsights(thisWeekIncome, thisWeekExpenses, incomeChange, expenseChange)
      };
    },
    enabled: !!session?.user,
  });

  const generateInsights = (income: number, expenses: number, incomeChange: number, expenseChange: number) => {
    const insights = [];
    
    if (income > expenses) {
      insights.push({
        type: 'positive',
        message: `Great job! You had a net positive week with ${formatCurrency(income - expenses)} saved.`
      });
    } else {
      insights.push({
        type: 'warning',
        message: `You spent ${formatCurrency(expenses - income)} more than you earned this week.`
      });
    }
    
    if (expenseChange > 20) {
      insights.push({
        type: 'warning',
        message: `Your expenses increased by ${expenseChange.toFixed(1)}% compared to last week.`
      });
    } else if (expenseChange < -10) {
      insights.push({
        type: 'positive',
        message: `Excellent! You reduced expenses by ${Math.abs(expenseChange).toFixed(1)}% this week.`
      });
    }
    
    if (incomeChange > 10) {
      insights.push({
        type: 'positive',
        message: `Your income increased by ${incomeChange.toFixed(1)}% this week!`
      });
    }
    
    return insights;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Financial Digest ({displayCurrency})</h2>
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Generating your financial digest...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!digestData) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Financial Digest ({displayCurrency})</h2>
        <Card className="p-8 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Not Enough Data</h3>
          <p className="text-muted-foreground">
            Add some transactions to generate your financial digest
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Financial Digest ({displayCurrency})</h2>
          <p className="text-sm text-muted-foreground">
            Weekly insights and personalized financial analysis for {format(new Date(), 'MMMM d, yyyy')}
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Key Insights
        </h3>
        <div className="space-y-3">
          {digestData.insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-3">
              {insight.type === 'positive' ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              )}
              <p className="text-sm">{insight.message}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">This Week vs Last Week</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Income</span>
              <div className="text-right">
                <p className="font-semibold text-green-600">
                  {formatCurrency(digestData.thisWeek.income)}
                </p>
                <p className={`text-xs ${digestData.changes.income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {digestData.changes.income >= 0 ? '+' : ''}{digestData.changes.income.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Expenses</span>
              <div className="text-right">
                <p className="font-semibold text-red-600">
                  {formatCurrency(digestData.thisWeek.expenses)}
                </p>
                <p className={`text-xs ${digestData.changes.expenses <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {digestData.changes.expenses >= 0 ? '+' : ''}{digestData.changes.expenses.toFixed(1)}%
                </p>
              </div>
            </div>
            <hr />
            <div className="flex justify-between items-center">
              <span className="font-medium">Net</span>
              <p className={`font-semibold ${digestData.thisWeek.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(digestData.thisWeek.net)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Income</span>
              <p className="font-semibold text-green-600">
                {formatCurrency(digestData.monthly.income)}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Expenses</span>
              <p className="font-semibold text-red-600">
                {formatCurrency(digestData.monthly.expenses)}
              </p>
            </div>
            <hr />
            <div className="flex justify-between items-center">
              <span className="font-medium">Net This Month</span>
              <p className={`font-semibold ${digestData.monthly.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(digestData.monthly.net)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Spending This Week</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={digestData.dailyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Spending']}
                />
                <Bar dataKey="amount" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Spending Categories</h3>
          <div className="h-[200px]">
            {digestData.topCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={digestData.topCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {digestData.topCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No spending data available</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
