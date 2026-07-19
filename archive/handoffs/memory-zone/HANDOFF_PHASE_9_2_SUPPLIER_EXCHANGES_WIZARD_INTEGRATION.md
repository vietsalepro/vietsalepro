# Phase 9.2 — SupplierExchanges Wizard Integration

## Tóm tắt

Đã thực hiện Phase 9.2 theo `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md` section 3.10 và `openspec/changes/voucher-form-component-system-plan-a/tasks.md` section 20.

Final pass cho màn **Đổi trả hàng nhà cung cấp**: cleanup imports, xác minh wizard flow, giữ nguyên CSS list view.

## Thay đổi chính

### `pages/SupplierExchanges.tsx`

1. **Cleanup imports**:
   - Xóa `ArrowDownToLine`, `ChevronLeft`, `ChevronRight` khỏi import `lucide-react` (không còn dùng).
   - Xóa import `EmptyState` (không còn dùng trong page sau refactor).

2. **Xác minh wizard flow**:
   - Tìm sản phẩm: `VoucherSearch` + `VoucherProductDropdown` (server mode) hoạt động đúng, kết quả từ `searchProducts` được lọc theo `hasBatches` và tồn lô > 0.
   - Chọn lô: `draftProductLots` lọc bỏ các lô đã chọn, giới hạn theo phiếu nhập gốc nếu đã khóa; `handleSelectLot` tự động thêm item khi phiếu đã khóa.
   - Chọn phiếu nhập: `lotReceipts` fetch từ `getImportReceiptsByProductAndLot`, chỉ hiển thị phiếu `completed`; sau khi chọn phiếu, `lockedReceiptId` được set và các sản phẩm tiếp theo chỉ chọn trong cùng phiếu.
   - Item cards: `renderCompactItem` / `renderExpandedItem` dùng `VoucherField` + `VoucherInput`, tính toán chênh lệch công nợ đúng; xóa item cuối tự động mở khóa phiếu.
   - Validation: kiểm tra đủ tồn lô, HSD mới xa hơn HSD cũ, số lượng > 0, lý do đã chọn, phiếu nhập gốc đã chọn.

### `pages/SupplierExchanges.css`

- Không thay đổi. Giữ nguyên toàn bộ CSS list view (`.supplier-exchanges-page`, filters, pagination, loading, stats) và CSS wizard (item cards, lot cards, receipt cards, modal, detail view).

## Verification

- `npm run lint`: PASS
- `npm run build`: PASS
- `openspec validate --all --json`: PASS (4/4 items passed)

## Manual test

- Chưa chạy được end-to-end do ứng dụng yêu cầu đăng nhập; không có credentials.
- Cần kiểm thử ở session tiếp theo (Phase 9.3 hoặc Phase 10): chọn NCC, phiếu nhập gốc, lô, item cards → hoàn thành.

## Next phase

- **Phase 9.3 — SupplierExchanges Dead Code Cleanup**: grep audit, xóa file/component CSS cũ nếu không còn import, chạy lint + build.
