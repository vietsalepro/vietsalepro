# VoucherFormLayout SSOT — Phase 0 Audit & Baseline

> Project: VietSale Pro v7
> Date: 2026-07-02
> Plan: `PLAN_02_VoucherFormLayout_SSOT_Detailed.md`
> Scope: Audit only — no code changes in this phase.

---

## 1. Phase 0a — Grep & Inventory

### 1.1. FormLayout references

| File | Line(s) | Note |
|------|---------|------|
| `components/VoucherFormLayout.tsx` | 3, 5, 29, 39 | SSOT target component |
| `components/VoucherFormLayout.css` | — | SSOT target CSS |
| `components/inventory-count/CountFormLayout.tsx` | 2, 6, 32, 45, 46, 52, 71 | Wraps `VoucherFormLayout` |
| `components/inventory-count/CountFormLayout.css` | 3 | CountFormLayout V2 styles |
| `pages/InventoryCount.tsx` | 10, 1391, 1416 | Uses `CountFormLayout` |
| `pages/SupplierExchanges.tsx` | 22, 1639 | Uses `VoucherFormLayout` directly |
| `pages/DisposalForm.tsx` | 7, 334 | Uses `VoucherFormLayout` directly |
| `pages/ImportGoods.tsx` | 6, 875 | Uses `VoucherFormLayout` directly |
| `components/import-goods/ImportFormLayout.tsx` | 3, 5, 12, 22 | Legacy V1 layout wrapper |
| `components/import-goods/ImportFormLayout.css` | 1 | Legacy V1 layout CSS |
| `components/disposal-form/DisposalFormLayout.tsx` | 3, 5, 12, 22 | Legacy V1 layout wrapper |
| `components/disposal-form/DisposalFormLayout.css` | — | Legacy V1 layout CSS |
| `features.ts` | 54, 57, 60 | Feature flags |

**Conclusion:** `ImportGoods`, `DisposalForm`, `SupplierExchanges` and `InventoryCount` (via `CountFormLayout`) already render through `VoucherFormLayout`. The old `ImportFormLayout`/`DisposalFormLayout` components are dead code.

### 1.2. Dead topbar usage (`ImportTopBar` / `DisposalTopBar`)

| File | Line | Note |
|------|------|------|
| `pages/ImportGoods.tsx` | 7 | Import `ImportTopBar` — **dead import** (only referenced in a comment at line 816) |
| `pages/DisposalForm.tsx` | 8 | Import `DisposalTopBar` — **used?** |
| `components/import-goods/ImportTopBar.tsx` | — | Component definition |
| `components/import-goods/ImportTopBar.css` | — | Styles |
| `components/disposal-form/DisposalTopBar.tsx` | — | Component definition |
| `components/disposal-form/DisposalTopBar.css` | — | Styles |
| `components/import-goods/ImportProductSearch.tsx` | 25 | Comment references ImportTopBar |
| `components/disposal-form/DisposalProductSearch.tsx` | 24 | Comment references DisposalTopBar |

**Conclusion:** `ImportTopBar` is imported but never rendered in `pages/ImportGoods.tsx`. `DisposalTopBar` is imported in `pages/DisposalForm.tsx` and must be verified for actual render usage during Phase 6 cleanup. The topbar components and their CSS files are candidates for deletion.

### 1.3. Layout feature flags

All flags are defined in `features.ts` and are currently `true`:

- `useRefactoredImportLayout` — imported in `ImportFormLayout.tsx`, `ImportTopBar.tsx`, `ImportItemRow.tsx`, `ImportItemsTable.tsx`, `ImportSidebar/*Section.tsx`, `ImportSidebar/ActionFooter.tsx`.
- `useRefactoredDisposalLayout` — imported in `DisposalFormLayout.tsx`, `DisposalTopBar.tsx`, `DisposalItemRow.tsx`, `DisposalItemsTable.tsx`, `DisposalSidebar/*Section.tsx`, `DisposalSidebar/ActionFooter.tsx`.
- `useRefactoredCountLayout` — defined in `features.ts` but **not imported anywhere** in `components/` or `pages/`.

**Conclusion:** All three flags are permanently `true` and every branch relying on them is the V2 path. They should be removed in Phase 6 along with the V1 code paths.

