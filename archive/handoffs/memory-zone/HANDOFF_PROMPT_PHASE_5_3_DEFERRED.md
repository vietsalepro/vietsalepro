# Handoff — Phase 5.3: RLS policies remaining tables + unique indexes

> **Status: RESOLVED** — deferred schema alignment completed in this session.
> Updated backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_5_3_deferred_20260705_083357`
>
> Ngày: 2026-07-05
> Chat hiện tại đã chạy xong phần lớn Sub-phase 5.3, nhưng phải tạm map unique index sang cột thực tế vì schema hiện tại khác với kế hoạch.

---

## Đã hoàn thành

- Backup project: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_5_3_20260705_073820`
- Tạo & chạy migration: `supabase/migrations/20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql`
- RLS policies đã áp dụng cho 27 bảng còn lại + `promotions` (tổng 32 bảng business đều đã ENABLE ROW LEVEL SECURITY).
- Đã xóa các legacy policy cho phép toàn quyền truy cập:
  - `allow_all_stock_movements` on `stock_movements`
  - `cpl_auth_select`, `cpl_auth_insert` on `customer_payment_ledger`
  - `spl_auth_select`, `spl_auth_insert` on `supplier_payment_ledger`
- Unique indexes đã tạo (theo cột thực tế):
  - `idx_products_sku_per_tenant` → `(tenant_id, code)` (trong DB, `code` là SKU)
  - `idx_products_barcode_per_tenant` → `(tenant_id, barcode)`
  - `idx_einvoice_orders_invoice_number_per_tenant` → `(tenant_id, invoice_no)` (trong DB cột là `invoice_no`, không phải `invoice_number`)
- Đã xử lý data duplicate: những product `code` trùng trong cùng tenant được thêm hậu tố `_dup2`, `_dup3`,...; code rỗng được loại trừ khỏi unique index.
- `npm run lint` và `npm run build` đều PASS.

---

## Vấn đề còn tồn đọng — giao cho chat sau

Schema thực tế không khớp form trong kế hoạch:

| Kế hoạch | Cột thực tế trong DB |
|---|---|
| `products.sku` | `products.code` |
| `orders.order_code` | **không tồn tại** (`orders` chỉ có `id`) |
| `einvoice_orders.invoice_number` | `einvoice_orders.invoice_no` |

Chat sau cần triển khai lại đúng form kế hoạch:

1. **`products.sku`**
   - Quyết định: rename `code` → `sku` hay thêm cột `sku` mới.
   - Nếu thêm cột mới: backfill `sku = code`, cập nhật `services/supabaseService.ts` và frontend để insert/update `sku`.
   - Nếu rename: đảm bảo toàn bộ code app và RPC đều tham chiếu đúng cột mới.
   - Cập nhật migration `idx_products_sku_per_tenant` trỏ sang `sku` (loại bỏ/adapt index cũ trên `code`).

2. **`orders.order_code`**
   - Thêm cột `order_code` vào `orders`.
   - Quyết định cách sinh order_code (sequence, trigger, hay frontend gửi).
   - Backfill dữ liệu cũ (có thể tạm dùng substring id hoặc để NULL với điều kiện index).
   - Tạo `idx_orders_code_per_tenant` trên `(tenant_id, order_code)`.
   - Cập nhật frontend/types/RPC nếu cần hiển thị mã đơn hàng.

3. **`einvoice_orders.invoice_number`**
   - Quyết định: rename `invoice_no` → `invoice_number` hay thêm cột `invoice_number`.
   - Cập nhật migration `idx_einvoice_orders_invoice_number_per_tenant` trỏ sang `invoice_number`.
   - Cập nhật `services/supabaseService.ts` và code liên quan e-invoice nếu đổi tên cột.

4. **Kiểm thử lại**
   - Chạy lại migration theo đúng form kế hoạch.
   - `npm run lint` + `npm run build`.
   - Kiểm tra unique constraints thực sự hoạt động (thử insert trùng SKU/barcode/order_code/invoice_number trong cùng tenant).
   - Kiểm tra isolation: user tenant A không thấy data tenant B.

---

## Tài nguyên liên quan

- Migration hiện tại: `supabase/migrations/20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql`
- Kế hoạch chi tiết: `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md` (Sub-phase 5.3)
- OpenSpec change: `multi-tenancy-phase-5-3-rls-policies-remaining-tables-unique-indexes`
- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_5_3_20260705_073820`

---

## Lưu ý

- Không xóa migration file hiện tại; chat sau có thể giữ các phần RLS và chỉ sửa phần unique index + thêm schema changes.
- Nếu rename cột, cần kiểm tra kỹ các RPC/function trong Supabase vì chúng có thể tham chiếu trực tiếp `code`, `invoice_no`, `id`.
