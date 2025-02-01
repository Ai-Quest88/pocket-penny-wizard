import { useState, useEffect } from "react"
import { DashboardCard } from "@/components/DashboardCard"
import { AssetsList } from "@/components/assets-liabilities/AssetsList"
import { AddAssetDialog } from "@/components/assets-liabilities/AddAssetDialog"
import { Asset } from "@/types/assets-liabilities"
import { v4 as uuidv4 } from 'uuid'

const initialAssets: Asset[] = [
  {
    id: "1",
    entityId: "personal",
    name: "Primary Residence",
    value: 450000,
    type: "property",
    category: "residential",
    history: []
  },
  {
    id: "2",
    entityId: "business",
    name: "Investment Portfolio",
    value: 150000,
    type: "investment",
    category: "stocks",
    history: []
  },
  {
    id: "3",
    entityId: "personal",
    name: "Savings Account",
    value: 25000,
    type: "cash",
    category: "savings_account",
    history: []
  }
]

const Assets = () => {
  const [assets, setAssets] = useState<Asset[]>([])
  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0)
  const monthlyChange = 3.2 // This could be calculated based on historical data

  useEffect(() => {
    const savedAssets = localStorage.getItem('assets')
    if (savedAssets) {
      setAssets(JSON.parse(savedAssets))
    } else {
      setAssets(initialAssets)
      localStorage.setItem('assets', JSON.stringify(initialAssets))
    }
  }, [])

  const handleAddAsset = (newAsset: Omit<Asset, "id">) => {
    const assetWithId = {
      ...newAsset,
      id: uuidv4()
    }
    const updatedAssets = [...assets, assetWithId]
    setAssets(updatedAssets)
    localStorage.setItem('assets', JSON.stringify(updatedAssets))
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Assets</h1>
            <p className="text-muted-foreground">Manage your assets</p>
          </div>
          <AddAssetDialog onAddAsset={handleAddAsset} />
        </header>

        <DashboardCard
          title="Total Assets"
          value={`$${totalAssets.toLocaleString()}`}
          trend={{ value: monthlyChange, isPositive: true }}
          className="bg-card"
        />

        <AssetsList assets={assets} />
      </div>
    </div>
  )
}

export default Assets