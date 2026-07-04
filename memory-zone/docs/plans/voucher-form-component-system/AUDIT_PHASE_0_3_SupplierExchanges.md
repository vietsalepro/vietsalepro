# Phase 0.3 — Audit: SupplierExchanges

> **Dự án:** VietSales Pro v7  
> **Màn hình:** Đổi trả hàng nhà cung cấp (`pages/SupplierExchanges.tsx`)  
> **Ngày audit:** 2026-07-03  
> **Scope:** Chỉ inventory UI/CSS/flow — **KHÔNG sửa code**.

---

## 1. Tóm tắt quan trọng

### 1.1 SupplierExchanges là wizard create-flow

- Màn có 2 view: `list` và `create`.
- **Create flow** không phải là form nhập bảng truyền thống; nó là wizard 3 bước:
  1. Tìm sản phẩm có lô.
  2. Chọn lô cần trả (lot selection grid).
  3. Chọn phiếu nhập gốc (receipt selection list) — chỉ cho item đầu tiên; các item sau bị khóa vào cùng phiếu nhập.
- Sau khi wizard chọn xong, mỗi item hiển thị dạng **card** (compact/expanded) với hai khối: *Lô trả* và *Lô nhận mới*.

### 1.2 Không dùng VoucherTable / VoucherTableRow

- `grep -E 'VoucherTable|VoucherTableRow|useVoucher|import-goods|InventoryCount|DisposalForm'` trên `pages/SupplierExchanges.tsx` → **không có kết quả**.
- Create view dùng `VoucherFormLayout` đúng làm layout container, nhưng nội dung main là các section tùy biến: search box, lot grid, receipt list, item cards.
- List view dùng `DataGrid` gốc (`components/DataGrid`) — không liên quan tới VoucherTable.

### 1.3 So sánh nhanh với 3 màn phiếu khác

| Tiêu chí | ImportGoods | InventoryCount | DisposalForm | SupplierExchanges |
|----------|-------------|----------------|--------------|-------------------|
| Dạng form | Table nhập liệu | Table + Scanner + Excel | Table + Lot selector | Wizard card (không phải table) |
| Dùng VoucherTable/Row | Có | Có | Có | **Không** |
| Dùng VoucherFormLayout | Có | Có | Có | Có |
| Dùng SectionBox | Có | Có | Có | Có |
| Lot selector | Inline trong table | Không | Component riêng | **Grid riêng, là flow chính** |
| Receipt reference | Có | Không | Không | **Bắt buộc** |

---

## 2. Files đã audit

| File | Bytes | Ghi chú |
|------|-------|---------|
| `pages/SupplierExchanges.tsx` | ~67K | 1663 dòng |
| `pages/SupplierExchanges.css` | ~19K | 735 dòng |
| `components/VoucherFormLayout.tsx` | ~3.6K | Layout baseline |
| `components/VoucherFormLayout.css` | ~7K | Layout baseline |
| `components/SectionBox.tsx` | ~3.1K | Layout baseline |
| `components/SectionBox.css` | ~2.5K | Layout baseline |
| `components/supplier-exchanges/*` | 0 | **Không tồn tại** (inline trong page) |

---

## 3. UI Patterns lặp lại trong SupplierExchanges

### 3.1 Layout patterns (đã có VoucherFormLayout + SectionBox)

| Pattern | Vị trí hiện tại | Đề xuất |
|---------|-----------------|---------|
| `VoucherFormLayout` container | Lines 1606-1624 (create view) | Dùng tiếp; không cần thay |
| `SectionBox` sidebar clusters | Lines 1518-1579 (info + summary) | Dùng tiếp; phù hợp |
| Banner cảnh báo | Lines 1612-1620 | Dùng tiếp |
| Sticky actions (Hủy / Hoàn thành) | Lines 1583-1603 | Dùng tiếp qua `VoucherFormLayout` |

### 3.2 Search patterns

| Pattern | Vị trí | Đề xuất |
|---------|--------|---------|
| Product search input + dropdown | Lines 1362-1402 | Tái cấu trúc thành `VoucherProductSearch` hoặc `VoucherSearch` khi Voucher Form System có component này |
| Server-side search + debounce | Lines 326-367 | Dùng chung pattern với ImportGoods / DisposalForm; có thể đưa vào hook/useVoucherSearch |
| Empty state trong search | Lines 1411-1415 | Dùng `VoucherEmpty` khi có |

### 3.3 Card / Grid patterns

| Pattern | Vị trí | Đề xuất |
|---------|--------|---------|
| Lot selection grid | Lines 1405-1438 | **Pattern đặc thù của SupplierExchanges**, không ép thành VoucherTable. Có thể giữ nguyên hoặc tách thành `components/supplier-exchanges/LotSelectionGrid.tsx` |
| Receipt selection list | Lines 1441-1481 | **Pattern đặc thù**, có thể tách thành `ReceiptSelectionList.tsx` |
| Item card (compact) | Lines 1207-1231 | Pattern card accordion, có thể tách thành `ExchangeItemCard.tsx` |
| Item card (expanded) | Lines 1233-1357 | Chứa 2 block *Lô trả* / *Lô nhận mới* — không phù hợp với VoucherTableRow |
| Locked receipt banner | Lines 1484-1498 | Pattern thông báo thông tin phiếu đã khóa |

### 3.4 Form input patterns

| Pattern | Vị trí | Đề xuất |
|---------|--------|---------|
| `TextInput` label + value | Khắp create view | Có thể dùng `VoucherInput` / `VoucherField` khi component sẵn sàng |
| `SelectInput` (lý do đổi trả) | Lines 1545-1551 | Dùng `VoucherSelect` |
| `FormTextarea` | Lines 1552-1558 | Dùng `VoucherTextarea` |
| `SummaryRow` tổng kết | Lines 1565-1572 | Dùng `VoucherSummaryRow` |

### 3.5 List patterns

| Pattern | Vị trí | Đề xuất |
|---------|--------|---------|
| Page header + subtitle | Lines 772-783 | Dùng chung `PageHeader` nếu có |
| Filter bar (search + status + supplier dropdown) | Lines 786-895 | Dùng `FilterBar` hoặc `VoucherFilterBar` |
| 5 stat cards | Lines 911-952 | Dùng `StatsRow` / `VoucherStats` |
| Batch actions bar | Lines 954-964 | Dùng `BatchActionsBar` |
| DataGrid với sort + pagination | Lines 1164-1200 | Dùng `VoucherDataGrid` khi component phù hợp |
| Detail view (sidebar + bảng) | Lines 968-1157 | Dùng `VoucherDetailPanel` nếu có |
| Confirmation modal | Lines 1627-1659 | Dùng `VoucherModal` / `VoucherConfirmDialog` |

### 3.6 CSS patterns lặp lại

| Pattern | Class trong `SupplierExchanges.css` | Ghi chú |
|---------|-------------------------------------|---------|
| Surface card với border | `.supplier-exchanges-section`, `.supplier-exchanges-item-card`, `.supplier-exchanges-lot-card`, `.supplier-exchanges-receipt-card` | Dùng token `ig-surface`, `ig-border` — đã đồng bộ với ImportGoods |
| Empty state | `.supplier-exchanges-empty-items` | Giống `import-product-search__empty` |
| Search dropdown | `.supplier-exchanges-search-results` | Giống `ig-popover` / `import-product-search__results` |
| Modal overlay | `.supplier-exchanges-modal-overlay`, `.supplier-exchanges-modal` | Giống nhiều màn khác — nên thay bằng `VoucherModal` |
| Detail view prefix `.se-page-detail-*` | Lines 433-735 | Copy phong cách ImportGoods (`.ig-page-detail-*`) — nên đổi về dùng component chung |
| Financial summary card | `.se-page-summary-card` | Gradient purple — đặc thù màn phiếu |

---

## 4. Đề xuất tách create form thành `components/supplier-exchanges/ExchangeForm.tsx`

### 4.1 Khuyến nghị: CÓ tách

Lý do:

1. **Create flow là wizard riêng biệt**, không phải table. Nếu ép vào `VoucherTable` sẽ phá vỡ UX.
2. **Nội bộ `SupplierExchanges.tsx` quá lớn** (~67K, 1663 dòng). Tách form ra giúp:
   - Giảm kích thước page.
   - Dễ kiểm thử wizard.
   - Dễ tái sử dụng cho màn mobile hoặc modal nếu sau này cần.
3. **Plan section 3.3 đã khóa thiết kế:** nếu cần tái cấu trúc sâu hơn, phải tách thành wrapper form riêng (`ExchangeForm.tsx`) thay vì nhồi vào `VoucherTable`.

