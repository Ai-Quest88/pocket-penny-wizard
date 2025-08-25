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
      accounts: {
        Row: {
          account_number: string | null
          balance: number | null
          created_at: string | null
          currency: string | null
          entity_id: string
          id: string
          institution: string | null
          is_active: boolean | null
          name: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_number?: string | null
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          entity_id: string
          id?: string
          institution?: string | null
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_number?: string | null
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          entity_id?: string
          id?: string
          institution?: string | null
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          account_number: string | null
          address: string | null
          category: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          entity_id: string
          id: string
          location: string | null
          name: string
          opening_balance: number | null
          opening_balance_date: string | null
          purchase_date: string | null
          purchase_price: number | null
          type: string
          updated_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          account_number?: string | null
          address?: string | null
          category?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          entity_id: string
          id?: string
          location?: string | null
          name: string
          opening_balance?: number | null
          opening_balance_date?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          type: string
          updated_at?: string | null
          user_id: string
          value: number
        }
        Update: {
          account_number?: string | null
          address?: string | null
          category?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          entity_id?: string
          id?: string
          location?: string | null
          name?: string
          opening_balance?: number | null
          opening_balance_date?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
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
      budget_categories: {
        Row: {
          budget_id: string
          category_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          budget_id: string
          category_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          budget_id?: string
          category_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_categories_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          period: string
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          period: string
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          period?: string
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          group_id: string | null
          icon: string | null
          id: string
          is_ai_generated: boolean | null
          is_system: boolean | null
          merchant_patterns: string[] | null
          name: string
          sort_order: number | null
          type: string
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
          is_system?: boolean | null
          merchant_patterns?: string[] | null
          name: string
          sort_order?: number | null
          type: string
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
          is_system?: boolean | null
          merchant_patterns?: string[] | null
          name?: string
          sort_order?: number | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "category_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      category_discovery_sessions: {
        Row: {
          categories_created: number | null
          created_at: string | null
          groups_created: number | null
          id: string
          transaction_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          categories_created?: number | null
          created_at?: string | null
          groups_created?: number | null
          id?: string
          transaction_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          categories_created?: number | null
          created_at?: string | null
          groups_created?: number | null
          id?: string
          transaction_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      category_groups: {
        Row: {
          category_type: string | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_ai_generated: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_type?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_ai_generated?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_type?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_ai_generated?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      entities: {
        Row: {
          address: string | null
          country_of_residence: string | null
          created_at: string | null
          date_added: string | null
          date_of_birth: string | null
          description: string | null
          email: string | null
          household_id: string | null
          id: string
          incorporation_date: string | null
          name: string
          phone: string | null
          registration_number: string | null
          tax_identifier: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          country_of_residence?: string | null
          created_at?: string | null
          date_added?: string | null
          date_of_birth?: string | null
          description?: string | null
          email?: string | null
          household_id?: string | null
          id?: string
          incorporation_date?: string | null
          name: string
          phone?: string | null
          registration_number?: string | null
          tax_identifier?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          country_of_residence?: string | null
          created_at?: string | null
          date_added?: string | null
          date_of_birth?: string | null
          description?: string | null
          email?: string | null
          household_id?: string | null
          id?: string
          incorporation_date?: string | null
          name?: string
          phone?: string | null
          registration_number?: string | null
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
      households: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      liabilities: {
        Row: {
          account_number: string | null
          amount: number
          category: string | null
          country: string | null
          created_at: string | null
          credit_limit: number | null
          currency: string | null
          description: string | null
          entity_id: string
          id: string
          interest_rate: number | null
          monthly_payment: number | null
          name: string
          opening_balance: number | null
          opening_balance_date: string | null
          original_amount: number | null
          start_date: string | null
          term_months: number | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_number?: string | null
          amount: number
          category?: string | null
          country?: string | null
          created_at?: string | null
          credit_limit?: number | null
          currency?: string | null
          description?: string | null
          entity_id: string
          id?: string
          interest_rate?: number | null
          monthly_payment?: number | null
          name: string
          opening_balance?: number | null
          opening_balance_date?: string | null
          original_amount?: number | null
          start_date?: string | null
          term_months?: number | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_number?: string | null
          amount?: number
          category?: string | null
          country?: string | null
          created_at?: string | null
          credit_limit?: number | null
          currency?: string | null
          description?: string | null
          entity_id?: string
          id?: string
          interest_rate?: number | null
          monthly_payment?: number | null
          name?: string
          opening_balance?: number | null
          opening_balance_date?: string | null
          original_amount?: number | null
          start_date?: string | null
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
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          asset_account_id: string | null
          category_id: string | null
          created_at: string | null
          currency: string | null
          date: string
          description: string | null
          id: string
          is_reconciled: boolean | null
          liability_account_id: string | null
          notes: string | null
          reference: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          asset_account_id?: string | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          date: string
          description?: string | null
          id?: string
          is_reconciled?: boolean | null
          liability_account_id?: string | null
          notes?: string | null
          reference?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          asset_account_id?: string | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string
          description?: string | null
          id?: string
          is_reconciled?: boolean | null
          liability_account_id?: string | null
          notes?: string | null
          reference?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_transactions_asset_account"
            columns: ["asset_account_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_liability_account"
            columns: ["liability_account_id"]
            isOneToOne: false
            referencedRelation: "liabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          currency_preference: string | null
          display_name: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          currency_preference?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          currency_preference?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_default_categories_for_user: {
        Args: { target_user_id: string }
        Returns: undefined
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
