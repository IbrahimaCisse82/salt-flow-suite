
-- Table des lignes budgétaires détaillées par phase et catégorie de dépense
CREATE TABLE public.campagne_budget_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campagne_id UUID NOT NULL REFERENCES public.campagnes(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  expense_category TEXT NOT NULL,
  budgeted_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(campagne_id, phase, expense_category)
);

ALTER TABLE public.campagne_budget_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budget lines for their tenant campagnes"
  ON public.campagne_budget_lines FOR SELECT
  USING (campagne_id IN (
    SELECT id FROM public.campagnes WHERE tenant_id = (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert budget lines for their tenant campagnes"
  ON public.campagne_budget_lines FOR INSERT
  WITH CHECK (campagne_id IN (
    SELECT id FROM public.campagnes WHERE tenant_id = (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can update budget lines for their tenant campagnes"
  ON public.campagne_budget_lines FOR UPDATE
  USING (campagne_id IN (
    SELECT id FROM public.campagnes WHERE tenant_id = (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete budget lines for their tenant campagnes"
  ON public.campagne_budget_lines FOR DELETE
  USING (campagne_id IN (
    SELECT id FROM public.campagnes WHERE tenant_id = (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

-- Ajouter les colonnes de lien budgétaire aux commandes d'achat
ALTER TABLE public.purchase_orders
  ADD COLUMN campagne_id UUID REFERENCES public.campagnes(id),
  ADD COLUMN campagne_phase TEXT,
  ADD COLUMN expense_category TEXT;
