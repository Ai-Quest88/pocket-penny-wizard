import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getHouseholdsWithMembers, 
  createHousehold, 
  updateHousehold, 
  deleteHousehold 
} from '../../integrations/supabase/households';
import { Household, CreateHouseholdData, UpdateHouseholdData } from '../../types/households';
import { Plus, Edit, Trash2, Users, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { toast } from 'sonner';

export const HouseholdManager: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
  const [deletingHousehold, setDeletingHousehold] = useState<Household | null>(null);
  const queryClient = useQueryClient();

  // Fetch households
  const { data: households, isLoading, error } = useQuery({
    queryKey: ['households'],
    queryFn: getHouseholdsWithMembers,
  });

  // Create household mutation
  const createMutation = useMutation({
    mutationFn: createHousehold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      setIsCreateDialogOpen(false);
      toast.success('Household created successfully');
    },
    onError: (error) => {
      console.error('Error creating household:', error);
      toast.error('Failed to create household');
    },
  });

  // Update household mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHouseholdData }) => 
      updateHousehold(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      setEditingHousehold(null);
      toast.success('Household updated successfully');
    },
    onError: (error) => {
      console.error('Error updating household:', error);
      toast.error('Failed to update household');
    },
  });

  // Delete household mutation
  const deleteMutation = useMutation({
    mutationFn: deleteHousehold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      setDeletingHousehold(null);
      toast.success('Household deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting household:', error);
      toast.error('Failed to delete household');
    },
  });

  const handleCreate = (data: CreateHouseholdData) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: UpdateHouseholdData) => {
    if (editingHousehold) {
      updateMutation.mutate({ id: editingHousehold.id, data });
    }
  };

  const handleDelete = () => {
    if (deletingHousehold) {
      deleteMutation.mutate(deletingHousehold.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading households...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-red-600">Error loading households</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Households</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Household
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Household</DialogTitle>
            </DialogHeader>
            <CreateHouseholdForm onSubmit={handleCreate} />
          </DialogContent>
        </Dialog>
      </div>

      {households && households.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No households yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first household to start managing family finances together.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Household
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {households?.map((household) => (
            <Card key={household.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{household.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Dialog open={editingHousehold?.id === household.id} onOpenChange={(open) => !open && setEditingHousehold(null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Household</DialogTitle>
                        </DialogHeader>
                        <EditHouseholdForm 
                          household={household} 
                          onSubmit={handleUpdate} 
                        />
                      </DialogContent>
                    </Dialog>
                    <AlertDialog open={deletingHousehold?.id === household.id} onOpenChange={(open) => !open && setDeletingHousehold(null)}>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setDeletingHousehold(household)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Household</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{household.name}"? This will remove all members from the household but won't delete the individual entities.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {household.description && (
                  <p className="text-sm text-gray-600 mb-3">{household.description}</p>
                )}
                <div className="flex items-center space-x-2 mb-3">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {household.members.length} member{household.members.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {household.members.length > 0 && (
                  <div className="space-y-1">
                    {household.members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">
                          {member.name}
                          {member.isPrimaryContact && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Primary
                            </Badge>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Create Household Form Component
interface CreateHouseholdFormProps {
  onSubmit: (data: CreateHouseholdData) => void;
}

const CreateHouseholdForm: React.FC<CreateHouseholdFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      setFormData({ name: '', description: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Household Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Smith Family"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the household"
          rows={3}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="submit">Create Household</Button>
      </div>
    </form>
  );
};

// Edit Household Form Component
interface EditHouseholdFormProps {
  household: Household;
  onSubmit: (data: UpdateHouseholdData) => void;
}

const EditHouseholdForm: React.FC<EditHouseholdFormProps> = ({ household, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: household.name,
    description: household.description || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-name">Household Name</Label>
        <Input
          id="edit-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Smith Family"
          required
        />
      </div>
      <div>
        <Label htmlFor="edit-description">Description (Optional)</Label>
        <Textarea
          id="edit-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the household"
          rows={3}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="submit">Update Household</Button>
      </div>
    </form>
  );
}; 