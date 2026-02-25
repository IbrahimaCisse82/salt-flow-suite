/**
 * Types stricts dérivés de src/integrations/supabase/types.ts
 * Ce fichier fournit des types frontend alignés sur la DB pour éviter les incohérences.
 * 
 * RÈGLES DE TYPAGE:
 * 1. Utiliser les types Row pour les données lues de la DB
 * 2. Utiliser les types Insert pour les créations
 * 3. Utiliser les types Update pour les modifications
 * 4. Ne JAMAIS utiliser `any` dans les mutations
 */

import { Database } from "@/integrations/supabase/types";

// ==================== Type Helpers ====================

/** Extrait le type Row d'une table */
export type TableRow<T extends keyof Database["public"]["Tables"]> = 
  Database["public"]["Tables"][T]["Row"];

/** Extrait le type Insert d'une table */
export type TableInsert<T extends keyof Database["public"]["Tables"]> = 
  Database["public"]["Tables"][T]["Insert"];

/** Extrait le type Update d'une table */
export type TableUpdate<T extends keyof Database["public"]["Tables"]> = 
  Database["public"]["Tables"][T]["Update"];

// ==================== Bassins ====================

export type BassinRow = TableRow<"bassins">;
export type BassinInsert = TableInsert<"bassins">;
export type BassinUpdate = TableUpdate<"bassins">;

// ==================== Campagnes ====================

export type CampagneRow = TableRow<"campagnes">;
export type CampagneInsert = TableInsert<"campagnes">;
export type CampagneUpdate = TableUpdate<"campagnes">;

// ==================== Clients ====================

export type ClientRow = TableRow<"clients">;
export type ClientInsert = TableInsert<"clients">;
export type ClientUpdate = TableUpdate<"clients">;

// ==================== Employees ====================

export type EmployeeRow = TableRow<"employees">;
export type EmployeeInsert = TableInsert<"employees">;
export type EmployeeUpdate = TableUpdate<"employees">;

// ==================== Leaves ====================

export type LeaveRow = TableRow<"leaves">;
export type LeaveInsert = TableInsert<"leaves">;
export type LeaveUpdate = TableUpdate<"leaves">;

// Type enum pour leave_type aligné sur la DB
export const LEAVE_TYPES = ['conge_annuel', 'conge_maladie', 'conge_maternite', 'conge_sans_solde', 'autre'] as const;
export type LeaveType = typeof LEAVE_TYPES[number];

// Type enum pour leave status
export const LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'] as const;
export type LeaveStatus = typeof LEAVE_STATUSES[number];

// ==================== Teams ====================

export type TeamRow = TableRow<"teams">;
export type TeamInsert = TableInsert<"teams">;
export type TeamUpdate = TableUpdate<"teams">;

// ==================== Team Members ====================

export type TeamMemberRow = TableRow<"team_members">;
export type TeamMemberInsert = TableInsert<"team_members">;
export type TeamMemberUpdate = TableUpdate<"team_members">;

// ==================== Team Attendance ====================

export type TeamAttendanceRow = TableRow<"team_attendance">;
export type TeamAttendanceInsert = TableInsert<"team_attendance">;
export type TeamAttendanceUpdate = TableUpdate<"team_attendance">;

export const ATTENDANCE_STATUSES = ['pending', 'validated', 'paid'] as const;
export type AttendanceStatus = typeof ATTENDANCE_STATUSES[number];

// ==================== Daily Workers ====================

export type DailyWorkerRow = TableRow<"daily_workers">;
export type DailyWorkerInsert = TableInsert<"daily_workers">;
export type DailyWorkerUpdate = TableUpdate<"daily_workers">;

// ==================== Production Records ====================

export type ProductionRecordRow = TableRow<"production_records">;
export type ProductionRecordInsert = TableInsert<"production_records">;
export type ProductionRecordUpdate = TableUpdate<"production_records">;

export const SALT_TYPES = ['sel_fin', 'gros_sel', 'sel_gemme', 'fleur_de_sel'] as const;
export type SaltType = typeof SALT_TYPES[number];

export const QUALITY_GRADES = ['A', 'B', 'C'] as const;
export type QualityGrade = typeof QUALITY_GRADES[number];

// ==================== Quality Tests ====================

export type QualityTestRow = TableRow<"quality_tests">;
export type QualityTestInsert = TableInsert<"quality_tests">;
export type QualityTestUpdate = TableUpdate<"quality_tests">;

export const QUALITY_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type QualityStatus = typeof QUALITY_STATUSES[number];

export const COLOR_GRADES = ['blanc', 'gris', 'rose'] as const;
export type ColorGrade = typeof COLOR_GRADES[number];

export const GRAIN_SIZES = ['fin', 'moyen', 'gros'] as const;
export type GrainSize = typeof GRAIN_SIZES[number];

// ==================== Quality Certificates ====================

export type QualityCertificateRow = TableRow<"quality_certificates">;
export type QualityCertificateInsert = TableInsert<"quality_certificates">;
export type QualityCertificateUpdate = TableUpdate<"quality_certificates">;

// ==================== Sales ====================

export type SaleRow = TableRow<"sales">;
export type SaleInsert = TableInsert<"sales">;
export type SaleUpdate = TableUpdate<"sales">;

export const PAYMENT_STATUSES = ['pending', 'partial', 'paid'] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

