-- Sub-Phase 6.1: Tests for tenants / tenant_memberships RLS policies.
-- Basejump reference: Section 3.3

BEGIN;
SET LOCAL search_path = public, extensions;

SELECT plan(7);

-- ============================================================
-- Setup: three users and two tenants with subscriptions
-- ============================================================

SELECT tests.create_supabase_user('rls-owner@example.com', '21111111-1111-1111-1111-111111111111'::uuid);
SELECT tests.create_supabase_user('rls-member@example.com', '22222222-2222-2222-2222-222222222222'::uuid);
SELECT tests.create_supabase_user('rls-other@example.com', '23333333-3333-3333-3333-333333333333'::uuid);

-- Tenant A: owned by owner, member has admin role.
INSERT INTO public.tenants (id, name, subdomain, status, plan, owner_id)
VALUES ('55555555-5555-5555-5555-555555555555'::uuid, 'RLS Test Tenant A', 'rls-test-tenant-a-6-1', 'active', 'free', '21111111-1111-1111-1111-111111111111'::uuid);

INSERT INTO public.tenant_subscriptions (
  tenant_id, plan, status, plan_id, billing_period, billing_period_start, billing_period_end,
  expires_at, max_users, max_products, max_orders_per_month, current_month_orders, current_month_start, billing_status, updated_at
)
VALUES (
  '55555555-5555-5555-5555-555555555555'::uuid, 'free', 'active', 'free', 'month',
  CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 month')::DATE,
  (CURRENT_DATE + INTERVAL '1 month')::TIMESTAMPTZ,
  100, 100, 100, 0, CURRENT_DATE, 'ok', now()
);

INSERT INTO public.tenant_memberships (tenant_id, user_id, role, status, is_active, invited_at, accepted_at)
VALUES
  ('55555555-5555-5555-5555-555555555555'::uuid, '21111111-1111-1111-1111-111111111111'::uuid, 'owner', 'active', true, now(), now()),
  ('55555555-5555-5555-5555-555555555555'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'viewer', 'active', true, now(), now());

-- Tenant E: owned by other, member has admin role (used for the member-delete test).
INSERT INTO public.tenants (id, name, subdomain, status, plan, owner_id)
VALUES ('56666666-6666-6666-6666-666666666666'::uuid, 'RLS Test Tenant E', 'rls-test-tenant-e-6-1', 'active', 'free', '23333333-3333-3333-3333-333333333333'::uuid);

INSERT INTO public.tenant_subscriptions (
  tenant_id, plan, status, plan_id, billing_period, billing_period_start, billing_period_end,
  expires_at, max_users, max_products, max_orders_per_month, current_month_orders, current_month_start, billing_status, updated_at
)
VALUES (
  '56666666-6666-6666-6666-666666666666'::uuid, 'free', 'active', 'free', 'month',
  CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 month')::DATE,
  (CURRENT_DATE + INTERVAL '1 month')::TIMESTAMPTZ,
  100, 100, 100, 0, CURRENT_DATE, 'ok', now()
);

INSERT INTO public.tenant_memberships (tenant_id, user_id, role, status, is_active, invited_at, accepted_at)
VALUES
  ('56666666-6666-6666-6666-666666666666'::uuid, '23333333-3333-3333-3333-333333333333'::uuid, 'owner', 'active', true, now(), now()),
  ('56666666-6666-6666-6666-666666666666'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'admin', 'active', true, now(), now());

-- Switch to the Supabase authenticated role so RLS policies are enforced.
SET LOCAL ROLE authenticated;

-- ============================================================
-- SELECT policy on tenants
-- ============================================================

SELECT tests.authenticate_as('21111111-1111-1111-1111-111111111111'::uuid);
SELECT is(
  (SELECT count(*) FROM public.tenants WHERE id = '55555555-5555-5555-5555-555555555555'::uuid),
  1::bigint,
  'Owner can SELECT their tenant'
);

SELECT tests.authenticate_as('22222222-2222-2222-2222-222222222222'::uuid);
SELECT is(
  (SELECT count(*) FROM public.tenants WHERE id = '55555555-5555-5555-5555-555555555555'::uuid),
  1::bigint,
  'Member can SELECT their tenant'
);

SELECT tests.authenticate_as('23333333-3333-3333-3333-333333333333'::uuid);
SELECT is(
  (SELECT count(*) FROM public.tenants WHERE id = '55555555-5555-5555-5555-555555555555'::uuid),
  0::bigint,
  'Non-member cannot SELECT unrelated tenant'
);

-- ============================================================
-- UPDATE policy on tenants
-- ============================================================

SELECT tests.authenticate_as('21111111-1111-1111-1111-111111111111'::uuid);
UPDATE public.tenants
SET name = 'Owner Updated'
WHERE id = '55555555-5555-5555-5555-555555555555'::uuid;
SELECT is(
  (SELECT count(*) FROM public.tenants WHERE id = '55555555-5555-5555-5555-555555555555'::uuid AND name = 'Owner Updated'),
  1::bigint,
  'Owner can UPDATE their tenant'
);

SELECT tests.authenticate_as('22222222-2222-2222-2222-222222222222'::uuid);
UPDATE public.tenants
SET name = 'Member Updated'
WHERE id = '55555555-5555-5555-5555-555555555555'::uuid;
SELECT is(
  (SELECT count(*) FROM public.tenants WHERE id = '55555555-5555-5555-5555-555555555555'::uuid AND name = 'Member Updated'),
  0::bigint,
  'Member cannot UPDATE an owner-only tenant'
);

-- ============================================================
-- DELETE policy on tenants
-- ============================================================

SELECT tests.authenticate_as('21111111-1111-1111-1111-111111111111'::uuid);
DELETE FROM public.tenants WHERE id = '55555555-5555-5555-5555-555555555555'::uuid;
SELECT is(
  (SELECT count(*) FROM public.tenants WHERE id = '55555555-5555-5555-5555-555555555555'::uuid),
  0::bigint,
  'Owner can DELETE their tenant'
);

SELECT tests.authenticate_as('22222222-2222-2222-2222-222222222222'::uuid);
DELETE FROM public.tenants WHERE id = '56666666-6666-6666-6666-666666666666'::uuid;
SELECT is(
  (SELECT count(*) FROM public.tenants WHERE id = '56666666-6666-6666-6666-666666666666'::uuid),
  1::bigint,
  'Member cannot DELETE a tenant they do not own'
);

SELECT * FROM finish();
ROLLBACK;
