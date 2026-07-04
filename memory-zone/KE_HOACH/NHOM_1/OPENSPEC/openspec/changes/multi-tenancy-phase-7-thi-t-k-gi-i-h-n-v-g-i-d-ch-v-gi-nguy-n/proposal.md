## Why

2 gói Free/VIP, giới hạn SKU, đơn/tháng, user.

## What Changes

- Code changes:
  - `services/subscriptionService.ts`: `getSubscription`, `checkLimit`, `isNearLimit`
  - ponytail: các trigger `check_tenant_limits` và `increment_monthly_order_count` đọc count rồi so sánh. Với nhiều request đồng thời, có thể vượt giới hạn một vài đơn. Ở giai đoạn đầu (Free/VIP đơn giản) chấp nhận được; nếu sau này cần chính xác tuyệt đối, chuyển sang dùng advisory lock hoặc serializable transaction.
  - Đảm bảo mỗi tenant luôn có row trong `tenant_subscriptions` khi tạo (xem Phase 9.1).
- SQL migrations (see design.md for full scripts)

## Scope / Non-Goals

**In scope:**
- Sub-phase 7: Thiết kế giới hạn và gói dịch vụ (giữ nguyên)
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `thi-t-k-gi-i-h-n-v-g-i-d-ch-v-gi-nguy-n`: 2 gói Free/VIP, giới hạn SKU, đơn/tháng, user.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.