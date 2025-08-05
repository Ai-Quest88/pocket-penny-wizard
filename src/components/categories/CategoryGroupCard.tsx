import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CategoryGroup } from "./CategoryManager";
import { X, GripVertical } from "lucide-react";

interface CategoryGroupCardProps {
  group: CategoryGroup;
  onRemoveCategory: (category: string, groupId: string) => void;
}

interface CategoryItemProps {
  category: string;
  groupId: string;
  onRemove: (category: string, groupId: string) => void;
}

const CategoryItem = ({ category, groupId, onRemove }: CategoryItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${category}::${groupId}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-md p-2 shadow-sm transition-all duration-200 group ${
        isDragging ? 'shadow-lg opacity-50' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-gray-700 truncate">
            {category}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
          onClick={() => onRemove(category, groupId)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export const CategoryGroupCard = ({ group, onRemoveCategory }: CategoryGroupCardProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: group.id,
  });

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
          ref={setNodeRef}
          className={`space-y-2 min-h-[200px] p-2 rounded-md transition-colors ${
            isOver ? 'bg-white/20' : 'bg-white/10'
          }`}
        >
          {group.categories.map((category) => (
            <CategoryItem
              key={category}
              category={category}
              groupId={group.id}
              onRemove={onRemoveCategory}
            />
          ))}
          {group.categories.length === 0 && (
            <div className="flex items-center justify-center h-24 text-sm text-gray-500 italic">
              Drop categories here
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};