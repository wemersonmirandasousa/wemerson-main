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