-- Sub-Phase 6.1: Tests for billing functions and subscription lifecycle.
-- Basejump reference: Section 3.6 / 3.7

BEGIN;
SET LOCAL search_path = public, extensions;

SELECT plan(8);

-- ============================================================
-- Setup: system admin + a tenant with a subscription
-- ============================================================

SELECT tests.create_supabase_user('billing-admin@example.com', '31111111-1111-1111-1111-111111111111'::uuid);
INSERT INTO public.system_admins (user_id) VALUES ('31111111-1111-1111-1111-111111111111'::uuid);

SELECT tests.create_supabase_user('billing-tenant-owner@example.com', '32222222-2222-2222-2222-222222222222'::uuid);

INSERT INTO public.tenants (id, name, subdomain, status, plan, owner_id)
VALUES ('53333333-3333-3333-3333-333333333333'::uuid, 'Billing Test Tenant', 'billing-test-tenant-6-1', 'active', 'vip', '32222222-2222-2222-2222-222222222222'::uuid);

INSERT INTO public.tenant_subscriptions (
  tenant_id,
  plan,
  status,
  plan_id,
  billing_period,
  billing_period_start,
  billing_period_end,
  expires_at,
  max_users,
  max_products,
  max_orders_per_month,
  current_month_orders,
  current_month_start,
  billing_status,
  updated_at
)
VALUES (
  '53333333-3333-3333-3333-333333333333'::uuid,
  'vip', 'active', 'vip', 'month',
  CURRENT_DATE,
  (CURRENT_DATE + INTERVAL '1 month')::DATE,
  (CURRENT_DATE + INTERVAL '1 month')::TIMESTAMPTZ,
  100, 100, 100, 0, CURRENT_DATE, 'ok', now()
);

-- Switch to the Supabase authenticated role so is_system_admin() is checked normally.
SET LOCAL ROLE authenticated;

-- ============================================================
-- create_invoice() lifecycle
-- ============================================================

SELECT tests.authenticate_as('31111111-1111-1111-1111-111111111111'::uuid);

SELECT is(
  (SELECT status FROM public.create_invoice(
    '53333333-3333-3333-3333-333333333333'::uuid,
    'monthly',
    1,
    0,
    'Billing test invoice'
  )),
  'open',
  'create_invoice produces an open invoice'
);

SELECT is(
  (SELECT total FROM public.invoices
   WHERE tenant_id = '53333333-3333-3333-3333-333333333333'::uuid
     AND notes = 'Billing test invoice'),
  69000::NUMERIC,
  'Monthly VIP invoice total equals the plan monthly price'
);

-- ============================================================
-- confirm_payment() lifecycle transition open -> paid
-- ============================================================

SELECT is(
  (SELECT status FROM public.confirm_payment(
    (SELECT id FROM public.invoices
     WHERE tenant_id = '53333333-3333-3333-3333-333333333333'::uuid
       AND notes = 'Billing test invoice')
  )),
  'confirmed',
  'confirm_payment returns a confirmed payment record'
);

SELECT is(
  (SELECT status FROM public.invoices
   WHERE tenant_id = '53333333-3333-3333-3333-333333333333'::uuid
     AND notes = 'Billing test invoice'),
  'paid',
  'Invoice status transitions to paid after confirm_payment'
);

SELECT is(
  (SELECT status FROM public.tenant_subscriptions
   WHERE tenant_id = '53333333-3333-3333-3333-333333333333'::uuid),
  'active',
  'Subscription status stays active after payment confirmation'
);

SELECT is(
  (SELECT expires_at::DATE >= (CURRENT_DATE + INTERVAL '1 month')::DATE FROM public.tenant_subscriptions
   WHERE tenant_id = '53333333-3333-3333-3333-333333333333'::uuid),
  true,
  'Subscription expiry extends to the invoice period end'
);

-- ============================================================
-- can_use_feature() gating
-- ============================================================

-- No plan_features row => feature allowed.
SELECT is(
  public.can_use_feature('53333333-3333-3333-3333-333333333333'::uuid, 'magic_feature', 0),
  true,
  'can_use_feature returns true when no gating row exists'
);

-- plan_features has RLS enabled; insert the gating row as the postgres runner.
SET LOCAL ROLE postgres;
INSERT INTO public.plan_features (plan_id, feature_key, enabled)
VALUES ('vip', 'magic_feature', false);
SET LOCAL ROLE authenticated;

SELECT is(
  public.can_use_feature('53333333-3333-3333-3333-333333333333'::uuid, 'magic_feature', 0),
  false,
  'can_use_feature returns false for a disabled feature'
);

SELECT * FROM finish();
ROLLBACK;
