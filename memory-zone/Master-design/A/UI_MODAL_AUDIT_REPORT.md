# UI MODAL AUDIT REPORT — VietSale Pro V7

> **Single Source of Truth:** `/Master-design/`  
> **Audit Date:** 2026-06-24  
> **Scope:** All Modal, Dialog, Drawer, Popup components in source code  
> **Total Modals Found:** 12 unique modal components + 4 inline modals

---

## MODAL INVENTORY

### A. CORE MODAL FRAMEWORK

| # | Modal Name | File Path | Lines | Purpose |
|---|------------|-----------|-------|---------|
| A1 | **MasterModal** | `components/MasterModal.tsx` | 274 | Centralized modal container with sub-components (ModalSection, ModalInfoGrid, ModalTable, StatusBadge, ModalButton, SummaryRow) |

---

### B. POS MODALS (desktop-pos/modals/)

| # | Modal Name | File Path | Lines | Purpose |
|---|------------|-----------|-------|---------|
| B1 | **PaymentModal** | `components/desktop-pos/modals/PaymentModal.tsx` | 153 | POS checkout payment (cash/transfer/card) |
| B2 | **PromotionModal** | `components/desktop-pos/modals/PromotionModal.tsx` | 127 | Promotion selection for POS cart |
| B3 | **CustomerOrdersModal** | `components/desktop-pos/modals/CustomerOrdersModal.tsx` | 132 | Customer purchase history |
| B4 | **QuickAddCustomerModal** | `components/desktop-pos/modals/QuickAddCustomerModal.tsx` | — | Quick customer creation during POS |
| B5 | **AdvancedCustomerSearch** | `components/desktop-pos/modals/AdvancedCustomerSearch.tsx` | — | Advanced customer lookup |
| B6 | **RewardModal** | `components/desktop-pos/modals/RewardModal.tsx` | — | Customer reward/loyalty redemption |

---

### C. GLOBAL MODALS (Root `components/`)

| # | Modal Name | File Path | Lines | Purpose |
|---|------------|-----------|-------|---------|
| C1 | **TaxCalculationModal** | `components/TaxCalculationModal.tsx` | 269 | Annual tax calculation & TT88 report |
| C2 | **BatchSelectionModal** | `components/BatchSelectionModal.tsx` | 146 | Lot/batch selection for POS selling |
| C3 | **PayDebtModal** | `components/PayDebtModal.tsx` | — | Customer debt payment |
| C4 | **ProductEditModal** | `components/ProductEditModal.tsx` | — | Product CRUD editing |

---

### D. INLINE / DISPOSAL-FORM MODALS

| # | Modal Name | File Path | Lines | Purpose |
|---|------------|-----------|-------|---------|
| D1 | **SettingsModal** | `components/MobileSettings.tsx` (inline) | — | App settings editing |
| D2 | **ExportPreviewModal** | `components/MobileSettings.tsx` (inline) | — | Export data preview |
| D3 | **DisposalLotSelector** | `components/disposal-form/DisposalLotSelector.tsx` | — | Lot selection popover in disposal form |
| D4 | **OrderDetailModal** | `components/MobileOrders.tsx` (inline) | — | Order detail view on mobile |

---

## DETAILED AUDIT — PER MODAL

---

### A1. MasterModal (`components/MasterModal.tsx`)

| Property | Current State | Design Standard | Violation |
|----------|--------------|-----------------|-----------|
| **Size** | sm/md/lg/xl/full via `SIZE_MAP` | Modal Blueprint: sm=480px, md=640px, lg=800px, xl=1024px | ✅ Aligned (needs px values vs max-w-*) |
| **Border Radius** | `1rem` (via CSS var) | Blueprint: 16px | ✅ Aligned |
| **Backdrop** | `backdrop-blur-[2px]`, rgba(15,23,42,0.52) | Tokens: `--overlay` | ✅ Aligned |
| **Shadow** | custom box-shadow via var | Tokens: elevation `--elevation-modal` | ✅ Aligned |
| **Header** | `px-6 py-4`, bg `#f8fafc` | Blueprint: Title + icon + subtitle | ✅ Aligned structure |
| **Body** | `p-6 space-y-4` | Blueprint: padding 24px | ✅ Aligned |
| **Footer** | `px-6 py-4`, bg `#f8fafc` | Blueprint: right-aligned actions | ✅ Aligned |
| **Typography** | `text-base font-bold`, `text-xs` | Typography V1: h2=16px/600, subtitle=13px/400 | ⚠️ Minor: uses `font-bold` (700) vs `font-semibold` (600) |
| **Animation** | `mmFadeUp 200ms ease-out` | Motion Standard: 200ms ease-out | ✅ Aligned |
| **Z-Index** | `z-[9999]` | Elevation: modal=z-50, overlay=z-40 | ❌ Violation: uses z-[9999] instead of z-50 |
| **Icon** | gradient background using `accentColor` prop | Blueprint: icon in header | ✅ Aligned |

