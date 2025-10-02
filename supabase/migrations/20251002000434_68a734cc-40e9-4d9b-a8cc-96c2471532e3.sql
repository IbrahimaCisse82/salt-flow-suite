-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true);

-- Create RLS policies for company logos bucket
CREATE POLICY "Public can view company logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-logos');

CREATE POLICY "Authenticated users can upload their company logo"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their company logo"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'company-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their company logo"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'company-logos' 
  AND auth.role() = 'authenticated'
);