# Kế hoạch sửa lỗi tính năng Nhập hàng (ImportGoods) — Phiên bản chia sub-phase

## Tổng quan
- **Dự án:** VietSale Pro v7
- **Tính năng:** Nhập hàng (ImportGoods)
- **Số lỗi cần sửa:** 8
- **Số phase gốc:** 7 → **chia thành 14 sub-phase**
- **Thời điểm lập kế hoạch:** 2026-07-02
- **Nguyên tắc:** Mỗi sub-phase tách biệt, có acceptance criteria riêng, backup trước sub-phase lớn, chạy `npm run lint` + `npm run build` sau mỗi sub-phase.

## Phân tích lượng context (ước tính) để quyết định chia sub-phase

Giới hạn context mỗi chat: **250K tokens**. Ước tính dựa trên số dòng và mức độ phức tạp của các file phải đọc/sửa trong 1 sub-phase:

| File | Dòng | Token ~ | Mô tả |
|------|------|---------|-------|
| `pages/ImportGoods.tsx` | 1,488 | ~67K | Component chính, cần đọc gần toàn bộ |
| `App.tsx` | ~2,000 | ~90K | Router + handlers, cần đọc nhiều đoạn |
| `services/supabaseService.ts` | ~2,500 | ~112K | Service layer, RPC wrappers |
| `components/import-goods/ImportProductSearch.tsx` | ~176 | ~8K | Tìm sản phẩm trong form |
| `components/import-goods/ImportItemsTable.tsx` | ~134 | ~6K | Bảng dòng nhập |
| `components/import-goods/ImportItemRow.tsx` | ~339 | ~15K | Dòng sản phẩm |
| `components/import-goods/ImportSidebar/SupplierSection.tsx` | ~359 | ~16K | Chọn/tạo NCC |
| `components/import-goods/ImportSidebar/TotalsSection.tsx` | ~221 | ~10K | Tổng tiền, tiền trả |
| `components/import-goods/ImportSidebar/ReceiptInfoSection.tsx` | ~122 | ~5K | Ngày, mã phiếu |
| `components/import-goods/ImportSidebar/ActionFooter.tsx` | ~95 | ~4K | Nút lưu/hoàn thành |
| `components/AdvancedFilterPanel.tsx` | ~349 | ~16K | Lọc phiếu nhập |
| `components/AppTopbar.tsx` | ~413 | ~19K | Menu active state |
| Backend RPC (`process_import_v2`, `delete_import_v2`, `update_import_v2`) | ~500 | ~20K | SQL migration phức tạp |

### Kết luận chia sub-phase

| Phase gốc | Tổng file/context ước tính | Cần chia? | Lý do |
|-----------|-----------------------------|-----------|-------|
| Phase 1 — Fetch server-side | ~225K file + ~40K conversation = **~265K** | ✅ Có | Chạm 6 file, sửa nhiều state/useEffect trong file 1,488 dòng |
| Phase 2 — Routing | ~176K file + ~30K conversation = **~206K** | ⚠️ Có thể chia nhỏ | Gần ngưỡng, chia để an toàn |
| Phase 3 — Giá vốn / cost | ~218K file + ~50K conversation = **~268K** | ✅ Có | Backend SQL phức tạp + service + frontend + kiểm thử DB |
| Phase 4 — Mã NCC + auto-fill | ~120K | ❌ Không | Vừa đủ trong 1 sub-phase |
| Phase 5 — Validation + mã phiếu | ~269K file + ~30K conversation = **~299K** | ✅ Có | Vượt ngưỡng rõ ràng |
| Phase 6 — Polish + lỗi xóa | ~165K | ❌ Không | Vừa đủ trong 1 sub-phase |
| Phase 7 — Verification | Không sửa code | ❌ Không | Là phase kiểm thử tổng thể |

### Mapping phase gốc → sub-phase mới

| Phase gốc | Sub-phase mới |
|-----------|---------------|
| Phase 1 | 1a, 1b, 1c |
| Phase 2 | 2a, 2b, 2c |
| Phase 3 | 3a, 3b, 3c |
| Phase 4 | 4 (giữ nguyên) |
| Phase 5 | 5a, 5b |
| Phase 6 | 6 (giữ nguyên) |
| Phase 7 | 7 (giữ nguyên) |

