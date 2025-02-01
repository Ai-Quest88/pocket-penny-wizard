import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"

const data = [
  { month: "Jan", totalAssets: 150000 },
  { month: "Feb", totalAssets: 155000 },
  { month: "Mar", totalAssets: 158000 },
  { month: "Apr", totalAssets: 162000 },
  { month: "May", totalAssets: 165000 },
  { month: "Jun", totalAssets: 170000 },
]

export function AssetsReport() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Assets Overview</h2>
        <p className="text-sm text-muted-foreground">Track your total assets value over time</p>
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
              dataKey="totalAssets"
              stroke="#22c55e"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}