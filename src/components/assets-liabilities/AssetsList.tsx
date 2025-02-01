import { Card } from "@/components/ui/card"
import { Asset } from "@/types/assets-liabilities"

interface AssetsListProps {
  assets: Asset[]
}

export function AssetsList({ assets }: AssetsListProps) {
  const formatCategory = (category: string) => {
    return category.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
  }

  const getEntityName = (entityId: string) => {
    switch (entityId) {
      case "personal":
        return "Personal";
      case "business":
        return "Business";
      default:
        return entityId;
    }
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
            <p className="text-lg font-semibold text-green-600">
              ${asset.value.toLocaleString()}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )
}