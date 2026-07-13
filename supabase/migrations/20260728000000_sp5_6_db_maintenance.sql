-- SP-5.6: Admin dashboard — Database maintenance panel
-- ponytail: VACUUM cannot run inside a PostgreSQL function/transaction, so this panel
-- records maintenance jobs and runs ANALYZE via RPC. VACUUM/REINDEX still require
-- external Supabase CLI/Coolify runner; the edge function can call a configured URL.

-- ============================================================
-- 1. Job log table for maintenance runs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.db_maintenance_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL
    CHECK (operation IN ('vacuum_analyze', 'reindex', 'bloat_check', 'index_stats')),
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'success', 'failed')),
  tables TEXT[] DEFAULT NULL,
  result JSONB DEFAULT NULL,
  error_message TEXT,
  created_by UUID DEFAULT auth.uid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_db_maintenance_jobs_started_at
  ON public.db_maintenance_jobs(started_at DESC);

ALTER TABLE public.db_maintenance_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS db_maintenance_jobs_admin_all ON public.db_maintenance_jobs;
CREATE POLICY db_maintenance_jobs_admin_all
  ON public.db_maintenance_jobs
  TO authenticated
  USING (public.is_system_admin())
  WITH CHECK (public.is_system_admin());

GRANT SELECT, INSERT, UPDATE ON public.db_maintenance_jobs TO service_role;
REVOKE ALL ON public.db_maintenance_jobs FROM PUBLIC;

-- ============================================================
-- 2. RPC: run a maintenance job (vacuum_analyze / reindex)
-- ============================================================

DROP FUNCTION IF EXISTS public.run_db_maintenance_job(TEXT, TEXT[]);

