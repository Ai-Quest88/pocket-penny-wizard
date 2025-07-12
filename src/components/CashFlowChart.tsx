import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
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

interface CashFlowChartProps {
  entityId?: string;
}

export const CashFlowChart = ({ entityId }: CashFlowChartProps) => {
  const { session } = useAuth()
  const { displayCurrency, convertAmount, currencySymbols } = useCurrency()

  const { data: transactions = [], isLoading: transactionLoading } = useQuery({
    queryKey: ['cashflow-transactions', session?.user?.id, entityId],
    queryFn: async () => {
      if (!session?.user) return [];
      
      let query = supabase
        .from('transactions')
        .select('id, amount, date, currency')
        .eq('user_id', session.user.id)
        .order('date', { ascending: true });

      // Filter by entity if specified - need to join through assets/liabilities
      if (entityId) {
        // Get asset and liability IDs for this entity
        const [assetsResponse, liabilitiesResponse] = await Promise.all([
          supabase
            .from('assets')
            .select('id')
            .eq('entity_id', entityId)
            .eq('user_id', session.user.id),
          supabase
            .from('liabilities')
            .select('id')
            .eq('entity_id', entityId)
            .eq('user_id', session.user.id)
        ]);

        const assetIds = assetsResponse.data?.map(a => a.id) || [];
        const liabilityIds = liabilitiesResponse.data?.map(l => l.id) || [];

        if (assetIds.length === 0 && liabilityIds.length === 0) {
          // No accounts for this entity, return empty array
          return [];
        }

        // Build filter conditions
        const conditions = [];
        if (assetIds.length > 0) {
          conditions.push(`asset_account_id.in.(${assetIds.join(',')})`);
        }
        if (liabilityIds.length > 0) {
          conditions.push(`liability_account_id.in.(${liabilityIds.join(',')})`);
        }

        if (conditions.length > 0) {
          query = query.or(conditions.join(','));
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!session?.user,
  });

  // Process data for the chart
  const chartData = transactions.reduce((acc: { [key: string]: { month: string; income: number; expenses: number } }, transaction) => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: 0,
        expenses: 0,
      };
    }
    
    // Convert amount to display currency before adding
    const convertedAmount = convertAmount(
      Math.abs(transaction.amount),
      transaction.currency
    );
    
    if (transaction.amount > 0) {
      acc[monthKey].income += convertedAmount;
    } else {
      acc[monthKey].expenses += convertedAmount;
    }
    
    return acc;
  }, {});

  const formattedData = Object.values(chartData);

  if (transactionLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow</CardTitle>
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
        <CardTitle>Cash Flow ({displayCurrency})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value, displayCurrency, { precision: 0 })}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value, displayCurrency), 
                  name.charAt(0).toUpperCase() + name.slice(1)
                ]}
              />
              <Bar
                dataKey="income"
                fill="#22c55e"
                name="income"
              />
              <Bar
                dataKey="expenses"
                fill="#ef4444"
                name="expenses"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
