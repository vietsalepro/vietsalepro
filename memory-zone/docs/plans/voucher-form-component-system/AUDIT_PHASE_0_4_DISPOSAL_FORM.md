# Phase 0.4 — Audit DisposalForm + Tổng hợp + Backup (Voucher Form Component System)

> **Project:** VietSales Pro v7
> **Date:** 2026-07-03
> **Scope:** Inventory UI/CSS của màn Xuất hủy; tổng hợp audit 4 màn phiếu; backup project.
> **Source plan:** `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`

---

## Files audited

| File | Lines | Ghi chú |
|------|-------|---------|
| `pages/DisposalForm.tsx` | 388 | Page chính màn Xuất hủy (create / view / edit) |
| `pages/Disposals.css` | 47 | Style sheet riêng của list view Disposals (đọc để xác nhận không chứa form styles) |
| `components/disposal-form/DisposalProductSearch.tsx` | 174 | Popover autocomplete SP (client-side filter, không có file `.css`) |
| `components/disposal-form/DisposalItemsTable.tsx` | 110 | Bảng SP trong phiếu xuất hủy |
| `components/disposal-form/DisposalItemsTable.css` | 93 | |
| `components/disposal-form/DisposalItemRow.tsx` | 162 | Dòng SP inline edit + lot selector integration |
| `components/disposal-form/DisposalItemRow.css` | 67 | |
| `components/disposal-form/DisposalLotSelector.tsx` | 158 | Dropdown chọn lô/HSD — **PHẢI GIỮ LẠI** khi rollout |
| `components/disposal-form/DisposalLotSelector.css` | 209 | |
| `components/disposal-form/DisposalDetailModal.tsx` | 504 | Detail modal — **NGOÀI SCOPE voucher form**, chỉ ghi nhận |
| `components/disposal-form/DisposalDetailModal.css` | 209 | |
| `components/disposal-form/DisposalSidebar/InfoSection.tsx` | 83 | Sidebar thông tin phiếu |
| `components/disposal-form/DisposalSidebar/InfoSection.css` | 23 | |
| `components/disposal-form/DisposalSidebar/ReasonSection.tsx` | 50 | Sidebar chọn lý do hủy |
| `components/disposal-form/DisposalSidebar/ReasonSection.css` | 14 | |
| `components/disposal-form/DisposalSidebar/NoteSection.tsx` | 38 | Sidebar ghi chú |
| `components/disposal-form/DisposalSidebar/ActionFooter.tsx` | 73 | Nút Lưu tạm / Hoàn thành |
| `components/disposal-form/DisposalSidebar/ActionFooter.css` | 21 | |
| `components/VoucherFormLayout.tsx` | 120 | Layout baseline (đã dùng) |
| `components/VoucherFormLayout.css` | 312 | Layout baseline |
| `components/SectionBox.tsx` | 91 | Component section dùng chung |
| `components/SectionBox.css` | 77 | |
| `components/inventory-count/CountFormLayout.tsx` | 109 | Wrapper `VoucherFormLayout` — **vẫn được import trong `pages/InventoryCount.tsx`** |
| `pages/InventoryCount.tsx` | 1–60 | Xác nhận import `CountFormLayout` còn tồn tại |

---

## 1. UI patterns lặp lại trong DisposalForm

| Pattern | Lặp ở đâu | Đề xuất component Voucher System |
|---------|-----------|----------------------------------|
| Header + Back + Title + Search | `VoucherFormLayout.tsx` | `VoucherHeader`, `VoucherSearch` |
| Product search dropdown / autocomplete | `DisposalProductSearch.tsx` | `VoucherProductDropdown` (mode client, giữ keyboard nav + click-outside) |
| Table with sticky header + footer totals | `DisposalItemsTable.tsx` | `VoucherTable`, `VoucherTableFooter` |
| Table row inline edit | `DisposalItemRow.tsx` | `VoucherTableRow` |
| Quantity input | `DisposalItemRow.tsx` (TextInput) | `VoucherQuantityInput` / `VoucherInput` |
| Lot selector dropdown | `DisposalLotSelector.tsx` | **Giữ nguyên component**, nhúng vào `VoucherTableRow` khi cần |
| Sidebar section card | `InfoSection`, `ReasonSection`, `NoteSection`, `ActionFooter` dùng `SectionBox` | `VoucherSection` + `VoucherSectionHeader` |
| Label + input field stack | `ReasonSection` (SelectInput), `NoteSection` (FormTextarea) | `VoucherField`, `VoucherSelect`, `VoucherTextarea` |
| Status badge | `InfoSection.tsx` dùng `StatusBadge` | `VoucherBadge` |
| Action buttons bottom | `ActionFooter.tsx` | `VoucherActions` / `VoucherButton` |
| Empty state | `DisposalItemsTable.tsx` dùng `EmptyState` | `VoucherEmpty` |
| Currency / number formatting | `Intl.NumberFormat('vi-VN', ...)` và `toLocaleString('vi-VN')` lặp lại | `VoucherCurrency`, `VoucherNumber` helpers |
| Summary stats (count, qty, value) | Tính lại trong `DisposalForm.tsx` (stats) và `DisposalItemsTable.tsx` (footer) | Tập trung qua helper `calculateDisposalTotals` |

