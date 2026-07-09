# HANDOFF UX-3 — Modals, Forms, Toast Notifications & Skeleton Loading

> **Handoff type:** AI Session (aisess)
> **From:** HANDOFF_UX_2_TABLE.md (có thể chạy song song)
> **To:** HANDOFF_UX_4_A11Y.md (next session)
> **Ngày:** 2026-07-09

---

## Context

Session này nâng cấp MasterModal (animation, sizes, keyboard UX), tạo Toast notification system, SkeletonLoader cho loading states, và FormField component chuẩn hóa. Đây là session "feedback & polish" — mọi tương tác với người dùng (mở modal, submit form, loading, success/error) đều được cải thiện.

### Files cần đọc trước khi bắt đầu

| File | Mục đích | Priority |
|------|----------|----------|
| `components/MasterModal.tsx` | Hiểu toàn bộ MasterModal API (props, sizes, sections, footer) | **BẮT BUỘC** |
| `components/MasterModal.css` | Hiểu CSS modal hiện tại (animation, overlay, sizes) | **BẮT BUỘC** |
| `components/LoadingState.tsx` + `.css` | Tham khảo loading pattern hiện có | Optional |
| `components/ModalSection.tsx` | Hiểu section layout trong modal | Optional |
| `components/ModalInfoGrid.tsx` | Hiểu info grid trong modal | Optional |
| `design-system-tokens.css` | CSS variables | Nhắc lại nếu cần |

### Files sẽ tạo mới (8 files)

| File | Mô tả |
|------|-------|
| `components/ToastContainer.tsx` | Container fixed bottom-right, stack toasts với animation |
| `components/ToastContainer.css` | CSS cho toast stack, enter/exit animation |
| `components/Toast.tsx` | Single toast: icon + message + dismiss button + progress bar |
| `components/SkeletonLoader.tsx` | Skeleton component: text lines, cards, table rows, custom shapes |
| `components/SkeletonLoader.css` | CSS skeleton shimmer animation |
| `components/FormField.tsx` | Wrapper chuẩn cho form fields: label + error + hint + required indicator |
| `components/FormField.css` | CSS form field spacing, error state, label layout |

### Files sẽ sửa (2 files)

| File | Mô tả |
|------|-------|
| `components/MasterModal.tsx` | Thêm animation, 5 preset sizes, keyboard trap, focus restore |
| `components/MasterModal.css` | CSS animation keyframes, size variants, responsive fullscreen |

---

## Current Status

- `MasterModal.tsx`: modal đa năng, có header/body/footer sections, size props (`sm`, `md`, `lg`, `xl`, `full`, `auto`), close button + Escape key, click-outside-to-close
- Thiếu: enter/exit animation (chỉ fade đơn giản), keyboard focus trap (Tab không bị lock trong modal), focus restore (sau khi đóng modal, focus không về element gốc), scroll lock body
- Chưa có Toast system — success/error feedback thường dùng alert() hoặc inline message
- Chưa có SkeletonLoader — loading state là spinner đơn giản
- Form fields không có chuẩn chung — mỗi component tự render label + error

---

## Steps to Execute

### Step 1: Đọc MasterModal.tsx + MasterModal.css
Đọc kỹ để hiểu:
- Props: `open`, `onClose`, `title`, `size`, `children` (dùng ModalSection components)
- Render: overlay → modal container → header (title + close btn) → body → footer
- Current CSS: `.master-modal-overlay`, `.master-modal`, `.master-modal-header`, `.master-modal-body`, `.master-modal-footer`
- Size classes: `.master-modal--sm`, `--md`, `--lg`, `--xl`, `--full`, `--auto`

### Step 2: Thêm animation cho MasterModal

**Enter animation** (mở modal):
```css
@keyframes modal-enter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes overlay-enter {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .master-modal-overlay,
  .master-modal {
    animation: none;
  }
}
```

