# KẾ HOẠCH BỀN VỮNG HÓA VIETSALES PRO v7

**Mục tiêu:** Biến phần mềm từ trạng thái "chạy được" sang trạng thái có thể vận hành thực tế **10–20 năm** mà không lỗi nghiêm trọng.

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

## NHÓM 1: BẢO MẬT & MULTI-TENANCY

> **Mức ưu tiên: CAO NHẤT** — Hiện tại bất kỳ ai có anon key đều có thể đọc/ghi/xóa toàn bộ dữ liệu.

### 1.1. Kiểm tra lại toàn bộ RLS policies

**Câu lệnh kiểm tra:**

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Kết quả mong muốn:**
- Không còn policy nào cho phép `public` hoặc `anon` FULL ACCESS trên bảng dữ liệu kinh doanh.
- Mỗi bảng chỉ còn tối đa 1–2 policies hợp lý.

### 1.2. Xóa policies trùng lặp và mở toang

**Danh sách bảng cần xóa "Allow public access" / "Public Access":**

- `app_settings`
- `brands`
- `categories`
- `customers`
- `disposal_items`
- `disposals`
- `import_items`
- `import_receipts`
- `inventory_count_items`
- `inventory_counts`
- `inventory_movements`
- `order_items`
- `orders`
- `point_history`
- `product_lots`
- `products`
- `promotions`
- `rank_configs`
- `rank_history`
- `return_order_items`
- `return_orders`
- `rewards`
- `stock_movements`
- `supplier_exchange_received_items`
- `supplier_exchange_return_items`
- `supplier_exchanges`
- `suppliers`

**Câu lệnh xóa mẫu:**

```sql
DROP POLICY IF EXISTS "Allow public access" ON public.orders;
DROP POLICY IF EXISTS "Public Access" ON public.orders;
-- Lặp lại cho từng bảng
```

### 1.3. Chuyển sang `authenticated` role cơ bản

**Mục tiêu trung gian:** chỉ user đã đăng nhập mới được thao tác.

```sql
CREATE POLICY "authenticated_all_orders"
  ON public.orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

Làm tương tự cho các bảng kinh doanh. Sau đó kiểm tra lại bằng ứng dụng.

### 1.4. Thiết kế multi-tenancy (nếu cần mở rộng nhiều cửa hàng)

**Phương án đề xuất:** Thêm cột `tenant_id` (text/UUID) vào các bảng chính.

**Bảng cần thêm `tenant_id`:**
- `products`, `product_lots`, `orders`, `order_items`, `customers`, `suppliers`
- `import_receipts`, `import_items`, `return_orders`, `return_order_items`
- `inventory_counts`, `inventory_count_items`, `disposals`, `disposal_items`
- `promotions`, `rewards`, `app_settings`

**RLS mẫu sau khi có tenant:**

```sql
CREATE POLICY "tenant_isolation_orders"
  ON public.orders
  FOR ALL
  TO authenticated
  USING (tenant_id = current_setting('app.current_tenant')::text)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::text);
```

**Frontend:** Trước mỗi request RPC/Supabase, gọi:

```sql
SELECT set_config('app.current_tenant', 'tenant_abc', true);
```

### 1.5. Phân quyền vai trò (RBAC)

**Các vai trò đề xuất:**
- `admin`: full quyền
- `cashier`: bán hàng, tạo đơn, thanh toán nợ
- `inventory_manager`: nhập hàng, kiểm kê, xuất hủy
- `accountant`: xem báo cáo, công nợ

**Cách triển khai:**
- Thêm bảng `user_roles` hoặc dùng `auth.users.raw_user_meta_data`.
- Viết policies kiểm tra role trước khi cho phép INSERT/UPDATE/DELETE.

**Ví dụ policy:**

```sql
CREATE POLICY "only_admin_can_delete_orders"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));
```

### 1.6. Kiểm soát đăng ký tài khoản

- Bật `ENABLE EMAIL CONFIRMATION` trong Supabase Auth.
- Nếu chỉ có 1 cửa hàng, hạn chế signup tự do: thêm trigger trong `auth.users` hoặc dùng `SITE_URL` redirect.

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

## NHÓM 3: CODE QUALITY & TESTS

> **Mức ưu tiên: CAO** — Hiện tại chưa có tests, TypeScript không strict, một số file phức tạp.

### 3.1. Bật TypeScript strict mode

**Cập nhật `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
    "skipLibCheck": true,
    "noEmit": true
  }
}
```

**Bước thực hiện:**
1. Bật từng flag một, không bật đồng loạt.
2. Chạy `npm run lint` sau mỗi flag.
3. Sửa lỗi dần dần.

### 3.2. Cài đặt test framework

**Đề xuất:** Vitest (vì đang dùng Vite).

```bash
npm add -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

