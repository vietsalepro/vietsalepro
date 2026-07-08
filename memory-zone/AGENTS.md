# VietSales Pro v7 — Agent Notes

## Project
- Path: `E:/App ban hàng/vietsale-pro-v7`
- Type: React SPA + Vite + TypeScript + Supabase
- No git repository present. Backups are created by copying the project folder.

## Build / Verification
- Typecheck: `npm run lint` (runs `tsc --noEmit`)
- Production build: `npm run build`
- Tests: `npx vitest run`
- Dev server: `npm run dev`

## OpenSpec (2026-07-02)
- OpenSpec installed with custom schema `voucher-plan` in `openspec/`.
- Windsurf integration: `.windsurf/skills/openspec-*` and `.windsurf/workflows/opsx-*`.
- Current plan tracked as changes: `voucher-layout-phase-0-audit` through `voucher-layout-phase-7-verification`.
- Baseline spec: `openspec/specs/voucher-form-layout/spec.md`.
- Usage guide: `docs/plans/voucher-form-layout-ssot/OPENSPEC_USAGE.md`.
- To validate: `openspec validate --all --json`.

## OpenSpec — Admin Dashboard (2026-07-06)
- Store: `admin-dashboard` registered at `memory-zone/KE_HOACH/Admin_dashboard/OPENSPEC`.
- Schema: `admin-dashboard` (copied from `multi-tenancy` and customized).
- Source plan: `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`.
- 44 changes created covering all 18 phases / sub-phases.
- Usage guide: `memory-zone/KE_HOACH/Admin_dashboard/OPENSPEC/OPENSPEC_USAGE.md`.
- To validate: `openspec validate --changes --store admin-dashboard`.

## Baseline (2026-06-29)
- `npm run lint`: PASS
- `npm run build`: PASS
- Backup folder: `E:/App ban hàng/vietsale-pro-v7_backup_20260629_095437`

## Phased Plan
Following `PHASED_FIX_DATAGRID_FLICKER_OPTION_B.md` (Option B only).
Progress tracked in session todos.

## Phase 1 (2026-06-29)
- Created `supabase/migration_phase1_search_filter_rpc.sql` with RPCs + indexes.
- Added service functions in `services/supabaseService.ts`:
  - `searchProducts`, `getProductByBarcode`, `filterProductsPaginated`
  - `searchSuppliers`, `filterSuppliersPaginated`
  - `filterImportReceiptsPaginated`
  - `filterDisposalsPaginated`
  - `filterReturnOrdersPaginated`
- Added standalone mappers: `mapImportReceiptFromDB`, `mapReturnOrderFromDB`, `mapDisposalFromDB`.
- `npm run lint`: PASS
- `npm run build`: PASS
- **Done**: migration SQL ran successfully in Supabase (Success. No rows returned).
- **Handoff**: Phase 2 handed off to next session via `HANDOFF_PROMPT_PHASE_2.md`.

## Phase 2 (2026-06-29)
- Migrated POS Desktop product search and barcode scan to server-side:
  - `hooks/usePOS.ts`: added `productSearchResults`, `isSearchingProduct`, `debouncedProductSearch` via `useDebounce`, `useEffect` calling `supabaseService.searchProducts`, replaced client-side `filteredProducts` with server results, added `searchProductByBarcode` using `supabaseService.getProductByBarcode`.
  - `pages/POS.tsx`: `handleScanSuccess` now uses `pos.searchProductByBarcode(code)` (async), passes `isSearchingProduct` to `ProductSearchResults`, passes `onSearchCustomers` to `AdvancedCustomerSearch`.
  - `components/desktop-pos/ProductSearchResults.tsx`: added `isSearching` prop and loading UI.
  - `components/desktop-pos/modals/AdvancedCustomerSearch.tsx`: added `onSearchCustomers` prop, `useDebounce`, server-side search with fallback to client-side filter.
- Customer search in POS remains server-side (already implemented in `usePOS.ts`).
- Kept `products`/`customers` props in `App.tsx` untouched for Phase 5.
- Kept `offlineManager.ts` untouched.
- `npm run lint`: PASS
- `npm run build`: PASS
- **Handoff**: Phase 3 handed off to next session via `HANDOFF_PROMPT_PHASE_3.md`.

## Phase 3 (2026-06-29)
- Migrated POS Mobile and Mobile Inventory to server-side:
  - `components/MobilePOS.tsx`:
    - Product search server-side via `supabaseService.searchProducts` + `useDebounce`.
    - Added `productSearchResults`, `isSearchingProduct` states, request-id ref to avoid stale results.
    - Barcode scan uses `supabaseService.getProductByBarcode` (async).
    - `CustomerSearchModal` now server-side via `supabaseService.searchCustomers` + `useDebounce`.
    - Added loading UI for product search and customer search.
    - No remaining `products.filter` or `customers.filter` in `MobilePOS`.
  - `components/MobileInventory.tsx`:
    - Replaced client-side filter/pagination with `supabaseService.filterProductsPaginated`.
    - Added `useDebounce` for search term.
    - Kept 4 stock status chips (all / available / low / out) and passed `stockStatus` to server.
    - Pagination uses `totalCount` returned from server.
    - Added loading and error UI.
  - `services/supabaseService.ts`: `filterProductsPaginated` now accepts `stockStatus` in filters and passes `p_stock_status` to RPC.
  - Created and ran `supabase/migration_phase3_stock_status_filter.sql` extending `filter_products_rpc` with `p_stock_status` parameter.
- Kept `products`/`customers`/`suppliers` props in `App.tsx` untouched for Phase 5.
- Kept `utils/offlineManager.ts` untouched.
- `npm run lint`: PASS
- `npm run build`: PASS
- **Handoff**: Phase 4 handed off to next session via `HANDOFF_PROMPT_PHASE_4.md`.

## Phase 4 (2026-06-29)
- Fixed `hooks/useAutoPageSize.ts`: removed `MutationObserver`, kept only `ResizeObserver`, `setPageSize` compares with prev before setting.
- Migrated desktop DataGrid tabs to server-side pagination:
  - `pages/Customers.tsx`: server-side via `getCustomersPaginated`, debounced search, stats from `customers` prop, select-all on current page.
  - `pages/Suppliers.tsx`: server-side via `filterSuppliersPaginated`, debounced search.
  - `pages/Inventory.tsx`: product list server-side via `filterProductsPaginated` (category/brand passed to RPC), debounced search.
  - `pages/Orders.tsx`: already server-side, added `useDebounce` for customer/orderId search, updated loading overlay.
  - `pages/ReturnOrders.tsx`: server-side via `filterReturnOrdersPaginated` (hook updated), debounced search, removed auto page size.
  - `pages/Disposals.tsx`: server-side via `filterDisposalsPaginated`, debounced search.
  - `pages/ImportGoods.tsx`: server-side via `filterImportReceiptsPaginated`, debounced search.
  - `pages/CategoryManagement.tsx` / `pages/BrandManagement.tsx`: kept client-side, removed `useAutoPageSize` for stability.
- Removed `useAutoPageSize` from all DataGrid pages (fixed page sizes).
- Updated `services/supabaseService.ts`: `filterImportReceiptsPaginated` now passes `p_status` to RPC.
- Created and ran `supabase/migration_phase4_import_receipt_status.sql` adding `p_status` parameter to `filter_import_receipts_rpc`.
- `npm run lint`: PASS
- `npm run build`: PASS
- **Handoff**: Phase 5 handed off to next session via `HANDOFF_PROMPT_PHASE_5.md`.

## Phase 5 (2026-06-29)
- Removed global full-data load in `App.tsx`:
  - Initial `Promise.all` no longer fetches `products`, `customers`, `suppliers`, or `importReceipts`.
  - `products`/`customers`/`suppliers`/`importReceipts` props are still passed to child components but now start as empty arrays.
  - Added a route-based lazy loader: fetches these arrays only when a route actually needs them (dashboard excluded).
- Updated CRUD handlers to not reload full lists after operations:
  - `handleDeleteOrder`, `handleImport`, `handleDeleteImport`, `handleUpdateImport`: only update local state.
  - `handleSaveInventoryCount` / `handleDeleteInventoryCount`: still reload products/InventoryCounts to keep stock accurate.
  - `handleCheckout` / `handlePosCheckout`: fetch missing product/customer records on demand so checkout works even when arrays are empty.
- Updated `utils/offlineManager.ts`:
  - Removed cache for full `products`/`customers`/`suppliers` lists.
  - Keeps settings, rewards, offline queue, and POS invoice cache.
- Migrated Dashboard and Mobile Home to server-side summary:
  - Created `supabase/migration_phase5_dashboard_summary.sql` with `get_dashboard_summary` RPC.
  - Ran migration successfully in Supabase project `rsialbfjswnrkzcxarnj`.
  - Added `supabaseService.getDashboardSummary`.
  - `pages/Dashboard.tsx` now fetches summary by date range; no longer depends on `products`/`orders` props.
  - `components/MobileHome.tsx` now fetches summary and recent orders; no longer depends on `products`/`orders`/`customers` props.
- Reports: left as sub-phase for Phase 6 (current route-based loader still supplies full arrays when `/reports` is opened).
- `npm run lint`: PASS
- `npm run build`: PASS
- **Handoff**: Phase 6 handed off to next session via `HANDOFF_PROMPT_PHASE_6.md`.

## Phase 5a — Backend ghi nhận giá vốn (COGS) tại thời điểm bán (2026-06-30)
- Tạo `supabase/migration_phase5a_checkout_cost.sql`:
  - Thêm cột `cost NUMERIC(15,2)` vào `order_items`.
  - Cập nhật RPC `process_checkout` để ghi `cost` snapshot vào `order_items`.
  - Sản phẩm có lô: lấy `cost` từ `product_lots.cost` của lô được bán.
  - Sản phẩm không lô: lấy `cost` từ `products.cost`.
  - Nếu client gửi `cost` trong `p_items` thì dùng giá trị đó (dự phòng Phase 5b).
  - Giữ nguyên signature 8 tham số và toàn bộ logic hiện có (idempotency, trừ kho, quà, công nợ, điểm).
- Deploy migration thành công lên Supabase project `QLBH` (`rsialbfjswnrkzcxarnj`).
- Kiểm thử trên DB thật:
  - Tạo đơn hàng test `ORDER_TEST_PHASE5a_001` gồm 1 SP không lô (Nuvi) và 1 SP có lô (Ensure).
  - `order_items.cost` ghi đúng: `26444.32` (products.cost) và `380000.00` (product_lots.cost).
  - Dọn dẹp dữ liệu test và tồn kho đã trả về đúng ban đầu.
- Cập nhật `types.ts`: thêm `cost?: number` vào `OrderItem`.
- Cập nhật `services/supabaseService.ts`: truyền `cost` trong `itemsPayload` nếu frontend đã có (không bắt buộc, RPC tự tính nếu null).
- KHÔNG sửa logic frontend chọn lô / FIFO / HSD — để Phase 5b.
- KHÔNG sửa báo cáo — để Phase 5c.
- `npm run lint`: PASS
- `npm run build`: PASS
- **Handoff**: Phase 5b bàn giao qua `HANDOFF_PROMPT_PHASE_5b.md`.

## Phase 5b — Frontend POS lot / FIFO / HSD (2026-06-30)
- Tạo `utils/lotUtils.ts` với helper sắp xếp/validate lô:
  - `getAvailableLots`: lọc lô tồn > 0.
  - `sortLotsByFifoExpiry`: ưu tiên HSD sớm, sau đó `createdAt` cũ.
  - `selectBestLotForQuantity`: chọn lô FIFO/HSD tự động.
  - `validateLotQuantity`: chặn SL vượt tồn lô.
- Sửa `hooks/usePOS.ts`:
  - `addToCart`: auto chọn lô FIFO/HSD; chặn nếu hết hàng trong các lô; chặn nếu tăng SL vượt tồn lô đã chọn.
  - `updateCartItem`: chặn nếu cập nhật SL vượt tồn lô hoặc tổng tồn SP.
  - `changeCartItemLot`: chặn nếu đổi sang lô có tồn < SL hiện tại; nếu bỏ chọn lô thì tự động chọn lại lô FIFO/HSD đầu tiên để tránh checkout lỗi.
  - `getAvailableLotsForProduct`: trả về lô khả dụng đã sắp xếp FIFO/HSD.
- Sửa `components/MobilePOS.tsx`:
  - `addToCart`: tương tự POS Desktop — auto chọn lô FIFO/HSD, chặn nếu hết hàng trong các lô, chặn nếu tăng SL vượt tồn lô.
  - `updateCartItem`: chặn nếu cập nhật SL/đổi lô vượt tồn; nếu bỏ chọn lô thì tự động chọn lại lô FIFO/HSD đầu tiên.
  - `SwipeableCartItem`: dropdown lô chỉ hiển thị lô có tồn > 0, sắp xếp FIFO/HSD, hiển thị mã lô + tồn + HSD.
- Không sửa backend (`process_checkout`, migration) — đã xong ở Phase 5a.
- Không sửa báo cáo — để Phase 5c.
- `npm run lint`: PASS
- `npm run build`: PASS
- Backup: `E:\DỤ ÁN\vietsale-pro-v7_backup_20260630_phase5b`
- **Handoff**: Phase 5c bàn giao qua `HANDOFF_PROMPT_PHASE_5c.md`.

## Phase 5c — Báo cáo lợi nhuận theo giá vốn tại thời điểm bán (2026-06-30)
- Xác minh lỗi thật: các RPC `get_sales_report`, `get_profit_report`, `get_inventory_report` trên DB thật project `QLBH` (`rsialbfjswnrkzcxarnj`) đang dùng `products.cost` để tính giá vốn, thay vì `order_items.cost` đã ghi snapshot ở Phase 5a.
- Tạo migration mới `supabase/migration_phase5c_reports_cost.sql` và cập nhật SSOT trong các file `supabase/migration_phase8_reports*.sql`:
  - `get_sales_report`: `item_cost` = `COALESCE(oi.cost, COALESCE(p.cost, 0)) * oi.quantity` (fallback `products.cost` cho đơn pre-Phase 5a).
  - `get_profit_report`: tương tự trong `all_items` và `compare_items` — tất cả dimension dùng giá vốn tại thời điểm bán.
  - `get_inventory_report`: giá trị tồn kho (`totalValue`, `inventoryByCategory`, `products.value`, `lowStockProducts.value`) tính theo lô `SUM(product_lots.quantity * product_lots.cost)`; SP không lô dùng `products.quantity * products.cost`; `exportInPeriod` dùng `order_items.cost`.
- Cập nhật `services/supabaseService.ts`: thêm `value` vào type `lowStockProducts` của `getInventoryReport`.
- Cập nhật `pages/Reports.tsx`: thêm `value` vào interface `InventoryReport.lowStockProducts`; sửa export Excel tồn kho dùng `p.value` thay vì tính `p.cost * p.quantity` ở client.
- Deploy 3 migration lên Supabase project `QLBH` (`rsialbfjswnrkzcxarnj`).
- Kiểm thử thực tế trên DB:
  - Xác minh `pg_proc`: cả 3 RPC chứa `COALESCE(oi.cost, COALESCE(p.cost, 0))`.
  - Đơn hàng test `ORDER_TEST_PHASE5C_001` (2 x Nuvi với `order_items.cost = 99999.00`): `get_profit_report` trả về `totalCost = 199998.00` (đúng = 2 * 99999), chứng minh dùng `order_items.cost` thay vì `products.cost` (26444.32). Đã dọn dẹp đơn test.
  - Kiểm tra `get_inventory_report`: SP không lô có `value = quantity * cost`; SP có lô (Yakult) có `value = 17 * 22800 = 387600` (khớp tổng lô).
- `npm run lint`: PASS
- `npm run build`: PASS
- Backup: `E:\DỤ ÁN\vietsale-pro-v7_backup_20260630_phase5c`
- **Handoff**: Phase 6 (Nhập hàng / Cập nhật giá vốn) bàn giao qua `HANDOFF_PROMPT_PHASE_6.md`.

## Phase 6 (2026-06-29)
- Completed removal of global data dependencies from `App.tsx`
- Removed state for `products`, `customers`, `suppliers`, `importReceipts`
- Added 15 new RPC functions in `supabase/migration_phase6_support.sql`:
  - `get_product_stats()` - Product statistics
  - `check_product_code_exists()` - Check product code uniqueness
  - `check_product_barcode_exists()` - Check barcode uniqueness
  - `get_import_stats()` - Import statistics
  - `get_import_receipt_count_by_date()` - Count receipts by date
  - `get_supplier_stats()` - Supplier statistics
  - `get_category_product_counts()` - Product counts per category
  - `get_brand_product_counts()` - Product counts per brand
  - `get_unsynced_categories()` - Categories not in categories table
  - `get_unsynced_brands()` - Brands not in brands table
  - `count_point_products()` - Count products with point accumulation
  - `get_import_receipts_by_supplier_id()` - Get receipts for supplier
  - `get_import_receipts_by_product_and_lot()` - Get receipts for product/lot
  - `search_orders_rpc()` - Search orders
