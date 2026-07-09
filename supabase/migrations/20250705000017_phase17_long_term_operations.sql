-- Phase 17: Thiết lập vận hành dài hạn
-- Mục tiêu: archive đơn hàng > 2 năm, partition audit log, cron data retention, backup/monitoring docs.
-- ponytail: migration idempotent; chạy an toàn nhiều lần.

-- ============================================================
-- 1. Archive tables for data retention
-- ============================================================

-- ponytail: tạo bảng archive sao chép schema từ orders; sau đó bỏ FK để tránh dependency.
CREATE TABLE IF NOT EXISTS public.orders_archive (LIKE public.orders INCLUDING ALL);

-- ponytail: thêm archive cho order_items để tránh orphan records khi xóa đơn cũ.
CREATE TABLE IF NOT EXISTS public.order_items_archive (LIKE public.order_items INCLUDING ALL);

-- Drop FK constraints on archive tables to avoid dependency issues
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.orders_archive'::regclass AND contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE public.orders_archive DROP CONSTRAINT IF EXISTS %I', rec.conname);
  END LOOP;

  FOR rec IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.order_items_archive'::regclass AND contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE public.order_items_archive DROP CONSTRAINT IF EXISTS %I', rec.conname);
  END LOOP;
END $$;

-- Indexes for retention queries
CREATE INDEX IF NOT EXISTS idx_orders_archive_created_at ON public.orders_archive(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_archive_tenant_id ON public.orders_archive(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_archive_order_id ON public.order_items_archive(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_archive_tenant_id ON public.order_items_archive(tenant_id);

-- ============================================================
-- 2. Partitioned audit log table (prepared for future scaling)
-- ============================================================

-- ponytail: tạo bảng partitioned sẵn; việc migrate dữ liệu từ app_audit_log sang bảng này làm riêng khi đạt ~10M rows.
-- ponytail: không dùng INCLUDING ALL vì PK của app_audit_log không chứa partition key created_at.
CREATE TABLE IF NOT EXISTS public.app_audit_log_partitioned (
  LIKE public.app_audit_log INCLUDING DEFAULTS INCLUDING STORAGE INCLUDING COMMENTS
) PARTITION BY RANGE (created_at);

-- ponytail: bổ sung check constraint và PK hợp lệ cho partitioned table.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.app_audit_log_partitioned'::regclass AND conname = 'app_audit_log_partitioned_action_check'
  ) THEN
    ALTER TABLE public.app_audit_log_partitioned
    ADD CONSTRAINT app_audit_log_partitioned_action_check
    CHECK (action IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.app_audit_log_partitioned'::regclass AND conname = 'app_audit_log_partitioned_pkey'
  ) THEN
    ALTER TABLE public.app_audit_log_partitioned
    ADD CONSTRAINT app_audit_log_partitioned_pkey PRIMARY KEY (id, created_at);
  END IF;
END $$;

-- ponytail: chưa tạo partition cụ thể; tạo khi bắt đầu sử dụng bảng partitioned.

-- ============================================================
-- 3. Data retention procedure
-- ============================================================

-- ponytail: drop any previous function/procedure so the kind can change from function to procedure.
DROP ROUTINE IF EXISTS public.run_data_retention() CASCADE;

CREATE OR REPLACE PROCEDURE public.run_data_retention()
LANGUAGE plpgsql
AS $$
DECLARE
  v_cutoff_orders TIMESTAMPTZ;
  v_cutoff_processed TIMESTAMPTZ;
  v_cutoff_rate_limit TIMESTAMPTZ;
  v_partition_name TEXT;
  v_partition_year INT;
  v_partition_month INT;
  v_current_threshold INT;
  v_match TEXT[];
BEGIN
  -- Cutoff dates
  v_cutoff_orders := now() - INTERVAL '2 years';
  v_cutoff_processed := now() - INTERVAL '90 days';
  v_cutoff_rate_limit := now() - INTERVAL '24 hours';
  v_current_threshold := (EXTRACT(YEAR FROM now())::int - 2) * 12 + EXTRACT(MONTH FROM now())::int;

  -- Archive orders older than 2 years
  INSERT INTO public.orders_archive
  SELECT * FROM public.orders
  WHERE created_at < v_cutoff_orders
  ON CONFLICT DO NOTHING;

  -- Archive order_items for orders being archived
  INSERT INTO public.order_items_archive
  SELECT oi.* FROM public.order_items oi
  JOIN public.orders o ON oi.order_id = o.id
  WHERE o.created_at < v_cutoff_orders
  ON CONFLICT DO NOTHING;

  -- Delete archived order_items first to avoid FK errors if order_items.order_id references orders.id
  DELETE FROM public.order_items oi
  WHERE oi.order_id IN (
    SELECT id FROM public.orders WHERE created_at < v_cutoff_orders
  );

  -- Delete archived orders
  DELETE FROM public.orders
  WHERE created_at < v_cutoff_orders;

  -- Clean processed_operations older than 90 days
  -- ponytail: processed_operations dùng cột processed_at thay vì created_at.
  DELETE FROM public.processed_operations
  WHERE processed_at < v_cutoff_processed;

  -- Clean rate_limit_logs older than 24 hours
  DELETE FROM public.rate_limit_logs
  WHERE created_at < v_cutoff_rate_limit;

  -- Drop old audit log partitions older than 24 months (if partitioned table exists and has partitions)
  IF EXISTS (
    SELECT 1 FROM pg_class
    WHERE relname = 'app_audit_log_partitioned' AND relkind = 'p'
  ) THEN
    FOR v_partition_name IN
      SELECT inhrelid::regclass::text
      FROM pg_inherits
      WHERE inhparent = 'public.app_audit_log_partitioned'::regclass
    LOOP
      v_match := regexp_match(v_partition_name, '(\d{4})_(\d{2})$');
      IF v_match IS NOT NULL THEN
        v_partition_year := v_match[1]::int;
        v_partition_month := v_match[2]::int;
        IF (v_partition_year * 12 + v_partition_month) < v_current_threshold THEN
          EXECUTE format('DROP TABLE IF EXISTS %I', v_partition_name);
        END IF;
      END IF;
    END LOOP;
  END IF;
END;
$$;

-- ============================================================
-- 4. Cron schedule
-- ============================================================

-- Ensure pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily data retention at 03:00
-- ponytail: idempotent; cron.schedule sẽ cập nhật job nếu đã tồn tại.
SELECT cron.schedule('data-retention-daily', '0 3 * * *', 'CALL public.run_data_retention();');
