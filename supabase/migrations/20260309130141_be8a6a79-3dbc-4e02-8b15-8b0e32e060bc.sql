
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
