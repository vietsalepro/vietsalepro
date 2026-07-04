-- Phase 2 helper function test
-- Run this in a transaction so it rolls back automatically.

BEGIN;

DO $$
DECLARE
  user_a UUID := '64d25af2-a592-4dd4-b1ff-365e7116e372';
  user_b UUID := '1271d9f5-a0c8-47f3-ace5-4ffa9cc8a82f';
  tenant_a UUID;
  tenant_b UUID;
BEGIN
  -- Create tenant A and B
  INSERT INTO public.tenants (name, subdomain, owner_id)
  VALUES ('Tenant A', 'phase2-test-a', user_a)
  RETURNING id INTO tenant_a;

  INSERT INTO public.tenants (name, subdomain, owner_id)
  VALUES ('Tenant B', 'phase2-test-b', user_b)
  RETURNING id INTO tenant_b;

  INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
  VALUES (tenant_a, user_a, 'admin');

  INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
  VALUES (tenant_b, user_b, 'admin');

  -- Set auth context as user A
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user_a)::text, true);

  RAISE NOTICE 'is_tenant_member(tenant_a) = %', public.is_tenant_member(tenant_a);
  RAISE NOTICE 'is_tenant_member(tenant_b) = %', public.is_tenant_member(tenant_b);
  RAISE NOTICE 'is_tenant_admin(tenant_a) = %', public.is_tenant_admin(tenant_a);
  RAISE NOTICE 'is_tenant_admin(tenant_b) = %', public.is_tenant_admin(tenant_b);
  RAISE NOTICE 'has_tenant_role(tenant_a, admin) = %', public.has_tenant_role(tenant_a, 'admin');
  RAISE NOTICE 'has_tenant_role(tenant_b, admin) = %', public.has_tenant_role(tenant_b, 'admin');
  RAISE NOTICE 'is_system_admin() = %', public.is_system_admin();
  RAISE NOTICE 'get_tenant_by_subdomain(phase2-test-a).name = %', (public.get_tenant_by_subdomain('phase2-test-a')).name;

  ASSERT public.is_tenant_member(tenant_a) = true, 'User A should be member of tenant A';
  ASSERT public.is_tenant_member(tenant_b) = false, 'User A should NOT be member of tenant B';
  ASSERT public.is_tenant_admin(tenant_a) = true, 'User A should be admin of tenant A';
  ASSERT public.is_tenant_admin(tenant_b) = false, 'User A should NOT be admin of tenant B';
  ASSERT public.has_tenant_role(tenant_a, 'admin') = true, 'User A should have admin role in tenant A';
  ASSERT public.has_tenant_role(tenant_b, 'admin') = false, 'User A should NOT have admin role in tenant B';
  ASSERT public.is_system_admin() = false, 'User A should not be system admin';
  ASSERT (public.get_tenant_by_subdomain('phase2-test-a')).name = 'Tenant A', 'Should find tenant A by subdomain';

  RAISE NOTICE 'Phase 2 helper function test PASSED';
END $$;

ROLLBACK;
