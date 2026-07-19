# DATA_TABLE_RETURN.md — MODAL-MASTER-STYLE

## Box chính — Bảng dữ liệu phiếu trả hàng (Return Orders Data Table)

Version: 1.0
Scope: **Modal only** (Box chính được thiết kế để nằm trong `MasterModal` body). Có thể tái sử dụng trên page.
Source: `REPORT_DESIGN_RETURN.md` § I.[C] + `pages/ReturnOrders.tsx` lines 2077–2366.

---

## 1. Purpose

Quy chuẩn **Box chính chứa bảng dữ liệu** cho danh sách phiếu trả hàng trong modal:

- Container trắng, bo góc, shadow nhẹ, border mảnh
- 2 chế độ render: `DataGrid` (V2) và `table` truyền thống (V1)
- Cột: Checkbox, Mã phiếu, Khách hàng, Ngày tạo, Tiền hoàn, Tiền mặt/Giảm nợ, Trạng thái, Thao tác
- Status badge theo `MASTER_STATUS_BADGE_STANDARD`
- Action column: Xem, In, Hủy (icon-only)
- Empty state khi không có dữ liệu

---

## 2. Master Structure

```text
<MasterModal>
  <ModalBody>
    <DataTableBox>
      ├─ (V2) DataGrid
      │     ├─ GridToolbar (search + filter + action)
      │     ├─ GridTable
      │     ├─ GridPagination
      │     └─ EmptyState
      └─ (V1) Table
            ├─ TableWrapper (overflow-x-auto)
            │     ├─ TableHeader (sticky)
            │     └─ TableBody
            ├─ EmptyState
            └─ PaginationToolbar
    </DataTableBox>
  </ModalBody>
</MasterModal>
```

---

## 3. Visual Tokens

### 3.1. Box Container

| Token | Value | Tailwind |
|-------|-------|----------|
| Background | White | `bg-white` |
| Border | 1px solid #F1F5F9 — per MASTER_SECTION_BOX_STANDARD_V1 | `border border-slate-100` |
| Radius | 24px — per MASTER_TABLE_STANDARD (container) | `rounded-3xl` |
| Shadow | soft — per MASTER_SECTION_BOX_STANDARD_V1 | `shadow-[0_2px_8px_rgba(15,23,42,0.03)]` |
| Padding | 24px | `p-6` |
| Overflow | hidden | `overflow-hidden` |

### 3.2. Table Header (V1)

| Token | Value | Tailwind |
|-------|-------|----------|
| Row height | 52px | `h-[52px]` |
| Font | 13px, uppercase, weight 600, color #334155 — per MASTER_TABLE_STANDARD | `text-[13px] uppercase font-semibold text-slate-700 tracking-[0.2px]` |
| Cell padding | `px-5 py-4` (16px×20px) — per MASTER_TABLE_STANDARD | `px-5 py-4` |
| Align text | left (default) | `text-left` |
| Align number | right | `text-right` |
| Align status | center | `text-center` |
| Hover header | text slate-600 | `hover:text-slate-600 cursor-pointer transition-colors` |
| Checkbox column | w-12, pl-5 | `w-12 h-[52px] pl-5` |
| Action column | pr-5, text-right | `h-[52px] pr-5 text-right` |

### 3.3. Table Row (V1)

| Token | Value | Tailwind |
|-------|-------|----------|
| Row hover | #FAFBFC — per MASTER_TABLE_STANDARD | `group hover:bg-[#FAFBFC] transition-[150ms] cursor-pointer` |
| Row height | 56px — per MASTER_TABLE_STANDARD | `h-[56px]` |
| Cell padding | 16px 20px — per MASTER_TABLE_STANDARD | `py-4 px-5` |
| Checkbox cell | pl-5 | `h-[56px] pl-5` |
| Action cell | pr-5, text-right | `h-[56px] pr-5 text-right` |
| Divider | divide-slate-50 | `divide-y divide-slate-50` |
| Cursor | pointer | `cursor-pointer` |

### 3.4. Column Specifics (V1)

