-- Supprimer l'ancien type user_role et en créer un nouveau avec les bons rôles
ALTER TABLE public.profiles ALTER COLUMN role TYPE text;

DROP TYPE IF EXISTS public.user_role CASCADE;

CREATE TYPE public.user_role AS ENUM ('gerant', 'commercial', 'production', 'comptable');

ALTER TABLE public.profiles ALTER COLUMN role TYPE user_role USING role::user_role;

-- Mettre à jour la valeur par défaut
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'production'::user_role;

-- Commentaire pour documenter les rôles
COMMENT ON TYPE public.user_role IS 'Rôles disponibles: gerant (accès complet), commercial (ventes/clients), production (bassins/récoltes), comptable (finances)';
