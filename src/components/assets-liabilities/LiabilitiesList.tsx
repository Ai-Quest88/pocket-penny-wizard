import { Card } from "@/components/ui/card"
import { Liability } from "@/types/assets-liabilities"

interface LiabilitiesListProps {
  liabilities: Liability[]
}

export function LiabilitiesList({ liabilities }: LiabilitiesListProps) {
  return (
    <div className="grid gap-4">
      {liabilities.map((liability) => (
        <Card key={liability.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{liability.name}</h3>
              <p className="text-sm text-muted-foreground capitalize">{liability.type}</p>
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