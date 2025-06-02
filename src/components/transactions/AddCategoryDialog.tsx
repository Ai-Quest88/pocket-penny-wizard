
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoryBuckets } from "@/types/transaction-forms";
import { Plus } from "lucide-react";

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCategory: (category: string, bucket: string) => void;
}

export const AddCategoryDialog = ({ open, onOpenChange, onAddCategory }: AddCategoryDialogProps) => {
  const [categoryName, setCategoryName] = useState("");
  const [selectedBucket, setSelectedBucket] = useState("");

  const handleSubmit = () => {
    if (!categoryName.trim() || !selectedBucket) return;

    onAddCategory(categoryName.trim(), selectedBucket);
    setCategoryName("");
    setSelectedBucket("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Category Name</Label>
            <Input
              id="category-name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Enter category name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bucket">Bucket</Label>
            <Select value={selectedBucket} onValueChange={setSelectedBucket}>
              <SelectTrigger>
                <SelectValue placeholder="Select a bucket" />
              </SelectTrigger>
              <SelectContent
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-[70]"
                position="popper"
                sideOffset={4}
              >
                {categoryBuckets.map((bucket) => (
                  <SelectItem 
                    key={bucket.name} 
                    value={bucket.name}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {bucket.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!categoryName.trim() || !selectedBucket}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
