-- P4.1: Update billing schema for Basejump enterprise subscription lifecycle.
-- ponytail: migration idempotent; maps old invoice statuses to Basejump set and
-- adds Basejump lifecycle columns to tenant_subscriptions.

-- ============================================================
-- 1. tenant_subscriptions: Basejump lifecycle columns
-- ============================================================

ALTER TABLE public.tenant_subscriptions
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES public.plans(key) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS billing_period TEXT CHECK (billing_period IN ('month', 'year')),
  ADD COLUMN IF NOT EXISTS billing_period_start DATE,
  ADD COLUMN IF NOT EXISTS billing_period_end DATE;

-- Map existing subscriptions into the Basejump lifecycle using billing_status.
UPDATE public.tenant_subscriptions
SET status = CASE
  WHEN billing_status = 'past_due' THEN 'past_due'
  WHEN billing_status = 'suspended' THEN 'suspended'
  WHEN billing_status = 'cancelled' THEN 'cancelled'
  ELSE 'active'
END,
    plan_id = COALESCE(plan_id, plan),
    billing_period = COALESCE(billing_period, 'month'),
    billing_period_start = COALESCE(billing_period_start, CURRENT_DATE),
    billing_period_end = COALESCE(billing_period_end, expires_at::DATE)
WHERE status IS NULL OR status = 'active';

ALTER TABLE public.tenant_subscriptions
  ALTER COLUMN status SET NOT NULL,
  ADD CONSTRAINT tenant_subscriptions_status_check
    CHECK (status IN ('trialing', 'active', 'past_due', 'suspended', 'cancelled'));

CREATE INDEX IF NOT EXISTS tenant_subscriptions_status_idx ON public.tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS tenant_subscriptions_plan_id_idx ON public.tenant_subscriptions(plan_id);

-- ============================================================
-- 2. invoices: subscription reference + Basejump status set
-- ============================================================

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS subscription_id UUID;

-- Map old invoice statuses to Basejump set before tightening the CHECK.
UPDATE public.invoices
SET status = CASE
  WHEN status = 'pending' THEN 'open'
  WHEN status = 'overdue' THEN 'open'
  WHEN status = 'expired' THEN 'uncollectible'
  WHEN status = 'cancelled' THEN 'void'
  ELSE status
END;

-- Drop every CHECK constraint on invoices.status, then add Basejump constraint.
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
    CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible'));

CREATE INDEX IF NOT EXISTS invoices_subscription_id_idx ON public.invoices(subscription_id);

-- ============================================================
-- 3. Keep lifecycle RPCs in sync with new invoice status
-- ============================================================

-- create_invoice now creates an 'open' invoice instead of 'pending'.
CREATE OR REPLACE FUNCTION public.create_invoice(
  p_tenant_id UUID,
  p_cycle_type TEXT DEFAULT 'monthly',
  p_quantity INT DEFAULT 1,
  p_bonus_months INT DEFAULT 0,
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
  v_plan public.plans%ROWTYPE;
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

  SELECT * INTO v_plan FROM public.plans WHERE key = 'vip';

  IF p_cycle_type = 'monthly' THEN
    v_paid_months := p_quantity;
    v_unit_price := COALESCE(v_plan.monthly_price, 69000);
    v_description := 'Gói VIP - Tháng';
  ELSE
    v_paid_months := p_quantity * 12;
    v_unit_price := COALESCE(v_plan.yearly_price, 59000);
    v_description := 'Gói VIP - Năm';
  END IF;

  v_subtotal := v_unit_price * v_paid_months;
  v_total := v_subtotal;

  v_period_start := COALESCE(v_sub.expires_at::DATE, CURRENT_DATE);
  IF v_period_start < CURRENT_DATE THEN
    v_period_start := CURRENT_DATE;
  END IF;

  v_period_end := (v_period_start + ((v_paid_months + p_bonus_months) * INTERVAL '1 month'))::DATE;

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
    subscription_id,
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
    'open',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '2 days',
    v_period_start,
    v_period_end,
    v_sub.tenant_id,
    v_subtotal,
    0,
    0,
    v_total,
    0,
    p_notes,
    auth.uid()
  ) RETURNING * INTO v_invoice;

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

-- confirm_payment now works on 'open' invoices and keeps them 'paid'.
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

  IF v_invoice.status IN ('paid', 'void', 'uncollectible', 'draft') THEN
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

  UPDATE public.invoices
  SET status = 'paid',
      amount_paid = total,
      updated_at = now()
  WHERE id = p_invoice_id;

  v_new_expires_at := GREATEST(
    COALESCE(v_sub.expires_at::DATE, CURRENT_DATE),
    v_invoice.period_end::DATE
  )::TIMESTAMPTZ;

  UPDATE public.tenant_subscriptions
  SET billing_status = 'ok',
      status = 'active',
      expires_at = v_new_expires_at,
      billing_period_end = GREATEST(COALESCE(billing_period_end, CURRENT_DATE), v_invoice.period_end::DATE),
      updated_at = now()
  WHERE tenant_id = v_invoice.tenant_id;

  IF v_tenant.status = 'read_only' THEN
    UPDATE public.tenants
    SET status = 'active',
        updated_at = now()
    WHERE id = v_invoice.tenant_id;
  END IF;

  RETURN v_payment;
