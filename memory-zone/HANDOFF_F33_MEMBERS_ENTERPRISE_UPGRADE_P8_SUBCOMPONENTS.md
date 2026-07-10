# HANDOFF F33 — P8: Member sub-components

Master: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE.md`  
Index: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_INDEX.md`

## Scope

Tạo 3 component con trong `components/MemberManagement/`.

## Files tạo mới

- `components/MemberManagement/MemberInviteModal.tsx`
- `components/MemberManagement/MemberBulkActions.tsx`
- `components/MemberManagement/MemberDetailDrawer.tsx`

## Files tham khảo

- `components/DataGrid.tsx` (xem cách dùng selected rows).
- `services/tenantService.ts` (P6 đã tạo `bulkInviteMembers`, `toggleMemberActive`, `resendMemberInvite`, `updateMemberRole`, `removeMember`).

## MemberInviteModal

- Textarea paste nhiều email (tối đa 50).
- Parse bởi `,`, `;`, newline, space.
- Validate email, dedupe.
- Kiểm tra quota: `currentCount + newEmails.length <= maxUsers`.
- Preview: success / already member / error / email provider not configured.
- Chọn role mặc định.
- Gọi `tenantService.bulkInviteMembers`.

## MemberBulkActions

- Props: `selectedMembers`, `onAction`, `disabled`.
- Actions: "Đổi vai trò", "Kích hoạt", "Khóa", "Xóa".
- Modal xác nhận trước khi thực hiện.
- Kiểm tra nếu selection chứa owner thì disable "Xóa" và "Đổi vai trò".
- Gọi `tenantService.updateMemberRole`, `toggleMemberActive`, `removeMember`.

## MemberDetailDrawer

- Props: `member`, `onClose`, `tenantId`.
- Hiển thị: email, role, status, invitedBy, invitedAt, acceptedAt, lastSignInAt, confirmedAt, isActive.
- Actions: resend invite (pending only), reset password, toggle active, change role, remove.
- Xác nhận trước destructive actions.

## Tiêu chí chấp nhận

- [ ] 3 component tạo đúng path.
- [ ] `MemberInviteModal` giới hạn 50 email, parse đúng, preview đúng.
- [ ] `BulkActions` có xác nhận và bảo vệ owner.
- [ ] `DetailDrawer` hiển thị đầy đủ thông tin enterprise.

## Verify

```bash
npm run lint
npm run build
```

## Next

`memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P9_SYSTEM_ADMIN_INTEGRATION.md`
