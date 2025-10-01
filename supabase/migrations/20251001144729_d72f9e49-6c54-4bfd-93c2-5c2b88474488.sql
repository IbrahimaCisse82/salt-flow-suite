-- Créer un bucket pour les logos d'entreprise
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true);

-- Ajouter le champ logo_url à la table tenants
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS logo_url text;

-- Créer des politiques RLS pour le bucket company-logos
CREATE POLICY "Users can view company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

CREATE POLICY "Authenticated users can upload their company logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their company logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-logos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their company logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-logos' 
  AND auth.uid() IS NOT NULL
);