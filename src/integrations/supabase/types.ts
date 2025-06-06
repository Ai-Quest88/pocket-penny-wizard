export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          entity_id: string
          id: string
          interest_rate: number | null
          monthly_payment: number | null
          name: string
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
          entity_id: string
          id?: string
          interest_rate?: number | null
          monthly_payment?: number | null
          name: string
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
          entity_id?: string
          id?: string
          interest_rate?: number | null
          monthly_payment?: number | null
          name?: string
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
      profiles_o6nkvd_users: {
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
      transactions: {
        Row: {
          amount: number
          category: string
          comment: string | null
          created_at: string | null
          currency: string
          date: string
          description: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          comment?: string | null
          created_at?: string | null
          currency: string
          date: string
          description: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          comment?: string | null
          created_at?: string | null
          currency?: string
          date?: string
          description?: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
