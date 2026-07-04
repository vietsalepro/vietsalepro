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
