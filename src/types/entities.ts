export type EntityType = "individual" | "company" | "trust" | "super_fund";

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  description?: string;
  taxIdentifier?: string;
  countryOfResidence: string;
  dateAdded: string;
  householdId?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface IndividualEntity extends Entity {
  type: "individual";
  dateOfBirth?: string;
}

export interface BusinessEntity extends Entity {
  type: "company" | "trust" | "super_fund";
  registrationNumber?: string;
  incorporationDate?: string;
}

export type EntityUnion = IndividualEntity | BusinessEntity;

// Financial Year interface (computed, not stored)
export interface FinancialYear {
  startDate: Date;
  endDate: Date;
  name: string;
  taxYear: number;
}

// Country rules interface
export interface CountryRule {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  financialYearStartMonth: number;
  financialYearStartDay: number;
}

// Legacy aliases for backward compatibility
export type FamilyMember = IndividualEntity;