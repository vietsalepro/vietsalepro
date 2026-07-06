## What Was Done

- Migration `supabase/migrations/20250706000010_phase_p7_5_expiry_renewal_cron.sql`:
  - `expire_overdue_invoices()` (SECURITY DEFINER): hóa đơn `pending` quá 48h → `expired`, tenant `active/trial` → `read_only`, `tenant_subscriptions.billing_status='overdue'`.
  - `create_renewal_invoices(p_days_before=7)`: tạo hóa đơn gia hạn (VIP tháng, 69k) cho subscription hết hạn trong 7 ngày, bỏ qua nếu đã có hóa đơn còn mở.
  - 2 job pg_cron: `invoice-expiry-daily` (03:30), `renewal-invoice-daily` (04:00).
  - Cột `invoices.discount_code TEXT` nullable — chỗ nối cho voucher P10 (chưa dùng ở P7).
- Edge Function `supabase/functions/send-billing-email/index.ts`: gửi email `reminder`/`confirmation` qua Resend; nhận `invoice_id`, `type`, `to?`; lấy email chủ tenant nếu không truyền `to`; kèm thông tin CK + công ty. Auth: system admin hoặc service role.
- Service `sendBillingEmail` trong `services/invoiceService.ts`; type `BillingEmailType`/`SendBillingEmailInput` trong `types/billing.ts`.
- Frontend: nút "Gửi nhắc thanh toán" trong `InvoiceManager` (chỉ hóa đơn chưa thanh toán); auto gửi email xác nhận best-effort sau confirm trong `InvoicePaymentConfirm`.
- Test: `tests/smoke/admin-dashboard-p7-5-expiry-cron-renewal-email.test.ts` + mở rộng mock `send-billing-email`.

## What Was Verified

- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] `npx vitest run` — 79/79 test pass (gồm 4 test P7.5)

## Next Phase

- Deploy trên Supabase thật: apply migration, `supabase functions deploy send-billing-email`, set secret `RESEND_API_KEY` (và tùy chọn `RESEND_FROM`). Xác minh cron + email thật.
- Sub-phase kế tiếp: P8/P9 theo KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md.

## Blockers / Decisions

- Gia hạn tự động mặc định chu kỳ THÁNG (69k). Trần đã ghi `ponytail:` trong migration; nâng cấp theo chu kỳ năm sau nếu cần.
- Cron chạy hằng ngày (biên 48h có dư); đổi sang mỗi giờ nếu cần nhạy hơn.
- `promo_codes`/`promotion_rules` KHÔNG tạo ở P7 — chỉ thêm cột `discount_code` nullable sẵn cho P10.

## Backup Location

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p7-5-expiry-cron-renewal-email_<YYYYMMDD_HHMMSS>`
