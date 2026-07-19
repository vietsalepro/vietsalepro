# UI_DEPENDENCY_GRAPH — VietSale Pro v7

> **Phiên bản:** 1.0  
> **Mục đích:** Bản đồ phụ thuộc toàn bộ hệ thống UI hiện tại — phục vụ migration an toàn sang Master-Design System.  
> **Phạm vi:** Tất cả component, modal, page, shared component — không bao gồm backend logic.  
> **Nguồn dữ liệu:** Source code thực tế (`components/`, `pages/`, `Master-design/`) + Tài liệu phân tích đã có.

---

## SECTION 1 — EXECUTIVE SUMMARY

### Tổng quan hiện trạng

| Hạng mục | Số lượng | Ghi chú |
|----------|----------|---------|
| **Modal** | 7+ | MasterModal, PaymentModal, PromotionModal, PayDebtModal, ProductEditModal, TaxCalculationModal, DisposalDetailModal, ImportPreviewModal, BatchSelectionModal |
| **Form Layouts** | 4 | DisposalFormLayout, ImportFormLayout, CountFormLayout, MobilePOS |
| **Table** | 4+ | DisposalItemsTable, ImportItemsTable, CountItemsTable, ModalTable (sub-component) |
| **Shared Components** | 4 | MasterModal (chứa 7 sub-components), ui.tsx (chứa nhiều primitives), Sidebar, BottomNav |
| **Page Layouts** | 10+ | Inventory, Disposals, Customers, Suppliers, Orders, MobilePOS, CategoryManagement, BrandManagement, ReturnOrders, LandingPage |

### Đánh giá tổng thể

| Mức độ | Số lượng | Component |
|--------|----------|-----------|
| 🔴 **HIGH RISK** | 7 | MasterModal, ActionButton (ModalButton), SectionBox (ModalSection), Input, StatusBadge, State Components, DataGrid |
| 🟡 **MEDIUM RISK** | 8 | PaymentModal, PromotionModal, DisposalDetailModal, PayDebtModal, ProductEditModal, ImportFormLayout, CountFormLayout, TaxCalculationModal |
| 🟢 **LOW RISK** | 5 | BatchSelectionModal, ImportPreviewModal, BottomNav, Sidebar, UserMenuMobile |

---

## SECTION 2 — UI COMPONENT INVENTORY

### Danh sách toàn bộ component

| # | Tên Component | Path | Loại | Usage Count | Shared Level | Risk Level |
|---|--------------|------|------|-------------|--------------|------------|
| 1 | **MasterModal** | `components/MasterModal.tsx` | Container | 8+ modals | 🔴 HIGH | 🔴 HIGH |
| 2 | **ModalSection** | `components/MasterModal.tsx` | Sub-component | 5+ usages | 🔴 HIGH | 🔴 HIGH |
| 3 | **ModalInfoGrid** | `components/MasterModal.tsx` | Sub-component | 3+ usages | 🟡 MEDIUM | 🟡 MEDIUM |
| 4 | **ModalTable** | `components/MasterModal.tsx` | Sub-component | 3+ usages | 🟡 MEDIUM | 🟡 MEDIUM |
| 5 | **StatusBadge** | `components/MasterModal.tsx` | Sub-component | 5+ usages | 🔴 HIGH | 🟡 MEDIUM |
| 6 | **ModalButton** | `components/MasterModal.tsx` | Sub-component | 4+ usages | 🔴 HIGH | 🟡 MEDIUM |
| 7 | **SummaryRow** | `components/MasterModal.tsx` | Sub-component | 2+ usages | 🟢 LOW | 🟢 LOW |
| 8 | **ActionButton (PrimaryButton)** | (trong ui.tsx / tạo mới) | Primitive | 10+ | 🔴 HIGH | 🔴 HIGH |
| 9 | **SectionBox** | (trong ui.tsx / tạo mới) | Container | 6+ | 🔴 HIGH | 🔴 HIGH |
| 10 | **Input (TextInput)** | (trong ui.tsx / tạo mới) | Form Control | 8+ | 🔴 HIGH | 🔴 HIGH |
| 11 | **Select (SelectInput)** | (trong ui.tsx / tạo mới) | Form Control | 5+ | 🔴 HIGH | 🟡 MEDIUM |
| 12 | **State Components** | (tạo mới) | State | 6+ | 🔴 HIGH | 🔴 HIGH |
| 13 | **DataGrid** | (trong pages) | Table | 4+ | 🔴 HIGH | 🔴 HIGH |
| 14 | **Sidebar** | `components/Sidebar.tsx` | Navigation | 1 | 🟢 LOW | 🟢 LOW |
| 15 | **BottomNav** | `components/BottomNav.tsx` | Navigation | 1 | 🟢 LOW | 🟢 LOW |
| 16 | **UserMenuMobile** | `components/UserMenuMobile.tsx` | Navigation | 1 | 🟢 LOW | 🟢 LOW |
| 17 | **PaymentModal** | `components/desktop-pos/PaymentModal.tsx` | Business Modal | 1 | 🟡 MEDIUM | 🟡 MEDIUM |
| 18 | **PromotionModal** | `components/desktop-pos/PromotionModal.tsx` | Business Modal | 1 | 🟡 MEDIUM | 🟡 MEDIUM |
| 19 | **PayDebtModal** | `components/PayDebtModal.tsx` | Business Modal | 1 | 🟡 MEDIUM | 🟡 MEDIUM |
| 20 | **DisposalDetailModal** | `components/disposal-form/DisposalDetailModal.tsx` | Business Modal | 1 | 🟡 MEDIUM | 🟡 MEDIUM |
| 21 | **DisposalFormLayout** | `components/disposal-form/DisposalFormLayout.tsx` | Form Layout | 1 | 🟡 MEDIUM | 🟡 MEDIUM |
| 22 | **DisposalItemsTable** | `components/disposal-form/DisposalItemsTable.tsx` | Table | 1 | 🟡 MEDIUM | 🟡 MEDIUM |
| 23 | **ImportFormLayout** | `components/import-goods/ImportFormLayout.tsx` | Form Layout | 1 | 🟡 MEDIUM | 🟡 MEDIUM |
| 24 | **ImportItemsTable** | `components/import-goods/ImportItemsTable.tsx` | Table | 1 | 🟡 MEDIUM | 🟡 MEDIUM |
| 25 | **CountFormLayout** | `components/inventory-count/CountFormLayout.tsx` | Form Layout | 1 | 🟡 MEDIUM | 🟡 MEDIUM |
| 26 | **CountItemsTable** | `components/inventory-count/CountItemsTable.tsx` | Table | 1 | 🟡 MEDIUM | 🟡 MEDIUM |
| 27 | **DisposalSidebar** | `components/disposal-form/DisposalSidebar/` | Sidebar Layout | 1 | 🟢 LOW | 🟢 LOW |
| 28 | **ImportSidebar** | `components/import-goods/ImportSidebar/` | Sidebar Layout | 1 | 🟢 LOW | 🟢 LOW |
| 29 | **CountSidebar** | `components/inventory-count/CountSidebar/` | Sidebar Layout | 1 | 🟢 LOW | 🟢 LOW |
| 30 | **Api Layer** | `services/` | Service | Global | 🔴 HIGH | 🔴 HIGH |
| 31 | **Types/TypeScript** | `types.ts` | Type Definitions | Global | 🔴 HIGH | 🔴 HIGH |

