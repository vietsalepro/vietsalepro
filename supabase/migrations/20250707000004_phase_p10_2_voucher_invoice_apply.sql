-- P10.2: Admin dashboard — RPC áp dụng voucher/promotion vào hóa đơn
-- ponytail: mở rộng promo_codes với target_conditions, cập nhật validate_promo_code,
--           tạo RPC apply_voucher_to_invoice kết hợp voucher + promotion "mua năm tặng tháng".
--           Mỗi hóa đơn chỉ 1 voucher; discount nối vào cột invoices.discount (P7).

-- ============================================================
-- 1. Mở rộng promo_codes: điều kiện đối tượng (tenant mới / gói / tenant cụ thể)
-- ============================================================

ALTER TABLE public.promo_codes
ADD COLUMN IF NOT EXISTS target_conditions JSONB DEFAULT '{}';

COMMENT ON COLUMN public.promo_codes.target_conditions IS
  'JSONB: {tenant_age_days: int, plan: "free"|"vip", tenant_ids: [uuid,...]}.';

-- ============================================================
-- 2. Helper: kiểm tra 1 promotion rule có khớp với invoice/tenant không
-- ============================================================

CREATE OR REPLACE FUNCTION public.promotion_rule_matches(
  p_rule_id UUID,
  p_tenant_id UUID,
  p_cycle_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_rule public.promotion_rules%ROWTYPE;
  v_tenant public.tenants%ROWTYPE;
  v_age_days INTEGER;
  v_plan TEXT;
  v_specific_tenant_id TEXT;
  v_rule_cycle_type TEXT;
BEGIN
  SELECT * INTO v_rule FROM public.promotion_rules WHERE id = p_rule_id;
  IF NOT FOUND THEN RETURN false; END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN RETURN false; END IF;

  IF v_rule.condition_type = 'always' THEN
    RETURN true;
  END IF;

  IF v_rule.condition_type = 'tenant_age_days' THEN
    v_age_days := COALESCE((v_rule.condition_value->>'age_days')::INTEGER, 0);
    RETURN (CURRENT_DATE - v_tenant.created_at::DATE) <= v_age_days;
  END IF;

  IF v_rule.condition_type = 'plan' THEN
    v_plan := v_rule.condition_value->>'plan';
    RETURN v_tenant.plan = v_plan;
  END IF;

  IF v_rule.condition_type = 'specific_tenant' THEN
    v_specific_tenant_id := v_rule.condition_value->>'tenant_id';
    RETURN v_specific_tenant_id = p_tenant_id::TEXT;
  END IF;

  IF v_rule.condition_type = 'cycle_type' THEN
    v_rule_cycle_type := v_rule.condition_value->>'cycle_type';
    RETURN COALESCE(p_cycle_type, '') = v_rule_cycle_type;
  END IF;

  RETURN false;
END;
$$;

-- ============================================================
-- 3. Cập nhật validate_promo_code: thêm kiểm tra target_conditions
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
  v_tenant public.tenants%ROWTYPE;
  v_total_used INTEGER;
  v_tenant_used INTEGER;
  v_conditions JSONB;
  v_age_days INTEGER;
  v_target_plan TEXT;
  v_tenant_ids JSONB;
BEGIN
  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Không tìm thấy tenant');
  END IF;

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

  -- Điều kiện đối tượng (kết hợp AND)
  v_conditions := COALESCE(v_promo.target_conditions, '{}');

  IF v_conditions ? 'tenant_age_days' THEN
    v_age_days := COALESCE((v_conditions->>'tenant_age_days')::INTEGER, 0);
    IF (CURRENT_DATE - v_tenant.created_at::DATE) > v_age_days THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Tenant không đủ điều kiện độ tuổi');
    END IF;
  END IF;

  IF v_conditions ? 'plan' THEN
    v_target_plan := v_conditions->>'plan';
    IF v_tenant.plan <> v_target_plan THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Voucher không áp dụng cho gói hiện tại');
    END IF;
  END IF;

  IF v_conditions ? 'tenant_ids' THEN
    v_tenant_ids := v_conditions->'tenant_ids';
    IF jsonb_typeof(v_tenant_ids) = 'array' AND NOT (v_tenant_ids ? p_tenant_id::TEXT) THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Tenant không nằm trong danh sách áp dụng');
    END IF;
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

-- ============================================================
-- 4. RPC: apply voucher to invoice
-- ============================================================

CREATE OR REPLACE FUNCTION public.apply_voucher_to_invoice(
  p_invoice_id UUID,
  p_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_invoice public.invoices%ROWTYPE;
  v_tenant public.tenants%ROWTYPE;
  v_promo public.promo_codes%ROWTYPE;
  v_validation JSONB;
  v_discount NUMERIC(15,2);
  v_bonus_months INTEGER;
  v_total NUMERIC(15,2);
  v_cycle_type TEXT;
  v_item public.invoice_items%ROWTYPE;
  v_rule public.promotion_rules%ROWTYPE;
  v_usage_id UUID;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được áp dụng voucher' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy hóa đơn');
  END IF;

  IF v_invoice.status NOT IN ('draft', 'pending') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Hóa đơn không ở trạng thái chờ thanh toán');
  END IF;

  IF EXISTS (SELECT 1 FROM public.promo_code_usages WHERE invoice_id = p_invoice_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Hóa đơn đã áp dụng voucher');
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = v_invoice.tenant_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy tenant');
  END IF;

  v_validation := public.validate_promo_code(p_code, v_invoice.tenant_id, v_invoice.subtotal);
  IF NOT (v_validation->>'valid')::BOOLEAN THEN
    RETURN jsonb_build_object('success', false, 'error', v_validation->>'error');
  END IF;

  SELECT * INTO v_promo FROM public.promo_codes WHERE code = p_code;

  -- Tính discount
  IF v_promo.kind = 'percentage' THEN
    v_discount := v_invoice.subtotal * v_promo.discount_value / 100;
    IF v_promo.max_discount_amount IS NOT NULL AND v_discount > v_promo.max_discount_amount THEN
      v_discount := v_promo.max_discount_amount;
    END IF;
  ELSE
    v_discount := v_promo.discount_value;
  END IF;

  IF v_discount > v_invoice.subtotal THEN
    v_discount := v_invoice.subtotal;
  END IF;
  IF v_discount < 0 THEN
    v_discount := 0;
  END IF;
  v_discount := ROUND(v_discount, 2);

  -- Xác định cycle_type từ dòng dịch vụ chính (unit_price > 0)
  v_cycle_type := 'monthly';
  SELECT * INTO v_item
  FROM public.invoice_items
  WHERE invoice_id = p_invoice_id AND unit_price > 0
  ORDER BY created_at ASC
  LIMIT 1;
  IF FOUND AND v_item.unit_price = 59000 THEN
    v_cycle_type := 'yearly';
  END IF;

  -- Tính tổng tháng tặng từ promotion rules phù hợp
  v_bonus_months := 0;
  FOR v_rule IN
    SELECT * FROM public.promotion_rules
    WHERE is_active = true
      AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
      AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
      AND benefit_type = 'bonus_months'
    ORDER BY priority DESC
  LOOP
    IF public.promotion_rule_matches(v_rule.id, v_invoice.tenant_id, v_cycle_type) THEN
      v_bonus_months := v_bonus_months + COALESCE(v_rule.benefit_value, 0)::INTEGER;
    END IF;
  END LOOP;

  v_total := v_invoice.subtotal - v_discount;
  IF v_total < 0 THEN
    v_total := 0;
  END IF;

  -- Cập nhật invoice: discount nối vào cột giảm giá, kéo dài period_end nếu có tháng tặng.
  -- ponytail: tính bonus months từ điểm muộn nhất giữa period_end hóa đơn và expiry hiện tại để không chồng chéo chu kỳ đã trả.
  UPDATE public.invoices
  SET discount = v_discount,
      total = v_total,
      period_end = CASE
        WHEN v_bonus_months > 0 AND v_invoice.period_end IS NOT NULL
        THEN (GREATEST(v_invoice.period_end, COALESCE(v_tenant.expires_at::DATE, v_invoice.period_end)) + (v_bonus_months * INTERVAL '1 month'))::DATE
        ELSE v_invoice.period_end
      END,
      updated_at = now()
  WHERE id = p_invoice_id
  RETURNING * INTO v_invoice;

  -- Ghi dòng tháng tặng từ promotion
  IF v_bonus_months > 0 THEN
    INSERT INTO public.invoice_items (
      invoice_id,
      tenant_id,
      description,
      quantity,
      unit_price
    ) VALUES (
      p_invoice_id,
      v_invoice.tenant_id,
      'Tháng tặng (promotion)',
      v_bonus_months,
      0
    );
  END IF;

  -- Ghi nhận lượt sử dụng voucher
  INSERT INTO public.promo_code_usages (promo_code_id, tenant_id, invoice_id)
  VALUES (v_promo.id, v_invoice.tenant_id, p_invoice_id)
  RETURNING id INTO v_usage_id;

  RETURN jsonb_build_object(
    'success', true,
    'invoice_id', p_invoice_id,
    'promo_code_id', v_promo.id,
    'code', v_promo.code,
    'discount', v_discount,
    'bonus_months', v_bonus_months,
    'total', v_total,
    'period_end', v_invoice.period_end,
    'usage_id', v_usage_id
  );
END;
$$;

-- ============================================================
-- 5. Lockdown EXECUTE permissions on RPC helpers
-- ============================================================

REVOKE ALL ON FUNCTION public.promotion_rule_matches(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promotion_rule_matches(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.promotion_rule_matches(UUID, UUID, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.apply_voucher_to_invoice(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_voucher_to_invoice(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_voucher_to_invoice(UUID, TEXT) TO service_role;
