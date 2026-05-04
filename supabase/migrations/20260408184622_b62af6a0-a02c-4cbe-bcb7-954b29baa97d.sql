
-- 1. Create a secure view for companies that excludes access_password
CREATE OR REPLACE VIEW public.companies_public AS
SELECT id, name, slug, logo_url, wallpaper_url, created_at
FROM public.companies;

-- 2. Restrict tool_versions to authenticated users only
DROP POLICY IF EXISTS "Anyone can read tool versions" ON public.tool_versions;
CREATE POLICY "Authenticated can read tool versions"
ON public.tool_versions FOR SELECT TO authenticated
USING (true);

-- 3. Add expiry filter to wechat_shares SELECT policy
DROP POLICY IF EXISTS "Anyone can read wechat shares" ON public.wechat_shares;
CREATE POLICY "Anyone can read non-expired wechat shares"
ON public.wechat_shares FOR SELECT TO anon, authenticated
USING (expires_at > now());

-- 4. Restrict tool_access_logs INSERT to authenticated users only
DROP POLICY IF EXISTS "Anyone can insert access logs" ON public.tool_access_logs;
CREATE POLICY "Authenticated can insert access logs"
ON public.tool_access_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Add explicit deny write policies on user_roles (only service_role via edge function can write)
-- RLS is already enabled and no write policies exist, which means writes are blocked by default.
-- But let's be explicit: no authenticated user should be able to write directly.
