-- Restrict companies SELECT: hide access_password from anonymous users via a public view
-- Drop the old broad policy and create one for editors (full access) + use companies_public view for others
DROP POLICY IF EXISTS "Anyone can read companies" ON public.companies;

-- Editors can read full row (including access_password)
CREATE POLICY "Editors can read companies"
ON public.companies
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'editor'::app_role));

-- Note: companies_public view (without access_password) remains readable to anon/authenticated for filter dropdowns.

-- Tighten wechat_shares: add owner column + restrict SELECT/UPDATE to owner or editors
ALTER TABLE public.wechat_shares ADD COLUMN IF NOT EXISTS created_by uuid;

DROP POLICY IF EXISTS "Anyone can read non-expired wechat shares" ON public.wechat_shares;
DROP POLICY IF EXISTS "Authenticated can update wechat shares" ON public.wechat_shares;
DROP POLICY IF EXISTS "Authenticated can insert wechat shares" ON public.wechat_shares;

-- Only authenticated users can read their own non-expired shares (or editors can read all)
CREATE POLICY "Users read own wechat shares"
ON public.wechat_shares
FOR SELECT
TO authenticated
USING (
  expires_at > now()
  AND (created_by = auth.uid() OR has_role(auth.uid(), 'editor'::app_role))
);

-- Insert: must set created_by to self
CREATE POLICY "Authenticated insert own wechat shares"
ON public.wechat_shares
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Update: only owner or editors
CREATE POLICY "Owner or editor update wechat shares"
ON public.wechat_shares
FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR has_role(auth.uid(), 'editor'::app_role))
WITH CHECK (created_by = auth.uid() OR has_role(auth.uid(), 'editor'::app_role));