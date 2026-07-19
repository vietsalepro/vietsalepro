# UI MIGRATION MASTER ROADMAP — VietSale Pro v7

> **Version:** 1.0  
> **Date:** 2026-06-24  
> **Purpose:** Sprint-by-sprint migration roadmap optimized for AI Agent execution with small context windows  
> **Single Source of Truth:** `/Master-design/`  
> **Reference Documents:** `UI_DEPENDENCY_GRAPH.md`, `UI_ACCEPTANCE_CRITERIA.md`, `UI_ROLLBACK_PLAN.md`, `UI_MODAL_MIGRATION_MASTER_PLAN.md`  
> **Total Sprints:** 35

---

## SECTION 1 — PROJECT OVERVIEW

### 1.1 What This Roadmap Covers

Migration of the entire VietSale Pro v7 UI from legacy/adhoc implementation to the standardized Master Design System. This includes:

| Domain | Count | Details |
|--------|-------|---------|
| **Layer 0 — Design Foundation** | 2 | Design Tokens CSS, Typography |
| **Layer 1 — Primitives** | 4 | ActionButton, Input, State Components, StatusBadge |
| **Layer 2 — Containers** | 5 | MasterModal, SectionBox, DataGrid, Tabs, Notification |
| **Layer 3 — Business Modals** | 7 | PaymentModal, PromotionModal, PayDebtModal, ProductEditModal, TaxCalculationModal, DisposalDetailModal, BatchSelectionModal |
| **Layer 4 — Form Layouts** | 3 | DisposalFormLayout, ImportFormLayout, CountFormLayout |
| **Layer 5 — Pages & Shell** | 6+ | App Shell, Split Pane, Dashboard, Legacy Cleanup |
| **Cross-cutting** | 4 | Picker, Permission, Document, Audit Log |

### 1.2 Current State Summary

| Metric | Value |
|--------|-------|
| Components with legacy inline CSS | 7+ |
| Modals NOT using MasterModal | 6 (PaymentModal, PromotionModal, DisposalDetailModal, PayDebtModal, ProductEditModal, TaxCalculationModal) |
| Form layouts with inline section CSS | 3 (DisposalFormLayout, ImportFormLayout, CountFormLayout) |
| Legacy ui.tsx components to clean up | 8+ |
| Pages using DataGrid pattern | 6+ |
| Total affected code points | 30+ |

### 1.3 AI Agent Handover Model

```
Chat A ──→ Sprint 01-03 ──→ Handover Artifact ──→ Chat B
                                                       ↓
                                              Sprint 04-06 ──→ Handover Artifact ──→ Chat C
                                                                                        ↓
                                                                               Sprint 07+
```

Each sprint produces a **Handover Artifact** (`SPRINT_XX_HANDOVER.md`) that enables the next agent to start without reading the full project context.

---

## SECTION 2 — MIGRATION PRINCIPLES

### 2.1 Core Rules

| # | Principle | Description |
|---|-----------|-------------|
| P1 | **Bottom-Up Migration** | Foundation → Primitives → Containers → Business Components. Never skip layers. |
| P2 | **Parallel Safe** | Each sprint is self-contained. Foundation sprints (01-12) can run in any order as they build NEW files. |
| P3 | **Never Modify Business Logic** | Only JSX/CSS changes. State management, handlers, API calls remain untouched. |
| P4 | **Feature Flag First** | Every migrated component has a feature flag for instant rollback. |
| P5 | **One Sprint = One AI Session** | No sprint exceeds what a single AI agent can complete in one session (~200 lines of code or less). |
| P6 | **Handover Artifact Required** | Each sprint ends with a handover document. No exceptions. |
| P7 | **Acceptance Criteria Gate** | A sprint is only complete when all its Acceptance Criteria pass. |

### 2.2 Sprint Size Guidelines

| Metric | Maximum |
|--------|---------|
| Files modified | 3 |
| New files created | 2 |
| Components changed | 2 |
| Lines of code changed | 300 |
| Risk exposure | 1 HIGH-risk item per sprint |

---

## SECTION 3 — NON-NEGOTIABLE RULES

### 3.1 What You MUST Do

- [ ] Read the Design Standard document listed in "Design Standards Required" before writing any code
- [ ] Read the Architecture document listed in "Architecture Documents Required" before writing any code
- [ ] Create feature flag for every migrated component
- [ ] Write Handover Artifact at sprint completion
- [ ] Verify ALL Acceptance Criteria before marking sprint complete
- [ ] Create test scenarios in the Handover Artifact

### 3.2 What You MUST NOT Do

- [ ] Do NOT modify business logic (handlers, validations, API calls, state management)
- [ ] Do NOT modify database schema or queries
- [ ] Do NOT modify permission/role logic
- [ ] Do NOT modify calculation formulas
- [ ] Do NOT create new Design Standards
- [ ] Do NOT create new Audit Reports
- [ ] Do NOT skip sprints
- [ ] Do NOT modify types.ts (API contracts)

### 3.3 Hard Blocker Conditions

If any of these are true, the sprint MUST be rolled back immediately:

| Condition | Action |
|-----------|--------|
| Business logic changed unintentionally | 🔴 HARD BLOCKER — Rollback |
| API contract broken | 🔴 HARD BLOCKER — Rollback |
| Data loss or corruption | 🔴 HARD BLOCKER — Rollback |
| User workflow disrupted | 🔴 HARD BLOCKER — Rollback |
| Validation rules changed | 🔴 HARD BLOCKER — Rollback |

---

## SECTION 4 — SPRINT BREAKDOWN

---

### SPRINT 01

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_01 |
| **Sprint Name** | Design Tokens CSS — Global Variables |
| **Objective** | Verify and complete `design-system-tokens.css` with all CSS custom properties for colors, spacing, radius, shadows, borders, z-index, opacity. Ensure all tokens from MASTER_DESIGN_TOKENS_V1 are present and correctly named. |
| **Dependencies** | None (foundation layer) |
| **Design Standards Required** | MASTER_DESIGN_TOKENS_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 5 — Foundation Layer) |
| **Expected Deliverables** | 1. Verified `design-system-tokens.css` with ALL tokens from MASTER_DESIGN_TOKENS_V1<br>2. Token audit checklist showing every token is present<br>3. Validation that `mmFadeUp` keyframe exists |
| **Acceptance Criteria** | 1. Every color token from MASTER_DESIGN_TOKENS_V1 exists as `var(--color-*)`<br>2. Every spacing token exists as `var(--space-*)`<br>3. Every radius token exists as `var(--radius-*)`<br>4. Every shadow token exists as `var(--shadow-*)`<br>5. Every z-index token exists as `var(--z-*)`<br>6. Every opacity token exists as `var(--opacity-*)`<br>7. `mmFadeUp` keyframe is defined<br>8. No hardcoded values in any component that should use tokens<br>9. CSS file is importable and compiles without errors |
| **Risk Level** | 🟢 LOW — Creating/verifying CSS variables only, no runtime impact |
| **Rollback Level** | Level 1 (single file revert via Git) |
| **Estimated Complexity** | ⭐ (1 hour) |
| **Next Sprint** | SPRINT_02 |

---

### SPRINT 02

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_02 |
| **Sprint Name** | Typography Standardization |
| **Objective** | Standardize all typography values across the system using tokens defined in MASTER_TYPOGRAPHY_V1. Create a typography utility class file if needed, or verify `design-system-tokens.css` contains all typography tokens. |
| **Dependencies** | SPRINT_01 (Design Tokens must be complete) |
| **Design Standards Required** | MASTER_TYPOGRAPHY_V1.md, MASTER_DESIGN_TOKENS_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md |
| **Expected Deliverables** | 1. All typography tokens (`--text-*`, `--font-*`, `--leading-*`, `--tracking-*`) in CSS<br>2. Typography utility classes or component mappings<br>3. Quick-reference table of old → new typography mapping |
| **Acceptance Criteria** | 1. All font-size tokens from standard exist<br>2. All font-weight tokens exist<br>3. All line-height tokens exist<br>4. No hardcoded font-size/weight in any component that should use tokens<br>5. Typography tokens pass CSS validation |
| **Risk Level** | 🟢 LOW — Adding CSS variables, no existing code modified |
| **Rollback Level** | Level 1 (single file revert) |
| **Estimated Complexity** | ⭐ (1 hour) |
| **Next Sprint** | SPRINT_03 |

---

### SPRINT 03

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_03 |
| **Sprint Name** | ActionButton Component |
| **Objective** | Build standalone ActionButton component (PrimaryButton, SecondaryButton, DangerButton, GhostButton) following MASTER_ACTION_BUTTON_STANDARD_V1 specifications. Component must be a new file — does NOT replace any existing button yet. |
| **Dependencies** | SPRINT_01 (Design Tokens) |
| **Design Standards Required** | MASTER_ACTION_BUTTON_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 4.4 — ActionButton impact) |
| **Expected Deliverables** | 1. New `components/ActionButton.tsx` (or similar) with all button variants<br>2. Button exports: PrimaryButton, SecondaryButton, DangerButton, GhostButton<br>3. Support for: disabled, loading, icon, size (sm/md/lg)<br>4. Feature flag `useNewActionButton` in a flags config |
| **Acceptance Criteria** | 1. All 4 button variants render with correct colors (Primary=#6C4DFF, Secondary=white, Danger=#EF4444, Ghost=transparent)<br>2. Height=40px, radius=12px, font=14px/600 for all<br>3. Disabled state has opacity=0.5, cursor=not-allowed<br>4. Loading state shows spinner, preserves width (no layout shift)<br>5. Hover states work (Primary: #5B3FE0, Secondary: bg-slate-50, Danger: #DC2626)<br>6. Focus visible ring exists<br>7. All tokens use CSS variables, no hardcoded colors<br>8. Feature flag can toggle between legacy and new button |
| **Risk Level** | 🟢 LOW — New file, no existing code modified |
| **Rollback Level** | Level 1 (remove feature flag import) |
| **Estimated Complexity** | ⭐⭐ (2-3 hours) |
| **Next Sprint** | SPRINT_04 |

---

### SPRINT 04

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_04 |
| **Sprint Name** | Input System — TextInput, SelectInput, FormField |
| **Objective** | Build standardized Input components following MASTER_INPUT_STANDARD_V1. Create TextInput, SelectInput, and FormField wrapper as new files. |
| **Dependencies** | SPRINT_01 (Design Tokens) |
| **Design Standards Required** | MASTER_INPUT_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 4.5 — Input impact) |
| **Expected Deliverables** | 1. New `components/TextInput.tsx` with label, error, helper text<br>2. New `components/SelectInput.tsx` with options, placeholder<br>3. New `components/FormField.tsx` wrapper with label/error layout<br>4. Feature flag `useNewFormInputs` |
| **Acceptance Criteria** | 1. TextInput supports: label, placeholder, error state, disabled, required<br>2. SelectInput supports: options array, placeholder, error state, disabled<br>3. FormField wraps input with label above + error below<br>4. Input height uses token, border radius uses token<br>5. Focus state has ring-2 with primary color<br>6. Error state shows red border + error message text<br>7. All variants use Design Tokens — no hardcoded values<br>8. Keyboard navigation works (Tab, Shift+Tab, Enter to select in SelectInput)<br>9. Feature flag can toggle between legacy and new inputs |
| **Risk Level** | 🟢 LOW — New files, no existing code modified |
| **Rollback Level** | Level 1 (remove feature flag import) |
| **Estimated Complexity** | ⭐⭐ (2-3 hours) |
| **Next Sprint** | SPRINT_05 |

