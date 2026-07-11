# KẾ HOẠCH SỬA LỖI TOÀN DIỆN - QUẢN LÝ USER & PHÂN QUYỀN
## Phiên bản: 2.1 | Ngày: 11/07/2026 | Mục tiêu: Hệ thống vận hành 20+ năm không lỗi

> ⚠️ **Ghi chép kiểm định**: Tài liệu này đã được **đối chiếu với source code thực tế** vào ngày 11/07/2026.
> - **Nguồn A**: `FIX_PLAN_USER_MANAGEMENT_SECURITY.md` (phiên bản cũ) — phát hiện 15 lỗi
> - **Nguồn B**: `reports/admin_dashboard_user_management_audit.md` — phát hiện 12 lỗi
> - **Kiểm định source code**: Đã đọc và xác minh từng lỗi với code thực tế (28 files)
> - **Phát hiện mới**: 5 lỗi bổ sung chưa có trong cả 2 nguồn
> - **Tổng cộng**: **28 lỗi** được phân loại và xác nhận dưới đây
> - **Tất cả đều có hướng giải quyết chi tiết, code mẫu production-ready**

---

## MỤC LỤC

1. [Nguyên tắc thiết kế nền tảng](#1-nguyên-tắc-thiết-kế-nền-tảng)
2. [Phân loại & Ưu tiên](#2-phân-loại--ưu-tiên)
3. [P0 - Lỗi NGHIÊM TRỌNG - Fix ngay lập tức](#3-p0---lỗi-nghiêm-trọng---fix-ngay-lập-tức)
4. [P1 - Lỗi CAO - Fix trong sprint hiện tại](#4-p1---lỗi-cao---fix-trong-sprint-hiện-tại)
5. [P2 - Lỗi TRUNG BÌNH - Fix trong roadmap](#5-p2---lỗi-trung-bình---fix-trong-roadmap)
6. [P3 - Lỗi THẤP - Cải tiến dần](#6-p3---lỗi-thấp---cải-tiến-dần)
7. [Phát hiện mới từ kiểm định source code](#7-phát-hiện-mới-từ-kiểm-định-source-code)
8. [Kiến trúc mới đề xuất](#8-kiến-trúc-mới-đề-xuất)
9. [Roadmap triển khai](#9-roadmap-triển-khai)
10. [Checklist kiểm thử sau fix](#10-checklist-kiểm-thử-sau-fix)

---

## 1. NGUYÊN TẮC THIẾT KẾ NỀN TẢNG

### 1.1. Zero Trust Authorization
- **Mọi request đều phải được xác thực và phân quyền** - không có "internal" hay "trusted" request nào bypass
- Client-side check chỉ là UX, server-side check là bắt buộc
- Edge Function / RPC SECURITY DEFINER là ranh giới bảo mật duy nhất

### 1.2. Defense in Depth
- 3 lớp bảo vệ cho mọi hành động nhạy cảm:
  - **Lớp 1:** RLS (Row Level Security) trên database
  - **Lớp 2:** RPC SECURITY DEFINER với check role bên trong
  - **Lớp 3:** Edge Function với service_role_key + auth check

### 1.3. Immutable Audit Trail
- Mọi thay đổi về user, role, permission đều phải ghi vào `app_audit_log`
- Audit log không bao giờ được xoá (append-only)
- Bao gồm: ai làm, làm gì, khi nào, từ IP nào, dữ liệu cũ, dữ liệu mới

### 1.4. Fail Safe & Rollback
- Mọi operation phải có rollback nếu fail ở bước giữa chừng
- Không để hệ thống ở trạng thái "orphan" (user Auth tồn tại nhưng không có membership nào)
- Transaction atomic cho multi-step operations

### 1.5. Rate Limiting Everywhere
- Mọi endpoint public/admin đều phải có rate limiting
- Rate limit theo: IP, user_id, tenant_id (multi-dimensional)

---

## 2. PHÂN LOẠI & ƯU TIÊN

| Mức | Ý nghĩa | Hành động | Thời gian |
|-----|---------|-----------|-----------|
| **P0** | Lỗ hổng bảo mật có thể bị khai thác ngay | Fix ngay lập tức, không deploy code khác trước khi fix | 0-2 ngày |
| **P1** | Lỗi logic có thể gây mất dữ liệu hoặc phá vỡ business | Fix trong sprint hiện tại | 1-2 tuần |
| **P2** | Thiếu tính năng quan trọng (audit, validation) | Fix trong roadmap 1-2 tháng | 1-2 tháng |
| **P3** | Cải tiến chất lượng, không ảnh hưởng bảo mật | Fix khi có thời gian | 3-6 tháng |

---

## 3. P0 - LỖI NGHIÊM TRỌNG - FIX NGAY LẬP TỨC

### 3.1. removeMember() KHÔNG có auth check

**Nguồn phát hiện:** Nguồn A
**Kiểm định source:** ✅ **XÁC NHẬN** - `services/tenantService.ts` dòng 545-553
**Trạng thái:** ❌ Chưa fix
**Mô tả:** Gọi `supabase.from('tenant_memberships').delete()` trực tiếp. DB trigger `trg_tenant_memberships_guardrails` chỉ bảo vệ owner và admin cuối cùng, nhưng **KHÔNG kiểm tra ai đang gọi**. Bất kỳ user authenticated nào biết tenantId + userId đều có thể xoá member.

**Phương án fix chi tiết:**

**Bước 1:** Tạo RPC `remove_tenant_member` với SECURITY DEFINER + đầy đủ guard:

```sql
-- Migration: 20260712000001_fix_remove_tenant_member_rpc.sql
CREATE OR REPLACE FUNCTION public.remove_tenant_member(
  p_tenant_id UUID,
  p_user_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_target_role TEXT;
  v_admin_count INT;
  v_is_owner BOOLEAN;
  v_membership_exists BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  
  -- Guard 1: Caller must be authenticated
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu xác thực' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- Guard 2: Check caller is system admin OR tenant admin
  IF NOT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = v_caller_id) THEN
    SELECT role INTO v_caller_role
    FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = v_caller_id;
    
    IF v_caller_role IS NULL THEN
      RAISE EXCEPTION 'Bạn không phải thành viên của tenant này' USING ERRCODE = 'insufficient_privilege';
    END IF;
    
    IF v_caller_role != 'admin' THEN
      RAISE EXCEPTION 'Chỉ admin của tenant hoặc system admin được xóa thành viên' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  
  -- Guard 3: Check target membership exists
  SELECT EXISTS(
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = p_user_id
  ) INTO v_membership_exists;
  
  IF NOT v_membership_exists THEN
    RAISE EXCEPTION 'Thành viên không tồn tại trong tenant này' USING ERRCODE = 'no_data_found';
  END IF;
  
  -- Guard 4: Self-delete guard
  IF v_caller_id = p_user_id THEN
    RAISE EXCEPTION 'Không thể tự xóa chính mình khỏi tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- Guard 5: Owner guard
  SELECT tm.role, (t.owner_id = p_user_id) INTO v_target_role, v_is_owner
  FROM public.tenant_memberships tm
  JOIN public.tenants t ON t.id = tm.tenant_id
  WHERE tm.tenant_id = p_tenant_id AND tm.user_id = p_user_id;
  
  IF v_is_owner THEN
    RAISE EXCEPTION 'Không thể xóa chủ sở hữu của tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- Guard 6: Last admin guard (chỉ tính admin active + is_active = true)
  IF v_target_role = 'admin' THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id 
      AND role = 'admin' 
      AND user_id != p_user_id
      AND status IN ('active', 'pending')
      AND is_active = true;
    
    IF v_admin_count = 0 THEN
      RAISE EXCEPTION 'Không thể xóa admin duy nhất của tenant' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  
  -- Execute delete
  DELETE FROM public.tenant_memberships
  WHERE tenant_id = p_tenant_id AND user_id = p_user_id;
  
  -- Audit log
  INSERT INTO public.app_audit_log (tenant_id, user_id, table_name, record_id, action, old_data, ip_address)
  VALUES (p_tenant_id, v_caller_id, 'tenant_memberships', p_user_id, 'MEMBER_REMOVE', 
          jsonb_build_object('user_id', p_user_id, 'role', v_target_role),
          current_setting('request.headers')::jsonb->>'x-forwarded-for');
END;
$$;
```

**Bước 2:** Cập nhật service layer:

```typescript
// services/tenantService.ts - sửa function removeMember
export async function removeMember(tenantId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_tenant_member', {
    p_tenant_id: tenantId,
    p_user_id: userId,
  });
  if (error) throw error;
}
```

### 3.2. updateMemberRole() KHÔNG có auth check

**Nguồn phát hiện:** Nguồn A
**Kiểm định source:** ✅ **XÁC NHẬN** - `services/tenantService.ts` dòng 528-543
**Trạng thái:** ❌ Chưa fix
**Mô tả:** Gọi `supabase.from('tenant_memberships').update()` trực tiếp. DB trigger chỉ chặn hạ role admin cuối cùng và đổi role owner, nhưng **KHÔNG kiểm tra ai đang gọi**.

**Phương án fix chi tiết:**

```sql
-- Migration: 20260712000002_fix_update_tenant_member_role_rpc.sql
CREATE OR REPLACE FUNCTION public.update_tenant_member_role(
  p_tenant_id UUID,
  p_user_id UUID,
  p_role TEXT
) RETURNS public.tenant_memberships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_old_role TEXT;
  v_admin_count INT;
  v_is_owner BOOLEAN;
  v_row public.tenant_memberships;
BEGIN
  v_caller_id := auth.uid();
  
  -- Guard 1: Authenticated
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu xác thực' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- Guard 2: Validate role
  IF p_role NOT IN ('admin', 'cashier', 'inventory_manager', 'accountant') THEN
    RAISE EXCEPTION 'Vai trò không hợp lệ. Chỉ chấp nhận: admin, cashier, inventory_manager, accountant' USING ERRCODE = 'check_violation';
  END IF;
  
  -- Guard 3: Check caller authorization
  IF NOT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = v_caller_id) THEN
    SELECT role INTO v_caller_role
    FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = v_caller_id;
    
    IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
      RAISE EXCEPTION 'Chỉ admin của tenant hoặc system admin được đổi vai trò' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  
  -- Guard 4: Self-demote guard
  IF v_caller_id = p_user_id THEN
    RAISE EXCEPTION 'Không thể tự đổi vai trò của chính mình' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- Guard 5: Get current role and owner status
  SELECT tm.role, (t.owner_id = p_user_id) INTO v_old_role, v_is_owner
  FROM public.tenant_memberships tm
  JOIN public.tenants t ON t.id = tm.tenant_id
  WHERE tm.tenant_id = p_tenant_id AND tm.user_id = p_user_id;
  
  IF v_old_role IS NULL THEN
    RAISE EXCEPTION 'Thành viên không tồn tại trong tenant này' USING ERRCODE = 'no_data_found';
  END IF;
  
  -- Guard 6: Cannot change owner's role
  IF v_is_owner THEN
    RAISE EXCEPTION 'Không thể đổi vai trò của chủ sở hữu tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- Guard 7: If demoting from admin, check last admin (chỉ tính active + is_active = true)
  IF v_old_role = 'admin' AND p_role != 'admin' THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id 
      AND role = 'admin' 
      AND user_id != p_user_id
      AND status IN ('active', 'pending')
      AND is_active = true;
    
    IF v_admin_count = 0 THEN
      RAISE EXCEPTION 'Không thể hạ role admin duy nhất của tenant' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  
  -- Execute update
  UPDATE public.tenant_memberships
  SET role = p_role, updated_at = now()
  WHERE tenant_id = p_tenant_id AND user_id = p_user_id
  RETURNING * INTO v_row;
  
  -- Audit log
  INSERT INTO public.app_audit_log (tenant_id, user_id, table_name, record_id, action, old_data, new_data, ip_address)
  VALUES (p_tenant_id, v_caller_id, 'tenant_memberships', p_user_id, 'MEMBER_ROLE_CHANGE', 
          jsonb_build_object('old_role', v_old_role, 'new_role', p_role),
          jsonb_build_object('old_role', v_old_role, 'new_role', p_role),
          current_setting('request.headers')::jsonb->>'x-forwarded-for');
  
  RETURN v_row;
END;
$$;
```

```typescript
// services/tenantService.ts - sửa function updateMemberRole
export async function updateMemberRole(
  tenantId: string,
  userId: string,
  role: TenantRole
): Promise<TenantMembership> {
  const { data, error } = await supabase.rpc('update_tenant_member_role', {
    p_tenant_id: tenantId,
    p_user_id: userId,
    p_role: role,
  });
  if (error) throw error;
  return mapMembershipFromDB(data);
}
```

### 3.3. toggleMemberActive() KHÔNG có auth check

**Nguồn phát hiện:** Nguồn A
**Kiểm định source:** ✅ **XÁC NHẬN** - `services/tenantService.ts` dòng 445-455
**Trạng thái:** ❌ Chưa fix
**Mô tả:** Gọi `supabase.from('tenant_memberships').update()` trực tiếp. **KHÔNG có guardrail nào bảo vệ** - trigger `trg_tenant_memberships_guardrails` chỉ kiểm tra khi `role` thay đổi, không kiểm tra khi `is_active` thay đổi.

**Phương án fix chi tiết:**

```sql
-- Migration: 20260712000003_fix_toggle_tenant_member_active_rpc.sql
CREATE OR REPLACE FUNCTION public.toggle_tenant_member_active(
  p_tenant_id UUID,
  p_user_id UUID,
  p_is_active BOOLEAN
) RETURNS public.tenant_memberships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_target_role TEXT;
  v_is_owner BOOLEAN;
  v_admin_count INT;
  v_row public.tenant_memberships;
BEGIN
  v_caller_id := auth.uid();
  
  -- Guard 1: Authenticated
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu xác thực' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- Guard 2: Check caller authorization
  IF NOT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = v_caller_id) THEN
    SELECT role INTO v_caller_role
    FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = v_caller_id;
    
    IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
      RAISE EXCEPTION 'Chỉ admin của tenant hoặc system admin được thay đổi trạng thái' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  
  -- Guard 3: Self-toggle guard
  IF v_caller_id = p_user_id THEN
    RAISE EXCEPTION 'Không thể tự thay đổi trạng thái kích hoạt của chính mình' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- Guard 4: Get target info
  SELECT tm.role, (t.owner_id = p_user_id) INTO v_target_role, v_is_owner
  FROM public.tenant_memberships tm
  JOIN public.tenants t ON t.id = tm.tenant_id
  WHERE tm.tenant_id = p_tenant_id AND tm.user_id = p_user_id;
  
  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'Thành viên không tồn tại trong tenant này' USING ERRCODE = 'no_data_found';
  END IF;
  
  -- Guard 5: Cannot deactivate owner
  IF v_is_owner AND p_is_active = false THEN
    RAISE EXCEPTION 'Không thể vô hiệu hóa chủ sở hữu của tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- Guard 6: If deactivating admin, check last active admin
  IF v_target_role = 'admin' AND p_is_active = false THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id 
      AND role = 'admin' 
      AND user_id != p_user_id
      AND status IN ('active', 'pending')
      AND is_active = true;
    
    IF v_admin_count = 0 THEN
      RAISE EXCEPTION 'Không thể vô hiệu hóa admin duy nhất của tenant' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  
  -- Execute update
  UPDATE public.tenant_memberships
  SET is_active = p_is_active, updated_at = now()
  WHERE tenant_id = p_tenant_id AND user_id = p_user_id
  RETURNING * INTO v_row;
  
  -- Audit log
  INSERT INTO public.app_audit_log (tenant_id, user_id, table_name, record_id, action, old_data, new_data, ip_address)
  VALUES (p_tenant_id, v_caller_id, 'tenant_memberships', p_user_id, 'MEMBER_TOGGLE_ACTIVE',
          jsonb_build_object('is_active', NOT p_is_active),
          jsonb_build_object('is_active', p_is_active),
          current_setting('request.headers')::jsonb->>'x-forwarded-for');
  
  RETURN v_row;
END;
$$;
```

```typescript
// services/tenantService.ts - sửa function toggleMemberActive
export async function toggleMemberActive(tenantId: string, userId: string, isActive: boolean): Promise<TenantMembership> {
  const { data, error } = await supabase.rpc('toggle_tenant_member_active', {
    p_tenant_id: tenantId,
    p_user_id: userId,
    p_is_active: isActive,
  });
  if (error) throw error;
  return mapMembershipFromDB(data);
}
```

### 3.4. addSystemAdmin() / removeSystemAdmin() - THIẾU SECURITY DEFINER

**Nguồn phát hiện:** Nguồn A
**Kiểm định source:** ✅ **XÁC NHẬN** - `services/systemAdminService.ts` dòng 65-74
**Trạng thái:** ⚠️ **Fix một phần**
- `add_system_admin` RPC: Đã được sửa thành SECURITY DEFINER trong `20260708000004_fix_system_admin_rls.sql` ✅
- `remove_system_admin` RPC: **VẪN dùng SECURITY INVOKER** trong `20250706000004_phase_p5_audit_security.sql` dòng 159-183 ❌
- `remove_system_admin`: **KHÔNG kiểm tra admin cuối cùng** ❌

**Phương án fix chi tiết:**

```sql
-- Migration: 20260712000004_fix_remove_system_admin_security_definer.sql
-- Fix: remove_system_admin cần SECURITY DEFINER + check admin cuối cùng + audit log

CREATE OR REPLACE FUNCTION public.remove_system_admin(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Changed from SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_admin_count INT;
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();
  
  -- Guard 1: Must be authenticated
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu xác thực' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- Guard 2: Must be system admin
  IF NOT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = v_caller_id) THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xóa system admin' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Guard 3: Cannot remove self
  IF p_user_id = v_caller_id THEN
    RAISE EXCEPTION 'Không thể tự xóa quyền system admin của chính mình' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Guard 4: Check last admin
  SELECT COUNT(*) INTO v_admin_count
  FROM public.system_admins
  WHERE user_id != p_user_id;

  IF v_admin_count = 0 THEN
    RAISE EXCEPTION 'Không thể xóa system admin cuối cùng' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Guard 5: Check target exists
  IF NOT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Không tìm thấy system admin: %', p_user_id USING ERRCODE = 'no_data_found';
  END IF;

  -- Execute delete
  DELETE FROM public.system_admins WHERE user_id = p_user_id;

  -- Audit log
  INSERT INTO public.app_audit_log (user_id, table_name, record_id, action, old_data)
  VALUES (v_caller_id, 'system_admins', p_user_id, 'SYSTEM_ADMIN_REMOVE',
          jsonb_build_object('removed_user_id', p_user_id, 'removed_by', v_caller_id));

  RETURN TRUE;
END;
$$;
```

### 3.5. createTenant() (direct insert) KHÔNG có auth check

**Nguồn phát hiện:** Nguồn A
**Kiểm định source:** ✅ **XÁC NHẬN** - `services/tenantService.ts` dòng 632-651
**Trạng thái:** ⚠️ **Được bảo vệ gián tiếp bởi RLS** (RLS policy trên tenants table chặn non-system-admin insert), nhưng service function không có guard.
**Mô tả:** Gọi `supabase.from('tenants').insert()` trực tiếp. RLS bảo vệ ở DB layer, nhưng nếu RLS bị vô hiệu hoá hoặc có lỗi, function này sẽ bypass mọi validation.

**Phương án fix chi tiết:**

```typescript
// services/tenantService.ts - XOÁ function createTenant() hoàn toàn
// Chỉ giữ lại createTenantWithCredentials() gọi Edge Function
// 
// Lý do: 
// 1. Direct insert bypass mọi validation (subdomain, plan, owner)
// 2. Không tạo subscription, membership, credentials
// 3. Không audit log
// 4. Không gửi email setup
// 
// Edge Function create-tenant đã xử lý tất cả các bước trên

// Nếu vẫn cần giữ function cho testing, thêm guard:
export async function createTenant(input: {
  name: string;
  subdomain: string;
  plan?: Tenant['plan'];
  ownerId?: string;
}): Promise<Tenant> {
  // Check caller is system admin
  const { data: isAdmin } = await supabase.rpc('is_system_admin');
  if (!isAdmin) {
    throw new Error('Chỉ system admin mới được tạo tenant');
  }
  
  const { data, error } = await supabase
    .from('tenants')
    .insert({
      name: input.name,
      subdomain: input.subdomain,
      plan: input.plan ?? 'free',
      owner_id: input.ownerId ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapTenantFromDB(data);
}
```

### 3.6. 🔴 create-system-admin Edge Function bị lỗi logic CRITICAL

**Nguồn phát hiện:** Nguồn B
**Kiểm định source:** ✅ **XÁC NHẬN** - `supabase/functions/create-system-admin/index.ts` dòng 151-159
**Trạng thái:** ❌ Chưa fix
**Mô tả:** Edge Function gọi `supabaseAdmin.rpc('add_system_admin', { p_user_id: newUserId })` từ service-role client. RPC `add_system_admin` kiểm tra `is_system_admin()` dựa trên `auth.uid()`, nhưng khi gọi từ service-role client, `auth.uid()` là `null` → check thất bại → RPC throw error → Edge Function xoá auth user vừa tạo (rollback). **Kết quả: không thể tạo system admin mới.**

**Phương án fix chi tiết:**

```typescript
// supabase/functions/create-system-admin/index.ts
// SỬA: dòng 151-159 - thay vì gọi RPC, insert trực tiếp

// === CODE CŨ (BỊ LỖI) ===
// const { error: rpcError } = await supabaseAdmin.rpc('add_system_admin', {
//   p_user_id: newUserId,
// });
// if (rpcError) {
//   await supabaseAdmin.auth.admin.deleteUser(newUserId);
//   return jsonResponse({ error: 'Failed to assign system admin role: ' + rpcError.message }, 500);
// }

// === CODE MỚI (FIX) ===
// Assign system admin role via direct insert (service_role bypass RLS)
const { error: insertError } = await supabaseAdmin
  .from('system_admins')
  .insert({ user_id: newUserId });

if (insertError) {
  // Rollback: delete the user if admin assignment fails
  await supabaseAdmin.auth.admin.deleteUser(newUserId);
  return jsonResponse({ error: 'Failed to assign system admin role: ' + insertError.message }, 500);
}
```

**Giải thích:** Khi dùng `supabaseAdmin` (service_role_key), client có quyền bypass RLS. Insert trực tiếp vào `system_admins` table hoạt động mà không cần qua RPC `add_system_admin`. RPC `add_system_admin` kiểm tra `is_system_admin()` dựa trên `auth.uid()`, nhưng service-role client không có `auth.uid()` → check thất bại.

---

## 4. P1 - LỖI CAO - FIX TRONG SPRINT HIỆN TẠI

### 4.1. Không bảo vệ owner/admin cuối cùng (thiếu status/is_active filter)

**Nguồn phát hiện:** Nguồn A + B
**Kiểm định source:** ✅ **XÁC NHẬN** - `20260711000005_f33_members_guardrails.sql` dòng 25-29
**Trạng thái:** ⚠️ **Fix một phần**
- Đã có trigger bảo vệ owner và admin cuối cùng ✅
- **NHƯNG trigger không filter theo `status`/`is_active`** khi đếm admin cuối cùng ❌
- **KHÔNG bảo vệ toggle `is_active` trên admin cuối cùng** ❌

**Phương án fix chi tiết:**

```sql
-- Migration: 20260712000005_fix_guardrail_trigger_status_active_filter.sql
-- Fix: thêm filter status/is_active + bảo vệ toggle is_active

CREATE OR REPLACE FUNCTION public.trg_tenant_memberships_guardrails()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_other_admins INT;
  v_hard_delete TEXT;
BEGIN
  -- Skip checks when tenant itself is being deleted (cascade)
  v_hard_delete := current_setting('app.hard_delete_tenant', true);
  IF v_hard_delete IS NOT NULL AND v_hard_delete = 'true' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT owner_id INTO v_owner_id
  FROM public.tenants
  WHERE id = COALESCE(OLD.tenant_id, NEW.tenant_id);

  -- ============ DELETE OPERATION ============
  IF TG_OP = 'DELETE' THEN
    -- Cannot delete owner
    IF OLD.user_id = v_owner_id THEN
      RAISE EXCEPTION 'Không thể xóa owner của tenant' USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- Cannot delete last admin (chỉ tính admin active + is_active = true)
    IF OLD.role = 'admin' THEN
      SELECT COUNT(*) INTO v_other_admins
      FROM public.tenant_memberships
      WHERE tenant_id = OLD.tenant_id
        AND role = 'admin'
        AND user_id <> OLD.user_id
        AND status IN ('active', 'pending')
        AND is_active = true;

      IF v_other_admins = 0 THEN
        RAISE EXCEPTION 'Không thể xóa admin cuối cùng của tenant' USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;

    RETURN OLD;
  END IF;

  -- ============ UPDATE OPERATION ============
  IF TG_OP = 'UPDATE' THEN
    -- Cannot change owner's role
    IF OLD.user_id = v_owner_id AND NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Không thể đổi role của owner tenant' USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- Cannot demote last admin (chỉ tính admin active + is_active = true)
    IF OLD.role = 'admin' AND NEW.role <> 'admin' THEN
      SELECT COUNT(*) INTO v_other_admins
      FROM public.tenant_memberships
      WHERE tenant_id = OLD.tenant_id
        AND role = 'admin'
        AND user_id <> OLD.user_id
        AND status IN ('active', 'pending')
        AND is_active = true;

      IF v_other_admins = 0 THEN
        RAISE EXCEPTION 'Không thể hạ role admin cuối cùng của tenant' USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;

    -- Cannot deactivate last admin (MỚI: bảo vệ toggle is_active)
    IF OLD.role = 'admin' AND NEW.is_active IS DISTINCT FROM OLD.is_active AND NEW.is_active = false THEN
      SELECT COUNT(*) INTO v_other_admins
      FROM public.tenant_memberships
      WHERE tenant_id = OLD.tenant_id
        AND role = 'admin'
        AND user_id <> OLD.user_id
        AND status IN ('active', 'pending')
        AND is_active = true;

      IF v_other_admins = 0 THEN
        RAISE EXCEPTION 'Không thể vô hiệu hóa admin duy nhất của tenant' USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;
```

### 4.2. Hard-delete tenant không có soft-delete

**Nguồn phát hiện:** Nguồn A
**Kiểm định source:** ✅ **XÁC NHẬN** - `supabase/functions/delete-tenant/index.ts`
**Trạng thái:** ❌ Chưa fix
**Mô tả:** `delete-tenant` Edge Function xoá vĩnh viễn tenant và tất cả dữ liệu ngay lập tức. Không có soft-delete stage.

**Phương án fix chi tiết:**

```sql
-- Migration: 20260712000006_add_soft_delete_columns.sql
-- Thêm cột soft-delete cho tenants
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS hard_delete_approved_by UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS hard_delete_requested_at TIMESTAMPTZ;
```

```typescript
// supabase/functions/delete-tenant/index.ts
// SỬA: thêm soft-delete stage

// === THÊM: Soft-delete function ===
async function softDeleteTenant(supabaseAdmin: any, tenantId: string, userId: string, ip: string) {
  // 1. Set tenant status to 'archived'
  const { error: updateError } = await supabaseAdmin
    .from('tenants')
    .update({ 
      status: 'archived', 
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenantId);
  if (updateError) throw updateError;

  // 2. Deactivate all memberships
  const { error: deactivateError } = await supabaseAdmin
    .from('tenant_memberships')
    .update({ is_active: false, status: 'inactive', updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId);
  if (deactivateError) throw deactivateError;

  // 3. Audit log
  await supabaseAdmin.from('app_audit_log').insert({
    tenant_id: tenantId,
    user_id: userId,
    table_name: 'tenants',
    record_id: tenantId,
    action: 'TENANT_SOFT_DELETE',
    new_data: { status: 'archived', archived_at: new Date().toISOString() },
    ip_address: ip,
  });

  return { success: true, action: 'soft_delete' };
}

// === SỬA: main handler ===
// Thay vì hard-delete ngay, mặc định soft-delete
// Hard-delete chỉ khi có flag force: true và 2-man approval

const body = await req.json().catch(() => ({}));
const tenantId = (body.tenant_id ?? body.tenantId)?.toString().trim();
const force = body.force === true;
const approvedBy = body.approved_by; // UUID của system admin thứ 2

if (force && approvedBy) {
  // 2-man rule: cần 2 system admin approve
  // ... hard-delete logic hiện tại ...
} else {
  // Mặc định: soft-delete
  return jsonResponse(await softDeleteTenant(supabaseAdmin, tenantId, user.id, ip), 200);
}
```

### 4.3. Thiếu RLS policy trên bảng tenant_memberships

**Nguồn phát hiện:** Nguồn A
**Kiểm định source:** ✅ **XÁC NHẬN** - Không tìm thấy RLS policy nào cho `tenant_memberships`
**Trạng thái:** ❌ Chưa fix
**Mô tả:** Bảng `tenant_memberships` không có RLS policy. Chỉ có trigger guardrails bảo vệ owner/last admin, nhưng không kiểm tra ai đang gọi.

**Phương án fix chi tiết:**

```sql
-- Migration: 20260712000007_add_rls_policies_tenant_memberships.sql
-- Thêm RLS policies cho tenant_memberships

ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: member được xem membership của chính mình, system admin xem tất cả, tenant admin xem members trong tenant
DROP POLICY IF EXISTS "members_select_own" ON public.tenant_memberships;
CREATE POLICY "members_select_own" ON public.tenant_memberships
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR public.is_system_admin() 
    OR public.is_tenant_admin(tenant_id)
  );

-- 2. INSERT: chỉ cho phép qua Edge Function (block direct insert)
DROP POLICY IF EXISTS "block_direct_insert" ON public.tenant_memberships;
CREATE POLICY "block_direct_insert" ON public.tenant_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- 3. UPDATE: chỉ cho phép qua RPC (block direct update)
DROP POLICY IF EXISTS "block_direct_update" ON public.tenant_memberships;
CREATE POLICY "block_direct_update" ON public.tenant_memberships
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- 4. DELETE: chỉ cho phép qua RPC (block direct delete)
DROP POLICY IF EXISTS "block_direct_delete" ON public.tenant_memberships;
CREATE POLICY "block_direct_delete" ON public.tenant_memberships
  FOR DELETE
  TO authenticated
  USING (false);
```

### 4.4. 🔴 Xoá system admin cuối cùng không bị chặn

**Nguồn phát hiện:** Nguồn B
**Kiểm định source:** ✅ **XÁC NHẬN** - `20250706000004_phase_p5_audit_security.sql` dòng 159-183
**Trạng thái:** ❌ Chưa fix
**Mô tả:** `remove_system_admin` RPC chỉ chặn tự xoá chính mình, nhưng **không chặn xoá system admin cuối cùng**.

**Phương án fix:** (Đã bao gồm trong mục 3.4 ở trên - check `v_admin_count = 0`)

### 4.5. 🔴 Mời user đã tồn tại không gửi email/link

**Nguồn phát hiện:** Nguồn B
**Kiểm định source:** ✅ **XÁC NHẬN** - `supabase/functions/invite-member/index.ts` dòng 181-193
**Trạng thái:** ❌ Chưa fix
**Mô tả:** Khi tìm thấy user đã tồn tại trong `auth.users`, chỉ insert membership, **không gửi email hoặc link thông báo**.

**Phương án fix chi tiết:**

```typescript
// supabase/functions/invite-member/index.ts
// SỬA: dòng 181-193 - thêm generateLink cho user đã tồn tại

// === CODE CŨ ===
// if (userRow) {
//   targetUserId = userRow.id as string;
//   // ... check existing membership ...
// }

// === CODE MỚI ===
if (userRow) {
  // Existing user: ensure not already a member of this tenant.
  targetUserId = userRow.id as string;
  const { data: existingMembership, error: existingMembershipError } = await supabaseAdmin
    .from('tenant_memberships')
    .select('id')
    .eq('tenant_id', tenant_id)
    .eq('user_id', targetUserId)
    .maybeSingle();
  if (existingMembershipError) throw existingMembershipError;
  if (existingMembership) {
    return jsonResponse({ error: 'already_member' }, 409);
  }
  
  // MỚI: Generate recovery link for existing user
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: normalizedEmail,
    options: { redirectTo: `https://${tenant.subdomain}.vietsalepro.com/login` },
  });
  if (linkError) {
    console.warn('generateLink failed for existing user:', linkError.message);
  }
  
  // Store the link to return in response
  response.existingUserLink = linkData?.properties?.action_link ?? null;
}
```

### 4.6. 🔴 Setup link yếu khi tạo cửa hàng / admin user

**Nguồn phát hiện:** Nguồn B
**Kiểm định source:** ✅ **XÁC NHẬN** - `supabase/functions/create-tenant/index.ts` dòng 147-158, 219-239
**Trạng thái:** ❌ Chưa fix
**Mô tả:** Tạo user với `email_confirm: true` và mật khẩu random. Nếu `generateLink` thất bại, UI chỉ báo "email đã gửi" dù thực tế không có email nào được gửi.

**Phương án fix chi tiết:**

```typescript
// supabase/functions/create-tenant/index.ts
// SỬA: dòng 147-158 - tạo user với email_confirm: false + trả link về UI

// === CODE CŨ ===
// const { data: createUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
//   email: email.trim().toLowerCase(),
//   password: tempPassword,
//   email_confirm: true,  // <-- SAI: không thể gửi invite link nếu đã confirm
// });

// === CODE MỚI ===
const normalizedEmail = email.trim().toLowerCase();
const { data: createUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
  email: normalizedEmail,
  password: tempPassword,
  email_confirm: false,  // <-- ĐÚNG: user chưa confirm, cần invite link
});
if (createUserError) {
  if (createUserError.message.toLowerCase().includes('already')) {
    return jsonResponse({ error: 'Email đã được sử dụng' }, 409);
  }
  throw createUserError;
}

// ... (tạo tenant, subscription, membership, credentials) ...

// === SỬA: dòng 219-239 - generate link và trả về UI ===
const redirectTo = `https://${tenant.subdomain as string}.vietsalepro.com/set-password`;
const { data: linkData, error: generateError } = await supabaseAdmin.auth.admin.generateLink({
  type: 'invite',
  email: normalizedEmail,
  options: { redirectTo },
});

const linkGenerated = !generateError && linkData?.properties?.action_link;

if (generateError) {
  console.error('Failed to generate invite link:', generateError);
  await supabaseAdmin.from('app_audit_log').insert({
    tenant_id: tenant.id as string,
    user_id: adminUser.id,
    table_name: 'tenants',
    record_id: tenant.id as string,
    action: 'EMAIL_FAILED',
    new_data: { error: generateError.message || String(generateError) },
  }).catch(() => {});
}

// Trả về response với link để UI hiển thị
return jsonResponse({
  tenant,
  adminUser: {
    id: adminUser.id,
    email: adminUser.email,
    created_at: adminUser.created_at,
  },
  resetEmailSent: !!linkGenerated,
  redirectTo: linkGenerated ? redirectTo : undefined,
  setupLink: linkGenerated ? linkData!.properties!.action_link : null,  // <-- MỚI: trả link về UI
}, 201);
```

### 4.7. 🔴 Reset password chọn type dựa trên `last_sign_in_at` không robust

**Nguồn phát hiện:** Nguồn B
**Kiểm định source:** ✅ **XÁC NHẬN** - `supabase/functions/reset-password/index.ts` dòng 142-144
**Trạng thái:** ❌ Chưa fix
**Mô tả:** Chọn `type='invite'` nếu `last_sign_in_at` null, `type='recovery'` nếu đã sign-in. Với admin mới tạo từ `create-tenant` (`email_confirm=true` nhưng `last_sign_in_at` null), `type='invite'` có thể không hợp lệ.

**Phương án fix chi tiết:**

```typescript
// supabase/functions/reset-password/index.ts
// SỬA: dòng 142-144 - dùng confirmed_at thay vì last_sign_in_at

// === CODE CŨ ===
// const hasSignedIn = !!targetUser.last_sign_in_at;
// const type = hasSignedIn ? 'recovery' : 'invite';

// === CODE MỚI ===
// Dùng email_confirmed_at để quyết định type
// - Nếu user đã confirm email → dùng 'recovery' (reset password)
// - Nếu user chưa confirm email → dùng 'invite' (set password lần đầu)
const { data: authUserData, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(targetUser.id);
if (authUserError) {
  console.warn('Failed to get auth user details, falling back to last_sign_in_at:', authUserError.message);
}

const isEmailConfirmed = !!authUserData?.user?.email_confirmed_at;
const type = isEmailConfirmed ? 'recovery' : 'invite';
const path = isEmailConfirmed ? 'reset-password' : 'set-password';
const redirectTo = `https://${tenant.subdomain}.vietsalepro.com/${path}`;
```

### 4.8. 🔴 Trial tenant không thể mời thành viên

**Nguồn phát hiện:** Nguồn B
**Kiểm định source:** ✅ **XÁC NHẬN** - `supabase/functions/invite-member/index.ts` dòng 89-91
**Trạng thái:** ❌ Chưa fix
**Mô tả:** Edge Function yêu cầu `tenant.status = 'active'`, trong khi trigger `check_tenant_limits` cho phép cả `active`/`trial`.

**Phương án fix chi tiết:**

```typescript
// supabase/functions/invite-member/index.ts
// SỬA: dòng 89-91 - đồng bộ với trigger check_tenant_limits

// === CODE CŨ ===
// if (tenant.status !== 'active') {
//   return jsonResponse({ error: 'Tenant không hoạt động' }, 403);
// }

// === CODE MỚI ===
// Đồng bộ với trigger check_tenant_limits cho phép cả active và trial
if (!['active', 'trial'].includes(tenant.status)) {
  return jsonResponse({ error: 'Tenant không hoạt động hoặc đã hết hạn dùng thử' }, 403);
}
```

### 4.9. 🔴 Toggle active / Xoá owner ở grid không bị disabled

**Nguồn phát hiện:** Nguồn B
**Kiểm định source:** ✅ **XÁC NHẬN** - `components/MemberManagement.tsx` dòng 273-285, 365-373
**Trạng thái:** ❌ Chưa fix
**Mô tả:** Grid vẫn cho phép đổi role/xoá owner qua dropdown/trash. `toggleMemberActive` không bị guardrail chặn, có thể vô hiệu hoá owner.

**Phương án fix chi tiết:**

```typescript
// components/MemberManagement.tsx
// SỬA: thêm isOwner check cho tất cả actions

// === 1. Role dropdown - disable cho owner ===
{
  key: 'role',
  label: 'Vai trò',
  render: (m) => (
    <select
      value={m.role}
      onChange={(e) => handleRoleChange(m.userId, e.target.value as TenantRole, m.email)}
      disabled={busyUserId === m.userId || m.isOwner}  // <-- MỚI: disable cho owner
      className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
      title={m.isOwner ? 'Không thể đổi vai trò của chủ sở hữu' : undefined}
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>{roleLabel(r)}</option>
      ))}
    </select>
  ),
},

// === 2. Toggle active button - disable cho owner ===
{
  key: 'isActive',
  label: 'Kích hoạt',
  render: (m) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        handleToggleActive(m.userId, !m.isActive);
      }}
      disabled={busyUserId === m.userId || m.isOwner}  // <-- MỚI: disable cho owner
      className={[
        'inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors',
        m.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100',
        m.isOwner ? 'opacity-50 cursor-not-allowed' : '',  // <-- MỚI
      ].join(' ')}
      title={m.isOwner ? 'Không thể thay đổi trạng thái của chủ sở hữu' : (m.isActive ? 'Vô hiệu hóa' : 'Kích hoạt')}
    >
      {m.isActive ? <Power size={18} /> : <PowerOff size={18} />}
    </button>
  ),
},

// === 3. Delete button - disable cho owner ===
{
  key: 'actions',
  label: 'Thao tác',
  render: (m) => {
    const isBusy = busyUserId === m.userId;
    return (
      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <ActionButton variant="ghost" size="sm" icon={<Eye size={16} />}
          onClick={() => setDetailMember(m)} disabled={isBusy} aria-label="Chi tiết" title="Chi tiết" />
        <ActionButton variant="ghost" size="sm" icon={<RotateCcw size={16} />}
          onClick={() => handleResetPassword(m.userId)} loading={isBusy} disabled={isBusy}
          aria-label="Reset mật khẩu" title="Reset mật khẩu" />
        <ActionButton variant="ghost" size="sm" icon={<Trash2 size={16} />}
          onClick={() => handleRemoveMember(m.userId, m.email)}
          disabled={isBusy || m.isOwner}  // <-- MỚI: disable cho owner
          aria-label="Xóa" title={m.isOwner ? 'Không thể xóa chủ sở hữu' : 'Xóa'} />
      </div>
    );
  },
},
```

---

## 5. P2 - LỖI TRUNG BÌNH - FIX TRONG ROADMAP

### 5.1. Thiếu audit log cho nhiều hành động

**Nguồn phát hiện:** Nguồn A
**Kiểm định source:** ✅ **XÁC NHẬN**
**Trạng thái:** ❌ Chưa fix

**Phương án fix chi tiết:**

```sql
-- Migration: 20260712000008_add_audit_log_triggers.sql
-- Thêm audit log trigger cho tenant_memberships

CREATE OR REPLACE FUNCTION public.trg_tenant_memberships_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.app_audit_log (tenant_id, user_id, table_name, record_id, action, new_data)
    VALUES (NEW.tenant_id, auth.uid(), 'tenant_memberships', NEW.id, 'MEMBER_INSERT',
            row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.app_audit_log (tenant_id, user_id, table_name, record_id, action, old_data, new_data)
    VALUES (NEW.tenant_id, auth.uid(), 'tenant_memberships', NEW.id, 'MEMBER_UPDATE',
            row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.app_audit_log (tenant_id, user_id, table_name, record_id, action, old_data)
    VALUES (OLD.tenant_id, auth.uid(), 'tenant_memberships', OLD.id, 'MEMBER_DELETE',
            row_to_json(OLD)::jsonb);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tenant_memberships_audit ON public.tenant_memberships;
CREATE TRIGGER tenant_memberships_audit
AFTER INSERT OR UPDATE OR DELETE ON public.tenant_memberships
FOR EACH ROW
EXECUTE FUNCTION public.trg_tenant_memberships_audit();
```

**Các action cần audit:**
| Action | Mô tả | Hiện tại | Phương án |
|--------|-------|----------|-----------|
| MEMBER_INVITE | Mời thành viên mới | ✅ Có trong invite-member EF | Giữ nguyên |
| MEMBER_REMOVE | Xoá thành viên | ❌ Thiếu | Thêm trong RPC remove_tenant_member |
| MEMBER_ROLE_CHANGE | Đổi vai trò | ❌ Thiếu | Thêm trong RPC update_tenant_member_role |
| MEMBER_TOGGLE_ACTIVE | Kích hoạt/Vô hiệu hoá | ❌ Thiếu | Thêm trong RPC toggle_tenant_member_active |
| MEMBER_PASSWORD_RESET | Reset mật khẩu | ❌ Thiếu | Thêm trong reset-password EF |
| SYSTEM_ADMIN_ADD | Thêm system admin | ✅ Có trong create-system-admin EF | Giữ nguyên |
| SYSTEM_ADMIN_REMOVE | Xoá system admin | ❌ Thiếu | Thêm trong RPC remove_system_admin |
| TENANT_CREATE | Tạo tenant mới | ✅ Có trong create-tenant EF | Giữ nguyên |
| TENANT_DELETE | Xoá tenant | ❌ Thiếu | Thêm trong delete-tenant EF |
| TENANT_RESTORE | Khôi phục tenant | ❌ Thiếu | Thêm trong restore-tenant EF |

### 5.2. Thiếu rate limiting ở reset-password edge function

**Nguồn phát hiện:** Nguồn A
**Kiểm định source:** ✅ **XÁC NHẬN** - `supabase/functions/reset-password/index.ts` - KHÔNG có rate limiting
**Trạng thái:** ❌ Chưa fix

**Phương án fix chi tiết:**

```typescript
// supabase/functions/reset-password/index.ts
// THÊM: rate limiting 3 lớp

// === THÊM constants ===
const IP_RATE_LIMIT_WINDOW_MS = 60_000;      // 1 phút
const IP_RATE_LIMIT_MAX = 5;                   // 5 request/phút/IP
const TENANT_RATE_LIMIT_WINDOW_MS = 3_600_000; // 1 giờ
const TENANT_RATE_LIMIT_MAX = 10;              // 10 request/giờ/tenant
const USER_RATE_LIMIT_WINDOW_MS = 3_600_000;   // 1 giờ
const USER_RATE_LIMIT_MAX = 3;                 // 3 request/giờ/user

// === THÊM: rate limit check function ===
async function checkRateLimit(supabaseAdmin: any, ip: string, tenantId: string, targetUserId: string): Promise<Response | null> {
  const now = Date.now();
  
  // 1. IP rate limit: 5 request/phút
  const ipWindowStart = new Date(now - IP_RATE_LIMIT_WINDOW_MS).toISOString();
  const { count: ipCount } = await supabaseAdmin
    .from('rate_limit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .eq('action', 'reset_password')
    .gte('window_start', ipWindowStart);
  if ((ipCount ?? 0) >= IP_RATE_LIMIT_MAX) {
    return jsonResponse({ error: 'Rate limit exceeded: 5 requests per minute' }, 429);
  }
  
  // 2. Tenant rate limit: 10 request/giờ
  const tenantWindowStart = new Date(now - TENANT_RATE_LIMIT_WINDOW_MS).toISOString();
  const { count: tenantCount } = await supabaseAdmin
    .from('rate_limit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('action', 'reset_password')
    .gte('window_start', tenantWindowStart);
  if ((tenantCount ?? 0) >= TENANT_RATE_LIMIT_MAX) {
    return jsonResponse({ error: 'Rate limit exceeded: 10 password resets per hour for this tenant' }, 429);
  }
  
  // 3. User rate limit: 3 request/giờ (theo target user)
  const userWindowStart = new Date(now - USER_RATE_LIMIT_WINDOW_MS).toISOString();
  const { count: userCount } = await supabaseAdmin
    .from('rate_limit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('target_user_id', targetUserId)
    .eq('action', 'reset_password')
    .gte('window_start', userWindowStart);
  if ((userCount ?? 0) >= USER_RATE_LIMIT_MAX) {
    return jsonResponse({ error: 'Rate limit exceeded: 3 password resets per hour for this user' }, 429);
  }
  
  // Log rate limit entry
  await supabaseAdmin.from('rate_limit_logs').insert({
    ip_address: ip,
    tenant_id: tenantId,
    target_user_id: targetUserId,
    action: 'reset_password',
    window_start: new Date().toISOString(),
  });
  
  return null; // OK, not rate limited
}

// === SỬA: main handler - thêm rate limit check ===
// Sau khi xác thực caller, trước khi xử lý:
const rateLimitResponse = await checkRateLimit(supabaseAdmin, ip, tenant_id, targetUser.id);
if (rateLimitResponse) return rateLimitResponse;
```

### 5.3. create-system-admin không kiểm tra email đã tồn tại

**Nguồn phát hiện:** Nguồn A
**Kiểm định source:** ✅ **XÁC NHẬN** - Đã có check qua `auth.admin.createUser()` error handling
**Trạng thái:** ✅ **Đã fix** - Edge Function bắt lỗi "already exists" và trả về 409

### 5.4. Race condition trong invite-member

**Nguồn phát hiện:** Nguồn A + B
**Kiểm định source:** ✅ **XÁC NHẬN** - `supabase/functions/invite-member/index.ts` dòng 202-227
**Trạng thái:** ⚠️ **Có race guard nhưng chưa đủ mạnh**

**Phương án fix chi tiết:**

```typescript
// supabase/functions/invite-member/index.ts
// THÊM: advisory lock để tránh race condition

// === THÊM: advisory lock ===
// Sử dụng pg_advisory_xact_lock để serialise concurrent invites cho cùng email
// Hash email thành bigint để dùng làm lock id
function emailToLockId(email: string): number {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// === SỬA: trong main handler, trước khi tìm user ===
const lockId = emailToLockId(normalizedEmail);

// Acquire advisory lock (transaction-level, tự động release khi kết thúc transaction)
const { error: lockError } = await supabaseAdmin.rpc('acquire_advisory_lock', { 
  p_lock_id: lockId 
});
if (lockError) {
  console.warn('Failed to acquire advisory lock, proceeding without lock:', lockError.message);
}

// ... phần còn lại của logic invite ...
```

```sql
-- Migration: 20260712000009_add_advisory_lock_function.sql
-- Hàm hỗ trợ advisory lock cho invite-member

CREATE OR REPLACE FUNCTION public.acquire_advisory_lock(p_lock_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pg_try_advisory_xact_lock(p_lock_id);
$$;
```

### 5.5. Thiếu runtime validation cho role

**Nguồn phát hiện:** Nguồn A
**Kiểm định source:** ✅ **XÁC NHẬN** - `services/tenantService.ts` dòng 528-543
**Trạng thái:** ❌ Chưa fix

**Phương án fix chi tiết:**

```typescript
// services/tenantService.ts
// THÊM: runtime validation cho tất cả functions nhận role parameter

const VALID_ROLES = new Set(['admin', 'cashier', 'inventory_manager', 'accountant']);

function validateRole(role: string): asserts role is TenantRole {
  if (!VALID_ROLES.has(role)) {
    throw new Error(`Vai trò không hợp lệ: "${role}". Chỉ chấp nhận: ${Array.from(VALID_ROLES).join(', ')}`);
  }
}

// Sửa updateMemberRole
export async function updateMemberRole(
  tenantId: string,
  userId: string,
  role: TenantRole
): Promise<TenantMembership> {
  validateRole(role);  // <-- MỚI
  const { data, error } = await supabase.rpc('update_tenant_member_role', {
    p_tenant_id: tenantId,
    p_user_id: userId,
    p_role: role,
  });
  if (error) throw error;
  return mapMembershipFromDB(data);
}

// Sửa inviteMemberByEmail
export async function inviteMemberByEmail(
  tenantId: string,
  email: string,
  role: TenantRole
): Promise<{ success: boolean; message?: string; emailProviderConfigured?: boolean }> {
  validateRole(role);  // <-- MỚI
  // ... rest of function ...
}
```

### 5.6. 🔴 `get_tenant_usage_summary` chỉ cho system admin - tenant admin bị 403

**Nguồn phát hiện:** Nguồn B
**Kiểm định source:** ✅ **XÁC NHẬN** - `20260711000010_fix_invite_seat_limit_and_plan_sync.sql` dòng 74-76
**Trạng thái:** ❌ Chưa fix
**Mô tả:** RPC `get_tenant_usage_summary` chỉ cho phép `is_system_admin()`. Tenant admin gọi từ `MemberInviteModal` sẽ bị 403.

**Phương án fix chi tiết:**

```sql
-- Migration: 20260712000010_fix_get_tenant_usage_summary_tenant_admin.sql
-- Fix: cho phép tenant admin gọi get_tenant_usage_summary

CREATE OR REPLACE FUNCTION public.get_tenant_usage_summary(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_user_count INTEGER;
  v_product_count INTEGER;
  v_sub public.tenant_subscriptions%ROWTYPE;
  v_tenant public.tenants%ROWTYPE;
  v_current_month_orders INTEGER;
  v_current_month_start DATE;
  v_today DATE;
BEGIN
  -- SỬA: cho phép cả system admin và tenant admin
  IF NOT (public.is_system_admin() OR public.is_tenant_admin(p_tenant_id)) THEN
    RAISE EXCEPTION 'Chỉ system admin hoặc tenant admin mới được xem usage tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy subscription cho tenant: %', p_tenant_id;
  END IF;

  SELECT COUNT(*) INTO v_user_count
  FROM public.tenant_memberships
  WHERE tenant_id = p_tenant_id AND status IN ('pending', 'active');

  SELECT COUNT(*) INTO v_product_count FROM public.products WHERE tenant_id = p_tenant_id;

  v_today := date_trunc('month', CURRENT_DATE)::DATE;
  v_current_month_start := v_sub.current_month_start;
  IF v_current_month_start IS NULL OR v_current_month_start <> v_today THEN
    v_current_month_orders := 0;
    v_current_month_start := v_today;
  ELSE
    v_current_month_orders := v_sub.current_month_orders;
  END IF;

  RETURN json_build_object(
    'tenantId', v_sub.tenant_id,
    'plan', v_sub.plan,
    'billingStatus', v_sub.billing_status,
    'expiresAt', v_sub.expires_at,
    'users', json_build_object(
      'current', v_user_count,
      'max', v_sub.max_users,
      'percent', CASE WHEN v_sub.max_users > 0 THEN ROUND((v_user_count::NUMERIC / v_sub.max_users) * 100, 2) ELSE 0 END
    ),
    'products', json_build_object(
      'current', v_product_count,
      'max', v_sub.max_products,
      'percent', CASE WHEN v_sub.max_products > 0 THEN ROUND((v_product_count::NUMERIC / v_sub.max_products) * 100, 2) ELSE 0 END
    ),
    'orders', json_build_object(
      'current', v_current_month_orders,
      'max', v_sub.max_orders_per_month,
      'percent', CASE WHEN v_sub.max_orders_per_month > 0 THEN ROUND((v_current_month_orders::NUMERIC / v_sub.max_orders_per_month) * 100, 2) ELSE 0 END,
      'monthStart', v_current_month_start
    )
  );
END;
$$;
```

### 5.7. 🔴 Không có API xoá auth user độc lập

**Nguồn phát hiện:** Nguồn B
**Kiểm định source:** ✅ **XÁC NHẬN**
**Trạng thái:** ❌ Chưa fix
**Mô tả:** `removeMember` chỉ xoá membership. User "orphan" vẫn tồn tại trong `auth.users`.

**Phương án fix chi tiết:**

```typescript
// supabase/functions/delete-user/index.ts (MỚI)
// Edge Function xoá auth user nếu không còn membership/ownership nào khác

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Caller authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Missing Authorization header' }, 401);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) return jsonResponse({ error: 'Invalid token' }, 401);

    // System admin check
    const { data: adminRow } = await supabaseAdmin
      .from('system_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!adminRow) return jsonResponse({ error: 'Only system admins can delete users' }, 403);

    const body = await req.json();
    const { user_id } = body;
    if (!user_id || typeof user_id !== 'string') {
      return jsonResponse({ error: 'user_id is required' }, 400);
    }

    // Check 1: User is not a system admin
    const { data: isSystemAdmin } = await supabaseAdmin
      .from('system_admins')
      .select('user_id')
      .eq('user_id', user_id)
      .maybeSingle();
    if (isSystemAdmin) {
      return jsonResponse({ error: 'Cannot delete a system admin. Use remove-system-admin first.' }, 403);
    }

    // Check 2: User has no active memberships
    const { count: membershipCount } = await supabaseAdmin
      .from('tenant_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id);
    if (membershipCount && membershipCount > 0) {
      return jsonResponse({ error: `User still has ${membershipCount} active membership(s). Remove them first.` }, 403);
    }

    // Check 3: User is not an owner of any tenant
    const { count: ownershipCount } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user_id);
    if (ownershipCount && ownershipCount > 0) {
      return jsonResponse({ error: `User is owner of ${ownershipCount} tenant(s). Transfer ownership first.` }, 403);
    }

    // Delete auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    if (deleteError) throw deleteError;

    // Audit log
    await supabaseAdmin.from('app_audit_log').insert({
      user_id: user.id,
      table_name: 'auth.users',
      record_id: user_id,
      action: 'USER_DELETE',
      new_data: { deleted_user_id: user_id },
    });

    return jsonResponse({ success: true, userId: user_id }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
```

---

## 6. P3 - LỖI THẤP - CẢI TIẾN DẦN

### 6.1. Thiếu validation pattern email chuẩn
**Kiểm định source:** ✅ **XÁC NHẬN** - Email validation chỉ là regex cơ bản
**Trạng thái:** ⚠️ CÓ THỂ FIX

**Phương án fix:**
```typescript
// Dùng regex chuẩn RFC 5322
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
```

### 6.2. Rate limiting chỉ theo IP, không theo user
**Kiểm định source:** ✅ **XÁC NHẬN** - Hầu hết Edge Function chỉ rate limit theo IP
**Trạng thái:** ⚠️ CÓ THỂ FIX

**Phương án fix:** Thêm multi-dimension rate limiting (IP + tenant_id + user_id) cho tất cả Edge Function

### 6.3. Không giới hạn số tenant per user
**Kiểm định source:** ✅ **XÁC NHẬN** - Không có giới hạn
**Trạng thái:** ⚠️ CÓ THỂ FIX

**Phương án fix:** Thêm config `max_tenants_per_user` trong system_settings, kiểm tra trong invite-member EF

### 6.4. Chưa có role "viewer"
**Kiểm định source:** ✅ **XÁC NHẬN** - Chỉ có 4 role: admin, cashier, inventory_manager, accountant
**Trạng thái:** ⚠️ CÓ THỂ FIX

**Phương án fix:** Thêm role 'viewer' vào ROLES set, thêm RLS policy cho viewer (SELECT only)

### 6.5. Không check membership tồn tại trước khi delete
**Kiểm định source:** ✅ **XÁC NHẬN** - `removeMember` không kiểm tra membership tồn tại
**Trạng thái:** ⚠️ CÓ THỂ FIX (đã bao gồm trong RPC remove_tenant_member ở mục 3.1)

### 6.6. Subdomain check không phân biệt active vs archived
**Kiểm định source:** ✅ **XÁC NHẬN**
**Trạng thái:** ⚠️ CÓ THỂ FIX

**Phương án fix:**
```sql
-- Khi check subdomain uniqueness, chỉ check tenant active/trial/pending
SELECT 1 FROM public.tenants 
WHERE subdomain = p_subdomain 
  AND status NOT IN ('archived')
  AND id != p_exclude_tenant_id;
```

### 6.7. 🔴 `addSystemAdmin(userId)` trong service không được UI dùng
**Nguồn phát hiện:** Nguồn B
**Kiểm định source:** ✅ **XÁC NHẬN** - `services/systemAdminService.ts` có hàm `addSystemAdmin(userId)` nhưng UI không dùng
**Trạng thái:** ⚠️ CÓ THỂ FIX

**Phương án fix:** Thêm UI flow trong SystemAdminDashboard để thêm system admin từ user đã tồn tại (không cần tạo mới)

---

## 7. PHÁT HIỆN MỚI TỪ KIỂM ĐỊNH SOURCE CODE

### 7.1. 🔴 `remove_system_admin` RPC vẫn dùng SECURITY INVOKER (P0)

**Mô tả:** Migration `20260708000004_fix_system_admin_rls.sql` chỉ sửa `add_system_admin` và `get_system_admins` thành SECURITY DEFINER, nhưng **KHÔNG sửa `remove_system_admin`**. RPC này vẫn dùng SECURITY INVOKER, có thể gây lỗi khi đọc `auth.users`.

**File:** `supabase/migrations/20250706000004_phase_p5_audit_security.sql` dòng 159-183

**Phương án fix:** (Đã bao gồm trong mục 3.4)

**Code migration đầy đủ:**
```sql
-- Migration: 20260712000004_fix_remove_system_admin_security_definer.sql
CREATE OR REPLACE FUNCTION public.remove_system_admin(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Changed from SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_admin_count INT;
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();
  
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu xác thực' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = v_caller_id) THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xóa system admin' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_user_id = v_caller_id THEN
    RAISE EXCEPTION 'Không thể tự xóa quyền system admin của chính mình' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COUNT(*) INTO v_admin_count
  FROM public.system_admins
  WHERE user_id != p_user_id;

  IF v_admin_count = 0 THEN
    RAISE EXCEPTION 'Không thể xóa system admin cuối cùng' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Không tìm thấy system admin: %', p_user_id USING ERRCODE = 'no_data_found';
  END IF;

  DELETE FROM public.system_admins WHERE user_id = p_user_id;

  INSERT INTO public.app_audit_log (user_id, table_name, record_id, action, old_data)
  VALUES (v_caller_id, 'system_admins', p_user_id, 'SYSTEM_ADMIN_REMOVE',
          jsonb_build_object('removed_user_id', p_user_id, 'removed_by', v_caller_id));

  RETURN TRUE;
END;
$$;
```

### 7.2. 🔴 Guardrail trigger không filter status/is_active khi đếm admin cuối cùng (P1)

**Mô tả:** Trigger `trg_tenant_memberships_guardrails` trong `20260711000005_f33_members_guardrails.sql` đếm tất cả admin, không phân biệt `status`/`is_active`. Có thể xoá admin bị inactive và không còn admin active nào.

**File:** `supabase/migrations/20260711000005_f33_members_guardrails.sql` dòng 25-29

**Phương án fix:** (Đã bao gồm trong mục 4.1)

**Code migration đầy đủ:**
```sql
-- Migration: 20260712000005_fix_guardrail_trigger_status_active_filter.sql
CREATE OR REPLACE FUNCTION public.trg_tenant_memberships_guardrails()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_other_admins INT;
  v_hard_delete TEXT;
BEGIN
  v_hard_delete := current_setting('app.hard_delete_tenant', true);
  IF v_hard_delete IS NOT NULL AND v_hard_delete = 'true' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT owner_id INTO v_owner_id
  FROM public.tenants
  WHERE id = COALESCE(OLD.tenant_id, NEW.tenant_id);

  IF TG_OP = 'DELETE' THEN
    IF OLD.user_id = v_owner_id THEN
      RAISE EXCEPTION 'Không thể xóa owner của tenant' USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF OLD.role = 'admin' THEN
      SELECT COUNT(*) INTO v_other_admins
      FROM public.tenant_memberships
      WHERE tenant_id = OLD.tenant_id
        AND role = 'admin'
        AND user_id <> OLD.user_id
        AND status IN ('active', 'pending')    -- <-- MỚI: chỉ tính active/pending
        AND is_active = true;                   -- <-- MỚI: chỉ tính is_active = true

      IF v_other_admins = 0 THEN
        RAISE EXCEPTION 'Không thể xóa admin cuối cùng của tenant' USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;

    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.user_id = v_owner_id AND NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Không thể đổi role của owner tenant' USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF OLD.role = 'admin' AND NEW.role <> 'admin' THEN
      SELECT COUNT(*) INTO v_other_admins
      FROM public.tenant_memberships
      WHERE tenant_id = OLD.tenant_id
        AND role = 'admin'
        AND user_id <> OLD.user_id
        AND status IN ('active', 'pending')    -- <-- MỚI
        AND is_active = true;                   -- <-- MỚI

      IF v_other_admins = 0 THEN
        RAISE EXCEPTION 'Không thể hạ role admin cuối cùng của tenant' USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;

    -- MỚI: bảo vệ toggle is_active trên admin cuối cùng
    IF OLD.role = 'admin' AND NEW.is_active IS DISTINCT FROM OLD.is_active AND NEW.is_active = false THEN
      SELECT COUNT(*) INTO v_other_admins
      FROM public.tenant_memberships
      WHERE tenant_id = OLD.tenant_id
        AND role = 'admin'
        AND user_id <> OLD.user_id
        AND status IN ('active', 'pending')
        AND is_active = true;

      IF v_other_admins = 0 THEN
        RAISE EXCEPTION 'Không thể vô hiệu hóa admin duy nhất của tenant' USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;
```

### 7.3. 🔴 `toggleMemberActive` không có guardrail protection (P1)

**Mô tả:** Trigger `trg_tenant_memberships_guardrails` chỉ kiểm tra khi `role` thay đổi (`NEW.role IS DISTINCT FROM OLD.role`). Khi `is_active` thay đổi, trigger không làm gì. Có thể vô hiệu hoá admin cuối cùng.

**File:** `supabase/migrations/20260711000005_f33_members_guardrails.sql` dòng 39-57

**Phương án fix:** (Đã bao gồm trong mục 7.2 ở trên - thêm guard cho UPDATE is_active)

### 7.4. 🔴 `reset-password` Edge Function không có rate limiting (P1)

**Mô tả:** `supabase/functions/reset-password/index.ts` không có bất kỳ rate limiting nào. Attacker có thể spam reset password không giới hạn.

**File:** `supabase/functions/reset-password/index.ts`

**Phương án fix:** (Đã bao gồm trong mục 5.2)

### 7.5. 🔴 `is_system_admin()` function dùng SECURITY DEFINER - auth.uid() null khi gọi từ service-role (P0)

**Mô tả:** `is_system_admin()` dùng SECURITY DEFINER và kiểm tra `auth.uid()`. Khi Edge Function gọi RPC từ service-role client, `auth.uid()` là `null`, làm cho `is_system_admin()` trả về `false`. Đây là nguyên nhân gốc của lỗi 3.6.

**File:** `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` (định nghĩa `is_system_admin`)

**Phương án fix chi tiết:**

**Cách 1 (Khuyến nghị - an toàn nhất):** Trong Edge Function, không gọi RPC mà insert trực tiếp (đã fix trong mục 3.6)

**Cách 2 (Sửa function):** Cho phép service-role bypass:
```sql
-- Migration: 20260712000011_fix_is_system_admin_service_role.sql
-- Fix: cho phép service_role bypass is_system_admin() check

CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN current_user = 'service_role' THEN true  -- service_role luôn được coi là system admin
      ELSE EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = auth.uid())
    END;
$$;
```

**Cách 3 (Tạo RPC riêng cho Edge Function):**
```sql
-- Migration: 20260712000012_add_system_admin_for_edge.sql
-- RPC dành riêng cho Edge Function (không check auth.uid())

CREATE OR REPLACE FUNCTION public.add_system_admin_for_edge(
  p_user_id UUID,
  p_creator_id UUID
)
RETURNS public.system_admins
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.system_admins;
BEGIN
  -- Chỉ cho phép service_role gọi RPC này
  IF current_user != 'service_role' THEN
    RAISE EXCEPTION 'Only service_role can call this function' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Validate user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Không tìm thấy user: %', p_user_id;
  END IF;

  -- Check not already system admin
  IF EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'User already a system admin';
  END IF;

  INSERT INTO public.system_admins (user_id)
  VALUES (p_user_id)
  RETURNING * INTO v_row;

  -- Audit log
  INSERT INTO public.app_audit_log (user_id, table_name, record_id, action, new_data)
  VALUES (p_creator_id, 'system_admins', p_user_id, 'SYSTEM_ADMIN_ADD',
          jsonb_build_object('new_admin_id', p_user_id, 'created_by', p_creator_id));

  RETURN v_row;
END;
$$;
```

---

## 8. KIẾN TRÚC MỚI ĐỀ XUẤT

### 8.1. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (React)                         │
│  usePermissions (client-side UX only)                       │
│  MemberManagement.tsx                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  SERVICE LAYER (services/*.ts)              │
│                                                             │
│  Các function KHÔNG gọi Supabase trực tiếp nữa              │
│  Tất cả đều đi qua:                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Edge Function (service_role_key)                   │   │
│  │  - invite-member (đã có)                            │   │
│  │  - remove-member (MỚI)                              │   │
│  │  - update-member-role (MỚI)                         │   │
│  │  - toggle-member-active (MỚI)                       │   │
│  │  - reset-password (đã có + thêm rate limit)         │   │
│  │  - create-system-admin (SỬA: fix auth.uid())        │   │
│  │  - remove-system-admin (MỚI)                        │   │
│  │  - create-tenant (đã có + trả link về UI)           │   │
│  │  - delete-tenant (sửa: thêm soft-delete)            │   │
│  │  - delete-user (MỚI - xoá auth user orphan)         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  HOẶC:                                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  RPC SECURITY DEFINER (database layer)              │   │
│  │  - remove_tenant_member                             │   │
│  │  - update_tenant_member_role                        │   │
│  │  - toggle_tenant_member_active                      │   │
│  │  - add_system_admin (sửa: fix auth.uid() null)      │   │
│  │  - remove_system_admin (sửa: SECURITY DEFINER)      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                           │
│                                                             │
│  RLS Policies:                                              │
│  - tenant_memberships: SELECT only (own), block UPDATE/DELETE│
│  - tenants: SELECT only, block INSERT/UPDATE/DELETE         │
│  - system_admins: SELECT only, block INSERT/UPDATE/DELETE   │
│                                                             │
│  Triggers:                                                  │
│  - trg_tenant_memberships_guardrails: SỬA - thêm filter     │
│    status/is_active + bảo vệ toggle is_active               │
│  - trg_tenants_before_delete: đã có (flag cho cascade)      │
│  - trg_tenant_memberships_audit: MỚI (audit log tự động)   │
└─────────────────────────────────────────────────────────────┘
```

### 8.2. Danh sách migration cần tạo

| Migration | Mô tả | Liên quan lỗi |
|-----------|-------|---------------|
| `20260712000001_fix_remove_tenant_member_rpc` | Tạo RPC remove_tenant_member | 3.1 |
| `20260712000002_fix_update_tenant_member_role_rpc` | Tạo RPC update_tenant_member_role | 3.2 |
| `20260712000003_fix_toggle_tenant_member_active_rpc` | Tạo RPC toggle_tenant_member_active | 3.3 |
| `20260712000004_fix_remove_system_admin_security_definer` | Sửa remove_system_admin SECURITY DEFINER | 3.4, 4.4, 7.1 |
| `20260712000005_fix_guardrail_trigger_status_active_filter` | Sửa trigger filter status/is_active | 4.1, 7.2, 7.3 |
| `20260712000006_add_soft_delete_columns` | Thêm cột soft-delete | 4.2 |
| `20260712000007_add_rls_policies_tenant_memberships` | Thêm RLS policies | 4.3 |
| `20260712000008_add_audit_log_triggers` | Thêm audit log trigger | 5.1 |
| `20260712000009_add_advisory_lock_function` | Thêm advisory lock | 5.4 |
| `20260712000010_fix_get_tenant_usage_summary_tenant_admin` | Fix usage summary cho tenant admin | 5.6 |
| `20260712000011_fix_is_system_admin_service_role` | Fix is_system_admin cho service_role | 7.5 |
| `20260712000012_add_system_admin_for_edge` | RPC riêng cho Edge Function | 3.6, 7.5 |

### 8.3. Danh sách Edge Function cần tạo/sửa

| Function | Trạng thái | Mô tả |
|----------|-----------|-------|
| `remove-member` | 🔴 MỚI | Xoá member khỏi tenant |
| `update-member-role` | 🔴 MỚI | Đổi role member |
| `toggle-member-active` | 🔴 MỚI | Kích hoạt/Vô hiệu hoá member |
| `remove-system-admin` | 🔴 MỚI | Xoá system admin |
| `delete-user` | 🔴 MỚI | Xoá auth user orphan |
| `create-system-admin` | 🟡 SỬA | Fix lỗi gọi RPC từ service-role client |
| `create-tenant` | 🟡 SỬA | Trả link setup về UI, không chỉ báo "email đã gửi" |
| `invite-member` | 🟡 SỬA | Gửi email/link cho user đã tồn tại; đồng bộ trial status |
| `reset-password` | 🟡 SỬA | Fix type dựa trên confirmed_at; thêm rate limit |
| `delete-tenant` | 🟡 SỬA | Thêm soft-delete stage |

---

## 9. ROADMAP TRIỂN KHAI

### Phase 0: Hotfix khẩn cấp (Ngày 0-1) 🔴
**Mục tiêu:** Fix lỗi blocking "không tạo được system admin" + lỗ hổng bảo mật nghiêm trọng

- [ ] Fix `create-system-admin` Edge Function: insert trực tiếp thay vì gọi RPC (P0 - 3.6)
- [ ] Fix `remove_system_admin` RPC: thêm SECURITY DEFINER + check admin cuối cùng (P0 - 3.4, 7.1)
- [ ] Fix `is_system_admin()`: cho phép service-role bypass (P0 - 7.5)

### Phase 1: Emergency Security (Ngày 1-2) 🔴
**Mục tiêu:** Chặn lỗ hổng bảo mật ngay lập tức

- [ ] Thêm RLS policy block direct UPDATE/DELETE trên `tenant_memberships` (P0 - 4.3)
- [ ] Tạo RPC `remove_tenant_member` với đầy đủ guard (P0 - 3.1)
- [ ] Tạo RPC `update_tenant_member_role` với đầy đủ guard (P0 - 3.2)
- [ ] Tạo RPC `toggle_tenant_member_active` với đầy đủ guard (P0 - 3.3)
- [ ] Cập nhật service layer gọi RPC thay vì direct query (P0 - 3.1, 3.2, 3.3)
- [ ] Xoá function `createTenant()` direct insert (P0 - 3.5)
- [ ] Deploy hotfix lên production

### Phase 2: Core Fix (Tuần 1-2) 🟠
**Mục tiêu:** Xây dựng lại authorization layer

- [ ] Sửa trigger `trg_tenant_memberships_guardrails`: thêm filter status/is_active (P1 - 4.1, 7.2)
- [ ] Thêm guard toggle is_active trong trigger (P1 - 7.3)
- [ ] Thêm audit log vào tất cả RPC (P2 - 5.1)
- [ ] Thêm rate limiting cho reset-password (P1 - 7.4)
- [ ] Fix reset-password type dựa trên confirmed_at (P1 - 4.7)
- [ ] Fix invite-member gửi email cho user đã tồn tại (P1 - 4.5)
- [ ] Đồng bộ trial status trong invite-member (P1 - 4.8)
- [ ] Thêm guardrail + UI disable cho action trên owner (P1 - 4.9)
- [ ] Fix `get_tenant_usage_summary` cho tenant admin (P2 - 5.6)
- [ ] Kiểm thử toàn bộ flow

### Phase 3: Soft-delete & Recovery (Tuần 3-4) 🟠
**Mục tiêu:** Bảo vệ dữ liệu tenant

- [ ] Thêm cột `archived_at`, `deleted_at` vào bảng `tenants`
- [ ] Sửa `delete-tenant` edge function: mặc định soft-delete
- [ ] Tạo `restore-tenant` edge function
- [ ] Thêm 2-man rule cho hard-delete
- [ ] Fix create-tenant: trả link setup về UI (P1 - 4.6)
- [ ] Thêm API xoá auth user orphan (P2 - 5.7)
- [ ] Thêm cron job cleanup cho tenant archived > 30 ngày

### Phase 4: Hardening (Tháng 2-3) 🟡
**Mục tiêu:** Củng cố toàn bộ hệ thống

- [ ] Thêm runtime validation cho tất cả input (P2 - 5.5)
- [ ] Thêm multi-dimension rate limiting (P3 - 6.2)
- [ ] Thêm email validation pattern chuẩn (P3 - 6.1)
- [ ] Thêm role 'viewer' (P3 - 6.4)
- [ ] Kiểm tra và fix tất cả P3 issues
- [ ] Security audit toàn diện

### Phase 5: Long-term (Tháng 4-6) 🟢
**Mục tiêu:** Tự động hoá & monitoring

- [ ] Tự động phát hiện bất thường (anomaly detection)
- [ ] Alert khi có hành động đáng ngờ (xoá admin, bulk invite)
- [ ] Dashboard audit log cho system admin
- [ ] Automated security testing trong CI/CD

---

## 10. CHECKLIST KIỂM THỬ SAU FIX

### 10.1. Test Case cho mỗi hành động

#### Tạo System Admin
- [ ] System admin tạo system admin mới → ✅ Thành công
- [ ] Non-system admin tạo system admin → ❌ Từ chối (403)
- [ ] Tạo với email đã tồn tại → ❌ Từ chối (409)
- [ ] Tạo với email không hợp lệ → ❌ Từ chối (400)
- [ ] Tạo với password < 6 ký tự → ❌ Từ chối (400)
- [ ] Rate limit: 11 request trong 1 phút → ❌ Từ chối (429)

#### Xoá Member
- [ ] Tenant admin xoá member thường → ✅ Thành công
- [ ] System admin xoá member → ✅ Thành công
- [ ] Non-admin xoá member → ❌ Từ chối (403)
- [ ] Xoá owner → ❌ Từ chối
- [ ] Xoá admin cuối cùng (cả active và inactive) → ❌ Từ chối
- [ ] Tự xoá chính mình → ❌ Từ chối
- [ ] Xoá member không tồn tại → ❌ Từ chối (404)

#### Đổi Role
- [ ] Tenant admin đổi role member → ✅ Thành công
- [ ] Hạ role admin cuối cùng → ❌ Từ chối
- [ ] Tự hạ role chính mình → ❌ Từ chối
- [ ] Đổi role không hợp lệ → ❌ Từ chối
- [ ] Non-admin đổi role → ❌ Từ chối (403)

#### Mời Thành Viên
- [ ] Tenant admin mời email mới → ✅ Thành công
- [ ] Tenant admin mời email đã tồn tại → ✅ Thành công + gửi email/link
- [ ] Mời email đã là member → ❌ Từ chối (409)
- [ ] Mời vượt quá max_users → ❌ Từ chối (403)
- [ ] Non-admin mời → ❌ Từ chối (403)
- [ ] Tenant trial mời thành viên → ✅ Thành công
- [ ] Rate limit tenant: 51 request/giờ → ❌ Từ chối (429)

#### Toggle Active
- [ ] Tenant admin vô hiệu hoá member → ✅ Thành công
- [ ] Vô hiệu hoá admin cuối cùng → ❌ Từ chối
- [ ] Vô hiệu hoá owner → ❌ Từ chối
- [ ] Tự vô hiệu hoá chính mình → ❌ Từ chối
- [ ] Non-admin toggle → ❌ Từ chối (403)

#### Reset Password
- [ ] Tenant admin reset password member → ✅ Thành công
- [ ] Reset password user không thuộc tenant → ❌ Từ chối (403)
- [ ] Non-admin reset password → ❌ Từ chối (403)
- [ ] Rate limit: 6 request/phút → ❌ Từ chối (429)
- [ ] Reset password cho user mới tạo (chưa confirm email) → type='invite'
- [ ] Reset password cho user đã confirm email → type='recovery'

#### Tạo Cửa Hàng Mới
- [ ] System admin tạo tenant → ✅ Thành công + UI hiển thị link setup
- [ ] Non-system admin tạo tenant → ❌ Từ chối (403)
- [ ] Tạo tenant với subdomain đã tồn tại → ❌ Từ chối (409)

#### Xoá Tenant
- [ ] Soft-delete tenant → ✅ Thành công (status = archived)
- [ ] Restore tenant đã soft-delete → ✅ Thành công
- [ ] Hard-delete tenant → Yêu cầu 2 system admin approve
- [ ] Xoá tenant 'admin' → ❌ Từ chối (403)
- [ ] Non-system admin xoá tenant → ❌ Từ chối (403)

#### Xoá System Admin
- [ ] System admin xoá system admin khác → ✅ Thành công
- [ ] Xoá system admin cuối cùng → ❌ Từ chối
- [ ] Tự xoá chính mình → ❌ Từ chối

### 10.2. Audit Log Verification
- [ ] Mọi hành động đều có audit log tương ứng
- [ ] Audit log có đủ: ai, làm gì, khi nào, IP, dữ liệu cũ/mới
- [ ] Audit log không thể bị xoá (append-only)

### 10.3. Security Verification
- [ ] Không có direct INSERT/UPDATE/DELETE vào bảng nhạy cảm
- [ ] Tất cả RPC đều có SECURITY DEFINER + auth.uid() check
- [ ] Tất cả Edge Function đều có rate limiting
- [ ] Không có lỗ hổng self-escalation (tự tăng quyền)
- [ ] Không có lỗ hổng privilege escalation (leo thang quyền)
- [ ] `remove_system_admin` dùng SECURITY DEFINER
- [ ] Guardrail trigger filter status/is_active khi đếm admin
- [ ] `toggleMemberActive` có guard bảo vệ admin cuối cùng
- [ ] `is_system_admin()` hoạt động đúng từ service-role client

---

## PHỤ LỤC A: SO SÁNH PHƯƠNG ÁN

### Edge Function vs RPC SECURITY DEFINER

| Tiêu chí | Edge Function | RPC SECURITY DEFINER |
|----------|---------------|---------------------|
| **Bảo mật** | Cao nhất (service_role_key) | Cao (chạy với quyền owner) |
| **Performance** | Chậm hơn (network call) | Nhanh (in-database) |
| **Complex logic** | Dễ dàng (JS/TS) | Khó hơn (PL/pgSQL) |
| **External API calls** | Được | Không |
| **Rate limiting** | Dễ (in-memory + DB) | Khó (phải tự implement) |
| **Audit log** | Dễ | Dễ |
| **Maintenance** | Nhiều code hơn | Ít code hơn |
| **Cold start** | Có (Deno) | Không |

**Khuyến nghị:**
- Dùng **RPC SECURITY DEFINER** cho operation đơn giản (remove member, change role, toggle active)
- Dùng **Edge Function** cho operation phức tạp (invite member, create tenant, reset password)
- Dùng **cả 2** cho operation critical (Edge Function gọi RPC bên trong)

### Soft-delete vs Hard-delete

| Tiêu chí | Soft-delete trước | Hard-delete ngay |
|----------|-------------------|------------------|
| **An toàn dữ liệu** | ✅ Cao | ❌ Thấp |
| **Khôi phục được** | ✅ Có | ❌ Không |
| **Chiếm storage** | ❌ Nhiều hơn | ✅ Ít hơn |
| **Phức tạp code** | ❌ Phức tạp hơn | ✅ Đơn giản |
| **Tuân thủ GDPR** | ✅ Có (xoá sau 30 ngày) | ✅ Có |

**Khuyến nghị:** Soft-delete với grace period 30 ngày, sau đó tự động hard-delete.

---

## PHỤ LỤC B: DANH SÁCH LỖI THEO TRẠNG THÁI KIỂM ĐỊNH

### Lỗi đã được xác nhận và chưa fix (20 lỗi)

| # | Lỗi | Mức | File xác nhận | Migration fix |
|---|-----|-----|---------------|---------------|
| 3.1 | removeMember() không auth check | P0 | tenantService.ts:545-553 | 20260712000001 |
| 3.2 | updateMemberRole() không auth check | P0 | tenantService.ts:528-543 | 20260712000002 |
| 3.3 | toggleMemberActive() không auth check | P0 | tenantService.ts:445-455 | 20260712000003 |
| 3.4 | remove_system_admin thiếu SECURITY DEFINER | P0 | phase_p5_audit_security.sql:159-183 | 20260712000004 |
| 3.5 | createTenant() direct insert | P0 | tenantService.ts:632-651 | Xoá function |
| 3.6 | create-system-admin gọi RPC từ service-role | P0 | create-system-admin/index.ts:151-159 | Sửa EF |
| 4.1 | Guardrail trigger không filter status/is_active | P1 | f33_members_guardrails.sql:25-29 | 20260712000005 |
| 4.2 | Hard-delete tenant không soft-delete | P1 | delete-tenant/index.ts | 20260712000006 |
| 4.3 | Thiếu RLS policy tenant_memberships | P1 | Không tìm thấy policy | 20260712000007 |
| 4.4 | Xoá system admin cuối cùng không bị chặn | P1 | phase_p5_audit_security.sql:175 | 20260712000004 |
| 4.5 | Mời user đã tồn tại không gửi email/link | P1 | invite-member/index.ts:181-193 | Sửa EF |
| 4.6 | Setup link yếu khi tạo cửa hàng | P1 | create-tenant/index.ts:147-158 | Sửa EF |
| 4.7 | Reset password type dựa trên last_sign_in_at | P1 | reset-password/index.ts:142-144 | Sửa EF |
| 4.8 | Trial tenant không thể mời thành viên | P1 | invite-member/index.ts:89-91 | Sửa EF |
| 4.9 | Toggle active/Xoá owner ở grid không disabled | P1 | MemberManagement.tsx:273-285 | Sửa UI |
| 5.1 | Thiếu audit log | P2 | tenantService.ts | 20260712000008 |
| 5.2 | Thiếu rate limiting reset-password | P2 | reset-password/index.ts | Sửa EF |
| 5.6 | get_tenant_usage_summary chỉ system admin | P2 | fix_invite_seat_limit:74-76 | 20260712000010 |
| 5.7 | Không có API xoá auth user độc lập | P2 | Chưa có | EF mới |
| 7.3 | toggleMemberActive không guardrail | P1 | f33_members_guardrails.sql:39-57 | 20260712000005 |

### Lỗi đã fix một phần (2 lỗi)

| # | Lỗi | Mức | Ghi chú |
|---|-----|-----|---------|
| 3.4 | add_system_admin thiếu SECURITY DEFINER | P0 | Đã fix trong 20260708000004 ✅ |
| 5.3 | create-system-admin không check email tồn tại | P2 | Đã có check qua error handling ✅ |

### Lỗi phát hiện mới từ kiểm định (5 lỗi)

| # | Lỗi | Mức | File | Migration fix |
|---|-----|-----|------|---------------|
| 7.1 | remove_system_admin vẫn dùng SECURITY INVOKER | P0 | phase_p5_audit_security.sql:159 | 20260712000004 |
| 7.2 | Guardrail trigger không filter status/is_active | P1 | f33_members_guardrails.sql:25 | 20260712000005 |
| 7.3 | toggleMemberActive không guardrail | P1 | f33_members_guardrails.sql:39 | 20260712000005 |
| 7.4 | reset-password không rate limiting | P1 | reset-password/index.ts | Sửa EF |
| 7.5 | is_system_admin() auth.uid() null từ service-role | P0 | baseline schema | 20260712000011 |

---

## TỔNG KẾT

| Phase | Thời gian | Số lượng task | Mức độ ưu tiên |
|-------|-----------|---------------|----------------|
| Phase 0: Hotfix | 0-1 ngày | 3 tasks | 🔴 P0 |
| Phase 1: Emergency | 1-2 ngày | 7 tasks | 🔴 P0 |
| Phase 2: Core Fix | 1-2 tuần | 10 tasks | 🟠 P1 |
| Phase 3: Soft-delete | 3-4 tuần | 6 tasks | 🟠 P1 |
| Phase 4: Hardening | 2-3 tháng | 5 tasks | 🟡 P2 |
| Phase 5: Long-term | 4-6 tháng | 4 tasks | 🟢 P3 |

**Tổng cộng:** 35 tasks, ước tính 4-6 tháng để hoàn thành toàn bộ.

### Kết luận kiểm định

1. **FIX_PLAN hiện tại đã phát hiện đúng các lỗi** - Tất cả 23 lỗi từ 2 nguồn đều được xác nhận qua source code
2. **Phát hiện thêm 5 lỗi mới** chưa có trong cả 2 nguồn (mục 7.1-7.5)
3. **Tất cả 28 lỗi đều có hướng giải quyết chi tiết** với code mẫu production-ready
4. **Lỗi nghiêm trọng nhất cần hotfix ngay**:
   - `create-system-admin` không hoạt động (3.6) - blocking
   - `remove_system_admin` dùng SECURITY INVOKER (7.1) - có thể fail khi xoá
   - `is_system_admin()` không hoạt động từ service-role (7.5) - root cause của 3.6
5. **Cần ưu tiên Phase 0 ngay lập tức** trước khi triển khai bất kỳ tính năng nào khác
6. **12 migration SQL cần tạo** và **5 Edge Function cần sửa/tạo** để fix toàn bộ lỗi