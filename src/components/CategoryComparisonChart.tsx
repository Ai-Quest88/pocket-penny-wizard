
import { Card } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"

interface CategoryComparisonChartProps {
  entityId?: string;
}

export const CategoryComparisonChart = ({ entityId }: CategoryComparisonChartProps) => {
  const { session } = useAuth();

  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ['category-comparison', session?.user?.id, entityId],
    queryFn: async () => {
      if (!session?.user) return [];

      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      // Get this month's transactions
      const { data: thisMonthTransactions, error: thisMonthError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('date', format(thisMonthStart, 'yyyy-MM-dd'))
        .lt('amount', 0); // Only expenses

      if (thisMonthError) throw thisMonthError;

      // Get last month's transactions
      const { data: lastMonthTransactions, error: lastMonthError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('date', format(lastMonthStart, 'yyyy-MM-dd'))
        .lte('date', format(lastMonthEnd, 'yyyy-MM-dd'))
        .lt('amount', 0); // Only expenses

      if (lastMonthError) throw lastMonthError;

      // Group by category
      const thisMonthByCategory: Record<string, number> = {};
      const lastMonthByCategory: Record<string, number> = {};

      thisMonthTransactions?.forEach(transaction => {
        const category = transaction.category;
        thisMonthByCategory[category] = (thisMonthByCategory[category] || 0) + Math.abs(transaction.amount);
      });

      lastMonthTransactions?.forEach(transaction => {
        const category = transaction.category;
        lastMonthByCategory[category] = (lastMonthByCategory[category] || 0) + Math.abs(transaction.amount);
      });

      // Get top 5 categories by this month's spending
      const topCategories = Object.entries(thisMonthByCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category]) => category);

      return topCategories.map(category => ({
        category,
        thisMonth: Math.round(thisMonthByCategory[category] || 0),
        lastMonth: Math.round(lastMonthByCategory[category] || 0)
      }));
    },
    enabled: !!session?.user,
  });

  if (isLoading) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading category comparison...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <Card className="p-2 border bg-background">
                    <p className="font-medium">{label}</p>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        This Month: ${payload[0].value?.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last Month: ${payload[1].value?.toLocaleString()}
                      </p>
                    </div>
                  </Card>
                )
              }
              return null
            }}
          />
          <Bar dataKey="thisMonth" fill="#8884d8" name="This Month" />
          <Bar dataKey="lastMonth" fill="#82ca9d" name="Last Month" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
