
DROP VIEW IF EXISTS public.companies_public;
CREATE VIEW public.companies_public
WITH (security_invoker = true) AS
SELECT id, name, slug, logo_url, wallpaper_url, created_at
FROM public.companies;