---

### SPRINT 05

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_05 |
| **Sprint Name** | State Components — Loading, Empty, Error |
| **Objective** | Build standardized state components (LoadingState, EmptyState, ErrorState) following MASTER_STATE_STANDARD_V1. These will be used across all data-display components. |
| **Dependencies** | SPRINT_01 (Design Tokens) |
| **Design Standards Required** | MASTER_STATE_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 8 — State Dependency Map) |
| **Expected Deliverables** | 1. New `components/LoadingState.tsx` with spinner + message<br>2. New `components/EmptyState.tsx` with icon + message + optional action<br>3. New `components/ErrorState.tsx` with error icon + message + retry button<br>4. Feature flag `useNewStateComponents` |
| **Acceptance Criteria** | 1. LoadingState shows spinner (using Design Token animation) + configurable message<br>2. EmptyState shows icon + title + description + optional CTA button<br>3. ErrorState shows error icon + message + Retry button (reuses ActionButton)<br>4. All use Design Tokens for spacing, colors, typography<br>5. Retry button in ErrorState fires a callback prop<br>6. State components are self-contained and accept children/content slots<br>7. Feature flag can toggle between legacy and new state components |
| **Risk Level** | 🟢 LOW — New files, no existing code modified |
| **Rollback Level** | Level 1 (remove feature flag import) |
| **Estimated Complexity** | ⭐⭐ (2-3 hours) |
| **Next Sprint** | SPRINT_06 |

---

### SPRINT 06

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_06 |
| **Sprint Name** | StatusBadge Component |
| **Objective** | Extract and standardize StatusBadge from MasterModal into a standalone component following MASTER_STATUS_BADGE_STANDARD_V1. Support all 6 variants: success, warning, danger, info, neutral, purple. |
| **Dependencies** | SPRINT_01 (Design Tokens) |
| **Design Standards Required** | MASTER_STATUS_BADGE_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 4.2 — StatusBadge impact) |
| **Expected Deliverables** | 1. New standalone `components/StatusBadge.tsx`<br>2. Support all 6 variants with correct color mappings<br>3. Support for dot/icon + text layout<br>4. Feature flag `useNewStatusBadge` |
| **Acceptance Criteria** | 1. All 6 variants render with correct colors (success=#059669, warning=#D97706, danger=#DC2626, info=#0284C7, neutral=#64748B, purple=#7C3AED)<br>2. Badge shows colored dot + text label<br>3. Dot size is consistent (8px)<br>4. Text uses correct typography token<br>5. All colors use CSS variables<br>6. Badge is accessible (text contrast meets WCAG AA)<br>7. Feature flag can toggle between legacy and new badge |
| **Risk Level** | 🟢 LOW — New file, no existing code modified initially |
| **Rollback Level** | Level 1 (remove feature flag import) |
| **Estimated Complexity** | ⭐ (1-2 hours) |
| **Next Sprint** | SPRINT_07 |

---

### SPRINT 07

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_07 |
| **Sprint Name** | SectionBox Container |
| **Objective** | Build standardized SectionBox container following MASTER_SECTION_BOX_STANDARD_V1. This replaces all inline section CSS patterns across form layouts and modals. |
| **Dependencies** | SPRINT_01 (Design Tokens), SPRINT_03 (ActionButton for section header actions) |
| **Design Standards Required** | MASTER_SECTION_BOX_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 4.3 — SectionBox impact) |
| **Expected Deliverables** | 1. New `components/SectionBox.tsx` with SectionBox, SectionHeader, SectionContent<br>2. Support for: title, description, action slot, collapsible<br>3. Feature flag `useNewSectionBox` |
| **Acceptance Criteria** | 1. SectionBox renders with radius=20px, border, subtle shadow<br>2. SectionHeader shows title (18px/600) + optional action button<br>3. SectionContent has proper padding from Design Tokens<br>4. Collapsible state works (if supported)<br>5. Empty section renders without error<br>6. All styling uses Design Tokens |
| **Risk Level** | 🟢 LOW — New file, no existing code modified yet |
| **Rollback Level** | Level 1 (remove feature flag import) |
| **Estimated Complexity** | ⭐⭐ (2-3 hours) |
| **Next Sprint** | SPRINT_08 |

---

### SPRINT 08

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_08 |
| **Sprint Name** | Tabs Standardization |
| **Objective** | Build standardized Tabs component following MASTER_TABS_STANDARD_V1. This replaces the legacy Tabs from ui.tsx. |
| **Dependencies** | SPRINT_01 (Design Tokens) |
| **Design Standards Required** | MASTER_TABS_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 6 — Shared Component Matrix) |
| **Expected Deliverables** | 1. New `components/Tabs.tsx` with TabList, Tab, TabPanel<br>2. Support for: horizontal/vertical, icon + text, disabled tab<br>3. Feature flag `useNewTabs` |
| **Acceptance Criteria** | 1. TabList renders tabs in a row with active tab highlighted<br>2. Active tab has underline/border with primary color<br>3. Tab content switches when clicking different tabs<br>4. Keyboard navigation works (Left/Right arrows, Home/End)<br>5. Disabled tab is not clickable and has muted styling<br>6. All tokens use Design Token variables |
| **Risk Level** | 🟢 LOW — New file |
| **Rollback Level** | Level 1 |
| **Estimated Complexity** | ⭐⭐ (2 hours) |
| **Next Sprint** | SPRINT_09 |

---

### SPRINT 09

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_09 |
| **Sprint Name** | Notification System |
| **Objective** | Build standardized Notification/Toast component following MASTER_NOTIFICATION_STANDARD_V1. This replaces the legacy Toast from ui.tsx. |
| **Dependencies** | SPRINT_01 (Design Tokens), SPRINT_03 (ActionButton for dismiss) |
| **Design Standards Required** | MASTER_NOTIFICATION_STANDARD_V1.md, MASTER_MOTION_ANIMATION_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md |
| **Expected Deliverables** | 1. New `components/Notification.tsx` with Toast container<br>2. Support for: success/error/warning/info variants<br>3. Auto-dismiss with configurable duration<br>4. Stacking/multiple toasts support<br>5. Feature flag `useNewNotification` |
| **Acceptance Criteria** | 1. All 4 variants render with correct colors and icons<br>2. Toast appears with slide-in animation from top-right<br>3. Auto-dismiss works with configurable duration (default 5s)<br>4. Multiple toasts stack vertically<br>5. Dismiss button (X) works<br>6. Clicking toast does NOT dismiss (unless configured)<br>7. All tokens use Design Tokens |
| **Risk Level** | 🟢 LOW — New file |
| **Rollback Level** | Level 1 |
| **Estimated Complexity** | ⭐⭐ (2-3 hours) |
| **Next Sprint** | SPRINT_10 |

---

### SPRINT 10

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_10 |
| **Sprint Name** | Picker Standardization |
| **Objective** | Build standardized Picker (searchable dropdown/modal for selecting entities) following MASTER_PICKER_STANDARD_V1. This covers CustomerPicker and ProductPicker used across POS and forms. |
| **Dependencies** | SPRINT_01 (Design Tokens), SPRINT_04 (Input), SPRINT_05 (State Components) |
| **Design Standards Required** | MASTER_PICKER_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 5.4 — CustomerModal, Section 5.5 — ProductModal) |
| **Expected Deliverables** | 1. New `components/Picker.tsx` with search input + results list + state handling<br>2. Support for: async search, keyboard navigation, selected state<br>3. Feature flag `useNewPicker` |
| **Acceptance Criteria** | 1. Picker modal opens with search input auto-focused<br>2. Typing filters results with debounce<br>3. Loading state shows while searching<br>4. Empty state shows when no results<br>5. Error state shows on API failure<br>6. Keyboard navigation: Arrow keys to move, Enter to select, Escape to close<br>7. Selected item is highlighted<br>8. Picker closes on selection (or fires callback) |
| **Risk Level** | 🟡 MEDIUM — New file, but has async data dependency |
| **Rollback Level** | Level 2 |
| **Estimated Complexity** | ⭐⭐⭐ (3-4 hours) |
| **Next Sprint** | SPRINT_11 |

---

