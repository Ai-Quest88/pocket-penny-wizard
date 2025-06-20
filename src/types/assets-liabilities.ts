
export type AssetType = "cash" | "investment" | "property" | "vehicle" | "other";
export type LiabilityType = "credit" | "loan" | "mortgage" | "other";

export type AssetCategory =
  | "savings_account"
  | "checking_account"
  | "term_deposit"
  | "stocks"
  | "bonds"
  | "mutual_funds"
  | "residential"
  | "commercial"
  | "land"
  | "car"
  | "motorcycle"
  | "boat"
  | "other_asset";

export type LiabilityCategory =
  | "credit_card"
  | "personal_loan"
  | "student_loan"
  | "auto_loan"
  | "home_loan"
  | "investment_loan"
  | "other_liability";

export const assetCategoryGroups: Record<AssetType, AssetCategory[]> = {
  cash: ["savings_account", "checking_account", "term_deposit"],
  investment: ["stocks", "bonds", "mutual_funds"],
  property: ["residential", "commercial", "land"],
  vehicle: ["car", "motorcycle", "boat"],
  other: ["other_asset"],
};

export const liabilityCategoryGroups: Record<LiabilityType, LiabilityCategory[]> = {
  credit: ["credit_card"],
  loan: ["personal_loan", "student_loan", "auto_loan"],
  mortgage: ["home_loan", "investment_loan"],
  other: ["other_liability"],
};

export interface HistoricalValue {
  date: string;
  value: number;
}

export interface Asset {
  id: string;
  entityId: string;
  name: string;
  value: number;
  type: AssetType;
  category: AssetCategory;
  history: HistoricalValue[];
  accountNumber?: string; // For cash assets
  address?: string; // For property assets
  openingBalance: number; // New field
  openingBalanceDate: string; // New field
}

export interface Liability {
  id: string;
  entityId: string;
  name: string;
  amount: number;
  type: LiabilityType;
  category: LiabilityCategory;
  history: HistoricalValue[];
  accountNumber?: string; // For credit cards and loans
  interestRate?: number; // Interest rate percentage
  termMonths?: number; // Loan term in months
  monthlyPayment?: number; // Monthly payment amount
  openingBalance: number; // New field
  openingBalanceDate: string; // New field
}
