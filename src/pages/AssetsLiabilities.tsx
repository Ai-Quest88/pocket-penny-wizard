import { useState } from "react"
import { Asset, Liability } from "@/types/assets-liabilities"
import { NetWorthSummary } from "@/components/assets-liabilities/NetWorthSummary"
import { AssetsList } from "@/components/assets-liabilities/AssetsList"
import { LiabilitiesList } from "@/components/assets-liabilities/LiabilitiesList"
import { AddAssetDialog } from "@/components/assets-liabilities/AddAssetDialog"
import { AddLiabilityDialog } from "@/components/assets-liabilities/AddLiabilityDialog"

export default function AssetsLiabilities() {
  const [assets, setAssets] = useState<Asset[]>([
    { id: "1", name: "Savings Account", value: 25000, type: "cash", category: "savings_account" },
    { id: "2", name: "Investment Portfolio", value: 50000, type: "investment", category: "stocks" },
  ])

  const [liabilities, setLiabilities] = useState<Liability[]>([
    { id: "1", name: "Credit Card", amount: 2500, type: "credit", category: "credit_card" },
    { id: "2", name: "Car Loan", amount: 15000, type: "loan", category: "auto_loan" },
  ])

  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0)
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.amount, 0)
  const netWorth = totalAssets - totalLiabilities

  const handleAddAsset = (newAsset: Omit<Asset, "id">) => {
    setAssets([...assets, { ...newAsset, id: Date.now().toString() }])
  }

  const handleAddLiability = (newLiability: Omit<Liability, "id">) => {
    setLiabilities([...liabilities, { ...newLiability, id: Date.now().toString() }])
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Assets & Liabilities</h1>
            <p className="text-muted-foreground">Track your net worth</p>
          </div>
        </header>

        <NetWorthSummary
          totalAssets={totalAssets}
          totalLiabilities={totalLiabilities}
          netWorth={netWorth}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Assets</h2>
              <AddAssetDialog onAddAsset={handleAddAsset} />
            </div>
            <AssetsList assets={assets} />
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Liabilities</h2>
              <AddLiabilityDialog onAddLiability={handleAddLiability} />
            </div>
            <LiabilitiesList liabilities={liabilities} />
          </div>
        </div>
      </div>
    </div>
  )
}