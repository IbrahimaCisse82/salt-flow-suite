REVOKE ALL ON FUNCTION public.allocate_result(uuid,date,numeric,numeric,numeric,numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.close_fiscal_year(uuid,date,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.generate_opening_balances(uuid,date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.generate_balance_sheet(uuid,date,date,uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.generate_income_statement(uuid,date,date,uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.generate_tafire(uuid,date,date,uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.allocate_result(uuid,date,numeric,numeric,numeric,numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.close_fiscal_year(uuid,date,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_opening_balances(uuid,date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_balance_sheet(uuid,date,date,uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_income_statement(uuid,date,date,uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_tafire(uuid,date,date,uuid) TO authenticated, service_role;