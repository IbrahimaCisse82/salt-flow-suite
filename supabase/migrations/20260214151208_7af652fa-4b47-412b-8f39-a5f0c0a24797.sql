
-- =====================================================
-- FIX 1: Supprimer le trigger redondant de stock achats
-- handle_purchase_order_stock_reception est le trigger principal (plus complet, gère notifications)
-- update_stock_on_purchase_receipt est redondant → SUPPRESSION
-- =====================================================
DROP TRIGGER IF EXISTS trigger_update_stock_on_purchase_receipt ON public.purchase_orders;
DROP FUNCTION IF EXISTS public.update_stock_on_purchase_receipt();

-- =====================================================
-- FIX 2: Supprimer le trigger de comptabilisation automatique des salaires
-- Car le frontend useCreatePayrollPayment gère déjà la création de transaction
-- avec support des paiements partiels (label "partiel", balance_due, etc.)
-- Le trigger update_attendance_status_on_payment marque TOUJOURS 'paid'
-- sans vérifier le reliquat → on le corrige aussi
-- =====================================================
DROP TRIGGER IF EXISTS trigger_create_accounting_entry_on_payroll ON public.payroll_payments;
DROP FUNCTION IF EXISTS public.create_accounting_entry_on_payroll();

-- Corriger le trigger de mise à jour du statut de pointage
-- Il marquait systématiquement 'paid' sans vérifier le reliquat
-- Le frontend gère déjà cette logique correctement → on supprime le trigger
DROP TRIGGER IF EXISTS trigger_update_attendance_status ON public.payroll_payments;
DROP FUNCTION IF EXISTS public.update_attendance_status_on_payment();

-- =====================================================
-- FIX 3: Supprimer le trigger de comptabilisation automatique des achats
-- Car le frontend usePurchasePayments gère les paiements partiels
-- et crée déjà les transactions comptables à chaque paiement
-- Le trigger créait une DEUXIÈME transaction quand status→paid
-- =====================================================
DROP TRIGGER IF EXISTS trigger_create_accounting_entry_on_purchase ON public.purchase_orders;
DROP FUNCTION IF EXISTS public.create_accounting_entry_on_purchase();
