export interface Asset {
  id: string
  name: string
  value: number
  type: "cash" | "investment" | "property" | "vehicle" | "other"
  category: AssetCategory
  history: ValueHistory[]
}

export interface Liability {
  id: string
  name: string
  amount: number
  type: "credit" | "loan" | "mortgage" | "other"
  category: LiabilityCategory
  history: ValueHistory[]
}

export interface ValueHistory {
  date: string // ISO date string
  value: number
}

export type AssetCategory =
  // Cash & Bank
  | "savings_account"
  | "checking_account"
  | "term_deposit"
  | "emergency_fund"
  // Investments
  | "stocks"
  | "bonds"
  | "mutual_funds"
  | "etfs"
  | "cryptocurrency"
  | "retirement_account"
  // Property
  | "primary_residence"
  | "investment_property"
  | "vacation_home"
  | "land"
  // Vehicles
  | "car"
  | "motorcycle"
  | "boat"
  | "rv"
  // Other
  | "jewelry"
  | "art"
  | "collectibles"
  | "business_ownership"
  | "other"

export type LiabilityCategory =
  // Credit
  | "credit_card"
  | "store_card"
  | "charge_card"
  // Loans
  | "personal_loan"
  | "student_loan"
  | "auto_loan"
  | "business_loan"
  // Mortgages
  | "primary_mortgage"
  | "investment_property_loan"
  | "heloc"
  | "reverse_mortgage"
  // Other
  | "medical_debt"
  | "tax_debt"
  | "family_loan"
  | "other"

export const assetCategoryGroups = {
  cash: ["savings_account", "checking_account", "term_deposit", "emergency_fund"],
  investment: ["stocks", "bonds", "mutual_funds", "etfs", "cryptocurrency", "retirement_account"],
  property: ["primary_residence", "investment_property", "vacation_home", "land"],
  vehicle: ["car", "motorcycle", "boat", "rv"],
  other: ["jewelry", "art", "collectibles", "business_ownership", "other"]
} as const

export const liabilityCategoryGroups = {
  credit: ["credit_card", "store_card", "charge_card"],
  loan: ["personal_loan", "student_loan", "auto_loan", "business_loan"],
  mortgage: ["primary_mortgage", "investment_property_loan", "heloc", "reverse_mortgage"],
  other: ["medical_debt", "tax_debt", "family_loan", "other"]
} as const
