
ALTER TABLE public.tool_credentials
  ADD COLUMN IF NOT EXISTS credential_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS credential_anon_public text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS credential_publish_key text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS credential_secret_key text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS credential_service_role text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS credential_project_id text DEFAULT NULL;
