-- Migration: 20260305125844_62d28220-8d39-44df-b3ee-6898a21619d5.sql


-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('editor', 'readonly');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS for user_roles: users can read their own roles
CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create tools table
CREATE TABLE public.tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  setores TEXT DEFAULT 'Todas as ferramentas',
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active',
  image_url TEXT,
  link_acesso_original TEXT,
  instrucoes TEXT DEFAULT '',
  quebra_gelos TEXT[] DEFAULT '{}',
  modelo_recomendado TEXT,
  recursos JSONB DEFAULT '{"webSearch": false, "appsBeta": false, "lousa": false, "imagens": false, "codeInterpreter": false}',
  acoes JSONB DEFAULT '[]',
  links_producao JSONB DEFAULT '{"gptDefinicaoPromptUrl": null, "gptDefinicaoBaseUrl": null, "chatDefinicaoContextoUrl": null, "chatDefinicaoPromptUrl": null}',
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  criado_por UUID REFERENCES auth.users(id),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_por UUID REFERENCES auth.users(id)
);

ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read tools
CREATE POLICY "Authenticated users can read tools"
ON public.tools
FOR SELECT
TO authenticated
USING (true);

-- Only editors can insert
CREATE POLICY "Editors can insert tools"
ON public.tools
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'editor'));

-- Only editors can update
CREATE POLICY "Editors can update tools"
ON public.tools
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'editor'));

-- Only editors can delete
CREATE POLICY "Editors can delete tools"
ON public.tools
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'editor'));

-- Create knowledge_files table
CREATE TABLE public.knowledge_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id),
  storage_path TEXT NOT NULL
);

ALTER TABLE public.knowledge_files ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read knowledge files
CREATE POLICY "Authenticated users can read knowledge files"
ON public.knowledge_files
FOR SELECT
TO authenticated
USING (true);

-- Only editors can insert
CREATE POLICY "Editors can insert knowledge files"
ON public.knowledge_files
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'editor'));

-- Only editors can delete
CREATE POLICY "Editors can delete knowledge files"
ON public.knowledge_files
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'editor'));

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tools_updated_at
BEFORE UPDATE ON public.tools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('tool-images', 'tool-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-files', 'knowledge-files', false);

-- Storage policies for tool-images (public read)
CREATE POLICY "Tool images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'tool-images');

CREATE POLICY "Editors can upload tool images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tool-images' AND public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors can update tool images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tool-images' AND public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors can delete tool images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tool-images' AND public.has_role(auth.uid(), 'editor'));

-- Storage policies for knowledge-files
CREATE POLICY "Authenticated users can download knowledge files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'knowledge-files');

CREATE POLICY "Editors can upload knowledge files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'knowledge-files' AND public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors can delete knowledge files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'knowledge-files' AND public.has_role(auth.uid(), 'editor'));


-- Migration: 20260307044145_f95d6069-8624-4fdd-b19c-162b97989ac3.sql


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


-- Migration: 20260309130141_be8a6a79-3dbc-4e02-8b15-8b0e32e060bc.sql


-- Add new columns to tools
ALTER TABLE public.tools 
  ADD COLUMN IF NOT EXISTS print_processo_url text,
  ADD COLUMN IF NOT EXISTS print_resultado_url text,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS tool_type text DEFAULT 'gpt',
  ADD COLUMN IF NOT EXISTS credential_email text,
  ADD COLUMN IF NOT EXISTS credential_senha text;

-- Create tool_blocks table for configurable blocks
CREATE TABLE IF NOT EXISTS public.tool_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  block_type text NOT NULL DEFAULT 'short_text',
  titulo text NOT NULL DEFAULT '',
  descricao text,
  conteudo text,
  ordem integer DEFAULT 0,
  aba text DEFAULT 'configurar',
  visibility_visitor boolean DEFAULT true,
  visibility_reader boolean DEFAULT true,
  visibility_editor boolean DEFAULT true,
  storage_path text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tool_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tool blocks" ON public.tool_blocks
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Editors can insert tool blocks" ON public.tool_blocks
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors can update tool blocks" ON public.tool_blocks
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors can delete tool blocks" ON public.tool_blocks
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'editor'));

-- Create tool_access_logs table for audit
CREATE TABLE IF NOT EXISTS public.tool_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  access_profile text NOT NULL DEFAULT 'visitante',
  user_id uuid,
  user_name text,
  ip_address text,
  user_agent text,
  device_name text,
  os_name text,
  browser_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tool_access_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert logs (even anonymous visitors)
CREATE POLICY "Anyone can insert access logs" ON public.tool_access_logs
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Only editors can read logs
CREATE POLICY "Editors can read access logs" ON public.tool_access_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'editor'));


