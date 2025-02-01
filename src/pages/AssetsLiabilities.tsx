import { useState } from "react"
import { Asset, Liability } from "@/types/assets-liabilities"
import { NetWorthSummary } from "@/components/assets-liabilities/NetWorthSummary"
import { AssetsList } from "@/components/assets-liabilities/AssetsList"
import { LiabilitiesList } from "@/components/assets-liabilities/LiabilitiesList"
import { AddAssetDialog } from "@/components/assets-liabilities/AddAssetDialog"
import { AddLiabilityDialog } from "@/components/assets-liabilities/AddLiabilityDialog"
import { HistoricalValueChart } from "@/components/assets-liabilities/HistoricalValueChart"

// Helper to generate past 12 months of sample data
const generateHistoricalData = (startValue: number, variance: number = 0.1) => {
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (11 - i))
    const randomChange = (Math.random() - 0.5) * 2 * variance
    const value = startValue * (1 + randomChange)
    return {
      date: date.toISOString(),
      value: Math.round(value)
    }
  })
}

export default function AssetsLiabilities() {
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: "1",
      name: "Savings Account",
      value: 25000,
      type: "cash",
      category: "savings_account",
      history: generateHistoricalData(25000)
    },
    {
      id: "2",
      name: "Investment Portfolio",
      value: 50000,
      type: "investment",
      category: "stocks",
      history: generateHistoricalData(50000)
    },
  ])

  const [liabilities, setLiabilities] = useState<Liability[]>([
    {
      id: "1",
      name: "Credit Card",
      amount: 2500,
      type: "credit",
      category: "credit_card",
      history: generateHistoricalData(2500)
    },
    {
      id: "2",
      name: "Car Loan",
      amount: 15000,
      type: "loan",
      category: "auto_loan",
      history: generateHistoricalData(15000)
    },
  ])

  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0)
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.amount, 0)
  const netWorth = totalAssets - totalLiabilities

  const handleAddAsset = (newAsset: Omit<Asset, "id" | "history">) => {
    const assetWithHistory = {
      ...newAsset,
      id: Date.now().toString(),
      history: generateHistoricalData(newAsset.value)
    }
    setAssets([...assets, assetWithHistory])
  }

  const handleAddLiability = (newLiability: Omit<Liability, "id" | "history">) => {
    const liabilityWithHistory = {
      ...newLiability,
      id: Date.now().toString(),
      history: generateHistoricalData(newLiability.amount)
    }
    setLiabilities([...liabilities, liabilityWithHistory])
  }

  // Combine all asset histories
  const combinedAssetHistory = assets[0]?.history.map((_, index) => ({
    date: assets[0].history[index].date,
    value: assets.reduce((sum, asset) => sum + asset.history[index].value, 0)
  })) || []

  // Combine all liability histories
  const combinedLiabilityHistory = liabilities[0]?.history.map((_, index) => ({
    date: liabilities[0].history[index].date,
    value: liabilities.reduce((sum, liability) => sum + liability.history[index].value, 0)
  })) || []

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-12">
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

        <div className="w-full">
          <HistoricalValueChart
            assetHistory={combinedAssetHistory}
            liabilityHistory={combinedLiabilityHistory}
          />
        </div>

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
