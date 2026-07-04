-- Phase 2 isolation test
-- Run this in a transaction so it rolls back automatically.

BEGIN;

-- Use existing user IDs for the test
DO $$
DECLARE
  user_a UUID := '64d25af2-a592-4dd4-b1ff-365e7116e372';
  user_b UUID := '1271d9f5-a0c8-47f3-ace5-4ffa9cc8a82f';
  tenant_a UUID;
  tenant_b UUID;
  a_visible_count INTEGER;
  b_visible_count INTEGER;
BEGIN
  -- Create tenant A (owned by user A)
  INSERT INTO public.tenants (name, subdomain, owner_id)
  VALUES ('Tenant A', 'phase2-test-a', user_a)
  RETURNING id INTO tenant_a;

  -- Create tenant B (owned by user B)
  INSERT INTO public.tenants (name, subdomain, owner_id)
  VALUES ('Tenant B', 'phase2-test-b', user_b)
  RETURNING id INTO tenant_b;

  -- Add memberships
  INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
  VALUES (tenant_a, user_a, 'admin');

  INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
  VALUES (tenant_b, user_b, 'admin');

  -- Test helper functions
  RAISE NOTICE 'is_tenant_member(tenant_a, user_a) = %', public.is_tenant_member(tenant_a);
  RAISE NOTICE 'is_tenant_admin(tenant_a, user_a) = %', public.is_tenant_admin(tenant_a);
  RAISE NOTICE 'has_tenant_role(tenant_a, admin) = %', public.has_tenant_role(tenant_a, 'admin');
  RAISE NOTICE 'get_tenant_by_subdomain(phase2-test-a).name = %', (public.get_tenant_by_subdomain('phase2-test-a')).name;

  -- Test RLS visibility from user A's perspective
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user_a)::text, true);

  SELECT COUNT(*) INTO a_visible_count FROM public.tenants;
  RAISE NOTICE 'User A sees % tenants', a_visible_count;
  ASSERT a_visible_count = 1, 'User A should see exactly 1 tenant';

  -- Test RLS visibility from user B's perspective
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user_b)::text, true);
  SELECT COUNT(*) INTO b_visible_count FROM public.tenants;
  RAISE NOTICE 'User B sees % tenants', b_visible_count;
  ASSERT b_visible_count = 1, 'User B should see exactly 1 tenant';

  -- Verify they see different tenants
  ASSERT (SELECT COUNT(*) FROM public.tenants WHERE id = tenant_a) = 1, 'User B should not see tenant_a';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user_a)::text, true);
  ASSERT (SELECT COUNT(*) FROM public.tenants WHERE id = tenant_b) = 0, 'User A should not see tenant_b';

  RAISE NOTICE 'Phase 2 isolation test PASSED';
END $$;

ROLLBACK;
