import { Card } from "@/components/ui/card"
import { Asset } from "@/types/assets-liabilities"
import { EditAssetDialog } from "./EditAssetDialog"

interface AssetsListProps {
  assets: Asset[]
  onEditAsset?: (id: string, updatedAsset: Omit<Asset, "id">) => void
}

export function AssetsList({ assets, onEditAsset }: AssetsListProps) {
  const formatCategory = (category: string) => {
    return category.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
  }

  const getEntityName = (entityId: string) => {
    const entities = JSON.parse(localStorage.getItem('entities') || '[]')
    const entity = entities.find((e: any) => e.id === entityId)
    return entity ? entity.name : entityId
  }

  return (
    <div className="grid gap-4">
      {assets.map((asset) => (
        <Card key={asset.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{asset.name}</h3>
              <div className="space-x-2">
                <span className="text-sm text-muted-foreground capitalize">{asset.type}</span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{formatCategory(asset.category)}</span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{getEntityName(asset.entityId)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onEditAsset && <EditAssetDialog asset={asset} onEditAsset={onEditAsset} />}
              <p className="text-lg font-semibold text-green-600">
                ${asset.value.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}