import { Card } from "@/components/ui/card"
import { DashboardCard } from "./DashboardCard"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const dummyPropertyData = {
  currentValue: 750000,
  previousValue: 720000,
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
      
      <Card className="p-6">
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
      </Card>
    </div>
  )
}