END;
$$;

-- ============================================================
-- 4. Keep billing automation RPCs aligned with Basejump invoice statuses
-- ============================================================

-- pending reminders now target 'open' invoices.
CREATE OR REPLACE FUNCTION public.get_pending_billing_reminders()
RETURNS TABLE (
  invoice_id UUID,
  milestone TEXT,
  due_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_config JSONB;
  v_milestones INT[];
  v_send_time TIME;
  v_now TIMESTAMPTZ;
BEGIN
  v_config := public.get_billing_reminder_config();
  v_milestones := ARRAY(SELECT jsonb_array_elements_text(v_config->'milestones')::INT);
  v_send_time := COALESCE((v_config->>'send_time')::TIME, '09:00'::TIME);
  v_now := now();

  RETURN QUERY
  SELECT
    i.id,
    ('T-' || m)::TEXT,
    i.due_date
  FROM public.invoices i
  CROSS JOIN UNNEST(v_milestones) AS m
  JOIN public.tenants t ON t.id = i.tenant_id
  WHERE i.status = 'open'
    AND t.status NOT IN ('archived')
    AND i.due_date - CURRENT_DATE = m
    AND NOT EXISTS (
      SELECT 1 FROM public.invoice_reminder_logs r
      WHERE r.invoice_id = i.id
        AND r.milestone = ('T-' || m)::TEXT
        AND r.status IN ('sent', 'pending')
    );
END;
$$;

-- Expire stale open invoices as uncollectible after 48 hours.
CREATE OR REPLACE FUNCTION public.expire_overdue_invoices()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_start TIMESTAMPTZ := clock_timestamp();
  v_expired_count INTEGER := 0;
  v_error TEXT;
BEGIN
  BEGIN
    PERFORM pg_advisory_xact_lock(hashtextextended('expire_overdue_invoices', 0));

    WITH expired AS (
      UPDATE public.invoices
      SET status = 'uncollectible',
          updated_at = now()
      WHERE status = 'open'
        AND created_at < now() - INTERVAL '48 hours'
      RETURNING tenant_id
    ),
    overdue_subs AS (
      UPDATE public.tenant_subscriptions s
      SET billing_status = 'overdue',
          updated_at = now()
      FROM expired e
      WHERE e.tenant_id = s.tenant_id
        AND s.billing_status <> 'overdue'
      RETURNING s.tenant_id
    ),
    read_only_tenants AS (
      UPDATE public.tenants t
      SET status = 'read_only',
          updated_at = now()
      FROM overdue_subs o
      WHERE o.tenant_id = t.id
        AND t.status IN ('active', 'trial')
      RETURNING t.id
    )
    SELECT count(DISTINCT tenant_id) INTO v_expired_count FROM expired;

    PERFORM public.log_billing_job(
      'expire_overdue_invoices',
      'success',
      FLOOR(EXTRACT(EPOCH FROM (clock_timestamp() - v_start)) * 1000)::INTEGER,
      v_expired_count,
      format('Đã hết hạn %s hóa đơn', v_expired_count),
      jsonb_build_object('expired_count', v_expired_count)
    );

    RETURN v_expired_count;
  EXCEPTION WHEN OTHERS THEN
    v_error := SQLERRM;
    PERFORM public.log_billing_job(
      'expire_overdue_invoices',
      'failed',
      FLOOR(EXTRACT(EPOCH FROM (clock_timestamp() - v_start)) * 1000)::INTEGER,
      0,
      v_error,
      jsonb_build_object('error', v_error)
    );
    RAISE;
  END;
END;
$$;

-- Renewal invoices look for open/uncollectible invoices and create new 'open' invoices.
CREATE OR REPLACE FUNCTION public.create_renewal_invoices(p_days_before INT DEFAULT 7)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_start TIMESTAMPTZ := clock_timestamp();
  v_sub RECORD;
  v_invoice_no TEXT;
  v_year INT;
  v_period_start DATE;
  v_period_end DATE;
  v_unit_price NUMERIC;
  v_plan public.plans%ROWTYPE;
  v_created INTEGER := 0;
  v_invoice_id UUID;
  v_error TEXT;
BEGIN
  IF p_days_before < 0 THEN
    RAISE EXCEPTION 'p_days_before không hợp lệ';
  END IF;

  SELECT * INTO v_plan FROM public.plans WHERE key = 'vip';
  v_unit_price := COALESCE(v_plan.monthly_price, 69000);
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::INT;

  BEGIN
    PERFORM pg_advisory_xact_lock(hashtextextended('create_renewal_invoices', 0));

    FOR v_sub IN
      SELECT s.tenant_id, s.expires_at
      FROM public.tenant_subscriptions s
      JOIN public.tenants t ON t.id = s.tenant_id
      WHERE s.plan = 'vip'
        AND s.expires_at IS NOT NULL
        AND s.expires_at::DATE >= CURRENT_DATE
        AND s.expires_at::DATE <= CURRENT_DATE + p_days_before
        AND t.status NOT IN ('archived')
        AND NOT EXISTS (
          SELECT 1 FROM public.invoices i
          WHERE i.tenant_id = s.tenant_id
            AND i.status IN ('open', 'uncollectible')
        )
      FOR UPDATE OF s
    LOOP
      v_period_start := v_sub.expires_at::DATE;
      v_period_end := (v_period_start + INTERVAL '1 month')::DATE;
      v_invoice_no := public.get_next_invoice_number(v_year);

      INSERT INTO public.invoices (
        tenant_id, invoice_no, status, issue_date, due_date,
        period_start, period_end, subtotal, discount, tax, total, amount_paid,
        notes, created_by
      ) VALUES (
        v_sub.tenant_id, v_invoice_no, 'open', CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days',
        v_period_start, v_period_end, v_unit_price, 0, 0, v_unit_price, 0,
        'Hóa đơn gia hạn tự động', NULL
      ) RETURNING id INTO v_invoice_id;

      INSERT INTO public.invoice_items (invoice_id, tenant_id, description, quantity, unit_price)
      VALUES (v_invoice_id, v_sub.tenant_id, 'Gói VIP - Tháng (gia hạn)', 1, v_unit_price);

      v_created := v_created + 1;
    END LOOP;

    PERFORM public.log_billing_job(
      'create_renewal_invoices',
      'success',
      FLOOR(EXTRACT(EPOCH FROM (clock_timestamp() - v_start)) * 1000)::INTEGER,
      v_created,
      format('Đã tạo %s hóa đơn gia hạn', v_created),
      jsonb_build_object('created_count', v_created, 'days_before', p_days_before)
    );

    RETURN v_created;
  EXCEPTION WHEN OTHERS THEN
    v_error := SQLERRM;
    PERFORM public.log_billing_job(
      'create_renewal_invoices',
      'failed',
      FLOOR(EXTRACT(EPOCH FROM (clock_timestamp() - v_start)) * 1000)::INTEGER,
      0,
      v_error,
      jsonb_build_object('error', v_error)
    );
    RAISE;
  END;
END;
$$;

-- Dashboard status counts now use 'open' (pending) and 'uncollectible' (overdue/uncollectible).
CREATE OR REPLACE FUNCTION public.get_billing_automation_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_expiring_soon JSONB;
  v_overdue JSONB;
  v_dunning JSONB;
  v_pending_count INT;
BEGIN
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'subdomain', t.subdomain,
      'expires_at', s.expires_at,
      'days_remaining', GREATEST(0, (s.expires_at::DATE - CURRENT_DATE))
    )
  ), '[]'::JSONB)
  INTO v_expiring_soon
  FROM public.tenant_subscriptions s
  JOIN public.tenants t ON t.id = s.tenant_id
  WHERE s.expires_at IS NOT NULL
    AND s.expires_at::DATE >= CURRENT_DATE
    AND s.expires_at::DATE <= CURRENT_DATE + INTERVAL '7 days'
    AND t.status NOT IN ('archived');

  SELECT COUNT(*) INTO v_pending_count
  FROM public.invoices
  WHERE status IN ('open', 'uncollectible');

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', i.id,
      'invoice_no', i.invoice_no,
      'tenant_id', i.tenant_id,
      'tenant_name', t.name,
      'tenant_subdomain', t.subdomain,
      'due_date', i.due_date,
      'status', i.status,
      'balance', i.balance
    )
  ), '[]'::JSONB)
  INTO v_overdue
  FROM public.invoices i
  JOIN public.tenants t ON t.id = i.tenant_id
  WHERE i.status IN ('open', 'uncollectible')
    AND t.status NOT IN ('archived');

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'subdomain', t.subdomain,
      'status', t.status,
      'billing_status', s.billing_status
    )
  ), '[]'::JSONB)
  INTO v_dunning
  FROM public.tenants t
  JOIN public.tenant_subscriptions s ON s.tenant_id = t.id
  WHERE t.status = 'read_only'
    OR s.billing_status = 'overdue';

  RETURN jsonb_build_object(
    'expiring_soon_count', COALESCE(jsonb_array_length(v_expiring_soon), 0),
    'expiring_soon', v_expiring_soon,
    'pending_invoice_count', v_pending_count,
    'overdue_invoice_count', COALESCE(jsonb_array_length(v_overdue), 0),
    'overdue_invoices', v_overdue,
    'dunning_tenant_count', COALESCE(jsonb_array_length(v_dunning), 0),
    'dunning_tenants', v_dunning
  );
END;
$$;