---

## SECTION 3 — DEPENDENCY TREE

### 3.1 MasterModal

```
MasterModal
 ├── React (node_modules)
 ├── lucide-react (X icon)
 ├── design-system-tokens.css (CSS variables)
 │
 ├── [Sub-components exported]
 │   ├── ModalSection
 │   │   └── Icon + Title + Children
 │   ├── ModalInfoGrid
 │   │   └── Items[] → grid 2 cột
 │   ├── ModalTable
 │   │   └── Headers[] + Rows[][] + Empty State
 │   ├── StatusBadge
 │   │   └── Variant → color mapping (success/warning/danger/info/neutral/purple)
 │   ├── ModalButton
 │   │   └── Variant → style mapping (primary/secondary/danger/success/ghost)
 │   └── SummaryRow
 │       └── Label + Value + optional accent
```

### 3.2 ui.tsx (Legacy Component System)

```
ui.tsx
 ├── React (node_modules)
 ├── lucide-react (icons)
 │
 ├── [Exported Components]
 │   ├── Card
 │   ├── Button (Legacy - multiple variants)
 │   ├── Badge (Legacy)
 │   ├── Toast
 │   ├── Notification
 │   ├── Tabs
 │   ├── Dropdown
 │   └── Other primitives
```

### 3.3 DisposalFormLayout

```
DisposalFormLayout
 ├── DisposalTopBar
 ├── DisposalProductSearch
 ├── DisposalItemsTable
 │   ├── DisposalItemRow
 │   └── DisposalLotSelector
 ├── DisposalSidebar/
 │   ├── DisposalInfoSection
 │   ├── DisposalSummarySection
 │   └── DisposalActionSection
 └── DisposalDetailModal
     └── (uses MasterModal pattern or custom)
```

### 3.4 ImportFormLayout

```
ImportFormLayout
 ├── ImportTopBar
 ├── ImportProductSearch
 ├── ImportItemsTable
 │   ├── ImportItemRow
 │   └── LotExpiryPopover
 ├── ImportSidebar/
 │   ├── ImportInfoSection
 │   └── ImportSummarySection
 └── (uses SectionBox pattern via inline layout)
```

### 3.5 CountFormLayout

```
CountFormLayout
 ├── CountInfoSection (CountSidebar/)
 ├── CountSummary (CountSidebar/)
 ├── CountItemsTable
 ├── ProductSearchDropdown
 └── ModalSection (từ MasterModal - verified import)
```

### 3.6 DataGrid / Table Pattern

```
DataGrid (Pattern)
 ├── TableToolbar
 │   ├── SearchInput
 │   ├── FilterButton
 │   └── ActionButtons
 ├── TableHeader
 ├── TableBody
 │   └── TableRow(s)
 ├── Pagination
 ├── EmptyState
 └── LoadingState
```

### 3.7 PaymentModal

```
PaymentModal
 ├── [Current: tự render backdrop/motion.div]
 ├── [Cần refactor → MasterModal]
 ├── Input số tiền (TextInput)
 ├── Payment Method Grid
 ├── Quick Amount Buttons
 ├── Change Display
 └── Confirm Button (ModalButton/ActionButton)
```

### 3.8 PromotionModal

```
PromotionModal
 ├── [Current: tự render backdrop/motion.div]
 ├── [Cần refactor → MasterModal]
 ├── Promotion List Items
 ├── Checkbox/Radio Selection
 ├── Discount Preview
 └── Confirm Button (ModalButton/ActionButton)
```

---

## SECTION 4 — REVERSE DEPENDENCY TREE

### 4.1 MasterModal

**Được sử dụng bởi (trực tiếp):**

- `pages/Inventory.tsx` — import MasterModal
- `components/inventory-count/CountFormLayout.tsx` — import ModalSection
- `components/inventory-count/CountSidebar/CountInfoSection.tsx` — import ModalSection, ModalInfoGrid, StatusBadge
- `components/inventory-count/CountSidebar/CountSummary.tsx` — import ModalSection, SummaryRow
- (Các modal nghiệp vụ sẽ import khi refactor — PaymentModal, PromotionModal, DisposalDetailModal, PayDebtModal, ProductEditModal)

**Tổng ảnh hưởng:** 15+ components

**Risk:** 🔴 **HIGH** — MasterModal là trung tâm của toàn bộ modal system

### 4.2 StatusBadge

**Được sử dụng bởi:**

- `pages/Disposals.tsx` — import StatusBadge
- `components/inventory-count/CountSidebar/CountInfoSection.tsx` — import StatusBadge

**Tổng ảnh hưởng:** 3+ components (sẽ tăng khi các modal khác refactor)

**Risk:** 🟡 **MEDIUM**

### 4.3 ModalSection / SectionBox (Pattern)

**Được sử dụng bởi (pattern tương đương):**

- `components/inventory-count/CountFormLayout.tsx` — import ModalSection
- `components/inventory-count/CountSidebar/CountInfoSection.tsx` — import ModalSection
- `components/inventory-count/CountSidebar/CountSummary.tsx` — import ModalSection
- DisposalFormLayout — section pattern (inline CSS)
- ImportFormLayout — section pattern (inline CSS)
- DisposalDetailModal — section pattern
- PayDebtModal — section pattern
- ProductEditModal — section pattern

