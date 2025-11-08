# Architecture et Relations des Pages

## Vue d'ensemble des pages

### Pages principales

#### 1. **Index (Dashboard)** - `/`
- **Description**: Page d'accueil avec vue d'ensemble des KPIs
- **Onglets**: Aucun
- **Relations**: 
  - Vue synthétique de toutes les autres sections
  - Liens vers: Bassins, Production, Commercial, Campagne
  - Affiche: KPIs production, ventes, météo, bassins

#### 2. **Bassins** - `/bassins`
- **Description**: Gestion des bassins de production
- **Onglets**: Aucun
- **Relations**:
  - **→ Production**: Les bassins sont utilisés dans les enregistrements de production
  - **→ Campagne**: Les bassins font partie des budgets de campagne
  - **Données**: Table `bassins`

#### 3. **Production** - `/production`
- **Description**: Enregistrement et suivi de la production
- **Onglets**: 
  1. **Production** - Enregistrements de production
  2. **Qualité** - Tests de qualité
  3. **Traçabilité** - Suivi des lots
- **Relations**:
  - **← Bassins**: Utilise les bassins pour la production
  - **← Campagne**: Enregistrements liés aux campagnes
  - **→ Stocks**: La production alimente les stocks
  - **→ Commercial**: Les productions peuvent être vendues
  - **Données**: Tables `production_records`, `quality_tests`, `quality_certificates`

#### 4. **Campagne** - `/campagne`
- **Description**: Gestion des campagnes de production annuelles
- **Onglets** (5 phases):
  1. **Préparation des bassins**
  2. **Mise en eau**
  3. **Évaporation**
  4. **Récolte principale**
  5. **Traitement et stockage**
- **Relations**:
  - **→ Bassins**: Utilise les bassins dans la planification
  - **→ Production**: Les productions sont liées aux campagnes
  - **→ Comptabilité**: Budget et suivi des dépenses par phase
  - **Données**: Tables `campagnes`, `campagne_phase_budgets`

#### 5. **Commercial** - `/commercial`
- **Description**: Gestion des ventes et clients
- **Onglets**:
  1. **Clients** - Liste et gestion des clients
  2. **Commandes** - Commandes en cours
  3. **Facturation** - Factures émises
  4. **Livraison** - Bons de livraison
- **Relations**:
  - **← Production**: Vend les produits de la production
  - **← Stocks**: Les ventes diminuent les stocks
  - **→ Comptabilité (Ventes)**: Les ventes sont enregistrées en comptabilité
  - **→ Rapports**: Analyses des ventes
  - **Données**: Tables `clients`, `sales`, `payments`

#### 6. **Achats** - `/achats`
- **Description**: Gestion des fournisseurs et achats
- **Onglets**:
  1. **Fournisseurs** - Liste des fournisseurs
  2. **Commandes** - Bons de commande
  3. **Inventaire** - Articles achetés
- **Relations**:
  - **→ Stocks**: Les achats alimentent les stocks
  - **→ Comptabilité (Achats)**: ✅ **LIEN ÉTABLI** - Les bons de commande s'affichent dans l'onglet Achats de la comptabilité
  - **→ Rapports**: Analyses des achats
  - **Données**: Tables `suppliers`, `purchase_orders`, `purchase_order_items`, `inventory_items`

#### 7. **Stocks** - `/stocks`
- **Description**: Gestion des stocks de sel et fournitures
- **Onglets**: Aucun
- **Relations**:
  - **← Production**: Reçoit la production
  - **← Achats**: Reçoit les achats de fournitures
  - **→ Commercial**: Les ventes diminuent les stocks
  - **Données**: Tables `inventory_items` (implicite)

#### 8. **Comptabilité** - `/comptabilite`
- **Description**: Gestion comptable et financière
- **Onglets**:
  1. **Achats** - ✅ Affiche bons de commande + transactions comptables
  2. **Salaires** - Paiements RH avec notifications
  3. **Vente** (sous-onglets: Locale / Export)
  4. **Virement interne** - Virements entre comptes
  5. **Divers** - Autres transactions
  6. **Types dépenses** - ✅ Configuration des types de dépenses (lecture seule, lien vers backoffice)
  7. **Plan comptable** - ✅ Configuration du plan comptable (lecture seule, lien vers backoffice)
  8. **Rapprochement** - Rapprochement bancaire
