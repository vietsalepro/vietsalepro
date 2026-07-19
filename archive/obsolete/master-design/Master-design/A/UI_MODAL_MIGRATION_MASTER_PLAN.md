# 🎯 UI MODAL MIGRATION — MASTER PLAN

## Phiên bản: V1.0 | Ngày: 2026-06-24
## Hệ thống: VietSale POS v7 — Modal Design System Migration

---

# PHẦN 1: DESIGN SYSTEM MASTER — SINGLE SOURCE OF TRUTH

## 1.1 MODAL BLUEPRINT (MASTER_MODAL_BLUEPRINT_V1)

```
┌─────────────────────────────────────────────────────┐
│  MODAL CONTAINER (z-index: 1010)                     │
│  ┌─────────────────────────────────────────────────┐ │
│  │  MODAL HEADER (white bg, 88px)                  │ │
│  │  ┌──────────────────────────────────────────┐   │ │
│  │  │  Icon (40x40)    Title (28px/700)    ✕  │   │ │
│  │  │                  Description (14px/400)   │   │ │
│  │  └──────────────────────────────────────────┘   │ │
│  ├─────────────────────────────────────────────────┤ │
│  │  MODAL BODY (padding 24-32px, scrollable)       │ │
│  │  ┌──────────────────────────────────────────┐   │ │
│  │  │  SECTION BOX (radius 20px, border, shadow)│   │ │
│  │  │  ┌─ SectionHeader ─────────────────────┐  │   │ │
│  │  │  │  Title (18px/600)    Action button  │  │   │ │
│  │  │  └─────────────────────────────────────┘  │   │ │
│  │  │  ┌─ SectionContent ────────────────────┐  │   │ │
│  │  │  │  [Form fields / Data grid / Content]│  │   │ │
│  │  │  └─────────────────────────────────────┘  │   │ │
│  │  └──────────────────────────────────────────┘   │ │
│  ├─────────────────────────────────────────────────┤ │
│  │  MODAL FOOTER (white bg, 72px)                  │ │
│  │  ┌──────────────────────────────────────────┐   │ │
│  │  │   [Secondary] [Ghost]    [Primary] [Danger] │ │
│  │  └──────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────┘ │
│  OVERLAY (rgba(15,23,42,0.45), backdrop-blur, z:1000)│
└─────────────────────────────────────────────────────┘
```

### Modal Size Specifications
| Size | Width | Max Height | Radius | Use Case |
|------|-------|-----------|--------|----------|
| **Small (sm)** | 640px | auto | 24px | Quick forms, confirmations |
| **Medium (md)** | 960px | auto | 24px | Standard CRUD, payments |
| **Large (lg)** | 1400px | 90vh | 24px | Data grids, complex forms |
| **Fullscreen** | 95vw | 95vh | 24px | Heavy data entry, preview |
| **Mobile** | 100vw | 100vh | 0px | Phone screens < 768px |

### Color Tokens
```
--modal-overlay:        rgba(15, 23, 42, 0.45)
--modal-bg:             #FFFFFF
--modal-border:         none
--modal-shadow:         0 20px 60px rgba(15,23,42,0.15)
--modal-radius:         24px
--modal-radius-mobile:  0px

--header-bg:            #FFFFFF
--header-title:         #1E293B (28px, 700)
--header-desc:          #64748B (14px, 400)
--header-divider:       #F1F5F9

--body-padding:         24px (desktop), 32px (tablet), 20px (mobile)
--body-bg:              #FFFFFF

--footer-bg:            #FFFFFF
--footer-height:        72px
--footer-padding:       16px 24px
--footer-gap:           12px
```

---

## 1.2 ACTION BUTTON STANDARD (MASTER_ACTION_BUTTON_STANDARD_V1)

