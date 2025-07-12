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
        Relationships: []
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
          amount: number
          category: string
          created_at?: string
          credit_limit?: number | null
          entity_id: string
          id?: string
          interest_rate?: number | null
          monthly_payment?: number | null
          name: string
          opening_balance?: number
          opening_balance_date?: string
          term_months?: number | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          amount?: number
          category?: string
          created_at?: string
          credit_limit?: number | null
          entity_id?: string
          id?: string
          interest_rate?: number | null
          monthly_payment?: number | null
          name?: string
          opening_balance?: number
          opening_balance_date?: string
          term_months?: number | null
          type?: string
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