**Thêm script vào `package.json`:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**Tạo file `vitest.config.ts`:**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
```

### 3.3. Viết tests cho các module nghiệp vụ quan trọng

**Ưu tiên 1: `utils/lotUtils.ts`**

- `getAvailableLots`: chỉ trả về lô có tồn > 0.
- `sortLotsByFifoExpiry`: ưu tiên HSD sớm, sau đó createdAt cũ.
- `selectBestLotForQuantity`: tự động chọn nhiều lô nếu cần.
- `validateLotQuantity`: chặn vượt tồn.

**Ưu tiên 2: `utils/invoiceNumber.ts`**

- `generateInvoiceNumber`: tăng số thứ tự đúng.
- `formatInvoiceNumber`: format đúng pattern.
- `isDuplicateInvoiceNumberError`: nhận diện lỗi trùng.

**Ưu tiên 3: `utils/promotionUtils.ts`**

- `applyPromotions`, `applyBestPromotions`, `suggestPromotions`.
- Các case: khuyến mãi %, khuyến mãi tiền, kết hợp nhiều KM.

**Ưu tiên 4: `utils/rankingEngine.ts`**

- `calculateCustomerRank`: xếp hạng theo điểm/tổng mua.
- `recalculateAllRanks`: không bị lỗi khi dữ liệu lớn.

### 3.4. Viết integration tests cho các luồng chính

**Luồng cần test:**

1. **POS Checkout:**
   - Thêm sản phẩm có lô → chọn lô tự động → thanh toán → kiểm tra `orders`, `order_items`, `product_lots.quantity`, `customers.debt`.
   - Sử dụng test database hoặc mock Supabase RPC.

2. **Nhập hàng:**
   - Tạo phiếu nhập → tồn kho tăng → lô được tạo → `import_items.lot_id` đúng.

3. **Trả hàng:**
   - Chọn đơn gốc → trả một phần → `return_orders` + `return_order_items` → tồn kho tăng lại.

4. **Kiểm kê:**
   - Tạo biên bản kiểm kê → điều chỉnh tồn → `inventory_movements` ghi nhận.

5. **Hủy đơn:**
   - Gọi `cancel_order` → tồn kho hoàn lại → công nợ giảm.

### 3.5. Tách các file phức tạp

**File cần refactor:**

| File | Complexity | Hành động |
|---|---|---|
| `pages/ReturnOrders.tsx` | 72 | Tách thành: `ReturnOrdersTable`, `ReturnOrderFilter`, `ReturnOrderDetail`, `useReturnOrders` |
| `pages/Products.tsx.handleImportExcel` | 54 | Tách thành: `excelValidator.ts`, `excelParser.ts`, `productImporter.ts` |
| `components/MobileSettings.tsx` | 77 | Tách phần xếp hạng, điểm, khuyến mãi thành các tab component riêng |
| `services/supabaseService.ts` | >500 dòng | Tách thành `productService.ts`, `orderService.ts`, `customerService.ts`, `reportService.ts` |

**Nguyên tắc:**
- Mỗi file/hàm chỉ làm một nhiệm vụ.
- Cyclomatic complexity target ≤ 15.
- Dài tối đa 200–300 dòng một file.

### 3.6. Chuẩn hóa error handling

**Hiện tại:** Nhiều chỗ dùng `console.error` và bỏ qua lỗi.

**Đề xuất:**
- Tạo `utils/errorHandler.ts`:

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' = 'medium'
  ) {
    super(message);
  }
}

export function handleError(error: unknown, context: string): AppError {
  if (error instanceof Error) {
    return new AppError(`${context}: ${error.message}`, 'UNKNOWN_ERROR');
  }
  return new AppError(`${context}: Unknown error`, 'UNKNOWN_ERROR');
}
```

- Thay `console.error` bằng toast/notification trong UI.
- Ghi log lỗi nghiêm trọng vào bảng `app_logs` hoặc Supabase Logflare.

### 3.7. Dọn dẹp import và type safety

- Xóa các import không dùng.
- Thay `any` bằng type cụ thể (đặc biệt trong `usePOS.ts` dòng `item: any`).
- Đồng bộ `types.ts` với DB schema (dùng `supabase gen types` nếu có thể).

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
