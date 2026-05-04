
-- Categories table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon_url text,
  ordem integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Editors can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Editors can update categories" ON public.categories FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Editors can delete categories" ON public.categories FOR DELETE TO authenticated USING (has_role(auth.uid(), 'editor'::app_role));

-- Seed with current categories
INSERT INTO public.categories (name, ordem) VALUES
  ('GPT', 1),
  ('Automação', 2),
  ('Sistema', 3),
  ('Documento', 4),
  ('Arte', 5),
  ('Assistentes', 6);

-- Category icons storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('category-icons', 'category-icons', true);

CREATE POLICY "Anyone can read category icons" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'category-icons');
CREATE POLICY "Editors can upload category icons" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'category-icons' AND has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Editors can update category icons" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'category-icons' AND has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Editors can delete category icons" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'category-icons' AND has_role(auth.uid(), 'editor'::app_role));
