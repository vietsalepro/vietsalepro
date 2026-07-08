-- P15.3: Admin dashboard — Integration marketplace + partner portal (YAGNI).
-- Marketplace catalog (integrations) and partner profiles. Only system admins manage.
-- ponytail: migration idempotent; global catalog only; no per-tenant install logic yet.

-- ============================================================
-- 1. Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  website TEXT,
  contact_email TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  documentation_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partners_status ON public.partners(status);
CREATE INDEX IF NOT EXISTS idx_integrations_partner_id ON public.integrations(partner_id);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON public.integrations(status);
CREATE INDEX IF NOT EXISTS idx_integrations_category ON public.integrations(category);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'partners' AND policyname = 'partners_system_admin_all'
  ) THEN
    CREATE POLICY "partners_system_admin_all"
      ON public.partners FOR ALL TO authenticated
      USING (public.is_system_admin())
      WITH CHECK (public.is_system_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'integrations' AND policyname = 'integrations_system_admin_all'
  ) THEN
    CREATE POLICY "integrations_system_admin_all"
      ON public.integrations FOR ALL TO authenticated
      USING (public.is_system_admin())
      WITH CHECK (public.is_system_admin());
  END IF;
END $$;

-- ============================================================
-- 2. Partner RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_partner(
  p_name TEXT,
  p_slug TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_contact_email TEXT DEFAULT NULL,
  p_logo_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_row public.partners;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tạo partner' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Tên partner không được để trống';
  END IF;

  INSERT INTO public.partners (
    name, slug, description, website, contact_email, logo_url, created_by
  ) VALUES (
    trim(p_name),
    NULLIF(trim(p_slug), ''),
    NULLIF(trim(p_description), ''),
    NULLIF(trim(p_website), ''),
    NULLIF(trim(p_contact_email), ''),
    NULLIF(trim(p_logo_url), ''),
    auth.uid()
  )
  RETURNING * INTO v_row;

  RETURN json_build_object(
    'id', v_row.id,
    'name', v_row.name,
    'slug', v_row.slug,
    'description', v_row.description,
    'website', v_row.website,
    'contactEmail', v_row.contact_email,
    'logoUrl', v_row.logo_url,
    'status', v_row.status,
    'createdBy', v_row.created_by,
    'createdAt', v_row.created_at,
    'updatedAt', v_row.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_partner(
  p_partner_id UUID,
  p_name TEXT DEFAULT NULL,
  p_slug TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_contact_email TEXT DEFAULT NULL,
  p_logo_url TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_row public.partners;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật partner' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.partners
  SET name = COALESCE(trim(p_name), name),
      slug = COALESCE(NULLIF(trim(p_slug), ''), slug),
      description = COALESCE(NULLIF(trim(p_description), ''), description),
      website = COALESCE(NULLIF(trim(p_website), ''), website),
      contact_email = COALESCE(NULLIF(trim(p_contact_email), ''), contact_email),
      logo_url = COALESCE(NULLIF(trim(p_logo_url), ''), logo_url),
      status = COALESCE(p_status, status),
      updated_at = now()
  WHERE id = p_partner_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy partner: %', p_partner_id;
  END IF;

  RETURN json_build_object(
    'id', v_row.id,
    'name', v_row.name,
    'slug', v_row.slug,
    'description', v_row.description,
    'website', v_row.website,
    'contactEmail', v_row.contact_email,
    'logoUrl', v_row.logo_url,
    'status', v_row.status,
    'createdBy', v_row.created_by,
    'createdAt', v_row.created_at,
    'updatedAt', v_row.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_partner(p_partner_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xóa partner' USING ERRCODE = 'insufficient_privilege';
  END IF;

  DELETE FROM public.partners WHERE id = p_partner_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy partner: %', p_partner_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_partners()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem danh sách partner' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        id,
        name,
        slug,
        description,
        website,
        contact_email AS contactEmail,
        logo_url AS logoUrl,
        status,
        created_by AS createdBy,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM public.partners
      ORDER BY created_at DESC
    ) t
  );
END;
$$;

-- ============================================================
-- 3. Integration RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_integration(
  p_partner_id UUID,
  p_name TEXT,
  p_slug TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'active',
  p_documentation_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_row public.integrations;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tạo integration' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Tên integration không được để trống';
  END IF;

  IF p_partner_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.partners WHERE id = p_partner_id) THEN
    RAISE EXCEPTION 'Không tìm thấy partner: %', p_partner_id;
  END IF;

  INSERT INTO public.integrations (
    partner_id, name, slug, description, category, status, documentation_url, created_by
  ) VALUES (
    p_partner_id,
    trim(p_name),
    NULLIF(trim(p_slug), ''),
    NULLIF(trim(p_description), ''),
    NULLIF(trim(p_category), ''),
    COALESCE(p_status, 'active'),
    NULLIF(trim(p_documentation_url), ''),
    auth.uid()
  )
  RETURNING * INTO v_row;

  RETURN json_build_object(
    'id', v_row.id,
    'partnerId', v_row.partner_id,
    'name', v_row.name,
    'slug', v_row.slug,
    'description', v_row.description,
    'category', v_row.category,
    'status', v_row.status,
    'documentationUrl', v_row.documentation_url,
    'createdBy', v_row.created_by,
    'createdAt', v_row.created_at,
    'updatedAt', v_row.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_integration(
  p_integration_id UUID,
  p_partner_id UUID DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_slug TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_documentation_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_row public.integrations;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật integration' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.integrations
  SET partner_id = COALESCE(p_partner_id, partner_id),
      name = COALESCE(trim(p_name), name),
      slug = COALESCE(NULLIF(trim(p_slug), ''), slug),
      description = COALESCE(NULLIF(trim(p_description), ''), description),
      category = COALESCE(NULLIF(trim(p_category), ''), category),
      status = COALESCE(p_status, status),
      documentation_url = COALESCE(NULLIF(trim(p_documentation_url), ''), documentation_url),
      updated_at = now()
  WHERE id = p_integration_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy integration: %', p_integration_id;
  END IF;

  RETURN json_build_object(
    'id', v_row.id,
    'partnerId', v_row.partner_id,
    'name', v_row.name,
    'slug', v_row.slug,
    'description', v_row.description,
    'category', v_row.category,
    'status', v_row.status,
    'documentationUrl', v_row.documentation_url,
    'createdBy', v_row.created_by,
    'createdAt', v_row.created_at,
    'updatedAt', v_row.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_integration(p_integration_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xóa integration' USING ERRCODE = 'insufficient_privilege';
  END IF;

  DELETE FROM public.integrations WHERE id = p_integration_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy integration: %', p_integration_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_integrations()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem danh sách integration' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        i.id,
        i.partner_id AS partnerId,
        i.name,
        i.slug,
        i.description,
        i.category,
        i.status,
        i.documentation_url AS documentationUrl,
        p.name AS partnerName,
        i.created_by AS createdBy,
        i.created_at AS createdAt,
        i.updated_at AS updatedAt
      FROM public.integrations i
      LEFT JOIN public.partners p ON p.id = i.partner_id
      ORDER BY i.created_at DESC
    ) t
  );
END;
$$;
