import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CurrencySelector } from "@/components/transactions/CurrencySelector";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subMonths } from "date-fns";
import { formatCurrency } from "@/utils/currencyUtils";

const COLORS = ["#8CA891", "#A8DADC", "#457B9D", "#E63946", "#F1FAEE", "#E76F51", "#264653", "#2A9D8F"];

interface ExpenseChartProps {
  entityId?: string;
}

interface Transaction {
  id: string;
  amount: number;
  date: string;
  currency: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const totalValue = payload[0].payload.total;
    const percentage = ((data.value / totalValue) * 100).toFixed(1);
    
    return (
      <div className="bg-white p-2 border rounded shadow-sm">
        <p className="text-sm font-medium">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {percentage}% ({data.symbol}{data.value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})})
        </p>
      </div>
    );
  }
  return null;
};

export const ExpenseChart = () => {
  const { session } = useAuth();
  const { displayCurrency, convertAmount, currencySymbols } = useCurrency();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['expense-chart-transactions', session?.user?.id, displayCurrency],
    queryFn: async () => {
      if (!session?.user) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('id, amount, date, currency')
        .eq('user_id', session.user.id)
        .lt('amount', 0)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!session?.user,
  });

  // Process data for the chart
  const chartData = transactions.reduce((acc: { [key: string]: { date: string; expenses: number } }, transaction) => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        expenses: 0,
      };
    }
    
    // Convert amount to display currency before adding
    const convertedAmount = convertAmount(
      Math.abs(transaction.amount),
      transaction.currency
    );
    
    acc[monthKey].expenses += convertedAmount;
    
    return acc;
  }, {});

  const formattedData = Object.values(chartData);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Expenses</CardTitle>
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
        <CardTitle>Monthly Expenses ({displayCurrency})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value, displayCurrency, { precision: 0 })}
              />
              <Tooltip 
                formatter={(value: number) => [
                  formatCurrency(value, displayCurrency), 
                  'Expenses'
                ]}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                fill="#ef444433"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
