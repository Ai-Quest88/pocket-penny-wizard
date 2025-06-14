import { DashboardCard } from "@/components/DashboardCard"
import { AssetsList } from "@/components/assets-liabilities/AssetsList"
import { AddAssetDialog } from "@/components/assets-liabilities/AddAssetDialog"
import { Asset } from "@/types/assets-liabilities"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"

const Assets = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { session } = useAuth()

  // Fetch assets from Supabase with user authentication
  const { data: assets = [], isLoading } = useQuery({
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

      return data.map(asset => ({
        id: asset.id,
        entityId: asset.entity_id,
        name: asset.name,
        value: Number(asset.value),
        type: asset.type,
        category: asset.category,
        history: [], // Historical values would be fetched separately if needed
        accountNumber: asset.account_number || undefined,
        address: asset.address || undefined,
      })) as Asset[];
    },
    enabled: !!session?.user,
  });

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
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
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

  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0)
  const monthlyChange = 3.2 // This could be calculated based on historical data

  const handleAddAsset = (newAsset: Omit<Asset, "id">) => {
    addAssetMutation.mutate(newAsset);
  }

  const handleEditAsset = (id: string, updatedAsset: Omit<Asset, "id">) => {
    editAssetMutation.mutate({ id, updatedAsset });
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
            <p className="text-muted-foreground">Manage your assets</p>
          </div>
          <AddAssetDialog onAddAsset={handleAddAsset} />
        </header>

        <DashboardCard
          title="Total Assets"
          value={`$${totalAssets.toLocaleString()}`}
          trend={{ value: monthlyChange, isPositive: true }}
          className="bg-card"
        />

        <AssetsList assets={assets} onEditAsset={handleEditAsset} />
      </div>
    </div>
  )
}

export default Assets
