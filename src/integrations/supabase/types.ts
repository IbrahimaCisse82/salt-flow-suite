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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string | null
          balance: number | null
          created_at: string | null
          id: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          account_type?: string | null
          balance?: number | null
          created_at?: string | null
          id?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string | null
          balance?: number | null
          created_at?: string | null
          id?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bassins: {
        Row: {
          area: number | null
          code: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          area?: number | null
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          area?: number | null
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bassins_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      campagne_phase_budgets: {
        Row: {
          budgeted_amount: number | null
          campagne_id: string | null
          created_at: string | null
          id: string
          phase: string
          updated_at: string | null
        }
        Insert: {
          budgeted_amount?: number | null
          campagne_id?: string | null
          created_at?: string | null
          id?: string
          phase: string
          updated_at?: string | null
        }
        Update: {
          budgeted_amount?: number | null
          campagne_id?: string | null
          created_at?: string | null
          id?: string
          phase?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campagne_phase_budgets_campagne_id_fkey"
            columns: ["campagne_id"]
            isOneToOne: false
            referencedRelation: "campagnes"
            referencedColumns: ["id"]
          },
        ]
      }
      campagnes: {
        Row: {
          actual_production: number | null
          budget_total: number | null
          created_at: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
          target_production: number | null
          tenant_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          actual_production?: number | null
          budget_total?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          target_production?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          actual_production?: number | null
          budget_total?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
          target_production?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campagnes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          account_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          client_type: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          client_type?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          client_type?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_workers: {
        Row: {
          created_at: string | null
          daily_rate: number | null
          full_name: string
          id: string
          phone: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          daily_rate?: number | null
          full_name: string
          id?: string
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          daily_rate?: number | null
          full_name?: string
          id?: string
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_workers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          email: string | null
          employee_number: string | null
          employee_type: string | null
          full_name: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          position: string | null
          salary: number | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          employee_number?: string | null
          employee_type?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          position?: string | null
          salary?: number | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          employee_number?: string | null
          employee_type?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          position?: string | null
          salary?: number | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_types: {
        Row: {
          account_id: string | null
          account_number: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          observations: string | null
          syscohada_category: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          account_number?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          observations?: string | null
          syscohada_category: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          account_number?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          observations?: string | null
          syscohada_category?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_types_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          account_id: string | null
          account_name: string | null
          account_number: string | null
          created_at: string | null
          credit: number | null
          debit: number | null
          description: string | null
          id: string
          transaction_id: string | null
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          account_number?: string | null
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string
          transaction_id?: string | null
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          account_number?: string | null
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          sale_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          sale_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          sale_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      production_records: {
        Row: {
          bassin_id: string | null
          campagne_id: string | null
          created_at: string | null
          id: string
          production_date: string | null
          quality_grade: string | null
          quantity: number | null
          salt_type: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          bassin_id?: string | null
          campagne_id?: string | null
          created_at?: string | null
          id?: string
          production_date?: string | null
          quality_grade?: string | null
          quantity?: number | null
          salt_type: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bassin_id?: string | null
          campagne_id?: string | null
          created_at?: string | null
          id?: string
          production_date?: string | null
          quality_grade?: string | null
          quantity?: number | null
          salt_type?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_records_bassin_id_fkey"
            columns: ["bassin_id"]
            isOneToOne: false
            referencedRelation: "bassins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_records_campagne_id_fkey"
            columns: ["campagne_id"]
            isOneToOne: false
            referencedRelation: "campagnes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string | null
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
      sales: {
        Row: {
          amount_paid: number | null
          campagne_id: string | null
          can_be_delivered: boolean | null
          client_id: string | null
          created_at: string | null
          customer_name: string | null
          delivered: boolean | null
          delivery_date: string | null
          delivery_number: string | null
          discount: number | null
          id: string
          invoice_number: string | null
          notes: string | null
          payment_status: string | null
          quantity: number | null
          sale_date: string | null
          salt_type: string
          tenant_id: string | null
          total_amount: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          campagne_id?: string | null
          can_be_delivered?: boolean | null
          client_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          delivered?: boolean | null
          delivery_date?: string | null
          delivery_number?: string | null
          discount?: number | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_status?: string | null
          quantity?: number | null
          sale_date?: string | null
          salt_type: string
          tenant_id?: string | null
          total_amount?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          campagne_id?: string | null
          can_be_delivered?: boolean | null
          client_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          delivered?: boolean | null
          delivery_date?: string | null
          delivery_number?: string | null
          discount?: number | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_status?: string | null
          quantity?: number | null
          sale_date?: string | null
          salt_type?: string
          tenant_id?: string | null
          total_amount?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_campagne_id_fkey"
            columns: ["campagne_id"]
            isOneToOne: false
            referencedRelation: "campagnes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          id: string
          ip_address: string | null
          new_value: string | null
          old_value: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          ip_address?: string | null
          new_value?: string | null
          old_value?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          ip_address?: string | null
          new_value?: string | null
          old_value?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          manager_name: string | null
          name: string
          ninea: string | null
          rccm: string | null
          subdomain: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          manager_name?: string | null
          name: string
          ninea?: string | null
          rccm?: string | null
          subdomain?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          manager_name?: string | null
          name?: string
          ninea?: string | null
          rccm?: string | null
          subdomain?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number | null
          campagne_id: string | null
          campagne_phase: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          document_number: string | null
          id: string
          journal_code: string | null
          notes: string | null
          reference: string | null
          tenant_id: string | null
          transaction_date: string | null
          transaction_type: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          campagne_id?: string | null
          campagne_phase?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_number?: string | null
          id?: string
          journal_code?: string | null
          notes?: string | null
          reference?: string | null
          tenant_id?: string | null
          transaction_date?: string | null
          transaction_type?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          campagne_id?: string | null
          campagne_phase?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_number?: string | null
          id?: string
          journal_code?: string | null
          notes?: string | null
          reference?: string | null
          tenant_id?: string | null
          transaction_date?: string | null
          transaction_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_campagne_id_fkey"
            columns: ["campagne_id"]
            isOneToOne: false
            referencedRelation: "campagnes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      clients_safe: {
        Row: {
          address: string | null
          client_type: string | null
          created_at: string | null
          email: string | null
          id: string | null
          name: string | null
          phone: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      employees_safe: {
        Row: {
          created_at: string | null
          email: string | null
          employee_number: string | null
          employee_type: string | null
          full_name: string | null
          hire_date: string | null
          id: string | null
          is_active: boolean | null
          phone: string | null
          position: string | null
          salary: number | null
          tenant_id: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      profiles_safe: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      profiles_with_roles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          tenant_id: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_clients_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          address: string
          client_type: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          tenant_id: string
          updated_at: string
        }[]
      }
      get_employees_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          employee_number: string
          employee_type: string
          full_name: string
          hire_date: string
          id: string
          is_active: boolean
          phone: string
          position: string
          salary: number
          tenant_id: string
          updated_at: string
        }[]
      }
      get_primary_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_profiles_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          created_at: string
          full_name: string
          id: string
          tenant_id: string
          updated_at: string
        }[]
      }
      get_profiles_with_roles: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          updated_at: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_tenant_id: {
        Args: { user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager_or_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      update_own_profile: {
        Args: {
          new_avatar_url?: string
          new_full_name?: string
          new_phone?: string
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gerant" | "commercial" | "comptable" | "production"
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
      app_role: ["admin", "gerant", "commercial", "comptable", "production"],
    },
  },
} as const
