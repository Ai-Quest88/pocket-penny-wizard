
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
import { useBudgetData } from "@/hooks/useBudgetData"

interface IncomeExpenseAnalysisProps {
  entityId?: string;
}

export function IncomeExpenseAnalysis({ entityId }: IncomeExpenseAnalysisProps) {
  const [timeframe, setTimeframe] = useState("3m")
  const { budgetCategories, isLoading } = useBudgetData(entityId, timeframe);

  if (isLoading) {
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
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading budget data...</p>
          </div>
        </div>
      </Card>
    );
  }

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
        {budgetCategories.length === 0 ? (
          <div className="col-span-2 text-center py-8">
            <p className="text-muted-foreground">No spending data found for the selected timeframe</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add some transactions to see your budget analysis
            </p>
          </div>
        ) : (
          budgetCategories.map((budget) => (
            <BudgetProgressCard
              key={budget.category}
              category={budget.category}
              spent={budget.spent}
              total={budget.total}
            />
          ))
        )}
      </div>
    </Card>
  )
}
