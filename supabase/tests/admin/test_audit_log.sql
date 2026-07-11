-- Sub-Phase 6.1: Tests for audit log triggers on admin-managed tables.
-- Basejump reference: Section 3.5 (audit triggers)

BEGIN;
SET LOCAL search_path = public, extensions;

SELECT plan(4);

-- ============================================================
-- Setup: system admin actor and one tenant to audit
-- ============================================================

SELECT tests.create_supabase_user('audit-admin@example.com', '41111111-1111-1111-1111-111111111111'::uuid);
INSERT INTO public.system_admins (user_id) VALUES ('41111111-1111-1111-1111-111111111111'::uuid);

SELECT tests.authenticate_as('41111111-1111-1111-1111-111111111111'::uuid);

INSERT INTO public.tenants (id, name, subdomain, status, plan, owner_id)
VALUES (
  '42222222-2222-2222-2222-222222222222'::uuid,
  'Audit Test Tenant',
  'audit-test-tenant-6-1',
  'active',
  'free',
  '41111111-1111-1111-1111-111111111111'::uuid
);


-- ============================================================
-- INSERT trigger
-- ============================================================

SELECT is(
  (SELECT count(*) FROM public.audit_log
   WHERE entity_type = 'tenants'
     AND entity_id = '42222222-2222-2222-2222-222222222222'::uuid
     AND action = 'INSERT'
     AND actor_id = '41111111-1111-1111-1111-111111111111'::uuid),
  1::bigint,
  'INSERT on tenants creates an audit log entry with the correct actor'
);

-- ============================================================
-- UPDATE trigger
-- ============================================================

UPDATE public.tenants
SET name = 'Audit Test Tenant Updated'
WHERE id = '42222222-2222-2222-2222-222222222222'::uuid;

SELECT is(
  (SELECT count(*) FROM public.audit_log
   WHERE entity_type = 'tenants'
     AND entity_id = '42222222-2222-2222-2222-222222222222'::uuid
     AND action = 'UPDATE'),
  1::bigint,
  'UPDATE on tenants creates an audit log entry'
);

-- ============================================================
-- DELETE trigger
-- ============================================================

DELETE FROM public.tenants WHERE id = '42222222-2222-2222-2222-222222222222'::uuid;

SELECT is(
  (SELECT count(*) FROM public.audit_log
   WHERE entity_type = 'tenants'
     AND entity_id = '42222222-2222-2222-2222-222222222222'::uuid
     AND action = 'DELETE'),
  1::bigint,
  'DELETE on tenants creates an audit log entry'
);

-- ============================================================
-- Actor correctness
-- ============================================================

SELECT is(
  (SELECT count(*) FROM public.audit_log
   WHERE entity_type = 'tenants'
     AND entity_id = '42222222-2222-2222-2222-222222222222'::uuid
     AND actor_id = '41111111-1111-1111-1111-111111111111'::uuid),
  3::bigint,
  'All audit log entries for the tenant reference the acting admin user'
);

SELECT * FROM finish();
ROLLBACK;
