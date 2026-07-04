## Why

Sửa các page cần load data để nhận `tenantId` từ `TenantContext`.

## What Changes

- Code changes:
  - Tạo hook `useTenant()` để lấy `tenant`, `membership`, `role`.
  - Sửa các page chính: POS, orders, products, customers, reports, inventory.
  - Ưu tiên sửa các `useEffect` fetch data: thêm `tenantId` vào dependency array.

## Scope / Non-Goals

**In scope:**
- Sub-phase 6.4: Page-level data loading
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `page-level-data-loading`: Sửa các page cần load data để nhận `tenantId` từ `TenantContext`.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.