---

## Trạng thái hiện tại của ImportGoods (baseline để bám sát)

Một số cơ sở đã được dựng sẵn trong các phase trước (Phase 6 chung của dự án):
- `pages/ImportGoods.tsx` đã có `supplierCache`, `productCache`, `ensureSupplier`, `ensureProduct`.
- Danh sách phiếu nhập đã fetch server-side qua `filterImportReceiptsPaginated`.
- `totalGoodsAfterLineDiscount` đã được tính đúng (sau chiết khấu dòng).
- Tuy nhiên, **UI form vẫn đang truyền `products` prop vào `ImportProductSearch` / `ImportItemsTable`**, và `suppliers` prop vào `SupplierSection` / `AdvancedFilterPanel`.
- `totalWithShipping` và auto-fill `amountPaid` vẫn dùng `totalImportCost` (chưa trừ chiết khấu dòng).
- `generateReceiptCode` vẫn dùng `new Date()` thay vì `importDate`.
- `handleImport` chưa kiểm tra `discountTotal < 0`, trùng `invoiceNumber`, trùng `receiptId`.
- `handleCreateSupplier` vẫn dựa trên `suppliers` prop.
- URL vẫn là `/import`, chưa có `/import/create`.

---

## Phase 1 — Fetch server-side dữ liệu cho ImportGoods

### Phase 1a — Suppliers & stats cho history tab

#### Mục tiêu
`ImportGoods` có danh sách NCC và stat cards dựa trên dữ liệu server-side thay vì prop rỗng.

#### Files sửa
- `pages/ImportGoods.tsx`
- `services/supabaseService.ts` (nếu cần thêm `getSuppliers` hoặc `getImportStats`)
- Có thể cần RPC/helper `get_import_stats` trong DB

#### Chi tiết thực hiện
1. Thêm state:
   - `localSuppliers: Supplier[]`
   - `localImportStats`
   - `isLoadingSuppliers`, `isLoadingStats`
2. `useEffect` mount: gọi `supabaseService.getSuppliers()` (full load), merge vào `localSuppliers` và `supplierCache`.
   - Nếu `suppliers` prop có dữ liệu thì dùng prop, không thì dùng fetch.
3. `useEffect` sau mỗi lần `fetchReceipts` thành công: gọi `getImportStats` hoặc tính từ `totalReceiptCount` + `receiptList` để cập nhật stat cards.
   - Tổng phiếu = `totalReceiptCount`.
   - Tổng tiền hàng / ship / đã trả / công nợ = sum từ `receiptList` trong trang (hoặc RPC nếu cần đúng toàn bộ).
4. Cập nhật `SupplierSection` nhận `suppliers={localSuppliers}`.
5. Cập nhật `AdvancedFilterPanel` nhận `suppliers={localSuppliers}`.
6. Thay stat cards ở lịch sử dùng `localImportStats` / `totalReceiptCount` thay vì `importReceipts` prop.

#### Acceptance criteria
- [ ] Chọn được NCC từ dropdown.
- [ ] Stat cards ở tab history hiển thị đúng tổng phiếu / tổng tiền hàng / ship / đã trả / công nợ.
- [ ] Không còn `suppliers.find(...)` trên prop rỗng gây undefined.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.

#### Rủi ro
- Cao — nếu fetch lỗi, form tạo phiếu sẽ tê liệt. Cần loading/error state.

#### Rollback
- Khôi phục `pages/ImportGoods.tsx` từ backup.

---

### Phase 1b — Server-side search sản phẩm trong form

#### Mục tiêu
Tìm sản phẩm trong form tạo phiếu từ server-side thay vì prop `products` rỗng.

#### Files sửa
- `pages/ImportGoods.tsx`
- `components/import-goods/ImportProductSearch.tsx` (nếu cần điều chỉnh interface)
- `components/import-goods/ImportItemsTable.tsx`
- `services/supabaseService.ts` (nếu cần)

#### Chi tiết thực hiện
1. Thêm state:
   - `localProducts: Product[]`
   - `isLoadingProducts`
   - `productSearchRequestId` (tránh stale results)
