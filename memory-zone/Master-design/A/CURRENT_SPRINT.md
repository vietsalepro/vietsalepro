# 📋 CURRENT SPRINT — VietSale Pro v7

> **Template Version:** 1.0  
> **Purpose:** Single Source of Truth for current sprint execution  
> **Workflow:** Read → Execute → Handover → Update → Next Agent  
> **Optimized For:** AI Agent (small context window) + Human  
> **Max Lifespan:** One sprint cycle only

---

## METADATA

| Field | Value |
|-------|-------|
| **Template** | CURRENT_SPRINT_TEMPLATE.md |
| **This File** | CURRENT_SPRINT.md |
| **Rule** | Only ONE CURRENT_SPRINT.md exists at any time |
| **Previous File** | CURRENT_SPRINT.md is overwritten each sprint |
| **Handover Convention** | `SPRINT_XX_HANDOVER.md` at sprint completion |

---

## 1. SPRINT INFORMATION

| Field | Value |
|-------|-------|
| **Sprint ID** | `SPRINT_01` |
| **Sprint Name** | Design Tokens CSS — Global Variables |
| **Status** | `READY` |
| **Risk Level** | 🟢 LOW |
| **Estimated Complexity** | ⭐ (1 hour) |

### Status Definitions

| Status | Meaning |
|--------|---------|
| `PLANNED` | Sprint defined but not started |
| `READY` | Dependencies met, ready to execute |
| `IN_PROGRESS` | Currently being executed |
| `BLOCKED` | Waiting on dependency/resolution |
| `REVIEW` | Code complete, pending review/acceptance |
| `COMPLETED` | All criteria met, handover generated |

---

## 2. OBJECTIVE

> Verify and complete `design-system-tokens.css` with all CSS custom properties for colors, spacing, radius, shadows, borders, z-index, opacity. Ensure all tokens from MASTER_DESIGN_TOKENS_V1 are present and correctly named.

**Key Result:** Every token from MASTER_DESIGN_TOKENS_V1 exists as a valid CSS custom property in `design-system-tokens.css`, and the `mmFadeUp` keyframe animation is defined.

---

## 3. SCOPE

### 3.1 Files To Modify

| # | File Path | Action | Description |
|   |-----------|--------|-------------|
| 1 | `design-system-tokens.css` | MODIFY | Verify all tokens present, add missing tokens per MASTER_DESIGN_TOKENS_V1 |

### 3.2 Components In Scope

| # | Component/Modal/Screen | Action | Details |
|   |------------------------|--------|---------|
| 1 | Design System Tokens | VERIFY & COMPLETE | Audit all variables in `design-system-tokens.css` against MASTER_DESIGN_TOKENS_V1 |

### 3.3 Allowed Changes

- [x] CSS custom property definitions only
- [x] Keyframe animation definitions
- [x] CSS file organization/comment structure
- [x] No JSX, no components, no business logic

---

## 4. OUT OF SCOPE

### 4.1 Prohibited Changes

| # | Area | Reason |
|   |------|--------|
| 1 | **Business Logic** | Handlers, validations, calculations, state management |
| 2 | **API/Data Layer** | API calls, Supabase queries, database schema |
| 3 | **Types/Interfaces** | `types.ts`, API contracts, data models |
| 4 | **Permission/RBAC** | Role checks, permission logic, access control |
| 5 | **Workflow Logic** | Multi-step flows, navigation conditions, routing rules |
| 6 | **Business Rules** | Tax calculations, discount logic, pricing formulas |
| 7 | **New Features** | Adding functionality not in the design standard |

### 4.2 Components NOT To Touch

| Component | Reason |
|-----------|--------|
| All React components | No JSX in this sprint — foundation layer only |
| All TypeScript/JS files | No runtime code in this sprint |

---

## 5. DEPENDENCIES

### 5.1 Prerequisite Sprints

| Sprint | Status | Notes |
|--------|--------|-------|
| None | — | This is the first sprint of the entire migration program |

### 5.2 Component Dependencies

| Component | Dependency Type | Notes |
|-----------|----------------|-------|
| All components (indirect) | Token Consumer | All future components depend on these tokens being correct |

### 5.3 Design Tokens Required

- [x] `var(--color-*)` — all color tokens from MASTER_DESIGN_TOKENS_V1
- [x] `var(--space-*)` — all spacing tokens
- [x] `var(--radius-*)` — all radius tokens
- [x] `var(--text-*)` — all typography tokens (if included)
- [x] `var(--font-*)` — all font tokens (if included)
- [x] `var(--shadow-*)` — all shadow tokens
- [x] `var(--z-*)` — all z-index tokens
- [x] `var(--opacity-*)` — all opacity tokens
- [x] `var(--border-*)` — all border tokens (if included)
- [x] `var(--leading-*)` — all line-height tokens (if included)
- [x] `var(--tracking-*)` — all letter-spacing tokens (if included)

