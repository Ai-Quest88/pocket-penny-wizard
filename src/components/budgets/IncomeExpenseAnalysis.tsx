import { useState } from "react"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BudgetProgressCard } from "./BudgetProgressCard"

export const monthlyData = [
  {
    month: "Jan",
    income: 5000,
    expenses: 3500,
    entityId: "1",
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
    entityId: "1",
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
    entityId: "1",
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
  {
    month: "Jan",
    income: 8000,
    expenses: 6000,
    entityId: "2",
    categories: {
      Salary: 7000,
      Freelance: 1000,
      Housing: 2500,
      Food: 1200,
      Transport: 800,
      Entertainment: 700,
      Others: 800,
    },
  },
  {
    month: "Feb",
    income: 8500,
    expenses: 6200,
    entityId: "2",
    categories: {
      Salary: 7000,
      Freelance: 1500,
      Housing: 2500,
      Food: 1300,
      Transport: 850,
      Entertainment: 750,
      Others: 800,
    },
  },
  {
    month: "Mar",
    income: 8300,
    expenses: 6100,
    entityId: "2",
    categories: {
      Salary: 7000,
      Freelance: 1300,
      Housing: 2500,
      Food: 1250,
      Transport: 800,
      Entertainment: 750,
      Others: 800,
    },
  }
]

interface IncomeExpenseAnalysisProps {
  entityId?: string;
}

export function IncomeExpenseAnalysis({ entityId }: IncomeExpenseAnalysisProps) {
  const [timeframe, setTimeframe] = useState("3m")
  const [viewType, setViewType] = useState("overview")

  const filteredMonthlyData = entityId
    ? monthlyData.filter(data => data.entityId === entityId)
    : monthlyData;

  // Get the latest month's data for the selected entity
  const currentMonthData = filteredMonthlyData[filteredMonthlyData.length - 1];

  // Define budget categories based on the current entity's data
  const budgetCategories = currentMonthData ? [
    { 
      category: "Housing", 
      spent: currentMonthData.categories.Housing, 
      total: currentMonthData.categories.Housing * 1.2 // 20% buffer for budget
    },
    { 
      category: "Food", 
      spent: currentMonthData.categories.Food, 
      total: currentMonthData.categories.Food * 1.2
    },
    { 
      category: "Transport", 
      spent: currentMonthData.categories.Transport, 
      total: currentMonthData.categories.Transport * 1.2
    },
    { 
      category: "Entertainment", 
      spent: currentMonthData.categories.Entertainment, 
      total: currentMonthData.categories.Entertainment * 1.2
    }
  ] : [];

  return (
    <Card className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Budget Overview</h2>
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
        </div>
      </div>

      {/* Budget Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgetCategories.map((budget) => (
          <BudgetProgressCard
            key={budget.category}
            category={budget.category}
            spent={budget.spent}
            total={budget.total}
          />
        ))}
      </div>
    </Card>
  )
}
