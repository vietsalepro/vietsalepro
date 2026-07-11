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

## NHÓM 4: VẬN HÀNH & MONITORING

> **Mức ưu tiên: TRUNG BÌNH–CAO** — Cần chuẩn bị cho vận hành thực tế lâu dài.

### 4.1. Logging và audit trail

**Bảng đề xuất:**

```sql
CREATE TABLE public.app_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  level text NOT NULL CHECK (level IN ('info', 'warn', 'error')),
  context text NOT NULL,
  message text NOT NULL,
  user_id text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_app_logs_created_at ON public.app_logs(created_at DESC);
CREATE INDEX idx_app_logs_level ON public.app_logs(level);
```

**Các sự kiện cần log:**
- Checkout thành công/thất bại
- Hủy đơn
- Nhập hàng
- Trả hàng
- Điều chỉnh công nợ
- Thay đổi giá vốn
- Đăng nhập/đăng xuất
- Thay đổi cấu hình hệ thống

### 4.2. Kiểm tra đồng bộ tồn kho tự động

**RPC kiểm tra:**

```sql
CREATE OR REPLACE FUNCTION public.check_inventory_consistency()
RETURNS TABLE(
  product_id text,
  products_quantity numeric,
  lot_sum numeric,
  diff numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS product_id,
    COALESCE(p.quantity, 0) AS products_quantity,
    COALESCE(SUM(pl.quantity), 0) AS lot_sum,
    COALESCE(p.quantity, 0) - COALESCE(SUM(pl.quantity), 0) AS diff
  FROM public.products p
  LEFT JOIN public.product_lots pl ON p.id = pl.product_id
  WHERE p.has_lots = true
  GROUP BY p.id, p.quantity
  HAVING COALESCE(p.quantity, 0) != COALESCE(SUM(pl.quantity), 0);
END;
$$ LANGUAGE plpgsql;
```

**Chạy định kỳ:** Hàng ngày hoặc sau mỗi batch import.

### 4.3. Backup và disaster recovery

**Cần thiết lập:**
- Bật Point-in-Time Recovery (PITR) trên Supabase (nếu plan hỗ trợ).
- Lên lịch pg_dump định kỳ (hàng ngày/hàng tuần).
- Lưu backup ra nhiều nơi (local NAS, cloud storage).
- Kiểm tra restore backup định kỳ (ít nhất 1 lần/tháng).

### 4.4. Cài đặt và sử dụng `openspec`

**Cài đặt:**

```bash
npm add -D openspec
```

Hoặc nếu là CLI toàn cục:

```bash
npm install -g openspec
```

**Thêm script:**

```json
{
  "scripts": {
    "openspec:validate": "openspec validate --all --json"
  }
}
```

**Chạy trước mỗi release:**

```bash
npm run lint
npm run build
npm run openspec:validate
```

### 4.5. Runbook vận hành

Tạo file `docs/OPERATIONS.md` với các scenario:

1. **Khôi phục đơn hàng bị hủy nhầm**
2. **Xử lý chênh lệch tồn kho sau kiểm kê**
3. **Khách hàng báo mất điểm thưởng**
4. **Nhà cung cấp trả lại hàng bị lỗi**
5. **Sửa giá vốn cho đơn hàng đã bán**
6. **Ứng dụng offline không sync được**

Mỗi scenario cần có:
- Bước xác nhận lỗi
- Câu lệnh SQL/RPC cần gọi
- Cách verify kết quả
- Người phê duyệt

### 4.6. Giám sát hiệu năng

**Theo dõi:**
- Kích thước bảng `orders`, `order_items`, `inventory_movements` (sau 1–2 năm có thể lớn).
- Thời gian phản hồi của các RPC phức tạp (`get_inventory_report`, `get_profit_report`, `get_sales_report`).
- Số lượng records trong `offline_queue` (nếu tồn đọng nhiều cần xử lý).

**Tối ưu khi cần:**
- Thêm index trên các cột thường filter: `orders.date`, `orders.customer_id`, `order_items.product_id`, `product_lots.expiry_date`.
- Partition bảng lớn theo thời gian (`orders_2026`, `orders_2027`).

### 4.7. Versioning và migration

**Chuẩn hóa:**
- Đặt tên migration theo format: `migration_YYYYMMDD_ten_mo_ta.sql`.
- Mỗi migration phải có:
  - `BEGIN;`
  - `ROLLBACK;` hoặc `COMMIT;`
  - Ghi chú mục đích
- Lưu migration vào `supabase/migrations/` thay vì root `supabase/`.
- Dùng `supabase db push` hoặc migration tool để deploy có kiểm soát.

### 4.8. Tài liệu hóa API và kiểu dữ liệu

**Tạo file:**
- `docs/API_REFERENCE.md`: liệt kê các RPC với signature, mục đích, ví dụ gọi.
- `docs/DATA_MODEL.md`: sơ đồ ERD, mô tả các bảng, ràng buộc.
- `docs/CHANGELOG.md`: ghi lại thay đổi theo phiên bản.

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
