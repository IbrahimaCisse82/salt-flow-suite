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
      accountant_notifications: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          notification_type: string
          reference_id: string
          tenant_id: string
          title: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          notification_type: string
          reference_id: string
          tenant_id: string
          title: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          notification_type?: string
          reference_id?: string
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "accountant_notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string | null
          balance: number | null
          created_at: string | null
          id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          account_type?: string | null
          balance?: number | null
          created_at?: string | null
          id?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string | null
          balance?: number | null
          created_at?: string | null
          id?: string
          tenant_id?: string
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
      admin_activity_logs: {
        Row: {
          action_type: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      bassins: {
        Row: {
          area: number | null
          bassin_type: string | null
          code: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          is_active: boolean | null
          is_maintenance: boolean | null
          location: string | null
          name: string
          status: string | null
          tenant_id: string
          type_bassin: Database["public"]["Enums"]["bassin_type"] | null
          updated_at: string | null
        }
        Insert: {
          area?: number | null
          bassin_type?: string | null
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          is_maintenance?: boolean | null
          location?: string | null
          name: string
          status?: string | null
          tenant_id: string
          type_bassin?: Database["public"]["Enums"]["bassin_type"] | null
          updated_at?: string | null
        }
        Update: {
          area?: number | null
          bassin_type?: string | null
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          is_maintenance?: boolean | null
          location?: string | null
          name?: string
          status?: string | null
          tenant_id?: string
          type_bassin?: Database["public"]["Enums"]["bassin_type"] | null
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
      campagne_budget_lines: {
        Row: {
          budgeted_amount: number
          campagne_id: string
          created_at: string | null
          expense_category: string
          id: string
          phase: string
          updated_at: string | null
        }
        Insert: {
          budgeted_amount?: number
          campagne_id: string
          created_at?: string | null
          expense_category: string
          id?: string
          phase: string
          updated_at?: string | null
        }
        Update: {
          budgeted_amount?: number
          campagne_id?: string
          created_at?: string | null
          expense_category?: string
          id?: string
          phase?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campagne_budget_lines_campagne_id_fkey"
            columns: ["campagne_id"]
            isOneToOne: false
            referencedRelation: "campagnes"
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
          active_phase_index: number
          actual_production: number | null
          budget_total: number | null
          created_at: string | null
          deleted_at: string | null
          end_date: string | null
          id: string
          name: string
          phase_end_overrides: Json
          start_date: string | null
          status: string | null
          target_production: number | null
          tenant_id: string
          updated_at: string | null
          year: number | null
        }
        Insert: {
          active_phase_index?: number
          actual_production?: number | null
          budget_total?: number | null
          created_at?: string | null
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          name: string
          phase_end_overrides?: Json
          start_date?: string | null
          status?: string | null
          target_production?: number | null
          tenant_id: string
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          active_phase_index?: number
          actual_production?: number | null
          budget_total?: number | null
          created_at?: string | null
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          name?: string
          phase_end_overrides?: Json
          start_date?: string | null
          status?: string | null
          target_production?: number | null
          tenant_id?: string
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
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          account_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          tenant_id?: string
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
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          client_type?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          client_type?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          tenant_id?: string
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
      cost_per_ton: {
        Row: {
          autres_couts: number | null
          calculation_date: string
          campagne_id: string | null
          cout_amortissement: number | null
          cout_energie: number | null
          cout_main_oeuvre: number | null
          cout_maintenance: number | null
          cout_matieres_premieres: number | null
          cout_par_tonne: number | null
          cout_total: number | null
          cout_transport: number | null
          created_at: string | null
          created_by: string | null
          details_par_type: Json | null
          id: string
          notes: string | null
          period_end: string
          period_start: string
          status: string | null
          tenant_id: string
          total_production_kg: number
          total_production_tons: number | null
          updated_at: string | null
        }
        Insert: {
          autres_couts?: number | null
          calculation_date?: string
          campagne_id?: string | null
          cout_amortissement?: number | null
          cout_energie?: number | null
          cout_main_oeuvre?: number | null
          cout_maintenance?: number | null
          cout_matieres_premieres?: number | null
          cout_par_tonne?: number | null
          cout_total?: number | null
          cout_transport?: number | null
          created_at?: string | null
          created_by?: string | null
          details_par_type?: Json | null
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          status?: string | null
          tenant_id: string
          total_production_kg?: number
          total_production_tons?: number | null
          updated_at?: string | null
        }
        Update: {
          autres_couts?: number | null
          calculation_date?: string
          campagne_id?: string | null
          cout_amortissement?: number | null
          cout_energie?: number | null
          cout_main_oeuvre?: number | null
          cout_maintenance?: number | null
          cout_matieres_premieres?: number | null
          cout_par_tonne?: number | null
          cout_total?: number | null
          cout_transport?: number | null
          created_at?: string | null
          created_by?: string | null
          details_par_type?: Json | null
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          status?: string | null
          tenant_id?: string
          total_production_kg?: number
          total_production_tons?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_per_ton_campagne_id_fkey"
            columns: ["campagne_id"]
            isOneToOne: false
            referencedRelation: "campagnes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_per_ton_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "orphaned_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_per_ton_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_per_ton_tenant_id_fkey"
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
          deleted_at: string | null
          full_name: string
          id: string
          phone: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          daily_rate?: number | null
          deleted_at?: string | null
          full_name: string
          id?: string
          phone?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          daily_rate?: number | null
          deleted_at?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          tenant_id?: string
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
      email_templates: {
        Row: {
          body_html: string
          body_text: string
          created_at: string | null
          id: string
          is_active: boolean | null
          subject: string
          template_key: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          body_html: string
          body_text: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          subject: string
          template_key: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          body_html?: string
          body_text?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          subject?: string
          template_key?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string | null
          deleted_at: string | null
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
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
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
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
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
          tenant_id?: string
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
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
      financial_reports: {
        Row: {
          campagne_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          period_end: string
          period_start: string
          report_data: Json
          report_date: string
          report_type: string
          resultat_net: number | null
          status: string | null
          tenant_id: string
          total_actif: number | null
          total_charges: number | null
          total_passif: number | null
          total_produits: number | null
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          campagne_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          report_data?: Json
          report_date?: string
          report_type: string
          resultat_net?: number | null
          status?: string | null
          tenant_id: string
          total_actif?: number | null
          total_charges?: number | null
          total_passif?: number | null
          total_produits?: number | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          campagne_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          report_data?: Json
          report_date?: string
          report_type?: string
          resultat_net?: number | null
          status?: string | null
          tenant_id?: string
          total_actif?: number | null
          total_charges?: number | null
          total_passif?: number | null
          total_produits?: number | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_reports_campagne_id_fkey"
            columns: ["campagne_id"]
            isOneToOne: false
            referencedRelation: "campagnes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "orphaned_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_reports_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "orphaned_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_reports_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      global_announcements: {
        Row: {
          announcement_type: string | null
          created_at: string | null
          created_by: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          message: string
          starts_at: string | null
          target_audience: string | null
          target_roles: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          announcement_type?: string | null
          created_at?: string | null
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          starts_at?: string | null
          target_audience?: string | null
          target_roles?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          announcement_type?: string | null
          created_at?: string | null
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          starts_at?: string | null
          target_audience?: string | null
          target_roles?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          item_category: string | null
          item_code: string | null
          item_name: string
          last_purchase_date: string | null
          last_purchase_price: number | null
          notes: string | null
          quantity_on_hand: number | null
          reorder_level: number | null
          reserved_quantity: number | null
          storage_location: string | null
          tenant_id: string
          unit_cost: number | null
          unit_of_measure: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          item_category?: string | null
          item_code?: string | null
          item_name: string
          last_purchase_date?: string | null
          last_purchase_price?: number | null
          notes?: string | null
          quantity_on_hand?: number | null
          reorder_level?: number | null
          reserved_quantity?: number | null
          storage_location?: string | null
          tenant_id: string
          unit_cost?: number | null
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          item_category?: string | null
          item_code?: string | null
          item_name?: string
          last_purchase_date?: string | null
          last_purchase_price?: number | null
          notes?: string | null
          quantity_on_hand?: number | null
          reorder_level?: number | null
          reserved_quantity?: number | null
          storage_location?: string | null
          tenant_id?: string
          unit_cost?: number | null
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      leaves: {
        Row: {
          created_at: string
          days_count: number | null
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          rejection_reason: string | null
          requested_at: string
          start_date: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_count?: number | null
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          rejection_reason?: string | null
          requested_at?: string
          start_date: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_count?: number | null
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          rejection_reason?: string | null
          requested_at?: string
          start_date?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_history: {
        Row: {
          id: string
          message: string
          notification_type: string
          reference_id: string | null
          sent_at: string | null
          status: string | null
          tenant_id: string
          title: string
          user_id: string | null
        }
        Insert: {
          id?: string
          message: string
          notification_type: string
          reference_id?: string | null
          sent_at?: string | null
          status?: string | null
          tenant_id: string
          title: string
          user_id?: string | null
        }
        Update: {
          id?: string
          message?: string
          notification_type?: string
          reference_id?: string | null
          sent_at?: string | null
          status?: string | null
          tenant_id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number | null
          created_at: string | null
          facture_id: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          facture_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          facture_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_sale_id_fkey"
            columns: ["facture_id"]
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
      payroll_payments: {
        Row: {
          attendance_id: string | null
          balance_due: number | null
          created_at: string | null
          id: string
          notes: string | null
          paid_amount: number
          paid_to: string | null
          payment_account_id: string | null
          payment_date: string
          payment_method: string | null
          processed_by: string | null
          receiver_signature: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          attendance_id?: string | null
          balance_due?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          paid_to?: string | null
          payment_account_id?: string | null
          payment_date: string
          payment_method?: string | null
          processed_by?: string | null
          receiver_signature?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          attendance_id?: string | null
          balance_due?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          paid_to?: string | null
          payment_account_id?: string | null
          payment_date?: string
          payment_method?: string | null
          processed_by?: string | null
          receiver_signature?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_payments_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "team_attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_payments_paid_to_fkey"
            columns: ["paid_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_payments_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at: string | null
          tenant_id: string | null
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at?: string | null
          tenant_id?: string | null
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_value?: number
          recorded_at?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_tenant_id_fkey"
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
          batch_number: string | null
          campagne_id: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          production_date: string | null
          quality_grade: string | null
          quantity: number | null
          salt_type: string
          status: string | null
          stock_updated: boolean | null
          team_id: string | null
          tenant_id: string
          traceability_code: string | null
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          bassin_id?: string | null
          batch_number?: string | null
          campagne_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          production_date?: string | null
          quality_grade?: string | null
          quantity?: number | null
          salt_type: string
          status?: string | null
          stock_updated?: boolean | null
          team_id?: string | null
          tenant_id: string
          traceability_code?: string | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          bassin_id?: string | null
          batch_number?: string | null
          campagne_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          production_date?: string | null
          quality_grade?: string | null
          quantity?: number | null
          salt_type?: string
          status?: string | null
          stock_updated?: boolean | null
          team_id?: string | null
          tenant_id?: string
          traceability_code?: string | null
          updated_at?: string | null
          warehouse_id?: string | null
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
            foreignKeyName: "production_records_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_records_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
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
          notification_preferences: Json | null
          phone: string | null
          security_preferences: Json | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          notification_preferences?: Json | null
          phone?: string | null
          security_preferences?: Json | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          notification_preferences?: Json | null
          phone?: string | null
          security_preferences?: Json | null
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
      purchase_notifications: {
        Row: {
          actioned_at: string | null
          actioned_by: string | null
          amount: number | null
          created_at: string | null
          id: string
          is_actioned: boolean | null
          is_read: boolean | null
          message: string | null
          notification_type: string
          purchase_order_id: string
          read_at: string | null
          target_role: string
          target_user_id: string | null
          tenant_id: string
          title: string
        }
        Insert: {
          actioned_at?: string | null
          actioned_by?: string | null
          amount?: number | null
          created_at?: string | null
          id?: string
          is_actioned?: boolean | null
          is_read?: boolean | null
          message?: string | null
          notification_type: string
          purchase_order_id: string
          read_at?: string | null
          target_role: string
          target_user_id?: string | null
          tenant_id: string
          title: string
        }
        Update: {
          actioned_at?: string | null
          actioned_by?: string | null
          amount?: number | null
          created_at?: string | null
          id?: string
          is_actioned?: boolean | null
          is_read?: boolean | null
          message?: string | null
          notification_type?: string
          purchase_order_id?: string
          read_at?: string | null
          target_role?: string
          target_user_id?: string | null
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_notifications_actioned_by_fkey"
            columns: ["actioned_by"]
            isOneToOne: false
            referencedRelation: "orphaned_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_notifications_actioned_by_fkey"
            columns: ["actioned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_notifications_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_notifications_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "orphaned_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_notifications_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_history: {
        Row: {
          action_at: string | null
          action_by: string
          action_type: string
          id: string
          metadata: Json | null
          new_amount: number | null
          new_status: string | null
          notes: string | null
          previous_amount: number | null
          previous_status: string | null
          purchase_order_id: string
        }
        Insert: {
          action_at?: string | null
          action_by: string
          action_type: string
          id?: string
          metadata?: Json | null
          new_amount?: number | null
          new_status?: string | null
          notes?: string | null
          previous_amount?: number | null
          previous_status?: string | null
          purchase_order_id: string
        }
        Update: {
          action_at?: string | null
          action_by?: string
          action_type?: string
          id?: string
          metadata?: Json | null
          new_amount?: number | null
          new_status?: string | null
          notes?: string | null
          previous_amount?: number | null
          previous_status?: string | null
          purchase_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_history_action_by_fkey"
            columns: ["action_by"]
            isOneToOne: false
            referencedRelation: "orphaned_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_history_action_by_fkey"
            columns: ["action_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_history_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string | null
          id: string
          is_received: boolean | null
          item_category: string | null
          item_description: string | null
          item_name: string
          line_total: number | null
          notes: string | null
          purchase_order_id: string | null
          quantity: number
          received_at: string | null
          received_by: string | null
          received_notes: string | null
          received_quantity: number | null
          unit_of_measure: string | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_received?: boolean | null
          item_category?: string | null
          item_description?: string | null
          item_name: string
          line_total?: number | null
          notes?: string | null
          purchase_order_id?: string | null
          quantity: number
          received_at?: string | null
          received_by?: string | null
          received_notes?: string | null
          received_quantity?: number | null
          unit_of_measure?: string | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_received?: boolean | null
          item_category?: string | null
          item_description?: string | null
          item_name?: string
          line_total?: number | null
          notes?: string | null
          purchase_order_id?: string | null
          quantity?: number
          received_at?: string | null
          received_by?: string | null
          received_notes?: string | null
          received_quantity?: number | null
          unit_of_measure?: string | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "orphaned_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          actual_delivery_date: string | null
          approved_at: string | null
          approved_by: string | null
          campagne_id: string | null
          campagne_phase: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          discount_amount: number | null
          expected_delivery_date: string | null
          expense_category: string | null
          id: string
          modification_reason: string | null
          notes: string | null
          order_date: string
          order_number: string
          previous_total: number | null
          received_at: string | null
          received_by: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          requires_reapproval: boolean | null
          status: string
          subtotal: number | null
          supplier_id: string | null
          tax_amount: number | null
          tenant_id: string
          total_amount: number | null
          total_paid: number | null
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          approved_at?: string | null
          approved_by?: string | null
          campagne_id?: string | null
          campagne_phase?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          discount_amount?: number | null
          expected_delivery_date?: string | null
          expense_category?: string | null
          id?: string
          modification_reason?: string | null
          notes?: string | null
          order_date?: string
          order_number: string
          previous_total?: number | null
          received_at?: string | null
          received_by?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requires_reapproval?: boolean | null
          status?: string
          subtotal?: number | null
          supplier_id?: string | null
          tax_amount?: number | null
          tenant_id: string
          total_amount?: number | null
          total_paid?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          approved_at?: string | null
          approved_by?: string | null
          campagne_id?: string | null
          campagne_phase?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          discount_amount?: number | null
          expected_delivery_date?: string | null
          expense_category?: string | null
          id?: string
          modification_reason?: string | null
          notes?: string | null
          order_date?: string
          order_number?: string
          previous_total?: number | null
          received_at?: string | null
          received_by?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requires_reapproval?: boolean | null
          status?: string
          subtotal?: number | null
          supplier_id?: string | null
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number | null
          total_paid?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "orphaned_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_campagne_id_fkey"
            columns: ["campagne_id"]
            isOneToOne: false
            referencedRelation: "campagnes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "orphaned_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "orphaned_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "orphaned_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_payments: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          payment_type: string
          processed_by: string | null
          purchase_order_id: string
          tenant_id: string
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          payment_type: string
          processed_by?: string | null
          purchase_order_id: string
          tenant_id: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_type?: string
          processed_by?: string | null
          purchase_order_id?: string
          tenant_id?: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_payments_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "orphaned_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_payments_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_payments_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          subscription: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          subscription: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          subscription?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quality_certificates: {
        Row: {
          batch_number: string | null
          certificate_number: string
          certificate_type: string
          created_at: string | null
          deleted_at: string | null
          document_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string
          issued_by: string | null
          notes: string | null
          production_record_id: string | null
          quality_grade: string | null
          quality_test_id: string | null
          quantity_certified: number | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          batch_number?: string | null
          certificate_number: string
          certificate_type?: string
          created_at?: string | null
          deleted_at?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string
          issued_by?: string | null
          notes?: string | null
          production_record_id?: string | null
          quality_grade?: string | null
          quality_test_id?: string | null
          quantity_certified?: number | null
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          batch_number?: string | null
          certificate_number?: string
          certificate_type?: string
          created_at?: string | null
          deleted_at?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string
          issued_by?: string | null
          notes?: string | null
          production_record_id?: string | null
          quality_grade?: string | null
          quality_test_id?: string | null
          quantity_certified?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "orphaned_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_certificates_production_record_id_fkey"
            columns: ["production_record_id"]
            isOneToOne: false
            referencedRelation: "production_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_certificates_quality_test_id_fkey"
            columns: ["quality_test_id"]
            isOneToOne: false
            referencedRelation: "quality_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_tests: {
        Row: {
          batch_number: string | null
          certificate_number: string | null
          color_grade: string | null
          corrective_actions: string | null
          created_at: string | null
          deleted_at: string | null
          grain_size: string | null
          humidity_level: number | null
          id: string
          impurities_level: number | null
          notes: string | null
          production_record_id: string | null
          quality_score: number | null
          quality_status: string
          salt_purity: number | null
          tenant_id: string
          test_date: string
          tested_by: string | null
          updated_at: string | null
        }
        Insert: {
          batch_number?: string | null
          certificate_number?: string | null
          color_grade?: string | null
          corrective_actions?: string | null
          created_at?: string | null
          deleted_at?: string | null
          grain_size?: string | null
          humidity_level?: number | null
          id?: string
          impurities_level?: number | null
          notes?: string | null
          production_record_id?: string | null
          quality_score?: number | null
          quality_status?: string
          salt_purity?: number | null
          tenant_id: string
          test_date?: string
          tested_by?: string | null
          updated_at?: string | null
        }
        Update: {
          batch_number?: string | null
          certificate_number?: string | null
          color_grade?: string | null
          corrective_actions?: string | null
          created_at?: string | null
          deleted_at?: string | null
          grain_size?: string | null
          humidity_level?: number | null
          id?: string
          impurities_level?: number | null
          notes?: string | null
          production_record_id?: string | null
          quality_score?: number | null
          quality_status?: string
          salt_purity?: number | null
          tenant_id?: string
          test_date?: string
          tested_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_tests_production_record_id_fkey"
            columns: ["production_record_id"]
            isOneToOne: false
            referencedRelation: "production_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_tests_tested_by_fkey"
            columns: ["tested_by"]
            isOneToOne: false
            referencedRelation: "orphaned_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_tests_tested_by_fkey"
            columns: ["tested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          amount_paid: number | null
          batch_number: string | null
          campagne_id: string | null
          can_be_delivered: boolean | null
          client_id: string | null
          created_at: string | null
          customer_name: string | null
          deleted_at: string | null
          delivered: boolean | null
          delivered_at: string | null
          delivery_date: string | null
          delivery_number: string | null
          discount: number | null
          id: string
          invoice_number: string | null
          invoice_validated: boolean | null
          notes: string | null
          order_number: string | null
          payment_status: string | null
          quality_certificate_id: string | null
          quantity: number | null
          sale_date: string | null
          sale_status: string | null
          salt_type: string
          stock_updated: boolean | null
          tenant_id: string
          total_amount: number | null
          traceability_code: string | null
          transaction_id: string | null
          unit_price: number | null
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          amount_paid?: number | null
          batch_number?: string | null
          campagne_id?: string | null
          can_be_delivered?: boolean | null
          client_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          deleted_at?: string | null
          delivered?: boolean | null
          delivered_at?: string | null
          delivery_date?: string | null
          delivery_number?: string | null
          discount?: number | null
          id?: string
          invoice_number?: string | null
          invoice_validated?: boolean | null
          notes?: string | null
          order_number?: string | null
          payment_status?: string | null
          quality_certificate_id?: string | null
          quantity?: number | null
          sale_date?: string | null
          sale_status?: string | null
          salt_type: string
          stock_updated?: boolean | null
          tenant_id: string
          total_amount?: number | null
          traceability_code?: string | null
          transaction_id?: string | null
          unit_price?: number | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          amount_paid?: number | null
          batch_number?: string | null
          campagne_id?: string | null
          can_be_delivered?: boolean | null
          client_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          deleted_at?: string | null
          delivered?: boolean | null
          delivered_at?: string | null
          delivery_date?: string | null
          delivery_number?: string | null
          discount?: number | null
          id?: string
          invoice_number?: string | null
          invoice_validated?: boolean | null
          notes?: string | null
          order_number?: string | null
          payment_status?: string | null
          quality_certificate_id?: string | null
          quantity?: number | null
          sale_date?: string | null
          sale_status?: string | null
          salt_type?: string
          stock_updated?: boolean | null
          tenant_id?: string
          total_amount?: number | null
          traceability_code?: string | null
          transaction_id?: string | null
          unit_price?: number | null
          updated_at?: string | null
          warehouse_id?: string | null
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
            foreignKeyName: "sales_quality_certificate_id_fkey"
            columns: ["quality_certificate_id"]
            isOneToOne: false
            referencedRelation: "quality_certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          created_at: string
          created_by: string
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean
          last_run_at: string | null
          next_run_at: string | null
          recipient_emails: string[]
          report_type: string
          schedule_time: string
          start_date: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          recipient_emails: string[]
          report_type: string
          schedule_time?: string
          start_date: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          recipient_emails?: string[]
          report_type?: string
          schedule_time?: string
          start_date?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_tenant_id_fkey"
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
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          inventory_item_id: string | null
          item_name: string
          movement_type: string
          new_quantity: number | null
          notes: string | null
          previous_quantity: number | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          tenant_id: string
          unit_of_measure: string | null
          warehouse: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id?: string | null
          item_name: string
          movement_type: string
          new_quantity?: number | null
          notes?: string | null
          previous_quantity?: number | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          tenant_id: string
          unit_of_measure?: string | null
          warehouse?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          movement_type?: string
          new_quantity?: number | null
          notes?: string | null
          previous_quantity?: number | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string
          unit_of_measure?: string | null
          warehouse?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "orphaned_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          rating: number | null
          registration_number: string | null
          supplier_type: string
          tax_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          registration_number?: string | null
          supplier_type?: string
          tax_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          registration_number?: string | null
          supplier_type?: string
          tax_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      support_ticket_replies: {
        Row: {
          created_at: string | null
          id: string
          is_internal: boolean | null
          message: string
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          message: string
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          message?: string
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          created_by: string
          description: string
          id: string
          priority: string | null
          resolved_at: string | null
          status: string | null
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          created_by: string
          description: string
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string
          description?: string
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health_logs: {
        Row: {
          checked_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          response_time_ms: number | null
          service_name: string
          status: string
        }
        Insert: {
          checked_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          service_name: string
          status: string
        }
        Update: {
          checked_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          service_name?: string
          status?: string
        }
        Relationships: []
      }
      team_attendance: {
        Row: {
          attendance_date: string
          calculated_amount: number | null
          created_at: string | null
          daily_rate: number | null
          employee_id: string | null
          hours_worked: number | null
          id: string
          notes: string | null
          status: string | null
          team_id: string | null
          tenant_id: string
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          attendance_date: string
          calculated_amount?: number | null
          created_at?: string | null
          daily_rate?: number | null
          employee_id?: string | null
          hours_worked?: number | null
          id?: string
          notes?: string | null
          status?: string | null
          team_id?: string | null
          tenant_id: string
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          attendance_date?: string
          calculated_amount?: number | null
          created_at?: string | null
          daily_rate?: number | null
          employee_id?: string | null
          hours_worked?: number | null
          id?: string
          notes?: string | null
          status?: string | null
          team_id?: string | null
          tenant_id?: string
          updated_at?: string | null
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
          {
            foreignKeyName: "team_attendance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          employee_id: string
          id: string
          joined_at: string | null
          role: string | null
          team_id: string
        }
        Insert: {
          employee_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          team_id: string
        }
        Update: {
          employee_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          efficiency_rate: number | null
          id: string
          leader_id: string | null
          name: string
          production_target: number | null
          sector: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          efficiency_rate?: number | null
          id?: string
          leader_id?: string | null
          name: string
          production_target?: number | null
          sector?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          efficiency_rate?: number | null
          id?: string
          leader_id?: string | null
          name?: string
          production_target?: number | null
          sector?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_quotas: {
        Row: {
          created_at: string | null
          current_api_calls_today: number | null
          current_bassins: number | null
          current_storage_mb: number | null
          current_users: number | null
          id: string
          last_reset_date: string | null
          max_api_calls_per_day: number | null
          max_bassins: number | null
          max_storage_mb: number | null
          max_users: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_api_calls_today?: number | null
          current_bassins?: number | null
          current_storage_mb?: number | null
          current_users?: number | null
          id?: string
          last_reset_date?: string | null
          max_api_calls_per_day?: number | null
          max_bassins?: number | null
          max_storage_mb?: number | null
          max_users?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_api_calls_today?: number | null
          current_bassins?: number | null
          current_storage_mb?: number | null
          current_users?: number | null
          id?: string
          last_reset_date?: string | null
          max_api_calls_per_day?: number | null
          max_bassins?: number | null
          max_storage_mb?: number | null
          max_users?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_quotas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          onboarding_completed: boolean | null
          onboarding_step: string | null
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
          onboarding_completed?: boolean | null
          onboarding_step?: string | null
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
          onboarding_completed?: boolean | null
          onboarding_step?: string | null
          rccm?: string | null
          subdomain?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
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
          tenant_id: string
          transaction_date: string | null
          transaction_type: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
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
          tenant_id: string
          transaction_date?: string | null
          transaction_type?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
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
          tenant_id?: string
          transaction_date?: string | null
          transaction_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
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
      accounting_ledger: {
        Row: {
          account_name: string | null
          account_number: string | null
          credit: number | null
          debit: number | null
          description: string | null
          id: string | null
          reference: string | null
          running_balance: number | null
          tenant_id: string | null
          transaction_date: string | null
          transaction_id: string | null
          transaction_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
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
      orphaned_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          minutes_since_creation: number | null
          role: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_cost_per_ton: {
        Args: {
          p_campagne_id?: string
          p_period_end: string
          p_period_start: string
          p_tenant_id: string
        }
        Returns: Json
      }
      calculate_next_run: {
        Args: {
          p_current_run?: string
          p_frequency: string
          p_schedule_time: string
        }
        Returns: string
      }
      create_default_teams_for_tenant: {
        Args: { _tenant_id: string }
        Returns: undefined
      }
      create_journal_entry: {
        Args: {
          p_amount: number
          p_credit_account?: string
          p_debit_account?: string
          p_description: string
          p_notes?: string
          p_reference?: string
          p_tenant_id: string
          p_transaction_date: string
          p_transaction_type: string
        }
        Returns: string
      }
      generate_balance_sheet: {
        Args: {
          p_campagne_id?: string
          p_period_end: string
          p_period_start: string
          p_tenant_id: string
        }
        Returns: Json
      }
      generate_income_statement: {
        Args: {
          p_campagne_id?: string
          p_period_end: string
          p_period_start: string
          p_tenant_id: string
        }
        Returns: Json
      }
      generate_trial_balance: {
        Args: { p_end_date: string; p_start_date: string; p_tenant_id: string }
        Returns: {
          account_name: string
          account_number: string
          account_type: string
          closing_balance: number
          opening_balance: number
          period_credit: number
          period_debit: number
        }[]
      }
      get_account_balance: {
        Args: {
          p_account_number: string
          p_as_of_date?: string
          p_tenant_id: string
        }
        Returns: number
      }
      get_clients_safe: {
        Args: never
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
        Args: never
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
        Args: never
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
        Args: never
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
      get_public_profiles: {
        Args: never
        Returns: {
          avatar_url: string
          full_name: string
          id: string
        }[]
      }
      get_tenant_public_info: {
        Args: { _tenant_id: string }
        Returns: {
          id: string
          is_active: boolean
          logo_url: string
          name: string
        }[]
      }
      get_user_role: { Args: { user_id: string }; Returns: string }
      get_user_tenant_id: { Args: { user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager_or_admin: { Args: { _user_id: string }; Returns: boolean }
      send_attendance_validation_reminders: { Args: never; Returns: undefined }
      send_push_notification: {
        Args: {
          p_message: string
          p_notification_type?: string
          p_reference_id?: string
          p_tenant_id: string
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
      soft_delete_record: {
        Args: { record_id: string; table_name: string }
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
      bassin_type:
        | "Table salante"
        | "Bassin 1"
        | "Bassin 2"
        | "Bassin 3"
        | "Bassin 4"
      purchase_order_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "partially_paid"
        | "paid"
        | "partially_received"
        | "received"
        | "modified"
        | "cancelled"
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
      bassin_type: [
        "Table salante",
        "Bassin 1",
        "Bassin 2",
        "Bassin 3",
        "Bassin 4",
      ],
      purchase_order_status: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "partially_paid",
        "paid",
        "partially_received",
        "received",
        "modified",
        "cancelled",
      ],
    },
  },
} as const
