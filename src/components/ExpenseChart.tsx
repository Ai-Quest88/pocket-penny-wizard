
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { fetchExchangeRates } from "@/utils/currencyUtils";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subMonths } from "date-fns";

const COLORS = ["#8CA891", "#A8DADC", "#457B9D", "#E63946", "#F1FAEE", "#E76F51", "#264653", "#2A9D8F"];

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "$"
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const totalValue = payload[0].payload.total;
    const percentage = ((data.value / totalValue) * 100).toFixed(1);
    
    return (
      <div className="bg-white p-2 border rounded shadow-sm">
        <p className="text-sm font-medium">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {percentage}% ({currencySymbols[data.displayCurrency]}{data.value.toFixed(2)})
        </p>
      </div>
    );
  }
  return null;
};

interface ExpenseChartProps {
  entityId?: string;
}

export const ExpenseChart = ({ entityId }: ExpenseChartProps) => {
  const [displayCurrency, setDisplayCurrency] = useState("AUD");
  const { session } = useAuth();

  const { data: exchangeRates, isLoading: ratesLoading } = useQuery({
    queryKey: ["exchangeRates", displayCurrency],
    queryFn: () => fetchExchangeRates(displayCurrency),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const { data: expenseData = [], isLoading: dataLoading } = useQuery({
    queryKey: ['expense-breakdown', session?.user?.id, entityId, displayCurrency],
    queryFn: async () => {
      if (!session?.user) return [];

      // Get last 3 months of expense data
      const endDate = new Date();
      const startDate = subMonths(endDate, 3);

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lt('amount', 0); // Only expenses

      if (error) throw error;

      // Group by category
      const categoryTotals: Record<string, { amount: number; currency: string }> = {};
      
      transactions?.forEach(transaction => {
        const category = transaction.category;
        if (!categoryTotals[category]) {
          categoryTotals[category] = { amount: 0, currency: transaction.currency };
        }
        categoryTotals[category].amount += Math.abs(transaction.amount);
      });

      // Convert to display currency and format for chart
      const chartData = Object.entries(categoryTotals)
        .map(([category, data]) => {
          const convertedAmount = exchangeRates 
            ? data.amount / exchangeRates[data.currency] * exchangeRates[displayCurrency]
            : data.amount;
          
          return {
            name: category,
            value: convertedAmount,
            displayCurrency,
            currency: data.currency
          };
        })
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 8); // Top 8 categories

      // Calculate total for percentage calculations
      const total = chartData.reduce((sum, item) => sum + item.value, 0);
      return chartData.map(item => ({ ...item, total }));
    },
    enabled: !!session?.user && !!exchangeRates,
  });

  const isLoading = dataLoading || ratesLoading;

  if (isLoading) {
    return (
      <Card className="p-6 h-[400px] animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-text">
            Expense Breakdown ({currencySymbols[displayCurrency]}{displayCurrency})
          </h3>
        </div>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading expense data...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (expenseData.length === 0) {
    return (
      <Card className="p-6 h-[400px] animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-text">
            Expense Breakdown ({currencySymbols[displayCurrency]}{displayCurrency})
          </h3>
          <div className="w-32">
            <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(currencySymbols).map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currencySymbols[currency]} {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-muted-foreground">No expense data available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add some transactions to see your expense breakdown
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 h-[400px] animate-fadeIn">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-text">
          Expense Breakdown ({currencySymbols[displayCurrency]}{displayCurrency})
        </h3>
        <div className="w-32">
          <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(currencySymbols).map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currencySymbols[currency]} {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={expenseData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {expenseData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};
