-- P7.5: Cron hết hạn hóa đơn + cron tạo hóa đơn gia hạn + cột giảm giá nullable cho voucher (P10).
-- ponytail: migration idempotent; cron chạy dưới quyền chủ DB nên các hàm SECURITY DEFINER và
--           KHÔNG gọi is_system_admin() (auth.uid() rỗng khi cron chạy). Mọi mốc thời gian theo Asia/Ho_Chi_Minh.

-- ============================================================
-- 0. Cột giảm giá nullable trên invoices (sẵn sàng cho voucher P10, chưa dùng ở P7)
-- ============================================================

-- ponytail: chỉ thêm cột nullable làm chỗ nối cho P10; discount (numeric) đã có sẵn.
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount_code TEXT;

-- ponytail: DROP trước CREATE để đổi được kiểu trả về nếu hàm đã tồn tại từ lần thử trước.
DROP FUNCTION IF EXISTS public.expire_overdue_invoices();
DROP FUNCTION IF EXISTS public.create_renewal_invoices(INT);

-- ============================================================
-- 1. Cron: chuyển hóa đơn pending quá 48h -> expired + tenant -> read_only
-- ============================================================

CREATE OR REPLACE FUNCTION public.expire_overdue_invoices()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_expired_count INTEGER := 0;
BEGIN
  -- Hóa đơn pending quá 48 giờ kể từ lúc tạo -> expired.
  WITH expired AS (
    UPDATE public.invoices
    SET status = 'expired',
        updated_at = now()
    WHERE status = 'pending'
      AND created_at < now() - INTERVAL '48 hours'
    RETURNING tenant_id
  )
  SELECT count(DISTINCT tenant_id) INTO v_expired_count FROM expired;

  -- Tenant có hóa đơn vừa hết hạn: đánh dấu billing_status overdue.
  UPDATE public.tenant_subscriptions s
  SET billing_status = 'overdue',
      updated_at = now()
  WHERE EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.tenant_id = s.tenant_id
      AND i.status = 'expired'
  )
    AND s.billing_status <> 'overdue';

  -- Chuyển tenant sang read_only (chỉ khi đang active/trial) nếu còn hóa đơn hết hạn chưa thanh toán.
  UPDATE public.tenants t
  SET status = 'read_only',
      updated_at = now()
  WHERE t.status IN ('active', 'trial')
    AND EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.tenant_id = t.id
        AND i.status = 'expired'
    );

  RETURN v_expired_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_overdue_invoices() FROM PUBLIC;

-- ============================================================
-- 2. Cron: tạo hóa đơn gia hạn N=7 ngày trước expires_at
-- ============================================================

-- ponytail: gia hạn luôn theo chu kỳ THÁNG (1 tháng, 69k). Trần: chưa tự nhận biết khách mua năm;
--           nâng cấp sau bằng cách đọc chu kỳ gần nhất từ invoices/subscription khi cần.
CREATE OR REPLACE FUNCTION public.create_renewal_invoices(p_days_before INT DEFAULT 7)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_sub RECORD;
  v_invoice_no TEXT;
  v_year INT;
  v_period_start DATE;
  v_period_end DATE;
  v_unit_price NUMERIC := 69000;  -- gói VIP tháng
  v_created INTEGER := 0;
  v_invoice_id UUID;
BEGIN
  IF p_days_before < 0 THEN
    RAISE EXCEPTION 'p_days_before không hợp lệ';
  END IF;

  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::INT;

  FOR v_sub IN
    SELECT s.tenant_id, s.expires_at
    FROM public.tenant_subscriptions s
    JOIN public.tenants t ON t.id = s.tenant_id
    WHERE s.plan = 'vip'
      AND s.expires_at IS NOT NULL
      AND s.expires_at::DATE >= CURRENT_DATE
      AND s.expires_at::DATE <= CURRENT_DATE + p_days_before
      AND t.status NOT IN ('archived')
      -- Chưa có hóa đơn còn mở (pending/overdue/expired) để tránh trùng.
      AND NOT EXISTS (
        SELECT 1 FROM public.invoices i
        WHERE i.tenant_id = s.tenant_id
          AND i.status IN ('pending', 'overdue', 'expired')
      )
  LOOP
    v_period_start := v_sub.expires_at::DATE;
    v_period_end := (v_period_start + INTERVAL '1 month')::DATE;
    v_invoice_no := public.get_next_invoice_number(v_year);

    INSERT INTO public.invoices (
      tenant_id, invoice_no, status, issue_date, due_date,
      period_start, period_end, subtotal, discount, tax, total, amount_paid,
      notes, created_by
    ) VALUES (
      v_sub.tenant_id, v_invoice_no, 'pending', CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days',
      v_period_start, v_period_end, v_unit_price, 0, 0, v_unit_price, 0,
      'Hóa đơn gia hạn tự động', NULL
    ) RETURNING id INTO v_invoice_id;

    INSERT INTO public.invoice_items (invoice_id, tenant_id, description, quantity, unit_price)
    VALUES (v_invoice_id, v_sub.tenant_id, 'Gói VIP - Tháng (gia hạn)', 1, v_unit_price);

    v_created := v_created + 1;
  END LOOP;

  RETURN v_created;
END;
$$;

REVOKE ALL ON FUNCTION public.create_renewal_invoices(INT) FROM PUBLIC;

-- ============================================================
-- 3. Lịch cron (pg_cron)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ponytail: chạy hằng ngày là đủ (48h có dư biên); nếu cần nhạy hơn đổi sang mỗi giờ.
SELECT cron.schedule('invoice-expiry-daily', '30 3 * * *', 'SELECT public.expire_overdue_invoices();');
SELECT cron.schedule('renewal-invoice-daily', '0 4 * * *', 'SELECT public.create_renewal_invoices(7);');
