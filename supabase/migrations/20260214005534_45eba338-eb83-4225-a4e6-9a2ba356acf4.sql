
-- Manually clean up and delete the user d83dcddd-ef35-4640-a2dc-234523ed5a81
DELETE FROM public.security_audit_log WHERE user_id = 'd83dcddd-ef35-4640-a2dc-234523ed5a81' OR changed_by = 'd83dcddd-ef35-4640-a2dc-234523ed5a81';
DELETE FROM public.user_roles WHERE user_id = 'd83dcddd-ef35-4640-a2dc-234523ed5a81';
DELETE FROM public.profiles WHERE id = 'd83dcddd-ef35-4640-a2dc-234523ed5a81';
DELETE FROM auth.users WHERE id = 'd83dcddd-ef35-4640-a2dc-234523ed5a81';
