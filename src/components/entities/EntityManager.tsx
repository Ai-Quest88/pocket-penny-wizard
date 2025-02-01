import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Entity, EntityType, FamilyMember, BusinessEntity } from "@/types/entities";
import { AddEntityDialog } from "./AddEntityDialog";
import { EntityList } from "./EntityList";

export const EntityManager = () => {
  const [entities, setEntities] = useState<(FamilyMember | BusinessEntity)[]>([]);

  const handleAddEntity = (newEntity: Omit<FamilyMember | BusinessEntity, "id">) => {
    setEntities([
      ...entities,
      {
        ...newEntity,
        id: Date.now().toString(),
        dateAdded: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Entities</h2>
          <p className="text-muted-foreground">Manage family members and business entities</p>
        </div>
        <AddEntityDialog onAddEntity={handleAddEntity} />
      </div>

      <EntityList entities={entities} />
    </div>
  );
};