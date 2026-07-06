## What Was Done

- Backend: added migration `supabase/migrations/20250706000008_phase_p7_2_invoice_create_pricing.sql` with RPC `create_invoice`.
  - Manual + cron-ready, only callable by system admin.
  - Auto numbering `INV-YYYY-####` via existing `get_next_invoice_number`.
  - Pricing: 69.000đ/tháng (monthly) / 59.000đ/tháng (yearly).
  - Supports `bonus_months` and free-form prepaid stacking from current `expires_at`.
  - All date/time operations use Asia/Ho_Chi_Minh timezone.
- Frontend: added `components/InvoiceCreator.tsx` and wired it into `components/BillingConfig.tsx` (tab Thanh toán).
  - Tenant select, cycle/months/bonus/notes inputs, live preview, success result.
- Service layer: added `services/invoiceService.ts` with `createInvoice` and `calculateInvoicePrice`.
- Types: extended `types/billing.ts` with `CreateInvoiceInput` and `InvoicePricing`.
- Tests: added `tests/smoke/admin-dashboard-p7-2-invoice-create-pricing.test.ts` and updated `tests/mocks/supabase.ts` with `create_invoice` RPC mock.

## What Was Verified

- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] All smoke tests pass (68 tests total, including 8 new P7.2 tests)
- [x] Monthly/yearly/prepaid pricing correct
- [x] Bonus months extend period correctly
- [x] Invoice numbers auto-increment and do not collide
- [x] Expires_at stacking when subscription still active
- [x] Non-system admin is rejected

## Next Phase

- P7.3: Xác nhận thanh toán + vòng đời trạng thái (`confirm_payment`, `payments`, invoice status flow).

## Blockers / Decisions

- Remote deployment via `supabase db push` was not executed because the CLI reported the local migration directory is out of sync with the remote migration history. Apply the new migration SQL manually through the Supabase SQL Editor, then test `create_invoice` on the remote project.

## Backup Location

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p7-2-invoice-create-pricing_20260706_131342`
