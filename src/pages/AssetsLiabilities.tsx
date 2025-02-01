import { useState } from "react"
import { Plus, DollarSign, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import { useToast } from "@/components/ui/use-toast"

interface Asset {
  id: string
  name: string
  value: number
  type: "cash" | "investment" | "property" | "vehicle" | "other"
}

interface Liability {
  id: string
  name: string
  amount: number
  type: "credit" | "loan" | "mortgage" | "other"
}

const AssetsLiabilities = () => {
  const { toast } = useToast()
  const [assets, setAssets] = useState<Asset[]>([
    { id: "1", name: "Savings Account", value: 25000, type: "cash" },
    { id: "2", name: "Investment Portfolio", value: 50000, type: "investment" },
  ])
  const [liabilities, setLiabilities] = useState<Liability[]>([
    { id: "1", name: "Credit Card", amount: 2500, type: "credit" },
    { id: "1", name: "Car Loan", amount: 15000, type: "loan" },
  ])

  const [newAsset, setNewAsset] = useState<Omit<Asset, "id">>({
    name: "",
    value: 0,
    type: "cash",
  })

  const [newLiability, setNewLiability] = useState<Omit<Liability, "id">>({
    name: "",
    amount: 0,
    type: "credit",
  })

  const handleAddAsset = () => {
    if (newAsset.name && newAsset.value > 0) {
      setAssets([...assets, { ...newAsset, id: Date.now().toString() }])
      setNewAsset({ name: "", value: 0, type: "cash" })
      toast({
        title: "Asset Added",
        description: "Your new asset has been added successfully.",
      })
    }
  }

  const handleAddLiability = () => {
    if (newLiability.name && newLiability.amount > 0) {
      setLiabilities([...liabilities, { ...newLiability, id: Date.now().toString() }])
      setNewLiability({ name: "", amount: 0, type: "credit" })
      toast({
        title: "Liability Added",
        description: "Your new liability has been added successfully.",
      })
    }
  }

  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0)
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.amount, 0)
  const netWorth = totalAssets - totalLiabilities

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Assets & Liabilities</h1>
            <p className="text-muted-foreground">Track your net worth</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Assets</h3>
            <p className="text-2xl font-semibold text-green-600">${totalAssets.toLocaleString()}</p>
          </Card>
          <Card className="p-6 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Liabilities</h3>
            <p className="text-2xl font-semibold text-red-600">${totalLiabilities.toLocaleString()}</p>
          </Card>
          <Card className="p-6 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Net Worth</h3>
            <p className={`text-2xl font-semibold ${netWorth >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${netWorth.toLocaleString()}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Assets</h2>
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
            </div>
            <div className="grid gap-4">
              {assets.map((asset) => (
                <Card key={asset.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{asset.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{asset.type}</p>
                    </div>
                    <p className="text-lg font-semibold text-green-600">
                      ${asset.value.toLocaleString()}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Liabilities</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Liability
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Liability</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="liability-name">Liability Name</Label>
                      <Input
                        id="liability-name"
                        value={newLiability.name}
                        onChange={(e) => setNewLiability({ ...newLiability, name: e.target.value })}
                        placeholder="e.g., Credit Card"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="liability-amount">Amount</Label>
                      <Input
                        id="liability-amount"
                        type="number"
                        value={newLiability.amount}
                        onChange={(e) => setNewLiability({ ...newLiability, amount: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="liability-type">Type</Label>
                      <Select
                        value={newLiability.type}
                        onValueChange={(value: Liability["type"]) => setNewLiability({ ...newLiability, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credit">Credit Card</SelectItem>
                          <SelectItem value="loan">Loan</SelectItem>
                          <SelectItem value="mortgage">Mortgage</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddLiability} className="w-full">Add Liability</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssetsLiabilities