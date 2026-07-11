-- Sub-Phase 6.1: Tests for RLS helper functions.
-- Basejump reference: Section 3.8

BEGIN;
SET LOCAL search_path = public, extensions;

SELECT plan(13);

-- ============================================================
-- Setup: three test users, one shared tenant with subscription
-- ============================================================

SELECT tests.create_supabase_user('helper-owner@example.com', '11111111-1111-1111-1111-111111111111'::uuid);
SELECT tests.create_supabase_user('helper-member@example.com', '22222222-2222-2222-2222-222222222222'::uuid);
SELECT tests.create_supabase_user('helper-other@example.com', '33333333-3333-3333-3333-333333333333'::uuid);

INSERT INTO public.tenants (id, name, subdomain, status, plan, owner_id)
VALUES (
  '44444444-4444-4444-4444-444444444444'::uuid,
  'Helper Test Tenant',
  'helper-test-tenant-6-1',
  'active',
  'free',
  '11111111-1111-1111-1111-111111111111'::uuid
);

INSERT INTO public.tenant_subscriptions (
  tenant_id, plan, status, plan_id, billing_period, billing_period_start, billing_period_end,
  expires_at, max_users, max_products, max_orders_per_month, current_month_orders, current_month_start, billing_status, updated_at
)
VALUES (
  '44444444-4444-4444-4444-444444444444'::uuid,
  'free', 'active', 'free', 'month',
  CURRENT_DATE,
  (CURRENT_DATE + INTERVAL '1 month')::DATE,
  (CURRENT_DATE + INTERVAL '1 month')::TIMESTAMPTZ,
  100, 100, 100, 0, CURRENT_DATE, 'ok', now()
);

INSERT INTO public.tenant_memberships (tenant_id, user_id, role, status, is_active, invited_at, accepted_at)
VALUES
  ('44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'owner', 'active', true, now(), now()),
  ('44444444-4444-4444-4444-444444444444'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'admin', 'active', true, now(), now());

-- Switch to the Supabase authenticated role so RLS policies are enforced.
SET LOCAL ROLE authenticated;

-- ============================================================
-- has_tenant_role()
-- ============================================================

SELECT tests.authenticate_as('11111111-1111-1111-1111-111111111111'::uuid);
SELECT is(
  public.has_tenant_role('44444444-4444-4444-4444-444444444444'::uuid, 'owner'),
  true,
  'has_tenant_role returns true for the owner role'
);
SELECT is(
  public.has_tenant_role('44444444-4444-4444-4444-444444444444'::uuid, 'admin'),
  false,
  'has_tenant_role returns false when owner is checked against admin role'
);

SELECT tests.authenticate_as('22222222-2222-2222-2222-222222222222'::uuid);
SELECT is(
  public.has_tenant_role('44444444-4444-4444-4444-444444444444'::uuid, 'admin'),
  true,
  'has_tenant_role returns true for an assigned admin role'
);
SELECT is(
  public.has_tenant_role('44444444-4444-4444-4444-444444444444'::uuid, 'owner'),
  false,
  'has_tenant_role returns false for non-owner member'
);

SELECT tests.authenticate_as('33333333-3333-3333-3333-333333333333'::uuid);
SELECT is(
  public.has_tenant_role('44444444-4444-4444-4444-444444444444'::uuid, 'admin'),
  false,
  'has_tenant_role returns false for a non-member'
);

-- ============================================================
-- get_tenants_for_user()
-- ============================================================

SELECT tests.authenticate_as('11111111-1111-1111-1111-111111111111'::uuid);
SELECT is(
  (SELECT count(*) FROM public.get_tenants_for_user() WHERE get_tenants_for_user = '44444444-4444-4444-4444-444444444444'::uuid),
  1::bigint,
  'get_tenants_for_user returns the owner tenant'
);
SELECT is(
  (SELECT count(*) FROM public.get_tenants_for_user('owner') WHERE get_tenants_for_user = '44444444-4444-4444-4444-444444444444'::uuid),
  1::bigint,
  'get_tenants_for_user(owner) returns the owner tenant'
);
SELECT is(
  (SELECT count(*) FROM public.get_tenants_for_user('admin') WHERE get_tenants_for_user = '44444444-4444-4444-4444-444444444444'::uuid),
  0::bigint,
  'get_tenants_for_user(admin) does not return an owner-only tenant'
);

SELECT tests.authenticate_as('22222222-2222-2222-2222-222222222222'::uuid);
SELECT is(
  (SELECT count(*) FROM public.get_tenants_for_user() WHERE get_tenants_for_user = '44444444-4444-4444-4444-444444444444'::uuid),
  1::bigint,
  'get_tenants_for_user returns the tenant where user is a member'
);
SELECT is(
  (SELECT count(*) FROM public.get_tenants_for_user('owner') WHERE get_tenants_for_user = '44444444-4444-4444-4444-444444444444'::uuid),
  0::bigint,
  'get_tenants_for_user(owner) excludes tenant where user is only an admin'
);

SELECT tests.authenticate_as('33333333-3333-3333-3333-333333333333'::uuid);
SELECT is(
  (SELECT count(*) FROM public.get_tenants_for_user() WHERE get_tenants_for_user = '44444444-4444-4444-4444-444444444444'::uuid),
  0::bigint,
  'get_tenants_for_user returns no tenants for an unrelated user'
);

-- ============================================================
-- is_tenant_owner()
-- ============================================================

SELECT tests.authenticate_as('11111111-1111-1111-1111-111111111111'::uuid);
SELECT is(
  public.is_tenant_owner('44444444-4444-4444-4444-444444444444'::uuid),
  true,
  'is_tenant_owner returns true for the tenant owner'
);

SELECT tests.authenticate_as('22222222-2222-2222-2222-222222222222'::uuid);
SELECT is(
  public.is_tenant_owner('44444444-4444-4444-4444-444444444444'::uuid),
  false,
  'is_tenant_owner returns false for a non-owner member'
);

SELECT * FROM finish();
ROLLBACK;
