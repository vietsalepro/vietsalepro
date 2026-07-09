# HANDOFF UX-4 — Accessibility Audit, Responsive Polish & Micro-interactions

> **Handoff type:** AI Session (aisess)
> **From:** HANDOFF_UX_3_MODALS.md (và UX-1, UX-2 hoàn tất)
> **To:** Final — không có session tiếp theo
> **Ngày:** 2026-07-09

---

## Context

Session cuối cùng — audit và fix accessibility (WCAG 2.1 AA) cho tất cả components đã tạo/sửa từ UX-1,2,3. Đồng thời polish responsive mobile (card layout thay thế bảng), thêm stagger animation cho list items, và tối ưu empty/error states. Đây là session "quality gate" trước khi coi upgrade hoàn tất.

### Files cần đọc

| File | Mục đích | Priority |
|------|----------|----------|
| `design-system-tokens.css` | Kiểm tra contrast ratio, font sizes đáp ứng WCAG | **BẮT BUỘC** |
| `components/AdminShell.tsx` + `.css` | Audit layout, focus order, skip link | **BẮT BUỘC** |
| `components/AdminSidebar.tsx` + `.css` | Audit nav, aria-current, keyboard nav | **BẮT BUỘC** |
| `components/AdminKpiCards.tsx` + `.css` | Audit contrast, text size, responsive | **BẮT BUỘC** |
| `components/AdminTabs.tsx` + `.css` | Audit tab role, aria-selected, keyboard arrows | **BẮT BUỘC** |
| `components/DataGrid.tsx` + `.css` | Audit table semantics, sort announcements, row checkboxes | **BẮT BUỘC** |
| `components/AdvancedFilterPanel.tsx` + `.css` | Audit filter labels, focus management | **BẮT BUỘC** |
| `components/MasterModal.tsx` + `.css` | Audit dialog role, aria-modal, focus trap (đã làm 1 phần) | **BẮT BUỘC** |
| `components/ConfirmDialog.tsx` + `.css` | Audit alertdialog role, description | **BẮT BUỘC** |
| `components/ToastContainer.tsx` + `.css` | Audit live region, aria-live | **BẮT BUỘC** |
| `components/Toast.tsx` | Audit role status/alert | **BẮT BUỘC** |
| `components/SkeletonLoader.tsx` | Audit aria-busy, aria-label | Optional |
| `components/FormField.tsx` | Audit label+input association, error role (đã có role="alert") | **BẮT BUỘC** |
| `components/EmptyState.tsx` + `.css` | Audit heading level | Optional |
| `components/ErrorState.tsx` + `.css` | Audit error message, retry button label | Optional |
| `components/LoadingState.tsx` | Audit aria-busy | Optional |

### Files sẽ sửa trong session này (8+ files)

Tất cả các files trên đều có thể cần sửa nhỏ cho a11y/responsive/animation polish. Không tạo file mới.

---

## Current Status

Giả định UX-1, UX-2, UX-3 đã hoàn tất. Session này chỉ audit + fix các vấn đề còn sót:

- Các component mới có thể thiếu ARIA attributes
- Color contrast có thể chưa đạt WCAG AA (4.5:1 cho text thường, 3:1 cho text lớn)
- Mobile layout có thể vẫn dùng table (cần card layout alternative)
- Enter animation có thể chưa kiểm tra prefers-reduced-motion
- Missing keyboard shortcuts
- Thiếu skip-to-content link

---

## Steps to Execute

### Step 1: Accessibility Audit Checklist

Chạy qua từng component, kiểm tra các điểm sau:

#### 1A. Màu sắc & Contrast
- Text `--color-text-secondary` trên `--color-surface`: verify contrast ≥ 4.5:1
- Text `--color-text` trên `--color-bg`: verify contrast ≥ 4.5:1
- Primary button text (white?) trên `--color-primary`: verify contrast ≥ 4.5:1
- Error text `--color-error` trên `--color-surface`: verify contrast ≥ 4.5:1
- Focus ring: visible, contrast ≥ 3:1 với background (dùng `outline: 2px solid --color-primary`, `outline-offset: 2px`)

**Fix nếu cần**: điều chỉnh tokens trong `design-system-tokens.css` hoặc override trong component CSS. Không hardcode màu mới, chỉ điều chỉnh biến.

#### 1B. Keyboard Navigation
- [ ] AdminSidebar: menu items focusable, Enter/Space để chọn, Tab để di chuyển
- [ ] AdminTabs: role="tablist", role="tab" với aria-selected, Left/Right arrows chuyển tab
- [ ] DataGrid: sortable headers focusable, Enter/Space để sort, role="columnheader" với aria-sort
- [ ] DataGrid: checkbox cells focusable, Space để toggle
- [ ] AdvancedFilterPanel: pills focusable, × button có aria-label="Remove filter: {name}"
- [ ] MasterModal: focus trap (đã làm ở UX-3, verify), aria-modal="true", aria-labelledby
- [ ] ConfirmDialog: role="alertdialog", aria-describedby trỏ tới message
- [ ] Toast: dismiss button focusable, aria-label="Dismiss notification"

#### 1C. Screen Reader (ARIA)
- [ ] AdminSidebar: `role="navigation"`, `aria-label="Admin navigation"`, active item `aria-current="page"`
- [ ] AdminKpiCards: mỗi card là `article`, trend có `aria-label="Tăng 12% so với tháng trước"`
- [ ] DataGrid: `role="table"`, `aria-label="Tenant list"`, `aria-rowcount`, `aria-colcount`, sort announcement qua live region
- [ ] MasterModal: `aria-labelledby={titleId}`, `aria-describedby={bodyId}` nếu có description
- [ ] ToastContainer: `aria-live="polite"`, mỗi toast có `role="status"` (info/success) hoặc `role="alert"` (error/warning)
- [ ] SkeletonLoader: `aria-busy="true"`, `aria-label="Loading content"`
- [ ] EmptyState: heading level hợp lý (h2/h3), không skip heading level
- [ ] FormField: error connected với input qua `aria-describedby`

#### 1D. Focus Management
- [ ] Skip link: thêm skip-to-content link đầu trang (focusable, visible on focus, "Skip to main content")
- [ ] Page title: unique + descriptive (đã có "System Admin Dashboard")
- [ ] Focus visible: tất cả interactive elements có outline khi focus (dùng `:focus-visible`)

### Step 2: Skip Link + Focus Order

**Skip link** (thêm vào AdminShell):
```html
<a href="#admin-main-content" class="skip-link">
  Skip to main content
</a>
```

CSS:
```css
.skip-link {
  position: absolute;
  top: -100%;
  left: --space-md;
  padding: --space-sm --space-md;
  background: --color-primary;
  color: white;
  z-index: 10000;
  border-radius: --radius-sm;
}
.skip-link:focus {
  top: --space-sm;
}
```

**Focus order**: test Tab từ đầu trang → skip link → sidebar menu → main content → interactive elements trong content. Đảm bảo order hợp lý (không jump).

### Step 3: Responsive Mobile Polish

#### 3A. Tenants → Card Layout (Mobile <768px)

Trong DataGrid, thêm prop `mobileCards?: boolean` (default true). Khi màn hình <768px:

- Ẩn `<table>`, hiện card list:
```html
<div class="data-grid-cards">
  {data.map(row => (
    <div class="data-grid-card" key={row.id}>
      <div class="data-grid-card-header">
        <span class="data-grid-card-title">{row.name}</span>
        <StatusBadge status={row.status} />
      </div>
      <div class="data-grid-card-body">
        <div class="data-grid-card-field">
          <span class="label">Plan:</span>
          <span class="value">{row.plan}</span>
        </div>
        <!-- more fields as label: value pairs -->
      </div>
      <div class="data-grid-card-actions">
        <!-- row actions as icon buttons -->
      </div>
    </div>
  ))}
</div>
```

Card style:
- Background: `--color-surface`, border-radius: `--radius-md`, shadow: `--shadow-sm`
- Padding: `--space-md`, margin-bottom: `--space-sm`
- Title: `font-size: 15px`, `font-weight: 600`
- Fields: grid 2 cột `label: value`, label font-size 11px uppercase, value font-size 13px

#### 3B. KPI Cards Responsive

Verify responsive từ UX-1:
- Desktop (≥1024px): 4 cột
- Tablet (768-1023px): 2 cột
- Mobile (<768px): 1 cột
- Trên mobile, cards có thể swipe horizontal hoặc stack vertical

#### 3C. AdminTabs Mobile

Khi tabs overflow màn hình (<768px):
- Tab list `overflow-x: auto`, `scrollbar-width: none` (ẩn scrollbar)
- Swipe gesture để scroll tabs (touch-action: pan-x)
- Hoặc collapse thành dropdown "More..." cho tabs overflow

### Step 4: Stagger Animation cho Lists

Thêm stagger animation cho DataGrid rows và card lists (chỉ khi load lần đầu, không animate khi sort/filter):

