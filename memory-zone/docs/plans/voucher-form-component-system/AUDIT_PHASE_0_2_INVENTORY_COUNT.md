# Phase 0.2 — Audit InventoryCount (Voucher Form Component System)

> **Scope:** Inventory file UI/CSS của màn Kiểm kê.  
> **Date:** 2026-07-03  
> **Rule:** Chỉ audit, không sửa code, không chạy lint/build.

---

## 1. Files audited

| File | Size | Role |
|------|------|------|
| `pages/InventoryCount.tsx` | ~60K | Page container, state, CRUD, filter/sort/pagination, Excel import/export, scanner |
| `pages/InventoryCount.css` | ~19K | Page styles, V1 table fallback, mobile cards, pagination, stat cards, toolbar |
| `components/inventory-count/CountFormLayout.tsx` | ~3.5K | Wrapper `VoucherFormLayout` + sidebar sections |
| `components/inventory-count/CountItemsTable.tsx` | ~8K | Table sản phẩm trong phiếu |
| `components/inventory-count/CountItemsTable.css` | ~11K | Styles bảng sản phẩm |
| `components/inventory-count/ProductSearchDropdown.tsx/.css` | ~5K | Ô tìm sản phẩm + dropdown |
| `components/inventory-count/CountSidebar/CountInfoSection.tsx/.css` | ~2.5K | Section thông tin phiếu |
| `components/inventory-count/CountSidebar/CountSummary.tsx/.css` | ~1.5K | Section tổng kết phiếu |
| `components/inventory-count/CountSidebar/ExcelImportSection.tsx/.css` | ~3K | Nút Tải mẫu / Nhập Excel trong sidebar |
| `components/VoucherFormLayout.tsx/.css` | ~18K | Layout baseline (đã dùng) |
| `components/SectionBox.tsx/.css` | ~3K | Layout baseline (đã dùng) |
| `design-system-tokens.css` | ~20K | Design tokens baseline |

---

## 2. UI patterns lặp lại trong InventoryCount

### 2.1. Patterns thuộc Voucher Form System nên dùng chung

| Pattern | Vị trí hiện tại | Đề xuất thay thế |
|---------|-----------------|------------------|
| **Page header** (icon + title + subtitle + actions) | `pages/InventoryCount.tsx` ~776–945 | `VoucherPageHeader` / `PageHeader` chung |
| **Filter bar** (search, status dropdown, date range, diff dropdown, sort dropdown, reset) | `pages/InventoryCount.tsx` ~790–922; imports `FilterBar.css` | `VoucherFilterGroup` + `VoucherDropdown` |
| **Stat cards** (5 cards) | `pages/InventoryCount.tsx` ~947–1006 | `VoucherStats` / `VoucherStatsRow` |
| **Data list/table** | `DataGrid` V2 + custom table V1 fallback + mobile card list | `VoucherTable` + `VoucherTableRow` (hoặc dùng `DataGrid` đồng nhất) |
| **Pagination** | Custom pagination trong V1 fallback + mobile pagination | `VoucherPagination` (nếu `DataGrid` chưa cover) |
| **Bulk actions bar** | `pages/InventoryCount.tsx` ~1370–1384 | `VoucherBulkActions` |
| **Status badge mapping** | Inline 3 lần: `countColumns`, fallback table, mobile card | `VoucherStatusBadge` hoặc helper `getStatusBadgeProps` |
| **Empty state** | `EmptyState` component + inline empty cell | `VoucherEmptyState` |
| **Product search dropdown** | `ProductSearchDropdown.tsx` | `VoucherSearch` / `VoucherProductDropdown` |
| **Info section / Summary section** | `CountInfoSection`, `CountSummary` | `VoucherInfoSection`, `VoucherTotals` |
| **Excel import section** | `ExcelImportSection.tsx` | `VoucherExcelImport` |
| **Notes textarea** | `FormTextarea` trong `CountFormLayout` | `VoucherTextarea` / `VoucherField` |

### 2.2. Patterns lặp lại bên trong InventoryCount (code duplication)

- **Diff calculation `actual - system`**:
  - `getCountQtyDiff` (line ~120)
  - Inline reduce trong `countColumns` (line ~256)
  - Inline reduce trong fallback table (line ~1090)
  - Inline reduce trong mobile card (line ~1278)
  - Inline reduce trong stat cards (line ~953)
  - Inline reduce trong `CountFormLayout` (line ~61)
  - Inline reduce trong `CountItemsTable` (line ~41)
  - Excel export cũng tính lại (lines ~611–615, ~636).

- **Diff value calculation `diff * cost`**:
  - `CountFormLayout` (line ~62)
  - `CountItemsTable` (line ~42)
  - `countColumns` (line ~282)
  - Fallback table (line ~1091)
  - Excel export (lines ~611–615, ~636)

- **Status label/type mapping**:
  - `countStatusLabels` (line ~115)
  - Inline trong `countColumns` (line ~299)
  - Inline trong fallback table (line ~1141)
  - Inline trong mobile card (line ~1288)
  - `CountInfoSection` (lines ~32–42)

- **Qty formatting**: `toLocaleString('vi-VN')` lặp lại hàng chục chỗ.

- **Product search filter**: `filteredProductsForCount` (line ~106) là client-side filter; tương lai nên dùng `VoucherProductDropdown`.

- **Reason dropdown**: hardcoded `<option>` list trong `CountItemsTable` (lines ~193–199). Nên dùng `VoucherSelect` + constant.

---

## 3. Dead code riêng của InventoryCount

### 3.1. Dead CSS chắc chắn