### SPRINT 11

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_11 |
| **Sprint Name** | MasterModal Shell — Container Structure |
| **Objective** | Verify and harden the MasterModal container component following MASTER_MODAL_BLUEPRINT_V1. This is the core modal container that all business modals will use. Focus on shell structure only (backdrop, overlay, sizes, animations). |
| **Dependencies** | SPRINT_01 (Design Tokens), SPRINT_02 (Typography) |
| **Design Standards Required** | MASTER_MODAL_BLUEPRINT_V1.md, MASTER_ELEVATION_ZINDEX_STANDARD_V1.md, MASTER_MOTION_ANIMATION_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 3.1 — MasterModal, Section 4.1 — Reverse Dependency) |
| **Expected Deliverables** | 1. Verified `components/MasterModal.tsx` with correct sizing (sm=640px, md=960px, lg=1400px, fullscreen=95vw)<br>2. Overlay with rgba(15,23,42,0.45) + backdrop-blur<br>3. z-index: overlay=1000, modal=1010<br>4. Animation: mmFadeUp for modal + mmFadeIn for overlay<br>5. 5 sizes working correctly: sm, md, lg, fullscreen, mobile<br>6. Feature flag `useMasterModalV2` |
| **Acceptance Criteria** | 1. All 5 modal sizes render correctly (sm=640px, md=960px, lg=1400px, fullscreen=95vw/95vh, mobile=100vw/100vh)<br>2. Max height for non-fullscreen = 90vh<br>3. Overlay has correct color, opacity, backdrop-blur<br>4. z-index stack: overlay=1000, modal=1010<br>5. Animation: modal fades up (mmFadeUp), overlay fades in (mmFadeIn)<br>6. Scroll lock on body when modal is open<br>7. Click outside modal (on overlay) closes modal<br>8. Feature flag can toggle between legacy and new modal shell |
| **Risk Level** | 🟡 MEDIUM — Core modal container, affects all future modal work |
| **Rollback Level** | Level 1 (single component feature flag) |
| **Estimated Complexity** | ⭐⭐⭐ (3-4 hours) |
| **Next Sprint** | SPRINT_12 |

---

### SPRINT 12

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_12 |
| **Sprint Name** | MasterModal Sub-components |
| **Objective** | Extract all sub-components from MasterModal into independent, importable components: ModalSection, ModalInfoGrid, ModalTable, SummaryRow. Keep backward compatibility by re-exporting from MasterModal. |
| **Dependencies** | SPRINT_11 (MasterModal Shell must be stable) |
| **Design Standards Required** | MASTER_MODAL_BLUEPRINT_V1.md, MASTER_SECTION_BOX_STANDARD_V1.md, MASTER_TABLE_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 3.1 — MasterModal sub-components) |
| **Expected Deliverables** | 1. ModalSection as standalone export<br>2. ModalInfoGrid as standalone export<br>3. ModalTable as standalone export (integrates with State Components)<br>4. SummaryRow as standalone export<br>5. All re-exported from MasterModal for backward compatibility |
| **Acceptance Criteria** | 1. ModalSection renders with icon + title + children<br>2. ModalInfoGrid renders items in 2-column grid (label: value)<br>3. ModalTable renders headers + rows + empty state (uses EmptyState)<br>4. SummaryRow renders label + value with optional accent color<br>5. All sub-components can be imported directly (not just through MasterModal)<br>6. Backward compatibility maintained (existing imports still work) |
| **Risk Level** | 🟡 MEDIUM — Could break existing imports if not careful |
| **Rollback Level** | Level 1 (Git revert of extraction commit) |
| **Estimated Complexity** | ⭐⭐⭐ (3-4 hours) |
| **Next Sprint** | SPRINT_13 |

---

### SPRINT 13

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_13 |
| **Sprint Name** | MasterModal — States, Accessibility & Edge Cases |
| **Objective** | Add loading state, error state, keyboard handling (Escape to close, focus trap), and ARIA attributes to MasterModal. Ensure modal meets accessibility standards. |
| **Dependencies** | SPRINT_11 (MasterModal Shell), SPRINT_12 (Sub-components) |
| **Design Standards Required** | MASTER_MODAL_BLUEPRINT_V1.md, MASTER_STATE_STANDARD_V1.md |
| **Architecture Documents Required** | UI_ACCEPTANCE_CRITERIA.md (Section 4 — Accessibility) |
| **Expected Deliverables** | 1. Loading state for async modal content<br>2. Error state with retry capability<br>3. Focus trap (Tab/Shift+Tab cycles within modal)<br>4. Escape key closes modal<br>5. ARIA attributes: role="dialog", aria-modal="true", aria-labelledby, aria-describedby<br>6. Body scroll lock restoration on unmount |
| **Acceptance Criteria** | 1. Loading state renders inside modal body<br>2. Error state renders with retry button that refires the callback<br>3. Tab key cycles through focusable elements inside modal<br>4. Shift+Tab cycles backwards<br>5. Escape closes modal<br>6. Focus is trapped — cannot tab to elements behind modal<br>7. Focus returns to trigger element when modal closes<br>8. Screen reader announces modal title on open<br>9. Body scroll is restored when modal unmounts |
| **Risk Level** | 🟡 MEDIUM — Accessibility changes can have side effects |
| **Rollback Level** | Level 1 |
| **Estimated Complexity** | ⭐⭐⭐ (3-4 hours) |
| **Next Sprint** | SPRINT_14 |

---

### SPRINT 14

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_14 |
| **Sprint Name** | BatchSelectionModal — Low-Risk Migration |
| **Objective** | Migrate BatchSelectionModal to use MasterModal container, ActionButton, and standardized Input. This is the first modal migration because BatchSelectionModal is independent (no critical path impact). |
| **Dependencies** | SPRINT_11 (MasterModal Shell), SPRINT_03 (ActionButton), SPRINT_04 (Input), SPRINT_05 (State Components) |
| **Design Standards Required** | MASTER_MODAL_BLUEPRINT_V1.md, MASTER_ACTION_BUTTON_STANDARD_V1.md, MASTER_INPUT_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 4.8 — BatchSelectionModal) |
| **Expected Deliverables** | 1. Refactored `components/BatchSelectionModal.tsx` using MasterModal<br>2. ActionButton for confirm/cancel<br>3. Standardized TextInput for batch quantity<br>4. Feature flag `useRefactoredBatchModal` |
| **Acceptance Criteria** | 1. Modal opens inside MasterModal container (correct size, animation, overlay)<br>2. Confirm/Cancel buttons use ActionButton (not legacy button)<br>3. Quantity input uses TextInput (not legacy input)<br>4. Loading state shows during batch processing<br>5. Empty state shows if no items selected<br>6. Error state shows on failure<br>7. Business logic (handlers, state, API) is UNCHANGED<br>8. Modal opens/closes correctly<br>9. Keyboard: Tab through fields, Enter to confirm, Escape to close |
| **Risk Level** | 🟢 LOW — Independent modal, not on critical path |
| **Rollback Level** | Level 2 (single modal feature flag) |
| **Estimated Complexity** | ⭐⭐ (2-3 hours) |
| **Next Sprint** | SPRINT_15 |

---

### SPRINT 15

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_15 |
| **Sprint Name** | PaymentModal — Shell + Container Migration |
| **Objective** | Replace the PaymentModal custom backdrop/motion.div with MasterModal container. Focus on the shell/layout only — do NOT touch payment logic, calculations, or handlers. |
| **Dependencies** | SPRINT_11 (MasterModal Shell), SPRINT_12 (Sub-components) |
| **Design Standards Required** | MASTER_MODAL_BLUEPRINT_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 7.2 — PaymentModal), UI_MODAL_MIGRATION_MASTER_PLAN.md |
| **Expected Deliverables** | 1. Refactored `components/desktop-pos/modals/PaymentModal.tsx` using MasterModal as outer container<br>2. ModalHeader with icon + title + close button<br>3. ModalFooter with ActionButton(s)<br>4. Correct modal size (md=960px) for payment<br>5. Feature flag `useRefactoredPaymentModal` |
| **Acceptance Criteria** | 1. Modal opens using MasterModal (correct backdrop, animation, z-index)<br>2. Header shows POS icon + "Thanh toán" title + X close button<br>3. Footer shows Hủy (Secondary) + Xác nhận (Primary) buttons<br>4. Modal size is md (960px)<br>5. Payment method grid AND amount input area are preserved in body<br>6. Click outside modal closes (configured)<br>7. Escape closes modal<br>8. ALL payment logic unchanged (handlers, calculations, state)<br>9. Feature flag can toggle between legacy and refactored modal |
| **Risk Level** | 🔴 HIGH — PaymentModal is on POS critical path |
| **Rollback Level** | Level 2 (modal feature flag — rollback < 15 min) |
| **Estimated Complexity** | ⭐⭐ (2-3 hours) |
| **Next Sprint** | SPRINT_16 |

---

### SPRINT 16

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_16 |
| **Sprint Name** | PaymentModal — Internal Components Standardization |
| **Objective** | Replace internal components inside PaymentModal: legacy buttons → ActionButton, legacy inputs → TextInput, add state components for processing/error states. |
| **Dependencies** | SPRINT_15 (PaymentModal shell must be deployed and stable) |
| **Design Standards Required** | MASTER_ACTION_BUTTON_STANDARD_V1.md, MASTER_INPUT_STANDARD_V1.md, MASTER_STATE_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 7.2 — PaymentModal), UI_MODAL_MIGRATION_MASTER_PLAN.md |
| **Expected Deliverables** | 1. Quick amount buttons use ActionButton (Secondary/Danger variants)<br>2. Payment amount input uses TextInput with proper formatting<br>3. LoadingState shows during payment processing<br>4. ErrorState shows on payment failure<br>5. Feature flag `useRefactoredPaymentModal` (same flag as SPRINT_15) |
| **Acceptance Criteria** | 1. Quick amount buttons (+10k, +20k, +50k, +100k, +200k, +500k) use ActionButton Secondary variant<br>2. "Xóa" quick button uses ActionButton Danger variant<br>3. Payment amount TextInput formats number correctly (10,000 → 10.000)<br>4. Processing state shows LoadingState with "Đang xử lý..."<br>5. Error state shows ErrorState with retry button<br>6. ALL payment calculations unchanged (tiền thừa, tổng tiền)<br>7. ALL handlers unchanged (onSubmit, onCancel, onQuickAmount)<br>8. Feature flag toggle works correctly |
| **Risk Level** | 🔴 HIGH — Changes inside critical POS modal |
| **Rollback Level** | Level 2 (same feature flag as SPRINT_15) |
| **Estimated Complexity** | ⭐⭐ (2-3 hours) |
| **Next Sprint** | SPRINT_17 |

---

