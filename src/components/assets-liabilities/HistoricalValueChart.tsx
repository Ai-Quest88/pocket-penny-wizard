import { Card } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, XAxis, YAxis } from "recharts"
import { format } from "date-fns"

interface HistoricalValueChartProps {
  assetHistory: { date: string; value: number }[]
  liabilityHistory: { date: string; value: number }[]
}

export function HistoricalValueChart({ assetHistory, liabilityHistory }: HistoricalValueChartProps) {
  const combinedData = assetHistory.map(asset => {
    const matchingLiability = liabilityHistory.find(l => l.date === asset.date)
    return {
      date: asset.date,
      assets: asset.value,
      liabilities: matchingLiability?.value || 0,
      netWorth: asset.value - (matchingLiability?.value || 0)
    }
  })

  const chartConfig = {
    assets: {
      label: "Assets",
      theme: {
        light: "#22c55e",
        dark: "#22c55e"
      }
    },
    liabilities: {
      label: "Liabilities",
      theme: {
        light: "#ef4444",
        dark: "#ef4444"
      }
    },
    netWorth: {
      label: "Net Worth",
      theme: {
        light: "#3b82f6",
        dark: "#60a5fa"
      }
    }
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Historical Net Worth</h3>
      <div className="h-[300px]">
        <ChartContainer config={chartConfig}>
          <AreaChart data={combinedData}>
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(new Date(date), "MMM yyyy")}
            />
            <YAxis
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip>
              <ChartTooltipContent />
            </ChartTooltip>
            <Area
              type="monotone"
              dataKey="assets"
              name="assets"
              stroke="var(--color-assets)"
              fill="var(--color-assets)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="liabilities"
              name="liabilities"
              stroke="var(--color-liabilities)"
              fill="var(--color-liabilities)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="netWorth"
              name="netWorth"
              stroke="var(--color-netWorth)"
              fill="var(--color-netWorth)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </Card>
  )
}