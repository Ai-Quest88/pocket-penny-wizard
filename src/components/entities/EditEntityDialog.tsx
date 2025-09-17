
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Info } from "lucide-react";
import { IndividualEntity, BusinessEntity, EntityType } from "@/types/entities";
import { useToast } from "@/hooks/use-toast";
import { SecureEntityForm } from "./SecureEntityForm";

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
    dateOfBirth: (entity as IndividualEntity).dateOfBirth || "",
    registrationNumber: (entity as BusinessEntity).registrationNumber || "",
    incorporationDate: (entity as BusinessEntity).incorporationDate || "",
    taxIdentifier: entity.taxIdentifier || "",
    email: (entity as any).email || "",
    phone: (entity as any).phone || "",
    address: (entity as any).address || "",
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
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
    };

    if (formData.type === "individual") {
      const individualEntity: Omit<IndividualEntity, "id" | "dateAdded"> = {
        ...baseEntity,
        type: "individual",
        dateOfBirth: formData.dateOfBirth,
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
        <Button variant="ghost" size="icon" data-testid={`edit-entity-button-${entity.name}`}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Entity</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
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

          <SecureEntityForm
            formData={{
              email: formData.email,
              phone: formData.phone,
              address: formData.address,
              taxIdentifier: formData.taxIdentifier,
              countryOfResidence: formData.countryOfResidence,
            }}
            onFormDataChange={(data) => setFormData({ ...formData, ...data })}
            showSensitiveData={false}
          />

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
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Household Management</p>
                  <p>You can manage which households this entity belongs to from the Households page.</p>
                </div>
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
