# UI Component Audit Master Report

> **Role:** Independent UI Component Auditor  
> **Audit Scope:** ActionButton, Input, State Components, SectionBox, Tabs, DataGrid  
> **Reference Standards:** MASTER_ACTION_BUTTON_STANDARD_V1.md, MASTER_INPUT_STANDARD_V1.md, MASTER_STATE_STANDARD_V1.md, MASTER_SECTION_BOX_STANDARD_V1.md, MASTER_TABS_STANDARD_V1.md, MASTER_DATA_GRID_STANDARD_V1.md  
> **Supporting Documents:** UI_COMPONENT_ARCHITECTURE.md, UI_DEPENDENCY_GRAPH.md, IMPLEMENTATION_READINESS_REPORT.md  
> **Date:** 2026-06-24  
> **Status:** FIRST RELEASE

---

## Table of Contents

1. [ActionButton Audit](#1-actionbutton-audit)
2. [Input Audit](#2-input-audit)
3. [State Components Audit](#3-state-components-audit)
4. [SectionBox Audit](#4-sectionbox-audit)
5. [Tabs Audit](#5-tabs-audit)
6. [DataGrid Audit](#6-datagrid-audit)
7. [Executive Summary](#7-executive-summary)
8. [Audit Completeness](#8-audit-completeness)
9. [Readiness Impact](#9-readiness-impact)

---

## 1. ActionButton Audit

### Current Usage

ActionButton is used across **80+ locations** in the codebase. Usage falls into three categories:

| Category | Count | Examples |
|----------|-------|---------|
| **`ui.tsx` Button** (`components/ui.tsx`) | ~15 | Pages/ReturnOrders.tsx uses `<Button variant="primary">`, `<Button variant="danger">`, `<Button variant="outline">` |
| **MasterModal BTN_CLS** (`components/MasterModal.tsx`) | ~8 | Modal action buttons via `BTN_CLS` record with primary/secondary/danger/ghost variants |
| **Raw `<button>` with hardcoded Tailwind** | ~60+ | Pages/Customers.tsx, Pages/Inventory.tsx, Pages/Suppliers.tsx, Pages/Settings.tsx, Pages/CategoryManagement.tsx, components/MobilePOS.tsx, components/disposal-form/*, components/import-goods/*, etc. |

### Existing Variants

| Variant | Where Defined | Tailwind Classes | Notes |
|---------|--------------|------------------|-------|
| **primary** | `ui.tsx` | `bg-indigo-600 text-white hover:bg-indigo-700` | Used in 10+ locations. Also defined in MasterModal as `bg-violet-600 text-white hover:bg-violet-700` (slight color difference: indigo vs violet) |
| **secondary** | `ui.tsx` | `bg-gray-100 text-gray-700 hover:bg-gray-200` | Used in Suppliers, Settings |
| **danger** | `ui.tsx` | `bg-red-600 text-white hover:bg-red-700` | Used in ReturnOrders |
| **ghost** | `ui.tsx`, MasterModal | `text-gray-600 hover:bg-gray-100` | Close buttons, cancel actions |
| **outline** | `ui.tsx` | `border border-gray-300 text-gray-700 hover:bg-gray-50` | Used in ReturnOrders, Export buttons |
| **raw inline** | N/A | Various: `bg-purple-600`, `bg-indigo-600`, `btn-primary`, `btn-danger`, `pem-btn-primary`, `pem-btn-cancel` | Scattered across pages and feature components |

### Existing States

| State | Currently Exists | Coverage |
|-------|-----------------|----------|
| **Default** | ✅ All button implementations | 100% |
| **Hover** | ✅ Most implementations with `hover:*` classes | ~85% of buttons |
| **Active/Pressed** | ✅ Some with `active:scale-95` | ~30% of buttons |
| **Disabled** | ✅ `ui.tsx` Button has `disabled:opacity-50` prop. Some raw buttons use `disabled={...}` | ~40% of buttons |
| **Loading** | ⚠️ Only in `ui.tsx` Button with `isLoading` prop + `Loader2` spinner animation | ~15% of buttons |
| **Focus** | ❌ No standardized focus ring on any button implementation | 0% |
| **Icon+Label** | ⚠️ Inconsistent — some use `icon` prop pattern, others use children with inline SVG | ~50% |

### Existing Custom Implementations

| Custom Implementation | Location | Description |
|----------------------|----------|-------------|
| **PEM Button** | `components/ProductEditModal.tsx` | Custom CSS classes: `pem-btn-primary`, `pem-btn-cancel`, `pem-add-link` |
| **Disposal Form Buttons** | `components/disposal-form/DisposalTopBar.tsx`, `ActionFooter.tsx` | Inline styled buttons with feature-specific sizing |
| **Import Form Buttons** | `components/import-goods/ImportTopBar.tsx`, `ImportSidebar/ActionFooter.tsx` | Similar pattern to Disposal, with `ig-btn-secondary` class |
| **POS Checkout Buttons** | `components/desktop-pos/checkout/*.tsx` | Small format-specific buttons with text-[10px]/[11px] sizing |
| **Landing Page Buttons** | `pages/LandingPage.tsx` | Large rounded-full buttons with custom border and hover effects |
| **Export/Import Buttons** | `pages/Inventory.tsx`, `pages/Suppliers.tsx`, `pages/CategoryManagement.tsx`, `pages/BrandManagement.tsx` | Inline buttons with `Download`/`Upload`/`FileSpreadsheet` icons |
| **Mobile POS Buttons** | `components/MobilePOS.tsx` | Specialized mobile-first button styling |

### Design Standard Mapping

| MASTER_ACTION_BUTTON_STANDARD_V1 Spec | Current State | Gap |
|---------------------------------------|---------------|-----|
| Standard variant set (primary, secondary, danger, ghost, outline) | ✅ Partially present in `ui.tsx` and MasterModal. BUT color values differ between `ui.tsx` (indigo) and MasterModal (violet) | ⚠️ GAP: Inconsistent primary color — `ui.tsx` uses `indigo-600` but MasterModal uses `violet-600` |
| Loading spinner integration | ⚠️ Only `ui.tsx` Button has `isLoading` | ❌ Raw buttons lack loading state entirely |
| Icon support (left/right icon props) | ⚠️ `ui.tsx` has `icon` prop (left only), MasterModal BTN_CLS has no icon prop | ❌ No consistent icon API across button implementations |
| Tailwind-compatible sizing tokens | ❌ Raw buttons use arbitrary heights (h-8, h-[38px], py-2, py-3, py-2.5) | ❌ No standard size scale (`sm`, `md`, `lg`) |
| Focus ring accessibility | ❌ None implemented | ❌ Full gap |
| Responsive text sizing | ❌ Some buttons use `text-xs`, `text-sm` arbitrarily | ❌ No standard |
| Feature flag (`useNewActionButton`) | ❌ Not implemented in any button | ❌ Full gap |

### Compliance Gaps

| # | Gap | Severity | Impact |
|---|-----|----------|--------|
| 1 | **No standard variant naming** — `ui.tsx` variants differ from MasterModal BTN_CLS, and raw buttons use arbitrary colors | 🔴 HIGH | Migration will need to reconcile 3+ different button systems |
| 2 | **Primary color mismatch** — `ui.tsx` uses `indigo-600`, MasterModal uses `violet-600` | 🟡 MEDIUM | Visual inconsistency across app |
| 3 | **No size scale** — Buttons have non-standard heights: 32px, 38px, 40px, 44px, auto | 🟡 MEDIUM | Difficult to achieve consistent layout |
| 4 | **No focus ring** — Accessibility violation | 🟡 MEDIUM | Keyboard navigation broken |
| 5 | **Loading state missing in 85% of buttons** — Only ui.tsx Button supports loading | 🟡 MEDIUM | Poor UX during async operations |
| 6 | **No feature flag** — Cannot safely A/B test new ActionButton | 🔴 HIGH | Migration rollback requires full revert |
| 7 | **60+ raw `<button>` elements** — Each with unique Tailwind combination | 🔴 HIGH | Migration scope is massive |

### Migration Complexity

**HIGH**

- Total button instances to migrate: **80+**
- Unique variant/color combinations to reconcile: **15+**
- Files affected: **~35 files** across components/, pages/, and feature directories
- Risk of visual regression: High, especially in PaymentModal (critical POS path)

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Button color changes break existing acceptance tests | HIGH | MEDIUM | Visual regression tests before/after |
| Mobile-specific button sizing lost during standardization | MEDIUM | HIGH | Document all mobile button sizes before migration |
| POS buttons (text-[10px]) not fitting standard size scale | MEDIUM | HIGH | Add custom `xs` size variant to standard |
| Inconsistent icon alignment after migration | MEDIUM | LOW | Use standard icon prop API |

### Recommended Migration Sprint

**SPRINT_03** (as defined in UI_MIGRATION_MASTER_ROADMAP.md)

- Pre-work: Catalog all 60+ raw button locations with screenshots
- Phase 1: Build new ActionButton component with feature flag (`useNewActionButton`)
- Phase 2: Migrate non-critical paths first (Settings, Profile pages)
- Phase 3: Migrate feature forms (Disposal, Import, Inventory Count)
- Phase 4: Migrate POS modals (critical — requires dedicated testing)

---

## 2. Input Audit

### Current Usage

Input fields exist across **40+ locations** in the codebase. Primary patterns:

| Pattern | Count | Examples |
|---------|-------|---------|
| **Raw `<input>` with Tailwind** | ~30 | `pages/Inventory.tsx`, `pages/Suppliers.tsx`, `pages/Customers.tsx`, `pages/Settings.tsx`, `components/MobilePOS.tsx`, `components/MobileCustomers.tsx` |
| **Raw `<select>` with Tailwind** | ~8 | Filter dropdowns, status selectors |
| **Search inputs** | ~5 | `components/desktop-pos/ProductSearch.tsx`, `components/desktop-pos/checkout/CustomerSearch.tsx`, `components/AdvancedFilterPanel.tsx` |
| **Form fields with labels** | ~10 | `components/ProductEditModal.tsx`, `components/disposal-form/DisposalFormLayout.tsx`, `components/import-goods/ImportFormLayout.tsx` |
| **TextArea** | ~3 | Note fields in forms |

### Existing Variants

| Variant | Locations | Notes |
|---------|-----------|-------|
| **Text** | Default `<input type="text">` | Most common, used everywhere |
| **Number** | `<input type="number">` | Price, quantity, discount fields |
| **Search** | Custom search bars with icons | POS product search, customer search |
| **Select/Dropdown** | Native `<select>` | Status filters, category selects |
| **TextArea** | `<textarea>` | Notes, descriptions |
| **DateTime/Local** | `<input type="datetime-local">` | Date pickers in forms |

### Existing States

| State | Currently Exists | Coverage |
|-------|-----------------|----------|
| **Default** | ✅ All implementations | 100% |
| **Focused** | ⚠️ Some use `focus:ring-*` or `focus:border-*` | ~40% |
| **Disabled** | ⚠️ Uses native `disabled` attribute + opacity | ~30% |
| **Error** | ❌ No standardized error state | 0% |
| **Required** | ⚠️ Native `required` attribute, no visual indicator | ~20% |
| **Placeholder** | ✅ Native placeholder attribute | ~80% |
| **ReadOnly** | ⚠️ Native readonly attribute | ~10% |

### Existing Custom Implementations

| Custom Implementation | Location | Description |
|----------------------|----------|-------------|
| **ProductEditModal inputs** | `components/ProductEditModal.tsx` | Custom styled inline inputs with `pem-*` classes |
| **POS search inputs** | `components/desktop-pos/ProductSearch.tsx`, `components/desktop-pos/checkout/CustomerSearch.tsx` | Mobile-optimized with icon overlays |
| **AdvancedFilterPanel inputs** | `components/AdvancedFilterPanel.tsx` | Date range pickers with custom styling |
| **Mobile form inputs** | `components/MobilePOS.tsx`, `components/MobileCustomers.tsx` | Mobile-first sizing, larger touch targets |
| **Import/Disposal form inputs** | `components/import-goods/ImportItemRow.tsx`, `components/disposal-form/DisposalItemRow.tsx` | Inline editable table cells |

### Design Standard Mapping

| MASTER_INPUT_STANDARD_V1 Spec | Current State | Gap |
|-------------------------------|---------------|-----|
| Consistent input sizing | ❌ Heights vary: py-2, py-2.5, py-3, h-8, h-10, h-[38px] | ❌ Full gap |
| Label + Input composition | ⚠️ Some use `label + input` pattern, but no FormField wrapper | ❌ No FormField component |
| Error state with message | ❌ No error state anywhere | ❌ Full gap |
| Helper text support | ❌ No helper text pattern | ❌ Full gap |
| Leading/trailing icons | ⚠️ Search inputs have icons, but no standard icon slot | ⚠️ Partial |
| Focus ring (accessibility) | ⚠️ ~40% implementations have focus styling | ⚠️ Partial |
| Disabled state styling | ❌ Inconsistent — some use `opacity-50`, some use `bg-gray-100` | ❌ No standard |
| Layout grid compatibility | ❌ Uses arbitrary grid/flex layouts | ❌ No standard |

### Compliance Gaps

| # | Gap | Severity | Impact |
|---|-----|----------|--------|
| 1 | **No FormField wrapper component** — Forms lack label/input/error composition | 🔴 HIGH | All form migration needs restructuring |
| 2 | **No error state** — Input validation has no UI feedback | 🔴 HIGH | Affects data integrity UX |
| 3 | **Inconsistent sizing** — No height standard across text, number, select inputs | 🟡 MEDIUM | Visual inconsistency |
| 4 | **No standard icon slot** — Icon positioning is ad-hoc | 🟡 MEDIUM | Harder to achieve consistent search/input patterns |
| 5 | **No TextInput/SelectInput components** — Everything is raw `<input>` | 🔴 HIGH | Every input must be individually migrated |

### Migration Complexity

**HIGH**

- Input instances: **40+**
- Form layouts affected: **8+** (ProductEdit, Disposal, Import, Count, Supplier, Customer, Settings, POS)
- Dependencies: Requires FormField component first
- Risk: High — forms are data-critical paths

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Form submission breaks after input component swap | MEDIUM | HIGH | Dedicated form submission tests |
| Mobile viewport input sizing lost | MEDIUM | HIGH | Test all mobile form flows |
| Date picker inputs not fitting standard patterns | HIGH | LOW | Accept native datetime-local as special case |
| POS quick-search input behavior changes | MEDIUM | MEDIUM | Test search debounce and keyboard behavior |

### Recommended Migration Sprint

**SPRINT_04** (as defined in UI_MIGRATION_MASTER_ROADMAP.md)

- Pre-work: Build TextInput, SelectInput, FormField components
- Phase 1: Migrate simple forms (Settings, Profile)
- Phase 2: Migrate CRUD modal forms (ProductEdit, PayDebt, TaxCalculation)
- Phase 3: Migrate feature forms (Disposal, Import, Count)
- Critical: POS checkout inputs (CustomerSearch, ProductSearch) — test after every change

---

## 3. State Components Audit

### Current Usage

State components (loading, empty, error) exist in a fragmented state:

| Component | Count | Examples |
|-----------|-------|---------|
| **Loading spinners** | ~10 | `pages/Dashboard.tsx` (Skeleton), `pages/Disposals.tsx` (StatCardSkeleton), `components/desktop-pos/ProductSearchResults.tsx` (inline spinner) |
| **Empty states** | ~5 | `pages/Inventory.tsx` (empty product), `pages/ReturnOrders.tsx` (empty returns), `pages/Suppliers.tsx` (empty suppliers) |
| **Error states** | ~3 | Inline error messages, `pages/ReturnOrders.tsx` (detail error) |
| **Skeleton loaders** | ~2 | `pages/Dashboard.tsx` — uses `<Skeleton variant="rect/text">` |
| **Status badges** | ~5 | `pages/Disposals.tsx` — uses `StatusBadge` with variant (warning, success, danger) |

### Existing Variants

| Variant | Implementation | Notes |
|---------|---------------|-------|
| **Loading (spinner)** | `Loader2` icon from lucide-react with `animate-spin` | Used inline during async operations |
| **Loading (skeleton)** | `Skeleton` component from ui.tsx with `variant="rect"` / `variant="text"` | Used in Dashboard only |
| **Empty** | Hardcoded JSX with icon + text + optional action button | Each page has unique empty state JSX |
| **Error** | Inline error message `<p className="text-red-500">` | No reusable ErrorState component |
| **StatusBadge** | Custom `StatusBadge` with variant (warning, success, danger) | Used in Disposals page, not a true state component |

### Existing States

| State Pattern | Coverage | Notes |
|---------------|----------|-------|
| **Loading (initial data fetch)** | ~40% of pages | Some pages show loading spinner, others have no loading state |
| **Loading (action progress)** | ~30% of forms | Submit buttons have loading state, but data loading doesn't |
| **Empty (no data)** | ~50% of list pages | Inconsistent — some show "no data", others show empty table |
| **Empty (no search results)** | ~30% | Partial — some search have "no results" state |
| **Error (network)** | ~20% | Most pages lack network error state |
| **Error (validation)** | ~10% | Only inline validation messages, no standard error component |
| **Transition between states** | ❌ | No loading → loaded transition management |

### Existing Custom Implementations

| Custom Implementation | Location | Description |
|----------------------|----------|-------------|
| **StatCardSkeleton** | `pages/Disposals.tsx` | Custom skeleton for stat cards with `animate-pulse` |
| **Skeleton component** | `pages/Dashboard.tsx` | Uses `Skeleton variant="rect/text"` with `rounded-lg` |
| **StatusBadge** | `components/StatusBadge` (inferred from usage) | Variant-based status indicator (warning, success, danger) |
| **Inline empty states** | `pages/Inventory.tsx`, `pages/ReturnOrders.tsx`, `pages/Suppliers.tsx` | Each page defines its own empty state layout |

### Design Standard Mapping

| MASTER_STATE_STANDARD_V1 Spec | Current State | Gap |
|------------------------------|---------------|-----|
| Standard LoadingState component | ❌ Only inline spinners and skeleton | ❌ Full gap |
| Standard EmptyState component | ❌ Each page has unique empty state JSX | ❌ Full gap |
| Standard ErrorState component | ❌ Inline error messages only | ❌ Full gap |
| State transition props (loading → loaded) | ❌ No transition management | ❌ Full gap |
| Loading variants (spinner, skeleton, shimmer) | ⚠️ Spinner and skeleton exist but as separate implementations | ⚠️ Partial |
| Empty state with action button | ⚠️ Some pages have action button in empty state | ⚠️ Partial |
| Error state with retry | ❌ No retry action pattern | ❌ Full gap |

### Compliance Gaps

| # | Gap | Severity | Impact |
|---|-----|----------|--------|
| 1 | **No LoadingState component** — Inconsistent loading UX across pages | 🟡 MEDIUM | User experience inconsistency |
| 2 | **No EmptyState component** — 50% of list pages lack proper empty state | 🟡 MEDIUM | Poor UX when no data |
| 3 | **No ErrorState component** — Network errors have no standard recovery UI | 🟡 MEDIUM | Users stuck on errors without retry |
| 4 | **No state transition management** — Loading → empty → error transitions not handled | 🟡 MEDIUM | Race conditions possible |
| 5 | **Dashboard-specific Skeleton not reusable** — Custom skeleton limited to Dashboard | 🟢 LOW | Minor duplication |

### Migration Complexity

**MEDIUM**

- New components to build: 3 (LoadingState, EmptyState, ErrorState)
- Pages to update: ~12 pages
- Not as many files to change as ActionButton or Input
- Risk: Low — state components are additive, not replacing existing functionality

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Empty state replacement hides action buttons | LOW | MEDIUM | Ensure all empty states preserve action buttons |
| Skeleton mismatch with actual content height | LOW | LOW | Use real layout measurements for skeleton |
| Error retry not wired to actual API calls | MEDIUM | HIGH | Audit all data fetching patterns before migration |

### Recommended Migration Sprint

**SPRINT_05** (as defined in UI_MIGRATION_MASTER_ROADMAP.md)

- Build LoadingState, EmptyState, ErrorState components
- Create state transition helper (useUIState hook)
- Migrate: Dashboard → DataGrid pages → Feature forms
- Low risk — can be done in parallel with ActionButton migration

---

## 4. SectionBox Audit

### Current Usage

SectionBox concept (sectioned layout containers) exists in several forms:

| Pattern | Count | Examples |
|---------|-------|---------|
| **ModalSection** (in MasterModal) | ~10 | `components/MasterModal.tsx` — pre-built section containers for modals |
| **ModalInfoGrid** (in MasterModal) | ~5 | Grid layout within MasterModal sections |
| **Inline sectioned `<div>` layouts** | ~20 | `components/disposal-form/DisposalSidebar/InfoSection.tsx`, `components/import-goods/ImportSidebar/*.tsx`, `components/inventory-count/CountSidebar/*.tsx` |
| **Card-based sections** | ~10 | `pages/Dashboard.tsx` — Card component with `variant` prop |
| **Border-top separated sections** | ~15 | Modal footers with `border-t`, form section dividers |

### Existing Variants

| Variant | Implementation | Notes |
|---------|---------------|-------|
| **ModalSection** | MasterModal default export | Pre-styled section with title, content area, optional actions |
| **ModalInfoGrid** | MasterModal sub-component | 2-column grid for info display |
| **Card** | `pages/Dashboard.tsx` | Dashboard-specific Card with `variant="elevated"`, `variant="default"` |
| **Inline `<div>` sections** | Feature-specific | Each feature has unique section layout |

### Existing States

| State | Coverage | Notes |
|-------|----------|-------|
| **Default (visible)** | ✅ All sections | 100% |
| **Collapsible** | ❌ | No collapsible section pattern |
| **Loading/Skeleton** | ❌ | No section-level loading state |
| **Empty** | ❌ | No section-level empty state |

### Existing Custom Implementations

| Custom Implementation | Location | Description |
|----------------------|----------|-------------|
| **Sidebar sections (Disposal)** | `components/disposal-form/DisposalSidebar/InfoSection.tsx`, `StatsSection.tsx`, `ReasonSection.tsx`, `NoteSection.tsx` | Feature-specific section layouts |
| **Sidebar sections (Import)** | `components/import-goods/ImportSidebar/ReceiptInfoSection.tsx`, `SupplierSection.tsx`, `TotalsSection.tsx`, `NoteSection.tsx` | Similar to Disposal pattern |
| **Sidebar sections (Count)** | `components/inventory-count/CountSidebar/CountInfoSection.tsx`, `CountSummary.tsx` | Already partially using MasterModal sub-components |
| **ModalInfoGrid** | `components/MasterModal.tsx` | Reusable 2-column grid within modal sections |

### Design Standard Mapping

| MASTER_SECTION_BOX_STANDARD_V1 Spec | Current State | Gap |
|-------------------------------------|---------------|-----|
| Standard SectionBox component | ❌ No standalone SectionBox component | ❌ Full gap |
| Configurable padding | ❌ Padding varies: p-4, p-5, p-6, px-8, px-6, px-4 | ❌ No standard |
| Configurable background | ❌ Background varies: white, bg-white, bg-slate-50, bg-gradient | ❌ No standard |
| Configurable border | ❌ Border varies: border-t, border-b, border-slate-100, border-slate-200 | ❌ No standard |
| Section title with optional actions | ⚠️ ModalSection has title+actions, but not a standalone component | ⚠️ Partial |
| Responsive columns (InfoGrid) | ⚠️ ModalInfoGrid exists but tied to MasterModal | ⚠️ Partial |

### Compliance Gaps

| # | Gap | Severity | Impact |
|---|-----|----------|--------|
| 1 | **No standalone SectionBox** — Current section layouts are 100% custom per feature | 🔴 HIGH | Every feature's section layout must be individually migrated |
| 2 | **ModalSection is MasterModal-coupled** — Cannot use outside MasterModal context | 🟡 MEDIUM | Requires extraction to standalone component |
| 3 | **Padding inconsistency** — No standard spacing scale | 🟡 MEDIUM | Visual inconsistency |
| 4 | **No responsive column pattern** — ModalInfoGrid is 2-column only | 🟢 LOW | Can extend later |
| 5 | **Sidebar sections have 50+ lines each** — High duplication across Disposal/Import/Count | 🔴 HIGH | Significant refactoring opportunity |

### Migration Complexity

**MEDIUM**

- New component to build: 1 (SectionBox standalone) + extract ModalSection from MasterModal
- Files affected: ~20 feature component files
- Risk: Medium — feature sidebars are self-contained, low cross-file impact

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SectionBox extraction from MasterModal creates circular dep | LOW | HIGH | Ensure SectionBox does NOT import MasterModal |
| Sidebar section layout breaks after standardization | MEDIUM | MEDIUM | Visual snapshot tests for each sidebar |
| Missing section variants (collapsible, loading) limit adoption | MEDIUM | LOW | Start with basic variant, add later |

### Recommended Migration Sprint

**SPRINT_07** (as defined in UI_MIGRATION_MASTER_ROADMAP.md)

- Build standalone SectionBox component (extract from MasterModal patterns)
- Migrate: CountSidebar sections (already close to target) → DisposalSidebar → ImportSidebar
- Low risk for Count feature (already partially migrated)

---

## 5. Tabs Audit

### Current Usage

Tab implementations exist across the codebase:

| Pattern | Count | Examples |
|---------|-------|---------|
| **Inline flexbox tab bars** | ~5 | `pages/Inventory.tsx` (product/category/brand tabs), `pages/Disposals.tsx` (status tabs) |
| **SearchAndTabs (POS)** | ~1 | `components/desktop-pos/SearchAndTabs.tsx` — integrated search + tabs |
| **InvoiceTabs (POS)** | ~1 | `components/desktop-pos/InvoiceTabs.tsx` — invoice-specific tab navigation |
| **Tab-style filter buttons** | ~3 | `pages/ReturnOrders.tsx`, `pages/Customers.tsx` — button group acting as tabs |
| **BO_CUC_TAB_KIEM_KE** | ~1 | Dedicated document defining inventory count tab layout |

### Existing Variants

| Variant | Implementation | Notes |
|---------|---------------|-------|
| **Tab bar (inline flex)** | `<div className="flex ...">` with active/inactive buttons | Most common — pages manually style active tab |
| **Tab bar (rounded pill)** | `<div className="flex bg-white border rounded-xl p-1">` | Used in Inventory, CategoryManagement, BrandManagement |
| **Tab bar (border-bottom)** | `<div className="flex border-b ...">` | Used in some modal headers |
| **Search+Tab combo** | POS-specific integrated search field + tab bar | Unique to POS |

### Existing States

| State | Coverage | Notes |
|-------|----------|-------|
| **Default (inactive)** | ✅ All implementations | Active tab has different styling |
| **Active** | ✅ All implementations | Uses `bg-indigo-600 text-white` or `border-b-2 border-indigo-600` |
| **Hover** | ⚠️ Some tabs have `hover:*` classes | ~60% have hover state |
| **Disabled** | ❌ No disabled tab pattern | 0% |
| **Loading** | ❌ No tab-content loading state | 0% |
| **Badge on tab** | ❌ No badge/tab notification pattern | 0% |
| **Responsive scroll** | ❌ No horizontal scroll for overflow tabs | 0% |

### Existing Custom Implementations

| Custom Implementation | Location | Description |
|----------------------|----------|-------------|
| **SearchAndTabs** | `components/desktop-pos/SearchAndTabs.tsx` | Search bar + tab navigation integrated |
| **InvoiceTabs** | `components/desktop-pos/InvoiceTabs.tsx` | POS-specific invoice tabs with print actions |
| **Filter pill tabs** | `pages/Disposals.tsx` | Filter status pills acting as tabs |
| **Page header tabs** | `pages/Inventory.tsx` | Product/Category/Brand/Batch tab group |

### Design Standard Mapping

| MASTER_TABS_STANDARD_V1 Spec | Current State | Gap |
|------------------------------|---------------|-----|
| Standard Tabs component with `tabs` prop | ❌ | ❌ Full gap |
| Tab variants (underline, pill, condensed) | ❌ | ❌ Full gap |
| Active tab indicator | ⚠️ Inline implementations have active styling but not standardized | ⚠️ Partial |
| Tab content panel | ❌ | ❌ Full gap |
| Badge/count on tabs | ❌ | ❌ Full gap |
| Disabled tab state | ❌ | ❌ Full gap |
| Scrollable overflow | ❌ | ❌ Full gap |
| Feature flag (`useNewTabs`) | ❌ | ❌ Full gap |

### Compliance Gaps

| # | Gap | Severity | Impact |
|---|-----|----------|--------|
| 1 | **No Tabs component** — Every tab implementation is custom inline JSX | 🔴 HIGH | High duplication across pages |
| 2 | **No content panel component** — Tab content is manually shown/hidden | 🟡 MEDIUM | Inconsistent transition patterns |
| 3 | **No tab variants** — Underline, pill, condensed styles all reimplemented | 🟡 MEDIUM | Each page reinvents tab styling |
| 4 | **No accessibility** — No `role="tab"`, `aria-selected`, keyboard navigation | 🟡 MEDIUM | Screen reader incompatible |
| 5 | **No badge/count support** — Cannot show item counts on tabs | 🟢 LOW | Enhancement opportunity |

### Migration Complexity

**LOW-MEDIUM**

- New component to build: 1 (Tabs)
- Pages to update: ~5 (Inventory, Disposals, ReturnOrders, Customers, POS)
- Low complexity for basic implementation
- POS SearchAndTabs is the most complex case

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| POS SearchAndTabs integration breaks | MEDIUM | HIGH | Test POS flows thoroughly |
| Tab selection triggers rerender of entire page | LOW | MEDIUM | Use memo/content isolation |
| Keyboard navigation conflicts with existing shortcuts | LOW | LOW | Document all current keyboard interactions |

### Recommended Migration Sprint

**SPRINT_08** (as defined in UI_MIGRATION_MASTER_ROADMAP.md)

- Build Tabs component with underline + pill variants
- Migrate: Inventory (product tabs) → Disposals (filter tabs) → ReturnOrders → Customers
- POS SearchAndTabs: defer to Phase 2 or handle as special case (search + tab integration complex)

---

## 6. DataGrid Audit

### Current Usage

DataGrid (data tables with sorting, filtering, pagination) appears across:

| Page | Table Type | Features |
|------|-----------|----------|
| **pages/Inventory.tsx** | Custom table | Product list with bulk actions, search, Excel export |
| **pages/Disposals.tsx** | Custom table | Disposal list with status badge, actions |
| **pages/ReturnOrders.tsx** | Custom table | Return orders list with actions |
| **pages/Customers.tsx** | Custom table | Customer list with debt filter |
| **pages/Suppliers.tsx** | Custom table | Supplier list with payment status |
| **pages/CategoryManagement.tsx** | Custom table | Category/brand lists |
| **pages/BrandManagement.tsx** | Custom table | Brand lists |
| **pages/Orders.tsx** | Custom table | Order list (inferred from structure) |
| **components/disposal-form/DisposalItemsTable.tsx** | Editable table | Inline item rows with CRUD |
| **components/import-goods/ImportItemsTable.tsx** | Editable table | Similar to DisposalItemsTable |
| **components/inventory-count/CountItemsTable.tsx** | Editable table | Count items with lot selection |

### Existing Variants

| Variant | Implementation | Notes |
|---------|---------------|-------|
| **Read-only data table** | `<table>` or `<div>` grid layout with data rows | Used in list pages (Inventory, Disposals, Customers, etc.) |
| **Editable inline table** | `<div>` grid with editable inputs per row | Used in feature forms (DisposalItemsTable, ImportItemsTable, CountItemsTable) |
| **Status row table** | Table with StatusBadge per row | Used in Disposals, ReturnOrders |
| **Action column table** | Table with action buttons per row | Used in all list pages |
| **Bulk selection table** | Table with checkbox column | Used in Inventory, Disposals |

### Existing States

| State | Coverage | Notes |
|-------|----------|-------|
| **Data loaded** | ✅ All tables | Proper row rendering |
| **Empty** | ⚠️ Some pages have empty state, others show empty table | ~50% coverage |
| **Loading (skeleton/spinner)** | ⚠️ Some pages have loading state | ~40% coverage |
| **Error** | ❌ No table-level error state | 0% |
| **Sorting** | ⚠️ Some columns clickable for sort | ~30% |
| **Pagination** | ⚠️ Some pages have pagination, others scroll | ~40% |
| **Column sorting indicator** | ❌ | 0% |
| **Row selection** | ⚠️ Checkbox-based bulk selection | ~2 pages |
| **Row hover** | ⚠️ Some tables have `hover:*` classes | ~60% |

### Existing Custom Implementations

| Custom Implementation | Location | Description |
|----------------------|----------|-------------|
| **DisposalItemsTable** | `components/disposal-form/DisposalItemsTable.tsx` | Editable table with inline inputs, delete actions |
| **ImportItemsTable** | `components/import-goods/ImportItemsTable.tsx` | Editable table with lot expiry popover |
| **CountItemsTable** | `components/inventory-count/CountItemsTable.tsx` | Editable table with product search dropdown |
| **Inventory product table** | `pages/Inventory.tsx` | Read-only with bulk selection, Excel export |
| **Category/Brand tables** | `pages/CategoryManagement.tsx`, `pages/BrandManagement.tsx` | Simple CRUD tables |

### Design Standard Mapping

| MASTER_DATA_GRID_STANDARD_V1 Spec | Current State | Gap |
|-----------------------------------|---------------|-----|
| Standard DataGrid component | ❌ | ❌ Full gap |
| Column definition props | ❌ | ❌ Full gap |
| Sorting (asc/desc) | ⚠️ Some pages have sort buttons | ⚠️ Partial |
| Pagination | ⚠️ Some pages have prev/next | ⚠️ Partial |
| Row selection (checkbox) | ⚠️ Inventory has bulk select | ⚠️ Partial |
| Column filters | ❌ | ❌ Full gap |
| Expandable rows | ❌ | ❌ Full gap |
| Custom cell renderers | ⚠️ StatusBadge, action buttons exist as inline JSX | ⚠️ Partial |
| Editable cells | ⚠️ Feature tables (Disposal/Import/Count) have inline editing | ⚠️ Partial |
| Empty state built-in | ❌ | ❌ Full gap |
| Loading state built-in | ❌ | ❌ Full gap |
| Scrollable (horizontal/vertical) | ❌ | ❌ Full gap |
| Feature flag (`useNewDataGrid`) | ❌ | ❌ Full gap |

### Compliance Gaps

| # | Gap | Severity | Impact |
|---|-----|----------|--------|
| 1 | **No DataGrid component** — Every table is a custom implementation | 🔴 HIGH | 10+ custom table implementations, massive duplication |
| 2 | **No column definition pattern** — Column rendering is inline per page | 🔴 HIGH | Every column layout is unique |
| 3 | **No pagination standard** — Some pages use LIMIT/OFFSET, others scroll | 🟡 MEDIUM | Inconsistent UX |
| 4 | **No sorting standard** — Sort indicators are ad-hoc | 🟡 MEDIUM | Users can't rely on consistent sort behavior |
| 5 | **No built-in empty/loading/error states** — Each page implements separately | 🟡 MEDIUM | State handling duplicated |
| 6 | **Editable tables are 100% custom** — DisposalItemsTable, ImportItemsTable, CountItemsTable | 🔴 HIGH | Feature-form tables are complex and not reusable |

### Migration Complexity

**HIGH** (highest complexity in entire project)

- New component to build: 1 massive component (DataGrid)
- Pages to migrate: **10+**
- Editable table variants: **3** (Disposal/Import/Count)
- Dependencies: Requires ActionButton, State Components, Input components first
- Risk: Highest in project — identified as 4-star complexity in UI_MIGRATION_MASTER_ROADMAP.md

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| DataGrid component becomes too complex (feature creep) | HIGH | HIGH | Start with read-only DataGrid, add edit features later |
| Editable table migration breaks inline editing UX | MEDIUM | HIGH | Dedicated testing for each editable table type |
| Pagination behavior change affects user workflows | MEDIUM | MEDIUM | Maintain same page size defaults |
| Sorting logic differs from current per-page sort | MEDIUM | MEDIUM | Document current sort behavior before migration |
| Column layout changes break existing screenshots/docs | MEDIUM | LOW | Visual regression tests |

### Recommended Migration Sprint

**SPRINT_26-29** (as defined in UI_MIGRATION_MASTER_ROADMAP.md)

- SPRINT_26: Build read-only DataGrid component with column defs, sorting, pagination, states
- SPRINT_27: Migrate simple list pages (Categories, Brands, Customers, Suppliers)
- SPRINT_28: Migrate complex list pages (Inventory, Disposals, ReturnOrders, Orders)
- SPRINT_29: Build editable DataGrid variants and migrate feature tables (DisposalItems, ImportItems, CountItems)

---

## 7. Executive Summary

### Component Audit Overview

| Component | Current State | Compliance | Migration Complexity | # Files Affected | Priority |
|-----------|--------------|-----------|---------------------|-----------------|----------|
| **ActionButton** | 3 parallel systems + 60+ raw buttons | 30% | 🔴 HIGH | ~35 | SPRINT_03 |
| **Input** | 40+ raw inputs with no FormField | 20% | 🔴 HIGH | ~30 | SPRINT_04 |
| **State Components** | Fragmented spinners/empty/error | 15% | 🟡 MEDIUM | ~15 | SPRINT_05 |
| **SectionBox** | ModalSection coupled to MasterModal | 25% | 🟡 MEDIUM | ~20 | SPRINT_07 |
| **Tabs** | 5+ custom inline implementations | 10% | 🟢 LOW-MEDIUM | ~7 | SPRINT_08 |
| **DataGrid** | 10+ custom table implementations | 5% | 🔴 HIGH | ~15 | SPRINT_26-29 |

### Key Findings

1. **ActionButton has the widest gap** — 3 competing button systems (ui.tsx, MasterModal, raw) with 60+ raw buttons. No size scale, no focus ring, inconsistent disabled/loading states.

2. **Input and FormField are the most critical foundational gap** — No FormField wrapper means every form field must be individually migrated. Error states are completely missing.

3. **State Components are the easiest win** — Additive components (non-breaking), 3 components to build, and can be adopted incrementally.

4. **DataGrid is the highest complexity item** — 4 sprints allocated in roadmap. Depends on all other components. Editable table variants increase complexity significantly.

5. **SectionBox extraction from MasterModal is necessary** — ModalSection should become standalone SectionBox to be used in modal and non-modal contexts.

6. **Tabs are the most fragmented** — 5+ different implementations, each with unique active/inactive styling. POS SearchAndTabs is the most complex variant.

### Critical Gaps (Must Fix)

| # | Gap | Component | Severity | Blocking |
|---|-----|-----------|----------|----------|
| 1 | No primary color standard (indigo vs violet) | ActionButton | 🔴 HIGH | Design system consistency |
| 2 | No FormField component | Input | 🔴 HIGH | All form migration blocked |
| 3 | No DataGrid component | DataGrid | 🔴 HIGH | 10+ page migration blocked |
| 4 | No focus ring on any component | All | 🟡 MEDIUM | Accessibility |
| 5 | No loading/empty/error state components | State | 🟡 MEDIUM | UX quality |
| 6 | No feature flags implemented | All | 🔴 HIGH | Safe migration blocked |

### Strategic Recommendation

```
PHASE 1: Foundation (Sprint 03-06)
├── Build ActionButton (fix indigo/violet conflict → use violet)
├── Build TextInput, SelectInput, FormField
├── Build LoadingState, EmptyState, ErrorState
└── Add feature flags for all new components

PHASE 2: Layout (Sprint 07-08)
├── Extract SectionBox from MasterModal
├── Build Tabs component
└── Migrate sidebar sections

PHASE 3: Data (Sprint 26-29)
├── Build DataGrid (read-only first)
├── Build editable DataGrid variants
└── Migrate all pages

PHASE 4: Cleanup (Sprint 32)
├── Deprecate ui.tsx Button
├── Remove hardcoded button classes
└── Full audit pass
```

---

## 8. Audit Completeness

| Component | Current Usage | Existing Variants | Existing States | Custom Impls | Standard Mapping | Compliance Gaps | Migration Complexity | Risks | Sprint |
|-----------|-------------|------------------|-----------------|--------------|------------------|----------------|---------------------|-------|--------|
| **ActionButton** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Input** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **State Components** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **SectionBox** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Tabs** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **DataGrid** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**AUDIT COMPLETENESS: PASS**

All 6 components audited across all 9 required dimensions:
- Current Usage: ✅
- Existing Variants: ✅
- Existing States: ✅
- Existing Custom Implementations: ✅
- Design Standard Mapping: ✅
- Compliance Gaps: ✅
- Migration Complexity: ✅
- Risks: ✅
- Recommended Migration Sprint: ✅

---

## 9. Readiness Impact

### Condition #1 Resolution Status

From **IMPLEMENTATION_READINESS_REPORT.md** Section 5:

> **CONDITION #1:** Create audit reports for each component group before its sprint begins.

This UI_COMPONENT_AUDIT_MASTER_REPORT.md serves as the consolidated audit for all 6 non-modal component groups:

| Condition Sub-Item | Status | Reference in This Report |
|-------------------|--------|-------------------------|
| **ActionButton Audit** (needed before SPRINT_03) | ✅ RESOLVED | Section 1 — ActionButton Audit |
| **Input System Audit** (needed before SPRINT_04) | ✅ RESOLVED | Section 2 — Input Audit |
| **State Component Audit** (needed before SPRINT_05) | ✅ RESOLVED | Section 3 — State Components Audit |
| **SectionBox Audit** (needed before SPRINT_07) | ✅ RESOLVED | Section 4 — SectionBox Audit |
| **Tabs Audit** (needed before SPRINT_08) | ✅ RESOLVED | Section 5 — Tabs Audit |
| **Data Grid Audit** (needed before SPRINT_26) | ✅ RESOLVED | Section 6 — DataGrid Audit |

### Note on Condition #2 and #3

For full context, this report addresses **Condition #1** from the Implementation Readiness Report.

- **CONDITION #1:** ✅ RESOLVED — All 6 component audits completed and consolidated in this report
- **CONDITION #2** (Implementation Sequence vs Roadmap alignment): Separate remediation required
- **CONDITION #3** (Buffer sprints): Separate remediation required

### Immediate Next Steps

1. **Review this Audit Master Report** with the UI migration team
2. **Begin ActionButton component build** (SPRINT_03) using the compliance gaps identified in Section 1
3. **Ensure feature flag** is implemented for ALL new components before any migration
4. **Schedule dedicated testing** for POS-critical components (ActionButton in PaymentModal, Input in CustomerSearch)
5. **Reconcile indigo vs violet** color conflict before any code is written

---

> **Document Status: LIVING DOCUMENT**  
> This report should be updated as migration progresses. Each sprint review should reference the relevant component section to verify compliance gaps are being closed.
>
> **Next Review:** At completion of SPRINT_03 (ActionButton Migration)