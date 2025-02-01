import { Card } from "@/components/ui/card"
import { SpendingTrendChart } from "@/components/SpendingTrendChart"
import { CategoryComparisonChart } from "@/components/CategoryComparisonChart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IncomeExpenseAnalysis } from "@/components/budgets/IncomeExpenseAnalysis"
import { SmartInsights } from "@/components/insights/SmartInsights"
import { SmartAssistantChat } from "@/components/insights/SmartAssistantChat"

const Analytics = () => {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-text">Analytics</h1>
          <p className="text-text-muted">Track and analyze your financial patterns</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SmartInsights />
          </div>
          <div className="lg:col-span-1">
            <SmartAssistantChat />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics