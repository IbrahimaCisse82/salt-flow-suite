# Automatisations Implémentées

## ✅ Synchronisations automatiques créées

### 1. Production → Stocks ✅
**Trigger**: `trigger_update_stock_on_production`

- Quand un enregistrement de production est créé, le stock correspondant est **automatiquement augmenté**
- Crée ou met à jour l'article dans `inventory_items` selon le type de sel (gros, fin, iodé, export)
- Catégorie: "production"
- Traçage via la colonne `stock_updated` sur `production_records`

**Fonctionnement**:
```
Production de 1000 kg de sel gros
  ↓ (trigger automatique)
inventory_items.quantity_on_hand += 1000 kg
```

### 2. Ventes → Stocks ✅
**Trigger**: `trigger_update_stock_on_sale`

- Quand une vente est **confirmée, facturée ou livrée**, le stock est **automatiquement diminué**
- Vérifie la disponibilité du stock (warning si insuffisant mais permet quand même la vente)
- Statuts déclencheurs: `confirmed`, `invoiced`, `delivered`, `completed`
- Traçage via la colonne `stock_updated` sur `sales`

**Fonctionnement**:
```
Vente de 500 kg de sel gros (statut: confirmed)
  ↓ (trigger automatique)
inventory_items.quantity_on_hand -= 500 kg
```

**Note**: Une vente en statut `draft` ne diminue PAS le stock (permet les devis)

### 3. Ventes → Comptabilité ✅
**Trigger**: `trigger_create_accounting_entry_on_sale`

- Quand une vente passe au statut `invoiced` ou `completed`, une **transaction comptable est créée automatiquement**
- Crée une écriture dans la table `transactions` de type "recette"
- Lie la vente à la transaction via `sales.transaction_id`
- Utilise le compte 701 (Ventes de produits) selon le plan comptable SYSCOHADA

**Fonctionnement**:
```
Vente facturée de 50,000 FCFA
  ↓ (trigger automatique)
Création transaction comptable:
  - Type: recette
  - Montant: 50,000 FCFA
  - Compte: 701 (Ventes)
  - Référence: Lien vers la vente
```

### 4. Achats (Réception) → Stocks ✅
**Trigger**: `trigger_update_stock_on_purchase_receipt`

- Quand un bon de commande passe au statut `received`, les stocks sont **automatiquement augmentés**
- Met à jour ou crée les articles dans `inventory_items` pour chaque ligne de commande
- Utilise la quantité reçue (`received_quantity`) de chaque article
- Met à jour le prix d'achat et la date de dernière réception

**Fonctionnement**:
```
Bon de commande marqué "received"
  ↓ (trigger automatique)
Pour chaque article:
  inventory_items.quantity_on_hand += received_quantity
  + mise à jour du prix et date d'achat
```

## Nouvelles colonnes ajoutées

### Table `sales`
- **`sale_status`** (TEXT): Statut de la vente
  - `draft`: Brouillon/Devis (ne diminue pas le stock)
  - `confirmed`: Commande confirmée (diminue le stock)
  - `invoiced`: Facturée (diminue le stock + crée écriture comptable)
  - `delivered`: Livrée (diminue le stock)
  - `completed`: Terminée (diminue le stock)

- **`stock_updated`** (BOOLEAN): Indique si le stock a été mis à jour
- **`transaction_id`** (UUID): Référence vers la transaction comptable créée

### Table `production_records`
- **`stock_updated`** (BOOLEAN): Indique si le stock a été mis à jour

## Flux automatisés complets

### Flux Production → Vente
```
1. Production enregistrée (1000 kg sel gros)
   ↓ trigger_update_stock_on_production
2. Stock augmenté automatiquement (+1000 kg)
   
3. Vente créée (500 kg, statut: draft)
   → Aucun impact sur stock (c'est un devis)
   
4. Vente confirmée (statut: confirmed)
   ↓ trigger_update_stock_on_sale
5. Stock diminué automatiquement (-500 kg)
   
6. Vente facturée (statut: invoiced)
   ↓ trigger_create_accounting_entry_on_sale
7. Transaction comptable créée automatiquement
   → Compte 701 (Ventes) crédité de 50,000 FCFA
```

### Flux Achats → Stock
```
1. Bon de commande créé (statut: draft)
   → Aucun impact
   
2. Bon de commande envoyé (statut: sent)
   → Aucun impact
   
3. Réception confirmée (statut: received)
   ↓ trigger_update_stock_on_purchase_receipt
4. Stock augmenté pour chaque article reçu
   + Mise à jour prix et date d'achat
```

