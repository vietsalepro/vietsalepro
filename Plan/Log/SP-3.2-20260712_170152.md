# SP-3.2 Execution Log — Subscription Lifecycle RPC

**Date:** 2026-07-12
**Branch:** feat/SP-3.2-subscription-lifecycle (current working branch)
**Commit:** 38fa8e45
**Status:** Completed, not pushed

---

## Scope

Triển khai RPC quản lý vòng đời subscription: tạo mới (`create_subscription`), nâng cấp (`upgrade_subscription`), hạ cấp (`downgrade_subscription`), hủy (`cancel_subscription`) và kết nối các service admin sử dụng các RPC này thay vì cập nhật trực tiếp `tenant_subscriptions`.

## Artifacts

### Code

- `services/admin/billingAdminService.ts` — thay thế `updateSubscriptionLifecycle` bằng các hàm `createSubscription`, `upgradeSubscription`, `downgradeSubscription`, `cancelSubscription`, `renewSubscription`; gọi RPC tương ứng, so sánh giá theo chu kỳ thanh toán (`month`/`year`), log audit khi tạo/hủy/gia hạn.
- `services/tenantService.ts` — export `mapSubscriptionFromDB` để tái sử dụng trong `billingAdminService`.
- `tests/test-helpers.ts` — nới lỏng kiểu `plan` của `createTestTenant` thành `string` để hỗ trợ plan tùy chỉnh trong test.
- `tests/admin-dashboard/Billing.test.tsx` — bổ sung `features`/`seatLimit`/`usageLimits` vào mock plans để `SubscriptionManager` không crash.

### Migration

- `supabase/migrations/20250713000022_phase3_subscription_lifecycle_rpc.sql`
  - `compute_billing_period_end(...)` helper.
  - `create_subscription(...)` upsert row, hỗ trợ trial.
  - `upgrade_subscription(...)` kiểm tra system admin, chu kỳ hợp lệ, gói mới cao hơn theo giá của chu kỳ đã chọn.
  - `downgrade_subscription(...)` kiểm tra system admin, chu kỳ hợp lệ, gói mới thấp hơn theo giá của chu kỳ đã chọn.
  - `cancel_subscription(...)` hỗ trợ hủy ngay lập tức (`p_immediate`).
  - `GRANT EXECUTE` cho `authenticated` và `service_role` trên các RPC.

- **Đã copy migration sang:** `Plan/Migration/20250713000022_phase3_subscription_lifecycle_rpc.sql`

### Edge Functions

- Không có Edge Function sinh ra trong phase này.
- **Chưa thực hiện push commit Edge Function** (vì không có Edge Function).

### Tests

- `tests/admin-dashboard/subscriptionLifecycle.test.ts` — 14 test TDD bao gồm:
  - Tạo subscription có trial (`trialing`) và không trial (`active`).
  - Nâng cấp/hạ cấp giữa `free` và `vip`.
  - Từ chối nâng cấp sai hướng/từ chối hạ cấp sai hướng.
  - `upgradeDowngradeSubscription` tự động chọn upgrade/downgrade.
  - Hủy subscription, hủy ngay lập tức.
  - Gia hạn (`renewSubscription`).
  - Từ chối plan không hợp lệ.
  - So sánh giá hiệu quả theo chu kỳ `month`/`year`.
  - Kiểm tra non-system-admin bị từ chối trên tất cả lifecycle RPCs.

## Backup

- Không có backup path được ghi nhận trong session này.

## Verification Commands

```bash
npm run lint              # tsc --noEmit, passed
npx vitest run            # 399 tests / 76 files, passed
npm run build             # production build, passed
supabase db reset --local # migrations applied successfully
```

## Pre-commit Review

- Static security scan: no hardcoded secrets, no eval/exec/pickle, no unsafe SQL concatenation, no shell injection.
- Independent reviewer subagent: passed after addressing billing-period-aware price comparison, RPC execute grants, and null-check suggestions.
- Self-review checklist: input validation inside RPCs, error handling on Supabase calls, no debug logs, tests present.

## Notes

- Phase này **chưa được push** lên remote; commit nằm trên local branch `feat/SP-3.2-subscription-lifecycle`.
- Migration đã được copy vào `Plan/Migration/` và log này được ghi vào `Plan/Log/`.
- Các RPC sử dụng `SECURITY INVOKER` và gọi `is_system_admin()` để đảm bảo chỉ system admin thực hiện thay đổi vòng đời subscription.