```css
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.data-grid-tr--animate-in {
  animation: fade-in-up 200ms ease forwards;
  opacity: 0; /* start hidden */
}

/* Stagger delay cho mỗi row */
.data-grid-tr--animate-in:nth-child(1) { animation-delay: 0ms; }
.data-grid-tr--animate-in:nth-child(2) { animation-delay: 30ms; }
/* ... up to ~20 items */
```

Chỉ áp dụng class `--animate-in` khi `data` array thay đổi reference (lần đầu load). KHÔNG animate khi sort/paginate/filter. Dùng `useRef` track previous data reference.

`@media (prefers-reduced-motion: reduce)` → skip animation, set opacity: 1 trực tiếp.

### Step 5: Polish Empty & Error States

#### EmptyState
- Illustration style (đã làm ở UX-2, verify)
- Thêm `role="status"` nếu là dynamic empty (sau filter/search)
- Heading: h2 hoặc h3, không skip level
- Action button có aria-label rõ ràng: "Thêm tenant mới" thay vì "Add"

#### ErrorState
- Error icon: AlertCircle, màu `--color-error`, size 48px
- Error title: mô tả lỗi thân thiện "Không thể tải danh sách tenant", không phải raw error message
- Error detail: có thể collapse/expand để xem technical details
- Retry button: label rõ ràng "Thử lại", có keyboard shortcut (Ctrl+R không conflict)
- `role="alert"` để screen reader đọc ngay

### Step 6: Final Audit Table

Chạy audit checklist tổng:

| Check | Component | Status |
|-------|-----------|--------|
| Skip link | AdminShell | ☐ |
| aria-current | AdminSidebar | ☐ |
| role="tablist" + keyboard | AdminTabs | ☐ |
| role="table" + aria-sort | DataGrid | ☐ |
| aria-modal + focus trap | MasterModal | ☐ |
| role="alertdialog" | ConfirmDialog | ☐ |
| aria-live polite | ToastContainer | ☐ |
| role="status"/"alert" | Toast | ☐ |
| aria-busy | SkeletonLoader | ☐ |
| aria-describedby error | FormField | ☐ |
| Contrast ≥ 4.5:1 | All text | ☐ |
| Focus visible | All interactive | ☐ |
| prefers-reduced-motion | All animations | ☐ |
| Mobile card layout | DataGrid | ☐ |
| Responsive KPI | AdminKpiCards | ☐ |
| Stagger animation | DataGrid rows | ☐ |
| Empty state heading | EmptyState | ☐ |
| Error role="alert" | ErrorState | ☐ |

---

## Verification Checklist

- [ ] `npm run lint` — PASS
- [ ] `npm run build` — PASS
- [ ] `npx vitest run` — ALL TESTS PASS (không regression từ UI changes)
- [ ] Tab qua toàn bộ trang → focus order hợp lý, không skip, không trap ngoài modal
- [ ] Skip link: Tab đầu tiên → "Skip to main content" hiện, Enter → jump tới main
- [ ] AdminTabs: Left/Right arrows chuyển tab, Home/End jump first/last
- [ ] DataGrid: sortable column → Enter/Space để sort, aria-sort="ascending"/"descending" đúng
- [ ] Modal: Escape đóng, Tab loop bên trong, focus restore khi đóng
- [ ] Screen reader test: navigation có aria-current, table có rowcount/colcount, toast được đọc
- [ ] Mobile (<768px): DataGrid hiện card layout thay vì table
- [ ] prefers-reduced-motion: tất cả animation disabled
- [ ] Color contrast: dùng DevTools Axe/CSS Overview check contrast issues → không còn violation
- [ ] Toast live region: thêm toast → screen reader đọc message mà không cần focus

---

## Completion

Sau khi hoàn thành UX-4:

1. Toàn bộ 4 session UI/UX upgrade hoàn tất
2. Chạy `npm run lint && npm run build && npx vitest run` — tất cả PASS
3. Deploy lên Cloudflare Pages staging để test thực tế
4. Feedback từ người dùng → iterate nếu cần

**Tổng kết deliverables:**
- 14 files mới (AdminShell, AdminSidebar, AdminKpiCards, AdminTabs, ConfirmDialog, ToastContainer, Toast, SkeletonLoader, FormField + CSS)
- 7+ files sửa (SystemAdminDashboard, DataGrid, AdvancedFilterPanel, MasterModal, EmptyState + CSS)
- 0 file service/hook/supabase bị ảnh hưởng
