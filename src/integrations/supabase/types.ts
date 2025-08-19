export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
          created_at: string
          entity_id: string
          id: string
          name: string
          opening_balance: number
          opening_balance_date: string
          type: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          account_number?: string | null
          address?: string | null
          category: string
          created_at?: string
          entity_id: string
          id?: string
          name: string
          opening_balance?: number
          opening_balance_date?: string
          type: string
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          account_number?: string | null
          address?: string | null
          category?: string
          created_at?: string
          entity_id?: string
          id?: string
          name?: string
          opening_balance?: number
          opening_balance_date?: string
          type?: string
          updated_at?: string
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
          created_at: string
          end_date: string | null
          entity_id: string | null
          id: string
          is_active: boolean
          period: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          end_date?: string | null
          entity_id?: string | null
          id?: string
          is_active?: boolean
          period?: string
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          end_date?: string | null
          entity_id?: string | null
          id?: string
          is_active?: boolean
          period?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_budgets_entity_id"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          country_of_residence: string
          created_at: string
          date_added: string
          date_of_birth: string | null
          description: string | null
          household_id: string | null
          id: string
          incorporation_date: string | null
          name: string
          registration_number: string | null
          relationship: string | null
          tax_identifier: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          country_of_residence: string
          created_at?: string
          date_added?: string
          date_of_birth?: string | null
          description?: string | null
          household_id?: string | null
          id?: string
          incorporation_date?: string | null
          name: string
          registration_number?: string | null
          relationship?: string | null
          tax_identifier?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          country_of_residence?: string
          created_at?: string
          date_added?: string
          date_of_birth?: string | null
          description?: string | null
          household_id?: string | null
          id?: string
          incorporation_date?: string | null
          name?: string
          registration_number?: string | null
          relationship?: string | null
          tax_identifier?: string | null
          type?: string
          updated_at?: string
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
          created_at: string
          date: string
          id: string
          liability_id: string | null
          user_id: string
          value: number
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          date: string
          id?: string
          liability_id?: string | null
          user_id: string
          value: number
        }
        Update: {
          asset_id?: string | null
          created_at?: string
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
          created_at: string
          credit_limit: number | null
          entity_id: string
          id: string
          interest_rate: number | null
          monthly_payment: number | null
          name: string
          opening_balance: number
          opening_balance_date: string
          term_months: number | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          created_at?: string
          credit_limit?: string | null
          entity_id: string
          id?: string
          interest_rate?: string | null
          monthly_payment?: string | null
          name: string
          opening_balance?: string | null
          opening_balance_date?: string | null
          term_months?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_number?: string | null
          created_at?: string
          credit_limit?: string | null
          entity_id?: string
          id?: string
          interest_rate?: string | null
          monthly_payment?: string | null
          name?: string
          opening_balance?: string | null
          opening_balance_date?: string | null
          term_months?: string | null
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
      transactions: {
        Row: {
          amount: number
          asset_account_id: string | null
          category: string
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
          category: string
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
          category?: string
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
          created_at: string
          currency_preference: string | null
          email: string
          full_name: string | null
          id: string
          notification_settings: Json | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          currency_preference?: string | null
          email: string
          full_name?: string | null
          id: string
          notification_settings?: Json | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          currency_preference?: string | null
          email?: string
          full_name?: string | null
          id?: string
          notification_settings?: Json | null
        }
        Relationships: []
      }
      // ===== NEW AI-DRIVEN CATEGORY SYSTEM =====
      category_groups: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          color: string
          icon: string
          sort_order: number
          is_ai_generated: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          color?: string
          icon?: string
          sort_order?: number
          is_ai_generated?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          color?: string
          icon?: string
          sort_order?: number
          is_ai_generated?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_groups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      category_buckets: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          group_id: string
          name: string
          description?: string | null
          color?: string
          icon?: string
          sort_order?: number
          is_ai_generated?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          group_id?: string
          name?: string
          description?: string | null
          color?: string
          icon?: string
          sort_order?: number
          is_ai_generated?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_buckets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_buckets_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "category_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          bucket_id: string
          name: string
          description?: string | null
          merchant_patterns?: string[] | null
          is_transfer?: boolean
          sort_order?: number
          is_ai_generated?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bucket_id?: string
          name?: string
          description?: string | null
          merchant_patterns?: string[] | null
          is_transfer?: boolean
          sort_order?: number
          is_ai_generated?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "category_buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      category_discovery_sessions: {
        Row: {
          id: string
          user_id: string
          session_type: string
          transactions_processed: number
          new_categories_created: number
          categories_grouped: number
          ai_confidence_score: number
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_type: string
          transactions_processed?: number
          new_categories_created?: number
          categories_grouped?: number
          ai_confidence_score?: number
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_type?: string
          transactions_processed?: number
          new_categories_created?: number
          categories_grouped?: number
          ai_confidence_score?: number
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_discovery_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          name: string
          normalized_name?: string | null
          category_id?: string | null
          mcc?: string | null
          country?: string | null
          patterns?: string[] | null
          confidence_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          normalized_name?: string | null
          category_id?: string | null
          mcc?: string | null
          country?: string | null
          patterns?: string | null
          confidence_score?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchants_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      seed_default_categories: {
        Args: Record<PropertyKey, never>
        Returns: void
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
    ? keyof DefaultSchema["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DefaultSchema[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[TableName] extends {
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
    ? keyof DefaultSchema["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DefaultSchema[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[TableName] extends {
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
    ? keyof DefaultSchema["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DefaultSchema[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[TableName] extends {
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
    ? keyof DefaultSchema["EnumName"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DefaultSchema[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][EnumName]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DefaultSchema["CompositeTypes"]
    : never = never,
> = DefaultSchema[DefaultSchemaEnumNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  ? DefaultSchema[DefaultSchemaEnumNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
