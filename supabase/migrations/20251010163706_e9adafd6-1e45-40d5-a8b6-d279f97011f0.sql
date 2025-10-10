-- Mise à jour du rôle de l'utilisateur support@g-suiteapp.com vers gerant
UPDATE public.user_roles 
SET role = 'gerant'
WHERE user_id = 'fd4f5d37-02ed-46f5-8802-331e28cd16be' 
AND role = 'production';