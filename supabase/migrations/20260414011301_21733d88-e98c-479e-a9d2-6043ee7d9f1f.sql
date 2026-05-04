
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
