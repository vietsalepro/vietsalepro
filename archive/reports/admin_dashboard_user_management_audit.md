# BÁO CÁO KIỂM TRA: Tạo / Xóa / Phân quyền / Mời thành viên trong Admin Dashboard

Ngày: 2026-07-11
Dự án: vietsale-pro-v7
Mục đích: Mô tả đầy đủ code, logic, rule, điều kiện hiện tại và liệt kê các điểm cần fix.

---

## 1. Mô hình dữ liệu chính

| Bảng | Vai trò |
|------|---------|
| `auth.users` | User do Supabase Auth quản lý; không expose qua PostgREST. Edge function / SECURITY DEFINER RPC mới đọc được. |
| `public.tenants` | Cửa hàng/tenant. `owner_id` trỏ `auth.users`, `plan` FK `public.plans`. |
| `public.tenant_memberships` | Membership của user trong 1 tenant: `role`, `status` (pending/active/inactive), `is_active`, `invited_at`, `accepted_at`. Unique `(tenant_id, user_id)`. |
| `public.tenant_subscriptions` | Giới hạn gói: `max_users`, `max_products`, `max_orders_per_month`. FK `plan` → `public.plans`. |
| `public.system_admins` | User có quyền system admin. |
| `public.tenant_credentials` | Lưu `admin_email` (mật khẩu plaintext đã bị xóa). Chỉ system admin truy cập. |
| `public.plans` | Plan builder: `free`/`vip` và giới hạn mặc định. |
| `public.rate_limit_logs` | Lưu log rate limit cho các action. |
| `public.app_audit_log` | Audit log. |

**`TenantRole`**: `admin | cashier | inventory_manager | accountant`.

**Tham chiếu**:
- `types/tenant.ts` dòng 8, 51-74
- `supabase/migrations/20250704000000_phase2_tenant_foundation.sql` dòng 9-47
- `supabase/migrations/20260711000003_f33_members_foundation.sql` dòng 9-20
- `supabase/migrations/20260711000001_add_tenant_credentials_table.sql` dòng 6-29
- `supabase/migrations/20260711000002_remove_tenant_credentials_password.sql` dòng 1-8
- `supabase/migrations/20250706000011_phase_p8_1_plan_builder_schema.sql` dòng 90-94

---

## 2. Auth / Authorization / RLS

### 2.1. Helper functions
- `is_system_admin()`: `auth.uid()` trong `public.system_admins`.
- `is_tenant_member(p_tenant_id)`, `is_tenant_admin(p_tenant_id)`, `has_tenant_role(...)`.
- `current_tenant_id()`: lấy từ header `x-tenant-id`.
- `lib/supabase.ts` gắn `x-tenant-id` vào mọi request qua `tenantFetch`.

**Tham chiếu**:
- `supabase/migrations/20250704000000_phase2_tenant_foundation.sql` dòng 53-88
- `supabase/migrations/20250704000006_phase5_1_current_tenant_id.sql` dòng 4-21
- `lib/supabase.ts` dòng 24-34

### 2.2. RLS chính
- `tenants`: member SELECT theo membership; system admin ALL.
- `tenant_memberships`: SELECT (own, tenant admin, system admin); ALL (tenant admin, system admin).
- `system_admins`: chỉ system admin.
- `tenant_credentials`: chỉ system admin.
- `tenant_subscriptions`: SELECT member/system admin; ALL system admin.

**Tham chiếu**:
- `supabase/migrations/20250704000000_phase2_tenant_foundation.sql` dòng 107-157, 182-192
- `supabase/migrations/20260711000001_add_tenant_credentials_table.sql` dòng 16-29

---

## 3. Luồng Tạo User

### 3.1. Tạo system admin
**UI**: `pages/SystemAdminDashboard.tsx` tab System Admins → form email + password (≥6 ký tự).  
**Service**: `services/systemAdminService.ts` → `createSystemAdmin(email, password)` gọi Edge Function `create-system-admin`.  
**Edge Function** `supabase/functions/create-system-admin/index.ts`:
1. Rate limit IP 10 req/phút.
2. Xác thực token, kiểm tra caller là system admin.
3. Validate email/password.
4. `auth.admin.createUser({ email, password, email_confirm: true })`.
5. Gọi RPC `add_system_admin(p_user_id)`. Nếu lỗi → xóa auth user.
6. Ghi audit log.

**Tham chiếu**:
- `pages/SystemAdminDashboard.tsx` dòng 1055-1081
- `services/systemAdminService.ts` dòng 76-93
- `supabase/functions/create-system-admin/index.ts` dòng 15-173
- `supabase/migrations/20260708000004_fix_system_admin_rls.sql` dòng 29-55

