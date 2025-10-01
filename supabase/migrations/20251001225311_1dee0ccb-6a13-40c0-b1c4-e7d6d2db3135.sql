-- Créer le profil admin pour l'utilisateur existant
INSERT INTO public.profiles (id, email, full_name, role, tenant_id)
VALUES (
  'a51efd70-5b24-4b31-929d-a636a36fecb0'::uuid,
  'admin@g-suiteapp.com',
  'Administrateur',
  'admin',
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;