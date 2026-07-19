## 0. Pre-Flight

- [x] 0.1 Confirm Phases 1–6 are complete
- [x] 0.2 Confirm `npm run lint` pass from Phase 6
- [x] 0.3 Confirm `npm run build` pass from Phase 6

## 1. Static check: lint & build (Phase 7a)

- [x] 1.1 Run `cd "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7"`
- [x] 1.2 Run `npm run lint` — confirm 0 errors
- [x] 1.3 Run `npm run build` — confirm 0 errors

## 2. Manual test 5 flows nghiệp vụ (Phase 7b)

- [ ] 2.1 Tạo phiếu nhập hàng: Chọn NCC → thêm SP → nhập giá/SL/discount dòng → nhập phí ship, giảm giá phiếu, tiền trả → Lưu tạm → Hoàn thành — **BLOCKED**: `ImportGoods` nhận `suppliers=[]`/`products=[]`, không chọn được NCC/SP
- [ ] 2.2 Sửa phiếu nhập hàng draft: Mở phiếu draft → sửa SL → Lưu lại — **BLOCKED**: không tạo được draft do 2.1 bị block
- [x] 2.3 Tạo phiếu kiểm kê: Thêm SP → nhập SL thực tế → Lưu nháp → Hoàn thành — PASS (`CK260702005`)
- [x] 2.4 Tạo phiếu xuất hủy: Chọn lý do → thêm SP → Lưu tạm → Hoàn thành — PASS (`XH000009`, đã xóa & hoàn kho sau test)
- [ ] 2.5 Tạo phiếu đổi hàng NCC: Chọn NCC → chọn phiếu nhập gốc → chọn lô → nhập SL đổi và SL nhận lại → Hoàn thành — **BLOCKED**: wizard không liệt kê phiếu nhập gốc cho bất kỳ lô nào
- [x] 2.6 Check browser console for critical errors during each flow — PASS (không có lỗi nghiêm trọng trong flow Kiểm kê/Xuất hủy; lỗi dashboard summary tồn tại nhưng không liên quan)

## 3. Responsive test và final report (Phase 7c)

- [x] 3.1 Desktop (>1024px): 4 màn hiển thị 2 cột (main 70%, sidebar 30%); header cân đối; actions sticky bottom
- [x] 3.2 Tablet (768–1024px): layout 1 cột, sidebar xuống dưới main, không tràn ngang
- [x] 3.3 Mobile (<768px): header xuống hàng (Back + Title, search riêng); sidebar xuống dưới main; actions xếp dọc/ngang
- [x] 3.4 Edge case: sidebar dài / actions sticky — thêm nhiều SP, nhập nhiều tiền, đảm bảo actions sticky bottom
- [x] 3.5 Edge case: wizard UI SupplierExchanges — trên tablet/mobile, product search → lot selection → receipt selection không tràn ngang/chồng lấn
- [x] 3.6 Edge case: empty main content — 4 màn khi chưa có SP, layout vẫn ổn
- [x] 3.7 Edge case: banner + no search — SupplierExchanges có banner nhưng không dùng search slot, header vẫn cân đối
- [x] 3.8 Edge case: input date visual — InventoryCount trên Chrome/Safari, icon date picker không bị lệch
- [x] 3.9 Save final verification report to `docs/plans/voucher-form-layout-ssot/VERIFICATION_REPORT.md`

## 4. Finalize

- [x] 4.1 Review all acceptance criteria
- [x] 4.2 Confirm final report is saved
- [x] 4.3 Hand off to project owner

## Acceptance Criteria

- [x] `npm run lint` pass (0 error)
- [x] `npm run build` pass (0 error)
- [ ] All 5 manual flows pass — **NOT MET** (2/5 pass, 3 bị block bởi vấn đề dữ liệu/chức năng)
- [x] No critical console errors
- [x] Responsive test pass on desktop, tablet, mobile
- [x] All edge cases pass
- [x] Final report saved

## Rollback Plan

- Backup: optional `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_layout_phase7_<YYYYMMDD_HHMMSS>`
- Rollback trigger: not applicable for Phase 7; regressions should be fixed by restoring the relevant phase's backup
