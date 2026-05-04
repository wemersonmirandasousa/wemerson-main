
-- 1. Add origin tracking fields to tools table
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS origem text DEFAULT 'manual';
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS origem_detalhe text;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS imported_from_file_name text;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS version_number integer DEFAULT 1;

-- 2. Tool versions table for version history
CREATE TABLE public.tool_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  snapshot jsonb NOT NULL,
  changed_by uuid,
  changed_fields text[],
  change_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tool_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tool versions" ON public.tool_versions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Editors can insert tool versions" ON public.tool_versions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'editor'));
CREATE POLICY "Editors can delete tool versions" ON public.tool_versions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'editor'));

-- 3. Tool favorites table
CREATE TABLE public.tool_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tool_id)
);
ALTER TABLE public.tool_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own favorites" ON public.tool_favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.tool_favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.tool_favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Admin action logs table
CREATE TABLE public.admin_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  action_type text NOT NULL,
  target_type text NOT NULL DEFAULT 'tool',
  target_id uuid,
  target_name text,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Editors can read admin logs" ON public.admin_action_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'editor'));
CREATE POLICY "Editors can insert admin logs" ON public.admin_action_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'editor'));

-- 5. Update category names in the categories table
UPDATE public.categories SET name = 'GPT''s' WHERE name = 'GPT';
UPDATE public.categories SET name = 'Automações' WHERE name = 'Automação';
UPDATE public.categories SET name = 'Sistemas' WHERE name = 'Sistema';
UPDATE public.categories SET name = 'Documentos' WHERE name = 'Documento';
UPDATE public.categories SET name = 'Designs' WHERE name = 'Arte';

-- Insert DataBase's if not exists
INSERT INTO public.categories (name, ordem) 
SELECT 'DataBase''s', 7
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'DataBase''s');

-- Insert Assistentes if not exists
INSERT INTO public.categories (name, ordem) 
SELECT 'Assistentes', 6
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Assistentes');

-- 6. Update tools categoria to new names
UPDATE public.tools SET categoria = 'GPT''s' WHERE categoria = 'GPT';
UPDATE public.tools SET categoria = 'Automações' WHERE categoria = 'Automação';
UPDATE public.tools SET categoria = 'Sistemas' WHERE categoria = 'Sistema';
UPDATE public.tools SET categoria = 'Documentos' WHERE categoria = 'Documento';
UPDATE public.tools SET categoria = 'Designs' WHERE categoria = 'Arte';