- **Relations**:
  - **← Commercial**: Enregistre les ventes
  - **← Achats**: ✅ **LIEN ÉTABLI** - Affiche les bons de commande récents
  - **← Équipes**: Enregistre les salaires via notifications
  - **← Campagne**: Suit les budgets de campagne
  - **→ Rapports**: Source pour les rapports financiers
  - **→ Admin (Types dépenses)**: ✅ **LIEN ÉTABLI** - Configuration des types
  - **→ Admin (Plan comptable)**: ✅ **LIEN ÉTABLI** - Configuration du plan
  - **Données**: Tables `accounts`, `transactions`, `journal_entries`, `expense_types`, `chart_of_accounts`

#### 9. **Équipes** - `/equipes`
- **Description**: Gestion du personnel et pointages
- **Onglets**:
  1. **Équipes** - Liste des équipes et membres
  2. **Pointage** - Saisie des pointages
  3. **Validation** - Validation des pointages
- **Relations**:
  - **→ Comptabilité (Salaires)**: Les pointages validés génèrent des notifications pour paiement
  - **Données**: Tables `teams`, `employees`, `daily_workers`, `team_attendance`, `accountant_notifications`

#### 10. **Congés** - `/conges`
- **Description**: Gestion des demandes de congés
- **Onglets**:
  1. **Demandes** - Liste des demandes
  2. **Nouvelle demande** - Formulaire de demande
- **Relations**:
  - **← Équipes**: Concerne les employés
  - **Données**: Table `leaves`

#### 11. **Rapports** - `/rapports`
- **Description**: Rapports et analyses
- **Onglets**:
  1. **Rapports** - Génération de rapports
  2. **Analytics** - Analyses avancées
  3. **Suivi budgétaire** - Suivi des budgets de campagne
  4. **Flux de trésorerie** - Analyse des flux
- **Relations**:
  - **← Toutes les pages**: Agrège les données de toutes les sections
  - **← Campagne**: Analyse les budgets
  - **← Comptabilité**: Analyse financière
  - **← Production**: Analyse de production
  - **← Commercial**: Analyse des ventes

#### 12. **Paramètres** - `/parametres`
- **Description**: Configuration utilisateur et tenant
- **Onglets**: Aucun (sections dans la page)
- **Relations**:
  - Gestion profil utilisateur
  - Configuration tenant
  - Notifications push
  - **Données**: Tables `profiles`, `tenants`, `push_subscriptions`

#### 13. **Gestion Utilisateurs** - `/gestion-utilisateurs`
- **Description**: Gestion des utilisateurs du tenant
- **Onglets**: Aucun
- **Relations**:
  - Gestion des rôles et permissions
  - **Données**: Tables `profiles`, `user_roles`

### Pages Admin (Backoffice)

#### 14. **Admin Dashboard** - `/admin`
- **Description**: Vue d'ensemble admin
- **Relations**: Vue sur tous les tenants

#### 15. **Admin Tenants** - `/admin/tenants`
- **Description**: Gestion des tenants
- **Relations**: Création et gestion des organisations

#### 16. **Admin Users** - `/admin/users`
- **Description**: Gestion globale des utilisateurs

#### 17. **Admin Roles** - `/admin/roles`
- **Description**: Matrice de permissions

#### 18. **Admin Types de Dépenses** - `/admin/expense-types`
- **Description**: Configuration des types de dépenses
- **Relations**: 
  - **→ Comptabilité (Types dépenses)**: ✅ **LIEN ÉTABLI** - Les types configurés s'affichent en lecture seule

#### 19. **Admin Plan Comptable** - `/admin/chart-of-accounts`
- **Description**: Configuration du plan comptable
- **Relations**: 
  - **→ Comptabilité (Plan comptable)**: ✅ **LIEN ÉTABLI** - Le plan configuré s'affiche en lecture seule