**Design System Violations:**
1. Z-index uses hardcoded `z-[9999]` instead of `z-50` per Elevation Standard
2. Uses custom CSS variables instead of design tokens classes
3. `font-bold` should be `font-semibold` per Typography Standard
4. Missing aria attributes for loading/error states per State Standard

---

### B1. PaymentModal (`components/desktop-pos/modals/PaymentModal.tsx`)

| Property | Current State | Design Standard | Violation |
|----------|--------------|-----------------|-----------|
| **Size** | `max-w-sm` (384px) | Blueprint: sm modal = 480px | ❌ Too narrow |
| **Border Radius** | `rounded-[28px]` | Blueprint: 16px | ❌ Non-standard (28px) |
| **Backdrop** | `bg-black/40 backdrop-blur-sm` | Tokens: `--overlay` | ✅ Approximate |
| **Z-Index** | overlay z-[200], modal z-[210] | Elevation: modal=z-50, overlay=z-40 | ❌ Non-standard z-index values |
| **Header** | gradient bg (purple), p-5 | Blueprint: solid bg, icon + title | ❌ Non-standard gradient header |
| **Body** | `p-5 space-y-4` | Blueprint: p-6 (24px) | ⚠️ Slight mismatch (20px vs 24px) |
| **Footer** | inline in body (no separate footer) | Blueprint: dedicated footer section | ❌ Missing footer structure |
| **Actions** | single confirm button + quick amounts | Action Button Standard: primary + secondary | ❌ Missing close/secondary button |
| **Typography** | custom font classes | Typography V1 | ⚠️ Mixed (some vsp-* classes present) |
| **Animation** | framer-motion scale 0.92→1 | Motion Standard: fadeUp 200ms | ❌ Non-standard animation |
| **Content** | method grid + amount input + change | Blueprint section structure | ⚠️ Partially structured |

**Design System Violations:**
1. Uses non-standard `rounded-[28px]` instead of `rounded-2xl` (16px)
2. Purple gradient header violates Modal Blueprint (should use solid bg + icon)
3. Z-index uses arbitrary values (z-[200], z-[210]) instead of standard z-40/z-50
4. Uses framer-motion with custom animation instead of standard CSS animation
5. No footer section — actions are inline in body
6. Missing secondary/close button in footer per Action Button Standard

---

### B2. PromotionModal (`components/desktop-pos/modals/PromotionModal.tsx`)

| Property | Current State | Design Standard | Violation |
|----------|--------------|-----------------|-----------|
| **Size** | `max-w-lg` (512px) | Blueprint: md = 640px | ⚠️ Slightly narrow |
| **Border Radius** | `rounded-[28px]` | Blueprint: 16px | ❌ Non-standard (28px) |
| **Z-Index** | overlay z-[200], modal z-[210] | Elevation: modal=z-50 | ❌ Non-standard |
| **Header** | purple gradient | Blueprint: solid bg | ❌ Non-standard gradient |
| **Footer** | `p-4 border-t` | Blueprint: footer section | ✅ Present but structure differs |
| **Animation** | framer-motion scale | Motion Standard: fadeUp | ❌ Non-standard |

**Design System Violations:**
1. Same issues as PaymentModal (gradient header, z-index, rounded-[28px], framer-motion)
2. Missing ModalSection structure for empty state
3. Checkbox uses custom circle instead of standard checkbox component

---

### B3. CustomerOrdersModal (`components/desktop-pos/modals/CustomerOrdersModal.tsx`)

| Property | Current State | Design Standard | Violation |
|----------|--------------|-----------------|-----------|
| **Size** | `max-w-lg` (512px) | Blueprint: md = 640px | ⚠️ Slightly narrow |
| **Border Radius** | `rounded-[28px]` | Blueprint: 16px | ❌ Non-standard |
| **Header** | purple gradient | Blueprint: solid bg | ❌ Non-standard gradient |
| **Customer Info** | inline section below header | Section Box Standard | ⚠️ Should use ModalSection |
| **Loading State** | Loader2 spinner | State Standard: skeleton | ❌ No skeleton loading |
| **Empty State** | custom icon + text | State Standard | ✅ Present but missing standard classes |

