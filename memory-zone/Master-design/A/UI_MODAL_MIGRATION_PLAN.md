# UI MODAL MIGRATION PLAN — Design System Standardization

> **Source:** UI_MODAL_AUDIT_REPORT.md + UI_MODAL_MAPPING_REPORT.md  
> **Target:** MASTER_MODAL_BLUEPRINT_V1 + all Design Standards  
> **Date:** 2026-06-24

---

## MIGRATION PHASES

### PHASE A — Core Framework Fix

**Goal:** Fix MasterModal and shared infrastructure first, so all downstream modals inherit correct behavior.

| Task | Files Affected | Risk | Dependencies | Est. Impact |
|------|---------------|------|--------------|-------------|
| A1. Fix MasterModal z-index from `z-[9999]` → `z-50` (modal), `z-40` (overlay) | `components/MasterModal.tsx` | Low | None | No visual change |
| A2. Fix MasterModal typography `font-bold` → `font-semibold` for h2 | `components/MasterModal.tsx` | Low | None | Subtle font weight change |
| A3. Add design token CSS classes to MasterModal (replace custom CSS vars) | `components/MasterModal.tsx` | Low | `master-design-system-tokens.md` | No visual change |
| A4. Add aria attributes for loading/error states | `components/MasterModal.tsx` | Low | None | Accessibility improvement |
| A5. Fix DisposalLotSelector border radius & shadow | `components/disposal-form/DisposalLotSelector.tsx` | Low | None | Visual alignment |
| A6. Fix BatchSelectionModal z-index from `z-[110]` → z-50 | `components/BatchSelectionModal.tsx` | Low | None | No visual change |

**Phase A Total: 6 files, LOW risk, ~30 min effort**

---

### PHASE B — POS Modal Overhaul (3 High-Effort Modals)

**Goal:** Refactor the 3 POS modals to wrap in MasterModal and use standard components.

#### B1. PaymentModal

**Approach:** REPLACE UI LAYER only — keep business logic (payment method selection, amount calculation, confirm handler, formatting).

**Changes:**
1. Remove `fixed inset-0` backdrop — use MasterModal's built-in overlay
2. Remove framer-motion `<motion.div>` — use `<MasterModal>` container
3. Remove purple gradient header — use MasterModal header with `accentColor="violet"`
4. Wrap payment method grid in `<ModalSection title="Phương thức">`
5. Wrap amount input in `<ModalSection title="Số tiền">`
6. Wrap quick amounts in inline flex row within section
7. Wrap change amount in `<StatusBadge variant="success">`
8. Move confirm button to MasterModal footer as `<ModalButton variant="primary" size="md">`
9. Replace all color classes (`#6C4DFF`, `#8B7CFF`, `#ECEEF5`, etc.) with design tokens
10. Remove `rounded-[28px]` — inherit from MasterModal
11. Remove `z-[200]/[210]` — inherit from MasterModal

**Files Affected:** `components/desktop-pos/modals/PaymentModal.tsx`
**Risk:** Medium (payment flow critical — test carefully)
**Dependencies:** Phase A (MasterModal fix)
**Est. Impact:** ~40 lines changed (add MasterModal wrapper, remove ~20 lines of custom container code)

#### B2. PromotionModal

**Approach:** REPLACE UI LAYER — keep business logic (toggle selection, discount calculation, suggestions list).

**Changes:**
1. Remove custom backdrop — use MasterModal
2. Remove framer-motion — use MasterModal
3. Remove purple gradient header — use MasterModal header
4. Wrap promotion list in `<ModalSection title="Khuyến mãi phù hợp">`
5. Keep promotion card items but restyle with standard tokens
6. Replace custom radio/checkbox circles with standard component
7. Move counter + confirm button to MasterModal footer
8. Replace `rounded-[28px]` → inherit
9. Replace `z-[200]/[210]` → inherit

**Files Affected:** `components/desktop-pos/modals/PromotionModal.tsx`
**Risk:** Medium
**Dependencies:** Phase A
**Est. Impact:** ~30 lines changed

#### B3. CustomerOrdersModal

**Approach:** REPLACE UI LAYER — keep business logic (data fetching, filter by customer, loading state).

**Changes:**
1. Remove custom backdrop — use MasterModal
2. Remove framer-motion — use MasterModal
3. Remove purple gradient header — use MasterModal header
4. Wrap customer info in `<ModalSection>` with `<ModalInfoGrid>`
5. Replace loading spinner with skeleton loader per StateStandard
6. Replace empty state with standard empty state component
7. Restyle order list items with standard tokens
8. Replace `rounded-[28px]` → inherit
9. Replace `z-[200]/[210]` → inherit