**Tổng ảnh hưởng:** 8+ components

**Risk:** 🔴 **HIGH**

### 4.4 ActionButton / ModalButton (Button Pattern)

**Được sử dụng bởi:**

- `PaymentModal` — nút xác nhận, nút đóng
- `PromotionModal` — nút xác nhận
- `DisposalDetailModal` — nút hành động
- `PayDebtModal` — nút thanh toán
- `ProductEditModal` — nút lưu
- `TaxCalculationModal` — nút tính toán
- `ImportFormLayout` — nút thêm, nút lưu
- `DisposalFormLayout` — nút hành động
- `CountFormLayout` — nút xác nhận
- `BatchSelectionModal` — nút chọn
- `ImportPreviewModal` — nút xác nhận
- Các page có nút hành động: Inventory, Disposals, Orders, Customers, Suppliers

**Tổng ảnh hưởng:** 17+ components

**Risk:** 🔴 **HIGH**

### 4.5 Input / FormField (Input Pattern)

**Được sử dụng bởi:**

- `PaymentModal` — input số tiền
- `DisposalFormLayout` — input số lượng, giá
- `ImportFormLayout` — input số lượng, giá, hạn sử dụng
- `CountFormLayout` — input số lượng
- `PayDebtModal` — input số tiền
- `ProductEditModal` — input thông tin sản phẩm
- `AdvancedFilterPanel` — input filter
- `ProductSearch` / `ProductSearchDropdown` — input tìm kiếm

**Tổng ảnh hưởng:** 10+ components

**Risk:** 🔴 **HIGH**

### 4.6 State Components (LoadingState, EmptyState, ErrorState)

**Được sử dụng bởi:**

- `ModalTable` (MasterModal) — Empty state cho table
- `DataGrid` — Empty state, Loading state
- `DisposalItemsTable` — Empty state
- `ImportItemsTable` — Empty state
- `CountItemsTable` — Empty state
- `PromotionModal` — Empty state khi không có KM
- `ProductSearch` — Loading state, Empty state

**Tổng ảnh hưởng:** 8+ components

**Risk:** 🔴 **HIGH**

### 4.7 DataGrid / Table Components

**Được sử dụng bởi:**

- `pages/Inventory.tsx` — bảng danh sách
- `pages/Disposals.tsx` — bảng danh sách
- `pages/Orders.tsx` — bảng danh sách
- `pages/CustomerManagement.tsx` — bảng danh sách
- `pages/BrandManagement.tsx` — bảng danh sách
- `pages/ReturnOrders.tsx` — bảng danh sách

**Tổng ảnh hưởng:** 6+ pages

**Risk:** 🔴 **HIGH**

### 4.8 Domain Modal Components

| Modal | Được gọi từ | Số lượng caller |
|-------|------------|-----------------|
| DisposalDetailModal | `pages/Disposals.tsx`, `DisposalFormLayout` | 2 |
| PayDebtModal | `pages/Orders.tsx` (hoặc POS) | 1-2 |
| ProductEditModal | `pages/Inventory.tsx` | 1 |
| TaxCalculationModal | `PaymentModal` hoặc Cart | 1-2 |
| BatchSelectionModal | Module có batch action | 1-2 |
| ImportPreviewModal | `components/orders/` | 1 |

---

## SECTION 5 — FOUNDATION COMPONENT ANALYSIS

### Foundation Layer

```
Layer 0 — Design System Tokens
├── design-system-tokens.css (Global CSS Variables)
├── Colors (--status-*, --entity-*, --modal-*, --section-*)
├── Typography (font-size, font-weight, line-height)
├── Spacing (space-*)
├── Radius (radius-*)
├── Shadows (shadow-*)
├── Elevation/Z-Index (z-*)
└── Motion/Animation (keyframes)

Layer 1 — Primitives (Tạo mới hoặc giữ nguyên)
├── ActionButton (PrimaryButton, SecondaryButton, DangerButton, GhostButton)
├── Form Controls (TextInput, SelectInput, FormField)
├── State Components (LoadingState, EmptyState, ErrorState)
└── StatusBadge

Layer 2 — Containers
├── MasterModal (Modal container + sub-components)
├── SectionBox (Section container + header + content)
└── DataGrid (Table + toolbar + pagination)

Layer 3 — Business Modals
├── PaymentModal
├── PromotionModal
├── DisposalDetailModal
├── PayDebtModal
├── ProductEditModal
├── TaxCalculationModal
├── BatchSelectionModal
└── ImportPreviewModal

Layer 4 — Form Layouts
├── DisposalFormLayout
├── ImportFormLayout
└── CountFormLayout

Layer 5 — Pages
├── Inventory
├── Disposals
├── Orders
├── Customers
├── Suppliers
├── ReturnOrders
├── CategoryManagement
├── BrandManagement
└── LandingPage
```

### Impact Analysis

| Foundation Component | Nếu thay đổi → Bao nhiêu component ảnh hưởng |
|---------------------|-----------------------------------------------|
| **Design Tokens** (Layer 0) | **TẤT CẢ** — Toàn bộ UI (30+ components) |
| **ActionButton** | 17+ components |
| **Input / FormField** | 10+ components |
| **SectionBox / ModalSection** | 8+ components |
| **MasterModal** | 15+ components (all modals) |
| **StatusBadge** | 3+ components |
| **State Components** | 8+ components |
| **DataGrid** | 6+ pages |
| **Typography** | Tất cả text components |

---

## SECTION 6 — SHARED COMPONENT MATRIX

