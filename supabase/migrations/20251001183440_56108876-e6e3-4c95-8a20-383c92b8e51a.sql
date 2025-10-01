-- Ensure trigger to create profile on new user exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Backfill missing profiles for users that have a tenant_id in metadata or are admins
INSERT INTO public.profiles (id, tenant_id, email, full_name, role)
SELECT 
  u.id,
  COALESCE(
    NULLIF(u.raw_user_meta_data->>'tenant_id','')::uuid,
    CASE WHEN (u.raw_user_meta_data->>'role') = 'admin' THEN '00000000-0000-0000-0000-000000000001'::uuid ELSE NULL END
  ) as tenant_id,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  COALESCE((u.raw_user_meta_data->>'role')::public.user_role, 'production'::public.user_role) as role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
  AND (
    NULLIF(u.raw_user_meta_data->>'tenant_id','') IS NOT NULL
    OR (u.raw_user_meta_data->>'role') = 'admin'
  );