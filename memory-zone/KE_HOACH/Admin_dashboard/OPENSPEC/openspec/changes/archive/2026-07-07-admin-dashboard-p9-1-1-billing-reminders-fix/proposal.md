## Why

P9.1 đã PASS toàn bộ lint/build/test và deploy end-to-end trên Supabase. Tuy nhiên, audit sau deploy phát hiện một số lỗi còn sót:

1. **Critical**: Migration P9.1 `REVOKE ALL ON FUNCTION ... FROM PUBLIC` nhưng không `GRANT EXECUTE` lại cho `authenticated`. Có thể khiến Admin Dashboard không gọi được các RPC reminder từ frontend.
2. **High**: `types/billing.ts` khai báo `Invoice.status` bao gồm `'expired'`, trong khi DB CHECK constraint từ P7.1 chỉ cho phép `draft | pending | paid | cancelled | overdue`.
3. **Medium**: `set_billing_reminder_config` không reject milestones array rỗng `[]`.
4. **Medium**: Mock `send_billing_reminders` trong `tests/mocks/supabase.ts` không tăng `skipped` counter khi xảy ra lỗi.

Phase P9.1.1 được tách ra để sửa các lỗi trên mà không làm phình scope của P9.2.

## What Changes

- Thêm `GRANT EXECUTE` cho 4 RPC reminder trong migration P9.1.
- Bổ sung validation reject milestones rỗng trong `set_billing_reminder_config`.
- Sửa mock `send_billing_reminders` để tăng `skipped` đúng.
- (Tùy chọn) Sửa mismatch `Invoice.status` `'expired'`.
- Cập nhật smoke tests và tài liệu nếu cần.

## Scope / Non-Goals

**In scope:**
- Bugfix P9.1.
- Re-apply delta SQL lên Supabase.
- Redeploy nếu Edge Function bị ảnh hưởng (không dự kiến).

**Out of scope:**
- P9.2 automation dashboard.
- Thay đổi nghiệp vụ reminder (mốc T-7/T-3/T-1, cách gửi email).
- Verify domain Resend (operational, không phải code).

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `p9-1-billing-reminders`: Fix access grants and validation so the feature works reliably from Admin Dashboard.

## Impact

- Affected files: `supabase/migrations/20250707000000_phase_p9_1_billing_reminders.sql`, `tests/mocks/supabase.ts`, `types/billing.ts`.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and re-apply the previous P9.1 migration from the pre-phase backup. Detailed steps in rollback.md.
