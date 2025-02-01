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
import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Sample data - in a real app, this would come from your backend
const monthlyData = [
  {
    month: "Jan",
    income: 5000,
    expenses: 3500,
    categories: {
      Salary: 4500,
      Freelance: 500,
      Housing: 1500,
      Food: 800,
      Transport: 400,
      Entertainment: 300,
      Others: 500,
    },
  },
  {
    month: "Feb",
    income: 5200,
    expenses: 3800,
    categories: {
      Salary: 4500,
      Freelance: 700,
      Housing: 1500,
      Food: 900,
      Transport: 450,
      Entertainment: 400,
      Others: 550,
    },
  },
  {
    month: "Mar",
    income: 5100,
    expenses: 3600,
    categories: {
      Salary: 4500,
      Freelance: 600,
      Housing: 1500,
      Food: 850,
      Transport: 400,
      Entertainment: 350,
      Others: 500,
    },
  },
]

const categoryColors = {
  Salary: "#8884d8",
  Freelance: "#82ca9d",
  Housing: "#ffc658",
  Food: "#ff7300",
  Transport: "#00C49F",
  Entertainment: "#FFBB28",
  Others: "#FF8042",
}

export function IncomeExpenseAnalysis() {
  const [timeframe, setTimeframe] = useState("3m")
  const [viewType, setViewType] = useState("overview")

  const getAnalytics = () => {
    const totalIncome = monthlyData.reduce((sum, month) => sum + month.income, 0)
    const totalExpenses = monthlyData.reduce((sum, month) => sum + month.expenses, 0)
    const averageIncome = totalIncome / monthlyData.length
    const averageExpenses = totalExpenses / monthlyData.length
    const savings = totalIncome - totalExpenses
    const savingsRate = ((savings / totalIncome) * 100).toFixed(1)

    return {
      totalIncome,
      totalExpenses,
      averageIncome,
      averageExpenses,
      savings,
      savingsRate,
    }
  }

  const analytics = getAnalytics()

  const getCategoryData = () => {
    const categories: { [key: string]: number } = {}
    monthlyData.forEach((month) => {
      Object.entries(month.categories).forEach(([category, amount]) => {
        categories[category] = (categories[category] || 0) + amount
      })
    })
    return Object.entries(categories).map(([name, value]) => ({
      name,
      value: value / monthlyData.length, // Average per month
    }))
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Income & Expense Analysis</h2>
        <div className="flex gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 Month</SelectItem>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="12m">12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Select value={viewType} onValueChange={setViewType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="categories">Categories</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Average Monthly Income</p>
          <p className="text-2xl font-bold">${analytics.averageIncome.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Average Monthly Expenses</p>
          <p className="text-2xl font-bold">${analytics.averageExpenses.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Savings</p>
          <p className="text-2xl font-bold">${analytics.savings.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Savings Rate</p>
          <p className="text-2xl font-bold">{analytics.savingsRate}%</p>
        </Card>
      </div>

      <div className="h-[400px]">
        {viewType === "overview" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
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
                          Income: ${payload[0].value}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Expenses: ${payload[1].value}
                        </p>
                      </Card>
                    )
                  }
                  return null
                }}
              />
              <Legend />
              <Bar dataKey="income" fill="#8884d8" name="Income" />
              <Bar dataKey="expenses" fill="#82ca9d" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getCategoryData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <Card className="p-2 border bg-background">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">
                          Average: ${payload[0].value.toFixed(2)}
                        </p>
                      </Card>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="value"
                fill="#8884d8"
                name="Average Monthly Amount"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}