import { DashboardCard } from "@/components/DashboardCard"
import { LiabilitiesList } from "@/components/assets-liabilities/LiabilitiesList"
import { AddLiabilityDialog } from "@/components/assets-liabilities/AddLiabilityDialog"

const Liabilities = () => {
  const totalLiabilities = 38500;
  const monthlyChange = -1.5;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Liabilities</h1>
            <p className="text-muted-foreground">Manage your liabilities</p>
          </div>
          <AddLiabilityDialog />
        </header>

        <DashboardCard
          title="Total Liabilities"
          value={`$${totalLiabilities.toLocaleString()}`}
          trend={{ value: Math.abs(monthlyChange), isPositive: false }}
          className="bg-card"
        />

        <LiabilitiesList />
      </div>
    </div>
  )
}

export default Liabilities