
-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  slug text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read companies" ON public.companies
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Editors can insert companies" ON public.companies
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors can update companies" ON public.companies
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors can delete companies" ON public.companies
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'editor'));

-- Add empresa_id to tools
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- Create company-logos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for company-logos
CREATE POLICY "Anyone can read company logos" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'company-logos');

CREATE POLICY "Editors can upload company logos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'company-logos' AND public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors can delete company logos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'company-logos' AND public.has_role(auth.uid(), 'editor'));
