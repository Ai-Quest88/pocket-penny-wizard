import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { CategoryGroup } from "./CategoryManager";
import { X, GripVertical } from "lucide-react";

interface CategoryGroupCardProps {
  group: CategoryGroup;
  onRemoveCategory: (category: string, groupId: string) => void;
}

export const CategoryGroupCard = ({ group, onRemoveCategory }: CategoryGroupCardProps) => {
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
        <Droppable droppableId={group.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-2 min-h-[200px] p-2 rounded-md transition-colors ${
                snapshot.isDraggingOver ? 'bg-white/20' : 'bg-white/10'
              }`}
            >
              {group.categories.map((category, index) => (
                <Draggable key={category} draggableId={category} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-white rounded-md p-2 shadow-sm transition-all duration-200 group ${
                        snapshot.isDragging ? 'shadow-lg rotate-2' : 'hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            {...provided.dragHandleProps}
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
                          onClick={() => onRemoveCategory(category, group.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {group.categories.length === 0 && (
                <div className="flex items-center justify-center h-24 text-sm text-gray-500 italic">
                  Drop categories here
                </div>
              )}
            </div>
          )}
        </Droppable>
      </CardContent>
    </Card>
  );
};