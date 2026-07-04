# Phase 10.1c — Dead Code Cleanup: disposal-form audit

## Tóm tắt

Thực hiện Phase 10.1c theo `openspec/changes/voucher-form-component-system-plan-a/tasks.md` section 24.

Đã grep audit xác nhận `pages/DisposalForm.tsx` không còn import các component cũ `DisposalProductSearch|DisposalItemsTable|DisposalItemRow`, sidebar `DisposalSidebar/*` cũng không còn import. Đồng thời xác nhận `DisposalDetailModal.tsx/.css` là list view ngoài scope và `DisposalLotSelector.tsx/.css` vẫn được import. Sub-phase này chỉ audit, **KHÔNG xóa file**.

## 1. Grep kết quả

- `pages/DisposalForm.tsx`: **KHÔNG import** `DisposalProductSearch`, `DisposalItemsTable`, `DisposalItemRow`, `DisposalSidebar/*`.
- `components/disposal-form/*`: `DisposalProductSearch|DisposalItemsTable|DisposalItemRow` chỉ xuất hiện trong chính các file dead code đó (self-reference), không được import từ page nào.

## 2. File được bảo toàn

- `components/disposal-form/DisposalDetailModal.tsx` ✅ ngoài scope, **KHÔNG đụng**.
- `components/disposal-form/DisposalDetailModal.css` ✅ ngoài scope, **KHÔNG đụng**.
- `components/disposal-form/DisposalLotSelector.tsx` ✅ vẫn được import bởi `pages/DisposalForm.tsx` line 23.
- `components/disposal-form/DisposalLotSelector.css` ✅ vẫn tồn tại và được import.

## 3. File CSS/component an toàn để xóa (Phase 10.1d)

| # | File |
|---|------|
| 1 | `components/disposal-form/DisposalProductSearch.tsx` |
| 2 | `components/disposal-form/DisposalItemsTable.tsx` |
| 3 | `components/disposal-form/DisposalItemsTable.css` |
| 4 | `components/disposal-form/DisposalItemRow.tsx` |
| 5 | `components/disposal-form/DisposalItemRow.css` |
| 6 | `components/disposal-form/DisposalSidebar/InfoSection.tsx` |
| 7 | `components/disposal-form/DisposalSidebar/InfoSection.css` |
| 8 | `components/disposal-form/DisposalSidebar/NoteSection.tsx` |
| 9 | `components/disposal-form/DisposalSidebar/ReasonSection.tsx` |
| 10 | `components/disposal-form/DisposalSidebar/ReasonSection.css` |
| 11 | `components/disposal-form/DisposalSidebar/ActionFooter.tsx` |
| 12 | `components/disposal-form/DisposalSidebar/ActionFooter.css` |

> Ghi chú: `DisposalProductSearch.css` không tồn tại (đúng như audit Phase 0.4). `NoteSection.tsx` không có file CSS đi kèm.

## 4. Thay đổi file khác

- Không có. Sub-phase này chỉ audit, không xóa file, không sửa code.

## 5. Verification

- Không chạy `npm run lint` / `npm run build` trong sub-phase audit này vì không thay đổi file nguồn.

## 6. Next phase

- Theo `tasks.md`, next phase là **Phase 10.1d — Dead Code Cleanup: disposal-form file removal** (section 25): xóa 12 file trên, giữ `DisposalDetailModal.tsx/.css` và `DisposalLotSelector.tsx/.css`, sau đó chạy `npm run lint` + `npm run build`.
