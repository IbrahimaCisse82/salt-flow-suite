-- Ajouter les champs manquants à la table tenants
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS manager_name text,
ADD COLUMN IF NOT EXISTS ninea text,
ADD COLUMN IF NOT EXISTS rccm text;