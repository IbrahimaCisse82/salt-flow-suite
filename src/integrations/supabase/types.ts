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
          area: number | null
          capacity_tonnes: number | null
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          latitude: number | null
          location: string | null
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
          area?: number | null
          capacity_tonnes?: number | null
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          location?: string | null
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
          area?: number | null
          capacity_tonnes?: number | null
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          location?: string | null
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
      campagne_budget_lines: {
        Row: {
          budgeted_amount: number
          campagne_id: string
          created_at: string
          expense_category: string
          id: string
          notes: string | null
          phase: string
          spent_amount: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          budgeted_amount?: number
          campagne_id: string
          created_at?: string
          expense_category: string
          id?: string
          notes?: string | null
          phase?: string
          spent_amount?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          budgeted_amount?: number
          campagne_id?: string
          created_at?: string
          expense_category?: string
          id?: string
          notes?: string | null
          phase?: string
          spent_amount?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      campagne_phase_budgets: {
        Row: {
          budgeted_amount: number
          campagne_id: string
          created_at: string
          end_date: string | null
          id: string
          is_locked: boolean
          notes: string | null
          phase: string
          spent_amount: number
          start_date: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          budgeted_amount?: number
          campagne_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_locked?: boolean
          notes?: string | null
          phase: string
          spent_amount?: number
          start_date?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          budgeted_amount?: number
          campagne_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_locked?: boolean
          notes?: string | null
          phase?: string
          spent_amount?: number
          start_date?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      campagnes: {
        Row: {
          actual_production: number | null
          actual_production_tonnes: number
          budget: number
          budget_total: number | null
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
          target_production: number | null
          target_production_tonnes: number | null
          tenant_id: string
          updated_at: string
          year: number | null
        }
        Insert: {
          actual_production?: number | null
          actual_production_tonnes?: number
          budget?: number
          budget_total?: number | null
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
          target_production?: number | null
          target_production_tonnes?: number | null
          tenant_id: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          actual_production?: number | null
          actual_production_tonnes?: number
          budget?: number
          budget_total?: number | null
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
          target_production?: number | null
          target_production_tonnes?: number | null
          tenant_id?: string
          updated_at?: string
          year?: number | null
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
      clients: {
        Row: {
          address: string | null
          city: string | null
          client_type: Database["public"]["Enums"]["client_type"]
          contact_person: string | null
          country: string | null
          created_at: string
          credit_limit: number
          current_balance: number
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          registration_number: string | null
          tax_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          client_type?: Database["public"]["Enums"]["client_type"]
          contact_person?: string | null
          country?: string | null
          created_at?: string
          credit_limit?: number
          current_balance?: number
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          registration_number?: string | null
          tax_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          client_type?: Database["public"]["Enums"]["client_type"]
          contact_person?: string | null
          country?: string | null
          created_at?: string
          credit_limit?: number
          current_balance?: number
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          registration_number?: string | null
          tax_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
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
      depreciation_schedule: {
        Row: {
          accumulated_amount: number
          created_at: string
          cumulative_depreciation: number
          depreciation_amount: number
          fixed_asset_id: string
          id: string
          is_posted: boolean
          net_book_value: number
          period_end: string
          period_start: string
          posted_at: string | null
          tenant_id: string
          transaction_id: string | null
        }
        Insert: {
          accumulated_amount?: number
          created_at?: string
          cumulative_depreciation?: number
          depreciation_amount?: number
          fixed_asset_id: string
          id?: string
          is_posted?: boolean
          net_book_value?: number
          period_end: string
          period_start: string
          posted_at?: string | null
          tenant_id: string
          transaction_id?: string | null
        }
        Update: {
          accumulated_amount?: number
          created_at?: string
          cumulative_depreciation?: number
          depreciation_amount?: number
          fixed_asset_id?: string
          id?: string
          is_posted?: boolean
          net_book_value?: number
          period_end?: string
          period_start?: string
          posted_at?: string | null
          tenant_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "depreciation_schedule_fixed_asset_id_fkey"
            columns: ["fixed_asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depreciation_schedule_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
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
          observations: string | null
          syscohada_category: string | null
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
          observations?: string | null
          syscohada_category?: string | null
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
          observations?: string | null
          syscohada_category?: string | null
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
      fiscal_periods: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          fiscal_year_id: string
          id: string
          period_end: string
          period_number: number
          period_start: string
          status: Database["public"]["Enums"]["fiscal_period_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          fiscal_year_id: string
          id?: string
          period_end: string
          period_number: number
          period_start: string
          status?: Database["public"]["Enums"]["fiscal_period_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          fiscal_year_id?: string
          id?: string
          period_end?: string
          period_number?: number
          period_start?: string
          status?: Database["public"]["Enums"]["fiscal_period_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_periods_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_years: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          end_date: string
          id: string
          start_date: string
          status: Database["public"]["Enums"]["fiscal_period_status"]
          tenant_id: string
          updated_at: string
          year: number
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          end_date: string
          id?: string
          start_date: string
          status?: Database["public"]["Enums"]["fiscal_period_status"]
          tenant_id: string
          updated_at?: string
          year: number
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          end_date?: string
          id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["fiscal_period_status"]
          tenant_id?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      fixed_assets: {
        Row: {
          account_id: string | null
          account_number: string | null
          accumulated_depreciation: number
          acquisition_cost: number
          acquisition_date: string
          asset_code: string | null
          asset_name: string
          category: string | null
          created_at: string
          depreciation_method: string
          disposal_date: string | null
          disposal_value: number | null
          id: string
          net_book_value: number
          notes: string | null
          residual_value: number
          status: Database["public"]["Enums"]["fixed_asset_status"]
          tenant_id: string
          updated_at: string
          useful_life_years: number
        }
        Insert: {
          account_id?: string | null
          account_number?: string | null
          accumulated_depreciation?: number
          acquisition_cost?: number
          acquisition_date: string
          asset_code?: string | null
          asset_name: string
          category?: string | null
          created_at?: string
          depreciation_method?: string
          disposal_date?: string | null
          disposal_value?: number | null
          id?: string
          net_book_value?: number
          notes?: string | null
          residual_value?: number
          status?: Database["public"]["Enums"]["fixed_asset_status"]
          tenant_id: string
          updated_at?: string
          useful_life_years?: number
        }
        Update: {
          account_id?: string | null
          account_number?: string | null
          accumulated_depreciation?: number
          acquisition_cost?: number
          acquisition_date?: string
          asset_code?: string | null
          asset_name?: string
          category?: string | null
          created_at?: string
          depreciation_method?: string
          disposal_date?: string | null
          disposal_value?: number | null
          id?: string
          net_book_value?: number
          notes?: string | null
          residual_value?: number
          status?: Database["public"]["Enums"]["fixed_asset_status"]
          tenant_id?: string
          updated_at?: string
          useful_life_years?: number
        }
        Relationships: [
          {
            foreignKeyName: "fixed_assets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string | null
          cmp: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          quantity: number
          reorder_level: number
          reserved_quantity: number
          sku: string | null
          tenant_id: string
          unit_cost: number
          unit_of_measure: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          category?: string | null
          cmp?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          quantity?: number
          reorder_level?: number
          reserved_quantity?: number
          sku?: string | null
          tenant_id: string
          unit_cost?: number
          unit_of_measure?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          category?: string | null
          cmp?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          quantity?: number
          reorder_level?: number
          reserved_quantity?: number
          sku?: string | null
          tenant_id?: string
          unit_cost?: number
          unit_of_measure?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: []
      }
      inventory_valuations: {
        Row: {
          cmp: number
          created_at: string
          id: string
          inventory_item_id: string
          quantity: number
          snapshot_date: string
          tenant_id: string
          total_value: number
        }
        Insert: {
          cmp?: number
          created_at?: string
          id?: string
          inventory_item_id: string
          quantity?: number
          snapshot_date: string
          tenant_id: string
          total_value?: number
        }
        Update: {
          cmp?: number
          created_at?: string
          id?: string
          inventory_item_id?: string
          quantity?: number
          snapshot_date?: string
          tenant_id?: string
          total_value?: number
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          account_id: string
          account_number: string | null
          created_at: string
          created_by: string | null
          credit: number
          debit: number
          description: string | null
          entry_date: string
          fiscal_period_id: string | null
          id: string
          is_locked: boolean
          journal_code: string
          reference: string | null
          tenant_id: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          account_number?: string | null
          created_at?: string
          created_by?: string | null
          credit?: number
          debit?: number
          description?: string | null
          entry_date?: string
          fiscal_period_id?: string | null
          id?: string
          is_locked?: boolean
          journal_code?: string
          reference?: string | null
          tenant_id: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          account_number?: string | null
          created_at?: string
          created_by?: string | null
          credit?: number
          debit?: number
          description?: string | null
          entry_date?: string
          fiscal_period_id?: string | null
          id?: string
          is_locked?: boolean
          journal_code?: string
          reference?: string | null
          tenant_id?: string
          transaction_id?: string | null
          updated_at?: string
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
            foreignKeyName: "journal_entries_fiscal_period_id_fkey"
            columns: ["fiscal_period_id"]
            isOneToOne: false
            referencedRelation: "fiscal_periods"
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
      ledger_audit_log: {
        Row: {
          action: string
          action_type: string | null
          created_at: string
          details: Json | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          action_type?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          action_type?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          account_id: string | null
          amount: number
          client_id: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          reference: string | null
          sale_id: string | null
          tenant_id: string
          transaction_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount?: number
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          reference?: string | null
          sale_id?: string | null
          tenant_id: string
          transaction_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          reference?: string | null
          sale_id?: string | null
          tenant_id?: string
          transaction_id?: string | null
        }
        Relationships: []
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
      production_records: {
        Row: {
          bassin_id: string | null
          batch_number: string | null
          campagne_id: string | null
          cost_per_ton: number
          created_at: string
          created_by: string | null
          estimated_value: number
          harvest_date: string
          humidity_percent: number | null
          id: string
          notes: string | null
          production_date: string | null
          quality_grade: string | null
          quantity: number | null
          quantity_tonnes: number
          salt_type: string
          status: string
          team_id: string | null
          tenant_id: string
          traceability_code: string | null
          updated_at: string
        }
        Insert: {
          bassin_id?: string | null
          batch_number?: string | null
          campagne_id?: string | null
          cost_per_ton?: number
          created_at?: string
          created_by?: string | null
          estimated_value?: number
          harvest_date?: string
          humidity_percent?: number | null
          id?: string
          notes?: string | null
          production_date?: string | null
          quality_grade?: string | null
          quantity?: number | null
          quantity_tonnes?: number
          salt_type?: string
          status?: string
          team_id?: string | null
          tenant_id: string
          traceability_code?: string | null
          updated_at?: string
        }
        Update: {
          bassin_id?: string | null
          batch_number?: string | null
          campagne_id?: string | null
          cost_per_ton?: number
          created_at?: string
          created_by?: string | null
          estimated_value?: number
          harvest_date?: string
          humidity_percent?: number | null
          id?: string
          notes?: string | null
          production_date?: string | null
          quality_grade?: string | null
          quantity?: number | null
          quantity_tonnes?: number
          salt_type?: string
          status?: string
          team_id?: string | null
          tenant_id?: string
          traceability_code?: string | null
          updated_at?: string
        }
        Relationships: []
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
      purchase_notifications: {
        Row: {
          actioned_at: string | null
          actioned_by: string | null
          created_at: string
          id: string
          is_actioned: boolean
          is_read: boolean
          message: string | null
          notification_type: string
          purchase_order_id: string | null
          tenant_id: string
        }
        Insert: {
          actioned_at?: string | null
          actioned_by?: string | null
          created_at?: string
          id?: string
          is_actioned?: boolean
          is_read?: boolean
          message?: string | null
          notification_type: string
          purchase_order_id?: string | null
          tenant_id: string
        }
        Update: {
          actioned_at?: string | null
          actioned_by?: string | null
          created_at?: string
          id?: string
          is_actioned?: boolean
          is_read?: boolean
          message?: string | null
          notification_type?: string
          purchase_order_id?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string
          description: string
          expense_type_id: string | null
          id: string
          inventory_item_id: string | null
          is_received: boolean
          item_category: string | null
          item_name: string | null
          line_total: number | null
          purchase_order_id: string
          quantity: number
          received_quantity: number
          tenant_id: string
          total_price: number
          unit_of_measure: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          expense_type_id?: string | null
          id?: string
          inventory_item_id?: string | null
          is_received?: boolean
          item_category?: string | null
          item_name?: string | null
          line_total?: number | null
          purchase_order_id: string
          quantity?: number
          received_quantity?: number
          tenant_id: string
          total_price?: number
          unit_of_measure?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          expense_type_id?: string | null
          id?: string
          inventory_item_id?: string | null
          is_received?: boolean
          item_category?: string | null
          item_name?: string | null
          line_total?: number | null
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number
          tenant_id?: string
          total_price?: number
          unit_of_measure?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          campagne_id: string | null
          created_at: string
          created_by: string | null
          delivery_date: string | null
          expected_delivery_date: string | null
          expense_category: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          previous_total: number | null
          received_at: string | null
          received_by: string | null
          requires_reapproval: boolean
          status: Database["public"]["Enums"]["po_status"]
          subtotal: number
          supplier_id: string | null
          tax_amount: number
          tenant_id: string
          total_amount: number
          total_paid: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          campagne_id?: string | null
          created_at?: string
          created_by?: string | null
          delivery_date?: string | null
          expected_delivery_date?: string | null
          expense_category?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          previous_total?: number | null
          received_at?: string | null
          received_by?: string | null
          requires_reapproval?: boolean
          status?: Database["public"]["Enums"]["po_status"]
          subtotal?: number
          supplier_id?: string | null
          tax_amount?: number
          tenant_id: string
          total_amount?: number
          total_paid?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          campagne_id?: string | null
          created_at?: string
          created_by?: string | null
          delivery_date?: string | null
          expected_delivery_date?: string | null
          expense_category?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          previous_total?: number | null
          received_at?: string | null
          received_by?: string | null
          requires_reapproval?: boolean
          status?: Database["public"]["Enums"]["po_status"]
          subtotal?: number
          supplier_id?: string | null
          tax_amount?: number
          tenant_id?: string
          total_amount?: number
          total_paid?: number
          updated_at?: string
        }
        Relationships: []
      }
      purchase_payments: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          payment_type: Database["public"]["Enums"]["purchase_payment_type"]
          processed_by: string | null
          purchase_order_id: string
          tenant_id: string
          transaction_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payment_type?: Database["public"]["Enums"]["purchase_payment_type"]
          processed_by?: string | null
          purchase_order_id: string
          tenant_id: string
          transaction_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payment_type?: Database["public"]["Enums"]["purchase_payment_type"]
          processed_by?: string | null
          purchase_order_id?: string
          tenant_id?: string
          transaction_id?: string | null
        }
        Relationships: []
      }
      quality_certificates: {
        Row: {
          certificate_number: string
          client_id: string | null
          created_at: string
          expiry_date: string | null
          id: string
          issued_by: string | null
          issued_date: string
          notes: string | null
          pdf_url: string | null
          production_record_id: string | null
          quality_test_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          certificate_number: string
          client_id?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string
          notes?: string | null
          pdf_url?: string | null
          production_record_id?: string | null
          quality_test_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          certificate_number?: string
          client_id?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string
          notes?: string | null
          pdf_url?: string | null
          production_record_id?: string | null
          quality_test_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quality_tests: {
        Row: {
          color_grade: string | null
          created_at: string
          grain_size: string | null
          humidity_percent: number | null
          id: string
          notes: string | null
          production_record_id: string | null
          purity_percent: number | null
          quality_grade: string | null
          status: Database["public"]["Enums"]["quality_status"]
          tenant_id: string
          test_date: string
          tested_by: string | null
          updated_at: string
        }
        Insert: {
          color_grade?: string | null
          created_at?: string
          grain_size?: string | null
          humidity_percent?: number | null
          id?: string
          notes?: string | null
          production_record_id?: string | null
          purity_percent?: number | null
          quality_grade?: string | null
          status?: Database["public"]["Enums"]["quality_status"]
          tenant_id: string
          test_date?: string
          tested_by?: string | null
          updated_at?: string
        }
        Update: {
          color_grade?: string | null
          created_at?: string
          grain_size?: string | null
          humidity_percent?: number | null
          id?: string
          notes?: string | null
          production_record_id?: string | null
          purity_percent?: number | null
          quality_grade?: string | null
          status?: Database["public"]["Enums"]["quality_status"]
          tenant_id?: string
          test_date?: string
          tested_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string
          description: string
          id: string
          inventory_item_id: string | null
          production_record_id: string | null
          quality_grade: string | null
          quantity: number
          sale_id: string
          salt_type: string | null
          tenant_id: string
          total_price: number
          unit_of_measure: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          inventory_item_id?: string | null
          production_record_id?: string | null
          quality_grade?: string | null
          quantity?: number
          sale_id: string
          salt_type?: string | null
          tenant_id: string
          total_price?: number
          unit_of_measure?: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          inventory_item_id?: string | null
          production_record_id?: string | null
          quality_grade?: string | null
          quantity?: number
          sale_id?: string
          salt_type?: string | null
          tenant_id?: string
          total_price?: number
          unit_of_measure?: string
          unit_price?: number
        }
        Relationships: []
      }
      sales: {
        Row: {
          campagne_id: string | null
          can_be_delivered: boolean
          client_id: string | null
          created_at: string
          created_by: string | null
          delivered_at: string | null
          delivered_by: string | null
          delivery_date: string | null
          id: string
          invoice_number: string | null
          is_export: boolean
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          sale_date: string
          sale_number: string
          status: Database["public"]["Enums"]["sale_status"]
          subtotal: number
          tax_amount: number
          tenant_id: string
          total_amount: number
          total_paid: number
          updated_at: string
        }
        Insert: {
          campagne_id?: string | null
          can_be_delivered?: boolean
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_date?: string | null
          id?: string
          invoice_number?: string | null
          is_export?: boolean
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          sale_date?: string
          sale_number: string
          status?: Database["public"]["Enums"]["sale_status"]
          subtotal?: number
          tax_amount?: number
          tenant_id: string
          total_amount?: number
          total_paid?: number
          updated_at?: string
        }
        Update: {
          campagne_id?: string | null
          can_be_delivered?: boolean
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_date?: string | null
          id?: string
          invoice_number?: string | null
          is_export?: boolean
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          sale_date?: string
          sale_number?: string
          status?: Database["public"]["Enums"]["sale_status"]
          subtotal?: number
          tax_amount?: number
          tenant_id?: string
          total_amount?: number
          total_paid?: number
          updated_at?: string
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
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          new_quantity: number
          notes: string | null
          previous_quantity: number
          quantity: number
          reference_id: string | null
          reference_type: string | null
          tenant_id: string
          unit_cost: number
          unit_of_measure: string
          warehouse: string | null
          warehouse_from: string | null
          warehouse_to: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id?: string | null
          item_name: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          new_quantity?: number
          notes?: string | null
          previous_quantity?: number
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          tenant_id: string
          unit_cost?: number
          unit_of_measure?: string
          warehouse?: string | null
          warehouse_from?: string | null
          warehouse_to?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          new_quantity?: number
          notes?: string | null
          previous_quantity?: number
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string
          unit_cost?: number
          unit_of_measure?: string
          warehouse?: string | null
          warehouse_from?: string | null
          warehouse_to?: string | null
        }
        Relationships: []
      }
      stock_reservations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          inventory_item_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          released_at: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          released_at?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          released_at?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          rating: number | null
          registration_number: string | null
          supplier_type: Database["public"]["Enums"]["supplier_type"]
          tax_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          registration_number?: string | null
          supplier_type?: Database["public"]["Enums"]["supplier_type"]
          tax_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          registration_number?: string | null
          supplier_type?: Database["public"]["Enums"]["supplier_type"]
          tax_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
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
      transaction_lines: {
        Row: {
          account_id: string
          created_at: string
          credit: number
          debit: number
          description: string | null
          id: string
          line_order: number
          tenant_id: string
          transaction_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          line_order?: number
          tenant_id: string
          transaction_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          line_order?: number
          tenant_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_lines_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          fiscal_period_id: string | null
          id: string
          journal_code: string | null
          notes: string | null
          reference: string | null
          source_id: string | null
          source_table: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          tenant_id: string
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          account_id?: string | null
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          fiscal_period_id?: string | null
          id?: string
          journal_code?: string | null
          notes?: string | null
          reference?: string | null
          source_id?: string | null
          source_table?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          tenant_id: string
          transaction_date?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          fiscal_period_id?: string | null
          id?: string
          journal_code?: string | null
          notes?: string | null
          reference?: string | null
          source_id?: string | null
          source_table?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          tenant_id?: string
          transaction_date?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
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
            foreignKeyName: "transactions_fiscal_period_id_fkey"
            columns: ["fiscal_period_id"]
            isOneToOne: false
            referencedRelation: "fiscal_periods"
            referencedColumns: ["id"]
          },
        ]
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
      warehouses: {
        Row: {
          address: string | null
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_profiles_with_roles: {
        Args: never
        Returns: {
          email: string
          full_name: string
          is_active: boolean
          phone: string
          roles: string[]
          tenant_id: string
          user_id: string
        }[]
      }
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
      link_profile_to_tenant: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: Json
      }
      post_depreciation: { Args: { p_schedule_id: string }; Returns: Json }
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
        | "qualite"
      attendance_status: "pending" | "validated" | "paid"
      bassin_status: "actif" | "inactif" | "maintenance" | "recolte"
      campagne_status:
        | "planifiee"
        | "en_cours"
        | "cloturee"
        | "annulee"
        | "active"
      cash_account_type: "banque" | "caisse" | "mobile_money"
      client_type: "local" | "export" | "particulier"
      employee_type: "permanent" | "saisonnier" | "journalier"
      fiscal_period_status: "open" | "closed" | "locked"
      fixed_asset_status: "active" | "disposed" | "scrapped"
      payment_status: "pending" | "paid" | "cancelled"
      po_status:
        | "draft"
        | "pending"
        | "approved"
        | "partial"
        | "received"
        | "cancelled"
        | "pending_approval"
      purchase_payment_type: "advance" | "payment" | "refund"
      quality_status: "pending" | "approved" | "rejected"
      sale_status: "draft" | "confirmed" | "delivered" | "cancelled"
      stock_movement_type: "entry" | "exit" | "adjustment" | "transfer"
      supplier_type: "fourniture" | "prestataire" | "transporteur"
      transaction_status: "draft" | "validated" | "cancelled"
      transaction_type:
        | "vente"
        | "achat"
        | "paiement"
        | "encaissement"
        | "od"
        | "paie"
        | "amortissement"
        | "cloture"
        | "transfert"
        | "vente_locale"
        | "vente_export"
        | "virement_interne"
        | "encaissement_client"
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
        "qualite",
      ],
      attendance_status: ["pending", "validated", "paid"],
      bassin_status: ["actif", "inactif", "maintenance", "recolte"],
      campagne_status: [
        "planifiee",
        "en_cours",
        "cloturee",
        "annulee",
        "active",
      ],
      cash_account_type: ["banque", "caisse", "mobile_money"],
      client_type: ["local", "export", "particulier"],
      employee_type: ["permanent", "saisonnier", "journalier"],
      fiscal_period_status: ["open", "closed", "locked"],
      fixed_asset_status: ["active", "disposed", "scrapped"],
      payment_status: ["pending", "paid", "cancelled"],
      po_status: [
        "draft",
        "pending",
        "approved",
        "partial",
        "received",
        "cancelled",
        "pending_approval",
      ],
      purchase_payment_type: ["advance", "payment", "refund"],
      quality_status: ["pending", "approved", "rejected"],
      sale_status: ["draft", "confirmed", "delivered", "cancelled"],
      stock_movement_type: ["entry", "exit", "adjustment", "transfer"],
      supplier_type: ["fourniture", "prestataire", "transporteur"],
      transaction_status: ["draft", "validated", "cancelled"],
      transaction_type: [
        "vente",
        "achat",
        "paiement",
        "encaissement",
        "od",
        "paie",
        "amortissement",
        "cloture",
        "transfert",
        "vente_locale",
        "vente_export",
        "virement_interne",
        "encaissement_client",
      ],
    },
  },
} as const
