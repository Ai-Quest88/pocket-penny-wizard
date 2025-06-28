import { Card } from "@/components/ui/card"
import { useCurrency } from "@/contexts/CurrencyContext"

interface NetWorthSummaryProps {
  totalAssets: number
  totalLiabilities: number
  netWorth: number
}

export function NetWorthSummary({ totalAssets, totalLiabilities, netWorth }: NetWorthSummaryProps) {
  const { formatCurrency, displayCurrency } = useCurrency()
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6 space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Total Assets ({displayCurrency})</h3>
        <p className="text-2xl font-semibold text-green-600">{formatCurrency(totalAssets)}</p>
      </Card>
      <Card className="p-6 space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Total Liabilities ({displayCurrency})</h3>
        <p className="text-2xl font-semibold text-red-600">{formatCurrency(totalLiabilities)}</p>
      </Card>
      <Card className="p-6 space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Net Worth ({displayCurrency})</h3>
        <p className={`text-2xl font-semibold ${netWorth >= 0 ? "text-green-600" : "text-red-600"}`}>
          {formatCurrency(netWorth)}
        </p>
      </Card>
    </div>
  )
}