| Component | Usage Count | Affected Screens | Risk | Priority |
|-----------|------------|------------------|------|----------|
| **ActionButton** (ModalButton) | 17+ | Tất cả modal, form layout, page | 🔴 HIGH | P0 |
| **MasterModal** | 8+ | PaymentModal, PromotionModal, DisposalDetailModal, PayDebtModal, ProductEditModal, TaxCalculationModal, BatchSelectionModal, ImportPreviewModal | 🔴 HIGH | P0 |
| **ModalSection** (SectionBox) | 8+ | Tất cả layout có section (DisposalFormLayout, ImportFormLayout, CountFormLayout, modal details) | 🔴 HIGH | P0 |
| **Input / TextInput** | 10+ | PaymentModal, DisposalFormLayout, ImportFormLayout, CountFormLayout, PayDebtModal, ProductEditModal | 🔴 HIGH | P0 |
| **State Components** | 8+ | Tất cả table, search, data display | 🔴 HIGH | P0 |
| **StatusBadge** | 3+ | Disposals page, Count pages, modal details | 🟡 MEDIUM | P1 |
| **Select / SelectInput** | 5+ | Form layout, filter panel, product search | 🟡 MEDIUM | P1 |
| **SummaryRow** | 2+ | CountSummary, PaymentSummary | 🟢 LOW | P2 |
| **DataGrid** (Table) | 6+ | Tất cả danh sách page | 🔴 HIGH | P1 |
| **ModalInfoGrid** | 3+ | Detail modals, info displays | 🟡 MEDIUM | P1 |
| **ModalTable** | 3+ | Detail modals có bảng line items | 🟡 MEDIUM | P1 |

---

## SECTION 7 — MODAL DEPENDENCY MAP

### 7.1 MasterModal (Container)

```
MasterModal
├── Design Tokens (Layer 0)
│   ├── --modal-overlay
│   ├── --modal-bg
│   ├── --modal-shadow
│   ├── --modal-border
│   ├── --modal-radius
│   ├── --modal-header-bg
│   ├── --modal-footer-bg
│   ├── --modal-title-color
│   └── --modal-subtitle-color
├── lucide-react (X icon)
├── React
└── CSS Animation (mmFadeUp)
```

### 7.2 PaymentModal

```
PaymentModal
├── Layer 0 — Design Tokens
├── Layer 2 — MasterModal (CẦN REFACTOR)
├── Layer 1 — TextInput (số tiền thanh toán)
├── Layer 1 — PrimaryButton (xác nhận)
├── Layer 1 — SecondaryButton (hủy)
├── Layer 1 — LoadingState (đang xử lý)
├── Business Logic
│   ├── Tính toán tiền thừa
│   ├── 3 phương thức thanh toán
│   └── Quick amount buttons
└── API Layer (services)
```

### 7.3 PromotionModal

```
PromotionModal
├── Layer 0 — Design Tokens
├── Layer 2 — MasterModal (CẦN REFACTOR)
├── Layer 1 — PrimaryButton (xác nhận)
├── Layer 1 — EmptyState (không có KM)
├── Business Logic
│   ├── Promotion list
│   ├── Checkbox selection
│   └── Discount preview calculation
└── API Layer (services)
```

### 7.4 DisposalDetailModal

```
DisposalDetailModal
├── Layer 0 — Design Tokens
├── Layer 2 — MasterModal (pattern hiện tại)
├── Layer 2 — SectionBox (section pattern)
├── Layer 1 — StatusBadge (trạng thái)
├── Layer 1 — ModalInfoGrid (thông tin)
├── Layer 1 — ModalTable (danh sách items)
├── Layer 1 — ActionButton (các nút)
├── Layer 1 — SummaryRow (tổng kết)
└── Business Logic Layer
```

### 7.5 DisposalFormLayout

```
DisposalFormLayout
├── Layer 0 — Design Tokens
├── Layer 2 — SectionBox (section pattern)
├── Layer 1 — TextInput (số lượng, giá)
├── Layer 1 — SelectInput (lý do, loại)
├── Layer 1 — ActionButton (lưu, hủy)
├── Layer 1 — StatusBadge (trạng thái)
├── Layer 1 — LoadingState
├── Layer 1 — EmptyState
├── Domain Components
│   ├── DisposalProductSearch
│   ├── DisposalLotSelector
│   └── DisposalItemRow
└── API Layer (services)
```

### 7.6 ImportFormLayout

```
ImportFormLayout
├── Layer 0 — Design Tokens
├── Layer 2 — SectionBox (section pattern)
├── Layer 1 — TextInput (số lượng, giá)
├── Layer 1 — SelectInput (nhà cung cấp, kho)
├── Layer 1 — ActionButton (lưu, hủy)
├── Layer 1 — LoadingState
├── Layer 1 — EmptyState
├── Domain Components
│   ├── ImportProductSearch
│   ├── ImportItemRow
│   └── LotExpiryPopover
└── API Layer (services)
```

### 7.7 CountFormLayout

```
CountFormLayout
├── Layer 0 — Design Tokens
├── Layer 2 — MasterModal.ModalSection (verified import)
├── Layer 2 — MasterModal.ModalInfoGrid
├── Layer 2 — MasterModal.StatusBadge
├── Layer 2 — MasterModal.SummaryRow
├── Layer 1 — TextInput (số lượng kiểm)
├── Layer 1 — ActionButton (xác nhận)
├── Layer 1 — LoadingState
├── Domain Components
│   ├── ProductSearchDropdown
│   └── CountItemsTable
└── API Layer (services)
```

### 7.8 PayDebtModal

```
PayDebtModal
├── Layer 0 — Design Tokens
├── Layer 2 — MasterModal (pattern hiện tại)
├── Layer 2 — SectionBox / ModalSection
├── Layer 1 — TextInput (số tiền)
├── Layer 1 — SelectInput (phương thức)
├── Layer 1 — ActionButton
├── Layer 1 — ModalInfoGrid
└── API Layer (services)
```

### 7.9 ProductEditModal

```
ProductEditModal
├── Layer 0 — Design Tokens
├── Layer 2 — MasterModal (pattern hiện tại)
├── Layer 2 — SectionBox / ModalSection
├── Layer 1 — TextInput (tên, giá, mã vạch...)
├── Layer 1 — SelectInput (danh mục, thương hiệu)
├── Layer 1 — ActionButton
├── Layer 1 — StatusBadge
└── API Layer (services)
```

### 7.10 TaxCalculationModal

```
TaxCalculationModal
├── Layer 0 — Design Tokens
├── Layer 2 — MasterModal (pattern hiện tại)
├── Layer 2 — SectionBox / ModalSection
├── Layer 1 — TextInput
├── Layer 1 — ActionButton
├── Layer 1 — SummaryRow
└── Business Logic (tính thuế)
```

---

