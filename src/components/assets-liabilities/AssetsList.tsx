
import { Card } from "@/components/ui/card"
import { Asset } from "@/types/assets-liabilities"
import { EditAssetDialog } from "./EditAssetDialog"
import { FamilyMember, BusinessEntity } from "@/types/entities"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"

interface AssetsListProps {
  assets: Asset[]
  onEditAsset?: (id: string, updatedAsset: Omit<Asset, "id">) => void
}

export function AssetsList({ assets, onEditAsset }: AssetsListProps) {
  // Fetch entities from Supabase
  const { data: entities = [] } = useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entities')
        .select('*')
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