### 3.2. Tạo admin user khi tạo cửa hàng
**UI**: `pages/SystemAdminDashboard.tsx` → form Tạo cửa hàng mới, kiểm tra subdomain.  
**Service**: `services/tenantService.ts` → `createTenantWithCredentials` gọi Edge Function `create-tenant`.  
**Edge Function** `supabase/functions/create-tenant/index.ts`:
1. Rate limit `create_tenant` 10 req/phút.
2. Xác thực + system admin check.
3. Validate name, email, subdomain, plan.
4. Lấy giới hạn từ `get_default_plan_limit_values(p_plan)` hoặc fallback.
5. `auth.admin.createUser({ email, password: randomUUID, email_confirm: true })`.
6. Insert `tenants`, `tenant_subscriptions`, `tenant_memberships` (role `admin`, owner), `tenant_credentials`, `app_audit_log`.
7. `generateLink({ type: 'invite' })`. Nếu lỗi ghi `EMAIL_FAILED`.
8. Rollback xóa auth user nếu fail sau bước 5.

**Tham chiếu**:
- `pages/SystemAdminDashboard.tsx` dòng 493-531, 985-1007
- `services/tenantService.ts` dòng 171-209
- `supabase/functions/create-tenant/index.ts` dòng 9-263

### 3.3. Tạo user khi mời thành viên
Xem phần 6.

---

## 4. Luồng Xóa User

### 4.1. Xóa quyền system admin
**UI**: `pages/SystemAdminDashboard.tsx` → nút Xóa trong danh sách system admin.  
**Service**: `removeSystemAdmin(userId)` gọi `supabase.rpc('remove_system_admin')`.  
**RPC `remove_system_admin`**:
- Kiểm tra `is_system_admin()`.
- Không cho tự xóa chính mình.
- `DELETE FROM system_admins`.
- Auth user không bị xóa.

**Tham chiếu**:
- `pages/SystemAdminDashboard.tsx` dòng 1083-1097
- `services/systemAdminService.ts` dòng 71-74
- `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` dòng 11268-11288
- `supabase/migrations/20250706000004_phase_p5_audit_security.sql` dòng 159-179

### 4.2. Xóa thành viên khỏi tenant
**Service**: `services/tenantService.ts` → `removeMember(tenantId, userId)` xóa `tenant_memberships`.  
**UI**:
- `MemberManagement` row nút trash.
- `MemberDetailDrawer` nút Xóa (disabled nếu `isOwner`).
- `MemberBulkActions` nút Xóa (disabled nếu chọn owner).

**Trigger `tenant_memberships_guardrails`**:
- `BEFORE DELETE OR UPDATE` trên `tenant_memberships`.
- Không cho xóa owner.
- Không cho xóa admin cuối cùng.
- Khi cascade delete từ `tenants`, trigger `trg_tenants_before_delete` set `app.hard_delete_tenant=true` để bypass.

**Tham chiếu**:
- `services/tenantService.ts` dòng 545-553
- `components/MemberManagement.tsx` dòng 236-255
- `components/MemberManagement/MemberDetailDrawer.tsx` dòng 163-173
- `components/MemberManagement/MemberBulkActions.tsx` dòng 98-108
- `supabase/migrations/20260711000005_f33_members_guardrails.sql` dòng 5-68
- `supabase/migrations/20260711000009_fix_tenant_delete_cascade_guardrail.sql` dòng 10-92

### 4.3. Xóa auth user
Chỉ trong **Hard delete tenant** (`delete-tenant` Edge Function):
- Xóa storage, orphan tables, tenant row (cascade).
- Xóa auth user của các user thuộc tenant, không phải system admin, không còn membership/ownership nào khác.

**Tham chiếu**:
- `supabase/functions/delete-tenant/index.ts` dòng 9-229

**Không có API độc lập “xóa user hoàn toàn” ngoài luồng xóa tenant.**

---

## 5. Luồng Thêm / Đổi quyền cho User

### 5.1. Thêm quyền system admin
- `create-system-admin` Edge Function tạo user + gọi `add_system_admin(p_user_id)`.
- `add_system_admin` RPC: `is_system_admin()`, kiểm tra tồn tại `auth.users`, insert `system_admins`.
- `addSystemAdmin(userId)` trong service không được UI sử dụng.

**Tham chiếu**:
- `supabase/functions/create-system-admin/index.ts` dòng 151-159
- `supabase/migrations/20260708000004_fix_system_admin_rls.sql` dòng 29-55
- `services/systemAdminService.ts` dòng 65-69

### 5.2. Đổi vai trò trong tenant
**Service**: `services/tenantService.ts` → `updateMemberRole(tenantId, userId, role)` update `tenant_memberships.role`.  
**UI**:
- `MemberManagement` dropdown role trên mỗi dòng.
- `MemberDetailDrawer` chọn role → Đổi vai trò.
- `MemberBulkActions` đổi role hàng loạt (disabled nếu chọn owner).

**Trigger `tenant_memberships_guardrails`**:
- Không cho đổi role của owner.
- Không cho hạ role admin cuối cùng xuống non-admin.

**Tham chiếu**:
- `services/tenantService.ts` dòng 528-543
- `components/MemberManagement.tsx` dòng 188-207
- `components/MemberManagement/MemberDetailDrawer.tsx` dòng 151-161
- `components/MemberManagement/MemberBulkActions.tsx` dòng 59-72
- `supabase/migrations/20260711000005_f33_members_guardrails.sql` dòng 39-57

### 5.3. Permission ứng dụng
`usePermissions` hook map role → quyền nghiệp vụ (POS, kho, báo cáo, ...).  
**Tham chiếu**: `hooks/usePermissions.ts` dòng 1-18.

---

## 6. Luồng Mời thành viên vào một tenant

### 6.1. UI
- `SystemAdminDashboard` tab Thành h viên → chọn tenant → expand → `MemberManagement`.
- `MemberManagement` có nút **Mời thành viên**.
- `MemberInviteModal`: nhập danh sách email (tối đa 50, phân cách `,;` hoặc khoảng trắng), chọn role, kiểm tra quota.

**Tham chiếu**:
- `pages/SystemAdminDashboard.tsx` dòng 1722-1810
- `components/MemberManagement.tsx` dòng 401-461
- `components/MemberManagement/MemberInviteModal.tsx` dòng 26-94

### 6.2. Service
- `bulkInviteMembers(tenantId, emails, role, maxConcurrency=3)`:
  - Deduplicate, validate, loại bỏ rỗng.
  - Chạy `inviteMemberByEmail` theo pool async.
  - Trả summary `succeeded/failed/alreadyMember/emailProviderNotConfigured/errors`.
- `inviteMemberByEmail` gọi Edge Function `invite-member`.
- `inviteMember(tenantId, userId, role)` là hàm insert trực tiếp, chủ yếu dùng trong test.

**Tham chiếu**:
- `services/tenantService.ts` dòng 365-429, 473-488, 504-526

### 6.3. Edge Function `invite-member`
1. Xác thực token.
2. Validate `tenant_id`, email, role.
3. Kiểm tra tenant tồn tại và `status = 'active'`.
4. Rate limit IP 10 req/phút, tenant 50 lời mời/giờ.
5. Authorization: caller là system admin HOẶC tenant admin (`role='admin'` trong `tenant_memberships`).
6. Kiểm tra quota: `max_users` so với số membership `status IN ('pending','active')`.
7. Tìm user theo email qua RPC `get_user_by_email`.
8. Nếu user đã tồn tại: kiểm tra chưa là member, insert membership. **Không gửi email/link**.
9. Nếu user mới: `auth.admin.createUser({ email, password: randomUUID, email_confirm: false })`, `generateLink({ type: 'invite' })`.
10. Insert `tenant_memberships` (`status` default `pending`, `is_active` default `true`).
11. Ghi audit log.

**Tham chiếu**:
- `supabase/functions/invite-member/index.ts` dòng 9-284
- `supabase/migrations/20260711000011_fix_edge_functions_auth_query.sql` dòng 6-22

### 6.4. Quota & Kích hoạt
- Trigger `check_tenant_limits` BEFORE INSERT trên `tenant_memberships` kiểm tra tenant active/trial, subscription tồn tại, đếm `pending`+`active` so với `max_users`.
- `get_tenant_usage_summary` cũng đếm `pending`+`active`.
- Khi user đăng nhập, `AuthContext` gọi `activate_pending_memberships` để chuyển `status` từ `pending` → `active`.

**Tham chiếu**:
- `supabase/migrations/20260711000010_fix_invite_seat_limit_and_plan_sync.sql` dòng 13-54, 59-125
- `supabase/migrations/20260711000007_f33_members_status_activation.sql` dòng 5-16
- `contexts/AuthContext.tsx` dòng 89-93

