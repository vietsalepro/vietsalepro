# UI MODAL MAPPING REPORT — Design System Migration

> **Bản đồ mapping từng modal hiện tại → Target Design Standard**  
> **Source:** UI_MODAL_AUDIT_REPORT.md → Master Design System  
> **Date:** 2026-06-24

---

## MAPPING STRATEGY

Mỗi modal sẽ được map theo cấu trúc:

```
Current Modal Structure
  ↓
Target Modal Blueprint V1 Structure
```

**Key mappings per modal:**
1. **Modal Size** → Modal Blueprint size presets
2. **Modal Container** → MasterModal component (with correct props)
3. **Header** → Standard header: icon (optional) + title + subtitle + close
4. **Body Sections** → ModalSection components
5. **Info Display** → ModalInfoGrid
6. **Tables/Grids** → ModalTable / DataGridStandard
7. **Footer Actions** → ModalButton (primary + secondary)
8. **Z-Index** → Elevation Standard (z-40 overlay, z-50 modal)
9. **Animation** → Motion Standard (mmFadeUp)
10. **Typography** → Typography V1 classes

---

## MODAL MAPPING

---

### A1. MasterModal (`components/MasterModal.tsx`)

| Aspect | Current | Target |
|--------|---------|--------|
| **Z-Index** | `z-[9999]` | `z-50` (modal), `z-40` (overlay) |
| **Typography** | `font-bold` (700) | `font-semibold` (600) for h2 |
| **Spacing** | `p-6 py-4` header | Keep — aligned with blueprint |
| **CSS Vars** | Custom `--modal-bg`, `--modal-radius` etc. | Use design token CSS classes from `master-design-system-tokens.md` |
| **Aria** | Basic aria attributes | Add aria-busy, aria-describedby for states |
| **Action** | Minor refactor | Fix z-index, font-weight, add token classes |

---

### B1. PaymentModal (`components/desktop-pos/modals/PaymentModal.tsx`)

| Aspect | Current | Target |
|--------|---------|--------|
| **Container** | Custom `fixed inset-0` + framer-motion | **Wrap with MasterModal** |
| **Size** | `max-w-sm` (384px) | `size="sm"` (480px preset) |
| **Border Radius** | `rounded-[28px]` | Inherited from MasterModal → `rounded-2xl` (16px) |
| **Z-Index** | `z-[200]/[210]` | Inherited from MasterModal → z-40/z-50 |
| **Animation** | framer-motion scale 0.92→1 | Inherited → CSS mmFadeUp |
| **Header** | Purple gradient with total amount | Standard MasterModal header with accentColor |
| **Body** | Method grid + amount input + change | Wrapped in ModalSection components |
| **Footer** | Inline confirm button | Dedicated footer with ModalButton primary |
| **Payment Methods** | Grid of 3 method buttons | Keep grid, restyle with standard classes |
| **Amount Input** | Custom styled input | Use InputStandard classes |
| **Quick Amounts** | Row of quick-amount buttons | Keep, restyle with ActionButtonStandard |
| **Change Amount** | Gradient green box | Use StatusBadge "success" variant |
| **Action** | **Full refactor** — wrap in MasterModal, replace all custom styling |

---

### B2. PromotionModal (`components/desktop-pos/modals/PromotionModal.tsx`)

| Aspect | Current | Target |
|--------|---------|--------|
| **Container** | Custom `fixed inset-0` + framer-motion | **Wrap with MasterModal** |
| **Size** | `max-w-lg` (512px) | `size="md"` (640px preset) |
| **Border Radius** | `rounded-[28px]` | Inherited → `rounded-2xl` |
| **Z-Index** | `z-[200]/[210]` | Inherited → z-40/z-50 |
| **Animation** | framer-motion scale | Inherited → CSS mmFadeUp |
| **Header** | Purple gradient | Standard MasterModal header |
| **Promotion List** | Custom card selection list | Use ModalSection per promotion group |
| **Selected Counter** | Inline text in footer | Keep but use standard Typography |
| **Confirm Button** | `w-full py-3` gradient purple | `size="sm"` ModalButton primary right-aligned |
| **Action** | **Full refactor** — wrap in MasterModal |

---

### B3. CustomerOrdersModal (`components/desktop-pos/modals/CustomerOrdersModal.tsx`)