### SPRINT 17

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_17 |
| **Sprint Name** | PromotionModal — Shell + Container Migration |
| **Objective** | Replace PromotionModal custom backdrop with MasterModal container. Focus on shell only — do NOT touch promotion logic. |
| **Dependencies** | SPRINT_11 (MasterModal Shell) |
| **Design Standards Required** | MASTER_MODAL_BLUEPRINT_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 7.3 — PromotionModal) |
| **Expected Deliverables** | 1. Refactored `components/desktop-pos/modals/PromotionModal.tsx` using MasterModal<br>2. ModalHeader with promotion icon + title<br>3. ModalFooter with ActionButton confirm<br>4. Correct modal size (md or lg)<br>5. Feature flag `useRefactoredPromotionModal` |
| **Acceptance Criteria** | 1. Modal opens using MasterModal (correct backdrop, animation, z-index)<br>2. Header shows promotion icon + "Khuyến mãi" title<br>3. Footer shows "Áp dụng" Primary button + "Hủy" Secondary button<br>4. Modal size is appropriate for promotion list<br>5. Promotion list items are preserved in body<br>6. Click outside modal closes<br>7. Escape closes modal<br>8. ALL promotion logic unchanged |
| **Risk Level** | 🟡 MEDIUM — Affects POS pricing flow |
| **Rollback Level** | Level 2 (modal feature flag) |
| **Estimated Complexity** | ⭐⭐ (2-3 hours) |
| **Next Sprint** | SPRINT_18 |

---

### SPRINT 18

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_18 |
| **Sprint Name** | PromotionModal — Internal Components Standardization |
| **Objective** | Replace internal components in PromotionModal: legacy buttons → ActionButton, add EmptyState for no promotions, ErrorState for load failures. |
| **Dependencies** | SPRINT_17 (PromotionModal shell must be stable) |
| **Design Standards Required** | MASTER_ACTION_BUTTON_STANDARD_V1.md, MASTER_STATE_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 7.3 — PromotionModal) |
| **Expected Deliverables** | 1. Confirm/Cancel buttons use ActionButton<br>2. EmptyState shows when no promotions available<br>3. LoadingState shows while fetching promotions<br>4. ErrorState shows on fetch failure<br>5. Feature flag `useRefactoredPromotionModal` (same flag) |
| **Acceptance Criteria** | 1. "Áp dụng" uses ActionButton Primary variant<br>2. "Hủy" uses ActionButton Secondary variant<br>3. Empty list shows EmptyState with promotion icon + "Không có khuyến mãi"<br>4. Loading shows LoadingState with spinner<br>5. Error shows ErrorState with retry button<br>6. ALL promotion selection logic unchanged<br>7. ALL handlers unchanged |
| **Risk Level** | 🟡 MEDIUM |
| **Rollback Level** | Level 2 |
| **Estimated Complexity** | ⭐⭐ (2 hours) |
| **Next Sprint** | SPRINT_19 |

---

### SPRINT 19

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_19 |
| **Sprint Name** | PayDebtModal — Full Migration |
| **Objective** | Migrate PayDebtModal to use MasterModal container, ActionButton, TextInput, SectionBox, ModalInfoGrid, and State Components. |
| **Dependencies** | SPRINT_11 (MasterModal), SPRINT_03 (ActionButton), SPRINT_04 (Input), SPRINT_07 (SectionBox) |
| **Design Standards Required** | MASTER_MODAL_BLUEPRINT_V1.md, MASTER_ACTION_BUTTON_STANDARD_V1.md, MASTER_INPUT_STANDARD_V1.md, MASTER_SECTION_BOX_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 7.8 — PayDebtModal) |
| **Expected Deliverables** | 1. Refactored `components/PayDebtModal.tsx` using MasterModal<br>2. SectionBox for debt info section<br>3. ModalInfoGrid for customer details<br>4. TextInput for payment amount<br>5. ActionButton for confirm/cancel<br>6. State components for processing states<br>7. Feature flag `useRefactoredPayDebtModal` |
| **Acceptance Criteria** | 1. Modal opens in MasterModal (correct size)<br>2. Customer debt info displayed in SectionBox with ModalInfoGrid<br>3. Payment amount uses TextInput with number formatting<br>4. Payment method selection uses standardized SelectInput<br>5. "Thanh toán" button uses ActionButton Primary<br>6. "Hủy" button uses ActionButton Secondary<br>7. Loading state shows during payment processing<br>8. Error state shows on failure<br>9. ALL debt logic unchanged (handlers, calculations, state)<br>10. Feature flag toggle works |
| **Risk Level** | 🟡 MEDIUM — Affects debt management |
| **Rollback Level** | Level 2 |
| **Estimated Complexity** | ⭐⭐⭐ (3-4 hours) |
| **Next Sprint** | SPRINT_20 |

---

### SPRINT 20

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_20 |
| **Sprint Name** | ProductEditModal — Full Migration |
| **Objective** | Migrate ProductEditModal to use MasterModal, ActionButton, TextInput, SelectInput, SectionBox, and StatusBadge. |
| **Dependencies** | SPRINT_11 (MasterModal), SPRINT_03 (ActionButton), SPRINT_04 (Input), SPRINT_06 (StatusBadge), SPRINT_07 (SectionBox) |
| **Design Standards Required** | MASTER_MODAL_BLUEPRINT_V1.md, MASTER_INPUT_STANDARD_V1.md, MASTER_ACTION_BUTTON_STANDARD_V1.md, MASTER_SECTION_BOX_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 7.9 — ProductEditModal) |
| **Expected Deliverables** | 1. Refactored `components/ProductEditModal.tsx` using MasterModal<br>2. SectionBox for "Thông tin cơ bản" and "Giá bán" sections<br>3. TextInput for all text fields (name, barcode, price, stock)<br>4. SelectInput for category, brand<br>5. StatusBadge for product status<br>6. ActionButton for save/cancel<br>7. Feature flag `useRefactoredProductEditModal` |
| **Acceptance Criteria** | 1. Modal opens in MasterModal (lg size for complex form)<br>2. Product name, barcode, price fields use TextInput<br>3. Category/brand dropdowns use SelectInput<br>4. Status shown with StatusBadge<br>5. "Lưu" uses ActionButton Primary<br>6. "Hủy" uses ActionButton Secondary<br>7. Loading state on save<br>8. Error state on failure<br>9. ALL validation and save logic unchanged<br>10. Feature flag toggle works |
| **Risk Level** | 🟡 MEDIUM — Complex form with many fields |
| **Rollback Level** | Level 2 |
| **Estimated Complexity** | ⭐⭐⭐ (3-4 hours) |
| **Next Sprint** | SPRINT_21 |

---

### SPRINT 21

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_21 |
| **Sprint Name** | TaxCalculationModal — Full Migration |
| **Objective** | Migrate TaxCalculationModal to use MasterModal, ActionButton, TextInput, SectionBox, SummaryRow. |
| **Dependencies** | SPRINT_11 (MasterModal), SPRINT_03 (ActionButton), SPRINT_04 (Input), SPRINT_07 (SectionBox) |
| **Design Standards Required** | MASTER_MODAL_BLUEPRINT_V1.md, MASTER_ACTION_BUTTON_STANDARD_V1.md, MASTER_INPUT_STANDARD_V1.md, MASTER_SECTION_BOX_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 7.10 — TaxCalculationModal) |
| **Expected Deliverables** | 1. Refactored `components/TaxCalculationModal.tsx` using MasterModal<br>2. SectionBox for calculation inputs<br>3. TextInput for tax amounts<br>4. SummaryRow for tax results<br>5. ActionButton for calculate/close<br>6. Feature flag `useRefactoredTaxModal` |
| **Acceptance Criteria** | 1. Modal opens in MasterModal (md size)<br>2. Tax inputs use TextInput with number formatting<br>3. Calculation results shown with SummaryRow(s)<br>4. "Tính thuế" uses ActionButton Primary<br>5. "Đóng" uses ActionButton Secondary<br>6. ALL tax calculation logic unchanged<br>7. Feature flag toggle works |
| **Risk Level** | 🟡 MEDIUM — Tax calculation is business-critical |
| **Rollback Level** | Level 2 |
| **Estimated Complexity** | ⭐⭐ (2-3 hours) |
| **Next Sprint** | SPRINT_22 |

---

### SPRINT 22

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_22 |
| **Sprint Name** | DisposalDetailModal — Full Migration |
| **Objective** | Migrate DisposalDetailModal to use MasterModal, SectionBox, ModalInfoGrid, ModalTable, StatusBadge, ActionButton, SummaryRow. |
| **Dependencies** | SPRINT_11 (MasterModal), SPRINT_03 (ActionButton), SPRINT_06 (StatusBadge), SPRINT_07 (SectionBox), SPRINT_12 (Sub-components) |
| **Design Standards Required** | MASTER_MODAL_BLUEPRINT_V1.md, MASTER_STATUS_BADGE_STANDARD_V1.md, MASTER_TABLE_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 7.4 — DisposalDetailModal) |
| **Expected Deliverables** | 1. Refactored `components/disposal-form/DisposalDetailModal.tsx` using MasterModal<br>2. ModalInfoGrid for disposal info<br>3. StatusBadge for disposal status<br>4. ModalTable for disposal items<br>5. SummaryRow for totals<br>6. ActionButton for actions<br>7. Feature flag `useRefactoredDisposalDetailModal` |
| **Acceptance Criteria** | 1. Modal opens in MasterModal (lg size for data grid)<br>2. Disposal info displayed in ModalInfoGrid (2-column grid)<br>3. Status displayed with StatusBadge (correct variant)<br>4. Items table uses ModalTable with headers + rows + empty state<br>5. Summary shows totals with SummaryRow<br>6. Action buttons use ActionButton (correct variants)<br>7. ALL disposal detail logic unchanged |
| **Risk Level** | 🟡 MEDIUM — Complex modal with many sub-components |
| **Rollback Level** | Level 2 |
| **Estimated Complexity** | ⭐⭐⭐ (3-4 hours) |
| **Next Sprint** | SPRINT_23 |

---

