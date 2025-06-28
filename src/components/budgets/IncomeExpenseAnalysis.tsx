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
import { useCurrency } from "@/contexts/CurrencyContext"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"

interface IncomeExpenseAnalysisProps {
  entityId?: string;
}

export function IncomeExpenseAnalysis({ entityId }: IncomeExpenseAnalysisProps) {
  const [timeframe, setTimeframe] = useState("3m");
  const { displayCurrency, formatCurrency } = useCurrency();
  const { budgetCategories, isLoading } = useBudgetData(entityId, timeframe);

  // Calculate summary metrics from budgetCategories
  const totalSpent = budgetCategories.reduce((sum, category) => sum + category.spent, 0);
  const totalBudgeted = budgetCategories.reduce((sum, category) => sum + category.total, 0);
  const totalVariance = totalSpent - totalBudgeted;
  const variancePercentage = totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;
  const isOverBudget = totalVariance > 0;

  if (isLoading) {
    return (
      <Card className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Budget Overview</h2>
            <p className="text-sm text-muted-foreground">All amounts in {displayCurrency}</p>
          </div>
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
        <div>
          <h2 className="text-2xl font-semibold">Budget Overview</h2>
          <p className="text-sm text-muted-foreground">
            All amounts in {displayCurrency} • 
            {timeframe === "1m" ? "Last month" : 
             timeframe === "3m" ? "Last 3 months" :
             timeframe === "6m" ? "Last 6 months" : "Last 12 months"}
          </p>
        </div>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Budgeted</p>
              <p className="text-xl font-semibold text-blue-600">
                {formatCurrency(totalBudgeted)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-xl font-semibold text-orange-600">
                {formatCurrency(totalSpent)}
              </p>
            </div>
          </div>
        </Card>

        <Card className={`p-4 ${isOverBudget ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center gap-2">
            {isOverBudget ? (
              <TrendingUp className="h-5 w-5 text-red-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-green-600" />
            )}
            <div>
              <p className="text-sm text-muted-foreground">Variance</p>
              <div className="flex items-center gap-2">
                <p className={`text-xl font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                  {isOverBudget ? '+' : ''}{formatCurrency(Math.abs(totalVariance))}
                </p>
                {totalBudgeted > 0 && (
                  <span className={`text-sm ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                    ({Math.abs(variancePercentage).toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Budget Progress Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
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
      </div>
    </Card>
  );
}
