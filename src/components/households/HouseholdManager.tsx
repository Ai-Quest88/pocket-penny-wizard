import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Pencil, Trash2, Plus, Users } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import {
  getHouseholds,
  createHousehold,
  updateHousehold,
  deleteHousehold,
  getAvailableEntities,
  addEntityToHousehold,
  removeEntityFromHousehold,
} from '../../integrations/supabase/households';
import { Household, CreateHouseholdData, UpdateHouseholdData } from '../../types/households';
import { IndividualEntity } from '../../types/entities';

export const HouseholdManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
  const [deletingHousehold, setDeletingHousehold] = useState<Household | null>(null);

  const { data: households, isLoading, error } = useQuery({
    queryKey: ['households'],
    queryFn: getHouseholds,
  });

  const createHouseholdMutation = useMutation({
    mutationFn: createHousehold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      setIsCreateDialogOpen(false);
      toast({
        title: 'Household created successfully',
        description: 'Your household has been created.',
      });
    },
    onError: (error) => {
      console.error('Error creating household:', error);
      toast({
        title: 'Failed to create household',
        description: 'There was an error creating your household.',
        variant: 'destructive',
      });
    },
  });

  const updateHouseholdMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHouseholdData }) =>
      updateHousehold(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      setEditingHousehold(null);
      toast({
        title: 'Household updated successfully',
        description: 'Your household has been updated.',
      });
    },
    onError: (error) => {
      console.error('Error updating household:', error);
      toast({
        title: 'Failed to update household',
        description: 'There was an error updating your household.',
        variant: 'destructive',
      });
    },
  });

  const deleteHouseholdMutation = useMutation({
    mutationFn: deleteHousehold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      setDeletingHousehold(null);
      toast({
        title: 'Household deleted successfully',
        description: 'Your household has been deleted.',
      });
    },
    onError: (error) => {
      console.error('Error deleting household:', error);
      toast({
        title: 'Failed to delete household',
        description: 'There was an error deleting your household.',
        variant: 'destructive',
      });
    },
  });

  const handleCreateHousehold = (data: CreateHouseholdData) => {
    createHouseholdMutation.mutate(data);
  };

  const handleUpdateHousehold = (data: UpdateHouseholdData) => {
    if (editingHousehold) {
      updateHouseholdMutation.mutate({ id: editingHousehold.id, data });
    }
  };

  const handleDeleteHousehold = () => {
    if (deletingHousehold) {
      deleteHouseholdMutation.mutate(deletingHousehold.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading households...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Error loading households</p>
          <p className="text-sm text-gray-600 mt-1">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Households</h2>
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
            <CreateHouseholdForm onSubmit={handleCreateHousehold} />
          </DialogContent>
        </Dialog>
      </div>

      {households && households.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No households yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first household to get started with financial reporting.
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
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{household.name}</CardTitle>
                  <div className="flex items-center space-x-1">
                    <Dialog open={editingHousehold?.id === household.id} onOpenChange={(open) => !open && setEditingHousehold(null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Household</DialogTitle>
                        </DialogHeader>
                        <EditHouseholdForm household={household} onSubmit={handleUpdateHousehold} />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingHousehold(household)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {household.description && (
                  <p className="text-gray-600 mb-3">{household.description}</p>
                )}
                <div className="text-sm text-gray-500">
                  Created: {new Date(household.dateCreated).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingHousehold && (
        <Dialog open={!!deletingHousehold} onOpenChange={(open) => !open && setDeletingHousehold(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Household</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Are you sure you want to delete "{deletingHousehold.name}"?</p>
              <p className="text-sm text-gray-600">
                This action cannot be undone. The household will be permanently removed.
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDeletingHousehold(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteHousehold}>
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);

  // Fetch available entities for reporting
  const { data: availableEntities = [] } = useQuery({
    queryKey: ['available-entities'],
    queryFn: getAvailableEntities,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        selectedEntityIds: selectedEntityIds.length > 0 ? selectedEntityIds : undefined,
      });
      setFormData({ name: '', description: '' });
      setSelectedEntityIds([]);
    }
  };

  const handleEntityToggle = (entityId: string) => {
    setSelectedEntityIds(prev =>
      prev.includes(entityId)
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Household Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Smith Family"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the household"
          rows={3}
        />
      </div>
      
      {/* Entity Selection for Reporting */}
      {availableEntities.length > 0 && (
        <div className="space-y-3">
          <Label>Select Entities for Reporting (Optional)</Label>
          <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
            {availableEntities.map((entity) => (
              <div key={entity.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`entity-${entity.id}`}
                  checked={selectedEntityIds.includes(entity.id)}
                  onCheckedChange={() => handleEntityToggle(entity.id)}
                />
                <Label
                  htmlFor={`entity-${entity.id}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {entity.name}
                  {entity.relationship && (
                    <span className="text-muted-foreground ml-1">
                      ({entity.relationship})
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </div>
          {selectedEntityIds.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedEntityIds.length} entity{selectedEntityIds.length !== 1 ? 's' : ''} selected for reporting
            </p>
          )}
        </div>
      )}
      
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
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);

  // Fetch available entities for reporting
  const { data: availableEntities = [] } = useQuery({
    queryKey: ['available-entities'],
    queryFn: getAvailableEntities,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        selectedEntityIds: selectedEntityIds.length > 0 ? selectedEntityIds : undefined,
      });
    }
  };

  const handleEntityToggle = (entityId: string) => {
    setSelectedEntityIds(prev =>
      prev.includes(entityId)
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Household Name</Label>
        <Input
          id="edit-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Smith Family"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-description">Description (Optional)</Label>
        <Textarea
          id="edit-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the household"
          rows={3}
        />
      </div>
      
      {/* Entity Selection for Reporting */}
      {availableEntities.length > 0 && (
        <div className="space-y-3">
          <Label>Select Entities for Reporting (Optional)</Label>
          <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
            {availableEntities.map((entity) => (
              <div key={entity.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`edit-entity-${entity.id}`}
                  checked={selectedEntityIds.includes(entity.id)}
                  onCheckedChange={() => handleEntityToggle(entity.id)}
                />
                <Label
                  htmlFor={`edit-entity-${entity.id}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {entity.name}
                  {entity.relationship && (
                    <span className="text-muted-foreground ml-1">
                      ({entity.relationship})
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </div>
          {selectedEntityIds.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedEntityIds.length} entity{selectedEntityIds.length !== 1 ? 's' : ''} selected for reporting
            </p>
          )}
        </div>
      )}
      
      <div className="flex justify-end space-x-2">
        <Button type="submit">Update Household</Button>
      </div>
    </form>
  );
}; 