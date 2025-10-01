-- Créer un tenant spécial pour les administrateurs système
INSERT INTO tenants (id, name, subdomain, contact_email, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Administration Système',
  'admin',
  'admin@g-suiteapp.com',
  true
)
ON CONFLICT (id) DO NOTHING;