
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Entity, IndividualEntity, BusinessEntity } from "@/types/entities";
import { AddEntityDialog } from "./AddEntityDialog";
import { EntityList } from "./EntityList";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const EntityManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [deleteDialog, setDeleteDialog] = useState<{ 
    isOpen: boolean; 
    entityId: string; 
    entityName: string;
    associatedAssets: any[];
  }>({
    isOpen: false,
    entityId: '',
    entityName: '',
    associatedAssets: []
  });

  // Fetch entities from Supabase
  const { data: entities = [], isLoading } = useQuery({
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
        primaryCountry: entity.primary_country || entity.country_of_residence,
        primaryCurrency: entity.primary_currency || 'USD',
        dateAdded: entity.date_added,
        relationship: entity.relationship || '',
        dateOfBirth: entity.date_of_birth || '',
        registrationNumber: entity.registration_number || '',
        incorporationDate: entity.incorporation_date || '',
      })) as (IndividualEntity | BusinessEntity)[];
    },
    enabled: !!session?.user?.id,
  });





  // Add entity mutation
  const addEntityMutation = useMutation({
    mutationFn: async (newEntity: Omit<IndividualEntity | BusinessEntity, "id" | "dateAdded">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check for duplicate entity names
      const { data: existingEntities, error: checkError } = await supabase
        .from('entities')
        .select('name')
        .eq('user_id', user.id)
        .eq('name', newEntity.name.trim());

      if (checkError) throw checkError;

      if (existingEntities && existingEntities.length > 0) {
        throw new Error(`An entity with the name "${newEntity.name}" already exists. Please use a different name.`);
      }

      const entityData = {
        user_id: user.id,
        name: newEntity.name.trim(),
        type: newEntity.type,
        description: newEntity.description || null,
        tax_identifier: newEntity.taxIdentifier || null,
        country_of_residence: newEntity.countryOfResidence,
        primary_country: newEntity.primaryCountry || newEntity.countryOfResidence,
        primary_currency: newEntity.primaryCurrency || 'USD',
        relationship: newEntity.type === 'individual' ? (newEntity as IndividualEntity).relationship || null : null,
        date_of_birth: newEntity.type === 'individual' ? (newEntity as IndividualEntity).dateOfBirth || null : null,
        registration_number: newEntity.type !== 'individual' ? (newEntity as BusinessEntity).registrationNumber || null : null,
        incorporation_date: newEntity.type !== 'individual' ? (newEntity as BusinessEntity).incorporationDate || null : null,
      };

      const { data, error } = await supabase
        .from('entities')
        .insert([entityData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entities', session?.user?.id] });
      toast({
        title: "Entity Added",
        description: `${data.name} has been added successfully.`,
      });
    },
    onError: (error) => {
      console.error('Error adding entity:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add entity. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Edit entity mutation
  const editEntityMutation = useMutation({
    mutationFn: async ({ entityId, updatedEntity }: { 
      entityId: string; 
      updatedEntity: Omit<IndividualEntity | BusinessEntity, "id" | "dateAdded"> 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check for duplicate entity names (excluding the current entity being edited)
      const { data: existingEntities, error: checkError } = await supabase
        .from('entities')
        .select('name')
        .eq('user_id', user.id)
        .eq('name', updatedEntity.name.trim())
        .neq('id', entityId);

      if (checkError) throw checkError;

      if (existingEntities && existingEntities.length > 0) {
        throw new Error(`An entity with the name "${updatedEntity.name}" already exists. Please use a different name.`);
      }

      const entityData = {
        name: updatedEntity.name.trim(),
        type: updatedEntity.type,
        description: updatedEntity.description || null,
        tax_identifier: updatedEntity.taxIdentifier || null,
        country_of_residence: updatedEntity.countryOfResidence,
        primary_country: updatedEntity.primaryCountry || updatedEntity.countryOfResidence,
        primary_currency: updatedEntity.primaryCurrency || 'USD',
        relationship: updatedEntity.type === 'individual' ? (updatedEntity as IndividualEntity).relationship || null : null,
        date_of_birth: updatedEntity.type === 'individual' ? (updatedEntity as IndividualEntity).dateOfBirth || null : null,
        registration_number: updatedEntity.type !== 'individual' ? (updatedEntity as BusinessEntity).registrationNumber || null : null,
        incorporation_date: updatedEntity.type !== 'individual' ? (updatedEntity as BusinessEntity).incorporationDate || null : null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('entities')
        .update(entityData)
        .eq('id', entityId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entities', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['available-entities'] });
      toast({
        title: "Entity Updated",
        description: `${data.name} has been updated successfully.`,
      });
    },
    onError: (error) => {
      console.error('Error updating entity:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update entity. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete entity mutation
  const deleteEntityMutation = useMutation({
    mutationFn: async (entityId: string) => {
      const { error } = await supabase
        .from('entities')
        .delete()
        .eq('id', entityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', session?.user?.id] });
      // Invalidate household-related queries since the entity might have been part of a household
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['household-entities-map'] });
      queryClient.invalidateQueries({ queryKey: ['household-entities'] });
      queryClient.invalidateQueries({ queryKey: ['available-entities'] });
      toast({
        title: "Entity Deleted",
        description: "The entity has been removed successfully.",
      });
    },
    onError: (error) => {
      console.error('Error deleting entity:', error);
      
      // Check if it's a foreign key constraint error
      let errorMessage = "Failed to delete entity. Please try again.";
      
      if (error instanceof Error) {
        const errorStr = error.message.toLowerCase();
        if (errorStr.includes('foreign key') || errorStr.includes('23503') || errorStr.includes('referenced')) {
          errorMessage = "Cannot delete this entity because it has associated assets or transactions. Please delete or transfer the associated assets first, then try deleting the entity again.";
        } else if (errorStr.includes('duplicate') || errorStr.includes('unique')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Cannot Delete Entity",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleAddEntity = (newEntity: Omit<IndividualEntity | BusinessEntity, "id" | "dateAdded">) => {
    addEntityMutation.mutate(newEntity);
  };

  const handleEditEntity = (entityId: string, updatedEntity: Omit<IndividualEntity | BusinessEntity, "id" | "dateAdded">) => {
    editEntityMutation.mutate({ entityId, updatedEntity });
  };

  // Check if entity can be deleted (has no associated assets/transactions)
  const checkEntityDeletability = async (entityId: string): Promise<{ canDelete: boolean; reason?: string; blockingAssets?: Array<{ id: string; name: string; type: string }> }> => {
    try {
      // Check if entity has associated assets with full details
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('id, name, type')
        .eq('entity_id', entityId);

      if (assetsError) throw assetsError;

      if (assets && assets.length > 0) {
        return { 
          canDelete: false, 
          reason: `This entity has ${assets.length} associated asset${assets.length > 1 ? 's' : ''}. Please delete or transfer the assets first.`,
          blockingAssets: assets
        };
      }

      return { canDelete: true };
    } catch (error) {
      console.error('Error checking entity deletability:', error);
      return { 
        canDelete: false, 
        reason: "Unable to verify if entity can be deleted. Please try again." 
      };
    }
  };

  const handleDeleteEntity = async (entityId: string) => {
    return new Promise((resolve, reject) => {
      deleteEntityMutation.mutate(entityId, {
        onSuccess: () => resolve(undefined),
        onError: (error) => reject(error),
      });
    });
  };

  const confirmDelete = async () => {
    try {
      await handleDeleteEntity(deleteDialog.entityId);
      setDeleteDialog({ isOpen: false, entityId: '', entityName: '', associatedAssets: [] });
    } catch (error) {
      // Error is already handled by the mutation
      setDeleteDialog({ isOpen: false, entityId: '', entityName: '', associatedAssets: [] });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <AddEntityDialog 
            onAddEntity={handleAddEntity} 
          />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-20 bg-muted rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <AddEntityDialog onAddEntity={handleAddEntity} />
      </div>

      <EntityList 
        entities={entities} 
        onDeleteEntity={handleDeleteEntity} 
        onEditEntity={handleEditEntity}
        checkEntityDeletability={checkEntityDeletability}
      />

      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => 
        setDeleteDialog(prev => ({ ...prev, isOpen: open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              ⚠️ Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the entity "{deleteDialog.entityName}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {deleteDialog.associatedAssets.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
              <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                ⚠️ Cannot Delete Entity:
              </div>
              <p className="text-red-700 mb-3">
                This entity has {deleteDialog.associatedAssets.length} associated asset{deleteDialog.associatedAssets.length !== 1 ? 's' : ''}. Please delete or transfer the assets first.
              </p>
              <div className="space-y-1">
                <p className="font-medium text-red-800">Associated Assets:</p>
                {deleteDialog.associatedAssets.map((asset) => (
                  <div key={asset.id} className="bg-white rounded px-3 py-2 text-sm">
                    🔴 {asset.name} ({asset.type})
                  </div>
                ))}
              </div>
              <p className="text-red-600 text-sm mt-3">
                Go to Assets page to delete or transfer these assets first.
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className={deleteDialog.associatedAssets.length > 0 ? "opacity-50 cursor-not-allowed" : ""}
              disabled={deleteDialog.associatedAssets.length > 0}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
