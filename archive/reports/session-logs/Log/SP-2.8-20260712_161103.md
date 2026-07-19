# SP-2.8: Build Team/Role Management Page

## Thông tin chung

- **Sub-phase:** SP-2.8
- **Tên:** Build Team/Role Management page
- **Ngày thực hiện:** 2026-07-12
- **Branch:** feat/SP-2.8-role-management
- **Commit:** aec810d `[verified] feat(admin): SP-2.8 team/role management page`
- **Trạng thái:** Hoàn thành

## Nội dung thực hiện

1. Backup toàn bộ project vào `C:\Users\SUACAUBA\Downloads\Project\Back up Admin dashboard step\SP-2.8-20260712_153159`.
2. Tạo migration `supabase/migrations/20260722000000_sp2_8_role_management_rpc.sql`:
   - Bảng `admin_roles` và `admin_role_assignments` với RLS chỉ cho system admin.
   - Index trên `admin_roles(name)`, `admin_role_assignments(user_id)`, `admin_role_assignments(role_id)`.
   - CHECK constraint `admin_roles_permissions_check` giới hạn permissions là các giá trị predefined.
   - Seed vai trò hệ thống `Quản trị viên` với toàn bộ quyền và `is_system = true`.
   - Các RPC: `get_admin_roles`, `create_admin_role`, `update_admin_role`, `delete_admin_role`, `get_users_with_admin_roles`, `assign_admin_role`, `remove_admin_role`.
   - Audit log có điều kiện (chỉ ghi khi thực sự insert/delete assignment), validation pagination (`p_page >= 1`, `0 < p_page_size <= 1000`).
3. Tạo `services/admin/roleAdminService.ts` với CRUD roles và gán/gỡ role cho user.
4. Mở rộng `services/admin/permissions.ts` thêm `AdminPermission` type và `ADMIN_PERMISSION_LABELS`.
5. Tạo `components/admin/RoleManagementPanel.tsx`:
   - Tab "Vai trò": bảng roles, tạo/sửa/xóa role với modal chọn permissions.
   - Tab "Người dùng": tìm user, xem roles hiện tại, gán thêm role hoặc gỡ role.
   - Vai trò hệ thống bị khóa sửa/xóa ở UI.
6. Tạo `pages/admin/RolesPage.tsx` wrapper.
7. Cập nhật `App.tsx` thêm route `/admin/roles`.
8. Cập nhật `pages/admin/AdminLayout.tsx` thêm mục "Vai trò" trong sidebar.
9. Viết test TDD:
   - `tests/admin-dashboard/RolesPage.test.tsx`
   - `tests/admin-dashboard/RoleManagementPanel.test.tsx` (7 tests: render, create, update, delete, system role disabled, assign role)
10. Cập nhật `docs/admin-dashboard/RPC_CONTRACTS.md` thêm các RPC mới.
11. Code review độc lập: PASS sau khi xử lý các feedback về audit log có điều kiện, validation pagination, và khóa sửa vai trò hệ thống.

## Các file thay đổi

- `App.tsx`
- `pages/admin/AdminLayout.tsx`
- `pages/admin/RolesPage.tsx`
- `components/admin/RoleManagementPanel.tsx`
- `services/admin/permissions.ts`
- `services/admin/roleAdminService.ts`
- `supabase/migrations/20260722000000_sp2_8_role_management_rpc.sql`
- `Plan/Migration/20260722000000_sp2_8_role_management_rpc.sql`
- `tests/admin-dashboard/RolesPage.test.tsx`
- `tests/admin-dashboard/RoleManagementPanel.test.tsx`
- `docs/admin-dashboard/RPC_CONTRACTS.md`

## Migration / Edge Function sinh ra

- **Migration:** `supabase/migrations/20260722000000_sp2_8_role_management_rpc.sql`
  - Copy trong `Plan/Migration/20260722000000_sp2_8_role_management_rpc.sql`
- **Edge Function:** Không có

## Push & deploy

- **Đã push commit:** Chưa
- **Đã push migration:** Chưa
- Lý do: migration và code mới cần được review/approve trước khi push lên remote. Chưa thực hiện `git push origin feat/SP-2.8-role-management`.

## Kiểm thử & quality gates

- `npm run lint`: PASS
- `npx vitest run`: 73 test files, 377 tests PASS
- `npm run build`: PASS
- `npm run audit:rpc`: PASS (138/138 RPCs in sync)
- Independent code review subagent: PASS (no security concerns or logic errors after fixes)

## Ghi chú

- Các file migration của SP-2.6 (`Plan/Migration/20260720000000_sp2_6_global_config_rpc.sql`) và log SP-2.5 (`Plan/Log/SP-2.5-20260712_144800.md`) vẫn đang untracked trên working tree; chúng không thuộc phạm vi SP-2.8 và chưa được đưa vào commit này.
- File `.commit-msg.txt` được giữ nguyên, không đưa vào commit SP-2.8.
