import { Card } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ForecastData {
  month: string
  projected: number
  actual?: number
}

const generateForecastData = (
  startingBalance: number,
  monthlyIncome: number,
  monthlyExpenses: number,
  months: number
): ForecastData[] => {
  const data: ForecastData[] = []
  let balance = startingBalance

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ]
  
  const currentMonth = new Date().getMonth()
  
  for (let i = 0; i < months; i++) {
    const monthIndex = (currentMonth + i) % 12
    balance = balance + monthlyIncome - monthlyExpenses
    data.push({
      month: monthNames[monthIndex],
      projected: Math.round(balance),
      actual: i === 0 ? startingBalance : undefined
    })
  }

  return data
}

export function BudgetForecast() {
  const [startingBalance, setStartingBalance] = useState(5000)
  const [monthlyIncome, setMonthlyIncome] = useState(4000)
  const [monthlyExpenses, setMonthlyExpenses] = useState(3000)
  const [forecastMonths, setForecastMonths] = useState("6")
  const [forecastData, setForecastData] = useState<ForecastData[]>(
    generateForecastData(startingBalance, monthlyIncome, monthlyExpenses, 6)
  )

  const handleUpdateForecast = () => {
    const newData = generateForecastData(
      startingBalance,
      monthlyIncome,
      monthlyExpenses,
      parseInt(forecastMonths)
    )
    setForecastData(newData)
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Budget Forecast</h2>
        <p className="text-muted-foreground">
          Project your future balance based on income and expenses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startingBalance">Starting Balance</Label>
          <Input
            id="startingBalance"
            type="number"
            value={startingBalance}
            onChange={(e) => setStartingBalance(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthlyIncome">Monthly Income</Label>
          <Input
            id="monthlyIncome"
            type="number"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthlyExpenses">Monthly Expenses</Label>
          <Input
            id="monthlyExpenses"
            type="number"
            value={monthlyExpenses}
            onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="forecastMonths">Forecast Period</Label>
          <Select value={forecastMonths} onValueChange={setForecastMonths}>
            <SelectTrigger>
              <SelectValue placeholder="Select months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 months</SelectItem>
              <SelectItem value="6">6 months</SelectItem>
              <SelectItem value="12">12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={handleUpdateForecast} className="w-full">
        Update Forecast
      </Button>

      <div className="h-[400px] mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={forecastData}>
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
                        Projected: ${payload[0].value.toLocaleString()}
                      </p>
                      {payload[1]?.value && (
                        <p className="text-sm text-muted-foreground">
                          Actual: ${payload[1].value.toLocaleString()}
                        </p>
                      )}
                    </Card>
                  )
                }
                return null
              }}
            />
            <Line
              type="monotone"
              dataKey="projected"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}