-- Migration: 20260310140815_eb7302d7-b7b9-4238-8c9c-8a162f2a7200.sql


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


-- Migration: 20260317145429_ceebfed8-19e3-4ea1-bce0-62fe2449ba30.sql


-- 1. Create tool_credentials table
CREATE TABLE public.tool_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  credential_email text,
  credential_senha text,
  prompt_final text,
  UNIQUE(tool_id)
);

-- 2. Enable RLS
ALTER TABLE public.tool_credentials ENABLE ROW LEVEL SECURITY;

-- 3. Only editors can SELECT
CREATE POLICY "Editors can read tool credentials"
  ON public.tool_credentials FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'editor'::app_role));

-- 4. Only editors can INSERT
CREATE POLICY "Editors can insert tool credentials"
  ON public.tool_credentials FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'editor'::app_role));

-- 5. Only editors can UPDATE
CREATE POLICY "Editors can update tool credentials"
  ON public.tool_credentials FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'editor'::app_role));

-- 6. Only editors can DELETE
CREATE POLICY "Editors can delete tool credentials"
  ON public.tool_credentials FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'editor'::app_role));

-- 7. Migrate existing data
INSERT INTO public.tool_credentials (tool_id, credential_email, credential_senha, prompt_final)
SELECT id, credential_email, credential_senha, prompt_final
FROM public.tools
WHERE credential_email IS NOT NULL OR credential_senha IS NOT NULL OR prompt_final IS NOT NULL;

-- 8. Drop sensitive columns from tools table
ALTER TABLE public.tools DROP COLUMN credential_email;
ALTER TABLE public.tools DROP COLUMN credential_senha;
ALTER TABLE public.tools DROP COLUMN prompt_final;


-- Migration: 20260318132334_8ed89617-b7e6-45d8-abcf-a5143fd8fcee.sql


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


-- Migration: 20260323133200_0ce9bee3-d32e-487a-bc4a-927de55b967e.sql

DROP TRIGGER IF EXISTS update_tools_updated_at ON public.tools;

-- Migration: 20260324140852_46a4d157-30af-402c-8c19-fe15745e9018.sql


-- 1. Security-definer function to get prompt_final for any authenticated user
CREATE OR REPLACE FUNCTION public.get_tool_prompt(_tool_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT prompt_final
  FROM public.tool_credentials
  WHERE tool_id = _tool_id
  LIMIT 1
$$;

-- 2. Tool links junction table for Assistentes <-> Automações
CREATE TABLE IF NOT EXISTS public.tool_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  target_tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  link_type text NOT NULL DEFAULT 'depends_on',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_tool_id, target_tool_id)
);

ALTER TABLE public.tool_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tool links"
  ON public.tool_links FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Editors can insert tool links"
  ON public.tool_links FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors can update tool links"
  ON public.tool_links FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors can delete tool links"
  ON public.tool_links FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'editor'::app_role));


-- Migration: 20260325200637_cd9d23a4-3722-45e2-897f-35fa06263cd5.sql


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


-- Migration: 20260326122221_5b08b516-7cb3-4381-bb66-cae478eaad97.sql

-- site_settings table for wallpaper config
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Editors can insert site settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'editor'));
CREATE POLICY "Editors can update site settings" ON public.site_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'editor'));

-- Add image_url to social_cards
ALTER TABLE public.social_cards ADD COLUMN IF NOT EXISTS image_url text;

-- Create social-card-icons storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('social-card-icons', 'social-card-icons', true) ON CONFLICT DO NOTHING;

-- Create site-assets storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true) ON CONFLICT DO NOTHING;

-- Storage policies for social-card-icons
CREATE POLICY "Anyone can read social card icons" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'social-card-icons');
CREATE POLICY "Editors can upload social card icons" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'social-card-icons' AND has_role(auth.uid(), 'editor'));
CREATE POLICY "Editors can delete social card icons" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'social-card-icons' AND has_role(auth.uid(), 'editor'));

-- Storage policies for site-assets
CREATE POLICY "Anyone can read site assets" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'site-assets');
CREATE POLICY "Editors can upload site assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-assets' AND has_role(auth.uid(), 'editor'));
CREATE POLICY "Editors can delete site assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'editor'));

-- Seed initial wallpaper setting
INSERT INTO public.site_settings (key, value) VALUES ('wallpaper_url', null) ON CONFLICT DO NOTHING;

