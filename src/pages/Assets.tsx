import { useState } from "react"
import { Asset } from "@/types/assets-liabilities"
import { AssetsList } from "@/components/assets-liabilities/AssetsList"
import { AddAssetDialog } from "@/components/assets-liabilities/AddAssetDialog"
import { HistoricalValueChart } from "@/components/assets-liabilities/HistoricalValueChart"
import { PropertyValueEstimate } from "@/components/PropertyValueEstimate"

const generateHistoricalData = (startValue: number, variance: number = 0.1) => {
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (11 - i))
    const randomChange = (Math.random() - 0.5) * 2 * variance
    const value = Math.round(startValue * (1 + randomChange))
    return {
      date: date.toISOString(),
      value: value
    }
  })
}

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: "1",
      entityId: "default",
      name: "Savings Account",
      value: 25000,
      type: "cash",
      category: "savings_account",
      history: generateHistoricalData(25000)
    },
    {
      id: "2",
      entityId: "default",
      name: "Investment Portfolio",
      value: 50000,
      type: "investment",
      category: "stocks",
      history: generateHistoricalData(50000)
    },
  ])

  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0)

  const handleAddAsset = (newAsset: Omit<Asset, "id">) => {
    const assetWithHistory = {
      ...newAsset,
      id: Date.now().toString(),
      history: generateHistoricalData(newAsset.value)
    }
    setAssets([...assets, assetWithHistory])
  }

  // Combine all asset histories
  const combinedAssetHistory = assets[0]?.history.map((_, index) => ({
    date: assets[0].history[index].date,
    value: assets.reduce((sum, asset) => sum + asset.history[index].value, 0)
  })) || []

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background to-background-muted overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full animate-[spin_100s_linear_infinite]">
          <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent opacity-30" />
        </div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full animate-[spin_80s_linear_infinite]">
          <div className="absolute inset-0 bg-gradient-radial from-accent/5 to-transparent opacity-30" />
        </div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full mix-blend-multiply animate-[pulse_10s_ease-in-out_infinite] blur-xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full mix-blend-multiply animate-[pulse_15s_ease-in-out_infinite] blur-xl" />
      </div>

      {/* Main content */}
      <div className="relative container p-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <header className="flex justify-between items-center bg-card/50 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-border/5">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Assets
              </h1>
              <p className="text-muted-foreground">Track your assets</p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="backdrop-blur-sm">
              <PropertyValueEstimate />
            </div>
            <div className="backdrop-blur-sm">
              <HistoricalValueChart
                assetHistory={combinedAssetHistory}
                liabilityHistory={[]}
              />
            </div>
          </div>

          <div className="space-y-6 backdrop-blur-sm">
            <div className="flex justify-between items-center bg-card/50 p-4 rounded-lg border border-border/5">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-success to-primary bg-clip-text text-transparent">
                Assets (Total: ${totalAssets.toLocaleString()})
              </h2>
              <AddAssetDialog onAddAsset={handleAddAsset} />
            </div>
            <AssetsList assets={assets} />
          </div>
        </div>
      </div>
    </div>
  )
}