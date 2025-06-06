
import { DashboardCard } from "@/components/DashboardCard"
import { AssetsList } from "@/components/assets-liabilities/AssetsList"
import { AddAssetDialog } from "@/components/assets-liabilities/AddAssetDialog"
import { Asset } from "@/types/assets-liabilities"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

const Assets = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch assets from Supabase
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assets:', error);
        throw error;
      }

      return data.map(asset => ({
        id: asset.id,
        entityId: asset.entity_id,
        name: asset.name,
        value: Number(asset.value),
        type: asset.type,
        category: asset.category,
        history: [], // Historical values would be fetched separately if needed
      })) as Asset[];
    },
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
