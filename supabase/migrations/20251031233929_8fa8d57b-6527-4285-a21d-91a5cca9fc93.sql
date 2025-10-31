-- Table pour les tests qualité
CREATE TABLE public.quality_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  production_record_id UUID REFERENCES public.production_records(id) ON DELETE CASCADE,
  test_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tested_by UUID REFERENCES public.profiles(id),
  
  -- Paramètres de qualité
  humidity_level NUMERIC,
  salt_purity NUMERIC,
  grain_size TEXT,
  color_grade TEXT,
  impurities_level NUMERIC,
  
  -- Résultats
  quality_status TEXT NOT NULL DEFAULT 'pending' CHECK (quality_status IN ('pending', 'passed', 'failed', 'conditional')),
  quality_score NUMERIC CHECK (quality_score >= 0 AND quality_score <= 100),
  
  -- Observations
  notes TEXT,
  corrective_actions TEXT,
  
  -- Traçabilité
  batch_number TEXT,
  certificate_number TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index
CREATE INDEX idx_quality_tests_tenant ON public.quality_tests(tenant_id);
CREATE INDEX idx_quality_tests_production ON public.quality_tests(production_record_id);
CREATE INDEX idx_quality_tests_batch ON public.quality_tests(batch_number);

-- RLS
ALTER TABLE public.quality_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quality tests"
  ON public.quality_tests FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Production staff can create quality tests"
  ON public.quality_tests FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'production')
  );

CREATE POLICY "Managers can update quality tests"
  ON public.quality_tests FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND get_user_role(auth.uid()) IN ('admin', 'gerant')
  );

CREATE POLICY "Managers can delete quality tests"
  ON public.quality_tests FOR DELETE
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND get_user_role(auth.uid()) IN ('admin', 'gerant')
  );

-- Trigger pour updated_at
CREATE TRIGGER update_quality_tests_updated_at
  BEFORE UPDATE ON public.quality_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table pour les certificats qualité
CREATE TABLE public.quality_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  certificate_number TEXT UNIQUE NOT NULL,
  production_record_id UUID REFERENCES public.production_records(id),
  quality_test_id UUID REFERENCES public.quality_tests(id),
  
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  issued_by UUID REFERENCES public.profiles(id),
  
  certificate_type TEXT NOT NULL DEFAULT 'quality' CHECK (certificate_type IN ('quality', 'organic', 'export', 'halal')),
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'expired', 'revoked')),
  
  -- Détails du certificat
  batch_number TEXT,
  quantity_certified NUMERIC,
  quality_grade TEXT,
  
  notes TEXT,
  document_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index
CREATE INDEX idx_quality_certificates_tenant ON public.quality_certificates(tenant_id);
CREATE INDEX idx_quality_certificates_production ON public.quality_certificates(production_record_id);
CREATE INDEX idx_quality_certificates_number ON public.quality_certificates(certificate_number);

-- RLS
ALTER TABLE public.quality_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quality certificates"
  ON public.quality_certificates FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Managers can create quality certificates"
  ON public.quality_certificates FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND get_user_role(auth.uid()) IN ('admin', 'gerant')
  );

CREATE POLICY "Managers can update quality certificates"
  ON public.quality_certificates FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND get_user_role(auth.uid()) IN ('admin', 'gerant')
  );

CREATE POLICY "Managers can delete quality certificates"
  ON public.quality_certificates FOR DELETE
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND get_user_role(auth.uid()) IN ('admin', 'gerant')
  );

-- Trigger pour updated_at
CREATE TRIGGER update_quality_certificates_updated_at
  BEFORE UPDATE ON public.quality_certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Ajouter batch_number à production_records pour traçabilité
ALTER TABLE public.production_records 
ADD COLUMN IF NOT EXISTS batch_number TEXT,
ADD COLUMN IF NOT EXISTS traceability_code TEXT;

-- Index pour traçabilité
CREATE INDEX IF NOT EXISTS idx_production_records_batch ON public.production_records(batch_number);
CREATE INDEX IF NOT EXISTS idx_production_records_traceability ON public.production_records(traceability_code);

-- Ajouter référence traçabilité aux ventes
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS batch_number TEXT,
ADD COLUMN IF NOT EXISTS traceability_code TEXT,
ADD COLUMN IF NOT EXISTS quality_certificate_id UUID REFERENCES public.quality_certificates(id);

-- Index
CREATE INDEX IF NOT EXISTS idx_sales_batch ON public.sales(batch_number);
CREATE INDEX IF NOT EXISTS idx_sales_traceability ON public.sales(traceability_code);
CREATE INDEX IF NOT EXISTS idx_sales_certificate ON public.sales(quality_certificate_id);