**Files Affected:** `components/desktop-pos/modals/CustomerOrdersModal.tsx`
**Risk:** Low (read-only data display, no mutations)
**Dependencies:** Phase A
**Est. Impact:** ~35 lines changed

**Phase B Total: 3 files, MEDIUM risk, ~2 hours effort**

---

### PHASE C — Medium-Effort Modal Overhaul (BatchSelection, QuickAddCustomer, RewardModal)

#### C1. BatchSelectionModal

**Approach:** REPLACE container with MasterModal, keep lot card UI (already mostly aligned).

**Changes:**
1. Wrap in `<MasterModal size="sm">` — replaces custom container
2. Remove `z-[110]` — inherit z-50
3. Replace `animate-fade-in` → MasterModal's mmFadeUp
4. Replace `bg-gray-*` → `bg-slate-*` tokens
5. Move footer buttons to MasterModal footer as `ModalButton`
6. Use standard empty state for "Hết hàng" state
7. Replace quantity +/- buttons with InputStandard number variant

**Files Affected:** `components/BatchSelectionModal.tsx`
**Risk:** Medium (lot selection affects POS checkout flow)
**Dependencies:** Phase A
**Est. Impact:** ~25 lines changed

#### C2. QuickAddCustomerModal

**Approach:** Wrap in MasterModal, standardize form inputs.

**Changes:**
1. Wrap in `<MasterModal size="sm">`
2. Use `<ModalSection title="Thông tin khách hàng">` for form fields
3. Replace custom inputs with `<InputStandard>` components
4. Add `ModalButton` primary (Lưu) + secondary (Huỷ) in footer

**Files Affected:** `components/desktop-pos/modals/QuickAddCustomerModal.tsx`
**Risk:** Low (simple form with standard validation)
**Dependencies:** Phase A
**Est. Impact:** ~15 lines changed

#### C3. RewardModal

**Approach:** Wrap in MasterModal.

**Changes:**
1. Wrap in `<MasterModal size="md">`
2. Add standard header
3. Use `<ModalSection>` for reward list
4. Add standard footer with close button

**Files Affected:** `components/desktop-pos/modals/RewardModal.tsx`
**Risk:** Low
**Dependencies:** Phase A
**Est. Impact:** ~10 lines changed

**Phase C Total: 3 files, MEDIUM risk, ~1.5 hours effort**

---

### PHASE D — Data Modal Overhaul (AdvancedCustomerSearch, PayDebtModal)

#### D1. AdvancedCustomerSearch

**Approach:** Wrap in MasterModal, integrate DataGridStandard.

**Changes:**
1. Wrap in `<MasterModal size="xl">`
2. Use `<ModalSection title="Tìm kiếm">` with search InputStandard
3. Replace results grid with `<DataTableStandard>` from DataGridStandard
4. Add pagination controls per DataGridStandard

**Files Affected:** `components/desktop-pos/modals/AdvancedCustomerSearch.tsx`
**Risk:** Medium (data grid integration may need adaptation)
**Dependencies:** Phase A, DataGridStandard
**Est. Impact:** ~25 lines changed

#### D2. PayDebtModal

**Approach:** Wrap in MasterModal, remove framer-motion.

**Changes:**
1. Wrap in `<MasterModal size="lg">`
2. Remove framer-motion `<motion.div>` + `animate-scale-in`
3. Remove `z-[60]` — inherit z-50
4. Format elements with standard tokens

**Files Affected:** `components/PayDebtModal.tsx`
**Risk:** Medium (debt payment involves financial calculations — test carefully)
**Dependencies:** Phase A
**Est. Impact:** ~20 lines changed

**Phase D Total: 2 files, MEDIUM risk, ~1 hour effort**

---

### PHASE E — Advanced Modal Overhaul (TaxCalculation, SettingsModal, OrderDetail)

#### E1. TaxCalculationModal

**Approach:** WRAP in MasterModal — complex modal with many custom sections. Don't restructure internal components, just replace container.

**Changes:**
1. Replace custom container with `<MasterModal size="full">` (needs width for tax grids)
2. Remove `vsp-modal-sync` class — use MasterModal
3. Remove `rounded-[32px]` — inherit
4. Remove `z-[9999]` — inherit z-50
5. Add mmFadeUp animation (currently none)
6. Keep header structure (it's already good) — just wrap in MasterModal header
7. Keep MetricCard components but replace typography classes
8. Move close button to MasterModal footer as `ModalButton` secondary
9. Replace `p-8` → inherit p-6 from MasterModal

**Files Affected:** `components/TaxCalculationModal.tsx`
**Risk:** Medium (large file, many moving parts)
**Dependencies:** Phase A, careful testing
**Est. Impact:** ~30 lines changed (mostly top-level container)

#### E2. SettingsModal (inline in MobileSettings)

**Approach:** Extract to separate component or wrap inline section with MasterModal.

**Changes:**
1. Wrap inline modal section with `<MasterModal size="md">`
2. Replace custom backdrop classes
3. Add standard close behavior

**Files Affected:** `components/MobileSettings.tsx`
**Risk:** Low
**Dependencies:** Phase A
**Est. Impact:** ~15 lines changed

#### E3. OrderDetailModal (inline in MobileOrders)

**Approach:** Similar to E2 — wrap inline with MasterModal.

**Files Affected:** `components/MobileOrders.tsx`
**Risk:** Low
**Dependencies:** Phase A
**Est. Impact:** ~10 lines changed

**Phase E Total: 3 files, MEDIUM risk, ~1.5 hours effort**

---

### PHASE F — High-Risk Modal (ProductEditModal)

**Approach:** Minimal changes — only UI layer, no business logic.

**Changes:**
1. Wrap in `<MasterModal size="lg">`
2. Standardize form inputs
3. Replace tokens
4. **Caution:** This modal likely has complex product CRUD — only change presentation layer

**Files Affected:** `components/ProductEditModal.tsx`
**Risk:** HIGH (product editing is core business logic)
**Dependencies:** Phase A, careful manual testing
**Est. Impact:** ~20 lines changed

**Phase F Total: 1 file, HIGH risk, ~1 hour effort + thorough testing**

---

## TIMELINE

```
Phase A (Core Fix)
  └── 30 min ──→ Phase B (POS Modals)
                     └── 2 hours ──→ Phase C (Medium Modals)
                                        └── 1.5 hours ──→ Phase D (Data Modals)
                                                             └── 1 hour ──→ Phase E (Advanced Modals)
                                                                                └── 1.5 hours ──→ Phase F (High-Risk)
                                                                                                     └── 1 hour + testing
```

**Total Estimated Effort:** ~7.5 hours + testing

---

## EXECUTION ORDER (CRITICAL)

**DO NOT skip phases.** Each phase depends on the previous:
- Phase A must be completed FIRST (MasterModal is the foundation)
- Phase B benefits from Phase A's MasterModal fixes
- Phase C depends on Phases A+B (batch modal shares patterns with POS)
- Phase D depends on Phase A (data grid needs MasterModal)
- Phase E depends on Phase A (Advanced modals)
- Phase F is last due to HIGH risk

---

## FILES CHANGED SUMMARY

| Phase | Files | Changed Lines* |
|-------|-------|----------------|
| A | `MasterModal.tsx`, `DisposalLotSelector.tsx`, `BatchSelectionModal.tsx` | ~30 lines |
| B | `PaymentModal.tsx`, `PromotionModal.tsx`, `CustomerOrdersModal.tsx` | ~105 lines |
| C | `BatchSelectionModal.tsx`, `QuickAddCustomerModal.tsx`, `RewardModal.tsx` | ~50 lines |
| D | `AdvancedCustomerSearch.tsx`, `PayDebtModal.tsx` | ~45 lines |
| E | `TaxCalculationModal.tsx`, `MobileSettings.tsx`, `MobileOrders.tsx` | ~55 lines |
| F | `ProductEditModal.tsx` | ~20 lines |
| **Total** | **~12 files** | **~305 lines** |

*Estimated changed lines — actual may vary based on file state

---

## ROLLBACK STRATEGY

For each phase:
1. **Before starting:** Commit current state of affected files
2. **After each modal:** Run manual smoke test (open modal, verify functionality)
3. **If something breaks:** `git checkout -- <file>` to restore original

---

## RISK REGISTER

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Wrapping in MasterModal breaks POS payment flow | Medium | High | Test 3 payment methods (cash/transfer/card) |
| Z-index change causes modal to appear behind other elements | Low | Medium | Verify all z-50/z-40 references in Elevation Standard |
| Removing framer-motion breaks animation on iOS | Low | Low | CSS mmFadeUp is tested and works cross-platform |
| TaxCalculationModal regression due to complex internal structure | Medium | Medium | Only change outer container — leave internal sections intact |
| ProductEditModal regression (CRUD breakage) | High | High | MINIMAL changes — only container + tokens, no restructuring |

---

## APPROVAL CHECKLIST

Before each phase, verify:
- [ ] MasterModal is in correct state (Phase A complete)
- [ ] All relevant Design Standards have been read
- [ ] Business logic is NOT modified (container wrapping only)
- [ ] State, validation, API calls remain unchanged
- [ ] Token mapping table is consulted for color replacements

---

**Next Step:** Awaiting approval to proceed with Phase A implementation.