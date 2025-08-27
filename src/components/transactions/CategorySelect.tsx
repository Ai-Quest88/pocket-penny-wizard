
import { useState } from "react";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import { AddCategoryDialog } from "./AddCategoryDialog";

interface CategorySelectProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  categoryType?: 'income' | 'expense' | 'asset' | 'liability' | 'transfer';
  showHierarchy?: boolean;
}

export const CategorySelect = <T extends FieldValues>({ 
  control, 
  name, 
  categoryType,
  showHierarchy = false
}: CategorySelectProps<T>) => {
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const { 
    groupedCategories, 
    flatCategories, 
    getCategoriesByType, 
    isLoading,
    addCategoryToGroup
  } = useCategoryManagement();

  // Get categories based on type filter or all categories
  const availableCategories = categoryType 
    ? getCategoriesByType(categoryType)
    : flatCategories;

  const handleAddCategory = async (categoryName: string, groupName: string) => {
    // Find the group by name
    const targetGroup = groupedCategories.find(group => group.name === groupName);
    if (targetGroup) {
      await addCategoryToGroup(categoryName, targetGroup.id);
    }
  };

  return (
    <>
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Category</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddCategoryOpen(true)}
                className="h-8 px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent 
                className="max-h-80 bg-background border shadow-lg z-[100]"
                position="popper"
                sideOffset={4}
              >
                {showHierarchy ? (
                  // Show grouped structure with hierarchy
                  groupedCategories
                    .filter(group => !categoryType || group.type === categoryType)
                    .map((group, groupIndex) => (
                      <div key={group.id}>
                        {groupIndex > 0 && <div className="h-px bg-border my-1 mx-2" />}
                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/50 border-b border-border">
                          {group.name}
                        </div>
                        {group.categories.map((category) => (
                          <SelectItem 
                            key={category.id} 
                            value={category.name} 
                            className="pl-6 hover:bg-accent focus:bg-accent"
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </div>
                    ))
                ) : (
                  // Show flat list
                  availableCategories.map((category) => (
                    <SelectItem 
                      key={category.id} 
                      value={category.name}
                      className="hover:bg-accent focus:bg-accent"
                    >
                      {showHierarchy ? category.hierarchy : category.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <AddCategoryDialog
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onAddCategory={handleAddCategory}
        availableGroups={groupedCategories.filter(group => !categoryType || group.type === categoryType)}
      />
    </>
  );
};
