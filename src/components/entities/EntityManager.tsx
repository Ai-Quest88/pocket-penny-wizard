
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

export const EntityManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session } = useAuth();

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

      const entityData = {
        user_id: user.id,
        name: newEntity.name,
        type: newEntity.type,
        description: newEntity.description || null,
        tax_identifier: newEntity.taxIdentifier || null,
        country_of_residence: newEntity.countryOfResidence,
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
        description: "Failed to add entity. Please try again.",
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
      const entityData = {
        name: updatedEntity.name,
        type: updatedEntity.type,
        description: updatedEntity.description || null,
        tax_identifier: updatedEntity.taxIdentifier || null,
        country_of_residence: updatedEntity.countryOfResidence,
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
        description: "Failed to update entity. Please try again.",
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
      toast({
        title: "Entity Deleted",
        description: "The entity has been removed successfully.",
      });
    },
    onError: (error) => {
      console.error('Error deleting entity:', error);
      toast({
        title: "Error",
        description: "Failed to delete entity. Please try again.",
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

  const handleDeleteEntity = (entityId: string) => {
    deleteEntityMutation.mutate(entityId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <AddEntityDialog onAddEntity={handleAddEntity} />
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
      />
    </div>
  );
};
