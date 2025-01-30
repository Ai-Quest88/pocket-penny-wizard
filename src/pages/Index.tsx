import { DashboardCard } from "@/components/DashboardCard";
import { ExpenseChart } from "@/components/ExpenseChart";
import { TransactionList } from "@/components/TransactionList";

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-8">
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
          <ExpenseChart />
          <TransactionList />
        </div>
      </div>
    </div>
  );
};

export default Index;