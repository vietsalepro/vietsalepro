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
| **Sprint ID** | `SPRINT_XX` |
| **Sprint Name** | `<Sprint Name Here>` |
| **Status** | `PLANNED` / `READY` / `IN_PROGRESS` / `BLOCKED` / `REVIEW` / `COMPLETED` |
| **Risk Level** | 🟢 LOW / 🟡 MEDIUM / 🔴 HIGH |
| **Estimated Complexity** | ⭐ (1–2h) / ⭐⭐ (3–4h) / ⭐⭐⭐ (5–8h) |

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

<!-- ONE PARAGRAPH ONLY. What must be accomplished in this sprint. -->

> Migrate/Implement `<component/modal/screen>` from `<current state>` to `<target state>` following `<design standard>`.

**Key Result:** `<single measurable outcome that determines sprint success>`

---

## 3. SCOPE

### 3.1 Files To Modify

| # | File Path | Action | Description |
|---|-----------|--------|-------------|
| 1 | `path/to/file.tsx` | MODIFY | `<brief description of change>` |
| 2 | `path/to/file.css` | MODIFY | `<brief description of change>` |
| 3 | `path/to/new-file.tsx` | CREATE | `<brief description of new file>` |

### 3.2 Components In Scope

| # | Component/Modal/Screen | Action | Details |
|---|------------------------|--------|---------|
| 1 | `<ComponentName>` | MIGRATE | `<what aspect to migrate, e.g. "JSX structure to MasterModal">` |
| 2 | `<ComponentName>` | REFACTOR | `<what aspect to refactor, e.g. "Remove inline styles">` |

### 3.3 Allowed Changes

- [ ] JSX structure only
- [ ] CSS/className changes only
- [ ] Import/export updates
- [ ] Feature flag integration
- [ ] Props interface extension (UI-only, no business logic)

---

## 4. OUT OF SCOPE

<!-- STRICT: Any modification to these areas is a SPRINT BLOCKER. -->

### 4.1 Prohibited Changes

| # | Area | Reason |
|---|------|--------|
| 1 | **Business Logic** | Handlers, validations, calculations, state management |
| 2 | **API/Data Layer** | API calls, Supabase queries, database schema |
| 3 | **Types/Interfaces** | `types.ts`, API contracts, data models |
| 4 | **Permission/RBAC** | Role checks, permission logic, access control |
| 5 | **Workflow Logic** | Multi-step flows, navigation conditions, routing rules |
| 6 | **Business Rules** | Tax calculations, discount logic, pricing formulas |
| 7 | **New Features** | Adding functionality not in the original component |

### 4.2 Components NOT To Touch

| Component | Reason |
|-----------|--------|
| `<ComponentName>` | Assigned to SPRINT_YY |
| `<ComponentName>` | Not part of this migration path |

---

## 5. DEPENDENCIES

### 5.1 Prerequisite Sprints

| Sprint | Status | Notes |
|--------|--------|-------|
| `SPRINT_XX` | COMPLETED | `<what was delivered that this sprint depends on>` |
| `SPRINT_YY` | COMPLETED | `<what was delivered that this sprint depends on>` |

### 5.2 Component Dependencies

| Component | Dependency Type | Notes |
|-----------|----------------|-------|
| `<ComponentName>` | Parent/Container | `<how it depends>` |
| `<ComponentName>` | Shared Primitive | `<how it depends>` |

### 5.3 Design Tokens Required

- [ ] `var(--color-*)` — list specific tokens
- [ ] `var(--space-*)` — list specific tokens
- [ ] `var(--radius-*)` — list specific tokens
- [ ] `var(--text-*)` — list specific tokens
- [ ] `var(--shadow-*)` — list specific tokens
- [ ] `var(--z-*)` — list specific tokens

---

## 6. REQUIRED DOCUMENTS

<!-- Documents the AI Agent MUST read before executing this sprint. -->

### 6.1 Design Standards (Read First)

| # | Document | Why |
|---|----------|-----|
| 1 | `<MASTER_DESIGN_STANDARD_V1.md>` | Source of truth for visual design of this component |
| 2 | `<MASTER_TYPOGRAPHY_V1.md>` | Typography rules for text elements |

### 6.2 Architecture Documents

| # | Document | Why |
|---|----------|-----|
| 1 | `UI_DEPENDENCY_GRAPH.md` | Understand component relationships and dependencies |
| 2 | `UI_COMPONENT_ARCHITECTURE.md` | Component structure, props, and patterns |

### 6.3 Migration Reference

| # | Document | Why |
|---|----------|-----|
| 1 | `UI_ACCEPTANCE_CRITERIA.md` | PASS/FAIL criteria validation |
| 2 | `UI_ROLLBACK_PLAN.md` | Rollback procedures if sprint fails |
| 3 | `UI_MIGRATION_MASTER_ROADMAP.md` | Full roadmap context (Section 4 — sprint breakdown) |

### 6.4 Previous Handover (If Applicable)

| # | Document | Why |
|---|----------|-----|
| 1 | `SPRINT_XX_HANDOVER.md` | Know what was delivered and what issues remain |

---

## 7. ACCEPTANCE CRITERIA

<!-- Every item MUST be verifiable with YES/NO. All YES = PASS. Any NO = FAIL. -->

### 7.1 UI Migration Criteria

