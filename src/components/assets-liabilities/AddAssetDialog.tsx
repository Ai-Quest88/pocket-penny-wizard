
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const [open, setOpen] = useState(false)
  const [selectedEntityId, setSelectedEntityId] = useState<string>("")
  const [openingBalanceDate, setOpeningBalanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [newAsset, setNewAsset] = useState<Omit<Asset, "id">>({
    name: "",
    value: 0,
    type: "cash",
    category: "savings_account",
    entityId: "",
    history: [{ date: new Date().toISOString(), value: 0 }],
    accountNumber: "",
    address: "",
    openingBalance: 0,
    openingBalanceDate: new Date().toISOString().split('T')[0]
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

    if (newAsset.name && newAsset.value >= 0) {
      const assetWithEntity = {
        ...newAsset,
        entityId: selectedEntityId,
        openingBalance: newAsset.value,
        openingBalanceDate: openingBalanceDate,
        history: [{ date: openingBalanceDate, value: newAsset.value }]
      }
      onAddAsset(assetWithEntity)
      setNewAsset({
        name: "",
        value: 0,
        type: "cash",
        category: "savings_account",
        entityId: "",
        history: [{ date: new Date().toISOString(), value: 0 }],
        accountNumber: "",
        address: "",
        openingBalance: 0,
        openingBalanceDate: new Date().toISOString().split('T')[0]
      })
      setOpeningBalanceDate(new Date().toISOString().split('T')[0])
      setSelectedEntityId("")
      setOpen(false)
      toast({
        title: "Asset Added",
        description: "Your new asset has been added successfully.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
          <DialogDescription>
            Create a new asset and assign it to an entity.
          </DialogDescription>
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

          {newAsset.type === "cash" && (
            <div className="space-y-2">
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                value={newAsset.accountNumber || ""}
                onChange={(e) => setNewAsset({ ...newAsset, accountNumber: e.target.value })}
                placeholder="e.g., 1234567890"
              />
            </div>
          )}

          {newAsset.type === "property" && (
            <div className="space-y-2">
              <Label htmlFor="address">Property Address</Label>
              <Input
                id="address"
                value={newAsset.address || ""}
                onChange={(e) => setNewAsset({ ...newAsset, address: e.target.value })}
                placeholder="e.g., 123 Main St, City, State"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="asset-value">
              {newAsset.type === "cash" ? "Opening Balance" : "Value"}
            </Label>
            <Input
              id="asset-value"
              type="number"
              step="0.01"
              value={newAsset.value}
              onChange={(e) => setNewAsset({ ...newAsset, value: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="opening-balance-date">
              {newAsset.type === "cash" ? "Opening Balance Date" : "Value Date"}
            </Label>
            <Input
              id="opening-balance-date"
              type="date"
              value={openingBalanceDate}
              onChange={(e) => setOpeningBalanceDate(e.target.value)}
            />
          </div>

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
