-- ============================================================================
-- Lot B (partiel) — corrections issues de la recette utilisateur 360 (2026-11-26)
-- DEJA APPLIQUE en production via l'éditeur SQL (projet Lovable a879894c…).
-- Ce fichier sert de trace versionnée ; toutes les instructions sont rejouables.
-- ============================================================================

-- 1) inventory_items : colonnes alias générées que le front écrit ----------------
alter table public.inventory_items alter column item_category drop expression;
alter table public.inventory_items alter column quantity_on_hand drop expression;
alter table public.inventory_items alter column item_name drop expression;

create or replace function public.sync_inventory_aliases() returns trigger language plpgsql as $$
begin
  NEW.unit_cost := coalesce(NEW.unit_cost,0);
  NEW.cmp := coalesce(NEW.cmp,0);
  NEW.reorder_level := coalesce(NEW.reorder_level,0);
  NEW.reserved_quantity := coalesce(NEW.reserved_quantity,0);
  NEW.last_purchase_price := coalesce(NEW.last_purchase_price,0);
  NEW.unit_of_measure := coalesce(NEW.unit_of_measure,'unité');
  NEW.accounting_category := coalesce(NEW.accounting_category,'produit_fini');
  if TG_OP='INSERT' then
    NEW.name := coalesce(nullif(NEW.name,''), nullif(NEW.item_name,''), '');
    NEW.item_name := NEW.name;
    NEW.category := coalesce(NEW.category, NEW.item_category);
    NEW.item_category := NEW.category;
    if coalesce(NEW.quantity,0)=0 and coalesce(NEW.quantity_on_hand,0)<>0 then NEW.quantity := NEW.quantity_on_hand; end if;
    NEW.quantity := coalesce(NEW.quantity,0);
    NEW.quantity_on_hand := NEW.quantity;
  else
    if NEW.name is distinct from OLD.name then NEW.item_name := NEW.name;
    elsif NEW.item_name is distinct from OLD.item_name then NEW.name := coalesce(NEW.item_name,''); end if;
    if NEW.category is distinct from OLD.category then NEW.item_category := NEW.category;
    elsif NEW.item_category is distinct from OLD.item_category then NEW.category := NEW.item_category; end if;
    if NEW.quantity is distinct from OLD.quantity then NEW.quantity_on_hand := NEW.quantity;
    elsif NEW.quantity_on_hand is distinct from OLD.quantity_on_hand then NEW.quantity := coalesce(NEW.quantity_on_hand,0); end if;
  end if;
  return NEW;
end $$;
drop trigger if exists a_sync_item_category on public.inventory_items;
drop trigger if exists a_sync_inventory_aliases on public.inventory_items;
create trigger a_sync_inventory_aliases before insert or update on public.inventory_items
  for each row execute function public.sync_inventory_aliases();

-- 2) purchase_order_items : alias générés (item_description, notes) ---------------
alter table public.purchase_order_items alter column item_description drop expression;
alter table public.purchase_order_items alter column notes drop expression;
create or replace function public.sync_poi_aliases() returns trigger language plpgsql as $$
begin
  if TG_OP='INSERT' then
    NEW.description := coalesce(NEW.description, NEW.item_description, NEW.item_name);
    NEW.item_description := NEW.description;
    NEW.received_notes := coalesce(NEW.received_notes, NEW.notes);
    NEW.notes := NEW.received_notes;
    NEW.total_price := coalesce(nullif(NEW.total_price,0), coalesce(NEW.quantity,0)*coalesce(NEW.unit_price,0));
  else
    if NEW.description is distinct from OLD.description then NEW.item_description := NEW.description;
    elsif NEW.item_description is distinct from OLD.item_description then NEW.description := NEW.item_description; end if;
    if NEW.received_notes is distinct from OLD.received_notes then NEW.notes := NEW.received_notes;
    elsif NEW.notes is distinct from OLD.notes then NEW.received_notes := NEW.notes; end if;
  end if;
  return NEW;
