# SP-5.7: Storage Management Panel

**Status:** Completed (not pushed)
**Branch:** `feat/SP-5.7-storage-management`
**Timestamp:** 2026-07-13 07:44:38

## Summary

Triển khai panel quản lý Storage buckets trong admin dashboard: liệt kê buckets qua Supabase Storage API, hiển thị usage (số file + tổng bytes), và cấu hình lifecycle (số ngày giữ log + tùy chọn tự động xóa bucket rỗng) lưu trong `system_settings`.

## Changes

- `services/admin/storageAdminService.ts` — thêm `getBuckets()`, `getBucketUsage()`, `getBucketLifecycle()`, `setBucketLifecycle()`.
- `components/admin/StorageManagementPanel.tsx` — UI liệt kê buckets, usage bar, form lifecycle cho từng bucket.
- `pages/admin/StorageManagementPage.tsx` — wrapper page cho route `/admin/settings/storage`.
- `App.tsx` — thêm route `/admin/settings/storage`.
- `tests/mocks/supabase.ts` — mở rộng mock Supabase Storage với `listBuckets()` và `from(bucket).list()`, thêm helpers `addStorageBucket()`, `addStorageFile()`, `resetStorageBuckets()`.
- `tests/admin-dashboard/storageAdminService.test.ts` — 4 tests cho service.
- `tests/admin-dashboard/StorageManagementPanel.test.tsx` — 3 tests cho UI.

## Verification

1. Backup project to `C:\Users\SUACAUBA\Downloads\Project\Back up Admin dashboard step\SP-5.7-20260713_073524`.
2. `npm run lint` passes (`tsc --noEmit`).
3. `npx vitest run` passes toàn bộ suite (97 files, 528 tests).
4. Independent code review passed with `[verified]` prefix.

## Artifacts

### Code
- `services/admin/storageAdminService.ts`
- `components/admin/StorageManagementPanel.tsx`
- `pages/admin/StorageManagementPage.tsx`
- `App.tsx`
- `tests/mocks/supabase.ts`
- `tests/admin-dashboard/storageAdminService.test.ts`
- `tests/admin-dashboard/StorageManagementPanel.test.tsx`

### Edge Functions
- Không có Edge Function mới trong phase này. Service dùng trực tiếp Supabase Storage JS client.

### Migrations
- Không có migration schema mới trong phase này. Lifecycle config lưu trong bảng `system_settings` đã tồn tại.

## Deployment checklist (not executed)

- [ ] Push branch `feat/SP-5.7-storage-management` to remote.
- [ ] Run Vercel preview smoke test cho route `/admin/settings/storage`.
- [ ] Run production smoke test.

## Unpushed work

This phase is **not pushed** yet. Commit `47f9b44` is pending in `feat/SP-5.7-storage-management`.

## Uncommitted migrations / edge functions from other phases still in working tree

The working tree still contains uncommitted changes from previous phases, including but not limited to:
- `supabase/migrations/20260724000000_sp4_4_webhook_delivery_hardening.sql`
- `supabase/functions/_shared/webhookDelivery.ts`
- `supabase/functions/webhook-delivery/index.ts`
- `Plan/EdgeFunction/webhook-delivery.ts`
- `Plan/EdgeFunction/db-maintenance.ts`
- `Plan/Migration/20250713000022_phase3_subscription_lifecycle_rpc.sql`
- `Plan/Migration/20260720000000_sp2_6_global_config_rpc.sql`
- `Plan/Migration/20260728000000_sp5_6_db_maintenance.sql`

Those are not part of this SP-5.7 commit and remain uncommitted/unpushed.

## Notes

- `getBucketUsage()` dùng `supabase.storage.from(bucketId).list('', { limit: 1000 })`; nếu bucket có hơn 1000 objects cần phân trang hoặc chuyển aggregation sang edge function.
- Progress bar hiện tại chỉ báo hiệu binary (có dữ liệu / không có dữ liệu) vì chưa có quota/limit per bucket. Khi có quota, thay width 100% bằng tính toán thực tế.
- Lifecycle config được merge theo bucket_id trong một row `storage_lifecycle` duy nhất của `system_settings` để tránh ghi đè config giữa các bucket.
