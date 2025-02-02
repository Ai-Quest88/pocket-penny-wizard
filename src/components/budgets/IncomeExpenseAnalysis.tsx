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

// Dummy data for different entities
const dummyBudgetData = {
  "1": [
    { category: "Housing", spent: 1500, total: 2000 },
    { category: "Food", spent: 800, total: 1000 },
    { category: "Transport", spent: 400, total: 600 },
    { category: "Entertainment", spent: 300, total: 500 }
  ],
  "2": [
    { category: "Housing", spent: 2500, total: 3000 },
    { category: "Food", spent: 1200, total: 1500 },
    { category: "Transport", spent: 800, total: 1000 },
    { category: "Entertainment", spent: 700, total: 1000 }
  ],
  "default": [
    { category: "Housing", spent: 1000, total: 1500 },
    { category: "Food", spent: 500, total: 800 },
    { category: "Transport", spent: 300, total: 500 },
    { category: "Entertainment", spent: 200, total: 400 }
  ]
};

interface IncomeExpenseAnalysisProps {
  entityId?: string;
}

export function IncomeExpenseAnalysis({ entityId }: IncomeExpenseAnalysisProps) {
  const [timeframe, setTimeframe] = useState("3m")

  // Get budget categories based on entity ID
  const getBudgetCategories = (entityId?: string) => {
    if (!entityId || entityId === "all") {
      return dummyBudgetData.default;
    }
    return dummyBudgetData[entityId as keyof typeof dummyBudgetData] || dummyBudgetData.default;
  };

  const budgetCategories = getBudgetCategories(entityId);

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