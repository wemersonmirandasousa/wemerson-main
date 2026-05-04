
-- Fix RLS policies: change from RESTRICTIVE to PERMISSIVE and allow anon read
DROP POLICY IF EXISTS "Authenticated users can read tools" ON public.tools;
DROP POLICY IF EXISTS "Editors can delete tools" ON public.tools;
DROP POLICY IF EXISTS "Editors can insert tools" ON public.tools;
DROP POLICY IF EXISTS "Editors can update tools" ON public.tools;

CREATE POLICY "Anyone can read tools" ON public.tools FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Editors can insert tools" ON public.tools FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Editors can update tools" ON public.tools FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Editors can delete tools" ON public.tools FOR DELETE TO authenticated USING (has_role(auth.uid(), 'editor'::app_role));

-- Fix knowledge_files policies
DROP POLICY IF EXISTS "Authenticated users can read knowledge files" ON public.knowledge_files;
DROP POLICY IF EXISTS "Editors can delete knowledge files" ON public.knowledge_files;
DROP POLICY IF EXISTS "Editors can insert knowledge files" ON public.knowledge_files;

CREATE POLICY "Anyone can read knowledge files" ON public.knowledge_files FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Editors can insert knowledge files" ON public.knowledge_files FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Editors can delete knowledge files" ON public.knowledge_files FOR DELETE TO authenticated USING (has_role(auth.uid(), 'editor'::app_role));

-- Add new columns to tools
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS link_contexto text;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS link_criacao_prompt text;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS link_gpt_criacao_prompt text;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS link_gpt_transformacao_contexto text;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS link_gpt_transformacao_base_conhecimento text;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS link_contexto_transformacao_base_conhecimento text;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS link_gpt_pronto text;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS funcao text;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS prompt_final text;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS categoria text;

-- Create social_cards table
CREATE TABLE IF NOT EXISTS public.social_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text DEFAULT '',
  button_label text DEFAULT '',
  url text DEFAULT '',
  icon text DEFAULT '',
  ordem int DEFAULT 0,
  ativo boolean DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_por uuid
);

ALTER TABLE public.social_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read social cards" ON public.social_cards FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Editors can insert social cards" ON public.social_cards FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Editors can update social cards" ON public.social_cards FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Editors can delete social cards" ON public.social_cards FOR DELETE TO authenticated USING (has_role(auth.uid(), 'editor'::app_role));

-- Insert default social cards
INSERT INTO public.social_cards (titulo, descricao, button_label, url, icon, ordem) VALUES
('WhatsApp', 'Conversa direta para projetos e automações.', 'Iniciar conversa', 'https://web.whatsapp.com/send?autoload=1&app_absent=0&phone=553898215816&text', 'whatsapp', 1),
('Instagram', 'Bastidores, insights e atualizações.', 'Acompanhar', 'https://www.instagram.com/wemerson.ofcw/#', 'instagram', 2),
('YouTube', 'Tutoriais e soluções na prática.', 'Assistir canal', 'https://www.youtube.com/@WEMERSONOFCW', 'youtube', 3);

-- Triggers
DROP TRIGGER IF EXISTS update_social_cards_updated_at ON public.social_cards;
CREATE TRIGGER update_social_cards_updated_at
  BEFORE UPDATE ON public.social_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tools_updated_at ON public.tools;
CREATE TRIGGER update_tools_updated_at
  BEFORE UPDATE ON public.tools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
