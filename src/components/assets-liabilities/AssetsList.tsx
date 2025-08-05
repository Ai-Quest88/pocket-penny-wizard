import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Asset } from "@/types/assets-liabilities"
import { EditAssetDialog } from "./EditAssetDialog"
import { FamilyMember, BusinessEntity } from "@/types/entities"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import { useCurrency } from "@/contexts/CurrencyContext"
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

interface AssetsListProps {
  assets: Asset[]
  onEditAsset?: (id: string, updatedAsset: Omit<Asset, "id">) => void
  onDeleteAsset?: (id: string) => void
}

export function AssetsList({ assets, onEditAsset, onDeleteAsset }: AssetsListProps) {
  const { session } = useAuth()
  const { formatCurrency } = useCurrency()
  
  // Fetch entities from Supabase
  const { data: entities = [] } = useQuery({
    queryKey: ['entities', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];


      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching entities:', error);
        throw error;
      }

      return data.map(entity => ({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        description: entity.description || '',
        taxIdentifier: entity.tax_identifier || '',
        countryOfResidence: entity.country_of_residence,
        dateAdded: entity.date_added,
        relationship: entity.relationship || '',
        dateOfBirth: entity.date_of_birth || '',
        registrationNumber: entity.registration_number || '',
        incorporationDate: entity.incorporation_date || '',
      })) as (FamilyMember | BusinessEntity)[];
    },
  });

  const formatCategory = (category: string) => {
    return category.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
  }

  const getEntityName = (entityId: string) => {
    const entity = entities.find(e => e.id === entityId)
    return entity ? entity.name : 'Unknown Entity'
  }

  return (
    <div className="grid gap-4">
      {assets.map((asset) => (
        <Card key={asset.id} className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-medium">{asset.name}</h3>
              <div className="space-x-2">
                <span className="text-sm text-muted-foreground capitalize">{asset.type}</span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{formatCategory(asset.category)}</span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground font-medium">{getEntityName(asset.entityId)}</span>
              </div>
              {asset.accountNumber && (
                <div className="mt-1">
                  <span className="text-sm text-muted-foreground">Account: {asset.accountNumber}</span>
                </div>
              )}
              {asset.address && (
                <div className="mt-1">
                  <span className="text-sm text-muted-foreground">Address: {asset.address}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onEditAsset && <EditAssetDialog asset={asset} onEditAsset={onEditAsset} />}
              {onDeleteAsset && (
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
                      <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{asset.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDeleteAsset(asset.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(asset.value)}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
