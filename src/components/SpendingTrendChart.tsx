
import { Card } from "@/components/ui/card"
import {
  LineChart,
  Line,
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

interface SpendingTrendChartProps {
  entityId?: string;
}

export const SpendingTrendChart = ({ entityId }: SpendingTrendChartProps) => {
  const { session } = useAuth();

  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ['spending-trend', session?.user?.id, entityId],
    queryFn: async () => {
      if (!session?.user) return [];

      // Get last 6 months of data
      const endDate = new Date();
      const startDate = subMonths(endDate, 5);

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .lt('amount', 0); // Only expenses

      if (error) throw error;

      // Group by month
      const monthlyData: Record<string, number> = {};
      
      // Initialize all months with 0
      for (let i = 0; i < 6; i++) {
        const monthDate = subMonths(endDate, 5 - i);
        const monthKey = format(monthDate, 'MMM');
        monthlyData[monthKey] = 0;
      }

      // Sum transactions by month
      transactions?.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        const monthKey = format(transactionDate, 'MMM');
        if (monthKey in monthlyData) {
          monthlyData[monthKey] += Math.abs(transaction.amount);
        }
      });

      return Object.entries(monthlyData).map(([month, amount]) => ({
        month,
        amount: Math.round(amount)
      }));
    },
    enabled: !!session?.user,
  });

  if (isLoading) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading spending trend...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <Card className="p-2 border bg-background">
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">
                      ${payload[0].value?.toLocaleString()}
                    </p>
                  </Card>
                )
              }
              return null
            }}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