---

## 6. REQUIRED DOCUMENTS

### 6.1 Design Standards (Read First)

| # | Document | Why |
|   |----------|-----|
| 1 | `Master-design/MASTER_DESIGN_TOKENS_V1.md` | Source of truth for every CSS custom property name and value |
| 2 | `Master-design/MASTER_MOTION_ANIMATION_STANDARD_V1.md` | Defines the `mmFadeUp` keyframe animation specification |

### 6.2 Architecture Documents

| # | Document | Why |
|   |----------|-----|
| 1 | `UI_DEPENDENCY_GRAPH.md` | Section 5 — Foundation Layer confirms this sprint's position in dependency tree |

### 6.3 Migration Reference

| # | Document | Why |
|   |----------|-----|
| 1 | `UI_ACCEPTANCE_CRITERIA.md` | PASS/FAIL criteria validation for token completeness |
| 2 | `UI_ROLLBACK_PLAN.md` | Level 1 rollback procedure for CSS file revert |
| 3 | `UI_MIGRATION_MASTER_ROADMAP.md` | Full roadmap context (Section 4 — SPRINT_01 breakdown) |

### 6.4 Previous Handover (If Applicable)

| # | Document | Why |
|   |----------|-----|
| 1 | None | This is the first sprint — no previous handover exists |

---

## 7. ACCEPTANCE CRITERIA

### 7.1 UI Migration Criteria

| # | Criterion | Expected | Actual |
|   |-----------|----------|--------|
| 1 | Every color token from MASTER_DESIGN_TOKENS_V1 exists as `var(--color-*)` | YES | — |
| 2 | Every spacing token exists as `var(--space-*)` | YES | — |
| 3 | Every radius token exists as `var(--radius-*)` | YES | — |
| 4 | Every shadow token exists as `var(--shadow-*)` | YES | — |
| 5 | Every z-index token exists as `var(--z-*)` | YES | — |
| 6 | Every opacity token exists as `var(--opacity-*)` | YES | — |
| 7 | `mmFadeUp` keyframe is defined with correct animation | YES | — |
| 8 | No hardcoded values in any component that should use tokens (Note: verification only — no component changes in this sprint) | YES | — |
| 9 | CSS file is importable and compiles without errors | YES | — |

### 7.2 Business Logic Integrity Criteria

| # | Criterion | Expected | Actual |
|   |-----------|----------|--------|
| 1 | No business logic exists in CSS file (trivially satisfied) | YES | — |
| 2 | No state management, API calls, or handlers exist in CSS file (trivially satisfied) | YES | — |
| 3 | CSS variables are purely declarative — no behavioral impact | YES | — |

### 7.3 Code Quality Criteria

| # | Criterion | Expected | Actual |
|   |-----------|----------|--------|
| 1 | No unused or duplicate CSS variable declarations | YES | — |
| 2 | Variables are organized by category (colors, spacing, etc.) | YES | — |
| 3 | All values match MASTER_DESIGN_TOKENS_V1 exactly | YES | — |
| 4 | Comments document token categories for readability | YES | — |

---

## 8. ROLLBACK REQUIREMENTS

### 8.1 Rollback Triggers

| # | Condition | Action |
|   |-----------|--------|
| 1 | Business logic changed unintentionally | 🔴 HARD BLOCKER — IMMEDIATE ROLLBACK |
| 2 | API contract broken | 🔴 HARD BLOCKER — IMMEDIATE ROLLBACK |
| 3 | Data loss or corruption | 🔴 HARD BLOCKER — IMMEDIATE ROLLBACK |
| 4 | User workflow disrupted | 🔴 HARD BLOCKER — IMMEDIATE ROLLBACK |
| 5 | Validation rules changed | 🔴 HARD BLOCKER — IMMEDIATE ROLLBACK |
| 6 | Component fails acceptance criteria | 🟡 SOFT BLOCKER — Fix before merge |

### 8.2 Rollback Level

| Level | Scope | Method | Time |
|-------|-------|--------|------|
| `Level 1` | Single file revert | `Git revert` of `design-system-tokens.css` changes | `< 5 min` |

### 8.3 Rollback Procedure

1. Run `git checkout HEAD -- design-system-tokens.css` to revert to previous state
2. Verify CSS file loads without syntax errors
3. Run `npm run build` or equivalent to verify no build failures
4. Confirm no runtime console errors related to missing CSS variables