end $$;
drop trigger if exists a_sync_poi_aliases on public.purchase_order_items;
create trigger a_sync_poi_aliases before insert or update on public.purchase_order_items
  for each row execute function public.sync_poi_aliases();

-- 3) purchase_orders : colonnes écrites par le formulaire d'achat -----------------
alter table public.purchase_orders
  add column if not exists purchase_type text not null default 'charge',
  add column if not exists charge_account_number text,
  add column if not exists payment_mode text not null default 'credit',
  add column if not exists commissioning_date date,
  add column if not exists useful_life_years integer default 5,
  add column if not exists depreciation_method text default 'lineaire',
  add column if not exists invoice_number text;

-- 4) Paiements fournisseurs : mise à jour du PO et de la trésorerie ----------------
create or replace function public.trg_apply_purchase_payment() returns trigger
language plpgsql security definer set search_path=public as $$
declare _sign int := case when NEW.payment_type::text='refund' then -1 else 1 end;
begin
  update public.purchase_orders set
    total_paid = greatest(0, coalesce(total_paid,0) + _sign*NEW.amount),
    status = (case
      when status::text in ('approved','partially_paid','paid') and greatest(0, coalesce(total_paid,0) + _sign*NEW.amount) >= coalesce(total_amount,0) and coalesce(total_amount,0) > 0 then 'paid'
      when status::text in ('approved','partially_paid','paid') and greatest(0, coalesce(total_paid,0) + _sign*NEW.amount) > 0 then 'partially_paid'
      else status::text end)::po_status,
    updated_at = now()
  where id = NEW.purchase_order_id;
  if NEW.account_id is not null then
    update public.accounts set current_balance = coalesce(current_balance,0) - _sign*NEW.amount, updated_at = now() where id = NEW.account_id;
  end if;
  return NEW;
end $$;
drop trigger if exists trg_apply_purchase_payment on public.purchase_payments;
create trigger trg_apply_purchase_payment after insert on public.purchase_payments
  for each row execute function public.trg_apply_purchase_payment();

-- 5) Fournisseurs : le front envoie goods / service / equipment ---------------------
alter type public.supplier_type add value if not exists 'goods';
alter type public.supplier_type add value if not exists 'service';
alter type public.supplier_type add value if not exists 'equipment';

-- 6) Types de dépense par défaut (aucun écran de création dans l'application) -------
create or replace function public.seed_default_expense_types(_tenant uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
  insert into public.expense_types (tenant_id, name, description, account_number, account_id, syscohada_category)
  select _tenant, v.name, v.descr, v.num,
         (select c.id from public.chart_of_accounts c where c.tenant_id=_tenant and c.account_number=v.num limit 1), 'charge'
  from (values
    ('Matériel et petit outillage','Outils, équipements de saline','6051'),
    ('Emballages et sacs','Sacs, big bags, consommables d''emballage','6021'),
    ('Carburant et énergie','Gasoil, électricité, pompage','6051'),
    ('Transport et manutention','Transport de sel, chargement, déchargement','611'),
    ('Entretien et réparations','Digues, pompes, bâtiments','621'),
    ('Prestations de services','Sous-traitance, services extérieurs','6041'),
    ('Achats de marchandises','Marchandises destinées à la revente','6011')
  ) as v(name, descr, num)
  where not exists (select 1 from public.expense_types e where e.tenant_id=_tenant and e.name=v.name and e.deleted_at is null);
end $$;
create or replace function public.trg_seed_expense_types() returns trigger
language plpgsql security definer set search_path=public as $$
begin perform public.seed_default_expense_types(NEW.id); return NEW; end $$;
drop trigger if exists trg_tenants_seed_expense_types on public.tenants;
create trigger trg_tenants_seed_expense_types after insert on public.tenants
  for each row execute function public.trg_seed_expense_types();
select public.seed_default_expense_types(id) from public.tenants;

-- 7) Bassins : le formulaire enregistre 'active', les listes filtrent 'actif' -------
create or replace function public.normalize_bassin_status() returns trigger language plpgsql as $$
begin if NEW.status::text='active' then NEW.status := 'actif'; end if; return NEW; end $$;
drop trigger if exists a_normalize_bassin_status on public.bassins;
create trigger a_normalize_bassin_status before insert or update of status on public.bassins
  for each row execute function public.normalize_bassin_status();

-- 8) Encaissement : une facture soldée devient livrable ----------------------------
do $$ declare d text; d0 text; begin
  d := pg_get_functiondef('public.record_sale_payment'::regproc); d0 := d;
  d := replace(d, 'can_be_delivered = COALESCE(p_can_be_delivered, can_be_delivered)',
    'can_be_delivered = CASE WHEN _paid >= COALESCE(total_amount,0) - _credited THEN true ELSE COALESCE(p_can_be_delivered, can_be_delivered) END');
  if d = d0 and position('CASE WHEN _paid >= COALESCE(total_amount,0) - _credited THEN true' in d)=0 then
    raise exception 'record_sale_payment: patch non appliqué'; end if;
  execute d;
