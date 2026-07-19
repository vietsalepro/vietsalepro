## Plan Coverage

- [x] Phase 7 from PLAN_REFINED is represented in `tasks.md` (single verification sub-phase)
- [x] No earlier sub-phase is skipped; this phase only verifies

## File List

### Files to modify
- [ ] `AGENTS.md` (update with results)

### Files to delete
- [ ] None

### Feature flags to remove
- [ ] None

## Guardrails

- [ ] Business logic handlers are not modified during this phase
- [ ] `types.ts` is not modified during this phase
- [ ] Database / Supabase / RPC changes are not introduced during this phase
- [ ] No unrelated layout or voucher-form changes are included

## Acceptance Criteria Mapping

| PLAN_REFINED criterion | Task / Spec scenario | Status |
|-------------------|----------------------|--------|
| `npm run lint` PASS | 1.1 | pending |
| `npm run build` PASS | 1.2 | pending |
| Toàn bộ luồng tạo/sửa/xóa phiếu nhập hoạt động | 2.1 / 2.2 | pending |
| Tồn kho, giá vốn, công nợ NCC nhất quán sau CRUD | 3.1 / 3.2 | pending |
| URL `/import/create` hoạt động đúng | 4.1 | pending |
| Message lỗi xóa phiếu rõ ràng | 4.2 | pending |
| Backup cuối cùng được tạo | 5.1 | pending |

## Verification Steps

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Manual end-to-end test: create supplier, receipt with two products, discount, shipping, save draft, complete, view, delete
- [ ] Manual test: inventory, cost, and supplier debt after create and delete
- [ ] Manual test: `/import`, `/import/create`, back, F5
- [ ] Manual test: delete error message when product/lot sold out
- [ ] Report check: `get_inventory_report` and `get_profit_report` / `get_sales_report`
