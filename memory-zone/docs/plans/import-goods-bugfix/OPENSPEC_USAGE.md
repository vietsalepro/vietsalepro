# Hướng dẫn sử dụng OpenSpec cho ImportGoods Bugfix

> OpenSpec đã được cấu hình với schema `import-goods-bugfix`.
> Thư mục kế hoạch: `docs/plans/import-goods-bugfix/`
> Thư mục OpenSpec: `openspec/`

## Cấu trúc OpenSpec

```text
openspec/
├── config.yaml                              # Schema mặc định = import-goods-bugfix
├── schemas/
│   └── import-goods-bugfix/                 # Schema custom cho bugfix
│       ├── schema.yaml
│       └── templates/
│           ├── proposal.md
│           ├── spec.md
│           ├── design.md
│           ├── review.md
│           ├── rollback.md
│           ├── tasks.md
│           └── handoff.md
└── changes/
    ├── import-goods-bugfix-phase-1-fetch/
    ├── import-goods-bugfix-phase-2-routing/
    ├── import-goods-bugfix-phase-3-cost/
    ├── import-goods-bugfix-phase-4-supplier-autofill/
    ├── import-goods-bugfix-phase-5-validation/
    ├── import-goods-bugfix-phase-6-polish/
    └── import-goods-bugfix-phase-7-verification/
```

Mỗi change folder chứa:
- `proposal.md` — intent, scope, ảnh hưởng
- `specs/<capability>/spec.md` — delta spec
- `design.md` — quyết định kỹ thuật, rủi ro
- `review.md` — checklist đối chiếu PLAN_REFINED
- `rollback.md` — backup/restore
- `tasks.md` — checklist thực hiện (dùng cho `/opsx:apply`)
- `handoff.md` — tóm tắt bàn giao phase

## Cách dùng trong Windsurf

Sau khi restart IDE (nếu cần), dùng slash commands:

```text
/opsx:apply import-goods-bugfix-phase-1-fetch
/opsx:archive import-goods-bugfix-phase-1-fetch
```

Hoặc dùng CLI tương đương:

```powershell
openspec instructions apply --change import-goods-bugfix-phase-1-fetch --json
openspec archive import-goods-bugfix-phase-1-fetch
```

Lưu ý:
- Theo thứ tự: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7.
- Sau khi `/opsx:archive`, delta specs của phase đó sẽ merge vào `openspec/specs/` (nếu có).
- Để validate: `openspec validate --all --json`.

## Các lệnh CLI hữu ích

```powershell
# Liệt kê tất cả changes
openspec list

# Validate toàn bộ
openspec validate --all --json

# Xem chi tiết một change
openspec show import-goods-bugfix-phase-1-fetch

# Kiểm tra schema
openspec schema validate import-goods-bugfix
```

## Nguyên tắc khi thực hiện

1. **Luôn bắt đầu bằng backup** — mỗi `tasks.md` có task 0.1 tạo backup.
2. **Chạy `npm run lint` sau mỗi sub-phase** — đã ghi trong tasks.
3. **Chạy `npm run build` sau mỗi phase lớn** — đã ghi trong tasks.
4. **Archive sau mỗi phase** — để specs SSOT luôn được cập nhật.
5. **Phase 3 (giá vốn) cần thận trọng** — test trên DB copy hoặc transaction rollback trước khi commit.

## Cách chia chat để tránh vượt 250K context

| Phase | Số chat khuyến nghị | Nội dung mỗi chat |
|---|---|---|
| **Phase 1 — Fetch server-side** | **2 chat** | Chat 1: 1a (suppliers & stats). Chat 2: 1b (product search) + 1c (cleanup). |
| **Phase 2 — Routing** | 1 chat | Toàn bộ 2a, 2b, 2c. Code ~176K. |
| **Phase 3 — Cost** | **3 chat** | Chat 1: 3a (backend migration). Chat 2: 3b (service layer). Chat 3: 3c (frontend + DB test). |
| **Phase 4 — Supplier + autofill** | 1 chat | Toàn bộ Phase 4. Code ~120K. |
| **Phase 5 — Validation** | **2 chat** | Chat 1: 5a (validation). Chat 2: 5b (receipt code by date). |
| **Phase 6 — Polish** | 1 chat | Toàn bộ Phase 6. Code ~165K. |
| **Phase 7 — Verification** | 1 chat | Chủ yếu chạy lint/build + test end-to-end. |

**Nguyên tắc chia nhỏ:** nếu 1 phase có code cần chạm > 100 KB, nên chia thành 2 chat. Nếu > 180 KB, chia thành 3 chat.