| Selector | File | Lý do |
|----------|------|-------|
| `.inventory-count-page__filter-bar` | `pages/InventoryCount.css` line ~117 | JSX dùng class `.filter-bar` (từ `FilterBar.css`), không có element nào dùng class này. |
| `.inventory-count-table__*` (block table V1) | `pages/InventoryCount.css` lines ~224–386 | Chỉ dùng khi `useNewDataGridInventoryCounts === false`. Nếu flag luôn true → dead. |
| `.inventory-count-pagination` (desktop) | `pages/InventoryCount.css` lines ~388–483 | Chỉ nằm trong nhánh V1 fallback. |
| `.inventory-count-pagination__info` | `pages/InventoryCount.css` | Nhánh V2 DataGrid dùng pagination prop của component, không dùng CSS pagination custom. |

### 3.2. Conditional dead code / legacy fallback

- **Custom table V1** (`pages/InventoryCount.tsx` lines ~1046–1207) là fallback khi `useNewDataGridInventoryCounts === false`. Nếu flag đang bật, toàn bộ block table + pagination + CSS tương ứng là dead code.
- **Mobile card list** (lines ~1274–1368) hiện dùng CSS `.inventory-count-mobile-card`. Nếu `DataGrid` responsive đã xử lý mobile, phần này có thể loại.

### 3.3. File CSS không tồn tại

- `components/inventory-count/CountFormLayout.css` — **không tồn tại**. Plan gốc có gợi ý kiểm tra; hiện trạng thực tế không có file này.

### 3.4. Code smell / gần dead

- `countPageSize` state (line ~80) chỉ set initial = `ITEMS_PER_PAGE` (20), không thay đổi; nên là constant.
- `countSearchTerm2` (line ~70) tên biến dư suffix `2` so với `countSearchTerm` (search trong form).
- `isCountFilterActive` logic bao gồm `countSortBy !== 'date_desc'`; khiến nút reset hiện khi user chỉ sort, gây khó hiểu.

---

## 4. Ghi chú về Excel import / scanner / diff calculation (không sửa logic)

### 4.1. Excel import (`handleImportCountExcel`, lines ~678–773)

- Dùng `XLSX.read` binary string (`reader.readAsBinaryString`).
- Map cột: `mã sản phẩm`, `tên sản phẩm`, `số lượng thực tế`.
- Logic tìm product: ưu tiên `code` (lowercase), fallback `name` (lowercase).
- Nếu product đã tồn tại trong phiếu → update `actualQuantity` (dùng `setCountFormData` trong vòng lặp, có thể gây nhiều re-render khi import nhiều dòng).
- Nếu product mới → push vào `newItems`, sau đó setState 1 lần.
- **Không xử lý lô**: import Excel không tạo dòng lô riêng; sản phẩm có `hasBatches` sẽ được thêm dòng không lô với `systemQuantity = product.quantity`.
- **Không validate header tối thiểu**: nếu cả `codeIndex` và `nameIndex` đều -1 thì alert, nhưng vẫn tiếp tục parse với index -1.
- File input được reset trong `finally`.

### 4.2. Scanner (`BarcodeScannerFix`, `handleScanSuccess`, lines ~490–497)

- `handleScanSuccess` tìm product theo `barcode` hoặc `code`.
- Nếu tìm thấy → `addItemToCount(product)`; ngược lại alert.
- Scanner không có logic đặc biệt về lô, dùng chung hàm thêm sản phẩm.
- `isScannerOpen` state điều khiển modal.

### 4.3. Diff calculation

- **Công thức chuẩn**: `diff = actualQuantity - systemQuantity`.
- **Giá trị lệch**: `diffValue = diff * cost`.
- **Tổng chênh lệch số lượng**: `sum((actual - system))` trên toàn phiếu.
- **Ghi chú quan trọng**: logic này lặp lại ở nhiều component (`CountFormLayout`, `CountItemsTable`, `pages/InventoryCount.tsx`, Excel export). Khi refactor nên tập trung vào 1 helper `calculateCountDiff` / `calculateCountValueDiff`.

---

## 5. Components nên thay thế bằng Voucher Form System

| Component hiện tại | Component đề xuất |
|--------------------|---------------------|
| `ProductSearchDropdown` | `VoucherSearch` / `VoucherProductDropdown` |
| `CountItemsTable` | `VoucherTable` + `VoucherTableRow` |
| `CountInfoSection` | `VoucherInfoSection` |
| `CountSummary` | `VoucherTotals` |
| `ExcelImportSection` | `VoucherExcelImport` |
| Inline filter bar | `VoucherFilterGroup` |
| Inline pagination | `VoucherPagination` |
| Inline mobile card | `VoucherMobileCard` / `VoucherCardList` |
| Inline stat cards | `VoucherStats` |

---

## 6. Khuyến nghị trước khi refactor

1. **Quyết định flag `useNewDataGridInventoryCounts`**: nếu V2 DataGrid đã ổn định, xóa fallback V1 và CSS tương ứng để giảm đáng kể kích thước file.
2. **Tập trung diff helpers**: tạo `utils/inventoryCount.ts` với `getTotalQtyDiff`, `getTotalValueDiff` để tránh lặp.
3. **Giữ nguyên logic Excel import / scanner / diff calculation trong Phase 0**: chỉ audit, không sửa.
4. **Sidebar notes**: `CountFormLayout` đã dùng `FormTextarea` và `SectionBox`, phù hợp với Voucher Form System.
5. **Kiểm tra `CountFormLayout.css`**: không tồn tại, không cần xóa.

---

## 7. Acceptance criteria Phase 0.2

- [x] Có danh sách UI patterns lặp lại trong InventoryCount.
- [x] Có danh sách dead code riêng của InventoryCount (`CountFormLayout.css` không tồn tại).
- [x] Có ghi chú về Excel import / scanner / diff calculation (không sửa logic).

---

*Generated by Devin — Phase 0.2 InventoryCount audit*
