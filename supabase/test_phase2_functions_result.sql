BEGIN;

DO $$
DECLARE
  user_a UUID := '64d25af2-a592-4dd4-b1ff-365e7116e372';
  user_b UUID := '1271d9f5-a0c8-47f3-ace5-4ffa9cc8a82f';
  tenant_a UUID;
  tenant_b UUID;
BEGIN
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

  PERFORM set_config('request.jwt.claims', json_build_object('sub', user_a)::text, true);

  CREATE TEMP TABLE phase2_test_results (
    check_name TEXT,
    passed BOOLEAN
  );

  INSERT INTO phase2_test_results VALUES
    ('user_a_member_of_tenant_a', public.is_tenant_member(tenant_a)),
    ('user_a_not_member_of_tenant_b', NOT public.is_tenant_member(tenant_b)),
    ('user_a_admin_of_tenant_a', public.is_tenant_admin(tenant_a)),
    ('user_a_not_admin_of_tenant_b', NOT public.is_tenant_admin(tenant_b)),
    ('user_a_has_admin_role_in_a', public.has_tenant_role(tenant_a, 'admin')),
    ('user_a_not_system_admin', NOT public.is_system_admin()),
    ('found_tenant_a_by_subdomain', (public.get_tenant_by_subdomain('phase2-test-a')).name = 'Tenant A');
END $$;

SELECT * FROM phase2_test_results;

ROLLBACK;
