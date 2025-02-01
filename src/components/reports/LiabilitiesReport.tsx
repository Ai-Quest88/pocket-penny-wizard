import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"

const data = [
  { month: "Jan", totalLiabilities: 80000 },
  { month: "Feb", totalLiabilities: 78500 },
  { month: "Mar", totalLiabilities: 77000 },
  { month: "Apr", totalLiabilities: 75500 },
  { month: "May", totalLiabilities: 74000 },
  { month: "Jun", totalLiabilities: 72500 },
]

export function LiabilitiesReport() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Liabilities Overview</h2>
        <p className="text-sm text-muted-foreground">Track your total liabilities over time</p>
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
              dataKey="totalLiabilities"
              stroke="#ef4444"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}