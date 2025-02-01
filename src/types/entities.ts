export type EntityType = "individual" | "company" | "trust" | "super_fund";

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  description?: string;
  taxIdentifier?: string; // Tax ID, SSN, etc.
  countryOfResidence: string;
  dateAdded: string;
}

export interface FamilyMember extends Entity {
  type: "individual";
  relationship: string;
  dateOfBirth?: string;
}

export interface BusinessEntity extends Entity {
  type: "company" | "trust" | "super_fund";
  registrationNumber?: string;
  incorporationDate?: string;
}