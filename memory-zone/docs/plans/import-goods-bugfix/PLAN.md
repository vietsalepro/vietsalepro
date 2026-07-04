# Kế hoạch sửa lỗi tính năng Nhập hàng (ImportGoods) — 7 phase

## Tổng quan
- **Dự án:** VietSale Pro v7
- **Tính năng:** Nhập hàng (ImportGoods)
- **Số lỗi cần sửa:** 8
- **Số phase:** 7
- **Thời điểm lập kế hoạch:** 2026-07-02
- **Nguyên tắc:** Mỗi phase tách biệt, có acceptance criteria riêng, backup trước mỗi phase lớn, và chạy `npm run lint` sau mỗi phase.

## Danh sách 8 lỗi / lỗ hổng

| # | Lỗi | Mức độ | File / khu vực chính |
|---|-----|--------|----------------------|
| 1 | `ImportGoods` không còn nhận được `products`, `suppliers`, `importReceipts` từ `App.tsx` → form tạo phiếu bị tê liệt (không tìm được sản phẩm, không chọn được NCC, stats card không có dữ liệu) | Cao | `App.tsx` props, `pages/ImportGoods.tsx` |
| 2 | `import_items.cost` lưu **adjusted cost** (`(cost - discount) * (1 + shipping_factor)`) thay vì giá gốc. Điều này làm sai lệch tổng tiền dòng, giá vốn BQGQ, và COGS cho bán hàng. | Cao | Backend RPC `process_import_v2`, frontend hiển thị |
| 3 | Tạo mã NCC tự động trong `handleCreateSupplier` dựa trên prop `suppliers` (đang rỗng) → có thể sinh trùng `NCC000001` và lỗi unique constraint. | Cao | `pages/ImportGoods.tsx` |
| 4 | `totalImportCost` tính tổng chưa trừ chiết khấu dòng, dẫn đến auto-fill `amountPaid` cao hơn thực tế cần trả. | Trung bình | `pages/ImportGoods.tsx` |
| 5 | `generateReceiptCode` dùng `new Date()` thay vì `importDate` → mã phiếu không khớp ngày người dùng chọn. | Trung bình | `pages/ImportGoods.tsx` |
| 6 | `handleImport` trong `App.tsx` thiếu validation: `discountTotal >= 0`, kiểm tra trùng `invoiceNumber`, kiểm tra trùng `receiptId`. | Trung bình | `App.tsx` |
| 7 | Xóa phiếu nhập thất bại (ví dụ tồn kho không đủ) chỉ hiển thị generic message — không rõ nguyên nhân. | Thấp | `pages/ImportGoods.tsx`, `App.tsx` |
| 8 | Nút "Nhập hàng" chỉ đổi `activeTab` nội bộ, URL không chuyển sang `/import/create` như thiết kế ban đầu. | Trung bình | `App.tsx`, `pages/ImportGoods.tsx`, `components/AppTopbar.tsx` |

## Nguyên tắc thực hiện
1. Không overlap nghiệp vụ giữa các phase.
2. Backup toàn bộ project trước phase lớn (1, 2, 3, 7).
3. Sau mỗi phase chạy `npm run lint` và `npm run build` nếu có thay đổi code.
4. Phase 3 (backend) phải kiểm thử trên DB copy hoặc production với transaction + rollback trước khi commit.
5. Mỗi phase kết thúc bằng checklist **acceptance criteria** — chỉ sang phase sau khi đã PASS.

## Phase 1 — Fetch server-side dữ liệu cho ImportGoods

### Mục tiêu
`ImportGoods` tự động lấy `products`, `suppliers`, `importReceipts` summary từ server thay vì trông chờ props đang rỗng.

### Files sửa
- `pages/ImportGoods.tsx`
- `services/supabaseService.ts` (nếu cần thêm hàm mới)
- `App.tsx` (có thể giữ nguyên props, không xóa để tránh ảnh hưởng các trang khác)

### Chi tiết thực hiện
1. Thêm state trong `ImportGoods`:
   - `localProducts: Product[]` — kết quả tìm kiếm sản phẩm server-side.
   - `localSuppliers: Supplier[]` — toàn bộ danh sách NCC cần cho dropdown/lọc.
   - `localImportStats` — dùng cho 5 stat cards ở tab history.
   - `productCache: Map<string, Product>` — cache để tìm mã, tên, lô, validate.
   - `isLoadingSuppliers`, `isLoadingProducts`, `isLoadingStats`.