### SPRINT 23

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_23 |
| **Sprint Name** | CountFormLayout — SectionBox + ActionButton + Input Migration |
| **Objective** | Migrate CountFormLayout to use SectionBox for all section patterns, ActionButton for all buttons, and TextInput for quantity input. CountFormLayout already uses some MasterModal sub-components — complete the migration. |
| **Dependencies** | SPRINT_07 (SectionBox), SPRINT_03 (ActionButton), SPRINT_04 (Input), SPRINT_06 (StatusBadge) |
| **Design Standards Required** | MASTER_SECTION_BOX_STANDARD_V1.md, MASTER_ACTION_BUTTON_STANDARD_V1.md, MASTER_INPUT_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 7.7 — CountFormLayout) |
| **Expected Deliverables** | 1. Refactored `components/inventory-count/CountFormLayout.tsx` using SectionBox, ActionButton, TextInput<br>2. CountInfoSection uses SectionBox<br>3. CountSummary uses SectionBox + SummaryRow<br>4. All buttons use ActionButton<br>5. Quantity input uses TextInput<br>6. Feature flag `useRefactoredCountLayout` |
| **Acceptance Criteria** | 1. Info section uses SectionBox with correct padding+radius<br>2. Summary section uses SectionBox<br>3. Confirm button uses ActionButton Primary<br>4. Cancel button uses ActionButton Secondary<br>5. Quantity TextInput formats number correctly<br>6. StatusBadge shows correct status<br>7. ALL count logic unchanged |
| **Risk Level** | 🟡 MEDIUM — Affects inventory count workflow |
| **Rollback Level** | Level 2 |
| **Estimated Complexity** | ⭐⭐ (2-3 hours) |
| **Next Sprint** | SPRINT_24 |

---

### SPRINT 24

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_24 |
| **Sprint Name** | DisposalFormLayout — SectionBox + ActionButton + Input Migration |
| **Objective** | Replace all inline CSS section patterns in DisposalFormLayout with SectionBox. Replace legacy buttons with ActionButton. Replace legacy inputs with TextInput/SelectInput. |
| **Dependencies** | SPRINT_07 (SectionBox), SPRINT_03 (ActionButton), SPRINT_04 (Input), SPRINT_06 (StatusBadge) |
| **Design Standards Required** | MASTER_SECTION_BOX_STANDARD_V1.md, MASTER_ACTION_BUTTON_STANDARD_V1.md, MASTER_INPUT_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 7.5 — DisposalFormLayout) |
| **Expected Deliverables** | 1. Refactored `components/disposal-form/DisposalFormLayout.tsx` using SectionBox, ActionButton, TextInput, SelectInput<br>2. All section patterns replaced with SectionBox<br>3. All buttons use ActionButton<br>4. All inputs use TextInput/SelectInput<br>5. Feature flag `useRefactoredDisposalLayout` |
| **Acceptance Criteria** | 1. ALL section divs with inline Tailwind classes replaced with SectionBox<br>2. All buttons use correct ActionButton variants<br>3. Quantity/price inputs use TextInput<br>4. Reason/type selects use SelectInput<br>5. StatusBadge uses standardized component<br>6. Loading/Empty/Error states use State Components<br>7. ALL disposal form logic unchanged |
| **Risk Level** | 🟡 MEDIUM — Complex form, many inline patterns to replace |
| **Rollback Level** | Level 2 |
| **Estimated Complexity** | ⭐⭐⭐ (3-4 hours) |
| **Next Sprint** | SPRINT_25 |

---

### SPRINT 25

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_25 |
| **Sprint Name** | ImportFormLayout — SectionBox + ActionButton + Input Migration |
| **Objective** | Replace all inline CSS section patterns in ImportFormLayout with SectionBox. Replace legacy buttons with ActionButton. Replace legacy inputs with TextInput/SelectInput. |
| **Dependencies** | SPRINT_07 (SectionBox), SPRINT_03 (ActionButton), SPRINT_04 (Input) |
| **Design Standards Required** | MASTER_SECTION_BOX_STANDARD_V1.md, MASTER_ACTION_BUTTON_STANDARD_V1.md, MASTER_INPUT_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 7.6 — ImportFormLayout) |
| **Expected Deliverables** | 1. Refactored `components/import-goods/ImportFormLayout.tsx` using SectionBox, ActionButton, TextInput, SelectInput<br>2. All section patterns replaced with SectionBox<br>3. All buttons use ActionButton<br>4. All inputs use TextInput/SelectInput<br>5. Feature flag `useRefactoredImportLayout` |
| **Acceptance Criteria** | 1. ALL section divs with inline Tailwind classes replaced with SectionBox<br>2. All buttons use correct ActionButton variants<br>3. Quantity/price/expiry inputs use TextInput<br>4. Supplier/warehouse selects use SelectInput<br>5. Loading/Empty/Error states use State Components<br>6. ALL import form logic unchanged |
| **Risk Level** | 🟡 MEDIUM — Complex form, many inline patterns |
| **Rollback Level** | Level 2 |
| **Estimated Complexity** | ⭐⭐⭐ (3-4 hours) |
| **Next Sprint** | SPRINT_26 |

---

### SPRINT 26

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_26 |
| **Sprint Name** | DataGrid Container — Core Component |
| **Objective** | Build standardized DataGrid component following MASTER_DATA_GRID_STANDARD_V1. Include toolbar (search + filter + actions), sortable headers, pagination, row selection, and state handling. This is a NEW component — no existing code modified yet. |
| **Dependencies** | SPRINT_03 (ActionButton), SPRINT_04 (Input), SPRINT_05 (State Components), SPRINT_06 (StatusBadge) |
| **Design Standards Required** | MASTER_DATA_GRID_STANDARD_V1.md, MASTER_TABLE_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 3.6 — DataGrid, Section 4.7 — DataGrid impact) |
| **Expected Deliverables** | 1. New `components/DataGrid.tsx` with full DataGrid pattern<br>2. DataGridToolbar with search + filter + action buttons<br>3. DataGridHeader with sortable columns<br>4. DataGridBody with rows + selection<br>5. Pagination component<br>6. Integrated LoadingState, EmptyState, ErrorState<br>7. Feature flag `useNewDataGrid` |
| **Acceptance Criteria** | 1. Toolbar renders search Input + filter button + action buttons<br>2. Column headers are clickable for sorting (asc/desc/none toggle)<br>3. Sort indicator arrow shown on active column<br>4. Pagination shows page numbers + prev/next + total count<br>5. Row selection works (checkbox + highlight)<br>6. Loading state shows skeleton/spinner<br>7. Empty state shows when no data<br>8. Error state shows with retry<br>9. All states use standardized State Components<br>10. Columns configurable via props (key, label, sortable, render) |
| **Risk Level** | 🟢 LOW — New file |
| **Rollback Level** | Level 1 |
| **Estimated Complexity** | ⭐⭐⭐⭐ (4-5 hours) |
| **Next Sprint** | SPRINT_27 |

---

### SPRINT 27

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_27 |
| **Sprint Name** | DataGrid Integration — Inventory Page |
| **Objective** | Replace the existing table in Inventory page with the new DataGrid component. This is the first page to use DataGrid because it's the most-used page and will shake out issues first. |
| **Dependencies** | SPRINT_26 (DataGrid component must be tested) |
| **Design Standards Required** | MASTER_DATA_GRID_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 4.7 — DataGrid/Table) |
| **Expected Deliverables** | 1. Refactored `pages/Inventory.tsx` using DataGrid component<br>2. Column configuration matching existing table<br>3. Search + filter integrated with DataGridToolbar<br>4. StatusBadge for product status column<br>5. Action buttons in toolbar (Thêm sản phẩm, Xóa)<br>6. Feature flag `useNewDataGridInventory` |
| **Acceptance Criteria** | 1. Product list renders in DataGrid with correct columns (Mã SP, Tên, Danh mục, Giá bán, Tồn kho, Trạng thái)<br>2. Search input works (filters by product name/code)<br>3. Sorting works on all sortable columns<br>4. Pagination works correctly<br>5. Status column uses StatusBadge (correct variant)<br>6. "Thêm sản phẩm" button opens ProductEditModal<br>7. "Xóa" button works for selected items<br>8. ALL data fetching and state logic unchanged<br>9. Feature flag toggle works |
| **Risk Level** | 🟡 MEDIUM — First page to use DataGrid, regression risk |
| **Rollback Level** | Level 1 (page-level feature flag) |
| **Estimated Complexity** | ⭐⭐ (2-3 hours) |
| **Next Sprint** | SPRINT_28 |

---

### SPRINT 28

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_28 |
| **Sprint Name** | DataGrid Integration — Disposals Page |
| **Objective** | Replace the table in Disposals page with the new DataGrid component. |
| **Dependencies** | SPRINT_27 (DataGrid must work in Inventory first) |
| **Design Standards Required** | MASTER_DATA_GRID_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 4.7) |
| **Expected Deliverables** | 1. Refactored `pages/Disposals.tsx` using DataGrid<br>2. StatusBadge for disposal status<br>3. ActionButton for disposal actions<br>4. Feature flag `useNewDataGridDisposals` |
| **Acceptance Criteria** | 1. Disposal list renders in DataGrid with correct columns<br>2. Status column uses StatusBadge (correct disposal variants)<br>3. Search + filter works<br>4. Sorting + pagination works<br>5. Actions (View, Edit, Delete) use ActionButton<br>6. ALL disposal data logic unchanged |
| **Risk Level** | 🟡 MEDIUM |
| **Rollback Level** | Level 1 |
| **Estimated Complexity** | ⭐⭐ (2 hours) |
| **Next Sprint** | SPRINT_29 |

---

