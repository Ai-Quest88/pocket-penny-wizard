import { useState, useEffect } from "react"
import { DashboardCard } from "@/components/DashboardCard"
import { AssetsList } from "@/components/assets-liabilities/AssetsList"
import { AddAssetDialog } from "@/components/assets-liabilities/AddAssetDialog"
import { Asset } from "@/types/assets-liabilities"
import { v4 as uuidv4 } from 'uuid'
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  const { toast } = useToast()
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedEntity, setSelectedEntity] = useState<string>("all")
  const [entities, setEntities] = useState<any[]>([])
  const totalAssets = assets
    .filter(asset => selectedEntity === "all" || asset.entityId === selectedEntity)
    .reduce((sum, asset) => sum + asset.value, 0)
  const monthlyChange = 3.2

  useEffect(() => {
    const savedAssets = localStorage.getItem('assets')
    if (savedAssets) {
      setAssets(JSON.parse(savedAssets))
    } else {
      setAssets(initialAssets)
      localStorage.setItem('assets', JSON.stringify(initialAssets))
    }

    // Load entities
    const savedEntities = localStorage.getItem('entities')
    if (savedEntities) {
      setEntities(JSON.parse(savedEntities))
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

  const handleEditAsset = (id: string, updatedAsset: Omit<Asset, "id">) => {
    const updatedAssets = assets.map(asset => 
      asset.id === id ? { ...updatedAsset, id } : asset
    )
    setAssets(updatedAssets)
    localStorage.setItem('assets', JSON.stringify(updatedAssets))
    toast({
      title: "Asset Updated",
      description: "The asset has been updated successfully.",
    })
  }

  const filteredAssets = assets.filter(
    asset => selectedEntity === "all" || asset.entityId === selectedEntity
  )

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

        <div className="flex items-center justify-between">
          <DashboardCard
            title="Total Assets"
            value={`$${totalAssets.toLocaleString()}`}
            trend={{ value: monthlyChange, isPositive: true }}
            className="flex-1 mr-4"
          />
          
          <Select
            value={selectedEntity}
            onValueChange={setSelectedEntity}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {entities.map((entity) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AssetsList assets={filteredAssets} onEditAsset={handleEditAsset} />
      </div>
    </div>
  )
}

export default Assets