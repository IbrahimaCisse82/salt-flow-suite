\set ON_ERROR_STOP 1
CREATE OR REPLACE FUNCTION pg_temp.as_user(n int) RETURNS void LANGUAGE sql AS $$ SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000'||n,false) $$;
CREATE OR REPLACE FUNCTION pg_temp.bal(acc text, src uuid DEFAULT NULL) RETURNS numeric LANGUAGE sql AS $$
  SELECT COALESCE(SUM(debit-credit),0) FROM journal_entries je WHERE account_number=acc AND tenant_id='00000000-0000-0000-0000-0000000000a1' $$;
CREATE OR REPLACE FUNCTION pg_temp.expect_error(sql text, pattern text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN EXECUTE sql; EXCEPTION WHEN OTHERS THEN
    IF SQLERRM ILIKE '%'||pattern||'%' THEN RAISE NOTICE 'OK attendu : %', SQLERRM; RETURN; END IF;
    RAISE EXCEPTION 'Mauvaise erreur pour [%] : %', sql, SQLERRM; END;
  RAISE EXCEPTION 'Aucune erreur alors qu''attendue pour [%]', sql;
END $$;

-- Ligne historique désynchronisée (comme en production) avant migration
SELECT pg_temp.as_user(1);
INSERT INTO sales (id,tenant_id,client_id,sale_number,total_amount,amount_ht,tva_amount,status,sale_status) VALUES
 ('00000000-0000-0000-0000-0000000000f9','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000c001','LEGACY',118,100,18,'invoiced','draft');
CREATE TEMP TABLE avant AS SELECT count(*) n FROM journal_entries;
\i ../../drizzle/migrations/0002_reparation_cycle_vente.sql
DO $$ BEGIN
  ASSERT (SELECT sale_status::text FROM sales WHERE sale_number='LEGACY')='invoiced', 'T6 backfill sale_status';
  ASSERT (SELECT count(*) FROM journal_entries) = (SELECT n FROM avant), 'T6 aucune écriture rejouée par le réalignement';
  RAISE NOTICE 'T6 OK réalignement historique';
END $$;
-- rejouable
\i ../../drizzle/migrations/0002_reparation_cycle_vente.sql

-- ===== T1 : cycle local complet, tel que les écrans l'exécutent =====
SELECT pg_temp.as_user(3); -- commercial crée et valide
INSERT INTO sales (id,tenant_id,client_id,sale_number,quantity,unit_price,total_amount,amount_ht,tva_rate,tva_amount,payment_status,salt_type,warehouse_id,sale_status)
VALUES ('00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000c001','V-1',40,35000,1652000,1400000,18,252000,'pending','gros','00000000-0000-0000-0000-00000000e001','draft');
INSERT INTO sale_items (tenant_id,sale_id,salt_type,warehouse_id,warehouse_name,quantity,unit_price) VALUES ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000d001','gros','00000000-0000-0000-0000-00000000e001','ENT-01',40,35000);
DO $$ BEGIN
  ASSERT (SELECT inventory_item_id FROM sale_items WHERE sale_id='00000000-0000-0000-0000-00000000d001')='00000000-0000-0000-0000-00000000f001', 'T1 rattachement article';
END $$;
UPDATE sales SET sale_status='invoiced' WHERE id='00000000-0000-0000-0000-00000000d001';
DO $$ BEGIN
  ASSERT pg_temp.bal('411')=1652000+118, 'T1 411 débit TTC';
  ASSERT pg_temp.bal('7021')=-1400000-100, 'T1 7021 crédit HT';
  ASSERT pg_temp.bal('4431')=-252000-18, 'T1 4431 crédit TVA';
  ASSERT (SELECT reserved_quantity FROM inventory_items WHERE id='00000000-0000-0000-0000-00000000f001')=40, 'T1 réservation 40 t';
  ASSERT (SELECT status::text FROM sales WHERE id='00000000-0000-0000-0000-00000000d001')='invoiced', 'T1 status synchronisé';
  RAISE NOTICE 'T1a OK facturation : 411 / 7021 + 4431, 40 t réservées';
END $$;
UPDATE sales SET sale_status='completed' WHERE id='00000000-0000-0000-0000-00000000d001';
DO $$ BEGIN
  ASSERT (SELECT quantity FROM inventory_items WHERE id='00000000-0000-0000-0000-00000000f001')=110, 'T1 stock 150 -> 110';
  ASSERT (SELECT reserved_quantity FROM inventory_items WHERE id='00000000-0000-0000-0000-00000000f001')=0, 'T1 réservation soldée';
  ASSERT pg_temp.bal('736')=800000 AND pg_temp.bal('361')=-800000, 'T1 coût des ventes 736/361 = 800 000';
  ASSERT (SELECT count(*) FROM stock_movements WHERE reference_id='00000000-0000-0000-0000-00000000d001' AND movement_type='exit' AND quantity=40)=1, 'T1 mouvement de sortie';
  ASSERT (SELECT stock_updated AND delivered AND delivered_at IS NOT NULL FROM sales WHERE id='00000000-0000-0000-0000-00000000d001'), 'T1 traçabilité livraison';
  RAISE NOTICE 'T1b OK livraison : stock 110 t, coût des ventes 800 000';
END $$;
-- encaissement en espèces par le comptable
SELECT pg_temp.as_user(2);
SELECT record_sale_payment('00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-00000000ca01',1652000,current_date,'especes') ->> 'treasury_account' AS compte;
DO $$ BEGIN
  ASSERT pg_temp.bal('571')=1652000 AND pg_temp.bal('521')=0, 'T1 encaissement en 571 et pas en 521';
  ASSERT pg_temp.bal('411')=118, 'T1 client soldé';
  ASSERT (SELECT current_balance FROM accounts WHERE id='00000000-0000-0000-0000-00000000ca01')=1752000, 'T1 caisse = 1 752 000';
  ASSERT (SELECT payment_status::text||'/'||amount_paid FROM sales WHERE id='00000000-0000-0000-0000-00000000d001')='paid/1652000', 'T1 facture payée';
  ASSERT (SELECT SUM(debit)-SUM(credit) FROM journal_entries)=0, 'T1 grand livre équilibré';
  RAISE NOTICE 'T1c OK encaissement : 571/411, caisse 1 752 000, facture payée';
END $$;

-- ===== T2 : vente export (hors OHADA) =====
SELECT pg_temp.as_user(1);
INSERT INTO sales (id,tenant_id,client_id,sale_number,total_amount,amount_ht,tva_amount,sale_status) VALUES ('00000000-0000-0000-0000-00000000d002','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000c002','V-2',300000,300000,0,'draft');
INSERT INTO sale_items (tenant_id,sale_id,salt_type,warehouse_id,quantity,unit_price) VALUES ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000d002','gros','00000000-0000-0000-0000-00000000e001',10,30000);
UPDATE sales SET sale_status='invoiced' WHERE id='00000000-0000-0000-0000-00000000d002';
DO $$ BEGIN
  ASSERT pg_temp.bal('7022')=-300000, 'T2 7022';
  ASSERT pg_temp.bal('4431')=-252000-18, 'T2 aucune TVA sur export';
  RAISE NOTICE 'T2 OK export : 7022 sans TVA';
END $$;

-- ===== T3 : annulation d'une facture non payée =====
UPDATE sales SET sale_status='cancelled' WHERE id='00000000-0000-0000-0000-00000000d002';
DO $$ BEGIN
  ASSERT pg_temp.bal('7022')=0, 'T3 contrepassation 7022';
  ASSERT pg_temp.bal('411')=118, 'T3 client ramené';
  ASSERT (SELECT reserved_quantity FROM inventory_items WHERE id='00000000-0000-0000-0000-00000000f001')=0, 'T3 réservation libérée';
  ASSERT (SELECT quantity FROM inventory_items WHERE id='00000000-0000-0000-0000-00000000f001')=110, 'T3 stock inchangé';
  RAISE NOTICE 'T3 OK annulation : écriture contrepassée, réservation libérée';
END $$;

-- ===== T4 : contrôles de stock =====
SELECT pg_temp.expect_error($q$INSERT INTO sale_items (tenant_id,sale_id,salt_type,warehouse_id,quantity,unit_price) VALUES ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000d002','gros','00000000-0000-0000-0000-00000000e001',1000,1)$q$, 'Stock insuffisant');
INSERT INTO sales (id,tenant_id,client_id,sale_number,total_amount,amount_ht,sale_status) VALUES ('00000000-0000-0000-0000-00000000d003','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000c001','V-3',1,1,'draft'),('00000000-0000-0000-0000-00000000d004','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000c001','V-4',1,1,'draft');
INSERT INTO sale_items (tenant_id,sale_id,salt_type,warehouse_id,quantity,unit_price) VALUES ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000d003','gros','00000000-0000-0000-0000-00000000e001',80,1),('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000d004','gros','00000000-0000-0000-0000-00000000e001',80,1);
UPDATE sales SET sale_status='invoiced' WHERE id='00000000-0000-0000-0000-00000000d003';
SELECT pg_temp.expect_error($q$UPDATE sales SET sale_status='invoiced' WHERE id='00000000-0000-0000-0000-00000000d004'$q$, 'Stock insuffisant');
DO $$ BEGIN RAISE NOTICE 'T4 OK : sur-vente refusée à la saisie et à la validation (réservations prises en compte)'; END $$;

-- ===== T5 : garde-fous =====
SELECT pg_temp.expect_error($q$UPDATE sales SET sale_status='cancelled' WHERE id='00000000-0000-0000-0000-00000000d001'$q$, 'définitif');
SELECT pg_temp.expect_error($q$UPDATE sales SET sale_status='draft' WHERE id='00000000-0000-0000-0000-00000000d003'$q$, 'retour en brouillon');
SELECT pg_temp.as_user(2);
SELECT pg_temp.expect_error($q$SELECT record_sale_payment('00000000-0000-0000-0000-00000000d003','00000000-0000-0000-0000-00000000ca01',5)$q$, 'reste à payer');
SELECT pg_temp.expect_error($q$SELECT record_sale_payment('00000000-0000-0000-0000-00000000d003','00000000-0000-0000-0000-00000000ba01',1,current_date,'especes')$q$, 'espèces');
SELECT pg_temp.expect_error($q$SELECT record_sale_payment('00000000-0000-0000-0000-00000000d004','00000000-0000-0000-0000-00000000ba01',1)$q$, 'pas facturée');
SELECT pg_temp.as_user(3);
SELECT pg_temp.expect_error($q$SELECT record_sale_payment('00000000-0000-0000-0000-00000000d003','00000000-0000-0000-0000-00000000ba01',1)$q$, 'Accès refusé');
SELECT pg_temp.as_user(9);
SELECT pg_temp.expect_error($q$SELECT record_sale_payment('00000000-0000-0000-0000-00000000d003','00000000-0000-0000-0000-00000000ba09',1)$q$, 'introuvable');
-- T7 : paiement partiel puis annulation refusée
SELECT pg_temp.as_user(2);
SELECT record_sale_payment('00000000-0000-0000-0000-00000000d003','00000000-0000-0000-0000-00000000ba01',1,current_date,'virement') ->> 'payment_status' AS statut_t7;
SELECT pg_temp.expect_error($q$UPDATE sales SET sale_status='cancelled' WHERE id='00000000-0000-0000-0000-00000000d003'$q$, 'encaissement');
DO $$ BEGIN
  ASSERT (SELECT SUM(debit)-SUM(credit) FROM journal_entries)=0, 'Grand livre équilibré en fin de test';
  ASSERT (SELECT count(*) FROM transactions t WHERE NOT EXISTS (SELECT 1 FROM journal_entries j WHERE j.transaction_id=t.id))=0, 'aucune transaction vide';
  RAISE NOTICE 'T5/T7 OK garde-fous ; grand livre équilibré';
END $$;
SELECT account_number, SUM(debit) debit, SUM(credit) credit FROM journal_entries GROUP BY 1 ORDER BY 1;
