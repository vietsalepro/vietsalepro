-- P7.2: RPC tạo hóa đơn + đánh số + tính giá (monthly/yearly/prepaid) theo Asia/Ho_Chi_Minh.
-- ponytail: migration idempotent; chỉ system admin được tạo hóa đơn; đánh số INV-YYYY-#### dùng counter sẵn có.

-- ============================================================
-- 1. RPC tạo hóa đơn thủ công / cron-ready
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_invoice(
  p_tenant_id UUID,
  p_cycle_type TEXT DEFAULT 'monthly',   -- 'monthly' | 'yearly'
  p_quantity INT DEFAULT 1,              -- số tháng (monthly) hoặc số năm (yearly)
  p_bonus_months INT DEFAULT 0,          -- tháng tặng thêm
  p_notes TEXT DEFAULT NULL
)
RETURNS public.invoices
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_tenant public.tenants%ROWTYPE;
  v_sub public.tenant_subscriptions%ROWTYPE;
  v_invoice public.invoices%ROWTYPE;
  v_invoice_no TEXT;
  v_year INT;
  v_paid_months INT;
  v_period_start DATE;
  v_period_end DATE;
  v_unit_price NUMERIC;
  v_subtotal NUMERIC;
  v_total NUMERIC;
  v_description TEXT;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tạo hóa đơn' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_cycle_type NOT IN ('monthly', 'yearly') THEN
    RAISE EXCEPTION 'Chu kỳ không hợp lệ: % (chỉ chấp nhận monthly/yearly)', p_cycle_type;
  END IF;

  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Số lượng phải lớn hơn 0';
  END IF;

  IF p_bonus_months < 0 THEN
    RAISE EXCEPTION 'Số tháng tặng không hợp lệ';
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy subscription cho tenant: %', p_tenant_id;
  END IF;

  -- Tính số tháng được trả và đơn giá theo chu kỳ
  IF p_cycle_type = 'monthly' THEN
    v_paid_months := p_quantity;
    v_unit_price := 69000;
    v_description := 'Gói VIP - Tháng';
  ELSE
    v_paid_months := p_quantity * 12;
    v_unit_price := 59000;  -- 59k/tháng khi mua năm
    v_description := 'Gói VIP - Năm';
  END IF;

  v_subtotal := v_unit_price * v_paid_months;
  v_total := v_subtotal;

  -- ponytail: cộng dồn expires_at nếu còn hạn, nếu không thì bắt đầu từ hôm nay theo Asia/Ho_Chi_Minh.
  v_period_start := COALESCE(v_sub.expires_at::DATE, CURRENT_DATE);
  IF v_period_start < CURRENT_DATE THEN
    v_period_start := CURRENT_DATE;
  END IF;

  v_period_end := (v_period_start + ((v_paid_months + p_bonus_months) * INTERVAL '1 month'))::DATE;

  -- Đánh số tự động INV-YYYY-#### dựa trên năm theo timezone Asia/Ho_Chi_Minh
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
  v_invoice_no := public.get_next_invoice_number(v_year);

  INSERT INTO public.invoices (
    tenant_id,
    invoice_no,
    status,
    issue_date,
    due_date,
    period_start,
    period_end,
    subtotal,
    discount,
    tax,
    total,
    amount_paid,
    notes,
    created_by
  ) VALUES (
    p_tenant_id,
    v_invoice_no,
    'pending',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '2 days',  -- hạn thanh toán 48 giờ, phù hợp cron P7.5
    v_period_start,
    v_period_end,
    v_subtotal,
    0,
    0,
    v_total,
    0,
    p_notes,
    auth.uid()
  ) RETURNING * INTO v_invoice;

  -- Ghi dòng dịch vụ
  INSERT INTO public.invoice_items (
    invoice_id,
    tenant_id,
    description,
    quantity,
    unit_price
  ) VALUES (
    v_invoice.id,
    p_tenant_id,
    v_description,
    v_paid_months,
    v_unit_price
  );

  -- Ghi dòng tháng tặng nếu có
  IF p_bonus_months > 0 THEN
    INSERT INTO public.invoice_items (
      invoice_id,
      tenant_id,
      description,
      quantity,
      unit_price
    ) VALUES (
      v_invoice.id,
      p_tenant_id,
      'Tháng tặng',
      p_bonus_months,
      0
    );
  END IF;

  RETURN v_invoice;
END;
$$;
