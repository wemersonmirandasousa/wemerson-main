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