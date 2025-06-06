
import { Card } from "@/components/ui/card"
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

interface CashFlowChartProps {
  entityId?: string;
}

const data = [
  { month: "Jan", moneyIn: 5000, moneyOut: 3500, leftover: 1500 },
  { month: "Feb", moneyIn: 5200, moneyOut: 3200, leftover: 2000 },
  { month: "Mar", moneyIn: 4800, moneyOut: 4100, leftover: 700 },
  { month: "Apr", moneyIn: 5500, moneyOut: 3800, leftover: 1700 },
  { month: "May", moneyIn: 5000, moneyOut: 3600, leftover: 1400 },
  { month: "Jun", moneyIn: 5300, moneyOut: 3900, leftover: 1400 },
  { month: "Jul", moneyIn: 5100, moneyOut: 3700, leftover: 1400 },
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
        <BarChart
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
          <Bar
            dataKey="moneyIn"
            fill="#22c55e"
            name="Money In"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="moneyOut"
            fill="#ef4444"
            name="Money Out"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="leftover"
            fill="#3b82f6"
            name="Leftover"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
