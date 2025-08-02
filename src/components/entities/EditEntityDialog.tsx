
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { IndividualEntity, BusinessEntity, EntityType } from "@/types/entities";
import { useToast } from "@/hooks/use-toast";
import { HouseholdSelector } from "../households/HouseholdSelector";

interface EditEntityDialogProps {
  entity: IndividualEntity | BusinessEntity;
  onEditEntity: (id: string, updatedEntity: Omit<IndividualEntity | BusinessEntity, "id" | "dateAdded">) => void;
}

export function EditEntityDialog({ entity, onEditEntity }: EditEntityDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [entityType, setEntityType] = useState<EntityType>(entity.type);

  const [formData, setFormData] = useState({
    name: entity.name,
    type: entity.type as EntityType,
    description: entity.description || "",
    countryOfResidence: entity.countryOfResidence,
    relationship: (entity as IndividualEntity).relationship || "",
    dateOfBirth: (entity as IndividualEntity).dateOfBirth || "",
    householdId: (entity as IndividualEntity).householdId || "",
    registrationNumber: (entity as BusinessEntity).registrationNumber || "",
    incorporationDate: (entity as BusinessEntity).incorporationDate || "",
    taxIdentifier: entity.taxIdentifier || "",
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.countryOfResidence) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const baseEntity = {
      name: formData.name,
      type: formData.type,
      description: formData.description,
      countryOfResidence: formData.countryOfResidence,
      taxIdentifier: formData.taxIdentifier,
    };

    if (formData.type === "individual") {
      const individualEntity: Omit<IndividualEntity, "id" | "dateAdded"> = {
        ...baseEntity,
        type: "individual",
        relationship: formData.relationship,
        dateOfBirth: formData.dateOfBirth,
        householdId: formData.householdId,
      };
      onEditEntity(entity.id, individualEntity);
    } else {
      const businessEntity: Omit<BusinessEntity, "id" | "dateAdded"> = {
        ...baseEntity,
        type: formData.type as "company" | "trust" | "super_fund",
        registrationNumber: formData.registrationNumber,
        incorporationDate: formData.incorporationDate,
      };
      onEditEntity(entity.id, businessEntity);
    }

    setOpen(false);
    toast({
      title: "Success",
      description: "Entity updated successfully.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Entity</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Entity Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: EntityType) => {
                setFormData({ ...formData, type: value });
                setEntityType(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="trust">Trust</SelectItem>
                <SelectItem value="super_fund">Super Fund</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={entityType === "individual" ? "Full Name" : "Entity Name"}
            />
          </div>

          <div className="space-y-2">
            <Label>Country of Residence</Label>
            <Input
              value={formData.countryOfResidence}
              onChange={(e) => setFormData({ ...formData, countryOfResidence: e.target.value })}
              placeholder="Country"
            />
          </div>

          <div className="space-y-2">
            <Label>Tax Identification Number</Label>
            <Input
              value={formData.taxIdentifier}
              onChange={(e) => setFormData({ ...formData, taxIdentifier: e.target.value })}
              placeholder={entityType === "individual" ? "Tax File Number (TFN)" : "Australian Business Number (ABN) / Australian Company Number (ACN)"}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>

          {entityType === "individual" ? (
            <>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Input
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  placeholder="e.g., Spouse, Child"
                />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Household (Optional)</Label>
                <HouseholdSelector
                  value={formData.householdId}
                  onValueChange={(value) => setFormData({ ...formData, householdId: value })}
                  placeholder="Select a household"
                  showCreateOption={true}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Registration Number</Label>
                <Input
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  placeholder="Registration/License Number"
                />
              </div>
              <div className="space-y-2">
                <Label>Incorporation Date</Label>
                <Input
                  type="date"
                  value={formData.incorporationDate}
                  onChange={(e) => setFormData({ ...formData, incorporationDate: e.target.value })}
                />
              </div>
            </>
          )}

          <Button onClick={handleSubmit} className="w-full">
            Update Entity
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
