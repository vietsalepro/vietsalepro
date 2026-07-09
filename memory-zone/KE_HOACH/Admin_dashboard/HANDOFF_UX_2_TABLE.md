# HANDOFF UX-2 — Data Table Polish + Filter Redesign + Confirm Dialog

> **Handoff type:** AI Session (aisess)
> **From:** HANDOFF_UX_1_LAYOUT.md
> **To:** HANDOFF_UX_3_MODALS.md (next session, hoặc song song)
> **Ngày:** 2026-07-09

---

## Context

Session này nâng cấp DataGrid (bảng tenant chính), AdvancedFilterPanel (bộ lọc), và tạo ConfirmDialog (xác nhận xóa/suspend). DataGrid hiện tại đã có sort, pagination, row selection, nhưng còn thiếu density control, sticky columns, column visibility toggle, và filter UI chưa thân thiện.

### Files cần đọc trước khi bắt đầu

| File | Mục đích | Priority |
|------|----------|----------|
| `components/DataGrid.tsx` | Hiểu toàn bộ DataGrid API (props, state, render logic) | **BẮT BUỘC** |
| `components/DataGrid.css` | Hiểu CSS hiện tại của DataGrid | **BẮT BUỘC** |
| `components/AdvancedFilterPanel.tsx` | Hiểu filter UI hiện tại | **BẮT BUỘC** |
| `components/AdvancedFilterPanel.css` | Hiểu CSS filter hiện tại | **BẮT BUỘC** |
| `components/BatchActionsBar.tsx` + `.css` | Tham khảo batch action pattern | Optional |
| `components/EmptyState.tsx` + `.css` | Tham khảo empty state pattern | Optional |
| `design-system-tokens.css` | CSS variables | Nhắc lại nếu cần |

### Files sẽ tạo mới (2 files)

| File | Mô tả |
|------|-------|
| `components/ConfirmDialog.tsx` | Modal xác nhận: "Bạn có chắc muốn xóa 3 tenant?" |
| `components/ConfirmDialog.css` | CSS confirm dialog (animation, backdrop, buttons) |

### Files sẽ sửa (5 files)

| File | Mô tả |
|------|-------|
| `components/DataGrid.tsx` | Thêm density, sticky columns, column visibility, select all |
| `components/DataGrid.css` | CSS mới cho density variants, sticky, column toggle |
| `components/AdvancedFilterPanel.tsx` | Redesign: filter pills, saved filters, quick search |
| `components/AdvancedFilterPanel.css` | CSS mới: pill style, saved filter dropdown |
| `components/EmptyState.css` | Polish empty state với illustration style |

---

## Current Status

- `DataGrid.tsx` (~650 lines): có sort (click header), pagination (page size + navigation), row selection (checkbox), toolbar (search + filter toggle), loading/empty/error states
- Thiếu: density control (compact/default/comfortable), sticky header + sticky first column, column visibility toggle (show/hide columns), select all checkbox trong header
- `AdvancedFilterPanel.tsx`: có filter rules dạng row (field → operator → value), nhưng UI dạng form khô khan
- Chưa có ConfirmDialog — xóa tenant thường dùng window.confirm()

---

## Steps to Execute

### Step 1: Đọc DataGrid.tsx + DataGrid.css
Đọc kỹ 2 files để hiểu:
- Props interface (columns, data, pagination, sort, selection, loading, error, empty, toolbar, onRefresh)
- Render structure: toolbar → table header → rows → pagination footer
- State management: localSort, localSelection, localPage
- CSS classes hiện tại: `.data-grid`, `.data-grid-toolbar`, `.data-grid-table`, `.data-grid-th`, `.data-grid-td`, `.data-grid-pagination`

### Step 2: Thêm density control vào DataGrid

Thêm prop:
```ts
density?: 'compact' | 'default' | 'comfortable';
// default: 'default'
```

