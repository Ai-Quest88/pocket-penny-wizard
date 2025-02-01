import { Card } from "@/components/ui/card"
import { Liability } from "@/types/assets-liabilities"

interface LiabilitiesListProps {
  liabilities: Liability[]
}

export function LiabilitiesList({ liabilities }: LiabilitiesListProps) {
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
      {liabilities.map((liability) => (
        <Card key={liability.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{liability.name}</h3>
              <div className="space-x-2">
                <span className="text-sm text-muted-foreground capitalize">{liability.type}</span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{formatCategory(liability.category)}</span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{getEntityName(liability.entityId)}</span>
              </div>
            </div>
            <p className="text-lg font-semibold text-red-600">
              ${liability.amount.toLocaleString()}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )
}