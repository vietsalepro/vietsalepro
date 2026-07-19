# HANDOFF F33 — P7: MemberManagement container + DataGrid

Master: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE.md`  
Index: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_INDEX.md`

## Scope

Tạo component `MemberManagement` quản lý state và dùng `DataGrid`.

## Files tạo mới

- `components/MemberManagement.tsx`

## Files tham khảo

- `components/DataGrid.tsx` (xem props: columns, toolbar, pagination, sort, selected rows).
- `pages/SystemAdminDashboard.tsx` dòng 1854-1978 (màn hình cũ để biết columns/actions).

## Props

```ts
interface MemberManagementProps {
  tenantId?: string;
  isTenantAdmin?: boolean;
}
```

## Yêu cầu

1. State: `search`, `roleFilter`, `statusFilter`, `activeFilter`, `page`, `pageSize`, `sortBy`, `sortDir`, `selectedIds`, `loading`, `error`.
2. Dùng `useEffect` gọi `tenantService.searchTenantMembers` khi filters/page/sort thay đổi.
3. Nếu `tenantId` undefined (super admin chưa chọn), hiển thị placeholder chọn shop.
4. Toolbar DataGrid:
   - Search email.
   - Filter role (select all/admin/cashier/inventory_manager/accountant).
   - Filter status (pending/active/inactive).
   - Filter active (yes/no).
   - Nút "Mời thành viên" mở `MemberInviteModal`.
5. Columns:
   - select checkbox,
   - email,
   - role (badge),
   - status (badge),
   - isActive (toggle/icon),
   - invitedBy,
   - invitedAt,
   - lastSignInAt,
   - actions (detail drawer, reset password, remove).
6. Pagination 10/20/50/100.
7. Sort: email, role, status, created_at.
8. Mobile card view: dùng `DataGrid` prop `mobileCardRender` nếu có; nếu không, dùng CSS responsive.

## Tiêu chí chấp nhận

- [ ] Component render `DataGrid` với search/filter/sort/pagination.
- [ ] Gọi `searchTenantMembers` đúng params.
- [ ] Chưa chọn shop thì hiện placeholder.
- [ ] Mobile view hoạt động.

## Verify

```bash
npm run lint
npm run build
```

## Next

`memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P8_SUBCOMPONENTS.md`
