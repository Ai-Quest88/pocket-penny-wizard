import { supabase } from './client';
import { Household, CreateHouseholdData, UpdateHouseholdData } from '../../types/households';
import { IndividualEntity } from '../../types/entities';

// Map database row to Household interface
const mapHouseholdRow = (row: { id: string; name: string; description: string | null; created_at: string; updated_at: string }): Household => ({
  id: row.id,
  name: row.name,
  description: row.description || undefined,
  dateCreated: row.created_at,
  dateUpdated: row.updated_at,
});

// Create a new household
export const createHousehold = async (householdData: CreateHouseholdData): Promise<Household> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('No authenticated user found');
  }

  const insertData = {
    name: householdData.name,
    description: householdData.description || null,
    user_id: user.id,
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
    // First, remove all entities from this household
    await supabase
      .from('entities')
      .update({ household_id: null })
      .eq('household_id', id);

    // Then add the selected entities to this household
    if (householdData.selectedEntityIds.length > 0) {
      for (const entityId of householdData.selectedEntityIds) {
        await addEntityToHousehold(id, entityId);
      }
    }
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No authenticated user found');
    return [];
  }

  const { data, error } = await supabase
    .from('households')
    .select('*')
    .eq('user_id', user.id)
    .order('name');

  if (error) {
    console.error('Error fetching households:', error);
    throw error;
  }

  return data.map(mapHouseholdRow);
};

// Get a single household
export const getHousehold = async (id: string): Promise<Household> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No authenticated user found');
    throw new Error('No authenticated user found');
  }

  const { data, error } = await supabase
    .from('households')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching household:', error);
    throw error;
  }

  return mapHouseholdRow(data);
};

// Get all entities that can be added to households (for reporting purposes)
export const getAvailableEntities = async (): Promise<IndividualEntity[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No authenticated user found');
    return [];
  }

  const { data, error } = await supabase
    .from('entities')
    .select('*')
    .eq('type', 'individual')
    .eq('user_id', user.id)
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No authenticated user found');
    return [];
  }

  const { data, error } = await supabase
    .from('entities')
    .select('*')
    .eq('type', 'individual')
    .eq('user_id', user.id)
    .eq('household_id', householdId)
    .order('name');

  if (error) {
    console.error('Error fetching household entities:', error);
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

// Add entity to household for reporting
export const addEntityToHousehold = async (householdId: string, entityId: string): Promise<void> => {
  const { error } = await supabase
    .from('entities')
    .update({ household_id: householdId })
    .eq('id', entityId);

  if (error) {
    console.error('Error adding entity to household:', error);
    throw error;
  }
};

// Remove entity from household
export const removeEntityFromHousehold = async (householdId: string, entityId: string): Promise<void> => {
  const { error } = await supabase
    .from('entities')
    .update({ household_id: null })
    .eq('id', entityId)
    .eq('household_id', householdId);

  if (error) {
    console.error('Error removing entity from household:', error);
    throw error;
  }
};

// Get entities that are already in a household
export const getHouseholdEntityIds = async (householdId: string): Promise<string[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No authenticated user found');
    return [];
  }

  const { data, error } = await supabase
    .from('entities')
    .select('id')
    .eq('type', 'individual')
    .eq('user_id', user.id)
    .eq('household_id', householdId);

  if (error) {
    console.error('Error fetching household entity IDs:', error);
    throw error;
  }

  return data.map(row => row.id);
};

// Add member to household (alias for addEntityToHousehold for backward compatibility)
export const addMemberToHousehold = addEntityToHousehold;

// Get households with members for the household list
export const getHouseholdsWithMembers = async (): Promise<Array<Household & { entities: IndividualEntity[] }>> => {
  const households = await getHouseholds();
  
  const householdsWithMembers = await Promise.all(
    households.map(async (household) => {
      const entities = await getHouseholdEntities(household.id);
      return { ...household, entities };
    })
  );
  
  return householdsWithMembers;
};
