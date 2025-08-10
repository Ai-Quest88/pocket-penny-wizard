import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useCurrency } from "@/contexts/CurrencyContext"
import { formatCurrency } from "@/utils/currencyUtils"
import { CashFlowTransactionDialog } from "./CashFlowTransactionDialog"
import { Transaction } from "./TransactionList"
import { useState } from "react"

interface ChartTransaction {
  id: string;
  amount: number;
  date: string;
  currency: string;
  description: string;
  category: string;
  asset_account_id?: string;
  liability_account_id?: string;
}

interface CashFlowChartProps {
  entityId?: string;
}

export const CashFlowChart = ({ entityId }: CashFlowChartProps) => {
  const { session } = useAuth()
  const { displayCurrency, convertAmount, currencySymbols } = useCurrency()
  const [selectedPeriod, setSelectedPeriod] = useState<{
    month: string;
    type: 'income' | 'expenses';
    monthKey: string;
  } | null>(null)

  const { data: transactions = [], isLoading: transactionLoading } = useQuery({
    queryKey: ['cashflow-transactions', session?.user?.id, entityId],
    queryFn: async () => {
      if (!session?.user) return [];
      
      let query = supabase
        .from('transactions')
        .select('id, amount, date, currency, description, category, asset_account_id, liability_account_id')
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
  const chartData = transactions.reduce((acc: { [key: string]: { month: string; income: number; expenses: number; transactions: ChartTransaction[] } }, transaction) => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: 0,
        expenses: 0,
        transactions: [],
      };
    }
    
    // Add transaction to the month's transaction list
    acc[monthKey].transactions.push(transaction);
    
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

  const formattedData = Object.keys(chartData).map(monthKey => ({
    ...chartData[monthKey],
    monthKey,
  }));

  // Get transactions for selected period
  const { data: selectedTransactions = [], isLoading: detailsLoading } = useQuery({
    queryKey: ['cashflow-details', session?.user?.id, selectedPeriod?.monthKey, selectedPeriod?.type, entityId],
    queryFn: async () => {
      if (!session?.user || !selectedPeriod) return [];
      
      // Get transactions from the chart data
      const monthData = chartData[selectedPeriod.monthKey];
      if (!monthData) return [];
      
      // Filter transactions by type (income/expenses)
      const filteredTransactions = monthData.transactions.filter(t => 
        selectedPeriod.type === 'income' ? t.amount > 0 : t.amount < 0
      );

      // Get asset and liability names for display
      const transactionsWithAccounts = await Promise.all(
        filteredTransactions.map(async (transaction) => {
          let asset_account_name = undefined;
          let liability_account_name = undefined;

          if (transaction.asset_account_id) {
            const { data: asset } = await supabase
              .from('assets')
              .select('name')
              .eq('id', transaction.asset_account_id)
              .maybeSingle();
            asset_account_name = asset?.name;
          }

          if (transaction.liability_account_id) {
            const { data: liability } = await supabase
              .from('liabilities')
              .select('name')
              .eq('id', transaction.liability_account_id)
              .maybeSingle();
            liability_account_name = liability?.name;
          }

          return {
            ...transaction,
            user_id: transaction.id, // Required by Transaction interface
            asset_account_name,
            liability_account_name,
          } as Transaction;
        })
      );

      return transactionsWithAccounts;
    },
    enabled: !!session?.user && !!selectedPeriod,
  });

  const handleBarClick = (data: any, dataKey: string) => {
    if (!data || !dataKey) return;
    
    // Find the month data
    const barData = formattedData.find(d => d.month === data.month);
    if (!barData) return;
    
    // Determine the type based on the dataKey
    const type = dataKey === 'income' ? 'income' : 'expenses';
    
    setSelectedPeriod({
      month: barData.month,
      type: type as 'income' | 'expenses',
      monthKey: barData.monthKey,
    });
  };

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
                content={({ payload, label }) => {
                  if (!payload || !payload.length) return null;
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium mb-2">{label}</p>
                      {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex justify-between items-center gap-4">
                          <span style={{ color: entry.color }} className="capitalize">
                            {entry.dataKey}:
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(entry.value, displayCurrency)}
                          </span>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground mt-2">
                        Click on a bar to see transactions
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="income"
                fill="#22c55e"
                name="income"
                className="cursor-pointer"
                onClick={(data: any) => handleBarClick(data, 'income')}
              />
              <Bar
                dataKey="expenses"
                fill="#ef4444"
                name="expenses"
                className="cursor-pointer"
                onClick={(data: any) => handleBarClick(data, 'expenses')}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <CashFlowTransactionDialog
          isOpen={!!selectedPeriod}
          onClose={() => setSelectedPeriod(null)}
          transactions={selectedTransactions}
          month={selectedPeriod?.month || ''}
          type={selectedPeriod?.type || 'income'}
          totalAmount={selectedPeriod ? 
            (selectedPeriod.type === 'income' ? 
              chartData[selectedPeriod.monthKey]?.income || 0 : 
              chartData[selectedPeriod.monthKey]?.expenses || 0
            ) : 0
          }
        />
      </CardContent>
    </Card>
  );
};