2. Thêm `useEffect` fetch suppliers:
   - Gọi `supabaseService.getSuppliers()` (full-load) khi component mount — lý do: `SupplierSection` cần search dropdown, và tạo mã NCC cần toàn bộ danh sách.
   - Cache vào `supplierCache` và `localSuppliers`.
   - Nếu `suppliers` prop từ `App.tsx` có dữ liệu thì dùng prop, nếu không thì dùng kết quả fetch.

3. Thêm server-side search products:
   - Tạo pattern giống `DisposalForm`: `useDebounce(searchTerm, 300)`, `useEffect` gọi `supabaseService.searchProducts(term, 50)`.
   - Kết quả merge vào `productCache` và `localProducts`.
   - `ImportProductSearch` nhận prop `products={localProducts}` thay vì prop từ `App.tsx`.
   - Khi thêm sản phẩm vào bảng, `ImportItemsTable` tìm product trong `productCache`.

4. Thêm `useEffect` fetch stats cho history tab:
   - Gọi `supabaseService.getImportStats(fromDate, toDate)` hoặc `filterImportReceiptsPaginated(1, 1000, '', {fromDate, toDate})` để lấy tổng phiếu/tổng tiền/tổng ship/tổng đã trả/tổng nợ.
   - Cập nhật sau mỗi lần `fetchReceipts` thành công để stat cards đồng bộ.

5. Cập nhật `SupplierSection`:
   - Nhận `suppliers={localSuppliers}` thay vì prop từ `App.tsx`.
   - Giữ nguyên logic search dropdown.

6. Cập nhật `AdvancedFilterPanel`:
   - Nhận `suppliers={localSuppliers}` để lọc theo NCC.

### Acceptance criteria
- [ ] Mở `/import`, chuyển sang tab create, tìm sản phẩm theo tên/mã/barcode → kết quả trả về từ server.
- [ ] Chọn được NCC từ dropdown.
- [ ] Stat cards ở tab history hiển thị đúng tổng phiếu / tổng tiền hàng / ship / đã trả / công nợ.
- [ ] Không còn `products.find(...)` hoặc `suppliers.find(...)` trên prop rỗng gây undefined.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.

### Rủi ro
- Cao — nếu fetch lỗi, form tạo phiếu sẽ vẫn tê liệt. Cần xử lý loading/error state.

### Rollback
- Khôi phục `pages/ImportGoods.tsx` từ backup.

---

## Phase 2 — Routing `/import/create`

### Mục tiêu
Khi bấm "Nhập hàng", URL chuyển sang `/import/create`; khi bấm back / lưu xong, URL về `/import`.

### Files sửa
- `App.tsx`
- `pages/ImportGoods.tsx`
- `components/AppTopbar.tsx` (nếu cần cập nhật active state)
- `vite.config.ts` (nếu cần thêm chunk, ít khả năng)

### Chi tiết thực hiện
1. Trong `App.tsx`:
   - Thêm route `<Route path="/import/create" element={<ImportGoods ... />} />` trong `sharedRoutes`.
   - Giữ nguyên route `/import` cho tab history.
   - Đảm bảo cả desktop, tablet, mobile đều có route mới (do `sharedRoutes` được dùng chung).

2. Trong `ImportGoods.tsx`:
   - Thay `activeTab` state khởi tạo bằng cách detect từ `window.location.pathname` hoặc `useLocation()`:
     - `/import` → `activeTab = 'history'`.
     - `/import/create` → `activeTab = 'create'`.
   - Thay tất cả `setActiveTab('create')` thành `navigate('/import/create')`.
   - Thay tất cả `setActiveTab('history')` / `handleCancelEdit` thành `navigate('/import')`.
   - Đảm báo khi F5 ở `/import/create`, form create hiển thị đúng.

3. Kiểm tra `VoucherFormLayout`:
   - `onBack` của `VoucherFormLayout` đã gọi `handleCancelEdit` → sẽ tự động navigate về `/import` sau khi sửa.

4. Cập nhật `AppTopbar.tsx` nếu cần:
   - Active state của menu `/import` vẫn đúng khi đang ở `/import/create` (dùng `startsWith('/import')`).

### Acceptance criteria
- [ ] Bấm nút "Nhập hàng" từ tab history → URL chuyển sang `/import/create`.
- [ ] Bấm "Quay lại" / Esc / Back trong form → URL về `/import`.
- [ ] Lưu tạm / Hoàn thành thành công → URL về `/import` và danh sách refresh.
- [ ] F5 ở `/import/create` vẫn ở form create.
- [ ] F5 ở `/import` vẫn ở tab history.
- [ ] Mobile menu vẫn highlight đúng mục Nhập hàng.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.