**Exit animation** (đóng modal): dùng CSS transition + đợi animation end rồi mới unmount.
```css
.master-modal-overlay--closing {
  animation: overlay-exit 150ms ease forwards;
}
.master-modal--closing {
  animation: modal-exit 150ms ease forwards;
}
```

Implementation: state `closing` trong MasterModal, khi onClose → setClosing(true) → setTimeout 150ms → setClosing(false) + onClose().

### Step 3: Cải thiện sizes + responsive

**Preset sizes chuẩn hóa**:
| Size | Width | Max-height | Dùng cho |
|------|-------|------------|----------|
| `xs` | 360px | 80vh | Confirm dialog, quick edit |
| `sm` | 480px | 80vh | Form đơn giản |
| `md` | 640px | 85vh | Form chi tiết |
| `lg` | 800px | 85vh | Bảng, invoice |
| `xl` | 1024px | 90vh | Multi-section form |
| `full` | 100vw | 100vh | Fullscreen editor |

Responsive cho mobile (<768px):
- Tất cả sizes trở thành `width: 100vw`, `height: 100vh` (fullscreen)
- `border-radius: 0`
- Header có nút Back thay vì ×
- Swipe-down gesture để đóng (optional, CSS touch-action)

### Step 4: Keyboard UX improvement

**Focus trap** trong modal:
```tsx
// Trong useEffect khi open=true
// 1. Lưu document.activeElement (element được focus trước khi mở modal)
// 2. Focus vào element đầu tiên có thể focus trong modal (hoặc close button)
// 3. Tab/Shift+Tab loop trong modal (focus không escape ra ngoài)
// 4. Khi close, restore focus về saved element
```

Dùng querySelectorAll tìm tất cả focusable elements trong modal: `'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'`.

First/last element border — nếu Tab ở last → focus first, Shift+Tab ở first → focus last.

**Scroll lock body**: khi modal open → `document.body.style.overflow = 'hidden'` (lưu original overflow để restore khi close).

### Step 5: Tạo ToastContainer + Toast

**Architecture**:
```
ToastContainer (fixed bottom-right, z-index 9999)
  └── Toast[] (stack dọc, newest ở bottom)
       └── icon + message + dismiss button + progress bar
```

**ToastContainer.tsx**:
- Nhận toasts qua context hoặc props
- Render tối đa 5 toasts (FIFO, oldest auto-dismiss sau 5s)
- Position: `fixed`, `bottom: --space-xl`, `right: --space-xl`
- Stack: `flex flex-col-reverse gap-2` (newest ở dưới cùng)

**Toast.tsx** props:
```ts
interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;     // ms, default 5000, 0 = persistent
  onDismiss: (id: string) => void;
}
```

**Toast CSS**:
- Width: `360px`, max-width: `calc(100vw - 2 * var(--space-xl))`
- Background: `--color-surface`, border-radius: `--radius-md`, shadow `--shadow-lg`
- Border-left 4px, màu theo type (success=green, error=red, warning=amber, info=blue)
- Layout: [icon 20px] [content flex-1] [× dismiss button]
- **Progress bar**: thin bar (2px) bottom, animate width 100%→0% trong `duration` ms, màu theo type
- **Enter animation**: slide in từ right + fade, 200ms ease-out
- **Exit animation**: slide out right + fade + collapse height, 200ms ease-in

**Toast Context** (export hook `useToast`):
```ts
const { addToast } = useToast();
addToast({ type: 'success', message: 'Đã xóa 3 tenant thành công' });
addToast({ type: 'error', title: 'Lỗi', message: 'Không thể kết nối server' });
```

Context provider wrap trong AdminShell để tất cả section dùng được.

### Step 6: Tạo SkeletonLoader.tsx + SkeletonLoader.css

**Props**:
```ts
interface SkeletonProps {
  variant: 'text' | 'card' | 'table-row' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
  lines?: number;         // cho text variant: số dòng
  rows?: number;          // cho table-row variant: số rows
  cards?: number;         // cho card variant: số cards
}
```

