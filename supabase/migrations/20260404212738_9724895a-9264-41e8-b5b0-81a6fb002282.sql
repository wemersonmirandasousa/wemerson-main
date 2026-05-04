
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
