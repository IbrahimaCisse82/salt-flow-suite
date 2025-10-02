-- Create expense_types table to manage campaign expense categories
CREATE TABLE public.expense_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  syscohada_category TEXT NOT NULL,
  account_number TEXT,
  account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  observations TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expense_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view expense types in their tenant"
ON public.expense_types
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Managers can manage expense types"
ON public.expense_types
FOR ALL
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'gerant'::text]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'gerant'::text]));

-- Create trigger for updated_at
CREATE TRIGGER update_expense_types_updated_at
BEFORE UPDATE ON public.expense_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default expense types based on the provided table
INSERT INTO public.expense_types (name, syscohada_category, account_number, observations) VALUES
('Frais journaliers', 'Charges externes', '61', 'Indemnités / missions'),
('Frais employés contractants', 'Charges de personnel', '64', 'Salaires et charges sociales'),
('Carburant', 'Charges externes', '611', 'Consommables carburant'),
('Motopompes', 'Immobilisations corporelles', '2421', 'Matériel durable'),
('Machines de broyage', 'Immobilisations corporelles', '2411', 'Équipement de production'),
('Machine de lavage', 'Immobilisations corporelles', '2411', 'Équipement industriel'),
('Machine d''iodation', 'Immobilisations corporelles', '2411', 'Équipement spécialisé'),
('Matériel de création de digues', 'Immobilisations corporelles', '2334', 'Aménagements permanents'),
('EPI', 'Charges externes', '332', 'Consommables de sécurité'),
('Repas', 'Charges externes', '61', 'Restauration'),
('Transport', 'Charges externes', '613', 'Déplacements'),
('Téléphone', 'Charges externes', '616', 'Appels, abonnements'),
('Tracteurs', 'Immobilisations corporelles', '2421', 'Matériel amortissable'),
('Pelles', 'Immobilisations corporelles', '2422', 'Selon valeur et durabilité'),
('Brouettes', 'Immobilisations corporelles', '2422', 'Selon seuil d''immobilisation'),
('Sacs', 'Charges externes', '3351', 'Consommables'),
('Balance', 'Immobilisations corporelles', '2412', 'Matériel de pesée'),
('Testeur', 'Immobilisations corporelles', '2412', 'Appareil de mesure'),
('Location de marais salants', 'Charges externes', '616', 'Dépense de location'),
('Achat de marais salants', 'Immobilisations corporelles', '2211', 'Terrain non amortissable'),
('Frais de maintenance', 'Charges externes', '615', 'Pour machines, véhicules'),
('Voyage', 'Charges externes', '618', 'Billets, hôtels'),
('Foire et atelier', 'Charges externes', '618', 'Salons, expositions'),
('Communication et marketing', 'Charges externes', '618', 'Campagnes médias'),
('Fournitures de bureau', 'Charges externes', '334', 'Consommables'),
('Matériel informatique', 'Immobilisations corporelles', '2442', 'Ordinateurs, imprimantes'),
('Camion', 'Immobilisations corporelles', '2451', 'Véhicule amortissable'),
('Électricité', 'Charges externes', '611', 'Dépenses récurrentes'),
('Eau', 'Charges externes', '612', 'Dépenses récurrentes'),
('Internet', 'Charges externes', '616', 'Abonnement internet'),
('Mobilier de bureau', 'Immobilisations corporelles', '2444', 'Tables, chaises, armoires'),
('Location bureau', 'Charges externes', '616', 'Location d''immeuble / local');