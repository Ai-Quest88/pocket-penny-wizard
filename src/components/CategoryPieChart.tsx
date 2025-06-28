import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useCurrency } from "@/contexts/CurrencyContext"

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1", "#d084d0"];

const getCategoryColor = (category: string, index: number): string => {
  return COLORS[index % COLORS.length];
};

interface CategoryPieChartProps {
  entityId?: string;
}

export const CategoryPieChart = ({ entityId }: CategoryPieChartProps) => {
  const { session } = useAuth();
  const { displayCurrency, convertAmount, currencySymbols } = useCurrency();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['category-pie-chart', session?.user?.id, displayCurrency],
    queryFn: async () => {
      if (!session?.user) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .lt('amount', 0); // Only expenses

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!session?.user,
  });

  // Process data for the chart with currency conversion
  const chartData = transactions.reduce((acc: { [key: string]: number }, transaction) => {
    const category = transaction.category || 'Other';
    
    // Convert amount to display currency before adding
    const convertedAmount = convertAmount(
      Math.abs(transaction.amount),
      transaction.currency
    );
    
    acc[category] = (acc[category] || 0) + convertedAmount;
    
    return acc;
  }, {});

  const formattedData = Object.entries(chartData)
    .map(([category, value]) => ({
      name: category,
      value: value,
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // Show top 6 categories

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = formattedData.reduce((sum, item) => sum + item.value, 0);
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      
      return (
        <div className="bg-background border rounded-lg p-3 shadow-md">
          <p className="font-semibold">{data.payload.name}</p>
          <p className="text-muted-foreground">
            {currencySymbols[displayCurrency]}{data.value.toFixed(2)} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (formattedData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Categories ({displayCurrency})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No expense data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = formattedData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Categories ({displayCurrency})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={formattedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {formattedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name, index)} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Expenses</span>
            <span className="text-sm font-semibold">
              {currencySymbols[displayCurrency]}{total.toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