2. Dùng `useDebounce(searchTerm, 300)`.
3. `useEffect` khi `debouncedTerm` thay đổi: gọi `supabaseService.searchProducts(term, 50)`.
   - Merge kết quả vào `productCache`.
   - Lưu `localProducts` để truyền xuống dropdown.
4. Truyền `products={localProducts}` vào `ImportProductSearch`.
5. Truyền `products={localProducts}` vào `ImportItemsTable` (nếu bảng cần tìm tên/mã/lô).
   - Hoặc truyền `productCache` / `getProductFromCache` helper.
6. Khi thêm sản phẩm vào bảng, `addToImportList` dùng product từ `productCache`.
7. Khi validate lô/HSD, `submitReceipt` dùng `productCache`.

#### Acceptance criteria
- [ ] Mở `/import`, chuyển sang tab create, tìm sản phẩm theo tên/mã/barcode → kết quả trả về từ server.
- [ ] Chọn sản phẩm → thêm vào bảng đúng tên, đơn vị, giá nhập gốc.
- [ ] Không còn `products.find(...)` trên prop rỗng gây undefined.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.

#### Rủi ro
- Trung bình — cần xử lý loading, error, và stale request id.

#### Rollback
- Khôi phục `pages/ImportGoods.tsx` và các file component đã sửa.

---

### Phase 1c — Dọn dẹp prop dependency và tích hợp

#### Mục tiêu
Đảm bảo `ImportGoods` không còn trông chờ `products`/`suppliers`/`importReceipts` prop cho chức năng cốt lõi; tích hợp 1a + 1b.

#### Files sửa
- `pages/ImportGoods.tsx`
- Có thể `App.tsx` (chỉ để cập nhật props nếu cần, không xóa để tránh ảnh hưởng các trang khác)

#### Chi tiết thực hiện
1. Kiểm tra toàn bộ file `ImportGoods.tsx`:
   - Không còn `products.find(...)` hoặc `suppliers.find(...)` trên prop rỗng.
   - Không còn `importReceipts.reduce(...)` cho stat cards.
2. Cập nhật các chỗ hiển thị chi tiết phiếu (`viewingReceipt`) để dùng cache thay vì prop.
3. Đảm bảo `handleCreateSupplier` (nếu vẫn dùng prop) đã được đánh dấu để sửa ở Phase 4.
4. Chạy `npm run lint` + `npm run build`.

#### Acceptance criteria
- [ ] Toàn bộ tab create hoạt động khi `products`/`suppliers`/`importReceipts` prop là `[]`.
- [ ] Toàn bộ tab history hiển thị đúng khi prop rỗng.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.

#### Rủi ro
- Trung bình — có thể bỏ sót một chỗ dùng prop.

#### Rollback
- Khôi phục `pages/ImportGoods.tsx`.

---

## Phase 2 — Routing `/import/create`

### Phase 2a — Thêm route `/import/create`

#### Mục tiêu
Thêm route mới vào router để `/import/create` render form create.

#### Files sửa
- `App.tsx`

#### Chi tiết thực hiện
1. Trong `sharedRoutes`, thêm:
   ```tsx
   <Route path="/import/create" element={
     <ImportGoods
       onImport={handleImport}
       onAddSupplier={handleAddSupplier}
       onDeleteImport={handleDeleteImport}
       onUpdateImport={handleUpdateImport}
     />
   } />
   ```
2. Giữ nguyên route `/import` cho tab history.
3. Đảm bảo cả desktop, tablet, mobile đều có route mới (do `sharedRoutes` dùng chung).

#### Acceptance criteria
- [ ] Truy cập `/import/create` hiển thị form tạo phiếu.
- [ ] Truy cập `/import` vẫn hiển thị tab history.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.

#### Rủi ro
- Trung bình — nested route conflict giữa `/import` và `/import/create`.

#### Rollback
- Revert `App.tsx`.

---

### Phase 2b — Detect tab từ URL trong ImportGoods

#### Mục tiêu
`ImportGoods` đọc URL để quyết định tab, thay vì dùng `activeTab` state nội bộ.

#### Files sửa
- `pages/ImportGoods.tsx`

