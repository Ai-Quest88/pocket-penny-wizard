import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getHouseholds } from '../../integrations/supabase/households';
import { Household } from '../../types/households';
import { Button } from '../ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Plus } from 'lucide-react';
import { createHousehold } from '../../integrations/supabase/households';
import { toast } from 'sonner';

interface HouseholdSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  showCreateOption?: boolean;
}

export const HouseholdSelector: React.FC<HouseholdSelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Select a household",
  showCreateOption = true,
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: '',
  });

  const { data: households, isLoading, refetch } = useQuery({
    queryKey: ['households'],
    queryFn: getHouseholds,
  });

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createFormData.name.trim()) {
      try {
        const newHousehold = await createHousehold({
          name: createFormData.name.trim(),
          description: createFormData.description.trim() || undefined,
        });
        
        // Select the newly created household
        onValueChange(newHousehold.id);
        setIsCreateDialogOpen(false);
        setCreateFormData({ name: '', description: '' });
        refetch();
        toast.success('Household created successfully');
      } catch (error) {
        console.error('Error creating household:', error);
        toast.error('Failed to create household');
      }
    }
  };

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <div className="flex space-x-2">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">No household</SelectItem>
          {households?.map((household) => (
            <SelectItem key={household.id} value={household.id}>
              {household.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {showCreateOption && (
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Household</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateHousehold} className="space-y-4">
              <div>
                <Label htmlFor="create-name">Household Name</Label>
                <Input
                  id="create-name"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  placeholder="e.g., Smith Family"
                  required
                />
              </div>
              <div>
                <Label htmlFor="create-description">Description (Optional)</Label>
                <Textarea
                  id="create-description"
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                  placeholder="Brief description of the household"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="submit">Create & Select</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}; 