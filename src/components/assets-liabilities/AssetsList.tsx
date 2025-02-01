import { Card } from "@/components/ui/card"
import { Asset } from "@/types/assets-liabilities"

interface AssetsListProps {
  assets: Asset[]
}

export function AssetsList({ assets }: AssetsListProps) {
  return (
    <div className="grid gap-4">
      {assets.map((asset) => (
        <Card key={asset.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{asset.name}</h3>
              <p className="text-sm text-muted-foreground capitalize">{asset.type}</p>
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