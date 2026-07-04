# KẾ HOẠCH BỀN VỮNG HÓA VIETSALES PRO v7

> **Mục tiêu:** Biến phần mềm từ trạng thái "chạy được" sang trạng thái có thể vận hành thực tế **10–20 năm** mà không lỗi nghiêm trọng.

**Ngày lập:** 2026-07-04

**Cơ sở kiểm tra:**
- Knowledge Graph qua `codebase-memory-mcp`
- Supabase MCP project `QLBH` (`rsialbfjswnrkzcxarnj`)
- `npm run lint` → PASS
- `npm run build` → PASS

---

## TÓM TẮT TÌNH TRẠNG HIỆN TẠI

| Khía cạnh | Kết quả | Đánh giá |
|---|---|---|
| Build & lint | PASS | Ổn định |
| Tích hợp tính năng | Tốt | Các flow checkout/nhập hàng/trả hàng đã liên kết |
| Số lượng code | 1,143 hàm / 190 file | Vừa phải |
| Bảo mật RLS | **Mở toàn bộ cho public** | NGUY HIỂM |
| Toàn vẹn dữ liệu | Thiếu FK, có record mồ côi | Cần sửa |
| TypeScript strict | Tắt | Cần bật |
| Tests | Không có | Cần bổ sung |
| Backup tables | Còn nhiều bảng rác | Cần dọn |

---

## NHÓM 2: TOÀN VẸN DỮ LIỆU (DATA INTEGRITY)

> **Mức ưu tiên: CAO** — Dữ liệu thực tế đã có record mồ côi và thiếu liên kết FK.

### 2.1. Xử lý 2 `order_items` mồ côi về lot

**Kiểm tra:**

```sql
SELECT oi.order_id, oi.id, oi.product_id, oi.lot_id, oi.quantity, oi.cost
FROM order_items oi
WHERE oi.lot_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_lots pl WHERE pl.id = oi.lot_id);
```

**Phương án xử lý:**
1. Xác định 2 sản phẩm đó có `has_lots = true` hay không.
2. Nếu có lô, tìm lô thay thế theo FIFO hoặc tạo lô mới với số lượng = 0.
3. Nếu không có lô, set `lot_id = NULL` và `lot_code = NULL`.
4. Cập nhật lại `cost` nếu cần.

### 2.2. Xử lý 8 `import_items` có lot_code không khớp

**Kiểm tra:**

```sql
SELECT ii.receipt_id, ii.id, ii.product_id, ii.lot_code, ii.expiry_date
FROM import_items ii
WHERE ii.lot_code IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM product_lots pl
    WHERE pl.product_id = ii.product_id AND pl.code = ii.lot_code
  );
```

**Phương án xử lý:**
- Nếu `lot_code = ''` (rỗng): đây là sản phẩm không lô, để nguyên.
- Nếu `lot_code` có giá trị nhưng không khớp: tìm trong `product_lots` theo `product_id` và chọn lô gần đúng nhất theo `expiry_date`.
- Nếu không tìm được: tạo lô mới trong `product_lots` với `quantity` đồng bộ với số lượng nhập.

### 2.3. Thêm cột `lot_id` vào `import_items`

**Migration:**

```sql
ALTER TABLE public.import_items ADD COLUMN IF NOT EXISTS lot_id text;

-- Backfill lot_id từ product_lots dựa trên product_id + lot_code
UPDATE public.import_items ii
SET lot_id = pl.id
FROM public.product_lots pl
WHERE ii.product_id = pl.product_id
  AND ii.lot_code = pl.code
  AND ii.lot_id IS NULL;

-- Thêm FK
ALTER TABLE public.import_items
  ADD CONSTRAINT fk_import_items_lot
  FOREIGN KEY (lot_id) REFERENCES public.product_lots(id);
```

**Frontend:** Cập nhật `services/supabaseService.ts` và các trang nhập hàng để ghi `lot_id` khi nhập.

### 2.4. Thêm FK cho `order_items.lot_id` và `return_order_items.lot_id`

```sql
ALTER TABLE public.order_items
  ADD CONSTRAINT fk_order_items_lot
  FOREIGN KEY (lot_id) REFERENCES public.product_lots(id);

ALTER TABLE public.return_order_items
  ADD CONSTRAINT fk_return_order_items_lot
  FOREIGN KEY (lot_id) REFERENCES public.product_lots(id);
```

> **Lưu ý:** Chỉ chạy sau khi đã xử lý xong record mồ côi ở mục 2.1.

### 2.5. Thêm các CHECK constraint cơ bản

```sql
ALTER TABLE public.products
  ADD CONSTRAINT chk_products_quantity_non_negative CHECK (quantity >= 0);

ALTER TABLE public.product_lots
  ADD CONSTRAINT chk_product_lots_quantity_non_negative CHECK (quantity >= 0);

ALTER TABLE public.orders
  ADD CONSTRAINT chk_orders_total_non_negative CHECK (total_amount >= 0);

ALTER TABLE public.order_items
  ADD CONSTRAINT chk_order_items_quantity_positive CHECK (quantity > 0),
  ADD CONSTRAINT chk_order_items_price_non_negative CHECK (price >= 0);

ALTER TABLE public.import_items
  ADD CONSTRAINT chk_import_items_quantity_positive CHECK (quantity > 0),
  ADD CONSTRAINT chk_import_items_cost_non_negative CHECK (cost >= 0);
```

