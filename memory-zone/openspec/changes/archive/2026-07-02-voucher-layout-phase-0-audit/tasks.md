## 0. Pre-Flight

- [x] 0.1 Create project backup using Copy-Item
- [x] 0.2 Confirm `npm run lint` pass
- [x] 0.3 Confirm `npm run build` pass

## 1. Grep & Inventory (Phase 0a)

- [x] 1.1 Run PowerShell command to find all `FormLayout` files
- [x] 1.2 Run PowerShell command to find `DisposalTopBar` / `ImportTopBar` usage
- [x] 1.3 Run PowerShell command to find layout feature flags
- [x] 1.4 Run PowerShell command to find legacy `ig-*` CSS classes in `index.css`
- [x] 1.5 Run PowerShell command to find dead imports
- [x] 1.6 Confirm whether `pages/DisposalForm.css` exists
- [x] 1.7 Confirm whether `useRefactoredCountLayout` is imported anywhere

## 2. Build Checklist (Phase 0b)

- [x] 2.1 Create `docs/plans/voucher-form-layout-ssot/BASELINE_AUDIT.md`
- [x] 2.2 List dead code files to delete in Phase 6
- [x] 2.3 List files with V1 branch to clean
- [x] 2.4 List feature flags to remove
- [x] 2.5 List CSS page-level files to review
- [x] 2.6 List legacy CSS classes in `index.css` to audit

## 3. Backup & Baseline (Phase 0c)

- [x] 3.1 Create full project backup with timestamp
- [x] 3.2 Record backup path in `BASELINE_AUDIT.md`
- [x] 3.3 Confirm baseline `npm run lint` pass
- [x] 3.4 Confirm baseline `npm run build` pass

## 4. Verify Shared Components (Phase 0d)

- [x] 4.1 Verify `SectionBox` / `SectionHeader` / `SectionContent` exist and expose correct props
- [x] 4.2 Verify `TextInput` supports `type="date"`, `disabled`, `value`, `onChange`
- [x] 4.3 Verify `SelectInput` supports `value`, `onChange`, `options`, no-label rendering
- [x] 4.4 Verify `ActionButton` supports required variants
- [x] 4.5 Verify `SummaryRow` supports `label`, `value`, `bold`, `accent` classes
- [x] 4.6 Verify `ModalInfoGrid` supports `items` with `{ label, value, span? }`
- [x] 4.7 Verify `StatusBadge` supports `label`, `type`, `size`
- [x] 4.8 Note any missing API in `BASELINE_AUDIT.md`

## 5. Finalize

- [x] 5.1 Review `BASELINE_AUDIT.md` for completeness
- [x] 5.2 Run `npm run lint` one final time
- [x] 5.3 Run `npm run build` one final time

## Acceptance Criteria

- [x] `BASELINE_AUDIT.md` contains dead code list, V1 branch list, feature flags, CSS files, legacy classes
- [x] Backup exists with timestamp
- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] Shared components are verified and gaps are documented

## Rollback Plan

- Backup: `E:\App ban hàng\vietsale-pro-v7_backup_voucher_layout_phase0_20260702_095000`
- Rollback trigger: Not applicable (no code changes). If documentation is wrong, edit the document.
