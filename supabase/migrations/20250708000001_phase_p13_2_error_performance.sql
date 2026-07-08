-- P13.2: Admin dashboard — Error log aggregation + performance metrics
-- ponytail: one table for error_logs; RPCs aggregate errors and read pg_stat_statements.
-- Security: only system admin touches error_logs; performance RPC uses SECURITY DEFINER.

-- ============================================================
-- 1. Extension pg_stat_statements
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ============================================================
-- 2. error_logs table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'unknown',
  level TEXT NOT NULL DEFAULT 'error'
    CHECK (level IN ('error', 'warn', 'info', 'debug')),
  message TEXT NOT NULL,
  detail TEXT,
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS error_logs_source_idx ON public.error_logs(source);
CREATE INDEX IF NOT EXISTS error_logs_level_idx ON public.error_logs(level);
CREATE INDEX IF NOT EXISTS error_logs_created_at_idx ON public.error_logs(created_at DESC);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'error_logs' AND policyname = 'error_logs_admin_all'
  ) THEN
    CREATE POLICY "error_logs_admin_all" ON public.error_logs TO authenticated
      USING (public.is_system_admin())
      WITH CHECK (public.is_system_admin());
  END IF;
END $$;

-- ============================================================
-- 3. RPC: error log summary
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_error_log_summary(
  p_hours INTEGER DEFAULT 24,
  p_limit INTEGER DEFAULT 50
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_since TIMESTAMPTZ;
  v_total INTEGER;
  v_by_source JSON;
  v_recent JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem error logs' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_since := now() - (COALESCE(p_hours, 24) || ' hours')::interval;

  SELECT COUNT(*) INTO v_total FROM public.error_logs WHERE created_at >= v_since;

  v_by_source := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT source, level, COUNT(*) AS count
      FROM public.error_logs
      WHERE created_at >= v_since
      GROUP BY source, level
      ORDER BY count DESC, source
    ) t
  );

  v_recent := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT id, source, level, message, detail, metadata, created_at
      FROM public.error_logs
      WHERE created_at >= v_since
      ORDER BY created_at DESC
      LIMIT COALESCE(p_limit, 50)
    ) t
  );

  RETURN json_build_object(
    'total', COALESCE(v_total, 0),
    'since', v_since,
    'bySource', COALESCE(v_by_source, '[]'::json),
    'recent', COALESCE(v_recent, '[]'::json)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_error_log_summary(INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_error_log_summary(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_error_log_summary(INTEGER, INTEGER) TO service_role;

-- ============================================================
-- 4. RPC: query performance metrics from pg_stat_statements
-- ponytail: P95/P99 are normal approximations from mean + stddev because
-- pg_stat_statements does not store per-call latency distribution.
-- Ceiling: exact percentiles need a separate stats collector (pg_stat_hist).
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_query_performance_metrics()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_total_calls BIGINT;
  v_total_time_ms DOUBLE PRECISION;
  v_weighted_mean DOUBLE PRECISION;
  v_weighted_variance DOUBLE PRECISION;
  v_p95 DOUBLE PRECISION;
  v_p99 DOUBLE PRECISION;
  v_rps DOUBLE PRECISION;
  v_reset_at TIMESTAMPTZ;
  v_elapsed_seconds DOUBLE PRECISION;
  v_top_queries JSON;
BEGIN
  SELECT COALESCE(stats_reset, now()) INTO v_reset_at FROM extensions.pg_stat_statements_info;

  SELECT COALESCE(SUM(calls), 0), COALESCE(SUM(total_exec_time), 0)
    INTO v_total_calls, v_total_time_ms
  FROM extensions.pg_stat_statements;

  IF v_total_calls > 0 THEN
    v_weighted_mean := v_total_time_ms / v_total_calls;

    SELECT COALESCE(SUM(calls * POWER(COALESCE(stddev_exec_time, 0), 2)), 0)
      INTO v_weighted_variance
    FROM extensions.pg_stat_statements
    WHERE stddev_exec_time IS NOT NULL;

    IF v_weighted_variance > 0 AND v_total_calls > 1 THEN
      v_weighted_variance := v_weighted_variance / (v_total_calls - 1);
    ELSE
      v_weighted_variance := 0;
    END IF;

    v_p95 := v_weighted_mean + 1.645 * SQRT(v_weighted_variance);
    v_p99 := v_weighted_mean + 2.326 * SQRT(v_weighted_variance);
  ELSE
    v_weighted_mean := 0;
    v_p95 := 0;
    v_p99 := 0;
  END IF;

  v_elapsed_seconds := GREATEST(EXTRACT(EPOCH FROM (now() - v_reset_at)), 1);
  v_rps := v_total_calls::DOUBLE PRECISION / v_elapsed_seconds;

  v_top_queries := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        LEFT(query, 120) AS query,
        calls,
        ROUND(mean_exec_time::numeric, 3) AS mean_ms,
        ROUND((mean_exec_time + 1.645 * COALESCE(stddev_exec_time, 0))::numeric, 3) AS p95_ms,
        ROUND((mean_exec_time + 2.326 * COALESCE(stddev_exec_time, 0))::numeric, 3) AS p99_ms,
        ROUND(total_exec_time::numeric, 3) AS total_ms
      FROM extensions.pg_stat_statements
      ORDER BY total_exec_time DESC
      LIMIT 10
    ) t
  );

  RETURN json_build_object(
    'totalQueries', COALESCE((SELECT COUNT(*) FROM extensions.pg_stat_statements), 0),
    'totalCalls', v_total_calls,
    'averageTimeMs', ROUND(COALESCE(v_weighted_mean, 0)::numeric, 3),
    'p95Ms', ROUND(COALESCE(v_p95, 0)::numeric, 3),
    'p99Ms', ROUND(COALESCE(v_p99, 0)::numeric, 3),
    'rps', ROUND(v_rps::numeric, 3),
    'resetAt', v_reset_at,
    'topQueries', COALESCE(v_top_queries, '[]'::json)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_query_performance_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_query_performance_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_query_performance_metrics() TO service_role;
