# 🎯 UI ACCEPTANCE CRITERIA — VietSale Pro v7

> **Phiên bản:** V1.0  
> **Ngày:** 2026-06-24  
> **Mục đích:** Bộ tiêu chuẩn nghiệm thu duy nhất cho toàn bộ chương trình migration UI sang Design System mới.  
> **Nguồn sự thật duy nhất:** `/Master-design/`  
> **Phạm vi:** Toàn bộ component, modal, page, batch migration — không bao gồm backend logic.  

---

## SECTION 1 — EXECUTIVE SUMMARY

### 1.1 Acceptance Criteria là gì

Acceptance Criteria (Tiêu chuẩn nghiệm thu) là tập hợp các điều kiện **có thể kiểm tra được** (testable) mà một component, modal, page hoặc batch migration phải đáp ứng để được xem là **hoàn thành**.

Mỗi tiêu chí là một câu hỏi YES/NO — nếu YES cho tất cả, đơn vị đó PASS. Nếu bất kỳ NO nào, đơn vị đó FAIL và **không được phép release**.

### 1.2 Vai trò trong UI Migration

| Vai trò | Mô tả |
|---------|-------|
| **Gatekeeper** | Ngăn chặn component chưa đạt chuẩn đi vào production |
| **Checklist** | Developer tự kiểm tra trước khi merge |
| **Contract** | Cam kết giữa Dev ↔ QA ↔ Product Owner về "thế nào là đủ" |
| **Measurement** | Đo lường tiến độ migration chính xác (% PASS) |
| **Regression Shield** | Đảm bảo migration không phá vỡ chức năng hiện có |

### 1.3 Tại sao "code chạy" không đồng nghĩa với "đạt chuẩn"

```
"Code chạy"          ≠ "Đạt chuẩn Design System"
"Không crash"        ≠ "Accessibility compliant"
"Hiển thị đúng"      ≠ "Responsive"
"Không lỗi console"  ≠ "Performance acceptable"
"Giống cái cũ"       ≠ "Đã migration thành công"
```

Một component **chỉ được xem là hoàn thành** khi nó PASS tất cả:
- ✅ Design System Compliance
- ✅ Functional Correctness
- ✅ Business Logic Preservation
- ✅ Accessibility
- ✅ Responsiveness
- ✅ Performance

---

## SECTION 2 — GLOBAL ACCEPTANCE RULES

### 2.1 Nguyên tắc bất di bất dịch

Mọi UI sau migration **PHẢI** tuân thủ các nguyên tắc sau. Đây là những quy tắc **KHÔNG thể thương lượng** (non-negotiable):

| # | Rule | Mô tả | Nếu vi phạm |
|---|------|-------|-------------|
| R1 | **Tuân thủ Design System** | Mọi visual element phải dùng token từ `/Master-design/`. Không hardcode. | ❌ BLOCKER |
| R2 | **Không thay đổi business logic** | Handlers, hooks, state management, API calls giữ nguyên. Chỉ sửa JSX layout. | ❌ BLOCKER |
| R3 | **Không thay đổi API contract** | Request/Response shape giữ nguyên. Không thêm/bớt field trong payload. | ❌ BLOCKER |
| R4 | **Không thay đổi database** | Migration không chạm vào SQL schema, RPC, triggers. | ❌ BLOCKER |
| R5 | **Không thay đổi validation logic** | required, pattern, min/max, custom validators giữ nguyên. | ❌ BLOCKER |
| R6 | **Không thay đổi permission logic** | canEdit, canDelete, role-based checks giữ nguyên. | ❌ BLOCKER |
| R7 | **Không thay đổi workflow** | Luồng: open → fill → validate → save → close giữ nguyên. | ❌ BLOCKER |
| R8 | **Không thay đổi calculation** | Công thức tính tiền, thuế, chiết khấu, tồn kho giữ nguyên. | ❌ BLOCKER |
| R9 | **Không thay đổi dữ liệu đầu ra** | Report, export, print output giữ nguyên format và nội dung. | ❌ BLOCKER |

### 2.2 Phạm vi cho phép thay đổi

| Được phép | Không được phép |
|-----------|-----------------|
| ✅ JSX layout / wrapper | ❌ Handler functions |
| ✅ CSS classes / Tailwind | ❌ State variables |
| ✅ Component structure | ❌ API calls |
| ✅ Spacing / padding / margin | ❌ Validation rules |
| ✅ Typography (font, size, weight) | ❌ Permission checks |
| ✅ Colors / tokens | ❌ Data transformation |
| ✅ Animation / motion | ❌ Business calculations |
| ✅ Responsive breakpoints | ❌ Data contracts / types |

---

## SECTION 3 — DESIGN SYSTEM COMPLIANCE

### 3.1 Kiểm tra Design Tokens

Mọi component phải sử dụng **Design Tokens** từ `MASTER_DESIGN_TOKENS_V1`. Không hardcode giá trị.

| # | Token Category | Kiểm tra | PASS Criteria |
|---|----------------|----------|---------------|
| DT1 | **Color** | Mọi màu sắc dùng `var(--color-*)` hoặc token tương ứng | Không có hardcode hex/rgba |
| DT2 | **Spacing** | Mọi padding/margin/gap dùng `var(--space-*)` | Không có hardcode px |
| DT3 | **Border Radius** | Mọi border-radius dùng `var(--radius-*)` | Không có hardcode px |
| DT4 | **Border Width** | Mọi border-width dùng `var(--border-*)` | Không có hardcode px |
| DT5 | **Shadow** | Mọi box-shadow dùng `var(--shadow-*)` | Không có hardcode shadow |
| DT6 | **Opacity** | Mọi opacity dùng `var(--opacity-*)` | Không có hardcode số |
| DT7 | **Z-Index** | Mọi z-index dùng `var(--z-*)` | Không có hardcode số |

### 3.2 Kiểm tra Typography

Dựa trên `MASTER_TYPOGRAPHY_V1`.

| # | Element | Font Size | Font Weight | Line Height | Color | PASS |
|---|---------|-----------|-------------|-------------|-------|------|
| T1 | Modal Title | 28px | 700 (Bold) | 36px | #1E293B | ☐ |
| T2 | Section Title | 18px | 600 (Semibold) | 28px | #1E293B | ☐ |
| T3 | Body Text | 14px | 400 (Regular) | 20px | #475569 | ☐ |
| T4 | Label Text | 13px | 500 (Medium) | 18px | #344054 | ☐ |
| T5 | Helper Text | 12px | 400 (Regular) | 16px | #94A3B8 | ☐ |
| T6 | Button Text | 14px | 600 (Semibold) | 20px | variant | ☐ |
| T7 | Table Header | 12px | 600 (Semibold) | 16px | #64748B | ☐ |
| T8 | Description | 14px | 400 (Regular) | 20px | #64748B | ☐ |

### 3.3 Kiểm tra Spacing

Dựa trên `MASTER_DESIGN_TOKENS_V1` — Spacing Scale (4px grid).

| Context | Token | Value | Usage |
|---------|-------|-------|-------|
| Modal body padding (desktop) | space-24 | 24px | Body padding |
| Modal body padding (tablet) | space-32 | 32px | Body padding |
| Modal body padding (mobile) | space-20 | 20px | Body padding |
| SectionBox padding | space-24 | 24px | Container padding |
| Footer padding | space-16 / space-24 | 16px 24px | Footer horizontal |
| Button gap | space-12 | 12px | Between buttons |
| Field gap | space-16 | 16px | Between form fields |
| Label gap | space-8 | 8px | Between label and input |

### 3.4 Kiểm tra Radius

Dựa trên `MASTER_DESIGN_TOKENS_V1`.

| Component | Token | Value |
|-----------|-------|-------|
| Modal (desktop) | radius-2xl | 24px |
| Modal (mobile) | radius-0 | 0px |
| SectionBox | radius-xl | 20px |
| Button | radius-md | 12px |
| Input | radius-sm | 10px |
| Card | radius-lg | 16px |

### 3.5 Kiểm tra Elevation & Z-Index

Dựa trên `MASTER_ELEVATION_ZINDEX_STANDARD_V1`.

| Layer | Z-Index Token | Value | Shadow |
|-------|---------------|-------|--------|
| Overlay | z-modal (1000) | 1000 | — |
| Modal Container | z-modal + 10 | 1010 | shadow-xl |
| Modal Header | fixed | 1020 | elevated |
| Section Box | base | — | shadow-sm |
| Dropdown (in modal) | z-dropdown | 1050 | shadow-lg |

### 3.6 Kiểm tra Animation & Motion

Dựa trên `MASTER_MOTION_ANIMATION_STANDARD_V1`.

| Element | Animation | Duration | Easing | PASS |
|---------|-----------|----------|--------|------|
| Modal Enter | opacity 0→1 + scale 0.92→1 | 200ms | ease-out | ☐ |
| Modal Exit | opacity 1→0 + scale 1→0.92 | 150ms | ease-in | ☐ |
| Overlay Enter | opacity 0→1 | 200ms | ease-out | ☐ |
| Overlay Exit | opacity 1→0 | 150ms | ease-in | ☐ |
| Button hover | bg-color + shadow | 150ms | ease | ☐ |
| Button active | scale 0.97 | 100ms | ease | ☐ |

### 3.7 Kiểm tra Color

Dựa trên `MASTER_DESIGN_TOKENS_V1` — Semantic Colors.

| Token | Value | Usage |
|-------|-------|-------|
| --color-primary | #5B3DF5 | Primary button, focus ring |
| --color-success | #10B981 | Success state, status badge |
| --color-warning | #F59E0B | Warning state |
| --color-danger | #EF4444 | Danger button, error state |
| --color-info | #3B82F6 | Info state |
| --text-primary | #0F172A | High emphasis text |
| --text-secondary | #64748B | Low emphasis text |
| --text-tertiary | #94A3B8 | Placeholder, helper |
| --bg-primary | #FFFFFF | Modal, section, card bg |
| --bg-secondary | #F8FAFC | Table header, hover bg |
| --bg-tertiary | #F1F5F9 | Divider, border secondary |
| --border-primary | #E2E8F0 | Input border, default border |
| --border-focus | #5B3DF5 | Input focus border |

### 3.8 Kiểm tra Button Standard

Dựa trên `MASTER_ACTION_BUTTON_STANDARD_V1`.

| Variant | Background | Border | Text | Hover | Focus |
|---------|-----------|--------|------|-------|-------|
| **Primary** | #6C4DFF | none | #FFFFFF | #5B3FE0 | ring-2 rgba(108,77,255,0.3) |
| **Secondary** | #FFFFFF | 1px #E2E8F0 | #475569 | #F8FAFC | ring-2 #E2E8F0 |
| **Ghost** | transparent | none | #64748B | #F8FAFC | ring-2 #F1F5F9 |
| **Danger** | #EF4444 | none | #FFFFFF | #DC2626 | ring-2 rgba(239,68,68,0.3) |

Common: height=40px, radius=12px, font=14px/600, gap=12px, disabled=opacity-0.5.

### 3.9 Kiểm tra Input Standard

Dựa trên `MASTER_INPUT_STANDARD_V1`.

| Property | Value |
|----------|-------|
| Height | 40px |
| Radius | 10px |
| Border | 1px solid #E2E8F0 |
| Background | #FFFFFF |
| Text | 14px/400, #1E293B |
| Placeholder | #94A3B8 |
| Padding | 12px 14px |
| Focus | ring 2px #6C4DFF/20%, border #6C4DFF |
| Error | border #EF4444, helper #EF4444 |
| Disabled | opacity-0.5, cursor-not-allowed |

### 3.10 Kiểm tra Modal Blueprint

Dựa trên `MASTER_MODAL_BLUEPRINT_V1`.

| Size | Width | Max Height | Radius |
|------|-------|-----------|--------|
| Small (sm) | 640px | auto | 24px |
| Medium (md) | 960px | auto | 24px |
| Large (lg) | 1400px | 90vh | 24px |
| Fullscreen | 95vw | 95vh | 24px |
| Mobile | 100vw | 100vh | 0px |

### 3.11 Kiểm tra Page Layout Standard

Dựa trên `MASTER_PAGE_LAYOUT_STANDARD_V1`.

- [ ] Page header với title + action buttons
- [ ] Filter/Search bar nếu cần
- [ ] Content area với DataGrid hoặc form layout
- [ ] Pagination/footer
- [ ] Responsive breakpoints (desktop → tablet → mobile)

### 3.12 Kiểm tra State Standard

Dựa trên `MASTER_STATE_STANDARD_V1`.

| State | Visual | PASS |
|-------|--------|------|
| **Loading** | Skeleton: pulse animation, 3 rows | ☐ |
| **Empty** | Icon (64x64, #CBD5E1) + Title (16px/600) + Desc (14px/400) + Action | ☐ |
| **Error** | Alert icon (48x48, #EF4444) + Message (14px/500) + Retry button | ☐ |

### 3.13 Kiểm tra Badge Standard

Dựa trên `MASTER_STATUS_BADGE_STANDARD_V1`.

| Variant | Background | Text Color |
|---------|-----------|------------|
| Success | #10B981 / bg-success | white |
| Warning | #F59E0B / bg-warning | white |
| Danger | #EF4444 / bg-danger | white |
| Info | #3B82F6 / bg-info | white |
| Neutral | #F1F5F9 | #64748B |
| Purple | #EDE9FE | #6D28D9 |

### 3.14 Kiểm tra Notification Standard

Dựa trên `MASTER_NOTIFICATION_STANDARD_V1`.

- [ ] Toast/Notification component đúng position (top-right)
- [ ] Animation enter/exit
- [ ] Auto-dismiss (3-5s)
- [ ] Variants: success, error, warning, info
- [ ] Close button
- [ ] Z-index > modal (z-toast = 1100)

### 3.15 Kiểm tra Data Grid Standard

Dựa trên `MASTER_DATA_GRID_STANDARD_V1`.

| Element | Specification |
|---------|---------------|
| Header bg | #F8FAFC |
| Header text | 12px/600, #64748B, UPPERCASE |
| Header height | 44px |
| Row height | 56px |
| Row border | 1px solid #F1F5F9 |
| Row padding | 16px |
| Row text | 14px/500, #1E293B |
| Row hover | bg #FAFBFC |
| Pagination bg | #FFFFFF |
| Pagination height | 56px |

### 3.16 Kiểm tra Picker Standard

Dựa trên `MASTER_PICKER_STANDARD_V1`.

- [ ] Search input với debounce
- [ ] Filter options
- [ ] Selection (single/multi)
- [ ] Keyboard navigation (↑↓→← Enter ESC)
- [ ] Pagination / virtual scroll
- [ ] Loading state
- [ ] Empty state
- [ ] Performance: < 200ms response

---

## SECTION 4 — COMPONENT ACCEPTANCE CRITERIA

### 4.1 ActionButton

Áp dụng cho: `PrimaryButton`, `SecondaryButton`, `GhostButton`, `DangerButton`.

#### Visual
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| V1 | Background color đúng variant | ☐ |
| V2 | Text color đúng variant | ☐ |
| V3 | Border đúng variant (Secondary có border, Ghost/Primary/Danger không) | ☐ |
| V4 | Height = 40px | ☐ |
| V5 | Radius = 12px | ☐ |
| V6 | Font = 14px/600 | ☐ |
| V7 | Padding = 12px (horizontal) | ☐ |
| V8 | Icon gap = 12px (nếu có icon) | ☐ |

#### Behavior
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| B1 | Hover state: background thay đổi | ☐ |
| B2 | Active state: scale 0.97 | ☐ |
| B3 | Focus state: ring-2 đúng màu | ☐ |
| B4 | Disabled state: opacity 0.5, cursor not-allowed | ☐ |
| B5 | Loading state: spinner + disabled, width preserved | ☐ |
| B6 | onClick handler hoạt động | ☐ |

#### Accessibility
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| A1 | Keyboard focusable (tabIndex) | ☐ |
| A2 | Focus visible indicator | ☐ |
| A3 | ARIA label hoặc text content | ☐ |
| A4 | role="button" mặc định | ☐ |

#### Responsive
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| R1 | Button không bị overflow trên mobile | ☐ |
| R2 | Text không bị truncate bất thường | ☐ |
| R3 | Touch target tối thiểu 44x44px trên mobile | ☐ |

### 4.2 Input (TextInput/FormField)

#### Visual
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| V1 | Height = 40px | ☐ |
| V2 | Radius = 10px | ☐ |
| V3 | Border = 1px solid #E2E8F0 (default) | ☐ |
| V4 | Background = #FFFFFF | ☐ |
| V5 | Text = 14px/400, #1E293B | ☐ |
| V6 | Placeholder = #94A3B8 | ☐ |
| V7 | Label = 13px/500, #344054 | ☐ |
| V8 | Helper text = 12px/400, #94A3B8 | ☐ |
| V9 | Error text = 12px/400, #EF4444 | ☐ |

#### Behavior
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| B1 | Focus state: ring 2px #6C4DFF/20%, border #6C4DFF | ☐ |
| B2 | Error state: border #EF4444, error message hiển thị | ☐ |
| B3 | Disabled state: opacity-0.5, cursor not-allowed | ☐ |
| B4 | Read-only state: không thể edit, style phân biệt | ☐ |
| B5 | onChange handler hoạt động đúng | ☐ |
| B6 | Value binding hoạt động (controlled component) | ☐ |

#### Accessibility
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| A1 | Label liên kết với input (htmlFor / id) | ☐ |
| A2 | Error message có aria-live hoặc aria-describedby | ☐ |
| A3 | Placeholder không thay thế label | ☐ |
| A4 | Focus visible indicator | ☐ |

### 4.3 Select (SelectInput)

#### Visual
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| V1 | Height = 40px | ☐ |
| V2 | Radius = 10px | ☐ |
| V3 | Border = 1px solid #E2E8F0 | ☐ |
| V4 | Dropdown indicator hiển thị | ☐ |
| V5 | Dropdown menu z-index đúng (1050) | ☐ |

#### Behavior
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| B1 | Open dropdown khi click | ☐ |
| B2 | Close khi chọn option | ☐ |
| B3 | Close khi click outside | ☐ |
| B4 | Keyboard: ↑↓ navigate, Enter select, ESC close | ☐ |
| B5 | onChange handler hoạt động | ☐ |

### 4.4 DatePicker

#### Visual
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| V1 | Calendar popup z-index đúng (1050) | ☐ |
| V2 | Date format hiển thị đúng locale | ☐ |
| V3 | Selected date highlighted | ☐ |

#### Behavior
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| B1 | Open calendar khi click | ☐ |
| B2 | Chọn ngày → đóng + cập nhật value | ☐ |
| B3 | Keyboard navigation | ☐ |
| B4 | Min/max date respected | ☐ |
| B5 | onChange handler hoạt động | ☐ |

### 4.5 StatusBadge

#### Visual
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| V1 | Background color đúng variant (success/warning/danger/info/neutral/purple) | ☐ |
| V2 | Text color đúng variant | ☐ |
| V3 | Radius đúng (md hoặc full) | ☐ |
| V4 | Font size đúng (12px) | ☐ |

#### Behavior
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| B1 | Icon variant mapping đúng | ☐ |
| B2 | Text hiển thị đúng | ☐ |

### 4.6 SectionBox

#### Visual
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| V1 | Background = #FFFFFF | ☐ |
| V2 | Border = 1px solid #F1F5F9 | ☐ |
| V3 | Radius = 20px | ☐ |
| V4 | Shadow = 0 2px 8px rgba(15,23,42,0.03) | ☐ |
| V5 | Padding = 24px | ☐ |
| V6 | SectionHeader có title + optional action | ☐ |
| V7 | SectionHeader title = 18px/600, #1E293B | ☐ |
| V8 | SectionContent width = 100% | ☐ |

#### Behavior
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| B1 | Content scrollable nếu overflow | ☐ |
| B2 | Action button trong SectionHeader hoạt động | ☐ |

### 4.7 MasterModal

#### Visual (kế thừa từ Modal Blueprint)
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| V1 | Kích thước đúng variant (sm=640, md=960, lg=1400px) | ☐ |
| V2 | Radius = 24px | ☐ |
| V3 | Shadow = 0 20px 60px rgba(15,23,42,0.15) | ☐ |
| V4 | Overlay: rgba(15,23,42,0.45), backdrop-blur | ☐ |
| V5 | Z-index: overlay=1000, modal=1010 | ☐ |
| V6 | Header: white bg, 88px, icon 40x40 | ☐ |
| V7 | Footer: white bg, 72px, button gap 12px | ☐ |
| V8 | Body: padding 24px, scrollable | ☐ |

#### Behavior
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| B1 | Mở với animation (opacity + scale) | ☐ |
| B2 | Đóng với animation reverse | ☐ |
| B3 | Click overlay → đóng | ☐ |
| B4 | ESC key → đóng | ☐ |
| B5 | Focus trap inside modal | ☐ |
| B6 | Focus restore khi đóng | ☐ |
| B7 | Scroll lock on body | ☐ |
| B8 | Content stagger animation (children stagger 50ms) | ☐ |

#### Responsive
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| R1 | Mobile: 100vw x 100vh, radius 0 | ☐ |
| R2 | Tablet: adaptive width | ☐ |
| R3 | Body scroll khi content overflow | ☐ |

### 4.8 DataGrid

#### Visual
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| V1 | Header bg = #F8FAFC | ☐ |
| V2 | Header text = 12px/600, #64748B, UPPERCASE | ☐ |
| V3 | Header height = 44px | ☐ |
| V4 | Row height = 56px | ☐ |
| V5 | Row border-bottom = 1px solid #F1F5F9 | ☐ |
| V6 | Row hover bg = #FAFBFC | ☐ |
| V7 | Row text = 14px/500, #1E293B | ☐ |
| V8 | Pagination: 56px, gap 8px | ☐ |

#### Behavior
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| B1 | Sorting: click header → sort, indicator hiển thị | ☐ |
| B2 | Filter: filter panel hoạt động | ☐ |
| B3 | Pagination: prev/next/page, rows per page | ☐ |
| B4 | Selection: checkbox row selection | ☐ |
| B5 | Loading state: skeleton rows | ☐ |
| B6 | Empty state: EmptyState component | ☐ |
| B7 | Error state: ErrorState component | ☐ |
| B8 | Sticky header khi scroll | ☐ |

#### Responsive
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| R1 | Horizontal scroll trên mobile | ☐ |
| R2 | Column responsive (hide/show) | ☐ |

### 4.9 State Components

#### LoadingState
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| V1 | Skeleton animation (pulse) | ☐ |
| V2 | 3 rows: header skeleton + text skeleton x2 | ☐ |
| V3 | Width proportional to content | ☐ |

#### EmptyState
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| V1 | Icon = 64x64, color #CBD5E1 | ☐ |
| V2 | Title = 16px/600 | ☐ |
| V3 | Description = 14px/400 | ☐ |
| V4 | Action button (optional) | ☐ |

#### ErrorState
| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| V1 | Icon = 48x48, color #EF4444 | ☐ |
| V2 | Message = 14px/500 | ☐ |
| V3 | Retry button = PrimaryButton | ☐ |

---

## SECTION 5 — MASTER MODAL ACCEPTANCE

### 5.1 Modal Header

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| H1 | Background = #FFFFFF (không gradient) | ☐ |
| H2 | Title = 28px/700, #1E293B | ☐ |
| H3 | Description = 14px/400, #64748B (nếu có) | ☐ |
| H4 | Icon = 40x40 (nếu có) | ☐ |
| H5 | Close button (X icon) hoạt động | ☐ |
| H6 | Header divider = #F1F5F9 | ☐ |
| H7 | Stick to top khi body scroll | ☐ |

### 5.2 Modal Body

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| B1 | Padding = 24px (desktop), 32px (tablet), 20px (mobile) | ☐ |
| B2 | Scrollable khi content > max-height | ☐ |
| B3 | Background = #FFFFFF | ☐ |

### 5.3 Modal Footer

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| F1 | Background = #FFFFFF | ☐ |
| F2 | Height = 72px | ☐ |
| F3 | Padding = 16px 24px | ☐ |
| F4 | Button gap = 12px | ☐ |
| F5 | Button alignment: left=low emphasis, right=high emphasis | ☐ |
| F6 | Button order: [Secondary] [Ghost] [Primary/Danger] | ☐ |
| F7 | Stick to bottom khi body scroll | ☐ |

### 5.4 Section Box trong Modal

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| S1 | SectionBox có border + radius + shadow đúng | ☐ |
| S2 | SectionHeader có title + optional action button | ☐ |
| S3 | SectionContent chứa form/table/content | ☐ |
| S4 | Nhiều SectionBox: gap = 24px | ☐ |

### 5.5 Action Buttons trong Modal

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| A1 | Primary button: #6C4DFF bg, white text | ☐ |
| A2 | Secondary button: white bg, 1px border | ☐ |
| A3 | Ghost button: transparent bg | ☐ |
| A4 | Danger button: #EF4444 bg, white text | ☐ |
| A5 | Disabled state: opacity 0.5 | ☐ |
| A6 | Loading state: spinner | ☐ |
| A7 | onClick handler giữ nguyên | ☐ |

### 5.6 State Handling trong Modal

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| S1 | Loading state: skeleton hoặc spinner khi load data | ☐ |
| S2 | Empty state: EmptyState component khi không có data | ☐ |
| S3 | Error state: ErrorState component khi API fail | ☐ |
| S4 | Success state: notification/toast sau khi save | ☐ |

### 5.7 Responsive

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| R1 | Desktop (≥1280px): kích thước đúng variant | ☐ |
| R2 | Tablet (768-1279px): adaptive width | ☐ |
| R3 | Mobile (<768px): 100vw x 100vh, radius 0 | ☐ |
| R4 | Form fields stack trên mobile | ☐ |
| R5 | Buttons full-width trên mobile | ☐ |

### 5.8 Keyboard Navigation

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| K1 | Tab: navigate qua tất cả focusable elements | ☐ |
| K2 | Shift+Tab: navigate ngược lại | ☐ |
| K3 | ESC: close modal | ☐ |
| K4 | Enter: trigger primary action | ☐ |
| K5 | Focus trap: không thoát ra ngoài modal | ☐ |
| K6 | Focus restore: quay về element đã focus trước khi mở | ☐ |
| K7 | Focus visible: indicator hiển thị rõ | ☐ |

### 5.9 Overlay

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| O1 | Color: rgba(15,23,42,0.45) | ☐ |
| O2 | backdrop-filter: blur (nếu có) | ☐ |
| O3 | Z-index: 1000 | ☐ |
| O4 | Animation: fade in/out 200ms | ☐ |
| O5 | Click → close modal | ☐ |

---

## SECTION 6 — FORM ACCEPTANCE

### 6.1 Form Controls

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| F1 | Input: height=40px, radius=10px, border=1px #E2E8F0 | ☐ |
| F2 | Select: height=40px, radius=10px, dropdown z=1050 | ☐ |
| F3 | Picker: search + filter + pagination + keyboard | ☐ |
| F4 | DatePicker: calendar popup, min/max, keyboard | ☐ |
| F5 | Textarea: min-height=120px, resizable vertical | ☐ |

### 6.2 Validation

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| V1 | Required field: asterisk * + validation khi submit | ☐ |
| V2 | Format validation: email, phone, number, date | ☐ |
| V3 | Length validation: min/max length | ☐ |
| V4 | Pattern validation: regex | ☐ |
| V5 | Custom validation: business rules | ☐ |

### 6.3 Error Message

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| E1 | Error text = 12px/400, #EF4444 | ☐ |
| E2 | Error icon = warning/alert | ☐ |
| E3 | Error message = rõ ràng, cụ thể | ☐ |
| E4 | Error hiển thị dưới input | ☐ |
| E5 | Error có aria-live / aria-describedby | ☐ |
| E6 | Error focus management (scroll to first error) | ☐ |

### 6.4 Disabled State

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| D1 | Input: opacity-0.5, cursor not-allowed | ☐ |
| D2 | Select: không mở được dropdown | ☐ |
| D3 | Button: không click được, style đúng | ☐ |

### 6.5 Read Only State

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| R1 | Visual khác biệt với disabled | ☐ |
| R2 | Content có thể select/copy | ☐ |
| R3 | Không thể edit nhưng có thể focus | ☐ |

### 6.6 Navigation

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| N1 | Auto focus: input đầu tiên khi mở form | ☐ |
| N2 | Tab order: logical (top→bottom, left→right) | ☐ |
| N3 | Enter: submit form (nếu single field) | ☐ |
| N4 | ESC: close/cancel (trong modal context) | ☐ |

---

## SECTION 7 — DATA GRID ACCEPTANCE

### 7.1 Columns

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| C1 | Column header text = 12px/600, uppercase | ☐ |
| C2 | Column width phù hợp với content | ☐ |
| C3 | Column sort indicator (↑↓) hiển thị | ☐ |
| C4 | Column resize (nếu có) | ☐ |
| C5 | Column visibility toggle (nếu có) | ☐ |

### 7.2 Sorting

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| S1 | Click header → sort ascending | ☐ |
| S2 | Click again → sort descending | ☐ |
| S3 | Click again → remove sort | ☐ |
| S4 | Multi-column sort (nếu có) | ☐ |
| S5 | Sort indicator hiển thị | ☐ |

### 7.3 Filtering

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| F1 | Filter panel/input hiển thị | ☐ |
| F2 | Client-side filter hoạt động | ☐ |
| F3 | Server-side filter (API params) hoạt động | ☐ |
| F4 | Clear filter button | ☐ |
| F5 | Filter indicator trên column | ☐ |

### 7.4 Pagination

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| P1 | Previous/Next buttons | ☐ |
| P2 | Page number buttons | ☐ |
| P3 | Rows per page selector | ☐ |
| P4 | Total count hiển thị | ☐ |
| P5 | Current page highlighted | ☐ |

### 7.5 Selection

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| S1 | Checkbox ở header → select all | ☐ |
| S2 | Checkbox ở row → select single | ☐ |
| S3 | Selected rows highlighted | ☐ |
| S4 | Count selected hiển thị | ☐ |

### 7.6 Loading State

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| L1 | Skeleton rows (3 rows) khi initial load | ☐ |
| L2 | Spinner/indicator khi refresh/filter | ☐ |
| L3 | Pagination disabled khi loading | ☐ |

### 7.7 Empty State

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| E1 | EmptyState component hiển thị | ☐ |
| E2 | Icon + message + action button (nếu có) | ☐ |
| E3 | Thông báo rõ ràng (không "No data" generic) | ☐ |

### 7.8 Error State

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| E1 | ErrorState component hiển thị | ☐ |
| E2 | Retry button hoạt động | ☐ |
| E3 | Error message cụ thể | ☐ |

### 7.9 Sticky Header

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| S1 | Table header sticky khi scroll | ☐ |
| S2 | Header không bị lệch | ☐ |

### 7.10 Responsive

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| R1 | Horizontal scroll trên mobile | ☐ |
| R2 | Card view trên mobile (nếu có) | ☐ |
| R3 | Column priority (ẩn cột ít quan trọng) | ☐ |

---

## SECTION 8 — PICKER ACCEPTANCE

### 8.1 Chung cho tất cả Picker

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| P1 | Search input với debounce (300ms) | ☐ |
| P2 | Filter results realtime khi gõ | ☐ |
| P3 | Selection: click → select, click again → deselect | ☐ |
| P4 | Keyboard: ↑↓ navigate, Enter select, ESC close | ☐ |
| P5 | Pagination: load more / infinite scroll | ☐ |
| P6 | Loading state: spinner/skeleton khi search | ☐ |
| P7 | Empty state: "Không tìm thấy kết quả" | ☐ |
| P8 | Error state: retry khi API fail | ☐ |
| P9 | Performance: search response < 200ms | ☐ |
| P10 | Close khi click outside | ☐ |

### 8.2 Product Picker

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| PP1 | Search by name, code, barcode | ☐ |
| PP2 | Hiển thị: image (nếu có), name, code, price, stock | ☐ |
| PP3 | Stock quantity + unit hiển thị | ☐ |
| PP4 | Sold out items: disabled hoặc indicator | ☐ |

### 8.3 Customer Picker

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| CP1 | Search by name, phone, code | ☐ |
| CP2 | Hiển thị: name, phone, debt balance | ☐ |
| CP3 | Debt balance color: green (>=0), red (<0) | ☐ |

### 8.4 Supplier Picker

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| SP1 | Search by name, phone, code | ☐ |
| SP2 | Hiển thị: name, phone, address | ☐ |

### 8.5 Lot Picker

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| LP1 | Search by lot number | ☐ |
| LP2 | Hiển thị: lot number, expiry, quantity | ☐ |
| LP3 | Expiry date: color indicator (green=ok, yellow=soon, red=expired) | ☐ |
| LP4 | Quantity: remaining stock | ☐ |

### 8.6 Warehouse Picker

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| WP1 | Search by name, code | ☐ |
| WP2 | Hiển thị: name, code, address | ☐ |

---

## SECTION 9 — STATE ACCEPTANCE

### 9.1 Loading State

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| L1 | Skeleton animation (pulse) | ☐ |
| L2 | Kích thước phù hợp với content | ☐ |
| L3 | Không gây layout shift | ☐ |
| L4 | Timeout: nếu loading > 10s → show error | ☐ |

### 9.2 Error State

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| E1 | Error icon (48x48, #EF4444) | ☐ |
| E2 | Error message: rõ ràng, actionable | ☐ |
| E3 | Retry button: gọi lại API | ☐ |
| E4 | Không crash app | ☐ |

### 9.3 Empty State

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| ES1 | Icon (64x64, #CBD5E1) | ☐ |
| ES2 | Title: "Không có dữ liệu" (hoặc cụ thể hơn) | ☐ |
| ES3 | Description: hướng dẫn action | ☐ |
| ES4 | Action button: "Thêm mới" / "Tạo" (nếu có permission) | ☐ |

### 9.4 Success State

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| S1 | Toast/Notification hiển thị | ☐ |
| S2 | Message: "Thành công" cụ thể | ☐ |
| S3 | Auto-dismiss sau 3-5s | ☐ |
| S4 | Close button (nếu user muốn dismiss sớm) | ☐ |

### 9.5 Permission State

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| P1 | Button ẩn nếu không có permission | ☐ |
| P2 | Button disabled nếu không có permission | ☐ |
| P3 | Message: "Bạn không có quyền thực hiện" | ☐ |
| P4 | Không gọi API nếu không có permission | ☐ |

### 9.6 Offline State

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| O1 | Banner/message: "Mất kết nối mạng" | ☐ |
| O2 | Actions disabled nếu cần network | ☐ |
| O3 | Auto-retry khi có network | ☐ |

### 9.7 Refreshing State

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| R1 | Pull-to-refresh indicator | ☐ |
| R2 | Refresh button spinner | ☐ |
| R3 | Không xóa data cũ khi refreshing | ☐ |

### 9.8 Partial Data State

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| P1 | Loading spinner on specific section | ☐ |
| P2 | Gray/disabled placeholder for missing data | ☐ |
| P3 | Message: "Đang tải..." | ☐ |

---

## SECTION 10 — ACCESSIBILITY ACCEPTANCE

### 10.1 Keyboard Navigation

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| K1 | Tất cả interactive elements có thể Tab đến | ☐ |
| K2 | Tab order = visual order (top→bottom, left→right) | ☐ |
| K3 | Không focus trap (trừ modal) | ☐ |
| K4 | Focus không bị mất khi re-render | ☐ |

### 10.2 Focus Visible

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| F1 | Focus ring hiển thị rõ ràng | ☐ |
| F2 | Focus ring không bị hidden bởi overflow | ☐ |
| F3 | Focus ring contrast > 3:1 | ☐ |

### 10.3 ARIA Labels

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| A1 | Button: aria-label nếu icon-only | ☐ |
| A2 | Input: aria-label hoặc label liên kết | ☐ |
| A3 | Modal: aria-labelledby + aria-describedby | ☐ |
| A4 | Dialog: role="dialog" | ☐ |
| A5 | Alert: role="alert" | ☐ |

### 10.4 ARIA Roles

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| R1 | Navigation: role="navigation" | ☐ |
| R2 | Tab: role="tab" + aria-selected | ☐ |
| R3 | Tabpanel: role="tabpanel" | ☐ |
| R4 | Dialog: role="dialog" | ☐ |

### 10.5 Screen Reader Compatibility

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| S1 | aria-live regions for dynamic content | ☐ |
| S2 | aria-atomic for loading states | ☐ |
| S3 | aria-busy during async operations | ☐ |
| S4 | aria-describedby for error messages | ☐ |
| S5 | aria-required for required fields | ☐ |

### 10.6 Color Contrast

| # | Criteria | Ratio | PASS/FAIL |
|---|----------|-------|-----------|
| C1 | Text (≥18px) → background | ≥ 3:1 | ☐ |
| C2 | Text (<18px) → background | ≥ 4.5:1 | ☐ |
| C3 | Focus indicator → background | ≥ 3:1 | ☐ |
| C4 | Error text → background | ≥ 4.5:1 | ☐ |

### 10.7 Tab Navigation

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| T1 | Tab stops tại mỗi focusable element | ☐ |
| T2 | No tabindex > 0 (use DOM order) | ☐ |
| T3 | Tab không bị trapped outside modal | ☐ |

### 10.8 ESC Support

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| E1 | ESC → close modal | ☐ |
| E2 | ESC → close dropdown | ☐ |
| E3 | ESC → close popover | ☐ |
| E4 | ESC → close picker | ☐ |

---

## SECTION 11 — RESPONSIVE ACCEPTANCE

### 11.1 Desktop (≥1280px)

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| D1 | Layout full width (≤ container-xl) | ☐ |
| D2 | Modal size đúng variant | ☐ |
| D3 | DataGrid full columns | ☐ |
| D4 | Sidebar visible | ☐ |
| D5 | Multi-column form layouts | ☐ |

### 11.2 Tablet (768px - 1279px)

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| T1 | Layout adaptive (tablet breakpoint) | ☐ |
| T2 | Modal adaptive width | ☐ |
| T3 | DataGrid horizontal scroll | ☐ |
| T4 | Sidebar collapsible | ☐ |
| T5 | Form fields: 2 columns | ☐ |

### 11.3 Mobile (<768px)

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| M1 | Layout full width (100vw) | ☐ |
| M2 | Modal: 100vw x 100vh, radius 0 | ☐ |
| M3 | Touch targets ≥ 44x44px | ☐ |
| M4 | Bottom sheet layout cho pickers | ☐ |
| M5 | Single column forms | ☐ |

### 11.4 Layout Checks

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| L1 | Không horizontal overflow | ☐ |
| L2 | Spacing giảm trên mobile (body padding 20px) | ☐ |
| L3 | Text không bị truncate | ☐ |
| L4 | Images responsive | ☐ |

### 11.5 Scroll

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| S1 | Modal body scrollable | ☐ |
| S2 | DataGrid horizontal scrollable | ☐ |
| S3 | No scroll jank | ☐ |
| S4 | Smooth scrolling (nếu có) | ☐ |

### 11.6 Buttons

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| B1 | Full-width buttons trên mobile | ☐ |
| B2 | Button groups stack trên mobile | ☐ |
| B3 | Touch feedback (active state) | ☐ |

### 11.7 Tables

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| T1 | Horizontal scroll | ☐ |
| T2 | Sticky first column (nếu cần) | ☐ |
| T3 | Card view alternative (nếu có) | ☐ |

### 11.8 Forms

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| F1 | Single column trên mobile | ☐ |
| F2 | Input full width | ☐ |
| F3 | Label trên input (không bên cạnh) | ☐ |

---

## SECTION 12 — BUSINESS LOGIC PRESERVATION

### 12.1 API Requests

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| R1 | Request payload không thay đổi | ☐ |
| R2 | Request method không thay đổi | ☐ |
| R3 | Request headers không thay đổi | ☐ |
| R4 | Endpoint URL không thay đổi | ☐ |

### 12.2 API Responses

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| R1 | Response data được xử lý đúng | ☐ |
| R2 | Error handling không thay đổi | ☐ |
| R3 | Loading state handling không thay đổi | ☐ |

### 12.3 Validation Rules

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| V1 | Required fields: validation giữ nguyên | ☐ |
| V2 | Min/max values: giữ nguyên | ☐ |
| V3 | Pattern/regex: giữ nguyên | ☐ |
| V4 | Custom validation: giữ nguyên | ☐ |
| V5 | Validation timing (onBlur, onSubmit): giữ nguyên | ☐ |

### 12.4 Permission Rules

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| P1 | canCreate: giữ nguyên | ☐ |
| P2 | canEdit: giữ nguyên | ☐ |
| P3 | canDelete: giữ nguyên | ☐ |
| P4 | canView: giữ nguyên | ☐ |
| P5 | Role-based access: giữ nguyên | ☐ |

### 12.5 Workflow Rules

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| W1 | Luồng open → fill → validate → save → close: giữ nguyên | ☐ |
| W2 | Confirmation dialogs: giữ nguyên | ☐ |
| W3 | Navigation sau save: giữ nguyên | ☐ |
| W4 | Conditional logic (show/hide fields): giữ nguyên | ☐ |

### 12.6 Calculations

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| C1 | Price calculation: giữ nguyên | ☐ |
| C2 | Tax calculation: giữ nguyên | ☐ |
| C3 | Discount calculation: giữ nguyên | ☐ |
| C4 | Total/sum calculation: giữ nguyên | ☐ |
| C5 | Quantity calculation: giữ nguyên | ☐ |

### 12.7 Entity Mapping

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| E1 | Entity → display mapping: giữ nguyên | ☐ |
| E2 | Status mapping: giữ nguyên | ☐ |
| E3 | Enum/label mapping: giữ nguyên | ☐ |

### 12.8 Data Transformation

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| D1 | Date formatting: giữ nguyên | ☐ |
| D2 | Currency formatting: giữ nguyên | ☐ |
| D3 | Number formatting: giữ nguyên | ☐ |
| D4 | String transformation: giữ nguyên | ☐ |

---

## SECTION 13 — PERFORMANCE ACCEPTANCE

### 13.1 Modal Performance

| # | Metric | Target | PASS/FAIL |
|---|--------|--------|-----------|
| M1 | Modal open time | < 300ms | ☐ |
| M2 | Modal close time | < 200ms | ☐ |
| M3 | Animation FPS | ≥ 60fps | ☐ |
| M4 | Content render time | < 500ms | ☐ |
| M5 | No layout shift on open/close | CLS < 0.1 | ☐ |

### 13.2 Table Performance

| # | Metric | Target | PASS/FAIL |
|---|--------|--------|-----------|
| T1 | Initial render (100 rows) | < 500ms | ☐ |
| T2 | Sort time (1000 rows) | < 200ms | ☐ |
| T3 | Filter time (1000 rows) | < 300ms | ☐ |
| T4 | Pagination switch | < 100ms | ☐ |
| T5 | Scroll smoothness | 60fps | ☐ |

### 13.3 Picker Search Performance

| # | Metric | Target | PASS/FAIL |
|---|--------|--------|-----------|
| P1 | Search response (local) | < 100ms | ☐ |
| P2 | Search response (API) | < 500ms | ☐ |
| P3 | Debounce delay | 300ms | ☐ |
| P4 | Typeahead feedback | < 50ms | ☐ |

### 13.4 Page Performance

| # | Metric | Target | PASS/FAIL |
|---|--------|--------|-----------|
| P1 | Page initial render | < 1s | ☐ |
| P2 | Time to interactive | < 2s | ☐ |
| P3 | First contentful paint | < 1.5s | ☐ |
| P4 | Largest contentful paint | < 2.5s | ☐ |

### 13.5 Skeleton Loading

| # | Criteria | PASS/FAIL |
|---|----------|-----------|
| S1 | Skeleton hiển thị ngay lập tức (no blank screen) | ☐ |
| S2 | Skeleton kích thước khớp content | ☐ |
| S3 | Smooth transition từ skeleton → content | ☐ |

### 13.6 Virtual Scroll

| # | Criteria (nếu áp dụng) | PASS/FAIL |
|---|------------------------|-----------|
| V1 | Only visible rows rendered | ☐ |
| V2 | Scrollbar position chính xác | ☐ |
| V3 | Row height consistent | ☐ |
| V4 | No flicker on scroll | ☐ |

---

## SECTION 14 — REGRESSION TEST CHECKLIST

### 14.1 Checklist cho mỗi modal

Mỗi modal sau migration phải pass tất cả test sau. Đây là regression cốt lõi.

| # | Test | PASS/FAIL |
|---|------|-----------|
| RT01 | **Mở được**: modal mở đúng trigger (button click, link, etc.) | ☐ |
| RT02 | **Đóng được**: click X, click overlay, ESC | ☐ |
| RT03 | **Lưu được**: save/submit hoạt động, data persisted | ☐ |
| RT04 | **Sửa được**: edit form, cập nhật dữ liệu | ☐ |
| RT05 | **Xóa được**: delete confirmation, item removed | ☐ |
| RT06 | **Search được**: search input filter đúng kết quả | ☐ |
| RT07 | **Filter được**: filter controls hoạt động | ☐ |
| RT08 | **Export được**: export function trả về đúng dữ liệu (nếu có) | ☐ |
| RT09 | **In được**: print layout hiển thị đúng (nếu có) | ☐ |
| RT10 | **Permission đúng**: user thấy đúng action dựa trên role | ☐ |
| RT11 | **Validation đúng**: required, format, business rules | ☐ |
| RT12 | **Data integrity**: data không bị mất/sai sau migration | ☐ |
| RT13 | **API gọi đúng**: request payload và endpoint giữ nguyên | ☐ |
| RT14 | **State management**: React state không bị ảnh hưởng | ☐ |
| RT15 | **Notification**: success/error toast hiển thị | ☐ |

### 14.2 Checklist cho mỗi page

| # | Test | PASS/FAIL |
|---|------|-----------|
| RP01 | List load đúng dữ liệu | ☐ |
| RP02 | Pagination hoạt động | ☐ |
| RP03 | Sort hoạt động | ☐ |
| RP04 | Filter hoạt động | ☐ |
| RP05 | CRUD operations hoạt động | ☐ |
| RP06 | Permission applied đúng | ☐ |
| RP07 | Search hoạt động | ☐ |
| RP08 | Export hoạt động (nếu có) | ☐ |

### 14.3 Checklist cho mỗi form layout

| # | Test | PASS/FAIL |
|---|------|-----------|
| RF01 | Add item hoạt động | ☐ |
| RF02 | Edit item hoạt động | ☐ |
| RF03 | Delete item hoạt động | ☐ |
| RF04 | Save draft hoạt động | ☐ |
| RF05 | Submit hoạt động | ☐ |
| RF06 | Validation hoạt động | ☐ |
| RF07 | Calculated fields update đúng | ☐ |

---

## SECTION 15 — MIGRATION BATCH ACCEPTANCE

### 15.1 Định nghĩa Batch

Batch là một nhóm modal/component được migration trong cùng một phase.

| Phase | Nội dung | Số lượng |
|-------|----------|----------|
| Phase 0 | Foundation components (ActionButton, Input, SectionBox, State) | 13 components |
| Phase 1 | Core Framework (MasterModal, ModalHeader, ModalBody, ModalFooter) | 5 components |
| Phase 2 | Desktop POS Modals | 6 modals |
| Phase 3 | Shared Business Modals | 5 modals |
| Phase 4 | Page + Disposal Modals | 4 files |
| Phase 5 | Import Modals | 1 file |
| Phase 6 | Mobile Modals | 5 files |
| Phase 7 | Verification & Cleanup | — |

### 15.2 Batch Completion Criteria

Một batch được xem là **hoàn thành** khi **100%** items trong batch đạt:

| # | Criteria | Threshold | PASS/FAIL |
|---|----------|-----------|-----------|
| B1 | **Design System Compliance** | 100% PASS | ☐ |
| B2 | **Functional Test** | 100% PASS | ☐ |
| B3 | **Regression Test** (Section 14) | 100% PASS | ☐ |
| B4 | **Responsive Test** (Section 11) | 100% PASS | ☐ |
| B5 | **Accessibility Test** (Section 10) | 100% PASS | ☐ |
| B6 | **Performance Test** (Section 13) | 100% PASS | ☐ |
| B7 | **Business Logic Preservation** (Section 12) | 100% PASS | ☐ |
| B8 | **No Critical/High bugs** | 0 bugs | ☐ |

### 15.3 Batch Sign-off

Batch chỉ được merge khi có đủ chữ ký:
- [ ] Developer: code hoàn thành, self-review pass
- [ ] UI Reviewer: design system compliance pass
- [ ] QA: regression + functional test pass

### 15.4 Batch Rollback Criteria

Batch sẽ bị rollback nếu:
- Phát hiện Critical bug trong batch
- > 2 High severity bugs trong batch
- Business logic bị thay đổi ngoài ý muốn
- Performance degradation > 20%

---

## SECTION 16 — SYSTEM-WIDE ACCEPTANCE

### 16.1 Completion Criteria

Toàn bộ dự án migration UI được xem là **hoàn thành** khi:

| # | Criteria | Target | Measurement |
|---|----------|--------|-------------|
| S1 | **100% modal đạt chuẩn** | 28/28 modal | Design System Compliance Report |
| S2 | **100% component đạt chuẩn** | 18/18 foundation components | Component Audit Report |
| S3 | **100% page đạt chuẩn** | 10+ pages | Page Audit Report |
| S4 | **0 lỗi Critical** | 0 | Bug tracker |
| S5 | **0 lỗi High Severity** | 0 | Bug tracker |
| S6 | **Không có Design System Violation** | 0 | Audit Report |
| S7 | **100% regression pass** | all tests pass | Regression Suite |
| S8 | **100% accessibility pass** | all criteria pass | Accessibility Audit |
| S9 | **Performance within threshold** | all metrics pass | Performance Report |

### 16.2 Inventory Check

| Category | Total | PASS | FAIL | % Complete |
|----------|-------|------|------|------------|
| **Master Modal Blueprint** | 28 | — | — | — |
| **Foundation Components** | 18 | — | — | — |
| **Desktop POS Modals** | 6 | — | — | — |
| **Shared Business Modals** | 5 | — | — | — |
| **Disposal Modals** | 2 | — | — | — |
| **Import Modals** | 1 | — | — | — |
| **Page Modals** | 2 | — | — | — |
| **Mobile Modals** | 5 | — | — | — |
| **Form Layouts** | 3 | — | — | — |
| **Pages** | 10+ | — | — | — |
| **TOTAL** | **80+** | — | — | **0%** |

### 16.3 Quality Gates

```
Gate 1: Component Level
    ↓ 100% PASS
Gate 2: Modal Level
    ↓ 100% PASS
Gate 3: Batch Level
    ↓ 100% PASS
Gate 4: System Level
    ↓ 100% PASS
Gate 5: Release Ready
```

---

## SECTION 17 — RELEASE READINESS CHECKLIST

### 17.1 Pre-Release Checklist

Checklist cuối cùng trước khi merge bất kỳ batch nào vào production.

| # | Item | Checked By | Status |
|---|------|------------|--------|
| 1 | ☐ **Design Review Passed** | UI Reviewer | — |
| 2 | ☐ **QA Passed** | QA Engineer | — |
| 3 | ☐ **Regression Passed** | QA Engineer | — |
| 4 | ☐ **Accessibility Passed** | Accessibility Tester | — |
| 5 | ☐ **Responsive Passed** | UI Reviewer | — |
| 6 | ☐ **Performance Passed** | QA Engineer | — |
| 7 | ☐ **Product Owner Approved** | PO | — |
| 8 | ☐ **Migration Report Updated** | Developer | — |
| 9 | ☐ **No Critical Bugs** | QA Engineer | — |
| 10 | ☐ **No High Severity Bugs** | QA Engineer | — |
| 11 | ☐ **Business Logic Verified** | Developer | — |
| 12 | ☐ **Error Boundary Tested** | Developer | — |

### 17.2 Release Decision

| Criteria | Decision |
|----------|----------|
| All 12 items checked | ✅ **APPROVED** — Ready to merge |
| 1-2 items unchecked (non-blocker) | ⚠️ **CONDITIONAL** — PO must approve exceptions |
| ≥3 items unchecked OR any BLOCKER | ❌ **REJECTED** — Cannot merge |

---

## SECTION 18 — PASS / FAIL MATRIX

### 18.1 Định nghĩa

| Status | Định nghĩa | Hành động |
|--------|-----------|-----------|
| **✅ PASS** | Đạt toàn bộ tiêu chí trong section | Không cần action |
| **⚠️ CONDITIONAL PASS** | Có lỗi nhỏ nhưng được chấp nhận (non-functional: typo, spacing 1-2px lệch). Phải có PO approval. | Ghi nhận lỗi, follow-up sau |
| **❌ FAIL** | Không đạt chuẩn. Một hoặc nhiều tiêu chí không đáp ứng. | Không được merge. Phải fix trước. |
| **🚫 BLOCKER** | Không được phép release. Vi phạm Global Rules (Section 2) hoặc business logic. | Rollback ngay. Fix critical trước. |

### 18.2 Decision Matrix

| Section | PASS | CONDITIONAL PASS | FAIL | BLOCKER |
|---------|------|------------------|------|---------|
| Section 2 — Global Rules | All pass | N/A | N/A | Any violation |
| Section 3 — Design System | All pass | ≤ 2 minor token issues | > 2 token issues | Critical token mismatch |
| Section 4 — Component | All pass | ≤ 2 visual/behavior issues | > 2 issues | Missing component functionality |
| Section 5 — Modal | All pass | ≤ 3 issues | > 3 issues | Broken modal framework |
| Section 6 — Form | All pass | ≤ 2 issues | > 2 issues | Validation broken |
| Section 7 — DataGrid | All pass | ≤ 3 issues | > 3 issues | Data loss |
| Section 8 — Picker | All pass | ≤ 2 issues | > 2 issues | Search broken |
| Section 9 — State | All pass | ≤ 2 issues | > 2 issues | Crash on error |
| Section 10 — Accessibility | All pass | ≤ 3 issues (non-critical) | > 3 or any critical | Keyboard trap |
| Section 11 — Responsive | All pass | ≤ 2 layout shifts | > 2 or broken on mobile | Content hidden |
| Section 12 — Business Logic | All pass | N/A | Any change | BLOCKER |
| Section 13 — Performance | All pass | ≤ 1 metric slightly off | > 1 metric fails | Severe degradation |
| Section 14 — Regression | All pass | ≤ 2 minor issues | Any RT failure | Critical RT failure |

### 18.3 Tổng hợp kết quả

| System Component | Design System | Functional | Accessibility | Responsive | Performance | **OVERALL** |
|-----------------|---------------|------------|---------------|------------|-------------|-------------|
| MasterModal | — | — | — | — | — | **—** |
| PaymentModal | — | — | — | — | — | **—** |
| PromotionModal | — | — | — | — | — | **—** |
| PayDebtModal | — | — | — | — | — | **—** |
| ProductEditModal | — | — | — | — | — | **—** |
| TaxCalculationModal | — | — | — | — | — | **—** |
| DisposalDetailModal | — | — | — | — | — | **—** |
| BatchSelectionModal | — | — | — | — | — | **—** |
| ImportPreviewModal | — | — | — | — | — | **—** |
| DisposalFormLayout | — | — | — | — | — | **—** |
| ImportFormLayout | — | — | — | — | — | **—** |
| CountFormLayout | — | — | — | — | — | **—** |

---

## SECTION 19 — FINAL SIGN-OFF

### 19.1 Quy trình phê duyệt

```
┌──────────────────────────────────────────┐
│                                          │
│  STEP 1: DEVELOPER                       │
│  ├── Code migration hoàn thành           │
│  ├── Self-review theo Acceptance Criteria│
│  ├── Fix tất cả FAIL items               │
│  └── Ký: "Code Complete"                 │
│                                          │
│          ↓                               │
│                                          │
│  STEP 2: UI REVIEWER                     │
│  ├── Review Design System Compliance     │
│  ├── Review Visual Fidelity              │
│  ├── Review Responsive                   │
│  ├── Review Accessibility                │
│  └── Ký: "Design Approved"               │
│                                          │
│          ↓                               │
│                                          │
│  STEP 3: QA                              │
│  ├── Functional Test                     │
│  ├── Regression Test (Section 14)        │
│  ├── Performance Test (Section 13)       │
│  ├── Cross-browser Test                  │
│  └── Ký: "QA Passed"                     │
│                                          │
│          ↓                               │
│                                          │
│  STEP 4: PRODUCT OWNER                   │
│  ├── Review business logic preservation  │
│  ├── Review overall quality              │
│  ├── Approve/Reject conditional passes   │
│  └── Ký: "PO Approved"                   │
│                                          │
│          ↓                               │
│                                          │
│  STEP 5: RELEASE APPROVAL                │
│  ├── Release Readiness Checklist complete│
│  ├── No BLOCKER items                    │
│  ├── Migration Report updated            │
│  └── Ký: "RELEASED"                      │
│                                          │
└──────────────────────────────────────────┘
```

### 19.2 Sign-off Form

```
┌─────────────────────────────────────────────┐
│              SIGN-OFF FORM                   │
├─────────────────────────────────────────────┤
│                                             │
│ Batch/Component: __________________________  │
│ Date: ____________________________________  │
│                                             │
│ ──── DEVELOPER ────                         │
│ Name: ___________________________________  │
│ Signature: ______________________________  │
│ Date: __________________________________  │
│                                             │
│ ──── UI REVIEWER ────                       │
│ Name: ___________________________________  │
│ Signature: ______________________________  │
│ Date: __________________________________  │
│                                             │
│ ──── QA ────                                │
│ Name: ___________________________________  │
│ Signature: ______________________________  │
│ Date: __________________________________  │
│                                             │
│ ──── PRODUCT OWNER ────                     │
│ Name: ___________________________________  │
│ Signature: ______________________________  │
│ Date: __________________________________  │
│                                             │
│ ──── RELEASE APPROVAL ────                  │
│ Decision: [ ] APPROVED  [ ] REJECTED        │
│ Notes: __________________________________  │
│ Signature: ______________________________  │
│ Date: __________________________________  │
│                                             │
└─────────────────────────────────────────────┘
```

### 19.3 Exception Process

Nếu một item không đạt PASS nhưng vẫn cần release:

1. Developer ghi nhận FAIL items trong Migration Report
2. Đánh giá mức độ ảnh hưởng (Low/Medium/High/Critical)
3. Nếu **Critical** hoặc **High**: ❌ **KHÔNG** được release
4. Nếu **Low** hoặc **Medium**: PO có thể approve CONDITIONAL PASS
5. Exception phải được document và có kế hoạch fix

### 19.4 Post-Release

Sau khi release, trong vòng 48h:
- [ ] Monitoring: không có UI regression errors
- [ ] User feedback: không có negative feedback về UI
- [ ] Performance: metrics trong ngưỡng cho phép
- [ ] Hotfix ready: rollback plan available

---

## PHỤ LỤC

### A. Danh sách viết tắt

| Viết tắt | Ý nghĩa |
|----------|---------|
| AC | Acceptance Criteria |
| DS | Design System |
| DT | Design Token |
| PO | Product Owner |
| QA | Quality Assurance |
| RT | Regression Test |
| SSOT | Single Source of Truth |

### B. Tài liệu tham khảo

| File | Vai trò |
|------|---------|
| `/Master-design/MASTER_DESIGN_TOKENS_V1` | Design Tokens SSOT |
| `/Master-design/MASTER_TYPOGRAPHY_V1` | Typography SSOT |
| `/Master-design/MASTER_MODAL_BLUEPRINT_V1` | Modal Blueprint SSOT |
| `/Master-design/MASTER_ACTION_BUTTON_STANDARD_V1` | Button Standard SSOT |
| `/Master-design/MASTER_INPUT_STANDARD_V1` | Input Standard SSOT |
| `/Master-design/MASTER_SECTION_BOX_STANDARD_V1` | Section Box Standard SSOT |
| `/Master-design/MASTER_STATE_STANDARD_V1` | State Standard SSOT |
| `/Master-design/MASTER_ELEVATION_ZINDEX_STANDARD_V1` | Elevation & Z-Index SSOT |
| `/Master-design/MASTER_MOTION_ANIMATION_STANDARD_V1` | Motion & Animation SSOT |
| `/Master-design/MASTER_DATA_GRID_STANDARD_V1` | Data Grid Standard SSOT |
| `/Master-design/MASTER_PICKER_STANDARD_V1` | Picker Standard SSOT |
| `/Master-design/MASTER_NOTIFICATION_STANDARD_V1` | Notification Standard SSOT |
| `/Master-design/MASTER_STATUS_BADGE_STANDARD_V1` | Badge Standard SSOT |
| `/Master-design/MASTER_PAGE_LAYOUT_STANDARD_V1` | Page Layout Standard SSOT |
| `UI_MODAL_AUDIT_REPORT.md` | Audit report — current state |
| `UI_MODAL_MAPPING_REPORT.md` | Mapping report — old → new |
| `UI_MODAL_MIGRATION_PLAN.md` | Migration plan — per modal |
| `UI_MODAL_MIGRATION_MASTER_PLAN.md` | Master plan — full roadmap |
| `UI_DEPENDENCY_GRAPH.md` | Dependency graph — all components |

### C. Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| V1.0 | 2026-06-24 | System | Initial release — Full acceptance criteria for UI migration |

---

> **© 2026 VietSale Pro v7 — UI Migration Program**  
> *Tài liệu này là Single Source of Truth cho mọi quyết định PASS/FAIL trong quá trình migration UI.*  
> *Mọi thay đổi phải được phê duyệt bởi UI Lead và Product Owner.*