| Aspect | Current | Target |
|--------|---------|--------|
| **Container** | Custom `fixed inset-0` + framer-motion | **Wrap with MasterModal** |
| **Size** | `max-w-lg` (512px) | `size="md"` (640px preset) |
| **Border Radius** | `rounded-[28px]` | Inherited → `rounded-2xl` |
| **Z-Index** | `z-[200]/[210]` | Inherited → z-40/z-50 |
| **Animation** | framer-motion scale | Inherited → CSS mmFadeUp |
| **Header** | Purple gradient | Standard MasterModal header |
| **Customer Info** | Inline section | ModalSection with ModalInfoGrid |
| **Loading State** | Custom spinner | Use StateStandard skeleton |
| **Order List Items** | Custom card list | Use ModalTable or ModalSection list |
| **Empty State** | Custom icon + text | Use standard empty state from StateStandard |
| **Action** | **Full refactor** — wrap in MasterModal, use sub-components |

---

### B4. QuickAddCustomerModal (`components/desktop-pos/modals/QuickAddCustomerModal.tsx`)

| Aspect | Current | Target |
|--------|---------|--------|
| **Container** | (needs inspection) | **Wrap with MasterModal** |
| **Size** | (unknown) | `size="sm"` (480px) |
| **Form** | (unknown) | ModalSection + InputStandard fields |
| **Action** | Partial refactor — wrap in MasterModal, standardize form |

---

### B5. AdvancedCustomerSearch (`components/desktop-pos/modals/AdvancedCustomerSearch.tsx`)

| Aspect | Current | Target |
|--------|---------|--------|
| **Container** | (needs inspection) | **Wrap with MasterModal** |
| **Size** | (unknown) | `size="xl"` (1024px — needs search + list) |
| **Search Input** | (unknown) | Use InputStandard with search variant |
| **Results Grid** | (unknown) | Use DataGridStandard |
| **Action** | Partial refactor — wrap in MasterModal |

---

### B6. RewardModal (`components/desktop-pos/modals/RewardModal.tsx`)

| Aspect | Current | Target |
|--------|---------|--------|
| **Container** | (needs inspection) | **Wrap with MasterModal** |
| **Size** | (unknown) | `size="md"` (640px) |
| **Reward List** | (unknown) | ModalTable or card list |
| **Action** | Partial refactor — wrap in MasterModal |

---

### C1. TaxCalculationModal (`components/TaxCalculationModal.tsx`)

| Aspect | Current | Target |
|--------|---------|--------|
| **Container** | Custom `vsp-modal-sync` class | **Replace with MasterModal** |
| **Size** | `max-w-6xl` (1152px) | `size="xl"` (1024px) or `size="full"` (96vw) |
| **Border Radius** | `rounded-[32px]` | Inherited → `rounded-2xl` (16px) |
| **Z-Index** | `z-[9999]` | Inherited → z-50 |
| **Animation** | None | Inherited → CSS mmFadeUp |
| **Header** | White bg with icon badge (good!) | Keep structure, just wrap in MasterModal |
| **Body** | `p-8` with grid content | Inherited p-6 from MasterModal |
| **Footer** | Single close button | MasterModal footer with ModalButton secondary |
| **Metric Cards** | Custom MetricCard component | Keep but restyle with standard typography |
| **Config Panel** | Custom panel layout | Use ModalSection with InputStandard |
| **Export Buttons** | Colored card section | Use ModalSection with ModalButton |
| **Notes Section** | Info box | Use ModalSection with icon |
| **Action** | **Medium refactor** — wrap in MasterModal, replace vsp-* classes |

---

### C2. BatchSelectionModal (`components/BatchSelectionModal.tsx`)

| Aspect | Current | Target |
|--------|---------|--------|
| **Container** | Custom `fixed inset-0` | **Wrap with MasterModal** |
| **Size** | `max-w-md` (448px) | `size="sm"` (480px) |
| **Border Radius** | `rounded-2xl` (16px) ✅ | Keep (aligned) |
| **Z-Index** | `z-[110]` | Inherited → z-50 |
| **Animation** | `animate-fade-in` | Inherited → CSS mmFadeUp |
| **Header** | White bg with icon (good!) | Keep structure, wrap in MasterModal |
| **Lot Cards** | Custom card selection | Use ModalSection for list, keep card styling |
| **Quantity Selector** | Custom +/- buttons | Use InputStandard for number input |
| **Footer** | Two flex-1 buttons | MasterModal footer with ModalButton secondary + primary |
| **Empty State** | Custom illustration | Use StateStandard empty state |
| **Action** | **Medium refactor** — wrap in MasterModal, replace old tokens |

