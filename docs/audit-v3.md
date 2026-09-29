# Audit G-Suite SEL — Lot 0 (v2 → v3)

Date : 29/09/2026. **Aucune modification de code n'a été faite pour cet audit.**
Méthode : lecture du code (`src/`), des migrations et interrogation directe de la base (politiques de sécurité, fonctions, déclencheurs, données).
Légende : **Confirmé** = le problème existe ; **Infirmé** = déjà correct ; **Partiel** = en partie.

## 1. Tableau de synthèse

| # | Point | Statut | Constat | Fichiers / tables | Gravité | Correctif proposé |
|---|---|---|---|---|---|---|
| 1 | Tolérance d'équilibre, stockage, arrondi TVA | Confirmé | Tolérance **0,01 FCFA** (et non 0,005) en base (`check_transaction_balance`) et à l'écran (`JournalEntryForm.tsx:243`). Montants en `NUMERIC` (pas de flottant en base), mais arrondis à **2 décimales** (`currency.ts` `toDecimalPlaces(2)`), pas en entiers FCFA. TVA calculée sur le **total HT** de la commande, pas ligne par ligne. | `check_transaction_balance`, `src/lib/domain/currency.ts`, `OrderFormDialog.tsx`, `PurchaseOrderForm.tsx` | Haute | Tolérance 0 ; arrondi à l'unité ; TVA par ligne (Lot 1.1) |
| 2 | Mode shadow | Partiel | Défini dans `accounting_config.posting_mode` (off/shadow/live). **Défaut pour une nouvelle entreprise : shadow.** Les 2 entreprises existantes sont en live. Les écritures en attente sont affichées dans `ShadowEntriesPanel` (Grand Livre) mais il n'existe **pas de bouton Valider/Rejeter**. Les états financiers et la liasse lisent **uniquement le Grand Livre** (écritures définitives). Aucune bannière ne prévient l'utilisateur. | `accounting_config`, `accounting_shadow_entries`, `useAccountingShadow.ts` | Haute | Valider/rejeter + bannière + bascule live (Lot 1.2) |
| 3 | Matrice des rôles appliquée où ? | Partiel | Routeur : `src/utils/permissions.ts` (par page). Base : toutes les tables ont des politiques par entreprise ; une partie utilise aussi `has_role`/`has_any_role` (achats, paie, comptabilité, stocks…). Mais certaines lectures sont ouvertes à **tout membre de l'entreprise** : ex. `accounts` (comptes de trésorerie et soldes) visible par tous les rôles. Fonctions serveur : 26 fonctions protégées sont exécutables par tout utilisateur connecté (chacune vérifie l'appelant, mais la liste n'est pas homogène). | `pg_policies` (59 tables), `permissions.ts` | Haute | Droits par action en base (Lot 1.3) |
| 4 | Rôles multiples | Confirmé | **Priorité**, pas union : `AuthContext.tsx:82` garde un seul rôle (admin > gérant > comptable > …). Un comptable + commercial perd les pages commerciales. | `AuthContext.tsx` | Haute | Union des droits |
| 5 | Paie : comptes et paiement | Partiel | Le formulaire lit `accounts` (banque/caisse) ; la base autorise la lecture à tout membre de l'entreprise, **avec les soldes**. Paiement : pages paie ouvertes à RH/gérant ; le comptable n'a pas la route `/equipes`. | `PayrollPaymentForm.tsx:45`, `accounts`, `payroll_payments` | Moyenne | Liste sans soldes pour non-comptables ; paiement réservé comptable/gérant |
| 6 | KPI du tableau de bord | Partiel | Seul un test admin/gérant existe (`Index.tsx:52`). Les autres KPI ne sont pas filtrés par rôle côté écran ; la base filtre certaines données, pas toutes. | `src/pages/Index.tsx` | Moyenne | KPI filtrés par rôle |
| 7 | Pages `/rapports` | Confirmé | La page est ouverte à gérant, comptable, commercial et d'autres rôles, sans filtrage des rapports par domaine. | `permissions.ts`, `Rapports.tsx` | Moyenne | Rapports par domaine |
| 8 | TAFIRE et notes annexes | Partiel | `generate_tafire` (ancien format) + nouvelle page **Liasse SYSCOHADA** : Bilan, Compte de résultat, Tableau des flux (ZA–ZH), N-1, notes « détail des comptes ». Les notes 1 à 36 au format officiel (tableaux spécifiques) n'existent pas. | `generate_tafire`, `LiasseSyscohada.tsx`, `syscohadaLiasse.ts` | Moyenne | Notes officielles prioritaires (3A, 6, 7, 17, 27) |
| 9 | Clôture : classe 8, provisoire, réouverture | Partiel | La liasse inclut la classe 8 (HAO, 89 impôt). La clôture solde les classes 6-7-8. **Aucune clôture provisoire ni réouverture** (aucune fonction). | `close_fiscal_year` | Moyenne | Clôture provisoire + réouverture par contrepassation |
| 10 | Valorisation stock | Partiel | Sel produit : 361/736 au coût issu de la production ; couches FIFO/CMP (`inventory_valuation_layers`). Achats stockés en 602, variation 6032/321 **seulement à la clôture**. Coût de production (`calculate_cost_per_ton`) calculé mais pas systématiquement utilisé pour valoriser chaque entrée. | `trg_acc_production_stored`, `post_inventory_variation`, `cost_per_ton` | Moyenne | Brancher le coût de revient sur la valeur d'entrée |
| 11 | Écriture d'achat | Confirmé | Générée à la **réception** (`trg_acc_purchase_received` sur `purchase_orders`), pas à la facture fournisseur. | `purchase_orders` | Moyenne | Option : écriture à la facture (paramètre) |
| 12 | Avoirs | Confirmé | **Inexistants** (aucune table ni écran). Retours clients inexistants aussi. | — | Haute | Créer avoirs clients/fournisseurs avec contrepassation |
| 13 | Local / Export, taux 18 % | Partiel | Export : pas de TVA + compte 7022 ; Local : TVA + 7021. **18 % codé en dur** à 6 endroits (`Commercial.tsx:180`, `OrderFormDialog.tsx:87`, `PurchaseOrderForm.tsx:75,225`, `usePurchaseOrders.ts:99`, `currency.ts`). | voir fichiers | Moyenne | Taux paramétrable par pays |
| 14 | Blocage achats / budget | Infirmé (déjà correct) | Serveur : `enforce_po_budget` (déclencheur) bloque sans campagne/ligne budgétaire, dépassement, phase verrouillée. Budget consommé en **HT**. Aussi vérifié à l'écran (`PurchaseOrderForm.tsx`). | `enforce_po_budget` | — | Aucun |
| 15 | Unités et décimales | Confirmé | Colonne `unit_of_measure` présente, mais écrans et calculs en **tonnes uniquement** ; pas de sacs ni kg. Décimales non limitées. | `inventory_items`, `sale_items`, `Stocks.tsx` | Moyenne | Unités sac/kg avec conversion (Lot 5) |
| 16 | Mobile money | Partiel | Disponible : paie, paiements fournisseurs, comptes de trésorerie (552). Non vérifié comme mode sur l'encaissement des ventes. | `PayrollPaymentForm.tsx`, `PurchasePaymentDialog.tsx`, `Comptabilite.tsx` | Basse | Ajouter sur encaissement client |
| 17 | Numérotation factures | Partiel | Séquence **continue par entreprise** (`document_sequences` : invoice, journal_entry, purchase_order) générée en base. **Pas remise à zéro par exercice.** Hors ligne : aucun numéro possible (la base est nécessaire). | `next_document_number_for`, `set_sales_invoice_number` | Moyenne | Séquence par exercice ; numéro provisoire hors ligne |
| 18 | Hors ligne | Partiel | Lecture en cache (`queryConfig.ts` : `offlineFirst`). **Pas de file d'attente d'écriture ni clé d'idempotence** ; pas de gestion de conflit de stock. | `src/lib/queryConfig.ts`, `vite.config.ts` | Haute | File d'attente + idempotence (Lot 7) |
| 19 | Sécurité compte | Partiel | Déconnexion après **2 h d'inactivité** (`useSessionTimeout`). Pas de double authentification (MFA). Politique de mot de passe et verrouillage après échecs : réglages par défaut du service, non renforcés. Journal admin : `admin_activity_logs` existe, accès admin aux données d'une entreprise non journalisé systématiquement. | `useSessionTimeout.ts`, `admin_activity_logs` | Moyenne | MFA gérant/comptable, verrouillage, journal |
| 20 | Anciens comptes « Demo Sel » | Confirmé | **4 lignes** du Grand Livre sur 601 / 4451 / 701 / 6031. | `journal_entries` | Basse | Contrepassation + repassage sur 602/4452/7021/736 |
| 21 | Performance | Partiel | Index `journal_entries(tenant_id, entry_date)` et `(account_id)`. Grand Livre **sans pagination ni virtualisation**. Poids du bundle non mesuré dans cet audit. | `useAccountingLedger.ts` | Moyenne | Pagination serveur |
| 22 | Version Electron | Partiel | Configuration présente (`electron/main.js`, `electron-builder.json`). **Pas de mise à jour automatique**, aucun test. Non construite ni testée dans cet audit. | `electron/` | Basse | Décider maintien ou abandon |
| 23 | Export complet Excel | Confirmé | Aucune bibliothèque Excel ; exports CSV ponctuels (liasse, certains tableaux). Pas d'export complet d'une entreprise. | — | Moyenne | Export classeur complet |
| 24 | Import Excel | Confirmé | **Inexistant** (clients, articles, fournisseurs, soldes d'ouverture, employés). | — | Haute | Import avec modèle et contrôle |
| 25 | Parcours (clics, champs) | Non mesuré | Non compté dans cet audit : nécessite un chronométrage à l'écran par parcours. | — | — | À mesurer au Lot 3 |

## 2. Points infirmés (ne seront pas retouchés)
- **#14** Blocage des achats sans campagne et du dépassement de budget : déjà appliqué en base, en HT.

## 3. Liste ordonnée des correctifs proposés
1. (#1) Tolérance 0, montants entiers FCFA, TVA par ligne.
2. (#4) Union des rôles multiples.
3. (#3, #5) Droits par action en base ; comptes de trésorerie sans soldes pour les non-comptables ; revue des 26 fonctions serveur.
4. (#2) Mode shadow : valider/rejeter, bannière, bascule live.
5. (#12) Avoirs et retours clients.
6. (#18) Hors ligne : file d'attente avec idempotence.
7. (#24) Import Excel.
8. (#13) Taux de TVA paramétrable.
9. (#6, #7) KPI et rapports filtrés par rôle.
10. (#9) Clôture provisoire et réouverture.
11. (#17) Numérotation par exercice.
12. (#10, #11) Valorisation du stock au coût de revient ; écriture d'achat à la facture (paramètre).
13. (#15, #16) Unités sac/kg ; mobile money sur encaissement.
14. (#19) MFA, verrouillage.
15. (#21, #23) Pagination Grand Livre ; export complet.
16. (#20) Régularisation des 4 lignes Demo Sel.
17. (#22) Electron : décision.
18. (#25, #8) Mesure des parcours ; notes annexes officielles.