#### Chi tiết thực hiện
1. Dùng `useLocation()` hoặc `window.location.pathname`.
2. Khởi tạo `activeTab`:
   - `/import` → `'history'`.
   - `/import/create` → `'create'`.
3. Thay tất cả `setActiveTab('create')` thành `navigate('/import/create')`.
4. Thay tất cả `setActiveTab('history')` / `handleCancelEdit` thành `navigate('/import')`.
5. Đảm bảo khi F5 ở `/import/create`, form create hiển thị đúng.
6. Kiểm tra `VoucherFormLayout`: `onBack` gọi `handleCancelEdit` → tự động navigate về `/import`.

#### Acceptance criteria
- [ ] Bấm "Nhập hàng" từ tab history → URL chuyển sang `/import/create`.
- [ ] Bấm "Quay lại" / Esc trong form → URL về `/import`.
- [ ] Lưu tạm / Hoàn thành thành công → URL về `/import`.
- [ ] F5 ở `/import/create` vẫn ở form create.
- [ ] F5 ở `/import` vẫn ở tab history.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.

#### Rủi ro
- Trung bình — cần xử lý đúng khi đang sửa phiếu (editingId).

#### Rollback
- Revert `pages/ImportGoods.tsx`.

---

### Phase 2c — Active state menu `/import/*`

#### Mục tiêu
Menu `/import` vẫn được highlight khi đang ở `/import/create`.

#### Files sửa
- `components/AppTopbar.tsx`
- Các component menu mobile tương tự (nếu có)

#### Chi tiết thực hiện
1. Sửa hàm `isActiveLink` hoặc logic so sánh path để dùng `startsWith('/import')`.
2. Kiểm tra mobile menu / BottomNav nếu cần.

#### Acceptance criteria
- [ ] Desktop sidebar highlight `/import` khi ở `/import/create`.
- [ ] Mobile menu highlight đúng mục Nhập hàng.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.

#### Rủi ro
- Thấp.

#### Rollback
- Revert `components/AppTopbar.tsx`.

---

## Phase 3 — Sửa giá vốn / `import_items.cost`

### Phase 3a — Backend migration sửa `process_import_v2` & `delete_import_v2`

#### Mục tiêu
Tách rõ **giá gốc**, **chiết khấu dòng**, **phí ship phân bổ**. `import_items.cost` lưu giá gốc; `products.cost` / `product_lots.cost` tính đúng giá vốn sau chiết khấu và ship phân bổ.

#### Files sửa
- `archive/migration_phase3a_fix_import_cost.sql` (hoặc tên theo quy ước: `archive/migration_phase7d_import_cost_ssot.sql`)
- Không sửa frontend trong sub-phase này.

#### Chi tiết thực hiện
1. **Trong `process_import_v2`:**
   - Tính `v_line_net := GREATEST(0, COALESCE(v_item.cost, 0) - v_discount)`.
   - Tính `v_adjusted_cost := ROUND(v_line_net * (1 + v_shipping_factor), 2)`.
   - `INSERT INTO import_items` cột `cost` lưu **giá gốc** `v_item.cost` (không phải `v_adjusted_cost`).
   - `import_items.discount` lưu `v_discount`.
   - Tùy chọn: thêm cột `import_items.adjusted_cost` lưu `v_adjusted_cost`.
   - `UPDATE products.cost` dùng `v_adjusted_cost` để tính BQGQ.
   - `product_lots.cost` tương tự dùng `v_adjusted_cost`.
   - Stock ledger ghi `v_adjusted_cost` làm unit cost (đúng vì đây là giá vốn thực tế).

2. **Trong `delete_import_v2`:**
   - `import_items.cost` bây giờ là giá gốc. Công thức trừ giá vốn `products.cost` và `product_lots.cost` vẫn dùng `v_item.cost` (giá gốc) vì cột đã lưu adjusted cũ. **Sau khi chuyển đổi, cần đảm bảo delete_import_v2 dùng đúng giá trị đã lưu để trừ.**
   - Nếu cột `cost` cũ đã lưu adjusted, migration cần backfill `import_items.cost` về giá gốc nếu có thể, hoặc ghi rõ giới hạn.