### 4.2 Proposed component split

```
components/supplier-exchanges/
├── ExchangeForm.tsx          # Wrapper wizard + state + submit
├── ExchangeForm.css          # Style riêng cho wizard
├── ProductSearchSection.tsx  # Tìm sản phẩm (nếu cần tách thêm)
├── LotSelectionGrid.tsx      # Grid chọn lô trả
├── ReceiptSelectionList.tsx  # Danh sách phiếu nhập gốc
├── ExchangeItemCard.tsx      # Card item compact/expanded
├── ExchangeSidebar.tsx       # Thông tin phiếu + tổng kết
└── ExchangeConfirmModal.tsx  # Modal xác nhận
```

### 4.3 Phạm vi tách tối thiểu (MVP) cho Phase 9

Nếu Phase 9 chỉ rollout layout + controls, chỉ cần tách:

- `ExchangeForm.tsx` — chứa toàn bộ create state và wizard render.
- `ExchangeForm.css` — style create view (di chuyển từ `SupplierExchanges.css`).
- Giữ list view và detail view trong `pages/SupplierExchanges.tsx`.

### 4.4 Interface dự kiến cho `ExchangeForm`

```tsx
interface ExchangeFormProps {
  appSettings: AppSettings;
  onBack: () => void;
  onSuccess: () => void;
}
```

Hoặc nếu muốn hỗ trợ edit sau này:

```tsx
interface ExchangeFormProps {
  appSettings: AppSettings;
  initialExchange?: SupplierExchange;
  onBack: () => void;
  onSuccess: () => void;
}
```

---

## 5. Ghi chú về Exchange Flow / Lot Selection Grid

### 5.1 Flow tạo phiếu (KHÔNG sửa logic)

```
1. User tìm sản phẩm
   └── Server search: searchProducts(term, 50)
       └── Lọc: chỉ SP có lot (hasBatches), lot tồn > 0
       └── Nếu lockedReceiptId: chỉ giữ lot nằm trong phiếu nhập gốc

2. User chọn sản phẩm
   └── draftProduct = product
   └── productCache.set(product.id, product)

3. Hiện Lot Selection Grid
   └── draftProductLots = filter lots:
        - quantity > 0
        - chưa được chọn trong items
        - nếu lockedReceiptId: lot.code phải nằm trong lockedReceipt.items

4. User chọn lô
   ├── Nếu lockedReceipt đã có → tìm importItem trong phiếu → addItem luôn
   └── Nếu chưa có lockedReceipt → draftLot = lot

5. Hiện Receipt Selection List (chỉ khi chưa lockedReceipt)
   └── Server fetch: getImportReceiptsByProductAndLot(productId, lotId)
   └── Lọc: status === 'completed'

6. User chọn phiếu nhập
   └── lockedReceiptId = receipt.id
   └── addItem(product, lot, importItem)

7. Item xuất hiện dưới dạng card
   └── Compact: productName, returnLotCode, newLotCode, quantity
   └── Expanded: 2 block input *Lô trả* và *Lô nhận mới*

8. User có thể thêm nhiều sản phẩm
   └── Tất cả phải thuộc cùng lockedReceipt

9. Submit
   └── validate()
   └── confirmSubmit()
   └── createSupplierExchange({ returnItems, receivedItems, ... })
```

### 5.2 Lot selection grid đặc thù

- Grid dùng CSS: `repeat(auto-fill, minmax(180px, 1fr))`.
- Mỗi card hiển thị:
  - `lot.code`
  - `HSD: formatDate(lot.expiryDate)`
  - `Tồn: lot.quantity`
  - `Giá vốn: formatCurrency(lot.cost)` (nếu có)
- Có hover state, border, box-shadow.
- **Không phù hợp ép vào VoucherTableRow.** Nếu dùng Voucher Form System, chỉ nên thay thế bằng component card/grid tương đương, không thay bằng table.

### 5.3 Receipt selection list đặc thù

- Danh sách dạng card dọc.
- Mỗi card hiển thị:
  - `receipt.id` (mã phiếu nhập gốc)
  - Tên NCC
  - Ngày phiếu
  - SL nhập của item
  - Giá vốn của item
- **Không dùng table.** Nếu dùng Voucher Form System, có thể tách thành `ReceiptSelectionList`.

### 5.4 Item card đặc thù