## Các bước lặp lại cho mỗi phase

1. **Tạo backup thủ công** (quan trọng vì project không có git):
   ```powershell
   Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "E:\App ban hàng\vietsale-pro-v7_backup_import_goods_bugfix_phase<X>_<YYYYMMDD_HHMMSS>" -Recurse
   ```
2. **Mở chat mới trong Windsurf.**
3. **Dán prompt mẫu** tương ứng với phase bên dưới.
4. **Để AI thực hiện.** AI sẽ tự đọc `PLAN_REFINED.md`, tìm đúng sub-phase, sửa code, đánh dấu task trong `tasks.md`.
5. **Kiểm tra sau khi AI báo xong:**
   ```powershell
   npm run lint
   ```
   Nếu chat này là **phần cuối cùng của phase**, thêm:
   ```powershell
   npm run build
   ```
6. **Nếu chat này là phần cuối của phase**, chạy lệnh archive:
   ```powershell
   openspec archive import-goods-bugfix-phase-X-<name>
   ```
   Ví dụ: `openspec archive import-goods-bugfix-phase-1-fetch`
7. **Lưu lại vị trí backup** và mở chat mới cho phần kế tiếp.

## Prompt mẫu cho từng phase

### Phase 1 — Fetch server-side data

**Option A: làm toàn bộ Phase 1 trong 1 chat (nếu context còn nhẹ)**

```text
Thực hiện Phase 1 — Fetch server-side data cho kế hoạch ImportGoods Bugfix.

Yêu cầu:
- Đọc docs/plans/import-goods-bugfix/PLAN_REFINED.md, thực hiện đầy đủ sub-phase 1a, 1b, 1c.
- Áp dụng OpenSpec change: `import-goods-bugfix-phase-1-fetch` (đọc tasks.md tại openspec/changes/import-goods-bugfix-phase-1-fetch/).
- Sub-phase 1a: thêm localSuppliers/localImportStats, fetch suppliers, cập nhật stat cards, truyền localSuppliers xuống SupplierSection và AdvancedFilterPanel.
- Sub-phase 1b: thêm localProducts, debounced server-side product search, truyền localProducts xuống ImportProductSearch/ImportItemsTable, đảm bảo addToImportList đọc từ productCache.
- Sub-phase 1c: grep toàn bộ `pages/ImportGoods.tsx` để xóa/guard `products.find`, `suppliers.find`, `importReceipts.reduce` trên prop rỗng; kiểm tra viewingReceipt dùng cache.
- Sau khi xong, chạy `npm run lint` và `npm run build`.
- Đánh dấu task trong openspec/changes/import-goods-bugfix-phase-1-fetch/tasks.md khi hoàn thành.
- Cuối cùng chạy `openspec archive import-goods-bugfix-phase-1-fetch`.
- Backup: lưu ở `E:\App ban hàng\vietsale-pro-v7_backup_import_goods_bugfix_phase_1_<YYYYMMDD_HHMMSS>`.
```

**Option B: chia nhỏ (khuyến nghị)**

**Chat 1 — 1a Suppliers & stats:**

```text
Thực hiện sub-phase 1a — Suppliers & stats cho history tab cho kế hoạch ImportGoods Bugfix.

Yêu cầu:
- Đọc docs/plans/import-goods-bugfix/PLAN_REFINED.md mục Phase 1a.
- Sửa `pages/ImportGoods.tsx`:
  - Thêm state `localSuppliers`, `localImportStats`, `isLoadingSuppliers`, `isLoadingStats`.
  - Mount-effect gọi `supabaseService.getSuppliers()` (hoặc tương đương), merge vào `localSuppliers` và `supplierCache`.
  - Sau `fetchReceipts` thành công, tính stat cards từ `totalReceiptCount` và `receiptList`.
  - Truyền `suppliers={localSuppliers}` cho `SupplierSection` và `AdvancedFilterPanel`.
  - Thay stat cards đang dùng `importReceipts` prop bằng `localImportStats`.
- Nếu service function chưa có, thêm vào `services/supabaseService.ts`.
- Sau khi xong, chạy `npm run lint`.
- Đánh dấu task trong openspec/changes/import-goods-bugfix-phase-1-fetch/tasks.md.
- Backup: `E:\App ban hàng\vietsale-pro-v7_backup_import_goods_bugfix_phase_1a_<YYYYMMDD_HHMMSS>`.
```

**Chat 2 — 1b Product search + 1c Cleanup:**