-- Migration: 20260326180739_add_icon_url_to_social_cards.sql

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'social_cards'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'social_cards'
        AND column_name = 'icon_url'
    ) THEN
      ALTER TABLE public.social_cards
      ADD COLUMN icon_url text;
    END IF;
  ELSE
    RAISE EXCEPTION 'Tabela public.social_cards não existe';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'social_cards'
ORDER BY ordinal_position;


-- Migration: 20260327175914_53e9ec97-8991-4e20-b53b-3d4a1abc6e60.sql

-- Add wallpaper_url to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS wallpaper_url text;

-- Create wechat_shares table
CREATE TABLE public.wechat_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL DEFAULT 'text',
  text_content text,
  file_url text,
  file_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.wechat_shares ENABLE ROW LEVEL SECURITY;

-- Anyone can insert
CREATE POLICY "Anyone can insert wechat shares"
  ON public.wechat_shares FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Anyone can read
CREATE POLICY "Anyone can read wechat shares"
  ON public.wechat_shares FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only editors can delete
CREATE POLICY "Editors can delete wechat shares"
  ON public.wechat_shares FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'editor'::app_role));

-- Migration: 20260331001802_140dd8d3-b5f8-444d-a1bd-05ceae7b0b25.sql


-- Allow anonymous uploads to wechat/ path in tool-images bucket
CREATE POLICY "Anyone can upload wechat files"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'tool-images' AND (storage.foldername(name))[1] = 'wechat');


-- Migration: 20260402052919_c913917a-5e47-4ba2-a51a-e97df21c1ccf.sql


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


-- Migration: 20260404212738_9724895a-9264-41e8-b5b0-81a6fb002282.sql


-- Notes table
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notes" ON public.notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Processes table
CREATE TABLE public.processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  setor text,
  description text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read processes" ON public.processes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Editors can manage processes" ON public.processes FOR ALL TO authenticated USING (has_role(auth.uid(), 'editor'::app_role)) WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

-- Process attachments table
CREATE TABLE public.process_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES public.processes(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);
ALTER TABLE public.process_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read process attachments" ON public.process_attachments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Editors can manage process attachments" ON public.process_attachments FOR ALL TO authenticated USING (has_role(auth.uid(), 'editor'::app_role)) WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

-- Process files storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('process-files', 'process-files', true);
CREATE POLICY "Anyone can read process files" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'process-files');
CREATE POLICY "Editors can upload process files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'process-files' AND has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Editors can delete process files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'process-files' AND has_role(auth.uid(), 'editor'::app_role));

-- Insert social cards for Notas and Processos
INSERT INTO public.social_cards (titulo, icon, url, descricao, ordem, ativo)
VALUES 
  ('Notas', 'notes', '#notes', 'Organize notas e copie com formatação preservada', 3, true),
  ('Processos', 'processos', '#processos', 'Armazene e consulte processos por setor', 4, true);


-- Migration: 20260408184622_b62af6a0-a02c-4cbe-bcb7-954b29baa97d.sql


-- 1. Create a secure view for companies that excludes access_password
CREATE OR REPLACE VIEW public.companies_public AS
SELECT id, name, slug, logo_url, wallpaper_url, created_at
FROM public.companies;

-- 2. Restrict tool_versions to authenticated users only
DROP POLICY IF EXISTS "Anyone can read tool versions" ON public.tool_versions;
CREATE POLICY "Authenticated can read tool versions"
ON public.tool_versions FOR SELECT TO authenticated
USING (true);

-- 3. Add expiry filter to wechat_shares SELECT policy
DROP POLICY IF EXISTS "Anyone can read wechat shares" ON public.wechat_shares;
CREATE POLICY "Anyone can read non-expired wechat shares"
ON public.wechat_shares FOR SELECT TO anon, authenticated
USING (expires_at > now());

-- 4. Restrict tool_access_logs INSERT to authenticated users only
DROP POLICY IF EXISTS "Anyone can insert access logs" ON public.tool_access_logs;
CREATE POLICY "Authenticated can insert access logs"
ON public.tool_access_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Add explicit deny write policies on user_roles (only service_role via edge function can write)
-- RLS is already enabled and no write policies exist, which means writes are blocked by default.
-- But let's be explicit: no authenticated user should be able to write directly.


-- Migration: 20260408184644_a19b8259-40df-4fe7-a21c-f537c1cc4c50.sql


DROP VIEW IF EXISTS public.companies_public;
CREATE VIEW public.companies_public
WITH (security_invoker = true) AS
SELECT id, name, slug, logo_url, wallpaper_url, created_at
FROM public.companies;


-- Migration: 20260409055007_610ea65c-e04d-4b25-840b-5fca17edcec3.sql

