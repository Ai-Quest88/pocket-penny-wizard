
import { Card } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { useAccountBalances } from "@/hooks/useAccountBalances"

interface NetWorthWidgetProps {
  entityId?: string;
}

export function NetWorthWidget({ entityId }: NetWorthWidgetProps) {
  const { session } = useAuth()
  const { data: accountBalances = [], isLoading } = useAccountBalances()

  const netWorthData = {
    totalAssets: accountBalances
      .filter(account => account.accountType === 'asset')
      .reduce((sum, account) => sum + account.calculatedBalance, 0),
    totalLiabilities: accountBalances
      .filter(account => account.accountType === 'liability')
      .reduce((sum, account) => sum + account.calculatedBalance, 0),
  }

  const netWorth = netWorthData.totalAssets - netWorthData.totalLiabilities
  
  // For demo purposes, assume 5% growth from previous period
  const previousNetWorth = netWorth * 0.95
  const netWorthChange = previousNetWorth > 0 
    ? ((netWorth - previousNetWorth) / previousNetWorth) * 100 
    : 0
  const isPositiveChange = netWorthChange >= 0

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4 animate-pulse">
        <div className="h-20 bg-muted rounded" />
      </Card>
    )
  }

  if (!session?.user) {
    return (
      <Card className="p-6 space-y-4">
        <div className="text-center text-muted-foreground">
          Please log in to view net worth data
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Net Worth Overview</h3>
        <DollarSign className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Net Worth</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              ${netWorth.toLocaleString()}
            </span>
            {netWorthChange !== 0 && (
              <div className={`flex items-center ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
                {isPositiveChange ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-sm ml-1">
                  {Math.abs(netWorthChange).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-500/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Assets</p>
            <p className="text-lg font-semibold text-green-600">
              ${netWorthData.totalAssets.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-red-500/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Liabilities</p>
            <p className="text-lg font-semibold text-red-600">
              ${netWorthData.totalLiabilities.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