```
┌──────────────────────────────────────────────────────────────────┐
│  BUTTON HIERARCHY                                                │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ Secondary  │  │   Ghost    │  │  Primary   │  │   Danger   │ │
│  │ bg: white  │  │ bg: none   │  │ bg: #6C4DFF│  │ bg: #EF4444│ │
│  │ bd: #E2E8F0│  │ tx: #64748B│  │ tx: white  │  │ tx: white  │ │
│  │ tx: #475569│  └────────────┘  └────────────┘  └────────────┘ │
│  └────────────┘                                                  │
│                                                                  │
│  ←─────────── LEFT (low emphasis) ──── RIGHT (high emphasis) →   │
│                                                                  │
│  ALL: height=40px, radius=12px, font=14px/600, gap=12px         │
│  DISABLED: opacity=0.5, cursor=not-allowed                       │
│  LOADING: spinner + disabled, width preserved                    │
└──────────────────────────────────────────────────────────────────┘
```

### Button Variant Specifications
| Variant | Background | Border | Text | Hover | Focus |
|---------|-----------|--------|------|-------|-------|
| **Primary** | #6C4DFF | none | #FFFFFF | #5B3FE0 | ring-2 rgba(108,77,255,0.3) |
| **Secondary** | #FFFFFF | 1px #E2E8F0 | #475569 | bg #F8FAFC | ring-2 #E2E8F0 |
| **Ghost** | transparent | none | #64748B | bg #F8FAFC | ring-2 #F1F5F9 |
| **Danger** | #EF4444 | none | #FFFFFF | #DC2626 | ring-2 rgba(239,68,68,0.3) |

---

## 1.3 SECTION BOX STANDARD (MASTER_SECTION_BOX_STANDARD_V1)

