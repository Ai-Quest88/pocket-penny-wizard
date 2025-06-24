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
  
  const [formData, setFormData] = useState<Omit<Liability, "id">>({
    name: liability.name,
    amount: liability.amount,
    type: liability.type,
    category: liability.category,
    entityId: liability.entityId,
    history: liability.history,
    accountNumber: liability.accountNumber || "",
    interestRate: liability.interestRate,
    termMonths: liability.termMonths,
    monthlyPayment: liability.monthlyPayment,
    openingBalance: liability.openingBalance || 0,
    openingBalanceDate: liability.openingBalanceDate || new Date().toISOString().split('T')[0],
    creditLimit: liability.creditLimit || 0
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
    if (!formData.name || !formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a liability name",
        variant: "destructive"
      })
      return
    }

    // Validate amounts based on liability type
    if (formData.type === "credit") {
      if (!formData.creditLimit || formData.creditLimit <= 0) {
        toast({
          title: "Error", 
          description: "Please enter a valid credit limit greater than 0",
          variant: "destructive"
        })
        return
      }
      if (formData.openingBalance < 0) {
        toast({
          title: "Error", 
          description: "Opening balance cannot be negative",
          variant: "destructive"
        })
        return
      }
      if (formData.openingBalance > formData.creditLimit) {
        toast({
          title: "Error", 
          description: "Outstanding balance cannot exceed credit limit",
          variant: "destructive"
        })
        return
      }
    } else {
      // For loans, mortgages, and other liabilities
      if (formData.amount <= 0) {
        toast({
          title: "Error", 
          description: "Please enter a valid original amount greater than 0",
          variant: "destructive"
        })
        return
      }
      if (formData.openingBalance < 0) {
        toast({
          title: "Error", 
          description: "Current outstanding balance cannot be negative",
          variant: "destructive"
        })
        return
      }
      if (formData.openingBalance > formData.amount) {
        toast({
          title: "Error", 
          description: "Current outstanding balance cannot exceed original amount",
          variant: "destructive"
        })
        return
      }
    }

    onEditLiability(liability.id, formData)
    setOpen(false)
    toast({
      title: "Liability Updated",
      description: "Your liability has been updated successfully.",
    })
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

          {(formData.type === "credit" || formData.type === "loan") && (
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

          {formData.type === "credit" ? (
            // Credit Card Fields: Credit Limit and Opening Balance
            <>
              <div className="space-y-2">
                <Label htmlFor="credit-limit">Credit Limit</Label>
                <Input
                  id="credit-limit"
                  type="number"
                  step="0.01"
                  value={formData.creditLimit || 0}
                  onChange={(e) => {
                    const creditLimit = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, creditLimit, amount: creditLimit });
                  }}
                  placeholder="Enter credit limit"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opening-balance">Current Outstanding Balance</Label>
                <Input
                  id="opening-balance"
                  type="number"
                  step="0.01"
                  value={formData.openingBalance}
                  onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter current debt amount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opening-balance-date">Balance Date</Label>
                <Input
                  id="opening-balance-date"
                  type="date"
                  value={formData.openingBalanceDate}
                  onChange={(e) => setFormData({ ...formData, openingBalanceDate: e.target.value })}
                />
              </div>
            </>
          ) : (
            // Loan/Mortgage/Other Fields: Original Amount and Current Outstanding Balance
            <>
              <div className="space-y-2">
                <Label htmlFor="original-amount">
                  {formData.type === "mortgage" ? "Original Mortgage Amount" : 
                   formData.type === "loan" ? "Original Loan Amount" : 
                   "Original Amount"}
                </Label>
                <Input
                  id="original-amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => {
                    const amount = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, amount });
                  }}
                  placeholder={
                    formData.type === "mortgage" ? "Enter original mortgage amount" : 
                    formData.type === "loan" ? "Enter original loan amount" : 
                    "Enter original amount"
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current-balance">
                  {formData.type === "mortgage" ? "Current Outstanding Balance" : 
                   formData.type === "loan" ? "Current Outstanding Balance" : 
                   "Current Balance"}
                </Label>
                <Input
                  id="current-balance"
                  type="number"
                  step="0.01"
                  value={formData.openingBalance}
                  onChange={(e) => {
                    const openingBalance = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, openingBalance });
                  }}
                  placeholder={
                    formData.type === "mortgage" ? "Enter current amount owed" : 
                    formData.type === "loan" ? "Enter current amount owed" : 
                    "Enter current balance"
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opening-balance-date">
                  {formData.type === "mortgage" ? "Loan Start Date" : 
                   formData.type === "loan" ? "Loan Start Date" : 
                   "Start Date"}
                </Label>
                <Input
                  id="opening-balance-date"
                  type="date"
                  value={formData.openingBalanceDate}
                  onChange={(e) => setFormData({ ...formData, openingBalanceDate: e.target.value })}
                />
              </div>
            </>
          )}
          
          <Button onClick={handleSubmit} className="w-full">Update Liability</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
