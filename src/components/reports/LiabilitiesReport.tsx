import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useAccountBalances } from "@/hooks/useAccountBalances"
import { format, subMonths, endOfMonth } from "date-fns"

export function LiabilitiesReport() {
  const { session } = useAuth();
  const { displayCurrency, formatCurrency, convertAmount } = useCurrency();
  const { data: currentAccountBalances = [] } = useAccountBalances();

  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ['liabilities-trend', session?.user?.id, displayCurrency],
    queryFn: async () => {
      if (!session?.user) return [];

      // Get last 12 months of data for better trends
      const endDate = new Date();
      const months = [];
      
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(endDate, i);
        const monthEnd = endOfMonth(monthDate);
        
        // Get liabilities for this month
        const { data: liabilities } = await supabase
          .from('liabilities')
          .select('amount, opening_balance, type, category')
          .eq('user_id', session.user.id)
          .lte('created_at', monthEnd.toISOString());
        
        // Convert all amounts to display currency (assuming stored in AUD)
        const totalLiabilities = liabilities?.reduce((sum, liability) => {
          const liabilityValue = convertAmount(Number(liability.opening_balance || liability.amount), 'AUD');
          return sum + liabilityValue;
        }, 0) || 0;
        
        months.push({
          month: format(monthDate, 'MMM yy'),
          totalLiabilities: Math.round(totalLiabilities),
          liabilityCount: liabilities?.length || 0
        });
      }
      
      return months;
    },
    enabled: !!session?.user,
  });

  // Calculate current liabilities from account balances
  const currentLiabilities = currentAccountBalances.filter(account => account.accountType === 'liability');
  const currentTotalLiabilities = currentLiabilities.reduce((sum, account) => sum + account.calculatedBalance, 0);

  // Calculate liability breakdown by type
  const liabilitiesByType = currentLiabilities.reduce((acc, liability) => {
    const type = liability.accountName.includes('Credit') ? 'Credit Card' : 
                 liability.accountName.includes('Loan') ? 'Loan' : 
                 liability.accountName.includes('Mortgage') ? 'Mortgage' : 'Other';
    acc[type] = (acc[type] || 0) + liability.calculatedBalance;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Liabilities Overview ({displayCurrency})</h2>
          <p className="text-sm text-muted-foreground">Track your total liabilities over time</p>
        </div>
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading liabilities data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Liabilities Overview ({displayCurrency})</h2>
        <p className="text-sm text-muted-foreground">Track your total liabilities over time</p>
      </div>

      {/* Current Liabilities Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-muted-foreground">Total Liabilities</p>
          <p className="text-xl font-semibold text-red-600">
            {formatCurrency(currentTotalLiabilities)}
          </p>
          <p className="text-xs text-red-600 mt-1">
            {currentLiabilities.length} liabilit{currentLiabilities.length !== 1 ? 'ies' : 'y'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-2">Liabilities Breakdown</p>
          <div className="space-y-1">
            {Object.entries(liabilitiesByType).map(([type, amount]) => (
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
                        <p className="text-sm text-red-600">
                          Total Liabilities: {formatCurrency(data.totalLiabilities)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Liability Count: {data.liabilityCount}
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
              dataKey="totalLiabilities"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
