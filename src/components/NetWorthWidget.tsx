import { Card } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useAccountBalances } from "@/hooks/useAccountBalances"

interface NetWorthWidgetProps {
  entityId?: string;
}

export function NetWorthWidget({ entityId }: NetWorthWidgetProps) {
  const { session } = useAuth();
  const { displayCurrency, formatCurrency } = useCurrency();
  const { data: accountBalances = [], isLoading } = useAccountBalances();

  const netWorthData = {
    totalAssets: accountBalances
      .filter(account => account.accountType === 'asset')
      .reduce((sum, account) => sum + account.calculatedBalance, 0),
    totalLiabilities: accountBalances
      .filter(account => account.accountType === 'liability')
      .reduce((sum, account) => sum + account.calculatedBalance, 0),
  };

  const netWorth = netWorthData.totalAssets - netWorthData.totalLiabilities;
  
  // For demo purposes, assume 5% growth from previous period
  const previousNetWorth = netWorth * 0.95;
  const netWorthChange = previousNetWorth > 0 
    ? ((netWorth - previousNetWorth) / previousNetWorth) * 100 
    : 0;
  const isPositiveChange = netWorthChange >= 0;

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-muted rounded w-48" />
          <div className="h-5 w-5 bg-muted rounded" />
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-muted rounded w-32" />
            <div className="h-8 bg-muted rounded w-40" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="h-4 bg-muted-foreground/20 rounded w-24 mb-2" />
              <div className="h-6 bg-muted-foreground/20 rounded w-32" />
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="h-4 bg-muted-foreground/20 rounded w-28 mb-2" />
              <div className="h-6 bg-muted-foreground/20 rounded w-32" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!session?.user) {
    return (
      <Card className="p-6 space-y-4">
        <div className="text-center text-muted-foreground">
          Please log in to view net worth data
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Net Worth Overview</h3>
          <p className="text-sm text-muted-foreground">All amounts in {displayCurrency}</p>
        </div>
        <DollarSign className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Net Worth</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              {formatCurrency(netWorth)}
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
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-200">
            <p className="text-sm text-muted-foreground">Total Assets</p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(netWorthData.totalAssets)}
            </p>
            {accountBalances.filter(a => a.accountType === 'asset').length > 0 && (
              <p className="text-xs text-green-600/70 mt-1">
                {accountBalances.filter(a => a.accountType === 'asset').length} accounts
              </p>
            )}
          </div>
          <div className="p-4 bg-red-500/10 rounded-lg border border-red-200">
            <p className="text-sm text-muted-foreground">Total Liabilities</p>
            <p className="text-lg font-semibold text-red-600">
              {formatCurrency(netWorthData.totalLiabilities)}
            </p>
            {accountBalances.filter(a => a.accountType === 'liability').length > 0 && (
              <p className="text-xs text-red-600/70 mt-1">
                {accountBalances.filter(a => a.accountType === 'liability').length} accounts
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

