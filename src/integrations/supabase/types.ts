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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_name: string
          account_number: string | null
          account_type: Database["public"]["Enums"]["cash_account_type"]
          bank_name: string | null
          chart_account_id: string | null
          created_at: string
          currency: string
          current_balance: number
          iban: string | null
          id: string
          initial_balance: number
          is_active: boolean
          notes: string | null
          swift: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number?: string | null
          account_type: Database["public"]["Enums"]["cash_account_type"]
          bank_name?: string | null
          chart_account_id?: string | null
          created_at?: string
          currency?: string
          current_balance?: number
          iban?: string | null
          id?: string
          initial_balance?: number
          is_active?: boolean
          notes?: string | null
          swift?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string | null
          account_type?: Database["public"]["Enums"]["cash_account_type"]
          bank_name?: string | null
          chart_account_id?: string | null
          created_at?: string
          currency?: string
          current_balance?: number
          iban?: string | null
          id?: string
          initial_balance?: number
          is_active?: boolean
          notes?: string | null
          swift?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_chart_account_id_fkey"
            columns: ["chart_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bassins: {
        Row: {
          address: string | null
          capacity_tonnes: number | null
          code: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["bassin_status"]
          surface_m2: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          capacity_tonnes?: number | null
          code?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["bassin_status"]
          surface_m2?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          capacity_tonnes?: number | null
          code?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["bassin_status"]
          surface_m2?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      campagnes: {
        Row: {
          actual_production_tonnes: number
          budget: number
          closed_at: string | null
          closed_by: string | null
          code: string | null
          created_at: string
          end_date: string | null
          id: string
          name: string
          notes: string | null
          spent_amount: number
          start_date: string
          status: Database["public"]["Enums"]["campagne_status"]
          target_production_tonnes: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          actual_production_tonnes?: number
          budget?: number
          closed_at?: string | null
          closed_by?: string | null
          code?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          notes?: string | null
          spent_amount?: number
          start_date: string
          status?: Database["public"]["Enums"]["campagne_status"]
          target_production_tonnes?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          actual_production_tonnes?: number
          budget?: number
          closed_at?: string | null
          closed_by?: string | null
          code?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          spent_amount?: number
          start_date?: string
          status?: Database["public"]["Enums"]["campagne_status"]
          target_production_tonnes?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          account_class: number
          account_name: string
          account_number: string
          account_type: Database["public"]["Enums"]["account_type"]
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          parent_account_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_class: number
          account_name: string
          account_number: string
          account_type: Database["public"]["Enums"]["account_type"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          parent_account_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_class?: number
          account_name?: string
          account_number?: string
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          parent_account_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_workers: {
        Row: {
          created_at: string
          daily_rate: number | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_rate?: number | null
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_rate?: number | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string | null
          employee_number: string | null
          employee_type: Database["public"]["Enums"]["employee_type"]
          full_name: string
          hire_date: string | null
          id: string
          is_active: boolean
          phone: string | null
          position: string | null
          salary: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          employee_number?: string | null
          employee_type?: Database["public"]["Enums"]["employee_type"]
          full_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          position?: string | null
          salary?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          employee_number?: string | null
          employee_type?: Database["public"]["Enums"]["employee_type"]
          full_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          position?: string | null
          salary?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      expense_types: {
        Row: {
          created_at: string
          default_account_id: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_account_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_account_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_types_default_account_id_fkey"
            columns: ["default_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_payments: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          created_by: string | null
          daily_worker_id: string | null
          employee_id: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          period_end: string | null
          period_start: string | null
          reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          created_at?: string
          created_by?: string | null
          daily_worker_id?: string | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          period_end?: string | null
          period_start?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          created_by?: string | null
          daily_worker_id?: string | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          period_end?: string | null
          period_start?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_payments_daily_worker_id_fkey"
            columns: ["daily_worker_id"]
            isOneToOne: false
            referencedRelation: "daily_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_payments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      team_attendance: {
        Row: {
          attendance_date: string
          calculated_amount: number
          created_at: string
          daily_rate: number
          employee_id: string
          hours_worked: number
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          team_id: string
          tenant_id: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          attendance_date: string
          calculated_amount?: number
          created_at?: string
          daily_rate?: number
          employee_id: string
          hours_worked?: number
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          team_id: string
          tenant_id: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          attendance_date?: string
          calculated_amount?: number
          created_at?: string
          daily_rate?: number
          employee_id?: string
          hours_worked?: number
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          team_id?: string
          tenant_id?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_attendance_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          team_lead_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          team_lead_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          team_lead_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          phone: string | null
          settings: Json | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          settings?: Json | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          settings?: Json | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_tenant_member: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      seed_chart_of_accounts: {
        Args: { _tenant_id: string }
        Returns: undefined
      }
    }
    Enums: {
      account_type: "actif" | "passif" | "charge" | "produit" | "capitaux"
      app_role:
        | "gerant"
        | "chef_production"
        | "comptable"
        | "commercial"
        | "rh"
        | "magasinier"
        | "admin"
      attendance_status: "pending" | "validated" | "paid"
      bassin_status: "actif" | "inactif" | "maintenance" | "recolte"
      campagne_status: "planifiee" | "en_cours" | "cloturee" | "annulee"
      cash_account_type: "banque" | "caisse" | "mobile_money"
      employee_type: "permanent" | "saisonnier" | "journalier"
      payment_status: "pending" | "paid" | "cancelled"
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
    Enums: {
      account_type: ["actif", "passif", "charge", "produit", "capitaux"],
      app_role: [
        "gerant",
        "chef_production",
        "comptable",
        "commercial",
        "rh",
        "magasinier",
        "admin",
      ],
      attendance_status: ["pending", "validated", "paid"],
      bassin_status: ["actif", "inactif", "maintenance", "recolte"],
      campagne_status: ["planifiee", "en_cours", "cloturee", "annulee"],
      cash_account_type: ["banque", "caisse", "mobile_money"],
      employee_type: ["permanent", "saisonnier", "journalier"],
      payment_status: ["pending", "paid", "cancelled"],
    },
  },
} as const
