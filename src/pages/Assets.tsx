
import { DashboardCard } from "@/components/DashboardCard"
import { AssetsList } from "@/components/assets-liabilities/AssetsList"
import { AddAssetDialog } from "@/components/assets-liabilities/AddAssetDialog"
import { Asset } from "@/types/assets-liabilities"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { useAccountBalances } from "@/hooks/useAccountBalances"
import { calculateAccountBalances } from "@/utils/balanceCalculations"
import { useCurrency } from "@/contexts/CurrencyContext"

const Assets = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const { formatCurrency, displayCurrency, convertAmount } = useCurrency()
  
  // First fetch account balances (these are converted to display currency)
  const { data: accountBalances = [], isLoading: balancesLoading } = useAccountBalances()
  
  // Also fetch raw balances in original currencies
  const { data: rawBalances = [], isLoading: rawBalancesLoading } = useQuery({
    queryKey: ['raw-account-balances', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return [];
      return await calculateAccountBalances(session.user.id);
    },
    enabled: !!session?.user,
  });

  // Fetch assets from Supabase with user authentication
  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ['assets', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) {
        console.log('No authenticated user, returning empty assets array');
        return [];
      }

      console.log('Fetching assets for user:', session.user.id);
      
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assets:', error);
        throw error;
      }

      console.log('Fetched assets:', data);
      return data;
    },
    enabled: !!session?.user,
  });

  // Transform assets with calculated balances - this runs after both queries complete
  const assetsWithBalances = useQuery({
    queryKey: ['assets-with-balances', assets, accountBalances, rawBalances],
    queryFn: () => {
      console.log('Transforming assets with calculated balances');
      console.log('Assets:', assets);
      console.log('Available account balances:', accountBalances);
      console.log('Available raw balances:', rawBalances);

      return assets.map(asset => {
        // Get the calculated balance for this asset
        const calculatedBalance = accountBalances.find(b => b.accountId === asset.id);
        console.log(`🔍 Asset ${asset.name}:`);
        console.log(`  - Database opening_balance: ${asset.opening_balance}`);
        console.log(`  - Database currency: ${asset.currency}`);
        console.log(`  - Calculated balance object:`, calculatedBalance);
        console.log(`  - calculatedBalance?.calculatedBalance: ${calculatedBalance?.calculatedBalance}`);
        console.log(`  - asset.value from DB: ${asset.value}`);
        
        const finalValue = calculatedBalance?.calculatedBalance ?? Number(asset.value);
        console.log(`  - Final value being displayed: ${finalValue}`);
        
        // Use the raw balance (in original currency) for display
        const rawBalance = rawBalances.find(b => b.accountId === asset.id);
        const originalValue = rawBalance ? rawBalance.calculatedBalance : Number(asset.value);
        
        return {
          id: asset.id,
          entityId: asset.entity_id,
          name: asset.name,
          value: originalValue,
          type: asset.type,
          category: asset.category,
          history: [], // Historical values would be fetched separately if needed
          accountNumber: asset.account_number || undefined,
          address: asset.address || undefined,
          openingBalance: Number(asset.opening_balance) || 0,
          openingBalanceDate: asset.opening_balance_date || new Date().toISOString().split('T')[0],
          currency: asset.currency || 'AUD',
          country: '', // ... keep existing code (other Asset fields mapping if any) the same ...
        } as Asset;
      }) as Asset[];
    },
    enabled: !assetsLoading && !balancesLoading && !rawBalancesLoading && !!assets && !!rawBalances,
  });

  const transformedAssets = assetsWithBalances.data || [];
  const isLoading = assetsLoading || balancesLoading || rawBalancesLoading || assetsWithBalances.isLoading;

  // Add asset mutation
  const addAssetMutation = useMutation({
    mutationFn: async (newAsset: Omit<Asset, "id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('assets')
        .insert([{
          user_id: user.id,
          entity_id: newAsset.entityId,
          name: newAsset.name,
          value: newAsset.value,
          type: newAsset.type,
          category: newAsset.category,
          account_number: newAsset.accountNumber || null,
          address: newAsset.address || null,
          opening_balance: newAsset.openingBalance,
          opening_balance_date: newAsset.openingBalanceDate,
          currency: newAsset.currency || 'AUD',
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['account-balances'] });
      toast({
        title: "Asset Added",
        description: "The asset has been added successfully.",
      });
    },
    onError: (error) => {
      console.error('Error adding asset:', error);
      toast({
        title: "Error",
        description: "Failed to add asset. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Edit asset mutation
  const editAssetMutation = useMutation({
    mutationFn: async ({ id, updatedAsset }: { id: string; updatedAsset: Omit<Asset, "id"> }) => {
      const { data, error } = await supabase
        .from('assets')
        .update({
          entity_id: updatedAsset.entityId,
          name: updatedAsset.name,
          value: updatedAsset.value,
          type: updatedAsset.type,
          category: updatedAsset.category,
          account_number: updatedAsset.accountNumber || null,
          address: updatedAsset.address || null,
          opening_balance: updatedAsset.openingBalance,
          opening_balance_date: updatedAsset.openingBalanceDate,
          currency: updatedAsset.currency || 'AUD',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['account-balances'] });
      toast({
        title: "Asset Updated",
        description: "The asset has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating asset:', error);
      toast({
        title: "Error",
        description: "Failed to update asset. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete asset mutation
  const deleteAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['account-balances'] });
      toast({
        title: "Asset Deleted",
        description: "The asset has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Error deleting asset:', error);
      toast({
        title: "Error",
        description: "Failed to delete asset. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate total assets using converted balances (in display currency)
  const totalAssets = accountBalances
    .filter(balance => balance.accountType === 'asset')
    .reduce((sum, balance) => sum + balance.calculatedBalance, 0)
  const monthlyChange = 3.2 // This could be calculated based on historical data

  const handleAddAsset = (newAsset: Omit<Asset, "id">) => {
    addAssetMutation.mutate(newAsset);
  }

  const handleEditAsset = (id: string, updatedAsset: Omit<Asset, "id">) => {
    editAssetMutation.mutate({ id, updatedAsset });
  }

  const handleDeleteAsset = (id: string) => {
    deleteAssetMutation.mutate(id);
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading assets...</p>
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
            <h1 className="text-3xl font-bold">Assets</h1>
            <p className="text-muted-foreground">Manage your assets • All amounts in {displayCurrency}</p>
          </div>
          <AddAssetDialog onAddAsset={handleAddAsset} />
        </header>

        <DashboardCard
          title="Total Assets"
          value={formatCurrency(totalAssets)}
          className="bg-card"
        />

        <AssetsList 
          assets={transformedAssets} 
          onEditAsset={handleEditAsset} 
          onDeleteAsset={handleDeleteAsset}
        />
      </div>
    </div>
  )
}

export default Assets
