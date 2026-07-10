# HANDOFF F33 — P10: Tenant admin navigation

Master: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE.md`  
Index: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_INDEX.md`

## Scope

Thêm route và menu "Quản lý thành viên" cho tenant admin, VIP only.

## Files sửa

- `App.tsx`
- `components/AppTopbar.tsx`
- `components/MobileLayout.tsx`
- `components/FeaturePicker.tsx`
- `components/BottomNav.tsx`

## Yêu cầu

1. `App.tsx`:
   - Thêm route trong `sharedRoutes`:
     ```tsx
     <Route path="/members" element={<MemberManagement isTenantAdmin />} />
     ```
   - Import `MemberManagement`.
2. `AppTopbar.tsx`:
   - Thêm menu item "Quản lý thành viên" `/members` trong desktop dropdown và mobile menu.
   - Chỉ hiển thị khi `permissions.canManageUsers && tenant?.plan === 'vip'`.
3. `MobileLayout.tsx`:
   - Thêm menu item trong drawer.
   - Điều kiện VIP + canManageUsers.
4. `FeaturePicker.tsx`:
   - Thêm `/members` vào `ALL_FEATURES`.
   - Điều kiện VIP + canManageUsers khi hiển thị picker.
5. `BottomNav.tsx`:
   - Thêm icon/navigation nếu phù hợp (hoặc để trong menu cài đặt).
   - VIP only.
6. Nếu free tenant truy cập `/members` trực tiếp: redirect về `/settings` hoặc hiện upsell.

## Files tham khảo

- `hooks/usePermissions.ts` (`canManageUsers`).
- `contexts/TenantContext.tsx` (`tenant.plan`).
- `components/AppTopbar.tsx` dòng 19-74 (menu arrays).
- `components/MobileLayout.tsx` dòng 22-40 (`menuItems`).
- `components/FeaturePicker.tsx` dòng 18-31 (`ALL_FEATURES`).
- `components/BottomNav.tsx` dòng 22-27 (`navItems`).
- `App.tsx` dòng 1356-1547 (`sharedRoutes`).

## Tiêu chí chấp nhận

- [x] Route `/members` hoạt động cho tenant admin.
- [x] Menu chỉ hiện với VIP + admin.
- [x] Free tenant không thấy menu và bị redirect/upsell nếu truy cập trực tiếp.

## Verify

```bash
npm run lint
npm run build
```

## Next

`memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P11_TESTS_POLISH.md`
