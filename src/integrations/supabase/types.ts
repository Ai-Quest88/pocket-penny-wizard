export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          account_number: string | null
          address: string | null
          category: string
          country: string
          created_at: string | null
          currency: string
          entity_id: string
          id: string
          name: string
          opening_balance: number | null
          opening_balance_date: string | null
          type: string
          updated_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          account_number?: string | null
          address?: string | null
          category: string
          country: string
          created_at?: string | null
          currency: string
          entity_id: string
          id?: string
          name: string
          opening_balance?: number | null
          opening_balance_date?: string | null
          type: string
          updated_at?: string | null
          user_id: string
          value: number
        }
        Update: {
          account_number?: string | null
          address?: string | null
          category?: string
          country?: string
          created_at?: string | null
          currency?: string
          entity_id?: string
          id?: string
          name?: string
          opening_balance?: number | null
          opening_balance_date?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "assets_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          end_date: string | null
          entity_id: string | null
          id: string
          is_active: boolean | null
          period: string | null
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          end_date?: string | null
          entity_id?: string | null
          id?: string
          is_active?: boolean | null
          period?: string | null
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          end_date?: string | null
          entity_id?: string | null
          id?: string
          is_active?: boolean | null
          period?: string | null
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_ai_generated: boolean | null
          is_transfer: boolean | null
          merchant_patterns: string[] | null
          name: string
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_transfer?: boolean | null
          merchant_patterns?: string[] | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_transfer?: boolean | null
          merchant_patterns?: string[] | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "category_buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      category_buckets: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          group_id: string | null
          icon: string | null
          id: string
          is_ai_generated: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          group_id?: string | null
          icon?: string | null
          id?: string
          is_ai_generated?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          group_id?: string | null
          icon?: string | null
          id?: string
          is_ai_generated?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_buckets_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "category_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      category_discovery_sessions: {
        Row: {
          ai_confidence_score: number | null
          categories_grouped: number | null
          created_at: string | null
          id: string
          metadata: Json | null
          new_categories_created: number | null
          session_type: string
          transactions_processed: number | null
          user_id: string
        }
        Insert: {
          ai_confidence_score?: number | null
          categories_grouped?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_categories_created?: number | null
          session_type: string
          transactions_processed?: number | null
          user_id: string
        }
        Update: {
          ai_confidence_score?: number | null
          categories_grouped?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_categories_created?: number | null
          session_type?: string
          transactions_processed?: number | null
          user_id?: string
        }
        Relationships: []
      }
      category_groups: {
        Row: {
          category_type: string
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_ai_generated: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_type: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_ai_generated?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_type?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_ai_generated?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      country_rules: {
        Row: {
          country_code: string
          country_name: string
          created_at: string | null
          currency_code: string
          financial_year_start_day: number
          financial_year_start_month: number
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string | null
          currency_code: string
          financial_year_start_day?: number
          financial_year_start_month: number
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string | null
          currency_code?: string
          financial_year_start_day?: number
          financial_year_start_month?: number
        }
        Relationships: []
      }
      entities: {
        Row: {
          country_of_residence: string
          created_at: string | null
          date_added: string | null
          date_of_birth: string | null
          description: string | null
          household_id: string | null
          id: string
          incorporation_date: string | null
          name: string
          primary_country: string
          primary_currency: string
          registration_number: string | null
          relationship: string | null
          tax_identifier: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          country_of_residence: string
          created_at?: string | null
          date_added?: string | null
          date_of_birth?: string | null
          description?: string | null
          household_id?: string | null
          id?: string
          incorporation_date?: string | null
          name: string
          primary_country?: string
          primary_currency?: string
          registration_number?: string | null
          relationship?: string | null
          tax_identifier?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          country_of_residence?: string
          created_at?: string | null
          date_added?: string | null
          date_of_birth?: string | null
          description?: string | null
          household_id?: string | null
          id?: string
          incorporation_date?: string | null
          name?: string
          primary_country?: string
          primary_currency?: string
          registration_number?: string | null
          relationship?: string | null
          tax_identifier?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entities_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      historical_values: {
        Row: {
          asset_id: string | null
          created_at: string | null
          date: string
          id: string
          liability_id: string | null
          user_id: string
          value: number
        }
        Insert: {
          asset_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          liability_id?: string | null
          user_id: string
          value: number
        }
        Update: {
          asset_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          liability_id?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "historical_values_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historical_values_liability_id_fkey"
            columns: ["liability_id"]
            isOneToOne: false
            referencedRelation: "liabilities"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          primary_contact_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          primary_contact_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          primary_contact_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "households_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      liabilities: {
        Row: {
          account_number: string | null
          amount: number
          category: string
          country: string
          created_at: string | null
          credit_limit: number | null
          currency: string
          entity_id: string
          id: string
          interest_rate: number | null
          monthly_payment: number | null
          name: string
          opening_balance: number | null
          opening_balance_date: string | null
          term_months: number | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_number?: string | null
          amount: number
          category: string
          country: string
          created_at?: string | null
          credit_limit?: number | null
          currency: string
          entity_id: string
          id?: string
          interest_rate?: number | null
          monthly_payment?: number | null
          name: string
          opening_balance?: number | null
          opening_balance_date?: string | null
          term_months?: number | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_number?: string | null
          amount?: number
          category?: string
          country?: string
          created_at?: string | null
          credit_limit?: number | null
          currency?: string
          entity_id?: string
          id?: string
          interest_rate?: number | null
          monthly_payment?: number | null
          name?: string
          opening_balance?: number | null
          opening_balance_date?: string | null
          term_months?: number | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liabilities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          category_id: string | null
          confidence_score: number | null
          country: string | null
          created_at: string | null
          id: string
          mcc: string | null
          name: string
          normalized_name: string | null
          patterns: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id?: string | null
          confidence_score?: number | null
          country?: string | null
          created_at?: string | null
          id?: string
          mcc?: string | null
          name: string
          normalized_name?: string | null
          patterns?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string | null
          confidence_score?: number | null
          country?: string | null
          created_at?: string | null
          id?: string
          mcc?: string | null
          name?: string
          normalized_name?: string | null
          patterns?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchants_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          asset_account_id: string | null
          category_id: string | null
          category_name: string | null
          comment: string | null
          created_at: string | null
          currency: string
          date: string
          description: string
          id: string
          liability_account_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          asset_account_id?: string | null
          category_id?: string | null
          category_name?: string | null
          comment?: string | null
          created_at?: string | null
          currency: string
          date: string
          description: string
          id?: string
          liability_account_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          asset_account_id?: string | null
          category_id?: string | null
          category_name?: string | null
          comment?: string | null
          created_at?: string | null
          currency?: string
          date?: string
          description?: string
          id?: string
          liability_account_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_transactions_category_id"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_asset_account_id_fkey"
            columns: ["asset_account_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_liability_account_id_fkey"
            columns: ["liability_account_id"]
            isOneToOne: false
            referencedRelation: "liabilities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          currency_preference: string | null
          email: string
          full_name: string | null
          id: string
          notification_settings: Json | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          currency_preference?: string | null
          email: string
          full_name?: string | null
          id: string
          notification_settings?: Json | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          currency_preference?: string | null
          email?: string
          full_name?: string | null
          id?: string
          notification_settings?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_financial_year: {
        Args: { country_code: string }
        Returns: {
          end_date: string
          name: string
          start_date: string
          tax_year: number
        }[]
      }
      get_financial_year_for_date: {
        Args: { country_code: string; target_date: string }
        Returns: {
          end_date: string
          name: string
          start_date: string
          tax_year: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