```text
Thực hiện sub-phase 1b và 1c — Server-side product search + dọn dẹp prop dependency cho kế hoạch ImportGoods Bugfix.

Yêu cầu:
- Đọc docs/plans/import-goods-bugfix/PLAN_REFINED.md mục Phase 1b và 1c.
- Sub-phase 1b:
  - Thêm state `localProducts`, `isLoadingProducts`, `productSearchRequestId` trong `pages/ImportGoods.tsx`.
  - Dùng `useDebounce(searchTerm, 300)` và gọi `supabaseService.searchProducts(term, 50)`.
  - Merge kết quả vào `productCache`, lưu `localProducts` để truyền xuống dropdown.
  - Truyền `products={localProducts}` vào `ImportProductSearch` và `ImportItemsTable`.
  - Đảm bảo `addToImportList` đọc product từ `productCache`.
- Sub-phase 1c:
  - Grep `pages/ImportGoods.tsx` để tìm `products.find`, `suppliers.find`, `importReceipts.reduce`.
  - Thay hoặc guard tất cả các chỗ dùng prop rỗng.
  - Cập nhật `viewingReceipt` để dùng cache thay vì prop.
  - Đánh dấu `handleCreateSupplier` nếu còn dùng prop rỗng để xử lý ở Phase 4.
- Sau khi xong, chạy `npm run lint` và `npm run build`.
- Đánh dấu task trong openspec/changes/import-goods-bugfix-phase-1-fetch/tasks.md.
- Cuối cùng chạy `openspec archive import-goods-bugfix-phase-1-fetch`.
- Backup: `E:\App ban hàng\vietsale-pro-v7_backup_import_goods_bugfix_phase_1b_1c_<YYYYMMDD_HHMMSS>`.
```

### Phase 2 — Routing `/import/create`

```text
Thực hiện Phase 2 — Routing `/import/create` cho kế hoạch ImportGoods Bugfix.

Yêu cầu:
- Đọc docs/plans/import-goods-bugfix/PLAN_REFINED.md mục Phase 2 (2a, 2b, 2c).
- Áp dụng OpenSpec change: `import-goods-bugfix-phase-2-routing`.
- Sub-phase 2a: trong `App.tsx`, thêm route `/import/create` render `<ImportGoods ... />`; giữ nguyên `/import` cho history.
- Sub-phase 2b: trong `pages/ImportGoods.tsx`, dùng `useLocation()` để khởi tạo `activeTab` (`/import` → history, `/import/create` → create); thay `setActiveTab` bằng `navigate`.
- Sub-phase 2c: trong `components/AppTopbar.tsx`, sửa active state để `/import` highlight khi ở `/import/create`; kiểm tra mobile menu nếu cần.
- Sau khi xong, chạy `npm run lint` và `npm run build`.
- Đánh dấu task trong openspec/changes/import-goods-bugfix-phase-2-routing/tasks.md.
- Cuối cùng chạy `openspec archive import-goods-bugfix-phase-2-routing`.
- Backup: `E:\App ban hàng\vietsale-pro-v7_backup_import_goods_bugfix_phase_2_<YYYYMMDD_HHMMSS>`.
```

### Phase 3 — Sửa giá vốn / `import_items.cost`

**Option A: làm toàn bộ trong 1 chat (chỉ khi context rất nhẹ)**

```text
Thực hiện Phase 3 — Sửa giá vốn / import_items.cost cho kế hoạch ImportGoods Bugfix.

Yêu cầu:
- Đọc docs/plans/import-goods-bugfix/PLAN_REFINED.md, thực hiện đầy đủ 3a, 3b, 3c.
- Áp dụng OpenSpec change: `import-goods-bugfix-phase-3-cost`.
- Sub-phase 3a: viết/deploy migration sửa `process_import_v2`, `delete_import_v2`, `update_import_v2` để `import_items.cost` = giá gốc, `products.cost`/`product_lots.cost` = giá vốn adjusted sau chiết khấu và ship. Test trên DB copy hoặc transaction rollback.
- Sub-phase 3b: cập nhật `services/supabaseService.ts` (`createImportReceipt`, `updateImportReceipt`, `mapImportReceiptFromDB`) và `types.ts` nếu cần thêm `adjustedCost`.
- Sub-phase 3c: cập nhật `pages/ImportGoods.tsx`, `ImportItemRow.tsx`, `ImportItemsTable.tsx` để hiển thị đúng giá gốc, thành tiền sau chiết khấu, tổng cần trả. Kiểm thử số liệu DB.
- Sau khi xong, chạy `npm run lint` và `npm run build`.
- Đánh dấu task trong openspec/changes/import-goods-bugfix-phase-3-cost/tasks.md.
- Cuối cùng chạy `openspec archive import-goods-bugfix-phase-3-cost`.
- Backup: `E:\App ban hàng\vietsale-pro-v7_backup_import_goods_bugfix_phase_3_<YYYYMMDD_HHMMSS>`.
```

