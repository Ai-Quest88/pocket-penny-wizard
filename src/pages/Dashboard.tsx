import { DashboardCard } from "@/components/DashboardCard"
import { ExpenseChart } from "@/components/ExpenseChart"
import { TransactionList } from "@/components/TransactionList"
import { SpendingTrendChart } from "@/components/SpendingTrendChart"
import { CategoryComparisonChart } from "@/components/CategoryComparisonChart"
import { NetWorthWidget } from "@/components/NetWorthWidget"

const Dashboard = () => {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-text">Financial Overview</h1>
          <p className="text-text-muted">Track your spending and savings</p>
        </header>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NetWorthWidget />
          <TransactionList />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Spending Trend</h3>
            <SpendingTrendChart />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Category Comparison</h3>
            <CategoryComparisonChart />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard