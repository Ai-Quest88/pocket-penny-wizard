import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"

const data = [
  { month: "Jan", netWorth: 50000 },
  { month: "Feb", netWorth: 52000 },
  { month: "Mar", netWorth: 53500 },
  { month: "Apr", netWorth: 55000 },
  { month: "May", netWorth: 54000 },
  { month: "Jun", netWorth: 56000 },
]

export function NetWorthReport() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Net Worth Trend</h2>
        <p className="text-sm text-muted-foreground">Track your net worth changes over time</p>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
                        ${payload[0].value.toLocaleString()}
                      </p>
                    </Card>
                  )
                }
                return null
              }}
            />
            <Line
              type="monotone"
              dataKey="netWorth"
              stroke="#8884d8"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}