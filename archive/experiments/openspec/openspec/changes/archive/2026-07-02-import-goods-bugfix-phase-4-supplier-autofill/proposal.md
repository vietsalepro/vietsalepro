## Why

Creating a new supplier while the `suppliers` prop is empty currently leads to duplicate or incorrect supplier codes because the code-generation logic relies on the prop list. After Phase 1, local supplier state is populated from the server, but the code generator may still reference the old prop. Additionally, the amount-paid auto-fill still uses the obsolete `totalImportCost` instead of the post-line-discount total, causing underpayment.

## What Changes

- Update `handleCreateSupplier` in `pages/ImportGoods.tsx` to fetch the full supplier list from the server before generating the next code.
- After creating a supplier, add the new supplier to `localSuppliers` and `supplierCache`.
- Keep `onAddSupplier` from `App.tsx` as a notification but do not depend on it for state updates.
- Remove any remaining `totalImportCost` / `totalWithShipping` references.
- Ensure `TotalsSection` auto-fills `paidAmount = needToPay` where `needToPay = max(0, totalGoodsAfterLineDiscount + shippingCost - discountTotal)`.

## Scope / Non-Goals

**In scope:**
- Single sub-phase 4 as defined in `docs/plans/import-goods-bugfix/PLAN_REFINED.md`.
- Supplier-code generation and paid-amount auto-fill.

**Out of scope:**
- Routing (Phase 2).
- Cost/discount backend (Phase 3).
- Validation (Phase 5).

## Capabilities

### New Capabilities
- `phase-4-supplier-autofill`: Supplier creation is safe even when the parent prop is empty, and paid amount auto-fills from the post-discount total.

### Modified Capabilities
- `supplier-section`: New supplier creation now uses the server-side supplier list.
- `totals-section`: Auto-fill source is `needToPay` based on `totalGoodsAfterLineDiscount`.

## Impact

- Affected files: `pages/ImportGoods.tsx`, `services/supabaseService.ts` (if `getSuppliers` is missing).
- Dead code: `totalImportCost` / old `totalWithShipping` calculations.
- Verification: `npm run lint`, `npm run build`, manual test creating a new supplier and verifying paid-amount auto-fill.

## Rollback

Restore `pages/ImportGoods.tsx` from the pre-phase backup. Expanded in `rollback.md`.
