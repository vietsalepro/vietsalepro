# Proposal: Phase 7 — Verification

## Why

After Phases 1–6, the four voucher screens should all use `VoucherFormLayout` and the legacy layout code should be removed. Phase 7 verifies that the refactor did not break the application by running static checks, manual business-flow tests, and responsive/edge-case tests. A final report is produced to document the verification results.

## What Changes

- Run `npm run lint` and `npm run build` with zero errors.
- Manually execute the 5 required business flows:
  1. Tạo phiếu nhập hàng
  2. Sửa phiếu nhập hàng draft
  3. Tạo phiếu kiểm kê
  4. Tạo phiếu xuất hủy
  5. Tạo phiếu đổi hàng NCC
- Run responsive tests on desktop (>1024px), tablet (768–1024px), and mobile (<768px).
- Test edge cases: sidebar actions sticky, wizard UI on `SupplierExchanges`, empty main content, banner without search slot, and date input visual on `InventoryCount`.
- Save a final verification report note in the plan folder.

## Scope / Non-Goals

**In scope:**
- Static verification (`npm run lint`, `npm run build`)
- Manual business flow verification
- Responsive and edge-case verification
- Final report

**Out of scope:**
- New code changes
- Business logic changes
- Database/Supabase changes
- Fixing issues found during verification (fixes should be handled by re-opening the relevant phase)

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None

### Removed Capabilities
- None

## Impact

- No source files are modified in Phase 7.
- A verification report note may be added to `docs/plans/voucher-form-layout-ssot/`.

## Rollback

Not applicable for a verification-only phase. If a regression is found, the issue should be fixed by rolling back to the relevant phase or restoring the affected files from the appropriate backup.
