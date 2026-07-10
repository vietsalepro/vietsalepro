-- Add tenant_credentials table to store initial admin login info for system admin lookup.
-- ponytail: separated from public.tenants so tenant members cannot read the admin password via RLS.
-- Security ceiling: passwords are stored in plaintext so the system admin can provide them to users.
-- Upgrade path: remove admin_initial_password and provide a "reset + email new password" workflow instead.

CREATE TABLE IF NOT EXISTS public.tenant_credentials (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  admin_email TEXT NOT NULL,
  admin_initial_password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tenant_credentials ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tenant_credentials' AND policyname = 'tenant_credentials_system_admin_only'
  ) THEN
    CREATE POLICY "tenant_credentials_system_admin_only"
      ON public.tenant_credentials
      FOR ALL
      TO authenticated
      USING (public.is_system_admin())
      WITH CHECK (public.is_system_admin());
  END IF;
END
$$;
