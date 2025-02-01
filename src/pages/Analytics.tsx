import { Card } from "@/components/ui/card"
import { SpendingTrendChart } from "@/components/SpendingTrendChart"
import { CategoryComparisonChart } from "@/components/CategoryComparisonChart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const Analytics = () => {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-text">Analytics</h1>
          <p className="text-text-muted">Track and analyze your financial patterns</p>
        </header>

        <Tabs defaultValue="spending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="spending">Spending Analysis</TabsTrigger>
            <TabsTrigger value="categories">Category Breakdown</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  )
}

export default Analytics