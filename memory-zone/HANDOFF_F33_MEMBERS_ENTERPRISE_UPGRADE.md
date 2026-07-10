# HANDOFF F33 — Nâng cấp tab Thành viên lên Enterprise

> Đã chia thành các sub-phase nhỏ. Xem index tại `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_INDEX.md` và thực hiện từng sub-phase riêng để tránh vượt context.

## Ngữ cảnh

Tab **Thành viên** trong admin dashboard hiện tại không đáp ứng được khi tenant có hơn 1000 thành viên. UI render toàn bộ danh sách, không có tìm kiếm/lọc/phân trang, và flow mời thành viên còn một số lỗi logic khi scale.

Đây là handoff để chat sau triển khai. **Không implement trong chat hiện tại.**

## Quyết định đã thống nhất với product owner

1. **Quyền truy cập**: Cả super admin (trong System Admin Dashboard) và tenant admin (trong shop của họ) đều có màn quản lý thành viên. Tính năng này thuộc **gói VIP**, gói free không có.
2. **Trạng thái lời mời**: Làm đầy đủ hướng B — thêm cột `status` vào `tenant_memberships` (`pending`, `active`, `inactive`). Không làm hướng tạm.
3. **Thông tin active/inactive**: Hiển thị `last_sign_in_at` và `confirmed_at`. Thêm cột `is_active` (hoặc dùng `status`) để khóa tài khoản mềm.
4. **Bulk invite scope**: Tối đa **50 email/lần**.
5. **Tách component**: Có, tách thành component riêng `MemberManagement` để tái sử dụng cho cả super admin và tenant admin.
6. **Xử lý lời mời thất bại**:
   - Email đã là thành viên → báo "đã là thành viên", không làm gì thêm.
   - Email chưa đăng ký → tạo user tạm và gửi link set password.
   - Email provider (SMTP) chưa cấu hình → chỉ tạo user, admin tự set password thủ công.
7. **Bảo vệ owner**: Owner của tenant không được xóa.

---

## Tình trạng hiện tại

### UI hiện tại
- Tab Thành viên nằm trong `pages/SystemAdminDashboard.tsx`.
- Chọn shop bằng `<select>` thường, load toàn bộ tenants về client.
- Bảng là `<table>` HTML thuần, render toàn bộ members bằng `.map()`.
- Không có: tìm kiếm, lọc, sắp xếp, phân trang, chọn nhiều dòng, density, mobile card view.
- Form mời chỉ mời 1 email/lần.

### Backend hiện tại
- `services/tenantService.ts`: `getTenantMembersWithEmail`, `inviteMemberByEmail`, `updateMemberRole`, `removeMember`, `resetMemberPassword`.
- Edge function `supabase/functions/invite-member/index.ts`.
- Edge function `supabase/functions/reset-password/index.ts`.
- DB function `get_tenant_members_with_email(p_tenant_id uuid)` trả về JSON toàn bộ members, chỉ cho system admin.
- Bảng `tenant_memberships` chưa có `status`, `is_active`, `invited_at` riêng.

### Component sẵn có để tái sử dụng
- `components/DataGrid.tsx`: có toolbar, search, filter, sort, pagination, density, column visibility, mobile cards.

---

## Các lỗi / sai sót cần sửa

| # | Vấn đề | Mức độ | Vị trí |
|---|--------|--------|--------|
| 1 | `get_tenant_members_with_email` trả về toàn bộ members, không phân trang. | Nghiêm trọng khi scale | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` (dòng ~9280) |
| 2 | `invite-member` dùng `auth.admin.listUsers({ perPage: 1000 })` để tìm email. Nếu user nằm ngoài 1000 đầu, sẽ tạo user trùng email hoặc lỗi. | Nghiêm trọng khi scale | `supabase/functions/invite-member/index.ts` dòng 150 |
| 3 | UI render table toàn bộ members, không virtualized/pagination. | UX kém với 1000+ | `pages/SystemAdminDashboard.tsx` dòng 1908-1975 |
| 4 | Có thể đổi role / xóa admin duy nhất của tenant. | Lockout tenant | `services/tenantService.ts` `updateMemberRole`, `removeMember` |
| 5 | Đổi role qua `<select>` fire ngay, không xác nhận. | Misclick | `pages/SystemAdminDashboard.tsx` dòng 1941-1948 |
| 6 | `handleResetPassword` hiển thị reset link trong toast. | Lộ link | `pages/SystemAdminDashboard.tsx` dòng 1233-1238 |
| 7 | Validate email chỉ `.includes('@')`. | Sai định dạng | `supabase/functions/invite-member/index.ts` dòng 84 |
| 8 | `get_tenant_members_with_email` chỉ cho system admin, chưa support tenant admin. | Cần cho câu 1 | DB function dòng 9285 |
| 9 | `tenant_memberships` chưa có `status`/`is_active`. | Thiếu enterprise feature | Migration phase 2 |
| 10 | Rate limit invite chỉ theo IP, không theo tenant. | Spam risk | `supabase/functions/invite-member/index.ts` dòng 46 |

---

## Phân rã nhiệm vụ

### Phase 1 — DB foundation + sửa lỗi backend cốt lõi

1.1. Migration mới: `supabase/migration_f33_members_foundation.sql`
- Thêm cột vào `tenant_memberships`:
  - `status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','inactive'))`
  - `is_active BOOLEAN NOT NULL DEFAULT true`
  - `invited_at TIMESTAMPTZ DEFAULT now()`
  - `accepted_at TIMESTAMPTZ`
