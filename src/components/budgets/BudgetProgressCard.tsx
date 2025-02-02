import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface BudgetProgressCardProps {
  category: string
  spent: number
  total: number
}

export const BudgetProgressCard = ({ category, spent, total }: BudgetProgressCardProps) => {
  const percentage = Math.round((spent / total) * 100)

  return (
    <Card className="p-6">
      <div className="flex flex-col space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-background-muted p-3 rounded-lg">
            <p className="text-sm text-text-muted">Spent</p>
            <p className="text-lg font-semibold">${spent}</p>
          </div>
          <div className="bg-background-muted p-3 rounded-lg">
            <p className="text-sm text-text-muted">Remaining</p>
            <p className="text-lg font-semibold">${total - spent}</p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{category}</h3>
          <span className="text-sm text-text-muted">
            ${spent} / ${total}
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
        <p className="text-sm text-text-muted">{percentage}% spent</p>
      </div>
    </Card>
  )
}