### SPRINT 29

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_29 |
| **Sprint Name** | DataGrid Integration — Orders, Customers, Suppliers, ReturnOrders |
| **Objective** | Apply DataGrid to the remaining 4 list pages: Orders, Customers, Suppliers, ReturnOrders. These are lower-risk as DataGrid is already proven. |
| **Dependencies** | SPRINT_27 (DataGrid proven in Inventory) |
| **Design Standards Required** | MASTER_DATA_GRID_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 4.7) |
| **Expected Deliverables** | 1. Refactored `pages/Orders.tsx` using DataGrid<br>2. Refactored `pages/CustomerManagement.tsx` using DataGrid<br>3. Refactored `pages/SupplierManagement.tsx` using DataGrid<br>4. Refactored `pages/ReturnOrders.tsx` using DataGrid<br>5. Feature flags per page |
| **Acceptance Criteria** | 1. All 4 pages render with DataGrid<br>2. Each page has correct columns for its data<br>3. Search, sort, pagination work on all pages<br>4. Action buttons use ActionButton<br>5. StatusBadge used where applicable<br>6. ALL page-specific logic unchanged<br>7. Each page has its own feature flag |
| **Risk Level** | 🟢 LOW — DataGrid proven, 4 similar migrations |
| **Rollback Level** | Level 1 (per-page feature flag) |
| **Estimated Complexity** | ⭐⭐⭐ (3-4 hours for all 4 pages) |
| **Next Sprint** | SPRINT_30 |

---

### SPRINT 30

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_30 |
| **Sprint Name** | App Shell + Page Layout Standardization |
| **Objective** | Standardize the App Shell (Sidebar + layout wrapper) and Page Layout (header + content area) following MASTER_APP_SHELL_STANDARD_V1 and MASTER_PAGE_LAYOUT_STANDARD_V1. |
| **Dependencies** | SPRINT_01 (Design Tokens) |
| **Design Standards Required** | MASTER_APP_SHELL_STANDARD_V1.md, MASTER_PAGE_LAYOUT_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 2 — Page Layouts) |
| **Expected Deliverables** | 1. Refactored `components/Sidebar.tsx` using Design Tokens<br>2. Standardized page layout wrapper component<br>3. Consistent page header component (title + actions)<br>4. Feature flag `useNewAppShell` |
| **Acceptance Criteria** | 1. Sidebar uses Design Tokens for colors, spacing, typography<br>2. Sidebar width matches standard (240px)<br>3. Page header has consistent layout (title left, actions right)<br>4. Content area has consistent padding<br>5. All colors from tokens<br>6. ALL sidebar navigation logic unchanged |
| **Risk Level** | 🟡 MEDIUM — Affects navigation across all pages |
| **Rollback Level** | Level 4 (Feature-level rollback) |
| **Estimated Complexity** | ⭐⭐⭐ (3-4 hours) |
| **Next Sprint** | SPRINT_31 |

---

### SPRINT 31

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_31 |
| **Sprint Name** | Split Pane Standardization |
| **Objective** | Standardize the Split Pane layout used in POS and form layouts following MASTER_SPLIT_PANE_STANDARD_V1. |
| **Dependencies** | SPRINT_01 (Design Tokens) |
| **Design Standards Required** | MASTER_SPLIT_PANE_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md |
| **Expected Deliverables** | 1. Standardized SplitPane component<br>2. Left panel + Right panel with consistent sizing<br>3. Resizable divider (if supported by standard)<br>4. Feature flag `useNewSplitPane` |
| **Acceptance Criteria** | 1. SplitPane renders left + right panels with correct proportions<br>2. Resize works (if supported)<br>3. All spacing uses Design Tokens<br>4. POS layout uses SplitPane correctly<br>5. No layout shift when resizing |
| **Risk Level** | 🟡 MEDIUM — Affects POS layout |
| **Rollback Level** | Level 2 |
| **Estimated Complexity** | ⭐⭐ (2-3 hours) |
| **Next Sprint** | SPRINT_32 |

---

### SPRINT 32

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_32 |
| **Sprint Name** | Legacy ui.tsx Cleanup |
| **Objective** | Map and deprecate legacy components from `components/ui.tsx`. Replace usages with new standardized components where applicable. |
| **Dependencies** | ALL component migration sprints must be complete (SPRINT_01 through SPRINT_31) |
| **Design Standards Required** | ALL Master Design Standards (comprehensive audit) |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md (Section 3.2 — ui.tsx Legacy) |
| **Expected Deliverables** | 1. Ui.tsx migration mapping: old component → new component<br>2. Deprecated annotations on legacy exports<br>3. Migration guide for any remaining usages<br>4. Cleanup of unused imports |
| **Acceptance Criteria** | 1. Every component in ui.tsx is mapped to a new standardized component OR marked as legacy with clear migration path<br>2. No orphaned imports from ui.tsx<br>3. Legacy components still work (no runtime breakage)<br>4. Migration guide is clear for remaining manual cleanups |
| **Risk Level** | 🟢 LOW — No code change, only mapping and annotation |
| **Rollback Level** | Level 1 |
| **Estimated Complexity** | ⭐⭐ (2-3 hours) |
| **Next Sprint** | SPRINT_33 |

---

### SPRINT 33

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_33 |
| **Sprint Name** | Dashboard Standardization |
| **Objective** | Apply Dashboard standard to landing/dashboard page following MASTER_DASHBOARD_STANDARD_V1. |
| **Dependencies** | SPRINT_01 (Design Tokens), SPRINT_07 (SectionBox) |
| **Design Standards Required** | MASTER_DASHBOARD_STANDARD_V1.md |
| **Architecture Documents Required** | UI_DEPENDENCY_GRAPH.md |
| **Expected Deliverables** | 1. Dashboard page using standardized SectionBox for widget cards<br>2. KPI cards with consistent styling<br>3. Chart containers with proper spacing<br>4. Feature flag `useNewDashboard` |
| **Acceptance Criteria** | 1. Dashboard cards use SectionBox container<br>2. KPI values use correct typography tokens<br>3. Card grid has consistent spacing<br>4. ALL dashboard data logic unchanged |
| **Risk Level** | 🟢 LOW — Landing page, read-only data |
| **Rollback Level** | Level 2 |
| **Estimated Complexity** | ⭐⭐ (2 hours) |
| **Next Sprint** | SPRINT_34 |

---

### SPRINT 34

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_34 |
| **Sprint Name** | Permission Integration & Document Standard Audit |
| **Objective** | Verify that permission-based UI rendering (show/hide buttons, disable/enable features) uses MASTER_PERMISSION_STANDARD_V1 and MASTER_DOCUMENT_STANDARD_V1. This is an audit sprint — no code changes unless violations found. |
| **Dependencies** | SPRINT_32 (all component migrations complete) |
| **Design Standards Required** | MASTER_PERMISSION_STANDARD_V1.md, MASTER_DOCUMENT_STANDARD_V1.md |
| **Architecture Documents Required** | UI_ACCEPTANCE_CRITERIA.md (Section 2 — Global Rules) |
| **Expected Deliverables** | 1. Permission violation report<br>2. Document component violation report<br>3. Fix plan for any violations found<br>4. If no violations: PASS report |
| **Acceptance Criteria** | 1. All permission-based buttons use standardized permission check<br>2. Document components follow document standard<br>3. Any violations are documented with fix plan<br>4. No permission logic was changed during audit |
| **Risk Level** | 🟢 LOW — Audit only |
| **Rollback Level** | N/A (audit sprint) |
| **Estimated Complexity** | ⭐⭐ (2-3 hours) |
| **Next Sprint** | SPRINT_35 |

---

### SPRINT 35

| Field | Value |
|-------|-------|
| **Sprint ID** | SPRINT_35 |
| **Sprint Name** | Final Migration Audit & Verification |
| **Objective** | Final comprehensive audit of all 35 sprints. Verify all migrations are complete, all feature flags work, all Acceptance Criteria pass, and no regression exists. Generate final migration status report. |
| **Dependencies** | ALL sprints (SPRINT_01 through SPRINT_34) complete |
| **Design Standards Required** | ALL Master Design Standards (comprehensive) |
| **Architecture Documents Required** | UI_ACCEPTANCE_CRITERIA.md (full document), UI_ROLLBACK_PLAN.md (full document) |
| **Expected Deliverables** | 1. Final migration status report (component-by-component)<br>2. Remaining issues/bugs list<br>3. Feature flag health check<br>4. Rollback readiness verification<br>5. Final sign-off document |
| **Acceptance Criteria** | 1. All 24 Design Standards are implemented in code<br>2. All Acceptance Criteria pass for every migrated component<br>3. Every component has a working feature flag<br>4. Rollback plan is verified (all rollbacks tested)<br>5. Zero business logic regressions<br>6. Zero API contract changes<br>7. Zero hardcoded design tokens in migrated code |
| **Risk Level** | 🟢 LOW — Verification sprint |
| **Rollback Level** | N/A (verification sprint) |
| **Estimated Complexity** | ⭐⭐ (2-3 hours) |
| **Next Sprint** | ✅ **COMPLETION** |

---

## SECTION 5 — DEPENDENCY FLOW

### 5.1 Visual Dependency Map

```
SPRINT_01 ─── Design Tokens
    │
    ├── SPRINT_02 ─── Typography
    │
    ├── SPRINT_03 ─── ActionButton ──────────────────────────────┐
    │                                                             │
    ├── SPRINT_04 ─── Input ─────────────────────────────────────┤
    │                                                             │
    ├── SPRINT_05 ─── State Components ──────────────────────────┤
    │                                                             │
    ├── SPRINT_06 ─── StatusBadge ───────────────────────────────┤
    │                                                             │
    ├── SPRINT_07 ─── SectionBox ────────────────────────────────┤
    │                                                             │
    ├── SPRINT_08 ─── Tabs ──────────────────────────────────────┤
    │                                                             │
    ├── SPRINT_09 ─── Notification ──────────────────────────────┤
    │                                                             │
    ├── SPRINT_10 ─── Picker ────────────────────────────────────┤
    │                                                             │
    │   ┌─────────────────────────────────────────────────────────┘
    │   │
    ▼   ▼
SPRINT_11 ─── MasterModal Shell
    │
    ├── SPRINT_12 ─── MasterModal Sub-components
    │
    ├── SPRINT_13 ─── MasterModal States & A11y
    │
    ├── SPRINT_14 ─── BatchSelectionModal (low risk)
    │
    ├── SPRINT_15 ─── PaymentModal Shell ─── SPRINT_16 (internals)
    │
    ├── SPRINT_17 ─── PromotionModal Shell ─── SPRINT_18 (internals)
    │
    ├── SPRINT_19 ─── PayDebtModal
    │
    ├── SPRINT_20 ─── ProductEditModal
    │
    ├── SPRINT_21 ─── TaxCalculationModal
    │
    ├── SPRINT_22 ─── DisposalDetailModal
    │
    ├── SPRINT_23 ─── CountFormLayout
    │
    ├── SPRINT_24 ─── DisposalFormLayout
    │
    ├── SPRINT_25 ─── ImportFormLayout
    │
    ├── SPRINT_26 ─── DataGrid Core
    │   │
    │   ├── SPRINT_27 ─── DataGrid → Inventory
    │   ├── SPRINT_28 ─── DataGrid → Disposals
    │   └── SPRINT_29 ─── DataGrid → Orders, Customers, Suppliers, ReturnOrders
    │
    ├── SPRINT_30 ─── App Shell & Page Layout
    ├── SPRINT_31 ─── Split Pane
    ├── SPRINT_32 ─── Legacy ui.tsx Cleanup
    ├── SPRINT_33 ─── Dashboard
    │
    └── SPRINT_34 ─── Permission & Document Audit
        │
        └── SPRINT_35 ─── Final Audit & Verification
```

