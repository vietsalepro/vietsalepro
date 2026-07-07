## Why

P8.1 migration `20250706000011_phase_p8_1_plan_builder_schema.sql` ghi đè lại `create_invoice` và `create_renewal_invoices`, nhưng vô tình gọi `public.generate_invoice_number(v_today)` — hàm này **không tồn tại** trong DB. Hàm đánh số hóa đơn duy nhất tồn tại là `public.get_next_invoice_number(p_year INT)` do P7.1 tạo ra.

Hậu quả: sau khi deploy P8.1 lên remote, mọi lệnh gọi `create_invoice` và `create_renewal_invoices` đều bị lỗi `function public.generate_invoice_number(date) does not exist`, gây ra hiệu ứng domino cho các tính năng billing/phát hành hóa đơn.

## What Changes

- Sửa migration `supabase/migrations/20250706000011_phase_p8_1_plan_builder_schema.sql`:
  - Thay `public.generate_invoice_number(v_today)` trong `create_invoice` bằng `public.get_next_invoice_number(EXTRACT(YEAR FROM v_today)::INT)`.
  - Thay `public.generate_invoice_number(v_today)` trong `create_renewal_invoices` bằng `public.get_next_invoice_number(EXTRACT(YEAR FROM v_today)::INT)`.
- Không thay đổi signature, RLS, logic tính giá hay bất kỳ phần nào khác của P8.1.
- Deploy migration đã sửa lên Supabase project `rsialbfjswnrkzcxarnj` (QLBH) qua `supabase db query --linked`.
- Kiểm thử thủ công: gọi `create_invoice` và `create_renewal_invoices` trên remote để xác nhận lỗi đã hết.

## Scope / Non-Goals

**In scope:**
- Sửa lỗi tên hàm đánh số hóa đơn trong migration P8.1.
- Deploy lại migration đã sửa.
- Kiểm thử thủ công trên remote.

**Out of scope:**
- Thay đổi logic đánh số hóa đơn (vẫn giữ `INV-YYYY-####`).
- Thêm tính năng mới.
- Sửa các phase khác.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `p8-1-plan-builder-schema`: đảm bảo `create_invoice` và `create_renewal_invoices` hoạt động trở lại sau khi deploy P8.1.

## Impact

- Affected file: `supabase/migrations/20250706000011_phase_p8_1_plan_builder_schema.sql`.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected file from backup. If migration was already deployed, re-run the corrected migration; no destructive data change is introduced by this hotfix.
