# SP-5.3: Cron Monitor

**Status:** Completed (not pushed)
**Branch:** `feat/SP-5.3-cron-monitor`
**Timestamp:** 2026-07-12 20:02:42

## Summary

Triển khai màn hình Cron Monitor cho admin dashboard: hiển thị lịch sử chạy cron job (`cron_job_logs`) với trạng thái, thời gian chạy, retry count và chi tiết lỗi.

## Changes

- `services/admin/cronService.ts` — admin seam re-export `getCronLogs` từ `services/cronJobService.ts`.
- `components/admin/CronMonitorPanel.tsx` — panel hiển thị bảng cron logs, có nút làm mới, loading và error state.
- `pages/admin/CronMonitorPage.tsx` — page wrapper cho panel.
- `App.tsx` — thêm lazy import `AdminCronMonitor` và route `/admin/cron-jobs`.
- `pages/admin/AdminLayout.tsx` — thêm mục "Cron jobs" trong sidebar Operations, route map, page title, và sửa `getActiveId` để map `/admin/cron-jobs` -> `cronJobs`.
- `tests/mocks/supabase.ts` — thêm `cron_job_logs` store, seed data, `.limit()` support, và đưa `cron_job_logs` vào `adminOnlyTables`.
- `tests/admin-dashboard/cronService.test.ts` — 2 tests cho service.
- `tests/admin-dashboard/CronMonitorPanel.test.tsx` — 3 tests cho panel (render, refresh, error).
- `tests/admin-dashboard/CronMonitorPage.test.tsx` — 1 test cho page wrapper.
- `tests/admin-dashboard/AdminLayout.test.ts` — 3 tests cho route mapping.

## Verification

1. Backup project to `C:\Users\SUACAUBA\Downloads\Project\Back up Admin dashboard step\SP-5.3-20260712_194807`.
2. `npm run lint` passes (`tsc --noEmit`).
3. `npx vitest run` passes: 89 test files, 498 tests.
4. `npm run build` passes.
5. Independent code review passed with `[verified]` prefix.
6. `npm run audit:rpc` reports 4 pre-existing RPC contract mismatches (unrelated to this change).

## Artifacts

### Code
- `services/admin/cronService.ts`
- `components/admin/CronMonitorPanel.tsx`
- `pages/admin/CronMonitorPage.tsx`
- `App.tsx`
- `pages/admin/AdminLayout.tsx`
- `tests/mocks/supabase.ts`
- `tests/admin-dashboard/cronService.test.ts`
- `tests/admin-dashboard/CronMonitorPanel.test.tsx`
- `tests/admin-dashboard/CronMonitorPage.test.tsx`
- `tests/admin-dashboard/AdminLayout.test.ts`

### Edge Functions
- Không có edge function mới trong phase này.

### Migrations
- Không có migration mới trong phase này.

## Deployment checklist (not executed)

- [ ] Push branch `feat/SP-5.3-cron-monitor` to remote.
- [ ] Run Vercel preview smoke test for `/admin/cron-jobs` route.
- [ ] Run production smoke test.

## Unpushed work

This phase is **not pushed** yet. Commit `e024f83` is pending in `feat/SP-5.3-cron-monitor`.

## Uncommitted migrations / edge functions from other phases still in working tree

The working tree still contains uncommitted changes from previous phases (e.g., SP-4.4 webhook delivery, SP-5.2 queue monitor). Those are not part of this SP-5.3 commit.

## Notes

- `services/cronJobService.ts` đã tồn tại và query trực tiếp `cron_job_logs`. SP-5.3 chỉ thêm admin seam để panel import theo pattern nhất quán với `services/admin/queueService.ts`.
- `SystemHealthPanel.tsx` vẫn giữ phần hiển thị cron logs cũ; không sửa để tránh scope creep.