### 1.4. Legacy `ig-*` CSS classes in `index.css`

Detected classes in `index.css` (lines 460–2873):

- `.ig-layout` (2 definitions)
- `.ig-layout-main`
- `.ig-layout-aside`
- `.ig-card`
- `.ig-card-flat`
- `.ig-title`
- `.ig-label`
- `.ig-body`
- `.ig-muted`
- `.ig-num`
- `.ig-input` + `.ig-input:focus` + `.ig-input::placeholder` + `.ig-input:hover` + `.ig-input:disabled` + `.ig-input-sm`
- `.ig-textarea` + `.ig-textarea:focus`
- `.ig-btn-primary` + `:hover` + `:disabled`
- `.ig-btn-secondary` + `:hover` + `:disabled`
- `.ig-btn-ghost` + `:hover`
- `.ig-btn-icon` + `:hover` + `.danger:hover`
- `.ig-search` + `:focus-within` + `input` + `input::placeholder` + `.ig-search-kbd`
- `.ig-badge` + `.ig-badge-draft` + `.ig-badge-completed` + `.ig-badge-danger` + `.ig-badge-neutral` + `.ig-badge-info`
- `.ig-section` + `.ig-section:last-child` + `.ig-section-title`
- `.ig-totals-row` + `.label` + `.value` + `.strong`

**Conclusion:** These classes are legacy V1 styling. They must be audited for usage after V1 components are removed in Phase 6. Any class with zero remaining references should be deleted from `index.css`.

### 1.5. Dead imports (`ImportTopBar`, `DisposalTopBar`, `StatsSection`)

| File | Import | Status |
|------|--------|--------|
| `pages/ImportGoods.tsx` | `ImportTopBar` | Dead import |
| `pages/DisposalForm.tsx` | `DisposalTopBar` | Candidate for removal (verify render) |
| `pages/DisposalForm.tsx` | `StatsSection` | Candidate for removal (verify render) |

### 1.6. `pages/DisposalForm.css`

**Result:** `pages/DisposalForm.css` does **not** exist.

### 1.7. `useRefactoredCountLayout` imports

**Result:** `useRefactoredCountLayout` is **not imported** in any component or page. Only defined in `features.ts`.

---

## 2. Phase 0b — Baseline Checklist

### 2.1. Dead code to delete in Phase 6

- `components/import-goods/ImportFormLayout.tsx`
- `components/import-goods/ImportFormLayout.css`
- `components/import-goods/ImportTopBar.tsx`
- `components/import-goods/ImportTopBar.css`
- `components/disposal-form/DisposalFormLayout.tsx`
- `components/disposal-form/DisposalFormLayout.css`
- `components/disposal-form/DisposalTopBar.tsx`
- `components/disposal-form/DisposalTopBar.css`
- `components/disposal-form/DisposalSidebar/StatsSection.tsx`
- `components/disposal-form/DisposalSidebar/StatsSection.css`

### 2.2. V1 branch files to clean (feature flags inside)

- `components/import-goods/ImportSidebar/SupplierSection.tsx`
- `components/import-goods/ImportSidebar/ReceiptInfoSection.tsx`
- `components/import-goods/ImportSidebar/TotalsSection.tsx`
- `components/import-goods/ImportSidebar/NoteSection.tsx`
- `components/import-goods/ImportSidebar/ActionFooter.tsx`
- `components/import-goods/ImportItemRow.tsx`
- `components/import-goods/ImportItemsTable.tsx`
- `components/disposal-form/DisposalSidebar/InfoSection.tsx`
- `components/disposal-form/DisposalSidebar/StatsSection.tsx`
- `components/disposal-form/DisposalSidebar/ReasonSection.tsx`
- `components/disposal-form/DisposalSidebar/NoteSection.tsx`
- `components/disposal-form/DisposalSidebar/ActionFooter.tsx`
- `components/disposal-form/DisposalItemRow.tsx`
- `components/disposal-form/DisposalItemsTable.tsx`

### 2.3. Feature flags to remove

- `useRefactoredImportLayout`
- `useRefactoredDisposalLayout`
- `useRefactoredCountLayout`

### 2.4. Files to refine (keep, no deletion)

