import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryGroupWithRelations, Category } from "@/types/categories";
import { useToast } from "@/hooks/use-toast";

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCategory: (category: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>, groupId: string) => void;
  categoryGroups: CategoryGroupWithRelations[];
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const groups = categoryGroups ?? [];
  // Get all existing category names for validation
  const existingCategories = groups.flatMap(group => 
    (group.categories ?? []).map(cat => cat.name)
  );

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
      const selectedGroup = groups.find(g => g.id === selectedGroupId);
      const categoryType = selectedGroup?.category_type || 'expense';
      
      onAddCategory({
        name: categoryName.trim(),
        description: categoryDescription.trim() || null,
        merchant_patterns: null,
        sort_order: 0,
        is_ai_generated: false,
        type: categoryType,
        group_id: selectedGroupId,
        is_system: false,
        icon: null,
        color: null
      }, selectedGroupId);
      
      setCategoryName("");
      setCategoryDescription("");
      setSelectedGroupId("");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
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
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select a group..." />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};