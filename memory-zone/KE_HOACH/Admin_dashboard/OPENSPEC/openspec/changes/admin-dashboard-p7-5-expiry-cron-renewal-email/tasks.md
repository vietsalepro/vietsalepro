## 0. Pre-Flight

- [ ] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p7-5-expiry-cron-renewal-email_<YYYYMMDD_HHMMSS>`
- [ ] 0.2 Confirm `npm run lint` passes (baseline)
- [ ] 0.3 Read the sub-phase section in `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`

## 1. P7 5 Expiry Cron Renewal Email

- [x] 1.1 Migration `20250706000010_phase_p7_5_expiry_renewal_cron.sql`: `expire_overdue_invoices()` (pending >48h → expired + tenant read_only + billing_status overdue), `create_renewal_invoices(7)` (tạo hóa đơn gia hạn 7 ngày trước expires_at), 2 job pg_cron, cột `invoices.discount_code` nullable cho voucher (P10).
- [x] 1.2 Edge Function `send-billing-email`: gửi email reminder/confirmation qua Resend (RESEND_API_KEY trong secrets); auth system admin/service role.
- [x] 1.2b Frontend: nút "Gửi nhắc thanh toán" trong InvoiceManager; auto gửi email xác nhận sau khi confirm ở InvoicePaymentConfirm.
- [x] 1.3 Service `sendBillingEmail` + type `SendBillingEmailInput`/`BillingEmailType` trong `types/billing.ts`.

## 2. Verification

- [x] 2.1 Run `npm run lint` — PASS
- [x] 2.2 Run `npm run build` — PASS
- [x] 2.3 Smoke test `admin-dashboard-p7-5-expiry-cron-renewal-email.test.ts` (4 test) + toàn bộ 79 test PASS
- [x] 2.4a Migration applied trên Supabase `rsialbfjswnrkzcxarnj` (qua MCP apply_migration) — verified: 2 hàm + 2 cron jobs + cột `discount_code`.
- [x] 2.4b Edge Function `send-billing-email` deployed (version 5, ACTIVE, verify_jwt=true).
- [ ] 2.4c Set secret `RESEND_API_KEY` (và tùy chọn `RESEND_FROM`) — user tự set: `npx supabase secrets set RESEND_API_KEY=... --project-ref rsialbfjswnrkzcxarnj`.
- [ ] 2.4d Xác minh email thật + verify domain gửi trên Resend.

## Acceptance Criteria

- [x] P7.5 — Expiry cron, renewal cron, Resend email reminders for billing.
- [x] `npm run lint` pass
- [x] `npm run build` pass

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p7-5-expiry-cron-renewal-email_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.
