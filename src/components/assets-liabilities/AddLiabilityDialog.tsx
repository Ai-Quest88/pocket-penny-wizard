
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
import { Liability, LiabilityCategory, liabilityCategoryGroups } from "@/types/assets-liabilities"
import { useToast } from "@/hooks/use-toast"
import { FamilyMember, BusinessEntity } from "@/types/entities"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"

interface AddLiabilityDialogProps {
  onAddLiability: (liability: Omit<Liability, "id">) => void
}

export function AddLiabilityDialog({ onAddLiability }: AddLiabilityDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [selectedEntityId, setSelectedEntityId] = useState<string>("")
  const [newLiability, setNewLiability] = useState<Omit<Liability, "id">>({
    name: "",
    amount: 0,
    type: "credit",
    category: "credit_card",
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

  const handleAddLiability = () => {
    if (!selectedEntityId) {
      toast({
        title: "Error",
        description: "Please select an entity",
        variant: "destructive"
      })
      return
    }

    if (newLiability.name && newLiability.amount > 0) {
      const liabilityWithEntity = {
        ...newLiability,
        entityId: selectedEntityId,
        history: [{ date: new Date().toISOString(), value: newLiability.amount }]
      }
      onAddLiability(liabilityWithEntity)
      
      // Reset form and close dialog
      setNewLiability({
        name: "",
        amount: 0,
        type: "credit",
        category: "credit_card",
        entityId: "",
        history: [{ date: new Date().toISOString(), value: 0 }]
      })
      setSelectedEntityId("")
      setOpen(false)
      
      toast({
        title: "Liability Added",
        description: "Your new liability has been added successfully.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

          <div className="space-y-2">
            <Label htmlFor="liability-category">Category</Label>
            <Select
              value={newLiability.category}
              onValueChange={(value: LiabilityCategory) => setNewLiability({ ...newLiability, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {liabilityCategoryGroups[newLiability.type].map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={handleAddLiability} className="w-full">Add Liability</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