## Flux de données principaux

### Flux Production → Vente
```
Bassins → Production → Stocks → Commercial (Vente) → Comptabilité (Vente)
```

### Flux Achats → Comptabilité
```
Achats (Fournisseurs/Commandes) → Comptabilité (Achats) ✅ ÉTABLI
```

### Flux RH → Comptabilité
```
Équipes (Pointage) → Équipes (Validation) → Comptabilité (Salaires/Notifications) ✅ ÉTABLI
```

### Flux Campagne → Budget
```
Campagne (Budget phases) → Comptabilité (Suivi dépenses par phase) → Rapports (Suivi budgétaire)
```

## Incohérences et points d'amélioration identifiés

### ✅ Corrigés
1. **Achats ↔ Comptabilité**: Lien établi - les bons de commande s'affichent maintenant dans l'onglet Achats de la comptabilité
2. **Types de dépenses**: Lien établi - affichage en lecture seule dans la comptabilité avec lien vers l'admin
3. **Plan comptable**: Lien établi - affichage en lecture seule dans la comptabilité avec lien vers l'admin

### ⚠️ À vérifier/améliorer

1. **Production → Stocks**: 
   - La production devrait automatiquement mettre à jour les stocks
   - Actuellement: pas de lien automatique visible

2. **Commercial (Ventes) → Stocks**:
   - Les ventes devraient diminuer les stocks automatiquement
   - Actuellement: pas de lien automatique visible

3. **Achats (Réception) → Stocks**:
   - La réception de commandes devrait augmenter les stocks
   - Actuellement: pas de lien automatique visible

4. **Commercial (Ventes) → Comptabilité (Ventes)**:
   - Les ventes devraient générer automatiquement des écritures comptables
   - Actuellement: saisie manuelle dans les deux endroits

5. **Achats → Comptabilité (Transformation automatique)**:
   - Les bons de commande reçus pourraient générer automatiquement des transactions comptables
   - Actuellement: affichage mais pas de transformation

6. **Campagne (Budget) → Comptabilité**:
   - Les dépenses devraient être liées aux phases de campagne
   - Actuellement: lien partiel via le champ `campagne_phase` dans les transactions

7. **Cohérence des onglets Commercial**:
   - Commandes, Facturation et Livraison utilisent tous la même table `sales`
   - Pourrait être source de confusion
   - À clarifier: différence entre commande, facture et bon de livraison

## Recommandations

### Court terme
1. ✅ Établir le lien Achats → Comptabilité (FAIT)
2. ✅ Afficher les types de dépenses et plan comptable dans Comptabilité (FAIT)
3. Ajouter des indicateurs visuels pour les données non synchronisées
4. Créer des liens directs entre pages liées (boutons de navigation)

### Moyen terme
1. Automatiser Production → Stocks
2. Automatiser Commercial → Stocks
3. Automatiser Achats (Réception) → Stocks
4. Générer automatiquement les écritures comptables depuis les ventes
5. Intégrer les bons de commande validés dans la comptabilité

### Long terme
1. Tableau de bord de cohérence des données
2. Alertes sur les incohérences (ex: vente sans stock)
3. Audit trail complet entre toutes les opérations
4. Workflow d'approbation inter-modules

## Tables de la base de données par module

### Production
- `bassins`
- `production_records`
- `quality_tests`
- `quality_certificates`

### Commercial
- `clients`
- `sales`
- `payments`

### Achats
- `suppliers`
- `purchase_orders`
- `purchase_order_items`

### Stocks
- `inventory_items`

### Comptabilité
- `accounts`
- `transactions`
- `journal_entries`
- `expense_types`
- `chart_of_accounts`

### RH
- `employees`
- `daily_workers`
- `teams`
- `team_attendance`
- `leaves`
- `payroll_payments`
- `accountant_notifications`

### Campagne
- `campagnes`
- `campagne_phase_budgets`

### Configuration
- `tenants`
- `profiles`
- `user_roles`
- `push_subscriptions`
- `notification_history`