### Rủi ro
- Trung bình — cần đảm bảo không xuất hiện nested route conflict giữa `/import` và `/import/create`.

### Rollback
- Revert `App.tsx` + `pages/ImportGoods.tsx`.

---

## Phase 3 — Sửa giá vốn / `import_items.cost`

### Mục tiêu
Tách rõ **giá gốc**, **chiết khấu dòng**, **phí ship phân bổ**. `import_items.cost` lưu giá gốc; `products.cost` / `product_lots.cost` tính đúng giá vốn sau chiết khấu và ship phân bổ.

### Files sửa
- `archive/migration_phaseX_fix_import_cost.sql` (mới) — hoặc tên cụ thể theo quy ước, ví dụ `archive/migration_phase7d_import_cost_ssot.sql`.
- `services/supabaseService.ts` (nếu cần map thêm `unit_cost` / `adjusted_cost`)
- `pages/ImportGoods.tsx`, `components/import-goods/ImportItemRow.tsx`, `components/import-goods/ImportItemsTable.tsx` (hiển thị)
- `App.tsx` (nếu cần truyền thêm field)

### Chi tiết thực hiện
1. **Backend — `process_import_v2`:**
   - Thay đổi cách tính `v_adjusted_cost`:
     ```sql
     v_line_net := GREATEST(0, COALESCE(v_item.cost, 0) - v_discount);
     v_adjusted_cost := ROUND(v_line_net * (1 + v_shipping_factor), 2);
     ```
   - `INSERT INTO import_items` cột `cost` vẫn lưu **giá gốc** `v_item.cost` (không phải adjusted).
   - `import_items.discount` lưu `v_discount`.
   - Tùy chọn: thêm cột `import_items.adjusted_cost` lưu `v_adjusted_cost` để dễ truy vấn báo cáo.
   - `UPDATE products` tính `v_new_cost` dùng `v_adjusted_cost`:
     ```sql
     v_new_cost := ROUND(((v_existing_qty * v_existing_cost) + (v_item.quantity * v_adjusted_cost)) / v_new_qty, 2);
     ```
   - Tương tự cho `product_lots.cost`.
   - Stock ledger vẫn ghi `v_adjusted_cost` làm unit cost (đúng vì đây là giá vốn thực tế).

2. **Backend — `delete_import_v2`:**
   - Khi hoàn tác, `import_items.cost` bây giờ là giá gốc. Công thức trừ giá vốn `products.cost` và `product_lots.cost` vẫn dùng `v_item.cost` (vì cột đã lưu adjusted cũ). **Sau khi chuyển đổi, cần đảm bảo delete_import_v2 dùng đúng giá trị đã lưu để trừ.**
   - Nếu cột `cost` cũ đã lưu adjusted, sau migration historical data có thể không đồng nhất. Giải pháp: migration vừa sửa công thức, vừa backfill `import_items.cost` về giá gốc từ dữ liệu cũ nếu có thể, hoặc ghi rõ đây là giới hạn (nên test trên copy).

3. **Backend — `update_import_v2`:**
   - Không cần sửa vì nó gọi `delete_import_v2` + `process_import_v2`.

4. **Frontend — hiển thị:**
   - `ImportItemRow` giữ nguyên công thức `lineTotal = max(0, qty * cost - discount)`.
   - `ImportItemsTable` hiển thị tổng tiền hàng sau chiết khấu dòng (đã đúng).
   - `TotalsSection` nhận `totalGoods` = tổng sau chiết khấu dòng (đã có `totalGoodsAfterLineDiscount`).
   - Không cần thay đổi nhiều UI vì hiển thị line total vẫn dùng `cost` và `discount`.

5. **Kiểm tra báo cáo:**
   - `get_inventory_report` dùng `product_lots.cost` và `products.cost` → đã đúng vì giá vốn được cập nhật bằng `adjusted_cost`.
   - `get_profit_report` / `get_sales_report` dùng `order_items.cost` (snapshot lúc bán) — snapshot này lấy từ `product_lots.cost` / `products.cost` → đã đúng vì giá vốn được cập nhật đúng.

