
-- Pré-remplir le plan comptable SYSCOHADA pour l'admin tenant
INSERT INTO chart_of_accounts (tenant_id, account_number, account_name, account_type, is_active) VALUES
-- Classe 1: Comptes de capitaux
('00000000-0000-0000-0000-000000000001', '101', 'Capital social', 'Capitaux permanents', true),
('00000000-0000-0000-0000-000000000001', '106', 'Réserves', 'Capitaux permanents', true),
('00000000-0000-0000-0000-000000000001', '12', 'Résultat de l''exercice', 'Capitaux permanents', true),
('00000000-0000-0000-0000-000000000001', '16', 'Emprunts et dettes assimilées', 'Capitaux permanents', true),

-- Classe 2: Comptes d'immobilisations
('00000000-0000-0000-0000-000000000001', '21', 'Immobilisations incorporelles', 'Immobilisations', true),
('00000000-0000-0000-0000-000000000001', '22', 'Terrains', 'Immobilisations', true),
('00000000-0000-0000-0000-000000000001', '23', 'Bâtiments, installations techniques', 'Immobilisations', true),
('00000000-0000-0000-0000-000000000001', '24', 'Matériel', 'Immobilisations', true),

-- Classe 3: Comptes de stocks
('00000000-0000-0000-0000-000000000001', '31', 'Marchandises', 'Stocks', true),
('00000000-0000-0000-0000-000000000001', '32', 'Matières premières et fournitures', 'Stocks', true),
('00000000-0000-0000-0000-000000000001', '33', 'Produits en cours', 'Stocks', true),
('00000000-0000-0000-0000-000000000001', '35', 'Produits finis', 'Stocks', true),

-- Classe 4: Comptes de tiers
('00000000-0000-0000-0000-000000000001', '401', 'Fournisseurs', 'Tiers', true),
('00000000-0000-0000-0000-000000000001', '411', 'Clients', 'Tiers', true),
('00000000-0000-0000-0000-000000000001', '421', 'Personnel - Rémunérations dues', 'Tiers', true),
('00000000-0000-0000-0000-000000000001', '43', 'Organismes sociaux', 'Tiers', true),
('00000000-0000-0000-0000-000000000001', '44', 'État et collectivités publiques', 'Tiers', true),

-- Classe 5: Comptes de trésorerie
('00000000-0000-0000-0000-000000000001', '52', 'Banques', 'Trésorerie', true),
('00000000-0000-0000-0000-000000000001', '53', 'Établissements financiers', 'Trésorerie', true),
('00000000-0000-0000-0000-000000000001', '57', 'Caisse', 'Trésorerie', true),

-- Classe 6: Comptes de charges
('00000000-0000-0000-0000-000000000001', '601', 'Achats de marchandises', 'Charges', true),
('00000000-0000-0000-0000-000000000001', '602', 'Achats de matières premières', 'Charges', true),
('00000000-0000-0000-0000-000000000001', '605', 'Autres achats', 'Charges', true),
('00000000-0000-0000-0000-000000000001', '61', 'Transports', 'Charges', true),
('00000000-0000-0000-0000-000000000001', '62', 'Services extérieurs', 'Charges', true),
('00000000-0000-0000-0000-000000000001', '63', 'Autres services extérieurs', 'Charges', true),
('00000000-0000-0000-0000-000000000001', '64', 'Impôts et taxes', 'Charges', true),
('00000000-0000-0000-0000-000000000001', '66', 'Charges de personnel', 'Charges', true),

-- Classe 7: Comptes de produits
('00000000-0000-0000-0000-000000000001', '701', 'Ventes de produits finis', 'Produits', true),
('00000000-0000-0000-0000-000000000001', '702', 'Ventes de produits intermédiaires', 'Produits', true),
('00000000-0000-0000-0000-000000000001', '706', 'Services vendus', 'Produits', true),
('00000000-0000-0000-0000-000000000001', '75', 'Autres produits de gestion courante', 'Produits', true)
ON CONFLICT DO NOTHING;

-- Pré-remplir les types de dépenses standards liés aux comptes SYSCOHADA
INSERT INTO expense_types (tenant_id, name, syscohada_category, account_number, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'Achats de marchandises', 'Achats', '601', true),
('00000000-0000-0000-0000-000000000001', 'Achats de matières premières', 'Achats', '602', true),
('00000000-0000-0000-0000-000000000001', 'Fournitures de bureau', 'Autres achats', '605', true),
('00000000-0000-0000-0000-000000000001', 'Transport de marchandises', 'Transports', '61', true),
('00000000-0000-0000-0000-000000000001', 'Locations et charges locatives', 'Services extérieurs', '62', true),
('00000000-0000-0000-0000-000000000001', 'Entretien et réparations', 'Services extérieurs', '62', true),
('00000000-0000-0000-0000-000000000001', 'Assurances', 'Autres services extérieurs', '63', true),
('00000000-0000-0000-0000-000000000001', 'Documentation et frais de formation', 'Autres services extérieurs', '63', true),
('00000000-0000-0000-0000-000000000001', 'Électricité', 'Autres services extérieurs', '63', true),
('00000000-0000-0000-0000-000000000001', 'Eau', 'Autres services extérieurs', '63', true),
('00000000-0000-0000-0000-000000000001', 'Télécommunications', 'Autres services extérieurs', '63', true),
('00000000-0000-0000-0000-000000000001', 'Taxes et impôts locaux', 'Impôts et taxes', '64', true),
('00000000-0000-0000-0000-000000000001', 'Salaires et traitements', 'Charges de personnel', '66', true),
('00000000-0000-0000-0000-000000000001', 'Charges sociales', 'Charges de personnel', '66', true),
('00000000-0000-0000-0000-000000000001', 'Carburant', 'Transports', '61', true)
ON CONFLICT DO NOTHING;