ALTER TABLE public.user_roles ADD COLUMN display_password text DEFAULT NULL;

-- Migration: 20260409213037_c993b976-3205-4938-9dd0-06446a622420.sql

ALTER TABLE public.wechat_shares ADD COLUMN shared_by_name text DEFAULT NULL;
ALTER TABLE public.wechat_shares ADD COLUMN device_info text DEFAULT NULL;

-- Migration: 20260409213353_b2371fbe-4b2e-4c98-96d3-c8715590b8f2.sql

ALTER TABLE public.wechat_shares ALTER COLUMN expires_at SET DEFAULT (now() + interval '7 days');

-- Migration: 20260411151751_5ef7a9f6-333e-4648-b310-3ea71c418832.sql

CREATE POLICY "Anyone can update wechat shares"
ON public.wechat_shares
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Migration: 20260413213910_0b204737-0d2d-44f3-8a29-ecaccd4d774e.sql


ALTER TABLE public.tool_credentials
  ADD COLUMN IF NOT EXISTS credential_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS credential_anon_public text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS credential_publish_key text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS credential_secret_key text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS credential_service_role text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS credential_project_id text DEFAULT NULL;


-- Migration: 20260413223436_fedfa8eb-cec5-4eb6-9f94-098a2c4fb019.sql

ALTER TABLE public.tool_credentials ADD COLUMN credential_api text DEFAULT NULL;

-- Migration: 20260414011153_68c222da-f736-4311-b4f1-5e0dbf7a9fb0.sql


-- Drop overly permissive policies on wechat_shares
DROP POLICY IF EXISTS "Anyone can insert wechat shares" ON public.wechat_shares;
DROP POLICY IF EXISTS "Anyone can update wechat shares" ON public.wechat_shares;

-- Recreate with authenticated-only access
CREATE POLICY "Authenticated can insert wechat shares"
ON public.wechat_shares
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update wechat shares"
ON public.wechat_shares
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);


-- Migration: 20260414011301_21733d88-e98c-479e-a9d2-6043ee7d9f1f.sql


-- 1. Fix site_settings: restrict SELECT to editors only
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
CREATE POLICY "Editors can read site settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'editor'::app_role));

-- 2. Fix user_roles: add INSERT/UPDATE/DELETE policies for editors only
CREATE POLICY "Editors can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors can update user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'editor'::app_role));

-- 3. Fix wechat storage: restrict upload to authenticated only
DROP POLICY IF EXISTS "Anyone can upload wechat files" ON storage.objects;
CREATE POLICY "Authenticated can upload wechat files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tool-images' AND (storage.foldername(name))[1] = 'wechat');


-- Migration: 20260417172050_f9ad8660-d598-4bc3-b407-bade2f077b6f.sql

-- Restrict companies SELECT: hide access_password from anonymous users via a public view
-- Drop the old broad policy and create one for editors (full access) + use companies_public view for others
DROP POLICY IF EXISTS "Anyone can read companies" ON public.companies;

-- Editors can read full row (including access_password)
CREATE POLICY "Editors can read companies"
ON public.companies
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'editor'::app_role));

-- Note: companies_public view (without access_password) remains readable to anon/authenticated for filter dropdowns.

-- Tighten wechat_shares: add owner column + restrict SELECT/UPDATE to owner or editors
ALTER TABLE public.wechat_shares ADD COLUMN IF NOT EXISTS created_by uuid;

DROP POLICY IF EXISTS "Anyone can read non-expired wechat shares" ON public.wechat_shares;
DROP POLICY IF EXISTS "Authenticated can update wechat shares" ON public.wechat_shares;
DROP POLICY IF EXISTS "Authenticated can insert wechat shares" ON public.wechat_shares;

-- Only authenticated users can read their own non-expired shares (or editors can read all)
CREATE POLICY "Users read own wechat shares"
ON public.wechat_shares
FOR SELECT
TO authenticated
USING (
  expires_at > now()
  AND (created_by = auth.uid() OR has_role(auth.uid(), 'editor'::app_role))
);

-- Insert: must set created_by to self
CREATE POLICY "Authenticated insert own wechat shares"
ON public.wechat_shares
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Update: only owner or editors
CREATE POLICY "Owner or editor update wechat shares"
ON public.wechat_shares
FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR has_role(auth.uid(), 'editor'::app_role))
WITH CHECK (created_by = auth.uid() OR has_role(auth.uid(), 'editor'::app_role));

-- Migration: 20260417172157_fd82302d-b08f-4cdf-bb67-3f5704f1d166.sql

-- Drop plaintext password column from user_roles (sensitive data should never be stored or readable)
ALTER TABLE public.user_roles DROP COLUMN IF EXISTS display_password;

