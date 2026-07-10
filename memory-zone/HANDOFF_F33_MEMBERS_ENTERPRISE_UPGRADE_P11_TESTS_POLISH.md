# HANDOFF F33 — P11: Tests & UX polish

Master: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE.md`  
Index: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_INDEX.md`

## Scope

Viết tests, sửa UX còn lại, đảm bảo a11y.

## Files tạo mới

- `tests/smoke/member-management-enterprise.test.ts`
- `tests/integration/member-invite-flow.test.ts` (optional)

## Files sửa

- `tests/smoke/admin-dashboard-p3-member-management.test.ts`
- `pages/SystemAdminDashboard.tsx` (nếu cần sửa toast reset password)
- `components/MemberManagement.tsx` và sub-components (loading/error states, responsive)

## Yêu cầu

1. Cập nhật `admin-dashboard-p3-member-management.test.ts`:
   - Sử dụng `searchTenantMembers` thay vì `getTenantMembersWithEmail` (hoặc giữ cả hai).
   - Test bảo vệ owner/last admin (mock DB trigger bằng cách throw nếu xóa owner).
   - Test bulk invite vượt quota.
2. `member-management-enterprise.test.ts`:
   - Test `searchTenantMembers` filter/sort.
   - Test `toggleMemberActive`.
   - Test `resendMemberInvite` chỉ cho pending.
3. UX polish:
   - `handleResetPassword` không hiển thị link trong toast; chỉ báo "Đã gửi email đặt lại mật khẩu".
   - Bulk invite kết thúc hiển thị summary.
   - Loading skeleton cho detail drawer.
   - Responsive DataGrid cards.
   - Focus trap trong modal, `aria-label` cho icon buttons.

## Tiêu chí chấp nhận

- [ ] Tests chạy pass.
- [ ] Reset password không lộ link.
- [ ] Bulk invite summary hiển thị.
- [ ] Responsive + a11y cơ bản.

## Verify

```bash
npm run lint
npm run build
npx vitest run
```

## Next

Kết thúc F33. Cập nhật `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE.md` và index.
