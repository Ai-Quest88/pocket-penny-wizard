
import { Card } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface CashFlowChartProps {
  entityId?: string;
}

const data = [
  { month: "Jan", income: 5000, expense: 3500, netWorth: 45000 },
  { month: "Feb", income: 5200, expense: 3200, netWorth: 47000 },
  { month: "Mar", income: 4800, expense: 4100, netWorth: 47700 },
  { month: "Apr", income: 5500, expense: 3800, netWorth: 49400 },
  { month: "May", income: 5000, expense: 3600, netWorth: 50800 },
  { month: "Jun", income: 5300, expense: 3900, netWorth: 52200 },
  { month: "Jul", income: 5100, expense: 3700, netWorth: 53600 },
]

export const CashFlowChart = ({ entityId }: CashFlowChartProps) => {
  // Filter data based on entityId if needed
  const filteredData = entityId ? data.filter(item => {
    // Add your filtering logic here based on entityId
    return true; // Placeholder - implement actual filtering
  }) : data;

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={filteredData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <Card className="p-3 border bg-background">
                    <p className="font-medium mb-2">{label}</p>
                    {payload.map((entry, index) => (
                      <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: ${entry.value?.toLocaleString()}
                      </p>
                    ))}
                  </Card>
                )
              }
              return null
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#22c55e"
            name="Income"
            strokeWidth={2}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="expense"
            stroke="#ef4444"
            name="Expense"
            strokeWidth={2}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="netWorth"
            stroke="#3b82f6"
            name="Net Worth"
            strokeWidth={2}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
