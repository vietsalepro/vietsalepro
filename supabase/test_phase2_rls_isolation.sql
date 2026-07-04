BEGIN;

DO $$
DECLARE
  user_a UUID := '64d25af2-a592-4dd4-b1ff-365e7116e372';
  user_b UUID := '1271d9f5-a0c8-47f3-ace5-4ffa9cc8a82f';
  tenant_a UUID;
  tenant_b UUID;
  a_names TEXT;
  a_ids TEXT;
  a_sees_a BOOLEAN;
  a_sees_b BOOLEAN;
  b_names TEXT;
  b_ids TEXT;
  b_sees_a BOOLEAN;
  b_sees_b BOOLEAN;
BEGIN
  -- Create test data as postgres
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

  CREATE TEMP TABLE phase2_rls_results (
    perspective TEXT,
    visible_tenant_ids TEXT,
    visible_tenant_names TEXT,
    tenant_a_visible BOOLEAN,
    tenant_b_visible BOOLEAN
  );

  -- Perspective: user A
  SET ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user_a)::text, true);
  SELECT string_agg(id::text, ','), string_agg(name, ',')
  INTO a_ids, a_names
  FROM public.tenants;
  a_sees_a := EXISTS (SELECT 1 FROM public.tenants WHERE id = tenant_a);
  a_sees_b := EXISTS (SELECT 1 FROM public.tenants WHERE id = tenant_b);
  RESET ROLE;

  INSERT INTO phase2_rls_results VALUES ('user_a', a_ids, a_names, a_sees_a, a_sees_b);

  -- Perspective: user B
  SET ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user_b)::text, true);
  SELECT string_agg(id::text, ','), string_agg(name, ',')
  INTO b_ids, b_names
  FROM public.tenants;
  b_sees_a := EXISTS (SELECT 1 FROM public.tenants WHERE id = tenant_a);
  b_sees_b := EXISTS (SELECT 1 FROM public.tenants WHERE id = tenant_b);
  RESET ROLE;

  INSERT INTO phase2_rls_results VALUES ('user_b', b_ids, b_names, b_sees_a, b_sees_b);
END $$;

SELECT * FROM phase2_rls_results;

ROLLBACK;
