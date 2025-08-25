import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Brain, Edit, Trash2, Plus, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { CategoryGroupWithRelations } from "@/types/categories";

interface CategoryGroupCardProps {
  group: CategoryGroupWithRelations;
  isOpen: boolean;
  onToggle: () => void;
  onAddCategory?: (groupId: string) => void;
  onEditCategory?: (categoryId: string) => void;
  onDeleteCategory?: (categoryId: string) => void;
}

export const CategoryGroupCard = ({
  group,
  isOpen,
  onToggle,
  onAddCategory,
  onEditCategory,
  onDeleteCategory
}: CategoryGroupCardProps) => {
  const totalCategories = group.categories?.length || 0;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl" role="img" aria-label={group.name}>
                  {group.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{group.name}</span>
                     {group.is_ai_generated && (
                       <Badge variant="secondary" className="flex items-center gap-1">
                         <Brain className="h-3 w-3" />
                         AI
                       </Badge>
                     )}
                  </div>
                  {group.description && (
                    <p className="text-sm text-muted-foreground font-normal">
                      {group.description}
                    </p>
                  )}
                </div>
                {totalCategories > 0 && (
                  <Badge variant="secondary" className="bg-gray-100">
                    {totalCategories} categories
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {isOpen ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {!group.categories || group.categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No categories in this group yet</p>
                <p className="text-sm">Add categories to organize your transactions</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => onAddCategory?.(group.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Category
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {group.categories.map((category) => (
                    <div 
                      key={category.id} 
                      className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => onEditCategory?.(category.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{category.name}</h4>
                          {category.is_ai_generated && (
                            <Sparkles className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCategory?.(category.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      {category.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {category.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full border-dashed border-2"
                  onClick={() => onAddCategory?.(group.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};