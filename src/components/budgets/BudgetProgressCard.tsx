
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useState } from "react"
import { CategoryTransactionsList } from "./CategoryTransactionsList"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BudgetProgressCardProps {
  category: string
  spent: number
  total: number
}

export const BudgetProgressCard = ({ category, spent, total }: BudgetProgressCardProps) => {
  const [showTransactions, setShowTransactions] = useState(false);
  const percentage = Math.round((spent / total) * 100);
  const remaining = total - spent;
  const isOverBudget = spent > total;

  return (
    <div className="space-y-2">
      <Card className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{category}</h3>
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
                ${spent.toFixed(2)}
              </p>
            </div>
            <div className="bg-background-muted p-3 rounded-lg">
              <p className="text-sm text-text-muted">
                {isOverBudget ? 'Over Budget' : 'Remaining'}
              </p>
              <p className={`text-lg font-semibold ${isOverBudget ? 'text-red-600' : ''}`}>
                ${Math.abs(remaining).toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">
                ${spent.toFixed(2)} / ${total.toFixed(2)}
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
                You've exceeded your budget by ${(spent - total).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </Card>
      
      {showTransactions && (
        <CategoryTransactionsList category={category} />
      )}
    </div>
  )
}