**Option B: chia nhỏ (khuyến nghị)**

**Chat 1 — 3a Backend migration:**

```text
Thực hiện sub-phase 3a — Backend migration sửa giá vốn cho kế hoạch ImportGoods Bugfix.

Yêu cầu:
- Đọc docs/plans/import-goods-bugfix/PLAN_REFINED.md mục Phase 3a.
- Tạo file migration mới trong `archive/` (ví dụ `archive/migration_phase3a_import_cost_ssot.sql`).
- Sửa `process_import_v2`:
  - `import_items.cost` lưu giá gốc.
  - `import_items.discount` lưu chiết khấu dòng.
  - `products.cost`/`product_lots.cost` = giá vốn adjusted sau chiết khấu và ship phân bổ.
- Sửa `delete_import_v2` để hoàn tác giá vốn đúng.
- `update_import_v2` gọi delete + process nên tự đồng bộ.
- Kiểm thử trên DB bằng transaction + ROLLBACK trước khi commit.
- Sau khi xong, đánh dấu task trong openspec/changes/import-goods-bugfix-phase-3-cost/tasks.md.
- Backup: `E:\App ban hàng\vietsale-pro-v7_backup_import_goods_bugfix_phase_3a_<YYYYMMDD_HHMMSS>`.
```

**Chat 2 — 3b Service layer:**

```text
Thực hiện sub-phase 3b — Service layer & types mapping cho kế hoạch ImportGoods Bugfix.

Yêu cầu:
- Đọc docs/plans/import-goods-bugfix/PLAN_REFINED.md mục Phase 3b.
- Cập nhật `services/supabaseService.ts`:
  - `createImportReceipt` / `updateImportReceipt` truyền `cost` = giá gốc, `discount` = chiết khấu dòng.
  - `mapImportReceiptFromDB` map thêm `adjustedCost` nếu DB đã thêm cột.
- Cập nhật `types.ts` nếu cần thêm `adjustedCost` vào `ImportItemInput`.
- Không thay đổi công thức tính tiền hiển thị dòng: `lineTotal = max(0, qty * cost - discount)`.
- Sau khi xong, chạy `npm run lint`.
- Đánh dấu task trong openspec/changes/import-goods-bugfix-phase-3-cost/tasks.md.
- Backup: `E:\App ban hàng\vietsale-pro-v7_backup_import_goods_bugfix_phase_3b_<YYYYMMDD_HHMMSS>`.
```

**Chat 3 — 3c Frontend + DB verification:**

```text
Thực hiện sub-phase 3c — Frontend hiển thị & kiểm thử DB cho kế hoạch ImportGoods Bugfix.

Yêu cầu:
- Đọc docs/plans/import-goods-bugfix/PLAN_REFINED.md mục Phase 3c.
- Cập nhật `pages/ImportGoods.tsx`, `components/import-goods/ImportItemRow.tsx`, `components/import-goods/ImportItemsTable.tsx`:
  - `lineTotal = max(0, qty * cost - discount)`.
  - `TotalsSection` nhận `totalGoods` = `totalGoodsAfterLineDiscount`.
  - `totalWithShipping` tính từ `totalGoodsAfterLineDiscount`.
- Kiểm thử DB:
  - Tạo phiếu có chiết khấu dòng và phí ship.
  - Kiểm tra `import_items.cost` = giá gốc.
  - Kiểm tra `products.cost`/`product_lots.cost` = giá vốn BQGQ đúng.
  - Xóa phiếu → kiểm tra tồn kho và giá vốn hoàn tác đúng.
- Sau khi xong, chạy `npm run lint` và `npm run build`.
- Đánh dấu task trong openspec/changes/import-goods-bugfix-phase-3-cost/tasks.md.
- Cuối cùng chạy `openspec archive import-goods-bugfix-phase-3-cost`.
- Backup: `E:\App ban hàng\vietsale-pro-v7_backup_import_goods_bugfix_phase_3c_<YYYYMMDD_HHMMSS>`.
```

### Phase 4 — Mã NCC + auto-fill tiền trả