## SECTION 8 — STATE DEPENDENCY MAP

### 8.1 LoadingState

**Được sử dụng bởi:**

| Component | Vị trí | Khi nào |
|-----------|--------|---------|
| DisposalItemsTable | Loading dữ liệu items | Initial load |
| ImportItemsTable | Loading dữ liệu items | Initial load |
| CountItemsTable | Loading dữ liệu items | Initial load |
| ProductSearch | Loading kết quả tìm kiếm | Search |
| PaymentModal | Processing payment | Khi xác nhận |
| DisposalDetailModal | Loading detail data | Mở modal |
| Tất cả page list | Loading page data | Initial page load |
| DataGrid | Loading table data | Initial load, filter |

**Tổng:** 10+ components

### 8.2 EmptyState

**Được sử dụng bởi:**

| Component | Vị trí | Khi nào |
|-----------|--------|---------|
| ModalTable (MasterModal) | Modal line items | Không có dữ liệu |
| DisposalItemsTable | Danh sách items rỗng | Chưa thêm item |
| ImportItemsTable | Danh sách items rỗng | Chưa thêm item |
| CountItemsTable | Danh sách items rỗng | Chưa thêm item |
| PromotionModal | Không có khuyến mãi | Không có KM khả dụng |
| ProductSearch | Không tìm thấy sản phẩm | Search không có kết quả |
| DataGrid | Không có dữ liệu | Filter không có kết quả |
| Tất cả page list | Danh sách rỗng | Chưa có dữ liệu |

**Tổng:** 10+ components

### 8.3 ErrorState

**Được sử dụng bởi:**

| Component | Vị trí | Khi nào |
|-----------|--------|---------|
| DisposalDetailModal | Lỗi load chi tiết | API fail |
| PaymentModal | Lỗi thanh toán | Xử lý thất bại |
| DisposalFormLayout | Lỗi lưu dữ liệu | Submit fail |
| ImportFormLayout | Lỗi lưu dữ liệu | Submit fail |
| CountFormLayout | Lỗi xác nhận kiểm | Submit fail |
| DataGrid | Lỗi load dữ liệu | API fail |
| Tất cả page list | Lỗi load danh sách | API fail |

**Tổng:** 8+ components

---

## SECTION 9 — DESIGN SYSTEM DEPENDENCY MAP

### 9.1 Component → Design System Mappings

| Component | Design Tokens | Typography | Motion | Elevation | Input Std | Button Std | Modal Blueprint |
|-----------|--------------|------------|--------|-----------|-----------|------------|-----------------|
| **MasterModal** | ✅ | ✅ | ✅ (mmFadeUp) | ✅ (z-[9999]) | — | ✅ (ModalButton) | ✅ |
| **ModalSection** | ✅ (border, bg) | ✅ (uppercase) | — | — | — | — | — |
| **ModalInfoGrid** | ✅ (spacing) | ✅ (label/value) | — | — | — | — | — |
| **ModalTable** | ✅ (spacing) | ✅ (text) | — | — | — | — | — |
| **StatusBadge** | ✅ (status colors) | ✅ | — | — | — | — | — |
| **ModalButton** | ✅ (colors) | ✅ | ✅ (hover) | ✅ (shadow) | — | ✅ | — |
| **SummaryRow** | ✅ (border) | ✅ (bold) | — | — | — | — | — |
| **SectionBox** | ✅ | ✅ | — | ✅ | — | — | — |
| **ActionButton** | ✅ | ✅ | ✅ | ✅ | — | ✅ | — |
| **TextInput** | ✅ | ✅ | ✅ (focus) | — | ✅ | — | — |
| **SelectInput** | ✅ | ✅ | ✅ (focus) | — | ✅ | — | — |
| **DataGrid** | ✅ | ✅ | — | ✅ | — | — | — |
| **State Components** | ✅ | ✅ | ✅ (spinner) | — | — | — | — |
| **PaymentModal** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (cần refactor) |
| **PromotionModal** | ✅ | ✅ | ✅ | ✅ | — | ✅ | ❌ (cần refactor) |
| **DisposalDetailModal** | ✅ | ✅ | — | ✅ | — | ✅ | ❌ (cần verify) |
| **DisposalFormLayout** | ✅ | ✅ | — | ✅ | ✅ | ✅ | ❌ |
| **ImportFormLayout** | ✅ | ✅ | — | ✅ | ✅ | ✅ | ❌ |
| **CountFormLayout** | ✅ (partial) | ✅ | — | ✅ | ✅ | ✅ | ❌ |

### 9.2 Components Đang Vi Phạm Design System

| Component | Vi phạm | Mô tả |
|-----------|---------|-------|
| **PaymentModal** | ❌ KHÔNG dùng MasterModal | Tự render backdrop + motion.div — không dùng container chuẩn |
| **PromotionModal** | ❌ KHÔNG dùng MasterModal | Tự render backdrop — không dùng container chuẩn |
| **DisposalFormLayout** | ❌ Section inline CSS | Dùng section với class Tailwind thủ công thay vì SectionBox |
| **ImportFormLayout** | ❌ Section inline CSS | Dùng section với class Tailwind thủ công thay vì SectionBox |
| **PayDebtModal** | ❌ Chưa verify | Có thể tự render container |
| **ProductEditModal** | ❌ Chưa verify | Có thể tự render container |
| **ui.tsx** | ❌ Legacy System | Button, Badge, Card — các component cũ cần map sang Design System mới |

---

## SECTION 10 — MIGRATION IMPACT ANALYSIS

### 10.1 Nếu sửa: **ActionButton**

```
ActionButton (Layer 1)
├── Modal affected: 8 modals
│   ├── PaymentModal (nút Xác nhận, Hủy)
│   ├── PromotionModal (nút Xác nhận)
│   ├── DisposalDetailModal (nút Sửa, Xóa)
│   ├── PayDebtModal (nút Thanh toán, Hủy)
│   ├── ProductEditModal (nút Lưu, Hủy)
│   ├── TaxCalculationModal (nút Tính, Đóng)
│   ├── BatchSelectionModal (nút Chọn, Hủy)
│   └── ImportPreviewModal (nút Xác nhận, Hủy)
├── Form Layout affected: 3
│   ├── DisposalFormLayout
│   ├── ImportFormLayout
│   └── CountFormLayout
├── Pages affected: 5+
│   ├── Inventory
│   ├── Disposals
│   ├── Orders
│   ├── Customers
│   └── Suppliers
└── Total: 16+ components affected
```

