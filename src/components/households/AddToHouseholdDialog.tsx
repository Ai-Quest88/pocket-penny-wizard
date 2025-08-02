import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHouseholds } from '../../integrations/supabase/households';
import { addMemberToHousehold } from '../../integrations/supabase/households';
import { IndividualEntity } from '../../types/entities';
import { Household } from '../../types/households';
import { Button } from '../ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { Users, User } from 'lucide-react';
import { toast } from 'sonner';

interface AddToHouseholdDialogProps {
  individual: IndividualEntity;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export const AddToHouseholdDialog: React.FC<AddToHouseholdDialogProps> = ({
  individual,
  trigger,
  onSuccess,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: households, isLoading } = useQuery({
    queryKey: ['households'],
    queryFn: getHouseholds,
  });

  const addMemberMutation = useMutation({
    mutationFn: addMemberToHousehold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      setIsOpen(false);
      setSelectedHouseholdId('');
      toast.success(`${individual.name} added to household successfully`);
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error adding member to household:', error);
      toast.error('Failed to add member to household');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedHouseholdId) {
      addMemberMutation.mutate(selectedHouseholdId);
    }
  };

  const handleRemoveFromHousehold = () => {
    // This would require a separate mutation to remove from household
    // For now, we'll just show a message
    toast.info('Use the household manager to remove members');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            {individual.householdId ? 'Change Household' : 'Add to Household'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {individual.householdId ? 'Change Household' : 'Add to Household'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium">{individual.name}</p>
              <p className="text-sm text-gray-600">
                {individual.relationship ? `${individual.relationship}` : 'Individual'}
              </p>
            </div>
          </div>

          {individual.householdId && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Currently in a household. Select a new household to change or remove.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="household-select">Select Household</Label>
              <Select 
                value={selectedHouseholdId} 
                onValueChange={setSelectedHouseholdId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a household..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No household (remove from current)</SelectItem>
                  {households?.map((household) => (
                    <SelectItem key={household.id} value={household.id}>
                      {household.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={addMemberMutation.isPending}
              >
                {addMemberMutation.isPending ? 'Adding...' : 'Add to Household'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 