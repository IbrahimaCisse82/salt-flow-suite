-- Insertion des comptes du plan comptable SYSCOHADA (Classe 6 - Charges)
-- Uniquement les comptes qui n'existent pas encore

INSERT INTO chart_of_accounts (tenant_id, account_number, account_name, account_type, is_active)
SELECT '00000000-0000-0000-0000-000000000001', account_number, account_name, account_type, true
FROM (VALUES
  -- Classe 6 - Charges d'exploitation
  ('60', 'ACHATS', 'Charges'),
  ('601', 'ACHATS DE MARCHANDISES', 'Charges'),
  ('6011', 'MARCHANDISES VENDUES EN L''ETAT', 'Charges'),
  ('6022', 'MATIERES CONSOMMABLES', 'Charges'),
  ('603', 'VARIATIONS DE STOCKS', 'Charges'),
  ('604', 'ACHATS STOCKES DE MATIERES', 'Charges'),
  ('605', 'AUTRES ACHATS', 'Charges'),
  ('6053', 'CARBURANTS', 'Charges'),
  ('6056', 'ACHATS PETITS MATERIELS ET OUTILLAGES', 'Charges'),
  ('6057', 'ACHATS D''ETUDES ET PRESTATIONS', 'Charges'),
  ('6058', 'ACHATS DE TRAVAUX, MATERIELS ET EQUIPEMENTS', 'Charges'),
  ('608', 'FRAIS ACCESSOIRES D''ACHAT', 'Charges'),
  
  -- Classe 61 - Transports
  ('61', 'TRANSPORTS', 'Charges'),
  ('611', 'TRANSPORTS SUR ACHATS', 'Charges'),
  ('612', 'TRANSPORTS SUR VENTES', 'Charges'),
  ('613', 'TRANSPORTS POUR LE COMPTE DE TIERS', 'Charges'),
  ('614', 'TRANSPORTS DU PERSONNEL', 'Charges'),
  ('618', 'AUTRES FRAIS DE TRANSPORT', 'Charges'),
  
  -- Classe 62 - Services extérieurs A
  ('62', 'SERVICES EXTERIEURS A', 'Charges'),
  ('621', 'SOUS-TRAITANCE GENERALE', 'Charges'),
  ('622', 'LOCATIONS ET CHARGES LOCATIVES', 'Charges'),
  ('6221', 'LOCATIONS DE TERRAINS', 'Charges'),
  ('6222', 'LOCATIONS DE BATIMENTS', 'Charges'),
  ('6223', 'LOCATIONS DE MATERIELS ET OUTILLAGES', 'Charges'),
  ('6224', 'LOCATIONS DE VEHICULES', 'Charges'),
  ('623', 'REDEVANCES DE CREDIT-BAIL', 'Charges'),
  ('624', 'ENTRETIEN, REPARATIONS ET MAINTENANCE', 'Charges'),
  ('6241', 'ENTRETIEN ET REPARATIONS BIENS IMMOBILIERS', 'Charges'),
  ('6242', 'ENTRETIEN ET REPARATIONS BIENS MOBILIERS', 'Charges'),
  ('6243', 'MAINTENANCE', 'Charges'),
  ('625', 'PRIMES D''ASSURANCES', 'Charges'),
  ('626', 'ETUDES, RECHERCHES ET DOCUMENTATION', 'Charges'),
  ('627', 'PUBLICITE, PUBLICATIONS, RELATIONS PUBLIQUES', 'Charges'),
  ('628', 'FRAIS DE TELECOMMUNICATIONS', 'Charges'),
  
  -- Classe 63 - Services extérieurs B
  ('63', 'SERVICES EXTERIEURS B', 'Charges'),
  ('631', 'FRAIS BANCAIRES', 'Charges'),
  ('632', 'REMUNERATIONS D''INTERMEDIAIRES ET HONORAIRES', 'Charges'),
  ('633', 'FRAIS DE FORMATION DU PERSONNEL', 'Charges'),
  ('634', 'RECEPTIONS', 'Charges'),
  ('635', 'DONS', 'Charges'),
  ('636', 'COTISATIONS', 'Charges'),
  ('637', 'REMUNERATIONS DE PERSONNEL EXTERIEUR', 'Charges'),
  ('638', 'AUTRES CHARGES EXTERNES', 'Charges'),
  
  -- Classe 64 - Impôts et taxes
  ('64', 'IMPOTS ET TAXES', 'Charges'),
  ('641', 'IMPOTS ET TAXES DIRECTS', 'Charges'),
  ('642', 'IMPOTS ET TAXES INDIRECTS', 'Charges'),
  ('644', 'IMPOTS SUR LES REVENUS', 'Charges'),
  ('645', 'TAXES SUR LE CHIFFRE D''AFFAIRES', 'Charges'),
  ('646', 'DROITS D''ENREGISTREMENT', 'Charges'),
  ('647', 'AUTRES IMPOTS ET TAXES', 'Charges'),
  ('648', 'AUTRES IMPOTS ET TAXES', 'Charges'),
  
  -- Classe 65 - Autres charges
  ('65', 'AUTRES CHARGES', 'Charges'),
  ('651', 'PERTES SUR CREANCES CLIENTS', 'Charges'),
  ('652', 'QUOTE-PART DE RESULTAT SUR OPERATIONS COMMUNES', 'Charges'),
  ('653', 'QUOTE-PART DE RESULTAT ANNULEE', 'Charges'),
  ('654', 'VALEURS COMPTABLES DES CESSIONS COURANTES', 'Charges'),
  ('658', 'CHARGES DIVERSES', 'Charges'),
  ('659', 'CHARGES PROVISIONNEES', 'Charges'),
  
  -- Classe 66 - Charges de personnel
  ('66', 'CHARGES DE PERSONNEL', 'Charges'),
  ('661', 'REMUNERATIONS DIRECTES VERSEES AU PERSONNEL NATIONAL', 'Charges'),
  ('6611', 'APPOINTEMENTS, SALAIRES ET COMMISSIONS', 'Charges'),
  ('6612', 'PRIMES ET GRATIFICATIONS', 'Charges'),
  ('6613', 'CONGES PAYES', 'Charges'),
  ('6614', 'INDEMNITES DE PREAVIS, LICENCIEMENT', 'Charges'),
  ('6615', 'INDEMNITES DE MALADIE', 'Charges'),
  ('6616', 'SUPPLEMENT FAMILIAL', 'Charges'),
  ('6617', 'AVANTAGES EN NATURE', 'Charges'),
  ('6618', 'AUTRES REMUNERATIONS DIRECTES', 'Charges'),
  ('662', 'REMUNERATIONS DIRECTES VERSEES AU PERSONNEL NON NATIONAL', 'Charges'),
  ('663', 'INDEMNITES FORFAITAIRES VERSEES AU PERSONNEL', 'Charges'),
  ('664', 'CHARGES SOCIALES', 'Charges'),
  ('6641', 'CHARGES SOCIALES SUR REMUNERATION PERSONNEL NATIONAL', 'Charges'),
  ('6661', 'REMUNERATIONS ALLOUEES AUX GERANTS ET ADMINISTRATEURS', 'Charges'),
  ('667', 'REMUNERATIONS TRANSFEREES DE PERSONNEL EXTERIEUR', 'Charges'),
  ('668', 'AUTRES CHARGES SOCIALES', 'Charges'),
  
  -- Classe 67 - Frais financiers
  ('67', 'FRAIS FINANCIERS ET CHARGES ASSIMILEES', 'Charges'),
  ('671', 'INTERETS DES EMPRUNTS', 'Charges'),
  ('672', 'INTERETS DES DETTES COMMERCIALES', 'Charges'),
  ('673', 'INTERETS BANCAIRES', 'Charges'),
  ('674', 'INTERETS DES AUTRES DETTES FINANCIERES', 'Charges'),
  ('675', 'ESCOMPTES ACCORDES', 'Charges'),
  ('676', 'PERTES DE CHANGE', 'Charges'),
  ('677', 'PERTES SUR CESSIONS DE TITRES', 'Charges'),
  ('678', 'AUTRES FRAIS FINANCIERS', 'Charges'),
  
  -- Classe 68 - Dotations aux amortissements
  ('68', 'DOTATIONS AUX AMORTISSEMENTS', 'Charges'),
  ('681', 'DOTATIONS AUX AMORTISSEMENTS D''EXPLOITATION', 'Charges'),
  ('6811', 'DOTATIONS AUX AMORTISSEMENTS DES IMMOBILISATIONS INCORPORELLES', 'Charges'),
  ('6812', 'DOTATIONS AUX AMORTISSEMENTS DES IMMOBILISATIONS CORPORELLES', 'Charges'),
  ('6813', 'DOTATIONS AUX AMORTISSEMENTS DES CHARGES A REPARTIR', 'Charges'),
  
  -- Classe 7 - Produits (quelques comptes essentiels)
  ('70', 'VENTES', 'Produits'),
  ('701', 'VENTES DE MARCHANDISES', 'Produits'),
  ('702', 'VENTES DE PRODUITS FINIS', 'Produits'),
  ('7021', 'VENTES DE SEL', 'Produits'),
  ('703', 'VENTES DE PRODUITS INTERMEDIAIRES', 'Produits'),
  ('704', 'VENTES DE PRODUITS RESIDUELS', 'Produits'),
  ('705', 'TRAVAUX FACTURES', 'Produits'),
  ('706', 'SERVICES VENDUS', 'Produits'),
  ('707', 'PRODUITS ACCESSOIRES', 'Produits'),
  ('71', 'SUBVENTIONS D''EXPLOITATION', 'Produits'),
  ('72', 'PRODUCTION IMMOBILISEE', 'Produits'),
  ('73', 'VARIATIONS DE STOCKS DE BIENS ET SERVICES PRODUITS', 'Produits'),
  ('75', 'AUTRES PRODUITS', 'Produits'),
  ('77', 'REVENUS FINANCIERS', 'Produits'),
  ('78', 'TRANSFERTS DE CHARGES', 'Produits')
) AS new_accounts(account_number, account_name, account_type)
WHERE NOT EXISTS (
  SELECT 1 FROM chart_of_accounts 
  WHERE chart_of_accounts.account_number = new_accounts.account_number 
  AND chart_of_accounts.tenant_id = '00000000-0000-0000-0000-000000000001'
);

