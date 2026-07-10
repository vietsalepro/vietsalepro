# HANDOFF F33 — P9: System Admin Dashboard integration

Master: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE.md`  
Index: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_INDEX.md`

## Scope

Thay thế tab Members trong `pages/SystemAdminDashboard.tsx` bằng `MemberManagement`.

## Files sửa

- `pages/SystemAdminDashboard.tsx`

## Files tham khảo

- `pages/SystemAdminDashboard.tsx` dòng 1854-1978 (block `activeTab === 'members'`).
- `components/MemberManagement.tsx` (P7).

## Yêu cầu

1. Import `MemberManagement`.
2. Thay thế toàn bộ block `activeTab === 'members'` (dòng 1854-1978) bằng:
   ```tsx
   {activeTab === 'members' && (
     <MemberManagement tenantId={memberTenantId} />
   )}
   ```
3. Giữ `memberTenantId` state và tenant selector ở trên (như cũ).
4. Xóa các state/handler không dùng nữa liên quan đến members nếu an toàn: `members`, `membersLoading`, `memberAction`, `inviteEmail`, `inviteRole`, `inviteSubmitting`, `handleInvite`, `handleRoleChange`, `handleResetPassword`, `handleRemoveMember`. **Cẩn thận** kiểm tra còn dùng ở đâu không.
5. Nếu `handleResetPassword` dùng ở chỗ khác, chỉ xóa phần members.

## Tiêu chí chấp nhận

- [ ] Tab Members hiển thị `MemberManagement`.
- [ ] Tenant selector vẫn hoạt động.
- [ ] Không còn dead code liên quan đến members trong file.

## Verify

```bash
npm run lint
npm run build
```

## Next

`memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P10_TENANT_ADMIN_NAVIGATION.md`
