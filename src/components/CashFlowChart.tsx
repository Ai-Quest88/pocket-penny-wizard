
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { useState } from "react"

interface CashFlowChartProps {
  entityId?: string;
}

const monthlyData = [
  { period: "Jan", moneyIn: 5000, moneyOut: 3500, leftover: 1500 },
  { period: "Feb", moneyIn: 5200, moneyOut: 3200, leftover: 2000 },
  { period: "Mar", moneyIn: 4800, moneyOut: 4100, leftover: 700 },
  { period: "Apr", moneyIn: 5500, moneyOut: 3800, leftover: 1700 },
  { period: "May", moneyIn: 5000, moneyOut: 3600, leftover: 1400 },
  { period: "Jun", moneyIn: 5300, moneyOut: 3900, leftover: 1400 },
  { period: "Jul", moneyIn: 5100, moneyOut: 3700, leftover: 1400 },
]

const quarterlyData = [
  { period: "Q1 2024", moneyIn: 15000, moneyOut: 10800, leftover: 4200 },
  { period: "Q2 2024", moneyIn: 15800, moneyOut: 11300, leftover: 4500 },
  { period: "Q3 2024", moneyIn: 15400, moneyOut: 11100, leftover: 4300 },
  { period: "Q4 2024", moneyIn: 16200, moneyOut: 11800, leftover: 4400 },
]

const yearlyData = [
  { period: "2022", moneyIn: 58000, moneyOut: 42000, leftover: 16000 },
  { period: "2023", moneyIn: 62400, moneyOut: 45000, leftover: 17400 },
  { period: "2024", moneyIn: 67200, moneyOut: 48200, leftover: 19000 },
]

export const CashFlowChart = ({ entityId }: CashFlowChartProps) => {
  const [timeFrame, setTimeFrame] = useState<string>("monthly")

  const getDataForTimeFrame = () => {
    switch (timeFrame) {
      case "quarterly":
        return quarterlyData
      case "yearly":
        return yearlyData
      default:
        return monthlyData
    }
  }

  // Filter data based on entityId if needed
  const filteredData = entityId ? getDataForTimeFrame().filter(item => {
    // Add your filtering logic here based on entityId
    return true; // Placeholder - implement actual filtering
  }) : getDataForTimeFrame();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Cash Flow Analysis</h3>
        <Select value={timeFrame} onValueChange={setTimeFrame}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Time frame" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filteredData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#6B7280' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#6B7280' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <Card className="p-3 border bg-background shadow-lg">
                      <p className="font-medium mb-2 text-foreground">{label}</p>
                      {payload.map((entry, index) => (
                        <p key={index} className="text-sm flex justify-between items-center gap-4" style={{ color: entry.color }}>
                          <span>{entry.name}:</span>
                          <span className="font-semibold">${entry.value?.toLocaleString()}</span>
                        </p>
                      ))}
                    </Card>
                  )
                }
                return null
              }}
            />
            <Legend />
            <Bar
              dataKey="moneyIn"
              fill="#10B981"
              name="Money In"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="moneyOut"
              fill="#F59E0B"
              name="Money Out"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="leftover"
              fill="#3B82F6"
              name="Net Cash Flow"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
