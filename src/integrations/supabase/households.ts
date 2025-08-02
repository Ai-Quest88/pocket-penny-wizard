import { supabase } from './client';
import { Household, CreateHouseholdData, UpdateHouseholdData } from '../../types/households';
import { IndividualEntity } from '../../types/entities';

// Map database row to Household interface
const mapHouseholdRow = (row: any): Household => ({
  id: row.id,
  name: row.name,
  description: row.description || undefined,
  dateCreated: row.created_at,
  dateUpdated: row.updated_at,
});

// Create a new household
export const createHousehold = async (householdData: CreateHouseholdData): Promise<Household> => {
  const insertData = {
    name: householdData.name,
    description: householdData.description || null,
    user_id: (await supabase.auth.getUser()).data.user?.id || '',
  };

  const { data, error } = await supabase
    .from('households')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating household:', error);
    throw error;
  }

  // Add selected entities to the household for reporting if any
  if (householdData.selectedEntityIds && householdData.selectedEntityIds.length > 0) {
    for (const entityId of householdData.selectedEntityIds) {
      await addEntityToHousehold(data.id, entityId);
    }
  }

  return mapHouseholdRow(data);
};

// Update a household
export const updateHousehold = async (id: string, householdData: UpdateHouseholdData): Promise<Household> => {
  const updateData = {
    name: householdData.name,
    description: householdData.description || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('households')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating household:', error);
    throw error;
  }

  // Update entity relationships for reporting if provided
  if (householdData.selectedEntityIds !== undefined) {
    // For now, just log the selected entities since junction table isn't available
    console.log(`Household ${id} would have entities:`, householdData.selectedEntityIds);
  }

  return mapHouseholdRow(data);
};

// Delete a household
export const deleteHousehold = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('households')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting household:', error);
    throw error;
  }
};

// Get all households for the current user
export const getHouseholds = async (): Promise<Household[]> => {
  const { data, error } = await supabase
    .from('households')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching households:', error);
    throw error;
  }

  return data.map(mapHouseholdRow);
};

// Get a single household
export const getHousehold = async (id: string): Promise<Household> => {
  const { data, error } = await supabase
    .from('households')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching household:', error);
    throw error;
  }

  return mapHouseholdRow(data);
};

// Get all entities that can be added to households (for reporting purposes)
export const getAvailableEntities = async (): Promise<IndividualEntity[]> => {
  const { data, error } = await supabase
    .from('entities')
    .select('*')
    .eq('type', 'individual')
    .order('name');

  if (error) {
    console.error('Error fetching available entities:', error);
    throw error;
  }

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type as 'individual',
    description: row.description || undefined,
    taxIdentifier: row.tax_identifier || undefined,
    countryOfResidence: row.country_of_residence,
    dateAdded: row.date_added,
    relationship: row.relationship || undefined,
    dateOfBirth: row.date_of_birth || undefined,
  }));
};

// Get entities for a specific household (for reporting)
export const getHouseholdEntities = async (householdId: string): Promise<IndividualEntity[]> => {
  // For now, return all individual entities since we're not storing the relationship
  // This can be enhanced later with a proper junction table if needed
  return getAvailableEntities();
};

// Add entity to household for reporting (placeholder for future implementation)
export const addEntityToHousehold = async (householdId: string, entityId: string): Promise<void> => {
  // TODO: Implement when junction table is available
  console.log(`Adding entity ${entityId} to household ${householdId} for reporting`);
};

// Remove entity from household (placeholder for future implementation)
export const removeEntityFromHousehold = async (householdId: string, entityId: string): Promise<void> => {
  // TODO: Implement when junction table is available
  console.log(`Removing entity ${entityId} from household ${householdId}`);
};

// Get entities that are already in a household (placeholder for future implementation)
export const getHouseholdEntityIds = async (householdId: string): Promise<string[]> => {
  // TODO: Implement when junction table is available
  // For now, return empty array
  return [];
}; 