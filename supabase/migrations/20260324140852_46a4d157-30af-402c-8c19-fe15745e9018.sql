
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
