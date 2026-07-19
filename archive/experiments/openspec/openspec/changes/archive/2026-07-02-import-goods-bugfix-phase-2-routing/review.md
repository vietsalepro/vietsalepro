## Plan Coverage

- [x] Every sub-phase from PLAN_REFINED for Phase 2 is represented in `tasks.md` (2a, 2b, 2c)
- [x] No sub-phase from PLAN_REFINED is skipped or merged without reason

## File List

### Files to modify
- [ ] `App.tsx`
- [ ] `pages/ImportGoods.tsx`
- [ ] `components/AppTopbar.tsx`
- [ ] Mobile menu component (if different from `AppTopbar.tsx`)

### Files to delete
- [ ] None

### Feature flags to remove
- [ ] None

## Guardrails

- [ ] Business logic handlers (`handleImport`, `handleUpdateImport`, `handleDeleteImport`) are intentionally modified only to navigate after success
- [ ] `types.ts` changes are intentionally documented (none expected)
- [ ] Database / Supabase / RPC changes are intentionally documented (none expected)
- [ ] No unrelated layout or voucher-form changes are included

## Acceptance Criteria Mapping

| PLAN_REFINED criterion | Task / Spec scenario | Status |
|-------------------|----------------------|--------|
| Truy cập `/import/create` hiển thị form tạo phiếu | 1.1 Add route, 5.1 direct URL test | pending |
| Truy cập `/import` vẫn hiển thị tab history | 5.2 history URL test | pending |
| Bấm "Nhập hàng" từ tab history → URL `/import/create` | 2.2 Replace setActiveTab, 5.3 navigation | pending |
| Bấm "Quay lại" / Esc → URL về `/import` | 2.3 Replace cancel, 5.4 back navigation | pending |
| Lưu tạm / Hoàn thành thành công → URL về `/import` | 2.4 Replace save success, 5.5 save navigation | pending |
| F5 ở `/import/create` vẫn ở form create | 5.6 refresh create | pending |
| F5 ở `/import` vẫn ở tab history | 5.7 refresh history | pending |
| Desktop sidebar highlight `/import` khi ở `/import/create` | 3.1 isActiveLink, 5.8 desktop highlight | pending |
| Mobile menu highlight đúng mục Nhập hàng | 3.2 Mobile menu, 5.9 mobile highlight | pending |
| `npm run lint` PASS | 6.1 | pending |
| `npm run build` PASS | 6.2 | pending |

## Verification Steps

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Manual test: navigate to `/import/create`, `/import`, back, save, refresh
- [ ] Desktop sidebar highlight test
- [ ] Mobile menu highlight test
