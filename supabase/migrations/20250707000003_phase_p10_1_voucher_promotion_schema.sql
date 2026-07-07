-- P10.1: Admin dashboard — Voucher/promotion schema + backend CRUD
-- Tạo bảng promo_codes, promotion_rules, promo_code_usages + RLS.
-- ponytail: migration idempotent; chỉ system admin quản lý voucher/promotion;
--           tenant member chỉ xem/insert usage của tenant mình (chuẩn bị P10.2).

-- ============================================================
-- 1. promo_codes (voucher codes)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  kind TEXT NOT NULL DEFAULT 'fixed_amount' CHECK (kind IN ('fixed_amount', 'percentage')),
  discount_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  max_discount_amount NUMERIC(12, 2),
  min_invoice_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  max_uses_total INTEGER,
  max_uses_per_tenant INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promo_codes_code_idx ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS promo_codes_active_idx ON public.promo_codes(is_active) WHERE is_active = true;

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'promo_codes' AND policyname = 'promo_codes_select'
  ) THEN
    CREATE POLICY "promo_codes_select" ON public.promo_codes FOR SELECT TO authenticated
      USING (public.is_system_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'promo_codes' AND policyname = 'promo_codes_write'
  ) THEN
    CREATE POLICY "promo_codes_write" ON public.promo_codes FOR ALL TO authenticated
      USING (public.is_system_admin())
      WITH CHECK (public.is_system_admin());
  END IF;
END $$;

-- ============================================================
-- 2. promotion_rules (auto-applied promotions)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.promotion_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  condition_type TEXT NOT NULL DEFAULT 'always'
    CHECK (condition_type IN ('tenant_age_days', 'plan', 'specific_tenant', 'cycle_type', 'always')),
  condition_value JSONB NOT NULL DEFAULT '{}',
  benefit_type TEXT NOT NULL DEFAULT 'bonus_months'
    CHECK (benefit_type IN ('bonus_months', 'discount_percentage', 'discount_fixed_amount')),
  benefit_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 0,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promotion_rules_active_idx ON public.promotion_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS promotion_rules_priority_idx ON public.promotion_rules(priority DESC);

ALTER TABLE public.promotion_rules ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'promotion_rules' AND policyname = 'promotion_rules_select'
  ) THEN
    CREATE POLICY "promotion_rules_select" ON public.promotion_rules FOR SELECT TO authenticated
      USING (public.is_system_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'promotion_rules' AND policyname = 'promotion_rules_write'
  ) THEN
    CREATE POLICY "promotion_rules_write" ON public.promotion_rules FOR ALL TO authenticated
      USING (public.is_system_admin())
      WITH CHECK (public.is_system_admin());
  END IF;
END $$;

-- ============================================================
-- 3. promo_code_usages (per-tenant + global usage tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.promo_code_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promo_code_usages_promo_code_id_idx ON public.promo_code_usages(promo_code_id);
CREATE INDEX IF NOT EXISTS promo_code_usages_tenant_id_idx ON public.promo_code_usages(tenant_id);
CREATE INDEX IF NOT EXISTS promo_code_usages_invoice_id_idx ON public.promo_code_usages(invoice_id);

ALTER TABLE public.promo_code_usages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'promo_code_usages' AND policyname = 'promo_code_usages_select'
  ) THEN
    CREATE POLICY "promo_code_usages_select" ON public.promo_code_usages FOR SELECT TO authenticated
      USING (public.is_system_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id)));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'promo_code_usages' AND policyname = 'promo_code_usages_insert'
  ) THEN
    CREATE POLICY "promo_code_usages_insert" ON public.promo_code_usages FOR INSERT TO authenticated
      WITH CHECK (public.is_system_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id)));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'promo_code_usages' AND policyname = 'promo_code_usages_write'
  ) THEN
    CREATE POLICY "promo_code_usages_write" ON public.promo_code_usages FOR ALL TO authenticated
      USING (public.is_system_admin())
      WITH CHECK (public.is_system_admin());
  END IF;
END $$;

-- ============================================================
-- 4. Helper: đếm lượt dùng global + per-tenant
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_promo_code_usage_counts(p_promo_code_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_per_tenant JSONB;
BEGIN
  SELECT COUNT(*) INTO v_total FROM public.promo_code_usages WHERE promo_code_id = p_promo_code_id;

  SELECT COALESCE(jsonb_object_agg(tenant_id::TEXT, cnt), '{}')
  INTO v_per_tenant
  FROM (
    SELECT tenant_id, COUNT(*) AS cnt
    FROM public.promo_code_usages
    WHERE promo_code_id = p_promo_code_id
    GROUP BY tenant_id
  ) t;

  RETURN jsonb_build_object(
    'total', v_total,
    'per_tenant', v_per_tenant
  );
END;
$$;

-- ============================================================
-- 5. RPC: validate promo_code (chuẩn bị P10.2)
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_promo_code(
  p_code TEXT,
  p_tenant_id UUID,
  p_invoice_subtotal NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_promo public.promo_codes%ROWTYPE;
  v_total_used INTEGER;
  v_tenant_used INTEGER;
BEGIN
  SELECT * INTO v_promo FROM public.promo_codes WHERE code = p_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Mã voucher không tồn tại');
  END IF;

  IF NOT v_promo.is_active THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Mã voucher đã bị vô hiệu hóa');
  END IF;

  IF v_promo.valid_from > CURRENT_DATE THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Mã voucher chưa có hiệu lực');
  END IF;

  IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < CURRENT_DATE THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Mã voucher đã hết hạn');
  END IF;

  IF v_promo.min_invoice_amount > 0 AND p_invoice_subtotal < v_promo.min_invoice_amount THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Hóa đơn chưa đạt giá trị tối thiểu');
  END IF;

  SELECT COUNT(*) INTO v_total_used FROM public.promo_code_usages WHERE promo_code_id = v_promo.id;
  IF v_promo.max_uses_total IS NOT NULL AND v_total_used >= v_promo.max_uses_total THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Mã voucher đã hết lượt sử dụng');
  END IF;

  SELECT COUNT(*) INTO v_tenant_used
  FROM public.promo_code_usages
  WHERE promo_code_id = v_promo.id AND tenant_id = p_tenant_id;
  IF v_promo.max_uses_per_tenant IS NOT NULL AND v_tenant_used >= v_promo.max_uses_per_tenant THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Tenant đã sử dụng hết lượt voucher');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'promo_code_id', v_promo.id,
    'kind', v_promo.kind,
    'discount_value', v_promo.discount_value,
    'max_discount_amount', v_promo.max_discount_amount
  );
END;
$$;
