import { useState } from "react"
import { BudgetForecast } from "@/components/budgets/BudgetForecast"
import { IncomeExpenseAnalysis } from "@/components/budgets/IncomeExpenseAnalysis"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function Budgets() {
  const [selectedEntityId, setSelectedEntityId] = useState<string>("all")
  
  // Fetch entities from localStorage
  const entities = JSON.parse(localStorage.getItem('entities') || '[]')

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Budgets</h1>
            <p className="text-muted-foreground">
              Manage your budgets and forecasts
            </p>
          </div>
          <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {entities.map((entity: any) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <IncomeExpenseAnalysis entityId={selectedEntityId === "all" ? undefined : selectedEntityId} />
        <BudgetForecast entityId={selectedEntityId === "all" ? undefined : selectedEntityId} />
      </div>
    </div>
  )
}