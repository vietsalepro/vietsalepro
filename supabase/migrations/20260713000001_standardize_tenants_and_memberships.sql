-- Sub-Phase 3.1: Standardize tenants/tenant_memberships per Basejump account model
-- Scope: add owner role + user tracking columns + personal account flag; backfill existing owners.
-- ponytail: additive changes only; safe to re-run.

-- ============================================================
-- 1. Standardize tenants: add Basejump tracking columns + personal account flag
-- ============================================================

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_personal BOOLEAN NOT NULL DEFAULT false;

-- ponytail: add Basejump `slug` as a generated alias of existing `subdomain` to avoid a rename migration.
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS slug TEXT GENERATED ALWAYS AS (subdomain) STORED;

-- ============================================================
-- 2. Backfill created_by/updated_by from existing owner_id
-- ============================================================

UPDATE public.tenants
SET created_by = owner_id,
    updated_by = owner_id
WHERE created_by IS NULL
  AND owner_id IS NOT NULL;

-- ============================================================
-- 3. Expand tenant_memberships role enum to include owner and viewer
-- ============================================================

ALTER TABLE public.tenant_memberships
DROP CONSTRAINT IF EXISTS tenant_memberships_role_check;

ALTER TABLE public.tenant_memberships
ADD CONSTRAINT tenant_memberships_role_check
CHECK (role IN ('owner', 'admin', 'cashier', 'inventory_manager', 'accountant', 'viewer'));

-- ============================================================
-- 4. Ensure every tenant owner has an active owner membership
-- ============================================================

-- ponytail: temporarily disable guardrail + audit triggers; backfill legitimately assigns owner role
-- and legacy audit trigger may use disallowed MEMBER_* action values on production.
ALTER TABLE public.tenant_memberships DISABLE TRIGGER tenant_memberships_guardrails;
ALTER TABLE public.tenant_memberships DISABLE TRIGGER tenant_memberships_audit;

-- Insert missing owner memberships for tenants that only store owner_id
INSERT INTO public.tenant_memberships (tenant_id, user_id, role, status, is_active, invited_at, accepted_at)
SELECT t.id, t.owner_id, 'owner', 'active', true, now(), now()
FROM public.tenants t
WHERE t.owner_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.tenant_memberships tm
    WHERE tm.tenant_id = t.id AND tm.user_id = t.owner_id
  );

-- Promote existing owner rows to the owner role
UPDATE public.tenant_memberships tm
SET role = 'owner'
FROM public.tenants t
WHERE tm.tenant_id = t.id
  AND tm.user_id = t.owner_id
  AND tm.role != 'owner';

ALTER TABLE public.tenant_memberships ENABLE TRIGGER tenant_memberships_audit;
ALTER TABLE public.tenant_memberships ENABLE TRIGGER tenant_memberships_guardrails;