**CSS density variants** (trong DataGrid.css):
- `compact`: row height 36px, cell padding 6px 8px, font-size 12px
- `default`: row height 44px, cell padding 10px 12px, font-size 13px
- `comfortable`: row height 56px, cell padding 14px 16px, font-size 14px

Thêm density toggle trong toolbar: 3 icon buttons (Rows3 cho compact, Rows4 cho default, Rows5 cho comfortable) — active state outline.

Dùng CSS class `.data-grid--compact`, `.data-grid--comfortable` trên container (default không cần class).

### Step 3: Thêm sticky header + sticky first column

**Sticky header** (thead sticky):
```css
.data-grid-table thead {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--color-surface);
}
.data-grid-table thead th {
  border-bottom: 2px solid var(--color-border);
}
```

**Sticky first column** (thường là checkbox hoặc tenant name):
Thêm prop vào Column definition:
```ts
sticky?: 'left' | 'right';
```

CSS:
```css
.data-grid-td--sticky-left,
.data-grid-th--sticky-left {
  position: sticky;
  left: 0;
  z-index: 1;
  background: var(--color-surface);
}
/* Add shadow khi scroll để phân biệt sticky column */
.data-grid--scrolled-right .data-grid-td--sticky-left,
.data-grid--scrolled-right .data-grid-th--sticky-left {
  box-shadow: 2px 0 4px rgba(0,0,0,0.08);
}
```

Detect scroll bằng IntersectionObserver trên sentinel element ở cột đầu tiên không-sticky.

### Step 4: Thêm column visibility toggle

Thêm dropdown trong toolbar: icon `Columns3` → click mở dropdown checklist các cột.

```tsx
const [visibleColumns, setVisibleColumns] = useState<string[]>(
  columns.map(c => c.key)
);
```

Dropdown render:
- Checkbox list tất cả columns (key + header label)
- "Show all" / "Hide all" quick actions
- Áp dụng: filter `columns` trước khi render header + rows

Style dropdown:
- Position absolute dưới icon, right-aligned
- Width 220px, max-height 320px, overflow-y auto
- Background `--color-surface`, border-radius `--radius-md`, shadow `--shadow-lg`
- Đóng khi click outside (dùng useClickOutside hook hiện có)

### Step 5: Thêm select-all checkbox trong header

Thêm checkbox trong `<th>` đầu tiên (nếu `selectable` prop true):
```tsx
<th className="data-grid-th data-grid-th--checkbox">
  <input type="checkbox" 
    checked={selection === 'all' || (Array.isArray(selection) && selection.length === data.length)}
    onChange={handleSelectAll}
    aria-label="Select all rows"
  />
</th>
```

`handleSelectAll`: toggle giữa `'all'` và `[]`.

Indeterminate state (một số row được chọn, không phải tất cả): set `ref.indeterminate = true` trên checkbox DOM element.

### Step 6: Redesign AdvancedFilterPanel

Thay đổi từ form-style sang **filter pills + saved filters**:

**Filter Pills** (trên cùng):
```
[ Status: Active ▼ ] [ Plan: Pro ▼ ] [ Created: Last 30 days ▼ ] [ + Add Filter ]
```

Mỗi pill:
- Background `--color-bg`, border `1px solid --color-border`, border-radius `--radius-lg`
- Padding `4px 8px 4px 12px`, font-size 13px
- Nội dung: `label: value` + dropdown arrow + nút × để xóa
- Click vào value → mở mini dropdown chọn operator/value
- `+ Add Filter` button: dashed border, click → mở field picker

**Saved Filters** (bên phải toolbar):
```
[ Saved Filters ▼ ]  → dropdown list: "Active Pro Tenants", "Overdue Payments", "New This Week"
```

Saved filters lưu vào localStorage (client-side only):
```ts
interface SavedFilter {
  id: string;
  name: string;
  rules: FilterRule[];
}
```

Toolbar layout mới:
```
[ Quick Search input ] [ Filter Pills row ] [ Saved Filters ▼ ] [ Density toggle ] [ Columns ▼ ]
```