## Différenciation des onglets Commercial

### Avant (problème)
Les 3 onglets affichaient tous la table `sales` sans distinction claire.

### Après (solution)
Chaque onglet a un rôle distinct basé sur `sale_status`:

- **Onglet Commandes**: Ventes avec statut `draft` ou `confirmed`
  - Rôle: Gestion des devis et commandes
  - Actions: Confirmer, Annuler

- **Onglet Facturation**: Ventes avec statut `invoiced`, `delivered`, `completed`
  - Rôle: Suivi des factures émises
  - Actions: Voir facture, Marquer comme livrée

- **Onglet Livraison**: Ventes avec statut `delivered` ou `completed`
  - Rôle: Suivi des livraisons
  - Actions: Voir bon de livraison, Finaliser

## Gestion des stocks par catégorie

### Articles de production (sel)
- **Catégorie**: `production`
- **Source**: Enregistrements de production
- **Noms standardisés**:
  - "Sel gros" (code: PROD-GRO)
  - "Sel fin" (code: PROD-FIN)
  - "Sel iodé" (code: PROD-IOD)
  - "Sel export" (code: PROD-EXP)

### Articles achetés (fournitures, équipement)
- **Catégorie**: Selon `item_category` du bon de commande
- **Source**: Bons de commande reçus
- **Code**: ACH-[hash du nom]

## Points d'attention

### ⚠️ Stock insuffisant
Le trigger `update_stock_on_sale` émet un **WARNING** si le stock est insuffisant mais **n'empêche pas** la vente. Cela permet:
- Les ventes à découvert contrôlées
- Les commandes en attente de production
- Plus de flexibilité pour les gérants

**Recommandation**: Surveiller les warnings dans les logs pour détecter les situations de rupture de stock.

### ⚠️ Ventes existantes
Les ventes créées **avant cette mise à jour** n'ont pas de `sale_status` et sont considérées comme `draft` par défaut.

**Action recommandée**: Mettre à jour manuellement les ventes existantes avec le bon statut si nécessaire.

### ⚠️ Productions existantes
Les productions créées **avant cette mise à jour** n'ont pas mis à jour les stocks.

**Action recommandée**: 
1. Soit recalculer les stocks depuis zéro
2. Soit marquer `stock_updated = true` sur les anciennes productions pour éviter les doublons

## Prochaines améliorations possibles

### Court terme
1. Ajouter une page "Alertes stock" pour visualiser les warnings
2. Créer un dashboard de traçabilité Production → Stock → Vente
3. Ajouter des notifications push sur stock faible

### Moyen terme
1. Gestion des réservations de stock (commandes confirmées mais pas encore livrées)
2. Historique complet des mouvements de stock
3. Inventaire physique vs inventaire théorique
4. Génération automatique des états de rapprochement

### Long terme
1. Prévisions de stock basées sur l'historique des ventes
2. Alertes automatiques de réapprovisionnement
3. Optimisation des niveaux de stock (min/max dynamiques)
4. Intégration avec la planification de production

## Tests recommandés

### Test 1: Production → Stock
```sql
-- Créer une production
INSERT INTO production_records (tenant_id, quantity, salt_type, production_date)
VALUES ('[tenant_id]', 1000, 'gros', CURRENT_DATE);

-- Vérifier le stock
SELECT * FROM inventory_items 
WHERE item_name = 'Sel gros' AND tenant_id = '[tenant_id]';
-- Devrait montrer +1000 kg
```

### Test 2: Vente → Stock
```sql
-- Créer une vente et la confirmer
INSERT INTO sales (tenant_id, quantity, salt_type, sale_status, ...)
VALUES ('[tenant_id]', 500, 'gros', 'confirmed', ...);

-- Vérifier le stock
SELECT * FROM inventory_items 
WHERE item_name = 'Sel gros' AND tenant_id = '[tenant_id]';
-- Devrait montrer -500 kg par rapport à avant
```

### Test 3: Vente → Comptabilité
```sql
-- Facturer une vente
UPDATE sales 
SET sale_status = 'invoiced' 
WHERE id = '[sale_id]';

-- Vérifier la transaction
SELECT * FROM transactions 
WHERE reference_type = 'sale' AND reference_id = '[sale_id]';
-- Devrait avoir créé une transaction de type recette
```

## Compatibilité

✅ Compatible avec les données existantes (grâce aux valeurs par défaut)
✅ Rétrocompatible (les anciens enregistrements continuent de fonctionner)
✅ Pas de perte de données
⚠️ Nécessite une mise à jour manuelle des statuts des ventes existantes pour profiter pleinement des automatisations
