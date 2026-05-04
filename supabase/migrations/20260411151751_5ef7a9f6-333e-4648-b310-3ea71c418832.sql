CREATE POLICY "Anyone can update wechat shares"
ON public.wechat_shares
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);