### 5.2 Parallel Execution Opportunities

The following sprint groups can be executed in **any order** because they create new files without modifying existing code:

| Group | Sprints | Reason |
|-------|---------|--------|
| **Foundation Build** | SPRINT_01 through SPRINT_10 | All create NEW files — no codebase dependency |
| **Modal Migration** | SPRINT_14 through SPRINT_22 | Each modal is independent — can be parallel if feature flags are separate |
| **Form Layout Migration** | SPRINT_23 through SPRINT_25 | Each form is independent |
| **DataGrid Pages** | SPRINT_27 through SPRINT_29 | Can be parallel if proven in SPRINT_26 |

### 5.3 Sequential Dependencies (BLOCKING)

These sprints MUST wait for their dependencies:

| Sprint | Must Wait For | Reason |
|--------|---------------|--------|
| SPRINT_11 (MasterModal) | SPRINT_01 | Needs Design Tokens |
| SPRINT_14-22 (Modal Migration) | SPRINT_11 | Needs MasterModal |
| SPRINT_23-25 (Form Layouts) | SPRINT_07 | Needs SectionBox |
| SPRINT_27-29 (DataGrid Pages) | SPRINT_26 | Needs DataGrid component |
| SPRINT_32 (ui.tsx Cleanup) | ALL component sprints | Must map all old→new |
| SPRINT_34 (Permission Audit) | SPRINT_32 | Must have clean baseline |
| SPRINT_35 (Final Audit) | ALL sprints | Must verify everything |

---

## SECTION 6 — RISK CLASSIFICATION

### 6.1 Risk by Sprint

| Risk Level | Sprints | Count |
|------------|---------|-------|
| 🔴 **HIGH** | SPRINT_15, SPRINT_16 (PaymentModal) — POS critical path | 2 |
| 🟡 **MEDIUM** | SPRINT_10 (Picker), SPRINT_11 (MasterModal Shell), SPRINT_12 (Sub-components), SPRINT_13 (States/A11y), SPRINT_17, SPRINT_18 (PromotionModal), SPRINT_19 (PayDebtModal), SPRINT_20 (ProductEditModal), SPRINT_21 (TaxCalculationModal), SPRINT_22 (DisposalDetailModal), SPRINT_23 (CountFormLayout), SPRINT_24 (DisposalFormLayout), SPRINT_25 (ImportFormLayout), SPRINT_27 (DataGrid Inventory), SPRINT_28 (DataGrid Disposals), SPRINT_30 (App Shell), SPRINT_31 (Split Pane) | 17 |
| 🟢 **LOW** | SPRINT_01 (Design Tokens), SPRINT_02 (Typography), SPRINT_03 (ActionButton), SPRINT_04 (Input), SPRINT_05 (State), SPRINT_06 (StatusBadge), SPRINT_07 (SectionBox), SPRINT_08 (Tabs), SPRINT_09 (Notification), SPRINT_14 (BatchSelectionModal), SPRINT_26 (DataGrid Core), SPRINT_29 (DataGrid 4 pages), SPRINT_32 (ui.tsx Cleanup), SPRINT_33 (Dashboard), SPRINT_34 (Audit), SPRINT_35 (Final Audit) | 16 |

### 6.2 Risk Mitigation Rules

| Risk Level | Required Actions |
|------------|-----------------|
| 🔴 **HIGH** | 1. Must have feature flag with tested rollback<br>2. Must be verified by QA before merge<br>3. Must have automated test coverage<br>4. Rollback must be under 15 minutes<br>5. Must NOT be deployed on Friday |
| 🟡 **MEDIUM** | 1. Must have feature flag<br>2. Rollback must be under 30 minutes<br>3. Must be verified by developer (self-review) |
| 🟢 **LOW** | 1. Feature flag recommended but not required<br>2. Rollback via Git revert acceptable |

### 6.3 Critical Path Risk (PaymentModal)

The PaymentModal is the single highest-risk item because it sits on the POS checkout critical path:

```
Customer Purchase
    │
    ▼
Cart Review (Safe)
    │
    ▼
PAYMENT MODAL ←─── 🔴 CRITICAL
    │               │
    ▼               ├── If broken: NO SALES
Complete Order     ├── Revenue impact: IMMEDIATE
    │               ├── User trust impact: HIGH
    ▼               └── Rollback time: < 15 min
Receipt Generation
```

**PaymentModal Rollback Pre-conditions** (must be verified before SPRINT_15):
- [ ] Feature flag `useRefactoredPaymentModal` exists and works
- [ ] Legacy PaymentModal code is preserved (not modified)
- [ ] Rollback test passes (toggle flag → legacy works)
- [ ] A/B comparison test passes (old vs new modal side-by-side)

---

## SECTION 7 — ROLLBACK MAPPING

### 7.1 Rollback Levels Applied to Sprints

| Rollback Level | Description | Applied To Sprints |
|----------------|-------------|--------------------|
| **Level 1** (Component) | Git revert or single feature flag toggle. < 5 min. | SPRINT_01 through SPRINT_10, SPRINT_14, SPRINT_26, SPRINT_27, SPRINT_28, SPRINT_29, SPRINT_32, SPRINT_33, SPRINT_34, SPRINT_35 |
| **Level 2** (Modal) | Single modal feature flag toggle. < 15 min. | SPRINT_15, SPRINT_16, SPRINT_17, SPRINT_18, SPRINT_19, SPRINT_20, SPRINT_21, SPRINT_22, SPRINT_23, SPRINT_24, SPRINT_25, SPRINT_31 |
| **Level 3** (Batch) | Multiple features in one batch. < 30 min. | SPRINT_11+SPRINT_12+SPRINT_13 (MasterModal batch) |
| **Level 4** (Feature) | Full feature rollback. < 1 hour. | SPRINT_30 (App Shell — affects all pages) |
| **Level 5** (Full UI) | Complete system rollback. < 2 hours. | N/A — reserved for catastrophic failure only |

### 7.2 Feature Flag Registry

All feature flags must be maintained in a single configuration file:

| Feature Flag | Sprint Created | Scope | Rollback Level |
|--------------|----------------|-------|----------------|
| `useNewActionButton` | SPRINT_03 | All ActionButton usages | Level 1 |
| `useNewFormInputs` | SPRINT_04 | All TextInput/SelectInput usages | Level 1 |
| `useNewStateComponents` | SPRINT_05 | All LoadingState/EmptyState/ErrorState usages | Level 1 |
| `useNewStatusBadge` | SPRINT_06 | All StatusBadge usages | Level 1 |
| `useNewSectionBox` | SPRINT_07 | All SectionBox usages | Level 1 |
| `useNewTabs` | SPRINT_08 | All Tabs usages | Level 1 |
| `useNewNotification` | SPRINT_09 | All Notification usages | Level 1 |
| `useNewPicker` | SPRINT_10 | All Picker usages | Level 2 |
| `useMasterModalV2` | SPRINT_11 | MasterModal container | Level 3 (with sub-components) |
| `useRefactoredBatchModal` | SPRINT_14 | BatchSelectionModal | Level 2 |
| `useRefactoredPaymentModal` | SPRINT_15 | PaymentModal | Level 2 |
| `useRefactoredPromotionModal` | SPRINT_17 | PromotionModal | Level 2 |
| `useRefactoredPayDebtModal` | SPRINT_19 | PayDebtModal | Level 2 |
| `useRefactoredProductEditModal` | SPRINT_20 | ProductEditModal | Level 2 |
| `useRefactoredTaxModal` | SPRINT_21 | TaxCalculationModal | Level 2 |
| `useRefactoredDisposalDetailModal` | SPRINT_22 | DisposalDetailModal | Level 2 |
| `useRefactoredCountLayout` | SPRINT_23 | CountFormLayout | Level 2 |
| `useRefactoredDisposalLayout` | SPRINT_24 | DisposalFormLayout | Level 2 |
| `useRefactoredImportLayout` | SPRINT_25 | ImportFormLayout | Level 2 |
| `useNewDataGrid` | SPRINT_26 | DataGrid component | Level 1 |
| `useNewDataGridInventory` | SPRINT_27 | Inventory page DataGrid | Level 1 |
| `useNewDataGridDisposals` | SPRINT_28 | Disposals page DataGrid | Level 1 |
| `useNewDataGridOrders` | SPRINT_29 | Orders page DataGrid | Level 1 |
| `useNewDataGridCustomers` | SPRINT_29 | Customers page DataGrid | Level 1 |
| `useNewDataGridSuppliers` | SPRINT_29 | Suppliers page DataGrid | Level 1 |
| `useNewDataGridReturnOrders` | SPRINT_29 | ReturnOrders page DataGrid | Level 1 |
| `useNewAppShell` | SPRINT_30 | App Shell + Page Layout | Level 4 |
| `useNewSplitPane` | SPRINT_31 | Split Pane | Level 2 |
| `useNewDashboard` | SPRINT_33 | Dashboard page | Level 2 |

---

## SECTION 8 — HANDOVER REQUIREMENTS

### 8.1 Mandatory Handover Artifact

Every sprint MUST produce a handover artifact file:

```
SPRINT_XX_HANDOVER.md
```

