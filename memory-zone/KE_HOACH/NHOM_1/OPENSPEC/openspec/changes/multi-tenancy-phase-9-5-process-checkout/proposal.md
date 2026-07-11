## Why

Cập nhật từ RPC hiện tại để xử lý tenant.

## What Changes

- Output files:
  - `supabase/functions/process-checkout/index.ts`
- Logic:
  - Nhận `x-tenant-id` hoặc `x-subdomain`.
  - Xử lý đơn hàng, cập nhật tồn kho, điểm thưởng trong phạm vi tenant.

## Scope / Non-Goals

**In scope:**
- Sub-phase 9.5: `process-checkout`
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `process-checkout`: Cập nhật từ RPC hiện tại để xử lý tenant.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.