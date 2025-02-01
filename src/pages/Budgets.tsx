import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { BudgetForecast } from "@/components/budgets/BudgetForecast"

interface Budget {
  id: string
  category: string
  amount: number
  spent: number
}

export default function Budgets() {
  const { toast } = useToast()
  const [budgets, setBudgets] = useState<Budget[]>([
    {
      id: "1",
      category: "Groceries",
      amount: 500,
      spent: 350,
    },
    {
      id: "2", 
      category: "Entertainment",
      amount: 200,
      spent: 150,
    },
    {
      id: "3",
      category: "Transportation",
      amount: 300,
      spent: 200,
    }
  ])

  const [newBudget, setNewBudget] = useState({
    category: "",
    amount: "",
  })

  const handleAddBudget = () => {
    if (!newBudget.category || !newBudget.amount) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const budget: Budget = {
      id: Math.random().toString(36).substr(2, 9),
      category: newBudget.category,
      amount: parseFloat(newBudget.amount),
      spent: 0,
    }

    setBudgets([...budgets, budget])
    setNewBudget({ category: "", amount: "" })
    
    toast({
      title: "Success",
      description: "Budget added successfully",
    })
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Budgets</h1>
            <p className="text-muted-foreground">Manage your budgets and forecasts</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Budget</DialogTitle>
                <DialogDescription>
                  Create a new budget for a specific category.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newBudget.category}
                    onChange={(e) =>
                      setNewBudget({ ...newBudget, category: e.target.value })
                    }
                    placeholder="e.g., Groceries"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newBudget.amount}
                    onChange={(e) =>
                      setNewBudget({ ...newBudget, amount: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddBudget}>Add Budget</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <BudgetForecast />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <Card key={budget.id} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">{budget.category}</h3>
                <span className="text-sm text-muted-foreground">
                  ${budget.spent} / ${budget.amount}
                </span>
              </div>
              <Progress
                value={(budget.spent / budget.amount) * 100}
                className="h-2"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                {((budget.spent / budget.amount) * 100).toFixed(0)}% spent
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}