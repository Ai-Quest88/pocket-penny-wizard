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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{category}</h3>
        <span className="text-sm text-text-muted">
          ${spent} / ${total}
        </span>
      </div>
      <Progress value={percentage} className="h-2 mb-2" />
      <p className="text-sm text-text-muted">{percentage}% spent</p>
    </Card>
  )
}