CREATE OR REPLACE FUNCTION public.run_db_maintenance_job(
  p_operation TEXT,
  p_tables TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'UTC'
AS $$
DECLARE
  v_job public.db_maintenance_jobs%ROWTYPE;
  v_table TEXT;
  v_result JSONB := '{}'::JSONB;
  v_external_url TEXT;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được chạy database maintenance' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_operation NOT IN ('vacuum_analyze', 'reindex') THEN
    RAISE EXCEPTION 'Operation không hợp lệ: %', p_operation;
  END IF;

  INSERT INTO public.db_maintenance_jobs (operation, status, tables, created_by)
  VALUES (p_operation, 'running', p_tables, auth.uid())
  RETURNING * INTO v_job;

  IF p_operation = 'vacuum_analyze' THEN
    -- ponytail: ANALYZE works inside a function; VACUUM does not (PostgreSQL refuses).
    -- For now we run ANALYZE here and document that VACUUM is delegated to autovacuum/CLI.
    IF p_tables IS NOT NULL AND array_length(p_tables, 1) > 0 THEN
      FOREACH v_table IN ARRAY p_tables LOOP
        EXECUTE format('ANALYZE %I', v_table);
      END LOOP;
      v_result := jsonb_build_object(
        'analyzed_tables', p_tables,
        'vacuum_note', 'VACUUM không thể chạy trong RPC; autovacuum/Supabase CLI sẽ xử lý dead tuples'
      );
    ELSE
      ANALYZE;
      v_result := jsonb_build_object(
        'analyzed', 'all tables',
        'vacuum_note', 'VACUUM không thể chạy trong RPC; autovacuum/Supabase CLI sẽ xử lý dead tuples'
      );
    END IF;

    UPDATE public.db_maintenance_jobs
    SET status = 'success', result = v_result, completed_at = now()
    WHERE id = v_job.id
    RETURNING * INTO v_job;

  ELSIF p_operation = 'reindex' THEN
    -- ponytail: plain REINDEX TABLE can run inside a function, but it acquires heavy locks.
    -- To avoid surprise outages we only record the request and optionally call a runner URL.
    v_external_url := COALESCE(current_setting('db_maintenance.runner_url', true), '');

    IF v_external_url <> '' THEN
      BEGIN
        PERFORM net.http_post(
          url := v_external_url,
          body := jsonb_build_object(
            'operation', 'reindex',
            'tables', COALESCE(p_tables, ARRAY[]::TEXT[]),
            'job_id', v_job.id
          ),
          headers := jsonb_build_object('Content-Type', 'application/json'),
          timeout_milliseconds := 30000
        );
        v_result := jsonb_build_object('queued', true, 'runner_url', v_external_url);
      EXCEPTION WHEN OTHERS THEN
        v_result := jsonb_build_object('queued', false, 'error', SQLERRM);
      END;
    ELSE
      v_result := jsonb_build_object(
        'queued', false,
        'note', 'REINDEX cần chạy qua Supabase CLI/Coolify; cấu hình db_maintenance.runner_url để tự động gọi runner'
      );
    END IF;

    UPDATE public.db_maintenance_jobs
    SET status = 'success', result = v_result, completed_at = now()
    WHERE id = v_job.id
    RETURNING * INTO v_job;
  END IF;

  RETURN jsonb_build_object(
    'id', v_job.id,
    'operation', v_job.operation,
    'status', v_job.status,
    'tables', v_job.tables,
    'result', v_job.result,
    'error_message', v_job.error_message,
    'created_by', v_job.created_by,
    'started_at', v_job.started_at,
    'completed_at', v_job.completed_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.run_db_maintenance_job(TEXT, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_db_maintenance_job(TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_db_maintenance_job(TEXT, TEXT[]) TO service_role;

-- ============================================================
-- 3. RPC: list recent maintenance jobs
-- ============================================================

DROP FUNCTION IF EXISTS public.list_db_maintenance_jobs(INT);

CREATE OR REPLACE FUNCTION public.list_db_maintenance_jobs(p_limit INT DEFAULT 50)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET timezone = 'UTC'
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem maintenance jobs' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN COALESCE(
    (
      SELECT jsonb_agg(row_to_json(j.*) ORDER BY j.started_at DESC)
      FROM (
        SELECT id, operation, status, tables, result, error_message, created_by, started_at, completed_at
        FROM public.db_maintenance_jobs
        ORDER BY started_at DESC
        LIMIT GREATEST(p_limit, 1)
      ) j
    ),
    '[]'::JSONB
  );
END;
$$;

REVOKE ALL ON FUNCTION public.list_db_maintenance_jobs(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_db_maintenance_jobs(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_db_maintenance_jobs(INT) TO service_role;

-- ============================================================
-- 4. RPC: table bloat / usage stats from pg_stat_user_tables
-- ============================================================

DROP FUNCTION IF EXISTS public.get_db_table_stats();

CREATE OR REPLACE FUNCTION public.get_db_table_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET timezone = 'UTC'
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem database stats' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN COALESCE(
    (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.dead_row_ratio DESC, t.table_size DESC)
      FROM (
        SELECT
          schemaname AS schema,
          relname AS table_name,
          n_live_tup AS row_count,
          n_dead_tup AS dead_row_count,
          CASE WHEN COALESCE(n_live_tup, 0) + COALESCE(n_dead_tup, 0) > 0
            THEN ROUND((n_dead_tup::NUMERIC / (n_live_tup + n_dead_tup)) * 100, 2)
            ELSE 0
          END AS dead_row_ratio,
          pg_size_pretty(pg_total_relation_size((schemaname || '.' || relname)::regclass)) AS table_size,
          last_vacuum::TEXT,
          last_autovacuum::TEXT,
          last_analyze::TEXT,
          last_autoanalyze::TEXT
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
      ) t
    ),
    '[]'::JSONB
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_db_table_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_db_table_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_db_table_stats() TO service_role;

-- ============================================================
-- 5. RPC: index usage stats from pg_stat_user_indexes
-- ============================================================

DROP FUNCTION IF EXISTS public.get_db_index_stats();

CREATE OR REPLACE FUNCTION public.get_db_index_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET timezone = 'UTC'
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem index stats' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN COALESCE(
    (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.scans DESC, t.index_size DESC)
      FROM (
        SELECT
          schemaname AS schema,
          relname AS table_name,
          indexrelname AS index_name,
          idx_scan AS scans,
          pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
      ) t
    ),
    '[]'::JSONB
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_db_index_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_db_index_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_db_index_stats() TO service_role;
