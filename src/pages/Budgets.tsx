import { useState } from "react"
import { BudgetForecast } from "@/components/budgets/BudgetForecast"
import { IncomeExpenseAnalysis } from "@/components/budgets/IncomeExpenseAnalysis"
import { BudgetsList } from "@/components/budgets/BudgetsList"
import { AddBudgetDialog } from "@/components/budgets/AddBudgetDialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Budget } from "@/types/budget"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export default function Budgets() {
  const [selectedEntityId, setSelectedEntityId] = useState<string>("all")
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
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

      return data;
    },
  });

  // Fetch budgets from Supabase
  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching budgets:', error);
        throw error;
      }

      return data.map(budget => ({
        id: budget.id,
        userId: budget.user_id,
        entityId: budget.entity_id,
        category: budget.category,
        amount: Number(budget.amount),
        period: budget.period as 'monthly' | 'quarterly' | 'yearly',
        startDate: budget.start_date,
        endDate: budget.end_date,
        isActive: budget.is_active,
        createdAt: budget.created_at,
        updatedAt: budget.updated_at,
      })) as Budget[];
    },
  });

  // Add budget mutation
  const addBudgetMutation = useMutation({
    mutationFn: async (newBudget: Omit<Budget, "id" | "userId" | "createdAt" | "updatedAt">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('budgets')
        .insert([{
          user_id: user.id,
          entity_id: newBudget.entityId || null,
          category: newBudget.category,
          amount: newBudget.amount,
          period: newBudget.period,
          start_date: newBudget.startDate,
          end_date: newBudget.endDate || null,
          is_active: newBudget.isActive,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: "Budget Created",
        description: "Your new budget has been created successfully.",
      });
    },
    onError: (error) => {
      console.error('Error adding budget:', error);
      toast({
        title: "Error",
        description: "Failed to create budget. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Edit budget mutation
  const editBudgetMutation = useMutation({
    mutationFn: async ({ id, updatedBudget }: { id: string; updatedBudget: Omit<Budget, "id" | "userId" | "createdAt" | "updatedAt"> }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update({
          entity_id: updatedBudget.entityId || null,
          category: updatedBudget.category,
          amount: updatedBudget.amount,
          period: updatedBudget.period,
          start_date: updatedBudget.startDate,
          end_date: updatedBudget.endDate || null,
          is_active: updatedBudget.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: "Budget Updated",
        description: "Your budget has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating budget:', error);
      toast({
        title: "Error",
        description: "Failed to update budget. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete budget mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: "Budget Deleted",
        description: "Your budget has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Error deleting budget:', error);
      toast({
        title: "Error",
        description: "Failed to delete budget. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddBudget = (newBudget: Omit<Budget, "id" | "userId" | "createdAt" | "updatedAt">) => {
    addBudgetMutation.mutate(newBudget);
  }

  const handleEditBudget = (id: string, updatedBudget: Omit<Budget, "id" | "userId" | "createdAt" | "updatedAt">) => {
    editBudgetMutation.mutate({ id, updatedBudget });
  }

  const handleDeleteBudget = (id: string) => {
    deleteBudgetMutation.mutate(id);
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Budgets</h1>
            <p className="text-muted-foreground">
              Create, manage and track your budgets
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entities.map((entity: any) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AddBudgetDialog onAddBudget={handleAddBudget} />
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Budget Overview</TabsTrigger>
            <TabsTrigger value="manage">Manage Budgets</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <IncomeExpenseAnalysis entityId={selectedEntityId === "all" ? undefined : selectedEntityId} />
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            <BudgetsList 
              budgets={budgets}
              onEditBudget={handleEditBudget}
              onDeleteBudget={handleDeleteBudget}
            />
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            <BudgetForecast entityId={selectedEntityId === "all" ? undefined : selectedEntityId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
