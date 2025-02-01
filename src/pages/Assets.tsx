import { DashboardCard } from "@/components/DashboardCard"
import { AssetsList } from "@/components/assets-liabilities/AssetsList"
import { AddAssetDialog } from "@/components/assets-liabilities/AddAssetDialog"

const Assets = () => {
  const totalAssets = 107000;
  const monthlyChange = 3.2;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Assets</h1>
            <p className="text-muted-foreground">Manage your assets</p>
          </div>
          <AddAssetDialog />
        </header>

        <DashboardCard
          title="Total Assets"
          value={`$${totalAssets.toLocaleString()}`}
          trend={{ value: monthlyChange, isPositive: true }}
          className="bg-card"
        />

        <AssetsList />
      </div>
    </div>
  )
}

export default Assets