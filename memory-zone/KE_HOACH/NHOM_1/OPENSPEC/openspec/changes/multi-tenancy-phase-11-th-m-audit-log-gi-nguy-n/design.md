## Context

This change implements sub-phase 11: Thêm audit log (giữ nguyên) from the multi-tenancy migration plan.

> **Phase 7 deferred note:** Phase 7 listed the following audit-log constraints that must be satisfied by this phase:
> 1. Trigger `write_audit_log` tự động chỉ ghi `INSERT`/`UPDATE`/`DELETE` với `old_data`/`new_data`.
> 2. Cột `ip_address` và `user_agent` trong bảng `app_audit_log` chỉ được điền khi ghi log thủ công.
> 3. Các sự kiện `LOGIN`, `LOGOUT`, `EXPORT` phải gọi `services/auditService.ts` và truyền IP/user agent từ Edge Function hoặc để `NULL`.

## Goals / Non-Goals

**Goals:**
- Ghi log các thao tác quan trọng.

- Code changes:
  - `services/auditService.ts`: hàm `writeAuditLog` để ghi thủ công các sự kiện không có trigger (`LOGIN`, `LOGOUT`, `EXPORT`). Hàm này cũng điền `ip_address` và `user_agent` từ request headers (chỉ khi gọi từ Edge Function) hoặc để NULL nếu không có.
  - Page xem audit log (chỉ admin/system admin).
  - Trong `AuthContext`: gọi `writeAuditLog('LOGIN')` sau đăng nhập thành công và `writeAuditLog('LOGOUT')` trước sign out.
  - Lưu ý: trigger tự động không điền `ip_address`/`user_agent` vì trong PostgreSQL trigger không dễ lấy thông tin request; các log thủ công mới điền.

**Non-Goals:**
- Other sub-phases.

## Decisions

- Follow the exact SQL and code examples from `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Run `npm run lint` after code changes.

- SQL migration:
  ```sql
  CREATE TABLE public.app_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    action TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT')),
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  
  ALTER TABLE public.app_audit_log ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY "audit_log_tenant_admin" ON public.app_audit_log FOR SELECT TO authenticated
  USING (
    public.is_tenant_admin(tenant_id)
    OR public.is_system_admin()
  );
  
  CREATE OR REPLACE FUNCTION public.write_audit_log()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
  DECLARE
    v_record_id TEXT;
    v_tenant_id UUID;
  BEGIN
    v_record_id := COALESCE(NEW.id::TEXT, OLD.id::TEXT);
    v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
  
    INSERT INTO public.app_audit_log (tenant_id, user_id, table_name, record_id, action, old_data, new_data)
    VALUES (
      v_tenant_id,
      auth.uid(),
      TG_TABLE_NAME,
      v_record_id,
      TG_OP,
      CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
      CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    );
    RETURN NEW;
  END;
  $$;
  ```
  ```sql
  CREATE TRIGGER trg_audit_log_orders
    BEFORE INSERT OR UPDATE OR DELETE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
  
  CREATE TRIGGER trg_audit_log_products
    BEFORE INSERT OR UPDATE OR DELETE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
  
  CREATE TRIGGER trg_audit_log_import_receipts
    BEFORE INSERT OR UPDATE OR DELETE ON public.import_receipts
    FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
  
  CREATE TRIGGER trg_audit_log_disposals
    BEFORE INSERT OR UPDATE OR DELETE ON public.disposals
    FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
  
  CREATE TRIGGER trg_audit_log_app_settings
    BEFORE INSERT OR UPDATE OR DELETE ON public.app_settings
    FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
  ```

## Risks / Trade-offs

- [Medium] Mistakes in SQL migrations can block data access. Mitigation: run on staging first and keep backup.

## Migration / Rollback

- Forward: apply the SQL/code changes in tasks.md.
- Rollback: restore files and revert SQL changes from backup.

## Open Questions

- None specific to this sub-phase.