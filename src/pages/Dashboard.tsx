import { TransactionList } from "@/components/TransactionList"
import { SpendingTrendChart } from "@/components/SpendingTrendChart"
import { NetWorthWidget } from "@/components/NetWorthWidget"
import { IncomeExpenseAnalysis } from "@/components/budgets/IncomeExpenseAnalysis"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { CategoryComparisonChart } from "@/components/CategoryComparisonChart"

const Dashboard = () => {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-text">Financial Overview</h1>
          <p className="text-text-muted">Track your spending and savings</p>
        </header>

        <NetWorthWidget />

        <Card className="p-6">
          <Tabs defaultValue="transactions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="income-expense">Income & Expense</TabsTrigger>
              <TabsTrigger value="spending-trend">Spending Trend</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions" className="mt-4">
              <TransactionList />
            </TabsContent>
            
            <TabsContent value="income-expense" className="mt-4">
              <IncomeExpenseAnalysis />
            </TabsContent>
            
            <TabsContent value="spending-trend" className="mt-4">
              <div className="bg-white rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Spending Trend</h3>
                <SpendingTrendChart />
              </div>
            </TabsContent>

            <TabsContent value="categories" className="mt-4">
              <div className="bg-white rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
                <CategoryComparisonChart />
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard