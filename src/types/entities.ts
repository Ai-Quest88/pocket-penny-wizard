export type EntityType = "individual" | "company" | "trust" | "super_fund";

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  description?: string;
  taxIdentifier?: string;
  countryOfResidence: string;
  dateAdded: string;
}

export interface IndividualEntity extends Entity {
  type: "individual";
  relationship?: string; // e.g., "spouse", "child", "parent", "self"
  dateOfBirth?: string;
  householdId?: string; // NEW: Link to household group
  isPrimaryContact?: boolean; // NEW: For household management
}

export interface BusinessEntity extends Entity {
  type: "company" | "trust" | "super_fund";
  registrationNumber?: string;
  incorporationDate?: string;
}

export type EntityUnion = IndividualEntity | BusinessEntity;