import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CategoryGroupCard } from "./CategoryGroupCard";
import { AddCategoryDialog } from "./AddCategoryDialog";
import { useCategories } from "@/hooks/useCategories";

const typeConfig = {
  income: { icon: '💰', color: 'bg-green-100 text-green-800', label: 'Income' },
  expense: { icon: '💸', color: 'bg-red-100 text-red-800', label: 'Expenses' },
  asset: { icon: '💎', color: 'bg-blue-100 text-blue-800', label: 'Assets' },
  liability: { icon: '💳', color: 'bg-orange-100 text-orange-800', label: 'Liabilities' },
  transfer: { icon: '🔄', color: 'bg-purple-100 text-purple-800', label: 'Transfers' }
};

export const CategoryManager = () => {
  const { categoryData, isLoading, addCategory, deleteCategory } = useCategories();
  
  // State for collapsible sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    income: true,
    expense: true,
    asset: true,
    liability: true,
    transfer: true
  });

  // State for dialogs
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);

  const toggleSection = (type: string) => {
    setOpenSections(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const expandAll = () => {
    setOpenSections({
      income: true,
      expense: true,
      asset: true,
      liability: true,
      transfer: true
    });
  };

  const collapseAll = () => {
    setOpenSections({
      income: false,
      expense: false,
      asset: false,
      liability: false,
      transfer: false
    });
  };

  const handleAddCategory = (category: any, groupId: string) => {
    addCategory({ category, groupId });
  };

  const handleAddCategoryToGroup = (groupId: string) => {
    setShowAddCategoryDialog(true);
  };

  const handleEditCategory = (categoryId: string) => {
    console.log('Edit category:', categoryId);
    // TODO: Implement edit category functionality
  };

  const handleDeleteCategory = (categoryId: string) => {
    deleteCategory(categoryId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading categories...</span>
      </div>
    );
  }

  const hasCategories = categoryData && Object.values(categoryData).some(groups => groups.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Your Categories</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
          <Button variant="default" onClick={() => setShowAddCategoryDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Category Type Sections */}
      <div className="space-y-4">
        {Object.entries(typeConfig).map(([type, config]) => {
          const groups = categoryData?.[type as keyof typeof categoryData] || [];
          
          return (
            <div key={type} className="space-y-2">
              {groups.length > 0 ? (
                groups.map((group) => (
                  <CategoryGroupCard
                    key={group.id}
                    group={group}
                    isOpen={openSections[type]}
                    onToggle={() => toggleSection(type)}
                    onAddCategory={handleAddCategoryToGroup}
                    onEditCategory={handleEditCategory}
                    onDeleteCategory={handleDeleteCategory}
                  />
                ))
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <span className="text-4xl" role="img" aria-label={config.label}>
                      {config.icon}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">{config.label}</h3>
                  <p className="text-muted-foreground mb-4">
                    No {config.label.toLowerCase()} categories yet
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddCategoryDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Category
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dialogs */}
      <AddCategoryDialog
        open={showAddCategoryDialog}
        onOpenChange={setShowAddCategoryDialog}
        onAddCategory={handleAddCategory}
        categoryGroups={categoryData ? Object.values(categoryData).flat() : []}
      />
    </div>
  );
};