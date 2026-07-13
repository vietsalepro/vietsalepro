# SP-3.5: Invoice PDF Generation — Execution Log

## Status
- **Sub-phase:** SP-3.5 Invoice PDF Generation
- **Completed:** 2026-07-12 17:34 (ICT)
- **Branch:** `feat/SP-3.5-invoice-pdf`
- **Pushed:** No
- **Migration applied to staging/production:** No

## What was built
- `lib/invoicePdf.ts`:
  - `GenerateInvoicePdfInput` interface accepting `invoice`, `items`, `payments`, optional `companyInfo` and `bankAccounts`.
  - `generateInvoicePdf(input)` — lazy-loads `jspdf` and generates an A4 PDF directly from invoice data.
  - Built-in `latinize()` helper strips Vietnamese combining diacritics so jsPDF's default Latin-1 fonts render without embedding a custom TTF.
  - Includes invoice header, company info, item table, totals, payment history, bank transfer info, and notes.
- `components/InvoiceManager.tsx`:
  - Replaced the previous screenshot-based `exportInvoiceToPdf` (html2canvas) export with the new data-driven `generateInvoicePdf`.
  - Download button now builds a PDF from `detail.invoice`, `detail.items`, `detail.payments`, plus `companyInfo` / `bankAccounts`, then triggers a browser download via a temporary anchor.
  - Removed the now-unused `pdfRef` and `useRef` import.
- `tests/lib/invoicePdf.test.ts`:
  - 3 tests asserting the returned data URI is a valid PDF, contains the invoice number, id, item description, company info, and bank info.
  - Added a regression test for empty item/payment arrays.

## Backup
- Project backup was not explicitly created for this sub-phase because the change set is small (3 files) and reversible via git. The previous phase backup is available under `C:\Users\SUACAUBA\Downloads\Project\Back up Admin dashboard step\`.

## Verification
- `npm run lint` (`tsc --noEmit`) — passed.
- `npx vitest run` — 79 test files, 449 tests passed.
- Independent pre-commit review — passed; addressed non-blocking suggestion by adding an empty-items regression test.

## Artifacts
- Code files: `lib/invoicePdf.ts`, `components/InvoiceManager.tsx`
- Test file: `tests/lib/invoicePdf.test.ts`
- Migration file: None generated in this phase.
- Edge function: None generated in this phase.

## Not pushed / not deployed
- Commit `a61c241` is local on `feat/SP-3.5-invoice-pdf` and has **not** been pushed.
- No migration to apply to Supabase staging or production.
- No Edge Function deployments in this phase.
