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
import { useState, useEffect } from "react"
import { Asset, AssetCategory, assetCategoryGroups } from "@/types/assets-liabilities"
import { useToast } from "@/components/ui/use-toast"

interface AddAssetDialogProps {
  onAddAsset: (asset: Omit<Asset, "id">) => void
}

interface PropertyAddress {
  street: string
  city: string
  state: string
  zipCode: string
}

export function AddAssetDialog({ onAddAsset }: AddAssetDialogProps) {
  const { toast } = useToast()
  const [newAsset, setNewAsset] = useState<Omit<Asset, "id">>({
    name: "",
    value: 0,
    type: "cash",
    category: "savings_account",
    history: [{ date: new Date().toISOString(), value: 0 }]
  })

  const [propertyAddress, setPropertyAddress] = useState<PropertyAddress>({
    street: "",
    city: "",
    state: "",
    zipCode: ""
  })

  // Update category when type changes
  useEffect(() => {
    const categories = assetCategoryGroups[newAsset.type]
    setNewAsset(prev => ({
      ...prev,
      category: categories[0] as AssetCategory
    }))
  }, [newAsset.type])

  const handleAddAsset = () => {
    if (newAsset.name && newAsset.value > 0) {
      const assetWithHistory = {
        ...newAsset,
        history: [{ date: new Date().toISOString(), value: newAsset.value }],
        ...(newAsset.type === "property" && { address: propertyAddress })
      }
      onAddAsset(assetWithHistory)
      setNewAsset({
        name: "",
        value: 0,
        type: "cash",
        category: "savings_account",
        history: [{ date: new Date().toISOString(), value: 0 }]
      })
      setPropertyAddress({
        street: "",
        city: "",
        state: "",
        zipCode: ""
      })
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
            <Label htmlFor="asset-name">Asset Name</Label>
            <Input
              id="asset-name"
              value={newAsset.name}
              onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
              placeholder="e.g., Savings Account"
            />
          </div>
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

          {newAsset.type === "property" && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium">Property Address</h3>
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={propertyAddress.street}
                  onChange={(e) => setPropertyAddress({ ...propertyAddress, street: e.target.value })}
                  placeholder="123 Main St"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={propertyAddress.city}
                  onChange={(e) => setPropertyAddress({ ...propertyAddress, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={propertyAddress.state}
                  onChange={(e) => setPropertyAddress({ ...propertyAddress, state: e.target.value })}
                  placeholder="State"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={propertyAddress.zipCode}
                  onChange={(e) => setPropertyAddress({ ...propertyAddress, zipCode: e.target.value })}
                  placeholder="ZIP Code"
                />
              </div>
            </div>
          )}
          
          <Button onClick={handleAddAsset} className="w-full">Add Asset</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}