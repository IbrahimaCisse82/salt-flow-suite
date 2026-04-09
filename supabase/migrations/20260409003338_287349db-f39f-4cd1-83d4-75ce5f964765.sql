
INSERT INTO public.profiles (id, email, full_name)
VALUES 
  ('fd4f5d37-02ed-46f5-8802-331e28cd16be', 'support@g-suiteapp.com', 'Demo'),
  ('4b641508-75f3-47e4-977c-12ffe06c0e43', 'mohamedelhabibndiaye@gmail.com', 'Mohamed El Habib Ndiaye')
ON CONFLICT (id) DO NOTHING;
