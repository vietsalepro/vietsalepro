## Context

This change implements sub-phase 10.1: DB policies theo role from the multi-tenancy migration plan.

## Goals / Non-Goals

**Goals:**
- 4 role, policies theo role.


**Non-Goals:**
- Other sub-phases.

## Decisions

- Follow the exact SQL and code examples from `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Run `npm run lint` after code changes.

- SQL migration:
  ```sql
  CREATE OR REPLACE FUNCTION public.user_tenant_role(p_tenant_id UUID)
  RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT role FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = auth.uid() LIMIT 1;
  $$;
  
  -- ponytail: PostgreSQL kết hợp các policy bằng OR. Nếu giữ policy INSERT/UPDATE/DELETE
  -- generic của Phase 5 và thêm policy theo role, nhân viên vẫn insert được.
  -- Vì vậy ở các bảng cần phân quyền chi tiết, cần DROP policy generic trước.
  -- Bảng chỉ cần tenant isolation (ví dụ order_items) thì giữ nguyên.
  
  -- ORDERS: admin/cashier được tạo; chỉ admin được sửa/xóa
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.orders;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.orders;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.orders;
  
  CREATE POLICY "orders_insert_by_role" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND public.is_tenant_member(tenant_id)
    AND public.user_tenant_role(tenant_id) IN ('admin', 'cashier')
  );
  
  CREATE POLICY "orders_update_by_role" ON public.orders FOR UPDATE TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND public.is_tenant_member(tenant_id)
    AND public.user_tenant_role(tenant_id) = 'admin'
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND public.is_tenant_member(tenant_id)
    AND public.user_tenant_role(tenant_id) = 'admin'
  );
  
  CREATE POLICY "orders_delete_admin_only" ON public.orders FOR DELETE TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND public.is_tenant_member(tenant_id)
    AND public.user_tenant_role(tenant_id) = 'admin'
  );
  
  -- PRODUCTS: admin/inventory_manager được tạo; chỉ admin được sửa/xóa
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.products;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.products;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.products;
  
  CREATE POLICY "products_insert_by_role" ON public.products FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND public.is_tenant_member(tenant_id)
    AND public.user_tenant_role(tenant_id) IN ('admin', 'inventory_manager')
  );
  
  CREATE POLICY "products_update_by_role" ON public.products FOR UPDATE TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND public.is_tenant_member(tenant_id)
    AND public.user_tenant_role(tenant_id) = 'admin'
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND public.is_tenant_member(tenant_id)
    AND public.user_tenant_role(tenant_id) = 'admin'
  );
  
  CREATE POLICY "products_delete_admin_only" ON public.products FOR DELETE TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND public.is_tenant_member(tenant_id)
    AND public.user_tenant_role(tenant_id) = 'admin'
  );
  
  -- IMPORT_RECEIPTS, INVENTORY_COUNTS, DISPOSALS: admin/inventory_manager được tạo; chỉ admin được sửa/xóa
  -- Pattern tương tự products; lặp lại cho các bảng này.
  
  -- CUSTOMERS: admin/cashier tạo; chỉ admin sửa/xóa
  -- Pattern tương tự orders.
  
  -- SUPPLIERS: admin/inventory_manager tạo; chỉ admin sửa/xóa
  
  -- APP_SETTINGS, EINVOICE_CONFIG, RANK_CONFIGS: chỉ admin tạo/sửa/xóa
  
  -- BÁO CÁO / CÔNG NỢ: dữ liệu báo cáo thường là aggregation từ nhiều bảng.
  -- Cách 1: giữ SELECT policy ở Phase 5 cho tất cả member, hạn chế ở UI (đơn giản).
  -- Cách 2: tạo view/RPC riêng cho báo cáo với policy chỉ admin/accountant (bảo mật chặt).
  -- Chọn cách 2 nếu cần đảm bảo cashier/inventory_manager không đọc dữ liệu báo cáo qua API.
  ```

## Risks / Trade-offs

- [Medium] Mistakes in SQL migrations can block data access. Mitigation: run on staging first and keep backup.

## Migration / Rollback

- Forward: apply the SQL/code changes in tasks.md.
- Rollback: restore files and revert SQL changes from backup.

## Open Questions

- None specific to this sub-phase.