This file enables the next AI agent to start working without reading the full project context.

### 8.2 Handover Artifact Template

```markdown
# HANDOVER — SPRINT_XX: [Sprint Name]

## Completed Work
- [List of files created/modified]
- [Key changes made]

## Current State
- Feature flag: `[flag name]` — [enabled/disabled]
- [List of components now using Design System]

## Verification Results
- [All Acceptance Criteria pass: YES/NO]
- [If NO, list failures]

## Known Issues
- [Any open issues or edge cases]

## Rollback Status
- [Feature flag tested: YES/NO]
- [Rollback verified: YES/NO]

## Next Sprint Context
- Sprint to start: SPRINT_XX
- Key files to work on: [list]
- Dependencies already satisfied: [list]
- Important notes for next agent: [notes]

## Code Snippets
- [Minimal code context needed for next agent]
- [Import paths, key interfaces, component signatures]
```

### 8.3 Minimum Information for Next Agent

The handover must contain enough context for the next agent to:

1. Understand what was just completed
2. Know the exact state of feature flags
3. Identify which files to work on next
4. Understand any blocking issues
5. Know the rollback safety status
6. Have code snippets for key interfaces/components

### 8.4 Handover Example (Minimal)

```
# HANDOVER — SPRINT_15: PaymentModal Shell

## Completed Work
- Modified: components/desktop-pos/modals/PaymentModal.tsx
- Changes: Wrapped in MasterModal container, added ModalHeader/ModalFooter

## Current State
- Feature flag: useRefactoredPaymentModal — DISABLED (safe default)

## Verification Results
- All Acceptance Criteria pass: YES

## Next Sprint Context
- Sprint to start: SPRINT_16 (PaymentModal Internal Components)
- Dependencies satisfied: MasterModal, ActionButton, Input
- Next agent's task: Replace legacy buttons/inputs inside PaymentModal
```

---

## SECTION 9 — COMPLETION CRITERIA

### 9.1 Per-Sprint Completion

A sprint is COMPLETE when ALL of the following are true:

- [ ] All Acceptance Criteria listed in the sprint definition pass
- [ ] Feature flag is created and functional (flag can toggle old ↔ new)
- [ ] Rollback has been verified (toggle flag → legacy works)
- [ ] No business logic was modified (verified by code review)
- [ ] No hardcoded design tokens exist in migrated code
- [ ] Handover artifact is written

### 9.2 Phase Completion

A phase completes when ALL sprints in that phase are complete:

| Phase | Sprints | Theme |
|-------|---------|-------|
| **Phase 1: Foundation** | SPRINT_01 to SPRINT_10 | Design Tokens, Primitives |
| **Phase 2: Modal System** | SPRINT_11 to SPRINT_13 | MasterModal & Sub-components |
| **Phase 3: Modal Migration** | SPRINT_14 to SPRINT_22 | All business modals |
| **Phase 4: Form Layouts** | SPRINT_23 to SPRINT_25 | All form layouts |
| **Phase 5: DataGrid** | SPRINT_26 to SPRINT_29 | DataGrid + page integration |
| **Phase 6: Shell & Cleanup** | SPRINT_30 to SPRINT_35 | App Shell, Cleanup, Audit |

### 9.3 Final Completion (SPRINT_35)

The entire UI Migration is COMPLETE when ALL of the following are true:

- [ ] All 35 sprints are individually complete
- [ ] All 24 Master Design Standards are implemented in code
- [ ] All 6+ business modals use MasterModal
- [ ] All 3 form layouts use SectionBox
- [ ] All 6+ pages use DataGrid
- [ ] All legacy ui.tsx components are mapped
- [ ] All feature flags are verified
- [ ] All rollback plans are verified
- [ ] Zero hardcoded design tokens in migrated code
- [ ] Zero business logic regressions
- [ ] Zero API contract changes
- [ ] Final migration report generated

---

## APPENDIX A — SPRINT SUMMARY TABLE

| ID | Sprint Name | Risk | Rollback | Complexity | Dependencies |
|----|-------------|------|----------|------------|--------------|
| 01 | Design Tokens CSS | 🟢 LOW | Level 1 | ⭐ | None |
| 02 | Typography Standardization | 🟢 LOW | Level 1 | ⭐ | 01 |
| 03 | ActionButton | 🟢 LOW | Level 1 | ⭐⭐ | 01 |
| 04 | Input System | 🟢 LOW | Level 1 | ⭐⭐ | 01 |
| 05 | State Components | 🟢 LOW | Level 1 | ⭐⭐ | 01 |
| 06 | StatusBadge | 🟢 LOW | Level 1 | ⭐ | 01 |
| 07 | SectionBox | 🟢 LOW | Level 1 | ⭐⭐ | 01 |
| 08 | Tabs Standardization | 🟢 LOW | Level 1 | ⭐⭐ | 01 |
| 09 | Notification System | 🟢 LOW | Level 1 | ⭐⭐ | 01 |
| 10 | Picker Standardization | 🟡 MEDIUM | Level 2 | ⭐⭐⭐ | 01, 04, 05 |
| 11 | MasterModal Shell | 🟡 MEDIUM | Level 3 | ⭐⭐⭐ | 01, 02 |
| 12 | MasterModal Sub-components | 🟡 MEDIUM | Level 1 | ⭐⭐⭐ | 11 |
| 13 | MasterModal States/A11y | 🟡 MEDIUM | Level 1 | ⭐⭐⭐ | 11, 12 |
| 14 | BatchSelectionModal | 🟢 LOW | Level 2 | ⭐⭐ | 11, 03, 04, 05 |
| 15 | PaymentModal Shell | 🔴 HIGH | Level 2 | ⭐⭐ | 11, 12 |
| 16 | PaymentModal Internals | 🔴 HIGH | Level 2 | ⭐⭐ | 15 |
| 17 | PromotionModal Shell | 🟡 MEDIUM | Level 2 | ⭐⭐ | 11 |
| 18 | PromotionModal Internals | 🟡 MEDIUM | Level 2 | ⭐⭐ | 17 |
| 19 | PayDebtModal | 🟡 MEDIUM | Level 2 | ⭐⭐⭐ | 11, 03, 04, 07 |
| 20 | ProductEditModal | 🟡 MEDIUM | Level 2 | ⭐⭐⭐ | 11, 03, 04, 06, 07 |
| 21 | TaxCalculationModal | 🟡 MEDIUM | Level 2 | ⭐⭐ | 11, 03, 04, 07 |
| 22 | DisposalDetailModal | 🟡 MEDIUM | Level 2 | ⭐⭐⭐ | 11, 03, 06, 07, 12 |
| 23 | CountFormLayout | 🟡 MEDIUM | Level 2 | ⭐⭐ | 07, 03, 04, 06 |
| 24 | DisposalFormLayout | 🟡 MEDIUM | Level 2 | ⭐⭐⭐ | 07, 03, 04, 06 |
| 25 | ImportFormLayout | 🟡 MEDIUM | Level 2 | ⭐⭐⭐ | 07, 03, 04 |
| 26 | DataGrid Core | 🟢 LOW | Level 1 | ⭐⭐⭐⭐ | 03, 04, 05, 06 |
| 27 | DataGrid → Inventory | 🟡 MEDIUM | Level 1 | ⭐⭐ | 26 |
| 28 | DataGrid → Disposals | 🟡 MEDIUM | Level 1 | ⭐⭐ | 27 |
| 29 | DataGrid → 4 Pages | 🟢 LOW | Level 1 | ⭐⭐⭐ | 27 |
| 30 | App Shell & Page Layout | 🟡 MEDIUM | Level 4 | ⭐⭐⭐ | 01 |
| 31 | Split Pane | 🟡 MEDIUM | Level 2 | ⭐⭐ | 01 |
| 32 | Legacy ui.tsx Cleanup | 🟢 LOW | Level 1 | ⭐⭐ | All Sprints |
| 33 | Dashboard | 🟢 LOW | Level 2 | ⭐⭐ | 01, 07 |
| 34 | Permission & Document Audit | 🟢 LOW | N/A | ⭐⭐ | 32 |
| 35 | Final Audit & Verification | 🟢 LOW | N/A | ⭐⭐ | All Sprints |

## APPENDIX B — RISK DISTRIBUTION

```
Phase 1 (Foundation):     0 HIGH /  3 MEDIUM /  7 LOW   = 10 sprints
Phase 2 (Modal System):   0 HIGH /  3 MEDIUM /  0 LOW   = 3 sprints
Phase 3 (Modal Migration):2 HIGH /  6 MEDIUM /  1 LOW   = 9 sprints
Phase 4 (Form Layouts):   0 HIGH /  3 MEDIUM /  0 LOW   = 3 sprints
Phase 5 (DataGrid):       0 HIGH /  2 MEDIUM /  2 LOW   = 4 sprints
Phase 6 (Shell & Cleanup):0 HIGH /  2 MEDIUM /  4 LOW   = 6 sprints
─────────────────────────────────────────────────────────
TOTAL:                    2 HIGH / 19 MEDIUM / 14 LOW   = 35 sprints
```

## APPENDIX C — QUICK START GUIDE FOR AI AGENTS

### First-time Agent (Starting from nothing)

```
1. Read this file (UI_MIGRATION_MASTER_ROADMAP.md) — 5 minutes
2. Identify your assigned sprint from the Sprint Breakdown (Section 4)
3. Read the Design Standards listed in "Design Standards Required"
4. Read the Architecture documents listed
5. Read the previous sprint's Handover artifact (SPRINT_XX_HANDOVER.md)
6. Implement the sprint
7. Verify all Acceptance Criteria
8. Write Handover artifact
9. Done
```

### Returning Agent (Continuing from handover)

```
1. Read the previous sprint's Handover artifact (5 minutes)
2. Read your sprint's definition in this roadmap (Section 4)
3. Read any new Design Standards needed
4. Implement the sprint
5. Verify all Acceptance Criteria
6. Write Handover artifact
7. Done
```

### Emergency Agent (Rollback required)

```
1. Read the Rollback Mapping (Section 7)
2. Toggle the feature flag for the affected sprint
3. Verify rollback worked
4. Document issue
5. Done