- Cập nhật dữ liệu hiện có: nếu user đã sign in (`last_sign_in_at` not null) thì `status = 'active'`, ngược lại `status = 'pending'`.
- Thêm index: `tenant_memberships(tenant_id, status)`, `tenant_memberships(tenant_id, role)`, `tenant_memberships(tenant_id, is_active)`.

1.2. Tạo function `search_tenant_members`
- Input: `p_tenant_id uuid`, `p_search text` (tìm email), `p_role text`, `p_status text`, `p_is_active boolean`, `p_sort_by text`, `p_sort_dir text`, `p_page int`, `p_page_size int`.
- Output: JSON `{ items: [...], total_count: int }`.
- Hỗ trợ cả system admin và tenant admin (dùng `is_system_admin()` hoặc `is_tenant_admin(p_tenant_id)`).
- Sắp xếp theo `email`, `role`, `status`, `created_at`, `last_sign_in_at`.
- Trả về thêm các cột: `email`, `invited_by_email`, `status`, `is_active`, `last_sign_in_at`, `confirmed_at`.

1.3. Sửa edge function `invite-member`
- Thay `auth.admin.listUsers({ perPage: 1000 })` bằng query trực tiếp `auth.users` theo email.
- Validate email bằng regex chuẩn.
- Xử lý trạng thái theo quyết định:
  - Email đã là member → trả về lỗi/báo cáo `already_member`.
  - Email chưa có user → tạo user tạm + generate recovery link.
  - Nếu generate link thất bại (không có email provider) → vẫn tạo user, trả về `email_provider_not_configured` để admin biết phải set password thủ công.
- Kiểm tra `max_users` với cả `pending` và `active` members.
- Ghi audit log khi mời.

1.4. Thêm bảo vệ admin duy nhất và owner
- Trigger/function trước khi update/delete membership:
  - Không cho phép xóa owner (`tenants.owner_id`).
  - Không cho phép đổi role hoặc xóa nếu kết quả làm tenant không còn admin nào.
- Có thể dùng constraint trigger `BEFORE UPDATE OR DELETE ON tenant_memberships`.

1.5. Sửa `reset-password` edge function (nếu cần)
- Đảm bảo vẫn hoạt động với user chưa sign in (type = invite, path = set-password).
- Không thay đổi nhiều nếu đã đúng.

### Phase 2 — Service layer frontend

2.1. Thêm types
- Trong `types/tenant.ts`: mở rộng `MemberWithEmail` thêm `status`, `isActive`, `invitedAt`, `acceptedAt`, `lastSignInAt`, `confirmedAt`.
- Thêm type `SearchMembersParams`, `SearchMembersResult`.

2.2. Thêm functions trong `services/tenantService.ts`
- `searchTenantMembers(params: SearchMembersParams): Promise<SearchMembersResult>`
- `bulkInviteMembers(tenantId, emails[], role, maxConcurrency?)`
- `resendMemberInvite(tenantId, userId)`
- `toggleMemberActive(tenantId, userId, isActive)`
- Cập nhật `updateMemberRole` để thêm xác nhận hoặc gọi RPC mới có bảo vệ admin duy nhất.
- Cập nhật `removeMember` để gọi RPC có bảo vệ owner/admin duy nhất.

### Phase 3 — Component MemberManagement

