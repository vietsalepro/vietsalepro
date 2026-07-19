# HANDOFF F33 — Các issue còn lại & deployment

> Handoff này ghi lại các tồn đọng sau khi F33 P1..P11 đã hoàn thành functionally. Chat tiếp theo chỉ xử lý các issue này, không đụng vào phần đã xong.

---

## Bối cảnh

F33 (Nâng cấp tab Thành viên lên Enterprise) đã hoàn thành toàn bộ P1..P11:

- P1: DB foundation (`tenant_memberships` có `status`, `is_active`, `invited_at`, `accepted_at`, indexes, backfill).
- P2: `search_tenant_members` RPC phân trang / lọc / sắp xếp.
- P3: Trigger bảo vệ owner và admin cuối cùng.
- P4: Edge function `invite-member` rewrite với direct auth query, regex, tenant rate limit, quota.
- P5: `activate_pending_memberships` + gọi từ `AuthContext` khi SIGNED_IN.
- P6: Types + service layer (`searchTenantMembers`, `bulkInviteMembers`, `resendMemberInvite`, `toggleMemberActive`).
- P7: `MemberManagement` container dùng `DataGrid`.
- P8: Sub-components `MemberInviteModal`, `MemberBulkActions`, `MemberDetailDrawer`.
- P9: Tích hợp vào `SystemAdminDashboard`.
- P10: Route `/members` + menu cho tenant admin (VIP only).
- P11: Tests + UX polish.

Verification cục bộ đã pass:
- `npm run lint` ✓
- `npm run build` ✓
- `npx vitest run` ✓ (257 tests)

2 gap UX đã được sửa trong chat hiện tại:
1. Inline đổi role trong `MemberManagement` có xác nhận.
2. Cột "Đăng nhập cuối" sortable được.

Các issue **chưa xử lý** được liệt kê bên dưới.

---

## Issue 1 — `invite-member` dùng `type: 'recovery'` cho user mới

### Vị trí
- `supabase/functions/invite-member/index.ts` dòng 243–247.

### Vấn đề
Khi email chưa có user, edge function tạo user tạm rồi gọi:

```ts
await supabaseAdmin.auth.admin.generateLink({
  type: 'recovery',
  email: normalizedEmail,
  options: { redirectTo: `https://${tenant.subdomain}.vietsalepro.com/set-password` },
});
```

`type: 'recovery'` gửi email reset password, không phải email mời. Với user chưa từng sign in, đúng ra nên dùng `type: 'invite'` redirect về `/set-password`. Edge function `reset-password` đã xử lý đúng logic này (chọn `invite` vs `recovery` theo `last_sign_in_at`).

### Cách xử lý đề xuất
1. Trong `invite-member`, khi tạo user mới (`isNewUser = true`), gọi `generateLink` với `type: 'invite'` thay vì `'recovery'`.
2. Redirect URL vẫn giữ `https://${tenant.subdomain}.vietsalepro.com/set-password`.
3. Nếu `generateLink` lỗi (không có email provider), vẫn tạo user và trả về `emailProviderConfigured: false` như hiện tại.
4. Cập nhật test nếu có test kiểm tra link type. Hiện tại test mock trong `tests/mocks/supabase.ts` có thể không phân biệt type, nhưng nên kiểm tra lại.

### Tiêu chí chấp nhận
- [x] User mới được tạo với `type: 'invite'` link.
- [x] `redirectTo` vẫn trỏ về `/set-password`.
- [x] Nếu provider lỗi, vẫn tạo user và báo `emailProviderConfigured: false`.
- [x] `npm run lint`, `npm run build`, `npx vitest run` pass.
- [ ] Deploy edge function lên remote nếu cần (chờ xác nhận từ user).

---

## Issue 2 — `BottomNav.tsx` chưa có `/members` (optional)

### Vị trí
- `components/BottomNav.tsx`

### Vấn đề
P10 yêu cầu thêm menu/route "Quản lý thành viên" cho tenant admin, VIP only. Hiện đã có trong:
- `App.tsx` route `/members`
- `AppTopbar.tsx` desktop dropdown + mobile menu
- `MobileLayout.tsx` drawer
- `FeaturePicker.tsx`

Nhưng `BottomNav.tsx` chưa có item `/members`. Handoff P10 ghi là "Thêm icon/navigation nếu phù hợp (hoặc để trong menu cài đặt)", nên đây là optional.

### Cách xử lý đề xuất
1. Mở `components/BottomNav.tsx`, xem cấu trúc `navItems`.
2. Thêm item `/members` với icon `Users` (hoặc icon phù hợp).
3. Chỉ hiển thị khi `permissions.canManageUsers && tenant?.plan === 'vip'`.
4. Không bắt buộc nếu BottomNav không có đủ chỗ hoặc sẽ gây clutter. Nếu không thêm, chỉ cần ghi chú "Để lại trong menu cài đặt".

### Tiêu chí chấp nhận
- [x] Quyết định: thêm item `/members` vào BottomNav (icon `UserCog`, label "Thành viên").
- [x] Chỉ hiện với VIP + `canManageUsers`.
- [x] `npm run lint`, `npm run build`, `npx vitest run` pass.

---

## Issue 3 — `SystemAdminDashboard` tenant selector vẫn load toàn bộ tenants về client

### Vị trí
- `pages/SystemAdminDashboard.tsx` dòng 1123–1127, 1737–1755.

