# SP-3.1: Refactor Plans CRUD — Execution Log

> Thực hiện: 2026-07-12 16:25:20
> Branch: `feat/SP-3.1-plans-crud`
> Commit: `c3911fa0` (trên branch `feat/SP-3.1-plans-crud`)
> Trạng thái: **Hoàn thành, chưa push**

## Tóm tắt

Refactor Plans CRUD để hỗ trợ `features`, `seat_limit`, `usage_limits` theo yêu cầu SP-3.1.

## Thay đổi

- `types/tenant.ts`
  - Bổ sung `features`, `seatLimit`, `usageLimits` vào `Plan`, `CreatePlanInput`, `UpdatePlanInput`.
- `services/planService.ts`
  - Cập nhật `mapPlanFromDB` để ánh xạ các trường mới.
  - Cập nhật `createPlan`/`updatePlan` RPC params.
- `components/SubscriptionManager.tsx`
  - Hiển thị chi tiết plan đang chọn: ghế/người dùng, danh sách features, usage limits.
- `tests/mocks/supabase.ts`
  - Cập nhật seed plans và các RPC mock `get_plans`, `get_plan_by_key`, `create_plan`, `update_plan`.
- `tests/admin-dashboard/planService-features.test.ts`
  - Test suite TDD cho round-trip features/seatLimit/usageLimits.

## Migration

- `supabase/migrations/20260723000000_sp3_1_plans_crud_features.sql`
  - Thêm cột `features TEXT[] DEFAULT '{}'`, `seat_limit INTEGER`, `usage_limits JSONB DEFAULT '{}'` vào `public.plans`.
  - Backfill dữ liệu cũ: `seat_limit` mặc định bằng `max_users`.
  - Cập nhật RPC `get_plans`, `get_plan_by_key`, `create_plan`, `update_plan` để xử lý các trường mới.
- Copy migration: `Plan/Migration/20260723000000_sp3_1_plans_crud_features.sql`

## Edge Function

- Không sinh ra Edge Function trong phase này.

## Push / Deploy

- **Chưa push** commit lên remote.
- **Chưa deploy** migration lên staging/production.
- Sau khi user xác nhận, cần:
  1. `git push origin feat/SP-3.1-plans-crud`
  2. Chạy `supabase migration up` trên staging, sau đó production.
  3. Vercel auto-deploy branch preview sau khi push.

## Test & Verification

- `npx tsc --noEmit`: pass
- `npx vitest run`: 75 files, 385 tests passed
- `npm run build`: pass
- `npm run audit:rpc`: pass (138 RPCs in sync)
- Static security scan: no secrets / eval / shell injection / SQL injection patterns found.

## Backup

- Backup project: `C:\Users\SUACAUBA\Downloads\Project\Back up Admin dashboard step\SP-3.1-20260712_162322`

## Ghi chú

- Phase này không thay đổi subscription lifecycle (thuộc SP-3.2) và không tích hợp payment gateway (thuộc SP-3.3).
- Các file migration đã được copy vào `Plan/Migration/` nhưng chưa push.
