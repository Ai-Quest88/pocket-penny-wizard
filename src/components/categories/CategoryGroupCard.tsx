import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryGroup } from "./CategoryManager";
import { X, GripVertical } from "lucide-react";

interface CategoryGroupCardProps {
  group: CategoryGroup;
  onRemoveCategory: (category: string, groupId: string) => void;
  onMoveCategory: (category: string, fromGroupId: string, toGroupId: string) => void;
}

interface CategoryItemProps {
  category: string;
  groupId: string;
  onRemove: (category: string, groupId: string) => void;
  onDragStart: (category: string, groupId: string) => void;
}

const CategoryItem = ({ category, groupId, onRemove, onDragStart }: CategoryItemProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ category, groupId }));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(category, groupId);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="bg-white rounded-md p-2 shadow-sm transition-all duration-200 group hover:shadow-md cursor-move"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-gray-700 truncate select-none">
            {category}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(category, groupId);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export const CategoryGroupCard = ({ 
  group, 
  onRemoveCategory, 
  onMoveCategory 
}: CategoryGroupCardProps) => {
  const [draggedCategory, setDraggedCategory] = useState<{category: string, groupId: string} | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (category: string, groupId: string) => {
    setDraggedCategory({ category, groupId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set dragOver to false if we're actually leaving the drop zone
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { category, groupId: fromGroupId } = data;
      
      // Don't move if dropping on the same group
      if (fromGroupId === group.id) {
        return;
      }
      
      onMoveCategory(category, fromGroupId, group.id);
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
    
    setDraggedCategory(null);
  };

  const handleDragEnd = () => {
    setIsDragOver(false);
    setDraggedCategory(null);
  };

  return (
    <Card className={`${group.color} transition-all duration-200 hover:shadow-md`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          {group.name}
          <Badge variant="outline" className="bg-white/50">
            {group.categories.length}
          </Badge>
        </CardTitle>
        {group.description && (
          <p className="text-sm opacity-80">{group.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`space-y-2 min-h-[200px] p-2 rounded-md transition-colors ${
            isDragOver ? 'bg-white/30 border-2 border-dashed border-white' : 'bg-white/10'
          }`}
        >
          {group.categories.map((category) => (
            <CategoryItem
              key={category}
              category={category}
              groupId={group.id}
              onRemove={onRemoveCategory}
              onDragStart={handleDragStart}
            />
          ))}
          {group.categories.length === 0 && (
            <div className="flex items-center justify-center h-24 text-sm text-gray-500 italic">
              {isDragOver ? 'Drop category here' : 'Drag categories here or add new ones'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};