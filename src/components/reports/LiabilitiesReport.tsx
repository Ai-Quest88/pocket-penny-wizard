
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"

export function LiabilitiesReport() {
  const { session } = useAuth();

  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ['liabilities-trend', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return [];

      // Get last 6 months of data
      const endDate = new Date();
      const months = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(endDate, i);
        const monthEnd = endOfMonth(monthDate);
        
        // Get liabilities for this month
        const { data: liabilities } = await supabase
          .from('liabilities')
          .select('amount')
          .eq('user_id', session.user.id)
          .lte('created_at', monthEnd.toISOString());
        
        const totalLiabilities = liabilities?.reduce((sum, liability) => sum + Number(liability.amount), 0) || 0;
        
        months.push({
          month: format(monthDate, 'MMM'),
          totalLiabilities: Math.round(totalLiabilities)
        });
      }
      
      return months;
    },
    enabled: !!session?.user,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Liabilities Overview</h2>
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
        <h2 className="text-xl font-semibold mb-2">Liabilities Overview</h2>
        <p className="text-sm text-muted-foreground">Track your total liabilities over time</p>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
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
              dataKey="totalLiabilities"
              stroke="#ef4444"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
