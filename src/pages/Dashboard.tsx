import { DashboardCard } from "@/components/DashboardCard"
import { TransactionList } from "@/components/TransactionList"
import { SpendingTrendChart } from "@/components/SpendingTrendChart"
import { NetWorthWidget } from "@/components/NetWorthWidget"
import { IncomeExpenseAnalysis } from "@/components/budgets/IncomeExpenseAnalysis"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"

const Dashboard = () => {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-text">Financial Overview</h1>
          <p className="text-text-muted">Track your spending and savings</p>
        </header>

        <NetWorthWidget />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardCard
            title="Total Balance"
            value="$5,240.50"
            trend={{ value: 12, isPositive: true }}
          />
          <DashboardCard
            title="Monthly Income"
            value="$3,850.00"
            trend={{ value: 8, isPositive: true }}
          />
          <DashboardCard
            title="Monthly Expenses"
            value="$2,120.30"
            trend={{ value: 5, isPositive: false }}
          />
        </div>

        <Card className="p-6">
          <Tabs defaultValue="transactions" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-[400px]">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="income-expense">Income & Expense</TabsTrigger>
              <TabsTrigger value="spending-trend">Spending Trend</TabsTrigger>
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
          </Tabs>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard