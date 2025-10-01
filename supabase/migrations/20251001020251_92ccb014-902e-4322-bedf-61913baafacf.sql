-- Ajouter les colonnes campagne_id et campagne_phase à la table transactions
ALTER TABLE public.transactions 
ADD COLUMN campagne_id uuid REFERENCES public.campagnes(id),
ADD COLUMN campagne_phase text;

-- Créer la table pour les budgets prévisionnels par phase de campagne
CREATE TABLE public.campagne_phase_budgets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  campagne_id uuid NOT NULL REFERENCES public.campagnes(id) ON DELETE CASCADE,
  phase text NOT NULL,
  expense_type text NOT NULL,
  budgeted_amount numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(campagne_id, phase, expense_type)
);

-- Activer RLS sur la nouvelle table
ALTER TABLE public.campagne_phase_budgets ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour campagne_phase_budgets
CREATE POLICY "Users can view budgets in their tenant" 
ON public.campagne_phase_budgets 
FOR SELECT 
USING (tenant_id IN (
  SELECT tenant_id 
  FROM profiles 
  WHERE id = auth.uid()
));

CREATE POLICY "Users can manage budgets in their tenant" 
ON public.campagne_phase_budgets 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id 
  FROM profiles 
  WHERE id = auth.uid()
));

-- Trigger pour updated_at sur campagne_phase_budgets
CREATE TRIGGER update_campagne_phase_budgets_updated_at
BEFORE UPDATE ON public.campagne_phase_budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Créer un index pour améliorer les performances
CREATE INDEX idx_campagne_phase_budgets_campagne ON public.campagne_phase_budgets(campagne_id);
CREATE INDEX idx_transactions_campagne ON public.transactions(campagne_id, campagne_phase);