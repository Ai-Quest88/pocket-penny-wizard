import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useAccountBalances } from "@/hooks/useAccountBalances"
import { format, subMonths, endOfMonth } from "date-fns"

export function AssetsReport() {
  const { session } = useAuth();
  const { displayCurrency, formatCurrency, convertAmount } = useCurrency();
  const { data: currentAccountBalances = [] } = useAccountBalances();

  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ['assets-trend', session?.user?.id, displayCurrency],
    queryFn: async () => {
      if (!session?.user) return [];

      // Get last 12 months of data for better trends
      const endDate = new Date();
      const months = [];
      
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(endDate, i);
        const monthEnd = endOfMonth(monthDate);
        
        // Get assets for this month
        const { data: assets } = await supabase
          .from('assets')
          .select('value, opening_balance, type, category')
          .eq('user_id', session.user.id)
          .lte('created_at', monthEnd.toISOString());
        
        // Convert all amounts to display currency (assuming stored in AUD)
        const totalAssets = assets?.reduce((sum, asset) => {
          const assetValue = convertAmount(Number(asset.opening_balance || asset.value), 'AUD');
          return sum + assetValue;
        }, 0) || 0;
        
        months.push({
          month: format(monthDate, 'MMM yy'),
          totalAssets: Math.round(totalAssets),
          assetCount: assets?.length || 0
        });
      }
      
      return months;
    },
    enabled: !!session?.user,
  });

  // Calculate current assets from account balances
  const currentAssets = currentAccountBalances.filter(account => account.accountType === 'asset');
  const currentTotalAssets = currentAssets.reduce((sum, account) => sum + account.calculatedBalance, 0);

  // Calculate asset breakdown by type
  const assetsByType = currentAssets.reduce((acc, asset) => {
    const type = asset.accountName.includes('Bank') ? 'Banking' : 
                 asset.accountName.includes('Property') ? 'Property' : 
                 asset.accountName.includes('Investment') ? 'Investment' : 'Other';
    acc[type] = (acc[type] || 0) + asset.calculatedBalance;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Assets Overview ({displayCurrency})</h2>
          <p className="text-sm text-muted-foreground">Track your total assets value over time</p>
        </div>
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading assets data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Assets Overview ({displayCurrency})</h2>
        <p className="text-sm text-muted-foreground">Track your total assets value over time</p>
      </div>

      {/* Current Assets Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-muted-foreground">Total Assets</p>
          <p className="text-xl font-semibold text-green-600">
            {formatCurrency(currentTotalAssets)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            {currentAssets.length} asset{currentAssets.length !== 1 ? 's' : ''}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-2">Assets Breakdown</p>
          <div className="space-y-1">
            {Object.entries(assetsByType).map(([type, amount]) => (
              <div key={type} className="flex justify-between text-sm">
                <span>{type}:</span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <Card className="p-3 border bg-background shadow-lg">
                      <p className="font-medium mb-2">{label}</p>
                      <div className="space-y-1">
                        <p className="text-sm text-green-600">
                          Total Assets: {formatCurrency(data.totalAssets)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Asset Count: {data.assetCount}
                        </p>
                      </div>
                    </Card>
                  )
                }
                return null
              }}
            />
            <Line
              type="monotone"
              dataKey="totalAssets"
              stroke="#22c55e"
              strokeWidth={3}
              dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#22c55e", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