-- Insertion des types de dépenses courants pour une saline
INSERT INTO expense_types (tenant_id, name, syscohada_category, account_number, is_active)
SELECT '00000000-0000-0000-0000-000000000001', name, syscohada_category, account_number, true
FROM (VALUES
  ('Carburant et lubrifiants', '6053 - CARBURANTS', '6053'),
  ('Entretien véhicules', '6242 - ENTRETIEN ET REPARATIONS BIENS MOBILIERS', '6242'),
  ('Entretien bâtiments', '6241 - ENTRETIEN ET REPARATIONS BIENS IMMOBILIERS', '6241'),
  ('Maintenance équipements', '6243 - MAINTENANCE', '6243'),
  ('Location matériel', '6223 - LOCATIONS DE MATERIELS ET OUTILLAGES', '6223'),
  ('Transport sur achats', '611 - TRANSPORTS SUR ACHATS', '611'),
  ('Transport sur ventes', '612 - TRANSPORTS SUR VENTES', '612'),
  ('Assurances', '625 - PRIMES D''ASSURANCES', '625'),
  ('Frais bancaires', '631 - FRAIS BANCAIRES', '631'),
  ('Honoraires', '632 - REMUNERATIONS D''INTERMEDIAIRES ET HONORAIRES', '632'),
  ('Formation personnel', '633 - FRAIS DE FORMATION DU PERSONNEL', '633'),
  ('Télécommunications', '628 - FRAIS DE TELECOMMUNICATIONS', '628'),
  ('Publicité', '627 - PUBLICITE, PUBLICATIONS, RELATIONS PUBLIQUES', '627'),
  ('Petits matériels', '6056 - ACHATS PETITS MATERIELS ET OUTILLAGES', '6056'),
  ('Sous-traitance', '621 - SOUS-TRAITANCE GENERALE', '621'),
  ('Impôts et taxes', '64 - IMPOTS ET TAXES', '64'),
  ('Charges sociales', '664 - CHARGES SOCIALES', '664'),
  ('Frais de déplacement', '618 - AUTRES FRAIS DE TRANSPORT', '618'),
  ('Réceptions et missions', '634 - RECEPTIONS', '634'),
  ('Charges diverses', '658 - CHARGES DIVERSES', '658')
) AS new_types(name, syscohada_category, account_number)
WHERE NOT EXISTS (
  SELECT 1 FROM expense_types 
  WHERE expense_types.name = new_types.name 
  AND expense_types.tenant_id = '00000000-0000-0000-0000-000000000001'
);