
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

  // Comprehensive filtering to prevent empty values
  const validBuckets = availableBuckets
    .filter(bucket => bucket && bucket.name && typeof bucket.name === 'string' && bucket.name.trim() !== "")
    .map(bucket => ({
      ...bucket,
      categories: bucket.categories
        .filter(category => category && typeof category === 'string' && category.trim() !== "")
    }))
    .filter(bucket => bucket.categories.length > 0);

  // Debug logging
  console.log("CategorySelect validBuckets:", validBuckets);
  validBuckets.forEach(bucket => {
    bucket.categories.forEach(category => {
      if (!category || category.trim() === "") {
        console.error("Found empty category in bucket:", bucket.name, "category:", category);
      }
    });
  });

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
                className="max-h-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-[60]"
                position="popper"
                sideOffset={4}
              >
                {validBuckets.map((bucket, bucketIndex) => (
                  <div key={bucket.name}>
                    {bucketIndex > 0 && <div className="h-px bg-gray-200 dark:bg-gray-600 my-1 mx-2" />}
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-600">
                      {bucket.name}
                    </div>
                    {bucket.categories.map((category) => {
                      // Extra safety check before rendering
                      if (!category || category.trim() === "") {
                        console.error("Attempting to render empty category:", category);
                        return null;
                      }
                      return (
                        <SelectItem 
                          key={category} 
                          value={category} 
                          className="pl-6 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
                        >
                          {category}
                        </SelectItem>
                      );
                    })}
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
