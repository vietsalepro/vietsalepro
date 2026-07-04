# Phase 0.1 — Audit ImportGoods (Voucher Form Component System)

> **Project:** VietSales Pro v7
> **Date:** 2026-07-03
> **Scope:** Inventory UI/CSS của màn Nhập hàng cho kế hoạch Voucher Form Component System
> **Source plan:** `PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`

---

## Files đã đọc

| File | Dòng | Ghi chú |
|------|------|---------|
| `pages/ImportGoods.tsx` | 1.695 | Page chính màn Nhập hàng |
| `pages/ImportGoods.css` | 525 | Style sheet riêng của ImportGoods |
| `components/import-goods/ImportProductSearch.tsx` | 176 | Popover autocomplete SP |
| `components/import-goods/ImportProductSearch.css` | 138 | |
| `components/import-goods/ImportItemsTable.tsx` | 114 | Bảng SP trong phiếu nhập |
| `components/import-goods/ImportItemsTable.css` | 131 | |
| `components/import-goods/ImportItemRow.tsx` | 215 | Dòng SP inline edit |
| `components/import-goods/ImportItemRow.css` | 107 | |
| `components/import-goods/LotExpiryPopover.tsx` | 195 | Popover nhập lô/HSD |
| `components/import-goods/LotExpiryPopover.css` | 5 | |
| `components/import-goods/ImportSidebar/SupplierSection.tsx` | 219 | Sidebar chọn NCC |
| `components/import-goods/ImportSidebar/SupplierSection.css` | 191 | |
| `components/import-goods/ImportSidebar/ReceiptInfoSection.tsx` | 70 | Sidebar thông tin phiếu |
| `components/import-goods/ImportSidebar/ReceiptInfoSection.css` | 25 | |
| `components/import-goods/ImportSidebar/TotalsSection.tsx` | 140 | Sidebar tổng kết tiền |
| `components/import-goods/ImportSidebar/TotalsSection.css` | 37 | |
| `components/import-goods/ImportSidebar/NoteSection.tsx` | 36 | Sidebar ghi chú |
| `components/import-goods/ImportSidebar/ActionFooter.tsx` | 67 | Nút Lưu tạm / Hoàn thành |
| `components/import-goods/ImportSidebar/ActionFooter.css` | 15 | |
| `components/VoucherFormLayout.tsx` | 120 | Layout baseline |
| `components/VoucherFormLayout.css` | 312 | |
| `components/SectionBox.tsx` | 91 | Component section dùng chung |
| `components/SectionBox.css` | 77 | |
| `design-system-tokens.css` | 463 | Master design tokens |

---

## 1. UI patterns lặp lại trong ImportGoods

| Pattern | Lặp ở đâu | Đề xuất component Voucher System |
|---------|-----------|----------------------------------|
| Header + Back + Title + Search | `VoucherFormLayout.tsx` (đã dùng chung), detail view header | `VoucherHeader`, `VoucherSearch` |
| Sidebar section card | `SupplierSection`, `ReceiptInfoSection`, `TotalsSection`, `NoteSection` đều wrap `SectionBox` | `VoucherSection` + `VoucherSectionHeader` |
| Label + input field stack | `ReceiptInfoSection`, `SupplierSection` search, `TotalsSection` input rows | `VoucherField`, `VoucherInput` |
| Search dropdown / autocomplete | `ImportProductSearch` (SP), `SupplierSection` (NCC) | `VoucherSearch`, `VoucherProductDropdown` |
| Table with sticky header + footer totals | `ImportItemsTable`, detail view table | `VoucherTable`, `VoucherTableFooter` |
| Table row inline edit | `ImportItemRow` | `VoucherTableRow` |
| Stepper quantity input | `ImportItemRow` | `VoucherQuantityInput` |
| Summary row (label + value) | `TotalsSection` dùng `SummaryRow`, detail summary card | `VoucherSummaryRow` |
| Action buttons bottom | `ActionFooter` | `VoucherActions` |
| Empty state | `ImportItemsTable`, `SupplierSection`, create list | `VoucherEmpty` |
| Status badge | `getImportStatusBadge`, history list | `VoucherBadge` |
| Modal overlay | Supplier create modal | `VoucherModal` |
| Financial summary card | Detail view summary card | `VoucherSummaryCard` |
| Icon thumbnail + name/meta | `ImportProductSearch` item | `VoucherProductItem` |

---

## 2. Dead code riêng của ImportGoods

### 2.1. Component/file không còn được dùng

| File | Lý do dead |
|------|------------|
| `components/import-goods/LotExpiryPopover.tsx` | Không được import/reference trong `ImportGoods.tsx`. Logic lô/HSD đã chuyển inline vào `ImportItemRow`. |
| `components/import-goods/LotExpiryPopover.css` | Chỉ định nghĩa `.lot-popover-btn` — không còn cần thiết. |
| `.import-receipt-info-label` / `.import-receipt-info-icon` trong `ReceiptInfoSection.css` | Không có element nào dùng class này trong `ReceiptInfoSection.tsx`. |

