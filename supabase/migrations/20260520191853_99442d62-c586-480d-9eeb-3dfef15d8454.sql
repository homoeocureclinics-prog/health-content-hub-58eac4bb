
-- 1. Private secrets table for OAuth tokens (no policies = client cannot access; service role bypasses RLS)
CREATE TABLE IF NOT EXISTS public.social_account_secrets (
  social_account_id uuid PRIMARY KEY REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_account_secrets ENABLE ROW LEVEL SECURITY;
-- intentionally NO policies: only service_role (which bypasses RLS) can read/write

-- Move any existing token data over
INSERT INTO public.social_account_secrets (social_account_id, user_id, access_token, refresh_token, token_expires_at, scopes)
SELECT id, user_id, access_token, refresh_token, token_expires_at, scopes
FROM public.social_accounts
WHERE access_token IS NOT NULL OR refresh_token IS NOT NULL
ON CONFLICT (social_account_id) DO NOTHING;

-- Drop sensitive columns from the client-readable table
ALTER TABLE public.social_accounts
  DROP COLUMN IF EXISTS access_token,
  DROP COLUMN IF EXISTS refresh_token,
  DROP COLUMN IF EXISTS token_expires_at,
  DROP COLUMN IF EXISTS scopes;

-- 2. user_roles: admin-only writes to prevent privilege escalation
CREATE POLICY "Admins insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. profiles: allow owner self-deletion
CREATE POLICY "Users delete own profile" ON public.profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- 4. analytics_snapshots: owner can insert/update/delete their own rows
CREATE POLICY "Own analytics insert" ON public.analytics_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own analytics update" ON public.analytics_snapshots
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own analytics delete" ON public.analytics_snapshots
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 5. publish_logs: owner can insert their own log entries
CREATE POLICY "Own logs insert" ON public.publish_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