```text
Thực hiện Phase 4 — Sửa tạo mã NCC và auto-fill tiền trả cho kế hoạch ImportGoods Bugfix.

Yêu cầu:
- Đọc docs/plans/import-goods-bugfix/PLAN_REFINED.md mục Phase 4.
- Áp dụng OpenSpec change: `import-goods-bugfix-phase-4-supplier-autofill`.
- Tạo mã NCC an toàn:
  - Thay `suppliers` prop bằng `localSuppliers` (hoặc fetch toàn bộ) khi sinh mã NCC mới.
  - Sau khi tạo NCC thành công, thêm vào `localSuppliers` và `supplierCache`.
- Auto-fill tiền trả đúng:
  - Xóa `totalImportCost` / `totalWithShipping` cũ nếu còn sót.
  - Dùng `totalGoodsAfterLineDiscount` làm cơ sở.
  - Đảm bảo `TotalsSection` auto-fill `paidAmount = needToPay` khi user chưa chạm.
  - Công thức: `needToPay = max(0, totalGoodsAfterLineDiscount + shippingCost - discountTotal)`.
- Sau khi xong, chạy `npm run lint` và `npm run build`.
- Đánh dấu task trong openspec/changes/import-goods-bugfix-phase-4-supplier-autofill/tasks.md.
- Cuối cùng chạy `openspec archive import-goods-bugfix-phase-4-supplier-autofill`.
- Backup: `E:\App ban hàng\vietsale-pro-v7_backup_import_goods_bugfix_phase_4_<YYYYMMDD_HHMMSS>`.
```

### Phase 5 — Validation + mã phiếu theo ngày nhập

**Option A: làm toàn bộ Phase 5 trong 1 chat**

```text
Thực hiện Phase 5 — Validation và mã phiếu theo ngày nhập cho kế hoạch ImportGoods Bugfix.

Yêu cầu:
- Đọc docs/plans/import-goods-bugfix/PLAN_REFINED.md, thực hiện đầy đủ 5a và 5b.
- Áp dụng OpenSpec change: `import-goods-bugfix-phase-5-validation`.
- Sub-phase 5a:
  - Trong `App.tsx` `handleImport`, thêm validation:
    - `discountTotal < 0` → alert.
    - Trùng `invoiceNumber` (gọi `supabaseService.getImportReceiptByInvoiceNumber` hoặc RPC `check_invoice_number_exists`).
    - Trùng `receiptId` đã hoàn thành (gọi `supabaseService.getImportReceiptById`).
  - Thêm service function nếu chưa có.
- Sub-phase 5b:
  - Trong `pages/ImportGoods.tsx` `generateReceiptCode`, thay `new Date()` bằng `importDate`.
  - Gọi `getImportReceiptCountByDate` theo ngày đã chọn.
  - Cập nhật placeholder nếu cần.
- Sau khi xong, chạy `npm run lint` và `npm run build`.
- Đánh dấu task trong openspec/changes/import-goods-bugfix-phase-5-validation/tasks.md.
- Cuối cùng chạy `openspec archive import-goods-bugfix-phase-5-validation`.
- Backup: `E:\App ban hàng\vietsale-pro-v7_backup_import_goods_bugfix_phase_5_<YYYYMMDD_HHMMSS>`.
```

**Option B: chia nhỏ**

**Chat 1 — 5a Validation:**

```text
Thực hiện sub-phase 5a — Validation trong `handleImport` cho kế hoạch ImportGoods Bugfix.

Yêu cầu:
- Đọc docs/plans/import-goods-bugfix/PLAN_REFINED.md mục Phase 5a.
- Trong `App.tsx` `handleImport`:
  - Thêm `if (discountTotal < 0)` alert.
  - Kiểm tra `invoiceNumber` unique qua `supabaseService.getImportReceiptByInvoiceNumber` hoặc RPC `check_invoice_number_exists`.
  - Kiểm tra `receiptId` unique trước khi gọi RPC.
- Thêm service function nếu cần trong `services/supabaseService.ts`.
- Sau khi xong, chạy `npm run lint`.
- Đánh dấu task trong openspec/changes/import-goods-bugfix-phase-5-validation/tasks.md.
- Backup: `E:\App ban hàng\vietsale-pro-v7_backup_import_goods_bugfix_phase_5a_<YYYYMMDD_HHMMSS>`.
```

**Chat 2 — 5b Receipt code by date:**