3.1. Tạo `components/MemberManagement.tsx`
- Container quản lý state: tenantId, search, filters, pagination, sort, selected rows.
- Nhận prop `tenantId` và `isTenantAdmin?: boolean`.
- Nếu `tenantId` không có (super admin tab chưa chọn shop), hiển thị selector.

3.2. Tạo `components/MemberManagement/MemberInviteModal.tsx`
- Input: textarea paste nhiều email (tối đa 50).
- Parse email: tách bởi `,`, `;`, newline, space.
- Validate, loại bỏ trùng, kiểm tra quota.
- Preview: thành công bao nhiêu, lỗi bao nhiêu, đã là member bao nhiêu.
- Chọn role mặc định.

3.3. Tạo `components/MemberManagement/MemberBulkActions.tsx`
- Khi có rows được chọn: hiển thị "Đổi vai trò", "Kích hoạt/Khóa", "Xóa".
- Xác nhận trước khi thực hiện.
- Kiểm tra bảo vệ owner/admin duy nhất trong bulk action.

3.4. Tạo `components/MemberManagement/MemberDetailDrawer.tsx`
- Hiển thị chi tiết member: email, role, status, invited by, invited at, accepted at, last sign in, confirmed at, is active.
- Nút actions: resend invite, reset password, toggle active, change role, remove.

3.5. Tích hợp `<DataGrid>`
- Columns: select checkbox, email, role (badge), status (badge), is active (toggle/icon), invited by, invited at, last sign in, actions.
- Toolbar: search email, filter role, filter status, filter active, button "Mời thành viên".
- Pagination: 10/20/50/100/trang.
- Sort: email, role, status, created_at.
- Mobile card view.

### Phase 4 — Tích hợp vào các màn hình

4.1. System Admin Dashboard
- Thay thế phần `{activeTab === 'members' && ...}` trong `pages/SystemAdminDashboard.tsx` bằng `<MemberManagement />`.
- Giữ tenant selector cho super admin.

4.2. Tenant Admin Dashboard
- Thêm route/menu "Thành lập / Quản lý thành viên" trong giao diện shop.
- Kiểm tra feature flag/gói VIP trước khi hiển thị.
- Nhúng `<MemberManagement tenantId={currentTenantId} isTenantAdmin />`.
- Cần xác định vị trí cụ thể trong `components/AppTopbar.tsx`, `components/MobileLayout.tsx`, `components/FeaturePicker.tsx`, `components/BottomNav.tsx` — các file này đã có `permissions.canManageUsers`.

4.3. Feature flag / plan check
- Kiểm tra `tenant_subscriptions.plan === 'vip'` hoặc dùng feature flag.
- Gói free ẩn menu và redirect nếu truy cập trực tiếp.

### Phase 5 — Xử lý trạng thái invitation

5.1. Cập nhật status khi user sign in
- Trigger trên `auth.users` khi `last_sign_in_at` thay đổi từ NULL sang có giá trị: cập nhật tất cả `tenant_memberships` của user đó từ `pending` sang `active`, set `accepted_at = now()`.
- Hoặc dùng edge function/set hook nếu không trigger được auth schema.

5.2. Resend invite
- Edge function hoặc service function gọi `generateLink` type `invite` hoặc `recovery` tùy trạng thái.
- Chỉ cho phép resend khi `status = 'pending'`.

5.3. Toggle active/inactive
- Cập nhật `is_active`. Không xóa membership.
- Khi inactive, user không thể truy cập tenant (cần kiểm tra RLS/policy ở các tính năng khác).

### Phase 6 — UX polish & enterprise touches

6.1. Toast/notification
- Thay `handleResetPassword` hiển thị link bằng toast thông báo đã gửi email.
- Bulk invite kết thúc hiển thị summary.

6.2. Loading/error states
- DataGrid đã hỗ trợ loading, empty, error.
- Thêm skeleton cho detail drawer.

6.3. Responsive
- DataGrid mobile cards.
- Invite modal responsive.

6.4. Accessibility
- Đảm bảo focus trap trong modal, aria-label cho icon buttons, keyboard navigation trong DataGrid.

---

## Files cần tạo mới

