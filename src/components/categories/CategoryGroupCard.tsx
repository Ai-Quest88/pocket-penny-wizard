import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryGroup } from "./CategoryManager";
import { X, ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CategoryGroupCardProps {
  group: CategoryGroup;
  allGroups: CategoryGroup[];
  onRemoveCategory: (category: string, groupId: string) => void;
  onMoveCategory: (category: string, fromGroupId: string, toGroupId: string) => void;
}

interface CategoryItemProps {
  category: string;
  groupId: string;
  allGroups: CategoryGroup[];
  onRemove: (category: string, groupId: string) => void;
  onMove: (category: string, fromGroupId: string, toGroupId: string) => void;
}

const CategoryItem = ({ category, groupId, allGroups, onRemove, onMove }: CategoryItemProps) => {
  return (
    <div className="bg-white rounded-md p-2 shadow-sm transition-all duration-200 group hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-medium text-gray-700 truncate">
            {category}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600"
              >
                <ArrowUpDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="bg-white shadow-lg border z-50"
            >
              {allGroups
                .filter(group => group.id !== groupId)
                .map((group) => (
                  <DropdownMenuItem
                    key={group.id}
                    onClick={() => onMove(category, groupId, group.id)}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${group.color.split(' ')[0]}`} />
                      Move to {group.name}
                    </div>
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
            onClick={() => onRemove(category, groupId)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const CategoryGroupCard = ({ 
  group, 
  allGroups, 
  onRemoveCategory, 
  onMoveCategory 
}: CategoryGroupCardProps) => {
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
        <div className="space-y-2 min-h-[200px] p-2 rounded-md bg-white/10">
          {group.categories.map((category) => (
            <CategoryItem
              key={category}
              category={category}
              groupId={group.id}
              allGroups={allGroups}
              onRemove={onRemoveCategory}
              onMove={onMoveCategory}
            />
          ))}
          {group.categories.length === 0 && (
            <div className="flex items-center justify-center h-24 text-sm text-gray-500 italic">
              No categories yet. Add some using the button above.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};