```text
Thực hiện sub-phase 5b — Mã phiếu theo ngày nhập cho kế hoạch ImportGoods Bugfix.

Yêu cầu:
- Đọc docs/plans/import-goods-bugfix/PLAN_REFINED.md mục Phase 5b.
- Trong `pages/ImportGoods.tsx` `generateReceiptCode`:
  - Thay `new Date()` bằng `importDate`.
  - Gọi `getImportReceiptCountByDate` theo ngày đã chọn.
  - Cập nhật placeholder nếu cần.
- Sau khi xong, chạy `npm run lint` và `npm run build`.
- Đánh dấu task trong openspec/changes/import-goods-bugfix-phase-5-validation/tasks.md.
- Cuối cùng chạy `openspec archive import-goods-bugfix-phase-5-validation`.
- Backup: `E:\App ban hàng\vietsale-pro-v7_backup_import_goods_bugfix_phase_5b_<YYYYMMDD_HHMMSS>`.
```

### Phase 6 — Polish và xử lý lỗi xóa phiếu

```text
Thực hiện Phase 6 — Polish và xử lý lỗi xóa phiếu cho kế hoạch ImportGoods Bugfix.

Yêu cầu:
- Đọc docs/plans/import-goods-bugfix/PLAN_REFINED.md mục Phase 6.
- Áp dụng OpenSpec change: `import-goods-bugfix-phase-6-polish`.
- Xử lý lỗi xóa rõ ràng:
  - Trong `App.tsx` `handleDeleteImport`, parse message từ `delete_import_v2`:
    - "đã bán vượt quá số lượng nhập" → hiển thị tên sản phẩm + lý do.
    - "lô ... không đủ tồn kho" → hiển thị tên lô + sản phẩm.
    - Các lỗi khác → hiển thị message gốc.
  - Trong `ImportGoods.tsx` `handleDeleteClick`, đợi `onDeleteImport` xong mới gọi `fetchReceipts`.
- Cập nhật stats sau CRUD:
  - Sau `submitReceipt` thành công, gọi lại `fetchStats` (hoặc `fetchReceipts` đã cập nhật totalCount).
  - Sau `handleDeleteClick`, gọi `fetchStats`.
- Kiểm tra `product_lots.original_quantity` không cần sửa; ghi nhận hành vi chấp nhận được.
- Sau khi xong, chạy `npm run lint` và `npm run build`.
- Đánh dấu task trong openspec/changes/import-goods-bugfix-phase-6-polish/tasks.md.
- Cuối cùng chạy `openspec archive import-goods-bugfix-phase-6-polish`.
- Backup: `E:\App ban hàng\vietsale-pro-v7_backup_import_goods_bugfix_phase_6_<YYYYMMDD_HHMMSS>`.
```

### Phase 7 — Verification tổng thể

```text
Thực hiện Phase 7 — Verification tổng thể cho kế hoạch ImportGoods Bugfix.

Yêu cầu:
- Đọc docs/plans/import-goods-bugfix/PLAN_REFINED.md mục Phase 7.
- Áp dụng OpenSpec change: `import-goods-bugfix-phase-7-verification`.
- Chạy `npm run lint`.
- Chạy `npm run build`.
- Khởi động dev server (`npm run dev`) hoặc kiểm tra production build.
- Test end-to-end:
  - Tạo NCC mới từ form nhập hàng.
  - Tạo phiếu nhập có 2 sản phẩm, 1 có lô, 1 không lô.
  - Thêm chiết khấu dòng và phí ship.
  - Lưu tạm → mở lại sửa → Hoàn thành.
  - Kiểm tra tồn kho, giá vốn, công nợ NCC.
  - Xem chi tiết phiếu → xóa phiếu.
  - Kiểm tra tồn kho, giá vốn, công nợ NCC sau xóa đã hoàn tác.
- Kiểm tra routing:
  - `/import` → history.
  - `/import/create` → form create.
  - Back / F5 đúng.
- Kiểm tra báo cáo:
  - `get_inventory_report` giá trị tồn kho đúng.
  - `get_profit_report` / `get_sales_report` giá vốn đúng.
- Tạo backup cuối cùng.
- Cập nhật `AGENTS.md` với kết quả sub-phase.
- Đánh dấu task trong openspec/changes/import-goods-bugfix-phase-7-verification/tasks.md.
- Cuối cùng chạy `openspec archive import-goods-bugfix-phase-7-verification`.
- Backup: `E:\App ban hàng\vietsale-pro-v7_backup_import_goods_bugfix_phase_7_<YYYYMMDD_HHMMSS>`.
```
