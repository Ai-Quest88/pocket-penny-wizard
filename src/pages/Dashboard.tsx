import { TransactionList } from "@/components/TransactionList"
import { SpendingTrendChart } from "@/components/SpendingTrendChart"
import { NetWorthWidget } from "@/components/NetWorthWidget"
import { IncomeExpenseAnalysis } from "@/components/budgets/IncomeExpenseAnalysis"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { CategoryComparisonChart } from "@/components/CategoryComparisonChart"
import { HistoricalValueChart } from "@/components/assets-liabilities/HistoricalValueChart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

const mockData = {
  assetHistory: [
    { date: "2024-01-01", value: 50000 },
    { date: "2024-02-01", value: 52000 },
    { date: "2024-03-01", value: 55000 },
  ],
  liabilityHistory: [
    { date: "2024-01-01", value: 20000 },
    { date: "2024-02-01", value: 19500 },
    { date: "2024-03-01", value: 19000 },
  ],
};

const Dashboard = () => {
  const [selectedEntityType, setSelectedEntityType] = useState<string>("all")

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-text">Financial Overview</h1>
              <p className="text-text-muted">Track your spending and savings</p>
            </div>
            <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by entity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="trust">Trust</SelectItem>
                <SelectItem value="super_fund">Super Fund</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        <NetWorthWidget />

        <Card className="p-6">
          <Tabs defaultValue="transactions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="income-expense">Income & Expense</TabsTrigger>
              <TabsTrigger value="spending-trend">Spending Trend</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="historical">Historical Net Worth</TabsTrigger>
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

            <TabsContent value="historical" className="mt-4">
              <HistoricalValueChart 
                assetHistory={mockData.assetHistory}
                liabilityHistory={mockData.liabilityHistory}
              />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard