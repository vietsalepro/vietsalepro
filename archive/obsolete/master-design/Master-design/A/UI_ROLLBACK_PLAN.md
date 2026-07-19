# 🔄 UI ROLLBACK PLAN — VietSale Pro v7

> **Phiên bản:** V1.0
> **Ngày:** 2026-06-24
> **Mục đích:** Kế hoạch rollback duy nhất cho toàn bộ chương trình UI Migration sang Design System mới.
> **Nguồn sự thật duy nhất:** `/Master-design/`
> **Tài liệu tham chiếu:** `UI_DEPENDENCY_GRAPH.md`, `UI_ACCEPTANCE_CRITERIA.md`, `UI_MODAL_MIGRATION_MASTER_PLAN.md`, `UI_COMPONENT_ARCHITECTURE.md`
> **Phạm vi:** Toàn bộ component, modal, batch, feature — không bao gồm backend, database, API.

---

## SECTION 1 — EXECUTIVE SUMMARY

### 1.1 Rollback là gì

Rollback là quá trình **khôi phục UI về trạng thái ổn định trước khi migration** khi phát hiện lỗi nghiêm trọng trong quá trình triển khai Design System mới.

Rollback **không phải** là undo code change trong repository. Rollback là **hoàn tác thay đổi UI ở runtime** — đưa người dùng quay lại giao diện cũ (legacy UI) đang hoạt động ổn định.

### 1.2 Tại sao rollback là bắt buộc

| Lý do | Mô tả |
|-------|-------|
| **UI Migration có rủi ro** | Thay đổi toàn bộ giao diện — bất kỳ component nào cũng có thể gây lỗi gián đoạn nghiệp vụ |
| **Critical path không thể downtime** | POS checkout, nhập hàng, bán hàng, kiểm kê — nếu UI lỗi, doanh thu và vận hành bị ảnh hưởng ngay |
| **Migration theo batch** | Mỗi batch có thể rollout riêng — cần khả năng rollback độc lập từng batch |
| **Không thể predict tất cả lỗi** | Dù đã test kỹ, production luôn có edge case không lường trước (dữ liệu thật, thiết bị thật, network thật) |
| **Business logic không đổi** | UI chỉ thay đổi presentation — rollback chỉ cần khôi phục giao diện, không động đến dữ liệu |

### 1.3 Vai trò của rollback trong UI Migration

```
┌─────────────────────────────────────────────────────────┐
│                    UI MIGRATION                          │
├─────────────┬───────────────────────┬───────────────────┤
│   PHASE 1   │      PHASE 2          │     PHASE N       │
│  Foundation │   Critical Path       │   Pages/Modals    │
│  Components │   (POS Modals)        │                   │
├──────┬──────┴──────┬────────┴───────┴───────────────────┤
│      │             │                                     │
│  ROLLBACK PLAN LÀ LỚP BẢO VỆ CUỐI CÙNG                  │
│  Cho phép migration mạnh dạn vì biết cách phục hồi      │
└──────┴─────────────┴─────────────────────────────────────┘
```

Rollback không phải là thất bại — rollback là **cơ chế an toàn** cho phép migration diễn ra nhanh hơn, mạnh dạn hơn.

---

## SECTION 2 — ROLLBACK OBJECTIVES

### 2.1 Mục tiêu chính

| # | Mục tiêu | Mô tả | Đo lường |
|---|----------|-------|----------|
| 1 | **Khôi phục UI ổn định** | Đưa UI về trạng thái hoạt động đúng trước migration | Tất cả Acceptance Criteria pass |
| 2 | **Không mất dữ liệu** | Rollback chỉ tác động Presentation Layer, không chạm data | 0 data loss incidents |
| 3 | **Không ảnh hưởng API** | API Contract, Request Payload, Response Schema giữ nguyên | 0 API contract changes |
| 4 | **Không ảnh hưởng business logic** | Validation, Workflow, Calculation, Permission giữ nguyên | 0 business logic regressions |
| 5 | **Không ảnh hưởng workflow** | Luồng nghiệp vụ (open → fill → validate → save → close) giữ nguyên | 0 workflow disruptions |
| 6 | **Giảm downtime** | Rollback hoàn tất trong thời gian tối thiểu | < 30 phút cho Level 1-3, < 2 giờ cho Level 4-5 |

### 2.2 Nguyên tắc rollback

```
┌─────────────────────────────────────────────────────────┐
│              NGUYÊN TẮC BẤT DI BẤT DỊCH                 │
│                                                         │
│  1. ROLLBACK ≠ DATA LOSS                                │
│  2. ROLLBACK ≠ API CHANGE                               │
│  3. ROLLBACK ≠ BUSINESS LOGIC CHANGE                    │
│  4. ROLLBACK ≠ CODE REVERT (trong runtime)              │
│  5. ROLLBACK = PRESENTATION LAYER SWITCH                │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Phạm vi rollback

| Được rollback | Không được rollback |
|---------------|---------------------|
| ✅ Component UI (ActionButton, Input, SectionBox...) | ❌ Database schema / data |
| ✅ Modal layout (PaymentModal, PromotionModal...) | ❌ API endpoints / contracts |
| ✅ Page layout (DataGrid, filters, pagination...) | ❌ Business validation rules |
| ✅ Design tokens (colors, spacing, typography...) | ❌ Permission / role logic |
| ✅ Animation / motion | ❌ Calculation formulas |
| ✅ Responsive breakpoints | ❌ Workflow / state machine |

---

## SECTION 3 — ROLLBACK LEVELS

Hệ thống rollback được phân làm **5 Level**, từ nhỏ nhất (component) đến lớn nhất (toàn bộ UI).

```
LEVEL 1: Component Rollback
  Phạm vi: 1 component duy nhất
  Thời gian: < 5 phút
  Ảnh hưởng: Component đó và consumer trực tiếp

LEVEL 2: Modal Rollback
  Phạm vi: 1 modal cụ thể
  Thời gian: < 15 phút
  Ảnh hưởng: Modal đó và page sử dụng modal

LEVEL 3: Batch Rollback
  Phạm vi: 1 batch migration (A/B/C/D/E/F)
  Thời gian: < 30 phút
  Ảnh hưởng: Toàn bộ component/modal trong batch

LEVEL 4: Feature Rollback
  Phạm vi: 1 feature module (POS, Disposal, Import...)
  Thời gian: < 1 giờ
  Ảnh hưởng: Toàn bộ màn hình trong feature

LEVEL 5: Full UI Rollback
  Phạm vi: Toàn bộ UI Design System
  Thời gian: < 2 giờ
  Ảnh hưởng: Toàn bộ người dùng hệ thống
```

### 3.1 Level Selection Matrix

| Tình huống | Level | Lý do |
|------------|-------|-------|
| ActionButton bị lỗi hover state | Level 1 | Chỉ 1 component, dễ fix bằng feature flag |
| PaymentModal không đóng được | Level 2 | Critical path POS, cần rollback ngay modal đó |
| Batch B (CRUD Modals) gây lỗi validation | Level 3 | Nhiều modal cùng lỗi, rollback cả batch |
| Toàn bộ POS module bị lỗi UI | Level 4 | POS là critical path, cần rollback feature |
| Toàn bộ hệ thống hiển thị sai | Level 5 | Design System có vấn đề foundation |

---

## SECTION 4 — COMPONENT ROLLBACK

### 4.1 ActionButton

| Thuộc tính | Giá trị |
|------------|---------|
| **Rollback trigger** | Button variant sai màu, hover/focus/disabled state không đúng, click handler không hoạt động, loading state gây layout shift |
| **Phạm vi ảnh hưởng** | 17+ usages — tất cả modal, form, page có button. ActionButton là component được dùng nhiều nhất |
| **Cách rollback** | Tắt feature flag `useNewActionButton` → runtime fallback về legacy Button (ui.tsx) |
| **Thời gian rollback** | < 3 phút (toggle flag + verify 1 modal) |
| **Verification** | Mở modal bất kỳ → kiểm tra button hiển thị đúng → click thử handler |

### 4.2 Input (TextInput / SelectInput / FormField)

| Thuộc tính | Giá trị |
|------------|---------|
| **Rollback trigger** | Input height sai, border/focus/error state không đúng, validation message không hiển thị, keyboard navigation lỗi |
| **Phạm vi ảnh hưởng** | Tất cả form trong modal, page — tác động đến khả năng nhập liệu |
| **Cách rollback** | Tắt feature flag `useNewFormInputs` → runtime fallback về legacy Input |
| **Thời gian rollback** | < 5 phút |
| **Verification** | Mở form bất kỳ → nhập thử → kiểm tra validation → submit |

### 4.3 SectionBox

| Thuộc tính | Giá trị |
|------------|---------|
| **Rollback trigger** | Border radius sai, padding sai, section header không đúng, nội dung bị overflow |
| **Phạm vi ảnh hưởng** | Tất cả modal dùng SectionBox — CountFormLayout, DisposalFormLayout, ImportFormLayout |
| **Cách rollback** | Tắt feature flag `useNewSectionBox` → runtime fallback về section inline CSS cũ |
| **Thời gian rollback** | < 5 phút |
| **Verification** | Mở modal có section → kiểm tra layout → scroll content |

### 4.4 StatusBadge

| Thuộc tính | Giá trị |
|------------|---------|
| **Rollback trigger** | Màu sắc variant sai (success/warning/danger/info/neutral/purple), text không hiển thị đúng |
| **Phạm vi ảnh hưởng** | DataGrid rows, modal detail, status display ở tất cả page |
| **Cách rollback** | Tắt feature flag `useNewStatusBadge` → runtime fallback về badge cũ |
| **Thời gian rollback** | < 3 phút |
| **Verification** | Mở page có DataGrid → kiểm tra status badge từng dòng |

### 4.5 MasterModal

| Thuộc tính | Giá trị |
|------------|---------|
| **Rollback trigger** | Kích thước modal sai (sm/md/lg), animation lỗi, overlay không đúng, focus trap không hoạt động, ESC không đóng, scroll lock body lỗi |
| **Phạm vi ảnh hưởng** | 8+ modal kế thừa MasterModal — toàn bộ modal trong hệ thống nếu MasterModal là base |
| **Cách rollback** | Tắt feature flag `useMasterModalV2` → runtime fallback về modal implementation cũ |
| **Thời gian rollback** | < 10 phút (ảnh hưởng nhiều modal, cần verify nhiều) |
| **Verification** | Mở từng loại modal (sm/md/lg) → kiểm tra size, animation, overlay, ESC, focus trap |

### 4.6 DataGrid

| Thuộc tính | Giá trị |
|------------|---------|
| **Rollback trigger** | Header style sai, row height sai, sorting không hoạt động, pagination lỗi, selection lỗi, loading/empty/error state không đúng |
| **Phạm vi ảnh hưởng** | Inventory page, Disposals page, Orders page, Customers page, Suppliers page, ReturnOrders page — toàn bộ danh sách dữ liệu |
| **Cách rollback** | Tắt feature flag `useNewDataGrid` theo từng page riêng lẻ |
| **Thời gian rollback** | < 10 phút (từng page) |
| **Verification** | Mở page → kiểm tra sort → filter → pagination → select → load more |

### 4.7 State Components (LoadingState / EmptyState / ErrorState)

| Thuộc tính | Giá trị |
|------------|---------|
| **Rollback trigger** | Skeleton sai kích thước, EmptyState icon/message không đúng, ErrorState retry không hoạt động |
| **Phạm vi ảnh hưởng** | DataGrid, Modal tables, Picker — mọi component có async data |
| **Cách rollback** | Tắt feature flag `useNewStateComponents` → runtime fallback về state rendering cũ |
| **Thời gian rollback** | < 5 phút |
| **Verification** | Trigger loading state → trigger empty state → trigger error state |

---

## SECTION 5 — MODAL ROLLBACK

### 5.1 PaymentModal

| Thuộc tính | Giá trị |
|------------|---------|
| **Rollback trigger** | Không mở được, không chọn được payment method, không tính đúng tiền, không close được, POS checkout flow bị gián đoạn |
| **Mức độ nghiêm trọng** | 🔴 CRITICAL — ảnh hưởng trực tiếp doanh thu |
| **Cách rollback** | Tắt feature flag `useRefactoredPaymentModal` → runtime fallback về PaymentModal legacy |
| **Phạm vi ảnh hưởng** | POS module — MobilePOS, DesktopPOS checkout flow |
| **Thời gian rollback** | < 15 phút |
| **Verification** | Mở POS → thêm sản phẩm → checkout → chọn payment → hoàn tất → kiểm tra hóa đơn |

### 5.2 PromotionModal

| Thuộc tính | Giá trị |
|------------|---------|
| **Rollback trigger** | Không load được danh sách promotion, không áp dụng được promotion, tính discount sai, không hủy được promotion |
| **Mức độ nghiêm trọng** | 🔴 CRITICAL — ảnh hưởng giá bán và doanh thu |
| **Cách rollback** | Tắt feature flag `useRefactoredPromotionModal` → runtime fallback về PromotionModal legacy |
| **Phạm vi ảnh hưởng** | POS module — áp dụng khuyến mãi khi bán hàng |
| **Thời gian rollback** | < 15 phút |
| **Verification** | Mở POS → thêm sản phẩm → áp dụng promotion → kiểm tra discount → hoàn tất |

### 5.3 DebtModal (PayDebtModal)

| Thuộc tính | Giá trị |
|------------|---------|
| **Rollback trigger** | Không hiển thị đúng số nợ, không thanh toán được, tính toán sai số tiền trả |
| **Mức độ nghiêm trọng** | 🟠 HIGH — ảnh hưởng quản lý công nợ |
| **Cách rollback** | Rollback bằng Git — revert commit chứa migration của PayDebtModal. Vì modal này độc lập, không cần feature flag phức tạp |
| **Phạm vi ảnh hưởng** | Module công nợ — Customer detail, POS payment |
| **Thời gian rollback** | < 20 phút |
| **Verification** | Mở modal → nhập số tiền → thanh toán → kiểm tra số dư nợ |

### 5.4 CustomerModal (Customer Picker)

| Thuộc tính | Giá trị |
|------------|---------|
| **Rollback trigger** | Search không hoạt động, không chọn được khách hàng, debt balance hiển thị sai, keyboard navigation lỗi |
| **Mức độ nghiêm trọng** | 🟠 HIGH — ảnh hưởng chọn khách hàng khi bán |
| **Cách rollback** | Tắt feature flag `useNewPicker` cho Customer Picker → fallback về picker cũ |
| **Phạm vi ảnh hưởng** | POS, Sales, Debt modules |
| **Thời gian rollback** | < 10 phút |
| **Verification** | Mở picker → search → select → verify debt → close |

### 5.5 ProductModal (Product Picker)

| Thuộc tính | Giá trị |
|------------|---------|
| **Rollback trigger** | Search không tìm đúng sản phẩm, không hiển thị stock/tồn kho, không load được ảnh, chọn sai sản phẩm |
| **Mức độ nghiêm trọng** | 🔴 CRITICAL — ảnh hưởng trực tiếp đến việc chọn hàng khi bán/nhập |
| **Cách rollback** | Tắt feature flag `useNewPicker` cho Product Picker → fallback về picker cũ |
| **Phạm vi ảnh hưởng** | POS, Import, Disposal, Inventory Count — tất cả module cần chọn sản phẩm |
| **Thời gian rollback** | < 15 phút |
| **Verification** | Mở picker → search by name → search by code → search by barcode → select → verify stock |

### 5.6 TaxCalculationModal

| Thuộc tính | Giá trị |
|------------|---------|
| **Rollback trigger** | Tính thuế sai, không áp dụng được thuế, không hiển thị chi tiết thuế |
| **Mức độ nghiêm trọng** | 🟠 HIGH — ảnh hưởng tính toán hóa đơn |
| **Cách rollback** | Rollback bằng Git — revert commit. Modal độc lập, ít phụ thuộc |
| **Phạm vi ảnh hưởng** | POS, Import |
| **Thời gian rollback** | < 15 phút |
| **Verification** | Mở modal → chọn thuế → kiểm tra số tiền → áp dụng → verify hóa đơn |

---

## SECTION 6 — BATCH ROLLBACK

### 6.1 Batch A — Core Components

| Thuộc tính | Giá trị |
|------------|---------|
| **Components** | ActionButton, TextInput, SelectInput, FormField, SectionBox, Design Tokens, State Components |
| **Rollback trigger** | Nhiều component trong batch cùng lỗi, component foundation sai ảnh hưởng dây chuyền đến tất cả component khác |
| **Rollback scope** | Layer 0 + Layer 1 + Layer 2 — Foundation Layer |
| **Rollback owner** | Technical Lead + Developer |
| **Feature flag** | Tắt đồng loạt: `useNewActionButton`, `useNewFormInputs`, `useNewSectionBox`, `useNewStateComponents` |
| **Thời gian rollback** | < 20 phút |
| **Risk level** | 🟢 THẤP — vì foundation component được xây mới song song, legacy vẫn tồn tại |

### 6.2 Batch B — POS Modals

| Thuộc tính | Giá trị |
|------------|---------|
| **Components** | PaymentModal, PromotionModal |
| **Rollback trigger** | POS checkout flow lỗi, không thanh toán được, promotion không áp dụng, modal không đóng/mở |
| **Rollback scope** | Layer 4 — Business Modal Layer — POS module |
| **Rollback owner** | Technical Lead + QA |
| **Feature flag** | Tắt: `useRefactoredPaymentModal`, `useRefactoredPromotionModal` |
| **Thời gian rollback** | < 30 phút (cần test full POS flow) |
| **Risk level** | 🔴 CAO — POS là critical path, ảnh hưởng doanh thu |

### 6.3 Batch C — Disposal Module

| Thuộc tính | Giá trị |
|------------|---------|
| **Components** | DisposalFormLayout, DisposalDetailModal, DisposalItemsTable |
| **Rollback trigger** | Form không submit được, không thêm/xóa items, tính tổng sai, workflow lỗi |
| **Rollback scope** | Layer 4 — Business Modal Layer — Disposal module |
| **Rollback owner** | Technical Lead + Developer |
| **Feature flag** | `useNewDisposalLayout` |
| **Thời gian rollback** | < 30 phút |
| **Risk level** | 🟡 TRUNG BÌNH — module độc lập, nhưng form phức tạp với nhiều business logic |

### 6.4 Batch D — Import Module

| Thuộc tính | Giá trị |
|------------|---------|
| **Components** | ImportFormLayout, ImportItemsTable, LotExpiryPopover |
| **Rollback trigger** | Form không submit được, không chọn được lot/expiry, tính tổng sai, workflow lỗi |
| **Rollback scope** | Layer 4 — Business Modal Layer — Import module |
| **Rollback owner** | Technical Lead + Developer |
| **Feature flag** | `useNewImportLayout` |
| **Thời gian rollback** | < 30 phút |
| **Risk level** | 🟡 TRUNG BÌNH — module độc lập, nhưng import là critical path cho nhập hàng |

### 6.5 Batch E — Inventory Count Module

| Thuộc tính | Giá trị |
|------------|---------|
| **Components** | CountFormLayout, CountItemsTable, CountSidebar |
| **Rollback trigger** | Form không submit được, items table sai, sidebar không hiển thị đúng thông tin |
| **Rollback scope** | Layer 4 — Business Modal Layer — Inventory Count module |
| **Rollback owner** | Developer + QA |
| **Feature flag** | `useNewCountLayout` |
| **Thời gian rollback** | < 20 phút |
| **Risk level** | 🟢 THẤP — đã dùng MasterModal một phần, migration gần hoàn tất |

### 6.6 Batch F — CRUD Modals

| Thuộc tính | Giá trị |
|------------|---------|
| **Components** | PayDebtModal, ProductEditModal, TaxCalculationModal |
| **Rollback trigger** | Modal không mở/đóng, không lưu được dữ liệu, validation sai |
| **Rollback scope** | Layer 4 — Business Modal Layer — các modal độc lập |
| **Rollback owner** | Developer |
| **Feature flag** | Từng modal riêng lẻ hoặc Git revert |
| **Thời gian rollback** | < 15 phút mỗi modal |
| **Risk level** | 🟢 THẤP — modal độc lập, dễ rollback riêng từng cái |

### 6.7 Batch G — Pages (DataGrid)

| Thuộc tính | Giá trị |
|------------|---------|
| **Components** | Inventory Page, Disposals Page, Orders Page, Customers Page, Suppliers Page, ReturnOrders Page |
| **Rollback trigger** | DataGrid không hiển thị dữ liệu, sort/filter/pagination lỗi, page crash |
| **Rollback scope** | Layer 5 — Page Layer |
| **Rollback owner** | Technical Lead + QA |
| **Feature flag** | `useNewDataGrid` — tắt theo từng page riêng lẻ |
| **Thời gian rollback** | < 20 phút mỗi page |
| **Risk level** | 🟡 TRUNG BÌNH — page độc lập, nhưng DataGrid được dùng chung |

---

## SECTION 7 — FEATURE FLAG STRATEGY

### 7.1 Danh sách Feature Flag

| Flag | Component/Batch | Default | Cách toggle | Rollback type |
|------|----------------|---------|-------------|---------------|
| `useNewActionButton` | ActionButton | OFF (cho đến khi release) | Environment variable / Config file | Instant |
| `useNewFormInputs` | TextInput, SelectInput, FormField | OFF | Environment variable / Config file | Instant |
| `useNewSectionBox` | SectionBox | OFF | Environment variable / Config file | Instant |
| `useNewStatusBadge` | StatusBadge | OFF | Environment variable / Config file | Instant |
| `useNewStateComponents` | LoadingState, EmptyState, ErrorState | OFF | Environment variable / Config file | Instant |
| `useMasterModalV2` | MasterModal (nếu thay đổi interface) | OFF | Environment variable / Config file | Instant |
| `useNewDataGrid` | DataGrid | OFF | Per-page config | Instant |
| `useRefactoredPaymentModal` | PaymentModal | OFF | Environment variable / Config file | Instant |
| `useRefactoredPromotionModal` | PromotionModal | OFF | Environment variable / Config file | Instant |
| `useNewDisposalLayout` | Disposal Module | OFF | Environment variable / Config file | Instant |
| `useNewImportLayout` | Import Module | OFF | Environment variable / Config file | Instant |
| `useNewCountLayout` | Inventory Count Module | OFF | Environment variable / Config file | Instant |
| `useNewPicker` | Customer Picker, Product Picker, Supplier Picker | OFF | Environment variable / Config file | Instant |
| `useDesignSystemV2` | **Master flag** — tắt tất cả Design System UI | OFF | Environment variable / Config file | Instant |

### 7.2 Cấu trúc Feature Flag

```typescript
// Config file: feature-flags.config.ts
export const FEATURE_FLAGS = {
  // Foundation Components
  useNewActionButton: import.meta.env.VITE_USE_NEW_ACTION_BUTTON === 'true',
  useNewFormInputs: import.meta.env.VITE_USE_NEW_FORM_INPUTS === 'true',
  useNewSectionBox: import.meta.env.VITE_USE_NEW_SECTION_BOX === 'true',
  useNewStatusBadge: import.meta.env.VITE_USE_NEW_STATUS_BADGE === 'true',
  useNewStateComponents: import.meta.env.VITE_USE_NEW_STATE_COMPONENTS === 'true',
  useMasterModalV2: import.meta.env.VITE_USE_MASTER_MODAL_V2 === 'true',

  // Data Display
  useNewDataGrid: import.meta.env.VITE_USE_NEW_DATA_GRID === 'true',

  // Business Modals
  useRefactoredPaymentModal: import.meta.env.VITE_USE_REFACTORED_PAYMENT_MODAL === 'true',
  useRefactoredPromotionModal: import.meta.env.VITE_USE_REFACTORED_PROMOTION_MODAL === 'true',
  useNewDisposalLayout: import.meta.env.VITE_USE_NEW_DISPOSAL_LAYOUT === 'true',
  useNewImportLayout: import.meta.env.VITE_USE_NEW_IMPORT_LAYOUT === 'true',
  useNewCountLayout: import.meta.env.VITE_USE_NEW_COUNT_LAYOUT === 'true',
  useNewPicker: import.meta.env.VITE_USE_NEW_PICKER === 'true',

  // Master Switch
  useDesignSystemV2: import.meta.env.VITE_USE_DESIGN_SYSTEM_V2 === 'true',
};
```

### 7.3 Cách bật/tắt

**Bật feature flag (roll forward):**
```
# .env.production
VITE_USE_DESIGN_SYSTEM_V2=true
VITE_USE_NEW_ACTION_BUTTON=true
VITE_USE_REFACTORED_PAYMENT_MODAL=true
```

**Tắt feature flag (rollback):**
```
# .env.production — revert về legacy
VITE_USE_DESIGN_SYSTEM_V2=false
# Hoặc tắt từng flag riêng lẻ
VITE_USE_NEW_ACTION_BUTTON=false
VITE_USE_REFACTORED_PAYMENT_MODAL=false
```

### 7.4 Rollback bằng Feature Flag

```
PHÁT HIỆN LỖI
     │
     ▼
XÁC ĐỊNH COMPONENT/MODAL LỖI
     │
     ▼
SET FEATURE FLAG = FALSE (chỉ cần set biến môi trường)
     │
     ▼
BUILD LẠI APPLICATION
     │
     ▼
DEPLOY BUILD MỚI (chỉ thay đổi flag, không thay đổi code)
     │
     ▼
VERIFY LỖI ĐÃ ĐƯỢC KHẮC PHỤC
```

**Ưu điểm:** Không cần revert code, không cần git operation trong lúc production đang chạy.
**Nhược điểm:** Cần build lại application. Giải pháp: sử dụng runtime config (API endpoint trả về flag) để tránh rebuild.

---

## SECTION 8 — SAFE DEPLOYMENT STRATEGY

### 8.1 Deployment Pipeline

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────────┐
│ INTERNAL │ →  │  PILOT   │ →  │  CANARY  │ →  │  STAGED   │ →  │  PRODUCTION  │
│ TESTING  │    │  USERS   │    │  RELEASE │    │  ROLLOUT  │    │  FULL        │
└──────────┘    └──────────┘    └──────────┘    └───────────┘    └──────────────┘
   1-2 days       1-2 days        2-3 days         3-5 days           Go Live
```

### 8.2 Internal Testing

| Hoạt động | Mô tả | Thời gian |
|-----------|-------|-----------|
| **Dev tự kiểm tra** | Developer kiểm tra component/modal theo Acceptance Criteria | 1 ngày |
| **QA test** | QA test toàn bộ flow, edge cases | 1-2 ngày |
| **Smoke test** | Kiểm tra tất cả page/flow không bị crash | 0.5 ngày |
| **Rollback test** | Test quy trình rollback — đảm bảo feature flag hoạt động đúng | 0.5 ngày |

**Rollback trigger tại giai đoạn này:** ❌ FAIL → **KHÔNG release.** Fix lỗi trước.

### 8.3 Pilot Users

| Hoạt động | Mô tả | Thời gian |
|-----------|-------|-----------|
| **Chọn pilot** | 2-3 người dùng nội bộ / khách hàng thân thiết | - |
| **Bật feature flag** | Chỉ cho pilot user: flag = true | 1-2 ngày |
| **Monitor** | Theo dõi log, error, feedback | Liên tục |
| **Thu thập bug** | Pilot user báo cáo lỗi | 1-2 ngày |

**Rollback trigger tại giai đoạn này:** ⚠️ Bug detected → **Rollback pilot** (tắt flag cho pilot user). Fix bug → thử lại pilot.

### 8.4 Canary Release

| Hoạt động | Mô tả | Thời gian |
|-----------|-------|-----------|
| **Canary %** | 5% → 10% → 25% người dùng | 2-3 ngày |
| **Monitor metrics** | Error rate, response time, user feedback | Liên tục |
| **Auto-rollback** | Nếu error rate > 1% → tự động tắt flag | - |

**Rollback trigger tại giai đoạn này:** 🔴 Error rate > 1% → **Auto rollback.** Fix bug → canary lại.

### 8.5 Staged Rollout

| Hoạt động | Mô tả | Thời gian |
|-----------|-------|-----------|
| **Stage 1** | Module ít rủi ro (CRUD Modals) | 3-5 ngày |
| **Stage 2** | Module trung bình (Disposal, Import, Inventory Count) | 3-5 ngày |
| **Stage 3** | Module rủi ro cao (POS) | 5-7 ngày |
| **Stage 4** | Pages (DataGrid) | 3-5 ngày |

**Rollback trigger tại giai đoạn này:** 🔴 Critical bug → **Rollback stage đó.** Các stage khác vẫn tiếp tục.

### 8.6 Production Full

| Hoạt động | Mô tả |
|-----------|-------|
| **Full rollout** | Tất cả người dùng đều dùng Design System mới |
| **Monitoring** | Tiếp tục theo dõi trong 7 ngày |
| **Rollback option** | `useDesignSystemV2 = false` — rollback toàn bộ nếu cần |

**Rollback trigger tại giai đoạn này:** 🔴 Blocker hoặc Critical bug → **Full rollback.** Sau đó hotfix và canary lại.

---

## SECTION 9 — ROLLBACK TRIGGERS

### 9.1 Critical UI Bug

| Thuộc tính | Giá trị |
|------------|---------|
| **Mô tả** | UI hiển thị sai nghiêm trọng — modal không đóng/mở, button không click được, form không submit được |
| **Severity** | CRITICAL hoặc BLOCKER |
| **Rollback Required?** | ✅ **YES** — rollback ngay component/modal lỗi |

### 9.2 Workflow Failure

| Thuộc tính | Giá trị |
|------------|---------|
| **Mô tả** | Luồng nghiệp vụ bị gián đoạn do UI lỗi — không checkout được, không nhập hàng được, không kiểm kê được |
| **Severity** | BLOCKER |
| **Rollback Required?** | ✅ **YES** — rollback batch/module chứa workflow lỗi |

### 9.3 Permission Failure

| Thuộc tính | Giá trị |
|------------|---------|
| **Mô tả** | UI không tuân thủ permission — hiển thị nút mà user không có quyền, hoặc ẩn nút mà user có quyền |
| **Severity** | CRITICAL (nếu ẩn nút người dùng cần) hoặc HIGH (nếu hiện nút không được phép) |
| **Rollback Required?** | ✅ **YES** — rollback component/modal liên quan đến permission |

### 9.4 Validation Failure

| Thuộc tính | Giá trị |
|------------|---------|
| **Mô tả** | Validation không hoạt động — required field không báo lỗi, format validation sai, custom validation không chạy |
| **Severity** | CRITICAL |
| **Rollback Required?** | ✅ **YES** — rollback form/modal có validation lỗi |

### 9.5 Data Display Failure

| Thuộc tính | Giá trị |
|------------|---------|
| **Mô tả** | Dữ liệu hiển thị sai — sai số, sai tên, sai trạng thái, mất dữ liệu |
| **Severity** | CRITICAL hoặc BLOCKER |
| **Rollback Required?** | ✅ **YES** — rollback DataGrid hoặc page hiển thị sai |

### 9.6 Performance Regression

| Thuộc tính | Giá trị |
|------------|---------|
| **Mô tả** | UI chậm hơn đáng kể so với legacy — modal mở lâu, form render chậm, DataGrid scroll lag |
| **Severity** | HIGH (nếu > 2x slower) hoặc MEDIUM (nếu < 2x slower) |
| **Rollback Required?** | ⚠️ **CÂN NHẮC** — nếu > 2x slower → rollback. Nếu < 2x slower → optimize trước |

### 9.7 Accessibility Failure

| Thuộc tính | Giá trị |
|------------|---------|
| **Mô tả** | Keyboard navigation không hoạt động, focus trap lỗi, ARIA labels thiếu, screen reader không đọc được |
| **Severity** | HIGH (nếu ảnh hưởng workflow) hoặc MEDIUM (nếu chỉ ảnh hưởng UX) |
| **Rollback Required?** | ⚠️ **CÂN NHẮC** — nếu ảnh hưởng workflow → rollback. Nếu chỉ UX → fix trong sprint tiếp |

### 9.8 Responsive Failure

| Thuộc tính | Giá trị |
|------------|---------|
| **Mô tả** | UI vỡ trên mobile/tablet — modal tràn màn hình, button chồng lên nhau, form không dùng được trên mobile |
| **Severity** | HIGH (nếu mobile là primary device) hoặc MEDIUM (nếu desktop-first) |
| **Rollback Required?** | ⚠️ **CÂN NHẮC** — nếu mobile users bị ảnh hưởng nặng → rollback |

---

## SECTION 10 — SEVERITY MATRIX

### 10.1 Severity Levels

| Severity | Mô tả | Ví dụ | Rollback | Thời gian xử lý |
|----------|-------|-------|----------|-----------------|
| 🔴 **BLOCKER** | Không thể tiếp tục công việc. User không thể hoàn thành tác vụ chính | POS không checkout được, modal không mở được, form không submit được | ✅ **BẮT BUỘC** | Ngay lập tức |
| 🟠 **CRITICAL** | Chức năng chính bị lỗi, nhưng có workaround | Payment sai màu nhưng vẫn click được, validation thiếu message nhưng vẫn chặn được | ✅ **BẮT BUỘC** | Trong vòng 1 giờ |
| 🟡 **HIGH** | Lỗi ảnh hưởng UX nhưng không chặn workflow | Animation không mượt, responsive hơi lệch, color không đúng 100% token | ⚠️ **CÂN NHẮC** | Trong vòng 1 ngày |
| 🟢 **MEDIUM** | Lỗi nhỏ, không ảnh hưởng chức năng | Spacing sai 2px, font weight không đúng, icon hơi lệch | ❌ **KHÔNG** | Trong sprint tiếp |
| ⚪ **LOW** | Lỗi cosmetic, chỉ ảnh hưởng thẩm mỹ | Shadow quá nhạt, border-radius không đúng 1px, màu hover không match 100% | ❌ **KHÔNG** | Backlog |

### 10.2 Decision Matrix

| Tình huống | Severity | Rollback? | Hành động |
|------------|----------|-----------|-----------|
| PaymentModal không mở được | 🔴 BLOCKER | ✅ YES | Rollback ngay PaymentModal |
| PromotionModal không áp dụng được | 🔴 BLOCKER | ✅ YES | Rollback ngay PromotionModal |
| ActionButton hover sai màu | 🟡 HIGH | ⚠️ CÂN NHẮC | Fix trong ngày, không rollback nếu không ảnh hưởng click |
| DataGrid sort không hoạt động | 🟠 CRITICAL | ✅ YES | Rollback DataGrid page đó |
| SectionBox padding sai 4px | 🟢 MEDIUM | ❌ NO | Fix trong sprint tiếp |
| Form validation không báo lỗi required | 🟠 CRITICAL | ✅ YES | Rollback form/modal đó |
| Modal animation không có stagger effect | 🟢 MEDIUM | ❌ NO | Fix sau |
| POS không checkout được do UI lỗi | 🔴 BLOCKER | ✅ YES | Rollback toàn bộ POS module |
| Input focus ring không hiển thị | 🟠 CRITICAL | ✅ YES | Rollback về legacy Input |
| StatusBadge màu success = danger | 🟠 CRITICAL | ✅ YES | Rollback StatusBadge |

### 10.3 Auto-Rollback Thresholds

| Metric | Threshold | Hành động |
|--------|-----------|-----------|
| Error rate | > 1% | Auto-rollback canary |
| Page load time | > 3x so với baseline | Auto-rollback |
| Modal open time | > 1000ms | Cảnh báo + manual rollback |
| API error rate | > 2% (không liên quan đến backend) | Auto-rollback |
| User complaint rate | > 5 reports trong 1 giờ | Manual rollback |

---

## SECTION 11 — DATA SAFETY RULES

### 11.1 Quy tắc bất di bất dịch

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   🚫 UI ROLLBACK KHÔNG ĐƯỢC:                                    │
│                                                                 │
│   ❌ THAY ĐỔI DỮ LIỆU — Không INSERT, UPDATE, DELETE database   │
│   ❌ XÓA DỮ LIỆU — Không cascade delete, không clear table      │
│   ❌ CẬP NHẬT DỮ LIỆU — Không set giá trị mặc định, không sync │
│                                                                 │
│   ✅ UI ROLLBACK CHỈ TÁC ĐỘNG:                                  │
│                                                                 │
│   ✅ PRESENTATION LAYER — Component rendering, CSS, layout       │
│   ✅ FEATURE FLAGS — Bật/tắt flag quyết định UI nào hiển thị    │
│   ✅ RUNTIME CONFIG — Environment variables, config files        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Data Safety Checklist

Trước mỗi rollback, **bắt buộc** kiểm tra:

- [ ] Rollback chỉ toggle feature flag hoặc environment variable? → An toàn
- [ ] Rollback chỉ thay đổi import path (legacy vs new component)? → An toàn
- [ ] Rollback cần deploy lại build? → Kiểm tra build không chạm database
- [ ] Rollback cần revert code commit? → Kiểm tra commit không có migration file
- [ ] Rollback có chạy bất kỳ script nào? → Kiểm tra script không có database operation

### 11.3 Nếu rollback vô tình ảnh hưởng dữ liệu

```
PHÁT HIỆN DATA LOSS/CHANGE
         │
         ▼
DỪNG NGAY ROLLBACK PROCESS
         │
         ▼
XÁC ĐỊNH PHẠM VI ẢNH HƯỞNG (table, rows, columns)
         │
         ▼
KHÔI PHỤC TỪ DATABASE BACKUP GẦN NHẤT
         │
         ▼
INCIDENT REPORT + ROOT CAUSE ANALYSIS
```

---

## SECTION 12 — API SAFETY RULES

### 12.1 Quy tắc bất di bất dịch

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   🚫 ROLLBACK KHÔNG ĐƯỢC:                                       │
│                                                                 │
│   ❌ THAY ĐỔI API CONTRACT — Endpoint, method, headers giữ      │
│   ❌ THAY ĐỔI REQUEST PAYLOAD — Body shape, params giữ nguyên   │
│   ❌ THAY ĐỔI RESPONSE SCHEMA — Response shape, status code giữ │
│                                                                 │
│   ✅ ĐƯỢC PHÉP:                                                 │
│                                                                 │
│   ✅ UI chỉ gọi API như cũ — handler/API call không thay đổi    │
│   ✅ Response chỉ render khác đi — data mapping giống nhau       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 12.2 API Contract Verification

Sau rollback, kiểm tra:

| # | Kiểm tra | PASS/FAIL |
|---|----------|-----------|
| 1 | GET /api/... trả về đúng response shape như trước migration | ☐ |
| 2 | POST /api/... nhận đúng request payload (kiểm tra bằng network tab) | ☐ |
| 3 | PUT /api/... cập nhật đúng resource | ☐ |
| 4 | DELETE /api/... hoạt động đúng | ☐ |
| 5 | Error response status code giống legacy (400, 401, 403, 404, 500) | ☐ |
| 6 | Pagination params (page, limit, offset) giống legacy | ☐ |
| 7 | Filter params (search, status, date range) giống legacy | ☐ |
| 8 | Sort params (sortBy, sortOrder) giống legacy | ☐ |

### 12.3 API Monitoring

- **Pre-rollback:** Ghi lại API calls từ legacy UI (dùng network tab hoặc proxy log)
- **Post-rollback:** So sánh API calls từ new UI — nếu khác → có thể đã thay đổi API contract
- **Continuous monitoring:** Error rate 4xx/5xx từ UI — nếu tăng đột biến → kiểm tra API contract

---

## SECTION 13 — BUSINESS LOGIC SAFETY RULES

### 13.1 Quy tắc bất di bất dịch

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   🚫 ROLLBACK KHÔNG ĐƯỢC:                                       │
│                                                                 │
│   ❌ THAY ĐỔI VALIDATION — required, pattern, custom rules giữ  │
│   ❌ THAY ĐỔI WORKFLOW — state machine, step sequence giữ       │
│   ❌ THAY ĐỔI CALCULATION — công thức tính tiền, thuế, tồn giữ  │
│   ❌ THAY ĐỔI PERMISSION — role checks, canEdit/canDelete giữ   │
│                                                                 │
│   ✅ ĐƯỢC PHÉP:                                                 │
│                                                                 │
│   ✅ UI layout thay đổi — nhưng handler gọi validation giống     │
│   ✅ UI button thay đổi — nhưng onClick gọi workflow giống       │
│   ✅ UI form thay đổi — nhưng submit handler gọi API giống       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 13.2 Business Logic Mapping

Trước khi migration, mapping business logic để biết phần nào KHÔNG được thay đổi:

| Component | Business Logic | Risk nếu thay đổi |
|-----------|---------------|-------------------|
| PaymentModal | Tính tiền, áp dụng promotion, xử lý thanh toán | 🔴 Mất tiền / sai hóa đơn |
| PromotionModal | Áp dụng/remove promotion, tính discount | 🔴 Sai giá bán |
| DisposalFormLayout | Validation số lượng, tính tổng, workflow duyệt | 🟠 Hủy hàng sai |
| ImportFormLayout | Validation lô hạn, tính tổng, workflow nhập | 🟠 Nhập hàng sai |
| ProductEditModal | Validation thông tin sản phẩm | 🟠 Dữ liệu sản phẩm sai |
| DataGrid | Sort, filter, pagination — chỉ gọi API với params | 🟢 Không ảnh hưởng data |

### 13.3 Rollback Verification cho Business Logic

Sau rollback, bắt buộc kiểm tra:

| # | Kiểm tra | Ví dụ | PASS/FAIL |
|---|----------|-------|-----------|
| 1 | Validation vẫn chạy | Required field vẫn báo lỗi | ☐ |
| 2 | Workflow vẫn đúng | Checkout vẫn qua đủ bước | ☐ |
| 3 | Calculation vẫn đúng | Tổng tiền = số lượng * đơn giá | ☐ |
| 4 | Permission vẫn đúng | User không có quyền xóa → không thấy nút Xóa | ☐ |

---

## SECTION 14 — DEPENDENCY ROLLBACK MATRIX

Dựa trên `UI_DEPENDENCY_GRAPH.md` — phân tích tác động khi rollback từng component.

### 14.1 Rollback: MasterModal

```
MASTERMODAL ROLLBACK
         │
         ▼
Layer 4 — ẢNH HƯỞNG TRỰC TIẾP:
├── PaymentModal        (dùng MasterModal layout)     → Rollback PaymentModal
├── PromotionModal       (dùng MasterModal layout)    → Rollback PromotionModal
├── PayDebtModal         (dùng MasterModal layout)    → Rollback PayDebtModal
├── ProductEditModal     (dùng MasterModal layout)    → Rollback ProductEditModal
├── TaxCalculationModal  (dùng MasterModal layout)    → Rollback TaxCalculationModal
├── DisposalFormLayout   (dùng MasterModal layout)    → Rollback DisposalFormLayout
├── ImportFormLayout     (dùng MasterModal layout)    → Rollback ImportFormLayout
└── CountFormLayout      (dùng MasterModal layout)    → Rollback CountFormLayout
         │
         ▼
Layer 5 — ẢNH HƯỞNG GIÁN TIẾP:
├── POS checkout flow    (dùng PaymentModal, PromotionModal)
├── Disposal page        (dùng DisposalFormLayout)
├── Import page          (dùng ImportFormLayout)
└── Inventory Count page (dùng CountFormLayout)
```

**Kết luận:** MasterModal là **singleton dependency** — rollback MasterModal = rollback tất cả modal dùng nó.  
**Khuyến nghị:** Chỉ rollback MasterModal nếu BLOCKER. Nếu chỉ 1 modal lỗi → rollback modal đó riêng.

### 14.2 Rollback: SectionBox

```
SECTIONBOX ROLLBACK
         │
         ▼
Layer 3 — ẢNH HƯỞNG TRỰC TIẾP:
├── CountInfoSection     (dùng SectionBox layout)
├── CountSummary         (dùng SectionBox layout)
├── DisposalFormLayout   (dùng SectionBox làm section container)
├── ImportFormLayout     (dùng SectionBox làm section container)
└── CountFormLayout      (dùng SectionBox làm section container)
         │
         ▼
Layer 4 — ẢNH HƯỞNG GIÁN TIẾP:
├── ModalSection (alias của SectionBox trong MasterModal)
└── Tất cả modal dùng ModalSection
```

**Kết luận:** SectionBox được dùng trong nhiều form layout. Rollback SectionBox ảnh hưởng đến presentation của các section trong modal.

### 14.3 Rollback: ActionButton

```
ACTIONBUTTON ROLLBACK
         │
         ▼
Layer 1 — ẢNH HƯỞNG TRỰC TIẾP (TẤT CẢ MODAL VÀ PAGE):
├── MasterModal             (dùng ActionButton trong footer)
├── PaymentModal            (dùng ActionButton: Pay, Cancel)
├── PromotionModal          (dùng ActionButton: Apply, Remove)
├── PayDebtModal            (dùng ActionButton: Pay, Cancel)
├── ProductEditModal        (dùng ActionButton: Save, Cancel)
├── TaxCalculationModal     (dùng ActionButton: Apply, Cancel)
├── DisposalFormLayout      (dùng ActionButton: Submit, Save Draft)
├── ImportFormLayout        (dùng ActionButton: Submit, Save Draft)
├── CountFormLayout         (dùng ActionButton: Submit, Save Draft)
└── Page action bars        (dùng ActionButton: Create, Export, Print)
```

**Kết luận:** ActionButton là **component được dùng nhiều nhất** (17+ usages). Rollback ActionButton ảnh hưởng toàn bộ hệ thống.  
**Khuyến nghị:** ActionButton phải được test kỹ nhất. Feature flag bắt buộc. Canary release bắt buộc.

### 14.4 Rollback: DataGrid

```
DATAGRID ROLLBACK
         │
         ▼
Layer 5 — ẢNH HƯỞNG TRỰC TIẾP:
├── Inventory Page          (dùng DataGrid)
├── Disposals Page          (dùng DataGrid)
├── Orders Page             (dùng DataGrid)
├── Customers Page          (dùng DataGrid)
├── Suppliers Page          (dùng DataGrid)
└── ReturnOrders Page       (dùng DataGrid)
```

**Kết luận:** DataGrid là page-level component. Rollback DataGrid chỉ ảnh hưởng page đó.  
**Khuyến nghị:** Có thể rollout/rollback từng page riêng lẻ.

### 14.5 Rollback: State Components

```
STATE COMPONENTS ROLLBACK
         │
         ▼
Layer 2 — ẢNH HƯỞNG TRỰC TIẾP:
├── DataGrid                (dùng LoadingState, EmptyState, ErrorState)
├── Picker                  (dùng LoadingState, EmptyState, ErrorState)
├── Modal content           (dùng LoadingState, EmptyState, ErrorState)
└── Page content            (dùng LoadingState, EmptyState, ErrorState)
```

**Kết luận:** State Components ảnh hưởng đến async data display ở mọi layer.  
**Khuyến nghị:** Rollback an toàn vì state components không ảnh hưởng business logic.

### 14.6 Dependency Rollback Summary

| Rollback component | Affected count | Affected layers | Rollback difficulty |
|--------------------|----------------|-----------------|---------------------|
| **MasterModal** | 8+ modals | Layers 3-5 | 🔴 KHÓ |
| **ActionButton** | 17+ usages | Layers 1-5 | 🔴 KHÓ |
| **DataGrid** | 6 pages | Layer 5 | 🟢 DỄ (theo page) |
| **SectionBox** | 5+ form layouts | Layers 3-4 | 🟡 TRUNG BÌNH |
| **State Components** | 3+ consumers | Layers 2-5 | 🟢 DỄ |
| **FormInputs** | 10+ forms | Layers 1-5 | 🔴 KHÓ |

---

## SECTION 15 — RESTORE POINT STRATEGY

### 15.1 Restore Point là gì

Restore Point là **trạng thái UI ổn định được ghi lại** trước khi thực hiện migration cho một batch. Restore Point cho phép rollback nhanh chóng về trạng thái đó nếu migration thất bại.

### 15.2 Cấu trúc Restore Point

Mỗi Restore Point bao gồm:

```
Restore Point: [BATCH_NAME] - [TIMESTAMP]
├── Git Commit: [commit-hash]
├── Build Version: [version-number]
├── Release Tag: [tag-name]
├── Migration Batch: [batch-id]
└── Rollback Target: [feature-flag-config]
```

### 15.3 Restore Point cho từng Batch

| Batch | Restore Point | Git Commit | Build Version | Release Tag | Feature Flag Config |
|-------|---------------|------------|---------------|-------------|---------------------|
| **Batch A** (Core Components) | RP-A-YYYYMMDD | `git tag rp-a-YYYYMMDD` | v7.1.0 | `release/ui-migration-a` | Tất cả flags = OFF |
| **Batch B** (POS Modals) | RP-B-YYYYMMDD | `git tag rp-b-YYYYMMDD` | v7.2.0 | `release/ui-migration-b` | `useNewActionButton=true`, còn lại OFF |
| **Batch C** (Disposal Module) | RP-C-YYYYMMDD | `git tag rp-c-YYYYMMDD` | v7.3.0 | `release/ui-migration-c` | `useNewDisposalLayout=true`, còn lại OFF |
| **Batch D** (Import Module) | RP-D-YYYYMMDD | `git tag rp-d-YYYYMMDD` | v7.4.0 | `release/ui-migration-d` | `useNewImportLayout=true`, còn lại OFF |
| **Batch E** (Inventory Count) | RP-E-YYYYMMDD | `git tag rp-e-YYYYMMDD` | v7.5.0 | `release/ui-migration-e` | `useNewCountLayout=true`, còn lại OFF |
| **Batch F** (CRUD Modals) | RP-F-YYYYMMDD | `git tag rp-f-YYYYMMDD` | v7.6.0 | `release/ui-migration-f` | Từng modal flag riêng |
| **Batch G** (Pages) | RP-G-YYYYMMDD | `git tag rp-g-YYYYMMDD` | v7.7.0 | `release/ui-migration-g` | `useNewDataGrid=true` (per page) |

### 15.4 Tạo Restore Point

**Trước mỗi batch migration:**

```bash
# 1. Đảm bảo code hiện tại ổn định
git status  # không có uncommitted changes

# 2. Tạo tag
git tag rp-a-20260624  # ví dụ cho Batch A

# 3. Ghi lại build version
npm version patch  # hoặc update version thủ công
# Build version: v7.1.0

# 4. Lưu feature flag config hiện tại
cp .env.production .env.production.rp-a-backup

# 5. Ghi lại release tag trong CI/CD
# Release tag: release/ui-migration-a
```

### 15.5 Rollback bằng Restore Point

```bash
# Rollback về Restore Point
# Cách 1: Git checkout tag + deploy
git checkout rp-a-20260624
npm run build
npm run deploy

# Cách 2: Feature flag (không cần git)
# Chỉ cần set .env.production về config cũ
cp .env.production.rp-a-backup .env.production
npm run build
npm run deploy

# Cách 3: CI/CD pipeline rollback
# Chọn release tag trong CI/CD và deploy lại
```

---

## SECTION 16 — VERSIONING STRATEGY

### 16.1 Version Scheme

```
┌─────────────────────────────────────────────────────────────┐
│                    VERSION SCHEME                            │
│                                                             │
│   v7.x.y-ui-legacy        → UI cũ (trước migration)         │
│   v7.x.y-ui-migration-a   → Đã migrate Batch A              │
│   v7.x.y-ui-migration-b   → Đã migrate Batch B              │
│   v7.x.y-ui-migration-c   → Đã migrate Batch C              │
│   v7.x.y-ui-migration-d   → Đã migrate Batch D              │
│   v7.x.y-ui-migration-e   → Đã migrate Batch E              │
│   v7.x.y-ui-migration-f   → Đã migrate Batch F              │
│   v7.x.y-ui-migration-g   → Đã migrate Batch G              │
│   v7.x.y-ui-design-system → Full Design System (hoàn tất)   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 16.2 Chi tiết Version Mapping

| Build Version | UI State | Feature Flags | Rollback Target |
|--------------|----------|---------------|-----------------|
| `v7.1.0-ui-legacy` | Legacy UI (trước migration) | Tất cả = false | — |
| `v7.2.0-ui-core` | Core Components migrated | ActionButton, Input, SectionBox, State = true | `v7.1.0-ui-legacy` |
| `v7.3.0-ui-pos` | POS Modals migrated | PaymentModal, PromotionModal = true | `v7.2.0-ui-core` |
| `v7.4.0-ui-disposal` | Disposal Module migrated | DisposalLayout = true | `v7.3.0-ui-pos` |
| `v7.5.0-ui-import` | Import Module migrated | ImportLayout = true | `v7.4.0-ui-disposal` |
| `v7.6.0-ui-count` | Inventory Count migrated | CountLayout = true | `v7.5.0-ui-import` |
| `v7.7.0-ui-crud` | CRUD Modals migrated | CRUD modal flags = true | `v7.6.0-ui-count` |
| `v7.8.0-ui-pages` | Pages (DataGrid) migrated | DataGrid flags = true | `v7.7.0-ui-crud` |
| `v8.0.0-ui-complete` | Full Design System | Tất cả = true | `v7.8.0-ui-pages` |

### 16.3 Rollback giữa các Version

```
VÍ DỤ: Đang ở v7.5.0-ui-import, cần rollback về v7.3.0-ui-pos

Bước 1: Xác nhận rollback target = v7.3.0-ui-pos
Bước 2: Lấy build v7.3.0-ui-pos từ CI/CD artifact
Bước 3: Deploy build v7.3.0-ui-pos
Bước 4: Verify POS hoạt động
Bước 5: Thông báo rollback thành công

