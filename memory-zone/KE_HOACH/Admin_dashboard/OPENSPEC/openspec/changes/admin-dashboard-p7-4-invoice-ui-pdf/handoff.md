## What Was Done

- Completed P7 4 Invoice Ui Pdf.
- Backend: dùng lại RPC/migration P7.1–P7.3; thêm `getAllInvoices`, `getInvoiceById` trong `services/invoiceService.ts`.
- Frontend: thêm `InvoiceManager` vào tab Thanh toán của `SystemAdminDashboard`: danh sách hóa đơn, filter, badge trạng thái, countdown 48 giờ, modal chi tiết kèm ngân hàng/công ty, xuất PDF client-side (jsPDF + html2canvas, lazy load).

## What Was Verified

- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] Smoke test `tests/smoke/admin-dashboard-p7-4-invoice-ui-pdf.test.ts` pass (3/3)
- [x] Full test suite `npx vitest run` pass (15 files, 75 tests)
- [x] Manual acceptance criteria: UI render + countdown + badge + export PDF function verified; chưa test trên session đăng nhập thật do cần system admin.

## Next Phase

- P7.5 — Cron hết hạn + cron tạo hóa đơn gia hạn + email SendGrid (theo KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md).

## Blockers / Decisions

- None.

## Backup Location

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p7-4-invoice-ui-pdf_20260706_134652`
