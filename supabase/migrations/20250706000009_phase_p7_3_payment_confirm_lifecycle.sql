-- P7.3: Xác nhận thanh toán + vòng đời trạng thái hóa đơn (pending/paid/overdue/cancelled/expired).
-- ponytail: migration idempotent; chỉ system admin được confirm; cho phép confirm trên hóa đơn expired để kích hoạt lại tenant.

-- ============================================================
-- 1. Bổ sung trạng thái 'expired' vào CHECK constraint invoices.status
-- ============================================================

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
    WHERE con.conrelid = 'public.invoices'::regclass
      AND con.contype = 'c'
      AND att.attname = 'status'
  LOOP
    EXECUTE format('ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS %I', rec.conname);
  END LOOP;
END $$;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled', 'expired'));

-- ============================================================
-- 2. RPC xác nhận thanh toán + ghi payment + kích hoạt lại tenant
-- ============================================================

CREATE OR REPLACE FUNCTION public.confirm_payment(
  p_invoice_id UUID,
  p_payment_method TEXT DEFAULT 'bank_transfer',
  p_reference_code TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_invoice public.invoices%ROWTYPE;
  v_tenant public.tenants%ROWTYPE;
  v_sub public.tenant_subscriptions%ROWTYPE;
  v_payment public.payments%ROWTYPE;
  v_new_expires_at TIMESTAMPTZ;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xác nhận thanh toán' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_payment_method NOT IN ('bank_transfer', 'cash', 'card', 'other') THEN
    RAISE EXCEPTION 'Phương thức thanh toán không hợp lệ: %', p_payment_method;
  END IF;

  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy hóa đơn: %', p_invoice_id;
  END IF;

  IF v_invoice.status IN ('paid', 'cancelled', 'draft') THEN
    RAISE EXCEPTION 'Hóa đơn ở trạng thái %, không thể xác nhận thanh toán', v_invoice.status;
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = v_invoice.tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', v_invoice.tenant_id;
  END IF;

  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = v_invoice.tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy subscription cho tenant: %', v_invoice.tenant_id;
  END IF;

  -- Ghi payment đã xác nhận
  INSERT INTO public.payments (
    tenant_id,
    invoice_id,
    amount,
    payment_method,
    payment_date,
    reference_code,
    status,
    notes,
    created_by
  ) VALUES (
    v_invoice.tenant_id,
    v_invoice.id,
    v_invoice.total,
    p_payment_method,
    CURRENT_DATE,
    p_reference_code,
    'confirmed',
    p_notes,
    auth.uid()
  ) RETURNING * INTO v_payment;

  -- Cập nhật hóa đơn thành paid
  UPDATE public.invoices
  SET status = 'paid',
      amount_paid = total,
      updated_at = now()
  WHERE id = p_invoice_id;

  -- Cập nhật subscription: billing_status ok, expires_at = max(hiện tại, period_end) để giữ cộng dồn
  v_new_expires_at := GREATEST(
    COALESCE(v_sub.expires_at::DATE, CURRENT_DATE),
    v_invoice.period_end::DATE
  )::TIMESTAMPTZ;

  UPDATE public.tenant_subscriptions
  SET billing_status = 'ok',
      expires_at = v_new_expires_at,
      updated_at = now()
  WHERE tenant_id = v_invoice.tenant_id;

  -- Kích hoạt lại tenant nếu đang read_only
  IF v_tenant.status = 'read_only' THEN
    UPDATE public.tenants
    SET status = 'active',
        updated_at = now()
    WHERE id = v_invoice.tenant_id;
  END IF;

  RETURN v_payment;
END;
$$;
