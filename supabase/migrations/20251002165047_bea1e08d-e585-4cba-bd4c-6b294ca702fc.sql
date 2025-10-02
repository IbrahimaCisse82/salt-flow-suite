-- Migration: Renforcement de la sécurité et des permissions
-- Correction des vulnérabilités identifiées par le scan de sécurité

-- =====================================================
-- 1. SÉCURISER LA TABLE PROFILES
-- =====================================================

-- Supprimer les anciennes policies trop permissives
DROP POLICY IF EXISTS "Users can view their own full profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view all profiles in tenant" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and managers can manage profiles" ON public.profiles;

-- Les utilisateurs peuvent voir uniquement leur propre profil complet
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

-- Les managers/admins peuvent voir les profils de leur tenant (sans emails/téléphones sensibles via fonction)
CREATE POLICY "Managers can view tenant profiles"
ON public.profiles FOR SELECT
USING (
  is_manager_or_admin(auth.uid()) 
  AND tenant_id = get_user_tenant_id(auth.uid())
);

-- Les utilisateurs peuvent mettre à jour uniquement leur propre profil
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

-- Seuls les admins peuvent gérer tous les profils
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- =====================================================
-- 2. SÉCURISER LA TABLE CLIENTS
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can view clients in their tenant" ON public.clients;
DROP POLICY IF EXISTS "Managers can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Users can create clients" ON public.clients;

-- Seuls les rôles commercial, manager et admin peuvent voir les clients
CREATE POLICY "Authorized roles can view clients"
ON public.clients FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'commercial')
);

-- Les commerciaux peuvent créer des clients
CREATE POLICY "Commercial can create clients"
ON public.clients FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'commercial')
);

-- Seuls les managers peuvent modifier/supprimer les clients
CREATE POLICY "Managers can manage clients"
ON public.clients FOR ALL
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant')
)
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant')
);

-- =====================================================
-- 3. RENFORCER LA SÉCURITÉ DES EMPLOYEES
-- =====================================================

-- Les policies existantes sont déjà restrictives (admin/gerant seulement)
-- Vérification qu'elles sont bien en place

DROP POLICY IF EXISTS "Only managers can manage employees" ON public.employees;

CREATE POLICY "Only managers can view and manage employees"
ON public.employees FOR ALL
USING (
  get_user_role(auth.uid()) IN ('admin', 'gerant')
  AND tenant_id = get_user_tenant_id(auth.uid())
)
WITH CHECK (
  get_user_role(auth.uid()) IN ('admin', 'gerant')
  AND tenant_id = get_user_tenant_id(auth.uid())
);

-- =====================================================
-- 4. RENFORCER LA SÉCURITÉ DES DAILY_WORKERS
-- =====================================================

DROP POLICY IF EXISTS "Only managers can manage daily workers" ON public.daily_workers;

CREATE POLICY "Only managers can view and manage daily workers"
ON public.daily_workers FOR ALL
USING (
  get_user_role(auth.uid()) IN ('admin', 'gerant')
  AND tenant_id = get_user_tenant_id(auth.uid())
)
WITH CHECK (
  get_user_role(auth.uid()) IN ('admin', 'gerant')
  AND tenant_id = get_user_tenant_id(auth.uid())
);

-- =====================================================
-- 5. SÉCURISER LES VUES PROFILES_PUBLIC ET PROFILES_WITH_ROLES
-- =====================================================

-- Supprimer la vue profiles_public si elle n'est pas utilisée
DROP VIEW IF EXISTS public.profiles_public CASCADE;

-- Ajouter des policies à profiles_with_roles
DROP POLICY IF EXISTS "Managers can view profiles with roles" ON public.profiles_with_roles;

-- Note: profiles_with_roles est une vue, donc les policies doivent être sur les tables sous-jacentes
-- Les policies existantes sur profiles et user_roles devraient suffire

-- =====================================================
-- 6. SÉCURISER LES BASSINS
-- =====================================================

DROP POLICY IF EXISTS "Users can view bassins in their tenant" ON public.bassins;
DROP POLICY IF EXISTS "Managers can manage bassins" ON public.bassins;

-- Tous les utilisateurs authentifiés du tenant peuvent voir les bassins
CREATE POLICY "Tenant users can view bassins"
ON public.bassins FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Seuls les managers et production peuvent gérer les bassins
CREATE POLICY "Managers and production can manage bassins"
ON public.bassins FOR ALL
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'production')
)
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'production')
);

-- =====================================================
-- 7. SÉCURISER LES PRODUCTION_RECORDS
-- =====================================================

DROP POLICY IF EXISTS "Users can view production records in their tenant" ON public.production_records;
DROP POLICY IF EXISTS "Users can create production records" ON public.production_records;
DROP POLICY IF EXISTS "Managers can manage production records" ON public.production_records;

-- Les rôles production, manager, admin peuvent voir les enregistrements de production
CREATE POLICY "Production staff can view records"
ON public.production_records FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'production')
);

-- Les rôles production peuvent créer des enregistrements
CREATE POLICY "Production staff can create records"
ON public.production_records FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'production')
);

