import { AccountManager } from "@/components/AccountManager"
import { DashboardCard } from "@/components/DashboardCard"

const Accounts = () => {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">Manage your financial accounts</p>
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
        
        <AccountManager />
      </div>
    </div>
  )
}

export default Accounts