-- Créer la table pour le plan comptable
CREATE TABLE public.chart_of_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  account_type text NOT NULL, -- actif, passif, charge, produit, capitaux
  parent_account_id uuid REFERENCES public.chart_of_accounts(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, account_number)
);

-- Activer RLS
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour chart_of_accounts
CREATE POLICY "Users can view accounts in their tenant" 
ON public.chart_of_accounts 
FOR SELECT 
USING (tenant_id IN (
  SELECT tenant_id 
  FROM profiles 
  WHERE id = auth.uid()
));

CREATE POLICY "Users can manage accounts in their tenant" 
ON public.chart_of_accounts 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id 
  FROM profiles 
  WHERE id = auth.uid()
));

-- Trigger pour updated_at
CREATE TRIGGER update_chart_of_accounts_updated_at
BEFORE UPDATE ON public.chart_of_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Créer la table pour les lignes d'écriture comptable
CREATE TABLE public.journal_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.chart_of_accounts(id),
  debit numeric NOT NULL DEFAULT 0,
  credit numeric NOT NULL DEFAULT 0,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT debit_or_credit_check CHECK (
    (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)
  )
);

-- Activer RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour journal_entries
CREATE POLICY "Users can view journal entries in their tenant" 
ON public.journal_entries 
FOR SELECT 
USING (tenant_id IN (
  SELECT tenant_id 
  FROM profiles 
  WHERE id = auth.uid()
));

CREATE POLICY "Users can manage journal entries in their tenant" 
ON public.journal_entries 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id 
  FROM profiles 
  WHERE id = auth.uid()
));

-- Trigger pour updated_at
CREATE TRIGGER update_journal_entries_updated_at
BEFORE UPDATE ON public.journal_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour performances
CREATE INDEX idx_journal_entries_transaction ON public.journal_entries(transaction_id);
CREATE INDEX idx_journal_entries_account ON public.journal_entries(account_id);
CREATE INDEX idx_chart_of_accounts_tenant ON public.chart_of_accounts(tenant_id);

-- Insérer quelques comptes de base SYSCOHADA
INSERT INTO public.chart_of_accounts (tenant_id, account_number, account_name, account_type) 
SELECT 
  t.id as tenant_id,
  '101' as account_number,
  'Capital social' as account_name,
  'capitaux' as account_type
FROM public.tenants t
UNION ALL
SELECT t.id, '121', 'Report à nouveau', 'capitaux' FROM public.tenants t
UNION ALL
SELECT t.id, '131', 'Résultat net', 'capitaux' FROM public.tenants t
UNION ALL
SELECT t.id, '211', 'Terrains', 'actif' FROM public.tenants t
UNION ALL
SELECT t.id, '2442', 'Matériel informatique', 'actif' FROM public.tenants t
UNION ALL
SELECT t.id, '2451', 'Matériel automobile', 'actif' FROM public.tenants t
UNION ALL
SELECT t.id, '334', 'Fournitures de bureau', 'actif' FROM public.tenants t
UNION ALL
SELECT t.id, '401', 'Fournisseurs', 'passif' FROM public.tenants t
UNION ALL
SELECT t.id, '411', 'Clients', 'actif' FROM public.tenants t
UNION ALL
SELECT t.id, '421', 'Personnel', 'passif' FROM public.tenants t
UNION ALL
SELECT t.id, '471', 'Comptes d''attente', 'actif' FROM public.tenants t
UNION ALL
SELECT t.id, '521', 'Banques', 'actif' FROM public.tenants t
UNION ALL
SELECT t.id, '571', 'Caisse', 'actif' FROM public.tenants t
UNION ALL
SELECT t.id, '601', 'Achats de marchandises', 'charge' FROM public.tenants t
UNION ALL
SELECT t.id, '611', 'Électricité', 'charge' FROM public.tenants t
UNION ALL
SELECT t.id, '612', 'Eau', 'charge' FROM public.tenants t
UNION ALL
SELECT t.id, '615', 'Entretien et réparations', 'charge' FROM public.tenants t
UNION ALL
SELECT t.id, '616', 'Loyers et charges locatives', 'charge' FROM public.tenants t
UNION ALL
SELECT t.id, '618', 'Autres services extérieurs', 'charge' FROM public.tenants t
UNION ALL
SELECT t.id, '621', 'Personnel extérieur', 'charge' FROM public.tenants t
UNION ALL
SELECT t.id, '661', 'Charges d''intérêts', 'charge' FROM public.tenants t
UNION ALL
SELECT t.id, '701', 'Ventes de produits finis', 'produit' FROM public.tenants t
UNION ALL
SELECT t.id, '771', 'Produits divers', 'produit' FROM public.tenants t;