-- P16.2: Churn + cohort + tenant LTV + sales funnel (YAGNI)
-- ponytail: cohort dùng conversion-to-paid dựa trên ngày thanh toán đầu tiên (dữ liệu chính xác có sẵn);
--           churn dùng snapshot cuối kỳ vì chưa có bảng lịch sử trạng thái.

CREATE OR REPLACE FUNCTION public.get_churn_cohort_metrics(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_cohort_months INTEGER DEFAULT 12
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_start DATE;
  v_end DATE;
  v_cohort_start DATE;
  v_active_start INTEGER;
  v_active_end INTEGER;
  v_churned INTEGER;
  v_churn_rate NUMERIC;
  v_total_revenue NUMERIC;
  v_paying_tenants INTEGER;
  v_ltv NUMERIC;
  v_trial INTEGER;
  v_active_free INTEGER;
  v_paying INTEGER;
  v_churned_funnel INTEGER;
  v_cohort JSONB := '[]'::JSONB;
  v_months TEXT[];
  v_ltv_by_plan JSON;
  v_cohort_row RECORD;
  v_offset INTEGER;
  v_offset_month DATE;
  v_max_offset INTEGER;
  v_converted INTEGER;
  v_retention JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem churn/cohort metrics' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_end := COALESCE(p_end_date, CURRENT_DATE);
  v_start := COALESCE(p_start_date, (v_end - INTERVAL '12 months')::DATE);
  v_cohort_start := (date_trunc('month', v_end) - ((p_cohort_months - 1) || ' months')::INTERVAL)::DATE;

  -- Churn: snapshot approximation trên tập tenant đã tồn tại đầu kỳ.
  SELECT
    COUNT(*) FILTER (WHERE t.created_at < v_start),
    COUNT(*) FILTER (WHERE t.created_at < v_start AND t.status IN ('active','trial','read_only') AND COALESCE(s.billing_status, 'ok') <> 'cancelled')
  INTO v_active_start, v_active_end
  FROM public.tenants t
  LEFT JOIN public.tenant_subscriptions s ON s.tenant_id = t.id;

  v_churned := v_active_start - v_active_end;
  v_churn_rate := CASE WHEN v_active_start > 0 THEN ROUND((v_churned::NUMERIC / v_active_start) * 100, 2) ELSE 0 END;

  -- LTV (lifetime, tất cả payments confirmed).
  SELECT COALESCE(SUM(p.amount), 0), COUNT(DISTINCT p.tenant_id)
  INTO v_total_revenue, v_paying_tenants
  FROM public.payments p
  WHERE p.status = 'confirmed';

  v_ltv := CASE WHEN v_paying_tenants > 0 THEN ROUND(v_total_revenue / v_paying_tenants, 2) ELSE 0 END;

  SELECT COALESCE(json_agg(row_to_json(r) ORDER BY r.revenue DESC), '[]'::json)
  INTO v_ltv_by_plan
  FROM (
    SELECT
      t.plan,
      pl.name AS plan_name,
      COALESCE(SUM(p.amount), 0) AS revenue,
      COUNT(DISTINCT p.tenant_id) AS tenants,
      CASE WHEN COUNT(DISTINCT p.tenant_id) > 0 THEN ROUND(COALESCE(SUM(p.amount), 0) / COUNT(DISTINCT p.tenant_id), 2) ELSE 0 END AS ltv
    FROM public.payments p
    JOIN public.tenants t ON t.id = p.tenant_id
    JOIN public.plans pl ON pl.key = t.plan
    WHERE p.status = 'confirmed'
    GROUP BY t.plan, pl.name
  ) r;

  -- Sales funnel (snapshot hiện tại).
  WITH paying_tenants AS (
    SELECT DISTINCT tenant_id FROM public.payments WHERE status = 'confirmed'
  )
  SELECT
    COUNT(*) FILTER (WHERE t.status = 'trial'),
    COUNT(*) FILTER (WHERE t.status = 'active' AND pt.tenant_id IS NULL AND COALESCE(s.billing_status, 'ok') <> 'cancelled'),
    COUNT(*) FILTER (WHERE t.status IN ('active','read_only') AND pt.tenant_id IS NOT NULL AND COALESCE(s.billing_status, 'ok') <> 'cancelled'),
    COUNT(*) FILTER (WHERE t.status IN ('suspended','archived') OR COALESCE(s.billing_status, 'ok') = 'cancelled')
  INTO v_trial, v_active_free, v_paying, v_churned_funnel
  FROM public.tenants t
  LEFT JOIN paying_tenants pt ON pt.tenant_id = t.id
  LEFT JOIN public.tenant_subscriptions s ON s.tenant_id = t.id;

  -- Cohort conversion-to-paid.
  -- ponytail: O(n²) nested scan; đủ nhanh với số lượng tenant hiện tại, nếu lớn hơn nên materialize first_payment.
  FOR v_cohort_row IN
    SELECT date_trunc('month', t.created_at)::DATE AS cohort_month, COUNT(*) AS total
    FROM public.tenants t
    WHERE t.created_at >= v_cohort_start AND t.created_at < date_trunc('month', v_end)::DATE + INTERVAL '1 month'
    GROUP BY date_trunc('month', t.created_at)::DATE
    ORDER BY cohort_month
  LOOP
    v_retention := '[]'::JSONB;
    v_max_offset := LEAST(
      p_cohort_months,
      (EXTRACT(YEAR FROM v_end)::INT * 12 + EXTRACT(MONTH FROM v_end)::INT) -
      (EXTRACT(YEAR FROM v_cohort_row.cohort_month)::INT * 12 + EXTRACT(MONTH FROM v_cohort_row.cohort_month)::INT)
    );
    FOR v_offset IN 1..GREATEST(v_max_offset, 0) LOOP
      v_offset_month := (v_cohort_row.cohort_month + (v_offset || ' months')::INTERVAL)::DATE;
      SELECT COUNT(DISTINCT t.id)
      INTO v_converted
      FROM public.tenants t
      WHERE date_trunc('month', t.created_at)::DATE = v_cohort_row.cohort_month
        AND EXISTS (
          SELECT 1 FROM public.payments p
          WHERE p.tenant_id = t.id
            AND p.status = 'confirmed'
            AND p.payment_date <= v_offset_month
        );
      v_retention := v_retention || jsonb_build_object(
        'month', to_char(v_offset_month, 'YYYY-MM'),
        'conversionRate', CASE WHEN v_cohort_row.total > 0 THEN ROUND((v_converted::NUMERIC / v_cohort_row.total) * 100, 2) ELSE 0 END
      );
    END LOOP;

    v_cohort := v_cohort || jsonb_build_object(
      'month', to_char(v_cohort_row.cohort_month, 'YYYY-MM'),
      'total', v_cohort_row.total,
      'retention', v_retention
    );
  END LOOP;

  SELECT array_agg(to_char(m, 'YYYY-MM') ORDER BY m)
  INTO v_months
  FROM generate_series(v_cohort_start, date_trunc('month', v_end)::DATE, '1 month'::INTERVAL) m;

  RETURN json_build_object(
    'churn', json_build_object(
      'active_start', v_active_start,
      'active_end', v_active_end,
      'churned_count', v_churned,
      'churn_rate', v_churn_rate,
      'period_start', v_start,
      'period_end', v_end
    ),
    'cohort', json_build_object(
      'months', v_months,
      'cohorts', v_cohort
    ),
    'ltv', json_build_object(
      'average_ltv', v_ltv,
      'total_revenue', v_total_revenue,
      'paying_tenants', v_paying_tenants,
      'by_plan', v_ltv_by_plan
    ),
    'funnel', json_build_object(
      'trial', v_trial,
      'active_free', v_active_free,
      'paying', v_paying,
      'churned', v_churned_funnel
    )
  );
END;
$$;