- `components/VoucherFormLayout.tsx`
- `components/VoucherFormLayout.css`
- `components/inventory-count/CountFormLayout.tsx`
- `components/inventory-count/CountFormLayout.css`
- `components/inventory-count/CountSidebar/CountInfoSection.tsx`
- `components/inventory-count/CountSidebar/CountSummary.tsx`
- `components/FormTextarea.tsx` (to create in Phase 3a)
- `components/FormTextarea.css` (to create in Phase 3a)
- `components/SummaryRow.tsx`
- `components/SummaryRow.css` (to create in Phase 0e)
- `pages/ImportGoods.tsx`
- `pages/InventoryCount.tsx`
- `pages/DisposalForm.tsx`
- `pages/SupplierExchanges.tsx`
- `features.ts`

### 2.5. Page-level CSS to review

- `pages/ImportGoods.css` — exists
- `pages/SupplierExchanges.css` — exists
- `pages/InventoryCount.css` — exists
- `pages/DisposalForm.css` — does **not** exist

### 2.6. Global CSS to audit in Phase 6c

- `index.css` — legacy `ig-*` classes listed in section 1.4 above.

### 2.7. Dead imports to remove

- `ImportTopBar` from `pages/ImportGoods.tsx`
- `DisposalTopBar` from `pages/DisposalForm.tsx` (after verifying it is not rendered)
- `StatsSection` from `pages/DisposalForm.tsx` (after verifying it is not rendered)

---

## 3. Phase 0c — Backup & Baseline Verification

### 3.1. Backup location

```
E:\App ban hàng\vietsale-pro-v7_backup_voucher_layout_phase0_20260702_095000
```

### 3.2. Baseline verification

- `npm run lint` — must pass before any refactor.
- `npm run build` — must pass before any refactor.

---

## 4. Phase 0d — Verify Shared Components

| Component | Exists | Props/API verified | Notes |
|-----------|--------|-------------------|-------|
| `SectionBox` | ✅ `components/SectionBox.tsx` | `children`, `className` | OK |
| `SectionHeader` | ✅ exported from `SectionBox.tsx` | `title`, `subtitle?`, `action?`, `className?` | OK |
| `SectionContent` | ✅ exported from `SectionBox.tsx` | `children`, `className?` | OK |
| `TextInput` | ✅ `components/TextInput.tsx` | `type` overrides default `type="text"`, `disabled`, `size`, `fullWidth`, `value`, `onChange`, `label?`, `placeholder?`, `error?`, `helperText?` | Note: `type="date"`/`type="datetime-local"` will work because `input` accepts any `type` via `...rest`. CSS for date picker icon is not explicitly styled; may need minor adjustment in `VoucherFormLayout.css` or a dedicated `FormDateInput` if visual issues arise. |
| `SelectInput` | ✅ `components/SelectInput.tsx` | `value`, `onChange`, `options`, `disabled`, `label?`, `fullWidth`, `size`, `placeholder?`, `error?`, `helperText?` | Label is conditional (`{label && ...}`), so no-label usage is safe. OK |
| `ActionButton` | ✅ `components/ActionButton.tsx` | `primary`, `secondary`, `danger`, `ghost`, `loading`, `disabled`, `fullWidth`, `className`, `icon` | OK. Named exports `PrimaryButton`, `SecondaryButton`, `DangerButton`, `GhostButton` available. |
| `ModalInfoGrid` | ✅ `components/ModalInfoGrid.tsx` | `items: { label, value, span?, mono? }` | OK |
| `SummaryRow` | ✅ `components/SummaryRow.tsx` | `label`, `value`, `bold?`, `accent?` (default `'text-slate-800'`) | Default accent is a Tailwind class, not a design-token class. Accent classes `.summary-row-value--danger`, `.summary-row-value--success` exist only in section CSS files. `.summary-row-value--neutral` and `.summary-row-value--warning` do **not** exist yet. Need `components/SummaryRow.css`. |
| `StatusBadge` | ✅ `components/StatusBadge.tsx` | `label`, `type` (default/success/warning/danger/info), `size` (sm/md/lg), `className?` | OK |

**Component gaps documented:**
- `SummaryRow` needs a dedicated `components/SummaryRow.css` with `.summary-row-value--danger`, `.summary-row-value--success`, `.summary-row-value--neutral`, `.summary-row-value--warning` so accent styling survives deletion of section CSS files.

---

