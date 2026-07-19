## Context

After earlier phases, the form has correct data sources and totals. The remaining bugs are: `discountTotal` can be negative, `invoiceNumber` can duplicate an existing supplier invoice, a `receiptId` can overwrite a completed receipt, and the generated receipt code is based on the current date instead of the selected import date.

## Goals / Non-Goals

**Goals:**
- Block submission when `discountTotal < 0`.
- Block submission when `invoiceNumber` already exists for the selected supplier (excluding the current draft).
- Block submission when `receiptId` already exists in non-draft status.
- Generate the receipt code from the user-selected `importDate`.

**Non-Goals:**
- Changing the overall cost/discount logic.
- Changing the routing or menu behavior.

## Decisions

| Decision | Rationale | Alternative considered |
|----------|-----------|------------------------|
| Validate in `handleImport` before RPC | Centralizes business rules in the handler | Validate inside the RPC only |
| Use service helpers for duplicate checks | Reusable and testable | Inline Supabase calls in `App.tsx` |
| Use existing `getImportReceiptCountByDate` if available | Avoids adding new RPC | Add a new `check_invoice_number_exists` RPC |
| Keep alert-style messages for now | Minimal UI change | Replace with toast/form errors |

## Risks / Trade-offs

- **Medium** — Duplicate checks require additional DB queries before each save, adding latency. → Use indexed columns and consider caching recent results.
- **Low** — Receipt code generation depends on `importDate` format; ensure date parsing is consistent across time zones.

## Migration / Rollback

- How to deploy: add validation checks, update `generateReceiptCode`, add missing service helpers, run lint/build, and test invalid/valid cases.
- How to undo: restore `App.tsx`, `pages/ImportGoods.tsx`, and `services/supabaseService.ts` from backup.

## Open Questions

- Are `getImportReceiptByInvoiceNumber`, `getImportReceiptById`, and `getImportReceiptCountByDate` already present in `services/supabaseService.ts`? If not, add them here.
- Should the invoice-number uniqueness be scoped per supplier or globally? (Plan says "theo supplier hoặc toàn bộ"; implement per supplier as safer.)
