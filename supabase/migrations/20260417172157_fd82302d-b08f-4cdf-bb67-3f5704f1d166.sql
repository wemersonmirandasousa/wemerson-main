-- Drop plaintext password column from user_roles (sensitive data should never be stored or readable)
ALTER TABLE public.user_roles DROP COLUMN IF EXISTS display_password;

-- Restrict knowledge_files SELECT to authenticated only
DROP POLICY IF EXISTS "Anyone can read knowledge files" ON public.knowledge_files;

CREATE POLICY "Authenticated can read knowledge files"
ON public.knowledge_files
FOR SELECT
TO authenticated
USING (true);