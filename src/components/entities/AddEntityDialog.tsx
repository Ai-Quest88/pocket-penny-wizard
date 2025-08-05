
import { useState, useEffect } from "react";
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
import { PlusCircle, AlertCircle, CheckCircle } from "lucide-react";
import { IndividualEntity, BusinessEntity, EntityType } from "@/types/entities";
import { useToast } from "@/hooks/use-toast";
import { Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AddEntityDialogProps {
  onAddEntity: (entity: Omit<IndividualEntity | BusinessEntity, "id" | "dateAdded">) => void;
}

export function AddEntityDialog({ onAddEntity }: AddEntityDialogProps) {
  const { toast } = useToast();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [entityType, setEntityType] = useState<EntityType>("individual");
  const [nameValidation, setNameValidation] = useState<{
    isValid: boolean;
    message: string;
    isChecking: boolean;
  }>({
    isValid: true,
    message: "",
    isChecking: false,
  });

  // Fetch existing entity names directly
  const { data: existingEntityNames = [] } = useQuery({
    queryKey: ['entity-names', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const { data, error } = await supabase
        .from('entities')
        .select('name')
        .eq('user_id', session.user.id);
      if (error) throw error;
      return data?.map(entity => entity.name) || [];
    },
    enabled: !!session?.user?.id,
  });

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

  // Validate entity name in real-time
  useEffect(() => {
    const validateName = async () => {
      const trimmedName = formData.name.trim();
      
      if (!trimmedName) {
        setNameValidation({
          isValid: true,
          message: "",
          isChecking: false,
        });
        return;
      }

      if (trimmedName.length < 2) {
        setNameValidation({
          isValid: false,
          message: "Name must be at least 2 characters long",
          isChecking: false,
        });
        return;
      }

      // Check for duplicate names
      const isDuplicate = existingEntityNames.some(
        existingName => existingName.toLowerCase() === trimmedName.toLowerCase()
      );

      if (isDuplicate) {
        setNameValidation({
          isValid: false,
          message: `An entity with the name "${trimmedName}" already exists`,
          isChecking: false,
        });
      } else {
        setNameValidation({
          isValid: true,
          message: "Name is available",
          isChecking: false,
        });
      }
    };

    // Add a small delay to avoid too many validations while typing
    const timeoutId = setTimeout(validateName, 300);
    return () => clearTimeout(timeoutId);
  }, [formData.name, existingEntityNames]);

  const handleSubmit = () => {
    if (!formData.name || !formData.countryOfResidence) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!nameValidation.isValid) {
      toast({
        title: "Error",
        description: nameValidation.message,
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
      };
      onAddEntity(individualEntity);
    } else {
      const businessEntity: Omit<BusinessEntity, "id" | "dateAdded"> = {
        ...baseEntity,
        type: formData.type as "company" | "trust" | "super_fund",
        registrationNumber: formData.registrationNumber,
        incorporationDate: formData.incorporationDate,
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
    setNameValidation({
      isValid: true,
      message: "",
      isChecking: false,
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
            <div className="relative">
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={entityType === "individual" ? "Full Name" : "Entity Name"}
                className={`pr-10 ${
                  formData.name.trim() && !nameValidation.isValid
                    ? "border-red-500 focus:border-red-500"
                    : formData.name.trim() && nameValidation.isValid
                    ? "border-green-500 focus:border-green-500"
                    : ""
                }`}
              />
              {formData.name.trim() && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {nameValidation.isChecking ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  ) : !nameValidation.isValid ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              )}
            </div>
            {formData.name.trim() && nameValidation.message && (
              <p className={`text-sm ${
                nameValidation.isValid ? "text-green-600" : "text-red-600"
              }`}>
                {nameValidation.message}
              </p>
            )}
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
              <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Household Management</p>
                  <p>After creating this entity, you can add it to one or more households from the Households page.</p>
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
            Add Entity
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
