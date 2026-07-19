## Plan Coverage

- [ ] Phase 1a (Prop analysis) is represented in tasks.md
- [ ] Phase 1b (Add banner prop and render) is represented in tasks.md
- [ ] Phase 1c (Banner CSS and responsive) is represented in tasks.md

## File List

### Files to modify
- `components/VoucherFormLayout.tsx` — add `banner?: React.ReactNode` prop and conditional render
- `components/VoucherFormLayout.css` — add `.voucher-banner` styles and mobile media query

### Files to delete
- None in Phase 1

### Feature flags to remove
- None in Phase 1

## Guardrails

- [ ] Business logic handlers are not modified
- [ ] `types.ts` is not modified
- [ ] No database / Supabase / migration changes
- [ ] No page files are modified
- [ ] The `banner` prop is optional and backward compatible
- [ ] Existing layout ratio (~70/30) is preserved

## Acceptance Criteria Mapping

| PLAN_02 criterion | Task / Spec scenario | Status |
|-------------------|----------------------|--------|
| Interface has prop `banner` | Task 1.2 / Spec scenario "TypeScript consumes the new prop" | pending |
| `banner` only renders when provided | Spec scenario "Banner prop is omitted" | pending |
| `banner` sits between header and body | Spec scenario "Banner prop is provided" | pending |
| Banner uses design tokens | Task 1.4 / Spec scenario "Banner renders on desktop" | pending |
| Responsive not broken | Task 1.5 / Spec scenario "Banner renders on mobile" | pending |
| Layout ratio preserved | Task 1.6 | pending |
| `npm run lint` pass | Task 1.7 | pending |
| `npm run build` pass | Task 1.8 | pending |

## Verification Steps

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Inspect `VoucherFormLayout.tsx` and confirm `banner` prop exists and is rendered conditionally between header and body
- [ ] Inspect `VoucherFormLayout.css` and confirm `.voucher-banner` styles exist with token fallbacks
- [ ] Verify desktop banner padding is `12px 16px`
- [ ] Verify mobile (<768px) banner padding is `8px 12px`
- [ ] Verify `VoucherFormLayout` without `banner` renders the same DOM as before