-- Restrict knowledge_files SELECT to authenticated only
DROP POLICY IF EXISTS "Anyone can read knowledge files" ON public.knowledge_files;

CREATE POLICY "Authenticated can read knowledge files"
ON public.knowledge_files
FOR SELECT
TO authenticated
USING (true);

-- Migration: 20260417172401_0b4e7f69-2951-46ec-a460-d0c80c1233d2.sql

-- Revert restrictive policies on wechat_shares (ChatDocs is intentionally anonymous/public)
DROP POLICY IF EXISTS "Users read own wechat shares" ON public.wechat_shares;
DROP POLICY IF EXISTS "Authenticated insert own wechat shares" ON public.wechat_shares;
DROP POLICY IF EXISTS "Owner or editor update wechat shares" ON public.wechat_shares;

-- Drop the created_by column - it was added in the previous migration but ChatDocs doesn't use ownership
ALTER TABLE public.wechat_shares DROP COLUMN IF EXISTS created_by;

-- Anyone can read non-expired shares
CREATE POLICY "Anyone can read non-expired wechat shares"
ON public.wechat_shares
FOR SELECT
TO anon, authenticated
USING (expires_at > now());

-- Anyone can create a share
CREATE POLICY "Anyone can insert wechat shares"
ON public.wechat_shares
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Anyone can update (autosave of text content)
CREATE POLICY "Anyone can update wechat shares"
ON public.wechat_shares
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Restore anon upload to wechat/ folder of tool-images bucket
DROP POLICY IF EXISTS "Authenticated can upload wechat files" ON storage.objects;
CREATE POLICY "Anyone can upload wechat files"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'tool-images' AND (storage.foldername(name))[1] = 'wechat');

-- Migration: 20260420213334_930dfafa-a4d7-4288-843b-8ade74cbcdbd.sql


-- 1. Tabela para armazenar senhas em texto puro (visíveis no painel de gerenciamento)
-- AVISO: Esta tabela é intencionalmente texto puro a pedido do usuário para visualização administrativa.
CREATE TABLE IF NOT EXISTS public.user_passwords (
  user_id uuid PRIMARY KEY,
  password text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_passwords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Editors can read user passwords" ON public.user_passwords;
CREATE POLICY "Editors can read user passwords" ON public.user_passwords
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'editor'::app_role));

DROP POLICY IF EXISTS "Editors can manage user passwords" ON public.user_passwords;
CREATE POLICY "Editors can manage user passwords" ON public.user_passwords
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'editor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

-- 2. Adicionar coluna api_labels em tool_credentials para títulos customizados das APIs
ALTER TABLE public.tool_credentials
  ADD COLUMN IF NOT EXISTS api_labels jsonb DEFAULT '[]'::jsonb;

-- 3. Popular senha 000000 para os usuários conhecidos do anexo
INSERT INTO public.user_passwords (user_id, password)
SELECT id, '000000'
FROM auth.users
WHERE email IN (
  'diony@wemerson.app','thaina@wemerson.app','marlene@wemerson.app','mirela@wemerson.app',
  'anabeatriz@wemerson.app','analais@wemerson.app','eliane@wemerson.app','iury@wemerson.app',
  'paulo@wemerson.app','mariaantonia@wemerson.app','daniela@wemerson.app','leticia@wemerson.app',
  'fernanda@wemerson.app'
)
ON CONFLICT (user_id) DO NOTHING;


-- Migration: 20260422125833_f08f1faa-75bd-40c5-9dcb-3d22b205dfb2.sql

-- 1. Update 'Comunidade' (blue button) to become 'Notas'
UPDATE public.social_cards 
SET 
  titulo = 'Notas',
  url = '#notes',
  icon = 'notes',
  descricao = 'Minhas notas pessoais'
WHERE id = '534e3a96-ffc4-481e-9dbd-7df551503556';

-- 2. Remove old 'Notas' card
DELETE FROM public.social_cards 
WHERE id = 'db03cc2b-69b2-4cd6-9b4d-18b23de1702a';

-- 3. Remove 'Processos' card
DELETE FROM public.social_cards 
WHERE id = 'ef957cb5-5826-4cc1-b5a5-a75fdc2004a5';

-- 4. Rename 'Notas (ChatDocs)' to 'ChatDocs'
UPDATE public.social_cards 
SET 
  titulo = 'ChatDocs'
WHERE id = '5efa2ccd-4ace-423d-b583-55f40c829344';


-- Migration: 20260423174333_ef335b9a-a979-4b29-b18e-2374749ad07f.sql

ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS cor_cartao TEXT;