3. **Kiểm tra `update_import_v2`:**
   - Không cần sửa vì nó gọi `delete_import_v2` + `process_import_v2`.

4. **Migration cần ghi rõ:**
   - SSOT cho `process_import_v2`, `delete_import_v2`, `update_import_v2`.
   - Cảnh báo không chạy lại sau khi đã deploy.
   - Mục đích: `import_items.cost` = giá gốc, `import_items.discount` = chiết khấu dòng, `products.cost` / `product_lots.cost` = giá vốn adjusted sau chiết khấu và ship.

#### Acceptance criteria
- [ ] Kiểm thử trên DB copy hoặc production với transaction + `ROLLBACK` trước khi commit.
- [ ] `process_import_v2` insert `import_items.cost` = giá gốc user nhập.
- [ ] `process_import_v2` cập nhật `products.cost` / `product_lots.cost` đúng giá vốn adjusted.
- [ ] `delete_import_v2` hoàn tác giá vốn đúng.
- [ ] `update_import_v2` (draft→completed, completed→sửa) vẫn nhất quán.

#### Rủi ro
- **Cao** — ảnh hưởng toàn bộ giá vốn, báo cáo lợi nhuận, tồn kho. Phải test trên DB copy hoặc transaction rollback.

#### Rollback
- Restore DB từ backup.
- Revert file migration.

---

### Phase 3b — Service layer & types mapping

#### Mục tiêu
Đảm bảo frontend truyền đúng giá gốc, discount vào RPC; map thêm `adjusted_cost` nếu cần.

#### Files sửa
- `services/supabaseService.ts` (`createImportReceipt`, `updateImportReceipt`, `mapImportReceiptFromDB`)
- `types.ts` (nếu cần thêm `adjustedCost` vào `ImportItemInput`)

#### Chi tiết thực hiện
1. `createImportReceipt` / `updateImportReceipt` vẫn truyền `cost` = giá gốc, `discount` = chiết khấu dòng.
2. Nếu thêm cột `adjusted_cost` ở DB, cập nhật `mapImportReceiptFromDB` để map field.
3. Không thay đổi công thức tính tiền hiển thị dòng: `lineTotal = max(0, qty * cost - discount)`.

#### Acceptance criteria
- [ ] `createImportReceipt` / `updateImportReceipt` truyền đúng giá gốc và discount.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.

#### Rủi ro
- Thấp.

#### Rollback
- Revert `services/supabaseService.ts` và `types.ts`.

---

### Phase 3c — Frontend hiển thị & kiểm thử DB

#### Mục tiêu
Đảm bảo UI hiển thị đúng giá gốc, thành tiền sau chiết khấu, tổng cần trả; kiểm thử số liệu DB.

#### Files sửa
- `pages/ImportGoods.tsx`
- `components/import-goods/ImportItemRow.tsx`
- `components/import-goods/ImportItemsTable.tsx`

#### Chi tiết thực hiện
1. `ImportItemRow` giữ nguyên `lineTotal = max(0, qty * cost - discount)`.
2. `ImportItemsTable` hiển thị tổng tiền hàng sau chiết khấu dòng.
3. `TotalsSection` nhận `totalGoods` = `totalGoodsAfterLineDiscount` (đã có).
4. Đảm bảo `totalWithShipping` (nếu còn dùng) tính từ `totalGoodsAfterLineDiscount`.
5. Kiểm thử trên DB:
   - Tạo phiếu có chiết khấu dòng và phí ship.
   - Kiểm tra `import_items.cost` = giá gốc.
   - Kiểm tra `products.cost` / `product_lots.cost` = giá vốn BQGQ đúng.
   - Xóa phiếu → kiểm tra tồn kho và giá vốn hoàn tác đúng.

#### Acceptance criteria
- [ ] Thành tiền hiển thị trên UI: `qty * cost - discount`.
- [ ] Tổng cần trả: `totalGoodsAfterLineDiscount + shipping - discountTotal`.
- [ ] Tạo → xóa → tạo lại, kiểm tra tồn kho và giá vốn không lệch.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.

#### Rủi ro
- Cao — nếu DB migration 3a có lỗi, frontend không thể kiểm thử đúng.

