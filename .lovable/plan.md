# Plan — Chaînage P1/P2 complet

## Contexte
Le backend est sécurisé (0 ERROR linter, 13 WARN acceptés). Restent 4 chantiers de qualité/fiabilité. Je les enchaîne en 4 étapes séquentielles avec validation entre chaque.

## Étape 1 — Numérotation séquentielle DB (P1, conformité SYSCOHADA Art. 17)
**Migration SQL :**
- Table `document_sequences (tenant_id, doc_type, year, last_number)` avec PK composite
- RPC `next_document_number(p_doc_type text)` SECURITY DEFINER → verrou de ligne (`FOR UPDATE`), incrément atomique, format `PREFIX-YYYY-NNNNN`
- Types : `invoice`, `purchase_order`, `journal_entry`, `payment`, `delivery_note`
- Triggers `BEFORE INSERT` sur `sales.invoice_number`, `purchase_orders.order_number`, `journal_entries.entry_number`, `payments.reference` → remplit si NULL

**Code frontend :**
- Retirer `generateOrderNumber()`, `Math.random()` et concaténation `INV-${id.slice}` dans `useSales.ts`, `usePurchaseOrders.ts`, `useTransactions.ts`, `useComptabiliteData.ts` (fallback affiché)
- Laisser la DB générer, lire la valeur retournée dans `.select().single()`

## Étape 2 — Retrait des `@ts-nocheck` restants (P1, dette de typage)
30 fichiers concernés. Approche :
- Régénérer/vérifier `src/integrations/supabase/types.ts` post-migration Étape 1
- Fichiers "sûrs" à dé-shimmer d'abord (types déjà alignés) : `useSuppliers`, `useTeams`, `useTeamAttendance`, `useStockMovements`, `useStockStats`, `usePurchaseOrders`, `usePurchaseOrderItems`, `usePurchaseNotifications`, `useQualityTests`, `useScheduledReports`, `useTenant`, `useTenants`, `useTraceability`, `useKPIs`
- Pages god-file qui gardent `@ts-nocheck` temporairement : `Comptabilite.tsx`, `Campagne.tsx`, `Commercial.tsx`, `Production.tsx`, `Stocks.tsx`, `Rapports.tsx`, `Parametres.tsx`, `admin/Tenants.tsx`, `admin/ChartOfAccounts.tsx`, `comptabilite/Immobilisations.tsx`, `comptabilite/ClotureExercice.tsx` → refactor plus lourd, on documente et on garde le shim
- `rateLimit.ts`, `pushNotifications.ts`, `database.types.ts` : legit (types externes) → garder
- Cible atteignable : 30 → ~11 fichiers shimmed (uniquement god-pages + types externes)

## Étape 3 — Index composites tenant_id (P1, performance)
**Migration SQL :** ajouter les index composites manquants pour les requêtes filtrées les plus fréquentes :
- `sales (tenant_id, sale_date DESC)`
- `transactions (tenant_id, transaction_date DESC)`
- `journal_entries (tenant_id, entry_date DESC)`
- `purchase_orders (tenant_id, order_date DESC, status)`
- `stock_movements (tenant_id, created_at DESC)`
- `payments (tenant_id, payment_date DESC)`
- `team_attendance (tenant_id, work_date DESC)`
- `production_records (tenant_id, production_date DESC)`

## Étape 4 — Tests E2E workflows critiques (P2, non-régression métier)
Fichiers Playwright existants dans `e2e/`. Ajouter/consolider 3 specs :
- `e2e/workflow-po-to-stock.spec.ts` : création PO → approbation → réception partielle → stock incrémenté + CMP recalculé + écriture 401/604
- `e2e/workflow-sale-to-accounting.spec.ts` : création vente → livraison → paiement → écritures 411/701/521
- `e2e/workflow-payroll.spec.ts` : pointage → validation → notification comptable → paiement → écritures 661/421/531

Lancer `bun test` + `playwright test` et corriger les casses éventuelles.

## Livrables
- 2 migrations SQL (numérotation + index)
- ~15-20 fichiers TS dé-shimmés
- 3 specs E2E
- Rapport final : linter + build + tests

## Ordre d'exécution
Étape 1 → validation user → Étape 2 → Étape 3 → Étape 4 → rapport final.

## Ce que je ne fais PAS dans ce chaînage
- Refactor des god-pages (Comptabilite.tsx 2025 LOC, Campagne.tsx 1310) → chantier séparé, trop risqué en une passe
- Ajout des charges sociales OHADA (IPRES/CSS) sur la paie → besoin de spec métier utilisateur
- Fragmentation migrations (248 fichiers) → cosmétique, aucune valeur fonctionnelle
