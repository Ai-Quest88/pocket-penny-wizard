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
import { Asset } from "@/types/assets-liabilities"
import { useToast } from "@/components/ui/use-toast"

interface AddAssetDialogProps {
  onAddAsset: (asset: Omit<Asset, "id">) => void
}

export function AddAssetDialog({ onAddAsset }: AddAssetDialogProps) {
  const { toast } = useToast()
  const [newAsset, setNewAsset] = useState<Omit<Asset, "id">>({
    name: "",
    value: 0,
    type: "cash",
  })

  const handleAddAsset = () => {
    if (newAsset.name && newAsset.value > 0) {
      onAddAsset(newAsset)
      setNewAsset({ name: "", value: 0, type: "cash" })
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
          <Button onClick={handleAddAsset} className="w-full">Add Asset</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}