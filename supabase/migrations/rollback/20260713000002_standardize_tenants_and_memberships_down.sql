-- Sub-Phase 3.1 down: rollback standardize tenants/tenant_memberships
-- ponytail: revert role enum to the pre-Basejump set and drop added columns.
--          Owners become admins again because the original model relied on tenants.owner_id.

-- ============================================================
-- 1. Revert owner/viewer memberships back to admin
-- ============================================================

UPDATE public.tenant_memberships
SET role = 'admin'
WHERE role IN ('owner', 'viewer');

-- ============================================================
-- 2. Restore original tenant_memberships role check constraint
-- ============================================================

ALTER TABLE public.tenant_memberships
DROP CONSTRAINT IF EXISTS tenant_memberships_role_check;

ALTER TABLE public.tenant_memberships
ADD CONSTRAINT tenant_memberships_role_check
CHECK (role IN ('admin', 'cashier', 'inventory_manager', 'accountant'));

-- ============================================================
-- 3. Drop Basejump tracking columns from tenants
-- ============================================================

ALTER TABLE public.tenants
DROP COLUMN IF EXISTS created_by,
DROP COLUMN IF EXISTS updated_by,
DROP COLUMN IF EXISTS is_personal,
DROP COLUMN IF EXISTS slug;
