-- P11.3: Impersonation "Login as tenant admin"
-- Mục tiêu: Cho phép system admin tạo phiên impersonate để đăng nhập với tư cách admin của một tenant,
-- kèm audit log đầy đủ (ai, tenant nào, lúc nào, bao lâu).
-- ponytail: dùng cột trên tenant_memberships để đánh dấu phiên impersonate, không tạo bảng mới.

-- ============================================================
-- 1. Thêm cột đánh dấu impersonate lên tenant_memberships
-- ============================================================
ALTER TABLE public.tenant_memberships
  ADD COLUMN IF NOT EXISTS impersonated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS impersonated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS impersonated_expires_at TIMESTAMPTZ;

-- ============================================================
-- 2. Cập nhật trigger giới hạn user: không tính các row impersonate
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_tenant_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant public.tenants%ROWTYPE;
  v_sub public.tenant_subscriptions%ROWTYPE;
  v_current INTEGER;
  v_max INTEGER;
BEGIN
  -- ponytail: kiểm tra tenant tồn tại và đang active trước khi kiểm tra giới hạn.
  SELECT * INTO v_tenant FROM public.tenants WHERE id = NEW.tenant_id;
  IF NOT FOUND OR v_tenant.status NOT IN ('active', 'trial') THEN
    RAISE EXCEPTION 'Tenant không hoạt động hoặc không tồn tại';
  END IF;

  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = NEW.tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy subscription cho tenant';
  END IF;

  IF TG_TABLE_NAME = 'tenant_memberships' THEN
    -- ponytail: impersonation rows không tính vào giới hạn user của gói dịch vụ.
    SELECT count(*) INTO v_current
      FROM public.tenant_memberships
      WHERE tenant_id = NEW.tenant_id AND impersonated_by IS NULL;
    v_max := v_sub.max_users;
    IF v_current >= v_max THEN
      RAISE EXCEPTION 'Đã đạt giới hạn số user của gói dịch vụ';
    END IF;
  ELSIF TG_TABLE_NAME = 'products' THEN
    SELECT count(*) INTO v_current FROM public.products WHERE tenant_id = NEW.tenant_id;
    v_max := v_sub.max_products;
    IF v_current >= v_max THEN
      RAISE EXCEPTION 'Đã đạt giới hạn số sản phẩm của gói dịch vụ';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger đã tồn tại từ migration P7; việc replace function là đủ.

-- ============================================================
-- 3. Mở rộng CHECK constraint action của app_audit_log để ghi IMPERSONATE
-- ============================================================
ALTER TABLE public.app_audit_log
  DROP CONSTRAINT IF EXISTS app_audit_log_action_check;
ALTER TABLE public.app_audit_log
  ADD CONSTRAINT app_audit_log_action_check
  CHECK (action IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT','IMPERSONATE','IMPERSONATE_END'));

-- Bảng partitioned chuẩn bị cho tương lai cũng cần mở rộng tương tự.
ALTER TABLE public.app_audit_log_partitioned
  DROP CONSTRAINT IF EXISTS app_audit_log_partitioned_action_check;
ALTER TABLE public.app_audit_log_partitioned
  ADD CONSTRAINT app_audit_log_partitioned_action_check
  CHECK (action IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT','IMPERSONATE','IMPERSONATE_END'));