- Added service functions in `supabaseService.ts`:
  - `getSupplierById()`, `getImportReceiptById()`
  - All RPC wrapper functions
- Updated component interfaces to make props optional:
  - `Inventory` - products optional with fallback
  - `BrandManagement` - products optional with fallback
  - `CategoryManagement` - products optional with fallback
  - `Suppliers` - suppliers optional with fallback
- Updated handlers in `App.tsx` to fetch individual records instead of using global state
- Removed route-based lazy loader
- Made all remaining component props optional (POS, ImportGoods, Orders, ReturnOrders, SupplierExchanges, Reports, Dashboard, MobileHome, MobilePOS, MobileOrders, MobileCustomers, MobileInventory, Customers)
- Fixed duplicate `productIds` declaration in `App.tsx` (handleImport)
- Fixed `MobileSettings` passing `products={[]}` (state removed)

## Phase 6 Bổ sung (2026-06-29)
- `pages/Reports.tsx`: Thêm server-side fetch — `useEffect` lấy orders theo dateRange qua `getOrdersPaginated(1, 2000, {startDate, endDate})`, lấy products qua `getProducts()` (lazy khi mở tab inventory). Hiển thị subtle loader khi re-fetch.
- `pages/Settings.tsx`: Thêm server-side fetch products — `useEffect` gọi `searchProducts('', 2000)` khi user mở tab `promotions` hoặc `points` (chỉ fetch 1 lần nếu chưa có data). Dùng `localProducts` state thay cho `propProducts = []`.
- `npm run lint`: PASS
- `npm run build`: PASS

## Phase 6 Hoàn thiện lần 2 (2026-06-29)
- Phát hiện 3 vấn đề chức năng còn sót sau kiểm tra kỹ lại tài liệu Phase 6:
  - `pages/Orders.tsx`: 6 chỗ `customers.find(...)` → thêm `customerCache` Map + `useEffect` prefetch `getCustomerById` cho tất cả customerId trong trang hiện tại. Thay tất cả `customers.find` bằng `getCustomer(id)` helper.
  - `pages/Suppliers.tsx`: `importReceipts.filter(...)` trong modal → thêm `supplierReceipts` state + `useEffect` fetch `getImportReceiptsBySupplierId(editingSupplier.id, 50)` mỗi khi `editingSupplier` thay đổi. Xóa biến `supplierReceipts` computed cũ.
  - `pages/SupplierExchanges.tsx`: `products`, `suppliers`, `importReceipts` props rỗng → thay bằng:
    - `suppliers`: fetch `getSuppliers()` 1 lần khi mount
    - Product search: server-side `searchProducts` + debounce 400ms → `productSearchResults`; lọc thêm theo `lockedReceipt` nếu có
    - `lockedReceipt`: fetch `getImportReceiptById(lockedReceiptId)` qua useEffect
    - `lotReceipts`: fetch `getImportReceiptsByProductAndLot(product.id, lot.id)` qua useEffect khi `draftProduct`+`draftLot` có giá trị
    - `productCache` Map: lưu products đã chọn để lookup lots trong validateForm và renderExpandedItem
- `npm run lint`: PASS
- `npm run build`: PASS
- **Phase 6 HOÀN THÀNH ĐẦY ĐỦ** — tất cả chức năng hoạt động server-side, sẵn sàng Phase 7.
- **Handoff**: Phase 7 handed off to next session via `HANDOFF_PROMPT_PHASE_7.md`.

## Phase 1 — Xử lý vấn đề còn tồn đọng sau Phase 6 (2026-06-29)
- Tạo kế hoạch 3 phase: `PHASED_FIX_DATAGRID_FLICKER_REMAINING.md`.
- Tạo migration `supabase/migration_phase7_customer_stats.sql` và RPC `get_customer_stats`; chạy thành công trên Supabase project `QLBH` (`rsialbfjswnrkzcxarnj`).
- Cập nhật `services/supabaseService.ts`: `getCustomerStats()` dùng RPC `get_customer_stats` thay vì tải toàn bộ customers.
- Sửa stats server-side:
  - `pages/Customers.tsx`: dùng `getCustomerStats()`.
  - `pages/Suppliers.tsx`: dùng `getSupplierStats()` (VIP tạm = 0 vì thiếu trường ranking).
  - `pages/CategoryManagement.tsx`: dùng `getCategoryProductCounts()` + `getUnsyncedCategories()` + `getProductStats()`; thêm `refreshCounts()` sau CRUD/sync.
  - `pages/BrandManagement.tsx`: dùng `getBrandProductCounts()` + `getUnsyncedBrands()`; thêm `refreshCounts()` sau CRUD/sync.
  - `pages/Inventory.tsx`: dùng `getProductStats()` cho 5 stat cards.
- `npm run lint`: PASS
- `npm run build`: PASS
- **Phase 1 còn tiếp tục**: tên KH/SP/NCC trong ReturnOrders/ImportGoods/MobilePOS/MobileOrders/usePOS cần xử lý ở chat tiếp theo.
- **Handoff**: Phần còn lại của Phase 1 bàn giao qua `HANDOFF_PROMPT_PHASE_1_REMAINING.md`.

## Phase 1 Remaining — Sửa lỗi hiển thị tên KH/SP/NCC (2026-06-29)
- `pages/ReturnOrders.tsx`: thêm `customerCache` + `productCache` Map; prefetch theo trang / chi tiết / create / exchange; thay 11 chỗ `products.find`/`customers.find` bằng `getCustomerFromCache`/`getProductFromCache` / `ensureCustomer`.
- `pages/ImportGoods.tsx`: thêm `supplierCache` + `productCache` Map; prefetch theo danh sách phiếu và phiếu đang xem; thay 8 chỗ `suppliers.find`/`products.find`/`importReceipts.find` bằng cache / `ensureSupplier` / `getImportReceiptById`; `generateReceiptCode` dùng `getImportReceiptCountByDate`; xóa biến `filteredProducts` dead code.
- `components/MobileOrders.tsx`: thêm `customerCache` + `productCache` Map; prefetch khi chọn đơn; thay `customers.find`/`products.find` trong print / modal detail.
- `components/MobilePOS.tsx`: thêm `customerCache`; fetch `getCustomerById` khi `activeCustomerId` thay đổi; thay `products.find` trong cart bằng check stock trực tiếp trên cart item.
- `hooks/usePOS.ts`: thêm `customerCache` + `productCache` Map; fetch active customer; prefetch products trong cart; `getAvailableLotsForProduct` dùng `productCache`.
- Không còn `.find` trên prop `products`/`customers`/`suppliers` trong các file trên.
- `npm run lint`: PASS
- `npm run build`: PASS
- **Phase 1 HOÀN THÀNH** — sẵn sàng Phase 2.
- **Handoff**: Phase 2 bàn giao qua `HANDOFF_PROMPT_PHASE_2.md`.

## Phase 2 — Chuyển Báo cáo sang server-side (2026-06-29)
- Tạo migration `supabase/migration_phase8_reports.sql` + 5 file tách `migration_phase8_reports_1.sql` … `_5.sql` với 4 RPC aggregate:
  - `get_sales_report(p_start_date, p_end_date, p_status, p_payment_method, p_product_keyword, p_customer_keyword)` — tổng doanh thu, số đơn, doanh thu theo ngày/sản phẩm/khách hàng, đơn hoàn tất/hủy, so sánh vs kỳ trước.
  - `get_profit_report(p_start_date, p_end_date, p_status, p_payment_method, p_product_keyword, p_customer_keyword, p_compare_mode)` — lợi nhuận, doanh thu, giá vốn theo sản phẩm/ngày.
  - `get_inventory_report(p_start_date, p_end_date, p_category, p_stock_status)` — tồn kho hiện tại, giá trị tồn, sắp hết, hết hàng, theo danh mục/thương hiệu.
  - `get_customer_report(p_start_date, p_end_date)` — top khách hàng, tổng chi tiêu, nợ, điểm, khách hàng mới.
- **Migration đã chạy thành công trên Supabase project `QLBH` (`rsialbfjswnrkzcxarnj`)** — xác nhận 4 RPC tồn tại trong `pg_proc` và chạy được (test năm 2026: 46 đơn, profit 1.672.511, inv_qty 1294, cust 1284).
- Thêm 4 wrapper trong `services/supabaseService.ts`: `getSalesReport`, `getProfitReport`, `getInventoryReport`, `getCustomerReport` (dòng 3468/3505/3539/3566).
- Viết lại `pages/Reports.tsx`:
  - Bỏ `// @ts-nocheck`.
  - Bỏ `getProducts()` và `getOrdersPaginated(1, 2000, …)`.
  - 4 `useEffect` riêng gọi RPC tương ứng theo `activeTab` + `dateRange` (sales/profit/customer fetch khi dateRange/filter đổi; inventory fetch chỉ khi `activeTab === 'inventory'`).
  - State `salesReport`/`profitReport`/`inventoryReport`/`customerReport` + cờ `isFetching*` để hiển thị loader cho từng khu vực.
  - Charts/tables dùng `useMemo` trên data từ RPC; giữ nguyên UI/UX và date range picker.
  - Props `products`/`orders`/`customers`/`suppliers` vẫn được khai báo (optional, fallback `[]`) nhưng **không còn được dùng để tính số liệu** — để dành cho Phase 3 cleanup.
- `npm run lint`: PASS (exit 0).
- `npm run build`: PASS (3008 modules, 9.62s).
- **Phase 2 HOÀN THÀNH ĐẦY ĐỦ** — sẵn sàng Phase 3 (Cleanup & tối ưu toàn cục).
- **Handoff**: Phase 3 bàn giao qua `HANDOFF_PROMPT_PHASE_3.md` (bản mới, ghi đè handoff Phase 3 cũ của `OPTION_B`).

## Phase 3 — Cleanup và tối ưu toàn cục (2026-06-29)
- **Xoá `hooks/useAutoPageSize.ts`** — không còn import nào dùng (chỉ còn ref trong .md docs).
- **`pages/DisposalForm.tsx`** — migrate sang server-side search:
  - Bỏ `supabaseService.getProducts()` full-load.
  - Search sản phẩm dùng `searchProducts(term, 50)` + `useDebounce` (300ms) + request-id ref tránh stale results; thêm state `searchResults`, `isSearching`, loader "Đang tìm sản phẩm…".
  - Khi load disposal có sẵn: fetch `getProductsByIds(productIds)` thay vì toàn bộ products.
  - Thêm `productCacheRef` (Map) + `cacheVersion` để `validateForm` và `DisposalItemsTable` lookup lots mà không cần full list.
  - `DisposalProductSearch` nhận `products={searchResults}`; `DisposalItemsTable` nhận `products={cachedProducts}`.
- **`pages/Suppliers.tsx`** — bỏ fallback full-load on-mount:
  - Xoá state `suppliersFallback` + useEffect `getSuppliers()`.
  - `handleExportExcel`: fetch `getSuppliers()` on-demand (export đặc thù) + comment lý do.
  - `handleSubmit`: khi user không nhập mã, fetch `getSuppliers()` on-demand để sinh mã NCC tự động + comment.
  - Main list vẫn `filterSuppliersPaginated`; stats vẫn `getSupplierStats`.
- **`pages/SupplierExchanges.tsx`** — thay `getSuppliers()` bằng `searchSuppliers('', 500)` cho filter dropdown (table NCC nhỏ) + comment.
- **`pages/Inventory.tsx`** — giữ `getProducts()` fallback nhưng thêm comment ghi rõ full-list chỉ dùng cho: scanner lookup, inventory-count picker, export/import Excel, duplicate SKU/barcode check (các trường hợp đặc thù cần toàn bộ danh sách; main list đã `filterProductsPaginated`).
- **`services/supabaseService.ts`**:
  - **Xoá hàm `getImportReceipts()`** — không còn caller nào (dùng `filterImportReceiptsPaginated` + `getImportReceiptById`).
  - Thêm comment FULL-LOAD cho `getProducts`, `getSuppliers`, `getAllCustomers`/`getCustomers` ghi rõ chỉ dùng cho export/bulk-rank-recalc — main list đều đã server-side paginate.
- **`pages/Settings.tsx` + `components/MobileSettings.tsx`**: thêm comment "bulk rank recalc — đặc thù" cho lệnh `getCustomers()` trong handler tính lại hạng KH.
- **`pages/Reports.tsx`** — xoá props thừa:
  - Bỏ `ReportsProps` (`products`/`orders`/`customers`/`suppliers`) — toàn bộ data đã lấy qua RPC.
  - Bỏ import `Product, Order, Customer, Supplier` từ `../types` (không còn dùng).
- **`components/MobileHome.tsx`** — xoá props `products`/`orders`/`customers` (MobileHome chỉ dùng `storeName` + `onOpenSettings`; đã self-fetch summary + recent orders).
- **`components/MobileSettings.tsx`** — xoá prop `products` (dead — `productsList` được khai báo nhưng không dùng) + xóa dòng `const productsList = props.products || [];` chết.
- **`App.tsx`**:
  - `<Reports orders={orders} />` → `<Reports />`.
  - `<MobileHome orders={orders} ... />` → bỏ `orders`.
  - `<MobileSettings ... products={[]} />` → bỏ `products`.
  - Giữ `getOrdersPaginated(1, 50)` trong init `Promise.all` + thêm comment: 50 đơn gần nhất phục vụ ReturnOrders (create-return flow: chọn đơn gốc, search, recent orders của KH); offline sync handler reload cùng 50 đơn này sau khi sync. Đây là nhánh "đã tối ưu" của tiêu chí (chỉ 50, không phải full-load).

## Phase 5 — Đánh giá & phân chia (2026-06-30)
- Theo `KE_HOACH_SUA_LOI_NGHIEP_VU_MASTER.md`, Phase 5 gốc là "Bán hàng / POS / Giá vốn (COGS)".
- Đánh giá scope: cần sửa backend (DB + RPC), frontend (POS/MobilePOS), và báo cáo → context vượt 240K nếu làm 1 lượt.
- Đã chia thành 3 sub-phase:
  - **5a**: Backend — thêm cột `cost` vào `order_items`, sửa RPC `process_checkout` ghi nhận giá vốn tại thời điểm bán.
  - **5b**: Frontend — POS/MobilePOS cập nhật lot, auto-FIFO/HSD mặc định, vẫn cho phép đổi lô tay.
  - **5c**: Báo cáo — sửa `get_profit_report` / `get_sales_report` / `get_inventory_report` dùng `order_items.cost`.
- Quyết định kiến trúc: mặc định auto-FIFO/HSD chọn lô, nhân viên vẫn có thể đổi lô bằng tay.
- Đã viết `HANDOFF_PROMPT_PHASE_5a.md` cho chat tiếp theo.
- Phát hiện migration cũ có thể ghi đè `process_checkout` sau khi Phase 5a deploy:
  - `supabase_migration_process_checkout_rpc.sql`
  - `supabase_migration_idempotency.sql`
  - `supabase_migration_order_auto_code.sql`
  - `supabase_migration_process_checkout_with_lots.sql`
  - `supabase_migration_phase3b2_checkout_lot_persistence.sql`
- Cần xử lý các migration cũ này ở phase cuối (hoặc ngay sau Phase 5a) để tránh vô tình chạy lại.
- `npm run lint`: PASS (baseline trước khi bắt đầu 5a).
- `npm run build`: PASS (baseline trước khi bắt đầu 5a).
- **`pages/ReturnOrders.tsx`**: vẫn dùng prop `orders` (50 đơn) cho create-return flow — giữ nguyên, không migrate (ngoài scope Phase 3, sẽ xử lý nếu cần ở phase sau).
- `npm run lint`: PASS (exit 0).
- `npm run build`: PASS (PWA, 45 precache entries, ~10.38s).
- **Phase 3 HOÀN THÀNH** — toàn bộ 3 phase của `PHASED_FIX_DATAGRID_FLICKER_REMAINING.md` đã xong.

## Phase 6 — Nhập hàng / Cập nhật giá vốn (Business Cleanup) (2026-06-30)
- **Mục tiêu:** Dọn dẹp, hoàn thiện và khóa chặt Phase 6 "Nhập hàng / Cập nhật giá vốn" theo chuẩn ERPNext; KHÔNG chạm Phase 7.
- **Migration canonical:** `supabase_migration_import_goods_v2.sql` v2.3 là SSOT duy nhất cho nhập hàng V2.
- **File migration đã đổi tên `.OLD`:**
  - `supabase/migration_phase6_import_lot_valuation.sql.OLD`
  - `supabase_migration_import_rpc.sql.OLD`
  - `supabase_migration_import_status.sql.OLD`
  - `supabase_migration_fix_import_lot_persistence.sql.OLD`
  - `supabase_migration_phase2f2_lot_unique_constraint.sql.OLD`
  - `supabase_migration_restore_lot_sync_trigger.sql.OLD`
