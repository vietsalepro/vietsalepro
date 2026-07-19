# SP-2.7: Build User Management Page

## Thông tin chung

- **Sub-phase:** SP-2.7
- **Tên:** Build User Management page
- **Ngày thực hiện:** 2026-07-12
- **Branch:** feat/SP-2.7-user-management
- **Commit:** 59079719 `[verified] feat(admin): SP-2.7 user management page`
- **Trạng thái:** Hoàn thành

## Nội dung thực hiện

1. Backup toàn bộ project vào `C:\Users\SUACAUBA\Downloads\Project\Back up Admin dashboard step\SP-2.7-20260712_151914`.
2. Tạo migration `supabase/migrations/20260721000000_sp2_7_user_management_rpc.sql` với các RPC:
   - `get_users(p_search, p_status, p_page, p_page_size)` — system admin only, hỗ trợ search email, filter status, phân trang.
   - `update_user_status(p_user_id, p_status)` — system admin only, cập nhật `auth.users.raw_app_meta_data.disabled`, từ chối vô hiệu hóa system admin, ghi audit log.
3. Tạo `services/admin/userAdminService.ts` với `getUsers` và `updateUserStatus`.
4. Tạo `components/admin/UserManagementPanel.tsx` — bảng users, search, filter status, phân trang, nút toggle status.
5. Tạo `pages/admin/UsersPage.tsx` làm wrapper cho panel.
6. Cập nhật `App.tsx` thêm route `/admin/users`.
7. Cập nhật `pages/admin/AdminLayout.tsx` thêm mục "Người dùng" trong sidebar.
8. Viết test TDD:
   - `tests/admin-dashboard/UsersPage.test.tsx`
   - `tests/admin-dashboard/UserManagementPanel.test.tsx`
9. Cập nhật `docs/admin-dashboard/RPC_CONTRACTS.md` thêm `get_users` và `update_user_status`.

## Các file thay đổi

- `App.tsx`
- `pages/admin/AdminLayout.tsx`
- `pages/admin/UsersPage.tsx`
- `components/admin/UserManagementPanel.tsx`
- `services/admin/userAdminService.ts`
- `supabase/migrations/20260721000000_sp2_7_user_management_rpc.sql`
- `Plan/Migration/20260721000000_sp2_7_user_management_rpc.sql`
- `tests/admin-dashboard/UsersPage.test.tsx`
- `tests/admin-dashboard/UserManagementPanel.test.tsx`
- `docs/admin-dashboard/RPC_CONTRACTS.md`

## Migration / Edge Function sinh ra

- **Migration:** `supabase/migrations/20260721000000_sp2_7_user_management_rpc.sql`
  - Copy trong `Plan/Migration/20260721000000_sp2_7_user_management_rpc.sql`
- **Edge Function:** Không có

## Push & deploy

- **Đã push commit:** Chưa
- **Đã push migration:** Chưa
- Lý do: migration và code mới cần được review/approve trước khi push lên remote. Chưa thực hiện `git push origin feat/SP-2.7-user-management`.

## Kiểm thử & quality gates

- `npm run lint`: PASS
- `npx vitest run`: 71 test files, 371 tests PASS
- `npm run build`: PASS
- `npm run audit:rpc`: PASS (131/131 RPCs in sync)
- Independent code review subagent: PASS (no security concerns or logic errors)

## Ghi chú

- Các file migration của SP-2.6 (`Plan/Migration/20260720000000_sp2_6_global_config_rpc.sql`) và log SP-2.5 (`Plan/Log/SP-2.5-20260712_144800.md`) vẫn đang untracked trên working tree; chúng không thuộc phạm vi SP-2.7 và chưa được đưa vào commit này.
- File `.commit-msg.txt` đang ở trạng thái deleted (diff từ trước SP-2.7), không đưa vào commit SP-2.7.
