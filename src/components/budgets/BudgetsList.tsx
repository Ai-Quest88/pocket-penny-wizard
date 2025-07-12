
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, Trash2 } from "lucide-react"
import { Budget } from "@/types/budget"
import { formatCurrency } from "@/utils/currencyUtils"

interface BudgetsListProps {
  budgets: Budget[]
  onEditBudget: (id: string, budget: Omit<Budget, "id" | "userId" | "createdAt" | "updatedAt">) => void
  onDeleteBudget: (id: string) => void
}

export function BudgetsList({ budgets, onEditBudget, onDeleteBudget }: BudgetsListProps) {
  if (budgets.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Budgets Created</h3>
          <p className="text-muted-foreground mb-4">
            Create your first budget to start tracking your spending
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Your Budgets</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgets.map((budget) => (
            <TableRow key={budget.id}>
              <TableCell className="font-medium">{budget.category}</TableCell>
              <TableCell>{formatCurrency(budget.amount, "USD")}</TableCell>
              <TableCell className="capitalize">{budget.period}</TableCell>
              <TableCell>{new Date(budget.startDate).toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge variant={budget.isActive ? "default" : "secondary"}>
                  {budget.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const { id, userId, createdAt, updatedAt, ...budgetData } = budget;
                      onEditBudget(budget.id, budgetData);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteBudget(budget.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