### 10.2 Nếu sửa: **SectionBox / ModalSection**

```
SectionBox / ModalSection (Layer 2)
├── Modal affected: 6 modals
│   ├── DisposalDetailModal
│   ├── PayDebtModal
│   ├── ProductEditModal
│   ├── TaxCalculationModal
│   ├── ImportPreviewModal
│   └── BatchSelectionModal
├── Form Layout affected: 3
│   ├── DisposalFormLayout (section inline CSS)
│   ├── ImportFormLayout (section inline CSS)
│   └── CountFormLayout (ModalSection từ MasterModal)
├── CountSidebar affected: 2
│   ├── CountInfoSection (ModalSection)
│   └── CountSummary (ModalSection)
└── Total: 11+ components affected
```

### 10.3 Nếu sửa: **MasterModal**

```
MasterModal (Layer 2)
├── Modal affected: 8 modals
│   ├── PaymentModal (cần refactor để dùng)
│   ├── PromotionModal (cần refactor để dùng)
│   ├── DisposalDetailModal (đang dùng pattern tương tự)
│   ├── PayDebtModal
│   ├── ProductEditModal
│   ├── TaxCalculationModal
│   ├── BatchSelectionModal
│   └── ImportPreviewModal
├── Pages affected: 2 (Direct import)
│   ├── Inventory (import MasterModal)
│   └── Disposals (import StatusBadge từ MasterModal)
├── Form Layout affected: 1
│   └── CountFormLayout (import ModalSection)
└── Total: 11+ components affected
```

### 10.4 Nếu sửa: **Input / TextInput / SelectInput**

```
Input / FormField (Layer 1)
├── Modal affected: 5 modals
│   ├── PaymentModal (số tiền)
│   ├── PayDebtModal (số tiền)
│   ├── ProductEditModal (nhiều field)
│   ├── TaxCalculationModal (số tiền)
│   └── ImportPreviewModal (số lượng)
├── Form Layout affected: 3
│   ├── DisposalFormLayout (số lượng, giá)
│   ├── ImportFormLayout (số lượng, giá, hạn)
│   └── CountFormLayout (số lượng kiểm)
├── Search Components affected: 2
│   ├── ProductSearch
│   └── AdvancedFilterPanel
└── Total: 10+ components affected
```

### 10.5 Nếu sửa: **Design Tokens**

```
Design Tokens (Layer 0)
├── Effect: TOÀN BỘ HỆ THỐNG UI
├── Modal: 8
├── Form Layout: 3
├── Pages: 10+
├── Shared Components: 10+
└── Total: 30+ components (include cả inline styles, Tailwind classes)
```

### 10.6 Nếu sửa: **DataGrid / Table Pattern**

```
DataGrid / Table (Layer 2)
├── Pages affected: 6+
│   ├── Inventory
│   ├── Disposals
│   ├── Orders
│   ├── Customers
│   ├── Suppliers
│   └── ReturnOrders
├── In-Modal Tables: 3+
│   ├── DisposalItemsTable
│   ├── ImportItemsTable
│   └── CountItemsTable
└── Total: 9+ components affected
```

### 10.7 Nếu sửa: **State Components**

```
State Components (Layer 1)
├── LoadingState: 10+ components
├── EmptyState: 10+ components
├── ErrorState: 8+ components
└── Total: 10+ components affected
```

---

## SECTION 11 — SAFE REFACTOR ORDER

### Đề xuất thứ tự refactor (Bottom-up, từ nền tảng lên nghiệp vụ)

```
STEP 1  ─ Design Tokens
        ├── design-system-tokens.css
        ├── Tạo đầy đủ CSS variables cho colors, spacing, radius, shadow
        └── Kiểm tra keyframes mmFadeUp đã có

        ↓

STEP 2  ─ Primitives — ActionButton
        ├── PrimaryButton, SecondaryButton, DangerButton, GhostButton
        ├── Không ảnh hưởng gì đến các component khác khi xây mới
        └── Có thể build song song với các STEP khác
        
        ↓

STEP 3  ─ Primitives — Input
        ├── FormField, TextInput, SelectInput
        ├── Build mới → không ảnh hưởng code hiện tại
        └── Có thể build song song

        ↓

STEP 4  ─ Primitives — State Components
        ├── LoadingState, EmptyState, ErrorState
        ├── Build mới → không ảnh hưởng code hiện tại
        └── Phụ thuộc ActionButton (ErrorState dùng PrimaryButton)

        ↓

STEP 5  ─ Container — SectionBox
        ├── SectionBox, SectionHeader, SectionContent
        ├── Build mới → cần test kỹ trước khi thay thế section inline CSS
        └── Thay thế dần: CountFormLayout → DisposalFormLayout → ImportFormLayout

        ↓

STEP 6  ─ Container — MasterModal
        ├── MasterModal + tất cả sub-components
        ├── Xác nhận file đã đúng spec (đã tồn tại, cần verify)
        └── Kiểm tra: StatusBadge, ModalButton, ModalSection đã đúng chưa

        ↓

STEP 7  ─ Modal Refactor — PaymentModal + PromotionModal
        ├── Thay thế backdrop/motion.div bằng MasterModal
        ├── Thay thế button bằng ActionButton
        ├── Thay thế input bằng TextInput (PaymentModal)
        └── Thêm Error/Empty State (PromotionModal)

        ↓

STEP 8  ─ Modal Refactor — CRUD Modals
        ├── DisposalDetailModal (dùng MasterModal)
        ├── PayDebtModal (dùng MasterModal)
        ├── ProductEditModal (dùng MasterModal)
        └── TaxCalculationModal (dùng MasterModal)

        ↓

STEP 9  ─ Form Layout Refactor — DisposalFormLayout
        ├── Thay thế section inline CSS bằng SectionBox
        ├── Thay thế button bằng ActionButton
        ├── Thay thế input bằng TextInput/SelectInput
        └── Áp dụng State Components

        ↓

STEP 10 ─ Form Layout Refactor — ImportFormLayout
        ├── Tương tự DisposalFormLayout
        ├── Thay section → SectionBox
        ├── Thay button → ActionButton
        └── Thay input → TextInput/SelectInput

        ↓

STEP 11 ─ Form Layout Refactor — CountFormLayout
        ├── Đã dùng một phần MasterModal sub-components (ModalSection, ModalInfoGrid, StatusBadge, SummaryRow)
        ├── Verify và hoàn thiện
        └── Thay input → TextInput

        ↓

STEP 12 ─ DataGrid / Table Standardization
        ├── Xây DataGrid chuẩn với toolbar, pagination, state
        ├── Áp dụng cho tất cả pages
        └── Thay thế dần các table hiện tại

        ↓

STEP 13 ─ Legacy Cleanup — ui.tsx
        ├── Map component cũ → component mới
        ├── Deprecate dần các component cũ
        └── Feature flag để rollback nếu cần

        ↓

STEP 14 ─ Design Token Hardcode Removal
        ├── Soát toàn bộ source code, thay hardcode → CSS variables
        └── Kiểm tra Tailwind classes có thể map sang design tokens
```

