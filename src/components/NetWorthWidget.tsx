import { Card } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

interface NetWorthWidgetProps {
  entityId?: string;
}

// Simulated data fetch function - replace with actual API call later
const fetchNetWorthData = async (entityId?: string) => {
  // Simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // In a real implementation, this would filter data based on entityId
  return {
    totalAssets: entityId ? 450000 : 1250000,
    totalLiabilities: entityId ? 150000 : 450000,
    netWorth: entityId ? 300000 : 800000,
    previousNetWorth: entityId ? 280000 : 750000
  }
}

export function NetWorthWidget({ entityId }: NetWorthWidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['netWorth', entityId],
    queryFn: () => fetchNetWorthData(entityId),
  })

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4 animate-pulse">
        <div className="h-20 bg-muted rounded" />
      </Card>
    )
  }

  if (!data) return null

  const netWorthChange = ((data.netWorth - data.previousNetWorth) / data.previousNetWorth) * 100
  const isPositiveChange = netWorthChange >= 0

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
              ${data.netWorth.toLocaleString()}
            </span>
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
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-500/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Assets</p>
            <p className="text-lg font-semibold text-green-600">
              ${data.totalAssets.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-red-500/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Liabilities</p>
            <p className="text-lg font-semibold text-red-600">
              ${data.totalLiabilities.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}