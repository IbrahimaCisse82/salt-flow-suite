# Système de Permissions - G-Suite Sel

## Vue d'ensemble

Ce document détaille les permissions d'accès aux données selon les rôles utilisateurs dans l'application.

## Rôles et Permissions

### 🔴 ADMIN (Administrateur Système)
**Accès complet à toutes les fonctionnalités**

- ✅ Gestion complète de tous les utilisateurs et rôles
- ✅ Configuration de l'entreprise (tenant)
- ✅ Accès à toutes les données sensibles
- ✅ Toutes les permissions des autres rôles

---

### 🟢 GERANT (Gérant/Manager)
**Gestion opérationnelle complète**

#### Personnel
- ✅ **Voir et gérer** le personnel permanent (employees type: permanent)
- ✅ **Voir et gérer** le personnel saisonnier (employees type: saisonnier)
- ✅ **Voir et gérer** les travailleurs journaliers (daily_workers)
- ✅ Accès aux informations sensibles : salaires, contacts

#### Équipes
- ✅ **Voir et gérer** toutes les équipes (teams)
- ✅ **Voir et gérer** les membres des équipes (team_members)
- ✅ **Valider** les pointages d'équipe

#### Commercial
- ✅ **Voir et gérer** les clients (clients)
- ✅ **Voir et gérer** les ventes (sales)
- ✅ **Voir et gérer** les paiements (payments)

#### Production
- ✅ **Voir et gérer** les bassins (bassins)
- ✅ **Voir et gérer** les campagnes (campagnes)
- ✅ **Voir et gérer** les enregistrements de production (production_records)

#### Comptabilité
- ✅ **Voir et gérer** les transactions (transactions)
- ✅ **Voir et gérer** le plan comptable (chart_of_accounts)
- ✅ **Voir et gérer** les comptes (accounts)

---

### 🔵 COMPTABLE (Accountant)
**Gestion financière et paie**

#### Comptabilité
- ✅ **Voir et créer** les transactions financières
- ✅ **Voir** le plan comptable
- ✅ **Voir** les comptes

#### Paie
- ✅ **Recevoir** les notifications de pointages validés
- ✅ **Créer** les paiements de salaire (payroll_payments)
- ✅ **Voir** les pointages validés pour paiement

#### Ventes
- ✅ **Voir** les ventes et paiements clients

#### Restrictions
- ❌ **PAS d'accès** aux détails du personnel permanent/saisonnier
- ❌ **PAS d'accès** aux salaires individuels
- ❌ **Ne peut pas** gérer les équipes

---

### 🟡 PRODUCTION (Chef de Production)
**Gestion terrain et pointages**

#### Équipes
- ✅ **Voir** toutes les équipes de terrain
- ✅ **Voir** les membres des équipes
- ✅ **Créer** des pointages (team_attendance)

#### Production
- ✅ **Voir et créer** les enregistrements de production
- ✅ **Voir** les bassins
- ✅ **Voir** les campagnes

#### Restrictions
- ❌ **Ne peut pas** gérer le personnel permanent/saisonnier
- ❌ **Ne peut pas** créer ou modifier les équipes
- ❌ **Ne peut pas** valider les pointages (seuls les gérants peuvent)
- ❌ **PAS d'accès** aux données financières
- ❌ **PAS d'accès** aux clients

---

### 🟠 COMMERCIAL (Agent Commercial)
**Gestion clientèle et ventes**

#### Clients
- ✅ **Voir et créer** les clients
- ✅ Accès aux informations de contact des clients

#### Ventes
- ✅ **Créer** des ventes
- ✅ **Voir** toutes les ventes
- ✅ **Voir** les paiements

#### Restrictions
- ❌ **Ne peut pas** modifier ou supprimer les clients (seuls les gérants)
- ❌ **Ne peut pas** modifier ou supprimer les ventes (seuls les gérants)
- ❌ **PAS d'accès** au personnel
- ❌ **PAS d'accès** aux équipes
- ❌ **PAS d'accès** à la comptabilité
- ❌ **PAS d'accès** à la production

---

## Flux de Travail : Système de Pointage et Paie

### 1. Création du Pointage
**Rôle: PRODUCTION**
- Le chef de production crée un pointage pour une équipe
- Statut: `pending`

### 2. Validation du Pointage
**Rôle: GERANT**
- Le gérant valide le pointage
- Statut: `validated`
- ⚡ **Automatique**: Une notification est créée pour le comptable

### 3. Notification Comptable
**Rôle: COMPTABLE**
- Le comptable reçoit une notification avec le montant à payer
- Visible dans son tableau de bord

### 4. Paiement
**Rôle: COMPTABLE**
- Le comptable enregistre le paiement
- Renseigne: montant payé, bénéficiaire, compte de trésorerie
- Statut du pointage: `paid`
- ⚡ **Automatique**: Le reliquat est calculé si paiement partiel

---

## Données Sensibles Protégées

### 🔒 Informations Personnelles
- Emails et téléphones des utilisateurs (profiles)
- Contacts du personnel (employees, daily_workers)
- Informations clients (clients)

**Accès**: Limité aux managers et admins

### 💰 Informations Financières
- Salaires des employés
- Taux journaliers
- Transactions financières
- Paiements

**Accès**: Gérants, comptables (selon le type de données)

### 📋 Informations Entreprise
- RCCM, NINEA (tenants)
- Coordonnées bancaires
- Plan comptable

**Accès**: Gérants, comptables, admins

---

## Isolation des Données (Multi-tenant)

Chaque entreprise (tenant) a ses propres données isolées :
- Un utilisateur ne peut voir que les données de son entreprise
- Les requêtes sont automatiquement filtrées par `tenant_id`
- Aucun accès cross-tenant possible

---

## Audit et Sécurité

### Traçabilité
- Tous les changements de rôles sont enregistrés (security_audit_log)
- Les validations de pointages sont tracées (validated_by, validated_at)
- Les paiements enregistrent le créateur (processed_by)

### Prévention des Escalades de Privilèges
- Seuls les admins peuvent assigner les rôles `admin` et `gerant`
- Les fonctions de vérification de rôles utilisent `SECURITY DEFINER`
- Les policies RLS empêchent les accès non autorisés au niveau base de données

---

## Bonnes Pratiques

### Pour les Gérants
1. Vérifiez régulièrement les pointages en attente
2. Validez rapidement pour que les comptables puissent traiter les paiements
3. Surveillez les statistiques du personnel sur le tableau de bord

### Pour les Comptables
1. Consultez le widget de notifications sur votre tableau de bord
2. Traitez les paiements dans l'onglet "Salaires"
3. Vérifiez les reliquats éventuels

### Pour la Production
1. Créez les pointages quotidiennement
2. Ajoutez des notes pour clarifier les heures travaillées
3. Vérifiez que les taux journaliers sont corrects

### Pour les Commerciaux
1. Maintenez les informations clients à jour
2. Enregistrez les ventes au fur et à mesure
3. Suivez les paiements clients

---

## Migration et Mises à Jour

Date de dernière mise à jour: 2025-10-02
Version: 1.0

### Changements Récents
- Renforcement des RLS policies pour tous les rôles
- Restriction d'accès du comptable au personnel permanent/saisonnier
- Ajout du système de pointage et notifications
- Sécurisation des données sensibles (emails, téléphones, salaires)
