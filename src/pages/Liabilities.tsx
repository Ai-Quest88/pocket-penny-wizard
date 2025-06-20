
import { DashboardCard } from "@/components/DashboardCard"
import { LiabilitiesList } from "@/components/assets-liabilities/LiabilitiesList"
import { AddLiabilityDialog } from "@/components/assets-liabilities/AddLiabilityDialog"
import { Liability } from "@/types/assets-liabilities"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"

const Liabilities = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { session } = useAuth()

  // Fetch liabilities from Supabase with user authentication
  const { data: liabilities = [], isLoading } = useQuery({
    queryKey: ['liabilities', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) {
        console.log('No authenticated user, returning empty liabilities array');
        return [];
      }

      console.log('Fetching liabilities for user:', session.user.id);
      
      const { data, error } = await supabase
        .from('liabilities')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching liabilities:', error);
        throw error;
      }

      console.log('Fetched liabilities:', data);

      return data.map(liability => ({
        id: liability.id,
        entityId: liability.entity_id,
        name: liability.name,
        amount: Number(liability.amount),
        type: liability.type,
        category: liability.category,
        history: [], // Historical values would be fetched separately if needed
        accountNumber: liability.account_number || undefined,
        interestRate: liability.interest_rate ? Number(liability.interest_rate) : undefined,
        termMonths: liability.term_months || undefined,
        monthlyPayment: liability.monthly_payment ? Number(liability.monthly_payment) : undefined,
        openingBalance: Number(liability.opening_balance) || 0,
        openingBalanceDate: liability.opening_balance_date || new Date().toISOString().split('T')[0],
      })) as Liability[];
    },
    enabled: !!session?.user,
  });

  // Add liability mutation
  const addLiabilityMutation = useMutation({
    mutationFn: async (newLiability: Omit<Liability, "id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('liabilities')
        .insert([{
          user_id: user.id,
          entity_id: newLiability.entityId,
          name: newLiability.name,
          amount: newLiability.amount,
          type: newLiability.type,
          category: newLiability.category,
          account_number: newLiability.accountNumber || null,
          interest_rate: newLiability.interestRate || null,
          term_months: newLiability.termMonths || null,
          monthly_payment: newLiability.monthlyPayment || null,
          opening_balance: newLiability.openingBalance,
          opening_balance_date: newLiability.openingBalanceDate,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      toast({
        title: "Liability Added",
        description: "The liability has been added successfully.",
      });
    },
    onError: (error) => {
      console.error('Error adding liability:', error);
      toast({
        title: "Error",
        description: "Failed to add liability. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Edit liability mutation
  const editLiabilityMutation = useMutation({
    mutationFn: async ({ id, updatedLiability }: { id: string; updatedLiability: Omit<Liability, "id"> }) => {
      const { data, error } = await supabase
        .from('liabilities')
        .update({
          entity_id: updatedLiability.entityId,
          name: updatedLiability.name,
          amount: updatedLiability.amount,
          type: updatedLiability.type,
          category: updatedLiability.category,
          account_number: updatedLiability.accountNumber || null,
          interest_rate: updatedLiability.interestRate || null,
          term_months: updatedLiability.termMonths || null,
          monthly_payment: updatedLiability.monthlyPayment || null,
          opening_balance: updatedLiability.openingBalance,
          opening_balance_date: updatedLiability.openingBalanceDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      toast({
        title: "Liability Updated",
        description: "Your liability has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating liability:', error);
      toast({
        title: "Error",
        description: "Failed to update liability. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete liability mutation
  const deleteLiabilityMutation = useMutation({
    mutationFn: async (liabilityId: string) => {
      const { error } = await supabase
        .from('liabilities')
        .delete()
        .eq('id', liabilityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      toast({
        title: "Liability Deleted",
        description: "The liability has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Error deleting liability:', error);
      toast({
        title: "Error",
        description: "Failed to delete liability. Please try again.",
        variant: "destructive",
      });
    },
  });

  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.amount, 0)
  const monthlyChange = -1.5 // This could be calculated based on historical data

  const handleAddLiability = (newLiability: Omit<Liability, "id">) => {
    addLiabilityMutation.mutate(newLiability);
  }

  const handleEditLiability = (id: string, updatedLiability: Omit<Liability, "id">) => {
    editLiabilityMutation.mutate({ id, updatedLiability });
  }

  const handleDeleteLiability = (id: string) => {
    deleteLiabilityMutation.mutate(id);
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading liabilities...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Liabilities</h1>
            <p className="text-muted-foreground">Manage your liabilities</p>
          </div>
          <AddLiabilityDialog onAddLiability={handleAddLiability} />
        </header>

        <DashboardCard
          title="Total Liabilities"
          value={`$${totalLiabilities.toLocaleString()}`}
          className="bg-card"
        />

        <LiabilitiesList 
          liabilities={liabilities} 
          onEditLiability={handleEditLiability}
          onDeleteLiability={handleDeleteLiability}
        />
      </div>
    </div>
  )
}

export default Liabilities