- Layout 2 cột: *Lô trả* (`old`) ←→ *Lô nhận mới* (`new`).
- Mũi tên ở giữa (`RefreshCcw`).
- Mobile: xếp chồng, mũi tên xoay 90°.
- Mỗi block chứa 4 input:
  - Lô trả: số lô (disabled), HSD cũ (disabled), SL trả, giá vốn.
  - Lô nhận: số lô mới, HSD mới, SL nhận, giá vốn mới.
- Footer: tổng giá trị trả, nhận, chênh lệch.
- **Validation liên quan đến lot quantity và HSD:**
  - returnQuantity ≤ lot.quantity
  - newExpiryDate > returnExpiryDate

---

## 6. Dead code / Unused patterns

| Mục | Vị trí | Đề xuất |
|-----|--------|---------|
| Props `products`, `suppliers`, `importReceipts` được destructuring nhưng bỏ qua (`_products`, `_suppliers`, `_importReceipts`) | Lines 74-76 | Ghi chú Phase 6: đã chuyển server-side. Có thể xóa props này khi sẵn sàng cleanup |
| `isSelectAllChecked` dùng cho select-all toàn bộ danh sách (không chỉ page) | Lines 128, 278-286 | Hợp lệ, nhưng cần xem xét có nên chọn all page hay all list |
| `BatchActionsBar` có `onDeleteSelected={() => {}}` + `showDelete={false}` | Lines 956-963 | Nút xóa bị tắt — đúng yêu cầu business (phiếu hoàn thành không hủy), nên ghi chú |
| `handleExportData` chỉ `alert('...')` — chưa implement | Lines 305-308 | Ghi chú todo cho Phase 10 hoặc feature sau |
| `importStartIndex` dùng cho STT DataGrid | Line 232 | Tên biến lạc đề tài (`import` thay vì `exchange`) — nên rename khi cleanup |
| `.supplier-exchanges-field` và `.supplier-exchanges-field label` | Lines 216-227 | Không thấy sử dụng trong TSX; có thể là dead CSS từ refactor |
| `.supplier-exchanges-page` padding vs `.supplier-exchanges-page--create` | Lines 1-10 | Hợp lệ theo Option A của Phase 4b, nhưng cần ghi chú lý do |
| `.supplier-exchanges-stats-row` | Lines 733-735 | Chỉ `margin-bottom: 0` — có thể gộp vào class `StatsRow` chung |

---

## 7. Kiến nghị cho Phase 9 (Rollout SupplierExchanges)

### 7.1 Nên làm

1. **Tách `ExchangeForm.tsx` + `ExchangeForm.css`** — giữ wizard logic riêng, page chỉ còn list + detail.
2. **Thay các input cơ bản bằng Voucher Form System** khi có:
   - `TextInput` → `VoucherInput`
   - `SelectInput` → `VoucherSelect`
   - `FormTextarea` → `VoucherTextarea`
   - `ActionButton` → `VoucherButton`
   - `SummaryRow` → `VoucherSummaryRow`
   - `SectionBox` → `VoucherSection`
3. **Thay modal xác nhận bằng `VoucherModal`** khi có.
4. **Giữ nguyên** các pattern đặc thù:
   - Lot selection grid
   - Receipt selection list
   - Item card (old/new lot)
   - Locked receipt banner

### 7.2 KHÔNG nên làm

1. **Không ép create flow thành VoucherTable/VoucherTableRow.**
2. **Không xóa lot selection grid hoặc chuyển thành table.**
3. **Không sửa logic validate liên quan đến HSD / lot quantity / locked receipt.**
4. **Không sửa backend / RPC / `supabaseService`** trong phase này.

---

## 8. Acceptance Criteria Check

- [x] Có danh sách UI patterns lặp lại trong SupplierExchanges.
- [x] Có đề xuất tách phần create form thành `components/supplier-exchanges/ExchangeForm.tsx` (nếu cần).
- [x] Có ghi chú về exchange flow / lot selection grid (không sửa logic).
- [x] Xác nhận SupplierExchanges là wizard create-flow, không dùng `VoucherTable` / `VoucherTableRow`.

---

## 9. Kế tiếp

- Phase 0.4: Audit DisposalForm + tổng hợp 4 màn + backup.
- Phase 1-5: Xây dựng Voucher Form System foundation.
- Phase 9: Rollout SupplierExchanges (dự kiến tách thành 3 sub-phase do gần ngưỡng context).
