
import { useState } from "react";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CategoryBucket } from "@/types/transaction-forms";
import { AddCategoryDialog } from "./AddCategoryDialog";

interface CategorySelectProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  availableBuckets: CategoryBucket[];
  onAddCategory: (categoryName: string, bucketName: string) => void;
}

export const CategorySelect = <T extends FieldValues>({ 
  control, 
  name, 
  availableBuckets, 
  onAddCategory 
}: CategorySelectProps<T>) => {
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);

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
              <SelectContent className="max-h-80">
                {availableBuckets.map((bucket, bucketIndex) => (
                  <div key={bucket.name}>
                    {bucketIndex > 0 && <div className="h-px bg-border my-1" />}
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted/30">
                      {bucket.name}
                    </div>
                    {bucket.categories.map((category) => (
                      <SelectItem key={category} value={category} className="pl-6">
                        {category}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <AddCategoryDialog
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onAddCategory={onAddCategory}
      />
    </>
  );
};
