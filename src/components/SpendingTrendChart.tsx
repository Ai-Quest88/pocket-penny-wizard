import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useCurrency } from "@/contexts/CurrencyContext"
import { formatCurrency } from "@/utils/currencyUtils"

interface Transaction {
  id: string;
  amount: number;
  date: string;
  currency: string;
}

export const SpendingTrendChart = () => {
  const { session } = useAuth();
  const { displayCurrency, convertAmount, currencySymbols } = useCurrency();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['spending-trend-transactions', session?.user?.id, displayCurrency],
    queryFn: async () => {
      if (!session?.user) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('id, amount, date, currency')
        .eq('user_id', session.user.id)
        .lt('amount', 0) // Only expenses
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!session?.user,
  });

  // Process data for the chart with currency conversion
  const chartData = transactions.reduce((acc: { [key: string]: { month: string; amount: number } }, transaction) => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: 0,
      };
    }
    
    // Convert amount to display currency before adding
    const convertedAmount = convertAmount(
      Math.abs(transaction.amount),
      transaction.currency
    );
    
    acc[monthKey].amount += convertedAmount;
    
    return acc;
  }, {});

  const formattedData = Object.values(chartData);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Trend ({displayCurrency})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value, displayCurrency, { precision: 0 })}
              />
              <Tooltip 
                formatter={(value: number) => [
                  formatCurrency(value, displayCurrency), 
                  'Spending'
                ]}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