#### Rollback
- Revert file frontend đã sửa.

---

## Phase 4 — Sửa tạo mã NCC và auto-fill tiền trả

#### Mục tiêu
- Tránh trùng mã NCC khi prop `suppliers` rỗng.
- Auto-fill tiền trả đúng bằng tổng cần trả NCC.

#### Files sửa
- `pages/ImportGoods.tsx`
- `services/supabaseService.ts` (nếu cần thêm `getSuppliers` hoặc dùng RPC mới)

#### Chi tiết thực hiện
1. **Tạo mã NCC an toàn:**
   - Thay vì dùng `suppliers` prop, gọi `supabaseService.getSuppliers()` (hoặc RPC mới) để lấy toàn bộ danh sách trước khi sinh mã.
   - Sau khi tạo NCC thành công, thêm NCC mới vào `localSuppliers` và `supplierCache` để không cần fetch lại.
   - Đảm bảo `onAddSupplier` từ `App.tsx` vẫn được gọi nhưng không cần trông chờ nó cập nhật global state.

2. **Auto-fill tiền trả đúng:**
   - Xóa `totalImportCost` / `totalWithShipping` cũ nếu còn sót.
   - Dùng `totalGoodsAfterLineDiscount` làm cơ sở.
   - `TotalsSection` đã tự auto-fill `paidAmount = needToPay` khi user chưa chạm. Kiểm tra không có `useEffect` cũ nào đè lên.
   - Đảm bảo khi `editingId` không tồn tại, `paidAmount` được auto-fill đúng.
   - Công thức đúng: `needToPay = max(0, totalGoodsAfterLineDiscount + shippingCost - discountTotal)`.

#### Acceptance criteria
- [ ] Tạo NCC mới khi `localSuppliers` rỗng → mã `NCC000001` không bị trùng (vì đã fetch toàn bộ từ DB).
- [ ] Tạo NCC mới khi đã có NCC → mã tăng đúng, không trùng.
- [ ] Thêm sản phẩm vào phiếu nhập có chiết khấu dòng → tiền trả auto-fill = `totalGoodsAfterLineDiscount + ship - discountTotal`.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.

#### Rủi ro
- Trung bình — cần kiểm tra race condition nếu 2 người cùng tạo NCC.

#### Rollback
- Revert `pages/ImportGoods.tsx`.

---

## Phase 5 — Validation và mã phiếu theo ngày nhập

### Phase 5a — Validation trong `handleImport`

#### Mục tiêu
Chặn dữ liệu không hợp lệ trước khi gọi RPC.

#### Files sửa
- `App.tsx` (`handleImport`)
- `services/supabaseService.ts` (nếu cần thêm `getImportReceiptByInvoiceNumber` / `getImportReceiptById`)

#### Chi tiết thực hiện
1. Thêm `if (discountTotal < 0) { alert('Giảm giá toàn phiếu không được âm.'); return; }`.
2. Kiểm tra `invoiceNumber` unique (theo supplier hoặc toàn bộ):
   ```ts
   const existing = await supabaseService.getImportReceiptByInvoiceNumber(invoiceNumber, supplierId);
   if (existing && existing.id !== receiptId) { alert('Số hóa đơn NCC đã tồn tại.'); return; }
   ```
   Hoặc dùng RPC `check_invoice_number_exists`.
3. Kiểm tra `receiptId` unique trước khi gọi RPC:
   ```ts
   if (receiptId) {
     const existing = await supabaseService.getImportReceiptById(receiptId);
     if (existing && existing.status !== 'draft') { alert('Mã phiếu đã tồn tại.'); return; }
   }
   ```
4. Giữ nguyên các validation số lượng, giá nhập, NCC đã có.

#### Acceptance criteria
- [ ] Nhập `discountTotal` âm → alert rõ ràng, không gọi RPC.
- [ ] Nhập trùng số hóa đơn NCC với phiếu cũ → alert, không gọi RPC.
- [ ] Tạo phiếu với mã đã tồn tại ở trạng thái hoàn thành → alert, không gọi RPC.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.

