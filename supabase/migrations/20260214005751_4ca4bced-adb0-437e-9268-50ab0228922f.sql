-- Fix the role for the newly created user
UPDATE public.user_roles 
SET role = 'gerant'::app_role 
WHERE user_id = '83a22664-30d2-4eff-aa72-047a968e05b4';
