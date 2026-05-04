
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