Lưu ý: Dữ liệu của Import Module vẫn còn trong database
         — chỉ UI quay lại version cũ
         — Import Module sẽ cần migrate lại sau
```

### 16.4 Rollback nhanh bằng Version

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  v7.4.0     │     │  v7.5.0     │     │  v7.6.0     │
│  (current)  │ ──→ │  (new)      │ ──→ │  (rollback) │
│  disposal   │     │  import     │     │  disposal   │
└─────────────┘     └─────────────┘     └─────────────┘
                         │                    ↑
                         ▼                    │
                     BUG DETECTED         ROLLBACK
                     Import Module        → Deploy v7.4.0
                     CRASH                → Import UI về legacy
```

---

## SECTION 17 — ROLLBACK PROCEDURE

### 17.1 Quy trình chuẩn

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   BƯỚC 1: XÁC NHẬN LỖI                                          │
│   ─────────────────────                                          │
│   • Người phát hiện: Dev / QA / User                            │
│   • Ghi nhận: Bug report với screenshot, video, console log     │
│   • Xác nhận: Tech Lead / QA Lead reproduce lỗi                │
│   • Output: Bug confirmed (YES/NO)                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   BƯỚC 2: ĐÁNH GIÁ SEVERITY                                     │
│   ────────────────────────                                      │
│   • Dùng Severity Matrix (Section 10) để đánh giá               │
│   • BLOCKER / CRITICAL → Rollback bắt buộc                     │
│   • HIGH → Cân nhắc rollback                                    │
│   • MEDIUM / LOW → Fix trong sprint tiếp                       │
│   • Output: Severity level + Rollback decision (YES/NO)         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   BƯỚC 3: XÁC ĐỊNH ROLLBACK LEVEL                              │
│   ───────────────────────────────                               │
│   • Level 1: Component — 1 component lỗi                        │
│   • Level 2: Modal — 1 modal lỗi                               │
│   • Level 3: Batch — nhiều component/modal trong 1 batch lỗi   │
│   • Level 4: Feature — 1 feature module lỗi                     │
│   • Level 5: Full UI — toàn bộ hệ thống lỗi                    │
│   • Output: Rollback level                                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   BƯỚC 4: KÍCH HOẠT ROLLBACK                                    │
│   ────────────────────────                                      │
│   • Level 1-2: Toggle feature flag → rebuild → deploy          │
│   • Level 3-4: Rollback bằng Restore Point + deploy            │
│   • Level 5: Rollback toàn bộ về legacy UI                     │
│   • Output: UI đã được rollback                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   BƯỚC 5: SMOKE TEST                                            │
│   ────────────────                                              │
│   • Test component/modal/page vừa rollback                      │
│   • Test flow nghiệp vụ liên quan                               │
│   • Kiểm tra không có lỗi mới phát sinh                        │
│   • Output: Smoke test PASS / FAIL                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   BƯỚC 6: THÔNG BÁO HOÀN TẤT                                    │
│   ──────────────────────────                                    │
│   • Ghi nhận rollback trong changelog                           │
│   • Thông báo cho team: Dev, QA, Product Owner                 │
│   • Cập nhật trạng thái bug (rolled back)                      │
│   • Tạo task hotfix cho bug (để migrate lại sau)               │
│   • Output: Rollback completed notification                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 17.2 Quy trình Rollback chi tiết theo Level

#### Level 1 — Component Rollback

```
Developer phát hiện ActionButton hover không hoạt động
         │
         ▼
Severity: HIGH (không ảnh hưởng click handler)
         │
         ▼
Cân nhắc: KHÔNG rollback, fix trong ngày
╔═══════════════════════════════════════════════════════╗
║ NẾU QUYẾT ĐỊNH ROLLBACK:                             ║
║                                                       ║
║ 1. Set VITE_USE_NEW_ACTION_BUTTON=false               ║
║ 2. npm run build                                      ║
║ 3. Deploy                                             ║
║ 4. Mở 1 modal bất kỳ → kiểm tra button legacy         ║
║ 5. PASS → Thông báo                                    ║
╚═══════════════════════════════════════════════════════╝
```

#### Level 2 — Modal Rollback

```
QA phát hiện PaymentModal không đóng được sau thanh toán
         │
         ▼
Severity: BLOCKER (POS không checkout được)
         │
         ▼
Rollback bắt buộc
╔═══════════════════════════════════════════════════════╗
║ 1. Set VITE_USE_REFACTORED_PAYMENT_MODAL=false        ║
║ 2. npm run build                                      ║
║ 3. Deploy                                             ║
║ 4. Mở POS → checkout → payment → kiểm tra modal đóng  ║
║ 5. PASS → Thông báo                                    ║
╚═══════════════════════════════════════════════════════╝
```

#### Level 3 — Batch Rollback

```
Phát hiện Batch B (POS Modals):
- PaymentModal không đóng
- PromotionModal không áp dụng promotion
         │
         ▼
Severity: BLOCKER (cả 2 modal cùng lỗi)
         │
         ▼
Rollback cả batch
╔═══════════════════════════════════════════════════════╗
║ 1. Xác định restore point: RP-B-YYYYMMDD              ║
║ 2. Git checkout tag hoặc deploy build cũ              ║
║ 3. Deploy                                             ║
║ 4. Smoke test full POS flow:                          ║
║    • Thêm sản phẩm → Checkout → Payment → Promotion   ║
║ 5. PASS → Thông báo                                    ║
╚═══════════════════════════════════════════════════════╝
```

#### Level 4 — Feature Rollback

```
Phát hiện toàn bộ POS module UI lỗi:
- PaymentModal, PromotionModal
- MobilePOS layout
- DesktopPOS layout
         │
         ▼
Severity: BLOCKER
         │
         ▼
Rollback feature
╔═══════════════════════════════════════════════════════╗
║ 1. Tắt tất cả feature flag liên quan POS:             ║
║    • useRefactoredPaymentModal = false                 ║
║    • useRefactoredPromotionModal = false               ║
║ 2. npm run build → Deploy                              ║
║ 3. Smoke test full POS flow                           ║
║ 4. PASS → Thông báo                                    ║
╚═══════════════════════════════════════════════════════╝
```

#### Level 5 — Full UI Rollback

```
Phát hiện toàn bộ Design System UI bị lỗi:
- Tất cả component hiển thị sai
- Modal layout vỡ
- Form không dùng được
- DataGrid không load
         │
         ▼
Severity: BLOCKER (toàn bộ hệ thống)
         │
         ▼
Full rollback
╔═══════════════════════════════════════════════════════╗
║ 1. Quyết định: Release Manager + Tech Lead            ║
║ 2. Set useDesignSystemV2 = false                      ║
║ 3. Hoặc deploy build v7.1.0-ui-legacy (full legacy)  ║
║ 4. Deploy                                             ║
║ 5. Smoke test toàn bộ hệ thống:                       ║
║    • POS checkout                                     ║
║    • Disposal module                                  ║
║    • Import module                                    ║
║    • Inventory Count                                  ║
║    • CRUD modals                                      ║
║    • Tất cả page DataGrid                             ║
║ 6. PASS → Thông báo                                    ║
╚═══════════════════════════════════════════════════════╝
```

### 17.3 Thời gian Rollback

| Level | Tình huống tốt nhất | Tình huống xấu nhất | Trung bình |
|-------|--------------------|--------------------|------------|
| Level 1 — Component | 2 phút | 10 phút | 5 phút |
| Level 2 — Modal | 5 phút | 20 phút | 10 phút |
| Level 3 — Batch | 10 phút | 30 phút | 20 phút |
| Level 4 — Feature | 15 phút | 60 phút | 30 phút |
| Level 5 — Full UI | 30 phút | 120 phút | 60 phút |

---

## SECTION 18 — POST-ROLLBACK VERIFICATION

### 18.1 Verification Checklist

Sau mỗi rollback, **bắt buộc** kiểm tra các mục sau. Đây là tài liệu bắt buộc đọc chéo với `UI_ACCEPTANCE_CRITERIA.md`.

#### Modal Verification

| # | Kiểm tra | PASS/FAIL | Ghi chú |
|---|----------|-----------|---------|
| 1 | Modal mở được với đúng animation | ☐ | |
| 2 | Modal đóng được (click overlay, ESC, X button) | ☐ | |
| 3 | Kích thước modal đúng variant (sm/md/lg) | ☐ | |
| 4 | Overlay hiển thị đúng (màu, z-index) | ☐ | |
| 5 | Scroll lock trên body khi modal mở | ☐ | |
| 6 | Focus trap hoạt động trong modal | ☐ | |
| 7 | Focus restore khi modal đóng | ☐ | |

#### Forms Verification

| # | Kiểm tra | PASS/FAIL | Ghi chú |
|---|----------|-----------|---------|
| 1 | Input/Select có thể nhập liệu | ☐ | |
| 2 | Validation hoạt động (required, format, custom) | ☐ | |
| 3 | Error message hiển thị đúng | ☐ | |
| 4 | Submit form hoạt động | ☐ | |
| 5 | Disabled/ReadOnly state đúng | ☐ | |

#### Tables Verification

| # | Kiểm tra | PASS/FAIL | Ghi chú |
|---|----------|-----------|---------|
| 1 | DataGrid hiển thị dữ liệu | ☐ | |
| 2 | Sort hoạt động (click header) | ☐ | |
| 3 | Filter hoạt động | ☐ | |
| 4 | Pagination hoạt động (prev/next/page) | ☐ | |
| 5 | Row selection hoạt động | ☐ | |
| 6 | Loading/Empty/Error state đúng | ☐ | |

#### Pickers Verification

| # | Kiểm tra | PASS/FAIL | Ghi chú |
|---|----------|-----------|---------|
| 1 | Search input hoạt động | ☐ | |
| 2 | Filter kết quả realtime | ☐ | |
| 3 | Chọn/deselect item | ☐ | |
| 4 | Keyboard navigation (↑↓ Enter ESC) | ☐ | |
| 5 | Close when click outside | ☐ | |

#### Notifications Verification

| # | Kiểm tra | PASS/FAIL | Ghi chú |
|---|----------|-----------|---------|
| 1 | Toast/Notification hiển thị sau action | ☐ | |
| 2 | Đúng variant (success/error/warning/info) | ☐ | |
| 3 | Auto-dismiss hoạt động | ☐ | |
| 4 | Close button hoạt động | ☐ | |

#### Permissions Verification

| # | Kiểm tra | PASS/FAIL | Ghi chú |
|---|----------|-----------|---------|
| 1 | Button ẩn nếu không có permission | ☐ | |
| 2 | Button disabled nếu không có permission | ☐ | |
| 3 | API không được gọi nếu không có permission | ☐ | |

#### Validation Verification

| # | Kiểm tra | PASS/FAIL | Ghi chú |
|---|----------|-----------|---------|
| 1 | Required field báo lỗi khi submit empty | ☐ | |
| 2 | Format validation (email, phone, number) | ☐ | |
| 3 | Length validation (min/max) | ☐ | |
| 4 | Custom validation (business rules) | ☐ | |
| 5 | Validation message hiển thị đúng | ☐ | |

#### API Verification

| # | Kiểm tra | PASS/FAIL | Ghi chú |
|---|----------|-----------|---------|
| 1 | API call shape không thay đổi (network tab) | ☐ | |
| 2 | Response parse đúng | ☐ | |
| 3 | Error handling hoạt động | ☐ | |
| 4 | Retry hoạt động | ☐ | |

#### Workflow Verification

| # | Kiểm tra | PASS/FAIL | Ghi chú |
|---|----------|-----------|---------|
| 1 | POS checkout flow: thêm SP → payment → hoàn tất | ☐ | |
| 2 | Disposal flow: tạo phiếu → duyệt → hủy | ☐ | |
| 3 | Import flow: tạo phiếu → nhập → hoàn tất | ☐ | |
| 4 | Inventory Count flow: tạo → kiểm → xác nhận | ☐ | |
| 5 | CRUD flow: create → read → update → delete | ☐ | |

### 18.2 Smoke Test Script

Sau rollback, chạy smoke test script tối thiểu:

```bash
# Smoke Test — POS
1. Mở POS
2. Thêm 1 sản phẩm vào giỏ
3. Chọn khách hàng
4. Áp dụng promotion (nếu có)
5. Thanh toán (chọn payment method)
6. Kiểm tra hóa đơn được tạo

# Smoke Test — Modal
1. Mở từng modal: Payment, Promotion, PayDebt, ProductEdit
2. Kiểm tra mở/đóng
3. Nhập dữ liệu (nếu có form)
4. Submit (nếu có action)

# Smoke Test — DataGrid
1. Mở từng page: Inventory, Disposals, Orders
2. Kiểm tra dữ liệu hiển thị
3. Sort thử 2-3 cột
4. Filter thử 1-2 filter
5. Phân trang
```

### 18.3 Rollback Verification Result

```
┌────────────────────────────────────────────────────────────────┐
│                    ROLLBACK VERIFICATION RESULT                 │
├────────────────────────────────────────────────────────────────┤
│  Batch/Modal: [Tên]                                            │
│  Rollback time: [YYYY-MM-DD HH:MM]                            │
│  Rollback level: [1/2/3/4/5]                                  │
│  Rollback by: [Tên người thực hiện]                            │
│                                                                │
│  Modal:                  [PASS / FAIL / SKIP]                  │
│  Forms:                  [PASS / FAIL / SKIP]                  │
│  Tables:                 [PASS / FAIL / SKIP]                  │
│  Pickers:                [PASS / FAIL / SKIP]                  │
│  Notifications:          [PASS / FAIL / SKIP]                  │
│  Permissions:            [PASS / FAIL / SKIP]                  │
│  Validation:             [PASS / FAIL / SKIP]                  │
│  API:                    [PASS / FAIL / SKIP]                  │
│  Workflow:               [PASS / FAIL / SKIP]                  │
│                                                                │
│  Kết luận: [ROLLBACK THÀNH CÔNG / ROLLBACK THẤT BẠI]          │
│  Nếu thất bại: [Lý do + kế hoạch khắc phục]                   │
└────────────────────────────────────────────────────────────────┘
```

---

## SECTION 19 — ROLLBACK OWNERSHIP

### 19.1 Vai trò và Trách nhiệm

| Vai trò | Người | Trách nhiệm |
|---------|-------|-------------|
| **Developer** | Thành viên dev thực hiện migration | Phát hiện lỗi, thực hiện rollback Level 1-2, kiểm tra verification |
| **Tech Lead** | Lead kỹ thuật | Quyết định rollback, xác định severity, rollback Level 3-4, phê duyệt smoke test |
| **QA** | Kiểm thử | Xác nhận lỗi, reproduce bug, thực hiện smoke test sau rollback |
| **Product Owner** | Chủ sản phẩm | Quyết định rollback Level 4-5, thông báo cho stakeholders |
| **Release Manager** | Quản lý release | Thực hiện rollback Level 5, quản lý CI/CD pipeline, ghi nhận release notes |

### 19.2 Decision Authority

| Rollback Level | Quyết định bởi | Cần approval |
|----------------|----------------|--------------|
| Level 1 — Component | Developer | Không cần (tự động) |
| Level 2 — Modal | Developer + Tech Lead | Tech Lead |
| Level 3 — Batch | Tech Lead | Product Owner (thông báo) |
| Level 4 — Feature | Tech Lead + Product Owner | Product Owner |
| Level 5 — Full UI | Release Manager + Product Owner | CTO / Giám đốc |

### 19.3 Communication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  DEVELOPER  │ ──→ │  TECH LEAD  │ ──→ │    QA       │
│             │     │             │     │             │
│ Phát hiện   │     │ Xác nhận    │     │ Reproduce   │
│ bug + thông │     │ severity +  │     │ + verify    │
│ báo         │     │ quyết định  │     │ fix         │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  PRODUCT    │     │  RELEASE    │
                    │  OWNER      │     │  MANAGER    │
                    │             │     │             │
                    │ Thông báo   │     │ Rollback    │
                    │ stakeholder │     │ pipeline    │
                    └─────────────┘     └─────────────┘
```

### 19.4 Rollback Execution Matrix

| Level | Execute | Verify | Approve | Notify |
|-------|---------|--------|---------|--------|
| Level 1 | Developer | Developer | Developer | Team chat |
| Level 2 | Developer | Developer + QA | Tech Lead | Team chat |
| Level 3 | Tech Lead | Dev + QA | Tech Lead + PO | Team chat + Email |
| Level 4 | Tech Lead | Dev + QA | Tech Lead + PO | Team chat + Email |
| Level 5 | Release Manager | Full team | CTO | Toàn công ty |

---

## SECTION 20 — ROLLBACK DECISION TREE

### 20.1 Decision Tree

```
                              ╔═══════════════════╗
                              ║   BUG DETECTED    ║
                              ╚═══════════════════╝
                                       │
                                       ▼
                          ┌─────────────────────┐
                          │  XÁC NHẬN LỖI       │
                          │  (Reproduce bởi QA) │
                          └─────────────────────┘
                                       │
                              ┌────────┴────────┐
                              ▼                 ▼
                     ┌──────────────┐   ┌──────────────┐
                     │  CONFIRMED   │   │  CANNOT      │
                     │              │   │  REPRODUCE   │
                     └──────────────┘   └──────────────┘
                              │                 │
                              ▼                 ▼
                     ┌──────────────┐   ┌──────────────┐
                     │  CONTINUE    │   │  MONITOR +   │
                     │              │   │  ADD LOGGING │
                     └──────────────┘   └──────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  ĐÁNH GIÁ SEVERITY  │
                    └─────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌──────────┐   ┌──────────────┐   ┌──────────┐
       │ BLOCKER  │   │  CRITICAL    │   │  HIGH    │
       └──────────┘   └──────────────┘   └──────────┘
              │               │               │
              ▼               ▼               ▼
       ┌──────────┐   ┌──────────────┐   ┌──────────────┐
       │ROLLBACK  │   │  ROLLBACK    │   │  CÂN NHẮC    │
       │BẮT BUỘC  │   │  BẮT BUỘC    │   │  ROLLBACK?   │
       └──────────┘   └──────────────┘   └──────┬───────┘
              │               │                  │
              └───────┬───────┘                  │
                      │                          │
                      ▼                          ▼
             ┌────────────────┐         ┌────────────────┐
             │ CÓ THỂ HOTFIX  │         │ ROLLBACK       │
             │ KHÔNG?         │         │ LEVEL?         │
             └────────────────┘         └────────────────┘
                      │                          │
              ┌───────┴───────┐                  │
              ▼               ▼                  ▼
       ┌────────────┐ ┌──────────────┐  ┌────────────────┐
       │ HOTFIX     │ │ ROLLBACK     │  │ Level 1/2/3    │
       │ TRONG 1H   │ │ NGAY         │  │ /4/5           │
       └────────────┘ └──────────────┘  └────────────────┘
              │               │                  │
              ▼               ▼                  ▼
       ┌────────────┐ ┌──────────────┐  ┌────────────────┐
       │ DEPLOY     │ │ DEPLOY       │  │ EXECUTE        │
       │ HOTFIX     │ │ LEGACY UI    │  │ ROLLBACK       │
       └────────────┘ └──────────────┘  └────────────────┘
              │               │                  │
              └───────┬───────┘                  │
                      │                          │
                      ▼                          ▼
             ┌────────────────┐         ┌────────────────┐
             │ SMOKE TEST     │         │ SMOKE TEST     │
             └────────────────┘         └────────────────┘
                      │                          │
                      ▼                          ▼
             ┌────────────────┐         ┌────────────────┐
             │ PASS?          │         │ PASS?          │
             └────────────────┘         └────────────────┘
                      │                          │
              ┌───────┴───────┐          ┌───────┴───────┐
              ▼               ▼          ▼               ▼
       ┌────────────┐ ┌────────────┐ ┌────────┐ ┌────────────┐
       │ THÔNG BÁO  │ │ FIX TIẾP  │ │THÔNG   │ │ ESCALATE   │
       │ HOÀN TẤT   │ │           │ │BÁO     │ │            │
       └────────────┘ └────────────┘ └────────┘ └────────────┘
