-- P16.1: MRR/ARR + revenue by plan RPC + KPI cards (YAGNI)
-- ponytail: dùng plans.monthly_price cho MRR/ARR; revenue by plan từ payments confirmed trong khoảng ngày.

CREATE OR REPLACE FUNCTION public.get_revenue_metrics(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
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
  v_mrr NUMERIC;
  v_arr NUMERIC;
  v_total_revenue NUMERIC;
  v_revenue_by_plan JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem revenue metrics' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Mặc định: từ đầu tháng đến hôm nay (Asia/Ho_Chi_Minh)
  v_start := COALESCE(p_start_date, date_trunc('month', CURRENT_DATE)::DATE);
  v_end := COALESCE(p_end_date, CURRENT_DATE);

  -- MRR = tổng giá tháng của tenant đang active/read_only trên gói trả phí
  SELECT COALESCE(SUM(pl.monthly_price), 0)
  INTO v_mrr
  FROM public.tenants t
  JOIN public.plans pl ON pl.key = t.plan
  WHERE t.status IN ('active', 'read_only')
    AND pl.monthly_price > 0;

  v_arr := v_mrr * 12;

  -- Revenue by plan = tổng payments confirmed trong khoảng ngày, group theo plan tenant
  SELECT
    COALESCE(json_agg(row_to_json(r) ORDER BY r.revenue DESC), '[]'::json),
    COALESCE(SUM(r.revenue), 0)
  INTO v_revenue_by_plan, v_total_revenue
  FROM (
    SELECT
      t.plan,
      pl.name AS plan_name,
      COALESCE(SUM(p.amount), 0) AS revenue,
      COUNT(p.id) AS payment_count
    FROM public.payments p
    JOIN public.tenants t ON t.id = p.tenant_id
    JOIN public.plans pl ON pl.key = t.plan
    WHERE p.status = 'confirmed'
      AND p.payment_date BETWEEN v_start AND v_end
    GROUP BY t.plan, pl.name
  ) r;

  RETURN json_build_object(
    'mrr', v_mrr,
    'arr', v_arr,
    'total_revenue', v_total_revenue,
    'revenue_by_plan', v_revenue_by_plan,
    'period_start', v_start,
    'period_end', v_end
  );
END;
$$;
