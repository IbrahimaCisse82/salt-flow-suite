-- Promouvoir le compte en admin et le rattacher au tenant d'administration
UPDATE profiles 
SET 
  role = 'admin',
  tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE email = 'admin@g-suiteapp.com';