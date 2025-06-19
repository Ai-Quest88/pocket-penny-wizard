
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
import { Pencil } from "lucide-react"
import { useState } from "react"
import { Liability, LiabilityCategory, liabilityCategoryGroups } from "@/types/assets-liabilities"
import { useToast } from "@/components/ui/use-toast"
import { FamilyMember, BusinessEntity } from "@/types/entities"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"

interface EditLiabilityDialogProps {
  liability: Liability;
  onEditLiability: (id: string, updatedLiability: Omit<Liability, "id">) => void;
}

export function EditLiabilityDialog({ liability, onEditLiability }: EditLiabilityDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  
  // Get the most recent date from history, or use current date as fallback
  const latestHistoryDate = liability.history && liability.history.length > 0 
    ? liability.history[liability.history.length - 1].date.split('T')[0]
    : new Date().toISOString().split('T')[0]
    
  const [updateDate, setUpdateDate] = useState<string>(latestHistoryDate)
  
  const [formData, setFormData] = useState<Omit<Liability, "id">>({
    name: liability.name,
    amount: liability.amount,
    type: liability.type,
    category: liability.category,
    entityId: liability.entityId,
    history: liability.history
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

  const handleSubmit = () => {
    if (formData.name && formData.amount > 0) {
      const updatedLiability = {
        ...formData,
        history: [
          ...liability.history,
          { date: updateDate, value: formData.amount }
        ]
      }
      onEditLiability(liability.id, updatedLiability)
      setOpen(false)
      toast({
        title: "Liability Updated",
        description: "Your liability has been updated successfully.",
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Liability</DialogTitle>
        </DialogHeader>
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
            <Label htmlFor="liability-name">Liability Name</Label>
            <Input
              id="liability-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Credit Card"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="liability-type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: Liability["type"]) => setFormData({ ...formData, type: value })}
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
              value={formData.category}
              onValueChange={(value: LiabilityCategory) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {liabilityCategoryGroups[formData.type].map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="liability-amount">
              {formData.type === "credit" ? "Credit Limit" : "Amount"}
            </Label>
            <Input
              id="liability-amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              placeholder={formData.type === "credit" ? "Credit Limit" : "Amount"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="update-date">
              {formData.type === "credit" ? "Balance Update Date" : 
               formData.type === "mortgage" ? "Balance Update Date" : 
               "Update Date"}
            </Label>
            <Input
              id="update-date"
              type="date"
              value={updateDate}
              onChange={(e) => setUpdateDate(e.target.value)}
            />
          </div>
          
          <Button onClick={handleSubmit} className="w-full">Update Liability</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