**Quick Search**: input text nhỏ (200px), search icon bên trái, placeholder "Tìm tenant...", debounce 300ms → callback `onSearch(term)`.

### Step 7: Tạo ConfirmDialog.tsx + ConfirmDialog.css

**Props**:
```ts
interface ConfirmDialogProps {
  open: boolean;
  title: string;               // "Xác nhận xóa tenant"
  message: string;             // "Bạn có chắc muốn xóa 3 tenant đã chọn? Hành động này không thể hoàn tác."
  confirmLabel?: string;       // "Xóa" (default: "Xác nhận")
  cancelLabel?: string;        // "Hủy" (default: "Hủy")
  variant?: 'danger' | 'warning' | 'info'; // default: 'danger'
  loading?: boolean;           // hiện spinner trên confirm button
  onConfirm: () => void;
  onCancel: () => void;
}
```

**CSS spec**:
- Overlay: `background: rgba(0,0,0,0.5)`, `backdrop-filter: blur(2px)`
- Dialog: width `400px`, max-width `90vw`, `border-radius: --radius-lg`, `padding: --space-xl`, `background: --color-surface`, `box-shadow: --shadow-lg`
- Animation: fade in + scale từ 0.95 → 1, duration 150ms (tôn trọng prefers-reduced-motion → no animation)
- Title: `font-size: 18px`, `font-weight: 600`, `margin-bottom: --space-md`
- Message: `font-size: 14px`, `color: --color-text-secondary`, `line-height: 1.6`
- Icon: phía trên title — AlertTriangle (warning), AlertCircle (danger), Info (info)
- Buttons: flex row, gap `--space-sm`, justify `flex-end`
  - Cancel: `variant: 'secondary'` (màu `--color-bg`, border `--color-border`)
  - Confirm: màu theo variant (`--color-error` cho danger, `--color-warning` cho warning)
- Keyboard: Escape → onCancel, Enter → onConfirm
- Focus trap: focus tự động vào Cancel button khi mở

### Step 8: Polish EmptyState.css

Nâng cấp EmptyState hiện có:
- Thêm CSS custom property `--empty-icon-size: 48px`
- Icon style: `opacity: 0.4`, `margin-bottom: --space-md`
- Illustration wrapper: `width: 120px`, `height: 120px`, `border-radius: 50%`, `background: --color-bg`, flex center icon
- Title: `font-size: 16px`, `font-weight: 600`
- Description: `font-size: 13px`, `color: --color-text-secondary`, `max-width: 320px`, `text-align: center`
- Action button: margin-top `--space-lg`

---

## Verification Checklist

- [ ] `npm run lint` — PASS
- [ ] `npm run build` — PASS
- [ ] DataGrid density: toggle 3 modes → row height thay đổi đúng (36/44/56px)
- [ ] DataGrid sticky: scroll ngang → cột đầu tiên giữ nguyên, có shadow phân cách
- [ ] DataGrid column toggle: bỏ chọn 1 cột → cột đó biến mất khỏi bảng
- [ ] DataGrid select all: click checkbox header → tất cả row được chọn, indeterminate hiển thị đúng
- [ ] AdvancedFilterPanel: pills hiển thị đúng, click × xóa pill, + Add Filter mở field picker
- [ ] Saved Filters: lưu filter, reload trang → vẫn còn trong localStorage, chọn lại được
- [ ] ConfirmDialog: mở → Escape đóng, Enter confirm, click backdrop đóng, loading spinner trên confirm button
- [ ] EmptyState: illustration style đẹp hơn, action button rõ ràng

---

## Handoff cho session tiếp theo

Session **UX-3** (`HANDOFF_UX_3_MODALS.md`) có thể chạy song song với UX-2 vì không phụ thuộc DataGrid changes. Nếu đã chạy song song, skip. Nếu chưa, session UX-3 cần đọc `MasterModal.tsx`.

**Files UX-3 cần đọc thêm:** `components/MasterModal.tsx`, `components/MasterModal.css`, `components/LoadingState.tsx`