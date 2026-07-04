# Phase 10.1d — Dead Code Cleanup: disposal-form removal

## Tóm tắt

Đã xóa 12 file CSS/components cũ của `disposal-form` theo audit Phase 10.1c.  
`DisposalDetailModal.tsx/.css` và `DisposalLotSelector.tsx/.css` được giữ nguyên.  
Lint/build đều PASS.

## File đã xóa

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

Thư mục `components/disposal-form/DisposalSidebar/` đã trống nên cũng được xóa.

## File được bảo toàn

- `components/disposal-form/DisposalDetailModal.tsx` ✅
- `components/disposal-form/DisposalDetailModal.css` ✅
- `components/disposal-form/DisposalLotSelector.tsx` ✅
- `components/disposal-form/DisposalLotSelector.css` ✅

## Kiểm tra import

- `grep` toàn bộ source `.ts/.tsx` không còn import `DisposalProductSearch`, `DisposalItemsTable`, `DisposalItemRow`, `DisposalSidebar/`.
- Không cần sửa import ở bất kỳ file nào khác.

## Verification

- `npm run lint` ✅ PASS
- `npm run build` ✅ PASS

## Backup

`C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_phase10_1d_20260703_<timestamp>`

## Cập nhật tasks.md

- Đã đánh dấu hoàn thành các mục **24.1–24.5** (Phase 10.1c) và **25.1–25.5** (Phase 10.1d) trong `openspec/changes/voucher-form-component-system-plan-a/tasks.md`.

## Next phase

Theo `tasks.md`, tiếp tục **Phase 10.2a — Dead Code Cleanup: inventory-count imports & grep audit**.