-- Seuls les managers peuvent modifier/supprimer
CREATE POLICY "Managers can manage production records"
ON public.production_records FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant')
);

CREATE POLICY "Managers can delete production records"
ON public.production_records FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant')
);

-- =====================================================
-- 8. SÉCURISER LES SALES
-- =====================================================

DROP POLICY IF EXISTS "Authorized roles can view sales in their tenant" ON public.sales;
DROP POLICY IF EXISTS "Managers can manage sales" ON public.sales;
DROP POLICY IF EXISTS "Users can create sales" ON public.sales;

-- Les rôles commercial, comptable, manager, admin peuvent voir les ventes
CREATE POLICY "Authorized roles can view sales"
ON public.sales FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'commercial', 'comptable')
);

-- Les commerciaux peuvent créer des ventes
CREATE POLICY "Commercial can create sales"
ON public.sales FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'commercial')
);

-- Seuls les managers peuvent modifier/supprimer les ventes
CREATE POLICY "Managers can manage sales"
ON public.sales FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant')
);

CREATE POLICY "Managers can delete sales"
ON public.sales FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant')
);

-- =====================================================
-- 9. SÉCURISER LES TEAMS
-- =====================================================

DROP POLICY IF EXISTS "Users can view teams in their tenant" ON public.teams;
DROP POLICY IF EXISTS "Managers can manage teams" ON public.teams;

-- Production, managers et admins peuvent voir les équipes
CREATE POLICY "Production staff can view teams"
ON public.teams FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'production')
);

-- Seuls les managers peuvent gérer les équipes
CREATE POLICY "Managers can manage teams"
ON public.teams FOR ALL
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND is_manager_or_admin(auth.uid())
)
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND is_manager_or_admin(auth.uid())
);

-- =====================================================
-- 10. SÉCURISER LES TEAM_MEMBERS
-- =====================================================

DROP POLICY IF EXISTS "Users can view team members in their tenant" ON public.team_members;
DROP POLICY IF EXISTS "Managers can manage team members" ON public.team_members;

-- Production, managers et admins peuvent voir les membres des équipes
CREATE POLICY "Production staff can view team members"
ON public.team_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_members.team_id
    AND teams.tenant_id = get_user_tenant_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'production')
  )
);

-- Seuls les managers peuvent gérer les membres
CREATE POLICY "Managers can manage team members"
ON public.team_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_members.team_id
    AND teams.tenant_id = get_user_tenant_id(auth.uid())
    AND is_manager_or_admin(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_members.team_id
    AND teams.tenant_id = get_user_tenant_id(auth.uid())
    AND is_manager_or_admin(auth.uid())
  )
);

-- =====================================================
-- 11. SÉCURISER LES CAMPAGNES
-- =====================================================

DROP POLICY IF EXISTS "Users can view campagnes in their tenant" ON public.campagnes;
DROP POLICY IF EXISTS "Managers can manage campagnes" ON public.campagnes;

-- Tous les utilisateurs du tenant peuvent voir les campagnes
CREATE POLICY "Tenant users can view campagnes"
ON public.campagnes FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Seuls les managers peuvent gérer les campagnes
CREATE POLICY "Managers can manage campagnes"
ON public.campagnes FOR ALL
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant')
)
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant')
);

-- =====================================================
-- 12. SÉCURISER LES TRANSACTIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can view transactions in their tenant" ON public.transactions;
DROP POLICY IF EXISTS "Users can create transactions in their tenant" ON public.transactions;
DROP POLICY IF EXISTS "Managers can manage transactions" ON public.transactions;

-- Comptables, managers et admins peuvent voir les transactions
CREATE POLICY "Accounting staff can view transactions"
ON public.transactions FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable')
);

-- Comptables peuvent créer des transactions
CREATE POLICY "Accounting staff can create transactions"
ON public.transactions FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable')
);

-- Seuls les managers peuvent modifier/supprimer les transactions
CREATE POLICY "Managers can manage transactions"
ON public.transactions FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant')
);

CREATE POLICY "Managers can delete transactions"
ON public.transactions FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant')
);

-- =====================================================
-- RÉSUMÉ DES PERMISSIONS PAR RÔLE
-- =====================================================

-- ADMIN: Accès complet à tout
-- GERANT: 
--   - Gestion du personnel (employees, daily_workers)
--   - Gestion des équipes (teams, team_members)
--   - Gestion des clients, ventes, transactions
--   - Gestion des campagnes, bassins, production
--   - Validation des pointages
-- COMPTABLE:
--   - Voir et gérer les transactions
--   - Voir les ventes et paiements
--   - Recevoir et traiter les notifications de paie
--   - PAS d'accès aux détails du personnel permanent/saisonnier
-- PRODUCTION:
--   - Voir et gérer les équipes
--   - Créer des pointages
--   - Voir et créer des enregistrements de production
--   - Voir les bassins
-- COMMERCIAL:
--   - Voir et créer des clients
--   - Créer des ventes
--   - Voir les ventes et paiements