-- Corriger le rôle de l'utilisateur Ibou Cisse pour qu'il soit gérant
UPDATE public.user_roles
SET role = 'gerant'
WHERE user_id = 'd83dcddd-ef35-4640-a2dc-234523ed5a81';