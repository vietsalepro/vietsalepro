:GIVEN: The user is reviewing the Voucher Form Component System plan before implementation.

Write `review.md` for the OpenSpec change `voucher-form-component-system-plan-a`.

## Plan Coverage

- [ ] Phase 0.1 — Audit ImportGoods is represented in tasks.md
- [ ] Phase 0.2 — Audit InventoryCount is represented in tasks.md
- [ ] Phase 0.3 — Audit SupplierExchanges is represented in tasks.md
- [ ] Phase 0.4 — Audit DisposalForm + Tổng hợp + Backup is represented in tasks.md
- [ ] Phase 1.0 — Foundation is represented in tasks.md
- [ ] Phase 2.0 — Core Controls is represented in tasks.md
- [ ] Phase 3.0 — Data Components is represented in tasks.md
- [ ] Phase 4.0 — Layout Sub-components is represented in tasks.md
- [ ] Phase 5.0 — Overlays (optional) is represented in tasks.md
- [ ] Phase 6.0 — Pilot DisposalForm is represented in tasks.md
- [ ] Phase 7.1 — ImportGoods Sidebar Refactor is represented in tasks.md
- [ ] Phase 7.2a — ImportGoods Search + Table Shell is represented in tasks.md
- [ ] Phase 7.2b — ImportGoods Item Rows + Lot Handling is represented in tasks.md
- [ ] Phase 7.3 — ImportGoods Page Integration & Cleanup is represented in tasks.md
- [ ] Phase 7.4 — ImportGoods Dead Code Cleanup is represented in tasks.md
- [ ] Phase 8.1 — InventoryCount Form View Refactor is represented in tasks.md
- [ ] Phase 8.2 — InventoryCount List View & Cleanup is represented in tasks.md
- [ ] Phase 8.3 — InventoryCount Dead Code Cleanup is represented in tasks.md
- [ ] Phase 9.1 — SupplierExchanges Create Form Refactor is represented in tasks.md
- [ ] Phase 9.2 — SupplierExchanges Wizard Integration is represented in tasks.md
- [ ] Phase 9.3 — SupplierExchanges Dead Code Cleanup is represented in tasks.md
- [ ] Phase 10.1a-d, 10.2a-b, 10.3, 10.4a-b — Cleanup & Verification are represented in tasks.md

## File List

### Files to create
- [ ] `components/voucher-form/index.ts`
- [ ] `components/voucher-form/VoucherFormLayout.tsx` + `.css`
- [ ] `components/voucher-form/VoucherHeader.tsx` + `.css`
- [ ] `components/voucher-form/VoucherSidebar.tsx` + `.css`
- [ ] `components/voucher-form/VoucherActions.tsx` + `.css`
- [ ] `components/voucher-form/VoucherBanner.tsx` + `.css`
- [ ] `components/voucher-form/VoucherScrollArea.tsx` + `.css`
- [ ] `components/voucher-form/VoucherButton.tsx` + `.css`
- [ ] `components/voucher-form/VoucherInput.tsx` + `.css`
- [ ] `components/voucher-form/VoucherTextarea.tsx` + `.css`
- [ ] `components/voucher-form/VoucherSelect.tsx` + `.css`
- [ ] `components/voucher-form/VoucherLabel.tsx` + `.css`
- [ ] `components/voucher-form/VoucherField.tsx` + `.css`
- [ ] `components/voucher-form/VoucherToggle.tsx` + `.css`
- [ ] `components/voucher-form/VoucherSearch.tsx` + `.css`
- [ ] `components/voucher-form/VoucherProductDropdown.tsx` + `.css`
- [ ] `components/voucher-form/VoucherAddButton.tsx` + `.css`
- [ ] `components/voucher-form/VoucherTable.tsx` + `.css`
- [ ] `components/voucher-form/VoucherTableRow.tsx` + `.css`
- [ ] `components/voucher-form/VoucherEmpty.tsx` + `.css`
- [ ] `components/voucher-form/VoucherTotals.tsx` + `.css`
- [ ] `components/voucher-form/VoucherSection.tsx` + `.css`
- [ ] `components/voucher-form/VoucherSectionHeader.tsx` + `.css`
- [ ] `components/voucher-form/VoucherSectionContent.tsx` + `.css`
- [ ] `components/voucher-form/__demo.tsx` (temporary)
- [ ] `utils/classNames.ts`

