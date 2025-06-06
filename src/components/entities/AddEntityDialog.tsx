

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
import { PlusCircle } from "lucide-react";
import { FamilyMember, BusinessEntity, EntityType } from "@/types/entities";
import { useToast } from "@/hooks/use-toast";

interface AddEntityDialogProps {
  onAddEntity: (entity: Omit<FamilyMember | BusinessEntity, "id" | "dateAdded">) => void;
}

export function AddEntityDialog({ onAddEntity }: AddEntityDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [entityType, setEntityType] = useState<EntityType>("individual");

  const [formData, setFormData] = useState({
    name: "",
    type: "individual" as EntityType,
    description: "",
    countryOfResidence: "",
    relationship: "",
    dateOfBirth: "",
    registrationNumber: "",
    incorporationDate: "",
    taxIdentifier: "",
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
      taxIdentifier: formData.type === "individual" ? formData.taxIdentifier : undefined,
    };

    if (formData.type === "individual") {
      const familyMember: Omit<FamilyMember, "id" | "dateAdded"> = {
        ...baseEntity,
        type: "individual",
        relationship: formData.relationship,
        dateOfBirth: formData.dateOfBirth,
      };
      onAddEntity(familyMember);
    } else {
      const businessEntity: Omit<BusinessEntity, "id" | "dateAdded"> = {
        ...baseEntity,
        type: formData.type as "company" | "trust" | "super_fund",
        registrationNumber: formData.registrationNumber,
        incorporationDate: formData.incorporationDate,
        taxIdentifier: undefined,
      };
      onAddEntity(businessEntity);
    }

    setFormData({
      name: "",
      type: "individual",
      description: "",
      countryOfResidence: "",
      relationship: "",
      dateOfBirth: "",
      registrationNumber: "",
      incorporationDate: "",
      taxIdentifier: "",
    });
    setOpen(false);
    toast({
      title: "Success",
      description: "Entity added successfully.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Entity
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Entity</DialogTitle>
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

          {entityType === "individual" ? (
            <div className="space-y-2">
              <Label>Tax File Number</Label>
              <Input
                value={formData.taxIdentifier}
                onChange={(e) => setFormData({ ...formData, taxIdentifier: e.target.value })}
                placeholder="Tax File Number"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Registration Number</Label>
              <Input
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                placeholder="ABN/ACN"
              />
            </div>
          )}

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
            </>
          ) : (
            <div className="space-y-2">
              <Label>Incorporation Date</Label>
              <Input
                type="date"
                value={formData.incorporationDate}
                onChange={(e) => setFormData({ ...formData, incorporationDate: e.target.value })}
              />
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full">
            Add Entity
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

