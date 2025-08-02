import { IndividualEntity } from './entities';

export interface Household {
  id: string;
  name: string;
  description?: string;
  dateCreated: string;
  dateUpdated: string;
}

export interface CreateHouseholdData {
  name: string;
  description?: string;
  selectedEntityIds?: string[]; // For reporting purposes
}

export interface UpdateHouseholdData {
  name?: string;
  description?: string;
  selectedEntityIds?: string[]; // For reporting purposes
}

export interface HouseholdMember {
  entityId: string;
  isPrimaryContact: boolean;
  relationship?: string;
}

export interface EntityHouseholdRelationship {
  id: string;
  entityId: string;
  householdId: string;
  isPrimaryContact: boolean;
  relationship?: string;
  dateAdded: string;
} 