
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
