-- Phase 10 — Báo cáo doanh thu / lợi nhuận / tồn kho / NCC
-- Mục tiêu: số liệu báo cáo khớp với dữ liệu gốc; loại trừ đơn hủy; trừ giá trị hàng đã trả; đồng bộ SSOT repo với DB thật.
-- ⚠️ KHÔNG CHẠY LẠI các migration phase5c/phase8/phase9 cũ đã deploy — sẽ ghi đè logic mới.

-- ============================================
-- 1. get_sales_report — loại trừ đơn hủy, trừ hàng trả
-- ============================================
CREATE OR REPLACE FUNCTION public.get_sales_report(
  p_start_date date,
  p_end_date date,
  p_status text DEFAULT 'all'::text,
  p_payment_method text DEFAULT ''::text,
  p_product_keyword text DEFAULT ''::text,
  p_customer_keyword text DEFAULT ''::text
)
RETURNS json
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  v_result JSON;
  v_span_days INT;
  v_prev_start DATE;
  v_prev_end DATE;
BEGIN
  v_span_days := (p_end_date - p_start_date) + 1;
  v_prev_start := p_start_date - v_span_days;
  v_prev_end := p_start_date - 1;

  WITH filtered_orders AS (
    SELECT DISTINCT
      o.id,
      o.date,
      o.customer_id,
      o.customer_name,
      o.total_amount,
      COALESCE(o.total_returned_amount, 0) AS total_returned_amount,
      o.status,
      o.payment_method
    FROM orders o
    WHERE (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN p_start_date AND p_end_date
      AND (p_status = 'all' OR o.status = p_status)
      AND (p_payment_method = '' OR o.payment_method = p_payment_method)
      AND (
        p_customer_keyword = ''
        OR LOWER(o.customer_name) LIKE '%' || LOWER(p_customer_keyword) || '%'
      )
      AND (
        p_product_keyword = ''
        OR EXISTS (
          SELECT 1
          FROM order_items oi
          JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = o.id
            AND LOWER(oi.product_name) LIKE '%' || LOWER(p_product_keyword) || '%'
        )
      )
  ),
  active_orders AS (
    SELECT * FROM filtered_orders WHERE status != 'cancelled'
  ),
  cancelled_orders AS (
    SELECT * FROM filtered_orders WHERE status = 'cancelled'
  ),
  returned_items AS (
    SELECT
      ro.original_order_id AS order_id,
      roi.product_id,
      COALESCE(SUM(roi.quantity), 0) AS returned_qty
    FROM return_orders ro
    JOIN return_order_items roi ON roi.return_order_id = ro.id
    WHERE ro.status != 'cancelled'
    GROUP BY ro.original_order_id, roi.product_id
  ),
  all_items AS (
    SELECT
      o.id AS order_id,
      o.date,
      o.customer_id,
      o.customer_name,
      o.status,
      o.payment_method,
      oi.product_id,
      oi.product_name,
      oi.quantity,
      oi.price,
      COALESCE(ri.returned_qty, 0) AS returned_qty,
      (oi.price * (oi.quantity - COALESCE(ri.returned_qty, 0))) AS item_revenue
    FROM active_orders o
    JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN returned_items ri
      ON ri.order_id = o.id AND ri.product_id = oi.product_id
  ),
  prev_orders AS (
    SELECT DISTINCT o.id, o.total_amount
    FROM orders o
    WHERE (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN v_prev_start AND v_prev_end
      AND o.status != 'cancelled'
  ),
  summary AS (
    SELECT json_build_object(
      'totalRevenue', COALESCE(SUM(ao.total_amount - ao.total_returned_amount), 0),
      'totalOrders', COUNT(DISTINCT ao.id),
      'avgOrderValue', CASE WHEN COUNT(DISTINCT ao.id) > 0
                           THEN SUM(ao.total_amount - ao.total_returned_amount) / COUNT(DISTINCT ao.id)
                           ELSE 0 END,
      'uniqueCustomers', COUNT(DISTINCT ao.customer_id),
      'completedRevenue', COALESCE(SUM(fo.total_amount - fo.total_returned_amount) FILTER (WHERE fo.status = 'completed'), 0),
      'cancelledRevenue', COALESCE(SUM(co.total_amount), 0),
      'completedOrders', COUNT(DISTINCT fo.id) FILTER (WHERE fo.status = 'completed'),
      'cancelledOrders', COUNT(DISTINCT co.id),
      'prevRevenue', COALESCE((SELECT SUM(po.total_amount) FROM prev_orders po), 0),
      'prevOrdersCount', COALESCE((SELECT COUNT(*) FROM prev_orders po), 0)
    ) AS result
    FROM filtered_orders fo
    LEFT JOIN active_orders ao ON ao.id = fo.id
    LEFT JOIN cancelled_orders co ON co.id = fo.id
  ),
  daily_revenue AS (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.date), '[]'::json) AS result
    FROM (
      SELECT
        d.date,
        COALESCE(o.revenue, 0) AS revenue,
        COALESCE(o.orders, 0) AS orders,
        COALESCE(o.revenue, 0) - COALESCE(i.cost, 0) AS profit
      FROM (
        SELECT DISTINCT to_char((dd.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date
        FROM (
          SELECT date FROM active_orders
          UNION
          SELECT date FROM all_items
        ) dd
      ) d
      LEFT JOIN (
        SELECT
          to_char((date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date,
          SUM(total_amount - total_returned_amount) AS revenue,
          COUNT(*) AS orders
        FROM active_orders
        GROUP BY (date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ) o ON o.date = d.date
      LEFT JOIN (
        SELECT
          to_char((date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date,
          SUM(item_revenue) AS cost
        FROM all_items
        GROUP BY (date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ) i ON i.date = d.date
    ) t
  ),
  payment_data AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        COALESCE(ao.payment_method, 'Khác') AS name,
        COALESCE(SUM(ao.total_amount - ao.total_returned_amount), 0) AS value
      FROM active_orders ao
      GROUP BY ao.payment_method
    ) t
  ),
  grouped_by_product AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        COALESCE(fi.product_id, '') AS key,
        COALESCE(fi.product_name, 'Không xác định') AS label,
        COALESCE(SUM(fi.item_revenue), 0) AS revenue,
        0 AS orders,
        COALESCE(SUM(fi.quantity - fi.returned_qty), 0) AS count
      FROM all_items fi
      GROUP BY fi.product_id, fi.product_name
      ORDER BY SUM(fi.item_revenue) DESC
    ) t
  ),
  grouped_by_customer AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        COALESCE(ao.customer_id, 'guest') AS key,
        COALESCE(ao.customer_name, 'Khách lẻ') AS label,
        COALESCE(SUM(ao.total_amount - ao.total_returned_amount), 0) AS revenue,
        COUNT(DISTINCT ao.id) AS orders,
        0 AS count
      FROM active_orders ao
      GROUP BY ao.customer_id, ao.customer_name
      ORDER BY SUM(ao.total_amount - ao.total_returned_amount) DESC
    ) t
  ),
  grouped_by_day AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        to_char((ao.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS key,
        to_char((ao.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS label,
        COALESCE(SUM(ao.total_amount - ao.total_returned_amount), 0) AS revenue,
        COUNT(DISTINCT ao.id) AS orders,
        0 AS count
      FROM active_orders ao
      GROUP BY (ao.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ORDER BY (ao.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date DESC
    ) t
  ),
  grouped_by_order AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        ao.id AS key,
        ('Đơn ' || ao.id) AS label,
        COALESCE(ao.total_amount - ao.total_returned_amount, 0) AS revenue,
        1 AS orders,
        0 AS count
      FROM active_orders ao
      ORDER BY (ao.total_amount - ao.total_returned_amount) DESC
    ) t
  ),
  detail_rows AS (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.date DESC), '[]'::json) AS result
    FROM (
      SELECT
        to_char((fi.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date,
        fi.order_id AS order_id,
        COALESCE(fi.product_name, '') AS product_name,
        (fi.quantity - fi.returned_qty) AS quantity,
        fi.item_revenue AS revenue,
        COALESCE(fi.customer_name, '') AS customer_name,
        COALESCE(fi.payment_method, 'N/A') AS payment_method
      FROM all_items fi
    ) t
  )
  SELECT json_build_object(
    'summary', s.result,
    'dailyRevenue', dr.result,
    'paymentData', pd.result,
    'groupedByProduct', gbp.result,
    'groupedByCustomer', gbc.result,
    'groupedByDay', gbd.result,
    'groupedByOrder', gbo.result,
    'detailRows', dtr.result
  )
  INTO v_result
  FROM summary s, daily_revenue dr, payment_data pd,
       grouped_by_product gbp, grouped_by_customer gbc,
       grouped_by_day gbd, grouped_by_order gbo, detail_rows dtr;

  RETURN v_result;
END;
$function$;

-- ============================================
-- 2. get_profit_report — loại trừ đơn hủy, trừ hàng trả, giá vốn tại thời điểm bán
-- ============================================
CREATE OR REPLACE FUNCTION public.get_profit_report(
  p_start_date date,
  p_end_date date,
  p_status text DEFAULT 'all'::text,
  p_payment_method text DEFAULT ''::text,
  p_product_keyword text DEFAULT ''::text,
  p_customer_keyword text DEFAULT ''::text,
  p_compare_mode text DEFAULT 'prev'::text
)
RETURNS json
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  v_result JSON;
  v_span_days INT;
  v_compare_start DATE;
  v_compare_end DATE;
BEGIN
  v_span_days := (p_end_date - p_start_date) + 1;
  IF p_compare_mode = 'samePeriod' THEN
    v_compare_start := p_start_date - INTERVAL '1 year';
    v_compare_end := p_end_date - INTERVAL '1 year';
  ELSE
    v_compare_start := p_start_date - v_span_days;
    v_compare_end := p_start_date - 1;
  END IF;

  WITH filtered_orders AS (
    SELECT DISTINCT
      o.id,
      o.date,
      o.customer_id,
      o.customer_name,
      o.total_amount,
      COALESCE(o.total_returned_amount, 0) AS total_returned_amount,
      o.status,
      o.payment_method
    FROM orders o
    WHERE (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN p_start_date AND p_end_date
      AND (p_status = 'all' OR o.status = p_status)
      AND (p_payment_method = '' OR o.payment_method = p_payment_method)
      AND (
        p_customer_keyword = ''
        OR LOWER(o.customer_name) LIKE '%' || LOWER(p_customer_keyword) || '%'
      )
      AND (
        p_product_keyword = ''
        OR EXISTS (
          SELECT 1
          FROM order_items oi
          JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = o.id
            AND LOWER(oi.product_name) LIKE '%' || LOWER(p_product_keyword) || '%'
        )
      )
  ),
  active_orders AS (
    SELECT * FROM filtered_orders WHERE status != 'cancelled'
  ),
  returned_items AS (
    SELECT
      ro.original_order_id AS order_id,
      roi.product_id,
      COALESCE(SUM(roi.quantity), 0) AS returned_qty
    FROM return_orders ro
    JOIN return_order_items roi ON roi.return_order_id = ro.id
    WHERE ro.status != 'cancelled'
    GROUP BY ro.original_order_id, roi.product_id
  ),
  all_items AS (
    SELECT
      o.id AS order_id,
      o.date,
      o.customer_id,
      o.customer_name,
      o.status,
      o.payment_method,
      oi.product_id,
      oi.product_name,
      oi.quantity,
      oi.price,
      COALESCE(oi.cost, COALESCE(p.cost, 0)) AS unit_cost,
      COALESCE(ri.returned_qty, 0) AS returned_qty,
      (oi.quantity - COALESCE(ri.returned_qty, 0)) AS net_qty,
      (oi.price * (oi.quantity - COALESCE(ri.returned_qty, 0))) AS item_revenue,
      (COALESCE(oi.cost, COALESCE(p.cost, 0)) * (oi.quantity - COALESCE(ri.returned_qty, 0))) AS item_cost
    FROM active_orders o
    JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN returned_items ri
      ON ri.order_id = o.id AND ri.product_id = oi.product_id
  ),
  compare_orders AS (
    SELECT DISTINCT
      o.id,
      o.date,
      o.total_amount,
      COALESCE(o.total_returned_amount, 0) AS total_returned_amount,
      o.status
    FROM orders o
    WHERE (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN v_compare_start AND v_compare_end
      AND o.status != 'cancelled'
  ),
  compare_returned_items AS (
    SELECT
      ro.original_order_id AS order_id,
      roi.product_id,
      COALESCE(SUM(roi.quantity), 0) AS returned_qty
    FROM return_orders ro
    JOIN return_order_items roi ON roi.return_order_id = ro.id
    WHERE ro.status != 'cancelled'
    GROUP BY ro.original_order_id, roi.product_id
  ),
  compare_items AS (
    SELECT
      o.id AS order_id,
      o.date,
      oi.product_id,
      oi.product_name,
      oi.quantity,
      oi.price,
      COALESCE(oi.cost, COALESCE(p.cost, 0)) AS unit_cost,
      COALESCE(cri.returned_qty, 0) AS returned_qty,
      (oi.price * (oi.quantity - COALESCE(cri.returned_qty, 0))) AS item_revenue,
      (COALESCE(oi.cost, COALESCE(p.cost, 0)) * (oi.quantity - COALESCE(cri.returned_qty, 0))) AS item_cost
    FROM compare_orders o
    JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN compare_returned_items cri
      ON cri.order_id = o.id AND cri.product_id = oi.product_id
  ),
  summary AS (
    SELECT json_build_object(
      'totalRevenue', COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM active_orders), 0),
      'totalCost', COALESCE((SELECT SUM(item_cost) FROM all_items), 0),
      'profit', COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM active_orders), 0)
              - COALESCE((SELECT SUM(item_cost) FROM all_items), 0),
      'margin', CASE WHEN COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM active_orders), 0) > 0
                     THEN ((COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM active_orders), 0)
                           - COALESCE((SELECT SUM(item_cost) FROM all_items), 0))
                           / COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM active_orders), 0)) * 100
                     ELSE 0 END,
      'prevRevenue', COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM compare_orders), 0),
      'prevCost', COALESCE((SELECT SUM(item_cost) FROM compare_items), 0),
      'prevProfit', COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM compare_orders), 0)
                  - COALESCE((SELECT SUM(item_cost) FROM compare_items), 0),
      'profitChange', CASE WHEN (COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM compare_orders), 0)
                              - COALESCE((SELECT SUM(item_cost) FROM compare_items), 0)) > 0
                         THEN ((COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM active_orders), 0)
                               - COALESCE((SELECT SUM(item_cost) FROM all_items), 0))
                               - (COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM compare_orders), 0)
                                 - COALESCE((SELECT SUM(item_cost) FROM compare_items), 0)))
                              / (COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM compare_orders), 0)
                                - COALESCE((SELECT SUM(item_cost) FROM compare_items), 0)) * 100
                         ELSE 0 END
    ) AS result
  ),
  daily_profit AS (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.date), '[]'::json) AS result
    FROM (
      SELECT
        d.date,
        COALESCE(o.revenue, 0) AS current_revenue,
        COALESCE(o.revenue, 0) - COALESCE(i.cost, 0) AS current_profit,
        COALESCE(po.revenue, 0) AS prev_revenue,
        COALESCE(po.revenue, 0) - COALESCE(pi.cost, 0) AS prev_profit
      FROM (
        SELECT DISTINCT to_char((dd.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date
        FROM (
          SELECT date FROM active_orders
          UNION
          SELECT date FROM all_items
          UNION
          SELECT date FROM compare_orders
          UNION
          SELECT date FROM compare_items
        ) dd
      ) d
      LEFT JOIN (
        SELECT
          to_char((date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date,
          SUM(total_amount - total_returned_amount) AS revenue
        FROM active_orders
        GROUP BY (date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ) o ON o.date = d.date
      LEFT JOIN (
        SELECT
          to_char((date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date,
          SUM(item_cost) AS cost
        FROM all_items
        GROUP BY (date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ) i ON i.date = d.date
      LEFT JOIN (
        SELECT
          to_char((date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date,
          SUM(total_amount - total_returned_amount) AS revenue
        FROM compare_orders
        GROUP BY (date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ) po ON po.date = d.date
      LEFT JOIN (
        SELECT
          to_char((date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date,
          SUM(item_cost) AS cost
        FROM compare_items
        GROUP BY (date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ) pi ON pi.date = d.date
    ) t
  ),
  profit_details AS (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.date DESC), '[]'::json) AS result
    FROM (
      SELECT
        to_char((fi.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date,
        fi.order_id,
        COALESCE(fi.product_name, '') AS product_name,
        fi.item_revenue AS revenue,
        fi.item_cost AS cost,
        (fi.item_revenue - fi.item_cost) AS profit,
        CASE WHEN fi.item_revenue > 0
             THEN ((fi.item_revenue - fi.item_cost) / fi.item_revenue) * 100
             ELSE 0 END AS margin
      FROM all_items fi
    ) t
  ),
  grouped_by_product AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        COALESCE(fi.product_id, '') AS key,
        COALESCE(fi.product_name, 'Không xác định') AS label,
        COALESCE(SUM(fi.item_revenue), 0) AS revenue,
        COALESCE(SUM(fi.item_cost), 0) AS cost,
        COALESCE(SUM(fi.item_revenue - fi.item_cost), 0) AS profit,
        COALESCE(SUM(fi.net_qty), 0) AS count
      FROM all_items fi
      GROUP BY fi.product_id, fi.product_name
      ORDER BY SUM(fi.item_revenue - fi.item_cost) DESC
    ) t
  ),
  grouped_by_customer AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        COALESCE(cust.customer_id, 'guest') AS key,
        COALESCE(cust.customer_name, 'Khách lẻ') AS label,
        COALESCE(cust.revenue, 0) AS revenue,
        COALESCE(c.cost, 0) AS cost,
        COALESCE(cust.revenue - c.cost, 0) AS profit,
        cust.order_count AS count
      FROM (
        SELECT
          customer_id,
          customer_name,
          SUM(total_amount - total_returned_amount) AS revenue,
          COUNT(*) AS order_count
        FROM active_orders
        GROUP BY customer_id, customer_name
      ) cust
      LEFT JOIN (
        SELECT
          customer_id,
          SUM(item_cost) AS cost
        FROM all_items
        GROUP BY customer_id
      ) c ON c.customer_id = cust.customer_id
      ORDER BY (cust.revenue - COALESCE(c.cost, 0)) DESC
    ) t
  ),
  grouped_by_day AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        day.key AS key,
        day.key AS label,
        COALESCE(day.revenue, 0) AS revenue,
        COALESCE(c.cost, 0) AS cost,
        COALESCE(day.revenue - c.cost, 0) AS profit
      FROM (
        SELECT
          to_char((ao.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS key,
          SUM(total_amount - total_returned_amount) AS revenue
        FROM active_orders ao
        GROUP BY (ao.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ) day
      LEFT JOIN (
        SELECT
          to_char((date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS key,
          SUM(item_cost) AS cost
        FROM all_items
        GROUP BY (date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ) c ON c.key = day.key
      ORDER BY day.key DESC
    ) t
  )
  SELECT json_build_object(
    'summary', s.result,
    'dailyProfit', dp.result,
    'profitDetails', pd.result,
    'groupedByProduct', gbp.result,
    'groupedByCustomer', gbc.result,
    'groupedByDay', gbd.result
  )
  INTO v_result
  FROM summary s, daily_profit dp, profit_details pd,
       grouped_by_product gbp, grouped_by_customer gbc, grouped_by_day gbd;

  RETURN v_result;
END;
$function$;

-- ============================================
-- 3. get_inventory_report — xuất bán chỉ tính đơn hoàn thành, đã trừ hàng trả
-- ============================================
CREATE OR REPLACE FUNCTION public.get_inventory_report(
  p_start_date date,
  p_end_date date,
  p_category text DEFAULT ''::text,
  p_stock_status text DEFAULT 'all'::text
)
RETURNS json
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  v_result JSON;
BEGIN
  WITH product_values AS (
    SELECT
      p.id,
      COALESCE(SUM(pl.quantity * pl.cost), p.quantity * p.cost) AS total_value,
      COALESCE(SUM(pl.quantity), p.quantity) AS total_qty
    FROM products p
    LEFT JOIN product_lots pl ON pl.product_id = p.id
    GROUP BY p.id, p.quantity, p.cost
  ),
  returned_items AS (
    SELECT
      ro.original_order_id AS order_id,
      roi.product_id,
      COALESCE(SUM(roi.quantity), 0) AS returned_qty
    FROM return_orders ro
    JOIN return_order_items roi ON roi.return_order_id = ro.id
    WHERE ro.status != 'cancelled'
    GROUP BY ro.original_order_id, roi.product_id
  ),
  summary AS (
    SELECT json_build_object(
      'totalValue', COALESCE(SUM(pv.total_value), 0),
      'totalQty', COALESCE(SUM(pv.total_qty), 0),
      'lowStockCount', COUNT(*) FILTER (WHERE p.quantity > 0 AND p.min_stock IS NOT NULL AND p.quantity <= p.min_stock),
      'outOfStockCount', COUNT(*) FILTER (WHERE COALESCE(p.quantity, 0) <= 0)
    ) AS result
    FROM products p
    LEFT JOIN product_values pv ON pv.id = p.id
    WHERE (p_category = '' OR p.category = p_category)
  ),
  inventory_by_category AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        COALESCE(p.category, 'Chưa phân loại') AS name,
        COALESCE(SUM(pv.total_value), 0) AS value
      FROM products p
      LEFT JOIN product_values pv ON pv.id = p.id
      WHERE (p_category = '' OR p.category = p_category)
      GROUP BY p.category
    ) t
  ),
  export_in_period AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        oi.product_id,
        COALESCE(oi.product_name, 'Không xác định') AS name,
        COALESCE(SUM(oi.quantity - COALESCE(ri.returned_qty, 0)), 0)::int AS qty,
        COALESCE(SUM(COALESCE(oi.cost, COALESCE(p.cost, 0)) * (oi.quantity - COALESCE(ri.returned_qty, 0))), 0) AS value
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN returned_items ri
        ON ri.order_id = o.id AND ri.product_id = oi.product_id
      WHERE (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN p_start_date AND p_end_date
        AND o.status != 'cancelled'
      GROUP BY oi.product_id, oi.product_name
      ORDER BY SUM(oi.quantity - COALESCE(ri.returned_qty, 0)) DESC
    ) t
  ),
  low_stock_products AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        p.id,
        p.code,
        p.name,
        p.category,
        p.unit,
        COALESCE(p.quantity, 0) AS quantity,
        COALESCE(p.min_stock, 5) AS min_stock,
        COALESCE(p.cost, 0) AS cost,
        COALESCE(pv.total_value, 0) AS value
      FROM products p
      LEFT JOIN product_values pv ON pv.id = p.id
      WHERE (p_category = '' OR p.category = p_category)
        AND p.quantity <= COALESCE(p.min_stock, 5)
      ORDER BY p.quantity ASC
    ) t
  ),
  products_filtered AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        p.id,
        p.code,
        p.name,
        p.category,
        p.unit,
        COALESCE(p.quantity, 0) AS quantity,
        COALESCE(p.min_stock, 5) AS min_stock,
        COALESCE(p.cost, 0) AS cost,
        COALESCE(pv.total_value, 0) AS value
      FROM products p
      LEFT JOIN product_values pv ON pv.id = p.id
      WHERE (p_category = '' OR p.category = p_category)
        AND (
          p_stock_status = 'all'
          OR (p_stock_status = 'in' AND p.quantity > COALESCE(p.min_stock, 5))
          OR (p_stock_status = 'low' AND p.quantity > 0 AND p.quantity <= COALESCE(p.min_stock, 5))
          OR (p_stock_status = 'out' AND COALESCE(p.quantity, 0) <= 0)
        )
      ORDER BY p.name ASC
    ) t
  ),
  categories AS (
    SELECT COALESCE(json_agg(DISTINCT category), '[]'::json) AS result
    FROM (
      SELECT DISTINCT TRIM(p.category) AS category
      FROM products p
      WHERE p.category IS NOT NULL AND p.category <> ''
      ORDER BY TRIM(p.category)
    ) cats
  )
  SELECT json_build_object(
    'summary', s.result,
    'inventoryByCategory', ibc.result,
    'exportInPeriod', eip.result,
    'lowStockProducts', lsp.result,
    'products', pf.result,
    'categories', c.result
  )
  INTO v_result
  FROM summary s, inventory_by_category ibc, export_in_period eip,
       low_stock_products lsp, products_filtered pf, categories c;

  RETURN v_result;
END;
$function$;

-- ============================================
-- 4. get_supplier_report — báo cáo NCC (đẩy từ Phase 8)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_supplier_report(
  p_start_date date,
  p_end_date date
)
RETURNS json
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  v_summary JSON;
  v_top_suppliers JSON;
  v_supplier_growth JSON;
  v_import_by_supplier JSON;
BEGIN
  SELECT json_build_object(
    'totalSuppliers', COALESCE((SELECT COUNT(*) FROM suppliers), 0),
    'totalDebt', COALESCE((SELECT SUM(debt) FROM suppliers), 0),
    'totalPaid', COALESCE((SELECT SUM(paid_amount) FROM import_receipts WHERE status = 'completed'), 0),
    'totalImportValue', COALESCE((SELECT SUM(total_cost) FROM import_receipts WHERE status = 'completed' AND (date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN p_start_date AND p_end_date), 0)
  ) INTO v_summary;

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_top_suppliers
  FROM (
    SELECT
      s.id,
      s.code,
      s.name,
      COALESCE(SUM(ir.total_cost), 0) AS total_import_value,
      COALESCE(SUM(ir.paid_amount), 0) AS total_paid,
      COALESCE(s.debt, 0) AS debt,
      COUNT(DISTINCT ir.id)::int AS import_count
    FROM suppliers s
    LEFT JOIN import_receipts ir ON ir.supplier_id = s.id AND ir.status = 'completed'
    GROUP BY s.id, s.code, s.name, s.debt
    ORDER BY COALESCE(SUM(ir.total_cost), 0) DESC
    LIMIT 50
  ) t;

  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.date), '[]'::json) INTO v_supplier_growth
  FROM (
    SELECT
      to_char((s.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date,
      COUNT(*)::int AS new_suppliers
    FROM suppliers s
    WHERE (s.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN p_start_date AND p_end_date
    GROUP BY (s.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
  ) t;

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_import_by_supplier
  FROM (
    SELECT
      s.id,
      s.name,
      COALESCE(SUM(ir.total_cost), 0) AS value
    FROM suppliers s
    LEFT JOIN import_receipts ir ON ir.supplier_id = s.id AND ir.status = 'completed'
      AND (ir.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN p_start_date AND p_end_date
    GROUP BY s.id, s.name
    ORDER BY COALESCE(SUM(ir.total_cost), 0) DESC
  ) t;

  RETURN json_build_object(
    'summary', v_summary,
    'topSuppliers', v_top_suppliers,
    'supplierGrowth', v_supplier_growth,
    'importBySupplier', v_import_by_supplier
  );
END;
$function$;
