
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pencil } from "lucide-react"
import { useState } from "react"
import { Asset, AssetCategory, assetCategoryGroups } from "@/types/assets-liabilities"
import { useToast } from "@/components/ui/use-toast"
import { FamilyMember, BusinessEntity } from "@/types/entities"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useQuery } from "@tanstack/react-query"

interface EditAssetDialogProps {
  asset: Asset;
  onEditAsset: (id: string, updatedAsset: Omit<Asset, "id">) => void;
}

export function EditAssetDialog({ asset, onEditAsset }: EditAssetDialogProps) {
  const { session } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  
  const [formData, setFormData] = useState<Omit<Asset, "id">>({
    name: asset.name,
    value: asset.value,
    type: asset.type,
    category: asset.category,
    entityId: asset.entityId,
    history: asset.history,
    accountNumber: asset.accountNumber || "",
    address: asset.address || "",
    openingBalance: asset.openingBalance || 0,
    openingBalanceDate: asset.openingBalanceDate || new Date().toISOString().split('T')[0],
    currency: asset.currency,
    country: asset.country
  })

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
        dateOfBirth: entity.date_of_birth || '',
        registrationNumber: entity.registration_number || '',
        incorporationDate: entity.incorporation_date || '',
      })) as (FamilyMember | BusinessEntity)[];
    },
  });

  const handleSubmit = () => {
    if (formData.name && (formData.type === "cash" || formData.value > 0)) {
      onEditAsset(asset.id, formData)
      setOpen(false)
      toast({
        title: "Asset Updated",
        description: "Your asset has been updated successfully.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="entity">Entity</Label>
            <Select
              value={formData.entityId}
              onValueChange={(value) => setFormData({ ...formData, entityId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select entity" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asset-name">Asset Name</Label>
            <Input
              id="asset-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Savings Account"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="asset-type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: Asset["type"]) => {
                const newFormData = { ...formData, type: value };
                // Reset category when type changes
                if (assetCategoryGroups[value] && assetCategoryGroups[value].length > 0) {
                  newFormData.category = assetCategoryGroups[value][0];
                }
                setFormData(newFormData);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="property">Property</SelectItem>
                <SelectItem value="vehicle">Vehicle</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asset-category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value: AssetCategory) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {assetCategoryGroups[formData.type]?.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.type === "cash" && (
            <div className="space-y-2">
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                value={formData.accountNumber || ""}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="e.g., 1234567890"
              />
            </div>
          )}

          {formData.type === "property" && (
            <div className="space-y-2">
              <Label htmlFor="address">Property Address</Label>
              <Input
                id="address"
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g., 123 Main St, City, State"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="opening-balance">Opening Balance</Label>
            <Input
              id="opening-balance"
              type="text"
              value={formData.openingBalance}
              onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="opening-balance-date">Opening Balance Date</Label>
            <Input
              id="opening-balance-date"
              type="date"
              value={formData.openingBalanceDate}
              onChange={(e) => setFormData({ ...formData, openingBalanceDate: e.target.value })}
            />
          </div>

          {formData.type !== "cash" && (
            <div className="space-y-2">
              <Label htmlFor="current-value">Current Value</Label>
              <Input
                id="current-value"
                type="text"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          )}
          
            <Button onClick={handleSubmit} className="w-full">Update Asset</Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