### 2.2. Function/state không còn dùng trong `ImportGoods.tsx`

| Tên | Dòng | Lý do |
|-----|------|-------|
| `updateItem(index, field, value)` | ~451 | Không được gọi; chỉ dùng `patchItem`. |
| `handleApplyFilters()` | ~798 | Body rỗng, no-op để khớp props của `AdvancedFilterPanel`. |
| `products` prop | 28 | Không dùng; form create dùng `localProducts` từ server-side search. |
| `importReceipts` prop | 30 | Không dùng; history list dùng `receiptList` + `filterImportReceiptsPaginated`. |
| `isLoadingSuppliers` | 112 | Được set nhưng không render loading UI. |
| `isLoadingStats` | 113 | Được set nhưng không render loading UI. |
| `isLoadingProducts` | 117 | Được set nhưng không render loading UI. |
| `contactPerson` trong `newSupplierData` | 93 | Không hiển thị / không lưu trong form modal tạo NCC. |
| `dataGridBoxRef` | 50 | Truyền vào `DataGridBox` nhưng không dùng thêm. |

### 2.3. Feature flag / branch

| Tên | Dòng | Lý do |
|-----|------|-------|
| `useNewDataGridImportGoods` | 20, 1364 | Conditional render. Nếu flag luôn `true`, toàn bộ branch table cũ (dòng ~1406–1598) là dead code. Cần kiểm tra `features.ts`. |

### 2.4. Icon import có khả năng không dùng

Từ import dòng 4, các icon sau có thể chưa dùng:
`Search`, `Banknote`, `History`, `Calendar`, `Clock`, `X`, `Check`, `ArrowLeft`, `ChevronLeft`, `ChevronRight`.

> Cần verify kỹ khi refactor.

### 2.5. CSS dead

| Class | Ghi chú |
|-------|---------|
| `.ig-page-container--padded` | Chưa thấy dùng trong TSX. |
| `.ig-page-mobile-list` / `.ig-page-mobile-card*` | Chỉ dùng nếu có mobile rendering; hiện tại chưa thấy trong TSX. |
| `.ig-page-products__discount` | Chỉ dùng trong detail view table. |

---

## 3. Components cần thay thế bằng Voucher Form System

| Component/file hiện tại | Thay thế bằng | Mức độ ưu tiên |
|---------------------------|---------------|----------------|
| `VoucherFormLayout` | Giữ nguyên (đã là baseline) | — |
| `SectionBox` | `VoucherSection` / `VoucherSectionHeader` | Cao |
| `ImportProductSearch` | `VoucherSearch` + `VoucherProductDropdown` | Cao |
| `ImportItemsTable` | `VoucherTable` | Cao |
| `ImportItemRow` | `VoucherTableRow` | Cao |
| `SupplierSection` | `VoucherSection` + `VoucherSearch` + `VoucherButton` | Cao |
| `ReceiptInfoSection` | `VoucherSection` + `VoucherInput` | Cao |
| `TotalsSection` | `VoucherSection` + `VoucherSummaryRow` | Cao |
| `NoteSection` | `VoucherSection` + `VoucherTextarea` | Cao |
| `ActionFooter` | `VoucherActions` | Cao |
| `LotExpiryPopover` | `VoucherLotInput` / `VoucherPopover` (nếu cần sau này) | Thấp |
| `ImportGoods.css` | Gộp vào token + Voucher component CSS | Cao |
| Detail view summary card | `VoucherSummaryCard` | Trung bình |
| Modal tạo NCC | `VoucherModal` + `VoucherInput` | Trung bình |

---

## 4. Lưu ý quan trọng cho sub-phase sau

- **Không sửa code** trong phase audit này.
- **Phase rollout ImportGoods** (Phase 7 trong master plan) nên chia nhỏ: create form trước, history list sau.
- **History list** hiện có 2 implementation song song (DataGrid V2 + table cũ) do feature flag. Cần xác định `useNewDataGridImportGoods` là `true` vĩnh viễn trước khi refactor.
- **Lot/HSD logic** đã nằm inline trong `ImportItemRow`; không cần `LotExpiryPopover` khi rollout.
- **Server-side data** (`localProducts`, `localSuppliers`, `receiptList`) cần giữ nguyên behavior khi refactor UI.
- **Keyboard shortcuts** (`Ctrl+S`, `Ctrl+Enter`, `Esc`) đang gắn ở `ImportGoods.tsx` — cần migrate hoặc tích hợp vào `VoucherActions`.

---

## 5. Handoff summary

> **Phase 0.1 ImportGoods audit complete.**
> - Đã inventory đầy đủ UI/CSS của màn Nhập hàng.
> - Đã liệt kê patterns lặp, dead code, và components cần thay thế.
> - Sẵn sàng bắt đầu Phase 1 Foundation hoặc Phase 7 Rollout ImportGoods create form.

---

*Generated during Phase 0.1 session — 2026-07-03*