- `supabase/migration_f33_members_foundation.sql`
- `components/MemberManagement.tsx`
- `components/MemberManagement/MemberInviteModal.tsx`
- `components/MemberManagement/MemberBulkActions.tsx`
- `components/MemberManagement/MemberDetailDrawer.tsx`
- `components/MemberManagement/useMembers.ts` (optional: hook quản lý query/mutation)
- `tests/smoke/member-management-enterprise.test.ts`
- `tests/integration/member-invite-flow.test.ts` (optional)

## Files cần sửa

- `types/tenant.ts`
- `services/tenantService.ts`
- `pages/SystemAdminDashboard.tsx`
- `supabase/functions/invite-member/index.ts`
- `supabase/functions/reset-password/index.ts` (ít thay đổi)
- `components/AppTopbar.tsx` (thêm menu cho tenant admin, VIP only)
- `components/MobileLayout.tsx` (thêm menu cho tenant admin, VIP only)
- `components/FeaturePicker.tsx` (thêm menu cho tenant admin, VIP only)
- `components/BottomNav.tsx` (thêm menu cho tenant admin, VIP only)
- `tests/smoke/admin-dashboard-p3-member-management.test.ts` (cập nhật)

## Tiêu chí chấp nhận (Acceptance Criteria)

### Backend
- [ ] `search_tenant_members` trả về phân trang, filter, sort đúng.
- [ ] `invite-member` tìm user bằng email query, không dùng `listUsers(perPage: 1000)`.
- [ ] Mời user chưa tồn tại: tạo user + gửi link set password.
- [ ] Mời user đã là member: báo lỗi rõ ràng.
- [ ] Email provider lỗi: vẫn tạo user, báo admin tự set password.
- [ ] Không thể xóa owner.
- [ ] Không thể đổi role/xóa làm tenant mất hết admin.
- [ ] `tenant_memberships` có `status`, `is_active`, `invited_at`, `accepted_at`.
- [ ] Trigger cập nhật `status = 'active'` khi user lần đầu sign in.

### Frontend
- [ ] Tab Thành viên dùng `<DataGrid>` với search, filter role/status/active, sort, pagination, density.
- [ ] Mobile view dùng card.
- [ ] Bulk invite tối đa 50 email, có preview kết quả.
- [ ] Modal xác nhận khi đổi role, xóa, bulk actions.
- [ ] Detail drawer hiển thị `last_sign_in_at`, `confirmed_at`, trạng thái.
- [ ] Reset password không hiển thị link trong toast.
- [ ] Tenant admin có menu quản lý thành viên trong shop (VIP only).
- [ ] Gói free không thấy menu, redirect hoặc hiện upsell.

### Tests
- [ ] Unit test search pagination.
- [ ] Unit test bảo vệ owner/admin duy nhất.
- [ ] Unit test bulk invite vượt quota, email trùng.
- [ ] Unit test tìm user ngoài 1000 (mock).
- [ ] Smoke test UI DataGrid render, filter, sort.

## Ghi chú kỹ thuật

- Tái sử dụng `components/DataGrid.tsx` đã có sẵn — không viết lại bảng.
- Migration phải backward-compatible: thêm cột với default value, cập nhật dữ liệu cũ.
- `status` và `is_active` có thể gây confusion. Gợi ý: `status` dùng cho invitation lifecycle, `is_active` dùng cho khóa mềm tài khoản. Nếu muốn rút gọn, có thể dùng `status` với các giá trị `pending`, `active`, `inactive`, `revoked`.
- Khi inactive một member, cần đảm bảo RLS ở các bảng khác (nếu có) không cho phép inactive user thao tác. Hiện tại RLS chủ yếu dựa trên `tenant_memberships` tồn tại, chưa kiểm tra `is_active`. Cân nhắc cập nhật các policies nếu cần.

## Các câu hỏi đã giải quyết

- Quyền: cả super admin + tenant admin, VIP only.
- Status invitation: làm đầy đủ.
- Active/inactive: hiển thị + khóa mềm.
- Bulk invite: 50 email/lần.
- Tách component: có.
- Xử lý lỗi invite: đã mô tả ở trên.
- Bảo vệ owner: có.

## Hướng dẫn bàn giao cho chat tiếp theo

1. Đọc lại file này và xác nhận scope.
2. Bắt đầu từ Phase 1 (DB + sửa edge functions) trước khi đụng UI.
3. Sau khi backend ổn, làm component `MemberManagement`, rồi tích hợp vào 2 màn hình.
4. Chạy `npm run lint`, `npm run build`, `npx vitest run` trước khi commit.
5. Cập nhật file này khi hoàn thành các phase.
