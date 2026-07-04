# Phase 6.0 — Pilot Refactor: DisposalForm

## Tóm tắt

Đã refactor `pages/DisposalForm.tsx` sang Voucher Form Component System theo PLAN_A_VoucherFormComponentSystem_Master.md section 5 và tasks.md section 10.

## Thay đổi chính

### 1. Tạo VoucherSection components (vì Phase 4.0 chưa implement)
- `components/voucher-form/VoucherSection.tsx` + `.css`
- `components/voucher-form/VoucherSectionHeader.tsx` + `.css`
- `components/voucher-form/VoucherSectionContent.tsx` + `.css`
- Cập nhật `components/voucher-form/index.ts` để export 3 components mới.
- Cập nhật `components/voucher-form/VoucherSidebar.css` để `VoucherSection` trong sidebar cũng được flatten (bỏ border/box-shadow/padding) giống `SectionBox` cũ.

### 2. Cập nhật VoucherHeader để dùng VoucherSearch
- `components/voucher-form/VoucherHeader.tsx`: thay input thuần bằng `VoucherSearch`.
- `components/voucher-form/VoucherHeader.css`: xóa CSS cho input/icon cũ, giữ layout wrapper.
- Đảm bảo backward-compatible: props interface không đổi.

### 3. Refactor `pages/DisposalForm.tsx`
- Xóa import các component cũ: `DisposalProductSearch`, `DisposalItemsTable`, `DisposalItemRow`, `InfoSection`, `ReasonSection`, `NoteSection`, `ActionFooter`.
- Thay bằng import từ `components/voucher-form`.
- Định nghĩa lại `FormDisposalItem` trong `pages/DisposalForm.tsx` (không còn import từ `DisposalItemRow`).
- Tạo component `DisposalRow` nội bộ để render từng dòng bằng `VoucherTableRow` + `VoucherInput` + `DisposalLotSelector`.
- Search: dùng `VoucherProductDropdown` mode `server` trong `searchSlot`; header input dùng `VoucherSearch` (qua `VoucherHeader`).
- Table: dùng `VoucherTable` + `VoucherTableRow` + `VoucherEmpty` + `VoucherTotals`. Empty state được render riêng (không kèm header table) để tránh hiển thị header trống.
- Sidebar: dùng `VoucherSection`, `VoucherSectionHeader`, `VoucherSectionContent`, `VoucherField`, `VoucherSelect`, `VoucherTextarea`.
- Actions: dùng `VoucherButton` (truyền qua `actions` prop của `VoucherFormLayout`, được wrap bởi `VoucherActions`).
- Giữ nguyên logic business: validate, save draft, complete, lot lock khi `reason === 'Hàng hết hạn'`, khóa số lượng khi đã chọn lô hết hạn.
- Không đụng `DisposalDetailModal`.

### 4. `pages/Disposals.css`
- Không còn CSS của create form; chỉ giữ list view CSS.

### 5. `openspec/changes/voucher-form-component-system-plan-a/tasks.md`
- Đánh dấu các task Phase 6.0 đã hoàn thành.
- Ghi chú các task manual test bị block vì app yêu cầu đăng nhập.

## Verification

- `npm run lint`: PASS
- `npm run build`: PASS
- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_phase6_20260703_...`

## Manual test

- Đã chạy dev server trên `http://127.0.0.1:5173/inventory/disposals/new`.
- App redirect về trang đăng nhập; không có credentials nên không thể test flow tạo phiếu.
- Screenshot lưu tại `screenshots/disposal_form_empty.png` (trang đăng nhập).
- Các scenario cần test khi có login:
  - Tạo phiếu xuất hủy → hoàn thành.
  - Chọn lô hàng hết hạn → SL tự khóa → hoàn thành.
  - Test ↑↓ Enter Esc trong search dropdown.
  - Mở `DisposalDetailModal` trong `pages/Disposals.tsx` vẫn hoạt động.

## Blocker cho next session

- Cần credentials để manual test. Nếu có credentials, chạy dev server và chụp baseline (empty, search open, 1 item, completed) rồi test các flow trên.

## Next phase

- Phase 7.1 — ImportGoods Sidebar Refactor.
