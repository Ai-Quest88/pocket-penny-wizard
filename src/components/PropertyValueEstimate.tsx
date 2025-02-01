import { Card } from "@/components/ui/card"
import { DashboardCard } from "./DashboardCard"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const dummyPropertyData = {
  currentValue: 750000,
  previousValue: 720000,
  purchasePrice: 650000,
  purchaseDate: "2020-01-15",
  outstandingLoan: 520000,
  historicalValues: [
    { month: 'Jan', value: 720000 },
    { month: 'Feb', value: 725000 },
    { month: 'Mar', value: 728000 },
    { month: 'Apr', value: 735000 },
    { month: 'May', value: 742000 },
    { month: 'Jun', value: 750000 },
  ]
}

export function PropertyValueEstimate() {
  const valueChange = ((dummyPropertyData.currentValue - dummyPropertyData.previousValue) / dummyPropertyData.previousValue) * 100
  const equity = dummyPropertyData.currentValue - dummyPropertyData.outstandingLoan
  const equityPercentage = (equity / dummyPropertyData.currentValue) * 100

  return (
    <div className="space-y-6">
      <DashboardCard
        title="Property Value Estimate"
        value={`$${dummyPropertyData.currentValue.toLocaleString()}`}
        trend={{
          value: Number(valueChange.toFixed(1)),
          isPositive: valueChange > 0
        }}
      />
      
      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Purchase Price</h4>
            <p className="text-lg font-semibold">${dummyPropertyData.purchasePrice.toLocaleString()}</p>
            <span className="text-sm text-muted-foreground">
              Purchased on {new Date(dummyPropertyData.purchaseDate).toLocaleDateString()}
            </span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Outstanding Loan</h4>
            <p className="text-lg font-semibold text-red-600">
              ${dummyPropertyData.outstandingLoan.toLocaleString()}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Current Equity</h4>
            <p className="text-lg font-semibold text-green-600">${equity.toLocaleString()}</p>
            <span className="text-sm text-muted-foreground">{equityPercentage.toFixed(1)}% of property value</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Total Appreciation</h4>
            <p className="text-lg font-semibold">
              ${(dummyPropertyData.currentValue - dummyPropertyData.purchasePrice).toLocaleString()}
            </p>
            <span className="text-sm text-muted-foreground">
              {(((dummyPropertyData.currentValue - dummyPropertyData.purchasePrice) / dummyPropertyData.purchasePrice) * 100).toFixed(1)}% since purchase
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Value Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dummyPropertyData.historicalValues}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </div>
  )
}