**Preset variants**:

- `text`: N dòng (mỗi dòng width random 60-100%, height 14px, gap 8px, dòng cuối width 40%)
- `card`: Grid N cards (mỗi card: rect top cho image + 3 text lines, border-radius, shadow placeholder)
- `table-row`: N rows (mỗi row: checkbox circle + rects giả lập columns)
- `circle`: Avatar placeholder (width=height, border-radius 50%)
- `rect`: Custom rectangle (width × height)

**CSS shimmer animation**:
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-border) 0%,
    var(--color-bg) 40%,
    var(--color-border) 80%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: var(--color-border);
  }
}
```

### Step 7: Tạo FormField.tsx + FormField.css

**Props**:
```ts
interface FormFieldProps {
  label: string;
  htmlFor?: string;          // for attribute cho <label>
  required?: boolean;        // hiện dấu * đỏ
  error?: string;            // error message từ validation
  hint?: string;             // helper text dưới input
  children: React.ReactNode; // input/select/textarea element
}
```

Render:
```html
<div class="form-field [form-field--error]">
  <label for="htmlFor" class="form-field-label">
    {label}
    {required && <span class="form-field-required" aria-hidden="true">*</span>}
  </label>
  <div class="form-field-control">
    {children}  <!-- input element -->
  </div>
  {hint && <p class="form-field-hint">{hint}</p>}
  {error && <p class="form-field-error" role="alert">{error}</p>}
</div>
```

**CSS spec**:
- Label: `font-size: 13px`, `font-weight: 500`, `color: --color-text`, `margin-bottom: --space-xs`
- Required star: `color: --color-error`, `margin-left: 2px`
- Error message: `font-size: 12px`, `color: --color-error`, `margin-top: --space-xs`, icon AlertCircle 12px
- Hint text: `font-size: 12px`, `color: --color-text-secondary`, `margin-top: --space-xs`
- Error state trên field wrapper: input border tự động đỏ nếu có `--error` modifier
- Spacing giữa các form fields: `margin-bottom: --space-lg`

**Accessibility**:
- Label dùng `<label htmlFor={htmlFor}>` để click label → focus input
- Error message có `role="alert"` để screen reader đọc khi xuất hiện
- Required indicator dùng `aria-hidden="true"` (không đọc "*")

---

## Verification Checklist

- [ ] `npm run lint` — PASS
- [ ] `npm run build` — PASS
- [ ] MasterModal animation: mở → fade + scale mượt (150ms), đóng → reverse
- [ ] MasterModal sizes: test xs (360px), sm (480px), md (640px), lg (800px), mobile fullscreen
- [ ] MasterModal keyboard: Tab loop trong modal, Escape đóng, focus restore sau đóng
- [ ] MasterModal scroll lock: mở modal → body không scroll được
- [ ] Toast: addToast success → toast slide in bottom-right, progress bar countdown, auto-dismiss
- [ ] Toast: addToast error → border-left đỏ, icon XCircle, tự dismiss sau 8s
- [ ] Toast: max 5 visible, oldest removed khi vượt quá
- [ ] SkeletonLoader: `variant="text" lines=3` → 3 dòng shimmer, dòng cuối ngắn
- [ ] SkeletonLoader: `variant="table-row" rows=5` → 5 rows skeleton giống table structure
- [ ] SkeletonLoader: prefers-reduced-motion → static gray, không shimmer
- [ ] FormField: label + required star + input slot + error message role="alert"
- [ ] FormField: click label → focus input (htmlFor linkage)

---

## Handoff cho session tiếp theo

Session **UX-4** (`HANDOFF_UX_4_A11Y.md`) là session cuối cùng — audit accessibility toàn bộ components từ UX-1,2,3 + responsive mobile + animation polish.

**Files UX-4 cần đọc:** tất cả files đã tạo/sửa từ UX-1,2,3 + `design-system-tokens.css`