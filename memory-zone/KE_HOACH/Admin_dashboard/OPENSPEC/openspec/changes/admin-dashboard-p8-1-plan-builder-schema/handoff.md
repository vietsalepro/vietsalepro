## What Was Done

- Tạo migration `supabase/migrations/20250706000011_phase_p8_1_plan_builder_schema.sql`:
  - Bảng `plans` với limits, giá, trạng thái; RLS chỉ system admin.
  - Migrate giới hạn Free/VIP từ `system_settings` sang `plans`.
  - Thay CHECK `plan IN ('free','vip')` trên `tenants` bằng FK đến `plans(key)`.
  - CRUD RPC: `get_plans`, `get_plan_by_key`, `create_plan`, `update_plan`, `delete_plan`.
  - Cập nhật `get_default_plan_limits`, `set_default_plan_limits`, `create_tenant_with_admin`, `update_tenant`, `update_tenant_subscription` để đọc/validate từ `plans`.
  - Cập nhật `create_invoice`, `create_renewal_invoices` để lấy đơn giá từ `plans`.
- Thêm types `Plan`, `CreatePlanInput`, `UpdatePlanInput` trong `types/tenant.ts`.
- Thêm service `services/planService.ts` CRUD plans.
- Cập nhật mock test `tests/mocks/supabase.ts` để mô phỏng bảng `plans` và các RPC mới.
- Thêm smoke test `tests/smoke/admin-dashboard-p8-1-plan-builder-schema.test.ts` kiểm thử CRUD plan và migrate limits.
- Cập nhật smoke tests P7.2/P7.4 để tạo tenant VIP khi tạo hóa đơn (do giá hóa đơn giờ theo plan).

## What Was Verified

- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] `npx vitest run` pass (86 tests)
- [x] Smoke test P8.1 CRUD plan pass

## Next Phase

- P8.2 — Feature flags qua `tenants.settings` JSONB (nếu cần).
- Deploy migration `20250706000011_phase_p8_1_plan_builder_schema.sql` lên Supabase để áp dụng DB thật.

## Blockers / Decisions

- Migration SQL đã sẵn sàng nhưng chưa deploy lên Supabase production (cần user chạy `supabase migrations apply` hoặc thực thi SQL trong SQL Editor).

## Backup Location

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_p8_1_20260706_195019`