### Files to modify
- [ ] `components/VoucherFormLayout.tsx` → move to `components/voucher-form/` then delete old
- [ ] `components/VoucherFormLayout.css` → move to `components/voucher-form/` then delete old
- [ ] `pages/ImportGoods.tsx` + `pages/ImportGoods.css`
- [ ] `pages/InventoryCount.tsx` + `pages/InventoryCount.css`
- [ ] `components/inventory-count/CountFormLayout.tsx`
- [ ] `pages/DisposalForm.tsx` + `pages/Disposals.css`
- [ ] `pages/SupplierExchanges.tsx` + `pages/SupplierExchanges.css`

### Files to delete (after grep confirmation)
- [ ] `components/import-goods/ImportProductSearch.tsx/.css`
- [ ] `components/import-goods/ImportItemsTable.tsx/.css`
- [ ] `components/import-goods/ImportItemRow.tsx/.css`
- [ ] `components/disposal-form/DisposalProductSearch.tsx`
- [ ] `components/disposal-form/DisposalItemsTable.tsx/.css`
- [ ] `components/disposal-form/DisposalItemRow.tsx/.css`
- [ ] `components/inventory-count/ProductSearchDropdown.tsx/.css`
- [ ] `components/inventory-count/CountItemsTable.tsx/.css`
- [ ] Dead create-form CSS in `pages/ImportGoods.css`, `pages/InventoryCount.css`, `pages/Disposals.css`, `pages/SupplierExchanges.css`
- [ ] `components/voucher-form/__demo.tsx` at phase 10

### Feature flags to remove
- [ ] None.

## Guardrails

- [ ] Business logic handlers are not modified
- [ ] `types.ts` is not modified
- [ ] No database / Supabase / migration changes
- [ ] Pages only pass content into `VoucherFormLayout` slots
- [ ] `TextInput` / `ActionButton` global components are not modified
- [ ] `DisposalDetailModal` is not touched
- [ ] `DisposalLotSelector` is preserved and re-embedded
- [ ] `LotExpiryPopover` is preserved
- [ ] `CountFormLayout.tsx` is not deleted
- [ ] No new dependencies are added

## Acceptance Criteria Mapping

| PLAN_A criterion | Task / Spec scenario | Status |
|------------------|----------------------|--------|
| 4 màn phiếu dùng components từ `components/voucher-form/` | Sub-phases 6.0, 7.1-7.4, 8.1-8.3, 9.1-9.2 | Pending |
| `VoucherFormLayout` public API giữ nguyên | Phase 1.0 | Pending |
| `VoucherProductDropdown` hỗ trợ 2 mode + keyboard navigation | Phase 3.0 + spec scenario | Pending |
| `VoucherTableRow` hỗ trợ `children`/`renderCells` | Phase 3.0 + spec scenario | Pending |
| `DisposalLotSelector` nhúng lại trong row | Phase 6.0 + spec scenario | Pending |
| `LotExpiryPopover` giữ nguyên | Phase 7.2b + spec scenario | Pending |
| `SupplierExchanges` không dùng table template | Phase 9.1 + spec scenario | Pending |
| Dead code xóa sau grep | Phase 10.1a-10.2b | Pending |
| `npm run lint` pass sau mỗi sub-phase | All verification sections | Pending |
| `npm run build` pass sau mỗi phase lớn | All verification sections | Pending |
| 4 flow nghiệp vụ hoạt động đúng | Phase 10.4a-10.4b | Pending |
| Responsive OK | Phase 10.4d | Pending |

## Verification Steps

- [ ] `npm run lint` pass after each sub-phase
- [ ] `npm run build` pass after each major phase
- [ ] Manual test of one affected flow after each rollout phase
- [ ] Visual regression baseline before/after each major phase
- [ ] Responsive test (desktop / tablet / mobile) at phase 10.4d
