import { IndividualEntity } from './entities';

export interface Household {
  id: string;
  name: string;
  description?: string;
  primaryContactId?: string;
  members: IndividualEntity[];
  dateCreated: string;
  dateUpdated: string;
}

export interface CreateHouseholdData {
  name: string;
  description?: string;
  primaryContactId?: string;
}

export interface UpdateHouseholdData {
  name?: string;
  description?: string;
  primaryContactId?: string;
}

export interface HouseholdMember {
  entityId: string;
  isPrimaryContact: boolean;
} 