- **Thay đổi backend:**
  - Thêm `update_import_v2(p_receipt_id, p_payload)` để sửa phiếu `completed` (đảo ngược + nhập lại atomic).
  - Chiết khấu dòng trừ vào giá vốn: `unit_cost = GREATEST(0, cost - discount) * (1 + shipping_factor)`; lưu `discount` vào `import_items`.
  - Xóa trigger `trg_product_lots_sync_qty`; đồng bộ tường minh `products.quantity = SUM(product_lots.quantity)` qua helper `sync_product_quantity_from_lots()` trong các RPC liên quan.
  - Cập nhật `supabase_migration_product_lots_table.sql` và `supabase_migration_v7_core_consolidation.sql` để không tạo lại trigger cũ.
- **Thay đổi frontend:**
  - `services/supabaseService.ts`: `updateImportReceipt` gọi `update_import_v2`; `createImportReceipt` truyền `discount`; `mapImportReceiptFromDB` ánh xạ `discount`.
  - `App.tsx`: alert đúng cho draft/completed khi cập nhật phiếu.
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Deploy & runtime test:**
  - Đã deploy migration lên Supabase project `QLBH` (`rsialbfjswnrkzcxarnj`) qua Supabase CLI + Personal Access Token.
  - Chạy `supabase_migration_import_goods_v2.sql` v2.3, `supabase_migration_phase6_drop_lot_sync_trigger.sql`, và các migration RPC đã sửa (product_lots, v7 consolidation, checkout, disposals, inventory count, delete/cancel order).
  - Test script `supabase_migration_phase6_test_import_v2.sql` PASS trên DB thật.
  - Test runtime qua Supabase JS client: create → update → delete phiếu completed với line discount; `products.quantity = SUM(product_lots.quantity)` đúng; giá vốn BQGQ sau chiết khấu đúng.
- **Backup:** `E:\DỤ ÁN\vietsale-pro-v7_backup_20260630_phase6`.
- **Tài liệu liên quan:** `KE_HOACH_SUA_LOI_NGHIEP_VU_MASTER.md` (Phase 6 đã cập nhật).

## Knowledge Graph
- codebase-memory project name: `E-App-ban-h-ng-vietsale-pro-v7`

## Phase 8 Cleanup — Dọn dẹp + khóa chặt sau Phase 8 (2026-07-01)
- **Mục tiêu:** Xử lý 5 vấn đề phát sinh sau Phase 8, không làm Phase 9, không tạo RPC mới, không sửa logic nghiệp vụ khác.
- **Vấn đề 1 — Typo migration:** Sửa `BIGSERVAL` → `BIGSERIAL` trong `supabase/migration_phase8a_debt_ledger.sql` dòng 50. Không deploy lại (bảng đã đúng trên DB).
- **Vấn đề 2 — KH lệch:** `anh Hai Cảnh` (`C1772442511333334`) `customers.debt=0`, `SUM(customer_payment_ledger)=-1500` (dòng `adjustment` lý do `nợ chết` tồn đọng). User quyết định xóa nợ chết. Đã gọi `adjust_customer_debt('C1772442511333334', 1500, 'Xóa nợ chết dữ liệu cũ')` rồi `reconcile_customer_debt()`. Kết quả: `customers.debt=0`, `SUM ledger=0`.
- **Vấn đề 3 — Bỏ cột nợ trong import Excel KH/NCC:**
  - `pages/Customers.tsx`: xóa cột `'Nợ ban đầu'` trong mẫu Excel download; import giữ `debt: 0` cứng.
  - `components/MobileCustomers.tsx`: import Excel set `debt: 0` (không đọc cột công nợ/nợ từ file).
  - `pages/Suppliers.tsx`: xóa cột `'Nợ ban đầu'` trong mẫu Excel download; import Excel set `debt: 0` (không đọc cột nợ từ file).
- **Vấn đề 4 — Dọn `debt` thừa trong form MobileCustomers:** `components/MobileCustomers.tsx` init state và reset form bỏ `debt: 0`; tạo mới hardcode `debt: 0`; sửa KH chỉ copy `code/name/phone/address` vào formData.
- **Vấn đề 5 — Khóa file migration cũ:** Thêm header cảnh báo `⚠️ KHÔNG CHẠY LẠI — đã hợp nhất vào phase8x (8b, 2026-06-30)` vào `supabase/migration_phase7b_stock_ledger.sql`, rồi đổi tên thành `supabase/migration_phase7b_stock_ledger.sql.OLD`.
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS. Reconcile KH và NCC trên DB thật project `QLBH` (`rsialbfjswnrkzcxarnj`) đều = 0.
- **Còn lại:** Phase 9 (Khuyến mãi / Pricing) — bàn giao qua `HANDOFF_PROMPT_PHASE_9.md`.

## Phase 4a — Tồn kho theo lô (SSOT đường đọc) (2026-06-30)
- Phát hiện lỗi thật: các RPC đọc sản phẩm server-side (`search_products_rpc`, `get_product_by_barcode`, `filter_products_rpc`) không trả về `product_lots`, khiến POS/Kho hiển thị `lots = []` cho sản phẩm `has_lots = TRUE`.
- Tạo `supabase/migration_phase4a_lot_ssot_read_rpc.sql`:
  - `search_products_rpc` và `get_product_by_barcode` chuyển từ `RETURNS SETOF products` sang `RETURNS TABLE(...)` với cột `product_lots jsonb`.
  - `filter_products_rpc` (cả 2 signature 6 và 7 tham số) trả về `product_lots` trong JSON `products`.
  - Thêm index `product_lots(product_id)` và `product_lots(expiry_date)`.
- Deploy migration `phase4a_lot_ssot_read_rpc` lên Supabase project `QLBH` (`rsialbfjswnrkzcxarnj`).
- `npm run lint`: PASS; `npm run build`: PASS.
- Backup: `E:\DỤ ÁN\vietsale-pro-v7_backup_20260630_103310`
- Handoff cho Phase 4b/4c: `HANDOFF_PROMPT_PHASE_4b_4c.md`

## Phase 7a — Kiểm kê tồn kho: Sửa lỗi cốt lõi + Hủy/Xóa + Lý do lệch (2026-06-30)
- **Mục tiêu:** Sửa RPC `complete_inventory_count` mismatch lô, hợp nhất 2 file migration thành SSOT, thêm bắt buộc lý do khi lệch, thêm RPC `cancel_inventory_count_rpc` (hủy phiếu + hoàn kho + giữ lịch sử), tách biệt Hủy vs Xóa hẳn.
- **Lỗi thật trên DB `QLBH`:**
  - 🐞 RPC `complete_inventory_count` bản cũ không hỗ trợ lô chi tiết (bỏ qua `lot_id/lot_code`, phân bổ FIFO tự động) trong khi `delete_inventory_count_rpc` đã hỗ trợ lô → mismatch khi xóa phiếu đã hoàn thành.
  - 🐞 Drift SSOT giữa `supabase_migration_inventory_count_rpc.sql` (bản cũ + Phase 6 sync) và `supabase_migration_inventory_count_lots.sql` (bản lô chi tiết nhưng thiếu Phase 6 sync).
  - 🐞 `delete_inventory_count_rpc` xóa cứng chứng từ, không giữ lịch sử.
- **Migration:** `supabase/migration_phase7a_inventory_count_consolidation.sql`
  - `complete_inventory_count` bản mới: lô chi tiết + `PERFORM sync_product_quantity_from_lots` + check lý do (so sánh đúng theo lot_id/lot_code/SUM).
  - `cancel_inventory_count_rpc` mới: status `cancelled` + hoàn kho bút toán đảo + giữ header/items. Chỉ cho `draft`/`completed`.
- **SSOT:** `supabase_migration_inventory_count_rpc.sql` cập nhật thành bản mới; `supabase_migration_inventory_count_lots.sql` đánh dấu ĐÃ HỢP NHẤT.
- **Frontend:**
  - `pages/Inventory.tsx`: prop `onCancelInventoryCount`; `handleSaveCount` validate lý do khi lệch; cột thao tác V2 + V1 thêm nút Hủy phiếu (icon Ban) + đổi nút Xóa hẳn chỉ cho draft/cancelled.
  - `components/inventory-count/CountItemsTable.tsx`: highlight ô lý do (border amber) khi lệch + reason "Khớp" (V2 + V1).
  - `components/inventory-count/CountItemsTable.css`: thêm class `count-table__select--warning`.
  - `services/supabaseService.ts`: thêm `cancelInventoryCount`.
  - `App.tsx`: `handleCancelInventoryCount` + cập nhật `handleDeleteInventoryCount` (chỉ draft/cancelled) + truyền prop `onCancelInventoryCount` cho 2 route Inventory.
- **Deploy:** `phase7a_inventory_count_consolidation` + `phase7a_fix_reason_check_lot` lên Supabase project `QLBH`.
- **Test thực tế (đã dọn dẹp):**
  - TH1: SP 2 lô, kiểm kê lệch 1 lô → ghi đúng lô, không ghi đè FIFO, products.quantity sync. ✅
  - TH2: Hủy phiếu TH1 → hoàn kho đúng lô, status=cancelled, giữ lịch sử. ✅
  - TH3: SP không lô, lệch + reason="Khớp" → RPC chặn. ✅
  - TH4: SP không lô, lệch + reason="Mất hàng" → RPC cho phép, quantity đúng. ✅
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Backup:** `E:\DỤ ÁN\vietsale-pro-v7_backup_20260630_phase7a`.
- **Handoff Phase 7b/7c:** `HANDOFF_PROMPT_PHASE_7b.md` (Sổ cái kho — Stock Ledger Entry).

## Phase 7b — Sổ cái kho (Stock Ledger Entry) cho kiểm kê + bán hàng (2026-06-30)
- **Mục tiêu:** Xây bảng `stock_movements` (Stock Ledger Entry) theo mô hình ERPNext + ghi bút toán kho cho 2 luồng đầu tiên: hoàn thành kiểm kê (`complete_inventory_count`) và bán hàng (`process_checkout`), kèm bút toán đảo khi hủy kiểm kê (`cancel_inventory_count_rpc`).
- **Migration:** `supabase/migration_phase7b_stock_ledger.sql`
  - Tạo bảng `stock_movements` với các cột: `id`, `posting_date`, `voucher_type`, `voucher_no`, `voucher_detail_no`, `product_id`, `lot_id`, `warehouse`, `actual_qty`, `qty_after_transaction`, `valuation_rate`, `incoming_rate`, `outgoing_rate`, `stock_value`, `balance_value`, `reason`, `is_cancelled`, `created_at`.
  - Indexes: `(product_id, posting_date)`, `(lot_id, posting_date)`, `(voucher_type, voucher_no)`, `(voucher_type, voucher_detail_no)`.
  - RLS: policy `allow_all_stock_movements` cho `authenticated` + `anon`.
  - Helper functions: `get_product_stock_balance`, `get_product_valuation_rate`, `insert_stock_ledger_entry` (idempotent theo `voucher_detail_no` + `is_cancelled`).
  - Cập nhật `complete_inventory_count`: ghi bút toán `Stock Reconciliation` khi có chênh lệch; `valuation_rate` từ `product_lots.cost` hoặc `products.cost`; `lot_id` đúng cho SP có lô.
  - Cập nhật `cancel_inventory_count_rpc`: ghi bút toán đảo (`actual_qty = -delta`, `is_cancelled = true`) khi hủy phiếu completed; giữ dòng gốc.
  - Cập nhật `process_checkout`: ghi bút toán `Sales Invoice` cho mỗi `order_item`; `valuation_rate = order_item.cost` (snapshot Phase 5a); `lot_id` từ `order_item.lot_id`.
  - Thêm RPC helper `get_stock_ledger(product_id, from_date, to_date)` cho UI truy vết sau này.
- **Frontend:** Không thay đổi — tất cả bút toán được ghi trong RPC backend.
- **Deploy:** Migration đã chạy thành công trên Supabase project `QLBH` (`rsialbfjswnrkzcxarnj`).
- **Test thực tế (đã rollback, không để lại dữ liệu):**
  - Kiểm kê SP không lô lệch +5 → `stock_movements` có dòng `actual_qty = 5`, `qty_after_transaction = 19`, `valuation_rate = 42159.24`. ✅
  - Hủy phiếu kiểm kê trên → có dòng đảo `actual_qty = -5`, `is_cancelled = true`, `qty_after_transaction = 14`. ✅
  - Checkout SP không lô (2 xuất) → `actual_qty = -2`, `valuation_rate = 42159.24`, `outgoing_rate = 42159.24`. ✅
  - Checkout SP có lô (1 xuất Ensure) → `actual_qty = -1`, `lot_id` đúng, `valuation_rate = 380000`. ✅
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Backup:** `E:\DỤ ÁN\vietsale-pro-v7_backup_20260630_phase7b`.
- **Handoff Phase 7c:** `HANDOFF_PROMPT_PHASE_7c.md` (mở rộng sổ cái kho cho nhập/trả/hủy/đổi + UI trang sổ cái kho).

## Phase 7c — Mở rộng sổ cái kho cho nhập/trả/hủy/đổi + trang /stock-ledger (2026-06-30)
- **Mục tiêu:** Ghi bút toán `stock_movements` cho mọi nghiệp vụ còn lại và xây dựng trang xem sổ cái kho ở frontend.
- **Migration:** `supabase/migration_phase7c_stock_ledger_complete.sql` (đã deploy lên Supabase project `QLBH` `rsialbfjswnrkzcxarnj`)
  - Ghi đè RPC ghi bút toán trong cùng transaction:
    - `process_import_v2` / `delete_import_v2` / `update_import_v2`: voucher_type `Purchase Receipt`, `actual_qty` dương khi nhập, âm khi xóa/sửa (`is_cancelled=true`).
    - `create_return_order` / `cancel_return_order_v2`: voucher_type `Delivery Note`, `actual_qty` dương khi trả, âm khi hủy trả.
    - `create_exchange_transaction`: voucher_type `Stock Entry`, 2 dòng (trả + bán) cho mỗi giao dịch đổi.
    - `complete_disposal` / `delete_disposal_with_restore`: voucher_type `Stock Entry`, `actual_qty` âm khi hủy, dương khi xóa phiếu hủy.
  - Mở rộng `get_stock_ledger` thêm bộ lọc `product_id`, `lot_id`, `voucher_type`, `is_cancelled`, `limit`, `offset`.
  - Thêm helper `get_stock_balance(product_id, at_date)`.
- **Frontend:**
  - `pages/StockLedger.tsx`: trang `/stock-ledger` hiển thị bảng biến động tồn kho, lọc SP/lô/loại chứng từ/ngày/bút toán đảo, tổng hợp nhập/xuất/đảo, export Excel.
  - `App.tsx`: route `/stock-ledger`.
  - `components/AppTopbar.tsx`: menu "Sổ cái kho" (desktop) / "Sổ kho" (mobile).
  - `types.ts`: `StockMovement`, `StockLedgerFilters`.
  - `services/supabaseService.ts`: `getStockLedger`.
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Deploy:** Migration đã chạy thành công trên Supabase project `QLBH` (`rsialbfjswnrkzcxarnj`). Xác minh `pg_proc`: tất cả RPC đã tồn tại với source chứa `insert_stock_ledger_entry` / `get_product_stock_balance` / `get_product_valuation_rate`.
- **Backup:** `E:\DỤ ÁN\vietsale-pro-v7_backup_20260630_phase7c`.
- **Còn lại:** Phase 8 (Công nợ KH & NCC).
- **Handoff Phase 7c remaining:** `HANDOFF_PROMPT_PHASE_7c_remaining.md` (cập nhật SSOT + test end-to-end).

## Phase 7c Remaining — SSOT sync + End-to-end testing (2026-06-30)
- **Mục tiêu:** Đồng bộ SSOT migration files với `migration_phase7c_stock_ledger_complete.sql` và kiểm thử end-to-end trên DB thật.
- **SSOT files đã cập nhật:**
  - `supabase_migration_import_goods_v2.sql`: `process_import_v2`, `update_import_v2`, `delete_import_v2` — thêm `insert_stock_ledger_entry` + `v_item.id::TEXT` cast.
  - `supabase_migration_v7_core_consolidation.sql`: `create_return_order`, `cancel_return_order_v2`, `create_exchange_transaction` — thêm stock ledger + sửa `ORDER BY created_at` → `ORDER BY id DESC` cho `return_order_items` (bảng không có cột `created_at` trước đó).
  - `supabase_migration_disposals.sql`: `complete_disposal` — thêm stock ledger + `v_item.id::TEXT` cast + thêm cột `reason` vào `disposal_items`.
  - `supabase_migration_delete_disposal_with_restore.sql`: `delete_disposal_with_restore` — thêm stock ledger + `v_item.id::TEXT` cast.
  - `supabase_migration_return_orders.sql`: thêm cột `lot_id`, `lot_code`, `created_at` vào `return_order_items`.
  - `supabase/migration_phase7b_stock_ledger.sql`: sửa FK `stock_movements_lot_id_fkey` từ `ON DELETE RESTRICT` → `ON DELETE SET NULL` (cho phép xóa lô khi về 0, giữ audit trail).
  - `supabase/migration_phase7c_stock_ledger_complete.sql`: thêm section 0a (schema fixes: `disposal_items.reason`, `return_order_items.created_at`, `order_items.created_at`, FK `stock_movements_lot_id_fkey`), sửa `get_stock_ledger` NULL date handling (`p_from_date IS NULL OR ...` thay vì `sm.posting_date >= p_from_date`).
