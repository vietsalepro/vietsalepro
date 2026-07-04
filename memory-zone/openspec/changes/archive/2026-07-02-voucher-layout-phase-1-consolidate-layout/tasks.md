## 0. Pre-Flight

- [x] 0.1 Create project backup using Copy-Item
- [x] 0.2 Confirm `npm run lint` pass
- [x] 0.3 Confirm `npm run build` pass

## 1. Phân tích props hiện tại và thiếu sót (Phase 1a)

- [x] 1.1 Read `components/VoucherFormLayout.tsx` and list existing props
- [x] 1.2 Read `components/VoucherFormLayout.css` and confirm current layout rules
- [x] 1.3 Read `pages/SupplierExchanges.tsx` to confirm alert banner need
- [x] 1.4 Read `pages/InventoryCount.tsx` to confirm stats row belongs to list view, not form view
- [x] 1.5 Record decision: add `banner?: React.ReactNode`
- [x] 1.6 Record decision: do not add `statsRow` prop
- [x] 1.7 Verify design tokens `--color-warning-50`, `--color-warning-200`, `--color-warning-700`, `--text-sm`, `--leading-normal` exist or note fallbacks

**Notes:**
- `SupplierExchanges` currently renders a warning banner outside `VoucherFormLayout`. Phase 1 only adds the `banner` slot so downstream pages can pass it into the layout in Phase 4.
- `InventoryCount` uses `CountFormLayout` for its form view; the stats row belongs to the list view (`/inventory-count`), so `statsRow` is not needed in `VoucherFormLayout` at this time.
- Design tokens `--color-warning-50`, `--color-warning-200`, `--color-warning-700`, and `--leading-normal` do not exist in source `.css` / `.tsx` files (only in built `dist/`). CSS uses fallback hex values as documented in the plan.

## 2. Mở rộng interface và render `banner` slot (Phase 1b)

- [x] 2.1 Add `banner?: React.ReactNode` to `VoucherFormLayoutProps` interface
- [x] 2.2 Destructure `banner` in the component body
- [x] 2.3 Render `{banner && <div className="voucher-banner">{banner}</div>}` between header and body
- [x] 2.4 Run `npm run lint`

## 3. Thêm CSS cho `banner` và tinh chỉnh responsive (Phase 1c)

- [x] 3.1 Add `.voucher-banner` block with `flex-shrink: 0`, padding, token-based colors, font size, line height
- [x] 3.2 Add `.voucher-banner > *` flex alignment rule with `gap: 8px`
- [x] 3.3 Add mobile media query for padding `8px 12px`
- [x] 3.4 Confirm 2-column ratio (~70/30) is unchanged
- [x] 3.5 Confirm banner is not affected by page-level padding
- [x] 3.6 Run `npm run lint`

## 4. Cleanup & Verification

- [x] 4.1 Run `npm run build`
- [x] 4.2 Visual check of `VoucherFormLayout` on desktop without banner
- [x] 4.3 Visual check of a test page with banner (if a temporary test page is used)
- [x] 4.4 Confirm no business logic or `types.ts` changes

## Acceptance Criteria

- [x] `VoucherFormLayout` has optional `banner` prop
- [x] `banner` renders between header and body only when provided
- [x] `.voucher-banner` CSS uses design tokens with fallbacks
- [x] Responsive behavior preserved (desktop 2-column, mobile stacked)
- [x] Decision not to add `statsRow` is documented
- [x] `npm run lint` pass
- [x] `npm run build` pass

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_layout_phase1_20260702_095446`
- Files to restore: `components/VoucherFormLayout.tsx`, `components/VoucherFormLayout.css`
- Rollback trigger: lint/build failure, visual regression, or TypeScript error in downstream usage
