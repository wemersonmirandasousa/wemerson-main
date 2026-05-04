
-- Drop overly permissive policies on wechat_shares
DROP POLICY IF EXISTS "Anyone can insert wechat shares" ON public.wechat_shares;
DROP POLICY IF EXISTS "Anyone can update wechat shares" ON public.wechat_shares;

-- Recreate with authenticated-only access
CREATE POLICY "Authenticated can insert wechat shares"
ON public.wechat_shares
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update wechat shares"
ON public.wechat_shares
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