| # | Criterion | Expected | Actual |
|---|-----------|----------|--------|
| 1 | Component uses Design System tokens (no hardcoded values) | YES | — |
| 2 | Component follows `<design standard>` structure | YES | — |
| 3 | All typography uses `var(--text-*)` / `var(--font-*)` tokens | YES | — |
| 4 | All spacing uses `var(--space-*)` tokens | YES | — |
| 5 | All colors use `var(--color-*)` tokens | YES | — |
| 6 | All radii use `var(--radius-*)` tokens | YES | — |
| 7 | All shadows use `var(--shadow-*)` tokens | YES | — |
| 8 | Feature flag wraps component (`flagEnabled ? NewUI : LegacyUI`) | YES | — |
| 9 | No CSS/className regressions in parent components | YES | — |
| 10 | Component renders without console errors | YES | — |

### 7.2 Business Logic Integrity Criteria

| # | Criterion | Expected | Actual |
|---|-----------|----------|--------|
| 1 | All existing event handlers are preserved | YES | — |
| 2 | State management logic is unchanged | YES | — |
| 3 | API calls and data flow are unchanged | YES | — |
| 4 | User interaction behavior is identical | YES | — |
| 5 | Validation rules are unchanged | YES | — |

### 7.3 Code Quality Criteria

| # | Criterion | Expected | Actual |
|---|-----------|----------|--------|
| 1 | No unused imports or variables | YES | — |
| 2 | No console.log / debugger statements | YES | — |
| 3 | JSX is formatted and readable | YES | — |
| 4 | Component is properly typed | YES | — |
| 5 | No inline styles remain | YES | — |
| 6 | No duplicate CSS declarations | YES | — |

---

## 8. ROLLBACK REQUIREMENTS

### 8.1 Rollback Triggers

| # | Condition | Action |
|---|-----------|--------|
| 1 | Business logic changed unintentionally | 🔴 HARD BLOCKER — IMMEDIATE ROLLBACK |
| 2 | API contract broken | 🔴 HARD BLOCKER — IMMEDIATE ROLLBACK |
| 3 | Data loss or corruption | 🔴 HARD BLOCKER — IMMEDIATE ROLLBACK |
| 4 | User workflow disrupted | 🔴 HARD BLOCKER — IMMEDIATE ROLLBACK |
| 5 | Validation rules changed | 🔴 HARD BLOCKER — IMMEDIATE ROLLBACK |
| 6 | Component fails acceptance criteria | 🟡 SOFT BLOCKER — Fix before merge |

### 8.2 Rollback Level

| Level | Scope | Method | Time |
|-------|-------|--------|------|
| `Level <N>` | `<e.g., Single file revert>` | `<e.g., Git revert / feature flag toggle>` | `<e.g., < 5 min>` |

### 8.3 Rollback Procedure

1. `<Step 1: e.g., Toggle feature flag to FALSE>`
2. `<Step 2: e.g., Verify legacy UI renders correctly>`
3. `<Step 3: e.g., Git revert commit HASH if needed>`
4. `<Step 4: e.g., Run regression tests>`

### 8.4 Feature Flag Details

| Flag Name | Location | Default | Toggle Method |
|-----------|----------|---------|---------------|
| `FLAG_<COMPONENT>_V2` | `<path to flag definition>` | `FALSE` | `constants.ts` / env var |

---

## 9. DELIVERABLES

### 9.1 Files To Create

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `path/to/new-file.tsx` | `<purpose>` |

### 9.2 Files To Modify

| # | File Path | Change Summary |
|---|-----------|----------------|
| 1 | `path/to/file.tsx` | `<summary of changes>` |
| 2 | `path/to/file.css` | `<summary of changes>` |

### 9.3 Files To Refactor

| # | File Path | Refactoring Scope |
|---|-----------|-------------------|
| 1 | `path/to/file.tsx` | `<scope of refactoring>` |

### 9.4 Required Artifacts At Completion

- [ ] `SPRINT_XX_HANDOVER.md` — Handover document for next agent
- [ ] Updated `CURRENT_SPRINT.md` — Status set to COMPLETED
- [ ] Acceptance criteria checklist with all items marked

---

## 10. RISKS

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| 1 | `<risk description>` | LOW/MED/HIGH | LOW/MED/HIGH | `<mitigation strategy>` |
| 2 | `<risk description>` | LOW/MED/HIGH | LOW/MED/HIGH | `<mitigation strategy>` |
| 3 | `<risk description>` | LOW/MED/HIGH | LOW/MED/HIGH | `<mitigation strategy>` |

### Risk Indicators To Watch

- [ ] Design tokens missing for required styles
- [ ] Component has complex nested structure
- [ ] Component shares styles with other components
- [ ] Legacy inline styles difficult to extract
- [ ] Third-party library constraints

---

## 11. SPRINT COMPLETION CHECKLIST

<!-- ALL items must be checked before Status = COMPLETED. -->

| # | Task | Done |
|---|------|------|
| 1 | UI migrated according to design standard | [ ] |
| 2 | All Acceptance Criteria verified (Section 7) | [ ] |
| 3 | Business logic verified unchanged | [ ] |
| 4 | Feature flag implemented and tested | [ ] |
| 5 | No console errors or warnings | [ ] |
| 6 | No regression in parent/related components | [ ] |
| 7 | Code reviewed and cleaned (no debug, unused imports) | [ ] |
| 8 | Rollback procedure verified | [ ] |
| 9 | `SPRINT_XX_HANDOVER.md` generated | [ ] |
| 10 | `CURRENT_SPRINT.md` updated (Status = COMPLETED) | [ ] |
| 11 | Next sprint's `CURRENT_SPRINT.md` initialized (Status = READY) | [ ] |

---

## 12. NEXT SPRINT

| Field | Value |
|-------|-------|
| **Sprint ID** | `SPRINT_YY` |
| **Sprint Name** | `<Next Sprint Name Here>` |

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

*End of CURRENT_SPRINT_TEMPLATE.md — Fill all `<>` placeholders before use.*