end $$;

-- 9) Comptabilité manuelle : trésorerie réelle, virement interne, solde initial -----
do $$ declare d text; d0 text; begin
  d := pg_get_functiondef('public.trg_acc_manual_transaction'::regproc);
  if position('virement_interne_legacy' in d)=0 then
    d0 := d;
    d := replace(d, '_cash := ''521'';', '_cash := COALESCE(public.treasury_account_for(NEW.account_id, NULL), ''521'');');
    if d = d0 then raise exception 'patch1 no-op'; end if; d0 := d;
    d := replace(d, 'IF NEW.transaction_type = ''virement_interne'' THEN',
      'IF NEW.transaction_type = ''virement_interne'' THEN RETURN NEW; ELSIF NEW.transaction_type = ''virement_interne_legacy'' THEN');
    if d = d0 then raise exception 'patch2 no-op'; end if; d0 := d;
    d := replace(d, '''account'',''758'',''label'',''Produits divers''',
      '''account'',CASE WHEN COALESCE(NEW.description,'''') ILIKE ''Solde initial%'' THEN ''121'' ELSE ''758'' END,''label'',CASE WHEN COALESCE(NEW.description,'''') ILIKE ''Solde initial%'' THEN ''Report à nouveau créditeur'' ELSE ''Produits divers'' END');
    if d = d0 then raise exception 'patch3 no-op'; end if;
    execute d;
  end if;
end $$;

-- Le virement interne du front insère ses lignes de journal sans account_id :
-- on résout le compte comptable (via accounts.chart_account_id) avant l'insertion.
create or replace function public.je_resolve_account() returns trigger
language plpgsql security definer set search_path=public as $$
declare _t uuid; _acc public.accounts%rowtype; _coa public.chart_of_accounts%rowtype; _num text;
begin
  if NEW.account_id is not null then return NEW; end if;
  _t := coalesce(NEW.tenant_id, public.get_user_tenant_id(auth.uid()));
  select * into _acc from public.accounts a
   where a.tenant_id=_t and a.deleted_at is null
     and ((NEW.account_name is not null and a.account_name=NEW.account_name)
       or (NEW.account_name is null and NEW.account_number is not null and a.account_number=NEW.account_number))
   limit 1;
  if found then _num := public.treasury_account_for(_acc.id, null); else _num := NEW.account_number; end if;
  select * into _coa from public.chart_of_accounts c where c.tenant_id=_t and c.account_number=_num limit 1;
  if _coa.id is null then
    raise exception 'Compte comptable introuvable pour la ligne (%)', coalesce(NEW.account_name,NEW.account_number,'?');
  end if;
  NEW.tenant_id:=_t; NEW.account_id:=_coa.id; NEW.account_number:=_coa.account_number; NEW.account_name:=_coa.account_name;
  return NEW;
end $$;
drop trigger if exists a_je_resolve_account on public.journal_entries;
create trigger a_je_resolve_account before insert on public.journal_entries
  for each row execute function public.je_resolve_account();

notify pgrst, 'reload schema';
