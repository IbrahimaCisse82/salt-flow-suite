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
      bassins: {
        Row: {
          area: number | null
          code: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          area?: number | null
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          area?: number | null
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          tenant_id?: string
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
          deleted_at: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
          target_production: number | null
          tenant_id: string
          updated_at: string | null
          year: number | null
        }
        Insert: {
          actual_production?: number | null
          budget_total?: number | null
          created_at?: string | null
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          target_production?: number | null
          tenant_id: string
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          actual_production?: number | null
          budget_total?: number | null
          created_at?: string | null
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          name?: string
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
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          sale_id: string | null
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
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
          tenant_id: string
          traceability_code: string | null
          updated_at: string | null
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
          tenant_id: string
          traceability_code?: string | null
          updated_at?: string | null
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
          tenant_id?: string
          traceability_code?: string | null
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
      purchase_order_items: {
        Row: {
          created_at: string | null
          id: string
          item_category: string | null
          item_description: string | null
          item_name: string
          line_total: number | null
          notes: string | null
          purchase_order_id: string | null
          quantity: number
          received_quantity: number | null
          unit_of_measure: string | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_category?: string | null
          item_description?: string | null
          item_name: string
          line_total?: number | null
          notes?: string | null
          purchase_order_id?: string | null
          quantity: number
          received_quantity?: number | null
          unit_of_measure?: string | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_category?: string | null
          item_description?: string | null
          item_name?: string
          line_total?: number | null
          notes?: string | null
          purchase_order_id?: string | null
          quantity?: number
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
        ]
      }
      purchase_orders: {
        Row: {
          actual_delivery_date: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          discount_amount: number | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          status: string
          subtotal: number | null
          supplier_id: string | null
          tax_amount: number | null
          tenant_id: string
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          discount_amount?: number | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          status?: string
          subtotal?: number | null
          supplier_id?: string | null
          tax_amount?: number | null
          tenant_id: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          discount_amount?: number | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          status?: string
          subtotal?: number | null
          supplier_id?: string | null
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
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
          delivery_date: string | null
          delivery_number: string | null
          discount: number | null
          id: string
          invoice_number: string | null
          notes: string | null
          payment_status: string | null
          quality_certificate_id: string | null
          quantity: number | null
          sale_date: string | null
          salt_type: string
          tenant_id: string
          total_amount: number | null
          traceability_code: string | null
          unit_price: number | null
          updated_at: string | null
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
          delivery_date?: string | null
          delivery_number?: string | null
          discount?: number | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_status?: string | null
          quality_certificate_id?: string | null
          quantity?: number | null
          sale_date?: string | null
          salt_type: string
          tenant_id: string
          total_amount?: number | null
          traceability_code?: string | null
          unit_price?: number | null
          updated_at?: string | null
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
          delivery_date?: string | null
          delivery_number?: string | null
          discount?: number | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_status?: string | null
          quality_certificate_id?: string | null
          quantity?: number | null
          sale_date?: string | null
          salt_type?: string
          tenant_id?: string
          total_amount?: number | null
          traceability_code?: string | null
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
      [_ in never]: never
    }
    Functions: {
      calculate_next_run: {
        Args: {
          p_current_run?: string
          p_frequency: string
          p_schedule_time: string
        }
        Returns: string
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
