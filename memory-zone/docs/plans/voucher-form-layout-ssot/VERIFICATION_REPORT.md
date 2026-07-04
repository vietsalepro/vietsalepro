# Phase 7 — Verification Report

> **Project:** VietSale Pro v7  
> **Scope:** VoucherFormLayout SSOT (4 màn phiếu: Nhập hàng, Kiểm kê, Xuất hủy, Đổi hàng NCC)  
> **Date:** 2026-07-02  
> **Tester:** Devin agent  
> **Environment:** Windows, dev server `http://localhost:3001` (Vite), production Supabase project `rsialbfjswnrkzcxarnj`  
> **Test account:** (credentials provided by project owner, not persisted in repo)

---

## 1. Phase 7a — Static check

| Check | Command | Result |
|-------|---------|--------|
| Type check | `npm run lint` | PASS (0 errors) |
| Production build | `npm run build` | PASS (0 errors, 11.23s) |
| OpenSpec validation | `openspec validate --all --json` | PASS (2/2 items) |

Backup created: `E:\App ban hàng\vietsale-pro-v7_backup_voucher_layout_phase7_20260702_112318`

---

## 2. Phase 7b — Manual test 5 flows

Flows executed via browser automation (agent-browser) on the local dev server.

| # | Flow | Result | Evidence / Notes |
|---|------|--------|------------------|
| 1 | **Tạo phiếu kiểm kê** | PASS | Phiếu `CK260702005` được tạo, lưu nháp, sau đó hoàn thành. Chênh lệch `-1` lot `001` Yakult = `-22.800 ₫` ghi nhận đúng. |
| 2 | **Tạo phiếu xuất hủy** | PASS | Phiếu `XH000009` tạo với lý do `Hàng hỏng`, SP `Lốc Sữa Abbott Grow Gold 110ml`, SL `1`, giá trị `42.159 ₫`. Hoàn thành thành công. Sau test đã **Xóa & hoàn kho** để tránh ảnh hưởng tồn kho. |
| 3 | **Tạo phiếu nhập hàng** | BLOCKED | Mở form nhập hàng nhưng không thể chọn NCC và không thể tìm SP. Nguyên nhân: `ImportGoods` nhận props `suppliers=[]` và `products=[]` sau khi Phase 6 xóa global data; `SupplierSection` và `ImportProductSearch` chỉ lọc trên props, không fetch server-side. Nút `Lưu tạm`/`Hoàn thành` luôn disabled. |
| 4 | **Sửa phiếu nhập hàng draft** | BLOCKED | Không thể tạo draft do flow #3 bị block. Trên danh sách cũng không có phiếu nhập ở trạng thái `Bản nháp`. |
| 5 | **Tạo phiếu đổi hàng NCC** | BLOCKED | Wizard hiển thị đúng 3 bước: tìm SP → chọn lô → chọn phiếu nhập gốc. Tuy nhiên, sau khi chọn lô (thử Yakult lot `001/002/003` và Ensure lot `1`) thì **không có phiếu nhập gốc nào** được liệt kê, nên không thể nhập SL đổi / nhận và hoàn thành. Cần kiểm tra RPC `get_import_receipts_by_product_and_lot` hoặc dữ liệu liên kết `lot ↔ receipt`. |
| 6 | **Console check** | Có lỗi nền | Xuất hiện lỗi `column t.day does not exist` từ `get_dashboard_summary` / `get_mobile_home_summary` — không liên quan layout phiếu, không xuất hiện trong quá trình tạo phiếu Kiểm kê/Xuất hủy. |

**Summary:** 2/5 flows pass (Kiểm kê, Xuất hủy). 2 flows bị block bởi vấn đề dữ liệu/chức năng, không phải layout. 1 flow phụ thuộc (Sửa draft) cũng bị block theo.

---

## 3. Phase 7c — Responsive test

| Viewport | Test | Result |
|----------|------|--------|
| Desktop (1280×900) | 4 màn form phiếu hiển thị 2 cột (main ~70%, sidebar ~30%), header cân đối | PASS (screenshots) |
| Tablet (820×1180) | Layout chuyển 1 cột, sidebar xuống dưới main, không tràn ngang | PASS (screenshots) |
| Mobile (390×844) | Header xuống hàng, sidebar xuống dưới main, actions xếp chồng | PASS (screenshots) |
| Edge: sidebar dài / actions sticky | Thêm nhiều SP/điều kiền vào form Kiểm kê/Xuất hủy, actions sidebar vẫn sticky | PASS |
| Edge: wizard UI SupplierExchanges | Product search → lot selection → receipt selection hiển thị theo bước, không chồng lấn | PASS (receipt list rỗng là vấn đề dữ liệu, không phải layout) |
| Edge: empty main content | 4 màn khi chưa có SP hiển thị empty state cân đối | PASS |
| Edge: input date visual | Date picker trong Kiểm kê hiển thị, không lệch | PASS |

**Screenshots saved in `docs/plans/voucher-form-layout-ssot/`:**

- `phase7_login_desktop.png`, `phase7_login_tablet.png`, `phase7_login_mobile.png`
- `phase7_import_desktop.png`, `phase7_import_tablet.png`, `phase7_import_mobile.png`
- `phase7_disposal_desktop.png`, `phase7_disposal_tablet.png`, `phase7_disposal_mobile.png`
- `phase7_inventory_desktop.png`
- `phase7_supplier_exchange_desktop.png`

---

## 4. Issues / Blockers

1. **ImportGoods không có dữ liệu NCC/SP** (HIGH)
   - `SupplierSection` và `ImportProductSearch` dùng props `suppliers`/`products` từ `App.tsx`, hiện đang rỗng sau Phase 6.
   - Đề xuất: `ImportGoods` tự fetch `suppliers` và `products` (giống `SupplierExchanges` / `DisposalForm`), hoặc truyền fallback từ App.

2. **SupplierExchanges không liệt kê phiếu nhập gốc** (HIGH)
   - Wizard dừng ở bước 3 vì `get_import_receipts_by_product_and_lot` không trả về receipt nào cho các lô đã thử.
   - Đề xuất: kiểm tra RPC và dữ liệu `product_lots.receipt_id` / `import_receipt_items`.

3. **Lỗi dashboard summary** (LOW, không liên quan layout)
   - `column t.day does not exist` trong `get_dashboard_summary` / `get_mobile_home_summary`.

---

## 5. Conclusion

- **Layout / CSS refactor ổn định:** `npm run lint`, `npm run build`, và OpenSpec validation đều pass. Giao diện 4 màn phiếu responsive đúng thiết kế VoucherFormLayout.
- **Nghiệp vụ chưa thể sign-off 100%:** 2 flow chính (Nhập hàng, Đổi hàng NCC) và flow phụ (Sửa draft nhập hàng) bị block bởi vấn đề dữ liệu chứ không phải layout.
- **Khuyến nghị:** Không archive Phase 7 cho đến khi fix 2 blocker trên và re-test. Nếu chủ sở hữu muốn ghi nhận kết quả hiện tại, có thể archive với trạng thái **partial — blockers documented**.

---

*Report generated by Devin on 2026-07-02.*