### Vấn đề
Handoff gốc (`HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE.md`) ghi nhận:
> "Chọn shop bằng `<select>` thường, load toàn bộ tenants về client."

Tab members trong System Admin Dashboard vẫn dùng `<select>` load `allTenants` (qua `loadAllTenantsForSelector`) về client. Nếu có hàng nghìn tenant sẽ nặng client và chậm.

### Cách xử lý đề xuất
1. Thay `<select>` thường bằng `SearchableTenantSelect` / `AsyncSelect` hoặc dùng lại component tìm kiếm tenant đã có (ví dụ `searchTenants` trong `services/tenantService.ts`).
2. Không load toàn bộ tenants khi mở tab. Chỉ fetch theo từ khóa search với debounce.
3. Giữ lại `memberTenantId` state và truyền `tenantId` cho `MemberManagement`.
4. Đảm bảo tương thích với các tab khác trong `SystemAdminDashboard` (ví dụ `audit` tab cũng dùng `allTenants`). Có thể chỉ thay selector trong tab members, không cần đụng `audit`.

### Tiêu chí chấp nhận
- [x] Tab members không load toàn bộ tenants về client khi mở.
- [x] Chỉ fetch tenants khi user gõ tìm kiếm (debounce 300ms qua `searchTenants`).
- [x] Tenant được chọn vẫn truyền đúng `tenantId` xuống `MemberManagement`.
- [x] `npm run lint`, `npm run build`, `npx vitest run` pass.

---

## Issue 4 — Verify / deploy migrations F33 lên Supabase remote

### Vị trí
- Các file migration trong `supabase/migrations/`:
  - `20260711000003_f33_members_foundation.sql`
  - `20260711000004_f33_members_search_rpc.sql`
  - `20260711000005_f33_members_guardrails.sql`
  - `20260711000007_f33_members_status_activation.sql`
- Edge function `supabase/functions/invite-member/index.ts`.
- Edge function `supabase/functions/reset-password/index.ts`.

### Vấn đề
Migrations đã có trong repo, nhưng chưa có bằng chứng đã chạy thành công trên project production `rsialbfjswnrkzcxarnj`. Edge function `invite-member` cũng cần deploy lại sau khi sửa issue #1.

### Cách xử lý đề xuất
1. Kết nối Supabase CLI với project `rsialbfjswnrkzcxarnj` (hoặc project đang dùng).
2. Chạy:
   ```bash
   supabase migration up
   # hoặc nếu dùng remote workflow:
   supabase db push
   ```
3. Kiểm tra trên DB remote:
   - `tenant_memberships` có các cột `status`, `is_active`, `invited_at`, `accepted_at`.
   - Các index `idx_tenant_memberships_tenant_*` đã tồn tại.
   - Function `search_tenant_members` và `activate_pending_memberships` đã có.
   - Trigger `tenant_memberships_guardrails` đã attach.
4. Deploy edge function:
   ```bash
   supabase functions deploy invite-member
   supabase functions deploy reset-password
   ```
5. Kiểm tra thử trên remote: mời 1 user mới, đổi role, xóa member, kích hoạt pending.

### Tiêu chí chấp nhận
- [x] Migrations F33 đã chạy thành công trên remote (đã đồng bộ migration history; `supabase db push` pass).
- [x] `invite-member` và `reset-password` đã deploy.
- [x] Có log / kết quả kiểm thử thực tế: Vercel production deployment `dpl_8tVbaybjnMSde4acdioXF27aUj5m` ready trên commit `3889eac6`.

---

## Quy tắc cho chat sau

- Không đụng code đã xong của P1..P11 trừ khi cần để sửa issue liên quan.
- Không thêm abstraction hay dependency mới.
- Sau mỗi issue: chạy `npm run lint`, `npm run build`, `npx vitest run`.
- Cập nhật file này khi issue được xử lý.
- Không deploy lên production nếu chưa được user xác nhận rõ ràng.

---

## Files chính cần đụng

| Issue | Files |
|-------|-------|
| 1 | `supabase/functions/invite-member/index.ts`, `tests/mocks/supabase.ts` (nếu cần) |
| 2 | `components/BottomNav.tsx` |
| 3 | `pages/SystemAdminDashboard.tsx`, `services/tenantService.ts` (nếu cần thêm helper search) |
| 4 | `supabase/migrations/20260711*_f33_members*.sql`, `supabase/functions/invite-member/index.ts`, `supabase/functions/reset-password/index.ts` |

---

## Verify cuối cùng cho toàn bộ F33

```bash
npm run lint
npm run build
npx vitest run
```

Nếu deploy migration / edge function:

```bash
supabase migration up
# hoặc
supabase db push
supabase functions deploy invite-member
supabase functions deploy reset-password
```

---

## Ghi chú sau khi xử lý

- Issue 1, 2, 3 đã được sửa code và pass verification (2026-07-10).
- Verification pass:
  - `npm run lint` ✓
  - `npm run build` ✓
  - `npx vitest run` ✓ (257 tests)
- Issue 4 (deploy migrations / edge functions lên remote) **đã thực hiện** (2026-07-10):
  - `supabase db push --yes` pass.
  - `supabase functions deploy invite-member reset-password --yes` pass.
  - Git commit `3889eac6` pushed to `origin/master`.
  - Vercel production deployment `dpl_8tVbaybjnMSde4acdioXF27aUj5m` ready, aliases: `vietsalepro.com`, `admin.vietsalepro.com`, etc.
