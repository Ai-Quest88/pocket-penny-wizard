import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Asset } from "@/types/assets-liabilities"
import { EditAssetDialog } from "./EditAssetDialog"
import { FamilyMember, BusinessEntity } from "@/types/entities"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { Trash2, Link, Banknote, TrendingUp, Home, Car, Building2 } from "lucide-react"
import { useCurrency } from "@/contexts/CurrencyContext"
import { AccountTypeIndicator } from "@/components/accounts/AccountTypeIndicator"
import { Badge } from "@/components/ui/badge"
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

  const isTransactionalAccount = (category: string) => {
    return ['savings_account', 'checking_account'].includes(category)
  }

  return (
    <div className="space-y-6">
      {/* Transactional Accounts Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Banknote className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Bank Accounts</h3>
          <Badge variant="outline" className="text-xs">
            Can link to transactions
          </Badge>
        </div>
        <div className="grid gap-4">
          {assets.filter(asset => isTransactionalAccount(asset.category)).map((asset) => (
            <Card key={asset.id} className="p-4 border-l-4 border-l-green-500">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{asset.name}</h3>
                    <div className="flex items-center">
                      <Link className="h-4 w-4 text-green-600" />
                      <span className="sr-only">Linked to transactions</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <AccountTypeIndicator 
                      type={asset.type} 
                      category={asset.category}
                      accountType="asset"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span className="font-medium">{getEntityName(asset.entityId)}</span>
                    </div>
                    {asset.accountNumber && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Account: {asset.accountNumber}</span>
                      </div>
                    )}
                  </div>
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
                            Are you sure you want to delete "{asset.name}"? This action cannot be undone and will affect transaction history.
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
                  <div className="text-right">
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(asset.value)}
                    </p>
                    <p className="text-xs text-muted-foreground">Current Balance</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Investment Assets Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Investment Assets</h3>
        </div>
        <div className="grid gap-4">
          {assets.filter(asset => asset.type === 'investment').map((asset) => (
            <Card key={asset.id} className="p-4 border-l-4 border-l-blue-500">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium">{asset.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <AccountTypeIndicator 
                      type={asset.type} 
                      category={asset.category}
                      accountType="asset"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span className="font-medium">{getEntityName(asset.entityId)}</span>
                    </div>
                  </div>
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
                  <div className="text-right">
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(asset.value)}
                    </p>
                    <p className="text-xs text-muted-foreground">Market Value</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Property Assets Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Home className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Property Assets</h3>
        </div>
        <div className="grid gap-4">
          {assets.filter(asset => asset.type === 'property').map((asset) => (
            <Card key={asset.id} className="p-4 border-l-4 border-l-purple-500">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium">{asset.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <AccountTypeIndicator 
                      type={asset.type} 
                      category={asset.category}
                      accountType="asset"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span className="font-medium">{getEntityName(asset.entityId)}</span>
                    </div>
                    {asset.address && (
                      <div className="text-sm text-muted-foreground">
                        Address: {asset.address}
                      </div>
                    )}
                  </div>
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
                  <div className="text-right">
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(asset.value)}
                    </p>
                    <p className="text-xs text-muted-foreground">Estimated Value</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Other Assets Section */}
      {assets.filter(asset => !['cash', 'investment', 'property'].includes(asset.type)).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Car className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold">Other Assets</h3>
          </div>
          <div className="grid gap-4">
            {assets.filter(asset => !['cash', 'investment', 'property'].includes(asset.type)).map((asset) => (
              <Card key={asset.id} className="p-4 border-l-4 border-l-orange-500">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium">{asset.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <AccountTypeIndicator 
                        type={asset.type} 
                        category={asset.category}
                        accountType="asset"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span className="font-medium">{getEntityName(asset.entityId)}</span>
                      </div>
                    </div>
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
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(asset.value)}
                      </p>
                      <p className="text-xs text-muted-foreground">Current Value</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
