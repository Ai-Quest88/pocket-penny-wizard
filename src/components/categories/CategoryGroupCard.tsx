import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Brain, Edit, Trash2, Move, Plus, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { CategoryGroupWithRelations } from "@/integrations/supabase/types";
import { useState } from "react";

interface CategoryGroupCardProps {
  group: CategoryGroupWithRelations;
  isOpen: boolean;
  onToggle: () => void;
  onAddBucket?: (groupId: string) => void;
  onEditBucket?: (bucketId: string) => void;
  onDeleteBucket?: (bucketId: string) => void;
  onAddCategory?: (bucketId: string) => void;
  onEditCategory?: (categoryId: string) => void;
  onDeleteCategory?: (categoryId: string) => void;
}

export const CategoryGroupCard = ({
  group,
  isOpen,
  onToggle,
  onAddBucket,
  onEditBucket,
  onDeleteBucket,
  onAddCategory,
  onEditCategory,
  onDeleteCategory
}: CategoryGroupCardProps) => {
  const totalBuckets = group.buckets?.length || 0;
  const totalCategories = group.buckets?.reduce((sum, bucket) => 
    sum + (bucket.categories?.length || 0), 0) || 0;

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
                      <Badge variant="secondary" size="sm" className="flex items-center gap-1">
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
                {totalBuckets > 0 && (
                  <Badge variant="secondary" className="bg-gray-100">
                    {totalBuckets} buckets • {totalCategories} categories
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
            {!group.buckets || group.buckets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No buckets in this group yet</p>
                <p className="text-sm">Add buckets to organize your categories</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => onAddBucket?.(group.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Bucket
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {group.buckets.map((bucket) => (
                  <div key={bucket.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span>{bucket.icon}</span>
                        <h4 className="font-medium">{bucket.name}</h4>
                        {bucket.is_ai_generated && (
                          <Badge variant="outline" size="sm" className="flex items-center gap-1">
                            <Brain className="h-3 w-3" />
                            AI
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditBucket?.(bucket.id)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAddCategory?.(bucket.id)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteBucket?.(bucket.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {bucket.description && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {bucket.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-1">
                      {bucket.categories?.map((category) => (
                        <Badge 
                          key={category.id} 
                          variant="secondary" 
                          className="text-xs flex items-center gap-1 cursor-pointer hover:bg-gray-200"
                          onClick={() => onEditCategory?.(category.id)}
                        >
                          {category.name}
                          {category.is_ai_generated && <Sparkles className="h-2 w-2" />}
                        </Badge>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => onAddCategory?.(bucket.id)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full border-dashed border-2"
                  onClick={() => onAddBucket?.(group.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bucket
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

