-- Sub-Phase 5.1: Role enum for tenant RBAC
-- Basejump reference: tenant_role enum
-- ponytail: idempotent DDL; keeps existing POS-specific roles (cashier, inventory_manager,
-- accountant) working by leaving tenant_memberships.role as text when incompatible values exist.

DO $$ BEGIN
  CREATE TYPE public.tenant_role AS ENUM ('owner', 'admin', 'member', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.tenant_memberships
  ADD COLUMN IF NOT EXISTS role public.tenant_role NOT NULL DEFAULT 'member';

-- Drop the old text CHECK constraint before attempting a type coercion; otherwise
-- the ALTER TYPE step fails comparing the enum column to text literals.
ALTER TABLE public.tenant_memberships
  DROP CONSTRAINT IF EXISTS tenant_memberships_role_check;

-- ponytail: only coerce an existing text/varchar role column to the enum when every value
-- already fits the enum. If the tenant has legacy POS roles, we keep text to avoid data loss.
DO $$
DECLARE
  v_col_type TEXT;
BEGIN
  SELECT data_type INTO v_col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'tenant_memberships'
    AND column_name = 'role';

  IF v_col_type = 'USER-DEFINED' THEN
    RETURN;
  END IF;

  IF v_col_type IN ('character varying', 'text') THEN
    IF EXISTS (
      SELECT 1
      FROM public.tenant_memberships
      WHERE role IS NOT NULL
        AND role NOT IN ('owner', 'admin', 'member', 'viewer')
    ) THEN
      RAISE NOTICE 'tenant_memberships.role contains non-enum values; leaving as text';
      RETURN;
    END IF;

    ALTER TABLE public.tenant_memberships
      ALTER COLUMN role TYPE public.tenant_role
      USING role::public.tenant_role;
  END IF;
END $$;
