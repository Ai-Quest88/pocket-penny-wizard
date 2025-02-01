import { Card } from "@/components/ui/card"
import { SpendingTrendChart } from "@/components/SpendingTrendChart"
import { CategoryComparisonChart } from "@/components/CategoryComparisonChart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IncomeExpenseAnalysis } from "@/components/budgets/IncomeExpenseAnalysis"
import { SmartInsights } from "@/components/insights/SmartInsights"

const Analytics = () => {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-text">Analytics</h1>
          <p className="text-text-muted">Track and analyze your financial patterns</p>
        </header>

        <SmartInsights />

        <Tabs defaultValue="spending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="spending">Spending Analysis</TabsTrigger>
            <TabsTrigger value="categories">Category Breakdown</TabsTrigger>
            <TabsTrigger value="income-expense">Income & Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="spending" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Monthly Spending Trend</h2>
              <SpendingTrendChart />
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Category Comparison</h2>
              <CategoryComparisonChart />
            </Card>
          </TabsContent>

          <TabsContent value="income-expense" className="space-y-6">
            <IncomeExpenseAnalysis />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Analytics