### 1.1. Patterns lặp bên trong `DisposalForm.tsx`

- **Total calculation**: `stats` trong `DisposalForm.tsx` (lines ~185–191) và `totalQuantity`/`totalValue` trong `DisposalItemsTable.tsx` (lines ~35–36) dùng cùng reduce logic. Nên tập trung thành 1 helper.
- **Status label/type mapping**: `getStatusVariant` / `getStatusLabel` trong `InfoSection.tsx` là bản sao nhỏ của các mapping trong các màn khác.
- **Reason list**: `DISPOSAL_REASONS` constant được khai báo lại trong `pages/DisposalForm.tsx` (lines ~16–23) và `ReasonSection.tsx` (lines ~6–13). Nên đưa về 1 file constant chung.
- **Quantity parser**: `parseQty` trong `DisposalItemRow.tsx` gần giống với các parser trong `ImportItemRow` / `CountItemsTable`. Nên tập trung qua `parseVoucherQuantity`.

---

## 2. Dead code tổng hợp từ cả 4 màn

### 2.1. Component/file không còn tồn tại (không cần xử lý)

| File | Trạng thái | Xác nhận từ Phase 0.4 |
|------|------------|------------------------|
| `components/import-goods/ImportFormLayout.tsx` | Không tồn tại | `find_file_by_name` → No files found |
| `components/import-goods/ImportFormLayout.css` | Không tồn tại | `find_file_by_name` → No files found |
| `components/disposal-form/DisposalFormLayout.tsx` | Không tồn tại | `find_file_by_name` → No files found |
| `components/disposal-form/DisposalFormLayout.css` | Không tồn tại | `find_file_by_name` → No files found |
| `components/disposal-form/DisposalProductSearch.css` | Không tồn tại | `find_file_by_name` → No files found |
| `components/inventory-count/CountFormLayout.css` | Không tồn tại | `find_file_by_name` → No files found |

### 2.2. File vẫn tồn tại và cần giữ

| File | Lý do giữ |
|------|-----------|
| `components/inventory-count/CountFormLayout.tsx` | `pages/InventoryCount.tsx` vẫn import tại dòng 10. Là wrapper quanh `VoucherFormLayout`. Sẽ refactor path sang `components/voucher-form` trong Phase 1. |

### 2.3. Dead code từng màn (tổng hợp từ Phase 0.1–0.3)

#### ImportGoods (Phase 0.1)

| Loại | Tên | Ghi chú |
|------|-----|---------|
| Component dead | `components/import-goods/LotExpiryPopover.tsx` + `.css` | Không được import trong `ImportGoods.tsx` |
| CSS dead | `.import-receipt-info-label` / `.import-receipt-info-icon` | Không có element dùng class |
| Function/state dead | `updateItem`, `handleApplyFilters`, `products` prop, `importReceipts` prop, `isLoadingSuppliers`, `isLoadingStats`, `isLoadingProducts`, `contactPerson` trong `newSupplierData`, `dataGridBoxRef` | Không dùng hoặc không render UI |
| Feature flag | `useNewDataGridImportGoods` | Branch table cũ có thể là dead nếu flag luôn true |
| CSS dead | `.ig-page-container--padded`, `.ig-page-mobile-list` / `.ig-page-mobile-card*`, `.ig-page-products__discount` | Chưa thấy dùng trong TSX |

#### InventoryCount (Phase 0.2)

| Loại | Tên | Ghi chú |
|------|-----|---------|
| CSS dead | `.inventory-count-page__filter-bar` | JSX dùng `.filter-bar` từ `FilterBar.css` |
| CSS dead | `.inventory-count-table__*` (block table V1) | Chỉ dùng khi `useNewDataGridInventoryCounts === false` |
| CSS dead | `.inventory-count-pagination` (desktop) | Chỉ nằm trong nhánh V1 fallback |
| Legacy fallback | Custom table V1 + mobile card list | Dead nếu DataGrid flag luôn true |
| Code smell | `countPageSize` state, `countSearchTerm2`, `isCountFilterActive` logic | Gần dead / confusing |

