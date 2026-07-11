## Context

This change implements sub-phase 7: Thiết kế giới hạn và gói dịch vụ (giữ nguyên) from the multi-tenancy migration plan.

## Goals / Non-Goals

**Goals:**
- 2 gói Free/VIP, giới hạn SKU, đơn/tháng, user.

- Code changes:
  - `services/subscriptionService.ts`: `getSubscription`, `checkLimit`, `isNearLimit`
  - ponytail: các trigger `check_tenant_limits` và `increment_monthly_order_count` đọc count rồi so sánh. Với nhiều request đồng thời, có thể vượt giới hạn một vài đơn. Ở giai đoạn đầu (Free/VIP đơn giản) chấp nhận được; nếu sau này cần chính xác tuyệt đối, chuyển sang dùng advisory lock hoặc serializable transaction.
  - Đảm bảo mỗi tenant luôn có row trong `tenant_subscriptions` khi tạo (xem Phase 9.1).

**Non-Goals:**
- Other sub-phases.

## Decisions

- Follow the exact SQL and code examples from `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Run `npm run lint` after code changes.

- SQL migration:
  ```sql
  CREATE OR REPLACE FUNCTION public.check_tenant_limits()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
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
      SELECT count(*) INTO v_current FROM public.tenant_memberships WHERE tenant_id = NEW.tenant_id;
      v_max := v_sub.max_users;
      IF v_current >= v_max THEN RAISE EXCEPTION 'Đã đạt giới hạn số user của gói dịch vụ'; END IF;
    ELSIF TG_TABLE_NAME = 'products' THEN
      SELECT count(*) INTO v_current FROM public.products WHERE tenant_id = NEW.tenant_id;
      v_max := v_sub.max_products;
      IF v_current >= v_max THEN RAISE EXCEPTION 'Đã đạt giới hạn số sản phẩm của gói dịch vụ'; END IF;
    END IF;
    RETURN NEW;
  END;
  $$;
  
  CREATE TRIGGER trg_check_tenant_user_limit
    BEFORE INSERT ON public.tenant_memberships
    FOR EACH ROW EXECUTE FUNCTION public.check_tenant_limits();
  
  CREATE TRIGGER trg_check_tenant_product_limit
    BEFORE INSERT ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.check_tenant_limits();
  
  CREATE OR REPLACE FUNCTION public.increment_monthly_order_count()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
  DECLARE
    v_tenant public.tenants%ROWTYPE;
    v_sub public.tenant_subscriptions%ROWTYPE;
  BEGIN
    -- ponytail: kiểm tra tenant active và subscription tồn tại trước khi tăng counter.
    SELECT * INTO v_tenant FROM public.tenants WHERE id = NEW.tenant_id;
    IF NOT FOUND OR v_tenant.status NOT IN ('active', 'trial') THEN
      RAISE EXCEPTION 'Tenant không hoạt động hoặc không tồn tại';
    END IF;
  
    SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = NEW.tenant_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Không tìm thấy subscription cho tenant';
    END IF;
  
    IF v_sub.current_month_start IS NULL OR v_sub.current_month_start <> date_trunc('month', CURRENT_DATE)::DATE THEN
      UPDATE public.tenant_subscriptions
      SET current_month_orders = 1,
          current_month_start = date_trunc('month', CURRENT_DATE)::DATE,
          updated_at = now()
      WHERE tenant_id = NEW.tenant_id;
    ELSE
      IF v_sub.current_month_orders >= v_sub.max_orders_per_month THEN
        RAISE EXCEPTION 'Đã đạt giới hạn số đơn hàng/tháng của gói dịch vụ';
      END IF;
      UPDATE public.tenant_subscriptions
      SET current_month_orders = current_month_orders + 1,
          updated_at = now()
      WHERE tenant_id = NEW.tenant_id;
    END IF;
    RETURN NEW;
  END;
  $$;
  
  CREATE TRIGGER trg_check_tenant_order_limit
    BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.increment_monthly_order_count();
  ```

## Risks / Trade-offs

- [Medium] Mistakes in SQL migrations can block data access. Mitigation: run on staging first and keep backup.

## Migration / Rollback

- Forward: apply the SQL/code changes in tasks.md.
- Rollback: restore files and revert SQL changes from backup.

## Open Questions

- None specific to this sub-phase.