export const SALE_STATUSES = ['draft', 'confirmed', 'delivered', 'cancelled'] as const;
export type SaleStatus = typeof SALE_STATUSES[number];

// ==================== Suppliers ====================

export type SupplierRow = TableRow<"suppliers">;
export type SupplierInsert = TableInsert<"suppliers">;
export type SupplierUpdate = TableUpdate<"suppliers">;

export const SUPPLIER_TYPES = ['fournisseur', 'prestataire', 'transporteur'] as const;
export type SupplierType = typeof SUPPLIER_TYPES[number];

// ==================== Purchase Orders ====================

export type PurchaseOrderRow = TableRow<"purchase_orders">;
export type PurchaseOrderInsert = TableInsert<"purchase_orders">;
export type PurchaseOrderUpdate = TableUpdate<"purchase_orders">;

export const PO_STATUSES = ['draft', 'pending', 'approved', 'received', 'cancelled'] as const;
export type POStatus = typeof PO_STATUSES[number];

// ==================== Purchase Order Items ====================

export type PurchaseOrderItemRow = TableRow<"purchase_order_items">;
export type PurchaseOrderItemInsert = TableInsert<"purchase_order_items">;
export type PurchaseOrderItemUpdate = TableUpdate<"purchase_order_items">;

// ==================== Inventory Items ====================

export type InventoryItemRow = TableRow<"inventory_items">;
export type InventoryItemInsert = TableInsert<"inventory_items">;
export type InventoryItemUpdate = TableUpdate<"inventory_items">;

// ==================== Tenants ====================

export type TenantRow = TableRow<"tenants">;
export type TenantInsert = TableInsert<"tenants">;
export type TenantUpdate = TableUpdate<"tenants">;

// ==================== Profiles ====================

export type ProfileRow = TableRow<"profiles">;
export type ProfileInsert = TableInsert<"profiles">;
export type ProfileUpdate = TableUpdate<"profiles">;

// ==================== Transactions ====================

export type TransactionRow = TableRow<"transactions">;
export type TransactionInsert = TableInsert<"transactions">;
export type TransactionUpdate = TableUpdate<"transactions">;

// ==================== Accounts ====================

export type AccountRow = TableRow<"accounts">;
export type AccountInsert = TableInsert<"accounts">;
export type AccountUpdate = TableUpdate<"accounts">;

// ==================== Journal Entries ====================

export type JournalEntryRow = TableRow<"journal_entries">;
export type JournalEntryInsert = TableInsert<"journal_entries">;
export type JournalEntryUpdate = TableUpdate<"journal_entries">;

// ==================== Payments ====================

export type PaymentRow = TableRow<"payments">;
export type PaymentInsert = TableInsert<"payments">;
export type PaymentUpdate = TableUpdate<"payments">;

// ==================== Payroll Payments ====================

export type PayrollPaymentRow = TableRow<"payroll_payments">;
export type PayrollPaymentInsert = TableInsert<"payroll_payments">;
export type PayrollPaymentUpdate = TableUpdate<"payroll_payments">;

// ==================== Chart of Accounts ====================

export type ChartOfAccountRow = TableRow<"chart_of_accounts">;
export type ChartOfAccountInsert = TableInsert<"chart_of_accounts">;
export type ChartOfAccountUpdate = TableUpdate<"chart_of_accounts">;

// ==================== Expense Types ====================

export type ExpenseTypeRow = TableRow<"expense_types">;
export type ExpenseTypeInsert = TableInsert<"expense_types">;
export type ExpenseTypeUpdate = TableUpdate<"expense_types">;

// ==================== Scheduled Reports ====================

export type ScheduledReportRow = TableRow<"scheduled_reports">;
export type ScheduledReportInsert = TableInsert<"scheduled_reports">;
export type ScheduledReportUpdate = TableUpdate<"scheduled_reports">;

// ==================== Notifications ====================

export type AccountantNotificationRow = TableRow<"accountant_notifications">;
export type AccountantNotificationInsert = TableInsert<"accountant_notifications">;
export type AccountantNotificationUpdate = TableUpdate<"accountant_notifications">;

export type NotificationHistoryRow = TableRow<"notification_history">;
export type NotificationHistoryInsert = TableInsert<"notification_history">;
export type NotificationHistoryUpdate = TableUpdate<"notification_history">;

// ==================== Campagne Phase Budgets ====================

export type CampagnePhaseBudgetRow = TableRow<"campagne_phase_budgets">;
export type CampagnePhaseBudgetInsert = TableInsert<"campagne_phase_budgets">;
export type CampagnePhaseBudgetUpdate = TableUpdate<"campagne_phase_budgets">;

// ==================== Fixed Assets ====================

export type FixedAssetRow = TableRow<"fixed_assets">;
export type FixedAssetInsert = TableInsert<"fixed_assets">;
export type FixedAssetUpdate = TableUpdate<"fixed_assets">;

// ==================== Depreciation Schedule ====================

export type DepreciationScheduleRow = TableRow<"depreciation_schedule">;
export type DepreciationScheduleInsert = TableInsert<"depreciation_schedule">;
export type DepreciationScheduleUpdate = TableUpdate<"depreciation_schedule">;

// ==================== Ledger Audit Log ====================

export type LedgerAuditLogRow = TableRow<"ledger_audit_log">;
export type LedgerAuditLogInsert = TableInsert<"ledger_audit_log">;
