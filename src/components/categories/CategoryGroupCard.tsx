import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryBucket, Category } from "./CategoryManager";
import { X, GripVertical, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";

interface CategoryGroupCardProps {
  bucket: CategoryBucket;
  onRemoveCategory: (categoryId: string, bucketId: string) => void;
  onMoveCategory: (categoryId: string, fromBucketId: string, toBucketId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface CategoryItemProps {
  category: Category;
  bucketId: string;
  onRemove: (categoryId: string, bucketId: string) => void;
  onDragStart: (categoryId: string, bucketId: string) => void;
}

const CategoryItem = ({ category, bucketId, onRemove, onDragStart }: CategoryItemProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ categoryId: category.id, bucketId }));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(category.id, bucketId);
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
            {category.name}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(category.id, bucketId);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export const CategoryGroupCard = ({ 
  bucket, 
  onRemoveCategory, 
  onMoveCategory,
  isCollapsed = false,
  onToggleCollapse
}: CategoryGroupCardProps) => {
  const [draggedCategory, setDraggedCategory] = useState<{categoryId: string, bucketId: string} | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (categoryId: string, bucketId: string) => {
    setDraggedCategory({ categoryId, bucketId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
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
      const { categoryId, bucketId: fromBucketId } = data;
      
      if (fromBucketId === bucket.id) {
        return;
      }
      
      onMoveCategory(categoryId, fromBucketId, bucket.id);
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
    <Card className={`${bucket.color} transition-all duration-200 hover:shadow-md ml-8`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={onToggleCollapse}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-lg">{bucket.icon}</span>
              <CardTitle className="text-base">{bucket.name}</CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white/50 text-xs">
              {bucket.categories.length}
            </Badge>
          </div>
        </div>
        {bucket.description && (
          <p className="text-xs opacity-80">{bucket.description}</p>
        )}
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            className={`space-y-2 min-h-[150px] p-2 rounded-md transition-colors ${
              isDragOver ? 'bg-white/30 border-2 border-dashed border-white' : 'bg-white/10'
            }`}
          >
            {bucket.categories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                bucketId={bucket.id}
                onRemove={onRemoveCategory}
                onDragStart={handleDragStart}
              />
            ))}
            {bucket.categories.length === 0 && (
              <div className="flex items-center justify-center h-20 text-xs text-gray-500 italic">
                {isDragOver ? 'Drop category here' : 'Drag categories here or add new ones'}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};