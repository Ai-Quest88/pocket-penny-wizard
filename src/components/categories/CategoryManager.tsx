import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryGroupCard } from "./CategoryGroupCard";
import { AddCategoryDialog } from "./AddCategoryDialog";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

export interface CategoryGroup {
  id: string;
  name: string;
  type: 'Income' | 'Expense' | 'Assets' | 'Liability';
  description?: string;
  categories: string[];
  color: string;
}

const defaultCategoryGroups: CategoryGroup[] = [
  {
    id: "income",
    name: "Income",
    type: "Income",
    description: "Money coming in",
    categories: [
      "Income", "Salary", "Business", "Freelance", "Interest", "Dividends",
      "Other Income", "Rental Income", "Government Benefits", "Pension",
      "Child Support", "Alimony", "Gifts Received", "Refunds", "Transfer In"
    ],
    color: "bg-green-100 border-green-300 text-green-800"
  },
  {
    id: "expenses",
    name: "Expenses",
    type: "Expense", 
    description: "Money going out",
    categories: [
      "Groceries", "Restaurants", "Gas & Fuel", "Shopping", "Entertainment",
      "Healthcare", "Insurance", "Utilities", "Transportation", "Education",
      "Travel", "Gifts & Donations", "Personal Care", "Professional Services",
      "Home & Garden", "Electronics", "Clothing", "Books", "Subscriptions",
      "Banking", "Taxes", "Legal", "Fast Food", "Public Transport", "Tolls", 
      "Food Delivery", "Transfer Out"
    ],
    color: "bg-red-100 border-red-300 text-red-800"
  },
  {
    id: "assets",
    name: "Assets",
    type: "Assets",
    description: "Things you own",
    categories: ["Investment", "Cryptocurrency"],
    color: "bg-blue-100 border-blue-300 text-blue-800"
  },
  {
    id: "liability",
    name: "Liability",
    type: "Liability",
    description: "Money you owe",
    categories: ["Internal Transfer"],
    color: "bg-orange-100 border-orange-300 text-orange-800"
  }
];

export const CategoryManager = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Fetch category groups from localStorage/database
  const { data: categoryGroups = defaultCategoryGroups, isLoading } = useQuery({
    queryKey: ['category-groups', session?.user?.id],
    queryFn: async () => {
      // For now, use localStorage. Later this could be moved to database
      const stored = localStorage.getItem('categoryGroups');
      if (stored) {
        return JSON.parse(stored);
      }
      return defaultCategoryGroups;
    },
    enabled: !!session?.user?.id,
  });

  // Save category groups mutation
  const saveCategoryGroups = useMutation({
    mutationFn: async (groups: CategoryGroup[]) => {
      // For now, save to localStorage. Later this could be moved to database
      localStorage.setItem('categoryGroups', JSON.stringify(groups));
      return groups;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-groups'] });
      toast({
        title: "Categories Updated",
        description: "Category groups have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update category groups.",
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) {
      // Reordering within the same group
      const groupIndex = categoryGroups.findIndex(g => g.id === source.droppableId);
      if (groupIndex === -1) return;

      const newGroups = [...categoryGroups];
      const group = newGroups[groupIndex];
      const newCategories = [...group.categories];
      
      const [removed] = newCategories.splice(source.index, 1);
      newCategories.splice(destination.index, 0, removed);
      
      newGroups[groupIndex] = { ...group, categories: newCategories };
      saveCategoryGroups.mutate(newGroups);
    } else {
      // Moving between groups
      const sourceGroupIndex = categoryGroups.findIndex(g => g.id === source.droppableId);
      const destGroupIndex = categoryGroups.findIndex(g => g.id === destination.droppableId);
      
      if (sourceGroupIndex === -1 || destGroupIndex === -1) return;

      const newGroups = [...categoryGroups];
      const sourceGroup = newGroups[sourceGroupIndex];
      const destGroup = newGroups[destGroupIndex];
      
      const newSourceCategories = [...sourceGroup.categories];
      const newDestCategories = [...destGroup.categories];
      
      const [removed] = newSourceCategories.splice(source.index, 1);
      newDestCategories.splice(destination.index, 0, removed);
      
      newGroups[sourceGroupIndex] = { ...sourceGroup, categories: newSourceCategories };
      newGroups[destGroupIndex] = { ...destGroup, categories: newDestCategories };
      
      saveCategoryGroups.mutate(newGroups);
    }
  };

  const handleAddCategory = (category: string, groupId: string) => {
    const groupIndex = categoryGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;

    const newGroups = [...categoryGroups];
    const group = newGroups[groupIndex];
    
    if (!group.categories.includes(category)) {
      newGroups[groupIndex] = {
        ...group,
        categories: [...group.categories, category]
      };
      saveCategoryGroups.mutate(newGroups);
    } else {
      toast({
        title: "Category Already Exists",
        description: "This category is already in the selected group.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCategory = (category: string, groupId: string) => {
    const groupIndex = categoryGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;

    const newGroups = [...categoryGroups];
    const group = newGroups[groupIndex];
    
    newGroups[groupIndex] = {
      ...group,
      categories: group.categories.filter(c => c !== category)
    };
    saveCategoryGroups.mutate(newGroups);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Drag and drop categories between groups to reorganize them
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categoryGroups.map((group) => (
            <CategoryGroupCard
              key={group.id}
              group={group}
              onRemoveCategory={handleRemoveCategory}
            />
          ))}
        </div>
      </DragDropContext>

      <AddCategoryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAddCategory={handleAddCategory}
        existingCategories={categoryGroups.flatMap(g => g.categories)}
        categoryGroups={categoryGroups}
      />

      <Card>
        <CardHeader>
          <CardTitle>Uncategorized Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Categories marked as "Uncategorized" need to be assigned to appropriate groups.
          </p>
          <Button variant="outline" size="sm">
            View Uncategorized Transactions
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};