#### SupplierExchanges (Phase 0.3)

| Loại | Tên | Ghi chú |
|------|-----|---------|
| Component split đề xuất | `ExchangeForm.tsx` | Wizard create flow quá lớn (~67K), nên tách |
| CSS detail view | `.se-page-detail-*` | Copy phong cách `ImportGoods` — nên đổi về component chung |

---

## 3. Ghi chú scope quan trọng

### 3.1. `DisposalDetailModal.tsx` / `.css` — NGOÀI SCOPE

- Component này thuộc **list view** `pages/Disposals.tsx` (dùng để xem chi tiết/xoá phiếu từ danh sách).
- **Không thuộc Voucher Form Component System**.
- **Không refactor, không thay, không xóa** trong các phase voucher form.
- Chỉ đọc để ghi nhận: nó dùng `MasterModal`, `SectionBox`, `ModalInfoGrid`, `ModalTable`, `StatusBadge`, `ActionButton`, `SummaryRow` — những patterns có thể tái sử dụng trong tương lai nhưng nằm ngoài scope hiện tại.

### 3.2. `DisposalLotSelector.tsx` — PHẢI GIỮ LẠI

- Đây là component UX đặc thù của DisposalForm: dropdown chọn lô với HSD + tồn, overlay toàn màn hình, header sản phẩm, clear option.
- Khi rollout Phase 6 (Pilot DisposalForm), `DisposalLotSelector` sẽ được **nhúng lại bên trong `VoucherTableRow`** (hoặc render qua slot) thay vì thay thế bằng generic component.
- Không xóa, không sửa logic chọn lô trong phase audit.

---

## 4. Xác nhận Option A1 (Minimal Component System)

| Tiêu chí | Trạng thái |
|----------|------------|
| Không thêm dependencies mới | Đồng ý (theo master plan Section 5.1) |
| Tận dụng design tokens hiện có (`design-system-tokens.css`) | Đồng ý |
| Tái sử dụng `VoucherFormLayout` làm baseline | Đồng ý — đã dùng trong cả 4 màn |
| Pilot màn đơn giản nhất trước: `DisposalForm` | Đồng ý — theo Phase 6 master plan |
| `DisposalDetailModal` ngoài scope | Đồng ý |
| `DisposalLotSelector` giữ lại | Đồng ý |

**Quyết định:** Xác nhận chọn **Option A1 — Minimal Component System**.

---

## 5. Xác nhận file layout

| File | Trạng thái | Ghi chú |
|------|------------|---------|
| `components/import-goods/ImportFormLayout.tsx` | ❌ Không tồn tại | Không cần xử lý |
| `components/import-goods/ImportFormLayout.css` | ❌ Không tồn tại | Không cần xử lý |
| `components/disposal-form/DisposalFormLayout.tsx` | ❌ Không tồn tại | Không cần xử lý |
| `components/disposal-form/DisposalFormLayout.css` | ❌ Không tồn tại | Không cần xử lý |
| `components/disposal-form/DisposalProductSearch.css` | ❌ Không tồn tại | Component không có file CSS riêng |
| `components/inventory-count/CountFormLayout.tsx` | ✅ Tồn tại | Đang được import trong `pages/InventoryCount.tsx` dòng 10 — **giữ lại** |
| `components/inventory-count/CountFormLayout.css` | ❌ Không tồn tại | Không cần xử lý |

---

## 6. Backup project

| Mục | Giá trị |
|-----|---------|
| Backup path | `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_phase0_20260703_132420` |
| Backup command | `Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_phase0_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse` |

> Backup path sẽ được cập nhật sau khi chạy lệnh.

---

## 7. Handoff summary

> **Phase 0.4 DisposalForm audit complete.**
> - Đã inventory đầy đủ UI/CSS của màn Xuất hủy.
> - Đã liệt kê patterns lặp, dead code tổng hợp 4 màn.
> - Đã xác nhận `DisposalDetailModal` ngoài scope, `DisposalLotSelector` phải giữ.
> - Đã xác nhận Option A1 (Minimal).
> - Đã xác nhận trạng thái các file layout.
> - Sẵn sàng bắt đầu Phase 1 Foundation.

---

*Generated during Phase 0.4 session — 2026-07-03*
