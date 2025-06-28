import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useState } from "react"
import { CategoryTransactionsList } from "./CategoryTransactionsList"
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCurrency } from "@/contexts/CurrencyContext"

interface BudgetProgressCardProps {
  category: string
  spent: number
  total: number
}

export const BudgetProgressCard = ({ category, spent, total }: BudgetProgressCardProps) => {
  const [showTransactions, setShowTransactions] = useState(false);
  const { formatCurrency, displayCurrency } = useCurrency();
  
  const percentage = total > 0 ? Math.round((spent / total) * 100) : 0;
  const remaining = total - spent;
  const isOverBudget = spent > total && total > 0;
  const noBudgetSet = total === 0;

  // Calculate time range for transactions (default to last 3 months)
  const now = new Date();
  const startDate = new Date();
  startDate.setMonth(now.getMonth() - 3);
  
  const timeRange = {
    start: startDate.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0]
  };

  return (
    <div className="space-y-2">
      <Card className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{category}</h3>
              {noBudgetSet && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTransactions(!showTransactions)}
              className="p-1 h-auto"
            >
              {showTransactions ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background-muted p-3 rounded-lg">
              <p className="text-sm text-text-muted">Spent</p>
              <p className={`text-lg font-semibold ${isOverBudget ? 'text-red-600' : ''}`}>
                {formatCurrency(spent)}
              </p>
            </div>
            <div className="bg-background-muted p-3 rounded-lg">
              <p className="text-sm text-text-muted">
                {noBudgetSet ? 'No Budget Set' : isOverBudget ? 'Over Budget' : 'Remaining'}
              </p>
              <p className={`text-lg font-semibold ${noBudgetSet ? 'text-yellow-600' : isOverBudget ? 'text-red-600' : ''}`}>
                {noBudgetSet ? 'Set Budget' : formatCurrency(Math.abs(remaining))}
              </p>
            </div>
          </div>
          
          {!noBudgetSet && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted">
                  {formatCurrency(spent)} / {formatCurrency(total)}
                </span>
                <span className={`text-sm ${isOverBudget ? 'text-red-600' : 'text-text-muted'}`}>
                  {percentage}% {isOverBudget ? 'over budget' : 'spent'}
                </span>
              </div>
              <Progress 
                value={Math.min(percentage, 100)} 
                className={`h-2 ${isOverBudget ? '[&>div]:bg-red-500' : ''}`} 
              />
              {isOverBudget && (
                <p className="text-xs text-red-600">
                  You've exceeded your budget by {formatCurrency(spent - total)}
                </p>
              )}
            </div>
          )}

          {noBudgetSet && (
            <div className="text-center py-2">
              <p className="text-sm text-yellow-600">
                No budget set for this category. Consider creating a budget to track your spending.
              </p>
            </div>
          )}
        </div>
      </Card>
      
      {showTransactions && (
        <CategoryTransactionsList categoryName={category} timeRange={timeRange} />
      )}
    </div>
  )
}
