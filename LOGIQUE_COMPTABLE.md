# Logique Comptable Automatisée

## Vue d'ensemble

Le système comptable est entièrement intégré et automatisé selon les principes SYSCOHADA. Chaque opération génère automatiquement les écritures comptables correspondantes via des triggers PostgreSQL.

## Flux Comptables Automatiques

### 1. Production → Stock → Comptabilité

**Trigger**: `trigger_update_stock_on_production` + `trigger_create_accounting_entry_on_production`

Quand une production est enregistrée:
1. ✅ Stock mis à jour automatiquement (+quantité)
2. ✅ Écriture comptable créée (valorisation au coût de revient)

**Comptes impactés**:
- **Débit 35** - Stocks de produits finis
- **Crédit 72** - Production stockée

**Valorisation**: La production est valorisée au coût par tonne calculé dans le module Rapports (coût de revient incluant matières premières, main-d'œuvre, énergie, etc.)

### 2. Vente → Stock → Comptabilité

**Trigger**: `trigger_update_stock_on_sale` + `trigger_create_accounting_entry_on_sale`

Quand une vente est facturée (`sale_status = 'invoiced'` ou `'completed'`):
1. ✅ Stock diminué automatiquement (-quantité)
2. ✅ Écriture de vente créée
3. ✅ Écriture de coût des ventes créée (si vente complète)

**Comptes impactés**:
- **Débit 411** - Clients | **Crédit 701** - Ventes de produits finis
- **Débit 603** - Variation des stocks | **Crédit 35** - Stocks (pour le coût des marchandises vendues)

### 3. Achat → Stock → Comptabilité

**Trigger**: `trigger_update_stock_on_purchase_receipt` + `trigger_create_accounting_entry_on_purchase`

Quand un achat est payé (`status = 'paid'`):
1. ✅ Stock mis à jour (lors de la réception)
2. ✅ Écriture comptable créée

**Comptes impactés**:
- **Débit 601** - Achats de matières premières
- **Crédit 521** - Banque

### 4. Salaire → Comptabilité

**Trigger**: `trigger_create_accounting_entry_on_payroll`

Quand un paiement de salaire est enregistré:
1. ✅ Transaction comptable créée
2. ✅ Écritures du journal générées

**Comptes impactés**:
- **Débit 661** - Rémunérations du personnel
- **Crédit 521** - Banque

## Valorisation au Coût de Revient

### Calcul du Coût par Tonne

Le coût de revient est calculé dans le module **Rapports → Coût de revient** et inclut:

| Composant | Compte SYSCOHADA |
|-----------|------------------|
| Main-d'œuvre | 66 - Charges de personnel |
| Matières premières | 60 - Achats |
| Énergie | 605/606 - Autres achats |
| Transport | 61 - Transports |
| Maintenance | 615 - Entretien |
| Amortissement | 68 - Dotations amortissements |

### Utilisation dans les écritures

1. **Production stockée**: `quantité_kg / 1000 × coût_par_tonne`
2. **Coût des ventes**: `quantité_vendue_kg / 1000 × coût_par_tonne`

## Fonctions SQL Disponibles

### `create_journal_entry()`
Crée une transaction avec ses lignes de journal (écriture équilibrée débit/crédit).

### `get_account_balance(p_tenant_id, p_account_number, p_as_of_date)`
Retourne le solde d'un compte à une date donnée.

### `generate_trial_balance(p_tenant_id, p_start_date, p_end_date)`
Génère la balance des comptes sur une période:
- Solde d'ouverture
- Mouvements de la période (débits/crédits)
- Solde de clôture

## Interface Utilisateur

### Module Comptabilité → Grand Livre

Nouvel onglet "Grand Livre" permettant de:
- Visualiser toutes les écritures comptables
- Filtrer par date et par compte
- Voir la balance des comptes
- Vérifier l'équilibre des écritures

### Diagramme des flux

Schéma visuel des automatisations:
- Production → Stock (+) → Compta (35/72)
- Vente → Stock (-) → Compta (411/701 + 603/35)
- Achat → Stock (+) → Compta (601/521)
- Salaire → Compta (661/521)

## Cohérence des Données

### Garanties

1. **Atomicité**: Les triggers s'exécutent dans la même transaction
2. **Traçabilité**: Chaque écriture est liée à son opération source (via `reference`)
3. **Équilibre**: Chaque transaction génère des écritures équilibrées (débit = crédit)
4. **Valorisation cohérente**: Le même coût de revient est utilisé pour la production et les ventes

### Vérifications

Pour vérifier la cohérence:
```sql
-- Balance des comptes
SELECT * FROM generate_trial_balance('tenant_id', '2025-01-01', '2025-12-31');

-- Vérifier équilibre des écritures
SELECT 
  transaction_id,
  SUM(debit) as total_debit,
  SUM(credit) as total_credit,
  ABS(SUM(debit) - SUM(credit)) as ecart
FROM journal_entries
GROUP BY transaction_id
HAVING ABS(SUM(debit) - SUM(credit)) > 0.01;
```

## Points d'attention

### Coût de revient non calculé
Si aucun coût par tonne n'est calculé, la production n'impacte pas la comptabilité (quantité × 0 = 0). Il est recommandé de calculer le coût de revient avant d'enregistrer les productions.

### Ventes brouillon
Les ventes en statut `draft` n'impactent ni le stock ni la comptabilité. Elles doivent être confirmées ou facturées.

### Achats non payés
Les achats réceptionnés mettent à jour le stock, mais l'écriture comptable n'est créée qu'au paiement (`status = 'paid'`).
