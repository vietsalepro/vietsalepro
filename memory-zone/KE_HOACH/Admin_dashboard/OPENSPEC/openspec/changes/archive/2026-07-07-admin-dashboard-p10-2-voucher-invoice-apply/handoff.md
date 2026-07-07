## What Was Done

- Completed P10 2 Voucher Invoice Apply.

## What Was Verified

- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] Manual acceptance criteria tested (dùng `create_invoice` thật, không còn bypass)

## Verification Detail (P10.2 re-run after P7.2/P8.1 invoice-number fix)

- Trước đây P10.2 bị bypass vì `create_invoice` trên remote gọi `public.generate_invoice_number()` (không tồn tại), nên test đã INSERT hóa đơn trực tiếp thay vì dùng `create_invoice`.
- Sau khi deploy lại migration `20250706000011_phase_p8_1_plan_builder_schema.sql`, `create_invoice` và `create_renewal_invoices` đã dùng `public.get_next_invoice_number()`.
- Đã chạy lại verification P10.2 bằng `create_invoice` thật trên remote:
  - Tạo hóa đơn năm cho tenant `670f61e2-42d2-40bc-ab84-f96fa73a2945` → `INV-2026-0014`, `subtotal=708000.00` (12×59000).
  - Áp voucher `TEST_P10_2_10PERCENT` 10% → `discount=70800.00`, `total=637200.00`.
  - Promotion rule `cycle_type=yearly` tặng 2 tháng → `bonus_months=2`, `period_end` từ `2027-07-07` → `2027-09-07`.
  - Ghi dòng `Tháng tặng (promotion)` qty=2, unit_price=0.
  - Ghi `promo_code_usages` đúng tenant + invoice.
  - Đã dọn dẹp dữ liệu test.
- Kiểm tra giới hạn per-tenant:
  - Voucher `max_uses_per_tenant=1` áp thành công cho hóa đơn đầu tiên.
  - Hóa đơn thứ hai cùng tenant bị chặn với lỗi `Tenant đã sử dụng hết lượt voucher`.
  - Đã dọn dẹp dữ liệu test.

## Next Phase

- Next sub-phase in KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md.

## Blockers / Decisions

- None.

## Backup Location

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p10-2-voucher-invoice-apply_<YYYYMMDD_HHMMSS>`