**Design System Violations:**
1. Same POS modal pattern violations (gradient, rounded-[28px], z-index, framer-motion)
2. No proper loading skeleton per State Standard
3. Customer info section doesn't use ModalSection component
4. Missing standard empty state component

---

### C1. TaxCalculationModal (`components/TaxCalculationModal.tsx`)

| Property | Current State | Design Standard | Violation |
|----------|--------------|-----------------|-----------|
| **Size** | `max-w-6xl` (1152px) | Blueprint: xl = 1024px | ❌ Wider than standard max |
| **Border Radius** | `rounded-[32px]` | Blueprint: 16px | ❌ Non-standard (32px) |
| **Backdrop** | `bg-black/60 backdrop-blur-sm` | Tokens: `--overlay` | ✅ Close match |
| **Z-Index** | `z-[9999]`, `vsp-modal-sync` | Elevation: modal=z-50 | ❌ Non-standard |
| **Header** | white bg, icon badge + title | Blueprint: ✅ well structured | ✅ Aligned |
| **Body** | `p-8` | Blueprint: p-6 | ⚠️ Extra padding (32px vs 24px) |
| **Footer** | white bg, single close button | Blueprint: right-aligned actions | ✅ Present but bare minimum |
| **Content** | grids, config panels, export | Section Box Standard | ⚠️ Mixed — some vsp-* classes |
| **Typography** | vsp-* classes present | Typography V1 | ✅ Some aligned |
| **Animation** | none visible | Motion Standard: fadeUp 200ms | ❌ No animation |

**Design System Violations:**
1. Has its own `vsp-modal-sync` class — indicates pre-migration state
2. `rounded-[32px]` far from standard 16px
3. Uses `z-[9999]` instead of standard z-50
4. Body padding is `p-8` (32px) instead of standard 24px
5. No animation on open/close
6. Content uses mixed vsp-* classes (from old system) with custom styling

---

### C2. BatchSelectionModal (`components/BatchSelectionModal.tsx`)

| Property | Current State | Design Standard | Violation |
|----------|--------------|-----------------|-----------|
| **Size** | `max-w-md` (448px) | Blueprint: sm = 480px | ⚠️ Slightly narrow |
| **Border Radius** | `rounded-2xl` (16px) | Blueprint: 16px | ✅ Aligned |
| **Z-Index** | `z-[110]` | Elevation: modal=z-50 | ❌ Non-standard |
| **Backdrop** | `bg-black/60 backdrop-blur-sm` | Tokens: `--overlay` | ✅ Aligned |
| **Header** | white bg, icon + title | Blueprint: ✅ well structured | ✅ Aligned |
| **Footer** | `bg-gray-50` with Huỷ/Xác nhận | Action Button Standard | ✅ Present but uses old color tokens |
| **Animation** | `animate-fade-in` | Motion Standard: fadeUp 200ms | ⚠️ Close but different |
| **Typography** | vsp-* classes | Typography V1 | ✅ Partial alignment |

**Design System Violations:**
1. Z-index `z-[110]` not standard (should be z-50)
2. Uses old color tokens (gray-* instead of slate-*)
3. Footer buttons use `flex-1` layout instead of right-aligned per Action Button Standard
4. No animation on close (only fade-in on open)
5. Empty state uses custom layout instead of standard empty state component

---

### C3. PayDebtModal (`components/PayDebtModal.tsx`)

| Property | Current State | Design Standard | Violation |
|----------|--------------|-----------------|-----------|
| **Size** | `max-w-2xl` (672px) | Blueprint: lg = 800px | ⚠️ Narrower than standard lg |
| **Border Radius** | `rounded-2xl` (16px) | Blueprint: 16px | ✅ Aligned |
| **Z-Index** | `z-[60]` | Elevation: modal=z-50 | ⚠️ Close but non-standard |
| **Backdrop** | `bg-slate-900/50 backdrop-blur-sm` | Tokens: `--overlay` | ✅ Aligned |
| **Animation** | framer-motion + `animate-scale-in` | Motion Standard: fadeUp 200ms | ❌ Non-standard + duplicate animation |

**Design System Violations:**
1. Mixed animation approach (framer-motion + Tailwind animate)
2. Uses `z-[60]` for both overlay and modal (should be z-40/z-50 separate)
3. May contain old color tokens

---

### D3. DisposalLotSelector (`components/disposal-form/DisposalLotSelector.tsx`)

| Property | Current State | Design Standard | Violation |
|----------|--------------|-----------------|-----------|
| **Type** | Popover (not modal) | Blueprint: dropdown/popover | ✅ Correct type |
| **Z-Index** | `z-30` backdrop, `z-40` popover | Elevation: popover=z-30 | ✅ Aligned |
| **Border Radius** | `rounded` + `rounded-lg` | Blueprint: 8px | ❌ Non-standard rounding |
| **Shadow** | `shadow-lg` | Elevation: popover shadow | ⚠️ Approximate |