---

## SECTION 12 — HIGH RISK COMPONENTS

### 12.1 ActionButton

| Thuộc tính | Giá trị |
|------------|---------|
| **Component** | ActionButton (PrimaryButton, SecondaryButton, DangerButton, GhostButton) |
| **Impact** | 17+ components |
| **Reason** | Được dùng ở mọi modal, form layout, page. Thay đổi style sẽ ảnh hưởng toàn bộ UI |
| **Mitigation** | Build ActionButton mới song song, không sửa code hiện tại. Sau đó replace dần |
| **Rollback Strategy** | Feature flag: `useNewActionButton`. Old code giữ nguyên trong ui.tsx |

### 12.2 MasterModal

| Thuộc tính | Giá trị |
|------------|---------|
| **Component** | MasterModal |
| **Impact** | 15+ components |
| **Reason** | Là container trung tâm của modal system. Thay đổi API props ảnh hưởng nhiều modal |
| **Mitigation** | MasterModal hiện tại đã có sẵn — chỉ verify và bổ sung nếu thiếu. Không thay đổi interface |
| **Rollback Strategy** | Versioning interface: nếu cần thay đổi, tạo `MasterModalV2` giữ lại `MasterModal` cũ |

### 12.3 SectionBox / ModalSection

| Thuộc tính | Giá trị |
|------------|---------|
| **Component** | SectionBox (SectionBox, SectionHeader, SectionContent) / ModalSection (từ MasterModal) |
| **Impact** | 11+ components |
| **Reason** | Nhiều form layout đang dùng section inline CSS — thay thế đồng loạt dễ gây lỗi layout |
| **Mitigation** | Migration theo batch: CountFormLayout → DisposalFormLayout → ImportFormLayout |
| **Rollback Strategy** | Giữ nguyên section inline CSS cho đến khi SectionBox verified stable |

### 12.4 Input / FormField

| Thuộc tính | Giá trị |
|------------|---------|
| **Component** | TextInput, SelectInput, FormField |
| **Impact** | 10+ components |
| **Reason** | Form controls ảnh hưởng đến validation, data binding, UX |
| **Mitigation** | Build wrapper pattern: Input mới bọc input hiện tại, không thay đổi behavior |
| **Rollback Strategy** | Giữ nguyên input cũ, chỉ replace khi new input đã pass tất cả test case |

### 12.5 DataGrid

| Thuộc tính | Giá trị |
|------------|---------|
| **Component** | DataGrid (Table pattern) |
| **Impact** | 6+ pages |
| **Reason** | Table là xương sống của pages — sai sót ảnh hưởng toàn bộ chức năng |
| **Mitigation** | DataGrid mới build song song. Migration page-by-page, mỗi page một batch |
| **Rollback Strategy** | Feature flag `useNewDataGrid` — page cũ giữ nguyên cấu trúc table hiện tại |

### 12.6 State Components

| Thuộc tính | Giá trị |
|------------|---------|
| **Component** | LoadingState, EmptyState, ErrorState |
| **Impact** | 10+ components |
| **Reason** | State components ảnh hưởng đến user experience khi có lỗi hoặc loading |
| **Mitigation** | Build mới song song. Apply dần qua từng component |
| **Rollback Strategy** | Giữ Loading/Empty/Error pattern cũ cho đến khi component mới stable |

---

## SECTION 13 — CIRCULAR DEPENDENCY CHECK

### 13.1 Import Analysis

```
Hiện tại — KHÔNG phát hiện circular import trong UI layer:

MasterModal.tsx
  ├── imports React only
  ├── imports lucide-react only
  └── exports 7 sub-components — không import từ file khác

ui.tsx
  ├── imports React only
  ├── imports lucide-react only
  └── exports primitives — không import từ file khác

Các component khác:
  ├── Import từ MasterModal → KHÔNG import ngược lại
  ├── Import từ ui.tsx → KHÔNG import ngược lại
  └── Import từ pages → KHÔNG import ngược lại
```

### 13.2 Circular UI Dependencies

**Kết quả: 🟢 KHÔNG PHÁT HIỆN**

Tất cả dependencies đều là **one-way** (uni-directional):

- `Layer 0 → Layer 1 → Layer 2 → Layer 3 → Layer 4 → Layer 5`
- Layer dưới KHÔNG bao giờ import layer trên

### 13.3 Potential Refactor Problems

| Vấn đề | Mô tả | Giải pháp |
|--------|-------|-----------|
| **Phụ thuộc ngược tiềm năng** | Khi refactor, có thể vô tình tạo circular import nếu MasterModal import modal nghiệp vụ | Strict rule: MasterModal KHÔNG được import bất kỳ business component nào |
| **Shared type dependency** | `types.ts` được import bởi mọi component — nếu `MasterModal.tsx` bắt đầu import types từ business domain → circular risk | Giữ MasterModal chỉ dùng prop interface tự định nghĩa, không import từ business types |
| **SectionBox vs ModalSection** | ModalSection trong MasterModal và SectionBox sẽ là 2 component tương tự nhau | Quyết định: SectionBox là standalone, ModalSection là alias. KHÔNG để SectionBox import MasterModal |

---

## SECTION 14 — FINAL RECOMMENDATIONS