## 5. Phase 0e — Verify Design Tokens & Accent Classes

### 5.1. Tokens required for banner (Phase 1c)

| Token | Exists in `design-system-tokens.css` | Value | Status |
|-------|--------------------------------------|-------|--------|
| `--color-warning-50` | ✅ line 98 | `#fffbeb` | OK |
| `--color-warning-200` | ✅ line 100 | `#fde68a` | OK |
| `--color-warning-700` | ✅ line 106 | `#b45309` | OK |
| `--text-sm` | ✅ line 272 | `13px` | OK |
| `--leading-normal` | ✅ line 288 | `1.5` | OK |

### 5.2. Tokens required for `FormTextarea` (Phase 3a)

| Token | Exists | Status |
|-------|--------|--------|
| `--space-3` | ✅ | OK |
| `--space-9` | ✅ | OK |
| `--space-1` | ✅ | OK |
| `--color-border-default` | ✅ | OK |
| `--color-border-focus` | ✅ | OK |
| `--color-bg-primary` | ✅ | OK |
| `--color-bg-disabled` | ✅ | OK |
| `--color-text-primary` | ✅ | OK |
| `--color-text-muted` | ✅ | OK |
| `--color-text-disabled` | ✅ | OK |
| `--color-text-danger` | ✅ (semantic) | OK |
| `--radius-lg` | ✅ | OK |
| `--text-sm` | ✅ | OK |
| `--text-xs` | ✅ | OK |
| `--font-normal` | ✅ | OK |
| `--font-medium` | ✅ | OK |
| `--leading-normal` | ✅ | OK |
| `--motion-fast` | ✅ | OK |
| `--ease-standard` | ✅ | OK |
| `--color-primary-100` | ✅ | OK |
| `--opacity-70` | ✅ | OK |

**Conclusion:** All required design tokens exist in `design-system-tokens.css` and are imported via `index.css`. No token additions are required for Phase 0–3 work.

### 5.3. Accent classes for `SummaryRow`

| Class | Defined in | Status |
|-------|------------|--------|
| `.summary-row-value--danger` | `components/import-goods/ImportSidebar/TotalsSection.css` | Will be lost when file is deleted |
| `.summary-row-value--success` | `components/import-goods/ImportSidebar/TotalsSection.css` | Will be lost when file is deleted |
| `.summary-row-value--danger` | `components/disposal-form/DisposalSidebar/StatsSection.css` | Will be lost when file is deleted |
| `.summary-row-value--neutral` | **Not defined anywhere** | Must create in `components/SummaryRow.css` |
| `.summary-row-value--warning` | **Not defined anywhere** | Must create in `components/SummaryRow.css` |

### 5.4. Count-specific accent classes

| Class | Defined in | Migration plan |
|-------|------------|----------------|
| `.count-summary-value--positive` | `components/inventory-count/CountSidebar/CountSummary.css` | Can be replaced by `.summary-row-value--success` or kept local if CountSummary remains as a thin wrapper |
| `.count-summary-value--negative` | `components/inventory-count/CountSidebar/CountSummary.css` | Can be replaced by `.summary-row-value--danger` or kept local |
| `.count-summary-value--neutral` | `components/inventory-count/CountSidebar/CountSummary.css` | Can be replaced by `.summary-row-value--neutral` or kept local |
| `.count-info-diff--positive` | `components/inventory-count/CountSidebar/CountInfoSection.css` | Keep local; not a `SummaryRow` usage |
| `.count-info-diff--negative` | `components/inventory-count/CountSidebar/CountInfoSection.css` | Keep local; not a `SummaryRow` usage |

---

## 6. Summary & Risk

- **No code changes** were made in Phase 0.
- **No business logic, types.ts, or database** was touched.
- All 4 voucher pages already route through `VoucherFormLayout` (directly or via `CountFormLayout`).
- Legacy V1 layout wrappers, topbars, and feature flags are identified and ready for removal in Phase 6.
- `SummaryRow` requires a new `components/SummaryRow.css` to host accent classes before section CSS files are deleted.
- All required design tokens exist in `design-system-tokens.css`.

**Risk:** 🟢 Low — audit only, no functional changes.

**Next step:** Phase 1 — strengthen `VoucherFormLayout` (add `banner` prop and responsive CSS).
