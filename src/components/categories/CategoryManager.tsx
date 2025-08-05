import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryGroupCard } from "./CategoryGroupCard";
import { AddCategoryDialog } from "./AddCategoryDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import * as DndKit from '@dnd-kit/core';
import * as DndSortable from '@dnd-kit/sortable';

export interface CategoryGroup {
  id: string;
  name: string;
  type: 'Income' | 'Expense' | 'Assets' | 'Liability' | 'Transfers' | 'Investments' | 'Adjustments';
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
      "Child Support", "Alimony", "Gifts Received", "Refunds"
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
      "Food Delivery"
    ],
    color: "bg-red-100 border-red-300 text-red-800"
  },
  {
    id: "transfers",
    name: "Transfers",
    type: "Transfers",
    description: "Internal money movements",
    categories: ["Transfer In", "Transfer Out", "Internal Transfer"],
    color: "bg-purple-100 border-purple-300 text-purple-800"
  },
  {
    id: "investments",
    name: "Investments",
    type: "Investments",
    description: "Investment activities",
    categories: ["Investment", "Cryptocurrency"],
    color: "bg-blue-100 border-blue-300 text-blue-800"
  },
  {
    id: "assets",
    name: "Assets",
    type: "Assets",
    description: "Things you own",
    categories: [],
    color: "bg-cyan-100 border-cyan-300 text-cyan-800"
  },
  {
    id: "liability",
    name: "Liability",
    type: "Liability",
    description: "Money you owe",
    categories: [],
    color: "bg-orange-100 border-orange-300 text-orange-800"
  },
  {
    id: "adjustments",
    name: "Adjustments",
    type: "Adjustments",
    description: "Corrections & reconciliations",
    categories: ["Uncategorized"],
    color: "bg-gray-100 border-gray-300 text-gray-800"
  }
];

export const CategoryManager = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const sensors = DndKit.useSensors(
    DndKit.useSensor(DndKit.PointerSensor),
    DndKit.useSensor(DndKit.KeyboardSensor, {
      coordinateGetter: DndSortable.sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = (event: DndKit.DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Parse the draggable and droppable IDs
    const activeId = active.id as string;
    const overId = over.id as string;

    // Extract category and group information
    const [activeCategory, activeGroupId] = activeId.includes('::') 
      ? activeId.split('::') 
      : [activeId, ''];
    
    const [overCategory, overGroupId] = overId.includes('::') 
      ? overId.split('::') 
      : ['', overId];

    // If dropped on a group (not on another category)
    if (!overId.includes('::')) {
      // Moving to a different group
      const sourceGroupIndex = categoryGroups.findIndex(g => 
        g.categories.includes(activeCategory)
      );
      const destGroupIndex = categoryGroups.findIndex(g => g.id === overId);
      
      if (sourceGroupIndex === -1 || destGroupIndex === -1) return;
      if (sourceGroupIndex === destGroupIndex) return; // Same group, no change

      const newGroups = [...categoryGroups];
      const sourceGroup = newGroups[sourceGroupIndex];
      const destGroup = newGroups[destGroupIndex];
      
      // Remove from source group
      newGroups[sourceGroupIndex] = {
        ...sourceGroup,
        categories: sourceGroup.categories.filter(c => c !== activeCategory)
      };
      
      // Add to destination group
      newGroups[destGroupIndex] = {
        ...destGroup,
        categories: [...destGroup.categories, activeCategory]
      };
      
      saveCategoryGroups.mutate(newGroups);
    } else {
      // Reordering within the same group
      if (activeGroupId === overGroupId && activeCategory !== overCategory) {
        const groupIndex = categoryGroups.findIndex(g => g.id === activeGroupId);
        if (groupIndex === -1) return;

        const group = categoryGroups[groupIndex];
        const oldIndex = group.categories.indexOf(activeCategory);
        const newIndex = group.categories.indexOf(overCategory);
        
        if (oldIndex === -1 || newIndex === -1) return;

        const newGroups = [...categoryGroups];
        newGroups[groupIndex] = {
          ...group,
          categories: DndSortable.arrayMove(group.categories, oldIndex, newIndex)
        };
        
        saveCategoryGroups.mutate(newGroups);
      }
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
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

      <DndKit.DndContext
        sensors={sensors}
        collisionDetection={DndKit.closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categoryGroups.map((group) => (
            <CategoryGroupCard
              key={group.id}
              group={group}
              onRemoveCategory={handleRemoveCategory}
            />
          ))}
        </div>
      </DndKit.DndContext>

      <AddCategoryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAddCategory={handleAddCategory}
        existingCategories={categoryGroups.flatMap(g => g.categories)}
        categoryGroups={categoryGroups}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Financial Impact Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-600">Net Worth Impact:</span>
                <span>Income - Expenses</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-600">Cash Flow:</span>
                <span>All categories including Transfers</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Investment Activity:</span>
                <span>Separate from regular income/expenses</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Transfers:</strong> Money movements between your accounts</p>
              <p><strong>Investments:</strong> Buying/selling stocks, crypto, etc.</p>
              <p><strong>Adjustments:</strong> Corrections and reconciliations</p>
              <p><strong>Assets/Liability:</strong> For balance sheet items</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};