### 2.6. Xóa function overloads cũ

**Kiểm tra:**

```sql
SELECT proname, pg_get_function_identity_arguments(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND proname IN ('filter_import_receipts_rpc', 'filter_products_rpc')
ORDER BY proname;
```

**Xóa bản cũ (6 tham số):**

```sql
DROP FUNCTION IF EXISTS public.filter_import_receipts_rpc(
  text, integer, integer, date, date, text
);

DROP FUNCTION IF EXISTS public.filter_products_rpc(
  text, integer, integer, text, text, text, text
);
```

> Giữ lại bản mới có `p_status` và `p_stock_status`.

### 2.7. Dọn dẹp backup tables

**Danh sách bảng cần đánh giá xóa:**

- `backup_products_pre_phase2`
- `backup_product_lots_pre_phase2`
- `backup_stock_movements_pre_phase2`
- `backup_stock_ledger_meta`
- `import_receipts_backup_phase3a`
- `import_items_backup_phase3a`
- `product_lots_backup_phase3a`
- `products_backup_phase3a`
- `stock_movements_backup_phase6`

**Quy trình xóa an toàn:**
1. Xuất dữ liệu backup ra file `.sql` lưu riêng (dùng Supabase backup hoặc pg_dump).
2. Xác nhận dữ liệu backup không còn cần thiết.
3. Xóa bảng:

```sql
DROP TABLE IF EXISTS public.backup_products_pre_phase2;
-- Lặp lại cho các bảng khác
```

### 2.8. Xóa file rác trong dự án

- `components/MobilePOS.backup.tsx` (đã bị exclude trong `tsconfig.json`)
- `supabase/migration_phase9_promotion_pricing.sql.OLD`
- Thư mục `template-ui` (nếu không dùng)
- Các file trong `.temp/` sau khi đã áp dụng xong

### 2.9. Kiểm tra đồng bộ tồn kho định kỳ

**Câu lệnh kiểm tra:**

```sql
SELECT product_id, SUM(quantity) AS lot_total
FROM public.product_lots
GROUP BY product_id;

-- So sánh với products.quantity
SELECT p.id, p.quantity, l.lot_total
FROM public.products p
LEFT JOIN (
  SELECT product_id, SUM(quantity) AS lot_total
  FROM public.product_lots
  GROUP BY product_id
) l ON p.id = l.product_id
WHERE p.has_lots = true
  AND COALESCE(p.quantity, 0) != COALESCE(l.lot_total, 0);
```

**Kết quả hiện tại:** 0 lệch lạc cho sản phẩm có lô. Cần giữ vững bằng trigger/RPC.

---

## LỘ TRÌNH THỰC HIỆN ĐỀ XUẤT

### Giai đoạn 1: An toàn & Toàn vẹn (2–3 tuần)
- [ ] Sửa RLS policies
- [ ] Xử lý 2 order_items mồ côi và 8 import_items lô lỗi
- [ ] Thêm FK cho lot_id
- [ ] Thêm CHECK constraints
- [ ] Xóa function overloads cũ
- [ ] Dọn dẹp backup tables và file rác
- [ ] Chạy lại `npm run lint` và `npm run build`

### Giai đoạn 2: Code Quality (2–3 tuần)
- [ ] Bật `strictNullChecks`, `noImplicitAny`
- [ ] Cài Vitest + viết tests cho `lotUtils`, `invoiceNumber`, `promotionUtils`
- [ ] Tách `pages/ReturnOrders.tsx`
- [ ] Tách `services/supabaseService.ts`
- [ ] Chuẩn hóa error handling

### Giai đoạn 3: Tests & Vận hành (3–4 tuần)
- [ ] Viết integration tests cho checkout, import, return, inventory
- [ ] Tạo bảng `app_logs`
- [ ] Tạo RPC `check_inventory_consistency`
- [ ] Thiết lập backup tự động
- [ ] Viết `docs/OPERATIONS.md`
- [ ] Cài `openspec` và tích hợp vào CI

### Giai đoạn 4: Multi-tenancy & RBAC (tùy nhu cầu)
- [ ] Thêm `tenant_id`
- [ ] Thiết kế lại RLS theo tenant
- [ ] Phân quyền roles

---

## TIÊU CHÍ CHẤP NHẬN (ACCEPTANCE CRITERIA)

Trước khi coi là "sẵn sàng 10–20 năm":

1. Không còn policy `public` ALL trên bảng dữ liệu.
2. `npm run lint` pass với `strict: true`.
3. `npm run build` pass.
4. Có ít nhất 30 unit tests và 5 integration tests pass.
5. Không còn record mồ côi trong các bảng chính.
6. Có FK trên `order_items.lot_id`, `return_order_items.lot_id`, `import_items.lot_id`.
7. Có runbook vận hành.
8. Có backup tự động và đã test restore thành công ít nhất 1 lần.
9. `openspec validate` pass.
10. Đã xóa backup tables và file rác không cần thiết.

---

## GHI CHÚ

- KHÔNG thực hiện các thay đổi trên DB production vào giờ cao điểm.
- LUÔN tạo backup trước khi chạy migration sửa dữ liệu.
- KHÔNG bật `strict: true` đồng loạt — bật từng flag để tránh conflict lớn.
- Nên triển khai trên staging environment trước production.
