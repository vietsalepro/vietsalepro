:GIVEN: The user is implementing the Voucher Form Component System plan.

Write `design.md` for the OpenSpec change `voucher-form-component-system-plan-a`.

Context: The design must summarize the architecture, key technical decisions, risks, and migration/rollback approach for implementing PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md. It should not be a line-by-line implementation guide, but should give enough detail for an implementer to proceed across all sub-phases.

## Context

- Project: VietSales Pro v7 (`C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7`).
- Current state: `VoucherFormLayout` exists as a single layout container in `components/VoucherFormLayout.tsx/.css`. Four voucher pages (`ImportGoods`, `InventoryCount`, `DisposalForm`, `SupplierExchanges`) each implement their own search, table, input, button, and sidebar sections, causing duplicate CSS and inconsistent UX.
- No git repository; backups are manual `Copy-Item` of the project folder.
- Baseline lint/build: `npm run lint` and `npm run build` currently pass.
- Reference UI: `C:\Users\SUACAUBA\Downloads\Project\template-ui\ui`.
- Source plan: `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master.md` and `PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`.

## Goals / Non-Goals

**Goals:**
- Centralize all voucher-form UI controls under `components/voucher-form/`.
- Provide reusable, design-token-based layout, controls, data display, and section components.
- Refactor 4 voucher pages to use the new system without changing business logic.
- Remove dead CSS/components after confirming they are no longer imported.
- Maintain keyboard navigation, accessibility, and responsive behavior.

**Non-Goals:**
- Do not modify business logic, handlers, validation, API calls, or state management.
- Do not modify `types.ts` or database/Supabase/migrations.
- Do not replace global `TextInput`/`ActionButton` components.
- Do not refactor `DisposalDetailModal` (list view) or replace `LotExpiryPopover`/`DisposalLotSelector`.
- Do not add new dependencies.

## Decisions

| Decision | Rationale | Alternative considered |
|----------|-----------|------------------------|
| Move `VoucherFormLayout` into `components/voucher-form/` and update all imports | Single source of truth; avoids confusion between old and new file | Keep old file as re-export wrapper (rejected to prevent future confusion) |
| Create a small `classNames` utility in `utils/classNames.ts` | Project does not use `clsx`/`classnames`; keeps zero new dependencies | Add `clsx`/`classnames` dependency (rejected per scope lock) |
| `VoucherProductDropdown` supports `client` and `server` modes | Replaces three existing search components with different data/filter strategies | Force all pages to one mode (rejected due to risk of breaking InventoryCount flow) |
| `VoucherTableRow` supports both `children` and `renderCells` | Allows flexible row layouts while still supporting simple cell-based rows | Single render strategy only (rejected because `DisposalLotSelector`/`LotExpiryPopover` need custom embedding) |
| `VoucherSection` is card-styled by default but flat inside `VoucherSidebar` | Matches current sidebar look without duplicating component logic | Create separate sidebar-section component (rejected to keep API small) |
| `SupplierExchanges` keeps wizard structure, only replaces input/button/section styling | Page is not a table; forcing table template would break UX | Refactor into `ExchangeForm.tsx` wrapper only if page becomes too long (optional) |
| Pilot on `DisposalForm` first | Smallest page (~13KB); lowest risk to validate system before larger pages | Start with `ImportGoods` (rejected because it is the largest and riskiest) |
| `TotalsSection` logic stays in `pages/ImportGoods.tsx`; `VoucherTotals` only displays values | Prevents business logic from leaking into UI component | Move calculation into `VoucherTotals` (rejected as business-logic change) |

## Risks / Trade-offs

- **[High]** Xóa nhầm file đang được import (`CountFormLayout.tsx` vẫn dùng, `DisposalDetailModal` ngoài scope). → Mitigation: chạy `grep` trước khi xóa; whitelist các file cấm xóa.
- **[High]** Mất keyboard navigation trong search dropdown. → Mitigation: `VoucherProductDropdown` phải giữ ArrowUp/Down/Enter/Esc, click-outside, scroll-into-view.
- **[High]** `SupplierExchanges` wizard bị vỡ nếu ép table template. → Mitigation: chỉ thay input/button/section, giữ nguyên lot grid/receipt list/item cards.
- **[Medium]`LotExpiryPopover`/`DisposalLotSelector` bị thay sai hoặc mất logic. → Mitigation: giữ nguyên file và nhúng lại vào `VoucherTableRow` qua `children`/`renderCells`.
- **[Medium]** CSS mới xung đột CSS cũ. → Mitigation: refactor từng màn, chạy lint/build sau mỗi màn, giữ CSS list view.
- **[Medium]** Responsive bị hỏng. → Mitigation: giữ nguyên breakpoints và layout structure từ `VoucherFormLayout.css`, test tablet/mobile.
- **[Medium]** `VoucherTableRow` API thiếu prop khi code. → Mitigation: khóa API trong plan; nếu thiếu phải update plan trước khi thêm prop.
- **[Low]** Demo component `__demo.tsx` bị sót. → Mitigation: cleanup checklist phase 10.

## Migration / Rollback

**How to deploy:**
1. Backup project before Phase 1 (foundation).
2. Execute sub-phases in order: 0.x audit → 1.0 foundation → 2.0 controls → 3.0 data → 4.0 sections → 5.0 overlays (optional) → 6.0 DisposalForm pilot → 7.1-7.4 ImportGoods → 8.1-8.3 InventoryCount → 9.1-9.3 SupplierExchanges → 10.x cleanup/verify.
3. Run `npm run lint` after each sub-phase and `npm run build` after each major phase.
4. Capture visual regression baseline before/after each major phase.
5. Manual test 4 flows after phase 10.

**How to undo:**
- If a sub-phase fails lint/build or manual test and cannot be fixed in 30 minutes, restore the entire project folder from the most recent backup.
- Do not cherry-pick files; restore the whole backup to avoid partial state.
- After restore, run `npm run lint` and `npm run build` to confirm clean state.

## Open Questions

- None at plan creation. Any new prop/mode discovered during implementation must be documented in the plan before coding.
