import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Liability } from "@/types/assets-liabilities"
import { useState, useEffect } from "react"
import { FamilyMember, BusinessEntity } from "@/types/entities"
import { EditLiabilityDialog } from "./EditLiabilityDialog"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface LiabilitiesListProps {
  liabilities: Liability[]
  onEditLiability?: (id: string, updatedLiability: Omit<Liability, "id">) => void
  onDeleteLiability?: (id: string) => void
}

export function LiabilitiesList({ liabilities, onEditLiability, onDeleteLiability }: LiabilitiesListProps) {
  const [entities, setEntities] = useState<(FamilyMember | BusinessEntity)[]>([])

  useEffect(() => {
    const savedEntities = localStorage.getItem('entities')
    if (savedEntities) {
      setEntities(JSON.parse(savedEntities))
    }
  }, [])

  const formatCategory = (category: string) => {
    return category.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
  }

  const getEntityName = (entityId: string) => {
    const entity = entities.find(e => e.id === entityId)
    return entity ? entity.name : entityId
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
              {liability.type === "credit" && liability.creditLimit && (
                <div className="mt-2 space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Credit Utilization: {((liability.amount / liability.creditLimit) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Available Credit: ${(liability.creditLimit - liability.amount).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {liability.type === "credit" && liability.creditLimit ? (
                <div className="text-right">
                  <p className="text-lg font-semibold text-red-600">
                    ${liability.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    of ${liability.creditLimit.toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-lg font-semibold text-red-600">
                  ${liability.amount.toLocaleString()}
                </p>
              )}
              {onEditLiability && (
                <EditLiabilityDialog 
                  liability={liability} 
                  onEditLiability={onEditLiability}
                />
              )}
              {onDeleteLiability && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Liability</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{liability.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDeleteLiability(liability.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