---

### C3. PayDebtModal (`components/PayDebtModal.tsx`)

| Aspect | Current | Target |
|--------|---------|--------|
| **Container** | Custom `fixed inset-0` + framer-motion | **Wrap with MasterModal** |
| **Size** | `max-w-2xl` (672px) | `size="lg"` (800px) |
| **Border Radius** | `rounded-2xl` (16px) ✅ | Keep (aligned) |
| **Z-Index** | `z-[60]` | Inherited → z-50 |
| **Animation** | framer-motion + `animate-scale-in` | Inherited → CSS mmFadeUp |
| **Action** | **Medium refactor** — wrap in MasterModal |

---

### D3. DisposalLotSelector (`components/disposal-form/DisposalLotSelector.tsx`)

| Aspect | Current | Target |
|--------|---------|--------|
| **Type** | Popover | Popover (correct type, no change needed) |
| **Z-Index** | `z-30` backdrop, `z-40` popover | ✅ Already aligned |
| **Border Radius** | Non-standard | Use standard `rounded-xl` (12px) for popover |
| **Shadow** | `shadow-lg` | Use elevation token class |
| **Action** | Minor refactor — fix radius and shadow |

---

## SUMMARY: MIGRATION EFFORT BY MODAL

| Modal | Effort | Risk | Dependencies | Priority |
|-------|--------|------|--------------|----------|
| **MasterModal** | Low | Low | None | **Phase A** |
| **PaymentModal** | High | Medium | MasterModal | **Phase B** |
| **PromotionModal** | High | Medium | MasterModal | **Phase B** |
| **CustomerOrdersModal** | High | Low | MasterModal | **Phase B** |
| **QuickAddCustomerModal** | Medium | Low | MasterModal | **Phase C** |
| **AdvancedCustomerSearch** | Medium | Medium | MasterModal | **Phase D** |
| **RewardModal** | Medium | Low | MasterModal | **Phase C** |
| **TaxCalculationModal** | High | Medium | MasterModal | **Phase E** |
| **BatchSelectionModal** | Medium | Medium | MasterModal | **Phase C** |
| **PayDebtModal** | Medium | Medium | MasterModal | **Phase D** |
| **ProductEditModal** | Medium | High | MasterModal | **Phase F** |
| **DisposalLotSelector** | Low | Low | None | **Phase A** |
| **SettingsModal (inline)** | Medium | Low | MasterModal | **Phase E** |
| **OrderDetailModal (inline)** | Low | Low | MasterModal | **Phase E** |

---

## DESIGN TOKEN MAPPING

### Old → New Token Equivalents

| Old (Current) | New (Design System) |
|---------------|-------------------|
| `bg-gray-50` | `bg-slate-50` |
| `bg-gray-100` | `bg-slate-100` |
| `text-gray-500` | `text-slate-500` |
| `text-gray-700` | `text-slate-700` |
| `text-gray-900` | `text-slate-900` |
| `border-gray-100` | `border-slate-100` |
| `border-gray-200` | `border-slate-200` |
| `bg-indigo-600` | `bg-violet-600` (if brand color) |
| `text-indigo-600` | `text-violet-600` |
| `rounded-2xl` | `rounded-2xl` (keep — 16px) |
| `rounded-[28px]` | `rounded-2xl` (16px) |
| `rounded-[32px]` | `rounded-2xl` (16px) |
| `z-[60]/[110]/[200]/[210]/[9999]` | `z-40` (overlay), `z-50` (modal) |
| `shadow-sm` / `shadow-lg` | Use elevation token classes |
| `animate-fade-in` / `animate-scale-in` | Use `animation: mmFadeUp 200ms` |
| framer-motion `<motion.div>` | Replace with standard `<div>` + CSS animation |
| `vsp-font-bold` | `font-semibold` |
| `vsp-text-sm` | `text-sm` |
| `vsp-text-base` | `text-base` |
| `vsp-text-xs` | `text-xs` |
| `vsp-text-xxs` | `text-[11px]` |
| `vsp-text-2xl` | `text-2xl` |
| `vsp-font-medium` | `font-medium` |
| `vsp-font-regular` | `font-normal` |

---

**Next Step:** Proceed to UI_MODAL_MIGRATION_PLAN.md for phased implementation plan.