import { supabase } from './client';
import { Tables, TablesInsert, TablesUpdate } from './types';
import { Household, CreateHouseholdData, UpdateHouseholdData } from '../../types/households';
import { IndividualEntity } from '../../types/entities';

type HouseholdRow = Tables<'households'>;
type HouseholdInsert = TablesInsert<'households'>;
type HouseholdUpdate = TablesUpdate<'households'>;

// Convert database row to frontend type
const mapHouseholdRow = (row: HouseholdRow): Household => ({
  id: row.id,
  name: row.name,
  description: row.description || undefined,
  primaryContactId: row.primary_contact_id || undefined,
  members: [], // Will be populated separately
  dateCreated: row.created_at,
  dateUpdated: row.updated_at,
});

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

// Get a single household by ID
export const getHousehold = async (id: string): Promise<Household | null> => {
  const { data, error } = await supabase
    .from('households')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching household:', error);
    throw error;
  }

  return data ? mapHouseholdRow(data) : null;
};

// Create a new household
export const createHousehold = async (householdData: CreateHouseholdData): Promise<Household> => {
  const insertData: HouseholdInsert = {
    name: householdData.name,
    description: householdData.description || null,
    primary_contact_id: householdData.primaryContactId || null,
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

  return mapHouseholdRow(data);
};

// Update a household
export const updateHousehold = async (id: string, householdData: UpdateHouseholdData): Promise<Household> => {
  const updateData: HouseholdUpdate = {
    name: householdData.name,
    description: householdData.description || null,
    primary_contact_id: householdData.primaryContactId || null,
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

  return mapHouseholdRow(data);
};

// Delete a household
export const deleteHousehold = async (id: string): Promise<void> => {
  // First, remove household_id from all entities in this household
  const { error: updateError } = await supabase
    .from('entities')
    .update({ household_id: null })
    .eq('household_id', id);

  if (updateError) {
    console.error('Error removing entities from household:', updateError);
    throw updateError;
  }

  // Then delete the household
  const { error } = await supabase
    .from('households')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting household:', error);
    throw error;
  }
};

// Get all members of a household
export const getHouseholdMembers = async (householdId: string): Promise<IndividualEntity[]> => {
  const { data, error } = await supabase
    .from('entities')
    .select('*')
    .eq('household_id', householdId)
    .eq('type', 'individual')
    .order('name');

  if (error) {
    console.error('Error fetching household members:', error);
    throw error;
  }

  const household = await getHousehold(householdId);
  
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
    householdId: row.household_id || undefined,
    isPrimaryContact: row.household_id === householdId && row.id === household?.primaryContactId,
  }));
};

// Add a member to a household
export const addMemberToHousehold = async (entityId: string, householdId: string): Promise<void> => {
  const { error } = await supabase
    .from('entities')
    .update({ household_id: householdId })
    .eq('id', entityId)
    .eq('type', 'individual');

  if (error) {
    console.error('Error adding member to household:', error);
    throw error;
  }
};

// Remove a member from a household
export const removeMemberFromHousehold = async (entityId: string): Promise<void> => {
  const { error } = await supabase
    .from('entities')
    .update({ household_id: null })
    .eq('id', entityId);

  if (error) {
    console.error('Error removing member from household:', error);
    throw error;
  }
};

// Get households with their members
export const getHouseholdsWithMembers = async (): Promise<Household[]> => {
  const households = await getHouseholds();
  
  const householdsWithMembers = await Promise.all(
    households.map(async (household) => {
      const members = await getHouseholdMembers(household.id);
      return {
        ...household,
        members,
      };
    })
  );

  return householdsWithMembers;
}; 