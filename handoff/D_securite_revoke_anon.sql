-- D (APPLIQUÉ en production le 2026-11-26) : durcissement sécurité
do $$ declare f record; begin
for f in select p.oid::regprocedure as sig from pg_proc p where p.pronamespace='public'::regnamespace and p.prosecdef loop
 execute format('revoke execute on function %s from anon, public', f.sig);
 execute format('grant execute on function %s to authenticated, service_role', f.sig);
end loop;
revoke execute on function public.seed_default_expense_types(uuid) from authenticated;
alter default privileges in schema public revoke execute on functions from anon, public;
end $$;
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

-- D2 (APPLIQUÉ) : next_document_number_at vérifie l'appartenance au tenant
-- (insertion après le test p_tenant_id IS NULL) :
-- IF auth.uid() IS NOT NULL AND NOT (public.has_role(auth.uid(),'admin'::app_role)
--    OR public.is_tenant_member(auth.uid(), p_tenant_id)) THEN
--   RAISE EXCEPTION 'Accès refusé à cette entreprise' USING ERRCODE='42501'; END IF;