### Acceptance criteria
- [ ] Tạo phiếu nhập có chiết khấu dòng và phí ship → `import_items.cost` trong DB bằng giá gốc user nhập.
- [ ] `import_items.discount` lưu đúng chiết khấu dòng.
- [ ] `products.cost` / `product_lots.cost` sau nhập bằng giá vốn BQGQ đúng (đã bao gồm chiết khấu và ship phân bổ).
- [ ] Thành tiền hiển thị trên UI: `qty * cost - discount`.
- [ ] Tổng cần trả: `totalGoodsAfterLineDiscount + shipping - discountTotal`.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.
- [ ] Kiểm thử trên DB copy: tạo → xóa → tạo lại, kiểm tra tồn kho và giá vốn không lệch.

### Rủi ro
- **Cao** — ảnh hưởng toàn bộ giá vốn, báo cáo lợi nhuận, tồn kho. Nếu historical `import_items.cost` đã lưu adjusted, cần chuyển đổi dữ liệu hoặc chấp nhận khoảng thời gian chuyển tiếp.

### Rollback
- Restore DB từ backup.
- Revert file migration mới.
- Revert các file frontend đã sửa.

---

## Phase 4 — Sửa tạo mã NCC và auto-fill tiền trả

### Mục tiêu
- Tránh trùng mã NCC khi prop `suppliers` rỗng.
- Auto-fill tiền trả đúng bằng tổng cần trả NCC.

### Files sửa
- `pages/ImportGoods.tsx`
- `services/supabaseService.ts` (nếu cần thêm `getMaxSupplierCode` hoặc dùng `getSuppliers`)

### Chi tiết thực hiện
1. **Tạo mã NCC an toàn:**
   - Thay vì dùng `suppliers` prop, gọi `supabaseService.getSuppliers()` (hoặc RPC mới) để lấy toàn bộ danh sách trước khi sinh mã.
   - Sau khi tạo NCC thành công, thêm NCC mới vào `localSuppliers` và `supplierCache` để không cần fetch lại.
   - Đảm bảo `onAddSupplier` từ `App.tsx` vẫn được gọi nhưng không cần trông chờ nó cập nhật global state.

2. **Auto-fill tiền trả đúng:**
   - Xóa `totalImportCost` / `totalWithShipping` cũ nếu còn sót.
   - Dùng `totalGoodsAfterLineDiscount` (đã có) làm cơ sở.
   - `TotalsSection` đã tự auto-fill `paidAmount = needToPay` khi user chưa chạm. Kiểm tra lại không có `useEffect` cũ nào đè lên.
   - Nếu cần, đảm bảo khi `editingId` không tồn tại, `paidAmount` được auto-fill đúng.

### Acceptance criteria
- [ ] Tạo NCC mới khi `localSuppliers` rỗng → mã `NCC000001` không bị trùng (vì đã fetch toàn bộ từ DB).
- [ ] Tạo NCC mới khi đã có NCC → mã tăng đúng, không trùng.
- [ ] Thêm sản phẩm vào phiếu nhập có chiết khấu dòng → tiền trả auto-fill = `totalGoodsAfterLineDiscount + ship - discountTotal`.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.

### Rủi ro
- Trung bình — cần kiểm tra race condition nếu 2 người cùng tạo NCC.

### Rollback
- Revert `pages/ImportGoods.tsx`.

---

## Phase 5 — Validation và mã phiếu theo ngày nhập

### Mục tiêu
- Chặn dữ liệu không hợp lệ trước khi gọi RPC.
- Mã phiếu tự sinh theo ngày người dùng chọn.

### Files sửa
- `App.tsx` (`handleImport`)
- `pages/ImportGoods.tsx` (`generateReceiptCode`)
- `services/supabaseService.ts` (nếu cần thêm kiểm tra unique)

### Chi tiết thực hiện
1. **Validation trong `handleImport`:**
   - Thêm `if (discountTotal < 0) { alert('Giảm giá toàn phiếu không được âm.'); return; }`.
   - Kiểm tra `invoiceNumber` unique (theo supplier hoặc toàn bộ):
     ```ts
     const existing = await supabaseService.getImportReceiptByInvoiceNumber(invoiceNumber, supplierId);
     if (existing && existing.id !== receiptId) { alert('Số hóa đơn NCC đã tồn tại.'); return; }
     ```
     Hoặc dùng RPC `check_invoice_number_exists`.
   - Kiểm tra `receiptId` unique trước khi gọi RPC:
     ```ts
     if (receiptId) {
       const existing = await supabaseService.getImportReceiptById(receiptId);
       if (existing && existing.status !== 'draft') { alert('Mã phiếu đã tồn tại.'); return; }
     }
     ```
   - Giữ nguyên các validation số lượng, giá nhập, NCC đã có.

