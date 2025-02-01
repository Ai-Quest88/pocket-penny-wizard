import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Entity, EntityType, FamilyMember, BusinessEntity } from "@/types/entities";
import { AddEntityDialog } from "./AddEntityDialog";
import { EntityList } from "./EntityList";
import { useToast } from "@/components/ui/use-toast";

export const EntityManager = () => {
  const [entities, setEntities] = useState<(FamilyMember | BusinessEntity)[]>([]);
  const { toast } = useToast();

  const handleAddEntity = (newEntity: Omit<FamilyMember | BusinessEntity, "id" | "dateAdded">) => {
    const entityWithMetadata = {
      ...newEntity,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString(),
    };

    setEntities([
      ...entities,
      entityWithMetadata as FamilyMember | BusinessEntity
    ]);

    // Update localStorage to persist entities
    localStorage.setItem('entities', JSON.stringify([
      ...entities,
      entityWithMetadata
    ]));

    toast({
      title: "Entity Added",
      description: `${newEntity.name} has been added successfully.`,
    });
  };

  const handleDeleteEntity = (entityId: string) => {
    setEntities(entities.filter(entity => entity.id !== entityId));
    
    // Update localStorage to persist changes
    localStorage.setItem('entities', JSON.stringify(
      entities.filter(entity => entity.id !== entityId)
    ));

    toast({
      title: "Entity Deleted",
      description: "The entity has been removed successfully.",
    });
  };

  // Load entities from localStorage on component mount
  useState(() => {
    const savedEntities = localStorage.getItem('entities');
    if (savedEntities) {
      setEntities(JSON.parse(savedEntities));
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Entities</h2>
          <p className="text-muted-foreground">Manage family members and business entities</p>
        </div>
        <AddEntityDialog onAddEntity={handleAddEntity} />
      </div>

      <EntityList entities={entities} onDeleteEntity={handleDeleteEntity} />
    </div>
  );
};