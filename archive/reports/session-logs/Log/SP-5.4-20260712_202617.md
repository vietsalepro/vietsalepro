# SP-5.4: Backup Automation

**Status:** Completed (not pushed)
**Branch:** `feat/SP-5.4-backup-automation`
**Timestamp:** 2026-07-12 20:26:17

## Summary

Triển khai backup tự động cho admin dashboard: scheduled job `automated_backup` trong `cron-admin-tasks` Edge Function, lưu JSON snapshot mỗi active tenant vào Supabase Storage bucket `backups`, theo dõi metadata trong `automated_backup_snapshots`, và cập nhật `StorageBackupPanel` để liệt kê snapshot + nút trigger thủ công.

## Changes

- `types/tenant.ts` — thêm `AutomatedBackupSnapshot` interface; mở rộng `CronJobName` thêm `automated_backup` (và cả `audit_cleanup` để align với Edge Function).
- `services/tenantBackupService.ts` — thêm `listAutomatedBackups()` và `triggerAutomatedBackup()`; validate UUID trong `downloadTenantBackup()`.
- `components/StorageBackupPanel.tsx` — thêm section "Backup tự động gần đây", bảng snapshot, nút "Chạy backup ngay".
- `supabase/functions/cron-admin-tasks/index.ts` — thêm job `automated_backup`: advisory-lock concurrency guard, export tenant tables, upload storage, ghi metadata, cleanup file khi update thất bại, giới hạn payload/size/pages.
- `supabase/migrations/20260725000000_sp5_4_backup_automation.sql` — tạo bucket `backups`, bảng `automated_backup_snapshots`, RLS/policies, mở rộng CHECK `cron_job_logs.job_name`, RPC `list_automated_backup_snapshots`, RPC `trigger_automated_backup`, SQL wrapper `run_admin_cron_automated_backup`, advisory lock helpers.
- `tests/mocks/supabase.ts` — thêm store `automated_backup_snapshots`, mock RPC `list_automated_backup_snapshots`, `trigger_automated_backup`.
- `tests/admin-dashboard/tenantBackupService.test.ts` — 2 tests cho service.
- `tests/admin-dashboard/StorageBackupPanel.test.tsx` — 3 tests cho panel (empty, list snapshot, trigger backup).

## Verification

1. Backup project to `C:\Users\SUACAUBA\Downloads\Project\Back up Admin dashboard step\SP-5.4-20260712_200613`.
2. `npm run lint` passes (`tsc --noEmit`).
3. `npx vitest run` passes: 91 test files, 503 tests.
4. `npm run build` passes.
5. Independent code review passed with `[verified]` prefix.
6. `npm run audit:rpc` reports 4 pre-existing RPC contract mismatches (`cancel_subscription`, `create_subscription`, `downgrade_subscription`, `upgrade_subscription` in `services/admin/billingAdminService.ts`) unrelated to this change. The two SP-5.4 RPCs (`list_automated_backup_snapshots`, `trigger_automated_backup`) were added to `docs/admin-dashboard/RPC_CONTRACTS.md`.

## Artifacts

### Code
- `types/tenant.ts`
- `services/tenantBackupService.ts`
- `components/StorageBackupPanel.tsx`
- `tests/mocks/supabase.ts`
- `tests/admin-dashboard/tenantBackupService.test.ts`
- `tests/admin-dashboard/StorageBackupPanel.test.tsx`
- `docs/admin-dashboard/RPC_CONTRACTS.md`

### Edge Functions
- `supabase/functions/cron-admin-tasks/index.ts` (modified to support `automated_backup` job)

### Migrations
- `supabase/migrations/20260725000000_sp5_4_backup_automation.sql`

## Deployment checklist (not executed)

- [ ] Push branch `feat/SP-5.4-backup-automation` to remote.
- [ ] Apply migration `20260725000000_sp5_4_backup_automation.sql` to staging.
- [ ] Deploy updated `cron-admin-tasks` Edge Function to staging.
- [ ] Run Vercel preview smoke test for `/admin/storage-backup` route.
- [ ] Apply migration + Edge Function to production.
- [ ] Run production smoke test.

## Unpushed work

This phase is **not pushed** yet. Commit `3211bb3` is pending in `feat/SP-5.4-backup-automation`.

## Uncommitted migrations / edge functions from other phases still in working tree

The working tree still contains uncommitted changes from previous phases (e.g., SP-4.4 webhook delivery hardening in `supabase/migrations/20260724000000_sp4_4_webhook_delivery_hardening.sql` and related files). Those are not part of this SP-5.4 commit.

## Notes

- Bucket `backups` được tạo private; chỉ `service_role` có quyền insert/select, `authenticated` chỉ đọc khi là system admin.
- Advisory lock `try_automated_backup_lock()` ngăn chạy trùng backup job; lock được release trong `finally`.
- Payload tối đa 200 MiB; bảng vượt 10.000 trang sẽ fail tenant đó.
