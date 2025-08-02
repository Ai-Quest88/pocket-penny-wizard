import { Card } from "@/components/ui/card";
import { IndividualEntity, BusinessEntity } from "@/types/entities";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { EditEntityDialog } from "./EditEntityDialog";

interface EntityListProps {
  entities: (IndividualEntity | BusinessEntity)[];
  onDeleteEntity: (entityId: string) => void;
  onEditEntity: (entityId: string, updatedEntity: Omit<IndividualEntity | BusinessEntity, "id" | "dateAdded">) => void;
}

export const EntityList = ({ entities, onDeleteEntity, onEditEntity }: EntityListProps) => {
  const getEntityIcon = (type: string) => {
    switch (type) {
      case "individual":
        return "👤";
      case "company":
        return "🏢";
      case "trust":
        return "📜";
      case "super_fund":
        return "💰";
      default:
        return "📋";
    }
  };

  return (
    <div className="space-y-4">
      {entities.map((entity) => (
        <Card key={entity.id} className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getEntityIcon(entity.type)}</span>
                <h3 className="font-medium">{entity.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground capitalize">{entity.type.replace('_', ' ')}</p>
            </div>
            <div className="flex items-center gap-2">
              <EditEntityDialog entity={entity} onEditEntity={onEditEntity} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteEntity(entity.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Country</p>
              <p className="text-muted-foreground">{entity.countryOfResidence}</p>
            </div>
            {entity.type === "individual" ? (
              <>
                <div>
                  <p className="font-medium">Relationship</p>
                  <p className="text-muted-foreground">{(entity as IndividualEntity).relationship || "N/A"}</p>
                </div>
                {(entity as IndividualEntity).dateOfBirth && (
                  <div>
                    <p className="font-medium">Date of Birth</p>
                    <p className="text-muted-foreground">
                      {format(new Date((entity as IndividualEntity).dateOfBirth!), "MMM d, yyyy")}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <p className="font-medium">Registration Number</p>
                  <p className="text-muted-foreground">
                    {(entity as BusinessEntity).registrationNumber || "N/A"}
                  </p>
                </div>
                {(entity as BusinessEntity).incorporationDate && (
                  <div>
                    <p className="font-medium">Incorporation Date</p>
                    <p className="text-muted-foreground">
                      {format(new Date((entity as BusinessEntity).incorporationDate!), "MMM d, yyyy")}
                    </p>
                  </div>
                )}
              </>
            )}
            <div>
              <p className="font-medium">Added</p>
              <p className="text-muted-foreground">
                {format(new Date(entity.dateAdded), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};