### 14.1 Component nào phải xây trước

| # | Component | Lý do |
|---|-----------|-------|
| 1 | **Design Tokens** (CSS variables) | Tất cả component đều phụ thuộc — phải có tokens trước khi xây bất kỳ component nào |
| 2 | **ActionButton** | Component được dùng nhiều nhất (17+ usages) — xây xong để các modal dùng ngay |
| 3 | **TextInput / SelectInput / FormField** | Form controls cơ bản — tất cả form layout cần |
| 4 | **State Components** (LoadingState, EmptyState, ErrorState) | Mọi data display component đều cần |
| 5 | **SectionBox** | Cần để replace section inline CSS |
| 6 | **MasterModal** (verify) | File đã tồn tại — cần verify đúng spec trước khi dùng |

### 14.2 Component nào KHÔNG được sửa trực tiếp

| # | Component | Lý do | Thay vào đó |
|---|-----------|-------|-------------|
| 1 | **PaymentModal** | Đang hoạt động — sửa trực tiếp có thể làm hỏng POS checkout | Build wrapper → refactor sau. Dùng feature flag |
| 2 | **PromotionModal** | Ảnh hưởng đến quy trình bán hàng | Tương tự PaymentModal |
| 3 | **DisposalFormLayout** | Form phức tạp với nhiều business logic | Refactor từng phần: button → input → section |
| 4 | **ImportFormLayout** | Import hàng là critical path | Tương tự DisposalFormLayout |
| 5 | **DataGrid pages** (Inventory, Disposals, Orders) | Toàn bộ danh sách dữ liệu | Migration page-by-page |

### 14.3 Component nào cần Feature Flag

| # | Component | Feature Flag | Scope |
|---|-----------|-------------|-------|
| 1 | **ActionButton** | `useNewActionButton` | Tất cả modal và form layout |
| 2 | **DataGrid** | `useNewDataGrid` | Từng page riêng lẻ |
| 3 | **MasterModal** (nếu thay đổi interface) | `useMasterModalV2` | Tất cả modal |
| 4 | **PaymentModal** | `useRefactoredPaymentModal` | POS checkout |
| 5 | **PromotionModal** | `useRefactoredPromotionModal` | POS checkout |
| 6 | **State Components** | `useNewStateComponents` | DataGrid, Modal tables |

### 14.4 Component nào cần Migration theo Batch

| # | Batch | Components | Lý do |
|---|-------|-----------|-------|
| 1 | **Batch A: POS Modals** | PaymentModal, PromotionModal | Cùng module, critical path, cần refactor đồng bộ |
| 2 | **Batch B: Disposal Module** | DisposalFormLayout, DisposalDetailModal, DisposalItemsTable | Cùng feature — sửa cùng lúc để đảm bảo consistency |
| 3 | **Batch C: Import Module** | ImportFormLayout, ImportItemsTable, LotExpiryPopover | Tương tự Batch B |
| 4 | **Batch D: Inventory Count** | CountFormLayout, CountItemsTable, CountSidebar components | Đã dùng một phần MasterModal — dễ migrate nhất |
| 5 | **Batch E: CRUD Modals** | PayDebtModal, ProductEditModal, TaxCalculationModal | Các modal độc lập — có thể migrate từng cái |
| 6 | **Batch F: Pages** | Inventory, Disposals, Orders, Customers, Suppliers, ReturnOrders | Migration DataGrid từng page |

### 14.5 Component nào có thể Refactor NGAY

| # | Component | Lý do | Mức độ an toàn |
|---|-----------|-------|-----------------|
| 1 | **CountFormLayout** | Đã import ModalSection, ModalInfoGrid, StatusBadge, SummaryRow từ MasterModal — migration gần như hoàn tất | 🟢 AN TOÀN |
| 2 | **CountInfoSection** | Đã import sub-components từ MasterModal | 🟢 AN TOÀN |
| 3 | **CountSummary** | Đã import sub-components từ MasterModal | 🟢 AN TOÀN |
| 4 | **ActionButton mới** | Xây mới song song — không ảnh hưởng code hiện tại | 🟢 AN TOÀN |
| 5 | **TextInput / SelectInput mới** | Xây mới song song | 🟢 AN TOÀN |
| 6 | **State Components mới** | Xây mới song song | 🟢 AN TOÀN |
| 7 | **SectionBox mới** | Xây mới song song | 🟢 AN TOÀN |
| 8 | **Design Tokens** | Thêm CSS variables — không xóa cái cũ | 🟢 AN TOÀN |

### 14.6 Tổng kết chiến lược Migration

```
PHASE 1 — Foundation (AN TOÀN, song song)
├── Design Tokens (bổ sung CSS variables)
├── ActionButton (xây mới)
├── TextInput / SelectInput (xây mới)
├── State Components (xây mới)
├── SectionBox (xây mới)
└── MasterModal (verify và bổ sung nếu thiếu)

PHASE 2 — Critical Path (Batch A: POS)
├── Refactor PaymentModal → MasterModal + ActionButton + TextInput + State
├── Refactor PromotionModal → MasterModal + ActionButton + State
└── Test kỹ toàn bộ POS checkout flow

PHASE 3 — Feature Module (Batch B, C, D)
├── Disposal Module (Form + Detail + Table)
├── Import Module (Form + Table + Sidebar)
└── Inventory Count Module (Form + Table + Sidebar)

PHASE 4 — CRUD Modals (Batch E)
├── PayDebtModal
├── ProductEditModal
└── TaxCalculationModal

PHASE 5 — Pages (Batch F)
├── DataGrid standardization
├── Từng page migrate sang DataGrid mới
└── Remove legacy ui.tsx dependencies

PHASE 6 — Cleanup
├── Deprecate ui.tsx components cũ
├── Remove hardcode colors/styles
└── Full audit: tất cả component đã dùng design tokens chưa
```

---

> **Kết luận:** Hệ thống UI hiện tại có cấu trúc tương đối rõ ràng, không có circular dependency, và có thể migration an toàn theo thứ tự bottom-up từ Layer 0 (Design Tokens) lên Layer 5 (Pages). Các component có risk cao nhất là ActionButton (17+ usages) và MasterModal (8+ modals). Nên build các Foundation Component mới song song trước khi thay thế dần dần.