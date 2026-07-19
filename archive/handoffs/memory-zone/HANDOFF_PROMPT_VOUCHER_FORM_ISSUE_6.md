# HANDOFF PROMPT — Voucher Form Component System: Vấn đề #6

> **Thời gian tạo:** 2026-07-03
> **Mục đích:** Xử lý vấn đề #6 — Final audit & API contract hardening trước khi bắt đầu triển khai PLAN_A_VoucherFormComponentSystem

---

## Bối cảnh

Bạn đang làm việc trên project **VietSales Pro v7** (`C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7`).

Plan tổng thể nằm tại:
- `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master.md`
- `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`

Đã có 5 vấn đề được xử lý trong các chat trước:
1. **Vấn đề 1** — Khóa thiết kế `VoucherProductDropdown` multi-mode (client/server)
2. **Vấn đề 2** — Khóa `SupplierExchanges` là wizard, không ép table template
3. **Vấn đề 3** — Thêm phase lớn loại bỏ V1 legacy InventoryCount trước rollout
4. **Vấn đề 4** — Visual Regression Baseline (checklist bắt buộc trước/sau mỗi phase lớn)
5. **Vấn đề 5** — Rule khóa API contract (không thêm prop ngoài plan)

---

## Vấn đề #6: Final Audit & API Contract Hardening

### Mục tiêu

Trước khi bắt đầu triển khai code, cần thực hiện **audit cuối cùng** toàn bộ plan để đảm bảo:
- Không có khoảng trống logic nào giữa các phase
- API contracts đã đủ chi tiết để code đúng ngay lần đầu
- Các phase đã được sắp xếp đúng thứ tự dependency
- Không có conflict giữa các rule

### Các việc cần làm

#### 1. Audit API Contract completeness

Kiểm tra từng component mới trong plan xem đã có đủ:

**VoucherButton:**
- [ ] Props interface đầy đủ (variant, size, fullWidth, loading, icon, className, title, aria-label, disabled, onClick, children)
- [ ] CSS variants mapping rõ ràng
- [ ] Loading state handling
- [ ] Disabled state handling

**VoucherInput:**
- [ ] Props interface đầy đủ (size, fullWidth, prefixIcon, suffixIcon, error, className, disabled)
- [ ] Types hỗ trợ (text, number, date, search, tel)
- [ ] Focus ring behavior
- [ ] Error state visual

**VoucherField:**
- [ ] Props interface (label, error, hint, children)
- [ ] Composition pattern rõ ràng

**VoucherTable:**
- [ ] Props interface (children, className)
- [ ] Sticky header behavior
- [ ] Scroll area behavior

**VoucherTableRow:**
- [ ] Props interface (children, renderCells, selected, onClick, className)
- [ ] Render strategy rõ ràng: khi nào dùng children, khi nào dùng renderCells
- [ ] Slot mechanism cho DisposalLotSelector, LotExpiryPopover

**VoucherProductDropdown:**
- [ ] Props interface cho cả 2 mode (client/server)
- [ ] Keyboard navigation behavior chi tiết (ArrowUp/Down, Enter, Esc)
- [ ] Click-outside behavior
- [ ] Scroll-into-view behavior
- [ ] Highlight state management
- [ ] Props extension cho page-specific customization (renderItem, filterFn)

**VoucherSearch:**
- [ ] Props interface (value, onChange, placeholder, slot, loading, disabled)
- [ ] Slot mechanism cho VoucherProductDropdown

**VoucherTotals:**
- [ ] Props interface (items: { label, value, highlight }[])

**VoucherFormLayout:**
- [ ] Props giữ nguyên so với version hiện tại
- [ ] Sub-components composition

#### 2. Audit Phase ordering & dependency

Kiểm tra thứ tự phase không có conflict:

- [ ] Phase 0 (Audit) → Phase 1 (Foundation) → Phase 2 (Core Controls) → Phase 3 (Data Components) → Phase 4 (Layout Sub) → Phase 5 (Overlays) → Phase 6 (Pilot DisposalForm) → Phase 7 (ImportGoods) → Phase 8 (V1 Removal InventoryCount) → Phase 9 (Rollout InventoryCount) → Phase 10 (SupplierExchanges) → Phase 11 (Cleanup)
- [ ] Phase 8 (V1 Removal) phải HOÀN THÀNH trước Phase 9 (Rollout InventoryCount)
- [ ] Phase 6 (Pilot DisposalForm) phải hoàn thành trước Phase 7, 9, 10
- [ ] Phase 10 (Cleanup) phải là phase CUỐI CÙNG

#### 3. Audit Conflict detection

Kiểm tra các rule có mâu thuẫn:

- [ ] Rule 11 (không ép table template) vs Phase 9.1 (SupplierExchanges)
- [ ] Rule 13 (không thay TextInput/ActionButton) vs Phase 2 (tạo VoucherButton/VoucherInput)
- [ ] Rule 14 (không đụng DisposalDetailModal) vs Phase 10.1b (dead code cleanup disposal)
- [ ] Rule 15 (giữ DisposalLotSelector) vs Phase 6 (pilot refactor)
- [ ] Rule 16/17 (khóa API contract) vs mọi Phase 2-4

#### 4. Audit File deletion safety

Kiểm tra các file xóa có an toàn:

- [ ] `components/import-goods/ImportFormLayout.tsx/.css` — xác nhận KHÔNG tồn tại (đã xóa trước)
- [ ] `components/disposal-form/DisposalFormLayout.tsx/.css` — xác nhận KHÔNG tồn tại
- [ ] `components/inventory-count/CountFormLayout.css` — xác nhận KHÔNG tồn tại
- [ ] `components/disposal-form/DisposalDetailModal.tsx/.css` — KHÔNG xóa, thuộc list view
- [ ] `components/disposal-form/DisposalLotSelector.tsx/.css` — KHÔNG xóa, nhúng trong VoucherTableRow
- [ ] `components/import-goods/LotExpiryPopover.tsx/.css` — KHÔNG xóa trong plan này
- [ ] `components/inventory-count/CountFormLayout.tsx` — refactor, KHÔNG xóa ngay

#### 5. Audit Handoff template

Xác nhận handoff template đã đầy đủ:

```
## Handoff — [Sub-phase name]
- Files đã sửa: [liệt kê]
- Component cũ chưa xóa (để sub-phase sau xóa): [liệt kê]
- Lỗi/lưu ý ngoài scope: [liệt kê]
- Build status: `npm run lint` [PASS/FAIL] | `npm run build` [PASS/FAIL]
- Backup path: [nếu có]
- Màn hình cần test tiếp theo: [nếu có]
- API contract đã update (nếu có thay đổi): [liệt kê]
```

#### 6. Audit Backup points

Xác nhận các điểm backup đã được liệt kê:

- [ ] Trước Phase 1 (Foundation)
- [ ] Trước Phase 6 (Pilot DisposalForm)
- [ ] Trước Phase 7.1 (ImportGoods Sidebar)
- [ ] Trước Phase 8 (V1 Removal InventoryCount)
- [ ] Trước Phase 9.1 (Rollout InventoryCount)
- [ ] Trước Phase 10.1 (SupplierExchanges)
- [ ] Trước Phase 11.1 (Cleanup)

---

## Output mong đợi

Sau khi hoàn thành audit, tạo file `docs/plans/voucher-form-component-system/FINAL_AUDIT_REPORT.md` chứa:

1. **API Contract Status** — từng component, trạng thái (OK/Thiếu/Cần update)
2. **Phase Ordering** — xác nhận thứ tự đúng
3. **Conflict Resolution** — nếu có conflict, giải pháp
4. **File Safety** — xác nhận an toàn xóa/đổi tên
5. **Missing Items** — nếu cần thêm gì trước khi code
6. **Go/No-Go Decision** — có thể bắt đầu Phase 0 hay cần bổ sung

---

## Lưu ý khi chạy

- Đây là audit **read-only** — KHÔNG sửa plan, KHÔNG sửa code
- Chỉ tạo report audit
- Nếu phát hiện vấn đề, ghi rõ trong report để xử lý ở chat triển khai