- **Schema fixes deployed on live DB:**
  - `ALTER TABLE disposal_items ADD COLUMN reason TEXT DEFAULT ''`
  - `ALTER TABLE return_order_items ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW()`
  - `ALTER TABLE order_items ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW()`
  - `ALTER TABLE stock_movements` FK `stock_movements_lot_id_fkey` → `ON DELETE SET NULL`
  - `get_stock_ledger` NULL date handling fix deployed.
- **End-to-end testing (Tests A–F) trên DB thật project `QLBH`:**
  - **Test A (Nhập hàng):** `process_import_v2` (+10), `update_import_v2` (đảo -10 + mới +12), `delete_import_v2` (đảo -12). Tồn kho 2→12→14→2 ✓. Stock ledger: 6 bút toán (2 gốc, 2 đảo, 2 mới) ✓.
  - **Test B (Trả hàng):** `create_return_order` (+1 Nuvi, 4→5), `cancel_return_order_v2` (đảo -1, 5→4). Stock ledger: 2 bút toán (1 gốc, 1 đảo) ✓.
  - **Test C (Hủy hàng):** `complete_disposal` (-2, 4→2), `delete_disposal_with_restore` (+2, 2→4). Stock ledger: 2 bút toán (1 gốc, 1 đảo) ✓. Disposal bị xóa ✓.
  - **Test D (Đổi hàng):** `create_exchange_transaction` — trả 1 Nuvi (4→5) + bán 1 TH True Milk (62→61). Stock ledger: 2 bút toán (1 Delivery Note trả, 1 Stock Entry bán) ✓.
  - **Test E (get_stock_ledger filters):** Lọc theo `product_id` ✓, `voucher_type` ✓, `is_cancelled` ✓, date range ✓.
  - **Test F (Cross-check tồn kho):** `SUM(actual_qty WHERE is_cancelled=false) + initial_stock = products.quantity` — 0 mismatch cho sản phẩm có stock_movements ✓. (Pre-Phase 7b stock không có ledger entries — cần backfill opening balance nếu muốn full reconciliation.)
- **Lỗi phát hiện & sửa trong quá trình test:**
  1. `delete_import_v2` lỗi FK `stock_movements_lot_id_fkey ON DELETE RESTRICT` khi xóa lô về 0 → sửa FK thành `ON DELETE SET NULL`.
  2. `create_return_order` lỗi `return_order_items.created_at` không tồn tại → thêm cột + sửa `ORDER BY created_at` → `ORDER BY id DESC` trong SSOT.
  3. `complete_disposal` lỗi `disposal_items.reason` không tồn tại → thêm cột.
  4. `create_exchange_transaction` lỗi `order_items.created_at` không tồn tại → thêm cột.
  5. `get_stock_ledger` trả 0 row khi `p_from_date/p_to_date = NULL` → sửa WHERE clause thêm NULL check.
- `npm run lint`: PASS; `npm run build`: PASS.
- **Phase 7c HOÀN THÀNH.**

