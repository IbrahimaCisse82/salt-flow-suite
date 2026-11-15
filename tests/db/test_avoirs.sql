\set ON_ERROR_STOP 1
-- Tests du lot 3.2 : règlements fournisseurs et avoirs clients / fournisseurs
SET client_min_messages = notice;
CREATE OR REPLACE FUNCTION pg_temp.as_user(n int) RETURNS void LANGUAGE sql AS $$ SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000'||n,false) $$;
CREATE OR REPLACE FUNCTION pg_temp.bal(acc text) RETURNS numeric LANGUAGE sql AS $$
  SELECT COALESCE(SUM(debit-credit),0) FROM journal_entries WHERE account_number=acc AND tenant_id='00000000-0000-0000-0000-0000000000a1' $$;
CREATE OR REPLACE FUNCTION pg_temp.expect_error(sql text, pattern text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN EXECUTE sql; EXCEPTION WHEN OTHERS THEN
    IF SQLERRM ILIKE '%'||pattern||'%' THEN RAISE NOTICE 'OK attendu : %', SQLERRM; RETURN; END IF;
    RAISE EXCEPTION 'Mauvaise erreur pour [%] : %', sql, SQLERRM; END;
  RAISE EXCEPTION 'Aucune erreur alors qu''attendue pour [%]', sql;
END $$;
SET client_min_messages = warning;
\i ../../drizzle/migrations/0002_reparation_cycle_vente.sql
\i ../../drizzle/migrations/0003_avoirs_et_reglements.sql
\i ../../drizzle/migrations/0003_avoirs_et_reglements.sql
SET client_min_messages = notice;

-- ===== A. Achat §5 : 100 t × 20 000 HT, TVA 18 % =====
SELECT pg_temp.as_user(1);
INSERT INTO suppliers (id,tenant_id,name) VALUES ('00000000-0000-0000-0000-0000000005a1','00000000-0000-0000-0000-0000000000a1','Fournisseur Test');
INSERT INTO inventory_items (id,tenant_id,name,category,unit_of_measure,quantity) VALUES ('00000000-0000-0000-0000-00000000f002','00000000-0000-0000-0000-0000000000a1','Sel fin iodé','produit_fini','tonnes',0);
INSERT INTO purchase_orders (id,tenant_id,order_number,supplier_id,status,subtotal,amount_ht,tva_amount,tva_rate,total_amount)
VALUES ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000a1','BC-1','00000000-0000-0000-0000-0000000005a1','approved',2000000,2000000,360000,18,2360000);
INSERT INTO purchase_order_items (id,tenant_id,purchase_order_id,inventory_item_id,item_name,quantity,unit_price) VALUES ('00000000-0000-0000-0000-0000000000c2','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-00000000f002','Sel fin iodé',100,20000);
UPDATE purchase_order_items SET received_quantity=100 WHERE id='00000000-0000-0000-0000-0000000000c2';
UPDATE purchase_orders SET status='received' WHERE id='00000000-0000-0000-0000-0000000000c1';
DO $$ BEGIN
  ASSERT pg_temp.bal('602')=2000000 AND pg_temp.bal('4452')=360000 AND pg_temp.bal('401')=-2360000, 'A1 écriture réception';
  ASSERT (SELECT quantity FROM inventory_items WHERE id='00000000-0000-0000-0000-00000000f002')=100, 'A1 stock 100 t';
  RAISE NOTICE 'A1 OK réception : 602 2 000 000 + 4452 360 000 / 401 2 360 000, stock 100 t';
END $$;
-- Règlement par virement, inséré comme le fait l'écran Achats
SELECT pg_temp.as_user(2);
INSERT INTO purchase_payments (tenant_id,purchase_order_id,payment_type,amount,payment_method,account_id) VALUES ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c1','payment',2360000,'virement','00000000-0000-0000-0000-00000000ba01');
DO $$ BEGIN
  ASSERT (SELECT total_paid FROM purchase_orders WHERE id='00000000-0000-0000-0000-0000000000c1')=2360000, 'A2 total payé';
  ASSERT (SELECT status::text FROM purchase_orders WHERE id='00000000-0000-0000-0000-0000000000c1')='paid', 'A2 statut payé';
  ASSERT (SELECT current_balance FROM accounts WHERE id='00000000-0000-0000-0000-00000000ba01')=2640000, 'A2 banque = 2 640 000';
  ASSERT pg_temp.bal('401')=0 AND pg_temp.bal('521')=-2360000, 'A2 écriture 401/521';
  RAISE NOTICE 'A2 OK règlement fournisseur : 401/521, banque 2 640 000, commande « paid »';
END $$;
SELECT pg_temp.expect_error($q$INSERT INTO purchase_payments (tenant_id,purchase_order_id,payment_type,amount,payment_method,account_id) VALUES ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c1','payment',1,'virement','00000000-0000-0000-0000-00000000ba01')$q$, 'reste à payer');
SELECT pg_temp.expect_error($q$INSERT INTO purchase_payments (tenant_id,purchase_order_id,payment_type,amount,payment_method,account_id) VALUES ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c1','refund',1,'especes','00000000-0000-0000-0000-00000000ba01')$q$, 'trop-payé');

-- ===== B. Avoir fournisseur : retour de 10 t, remboursé par virement =====
SELECT create_supplier_credit_note('00000000-0000-0000-0000-0000000000c1','retour','Sel humide non conforme',
  '[{"purchase_order_item_id":"00000000-0000-0000-0000-0000000000c2","quantity":10}]', NULL, current_date, 'AV-FOURN-778', '00000000-0000-0000-0000-00000000ba01') ->> 'credit_note_number' AS avoir_fournisseur;
DO $$ BEGIN
  ASSERT (SELECT total_amount FROM supplier_credit_notes LIMIT 1)=236000, 'B1 TTC 236 000';
  ASSERT pg_temp.bal('602')=1800000 AND pg_temp.bal('4452')=324000, 'B1 602 et 4452 crédités';
  ASSERT (SELECT quantity FROM inventory_items WHERE id='00000000-0000-0000-0000-00000000f002')=90, 'B1 stock 90 t';
  ASSERT (SELECT current_balance FROM accounts WHERE id='00000000-0000-0000-0000-00000000ba01')=2876000, 'B1 remboursement reçu en banque';
  ASSERT pg_temp.bal('401')=0, 'B1 fournisseur soldé';
  ASSERT (SELECT total_paid||'/'||credited_amount||'/'||status FROM purchase_orders WHERE id='00000000-0000-0000-0000-0000000000c1')='2124000/236000/paid', 'B1 suivi commande';
  RAISE NOTICE 'B1 OK avoir fournisseur retour : 401 / 602 + 4452, stock 90 t, remboursement 521/401';
END $$;
SELECT create_supplier_credit_note('00000000-0000-0000-0000-0000000000c1','rabais','Retard de livraison', NULL, 50000) ->> 'refund_due' AS rabais_a_recevoir;
DO $$ BEGIN
  ASSERT pg_temp.bal('6029')=-50000 AND pg_temp.bal('401')=59000, 'B2 rabais 6029, créance fournisseur 59 000';
  RAISE NOTICE 'B2 OK rabais fournisseur : 401 / 6029 + 4452, 59 000 à recevoir';
END $$;
SELECT pg_temp.expect_error($q$SELECT create_supplier_credit_note('00000000-0000-0000-0000-0000000000c1','retour','test',
  '[{"purchase_order_item_id":"00000000-0000-0000-0000-0000000000c2","quantity":95}]')$q$, 'déjà retournés');

-- ===== C. Avoirs clients =====
SELECT pg_temp.as_user(1);
INSERT INTO sales (id,tenant_id,client_id,sale_number,total_amount,amount_ht,tva_rate,tva_amount,sale_status) VALUES ('00000000-0000-0000-0000-00000000d101','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000c001','V-101',1652000,1400000,18,252000,'draft');
INSERT INTO sale_items (id,tenant_id,sale_id,salt_type,warehouse_id,quantity,unit_price) VALUES ('00000000-0000-0000-0000-00000000d1a1','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000d101','gros','00000000-0000-0000-0000-00000000e001',40,35000);
UPDATE sales SET sale_status='invoiced' WHERE id='00000000-0000-0000-0000-00000000d101';
SELECT pg_temp.as_user(2);
SELECT pg_temp.expect_error($q$SELECT create_sale_credit_note('00000000-0000-0000-0000-00000000d101','retour','Sacs abîmés','[{"sale_item_id":"00000000-0000-0000-0000-00000000d1a1","quantity":5}]')$q$, 'non livrée');
SELECT pg_temp.as_user(1);
UPDATE sales SET sale_status='completed' WHERE id='00000000-0000-0000-0000-00000000d101';
SELECT pg_temp.as_user(2);
SELECT record_sale_payment('00000000-0000-0000-0000-00000000d101','00000000-0000-0000-0000-00000000ca01',1000000,current_date,'especes') ->> 'remaining' AS reste;
CREATE TEMP TABLE b0 AS SELECT pg_temp.bal('7021') v7021, pg_temp.bal('4431') v4431, pg_temp.bal('361') v361, pg_temp.bal('411') v411;
SELECT create_sale_credit_note('00000000-0000-0000-0000-00000000d101','retour','Sacs abîmés au déchargement',
  '[{"sale_item_id":"00000000-0000-0000-0000-00000000d1a1","quantity":10}]') ->> 'credit_note_number' AS avoir_client;
DO $$ BEGIN
  ASSERT (SELECT total_amount||'/'||cost_amount FROM credit_notes WHERE kind='retour')='413000/200000', 'C1 avoir 413 000, coût 200 000';
  ASSERT pg_temp.bal('7021') - (SELECT v7021 FROM b0) = 350000, 'C1 7021 débité 350 000';
  ASSERT pg_temp.bal('4431') - (SELECT v4431 FROM b0) = 63000, 'C1 4431 débité 63 000';
  ASSERT pg_temp.bal('411') - (SELECT v411 FROM b0) = -413000, 'C1 411 crédité';
  ASSERT pg_temp.bal('361') - (SELECT v361 FROM b0) = 200000, 'C1 retour en stock 361';
  ASSERT (SELECT quantity FROM inventory_items WHERE id='00000000-0000-0000-0000-00000000f001')=120, 'C1 stock 110 + 10';
  ASSERT (SELECT payment_status::text FROM sales WHERE id='00000000-0000-0000-0000-00000000d101')='partial', 'C1 reste partiel';
  RAISE NOTICE 'C1 OK avoir client retour : 7021 + 4431 / 411, 10 t réintégrées à 20 000';
END $$;
-- Rabais supérieur au reste dû : remboursement en espèces du trop-perçu
SELECT create_sale_credit_note('00000000-0000-0000-0000-00000000d101','rabais','Geste commercial qualité', NULL, 300000, current_date, '00000000-0000-0000-0000-00000000ca01') ->> 'refunded' AS rembourse;
DO $$ BEGIN
  ASSERT pg_temp.bal('7029')=300000, 'C2 7029';
  ASSERT (SELECT current_balance FROM accounts WHERE id='00000000-0000-0000-0000-00000000ca01')=985000, 'C2 caisse 100 000 + 1 000 000 - 115 000';
  ASSERT (SELECT total_paid||'/'||credited_amount||'/'||payment_status FROM sales WHERE id='00000000-0000-0000-0000-00000000d101')='885000/767000/paid', 'C2 facture soldée';
  ASSERT (SELECT COALESCE(SUM(debit-credit),0) FROM journal_entries je JOIN transactions t ON t.id=je.transaction_id
          WHERE je.account_number='411' AND ((t.source_table='sales' AND t.source_id='00000000-0000-0000-0000-00000000d101')
             OR (t.source_table='payments' AND t.source_id IN (SELECT id FROM payments WHERE sale_id='00000000-0000-0000-0000-00000000d101'))
             OR (t.source_table='credit_notes' AND t.source_id IN (SELECT id FROM credit_notes WHERE sale_id='00000000-0000-0000-0000-00000000d101'))))=0, 'C2 compte client de la facture soldé';
  RAISE NOTICE 'C2 OK rabais client 7029 + remboursement 115 000 en caisse, facture soldée';
END $$;
SELECT pg_temp.expect_error($q$SELECT record_sale_payment('00000000-0000-0000-0000-00000000d101','00000000-0000-0000-0000-00000000ca01',1)$q$, 'reste à payer (0');
SELECT pg_temp.expect_error($q$SELECT create_sale_credit_note('00000000-0000-0000-0000-00000000d101','retour','encore','[{"sale_item_id":"00000000-0000-0000-0000-00000000d1a1","quantity":31}]')$q$, 'déjà retournées');
SELECT pg_temp.expect_error($q$SELECT create_sale_credit_note('00000000-0000-0000-0000-00000000d101','rabais','trop', NULL, 2000000)$q$, 'supérieur au montant restant');
SELECT pg_temp.expect_error($q$SELECT create_sale_credit_note('00000000-0000-0000-0000-00000000d101','rabais','', NULL, 10)$q$, 'motif');
SELECT pg_temp.as_user(3);
SELECT pg_temp.expect_error($q$SELECT create_sale_credit_note('00000000-0000-0000-0000-00000000d101','rabais','test commercial', NULL, 10)$q$, 'Accès refusé');
SELECT pg_temp.as_user(9);
SELECT pg_temp.expect_error($q$SELECT create_sale_credit_note('00000000-0000-0000-0000-00000000d101','rabais','test intrus', NULL, 10)$q$, 'introuvable');

-- Export : avoir sans TVA en 7022 ; facture avoirée non annulable
SELECT pg_temp.as_user(1);
INSERT INTO sales (id,tenant_id,client_id,sale_number,total_amount,amount_ht,tva_amount,sale_status) VALUES ('00000000-0000-0000-0000-00000000d102','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000c002','V-102',300000,300000,0,'draft');
INSERT INTO sale_items (id,tenant_id,sale_id,salt_type,warehouse_id,quantity,unit_price) VALUES ('00000000-0000-0000-0000-00000000d1b1','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000d102','gros','00000000-0000-0000-0000-00000000e001',10,30000);
UPDATE sales SET sale_status='invoiced' WHERE id='00000000-0000-0000-0000-00000000d102';
SELECT pg_temp.as_user(2);
CREATE TEMP TABLE b1 AS SELECT pg_temp.bal('4431') v4431;
SELECT create_sale_credit_note('00000000-0000-0000-0000-00000000d102','rabais','Remise export', NULL, 30000) ->> 'tva_amount' AS tva_export;
DO $$ BEGIN
  ASSERT pg_temp.bal('4431') = (SELECT v4431 FROM b1), 'C3 aucune TVA sur avoir export';
  ASSERT (SELECT tva_amount FROM credit_notes WHERE sale_id='00000000-0000-0000-0000-00000000d102')=0, 'C3 avoir HT';
  RAISE NOTICE 'C3 OK avoir export sans TVA';
END $$;
SELECT pg_temp.as_user(1);
SELECT pg_temp.expect_error($q$UPDATE sales SET sale_status='cancelled' WHERE id='00000000-0000-0000-0000-00000000d102'$q$, 'avoir de');

-- Numérotation et intégrité finale
DO $$ BEGIN
  ASSERT (SELECT string_agg(credit_note_number, ',' ORDER BY credit_note_number) FROM credit_notes) LIKE 'AV-%-00001,AV-%-00002,AV-%-00003', 'numérotation AV';
  ASSERT (SELECT string_agg(credit_note_number, ',' ORDER BY credit_note_number) FROM supplier_credit_notes) LIKE 'AVF-%-00001,AVF-%-00002', 'numérotation AVF';
  ASSERT (SELECT SUM(debit)-SUM(credit) FROM journal_entries)=0, 'grand livre équilibré';
  RAISE NOTICE 'D OK numérotation AV / AVF continue, grand livre équilibré';
END $$;
