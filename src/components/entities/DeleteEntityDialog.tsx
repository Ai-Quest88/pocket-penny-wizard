import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import { IndividualEntity, BusinessEntity } from "@/types/entities";

interface DeleteEntityDialogProps {
  entity: IndividualEntity | BusinessEntity;
  onDeleteEntity: (entityId: string) => void;
  checkEntityDeletability: (entityId: string) => Promise<{ canDelete: boolean; reason?: string; blockingAssets?: Array<{ id: string; name: string; type: string }> }>;
}

export const DeleteEntityDialog = ({ entity, onDeleteEntity, checkEntityDeletability }: DeleteEntityDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletabilityCheck, setDeletabilityCheck] = useState<{ canDelete: boolean; reason?: string; blockingAssets?: Array<{ id: string; name: string; type: string }> } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkDeletability = async () => {
    setIsChecking(true);
    try {
      const result = await checkEntityDeletability(entity.id);
      setDeletabilityCheck(result);
    } catch (error) {
      console.error('Error checking entity deletability:', error);
      setDeletabilityCheck({ canDelete: false, reason: "Unable to verify if entity can be deleted." });
    } finally {
      setIsChecking(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      checkDeletability();
    } else {
      setDeletabilityCheck(null);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteEntity(entity.id);
      setIsOpen(false);
    } catch (error) {
      // Error will be handled by the parent component
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the entity <strong>"{entity.name}"</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isChecking ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <div className="text-sm text-blue-800">
                  Checking if entity can be deleted...
                </div>
              </div>
            </div>
          ) : deletabilityCheck?.canDelete ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>This entity will be permanently deleted</li>
                    <li>This entity will be removed from any households it belongs to</li>
                    <li>This action cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800 w-full">
                  <p className="font-medium mb-2">Cannot Delete Entity:</p>
                  <p className="mb-3">{deletabilityCheck?.reason || "This entity cannot be deleted at this time."}</p>
                  
                  {deletabilityCheck?.blockingAssets && deletabilityCheck.blockingAssets.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium mb-2">Associated Assets:</p>
                      <div className="bg-white border border-red-200 rounded p-3 max-h-32 overflow-y-auto">
                        <ul className="space-y-1">
                          {deletabilityCheck.blockingAssets.map((asset) => (
                            <li key={asset.id} className="flex items-center gap-2 text-xs">
                              <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></span>
                              <span className="font-medium">{asset.name}</span>
                              <span className="text-red-600">({asset.type})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p className="text-xs mt-2 text-red-700">
                        Go to Assets page to delete or transfer these assets first.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isDeleting || isChecking}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || isChecking || !deletabilityCheck?.canDelete}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 