#### Rủi ro
- Trung bình — kiểm tra unique có thể gây chậm nếu không dùng index. Nên dùng RPC/Supabase `.eq` với index.

#### Rollback
- Revert `App.tsx` + `services/supabaseService.ts`.

---

### Phase 5b — Mã phiếu theo ngày nhập

#### Mục tiêu
Mã phiếu tự sinh theo ngày người dùng chọn.

#### Files sửa
- `pages/ImportGoods.tsx` (`generateReceiptCode`)
- `services/supabaseService.ts` (nếu cần `getImportReceiptCountByDate` đã tồn tại)

#### Chi tiết thực hiện
1. Thay `new Date()` bằng giá trị từ `importDate`:
   ```ts
   const d = new Date(importDate);
   const yyyy = d.getFullYear();
   const mm = String(d.getMonth() + 1).padStart(2, '0');
   const dd = String(d.getDate()).padStart(2, '0');
   ```
2. Gọi `getImportReceiptCountByDate` theo ngày đã chọn.
3. Cập nhật placeholder của input mã phiếu nếu cần.

#### Acceptance criteria
- [ ] Chọn ngày nhập là ngày hôm qua → mã phiếu tự sinh theo ngày hôm qua.
- [ ] F5 ở `/import/create` với ngày cũ → mã phiếu tính theo ngày đó.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.

#### Rủi ro
- Thấp.

#### Rollback
- Revert `pages/ImportGoods.tsx`.

---

## Phase 6 — Polish và xử lý lỗi xóa phiếu

#### Mục tiêu
- Hiển thị message lỗi cụ thể khi xóa phiếu thất bại.
- Cập nhật stats cards sau CRUD.
- Đảm bảo `product_lots.original_quantity` không bị giảm sai khi xóa phiếu.

#### Files sửa
- `pages/ImportGoods.tsx`
- `App.tsx` (`handleDeleteImport`)
- `archive/migration_phase6_import_delete_messages.sql` (nếu cần điều chỉnh backend)

#### Chi tiết thực hiện
1. **Xử lý lỗi xóa rõ ràng:**
   - Trong `App.tsx` `handleDeleteImport`, parse message từ `delete_import_v2`:
     - Nếu chứa "đã bán vượt quá số lượng nhập" → hiển thị: "Không thể xóa: sản phẩm X đã bán vượt quá lượng nhập. Vui lòng kiểm tra tồn kho."
     - Nếu chứa "lô ... không đủ tồn kho" → hiển thị tương tự.
     - Các lỗi khác → hiển thị message gốc.
   - Trong `ImportGoods.tsx` `handleDeleteClick`, đợi `onDeleteImport` hoàn thành rồi mới gọi `fetchReceipts` (hiện tại gọi đồng bộ có thể chạy trước khi xóa xong).

2. **Cập nhật stats sau CRUD:**
   - Sau `submitReceipt` thành công, gọi lại `fetchStats` (hoặc dựa vào `fetchReceipts` đã cập nhật totalCount).
   - Sau `handleDeleteClick`, gọi `fetchStats`.

3. **Kiểm tra `original_quantity` trong `product_lots`:**
   - `process_import_v2` insert lô với `original_quantity = v_item.quantity`.
   - `delete_import_v2` khi trừ lô đến 0 thì xóa lô — không cần sửa `original_quantity`.
   - Kiểm tra tính đúng đắn: nếu cùng lô được nhập nhiều lần, `original_quantity` của lần đầu có thể bị đè. Đây là hành vi chấp nhận được nếu `product_lots` chỉ là snapshot tồn kho; không cần sửa.

#### Acceptance criteria
- [ ] Thử xóa phiếu nhập mà sản phẩm đã bán hết → hiển thị message rõ ràng tên sản phẩm và lý do.
- [ ] Thử xóa phiếu nhập có lô đã bán hết → message rõ ràng tên lô và sản phẩm.
- [ ] Sau khi tạo/xóa phiếu, stats cards cập nhật đúng.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.

#### Rủi ro
- Thấp.

#### Rollback
- Revert file liên quan.

---

## Phase 7 — Verification tổng thể

#### Mục tiêu
Chạy kiểm thử toàn diện: lint, build, end-to-end, kiểm tra số liệu kho / công nợ / báo cáo.