| Cột | Nội dung | Style |
|-----|----------|-------|
| **Mã phiếu** | Avatar tròn tím + mã | `w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center`, icon `w-4 h-4 text-purple-500`, text `text-sm font-semibold text-gray-900 hover:underline` |
| **Khách hàng** | Tên + SĐT | tên `text-sm font-medium text-slate-700 group-hover:text-purple-600 transition-colors`, SĐT `text-xs text-slate-400 mt-0.5` |
| **Ngày tạo** | Ngày + giờ | ngày `text-sm text-slate-500`, giờ `text-xs text-slate-400 mt-0.5` |
| **Tiền hoàn** | Số tiền, right | `text-sm font-semibold text-right`, màu đỏ nếu > 0, ngược lại emerald |
| **Tiền mặt / Giảm nợ** | TM + Nợ | TM `text-sm font-medium text-emerald-600`, Nợ `text-xs text-amber-600 mt-0.5` |
| **Trạng thái** | Badge | `<StatusBadge />` theo `MASTER_STATUS_BADGE_STANDARD` |
| **Thao tác** | Icon buttons | container `inline-flex items-center gap-1`, button `p-2 rounded-lg text-slate-400 hover:text-{semantic} hover:bg-{semantic}-50 transition` |

### 3.5. Action Buttons (V1)

| Action | Icon | Hover color | Hover bg |
|--------|------|-------------|----------|
| Xem chi tiết | `FileText` | `text-slate-600` | `bg-slate-100` |
| In phiếu | `Printer` | `text-purple-600` | `bg-purple-50` |
| Hủy phiếu | `Trash2` | `text-red-600` | `bg-red-50` |

Button size: `p-2` (32×32 effective), icon `w-4 h-4`.

### 3.6. DataGrid V2 (when `useNewDataGridReturnOrders`)

- Sử dụng component `DataGrid` đã có.
- Toolbar tích hợp: search, filter, bulk action, create.
- Columns định nghĩa qua `returnOrderColumns`.
- Pagination object `{ currentPage, totalPages, totalCount, pageSize, onPageChange }`.
- Empty state qua props `emptyTitle`, `emptyDescription`, `emptyAction`.

See `MASTER_DATA_GRID_STANDARD_V1` for full DataGrid rules.

---

## 4. Master Code Template (V1 Table — React + Tailwind)

