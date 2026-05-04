
-- Create departments table
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Anyone can read departments
CREATE POLICY "Anyone can read departments" ON public.departments FOR SELECT TO anon, authenticated USING (true);

-- Editors can manage departments
CREATE POLICY "Editors can insert departments" ON public.departments FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Editors can update departments" ON public.departments FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Editors can delete departments" ON public.departments FOR DELETE TO authenticated USING (has_role(auth.uid(), 'editor'::app_role));

-- Add access_password to companies (2-digit PIN)
ALTER TABLE public.companies ADD COLUMN access_password text DEFAULT NULL;
