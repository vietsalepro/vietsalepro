# HANDOFF F33 — P6: Frontend types & service layer

Master: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE.md`  
Index: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_INDEX.md`

## Scope

Cập nhật types và `tenantService` để dùng RPC mới và hỗ trợ bulk invite/resend/toggle.

## Files sửa

- `types/tenant.ts`
- `services/tenantService.ts`

## Yêu cầu

1. `types/tenant.ts`:
   - Extend `MemberWithEmail`:
     ```ts
     status?: 'pending' | 'active' | 'inactive';
     isActive?: boolean;
     invitedAt?: string;
     acceptedAt?: string;
     lastSignInAt?: string;
     confirmedAt?: string;
     ```
   - Thêm `SearchMembersParams` và `SearchMembersResult`.
2. `services/tenantService.ts`:
   - Cập nhật `mapMemberWithEmailFromDB` để map các cột mới.
   - Thêm `searchTenantMembers(params: SearchMembersParams)`.
   - Thêm `bulkInviteMembers(tenantId, emails[], role, maxConcurrency = 3)`:
     - Validate ≤ 50 email.
     - Deduplicate.
     - Gọi `inviteMemberByEmail` từng email (tuần tự hoặc giới hạn concurrency).
     - Trả về summary: `{ succeeded, failed, alreadyMember, emailProviderNotConfigured, errors }`.
   - Thêm `resendMemberInvite(tenantId, userId)`:
     - Chỉ cho phép nếu membership `status = 'pending'`.
     - Gọi `reset-password` edge function (type sẽ là `'invite'`).
   - Thêm `toggleMemberActive(tenantId, userId, isActive)`.
   - Giữ `updateMemberRole` và `removeMember` nhưng để DB trigger bảo vệ; xử lý lỗi trigger ở UI.

## Files tham khảo

- `types/tenant.ts` dòng 51-67 (`TenantMembership`, `MemberWithEmail`).
- `services/tenantService.ts` dòng 295-415 (membership functions).

## Tiêu chí chấp nhận

- [ ] Types mới đúng.
- [ ] `searchTenantMembers` gọi RPC `search_tenant_members`.
- [ ] `bulkInviteMembers` giới hạn 50 email, trả summary.
- [ ] `resendMemberInvite` chỉ resend `pending`.
- [ ] `toggleMemberActive` cập nhật `is_active`.

## Verify

```bash
npm run lint
npm run build
npx vitest run tests/smoke/admin-dashboard-p3-member-management.test.ts
```

## Next

`memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P7_DATAGRID_CONTAINER.md`