### 6.5. Gửi lại lời mời / Reset mật khẩu
- `resendMemberInvite` kiểm tra `status='pending'` rồi gọi `resetMemberPassword`.
- `resetMemberPassword` gọi Edge Function `reset-password`.
- `reset-password` Edge Function:
  - Caller là system admin hoặc tenant admin.
  - Tenant phải `active`.
  - Resolve user theo `user_id` hoặc `email`.
  - Kiểm tra user thuộc tenant.
  - Chọn `type` dựa trên `last_sign_in_at`: `'invite'` nếu chưa sign-in, `'recovery'` nếu đã sign-in.
  - `generateLink` với `redirectTo` hardcoded `https://{subdomain}.vietsalepro.com/{set-password|reset-password}`.

**Tham chiếu**:
- `services/tenantService.ts` dòng 431-443, 490-502
- `components/MemberManagement/MemberDetailDrawer.tsx` dòng 114-136
- `supabase/functions/reset-password/index.ts` dòng 9-166

---

## 7. Tìm kiếm / Hiển thị danh sách thành viên

- `searchTenantMembers` gọi RPC `search_tenant_members(p_tenant_id, p_search, p_role, p_status, p_is_active, p_sort_by, p_sort_dir, p_page, p_page_size)`.
- Cho phép system admin hoặc tenant admin.
- Trả về `is_owner` dựa trên `tenants.owner_id = tm.user_id`, join `auth.users` lấy email, last_sign_in_at, confirmed_at.

**Tham chiếu**:
- `services/tenantService.ts` dòng 345-363
- `supabase/migrations/20260711000004_f33_members_search_rpc.sql` dòng 4-98

---

## 8. DANH SÁCH LỖI / TIỀM ẨN CẦN FIX

### 8.1. Tạo system admin bị lỗi logic (CRITICAL)
`create-system-admin` Edge Function gọi `add_system_admin` RPC từ service-role client. `add_system_admin` kiểm tra `is_system_admin()` dựa trên `auth.uid()`, nhưng từ service-role client `auth.uid()` là `null` → thất bại, user auth vừa tạo bị xóa rollback.

**Tham chiếu**:
- `supabase/functions/create-system-admin/index.ts` dòng 151-159
- `supabase/migrations/20260708000004_fix_system_admin_rls.sql` dòng 29-55

**Hướng fix**:
- Trong Edge Function, insert trực tiếp `public.system_admins` bằng `supabaseAdmin.from('system_admins').insert()` (service role bypass RLS), hoặc
- Gọi một RPC `add_system_admin_for_edge` không kiểm tra `auth.uid()` mà truyền `p_creator_user_id` để audit.

---

### 8.2. Tạo cửa hàng / admin user - setup link yếu
`create-tenant` tạo user với `email_confirm: true` và mật khẩu random, sau đó `generateLink({ type: 'invite' })`. Nếu `generateLink` thất bại, admin không nhận được mật khẩu/link. UI không hiển thị link setup; chỉ báo “email đã gửi” dựa trên `!linkError`.

**Tham chiếu**:
- `supabase/functions/create-tenant/index.ts` dòng 147-158, 219-239
- `pages/SystemAdminDashboard.tsx` dòng 1483-1511

**Hướng fix**:
- Tạo user với `email_confirm: false` và sinh link `invite` đúng chuẩn, hoặc
- Trả về `link` trong response và hiển thị trong UI để admin có thể copy gửi khi không có SMTP.

---

### 8.3. Reset mật khẩu chọn type dựa trên `last_sign_in_at` không robust
`reset-password` chọn `type='invite'` nếu `last_sign_in_at` null, `type='recovery'` nếu đã sign-in. Với admin mới tạo từ `create-tenant` (`email_confirm=true` nhưng `last_sign_in_at` null), `type='invite'` có thể không hợp lệ.

**Tham chiếu**:
- `supabase/functions/reset-password/index.ts` dòng 142-161

**Hướng fix**:
- Chọn `type` dựa trên `confirmed_at` / `email_confirmed_at` thay vì `last_sign_in_at`.
- Hoặc thêm logic: nếu `confirmed_at` đã có thì dùng `recovery`, nếu chưa thì dùng `invite`.

---

### 8.4. Mời user đã tồn tại không gửi email/link
`invite-member` nếu tìm thấy user trong `auth.users` chỉ insert membership, không gửi email hoặc link. User đã tồn tại không biết mình được mời.

**Tham chiếu**:
- `supabase/functions/invite-member/index.ts` dòng 181-193

**Hướng fix**:
- Với user đã tồn tại, sinh `recovery`/`invite` link và gửi (hoặc trả về link để UI hiển thị).

---

