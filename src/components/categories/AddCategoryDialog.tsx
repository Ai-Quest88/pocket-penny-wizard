import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryGroup, Category } from "./CategoryManager";
import { useToast } from "@/hooks/use-toast";

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCategory: (category: Omit<Category, 'id'>, bucketId: string) => void;
  categoryGroups: CategoryGroup[];
}

export const AddCategoryDialog = ({
  open,
  onOpenChange,
  onAddCategory,
  categoryGroups,
}: AddCategoryDialogProps) => {
  const { toast } = useToast();
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedBucketId, setSelectedBucketId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get all existing category names for validation
  const existingCategories = categoryGroups.flatMap(group => 
    group.buckets.flatMap(bucket => bucket.categories.map(cat => cat.name))
  );

  // Get available buckets for the selected group
  const availableBuckets = selectedGroupId 
    ? categoryGroups.find(group => group.id === selectedGroupId)?.buckets || []
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedGroupId) {
      toast({
        title: "Error", 
        description: "Please select a group.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedBucketId) {
      toast({
        title: "Error", 
        description: "Please select a bucket.",
        variant: "destructive",
      });
      return;
    }

    if (existingCategories.includes(categoryName.trim())) {
      toast({
        title: "Error",
        description: "This category already exists.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      onAddCategory({
        name: categoryName.trim(),
        description: categoryDescription.trim() || undefined
      }, selectedBucketId);
      
      setCategoryName("");
      setCategoryDescription("");
      setSelectedGroupId("");
      setSelectedBucketId("");
      onOpenChange(false);
      
      toast({
        title: "Category Added",
        description: `"${categoryName.trim()}" has been added successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add category.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedBucketId(""); // Reset bucket selection when group changes
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="category-name">Category Name</Label>
            <Input
              id="category-name"
              placeholder="Enter category name..."
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-description">Description (Optional)</Label>
            <Input
              id="category-description"
              placeholder="Enter category description..."
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-select">Group</Label>
            <Select value={selectedGroupId} onValueChange={handleGroupChange} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select a group..." />
              </SelectTrigger>
              <SelectContent>
                {categoryGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{group.icon}</span>
                      {group.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bucket-select">Bucket</Label>
            <Select 
              value={selectedBucketId} 
              onValueChange={setSelectedBucketId} 
              disabled={isSubmitting || !selectedGroupId}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedGroupId ? "Select a bucket..." : "Select a group first..."} />
              </SelectTrigger>
              <SelectContent>
                {availableBuckets.map((bucket) => (
                  <SelectItem key={bucket.id} value={bucket.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{bucket.icon}</span>
                      {bucket.name}
                    </div>
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Adding..." : "Add Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};