2. **Sửa `generateReceiptCode`:**
   - Thay `new Date()` bằng giá trị từ `importDate`:
     ```ts
     const d = new Date(importDate);
     const yyyy = d.getFullYear();
     const mm = String(d.getMonth() + 1).padStart(2, '0');
     const dd = String(d.getDate()).padStart(2, '0');
     ```
   - Gọi `getImportReceiptCountByDate` theo ngày đã chọn.
   - Cập nhật placeholder của input mã phiếu nếu cần.

### Acceptance criteria
- [ ] Nhập `discountTotal` âm → alert rõ ràng, không gọi RPC.
- [ ] Nhập trùng số hóa đơn NCC với phiếu cũ → alert, không gọi RPC.
- [ ] Tạo phiếu với mã đã tồn tại ở trạng thái hoàn thành → alert, không gọi RPC.
- [ ] Chọn ngày nhập là ngày hôm qua → mã phiếu tự sinh theo ngày hôm qua.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.

### Rủi ro
- Trung bình — kiểm tra unique có thể gây chậm nếu không dùng index. Nên dùng RPC/Supabase `.eq` với index.

### Rollback
- Revert `App.tsx` + `pages/ImportGoods.tsx`.

---

## Phase 6 — Polish và xử lý lỗi xóa phiếu

### Mục tiêu
- Hiển thị message lỗi cụ thể khi xóa phiếu thất bại.
- Cập nhật stats cards sau CRUD.
- Đảm bảo `product_lots.original_quantity` không bị giảm sai khi xóa phiếu.

### Files sửa
- `pages/ImportGoods.tsx`
- `App.tsx` (nếu cần bắt message từ RPC)
- `archive/migration_phaseX_import_delete_messages.sql` (nếu cần điều chỉnh backend)

### Chi tiết thực hiện
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

### Acceptance criteria
- [ ] Thử xóa phiếu nhập mà sản phẩm đã bán hết → hiển thị message rõ ràng tên sản phẩm và lý do.
- [ ] Thử xóa phiếu nhập có lô đã bán hết → message rõ ràng tên lô và sản phẩm.
- [ ] Sau khi tạo/xóa phiếu, stats cards cập nhật đúng.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.

### Rủi ro
- Thấp.

### Rollback
- Revert file liên quan.

---

## Phase 7 — Verification tổng thể

### Mục tiêu
Chạy kiểm thử toàn diện: lint, build, end-to-end, kiểm tra số liệu kho / công nợ / báo cáo.

### Chi tiết thực hiện
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
8. Cập nhật `AGENTS.md` với kết quả phase.

### Acceptance criteria
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
- File migration cho Phase 3 (sửa giá vốn) nên được tạo mới trong `archive/` với tên gợi ý:
  - `archive/migration_phase7d_import_cost_ssot.sql`
  - hoặc `archive/migration_phaseX_fix_import_items_cost.sql`
- File migration cần ghi rõ:
  - SSOT cho `process_import_v2`, `delete_import_v2`, `update_import_v2`.
  - Cảnh báo không chạy lại sau khi đã deploy.
  - Mục đích: `import_items.cost` = giá gốc, `import_items.discount` = chiết khấu dòng, `products.cost` / `product_lots.cost` = giá vốn adjusted sau chiết khấu và ship.

## Thứ tự khuyến nghị

1. **Phase 1** — Fetch server-side data (làm form hoạt động trở lại).
2. **Phase 2** — Routing `/import/create`.
3. **Phase 3** — Sửa giá vốn / `import_items.cost`.
4. **Phase 4** — Mã NCC + auto-fill tiền trả.
5. **Phase 5** — Validation + mã phiếu theo ngày.
6. **Phase 6** — Polish + message lỗi xóa.
7. **Phase 7** — Verification tổng thể.

## Ghi chú đặc biệt

- **Phase 3 cần thận trọng nhất** vì ảnh hưởng giá vốn toàn hệ thống. Nên thực hiện trên DB copy nếu có; nếu không có DB copy thì chạy trong transaction với `ROLLBACK` để kiểm tra trước.
- **Phase 1 và Phase 2 có thể làm song song** về mặt kỹ thuật, nhưng khuyến nghị làm Phase 1 trước để form có dữ liệu trước khi test routing.
- Sau mỗi phase, cập nhật `AGENTS.md` để lưu vết.