```tsx
import { RotateCcw, FileText, Printer, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge'; // hoặc đường dẫn component thực tế
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';

export type ReturnOrderRow = {
  id?: string;
  customerName?: string;
  customerPhone?: string;
  createdAt?: string;
  date?: string;
  totalRefundAmount?: number;
  cashRefund?: number;
  debtReduction?: number;
  status?: 'pending' | 'completed' | 'cancelled' | string;
};

export function ReturnDataTableBox({
  rows,
  selectedIds,
  onSelectAll,
  onSelectRow,
  onRowClick,
  onView,
  onPrint,
  onCancel,
  loading,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  onCreate,
}: {
  rows: ReturnOrderRow[];
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectRow: (id: string, checked: boolean) => void;
  onRowClick: (row: ReturnOrderRow) => void;
  onView: (row: ReturnOrderRow) => void;
  onPrint: (row: ReturnOrderRow) => void;
  onCancel: (row: ReturnOrderRow) => void;
  loading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onCreate: () => void;
}) {
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;

  return (
    <div className="bg-white rounded-3xl shadow-[0_2px_8px_rgba(15,23,42,0.03)] border border-slate-100 p-6">
      {/* ===== V2 branch ===== */}
      {/* Nếu dùng DataGrid V2, thay thế block dưới bằng <DataGrid ... /> theo MASTER_DATA_GRID_STANDARD_V1 */}

      {/* ===== V1 Table ===== */}
      <div className="overflow-x-auto -mx-6">
        <table className="min-w-full align-middle px-6 divide-y divide-slate-100">
          <thead>
            <tr>
              <th scope="col" className="w-12 h-[52px] pl-5">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                />
              </th>
              <th className="h-[52px] px-5 text-left text-[13px] uppercase font-semibold text-slate-700 tracking-[0.2px] hover:text-slate-900 cursor-pointer transition-colors">
                Mã phiếu
              </th>
              <th className="h-[52px] px-5 text-left text-[13px] uppercase font-semibold text-slate-700 tracking-[0.2px] hover:text-slate-900 cursor-pointer transition-colors">
                Khách hàng
              </th>
              <th className="h-[52px] px-5 text-left text-[13px] uppercase font-semibold text-slate-700 tracking-[0.2px] hover:text-slate-900 cursor-pointer transition-colors">
                Ngày tạo
              </th>
              <th className="h-[52px] px-5 text-right text-[13px] uppercase font-semibold text-slate-700 tracking-[0.2px] hover:text-slate-900 cursor-pointer transition-colors">
                Tiền hoàn
              </th>
              <th className="h-[52px] px-5 text-right text-[13px] uppercase font-semibold text-slate-700 tracking-[0.2px]">
                Tiền mặt / Giảm nợ
              </th>
              <th className="h-[52px] px-5 text-center text-[13px] uppercase font-semibold text-slate-700 tracking-[0.2px]">
                Trạng thái
              </th>
              <th className="h-[52px] pr-5 text-right text-[13px] uppercase font-semibold text-slate-700 tracking-[0.2px]">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((r) => (
              <tr
                key={r.id}
                className="group h-[56px] hover:bg-[#FAFBFC] transition-all duration-[150ms] cursor-pointer"
                onClick={() => onRowClick(r)}
              >
                <td className="h-[56px] pl-5 align-middle" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                    checked={selectedIds.includes(r.id || '')}
                    onChange={(e) => onSelectRow(r.id || '', e.target.checked)}
                  />
                </td>
                <td className="py-4 px-5 whitespace-nowrap align-middle">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <RotateCcw className="w-4 h-4 text-purple-500" />
                    </div>
                    <span className="text-slate-900 font-semibold text-sm hover:underline">{r.id}</span>
                  </div>
                </td>
                <td className="py-4 px-5 whitespace-nowrap align-middle">
                  <span className="text-sm font-medium text-slate-700 group-hover:text-purple-600 transition-colors">
                    {r.customerName || 'Khách lẻ'}
                  </span>
                  {r.customerPhone && <p className="text-xs text-slate-400 mt-0.5">{r.customerPhone}</p>}
                </td>
                <td className="py-4 px-5 whitespace-nowrap align-middle">
                  <p className="text-sm text-slate-500">{formatDate(r.createdAt || r.date)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatTime(r.createdAt || r.date)}</p>
                </td>
                <td
                  className={`py-4 px-5 text-right text-sm font-semibold whitespace-nowrap align-middle ${
                    (r.totalRefundAmount || 0) > 0 ? 'text-red-500' : 'text-emerald-500'
                  }`}
                >
                  {formatCurrency(r.totalRefundAmount || 0)}
                </td>
                <td className="py-4 px-5 text-right whitespace-nowrap align-middle">
                  <div className="text-sm font-medium text-emerald-600">TM: {formatCurrency(r.cashRefund || 0)}</div>
                  {(r.debtReduction || 0) > 0 && (
                    <div className="text-xs text-amber-600 mt-0.5">Nợ: {formatCurrency(r.debtReduction || 0)}</div>
                  )}
                </td>
                <td className="py-4 px-5 text-center whitespace-nowrap align-middle">
                  <StatusBadge status={r.status || ''} />
                </td>
                <td className="h-[56px] pr-5 text-right whitespace-nowrap align-middle" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => onView(r)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                      title="Xem chi tiết"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onPrint(r)}
                      className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                      title="In phiếu trả"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    {r.status !== 'cancelled' && (
                      <button
                        onClick={() => onCancel(r)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Hủy phiếu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && !loading && (
        <EmptyState
          icon={<RotateCcw className="w-10 h-10" />}
          title="Chưa có phiếu trả hàng nào"
          description="Tạo phiếu trả hàng mới để bắt đầu."
          action={<Button variant="primary" onClick={onCreate} icon={<Plus className="w-4 h-4" />}>Tạo phiếu trả</Button>}
        />
      )}

      {/* PaginationToolbar sẽ được quy chuẩn riêng trong PAGINATION_RETURN.md */}
    </div>
  );
}
```

---

## 5. Status Badge Mapping

Ánh xạ theo `MASTER_STATUS_BADGE_STANDARD_V1`:

| Status | Badge text | Tone | Tailwind classes |
|--------|------------|------|------------------|
| `pending` | Chờ xác nhận | WARNING | `bg-amber-100 text-amber-700` (hoặc dùng `<StatusBadge tone="warning" />`) |
| `completed` | Đã hoàn tất | SUCCESS | `bg-emerald-100 text-emerald-700` |
| `cancelled` | Đã hủy | ERROR | `bg-red-100 text-red-700` |

Badge shape: pill, height 28px, padding 0 12px, font 12px semibold.

---

## 6. Preservation Rules

Khi áp dụng master style này cho modal/trang khác:

| Giữ nguyên | Ghi chú |
|------------|---------|
| `rows` array / data shape | object chứa các field hiển thị |
| `selectedIds`, `onSelectAll`, `onSelectRow` | logic chọn dòng |
| `onRowClick` | mở chi tiết |
| `onView`, `onPrint`, `onCancel` | handlers thao tác trên dòng |
| `StatusBadge` component | dùng chung, không tạo badge riêng |
| Feature flag V1/V2 | ví dụ `useNewDataGridReturnOrders` |
| `loading` / `error` | states loading, empty, error |
| API fetch / pagination | logic lấy dữ liệu giữ nguyên |

Không được:

- Thay đổi thứ tự cột.
- Thay icon hành động bằng emoji hoặc icon set khác Lucide.
- Dùng màu text đỏ/xanh cho toàn bộ cột tiền (chỉ dùng semantic theo quy định).
- Bỏ checkbox selection.

---

## 7. Interactions & States

| State | Behavior |
|-------|----------|
| Row hover | `bg-slate-50/60`, tên khách hàng chuyển `text-purple-600` |
| Row click | gọi `onRowClick` |
| Checkbox click | `stopPropagation` để không trigger row click |
| Action click | `stopPropagation` |
| Header click | có thể sort (nếu triển khai) |
| Loading | hiển thị skeleton row, không spinner toàn màn hình |
| Empty | `<EmptyState>` với icon + title + description + action |
| Cancelled row | ẩn nút Hủy |

---

## 8. Responsive Behavior

| Viewport | Behavior |
|----------|----------|
| Desktop | Full table, horizontal space đủ |
| Tablet | `overflow-x-auto` cho table wrapper |
| Mobile | `overflow-x-auto` hoặc chuyển card view (nếu có). Trong modal nên giữ table với scroll ngang. |

Modal constraint: trong modal size `LARGE` (960px) hoặc `WORKSPACE` (1200px), table vẫn cần `overflow-x-auto` nếu tổng cột > viewport.

---

## 9. Compliance with Master Standards

| Standard | Áp dụng |
|----------|---------|
| `MASTER_MODAL_STANDARD` | Box nằm trong ModalBody, padding 24px. |
| `MASTER_MODAL_BLUEPRINT` | Body → Section → Table. |
| `MASTER_DATA_GRID_STANDARD_V1` | Khi dùng V2 DataGrid. |
| `MASTER_TABLE_STANDARD` | Khi dùng V1 table. |
| `MASTER_STATUS_BADGE_STANDARD` | Badge trạng thái. |
| `MASTER_ACTION_BUTTON_STANDARD` | Icon buttons hành động. |
| `MASTER_ICON_STANDARD_V1` | Lucide icons, action 16px. |
| `MASTER_DESIGN_TOKENS_V1` | White, slate-50/100/400/900, purple. |
| `MASTER_SECTION_BOX_STANDARD` | White surface, radius 20px, border, soft shadow. |

---

## 10. Do / Don't

### Do

- [ ] Dùng `<StatusBadge>` chuẩn.
- [ ] Giữ checkbox selection và select-all.
- [ ] Dùng `overflow-x-auto` cho table wrapper.
- [ ] Giữ avatar tròn màu primary cho mã phiếu.
- [ ] Hiển thị cả ngày và giờ trong cột Ngày tạo.
- [ ] Dùng empty state chuẩn khi không có dữ liệu.

### Don't

- [ ] Không đặt table trực tiếp lên modal body mà không có box container.
- [ ] Không dùng text thường thay cho status badge.
- [ ] Không để action button chiếm quá nhiều không gian (chỉ icon).
- [ ] Không bỏ `stopPropagation` ở checkbox/action.
- [ ] Không dùng `alert()` cho empty/error state.

---

## 11. Appendix: V2 DataGrid Props (Reference)

```tsx
<DataGrid
  data={returnOrders}
  columns={returnOrderColumns}
  keyExtractor={(r) => r.id || ''}
  loading={loading}
  error={error}
  selectedRows={selectedIds}
  onSelectionChange={(ids) => setSelectedIds(ids as string[])}
  onRowClick={(r) => handleViewDetail(r)}
  sortKey={v2SortConfig?.key}
  sortDirection={v2SortConfig?.direction || 'none'}
  onSortChange={handleDataGridSort}
  toolbar={{
    searchValue: filters.returnId || filters.customerName || '',
    onSearchChange: handleV2Search,
    searchPlaceholder: 'Tìm theo mã phiếu / khách hàng...',
    showFilter: true,
    right: (
      <>
        {selectedIds.length > 0 && (
          <ActionButton variant="danger" size="md" icon={<Trash2 className="w-4 h-4" />} onClick={handleBulkCancel}>
            Hủy ({selectedIds.length})
          </ActionButton>
        )}
        <ActionButton variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={handleCreateNew}>
          Tạo phiếu trả
        </ActionButton>
      </>
    ),
  }}
  pagination={{
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    onPageChange: (page) => setCurrentPage(page),
  }}
  emptyTitle="Chưa có phiếu trả hàng nào"
  emptyDescription="Tạo phiếu trả hàng mới để bắt đầu."
  emptyAction={
    <ActionButton variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={handleCreateNew}>
      Tạo phiếu trả
    </ActionButton>
  }
/>
```

Chi tiết cột/cells V2 đảm bảo giống V1 về màu sắc, icon, status badge và canh lề.