```

### 20.2 Decision Scenarios

#### Scenario 1: PaymentModal không đóng sau thanh toán

```
Bug: PaymentModal không đóng sau khi thanh toán thành công
Severity: BLOCKER — POS không checkout được
Rollback? YES — bắt buộc
Hotfix? NO — không thể hotfix nhanh trong 1h
→ ROLLBACK Level 2: Toggle useRefactoredPaymentModal = false
→ Deploy
→ Smoke test POS
→ Thông báo
```

#### Scenario 2: ActionButton hover sai màu

```
Bug: ActionButton hover màu #4C32D9 thay vì #5B3FE0
Severity: HIGH — cosmetic, không ảnh hưởng chức năng
Rollback? CÂN NHẮC
Hotfix? YES — fix trong 30 phút
→ HOTFIX: Sửa CSS hover color
→ Deploy hotfix
→ Verify
→ Không cần rollback
```

#### Scenario 3: DataGrid sort không hoạt động trên Inventory Page

```
Bug: Click header sort → không sort, không có indicator
Severity: CRITICAL — ảnh hưởng tra cứu hàng tồn
Rollback? YES
Hotfix? CÓ THỂ — nếu bug đơn giản (props không truyền đúng)
→ Nếu hotfix < 1h: HOTFIX
→ Nếu hotfix > 1h: ROLLBACK Level 1 (DataGrid trên Inventory Page)
→ Toggle useNewDataGrid_inventory = false
```

#### Scenario 4: Toàn bộ POS module bị lỗi UI

```
Bug: PaymentModal + PromotionModal + POS layout đều lỗi
Severity: BLOCKER — không bán hàng được
Rollback? YES — bắt buộc
Hotfix? NO — quá nhiều lỗi
→ ROLLBACK Level 4: Toggle tất cả POS flags = false
→ Deploy
→ Smoke test full POS flow
→ Thông báo cho Product Owner + stakeholders
```

#### Scenario 5: Performance regression trên DataGrid

```
Bug: DataGrid load chậm 3x so với legacy (2s → 6s)
Severity: HIGH
Rollback? CÂN NHẮC
Hotfix? CÓ THỂ — optimize render
→ Nếu ảnh hưởng năng suất làm việc: ROLLBACK
→ Nếu chấp nhận được: OPTIMIZE trong sprint
```

---

## SECTION 21 — ROLLBACK CHECKLIST

### 21.1 Pre-Rollback Checklist

Trước khi thực hiện bất kỳ rollback nào:

| # | Checklist | Trạng thái | Ghi chú |
|---|-----------|-----------|---------|
| 1 | **Restore Point Available** — có tag/branch/code để rollback về | ☐ | Git tag hoặc backup build |
| 2 | **Feature Flag Available** — có flag để tắt component lỗi | ☐ | Feature flag config ready |
| 3 | **Rollback Target Identified** — xác định rõ rollback về đâu | ☐ | Version hoặc commit cụ thể |
| 4 | **QA Ready** — QA sẵn sàng verify sau rollback | ☐ | QA đã được thông báo |
| 5 | **Smoke Test Ready** — script smoke test đã chuẩn bị | ☐ | Smoke test checklist in Section 18 |
| 6 | **Communication Ready** — kênh thông báo đã sẵn sàng | ☐ | Team chat, email template |
| 7 | **Monitoring Ready** — có thể theo dõi error rate sau rollback | ☐ | Dashboard / log monitoring |

### 21.2 Rollback Execution Checklist

| # | Bước | Thực hiện bởi | Hoàn thành |
|---|------|---------------|------------|
| 1 | Thông báo team: "Đang thực hiện rollback [component/batch]" | Dev / Tech Lead | ☐ |
| 2 | Xác nhận Restore Point / Feature Flag config | Tech Lead | ☐ |
| 3 | Thực hiện rollback (toggle flag / deploy build cũ) | Dev / Release Manager | ☐ |
| 4 | Verify rollback thành công (UI đã về legacy) | Dev | ☐ |
| 5 | Smoke test component/modal/page vừa rollback | QA | ☐ |
| 6 | Smoke test flow nghiệp vụ liên quan | QA | ☐ |
| 7 | Kiểm tra không có lỗi mới phát sinh | Dev | ☐ |
| 8 | Ghi nhận rollback trong changelog | Dev | ☐ |
| 9 | Thông báo hoàn tất: "Rollback [component/batch] thành công" | Tech Lead | ☐ |
| 10 | Tạo task hotfix để migrate lại sau | Tech Lead | ☐ |

### 21.3 Post-Rollback Checklist

| # | Checklist | Trạng thái | Ghi chú |
|---|-----------|-----------|---------|
| 1 | Bug đã được khắc phục (UI hoạt động bình thường) | ☐ | |
| 2 | Không mất dữ liệu | ☐ | |
| 3 | API contract không thay đổi | ☐ | |
| 4 | Business logic không thay đổi | ☐ | |
| 5 | Workflow không bị gián đoạn | ☐ | |
| 6 | Tất cả smoke test PASS | ☐ | |
| 7 | Không có lỗi mới trong monitoring | ☐ | |
| 8 | Rollback đã được ghi nhận | ☐ | |
| 9 | Team đã được thông báo | ☐ | |
| 10 | Hotfix task đã được tạo | ☐ | |

---

## SECTION 22 — FINAL RECOMMENDATIONS

### 22.1 Batch nào rủi ro cao nhất

| Hạng | Batch | Risk Level | Lý do |
|------|-------|------------|-------|
| **🔴 1** | **Batch B — POS Modals** | **CAO NHẤT** | Critical path — ảnh hưởng trực tiếp doanh thu. PaymentModal và PromotionModal là 2 modal phức tạp nhất, có nhiều business logic (tính tiền, discount, promotion) |
| **🟠 2** | **Batch C — Disposal Module** | CAO | Form phức tạp với nhiều business logic (validation số lượng, tính tổng, workflow duyệt). Ảnh hưởng đến quản lý hủy hàng |
| **🟠 3** | **Batch D — Import Module** | CAO | Import là critical path cho nhập hàng. Form phức tạp với lot/expiry management |
| **🟡 4** | **Batch A — Core Components** | TRUNG BÌNH | Foundation component — ảnh hưởng dây chuyền đến tất cả. Nhưng được xây mới song song, legacy vẫn tồn tại |
| **🟡 5** | **Batch G — Pages (DataGrid)** | TRUNG BÌNH | DataGrid là component lớn, nhưng có thể rollout/rollback từng page |
| **🟢 6** | **Batch F — CRUD Modals** | THẤP | Modal độc lập, dễ rollback riêng từng cái |
| **🟢 7** | **Batch E — Inventory Count** | THẤP NHẤT | Đã dùng MasterModal một phần, migration gần hoàn tất |

### 22.2 Component nào cần Feature Flag bắt buộc

| # | Component | Feature Flag | Lý do |
|---|-----------|-------------|-------|
| **1** | **ActionButton** | `useNewActionButton` | 17+ usages — component được dùng nhiều nhất. Nếu lỗi → toàn bộ hệ thống |
| **2** | **PaymentModal** | `useRefactoredPaymentModal` | Critical path POS — nếu lỗi → không bán hàng được |
| **3** | **PromotionModal** | `useRefactoredPromotionModal` | Critical path POS — nếu lỗi → sai giá bán |
| **4** | **DataGrid** | `useNewDataGrid` (per-page) | DataGrid lớn, phức tạp — cần rollout/rollback từng page |
| **5** | **MasterModal** (nếu thay đổi interface) | `useMasterModalV2` | Singleton dependency — ảnh hưởng tất cả modal |
| **6** | **Input / FormField** | `useNewFormInputs` | Input xuất hiện trong mọi form |

### 22.3 Modal nào cần rollout riêng

| # | Modal | Lý do rollout riêng |
|---|-------|-------------------|
| **1** | **PaymentModal** | Critical path POS — cần canary release riêng, pilot users riêng |
| **2** | **PromotionModal** | Critical path POS — rollout cùng PaymentModal hoặc riêng tùy tình hình |
| **3** | **DisposalFormLayout** | Form phức tạp — cần test kỹ business logic trước khi rollout |
| **4** | **ImportFormLayout** | Form phức tạp — cần test kỹ lot/expiry workflow |
| **5** | **PayDebtModal** | Modal độc lập — có thể rollout riêng, dễ test |

### 22.4 Modal nào rollback dễ nhất

| Hạng | Modal | Lý do |
|------|-------|-------|
| **🟢 1** | **TaxCalculationModal** | Modal độc lập, ít phụ thuộc, dễ revert Git commit |
| **🟢 2** | **PayDebtModal** | Modal độc lập, business logic rõ ràng |
| **🟢 3** | **ProductEditModal** | Modal độc lập, form đơn giản |
| **🟢 4** | **CountFormLayout** | Đã dùng MasterModal một phần, dễ quay lại legacy |
| **🟢 5** | **Customer Picker / Product Picker** | Dùng chung feature flag `useNewPicker`, toggle là xong |

### 22.5 Modal nào rollback khó nhất

| Hạng | Modal | Lý do |
|------|-------|-------|
| **🔴 1** | **PaymentModal** | Nhiều business logic (tính tiền, discount, promotion, payment methods). Phụ thuộc nhiều component khác. Rollback ảnh hưởng POS flow |
| **🔴 2** | **PromotionModal** | Tương tự PaymentModal — nhiều business logic, ảnh hưởng giá bán |
| **🟠 3** | **DisposalFormLayout** | Form phức tạp với nhiều section, items table, business validation |
| **🟠 4** | **ImportFormLayout** | Form phức tạp với lot/expiry, items table, nhiều validation |
| **🟡 5** | **MasterModal** | Singleton dependency — rollback MasterModal = rollback tất cả modal dùng nó |

### 22.6 Tổng kết chiến lược Rollback

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   CHIẾN LƯỢC ROLLBACK — UI MIGRATION VietSale Pro v7         ║
║                                                               ║
║   1. LUÔN có Feature Flag cho mọi component rủi ro             ║
║   2. LUÔN tạo Restore Point trước mỗi batch migration         ║
║   3. LUÔN có Smoke Test script sẵn sàng                       ║
║   4. ROLLBACK ≠ DATA LOSS — chỉ tác động Presentation Layer   ║
║   5. ROLLBACK ≠ FAILURE — rollback là cơ chế an toàn          ║
║   6. ROLLBACK càng sớm càng tốt — đừng chờ đợi                ║
║   7. SAU ROLLBACK → phân tích root cause → migrate lại        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

### 22.7 Rollback Priority Map

```
KHẨN CẤP (Rollback ngay lập tức nếu lỗi)
├── PaymentModal       ─── BLOCKER: POS không checkout được
├── PromotionModal     ─── BLOCKER: Sai giá bán
├── POS Module         ─── BLOCKER: Toàn bộ POS lỗi
└── Import Module      ─── BLOCKER: Không nhập hàng được

CAO (Rollback trong vòng 1 giờ nếu lỗi)
├── DataGrid (any page) ─── Ảnh hưởng tra cứu dữ liệu
├── Disposal Module     ─── Ảnh hưởng quản lý hủy hàng
├── Inventory Count     ─── Ảnh hưởng kiểm kê
└── ActionButton        ─── Ảnh hưởng toàn bộ UI

TRUNG BÌNH (Cân nhắc rollback)
├── SectionBox          ─── Chỉ ảnh hưởng layout
├── StatusBadge         ─── Chỉ ảnh hưởng hiển thị
└── State Components    ─── Chỉ ảnh hưởng loading/empty/error state

THẤP (Fix trong sprint, không rollback)
├── Spacing sai vài px  ─── Cosmetic
├── Shadow không đúng   ─── Cosmetic
└── Animation timing    ─── UX improvement
```

---

> **Kết luận:** UI_ROLLBACK_PLAN này đảm bảo mọi thay đổi UI trong chương trình migration đều có khả năng phục hồi nhanh chóng, an toàn và không ảnh hưởng đến business logic. Mỗi component, modal, batch đều có chiến lược rollback riêng với thời gian phục hồi tối thiểu. Feature flag và Restore Point là 2 công cụ chính để thực hiện rollback mà không cần revert code hay ảnh hưởng dữ liệu.