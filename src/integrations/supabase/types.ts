// Simple, maintainable database types
// Add types incrementally as needed

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  currency_preference: string | null
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  description: string
  amount: number
  date: string
  currency: string
  category_id: string | null
  category_name: string | null
  comment: string | null
  asset_account_id: string | null
  liability_account_id: string | null
  created_at: string | null
  updated_at: string | null
}

export interface Asset {
  id: string
  user_id: string
  entity_id: string
  name: string
  type: string
  category: string
  value: number
  opening_balance: number
  opening_balance_date: string
          account_number: string | null
          address: string | null
          created_at: string
  updated_at: string
}

export interface Liability {
  id: string
  user_id: string
          entity_id: string
          name: string
  type: string
  category: string
  amount: number
          opening_balance: number
          opening_balance_date: string
  credit_limit: number | null
  interest_rate: number | null
  monthly_payment: number | null
  term_months: number | null
  account_number: string | null
  created_at: string
          updated_at: string
}

export interface Entity {
  id: string
          user_id: string
  household_id: string | null
          name: string
          type: string
  description: string | null
  country_of_residence: string
  relationship: string | null
  date_of_birth: string | null
  incorporation_date: string | null
  tax_identifier: string | null
  registration_number: string | null
  date_added: string
  created_at: string
  updated_at: string
}

export interface Household {
  id: string
          user_id: string
  name: string
  description: string | null
  primary_contact_id: string | null
  created_at: string | null
  updated_at: string | null
}

export interface Budget {
  id: string
  user_id: string
  entity_id: string | null
  category: string
          amount: number
          period: string
          start_date: string
  end_date: string | null
  is_active: boolean
  created_at: string
          updated_at: string
}

// ===== AI-DRIVEN CATEGORY SYSTEM =====

export interface CategoryGroup {
  id: string
          user_id: string
          name: string
  category_type: 'income' | 'expense' | 'asset' | 'liability' | 'transfer'
  description: string | null
  color: string
  icon: string
          sort_order: number
  is_ai_generated: boolean
  created_at: string
          updated_at: string
}

export interface CategoryBucket {
  id: string
          user_id: string
          group_id: string
          name: string
  description: string | null
  color: string
  icon: string
          sort_order: number
  is_ai_generated: boolean
  created_at: string
          updated_at: string
}

export interface Category {
  id: string
          user_id: string
  bucket_id: string
          name: string
  description: string | null
  merchant_patterns: string[] | null
  is_transfer: boolean
          sort_order: number
  is_ai_generated: boolean
  created_at: string
          updated_at: string
        }

export interface Merchant {
          id: string
          user_id: string
          name: string
  normalized_name: string | null
  category_id: string | null
  mcc: string | null
  country: string | null
  patterns: string[] | null
  confidence_score: number
          created_at: string
  updated_at: string
}

export interface CategoryDiscoverySession {
          id: string
          user_id: string
  session_type: string
  transactions_processed: number
  new_categories_created: number
  categories_grouped: number
  ai_confidence_score: number
  metadata: Record<string, any> | null
          created_at: string
}

export interface HistoricalValue {
          id: string
          user_id: string
  asset_id: string | null
  liability_id: string | null
          date: string
  value: number
          created_at: string
}

// Simple Database type for Supabase client
export interface Database {
  public: {
    Tables: {
      user_profiles: { Row: UserProfile; Insert: Partial<UserProfile>; Update: Partial<UserProfile> }
      transactions: { Row: Transaction; Insert: Partial<Transaction>; Update: Partial<Transaction> }
      assets: { Row: Asset; Insert: Partial<Asset>; Update: Partial<Asset> }
      liabilities: { Row: Liability; Insert: Partial<Liability>; Update: Partial<Liability> }
      entities: { Row: Entity; Insert: Partial<Entity>; Update: Partial<Entity> }
      households: { Row: Household; Insert: Partial<Household>; Update: Partial<Household> }
      budgets: { Row: Budget; Insert: Partial<Budget>; Update: Partial<Budget> }
      category_groups: { Row: CategoryGroup; Insert: Partial<CategoryGroup>; Update: Partial<CategoryGroup> }
      category_buckets: { Row: CategoryBucket; Insert: Partial<CategoryBucket>; Update: Partial<CategoryBucket> }
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> }
      merchants: { Row: Merchant; Insert: Partial<Merchant>; Update: Partial<Merchant> }
      category_discovery_sessions: { Row: CategoryDiscoverySession; Insert: Partial<CategoryDiscoverySession>; Update: Partial<CategoryDiscoverySession> }
      historical_values: { Row: HistoricalValue; Insert: Partial<HistoricalValue>; Update: Partial<HistoricalValue> }
    }
  }
}

// Extended types with nested relationships for UI components
export interface CategoryGroupWithRelations extends CategoryGroup {
  buckets?: CategoryBucketWithRelations[]
}

export interface CategoryBucketWithRelations extends CategoryBucket {
  categories?: Category[]
}

// Utility types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']