**Design System Violations:**
1. Shadow not using elevation tokens
2. Border radius not using standard 12px popover radius

---

## SUMMARY: DESIGN SYSTEM VIOLATIONS BY CATEGORY

### ❌ Z-Index Non-Compliance (Elevation Z-Index Standard)

| Modal | Current Z | Required |
|-------|-----------|----------|
| MasterModal | `z-[9999]` | z-50 (modal), z-40 (overlay) |
| TaxCalculationModal | `z-[9999]` | z-50 |
| BatchSelectionModal | `z-[110]` | z-50 |
| PayDebtModal | `z-[60]` | z-50 |
| PaymentModal | `z-[200]/[210]` | z-50/z-40 |
| PromotionModal | `z-[200]/[210]` | z-50/z-40 |
| CustomerOrdersModal | `z-[200]/[210]` | z-50/z-40 |

### ❌ Border Radius Non-Compliance

| Modal | Current Radius | Required (16px) |
|-------|---------------|-----------------|
| PaymentModal | `rounded-[28px]` | `rounded-2xl` |
| PromotionModal | `rounded-[28px]` | `rounded-2xl` |
| CustomerOrdersModal | `rounded-[28px]` | `rounded-2xl` |
| TaxCalculationModal | `rounded-[32px]` | `rounded-2xl` |

### ❌ Animation Non-Compliance (Motion Standard)

| Modal | Current Animation | Required |
|-------|------------------|----------|
| PaymentModal | framer-motion scale 0.92→1 | CSS animation `mmFadeUp` |
| PromotionModal | framer-motion scale 0.92→1 | CSS animation `mmFadeUp` |
| CustomerOrdersModal | framer-motion scale 0.92→1 | CSS animation `mmFadeUp` |
| PayDebtModal | framer-motion + Tailwind animate | CSS animation `mmFadeUp` |
| TaxCalculationModal | none | CSS animation `mmFadeUp` |

### ❌ Header Design Non-Compliance

| Modal | Current Header | Required |
|-------|---------------|----------|
| PaymentModal | Purple gradient | Solid bg + icon |
| PromotionModal | Purple gradient | Solid bg + icon |
| CustomerOrdersModal | Purple gradient | Solid bg + icon |

### ❌ Missing MasterModal Usage

Many modals don't use `MasterModal` as their container, leading to:
- Inconsistent sizing
- Inconsistent spacing
- Missing sub-component usage (ModalSection, ModalInfoGrid, etc.)
- Duplicate code for backdrop, z-index, animations

---

## AUDIT CONCLUSIONS

### High Priority Issues
1. **3 POS modals** use non-standard gradient headers and `rounded-[28px]`
2. **4+ modals** use non-standard z-index values
3. **TaxCalculationModal** has its own `vsp-modal-sync` leftover class

### Medium Priority Issues
4. **PaymentModal** missing footer section (actions inline in body)
5. BatchSelectionModal uses old `gray-*` instead of `slate-*` color tokens
6. Multiple modals missing aria attributes

### Low Priority Issues
7. MasterModal `font-bold` should be `font-semibold`
8. Body padding inconsistencies (p-5, p-6, p-8)
9. Missing animation on close for several modals

---

## MODAL COMPLIANCE SCORE CARD

| Modal | Z-Index | Radius | Animation | Header | Footer | SectionBox | Typography | **Score** |
|-------|---------|--------|-----------|--------|--------|------------|------------|-----------|
| MasterModal | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | **6/8** |
| PaymentModal | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | **1/8** |
| PromotionModal | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | **1/8** |
| CustomerOrdersModal | ❌ | ❌ | ❌ | ❌ | N/A | ❌ | ⚠️ | **1/8** |
| TaxCalculationModal | ❌ | ❌ | ❌ | ✅ | ⚠️ | ❌ | ✅ | **3/8** |
| BatchSelectionModal | ❌ | ✅ | ⚠️ | ✅ | ⚠️ | ❌ | ⚠️ | **3/8** |
| PayDebtModal | ❌ | ✅ | ❌ | ? | ? | ? | ? | **2/8*** |
| DisposalLotSelector | ✅ | ❌ | N/A | N/A | N/A | ✅ | ? | **3/5** |

*Score: ✅=1, ⚠️=0.5, ❌=0 (higher is better)*

---

**Next Step:** Proceed to UI_MODAL_MAPPING_REPORT.md for detailed per-modal migration mapping.