### 8.5. Trial tenant không thể mời thành viên
`invite-member` yêu cầu `tenant.status = 'active'`, trong khi trigger `check_tenant_limits` cho phép `active`/`trial`. Nếu trial cần mời thành viên, cần đồng bộ.

**Tham chiếu**:
- `supabase/functions/invite-member/index.ts` dòng 89-91
- `supabase/migrations/20260711000010_fix_invite_seat_limit_and_plan_sync.sql` dòng 25-28

**Hướng fix**:
- Đồng bộ điều kiện: `status IN ('active', 'trial')` ở cả Edge Function và trigger.

---

### 8.6. `get_tenant_usage_summary` chỉ system admin
`MemberInviteModal` gọi `getTenantUsageSummary`. RPC `get_tenant_usage_summary` chỉ cho phép `is_system_admin()`. Nếu `MemberManagement` dùng ở context tenant admin (route `/members`), quota sẽ bị 403.

**Tham chiếu**:
- `supabase/migrations/20260711000010_fix_invite_seat_limit_and_plan_sync.sql` dòng 74-76
- `components/MemberManagement/MemberInviteModal.tsx` dòng 45-51

**Hướng fix**:
- Cho phép `is_tenant_admin(p_tenant_id)` gọi `get_tenant_usage_summary`, hoặc
- `MemberInviteModal` không gọi quota khi ở tenant admin context.

---

### 8.7. Race condition vượt quota
`invite-member` kiểm tra count trước rồi insert. `bulkInviteMembers` chạy concurrent. Có thể vượt `max_users` trong race condition.

**Hướng fix**:
- Dùng advisory lock hoặc serializable transaction trong `invite-member`/`check_tenant_limits`.
- Hoặc giới hạn `bulkInviteMembers` maxConcurrency = 1 khi gần quota.

---

### 8.8. Toggle active / Xóa owner ở grid không bị disabled
`MemberManagement` grid vẫn cho phép đổi role/xóa owner qua dropdown/trash. DB trigger từ chối nhưng UX kém. `toggleMemberActive` không bị guardrail chặn, có thể vô hiệu hóa owner.

**Tham chiếu**:
- `components/MemberManagement.tsx` dòng 257-378
- `components/MemberManagement/MemberDetailDrawer.tsx` dòng 292-297

**Hướng fix**:
- Disable dropdown role và nút xóa cho owner trong grid.
- Cân nhắc guardrail không cho `toggleMemberActive` đối với owner.

---

### 8.9. Không có API xóa auth user độc lập
`removeMember` chỉ xóa membership. User “orphan” vẫn tồn tại trong `auth.users` và có thể đăng nhập nhưng không có tenant.

**Hướng fix**:
- Thêm Edge Function `delete-user` (chỉ system admin) xóa auth user nếu không còn membership/ownership nào khác.

---

### 8.10. Guardrail không phân biệt `status` / `is_active`
Trigger `tenant_memberships_guardrails` tính “admin cuối cùng” theo `role='admin'` bất kể `status`/`is_active`.

**Tham chiếu**:
- `supabase/migrations/20260711000009_fix_tenant_delete_cascade_guardrail.sql` dòng 30-92

**Hướng fix**:
- Chỉ tính admin `status IN ('active', 'pending')` và `is_active = true`.

---

### 8.11. Xóa system admin cuối cùng không bị chặn
`remove_system_admin` chỉ chặn tự xóa chính mình, không chặn xóa system admin cuối cùng.

**Hướng fix**:
- Thêm kiểm tra `SELECT COUNT(*) FROM system_admins` trước khi xóa.

---

### 8.12. `addSystemAdmin(userId)` trong service không được UI dùng
UI chỉ có flow tạo system admin mới qua `createSystemAdmin`. Không có flow thêm quyền system admin cho user đã tồn tại.

**Tham chiếu**:
- `services/systemAdminService.ts` dòng 65-69
- `pages/SystemAdminDashboard.tsx` dòng 83-87

---

## 9. Tổng kết

Các luồng chính (tạo tenant admin, mời member, đổi role, xóa member, tạo/xóa system admin) đã có đầy đủ code và guardrail ở DB. Tuy nhiên, **lỗi nghiêm trọng nhất cần ưu tiên fix là `create-system-admin` Edge Function bị lỗi logic do gọi `add_system_admin` từ service-role client**, tiếp theo là setup link/password cho admin user mới tạo và reset password type không chính xác.

Ngoài ra cần đồng bộ hóa điều kiện `tenant.status` giữa `invite-member` và `check_tenant_limits`, cải thiện UX disable action cho owner, và cung cấp cơ chế xóa auth user orphan.
