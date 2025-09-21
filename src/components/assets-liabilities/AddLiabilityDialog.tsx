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
import { Plus } from "lucide-react"
import { useState } from "react"
import { Liability, LiabilityCategory, liabilityCategoryGroups } from "@/types/assets-liabilities"
import { useToast } from "@/hooks/use-toast"
import { FamilyMember, BusinessEntity } from "@/types/entities"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { CURRENCIES } from "@/utils/currencyUtils"

interface AddLiabilityDialogProps {
  onAddLiability: (liability: Omit<Liability, "id">) => void
}

export function AddLiabilityDialog({ onAddLiability }: AddLiabilityDialogProps) {
  const { session } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [selectedEntityId, setSelectedEntityId] = useState<string>("")
  const [openingBalanceDate, setOpeningBalanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [newLiability, setNewLiability] = useState<Omit<Liability, "id">>({
    name: "",
    amount: 0,
    type: "credit",
    category: "credit_card",
    entityId: "",
    history: [],
    openingBalance: 0,
    openingBalanceDate: new Date().toISOString().split('T')[0],
    creditLimit: 0,
    currency: "AUD",
    country: "AU"
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

  const handleAddLiability = () => {
    console.log("Add Liability button clicked");
    console.log("Selected entity ID:", selectedEntityId);
    console.log("New liability data:", newLiability);
    console.log("Opening balance date:", openingBalanceDate);

    if (!selectedEntityId) {
      console.log("No entity selected, showing error toast");
      toast({
        title: "Error",
        description: "Please select an entity",
        variant: "destructive"
      })
      return
    }

    if (!newLiability.name || !newLiability.name.trim()) {
      console.log("No liability name provided, showing error toast");
      toast({
        title: "Error",
        description: "Please enter a liability name",
        variant: "destructive"
      })
      return
    }

    // Validate amounts based on liability type
    if (newLiability.type === "credit") {
      if (!newLiability.creditLimit || newLiability.creditLimit <= 0) {
        console.log("Invalid credit limit provided, showing error toast");
        toast({
          title: "Error", 
          description: "Please enter a valid credit limit greater than 0",
          variant: "destructive"
        })
        return
      }
      if (newLiability.openingBalance < 0) {
        console.log("Invalid opening balance provided, showing error toast");
        toast({
          title: "Error", 
          description: "Opening balance cannot be negative",
          variant: "destructive"
        })
        return
      }
      if (newLiability.openingBalance > newLiability.creditLimit) {
        console.log("Opening balance exceeds credit limit, showing error toast");
        toast({
          title: "Error", 
          description: "Outstanding balance cannot exceed credit limit",
          variant: "destructive"
        })
        return
      }
    } else {
      // For loans, mortgages, and other liabilities
      if (newLiability.openingBalance <= 0) {
        console.log("Invalid current balance provided, showing error toast");
        toast({
          title: "Error", 
          description: "Please enter a valid outstanding balance greater than 0",
          variant: "destructive"
        })
        return
      }
    }

    console.log("All validation passed, creating liability");
    const liabilityWithEntity = {
      ...newLiability,
      entityId: selectedEntityId,
      openingBalanceDate: openingBalanceDate,
      history: [{ date: openingBalanceDate, value: newLiability.openingBalance }]
    }
    
    console.log("Calling onAddLiability with:", liabilityWithEntity);
    onAddLiability(liabilityWithEntity)
    
    // Reset form and close dialog
    setNewLiability({
      name: "",
      amount: 0,
      type: "credit",
      category: "credit_card",
      entityId: "",
      history: [],
      openingBalance: 0,
      openingBalanceDate: new Date().toISOString().split('T')[0],
      creditLimit: 0,
      currency: "AUD",
      country: "AU"
    })
    setSelectedEntityId("")
    setOpeningBalanceDate(new Date().toISOString().split('T')[0])
    setOpen(false)
    
    console.log("Liability added successfully, dialog closed");
  }

  const handleDialogOpenChange = (newOpen: boolean) => {
    console.log("Dialog open state changing to:", newOpen);
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setNewLiability({
        name: "",
        amount: 0,
        type: "credit",
        category: "credit_card", 
        entityId: "",
        history: [],
        openingBalance: 0,
        openingBalanceDate: new Date().toISOString().split('T')[0],
        creditLimit: 0,
        currency: "AUD",
        country: "AU"
      })
      setSelectedEntityId("")
      setOpeningBalanceDate(new Date().toISOString().split('T')[0])
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          data-testid="add-liability-button"
          onClick={() => {
            console.log("Add Liability dialog trigger clicked");
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Liability
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Liability</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="entity">Entity</Label>
            <Select
              value={selectedEntityId}
              onValueChange={(value) => {
                console.log("Entity selected:", value);
                setSelectedEntityId(value);
              }}
            >
              <SelectTrigger data-testid="liability-entity-select">
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
              onChange={(e) => {
                console.log("Liability name changed to:", e.target.value);
                setNewLiability({ ...newLiability, name: e.target.value });
              }}
              placeholder="e.g., Credit Card"
              data-testid="liability-name-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="liability-type">Type</Label>
            <Select
              value={newLiability.type}
              onValueChange={(value: Liability["type"]) => {
                console.log("Liability type changed to:", value);
                setNewLiability({ ...newLiability, type: value, category: liabilityCategoryGroups[value][0] });
              }}
            >
              <SelectTrigger data-testid="liability-type-select">
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
              onValueChange={(value: LiabilityCategory) => {
                console.log("Liability category changed to:", value);
                setNewLiability({ ...newLiability, category: value });
              }}
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

          {newLiability.type === "credit" ? (
            // Credit Card Fields: Credit Limit and Opening Balance
            <>
              <div className="space-y-2">
                <Label htmlFor="credit-limit">Credit Limit</Label>
                <Input
                  id="credit-limit"
                  type="text"
                  value={newLiability.creditLimit || 0}
                  onChange={(e) => {
                    const creditLimit = parseFloat(e.target.value) || 0;
                    console.log("Credit limit changed to:", creditLimit);
                    setNewLiability({ ...newLiability, creditLimit, amount: creditLimit });
                  }}
                  placeholder="Enter credit limit"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opening-balance">Current Outstanding Balance</Label>
                <Input
                  id="opening-balance"
                  type="text"
                  value={newLiability.openingBalance}
                  onChange={(e) => {
                    const openingBalance = parseFloat(e.target.value) || 0;
                    console.log("Opening balance changed to:", openingBalance);
                    setNewLiability({ ...newLiability, openingBalance });
                  }}
                  placeholder="Enter current debt amount"
                />
              </div>
            </>
          ) : (
            // Loan/Mortgage/Other Fields: Current Outstanding Balance Only
            <div className="space-y-2">
              <Label htmlFor="current-balance">
                {newLiability.type === "mortgage" ? "Current Outstanding Balance" : 
                 newLiability.type === "loan" ? "Current Outstanding Balance" : 
                 "Current Balance"}
              </Label>
              <Input
                id="current-balance"
                type="text"
                value={newLiability.openingBalance}
                onChange={(e) => {
                  const openingBalance = parseFloat(e.target.value) || 0;
                  console.log("Current outstanding balance changed to:", openingBalance);
                  setNewLiability({ ...newLiability, openingBalance, amount: openingBalance });
                }}
                data-testid="liability-balance-input"
                placeholder={
                  newLiability.type === "mortgage" ? "Enter current amount owed" : 
                  newLiability.type === "loan" ? "Enter current amount owed" : 
                  "Enter current balance"
                }
              />
                              <p className="text-xs text-muted-foreground">
                  {newLiability.type === "other" 
                    ? "Current amount owed (e.g., family loan, tax debt, accounts payable)"
                    : `How much you currently owe on this ${newLiability.type === "mortgage" ? "mortgage" : newLiability.type}`}
                </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="opening-balance-date">
              {newLiability.type === "credit" ? "Account Opening Date" : 
               newLiability.type === "mortgage" ? "Balance Date" : 
               newLiability.type === "loan" ? "Balance Date" :
               "Start Date"}
            </Label>
            <Input
              id="opening-balance-date"
              type="date"
              value={openingBalanceDate}
              onChange={(e) => {
                console.log("Opening balance date changed to:", e.target.value);
                setOpeningBalanceDate(e.target.value);
              }}
            />
            {(newLiability.type === "loan" || newLiability.type === "mortgage" || newLiability.type === "other") && (
              <p className="text-xs text-muted-foreground">
                {newLiability.type === "other" 
                  ? "When this balance was recorded (for tracking payments/changes from this date)"
                  : "When the current outstanding balance was recorded"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="liability-currency">Currency</Label>
            <Select
              value={newLiability.currency}
              onValueChange={(value) => setNewLiability({ ...newLiability, currency: value })}
            >
              <SelectTrigger data-testid="liability-currency-select">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
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
          
            <Button onClick={handleAddLiability} className="w-full" data-testid="add-liability-submit-button">
              Add Liability
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
