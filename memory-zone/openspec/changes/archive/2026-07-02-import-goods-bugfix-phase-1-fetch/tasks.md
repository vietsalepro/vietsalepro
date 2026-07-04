## 0. Pre-Flight

- [x] 0.1 Create project backup using Copy-Item to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_import_goods_bugfix_phase_1_<YYYYMMDD_HHMMSS>`
- [x] 0.2 Confirm `npm run lint` pass
- [x] 0.3 Confirm `npm run build` pass
- [x] 0.4 Read `docs/plans/import-goods-bugfix/PLAN_REFINED.md` Phase 1 section

## 1. Sub-phase 1a — Suppliers & stats cho history tab

- [x] 1.1 Add `localSuppliers`, `localImportStats`, `isLoadingSuppliers`, `isLoadingStats` states in `pages/ImportGoods.tsx`
- [x] 1.2 Add mount `useEffect` to call `supabaseService.getSuppliers()` and merge into `localSuppliers` + `supplierCache`
- [x] 1.3 Update `fetchReceipts` success handler to compute stat cards from `totalReceiptCount` + `receiptList`
- [x] 1.4 Pass `suppliers={localSuppliers}` to `SupplierSection`
- [x] 1.5 Pass `suppliers={localSuppliers}` to `AdvancedFilterPanel`
- [x] 1.6 Replace stat-card rendering that uses `importReceipts` prop with `localImportStats` / `totalReceiptCount`
- [x] 1.7 Run `npm run lint` and fix errors
- [x] 1.8 Manual test: supplier dropdown, history stats, supplier filter

## 2. Sub-phase 1b — Server-side search sản phẩm trong form

- [x] 2.1 Add `localProducts`, `isLoadingProducts`, `productSearchRequestId` states
- [x] 2.2 Add `useDebounce(searchTerm, 300)` for product search
- [x] 2.3 Add `useEffect` on debounced term to call `supabaseService.searchProducts(term, 50)` and merge into `productCache` + `localProducts`
- [x] 2.4 Pass `products={localProducts}` to `ImportProductSearch`
- [x] 2.5 Pass `products={localProducts}` (or `productCache`) to `ImportItemsTable`
- [x] 2.6 Ensure `addToImportList` reads product from `productCache`
- [x] 2.7 Run `npm run lint` and fix errors
- [x] 2.8 Manual test: product search by name/code/barcode, add to table

## 3. Sub-phase 1c — Dọn dẹp prop dependency và tích hợp

- [x] 3.1 Static search `pages/ImportGoods.tsx` for `products.find`, `suppliers.find`, `importReceipts.reduce`
- [x] 3.2 Replace or guard any remaining lookups that operate on the `products`/`suppliers`/`importReceipts` props
- [x] 3.3 Update `viewingReceipt` detail rendering to use cache instead of prop
- [x] 3.4 Mark `handleCreateSupplier` prop dependency for Phase 4 if still present
- [x] 3.5 Run `npm run lint`
- [x] 3.6 Run `npm run build`
- [x] 3.7 Manual test: tab create works with `products=[]`, tab history works with `importReceipts=[]`

## 4. Cleanup & Verification

- [x] 4.1 Run `npm run lint`
- [x] 4.2 Run `npm run build`
- [x] 4.3 Manual test full create flow: supplier → product → line discount → shipping → save draft
- [x] 4.4 Manual test history tab: stat cards, filters, receipt detail
- [x] 4.5 Backup after phase if code is stable

## Acceptance Criteria

- [x] Chọn được NCC từ dropdown
- [x] Stat cards ở tab history hiển thị đúng tổng phiếu / tổng tiền hàng / ship / đã trả / công nợ
- [x] Không còn `suppliers.find(...)` trên prop rỗng gây undefined
- [x] Mở `/import`, chuyển sang tab create, tìm sản phẩm theo tên/mã/barcode → kết quả từ server
- [x] Chọn sản phẩm → thêm vào bảng đúng tên, đơn vị, giá nhập gốc
- [x] Không còn `products.find(...)` trên prop rỗng gây undefined
- [x] Toàn bộ tab create hoạt động khi `products`/`suppliers`/`importReceipts` prop là `[]`
- [x] Toàn bộ tab history hiển thị đúng khi prop rỗng
- [x] `npm run lint` PASS
- [x] `npm run build` PASS

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_import_goods_bugfix_phase_1_<YYYYMMDD_HHMMSS>`
- Rollback trigger: `npm run lint` or `npm run build` fails; manual test of supplier/product/stat fails; stale search results appear
