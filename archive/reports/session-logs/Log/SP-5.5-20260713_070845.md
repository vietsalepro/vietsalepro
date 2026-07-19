# SP-5.5: Restore Workflow

**Status:** Completed (not pushed)
**Branch:** `feat/SP-5.5-restore-workflow`
**Timestamp:** 2026-07-13 07:08:45

## Summary

Triển khai restore workflow cho admin dashboard: chọn snapshot từ automated backups, xem trước danh sách bảng, xác nhận RESTORE, và gọi Edge Function `tenant-restore` để phục hồi dữ liệu tenant. Có validate snapshot (tenant_id UUID, storage_path thuộc về tenant, chống path traversal, trạng thái success) và guard destructive action.

## Changes

- `services/tenantRestoreService.ts` — thêm `restoreTenantFromSnapshot`, `previewTenantSnapshot`; refactor `restoreTenantBackup` để dùng chung `readBackupText` + `invokeTenantRestore`; thêm `assertValidSnapshot` với path validation.
- `components/admin/RestorePanel.tsx` — panel liệt kê snapshot, chọn, preview tables, checkbox xác nhận, input `RESTORE`, và nút restore; hiển thị kết quả/lỗi.
- `pages/admin/RestorePage.tsx` — page wrapper cho panel.
- `App.tsx` — lazy import `AdminRestore` và route `/admin/restore`.
- `pages/admin/AdminLayout.tsx` — thêm mục "Restore" trong sidebar Operations, route map, page title.
- `tests/mocks/supabase.ts` — thêm `setStorageFile`, `clearStorageFiles`, và `storage.from('backups').download()` mock.
- `tests/admin-dashboard/tenantRestoreService.test.ts` — 6 tests cho validate, file restore, snapshot restore, non-success/invalid snapshot.
- `tests/admin-dashboard/RestorePanel.test.tsx` — 2 tests (render list + preview/restore flow).
- `tests/admin-dashboard/RestorePage.test.tsx` — 1 test cho page wrapper.
- `tests/admin-dashboard/AdminLayout.test.ts` — thêm test map `/admin/restore` -> `restore`.

## Verification

1. Backup project to `C:\Users\SUACAUBA\Downloads\Project\Back up Admin dashboard step\SP-5.5-20260713_065806`.
2. `npm run lint` passes (`tsc --noEmit`).
3. `npx vitest run` passes: 94 test files, 511 tests.
4. `npm run build` passes.
5. Independent code review passed with `[verified]` prefix.
6. `npm run audit:rpc` reports 4 pre-existing RPC contract mismatches (`cancel_subscription`, `create_subscription`, `downgrade_subscription`, `upgrade_subscription` in `services/admin/billingAdminService.ts`) unrelated to this change.

## Artifacts

### Code
- `services/tenantRestoreService.ts`
- `components/admin/RestorePanel.tsx`
- `pages/admin/RestorePage.tsx`
- `App.tsx`
- `pages/admin/AdminLayout.tsx`
- `tests/mocks/supabase.ts`
- `tests/admin-dashboard/tenantRestoreService.test.ts`
- `tests/admin-dashboard/RestorePanel.test.tsx`
- `tests/admin-dashboard/RestorePage.test.tsx`
- `tests/admin-dashboard/AdminLayout.test.ts`

### Edge Functions
- Không có edge function mới trong phase này (tái sử dụng `supabase/functions/tenant-restore/index.ts` đã có).

### Migrations
- Không có migration mới trong phase này.

## Deployment checklist (not executed)

- [ ] Push branch `feat/SP-5.5-restore-workflow` to remote.
- [ ] Run Vercel preview smoke test for `/admin/restore` route.
- [ ] Run production smoke test.

## Unpushed work

This phase is **not pushed** yet. Commit `960189b` is pending in `feat/SP-5.5-restore-workflow`.

## Uncommitted migrations / edge functions from other phases still in working tree

The working tree still contains uncommitted changes from previous phases (e.g., SP-4.4 webhook delivery hardening in `supabase/migrations/20260724000000_sp4_4_webhook_delivery_hardening.sql` and related files). Those are not part of this SP-5.5 commit.

## Notes

- `assertValidSnapshot` yêu cầu `storagePath` bắt đầu bằng `automated/<tenant_id>/` và từ chối `..`, `\` để tránh path traversal.
- Chỉ snapshot có `status === 'success'` mới được restore; snapshot `running`/`failed` bị loại ở UI và service.
- Restore là thao tác destructive; UI yêu cầu checkbox xác nhận + nhập chính xác `RESTORE`.
