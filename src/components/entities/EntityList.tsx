import { Card } from "@/components/ui/card";
import { FamilyMember, BusinessEntity } from "@/types/entities";
import { format } from "date-fns";

interface EntityListProps {
  entities: (FamilyMember | BusinessEntity)[];
}

export const EntityList = ({ entities }: EntityListProps) => {
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {entities.map((entity) => (
        <Card key={entity.id} className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getEntityIcon(entity.type)}</span>
                <h3 className="font-medium">{entity.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground capitalize">{entity.type.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="text-sm space-y-2">
            <p>Country: {entity.countryOfResidence}</p>
            {entity.type === "individual" && (
              <p>Relationship: {entity.relationship}</p>
            )}
            {(entity.type === "company" || entity.type === "trust" || entity.type === "super_fund") && (
              <p>Registration: {entity.registrationNumber || "N/A"}</p>
            )}
            <p className="text-muted-foreground">
              Added: {format(new Date(entity.dateAdded), "MMM d, yyyy")}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
};