## Phase 7 SSOT Hardening — Khóa chặt 3 phát sinh sau Phase 7 (2026-06-30)
- **Phát sinh #1 — SSOT drift cho 3 RPC chưa sync stock ledger:**
  - `supabase_migration_inventory_count_rpc.sql`: thay `complete_inventory_count` bằng bản Phase 7b (có `insert_stock_ledger_entry`); thêm `cancel_inventory_count_rpc` (bản Phase 7b có stock ledger đảo) vào cùng file SSOT. Cập nhật header comment (#5–#8).
  - Tạo file SSOT root-level mới `supabase_migration_process_checkout.sql` chứa `process_checkout` bản mới nhất (lot (4c) + cost (5a) + stock ledger (7b)) từ `supabase/migration_phase7b_stock_ledger.sql`.
- **Phát sinh #2 — Hardening backend `delete_inventory_count_rpc` (defense-in-depth):**
  - Sửa `supabase_migration_delete_inventory_count_rpc.sql`: `RAISE EXCEPTION` khi `v_status = 'completed'`; chỉ cho xóa hẳn khi `draft`/`cancelled`; KHÔNG hoàn kho lại cho `cancelled` (tránh double-count).
  - Tạo + deploy migration delta `supabase/migration_phase7_hardening_delete_inventory_count.sql` lên DB thật `QLBH` (`rsialbfjswnrkzcxarnj`).
  - Test trên DB: phiếu `completed` → RAISE EXCEPTION (msg đúng); phiếu `draft` → xóa OK. Dọn dẹp sạch.
- **Phát sinh #3 — Đánh dấu "KHÔNG CHẠY LẠI" cho 9 file migration cũ:**
  - `supabase_migration_inventory_count_lots.sql` (cập nhật marker thêm cảnh báo stock ledger).
  - `supabase/migration_phase7a_inventory_count_consolidation.sql`, `supabase/migration_phase4c_checkout_lot_write.sql`, `supabase/migration_phase5a_checkout_cost.sql`, `supabase_migration_phase5_logic_sync_fix.sql`, `supabase_migration_phase2_logic_sync_fix.sql`, `supabase_migration_phase3_logic_sync_fix.sql`, `supabase_migration_fix_complete_disposal_ambiguous_v2.sql`, `supabase_migration_fix_disposal_ambiguous_column.sql`.
- Backup: `E:\DỤ ÁN\vietsale-pro-v7_backup_20260630_175922_phase7_ssot_hardening`.
- `npm run lint`: PASS; `npm run build`: PASS.
- **Phase 7 SSOT Hardening HOÀN THÀNH. Sẵn sàng sang Phase 8 (Công nợ KH & NCC).**

## Phase 9 — Khuyến mãi / Pricing (2026-07-01)
- **Mục tiêu:** Áp khuyến mãi đúng thứ tự ưu tiên, đúng điều kiện, không cộng dồn sai (tham chiếu ERPNext Pricing Rule).
- **Migration:** `supabase/migration_phase9_promotion_pricing.sql` thêm 4 cột `priority`, `min_order_value`, `max_discount`, `stackable` vào bảng `promotions`; deploy thành công trên Supabase project `QLBH` (`rsialbfjswnrkzcxarnj`).
- **Frontend:**
  - `types.ts`: thêm `priority`, `minOrderValue`, `maxDiscount`, `stackable` vào `Promotion`.
  - `services/supabaseService.ts`: cập nhật `mapPromotionFromDB`, `mapPromotionToDB`, `getPromotions` sắp xếp theo priority.
  - `pages/Settings.tsx`: form desktop thêm 4 trường mới + hiển thị trong danh sách.
  - `components/MobileSettings.tsx`: form mobile thêm 4 trường mới + hiển thị trong danh sách.
  - `utils/promotionUtils.ts`: sửa `calculatePromotionDiscount` kiểm tra `minOrderValue` và `maxDiscount`; thêm `applyBestPromotions` để xử lý cộng dồn theo quy tắc ERPNext (số nhỏ = ưu tiên cao; non-stackable chọn 1; stackable cộng thêm).
  - `hooks/usePOS.ts`: dùng `applyBestPromotions` để tính discount và truyền `actuallyAppliedPromotions` vào checkout.
  - `components/desktop-pos/modals/PromotionModal.tsx`: hiển thị priority/minOrderValue/stackable.
  - `components/MobilePOS.tsx`: dùng `applyBestPromotions`, `suggestPromotions`, hiển thị thêm thông tin, truyền `actuallyAppliedPromotions` vào checkout.

## Phase 10 — Ledger Cleanup & Backfill Preparation (2026-07-01)
- **Mục tiêu:** Chuẩn bị dữ liệu sổ cái kho và sổ cái công nợ để backfill đầy đủ lịch sử.
- **Phát hiện:**
  - `stock_movements` đang trống (0 dòng) dù đã deploy migration Phase 7c.
  - `customer_payment_ledger` chỉ có 3 dòng, `supplier_payment_ledger` chỉ có 1 dòng do cầu dao idempotency của Phase 8a bỏ qua backfill khi ledger đã có dữ liệu.
  - Các RPC đã đúng bản mới nhất (Phase 7c + 8a/8b/8c), không có SSOT drift.
- **Thực hiện Phase 1:**
  - Tạo backup folder: `C:/Users/SUACAUBA/Downloads/Project/archive/phase1_backup_20260701_102340/`.
  - Ghi `AUDIT_REPORT.md` ghi nhận snapshot trước khi sửa.
  - Export `customer_payment_ledger_backup.json` (3 dòng) và `supplier_payment_ledger_backup.json` (1 dòng).
- **Thực hiện Phase 2:**
  - Chạy `TRUNCATE customer_payment_ledger, supplier_payment_ledger RESTART IDENTITY CASCADE;` trên Supabase project `QLBH` (`rsialbfjswnrkzcxarnj`).
  - Xác nhận 2 bảng đều về 0 dòng.
  - Dữ liệu gốc `orders`, `import_receipts`, `return_orders`, `disposals`, `inventory_counts`, `customers`, `suppliers` không bị ảnh hưởng.
- **Handoff:** Phase 3–6 bàn giao cho đoạn chat khác qua `HANDOFF_PROMPT_LEDGER_BACKFILL_PHASE_3_TO_6.md` trong `C:/Users/SUACAUBA/Downloads/Project/archive/`.
- **Các phase còn lại:**
  - Phase 3: Backfill `customer_payment_ledger` từ `orders` và `return_orders`.
  - Phase 4: Backfill `supplier_payment_ledger` từ `import_receipts`.
  - Phase 5: Backfill `stock_movements` từ `orders`, `import_receipts`, `return_orders`, `disposals`, `inventory_counts`.
  - Phase 6: Sửa RPC `create_exchange_transaction` và `cancel_supplier_exchange` để ghi ledger đầy đủ; reconcile và kiểm tra tổng thể.
- **Kiểm thử:**
  - `npm run lint`: PASS.
  - `npm run build`: PASS.
  - Test logic `applyBestPromotions` trên giỏ hàng 980k với 2 KM test: tổng discount = 147000 (KM1 10% non-stackable + KM2 5% stackable). Giỏ 400k: chỉ KM2 áp được vì KM1 không đủ minOrderValue. Dọn dẹp test data trên DB.
- **Cảnh báo migration cũ:** Các file migration cũ trong `archive/` (đặc biệt `supabase_migration_fix_promotions_rls.sql`) **KHÔNG được chạy lại** sau khi deploy Phase 9. Nếu cần sửa schema promotions, tạo migration mới (phase9b, phase9c...).
- **Còn lại sau Phase 9:** Báo cáo doanh thu/lợi nhuận (Phase 11).

## Phase 10 — Báo cáo doanh thu / lợi nhuận / tồn kho / NCC (2026-07-01)
- **Mục tiêu:** Số liệu báo cáo khớp dữ liệu gốc; loại trừ đơn hủy và hàng đã trả; đồng bộ SSOT repo ↔ DB thật; bổ sung báo cáo NCC (đẩy từ Phase 8).
- **Migration:** `supabase/migration_phase10_reports.sql`:
  - Sửa `get_sales_report`: `active_orders` (`status != 'cancelled'`), doanh thu thuần = `total_amount - total_returned_amount`, trừ hàng trả trong chi tiết.
  - Sửa `get_profit_report`: tương tự, giá vốn thuần = `cost * (quantity - returned_qty)`, kỳ so sánh cũng loại trừ đơn hủy/trả.
  - Sửa `get_inventory_report`: `exportInPeriod` chỉ tính đơn chưa hủy và trừ hàng trả.
  - Tạo `get_supplier_report(p_start_date, p_end_date)` trả về tổng NCC, tổng nợ, tổng đã trả, tổng nhập trong kỳ, top NCC, NCC mới theo ngày, nhập theo NCC.
  - Deploy 4 RPC lên Supabase project `QLBH` (`rsialbfjswnrkzcxarnj`) — success.
- **Frontend:**
  - `services/supabaseService.ts`: thêm `getSupplierReport`.
  - `pages/Reports.tsx`: thêm icon `Truck`, interface `SupplierReport`, state `supplierReport`/`isFetchingSupplier`, effect fetch khi tab active, tab "NCC" trong tab bar, render tab NCC (4 stat cards + PieChart nhập theo NCC + BarChart NCC mới + bảng top NCC), cập nhật `exportToExcel` cho supplier.
- **Kiểm thử thực tế trên DB:**
  - `get_sales_report` 30 ngày: `totalRevenue = 4.981.000` (22 đơn completed, đã trừ 210.000 hàng trả), `cancelledRevenue = 50.000` (2 đơn hủy tách riêng).
  - `get_inventory_report.exportInPeriod`: sản phẩm bị trả hết có `qty = 0`/`value = 0`.
  - `get_supplier_report`: 15 NCC, tổng nợ = 5, tổng đã trả = 1.171.314.99, tổng nhập trong kỳ = 1.171.314.99.
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Cảnh báo migration cũ:** Các file migration cũ phase5c/phase8/phase9 đã bị xóa/đổi `.OLD` trong repo. **KHÔNG được chạy lại** vì sẽ ghi đè logic mới. SSOT duy nhất cho báo cáo là `supabase/migration_phase10_reports.sql`. Các backup cũ ngoài repo (ví dụ `E:\DỤ ÁN\vietsale-pro-v7_backup_*`) vẫn có thể chứa file migration cũ — cần đánh dấu rõ hoặc xóa để tránh chạy lại.
- **Còn lại:** Không — toàn bộ kế hoạch đã hoàn thành.

## Phase 11 — Ledger Backfill & RPC Patch (2026-07-01)
- **Mục tiêu:** Hoàn thành backfill lịch sử sổ cái kho, sổ cái công nợ KH/NCC, và điều chỉnh các RPC đổi/trả hàng để tự động ghi ledger.
- **Thực hiện:**
  - **Phase 3 — Backfill `customer_payment_ledger`:**
    - Chạy migration `archive/migration_phase3_backfill_customer_ledger.sql` trên Supabase project `QLBH` (`rsialbfjswnrkzcxarnj`).
    - Backfill từ `orders` (debt_recorded > 0) và `return_orders` (debt_reduction > 0).
  - **Phase 4 — Backfill `supplier_payment_ledger`:**
    - Chạy migration `archive/migration_phase4_backfill_supplier_ledger.sql`.
    - Backfill từ `import_receipts` (debt_recorded > 0).
  - **Phase 5 — Backfill `stock_movements`:**
    - Tạo/sửa `archive/migration_phase5_backfill_stock_ledger.sql` với function `backfill_stock_ledger()`.
    - Xử lý lỗi type mismatch (`numeric` vs `text`) bằng cách ép kiểu rõ ràng và xử lý `lot_id` không tồn tại trong `product_lots` (do FK).
    - Backfill 5 loại giao dịch: Purchase Receipt (nhập), Sales Invoice (bán), Delivery Note (trả hàng), Stock Entry (xuất hủy), Stock Reconciliation (kiểm kê).
    - Tạo dòng điều chỉnh đầu kỳ (`Stock Reconciliation`) để khớp `products.quantity` và `product_lots.quantity`.
    - Chạy thành công: 445 dòng `stock_movements` được insert.
  - **Phase 6 — Patch RPC ghi ledger:**
    - `archive/migration_phase6a_patch_create_exchange_transaction.sql`: sau khi `create_exchange_transaction` cập nhật `customers.debt`, gọi `insert_customer_ledger_entry` với `amount = v_net_debt_delta` và `reference_type = 'exchange'`.
    - `archive/migration_phase6b_patch_cancel_supplier_exchange.sql`: khi hủy phiếu đổi trả NCC, ghi bút toán đảo kho (`stock_movements` với `is_cancelled = TRUE`) cho hàng trả và hàng nhận đổi, sau đó ghi `supplier_payment_ledger` với `amount = -debt_adjustment`.
- **Kiểm tra reconcile:**
  - `customers.debt` vs `customer_payment_ledger`: 1284 KH, 0 mismatch, max diff = 0.
  - `suppliers.debt` vs `supplier_payment_ledger`: 15 NCC, 0 mismatch, max diff = 0.
  - `products.quantity` / `product_lots.quantity` vs `stock_movements`: 0 dòng lệch.
- **SSOT:**
  - `archive/migration_phase5_backfill_stock_ledger.sql`
  - `archive/migration_phase6a_patch_create_exchange_transaction.sql`
  - `archive/migration_phase6b_patch_cancel_supplier_exchange.sql`
- **Cảnh báo:** Không chạy lại `TRUNCATE` các bảng ledger/kho ngoài backup plan. Nếu cần chạy lại backfill, đảm bảo đã backup và truncate đúng thứ tự.
- **Kiểm thử:** Không có thay đổi frontend trong phase này. `npm run lint` và `npm run build` vẫn PASS từ Phase 10.

## Phase 0 — Tách Kiểm kê ra khỏi Inventory.tsx: Backup & Baseline (2026-07-01)
- **Mục tiêu:** Xác lập baseline sạch trước khi tách `pages/Inventory.tsx` thành 2 page độc lập (`Products` và `InventoryCount`).
- **Baseline:**
  - Backup sẵn có: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_20260701_105444`
  - `npm run lint`: PASS
  - `npm run build`: PASS
- **Vấn đề phát hiện:** File `pages/InventoryCount.tsx` tồn tại dạng incomplete (538 dòng, thiếu phần return JSX và đóng braces), gây lỗi `TS1005: '}' expected` khi chạy `tsc`. File chưa được import trong `App.tsx` nên `vite build` vẫn PASS.
- **Xử lý:** Đã xóa file `pages/InventoryCount.tsx` incomplete để baseline sạch. File sẽ được tạo lại từ đầu trong Phase 1.
- **Kết quả:** `npm run lint` PASS; `npm run build` PASS. Phase 0 PASS.
- **Handoff 10 Phase tiếp theo:** `HANDOFF_PROMPT_SPLIT_INVENTORY_COUNT_PHASED_10.md`

## Phase 1 — Tách Kiểm kê: Tạo skeleton `pages/InventoryCount.tsx` (2026-07-01)
- **Mục tiêu:** Tạo file `pages/InventoryCount.tsx` mới với imports, props, fallback products state, và cấu trúc component cơ bản (placeholder JSX).
- **Files:** `pages/InventoryCount.tsx` (mới).
- **Thực hiện:**
  - Tạo `pages/InventoryCount.tsx` với props `inventoryCounts`, `products`, `onSaveInventoryCount`, `onDeleteInventoryCount`, `onCancelInventoryCount`.
  - Thêm fallback products state: khi `products` prop không được truyền, gọi `supabaseService.getProducts()` để lấy danh sách sản phẩm.
  - Import CSS bắt buộc: `../components/shared/FilterBar.css` và `./Inventory.css`.
  - Component placeholder dùng `PageLayout`.
  - Lưu ý: do xung đột tên giữa type `InventoryCount` và component `InventoryCount`, đã alias type thành `InventoryCountType` khi import (`import type { InventoryCount as InventoryCountType }`).
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Còn lại:** Phase 2–10 (chuyển state, handlers, JSX, làm gọn `Inventory.tsx`, cập nhật routing, verify).
- **Handoff Phase 2–10:** `HANDOFF_PROMPT_SPLIT_INVENTORY_COUNT_PHASE_2_TO_10.md`

## Phase 2 — Tách Kiểm kê: Chuyển state & derived values kiểm kê sang `pages/InventoryCount.tsx` (2026-07-01)
- **Mục tiêu:** Chuyển toàn bộ state, giá trị derived, và DataGrid sort helpers liên quan đến kiểm kê từ `Inventory.tsx` sang `pages/InventoryCount.tsx`.
- **Files:** `pages/InventoryCount.tsx` (mở rộng).
- **Thực hiện:**
  - Copy các state: `countSearchTerm`, `countSearchTerm2`, `countStatusFilter`, `countDateFrom`, `countDateTo`, `countDiffFilter`, `countSortBy`, các flag mở/đóng dropdown, `selectedCountIds`, `isCountFormOpen`, `countFormData`, `editingCount`, `countCurrentPage`, `countPageSize`.
  - Copy các derived values: `countStatusLabels`, `countDiffLabels`, `countSortLabels`, `getCountQtyDiff`, `isCountFilterActive`, `filteredCounts`, `paginatedCounts`, `countTotalPages`, `countStartIndex`, `filteredProductsForCount`, `countSortKey`, `countSortDirection`, `handleCountDataGridSort`.
  - Copy các `useEffect` reset selection/page khi đổi filter/trang và hàm `resetCountFilters`.
  - Thêm constant `ITEMS_PER_PAGE = 20` và import type `SortDirection` từ `../components/DataGrid`.
  - Giữ JSX placeholder; component vẫn syntactically valid.
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Còn lại:** Phase 3–10.
- **Handoff Phase 3–10:** `HANDOFF_PROMPT_SPLIT_INVENTORY_COUNT_PHASE_3_TO_10.md`

## Phase 3 — Tách Kiểm kê: Chuyển handlers kiểm kê sang `pages/InventoryCount.tsx` (2026-07-01)
- **Mục tiêu:** Chuyển toàn bộ handlers kiểm kê từ `Inventory.tsx` sang `pages/InventoryCount.tsx`.
- **Files:** `pages/InventoryCount.tsx` (mở rộng).
- **Thực hiện:**
  - Copy các handlers: `handleScanSuccess` (chỉ mode 'count'), `openCountForm`, `closeCountForm`, `addItemToCount`, `updateCountItem`, `removeCountItem`, `handleSaveCount`, `resetCountFilters`, `handleSelectCount`, `handleSelectAllCounts`, `handleBulkDeleteCounts`, `handleCountDataGridSort`, `handleDownloadCountSample`, `handleExportCountExcel`, `handleImportCountExcel`.
  - Thêm imports: `useRef`, `InventoryCountItem`, `XLSX`.
  - Thêm `countFileInputRef` cho import Excel.
  - Trong `handleScanSuccess`, bỏ logic `scannerMode === 'search' | 'form'` vì `InventoryCount` chỉ có mode `'count'`.
  - Giữ JSX placeholder.
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Còn lại:** Phase 4–10.
- **Handoff Phase 4–10:** `HANDOFF_PROMPT_SPLIT_INVENTORY_COUNT_PHASE_4_TO_10.md`

## Phase 6 — Tách Kiểm kê: Làm gọn `Inventory.tsx` (phần 1) (2026-07-01)
- **Mục tiêu:** Xóa toàn bộ count state, handlers, derived values trong `pages/Inventory.tsx`; giữ nguyên JSX count để xóa ở Phase 7.
- **Files:** `pages/Inventory.tsx`.
- **Thực hiện:**
  - Xóa `type MainView` và `initialView` prop.
  - Xóa `activeMainView` state và `useEffect` sync.
  - Xóa toàn bộ `count*` state, derived values, handlers (`countSearchTerm`/`countSearchTerm2`, `countStatusFilter`, `countDateFrom`, `countDateTo`, `countDiffFilter`, `countSortBy`, `selectedCountIds`, `isCountFormOpen`, `countFormData`, `editingCount`, `countCurrentPage`, `countPageSize`, labels, `getCountQtyDiff`, `filteredCounts`, `paginatedCounts`, `resetCountFilters`, `handleSelectCount`, `handleSelectAllCounts`, `handleBulkDeleteCounts`, `handleCountDataGridSort`).
  - Xóa các handlers: `openCountForm`, `closeCountForm`, `addItemToCount`, `updateCountItem`, `removeCountItem`, `handleSaveCount`, `handleDownloadCountSample`, `handleExportCountExcel`, `handleImportCountExcel`.
  - Xóa các helpers DataGrid kiểm kê: `countSortKey`, `countSortDirection`, `countColumns`.
  - Giữ lại `handleScanSuccess` mode `'search'` và `'form'`; xóa nhánh `scannerMode === 'count'`.
- **Kiểm thử:** `npm run lint`: FAIL như dự kiến — chỉ toàn lỗi `TS2304`/`TS2552` unresolved references từ JSX count, không có lỗi syntax mới.
- **Còn lại:** Phase 7–10.
- **Handoff Phase 7–10:** `HANDOFF_PROMPT_SPLIT_INVENTORY_COUNT_PHASE_7_TO_10.md`.

## Phase 4 — Tách Kiểm kê: Chuyển JSX Kiểm kê (Header, Filter, Stat Cards, Count Form) (2026-07-01)
- **Mục tiêu:** Chuyển JSX kiểm kê (header, filter bar, 5 stat cards, count form) từ `Inventory.tsx` sang `pages/InventoryCount.tsx`.
- **Files:** `pages/InventoryCount.tsx` (mở rộng).
- **Thực hiện:**
  - Thay thế JSX placeholder bằng header cố định Kiểm kê, filter bar tìm kiếm/lọc/sắp xếp, 5 stat cards, count form (`CountFormLayout` + `ProductSearchDropdown` + `CountItemsTable`).
  - Thêm imports cần thiết: `lucide-react` icons, `CountFormLayout`, `CountItemsTable`, `ProductSearchDropdown`, `ActionButton`, `BarcodeScannerFix`, `useRefactoredCountLayout`.
  - Thêm `isScannerOpen` state và `BarcodeScannerFix` để chuẩn bị scanner mode `'count'`.
  - Bỏ các điều kiện `activeMainView === 'counts'` vì toàn bộ page là count view.
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Còn lại:** Phase 5–10.
- **Handoff Phase 5–10:** `HANDOFF_PROMPT_SPLIT_INVENTORY_COUNT_PHASE_5_TO_10.md`

## Phase 5 — Tách Kiểm kê: Chuyển Count List, DataGrid, Mobile Cards, Bulk Actions, Scanner (2026-07-01)
- **Mục tiêu:** Chuyển toàn bộ JSX danh sách phiếu kiểm kê (DataGrid v2 + legacy table, mobile cards, bulk actions, scanner trigger) từ `Inventory.tsx` sang `pages/InventoryCount.tsx`.
- **Files:** `pages/InventoryCount.tsx` (mở rộng).
- **Thực hiện:**
  - Thêm imports `DataGrid`, `DataGridColumn`, `DataGridBox`, `StatusBadge`, `EmptyState`, `useNewDataGridInventoryCounts`, các icon `Ban`, `Trash2`, `Calendar`, `Loader2`, `ChevronLeft`, `ChevronRight`, `ScanBarcode`.
  - Thêm `countColumns: DataGridColumn<InventoryCountType>[]` với alias type đúng quy ước.
  - Thêm `countsDataGridBoxRef`.
  - Chuyển JSX: DataGrid v2 + legacy table fallback, mobile count cards, bulk actions bar.
  - Thêm nút "Quét" mở `BarcodeScannerFix`; `handleScanSuccess` trong `InventoryCount.tsx` chỉ xử lý thêm sản phẩm vào phiếu kiểm kê.
  - Không thay đổi `Inventory.tsx`, `App.tsx`, `vite.config.ts`, `components/BarcodeScannerFix.tsx`, migration/database.
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Còn lại:** Phase 6–10.
- **Handoff Phase 6–10:** `HANDOFF_PROMPT_SPLIT_INVENTORY_COUNT_PHASE_6_TO_10.md`

## Phase 7 — Tách Kiểm kê: Làm gọn `Inventory.tsx` → `Products.tsx` + hoàn thiện routing (2026-07-01)
- **Mục tiêu:** Xóa toàn bộ JSX kiểm kê còn sót trong `pages/Inventory.tsx`, đổi tên file thành `pages/Products.tsx`, hoàn thiện routing tách biệt `/products` và `/inventory-count`.
- **Files:** `pages/Inventory.tsx` → `pages/Products.tsx`, `pages/InventoryCount.tsx`, `App.tsx`, `vite.config.ts`.
- **Thực hiện Phase 7:**
  - Xóa count JSX: header động, filter bar kiểm kê, 5 stat cards kiểm kê, count form, count list DataGrid/legacy table/mobile cards, bulk actions bar kiểm kê.
  - Giữ toàn bộ JSX sản phẩm, danh mục, thương hiệu.
  - Cập nhật imports: xóa `CountFormLayout`, `CountItemsTable`, `ProductSearchDropdown`, `InventoryCount`/`InventoryCountItem` types, các icon count-only (`Calendar`, `ClipboardList`, `CheckCircle`, `FileText`, `ArrowLeft`, `Ban`), `useRefactoredCountLayout`, `useNewDataGridInventoryCounts`.
  - Cập nhật `InventoryProps`: bỏ `inventoryCounts`, `initialView`, `onSaveInventoryCount`, `onDeleteInventoryCount`, `onCancelInventoryCount`.
  - Xóa `countFileInputRef` và `ITEMS_PER_PAGE`.
  - Đổi export `Inventory` → `Products`.
  - Rename file `pages/Inventory.tsx` → `pages/Products.tsx`.
- **Thực hiện Phase 8 (routing) trong cùng session:**
  - `App.tsx`: import `InventoryCount as InventoryCountPage` từ `./pages/InventoryCount` (alias do trùng tên với type `InventoryCount`); route `/products` dùng `<Products ...>`; route `/inventory-count` dùng `<InventoryCountPage ...>` với `inventoryCounts`, `onSaveInventoryCount`, `onDeleteInventoryCount`, `onCancelInventoryCount`.
- **Thực hiện Phase 9 (vite chunk) trong cùng session:**
  - `vite.config.ts`: đổi `pages-inventory` → `pages-products`; thêm `pages-inventory-count`.
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS (xuất hiện chunk `pages-products-*` và `pages-inventory-count-*`).
- **Backup:** `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_20260701_123525`.
- **Còn lại:** Phase 10 (verify, manual testing, tạo backup cuối cùng sau test).
- **Handoff Phase 10:** `HANDOFF_PROMPT_SPLIT_INVENTORY_COUNT_PHASE_8_TO_10.md`.

## Phase 8 — Tách Kiểm kê: Cập nhật `App.tsx` routing (verify & cleanup) (2026-07-01)
- **Mục tiêu:** Verify & cleanup routing trong `App.tsx`: `/products` và `/inventory-count` là 2 route độc lập, không còn import/prop liên quan đến `Inventory` (tên cũ).
- **Files:** `App.tsx`.
- **Thực hiện:**
  - Verify route `/products` render `<Products>` với đúng các props sản phẩm/danh mục/thương hiệu, không còn prop kiểm kê.
  - Verify route `/inventory-count` render `<InventoryCountPage>` với đúng `inventoryCounts`, `onSaveInventoryCount`, `onDeleteInventoryCount`, `onCancelInventoryCount`.
  - Verify mobile `sharedRoutes` bao gồm cả `/products` và `/inventory-count`; mobile route `/products` riêng vẫn dùng `MobileInventory` (page sản phẩm mobile) — không liên quan đến kiểm kê.
  - Cleanup: xóa nếu còn import/prop `Inventory` tên cũ (không còn sót).
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Còn lại:** Phase 9–10.
- **Handoff Phase 9–10:** `HANDOFF_PROMPT_SPLIT_INVENTORY_COUNT_PHASE_8_TO_10.md`.

## Phase 9 — Tách Kiểm kê: Cập nhật `vite.config.ts` và imports liên quan (2026-07-01)
- **Mục tiêu:** Verify `vite.config.ts` manualChunks và toàn bộ import cũ từ `pages/Inventory` (không phải `InventoryCount`) đã được xử lý.
- **Files:** `vite.config.ts`, toàn bộ source imports.
- **Thực hiện:**
  - Verify `vite.config.ts` không còn entry `'pages-inventory': ['./pages/Inventory.tsx']`.
  - Verify `vite.config.ts` có cả `'pages-products': ['./pages/Products.tsx']` và `'pages-inventory-count': ['./pages/InventoryCount.tsx']`.
  - Search toàn project: không còn source import `from './pages/Inventory'` hoặc `import { Inventory }` (tên cũ, không phải `InventoryCount`).
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS (xuất hiện chunk `pages-products-*` và `pages-inventory-count-*`).
- **Còn lại:** Phase 10 (verify, manual testing, tạo backup cuối cùng sau test).
- **Handoff Phase 10:** `HANDOFF_PROMPT_SPLIT_INVENTORY_COUNT_PHASE_10.md`.

## Phase 10 — Tách Kiểm kê: Manual Testing & Final Backup (2026-07-01)
- **Mục tiêu:** Chạy kiểm thử toàn diện: lint, build, dev server, test chức năng `/products`, `/inventory-count`, mobile menu, `/import`.
- **Files liên quan:** `pages/Products.tsx`, `pages/InventoryCount.tsx`, `components/MobileInventory.tsx`, `components/MobileLayout.tsx`, `components/BottomNav.tsx`, `pages/ImportGoods.tsx`.
- **Thực hiện:**
  - `npm run lint`: PASS.
  - `npm run build`: PASS.
  - Dev server `npm run dev` chạy tại `http://localhost:3000/`.
  - Đăng nhập thành công bằng tài khoản người dùng cung cấp.
  - **Test `/products`:** tạo/sửa/xóa sản phẩm test (`TEST_P10_20260701`), tìm kiếm server-side theo tên/mã, phân trang hoạt động. Lưu ý: hàng động thao tác (sửa/xóa) ở hàng cuối cùng có thể bị đè bởi thanh phân trang cố định (sticky pagination) — dùng viewport cao hoặc JS click để vượt qua.
  - **Test `/inventory-count`:** tạo phiếu kiểm kê mới (`CK260701005`), thêm sản phẩm từ dropdown tìm kiếm, lưu nháp, hủy phiếu (sau reload trang trạng thái cập nhật thành `Đã huỷ`), xóa hẳn phiếu đã hủy. Dữ liệu test đã dọn dẹp.
  - **Test Mobile:** viewport mobile 375x812 — menu mobile hiển thị mục `Kiểm kê`, `/products` mobile (`MobileInventory`) và `/inventory-count` mobile đều render đúng.
  - **Test `/import` (Nhập hàng):** trang `Phiếu nhập hàng` mở bình thường, không bị ảnh hưởng bởi việc tách Kiểm kê. (Lưu ý: route hiện tại là `/import`, không phải `/import-goods` trong URL trực tiếp.)
  - Không có migration/database mới trong phase này.
- **Backup:** `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_20260701_131600` (đã tạo sau khi hoàn thành test, không bao gồm `node_modules`/`dist`).
- **Kiểm thử:** `npm run lint`: PASS; `npm run build`: PASS.
- **Trạng thái:** Phase 10 hoàn thành. Tất cả các phase Tách Kiểm kê đã xong. Không còn phase nào liên quan.
- **Handoff / Final report:** `HANDOFF_PROMPT_SPLIT_INVENTORY_COUNT_COMPLETE.md`.

## Phase 1 — Inventory Count CSS Refactor: Audit & Setup `InventoryCount.css` (2026-07-01)
- **Mục tiêu:** Tạo foundation CSS cho trang `pages/InventoryCount.tsx`, dùng design tokens thay vì hardcoded Tailwind.
- **Files:** `pages/InventoryCount.css` (mới), `pages/InventoryCount.tsx` (thêm import).
- **Thực hiện:**
  - Tạo `pages/InventoryCount.css` với các block BEM cơ bản: `.inventory-count-page`, `.inventory-count-page__header`, `.inventory-count-page__title-icon`, `.inventory-count-page__toolbar`, `.inventory-count-page__toolbar-btn` (+ `--sample`, `--import`, `--export`), `.inventory-count-page__filter-bar`, `.inventory-count-page__bulk-bar`, `.inventory-count-page__bulk-bar-btn`.
  - Tất cả giá trị dùng design tokens (`var(--color-*)`, `var(--space-*)`, `var(--radius-*)`, `var(--shadow-*)`, `var(--motion-fast)`, `var(--ease-standard)`).
  - Import `InventoryCount.css` vào `pages/InventoryCount.tsx`.
  - Chưa sửa JSX trong phase này.

## Phase 5 — Inventory Count CSS Refactor: Extract `ProductSearchDropdown.css` (2026-07-01)
- **Mục tiêu:** Tách toàn bộ inline Tailwind trong component `ProductSearchDropdown.tsx` sang CSS file riêng dùng BEM + design tokens.
- **Files:** `components/inventory-count/ProductSearchDropdown.tsx` (sửa), `components/inventory-count/ProductSearchDropdown.css` (mới).
- **Thực hiện:**
  - Tạo `ProductSearchDropdown.css` với các block BEM: `.product-search-dropdown`, `.product-search-dropdown__label`, `.product-search-dropdown__label--disabled`, `.product-search-dropdown__icon`, `.product-search-dropdown__input`, `.product-search-dropdown__clear`, `.product-search-dropdown__results`, `.product-search-dropdown__result`, `.product-search-dropdown__result-icon`, `.product-search-dropdown__result-info`, `.product-search-dropdown__result-name`, `.product-search-dropdown__result-meta`, `.product-search-dropdown__result-code`, `.product-search-dropdown__result-qty`, `.product-search-dropdown__result-add`, `.product-search-dropdown__empty`, `.product-search-dropdown__empty-inner`, `.product-search-dropdown__empty-icon`, `.product-search-dropdown__empty-text`, `.product-search-dropdown__empty-term`.
  - Thay tất cả inline Tailwind trong `ProductSearchDropdown.tsx` bằng các class BEM trên.
  - Import `ProductSearchDropdown.css` trong component.
  - Giữ nguyên animation dropdown dùng keyframe `fade-in-down` global.
  - Không thay đổi logic nghiệp vụ, không thay đổi database.
- **Kiểm thử:** `npm run lint`: PASS; `npm run build`: PASS.
- **Còn lại:** Phase 6, 8, 9, 10 (Phase 7 skipped do xóa V1 legacy ở Phase 8).
- **Handoff Phase 6–10:** `HANDOFF_PROMPT_INVENTORY_COUNT_CSS_PHASE_6_TO_10.md`.
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Quyết định V1 legacy path (chốt sau Phase 1):** Chọn **Option A** — xóa hoàn toàn V1 path trong 4 file `CountItemsTable.tsx`, `CountFormLayout.tsx`, `CountInfoSection.tsx`, `CountSummary.tsx` ở Phase 8. Phase 7 (refactor `ModalSection` accent prop của V1) được skipped. Lý do: feature flag `useRefactoredCountLayout` đã bật V2, V1 là dead code; xóa giúp giảm nợ kỹ thuật và chỉ còn 1 nguồn sự thật khi chỉnh design system/template lâu dài.
- **Handoff Phase 2–10:** `HANDOFF_PROMPT_INVENTORY_COUNT_CSS_PHASE_2_TO_10.md` (đã cập nhật theo Option A).

## Phase 2 — Inventory Count CSS Refactor: Header, Filter Bar, Toolbar, Bulk Bar (2026-07-01)
- **Mục tiêu:** Thay inline Tailwind ở header, filter bar, toolbar 3 nút (Mẫu/Nhập/Xuất), bulk bar bằng class BEM + design tokens đã tạo ở Phase 1.
- **Files:** `pages/InventoryCount.tsx`, `pages/InventoryCount.css`.
- **Thực hiện:**
  - Thay `page-header` + `inv-title-icon` + wrapper `flex items-center gap-6/gap-3` bằng `.inventory-count-page__header` + `.inventory-count-page__title-group` + `.inventory-count-page__title-icon`. Bỏ `w-4 h-4` trên icon vì CSS đã style `svg`.
  - Thay wrapper actions `flex flex-wrap items-center gap-2` bằng `.inventory-count-page__actions`.
  - Thay toolbar 3 nút inline Tailwind bằng `.inventory-count-page__toolbar` + `.inventory-count-page__toolbar-btn` + modifier `--sample`, `--import`, `--export`. Thay divider bằng `.inventory-count-page__toolbar-divider`.
  - Thay bulk bar inline Tailwind bằng `.inventory-count-page__bulk-bar` + `.inventory-count-page__bulk-bar-count` + `.inventory-count-page__bulk-bar-divider` + `.inventory-count-page__bulk-bar-btn` + `.inventory-count-page__bulk-bar-close`.
  - Dọn dẹp inline Tailwind còn sót trong filter bar: xóa `md:mx-4`, `w-4 h-4` trên icon trigger, `w-3 h-3 text-white` trên icon check, `w-4 h-4` trên icon reset.
  - Bổ sung các class CSS còn thiếu trong `pages/InventoryCount.css`: `.inventory-count-page__title-group`, `.inventory-count-page__actions`, `.inventory-count-page__toolbar-divider`, `.inventory-count-page__bulk-bar-divider`, `.inventory-count-page__bulk-bar-count`, `.inventory-count-page__bulk-bar-close`. Cập nhật `.inventory-count-page__toolbar` thêm border/bg/shadow/padding.
  - Không thay đổi logic nghiệp vụ.
  - Không có thay đổi database.
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Quyết định nhỏ:** Dùng `.inventory-count-page__title-icon` thay vì `inv-title-icon` (đã có CSS chung) để nhất quán với BEM của trang Kiểm kê. Không phát sinh option mới cần hỏi ý kiến.
- **Handoff Phase 3–10:** `HANDOFF_PROMPT_INVENTORY_COUNT_CSS_PHASE_3_TO_10.md`.

## Phase 3 — Inventory Count CSS Refactor: Desktop Custom Table (2026-07-01)
- **Mục tiêu:** Thay inline Tailwind trong table custom HTML (V1 fallback) của `pages/InventoryCount.tsx` bằng class BEM + design tokens.
- **Files:** `pages/InventoryCount.tsx`, `pages/InventoryCount.css`.
- **Thực hiện:**
  - Tạo các class BEM trong `pages/InventoryCount.css`: `.inventory-count-table__wrapper`, `.inventory-count-table`, `.inventory-count-table__head`, `.inventory-count-table__head-cell` (+ `--sortable`, `--center`, `--right`, `--checkbox`), `.inventory-count-table__body`, `.inventory-count-table__row`, `.inventory-count-table__cell` (+ `--center`, `--right`, `--checkbox`), `.inventory-count-table__checkbox`, `.inventory-count-table__icon-wrap`, `.inventory-count-table__actions`, `.inventory-count-table__action-btn` (+ `--cancel`, `--delete`), `.inventory-count-table__empty-cell`.
  - Thay inline Tailwind trong table custom HTML (V1 fallback) bằng các class BEM trên.
  - Hardcoded `#FAFBFC` chuyển thành `var(--color-bg-secondary)`.
  - Reuse V2 text classes (`inventory-count-v2-index`, `inventory-count-v2-code`, `inventory-count-v2-date`, `inventory-count-v2-items`, `inventory-count-v2-diff`, `inventory-count-v2-value`) để tránh duplicate styling cho nội dung cột.
  - Không thay đổi logic nghiệp vụ.
  - Không có thay đổi database (CSS-only refactor).
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Quyết định:** Không phát sinh option mới cần hỏi ý kiến. Quyết định V1 legacy path (Option A) vẫn giữ nguyên.
- **Handoff Phase 4–10:** `HANDOFF_PROMPT_INVENTORY_COUNT_CSS_PHASE_4_TO_10.md`.

## Phase 4 — Inventory Count CSS Refactor: Pagination & Mobile Card View (2026-07-01)
- **Mục tiêu:** Thay inline Tailwind trong pagination desktop/mobile và mobile card view của `pages/InventoryCount.tsx` bằng class BEM + design tokens.
- **Files:** `pages/InventoryCount.tsx`, `pages/InventoryCount.css`.
- **Thực hiện:**
  - Tạo các class BEM trong `pages/InventoryCount.css`: `.inventory-count-pagination`, `.inventory-count-pagination--mobile`, `.inventory-count-pagination__info`, `.inventory-count-pagination__nav`, `.inventory-count-pagination__btn`, `.inventory-count-pagination__btn--active`, `.inventory-count-pagination__ellipsis`, `.inventory-count-mobile-list`, `.inventory-count-mobile-card`, `.inventory-count-mobile-card__header`, `.inventory-count-mobile-card__title`, `.inventory-count-mobile-card__icon`, `.inventory-count-mobile-card__code`, `.inventory-count-mobile-card__date`, `.inventory-count-mobile-card__footer`, `.inventory-count-mobile-card__items`, `.inventory-count-mobile-card__diff` (+ modifier `--up`, `--down`, `--zero`).
  - Thay inline Tailwind trong pagination desktop/mobile và mobile card view bằng các class BEM trên.
  - Box-shadow card mobile chuyển từ `shadow-[0_2px_8px_rgba(15,23,42,0.03)]` sang `var(--shadow-card)`.
  - Giá trị lệch trong mobile card dùng modifier `--up` / `--down` / `--zero` thay vì inline ternary class.
  - Không dùng class chung `.pagination-toolbar` vì `index.css` không định nghĩa nó riêng; đã tạo block BEM riêng cho Tab Kiểm kê.
  - Không thay đổi logic nghiệp vụ.
  - Không có thay đổi database (CSS-only refactor).
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Quyết định:** Không phát sinh option mới cần hỏi ý kiến. Quyết định V1 legacy path (Option A) vẫn giữ nguyên.
- **Handoff Phase 5–10:** `HANDOFF_PROMPT_INVENTORY_COUNT_CSS_PHASE_5_TO_10.md`.

## Phase 6 — Inventory Count CSS Refactor: Extract `CountFormLayout.css` & `ExcelImportSection.css` (2026-07-01)
- **Mục tiêu:** Tách toàn bộ inline Tailwind còn sót trong `CountFormLayout.tsx` (textarea V1 fallback) và `ExcelImportSection.tsx` (2 nút Tải mẫu / Nhập file) sang CSS file riêng dùng BEM + design tokens.
- **Files:** `components/inventory-count/CountFormLayout.tsx` (sửa), `components/inventory-count/CountFormLayout.css` (mở rộng), `components/inventory-count/CountSidebar/ExcelImportSection.tsx` (sửa), `components/inventory-count/CountSidebar/ExcelImportSection.css` (mới).
- **Thực hiện:**
  - Mở rộng `CountFormLayout.css` thêm class `.count-notes-textarea--legacy` và `.count-notes-modal-icon` với đầy đủ design tokens, thay thế textarea V1 fallback và icon V1 trong `CountFormLayout.tsx`.
  - Tạo `ExcelImportSection.css` với các block BEM: `.excel-import-section`, `.excel-import-section__title`, `.excel-import-section__title-icon`, `.excel-import-section__grid`, `.excel-import-section__btn`, `.excel-import-section__btn--template`, `.excel-import-section__btn--import`, `.excel-import-section__btn-icon`.
  - Thay tất cả inline Tailwind trong `ExcelImportSection.tsx` bằng các class BEM trên; import `ExcelImportSection.css` trong component; input file ẩn dùng thuộc tính HTML `hidden` thay vì `className="hidden"`.
  - Giữ nguyên V2 path của `CountFormLayout.tsx` (textarea dùng `.count-notes-textarea`). Prop `accent` của `ModalSection` trong V1 được giữ nguyên vì Phase 7 đã skipped và V1 sẽ bị xóa ở Phase 8.
  - Không thay đổi logic nghiệp vụ.
  - Không có thay đổi database (CSS-only refactor).
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Quyết định:** Không phát sinh option mới cần hỏi ý kiến. Quyết định V1 legacy path (Option A) vẫn giữ nguyên.
- **Handoff Phase 7–10:** `HANDOFF_PROMPT_INVENTORY_COUNT_CSS_PHASE_7_TO_10.md`.

## Phase 7 — Inventory Count CSS Refactor: ModalSection accent prop (Skipped) (2026-07-01)
- **Mục tiêu:** Gốc là loại bỏ inline style prop `accent="bg-indigo-50/40 border-indigo-100"` trong V1 fallback của `CountInfoSection` và `CountSummary`.
- **Trạng thái:** **Skipped** — do quyết định V1 legacy path (Option A — xóa hoàn toàn V1) đã được chốt từ trước, V1 fallback sẽ bị xóa ở Phase 8, nên không cần refactor CSS của nó nữa.
- **Files:** Không thay đổi file nào.
- **Thực hiện:**
  - Xác nhận `useRefactoredCountLayout` trong `features.ts` vẫn là `true`.
  - Không xóa V1 branch ở phase này (để dành cho Phase 8).
  - Không thay đổi logic nghiệp vụ.
  - Không có thay đổi database (CSS-only refactor).
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Quyết định:** Không phát sinh option mới cần hỏi ý kiến. Option A (xóa V1) vẫn giữ nguyên.
- **Handoff Phase 8–10:** `HANDOFF_PROMPT_INVENTORY_COUNT_CSS_PHASE_8_TO_10.md`.

## Phase 8 — Remove V1 Legacy Path in All Count Components (2026-07-01)
- **Mục tiêu:** Xóa hoàn toàn V1 legacy path trong 4 file vì `useRefactoredCountLayout` đang bật (Option A đã chốt).
- **Files:** `components/inventory-count/CountItemsTable.tsx`, `components/inventory-count/CountFormLayout.tsx`, `components/inventory-count/CountSidebar/CountInfoSection.tsx`, `components/inventory-count/CountSidebar/CountSummary.tsx`, `components/inventory-count/CountFormLayout.css`, `components/inventory-count/CountItemsTable.css`.
- **Thực hiện:**
  - Xóa import `useRefactoredCountLayout` trong 4 file component (flag vẫn giữ trong `features.ts` vì còn dùng trong `pages/InventoryCount.tsx`).
  - Xóa toàn bộ V1 branch trong 4 file, giữ lại V2 path.
  - Xóa import `FileText`, `ModalSection`, `ClipboardList`, `DollarSign` không còn dùng.
  - Xóa `headerCells`, `statusAccentClass` trong `CountItemsTable.tsx`.
  - Xóa `.count-notes-textarea--legacy`, `.count-notes-modal-icon` trong `CountFormLayout.css`.
  - Xóa các class V1 `.ig-table .col-*` và `.count-diff-value` trong `CountItemsTable.css`.
  - Sửa lại ký tự tiếng Việt bị lỗi encoding trong `CountSummary.tsx`.
  - Không thay đổi logic nghiệp vụ.
  - Không có thay đổi database (CSS-only refactor).
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Quyết định:** Không phát sinh option mới cần hỏi ý kiến. Option A (xóa V1) vẫn giữ nguyên.
- **Handoff Phase 9–10:** `HANDOFF_PROMPT_INVENTORY_COUNT_CSS_PHASE_9_TO_10.md`.

## Phase 9 — Consolidate & Review Design Tokens (Option A — Sạch hoàn toàn) (2026-07-01)
- **Mục tiêu:** Chuyển 100% inline Tailwind còn sót trong TSX của Tab Kiểm kê sang BEM + design tokens; gộp CSS `inventory-count-v2-*` từ `pages/Inventory.css` sang `pages/InventoryCount.css`.
- **Files:** `pages/InventoryCount.tsx`, `pages/InventoryCount.css`, `pages/Inventory.css`, `components/inventory-count/CountItemsTable.css`, `components/inventory-count/CountFormLayout.css`, `components/inventory-count/CountSidebar/CountInfoSection.css`.
- **Thực hiện:**
  - Trong `pages/InventoryCount.tsx`:
    - Thay `grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4` → `.inventory-count-page__stats-grid`.
    - Thay `hidden md:flex` trên `DataGridBox` → `.inventory-count-page__data-grid-box`.
    - Thay `flex-1 min-h-0` trên `DataGrid` → `.inventory-count-page__data-grid`.
    - Thay `hidden` trên input file → `.inventory-count-page__file-input`.
    - Thay `flex-1 min-h-0 flex flex-col` form container → `.inventory-count-page__form-container`.
    - Thay icon utility `w-4 h-4` / `w-6 h-6` / `w-10 h-10` bằng các class BEM cục bộ (`.inventory-count-page__btn-icon`, `.inventory-count-page__empty-icon`) hoặc bỏ className để dùng ActionButton/inv-stat-icon wrapper.
    - Xóa nhánh V1 `!useRefactoredCountLayout` trong `actions` của `CountFormLayout`.
    - Xóa import `useRefactoredCountLayout` (flag vẫn giữ trong `features.ts`).
  - Trong `pages/InventoryCount.css`:
    - Bổ sung `.inventory-count-page__stats-grid`, `.inventory-count-page__data-grid-box`, `.inventory-count-page__data-grid`, `.inventory-count-page__file-input`, `.inventory-count-page__form-container`, `.inventory-count-page__btn-icon`, `.inventory-count-page__empty-icon`.
    - Chuyển toàn bộ block `inventory-count-v2-*` từ `pages/Inventory.css` sang.
  - Trong `pages/Inventory.css`: xóa block `inventory-count-v2-*` đã chuyển đi.
  - Trong `components/inventory-count/CountItemsTable.css`, `CountFormLayout.css`, `CountSidebar/CountInfoSection.css`: thay các giá trị `2px` / `1px` hardcoded trong `box-shadow` bằng `var(--border-width-medium)` / `var(--border-width-default)`; bỏ fallback màu hardcoded trong `.count-table__select--warning`.
  - Không thay đổi logic nghiệp vụ.
  - Không có thay đổi database (CSS-only refactor).
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Quyết định:** Có phát sinh option ở đầu Phase 9 (A/B/C); user chọn **Option A — Sạch hoàn toàn**.

## Phase 10 — Final Verification & Documentation (2026-07-01)
- **Mục tiêu:** Chạy kiểm thử cuối cùng, cập nhật tài liệu, tạo backup.
- **Files:** `AGENTS.md`, backup folder.
- **Thực hiện:**
  - Chạy `npm run lint` — PASS.
  - Chạy `npm run build` — PASS.
  - Khởi chạy dev server (`npm run dev`) trên port 3001.
  - Dùng `agent-browser` mở `http://localhost:3001`; trang hiển thị màn hình đăng nhập. Cố gắng đăng nhập với credentials mặc định nhưng form báo "Please fill out this field" / cần credentials chính xác — không tiến sâu vào được Tab Kiểm kê qua browser automation trong session này.
  - Tạo backup: `E:/App ban hàng/vietsale-pro-v7_backup_20260701_151851`.
  - Append ghi chú Phase 8/9/10 vào `AGENTS.md`.
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Quyết định:** Không phát sinh option mới cần hỏi ý kiến.
- **Closeout:** Đã xuất file bàn giao kết thúc chuỗi phase — `HANDOFF_PROMPT_INVENTORY_COUNT_CSS_POST_PHASE_10.md`.

## Post Phase 10 — Audit `pages/Inventory.css` (2026-07-01)
- **Audit `pages/Inventory.css`:** Tất cả các class còn lại đều đang được dùng trong `pages/Products.tsx` (`.inventory-v2-product-name`, `.inventory-v2-name`, `.inventory-v2-sub`, `.inventory-v2-actions`, `.prd-table`, `.prd-table-empty`). Không có class thừa cần xóa.
- **Phát hiện & dọn dẹp:** `pages/InventoryCount.tsx` vẫn import `Inventory.css` mặc dù không dùng bất kỳ class nào từ file này. Đã xóa `import './Inventory.css';` khỏi `pages/InventoryCount.tsx`.
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.
- **Không có thay đổi database.**

## Stock Ledger Recovery — Phase 1: Root Cause Analysis & Backup (2026-07-01)
- **Mục tiêu:** Xác minh nguyên nhân 5 SP có lô bị lệch giữa `products.quantity` và `SUM(stock_movements.actual_qty)` trên DB thật project `QLBH` (`rsialbfjswnrkzcxarnj`).
- **Phát hiện:**
  - 5 SP có lô bị lệch: `8936142671759` (Metacare, +10), `8938501434012` (Yakult, -8), `8710428009791` (Glucerna, +1), `850063183130` (Kiiubee, -1), `8886451071378` (Ensure Gold, +1).
  - 13 dòng `stock_movements` có `lot_id = NULL` thuộc SP có lô — chính là nguyên nhân lệch.
  - 445 dòng `stock_movements` tổng cộng; 411 dòng `lot_id = NULL` (phần lớn là SP không lô); 195 dòng `OPENING-BALANCE`.
- **Root cause:**
  - `archive/migration_phase5_backfill_stock_ledger.sql` function `backfill_stock_ledger()` khi không tìm được lô khớp đã ghi `lot_id = NULL` cho SP có lô.
  - `qty_after_transaction` được tính từ balance không lũy kế đúng per lot do điều kiện `(lot_id IS NULL OR lot_id = v_rec.lot_id)` nhiễu giữa product-level và lot-level.
- **Source code:**
  - `archive/migration_phase5_backfill_stock_ledger.sql` (backfill gốc — KHÔNG chạy lại).
  - `archive/migration_phase7c_stock_ledger_complete.sql` (các RPC tạo movement).
  - `.temp/phase7c_sections/09_get_stock_ledger.sql`, `10_get_stock_balance.sql`.
- **Backup production DB:**
  - Tạo 3 bảng backup trong DB thật:
    - `backup_stock_movements_pre_phase2` — 445 dòng.
    - `backup_product_lots_pre_phase2` — 9 dòng.
    - `backup_products_pre_phase2` — 197 dòng.
    - `backup_stock_ledger_meta` — metadata (timestamp: 2026-07-01 09:05:15 UTC).
- **Báo cáo:** `.temp/stock_ledger_recovery_phase1_report.md`.
- **Handoff Phase 2:** `HANDOFF_PROMPT_FIX_STOCK_LEDGER_PHASE_2.md`.
- **Kiểm thử:** `npm run lint`: PASS; `npm run build`: PASS. Phase 1 không sửa code frontend.

## Phase 2 — Fix Stock Ledger Recovery: Backfill v2 (2026-07-01)
- **Mục tiêu:** Thiết kế, deploy và kiểm thử `backfill_stock_ledger_v2()` để rebuild `stock_movements` đúng theo lô, đảm bảo `products.quantity = SUM(product_lots.quantity) = SUM(stock_movements.actual_qty)` và `qty_after_transaction` lũy kế đúng per `(product_id, lot_id)`.
- **Migration SSOT:** `supabase/migration_fix_stock_ledger_phase2_backfill_v2.sql`.
- **Thay đổi backend:**
  - Sửa `insert_stock_ledger_entry()`: idempotency guard dùng `lot_id IS NOT DISTINCT FROM p_lot_id` để xử lý đúng `NULL`.
  - Thêm helper `backfill_v2_resolve_lot`, `backfill_v2_ensure_lot`, `backfill_v2_allocate_variance`.
  - Thêm function chính `backfill_stock_ledger_v2()` rebuild movement:
    - Gán lot đúng cho nhập/bán/trả/hủy/kiểm kê.
    - Phân bổ chênh lệch kiểm kê theo FIFO/FEFO đã duyệt.
    - Tạo dòng `OPENING-BALANCE` nếu cần để khớp `product_lots.quantity` / `products.quantity`.
    - Tính `qty_after_transaction` lũy kế per `(product_id, lot_id)`.
- **Sửa lỗi phát hiện khi test:** bước gán `line_id` ban đầu dùng `ctid` bị sai do PostgreSQL đổi `ctid` sau UPDATE. Đã sửa bằng cách thêm `tmp_id bigserial PRIMARY KEY` vào temp table và dùng `tmp_id` thay cho `ctid`.
- **Deploy:** Migration đã apply thành công lên Supabase project `QLBH` (`rsialbfjswnrkzcxarnj`). Function đã được cập nhật trên DB thật.
- **Kiểm thử trên DB thật (transaction có ROLLBACK):**
  - Function `debug_backfill_full_check()` (đã xóa sau test) xử lý 446 dòng, trả về 0 mismatch cho cả 5 điều kiện:
    - SP có lô: không có movement `lot_id = NULL`.
    - SP không lô: `products.quantity = SUM(stock_movements.actual_qty)`.
    - SP có lô: `SUM(product_lots.quantity) = SUM(stock_movements.actual_qty)`.
    - SP có lô: `MAX(qty_after_transaction)` per lot = `product_lots.quantity`.
    - SP không lô: `MAX(qty_after_transaction)` = `products.quantity`.
  - 5 SP lệch từ Phase 1 đều khớp sau backfill.
  - Sau `ROLLBACK`, `stock_movements` gốc vẫn 445 dòng.
- **Báo cáo:** `.temp/stock_ledger_recovery_phase2_report.md`.
- **Handoff Phase 3:** `HANDOFF_PROMPT_FIX_STOCK_LEDGER_PHASE_3.md`.
- **Chưa thực hiện:** Chưa truncate + chạy backfill thực tế trên production; dữ liệu gốc vẫn giữ nguyên.
- **Kiểm thử frontend:** Không sửa code frontend; `npm run lint` / `npm run build` vẫn PASS theo baseline (không chạy lại trong session này vì không thay đổi TS/JS).

## Phase 3 — Fix Stock Ledger Recovery: Production Truncate + Backfill (2026-07-01)
- **Mục tiêu:** Thực hiện truncate + chạy `backfill_stock_ledger_v2()` trên production DB, sau đó verify và khóa kết quả.
- **Pre-deploy:**
  - Backup từ Phase 2 còn nguyên vẹn: `backup_stock_movements_pre_phase2`, `backup_product_lots_pre_phase2`, `backup_products_pre_phase2`, `backup_stock_ledger_meta`.
  - Xác nhận `backfill_stock_ledger_v2()` đúng phiên bản có `tmp_id bigserial`.
  - Xác nhận `insert_stock_ledger_entry()` đã có guard `lot_id IS NOT DISTINCT FROM p_lot_id`.
  - Trạng thái trước deploy: 445 dòng `stock_movements`, 5 SP có lô mismatch, 13 dòng `lot_id = NULL` cho SP có lô.
- **Deploy thực tế:**
  ```sql
  BEGIN;
  TRUNCATE public.stock_movements;
  SELECT public.backfill_stock_ledger_v2();
  COMMIT;
  ```
  - Kết quả: `{"success": true, "rows_processed": 446}`.
- **Verification (sau COMMIT):**
  1. SP có lô: `products.quantity = SUM(product_lots.quantity) = SUM(stock_movements.actual_qty)` → 0 mismatch. ✅
  2. SP không lô: `products.quantity = SUM(stock_movements.actual_qty)` → 0 mismatch. ✅
  3. Không còn dòng `lot_id = NULL` cho SP có lô → 0 rows. ✅
  4. `qty_after_transaction` lũy kế đúng per `(product_id, lot_id)` → 0 mismatch (dùng query so sánh dòng cuối cùng với tổng, không dùng `MAX`). ✅
  5. `qty_after_transaction` lũy kế đúng cho SP không lô → 0 mismatch. ✅
  6. `get_stock_balance(NULL, NOW())` không trả số âm → 0 rows. ✅
  7. 5 SP lệch cụ thể từ Phase 1 đều khớp. ✅
- **Số dòng sau backfill:** 446 dòng (tăng 1 so với 445 gốc do cách phân bổ điều chỉnh kiểm kê).
- **Lưu ý quan trọng:** Verify query 4/5 trong handoff gốc dùng `MAX(qty_after_transaction) <> SUM(actual_qty)` là không chính xác khi có `OPENING-BALANCE` lớn và sau đó xuất hàng dần (lúc đó `MAX` có thể xuất hiện ở giữa chuỗi). Đã sửa lại trong báo cáo Phase 3.
- **Báo cáo:** `.temp/stock_ledger_recovery_phase3_report.md`.
- **Handoff các phase còn lại:** `HANDOFF_PROMPT_FIX_STOCK_LEDGER_PHASE_4_5_6.md`.
- **Rollback plan:** Không cần dùng vì tất cả verify PASS.

## Phase 4 — Fix Stock Ledger Recovery: Production Deep Verify & Cross-check (2026-07-01)
- **Mục tiêu:** Kiểm tra toàn diện sau backfill production: re-verify invariant, reconcile customer/supplier ledger, kiểm tra RPC `get_stock_ledger`/`get_stock_balance`, smoke test UI `/stock-ledger`.
- **Verification (7 queries):**
  1. SP có lô: 0 mismatch. ✅
  2. SP không lô: 0 mismatch. ✅
  3. Không còn dòng `lot_id = NULL` cho SP có lô → 0 rows. ✅
  4. `qty_after_transaction` lũy kế đúng per lot (so dòng cuối cùng với tổng) → 0 mismatch. ✅
  5. `qty_after_transaction` lũy kế đúng cho SP không lô → 0 mismatch. ✅
  6. `get_stock_balance(NULL, NOW())` không trả số âm → 0 rows. ✅
  7. 5 SP lệch cụ thể từ Phase 1 đều khớp. ✅
- **Customer/supplier ledger reconcile:**
  - `SUM(customers.debt)` = 363,000.00 = `SUM(orders.debt_recorded WHERE status <> 'cancelled')` (363,000) - `SUM(return_orders.debt_reduction WHERE status = 'completed')` (0.00). ✅
  - `SUM(suppliers.debt)` = 5.00 = `SUM(import_receipts.debt_recorded WHERE status = 'completed')` (5) - `SUM(supplier_exchanges.debt_adjustment WHERE status = 'completed')` (0.00). ✅
  - Per-customer / per-supplier diff query: 0 rows. ✅
- **RPC/UI smoke test:**
  - `pg_proc` xác nhận 4 function tồn tại: `backfill_stock_ledger_v2`, `get_stock_balance`, `get_stock_ledger`, `insert_stock_ledger_entry`. ✅
  - `stock_movements` = 446 dòng; `get_stock_ledger(NULL, NOW() - 30 days, NOW())` = 48 dòng. ✅
  - Route `/stock-ledger` trong `App.tsx`; menu trong `AppTopbar.tsx`; `pages/StockLedger.tsx` mapping đúng DB → UI. ✅
- **Không phát hiện mismatch còn sót:** sẵn sàng chuyển Phase 5 + 6.
- **Báo cáo:** `.temp/stock_ledger_recovery_phase4_report.md`.
- **Handoff các phase còn lại:** `HANDOFF_PROMPT_FIX_STOCK_LEDGER_PHASE_4_5_6.md`.
- **Kiểm thử frontend:** Không sửa code frontend; `npm run lint` / `npm run build` không cần chạy lại vì không thay đổi TS/JS.

## Phase 5 — Fix Stock Ledger Recovery: SSOT & Documentation (2026-07-01)

- **Mục tiêu:** Đóng gói và làm rõ Single Source of Truth (SSOT) cho stock ledger; đánh dấu các migration cũ không chạy lại; đảm bảo `PHASED_FIX_STOCK_LEDGER_RECOVERY.md`, `AGENTS.md` và handoff files đầy đủ, không mâu thuẫn.
- **Thay đổi tài liệu/code:**
  - Cập nhật header `supabase/migration_fix_stock_ledger_phase2_backfill_v2.sql`:
    - Ghi rõ đây là SSOT duy nhất cho backfill.
    - Ghi rõ mục đích, option đã chọn (1-B, 2-A, 3-A), thời điểm đã chạy (Phase 3), và cảnh báo không chạy lại trên production khi đã backfill xong.
  - Kiểm tra toàn bộ repo: chỉ còn 1 file migration liên quan stock ledger backfill trong `supabase/`; thư mục `archive/` không tồn tại nên không còn file cũ cần đánh dấu trong repo.
  - Cập nhật `PHASED_FIX_STOCK_LEDGER_RECOVERY.md`:
    - Đánh dấu Phase 1, 2, 3, 4, 5 đã hoàn thành; Phase 6 đang bàn giao.
    - Thêm bảng tổng quan với trạng thái từng phase.
    - Thêm phần SSOT migration và verify queries đúng (dùng dòng cuối cùng thay vì `MAX`).
  - Cập nhật `AGENTS.md` với mục này.
- **Xác minh DB production (không thay đổi dữ liệu):**
  - `stock_movements`: 446 dòng.
  - SP có lô bị lệch: 0.
  - SP không lô bị lệch: 0.
  - `lot_id = NULL` cho SP có lô: 0.
  - `qty_after_transaction` lũy kế sai per lot: 0.
  - `qty_after_transaction` lũy kế sai cho SP không lô: 0.
  - `get_stock_balance(NULL, NOW())` số âm: 0.
- **Không thay đổi database trong Phase 5.**
- **Báo cáo:** Không tạo report riêng — kết quả được ghi trong `PHASED_FIX_STOCK_LEDGER_RECOVERY.md` và `AGENTS.md`.
- **Handoff Phase 6:** `HANDOFF_PROMPT_FIX_STOCK_LEDGER_PHASE_6.md`.
- **Kiểm thử frontend:** Không sửa code TS/JS; `npm run lint` / `npm run build` không cần chạy lại vì không thay đổi code.

## Phase 6 — Fix Stock Ledger Recovery: Hardening & Monitoring (2026-07-01)

- **Mục tiêu:** Đảm bảo mọi dòng `stock_movements` tương lai có `qty_after_transaction` lũy kế đúng per `(product_id, lot_id)`, và cung cấp công cụ giám sát lệch tồn kho.
- **Migration:** `supabase/migration_phase6_stock_ledger_hardening.sql` (đã deploy thành công trên Supabase project `QLBH` `rsialbfjswnrkzcxarnj`).
  - Backup: tạo `public.stock_movements_backup_phase6`.
  - Helper: `public.calc_qty_after_transaction(product_id, lot_id, actual_qty)`.
  - Index: `idx_stock_movements_product_lot_cancelled`.
  - Central safety net: `public.insert_stock_ledger_entry(...)` tự động tính `qty_after_transaction`, bỏ qua giá trị truyền vào; idempotency check `(voucher_type, voucher_detail_no, lot_id, is_cancelled)`.
  - Trigger: `trg_stock_movements_calc_qty_after` BEFORE INSERT tự tính lại `qty_after_transaction` và các cột derived.
  - Drift monitor: `public.check_stock_ledger_drift()`.
  - Patch 11 RPC từ `get_product_stock_balance(..., NULL)` sang `calc_qty_after_transaction(...)`:
    - `process_checkout`, `process_import_v2`, `delete_import_v2`, `create_return_order`, `cancel_return_order_v2`, `complete_disposal`, `delete_disposal_with_restore`, `create_exchange_transaction`, `complete_inventory_count`, `cancel_inventory_count_rpc`, `cancel_supplier_exchange`.
    - `update_import_v2` được bao phủ qua `delete_import_v2` + `process_import_v2`.
- **Frontend:**
  - `services/supabaseService.ts`: thêm `checkStockLedgerDrift()`.
  - `pages/StockLedger.tsx`: thêm nút **"Kiểm tra lệch"**, hiển thị kết quả/ lỗi inline.
- **Verification:**
  - 6/6 verify queries trả về `0` sau deploy.
  - Kiểm tra `pg_proc`: 0/11 RPC business còn gọi `get_product_stock_balance` cho ledger.
- **End-to-end testing trên DB thật (dữ liệu test đã dọn dẹp):**
  - `insert_stock_ledger_entry` (non-lot + lot) ✓
  - `process_import_v2` → `delete_import_v2` ✓
  - `complete_disposal` → `delete_disposal_with_restore` ✓
  - `complete_inventory_count` → `cancel_inventory_count_rpc` ✓
  - `process_checkout` → `create_return_order` → `cancel_return_order_v2` → `cancel_order` ✓
- **Lưu ý:**
  - `pg_cron` chưa được cài, chưa triển khai cron job tự động. Drift check hiện chủ động qua UI hoặc gọi RPC thủ công.
- **Báo cáo:** Cập nhật `PHASED_FIX_STOCK_LEDGER_RECOVERY.md` và `AGENTS.md`.
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.

## ImportGoods Bugfix — Phase 6: Polish & xử lý lỗi xóa phiếu (2026-07-02)

- **Mục tiêu:** Hiển thị message lỗi cụ thể khi xóa phiếu thất bại; cập nhật stats cards sau CRUD; xác minh `product_lots.original_quantity` không cần sửa.
- **Files sửa:** `App.tsx`, `pages/ImportGoods.tsx`.
- **Thực hiện:**
  - `App.tsx` `handleDeleteImport`: parse message từ `delete_import_v2`:
    - "Sản phẩm X đã bán vượt quá số lượng nhập" → "Không thể xóa: sản phẩm X đã bán vượt quá lượng nhập. Vui lòng kiểm tra tồn kho."
    - "Lô L của sản phẩm X không đủ tồn kho" → "Không thể xóa: lô L của sản phẩm X không đủ tồn kho."
    - Các lỗi khác → message gốc.
  - `pages/ImportGoods.tsx`:
    - `handleDeleteClick`: async, await `onDeleteImport(id)` rồi mới gọi `fetchReceipts` và `fetchStats`.
    - Thêm `fetchStats` gọi RPC `get_import_stats` theo date range; giữ useEffect fallback tính stats từ trang hiện tại.
    - `submitReceipt`: await `fetchReceipts` và `fetchStats` sau khi lưu thành công.
- **Xác minh `product_lots.original_quantity`:**
  - `process_import_v2` insert lô với `original_quantity = v_item.quantity`.
  - `delete_import_v2` xóa lô khi quantity đạt 0 (hoặc <= 0).
  - Nếu cùng lô được nhập nhiều lần, `original_quantity` của lần đầu bị đè — chấp nhận được vì `product_lots` là snapshot tồn kho.
- **OpenSpec:** Change `import-goods-bugfix-phase-6-polish` archived tại `openspec/changes/archive/2026-07-02-import-goods-bugfix-phase-6-polish` (skip spec sync vì target main spec không tồn tại).
- **Backup:** `E:\App ban hàng\vietsale-pro-v7_backup_import_goods_bugfix_phase_6_20260702_170354`.
- **Kiểm thử:** `npm run lint` PASS; `npm run build` PASS.

## Phase 7 — Verification tổng thể (2026-07-02)

- **Mục tiêu:** Kiểm tra end-to-end toàn bộ luồng nhập hàng sau các phase sửa lỗi.
- **Hành động:**
  - Tạo NCC mới "NCC Test Phase 7" ngay trong form nhập hàng.
  - Thêm 2 sản phẩm: Nuvi Cam (không lô) và Ensure Gold 400g (lô `LOT-PH7-001`, HSD 2027-12-31).
  - Áp dụng chiết khấu dòng 5.000 ₫ cho Nuvi, phí ship 15.000 ₫.
  - Lưu tạm phiếu `PN-20260702-001`.
  - Mở lại sửa, kiểm tra giá trị, rồi hoàn thành phiếu.
  - Xem chi tiết phiếu, xóa phiếu, kiểm tra UI quay về `/import`.
- **Lỗi phát hiện & fix trong quá trình verification:**
  - Detail/edit khi mở từ danh sách bị mất sản phẩm vì `filter_import_receipts_rpc` trả về receipt không có `import_items`.
  - Sửa `pages/ImportGoods.tsx`: thêm `handleViewDetail` và cập nhật `handleEditClick` để fetch full receipt qua `getImportReceiptById`, đồng thời prefetch sản phẩm vào `productCache` trước khi mở edit.
  - Thay thế tất cả lời gọi `setViewingReceipt(receipt)` trong list bằng `handleViewDetail(receipt)`.
- **Kết quả:**
  - `npm run lint` PASS.
  - `npm run build` PASS.
  - Luồng tạo/sửa/hoàn thành/xóa phiếu nhập hoạt động.
  - Routing `/import`, `/import/create`, Back, F5 hoạt động đúng.
  - Báo cáo trang `/reports` load dữ liệu bán hàng (các RPC report đã được xác minh ở Phase 5c).
- **Backup:** `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_import_goods_bugfix_phase_7_verification_20260702_180134`.

## Phase 9.1 — SupplierExchanges Create Form Refactor (2026-07-03)

- **Mục tiêu:** Refactor phần create form của màn Đổi trả hàng NCC sang Voucher Form Component System, giữ nguyên wizard flow.
- **Files sửa:**
  - `pages/SupplierExchanges.tsx`: thay thế input/button/select/section/banner styling bằng Voucher components (`VoucherFormLayout`, `VoucherSection`, `VoucherSectionHeader`, `VoucherSectionContent`, `VoucherField`, `VoucherInput`, `VoucherButton`, `VoucherSelect`, `VoucherTextarea`, `VoucherSearch`, `VoucherProductDropdown`, `VoucherEmpty`, `VoucherTotals`, `VoucherBanner`).
  - `pages/SupplierExchanges.css`: xóa CSS create form cũ (section, section-title, search-results, search-item, empty-items, field, item-field, locked-banner, actions).
- **Quyết định:** Không tách `ExchangeForm.tsx` riêng; giữ refactor inline trong page để giảm rủi ro và số lượng props trung gian.
- **Giữ nguyên:** Wizard lot selection grid, receipt list, exchange item cards; không dùng `VoucherTable`/`VoucherTableRow`.
- **Kết quả:**
  - `npm run lint`: PASS.
  - `npm run build`: PASS.
  - `openspec validate --all --json`: PASS (4/4 items).
- **Backup:** `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_phase9_1_20260703_152727`.
- **Handoff:** `HANDOFF_PHASE_9_1_SUPPLIER_EXCHANGES_CREATE_FORM.md`.
- **Next phase:** Phase 9.2 — SupplierExchanges Wizard Integration.

## Multi-tenancy Workflow Preference

User explicitly instructed: only push the multi-tenancy branch to the remote/production repository once the entire multi-tenancy project is complete. Do not push per individual phase unless asked again.

## Admin Dashboard P7.5 — Expiry cron + renewal cron + Resend email (2026-07-06)
- Migration `supabase/migrations/20250706000010_phase_p7_5_expiry_renewal_cron.sql`:
  - `expire_overdue_invoices()`: `pending` >48h → `expired`, tenant `active/trial` → `read_only`, `billing_status='overdue'`.
  - `create_renewal_invoices(p_days_before=7)`: tạo hóa đơn gia hạn VIP tháng (69k) cho subscription hết hạn trong 7 ngày; bỏ qua nếu đã có hóa đơn còn mở.
  - pg_cron: `invoice-expiry-daily` (03:30), `renewal-invoice-daily` (04:00).
  - Thêm cột `invoices.discount_code TEXT` nullable (chỗ nối voucher P10).
- Edge Function `supabase/functions/send-billing-email` (Resend): body `{ invoice_id, type: 'reminder'|'confirmation', to? }`; secrets `RESEND_API_KEY`, tùy chọn `RESEND_FROM`.
- Service `sendBillingEmail` (`services/invoiceService.ts`); types trong `types/billing.ts`.
- Frontend: `InvoiceManager` nút "Gửi nhắc thanh toán"; `InvoicePaymentConfirm` auto gửi email xác nhận sau confirm.
- Deploy TODO trên Supabase: apply migration, `supabase functions deploy send-billing-email`, set secret `RESEND_API_KEY`.
- `npm run lint` PASS · `npm run build` PASS · `npx vitest run` 79/79 PASS.

## Admin Dashboard P9.1 — Billing reminders T-7/T-3/T-1 (2026-07-07)
- Migration `supabase/migrations/20250707000000_phase_p9_1_billing_reminders.sql`:
  - Bảng `invoice_reminder_logs` (invoice_id, milestone T-7/T-3/T-1, due_date, status, sent_at, error) + RLS admin-only.
  - RPC `get_billing_reminder_config()`, `set_billing_reminder_config(enabled, milestones, send_time, function_url, service_role_key)`.
  - RPC `get_pending_billing_reminders()` liệt kê hóa đơn `pending` có `due_date` trùng các mốc và chưa gửi.
  - RPC `send_billing_reminders()` gọi async qua `pg_net.http_post` đến Edge Function `send-billing-email` (tái dụng P7.5) và ghi log.
  - pg_cron: `billing-reminders-daily` lúc 09:00 Asia/Ho_Chi_Minh.
- Edge Function `send-billing-email` được cập nhật: nhận thêm `milestone` trong body, upsert log `invoice_reminder_logs` status `sent` sau khi gửi.
- Frontend: component `BillingReminderConfig` trong `components/BillingConfig.tsx` để bật/tắt, chọn mốc T-7/T-3/T-1, giờ gửi, cấu hình URL/service role key, xem pending reminders, lịch sử log, và nút "Chạy ngay".
- Service layer: `services/billingReminderService.ts`; types `BillingReminderConfig`, `BillingReminderLog`, `PendingReminder` trong `types/billing.ts`.
- Smoke test: `tests/smoke/admin-dashboard-p9-1-billing-reminders.test.ts` (7 tests).
- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p9-1-billing-reminders_20260707_070139`.
- `npm run lint` PASS · `npm run build` PASS · `npx vitest run` 97/97 PASS.
- Deployed Supabase project `rsialbfjswnrkzcxarnj` (QLBH):
  - Migration `20250707000000_phase_p9_1_billing_reminders.sql` applied.
  - Edge Function `send-billing-email` redeployed với `verify_jwt = false`.
  - Config `billing_reminder_config` set trong `system_settings` với `function_url` và `reminder_secret` (custom secret).
  - Secret `BILLING_REMINDERS_SECRET` set trong Supabase secrets.
  - Cron job `billing-reminders-daily` created.
  - End-to-end test: scheduler đúng T-7, gọi Edge Function thành công, log reminder ghi `failed` với lỗi Resend 403 domain chưa verify.
  - Bảo mật: cron dùng header `X-Internal-Secret` thay vì `Authorization: Bearer service_role_key`.
- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_p9_1_secure_reminders_20260707_082248`.
- Domain `mail.vietsalepro.com` đã được verify trên Resend; `RESEND_FROM` cập nhật thành `VietSales Pro <billing@mail.vietsalepro.com>`.
- End-to-end test (2026-07-07): `send_billing_reminders()` gửi T-7 thành công, `invoice_reminder_logs` ghi `status = 'sent'`.
- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_p9_1_1_mail_domain_setup_20260707_093000`.

## P13.1 — System health dashboard (2026-07-08)

- Edge Function `system-health` (`supabase/functions/system-health/index.ts`) checks Database, Storage, and Edge Functions health with latency; requires system admin auth.
- Service `services/systemHealthService.ts` invokes the Edge Function.
- Types `SystemHealth`, `HealthCheck`, `HealthStatus` added to `types/tenant.ts`.
- Frontend component `components/SystemHealthPanel.tsx` renders overall status + DB/Storage/Edge Functions cards with refresh button; uses `DashboardV2KPI` (added `danger` variant + CSS).
- New `health` tab wired into `pages/SystemAdminDashboard.tsx`.
- Smoke test: `tests/smoke/admin-dashboard-p13-1-system-health.test.ts` (1 test).
- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p13-1-system-health_20260708_074242`.
- `npm run lint` PASS · `npm run build` PASS · `npx vitest run tests/smoke` 116/116 PASS.
- Edge Function deployed to production Supabase project `rsialbfjswnrkzcxarnj` (QLBH) via Supabase MCP; verified `401 Missing authorization header` on unauthenticated request.
- Note: P13.1 has no DB migration.

## P13.2 — Error log aggregation + performance metrics (2026-07-08)

- Migration `supabase/migrations/20250708000001_phase_p13_2_error_performance.sql`:
  - Enables `pg_stat_statements` extension.
  - Creates `error_logs` table with RLS (system-admin only).
  - RPC `get_error_log_summary(p_hours, p_limit)` aggregates recent errors by source/level.
  - RPC `get_query_performance_metrics()` reads `extensions.pg_stat_statements`, returns total calls/queries, RPS, P95/P99 approximations (mean + stddev), and top queries.
- Edge Function `error-performance` (`supabase/functions/error-performance/index.ts`) authenticates system admin and invokes both RPCs with service role.
- Service `services/errorPerformanceService.ts` and types `ErrorPerformance`, `ErrorLogSummary`, `QueryPerformanceMetrics`, `TopQueryMetric` in `types/tenant.ts`.
- Frontend component `components/ErrorPerformancePanel.tsx` shows KPI cards, error-by-source bar chart, top-query table, and recent error log; new `errors` tab wired into `pages/SystemAdminDashboard.tsx`.
- Smoke test: `tests/smoke/admin-dashboard-p13-2-error-performance.test.ts` (1 test); `tests/mocks/supabase.ts` updated.
- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p13-2-error-performance_20260708_075919`.
- `npm run lint` PASS · `npm run build` PASS · `npx vitest run` 137/137 PASS.
- Deployed to linked Supabase staging project `shbmzvfcenbybvyzclem`:
  - Migration applied successfully (`pg_stat_statements` already enabled).
  - Edge Function `error-performance` deployed and returns `401` when called unauthenticated.
- Note: P95/P99 are normal-distribution approximations from `pg_stat_statements` mean/stddev; exact percentiles would require a separate histogram collector.