```
┌──────────────────────────────────────────────────────────────┐
│  SECTION BOX                                                  │
│  bg: #FFFFFF                                                  │
│  border: 1px solid #F1F5F9                                    │
│  radius: 20px                                                 │
│  shadow: 0 2px 8px rgba(15,23,42,0.03)                       │
│  padding: 24px                                                │
│                                                               │
│  ┌─ SECTION HEADER ───────────────────────────────────────┐  │
│  │  Title (18px/600, #1E293B)              [Action]       │  │
│  │  Description (13px/400, #64748B)                       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─ SECTION CONTENT ─────────────────────────────────────┐  │
│  │  gap: 24px (vertical)                                 │  │
│  │  width: 100%                                          │  │
│  │  [Form fields / Data / Content area]                  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 1.4 INPUT STANDARD (MASTER_INPUT_STANDARD_V1)

```
┌──────────────────────────────────────────────────────────────┐
│  FORM FIELD                                                   │
│  ┌─ LABEL ────────────────────────────────────────────────┐  │
│  │  Label text (13px/500, #344054)           *required    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─ TEXT INPUT ───────────────────────────────────────────┐  │
│  │  height: 40px                                          │  │
│  │  radius: 10px                                          │  │
│  │  border: 1px solid #E2E8F0                             │  │
│  │  bg: #FFFFFF                                           │  │
│  │  text: 14px/400, #1E293B                               │  │
│  │  placeholder: #94A3B8                                  │  │
│  │  padding: 12px 14px                                    │  │
│  │  focus: ring 2px #6C4DFF/20%, border #6C4DFF           │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─ HELPER / ERROR ───────────────────────────────────────┐  │
│  │  Helper: 12px/400, #94A3B8                             │  │
│  │  Error: 12px/400, #EF4444                              │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 1.5 DATA GRID STANDARD (MASTER_DATA_GRID_STANDARD_V1)

```
┌──────────────────────────────────────────────────────────────┐
│  DATA TABLE (inside SectionBox)                               │
│  ┌─ TABLE HEADER ─────────────────────────────────────────┐  │
│  │  bg: #F8FAFC                                           │  │
│  │  text: 12px/600, #64748B, UPPERCASE                    │  │
│  │  height: 44px                                          │  │
│  │  padding: 12px 16px                                    │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  TABLE ROW                                              │  │
│  │  height: 56px                                          │  │
│  │  border-bottom: 1px solid #F1F5F9                      │  │
│  │  padding: 16px                                         │  │
│  │  text: 14px/500, #1E293B                               │  │
│  │  hover: bg #FAFBFC                                     │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  TABLE FOOTER (pagination)                              │  │
│  │  bg: #FFFFFF                                           │  │
│  │  height: 56px                                          │  │
│  │  gap: 8px                                              │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 1.6 STATE STANDARD (MASTER_STATE_STANDARD_V1)

| State | Component | Visual |
|-------|-----------|--------|
| **Loading** | LoadingState | Skeleton: pulse animation, 3 rows (header, text x2) |
| **Empty** | EmptyState | Icon (64x64, #CBD5E1) + Title (16px/600) + Desc (14px/400) + Action button |
| **Error** | ErrorState | Alert icon (48x48, #EF4444) + Message (14px/500) + Retry button |

---

## 1.7 TYPOGRAPHY TOKENS (MASTER_TYPOGRAPHY_V1)

| Element | Size | Weight | Line Height | Color |
|---------|------|--------|-------------|-------|
| Modal Title | 28px | 700 (Bold) | 36px | #1E293B |
| Section Title | 18px | 600 (Semibold) | 28px | #1E293B |
| Body Text | 14px | 400 (Regular) | 20px | #475569 |
| Label Text | 13px | 500 (Medium) | 18px | #344054 |
| Helper Text | 12px | 400 (Regular) | 16px | #94A3B8 |
| Button Text | 14px | 600 (Semibold) | 20px | variant |
| Table Header | 12px | 600 (Semibold) | 16px | #64748B |
| Description | 14px | 400 (Regular) | 20px | #64748B |

---

## 1.8 ELEVATION & Z-INDEX STANDARD (MASTER_ELEVATION_ZINDEX_STANDARD_V1)

| Layer | Z-Index | Shadow |
|-------|---------|--------|
| Overlay | 1000 | — |
| Modal Container | 1010 | 0 20px 60px rgba(15,23,42,0.15) |
| Modal Header | 1020 | elevated |
| Section Box | base | 0 2px 8px rgba(15,23,42,0.03) |
| Dropdown (inside modal) | 1050 | 0 10px 30px rgba(15,23,42,0.12) |

---

## 1.9 MOTION & ANIMATION STANDARD (MASTER_MOTION_ANIMATION_STANDARD_V1)

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Modal Enter | opacity 0→1 + scale 0.92→1 | 200ms | ease-out |
| Modal Exit | opacity 1→0 + scale 1→0.92 | 150ms | ease-in |
| Overlay Enter | opacity 0→1 | 200ms | ease-out |
| Overlay Exit | opacity 1→0 | 150ms | ease-in |
| Content stagger | children stagger 50ms | — | — |
| Button hover | bg-color, shadow | 150ms | ease |
| Button active | scale 0.97 | 100ms | ease |

---

# PHẦN 2: AUDIT & GAP ANALYSIS

## 2.1 Tổng quan

| Metric | Count |
|--------|-------|
| Tổng số modal | **28** |
| Modal component riêng | 14 |
| Modal inline (JSX trực tiếp) | 10 |
| Sub-components đã redesign | 3 |
| MasterModal page usage | 2 |
| Files bị ảnh hưởng | ~25 |

## 2.2 List đầy đủ 28 modals

### Desktop POS Modals (6)
| # | Modal | File | Current Size | Target Size | Risk |
|---|-------|------|-------------|-------------|------|
| 1 | PaymentModal | components/desktop-pos/modals/PaymentModal.tsx | max-w-sm (384px) | Medium (960px) | 🟠 |
| 2 | PromotionModal | components/desktop-pos/modals/PromotionModal.tsx | max-w-lg (512px) | Large (1400px) | 🟢 |
| 3 | QuickAddCustomerModal | components/desktop-pos/modals/QuickAddCustomerModal.tsx | max-w-sm (384px) | Small (640px) | 🟢 |
| 4 | RewardModal | components/desktop-pos/modals/RewardModal.tsx | Chưa xác định | Medium (960px) | 🟢 |
| 5 | CustomerOrdersModal | components/desktop-pos/modals/CustomerOrdersModal.tsx | Chưa xác định | Large (1400px) | 🟠 |
| 6 | AdvancedCustomerSearch | components/desktop-pos/modals/AdvancedCustomerSearch.tsx | Chưa xác định | Medium (960px) | 🟢 |

### Shared Business Modals (5)
| # | Modal | File | Priority |
|---|-------|------|----------|
| 7 | PayDebtModal | components/PayDebtModal.tsx | 🔴 P0 (shared 4x) |
| 8 | BatchSelectionModal | components/BatchSelectionModal.tsx | 🟡 P2 |
| 9 | ProductEditModal | components/ProductEditModal.tsx | 🟡 P2 |
| 10 | TaxCalculationModal | components/TaxCalculationModal.tsx | 🟡 P2 |
| 11 | FeaturePicker | components/FeaturePicker.tsx | 🟡 P2 |

### Disposal Modals (2)
| # | Modal | File |
|---|-------|------|
| 12 | DisposalDetailModal | components/disposal-form/DisposalDetailModal.tsx |
| 13 | DisposalLotSelector | components/disposal-form/DisposalLotSelector.tsx |

### Import/Orders Modals (1)
| # | Modal | File |
|---|-------|------|
| 14 | ImportPreviewModal | components/orders/ImportPreviewModal.tsx |

### Inventory Count Sub-components (3 - đã redesign partial)
| # | Component | File |
|---|-----------|------|
| 15 | CountInfoSection | components/inventory-count/CountSidebar/CountInfoSection.tsx |
| 16 | CountSummary | components/inventory-count/CountSidebar/CountSummary.tsx |
| 17 | CountFormLayout | components/inventory-count/CountFormLayout.tsx |

### Page-level MasterModal Usage (2)
| # | Usage | File |
|---|-------|------|
| 18 | Orders Page | pages/Orders.tsx |
| 19 | Inventory Page | pages/Inventory.tsx |

### Mobile Inline Modals (10)
| # | Modal | File |
|---|-------|------|
| 20 | CenterModal (Change Confirm) | MobilePOS.tsx |
| 21 | CustomerSearchModal | MobilePOS.tsx |
| 22 | CustomerOrdersModal | MobilePOS.tsx |
| 23 | Reward BottomSheet | MobilePOS.tsx |
| 24 | Promotion BottomSheet | MobilePOS.tsx |
| 25 | Customers Detail Modal | MobileCustomers.tsx |
| 26 | Customers Add Modal | MobileCustomers.tsx |
| 27 | Suppliers Modal | MobileSuppliers.tsx |
| 28 | ProductFormModal | MobileInventory.tsx |
| 29 | Settings Preview Modal | MobileSettings.tsx |

## 2.3 Critical gaps

| # | Gap | Impact | Files Missing |
|---|-----|--------|--------------|
| 1 | MasterModal.tsx không tồn tại | 🔴 All modals cannot inherit design | components/ui/MasterModal.tsx |
| 2 | SectionBox không tồn tại | 🟠 Content không có container chuẩn | components/ui/SectionBox.tsx |
| 3 | ActionButton chưa có | 🔴 Buttons không chuẩn hóa | 4 files trong components/ui/ |
| 4 | Input components chưa có | 🟠 Forms không chuẩn hóa | 3 files trong components/ui/ |
| 5 | State components chưa có | 🟢 Loading/Empty/Error không đồng bộ | 3 files trong components/ui/ |
| 6 | ModalHeader không tồn tại | 🟠 Header không tái sử dụng | components/ui/ModalHeader.tsx |
| 7 | ModalBody không tồn tại | 🟠 Body không tái sử dụng | components/ui/ModalBody.tsx |
| 8 | ModalFooter không tồn tại | 🟠 Footer không tái sử dụng | components/ui/ModalFooter.tsx |

## 2.4 Vi phạm Design System

| Standard | Vi phạm | % |
|----------|---------|---|
| MASTER_MODAL_BLUEPRINT_V1 | 28/28 | 100% |
| MASTER_ACTION_BUTTON_STANDARD_V1 | 28/28 | 100% |
| MASTER_SECTION_BOX_STANDARD_V1 | 25/28 | 89% |
| MASTER_INPUT_STANDARD_V1 | 14/28 | 50% |
| MASTER_STATE_STANDARD_V1 | 14/28 | 50% |
| MASTER_DATA_GRID_STANDARD_V1 | 5/28 | 18% |
| MASTER_TYPOGRAPHY_V1 | 28/28 | 100% |
| MASTER_ELEVATION_ZINDEX_V1 | 14/28 | 50% |
| MASTER_MOTION_ANIMATION_V1 | 14/28 | 50% |

---

# PHẦN 3: MIGRATION ROADMAP

## 3.1 Phases Overview

```
PHASE 0 — FOUNDATION (13 components mới)
  ├── ActionButton: PrimaryButton, SecondaryButton, GhostButton, DangerButton
  ├── Input: FormField, TextInput, Select
  ├── Section: SectionBox, SectionHeader, SectionContent
  └── State: LoadingState, EmptyState, ErrorState

PHASE 1 — CORE FRAMEWORK (5 components mới)
  ├── MasterModal.tsx
  ├── ModalHeader.tsx
  ├── ModalBody.tsx
  └── ModalFooter.tsx

PHASE 2 — DESKTOP POS MODALS (6 files sửa)
  ├── PaymentModal         Day 3 AM
  ├── PromotionModal       Day 3 PM
  ├── QuickAddCustomer     Day 4 AM
  ├── RewardModal          Day 4 AM
  ├── CustomerOrdersModal  Day 4 PM
  └── AdvancedCustomerSrch Day 4 PM

PHASE 3 — SHARED BUSINESS MODALS (4 files sửa)
  ├── PayDebtModal         Day 5 (CRITICAL - shared 4x)
  ├── BatchSelectionModal  Day 5 PM
  ├── ProductEditModal     Day 6 AM
  └── TaxCalculationModal  Day 6 PM

PHASE 4 — PAGE + DISPOSAL (4 files sửa)
  ├── Orders.tsx MasterModal    Day 7
  ├── Inventory.tsx MasterModal Day 7
  ├── DisposalDetailModal       Day 7
  └── DisposalLotSelector       Day 7

PHASE 5 — IMPORT MODALS (1 file sửa)
  └── ImportPreviewModal        Day 8

PHASE 6 — MOBILE (5 files sửa)
  ├── MobilePOS.tsx             Day 9 (5 inline modals)
  ├── MobileCustomers.tsx       Day 10
  ├── MobileSuppliers.tsx       Day 10
  ├── MobileInventory.tsx       Day 10
  └── MobileSettings.tsx        Day 10

PHASE 7 — VERIFICATION & CLEANUP (Days 11-12)
  ├── Test từng modal
  ├── Xóa code cũ
  └── Documentation
```

## 3.2 Timeline

```
Week 1:
  Mon:  Phase 0 — Foundation (13 components)
  Tue:  Phase 1 — Core Framework (5 components)
  Wed:  Phase 2A — PaymentModal + PromotionModal
  Thu:  Phase 2B — QuickAddCustomer + Reward + CustomerOrders + AdvancedSearch
  Fri:  Phase 3A — PayDebtModal + BatchSelectionModal

Week 2:
  Mon:  Phase 3B — ProductEditModal + TaxCalculationModal
  Tue:  Phase 4 — Page + Disposal Modals
  Wed:  Phase 5 — ImportPreviewModal
        Phase 6 — Bắt đầu Mobile
  Thu:  Phase 6 — Mobile (tiếp)
  Fri:  Phase 7 — Verification & Cleanup
```

## 3.3 Risk Assessment Matrix

| Risk | Probability | Impact | Mitigation |
|------|-----------|--------|------------|
| MasterModal bug animation | Medium | High | Test isolated; Animation preset trước khi integrate |
| PaymentModal logic break | Low | High | Chỉ sửa JSX wrapper, không động vào handlers |
| PayDebtModal fail shared | Medium | High | Test trên cả 4 caller sites |
| Mobile POS critical path | Low | Medium | Pha 6 ưu tiên thấp, test kỹ |
| Import paths wrong | Low | Low | Check paths chính xác trước commit |
| CSS/className conflicts | Medium | Medium | Remove old styles, verify no leaks |

## 3.4 Files bị ảnh hưởng (toàn bộ)

### Files MỚI tạo (18 files)
```
components/ui/MasterModal.tsx
components/ui/ModalHeader.tsx
components/ui/ModalBody.tsx
components/ui/ModalFooter.tsx
components/ui/PrimaryButton.tsx
components/ui/SecondaryButton.tsx
components/ui/GhostButton.tsx
components/ui/DangerButton.tsx
components/ui/FormField.tsx
components/ui/TextInput.tsx
components/ui/Select.tsx
components/ui/SectionBox.tsx
components/ui/SectionHeader.tsx
components/ui/SectionContent.tsx
components/ui/LoadingState.tsx
components/ui/EmptyState.tsx
components/ui/ErrorState.tsx
```

### Files SỬA (20 files)
```
components/desktop-pos/modals/PaymentModal.tsx
components/desktop-pos/modals/PromotionModal.tsx
components/desktop-pos/modals/QuickAddCustomerModal.tsx
components/desktop-pos/modals/RewardModal.tsx
components/desktop-pos/modals/CustomerOrdersModal.tsx
components/desktop-pos/modals/AdvancedCustomerSearch.tsx
components/PayDebtModal.tsx
components/BatchSelectionModal.tsx
components/ProductEditModal.tsx
components/TaxCalculationModal.tsx
components/FeaturePicker.tsx
components/disposal-form/DisposalDetailModal.tsx
components/disposal-form/DisposalLotSelector.tsx
components/orders/ImportPreviewModal.tsx
pages/Orders.tsx
pages/Inventory.tsx
components/MobilePOS.tsx
components/MobileCustomers.tsx
components/MobileSuppliers.tsx
components/MobileInventory.tsx
components/MobileSettings.tsx
```

**Tổng: 18 files mới + 20 files sửa = 38 files**

---

# PHẦN 4: IMPLEMENTATION RULES

## 4.1 Khi sửa modal, PHẢI tuân thủ:

1. **KHÔNG** động vào business logic (handlers, hooks, state, API calls, validation, permissions)
2. **CHỈ SỬA** JSX layout, CSS classes, component structure
3. **THAY THẾ** inline overlay + motion.div → `<MasterModal>`
4. **THAY THẾ** gradient header → `<ModalHeader>` (white bg)
5. **THAY THẾ** inline content → `<ModalBody>` + `<SectionBox>`
6. **THAY THẾ** inline buttons → `<ModalFooter>` + ActionButton components
7. **THAY THẾ** inline inputs → `<FormField>` + `<TextInput>`
8. **THÊM** EmptyState / ErrorState / LoadingState khi cần
9. **GIỮ NGUYÊN** tất cả imports hiện tại (trừ thêm imports mới)
10. **GIỮ NGUYÊN** tất cả prop types và interfaces

## 4.2 Không được làm:

```
❌ Sửa logic:         const [state, setState] = ...
❌ Sửa validation:     if (!name) return error
❌ Sửa API:           const { data, error } = await supabase
❌ Sửa permissions:   if (!canEdit) return
❌ Sửa calculations:  const total = items.reduce(...)
❌ Sửa data contracts: interface Payload { ... }
```

## 4.3 Chỉ được làm:

```
✅ Sửa wrapper:       <MasterModal size="md"> ... </MasterModal>
✅ Sửa header:        <ModalHeader title="..." />
✅ Sửa body:          <ModalBody><SectionBox>...</SectionBox></ModalBody>
✅ Sửa buttons:       <PrimaryButton>Xác nhận</PrimaryButton>
✅ Sửa inputs:        <FormField label="Tên"><TextInput /></FormField>
✅ Thêm states:        <EmptyState title="Không có dữ liệu" />
✅ Thêm CSS:           className="vsp-text-sm vsp-font-regular"
✅ Sửa spacing:        className, margin, padding, gap
```

---

# PHẦN 5: VERIFICATION CHECKLIST

Sau mỗi modal migrated, PHẢI verify:

## 5.1 Modal Framework
- [ ] Overlay hoạt động (click outside → đóng)
- [ ] Animation enter/exit mượt (framer-motion)
- [ ] Kích thước đúng (sm=640, md=960, lg=1400px)
- [ ] Responsive mobile (100vw x 100vh, radius 0)
- [ ] Keyboard: ESC đóng, Tab qua các nút
- [ ] Z-index không bị chồng lấn

## 5.2 Header
- [ ] White background (không gradient)
- [ ] Title hiển thị đúng
- [ ] Icon hiển thị (nếu có)
- [ ] Close button hoạt động
- [ ] Description hiển thị (nếu có)

## 5.3 Body + SectionBox
- [ ] SectionBox có border + radius + shadow đúng
- [ ] SectionHeader có title/description
- [ ] Scroll hoạt động khi content quá dài
- [ ] Padding đúng (24px desktop, 20px mobile)

## 5.4 Footer + Action Buttons
- [ ] Button thứ tự đúng (Secondary → Ghost → Primary → Danger)
- [ ] Button height 40px, radius 12px
- [ ] Button disabled hoạt động
- [ ] Button loading hiển thị spinner
- [ ] Button onClick giữ nguyên handler

## 5.5 Business Logic Integrity
- [ ] API calls hoạt động (create, update, delete)
- [ ] Validation hoạt động (required, format, length)
- [ ] Permissions được giữ nguyên
- [ ] State management không bị ảnh hưởng
- [ ] Search/filter vẫn hoạt động
- [ ] Data grid sort/pagination vẫn hoạt động

## 5.6 Typography
- [ ] Title 28px/700, SectionTitle 18px/600
- [ ] Body 14px/400, Label 13px/500
- [ ] Helper 12px/400, Table header 12px/600
- [ ] Colors đúng (#1E293B, #475569, #64748B, #94A3B8)

---

# PHẦN 6: DELIVERABLES

## 6.1 Đã xuất
| # | File | Status |
|---|------|--------|
| 1 | UI_MODAL_AUDIT_REPORT.md | ✅ Hoàn thành |
| 2 | UI_MODAL_MAPPING_REPORT.md | ✅ Hoàn thành |
| 3 | UI_MODAL_MIGRATION_PLAN.md | ✅ Hoàn thành |

## 6.2 Sẽ xuất sau implement
| # | File | Expected |
|---|------|----------|
| 4 | UI_MODAL_VERIFICATION_REPORT.md | Sau mỗi phase |
| 5 | Danh sách file đã thay đổi | Sau implement |
| 6 | Danh sách file bị ảnh hưởng | Sau implement |
| 7 | Danh sách rủi ro còn tồn tại | Cuối cùng |

---

🚀 **SẴN SÀNG CHUYỂN SANG ACT MODE ĐỂ IMPLEMENT**