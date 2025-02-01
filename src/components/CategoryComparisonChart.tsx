import { Card } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const data = [
  { category: "Food", thisMonth: 4000, lastMonth: 2400 },
  { category: "Transport", thisMonth: 3000, lastMonth: 1398 },
  { category: "Shopping", thisMonth: 2000, lastMonth: 9800 },
  { category: "Bills", thisMonth: 2780, lastMonth: 3908 },
  { category: "Entertainment", thisMonth: 1890, lastMonth: 4800 },
]

export const CategoryComparisonChart = () => {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <Card className="p-2 border bg-background">
                    <p className="font-medium">{label}</p>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        This Month: ${payload[0].value}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last Month: ${payload[1].value}
                      </p>
                    </div>
                  </Card>
                )
              }
              return null
            }}
          />
          <Bar dataKey="thisMonth" fill="#8884d8" name="This Month" />
          <Bar dataKey="lastMonth" fill="#82ca9d" name="Last Month" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}