## Why

Invalid or duplicate data currently reaches the RPC layer, causing confusing failures or silently overwriting existing receipts. Adding validation in `handleImport` and generating the receipt code from the selected import date prevents these issues and matches the user's mental model of the form.

## What Changes

- In `App.tsx` `handleImport`, add validation:
  - Reject `discountTotal < 0`.
  - Reject duplicate `invoiceNumber` for the same supplier (using `supabaseService.getImportReceiptByInvoiceNumber` or RPC).
  - Reject `receiptId` that already exists in a non-draft status (using `supabaseService.getImportReceiptById`).
- In `pages/ImportGoods.tsx` `generateReceiptCode`, use the selected `importDate` instead of `new Date()`.
- Add service functions if missing: `getImportReceiptByInvoiceNumber`, `getImportReceiptById`, `getImportReceiptCountByDate`.

## Scope / Non-Goals

**In scope:**
- Sub-phases 5a and 5b as defined in `docs/plans/import-goods-bugfix/PLAN_REFINED.md`.
- Validation rules and receipt-code generation based on import date.

**Out of scope:**
- Server-side data fetching (Phase 1).
- Routing (Phase 2).
- Cost/discount corrections (Phase 3).

## Capabilities

### New Capabilities
- `phase-5-validation`: Import form validates negative discount, duplicate invoice number, and duplicate receipt id before calling the RPC.
- `phase-5-validation`: Receipt codes are generated from the selected import date.

### Modified Capabilities
- `handle-import`: New pre-RPC validation checks.
- `generate-receipt-code`: Uses `importDate` instead of current date.

## Impact

- Affected files: `App.tsx`, `pages/ImportGoods.tsx`, `services/supabaseService.ts`.
- Dead code: `generateReceiptCode` using `new Date()`.
- Verification: `npm run lint`, `npm run build`, manual test of each validation rule and receipt-code generation.

## Rollback

Restore `App.tsx`, `pages/ImportGoods.tsx`, and `services/supabaseService.ts` from the pre-phase backup. Expanded in `rollback.md`.