### 8.4 Feature Flag Details

| Flag Name | Location | Default | Toggle Method |
|-----------|----------|---------|---------------|
| N/A | N/A | N/A | No feature flag needed — CSS variables are additive and backward-compatible |

---

## 9. DELIVERABLES

### 9.1 Files To Create

| # | File Path | Purpose |
|   |-----------|---------|
| 1 | None | Existing `design-system-tokens.css` will be verified/completed |

### 9.2 Files To Modify

| # | File Path | Change Summary |
|   |-----------|----------------|
| 1 | `design-system-tokens.css` | Add missing CSS custom properties per MASTER_DESIGN_TOKENS_V1; ensure `mmFadeUp` keyframe exists |

### 9.3 Files To Refactor

| # | File Path | Refactoring Scope |
|   |-----------|-------------------|
| 1 | None | No refactoring in this sprint |

### 9.4 Required Artifacts At Completion

- [x] Verified `design-system-tokens.css` with ALL tokens from MASTER_DESIGN_TOKENS_V1
- [x] Token audit checklist showing every token is present
- [x] Validation that `mmFadeUp` keyframe exists
- [x] `SPRINT_01_HANDOVER.md` — Handover document for next agent
- [x] Updated `CURRENT_SPRINT.md` — Status set to COMPLETED

---

## 10. RISKS

| # | Risk | Likelihood | Impact | Mitigation |
|   |------|------------|--------|------------|
| 1 | Incomplete or partial token definitions in MASTER_DESIGN_TOKENS_V1 | LOW | MEDIUM | Cross-reference with existing `design-system-tokens.css` usages in components |
| 2 | Token naming inconsistency between standard and existing file | LOW | LOW | Use MASTER_DESIGN_TOKENS_V1 as single source of truth; document any discrepancies |
| 3 | CSS syntax error introduced when adding variables | LOW | LOW | Validate with CSS linter and verify `npm run build` passes |

### Risk Indicators To Watch

- [ ] Design standard document may not cover all tokens needed by existing components
- [ ] Keyframe animation `mmFadeUp` may not be specified in current design standard
- [ ] File may already contain tokens not in the design standard (orphan tokens)

---

## 11. SPRINT COMPLETION CHECKLIST

| # | Task | Done |
|   |------|------|
| 1 | Design tokens verified/completed according to MASTER_DESIGN_TOKENS_V1 | [ ] |
| 2 | All Acceptance Criteria verified (Section 7) | [ ] |
| 3 | Business logic verified unchanged (trivially — no JSX) | [ ] |
| 4 | Feature flag implemented and tested | [ ] N/A |
| 5 | No console errors or warnings | [ ] |
| 6 | No regression in parent/related components | [ ] |
| 7 | Code reviewed and cleaned (no debug, unused imports) | [ ] |
| 8 | Rollback procedure verified | [ ] |
| 9 | `SPRINT_01_HANDOVER.md` generated | [ ] |
| 10 | `CURRENT_SPRINT.md` updated (Status = COMPLETED) | [ ] |
| 11 | Next sprint's `CURRENT_SPRINT.md` initialized (Status = READY) | [ ] |

---

## 12. NEXT SPRINT

| Field | Value |
|-------|-------|
| **Sprint ID** | `SPRINT_02` |
| **Sprint Name** | Typography Standardization |

> ⚠️ **Important:** This is the ONLY section that references the next sprint. Do NOT include full roadmap here. The AI Agent reads `UI_MIGRATION_MASTER_ROADMAP.md` for full context if needed.

---

## APPENDIX A — QUICK REFERENCE

### Common Design Token Categories

```
Colors:     var(--color-primary), var(--color-bg), var(--color-text)
Spacing:    var(--space-xs), var(--space-sm), var(--space-md), var(--space-lg), var(--space-xl)
Radius:     var(--radius-sm), var(--radius-md), var(--radius-lg), var(--radius-full)
Shadows:    var(--shadow-sm), var(--shadow-md), var(--shadow-lg)
Typography: var(--text-xs), var(--text-sm), var(--text-base), var(--text-lg), var(--text-xl)
Z-Index:    var(--z-dropdown), var(--z-modal), var(--z-tooltip), var(--z-toast)
```

### File Naming Conventions

```
Handover:        SPRINT_XX_HANDOVER.md
Current Sprint:  CURRENT_SPRINT.md (single file, overwritten each sprint)
Design Standard: MASTER_<DOMAIN>_<TYPE>_V1.md
Component:       PascalCase.tsx
CSS Module:      PascalCase.module.css
```

---

*End of CURRENT_SPRINT.md — Sprint 01 initialized at READY status. No migration work has begun.*