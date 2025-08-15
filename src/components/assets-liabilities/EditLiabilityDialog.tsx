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
import { Liability, LiabilityCategory, liabilityCategoryGroups } from "@/types/assets-liabilities"
import { useToast } from "@/components/ui/use-toast"
import { FamilyMember, BusinessEntity } from "@/types/entities"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { currencies } from "@/utils/currencyUtils"

interface EditLiabilityDialogProps {
  liability: Liability;
  onEditLiability: (id: string, updatedLiability: Omit<Liability, "id">) => void;
}

export function EditLiabilityDialog({ liability, onEditLiability }: EditLiabilityDialogProps) {
  const { session } = useAuth()
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
    creditLimit: liability.creditLimit || 0,
    currency: liability.currency,
    country: liability.country
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
      if (formData.openingBalance <= 0) {
        toast({
          title: "Error", 
          description: "Please enter a valid outstanding balance greater than 0",
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
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Liability</DialogTitle>
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
                  type="text"
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
                  type="text"
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
            // Loan/Mortgage/Other Fields: Current Outstanding Balance Only
            <>
              <div className="space-y-2">
                <Label htmlFor="current-balance">
                  {formData.type === "mortgage" ? "Current Outstanding Balance" : 
                   formData.type === "loan" ? "Current Outstanding Balance" : 
                   "Current Balance"}
                </Label>
                <Input
                  id="current-balance"
                  type="text"
                  value={formData.openingBalance}
                  onChange={(e) => {
                    const openingBalance = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, openingBalance, amount: openingBalance });
                  }}
                  placeholder={
                    formData.type === "mortgage" ? "Enter current amount owed" : 
                    formData.type === "loan" ? "Enter current amount owed" : 
                    "Enter current balance"
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {formData.type === "other" 
                    ? "Current amount owed (e.g., family loan, tax debt, accounts payable)"
                    : `How much you currently owe on this ${formData.type === "mortgage" ? "mortgage" : formData.type}`}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="opening-balance-date">Balance Date</Label>
                <Input
                  id="opening-balance-date"
                  type="date"
                  value={formData.openingBalanceDate}
                  onChange={(e) => setFormData({ ...formData, openingBalanceDate: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.type === "other" 
                    ? "When this balance was recorded (for tracking payments/changes from this date)"
                    : "When this balance was recorded"}
                </p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="liability-currency">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => setFormData({ ...formData, currency: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span>{currency.flag}</span>
                      <span>{currency.symbol}</span>
                      <span>{currency.code}</span>
                      <span className="text-muted-foreground">- {currency.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
            <Button onClick={handleSubmit} className="w-full">Update Liability</Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
