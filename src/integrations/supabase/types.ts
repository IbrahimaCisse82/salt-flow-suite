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
          account_number: string | null
          account_type: Database["public"]["Enums"]["account_type"]
          balance: number
          bank_name: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          account_type: Database["public"]["Enums"]["account_type"]
          balance?: number
          bank_name?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          account_type?: Database["public"]["Enums"]["account_type"]
          balance?: number
          bank_name?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      bassins: {
        Row: {
          code: string
          created_at: string | null
          humidity: number | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          salinity: number | null
          sector: string | null
          status: Database["public"]["Enums"]["bassin_status"] | null
          surface_area: number
          tenant_id: string
          type: Database["public"]["Enums"]["bassin_type"]
          updated_at: string | null
          water_level: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          humidity?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          salinity?: number | null
          sector?: string | null
          status?: Database["public"]["Enums"]["bassin_status"] | null
          surface_area: number
          tenant_id: string
          type?: Database["public"]["Enums"]["bassin_type"]
          updated_at?: string | null
          water_level?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          humidity?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          salinity?: number | null
          sector?: string | null
          status?: Database["public"]["Enums"]["bassin_status"] | null
          surface_area?: number
          tenant_id?: string
          type?: Database["public"]["Enums"]["bassin_type"]
          updated_at?: string | null
          water_level?: number | null
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
          budgeted_amount: number
          campagne_id: string
          created_at: string
          expense_type: string
          id: string
          phase: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          budgeted_amount?: number
          campagne_id: string
          created_at?: string
          expense_type: string
          id?: string
          phase: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          budgeted_amount?: number
          campagne_id?: string
          created_at?: string
          expense_type?: string
          id?: string
          phase?: string
          tenant_id?: string
          updated_at?: string
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
          end_date: string
          id: string
          name: string
          notes: string | null
          revenue_forecast: number | null
          start_date: string
          status: Database["public"]["Enums"]["campagne_status"] | null
          target_production: number | null
          tenant_id: string
          updated_at: string | null
          year: number
        }
        Insert: {
          actual_production?: number | null
          budget_total?: number | null
          created_at?: string | null
          end_date: string
          id?: string
          name: string
          notes?: string | null
          revenue_forecast?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["campagne_status"] | null
          target_production?: number | null
          tenant_id: string
          updated_at?: string | null
          year: number
        }
        Update: {
          actual_production?: number | null
          budget_total?: number | null
          created_at?: string | null
          end_date?: string
          id?: string
          name?: string
          notes?: string | null
          revenue_forecast?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["campagne_status"] | null
          target_production?: number | null
          tenant_id?: string
          updated_at?: string | null
          year?: number
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
          created_at: string
          id: string
          is_active: boolean
          parent_account_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number: string
          account_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          parent_account_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
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
          client_type: Database["public"]["Enums"]["client_type"]
          created_at: string | null
          credit_limit: number | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          payment_terms: number | null
          phone: string | null
          tax_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          client_type: Database["public"]["Enums"]["client_type"]
          created_at?: string | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          tax_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          client_type?: Database["public"]["Enums"]["client_type"]
          created_at?: string | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          tax_id?: string | null
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
      daily_workers: {
        Row: {
          created_at: string | null
          daily_rate: number
          first_name: string
          id: string
          last_name: string
          phone: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          daily_rate: number
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          daily_rate?: number
          first_name?: string
          id?: string
          last_name?: string
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
      employees: {
        Row: {
          created_at: string | null
          email: string | null
          employee_type: Database["public"]["Enums"]["employee_type"]
          first_name: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          last_name: string
          notes: string | null
          phone: string | null
          position: string | null
          salary: number | null
          specialization: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          employee_type?: Database["public"]["Enums"]["employee_type"]
          first_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          salary?: number | null
          specialization?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          employee_type?: Database["public"]["Enums"]["employee_type"]
          first_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          salary?: number | null
          specialization?: string | null
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
      harvests: {
        Row: {
          bassin_id: string
          campagne_id: string | null
          cost_per_ton: number | null
          created_at: string | null
          date: string
          id: string
          lot_number: string | null
          notes: string | null
          quantity: number
          salt_type: Database["public"]["Enums"]["salt_type"]
          team_size: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          bassin_id: string
          campagne_id?: string | null
          cost_per_ton?: number | null
          created_at?: string | null
          date: string
          id?: string
          lot_number?: string | null
          notes?: string | null
          quantity: number
          salt_type: Database["public"]["Enums"]["salt_type"]
          team_size?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          bassin_id?: string
          campagne_id?: string | null
          cost_per_ton?: number | null
          created_at?: string | null
          date?: string
          id?: string
          lot_number?: string | null
          notes?: string | null
          quantity?: number
          salt_type?: Database["public"]["Enums"]["salt_type"]
          team_size?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "harvests_bassin_id_fkey"
            columns: ["bassin_id"]
            isOneToOne: false
            referencedRelation: "bassins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvests_campagne_id_fkey"
            columns: ["campagne_id"]
            isOneToOne: false
            referencedRelation: "campagnes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          account_id: string
          created_at: string
          credit: number
          debit: number
          description: string | null
          id: string
          tenant_id: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          tenant_id: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          tenant_id?: string
          transaction_id?: string
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
          account_id: string
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          reference: string | null
          sale_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          reference?: string | null
          sale_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference?: string | null
          sale_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      production_records: {
        Row: {
          bassin_id: string
          campagne_id: string | null
          created_at: string | null
          date: string
          humidity: number | null
          id: string
          notes: string | null
          quality_grade: number | null
          quantity: number
          salinity: number | null
          salt_type: Database["public"]["Enums"]["salt_type"]
          tenant_id: string
          updated_at: string | null
          weather_conditions: string | null
        }
        Insert: {
          bassin_id: string
          campagne_id?: string | null
          created_at?: string | null
          date: string
          humidity?: number | null
          id?: string
          notes?: string | null
          quality_grade?: number | null
          quantity: number
          salinity?: number | null
          salt_type: Database["public"]["Enums"]["salt_type"]
          tenant_id: string
          updated_at?: string | null
          weather_conditions?: string | null
        }
        Update: {
          bassin_id?: string
          campagne_id?: string | null
          created_at?: string | null
          date?: string
          humidity?: number | null
          id?: string
          notes?: string | null
          quality_grade?: number | null
          quantity?: number
          salinity?: number | null
          salt_type?: Database["public"]["Enums"]["salt_type"]
          tenant_id?: string
          updated_at?: string | null
          weather_conditions?: string | null
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
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string
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
      quality_controls: {
        Row: {
          certificate_number: string | null
          created_at: string | null
          granulometry: string | null
          humidity: number | null
          id: string
          iodine_level: number | null
          lab_name: string | null
          lot_number: string | null
          notes: string | null
          passed: boolean | null
          purity: number | null
          salinity: number | null
          salt_type: Database["public"]["Enums"]["salt_type"]
          tenant_id: string
          test_date: string
          updated_at: string | null
        }
        Insert: {
          certificate_number?: string | null
          created_at?: string | null
          granulometry?: string | null
          humidity?: number | null
          id?: string
          iodine_level?: number | null
          lab_name?: string | null
          lot_number?: string | null
          notes?: string | null
          passed?: boolean | null
          purity?: number | null
          salinity?: number | null
          salt_type: Database["public"]["Enums"]["salt_type"]
          tenant_id: string
          test_date: string
          updated_at?: string | null
        }
        Update: {
          certificate_number?: string | null
          created_at?: string | null
          granulometry?: string | null
          humidity?: number | null
          id?: string
          iodine_level?: number | null
          lab_name?: string | null
          lot_number?: string | null
          notes?: string | null
          passed?: boolean | null
          purity?: number | null
          salinity?: number | null
          salt_type?: Database["public"]["Enums"]["salt_type"]
          tenant_id?: string
          test_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_controls_tenant_id_fkey"
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
          can_be_delivered: boolean | null
          client_id: string
          created_at: string | null
          delivered: boolean | null
          delivery_date: string | null
          delivery_number: string | null
          discount: number | null
          id: string
          invoice_number: string | null
          notes: string | null
          payment_status: string | null
          quantity: number
          sale_date: string
          salt_type: Database["public"]["Enums"]["salt_type"]
          tax_amount: number | null
          tenant_id: string
          total_amount: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          can_be_delivered?: boolean | null
          client_id: string
          created_at?: string | null
          delivered?: boolean | null
          delivery_date?: string | null
          delivery_number?: string | null
          discount?: number | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_status?: string | null
          quantity: number
          sale_date: string
          salt_type: Database["public"]["Enums"]["salt_type"]
          tax_amount?: number | null
          tenant_id: string
          total_amount: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          can_be_delivered?: boolean | null
          client_id?: string
          created_at?: string | null
          delivered?: boolean | null
          delivery_date?: string | null
          delivery_number?: string | null
          discount?: number | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_status?: string | null
          quantity?: number
          sale_date?: string
          salt_type?: Database["public"]["Enums"]["salt_type"]
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
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
          actor_id: string | null
          created_at: string
          id: string
          ip_address: unknown | null
          new_value: Json | null
          old_value: Json | null
          target_user_id: string | null
          tenant_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_value?: Json | null
          old_value?: Json | null
          target_user_id?: string | null
          tenant_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_value?: Json | null
          old_value?: Json | null
          target_user_id?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
      stocks: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          harvest_date: string | null
          id: string
          lot_number: string | null
          notes: string | null
          quality_grade: number | null
          quantity: number
          salt_type: Database["public"]["Enums"]["salt_type"]
          tenant_id: string
          unit_cost: number | null
          updated_at: string | null
          warehouse_id: string
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          harvest_date?: string | null
          id?: string
          lot_number?: string | null
          notes?: string | null
          quality_grade?: number | null
          quantity?: number
          salt_type: Database["public"]["Enums"]["salt_type"]
          tenant_id: string
          unit_cost?: number | null
          updated_at?: string | null
          warehouse_id: string
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          harvest_date?: string | null
          id?: string
          lot_number?: string | null
          notes?: string | null
          quality_grade?: number | null
          quantity?: number
          salt_type?: Database["public"]["Enums"]["salt_type"]
          tenant_id?: string
          unit_cost?: number | null
          updated_at?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stocks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocks_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
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
          is_active: boolean
          logo_url: string | null
          manager_name: string | null
          name: string
          ninea: string | null
          rccm: string | null
          subdomain: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          manager_name?: string | null
          name: string
          ninea?: string | null
          rccm?: string | null
          subdomain: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          manager_name?: string | null
          name?: string
          ninea?: string | null
          rccm?: string | null
          subdomain?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          campagne_id: string | null
          campagne_phase: string | null
          created_at: string
          date: string
          description: string
          id: string
          journal_code: string | null
          notes: string | null
          reference: string | null
          tenant_id: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          account_id: string
          amount: number
          campagne_id?: string | null
          campagne_phase?: string | null
          created_at?: string
          date: string
          description: string
          id?: string
          journal_code?: string | null
          notes?: string | null
          reference?: string | null
          tenant_id: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number
          campagne_id?: string | null
          campagne_phase?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          journal_code?: string | null
          notes?: string | null
          reference?: string | null
          tenant_id?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
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
        ]
      }
      warehouses: {
        Row: {
          capacity: number
          code: string
          created_at: string | null
          current_stock: number | null
          humidity: number | null
          id: string
          location: string | null
          name: string
          notes: string | null
          temperature: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          capacity: number
          code: string
          created_at?: string | null
          current_stock?: number | null
          humidity?: number | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          temperature?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          code?: string
          created_at?: string | null
          current_stock?: number | null
          humidity?: number | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          temperature?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      work_logs: {
        Row: {
          bassin_id: string | null
          created_at: string | null
          date: string
          employee_id: string | null
          hours_worked: number
          id: string
          notes: string | null
          task_description: string | null
          tenant_id: string
          worker_id: string | null
        }
        Insert: {
          bassin_id?: string | null
          created_at?: string | null
          date: string
          employee_id?: string | null
          hours_worked: number
          id?: string
          notes?: string | null
          task_description?: string | null
          tenant_id: string
          worker_id?: string | null
        }
        Update: {
          bassin_id?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string | null
          hours_worked?: number
          id?: string
          notes?: string | null
          task_description?: string | null
          tenant_id?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_logs_bassin_id_fkey"
            columns: ["bassin_id"]
            isOneToOne: false
            referencedRelation: "bassins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_logs_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "daily_workers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      safe_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          tenant_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          tenant_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          tenant_id?: string | null
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
    }
    Functions: {
      admin_update_user_role: {
        Args: {
          _new_role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: undefined
      }
      current_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      update_own_profile: {
        Args: { _avatar_url?: string; _full_name?: string; _phone?: string }
        Returns: undefined
      }
    }
    Enums: {
      account_type: "banque" | "caisse"
      bassin_status: "actif" | "maintenance" | "repos" | "preparation"
      bassin_type: "surface_preparatoire" | "table_salante"
      campagne_status: "planification" | "en_cours" | "terminee" | "annulee"
      client_type:
        | "grossiste"
        | "detaillant"
        | "industriel"
        | "exportateur"
        | "cooperative"
      employee_type: "permanent" | "journalier"
      salt_type: "gros" | "fin" | "iode" | "industriel" | "export"
      transaction_type:
        | "depense"
        | "vente_locale"
        | "vente_export"
        | "divers"
        | "virement_interne"
      user_role: "gerant" | "commercial" | "production" | "comptable" | "admin"
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
      account_type: ["banque", "caisse"],
      bassin_status: ["actif", "maintenance", "repos", "preparation"],
      bassin_type: ["surface_preparatoire", "table_salante"],
      campagne_status: ["planification", "en_cours", "terminee", "annulee"],
      client_type: [
        "grossiste",
        "detaillant",
        "industriel",
        "exportateur",
        "cooperative",
      ],
      employee_type: ["permanent", "journalier"],
      salt_type: ["gros", "fin", "iode", "industriel", "export"],
      transaction_type: [
        "depense",
        "vente_locale",
        "vente_export",
        "divers",
        "virement_interne",
      ],
      user_role: ["gerant", "commercial", "production", "comptable", "admin"],
    },
  },
} as const
