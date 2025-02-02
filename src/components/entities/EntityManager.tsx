import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Entity, FamilyMember, BusinessEntity } from "@/types/entities";
import { AddEntityDialog } from "./AddEntityDialog";
import { EntityList } from "./EntityList";
import { useToast } from "@/components/ui/use-toast";

export const EntityManager = () => {
  const [entities, setEntities] = useState<(FamilyMember | BusinessEntity)[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const savedEntities = localStorage.getItem('entities');
    if (savedEntities) {
      setEntities(JSON.parse(savedEntities));
    }
  }, []);

  const handleAddEntity = (newEntity: Omit<FamilyMember | BusinessEntity, "id" | "dateAdded">) => {
    const entityWithMetadata = {
      ...newEntity,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString(),
    };

    const updatedEntities = [...entities, entityWithMetadata as FamilyMember | BusinessEntity];
    setEntities(updatedEntities);
    localStorage.setItem('entities', JSON.stringify(updatedEntities));

    toast({
      title: "Entity Added",
      description: `${newEntity.name} has been added successfully.`,
    });
  };

  const handleEditEntity = (entityId: string, updatedEntity: Omit<FamilyMember | BusinessEntity, "id" | "dateAdded">) => {
    const existingEntity = entities.find(e => e.id === entityId);
    if (!existingEntity) return;

    const updatedEntities = entities.map(entity => {
      if (entity.id === entityId) {
        return {
          ...updatedEntity,
          id: entityId,
          dateAdded: existingEntity.dateAdded,
        } as FamilyMember | BusinessEntity;
      }
      return entity;
    });

    setEntities(updatedEntities);
    localStorage.setItem('entities', JSON.stringify(updatedEntities));

    toast({
      title: "Entity Updated",
      description: `${updatedEntity.name} has been updated successfully.`,
    });
  };

  const handleDeleteEntity = (entityId: string) => {
    const updatedEntities = entities.filter(entity => entity.id !== entityId);
    setEntities(updatedEntities);
    localStorage.setItem('entities', JSON.stringify(updatedEntities));

    toast({
      title: "Entity Deleted",
      description: "The entity has been removed successfully.",
    });
  };

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