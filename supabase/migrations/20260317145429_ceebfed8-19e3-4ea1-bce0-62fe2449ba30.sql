
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
