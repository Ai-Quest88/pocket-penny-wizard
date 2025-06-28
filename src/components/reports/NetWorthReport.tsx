import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useAccountBalances } from "@/hooks/useAccountBalances"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"

export function NetWorthReport() {
  const { session } = useAuth();
  const { displayCurrency, formatCurrency, convertAmount } = useCurrency();
  const { data: currentAccountBalances = [] } = useAccountBalances();

  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ['net-worth-trend', session?.user?.id, displayCurrency],
    queryFn: async () => {
      if (!session?.user) return [];

      // Get last 12 months of data for better trends
      const endDate = new Date();
      const months = [];
      
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(endDate, i);
        const monthEnd = endOfMonth(monthDate);
        
        // Get assets for this month (using static values for historical view)
        const { data: assets } = await supabase
          .from('assets')
          .select('value, opening_balance')
          .eq('user_id', session.user.id)
          .lte('created_at', monthEnd.toISOString());
        
        // Get liabilities for this month
        const { data: liabilities } = await supabase
          .from('liabilities')
          .select('amount, opening_balance')
          .eq('user_id', session.user.id)
          .lte('created_at', monthEnd.toISOString());
        
        // Convert all amounts to display currency (assuming stored in AUD)
        const totalAssets = assets?.reduce((sum, asset) => {
          const assetValue = convertAmount(Number(asset.opening_balance || asset.value), 'AUD');
          return sum + assetValue;
        }, 0) || 0;
        
        const totalLiabilities = liabilities?.reduce((sum, liability) => {
          const liabilityValue = convertAmount(Number(liability.opening_balance || liability.amount), 'AUD');
          return sum + liabilityValue;
        }, 0) || 0;
        
        const netWorth = totalAssets - totalLiabilities;
        
        months.push({
          month: format(monthDate, 'MMM yy'),
          netWorth: Math.round(netWorth),
          totalAssets: Math.round(totalAssets),
          totalLiabilities: Math.round(totalLiabilities)
        });
      }
      
      return months;
    },
    enabled: !!session?.user,
  });

  // Calculate current net worth from account balances
  const currentTotalAssets = currentAccountBalances
    .filter(account => account.accountType === 'asset')
    .reduce((sum, account) => sum + account.calculatedBalance, 0);
    
  const currentTotalLiabilities = currentAccountBalances
    .filter(account => account.accountType === 'liability')
    .reduce((sum, account) => sum + account.calculatedBalance, 0);
    
  const currentNetWorth = currentTotalAssets - currentTotalLiabilities;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Net Worth Trend ({displayCurrency})</h2>
          <p className="text-sm text-muted-foreground">Track your net worth changes over time</p>
        </div>
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading net worth data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Net Worth Trend ({displayCurrency})</h2>
        <p className="text-sm text-muted-foreground">Track your net worth changes over time</p>
      </div>

      {/* Current Net Worth Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-muted-foreground">Current Assets</p>
          <p className="text-xl font-semibold text-green-600">
            {formatCurrency(currentTotalAssets)}
          </p>
        </Card>
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-muted-foreground">Current Liabilities</p>
          <p className="text-xl font-semibold text-red-600">
            {formatCurrency(currentTotalLiabilities)}
          </p>
        </Card>
        <Card className={`p-4 ${currentNetWorth >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <p className="text-sm text-muted-foreground">Current Net Worth</p>
          <p className={`text-xl font-semibold ${currentNetWorth >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {formatCurrency(currentNetWorth)}
          </p>
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
                          Assets: {formatCurrency(data.totalAssets)}
                        </p>
                        <p className="text-sm text-red-600">
                          Liabilities: {formatCurrency(data.totalLiabilities)}
                        </p>
                        <hr className="my-1" />
                        <p className="text-sm font-semibold">
                          Net Worth: {formatCurrency(data.netWorth)}
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
              dataKey="netWorth"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
