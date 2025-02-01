import { Card } from "@/components/ui/card"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts"
import { format } from "date-fns"

interface HistoricalValueChartProps {
  assetHistory: Array<{ date: string; value: number }>
  liabilityHistory: Array<{ date: string; value: number }>
}

const ChartTooltipContent = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) return null

  const date = new Date(label)
  const assets = payload[0]?.value || 0
  const liabilities = payload[1]?.value || 0
  const netWorth = assets - liabilities

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid gap-2">
        <div className="text-sm font-medium">{format(date, "MMMM yyyy")}</div>
        <div className="grid gap-1">
          <div className="text-sm">
            Assets:{" "}
            <span className="font-medium text-green-600">
              ${assets.toLocaleString()}
            </span>
          </div>
          <div className="text-sm">
            Liabilities:{" "}
            <span className="font-medium text-red-600">
              ${liabilities.toLocaleString()}
            </span>
          </div>
          <div className="text-sm font-medium">
            Net Worth:{" "}
            <span className={netWorth >= 0 ? "text-green-600" : "text-red-600"}>
              ${netWorth.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HistoricalValueChart({
  assetHistory,
  liabilityHistory,
}: HistoricalValueChartProps) {
  const chartData = assetHistory.map((item, index) => ({
    date: item.date,
    assets: item.value,
    liabilities: liabilityHistory[index]?.value || 0,
    netWorth: item.value - (liabilityHistory[index]?.value || 0),
  }))

  return (
    <Card className="p-6 h-full">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Historical Net Worth</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), "MMM yyyy")}
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="assets"
                stackId="1"
                stroke="#10B981"
                fill="#D1FAE5"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="liabilities"
                stackId="2"
                stroke="#EF4444"
                fill="#FEE2E2"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  )
}