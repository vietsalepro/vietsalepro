## Context

Sau khi deploy P8.1 lên remote, phát hiện `create_invoice` và `create_renewal_invoices` bị lỗi do gọi `public.generate_invoice_number(v_today)` — hàm không tồn tại. Hàm đúng do P7.1 cung cấp là `public.get_next_invoice_number(p_year INT)`.

## Goals / Non-Goals

**Goals:**
- Sửa migration P8.1 để dùng đúng hàm đánh số hóa đơn `get_next_invoice_number`.
- Deploy lại migration đã sửa.
- Xác nhận `create_invoice` và `create_renewal_invoices` chạy được trên remote.

**Non-Goals:**
- Đổi định dạng số hóa đơn.
- Thay đổi logic giá/gói của P8.1.
- Sửa các phase khác.

## Decisions

- **Không tạo hàm mới**: `generate_invoice_number` không tồn tại và không cần thiết. `get_next_invoice_number` đã đủ.
- **Giữ nguyên định dạng INV-YYYY-####**: `get_next_invoice_number(EXTRACT(YEAR FROM v_today)::INT)` cho kết quả giống hệt định dạng mong muốn.
- **Sửa migration file thay vì tạo migration mới**: vì P8.1 chưa được archive vào main spec, sửa trực tiếp file migration gốc là ít diff nhất và tránh phải điều chỉnh nhiều lần. Nếu chính sách dự án yêu cầu migration mới, hãy chuyển thành migration delta `20250707000005_phase_p8_1_invoice_number_hotfix.sql` (DROP + CREATE OR REPLACE lại 2 hàm).
- **Chỉ sửa 2 dòng**: dòng 735 trong `create_invoice` và dòng 807 trong `create_renewal_invoices`.

## Risks / Trade-offs

- **[Low] Re-deploy migration có thể ảnh hưởng nếu hàm đã được gọi bởi cron/job**: mitigation — kiểm tra `create_renewal_invoices` được lập lịch trong P7.5/P9.2; sau deploy cần xác nhận cron chạy không lỗi.
- **[Low] Sửa migration đã deploy có thể gây lệch local/remote**: mitigation — chạy `supabase db query --linked` với file đã sửa; không đổi schema khác.

## Migration / Rollback

- **Deploy**: sửa file `supabase/migrations/20250706000011_phase_p8_1_plan_builder_schema.sql`, chạy `npm run lint`, `npm run build`, sau đó deploy migration lên remote.
- **Rollback**: restore file từ backup hoặc chạy lại migration P8.1 cũ (lưu ý rollback sẽ tái tạo lỗi).

## Open Questions

- None at planning time.
