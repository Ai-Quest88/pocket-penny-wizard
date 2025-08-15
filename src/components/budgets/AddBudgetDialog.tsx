
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
import { Budget } from "@/types/budget"
import { useToast } from "@/hooks/use-toast"
import { FamilyMember, BusinessEntity } from "@/types/entities"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"

interface AddBudgetDialogProps {
  onAddBudget: (budget: Omit<Budget, "id" | "userId" | "createdAt" | "updatedAt">) => void
}

const categories = [
  'Food',
  'Transport', 
  'Shopping',
  'Bills',
  'Entertainment',
  'Healthcare',
  'Education',
  'Travel',
  'Other'
];

export function AddBudgetDialog({ onAddBudget }: AddBudgetDialogProps) {
  const { toast } = useToast()
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  const [selectedEntityId, setSelectedEntityId] = useState<string>("all")
  const [newBudget, setNewBudget] = useState<Omit<Budget, "id" | "userId" | "createdAt" | "updatedAt">>({
    category: "",
    amount: 0,
    period: "monthly",
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
    entityId: undefined,
    endDate: undefined
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
    enabled: !!session?.user?.id,
  });

  const handleAddBudget = () => {
    if (!newBudget.category || newBudget.amount <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    const budgetWithEntity = {
      ...newBudget,
      entityId: selectedEntityId === "all" ? undefined : selectedEntityId,
    }
    
    onAddBudget(budgetWithEntity)
    
    // Reset form and close dialog
    setNewBudget({
      category: "",
      amount: 0,
      period: "monthly",
      startDate: new Date().toISOString().split('T')[0],
      isActive: true,
      entityId: undefined,
      endDate: undefined
    })
    setSelectedEntityId("all")
    setOpen(false)
    
    toast({
      title: "Budget Added",
      description: "Your new budget has been created successfully.",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Budget
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Budget</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="entity">Entity (Optional)</Label>
            <Select
              value={selectedEntityId}
              onValueChange={setSelectedEntityId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select entity (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={newBudget.category}
              onValueChange={(value) => setNewBudget({ ...newBudget, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Budget Amount</Label>
            <Input
              id="amount"
              type="number"
              value={newBudget.amount}
              onChange={(e) => setNewBudget({ ...newBudget, amount: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Period</Label>
            <Select
              value={newBudget.period}
              onValueChange={(value: Budget["period"]) => setNewBudget({ ...newBudget, period: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={newBudget.startDate}
                onChange={(e) => setNewBudget({ ...newBudget, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date (Optional)</Label>
              <Input
                id="end-date"
                type="date"
                value={newBudget.endDate || ""}
                onChange={(e) => setNewBudget({ ...newBudget, endDate: e.target.value || undefined })}
              />
            </div>
          </div>
          
          <Button onClick={handleAddBudget} className="w-full">Create Budget</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
