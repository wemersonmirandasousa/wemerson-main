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