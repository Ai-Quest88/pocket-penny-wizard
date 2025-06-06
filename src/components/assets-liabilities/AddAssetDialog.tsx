
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { useState } from "react"
import { Asset, AssetCategory, assetCategoryGroups } from "@/types/assets-liabilities"
import { useToast } from "@/components/ui/use-toast"
import { FamilyMember, BusinessEntity } from "@/types/entities"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"

interface AddAssetDialogProps {
  onAddAsset: (asset: Omit<Asset, "id">) => void
}

export function AddAssetDialog({ onAddAsset }: AddAssetDialogProps) {
  const { toast } = useToast()
  const [selectedEntityId, setSelectedEntityId] = useState<string>("")
  const [newAsset, setNewAsset] = useState<Omit<Asset, "id">>({
    name: "",
    value: 0,
    type: "cash",
    category: "savings_account",
    entityId: "",
    history: [{ date: new Date().toISOString(), value: 0 }]
  })

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

  const handleAddAsset = () => {
    if (!selectedEntityId) {
      toast({
        title: "Error",
        description: "Please select an entity",
        variant: "destructive"
      })
      return
    }

    if (newAsset.name && (newAsset.type === "cash" || newAsset.value > 0)) {
      const assetWithEntity = {
        ...newAsset,
        entityId: selectedEntityId,
        value: newAsset.type === "cash" ? 0 : newAsset.value,
        history: [{ date: new Date().toISOString(), value: newAsset.type === "cash" ? 0 : newAsset.value }]
      }
      onAddAsset(assetWithEntity)
      setNewAsset({
        name: "",
        value: 0,
        type: "cash",
        category: "savings_account",
        entityId: "",
        history: [{ date: new Date().toISOString(), value: 0 }]
      })
      setSelectedEntityId("")
      toast({
        title: "Asset Added",
        description: "Your new asset has been added successfully.",
      })
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="entity">Entity</Label>
            <Select
              value={selectedEntityId}
              onValueChange={setSelectedEntityId}
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
              value={newAsset.name}
              onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
              placeholder="e.g., Savings Account"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="asset-type">Type</Label>
            <Select
              value={newAsset.type}
              onValueChange={(value: Asset["type"]) => setNewAsset({ ...newAsset, type: value })}
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

          {newAsset.type !== "cash" && (
            <div className="space-y-2">
              <Label htmlFor="asset-value">Value</Label>
              <Input
                id="asset-value"
                type="number"
                value={newAsset.value}
                onChange={(e) => setNewAsset({ ...newAsset, value: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="asset-category">Category</Label>
            <Select
              value={newAsset.category}
              onValueChange={(value: AssetCategory) => setNewAsset({ ...newAsset, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {assetCategoryGroups[newAsset.type].map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={handleAddAsset} className="w-full">Add Asset</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