#### Chi tiết thực hiện
1. Chạy `npm run lint`.
2. Chạy `npm run build`.
3. Khởi động dev server (`npm run dev`) hoặc kiểm tra production build.
4. Test end-to-end:
   - Tạo NCC mới từ form nhập hàng.
   - Tạo phiếu nhập có 2 sản phẩm, 1 có lô, 1 không lô.
   - Thêm chiết khấu dòng và phí ship.
   - Lưu tạm → mở lại sửa → Hoàn thành.
   - Kiểm tra tồn kho, giá vốn, công nợ NCC.
   - Xem chi tiết phiếu → xóa phiếu.
   - Kiểm tra tồn kho, giá vốn, công nợ NCC sau xóa đã hoàn tác.
5. Kiểm tra routing:
   - `/import` → history.
   - `/import/create` → form create.
   - Back / F5 đúng.
6. Kiểm tra báo cáo:
   - `get_inventory_report` giá trị tồn kho đúng.
   - `get_profit_report` / `get_sales_report` giá vốn đúng (sau khi đã có đơn hàng bán sản phẩm vừa nhập).
7. Tạo backup cuối cùng.
8. Cập nhật `AGENTS.md` với kết quả sub-phase.

#### Acceptance criteria
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.
- [ ] Toàn bộ luồng tạo/sửa/xóa phiếu nhập hoạt động.
- [ ] Tồn kho, giá vốn, công nợ NCC nhất quán sau CRUD.
- [ ] URL `/import/create` hoạt động đúng.
- [ ] Message lỗi xóa phiếu rõ ràng.
- [ ] Backup cuối cùng được tạo.

---

## Lưu trữ migration

- Theo thông báo của user, tất cả các file migration đã tạo nằm trong `C:\Users\SUACAUBA\Downloads\Project\archive`.
- File migration cho sub-phase 3a (sửa giá vốn) nên được tạo mới trong `archive/` với tên gợi ý:
  - `archive/migration_phase3a_import_cost_ssot.sql`
  - hoặc `archive/migration_phaseX_fix_import_items_cost.sql`
- File migration cần ghi rõ:
  - SSOT cho `process_import_v2`, `delete_import_v2`, `update_import_v2`.
  - Cảnh báo không chạy lại sau khi đã deploy.
  - Mục đích: `import_items.cost` = giá gốc, `import_items.discount` = chiết khấu dòng, `products.cost` / `product_lots.cost` = giá vốn adjusted sau chiết khấu và ship.

---

## Thứ tự khuyến nghị

1. **Phase 1a** — Fetch suppliers & stats.
2. **Phase 1b** — Server-side product search.
3. **Phase 1c** — Dọn dẹp prop dependency.
4. **Phase 2a** — Route `/import/create`.
5. **Phase 2b** — Detect tab from URL.
6. **Phase 2c** — Menu active state.
7. **Phase 3a** — Backend migration cost (quan trọng nhất, cần test DB).
8. **Phase 3b** — Service layer mapping.
9. **Phase 3c** — Frontend display & DB verification.
10. **Phase 4** — Mã NCC + auto-fill tiền trả.
11. **Phase 5a** — Validation trong `handleImport`.
12. **Phase 5b** — Mã phiếu theo ngày nhập.
13. **Phase 6** — Polish + message lỗi xóa.
14. **Phase 7** — Verification tổng thể.

---

## Ghi chú đặc biệt

- **Sub-phase 3a cần thận trọng nhất** vì ảnh hưởng giá vốn toàn hệ thống. Nên thực hiện trên DB copy nếu có; nếu không có DB copy thì chạy trong transaction với `ROLLBACK` để kiểm tra trước.
- **Sub-phase 1a và 1b** có thể hoán đổi thứ tự, nhưng phải hoàn thành cả hai trước 1c.
- **Sub-phase 5a** cần service function để kiểm tra unique. Nếu chưa có, tạo thêm trong `services/supabaseService.ts` hoặc viết RPC `check_invoice_number_exists`.
- Mỗi sub-phase kết thúc bằng `npm run lint` + `npm run build` (nếu có thay đổi code) và backup khi cần.
