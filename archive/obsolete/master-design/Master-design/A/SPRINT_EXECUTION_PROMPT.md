# SPRINT_EXECUTION_PROMPT.md

> **Version:** 1.0  
> **Purpose:** One-shot sprint execution prompt for AI Agent (Deepseek, small context window)  
> **Workflow:** Read → Analyze → Execute → Verify → Handover → Update → Stop  
> **Rule:** ONE SPRINT PER EXECUTION. NO EXCEPTIONS.  
> **Target Reader:** AI Agent with NO prior chat history.

---

## TABLE OF CONTENTS

- [CRITICAL RULES — READ FIRST](#critical-rules--read-first)
- [STEP 1 — READ CURRENT STATE](#step-1--read-current-state)
- [STEP 2 — ANALYZE SPRINT](#step-2--analyze-sprint)
- [STEP 3 — CONFIRM SCOPE BOUNDARIES](#step-3--confirm-scope-boundaries)
- [STEP 4 — EXECUTE SPRINT](#step-4--execute-sprint)
- [STEP 5 — SELF REVIEW](#step-5--self-review)
- [STEP 6 — CREATE HANDOVER](#step-6--create-handover)
- [STEP 7 — UPDATE CURRENT_SPRINT](#step-7--update-current_sprint)
- [STEP 8 — CREATE EXECUTION REPORT](#step-8--create-execution-report)
- [STOP RULES](#stop-rules)
- [SUCCESS CRITERIA](#success-criteria)
- [APPENDIX A — ACCEPTANCE CRITERIA TABLE](#appendix-a--acceptance-criteria-table)
- [APPENDIX B — SELF REVIEW CHECKLIST](#appendix-b--self-review-checklist)
- [APPENDIX C — FEATURE FLAG PATTERN](#appendix-c--feature-flag-pattern)
- [APPENDIX D — ROLLBACK PROCEDURE](#appendix-d--rollback-procedure)
- [APPENDIX E — COMMON MISTAKES](#appendix-e--common-mistakes)

---

## CRITICAL RULES — READ FIRST

### Rule 1: One Sprint Only

You are executing **EXACTLY ONE SPRINT**. Not more. Not less.

```
ALLOWED:   Execute SPRINT_04 → Stop
FORBIDDEN: Execute SPRINT_04 → Execute SPRINT_05
FORBIDDEN: Execute SPRINT_04 → Start SPRINT_05 prep work
FORBIDDEN: Execute SPRINT_04 → Refactor unrelated code
```

### Rule 2: Read Before You Act

You MUST read these files **BEFORE** making any changes:

| Order | File | Why |
|-------|------|-----|
| 1 | `CURRENT_SPRINT.md` | Know sprint ID, scope, status |
| 2 | `UI_MIGRATION_MASTER_ROADMAP.md` (relevant sprint section only) | Know sprint details, dependencies, acceptance criteria |
| 3 | Previous Handover (e.g., `SPRINT_XX_HANDOVER.md`) | Know what was delivered, known issues, blockers |
| 4 | Required Documents listed in CURRENT_SPRINT.md Section 6 | Design standards, architecture docs, rollback plan |
| 5 | `HANDOVER_TEMPLATE.md` | Template for handover output |
| 6 | `UI_DEPENDENCY_GRAPH.md` (if referenced) | Understand component relationships |
| 7 | `UI_ACCEPTANCE_CRITERIA.md` (if referenced) | Acceptance criteria definitions |
| 8 | `UI_ROLLBACK_PLAN.md` (if referenced) | Rollback procedures |

### Rule 3: Never Modify These Areas

| Area | Reasoning |
|------|-----------|
| **Business Logic** | Handlers, validations, calculations, state management |
| **API/Data Layer** | API calls, Supabase queries, database schema |
| **Types/Interfaces** | `types.ts`, API contracts, data models |
| **Permission/RBAC** | Role checks, permission logic, access control |
| **Workflow Logic** | Multi-step flows, navigation conditions, routing rules |
| **Business Rules** | Tax calculations, discount logic, pricing formulas |
| **New Features** | Adding functionality not in the original component |
| **Roadmap** | `UI_MIGRATION_MASTER_ROADMAP.md` — never modify |
| **Design Standards** | Never create or modify design standard documents |
| **Architecture Docs** | Never create or modify architecture documents |

### Rule 4: Feature Flag Required

Every migrated component MUST have a feature flag for instant rollback.

Pattern:
```tsx
{flagEnabled ? <NewComponent /> : <LegacyComponent />}
```

Feature flags are defined in `constants.ts`:
```ts
export const FLAG_<COMPONENT>_V2 = false; // default OFF
```

### Rule 5: Handover Is Mandatory

No sprint is complete without a handover document. No exceptions.

### Rule 6: Stop After Handover

After creating the handover and updating CURRENT_SPRINT.md, you MUST STOP.

Do NOT:
- Start the next sprint
- Plan the next sprint
- Review the next sprint's requirements
- Do any prep work for future sprints
- Continue migration work

---

## STEP 1 — READ CURRENT STATE

### 1.1 Read CURRENT_SPRINT.md

Read the file `CURRENT_SPRINT.md` completely.

Identify:
- **Sprint ID** — which sprint number
- **Sprint Name** — what is being migrated
- **Status** — is it READY, IN_PROGRESS, BLOCKED?
- **Scope** — what files to modify, what components to change
- **Required Documents** — what you must read before executing

### 1.2 Read Previous Handover

Read the previous handover file: `SPRINT_XX_HANDOVER.md` (replace XX with previous sprint number).

Extract:
- Known issues from previous sprint
- Blocker status
- Risks that may affect current sprint
- Recommended next actions

### 1.3 Read Required Documents

Read all documents listed in `CURRENT_SPRINT.md` Section 6.

Minimum required reads:
- Design standards for the component being migrated
- Architecture documents
- UI_ACCEPTANCE_CRITERIA.md
- UI_ROLLBACK_PLAN.md

### 1.4 Read Roadmap Section

Read the relevant sprint section in `UI_MIGRATION_MASTER_ROADMAP.md`.

Do NOT read the entire roadmap. Only read:
- The current sprint section
- The previous sprint section (for context)

---

## STEP 2 — ANALYZE SPRINT

Create a brief analysis report. Format:

```markdown
## SPRINT ANALYSIS REPORT

### Current Sprint
- **Sprint ID:** SPRINT_XX
- **Sprint Name:** [Name from CURRENT_SPRINT.md]
- **Status:** [Current status]

### Objective
[One paragraph from CURRENT_SPRINT.md Section 2]

### Scope
[List of files to modify from CURRENT_SPRINT.md Section 3.1]
[List of components to migrate from CURRENT_SPRINT.md Section 3.2]

### Dependencies
[List of prerequisite sprints and their status]

### Acceptance Criteria
[Summary of acceptance criteria from CURRENT_SPRINT.md Section 7]
- Total criteria count: [N]
- UI migration criteria: [N]
- Business logic integrity criteria: [N]
- Code quality criteria: [N]

### Risks
[List of risks from CURRENT_SPRINT.md Section 10]

### Previous Sprint Status
[From handover: known issues, blockers, risks]
```

---

## STEP 3 — CONFIRM SCOPE BOUNDARIES

### 3.1 Allowed Changes Declaration

Write:

```
I am ONLY allowed to change:
- [List from CURRENT_SPRINT.md Section 3.3 — Allowed Changes]
- Files listed in CURRENT_SPRINT.md Section 3.1 — Files To Modify
- Components listed in CURRENT_SPRINT.md Section 3.2 — Components In Scope

I am NOT allowed to change:
- Business Logic
- API/Data Layer
- Types/Interfaces
- Permission/RBAC
- Workflow Logic
- Business Rules
- New Features
- Any file/component NOT listed in CURRENT_SPRINT.md scope
```

### 3.2 Verify Prerequisites

Check that prerequisite sprints are completed (from CURRENT_SPRINT.md Section 5.1).

If any prerequisite is NOT completed:
- **Action:** Do NOT execute this sprint.
- **Status:** Set `BLOCKED` in CURRENT_SPRINT.md.
- **Report:** Explain which prerequisite is missing.

---

## STEP 4 — EXECUTE SPRINT

### 4.1 Implementation Order

1. **Read files to modify** — Understand current code structure
2. **Understand design standard** — Know target output
3. **Create feature flag** (if not exists) in `constants.ts`
4. **Implement changes** in the EXACT order listed in CURRENT_SPRINT.md:
   - Files To Create first (Section 9.1)
   - Files To Modify next (Section 9.2)
   - Files To Refactor next (Section 9.3)
5. **Wrap new UI in feature flag** — Ensure fallback to legacy UI works

### 4.2 Code Change Rules

| Rule | Description |
|------|-------------|
| **JSX Only** | Change JSX structure, className, CSS. Do NOT change handlers, state, API calls. |
| **Token First** | Use design system tokens (`var(--color-*)`, `var(--space-*)`, etc.) instead of hardcoded values. |
| **No Inline Styles** | Extract all inline styles to CSS classes. |
| **Preserve Handlers** | Keep all `onClick`, `onChange`, `onSubmit`, etc. handlers identical. |
| **Preserve Props** | Keep all component props identical. Only add UI-only props if needed. |
| **No Console Logs** | No `console.log`, `console.warn`, `console.error` (unless already present). |
| **No Debugger** | No `debugger` statements. |
| **Format JSX** | Ensure JSX is properly indented and readable. |

### 4.3 Feature Flag Implementation Pattern

```tsx
// In constants.ts (if flag doesn't exist):
export const FLAG_<COMPONENT>_V2 = false; // default OFF

// In component file:
import { FLAG_<COMPONENT>_V2 } from '../constants';

function Component() {
  // ... existing code unchanged ...
  
  return (
    <>
      {FLAG_<COMPONENT>_V2 ? (
        <NewComponent />  // migrated UI
      ) : (
        <LegacyComponent />  // original UI
      )}
    </>
  );
}
```

### 4.4 What To Do If Stuck

| Situation | Action |
|-----------|--------|
| Missing design token | STOP. Report missing token. Do NOT use hardcoded value. |
| Component too complex for one sprint | STOP. Do partial scope. Mark `PARTIALLY_COMPLETED`. |
| Prerequisite sprint incomplete | STOP. Set `BLOCKED`. Do NOT proceed. |
| Business logic requires change | STOP. This is a HARD BLOCKER. Do NOT modify. Report issue. |

---

## STEP 5 — SELF REVIEW

### 5.1 Design Compliance

Check every visual element against the design standard.

| Check | Result |
|-------|--------|
| All colors use `var(--color-*)` tokens | PASS / FAIL |
| All spacing uses `var(--space-*)` tokens | PASS / FAIL |
| All typography uses `var(--text-*)` / `var(--font-*)` tokens | PASS / FAIL |
| All radii use `var(--radius-*)` tokens | PASS / FAIL |
| All shadows use `var(--shadow-*)` tokens | PASS / FAIL |
| No hardcoded color/spacing/typography values | PASS / FAIL |
| Component structure matches design standard | PASS / FAIL |
| **Overall Design Compliance** | **PASS / FAIL** |

### 5.2 Functional Integrity

Verify that business logic is untouched.

| Check | Result |
|-------|--------|
| All existing event handlers preserved | PASS / FAIL |
| State management logic unchanged | PASS / FAIL |
| API calls and data flow unchanged | PASS / FAIL |
| User interaction behavior identical | PASS / FAIL |
| Validation rules unchanged | PASS / FAIL |
| Permission logic unchanged | PASS / FAIL |
| **Overall Functional Integrity** | **PASS / FAIL** |

### 5.3 Regression Risk

| Check | Result |
|-------|--------|
| Feature flag can toggle between old/new UI | PASS / FAIL |
| Legacy UI renders correctly when flag = OFF | PASS / FAIL |
| No console errors when flag = ON | PASS / FAIL |
| No console errors when flag = OFF | PASS / FAIL |
| Parent components render correctly | PASS / FAIL |
| **Overall Regression Risk** | **PASS / FAIL** |

### 5.4 Accessibility

| Check | Result |
|-------|--------|
| All interactive elements have focus styles | PASS / FAIL |
| Tab order is logical | PASS / FAIL |
| Buttons/links have accessible labels | PASS / FAIL |
| Color contrast meets WCAG AA minimum | PASS / FAIL |
| **Overall Accessibility** | **PASS / FAIL** |

### 5.5 Responsive

Check the component at key breakpoints.

| Check | Result |
|-------|--------|
| Desktop (1024px+) renders correctly | PASS / FAIL |
| Tablet (768px-1023px) renders correctly | PASS / FAIL |
| Mobile (<768px) renders correctly | PASS / FAIL |
| No horizontal overflow | PASS / FAIL |
| **Overall Responsive** | **PASS / FAIL** |

### 5.6 Rollback Safety

| Check | Result |
|-------|--------|
| Feature flag toggle works immediately | PASS / FAIL |
| Legacy code path is preserved | PASS / FAIL |
| No data is modified (UI-only changes) | PASS / FAIL |
| Git revert available if needed | PASS / FAIL |
| **Overall Rollback Safety** | **PASS / FAIL** |

### 5.7 Final Review Verdict

```markdown
## SELF REVIEW VERDICT

| Category | Result |
|----------|--------|
| Design Compliance | PASS / FAIL |
| Functional Integrity | PASS / FAIL |
| Regression Risk | PASS / FAIL |
| Accessibility | PASS / FAIL |
| Responsive | PASS / FAIL |
| Rollback Safety | PASS / FAIL |

**Verdict:** ✅ SPRINT COMPLETE / ❌ SPRINT FAILED — Fix Required
```

### 5.8 If Any Check FAILs

DO NOT proceed to Step 6.

1. Fix the failing item(s)
2. Re-run Self Review (Step 5) from the beginning
3. Only proceed when ALL checks PASS

---

## STEP 6 — CREATE HANDOVER

### 6.1 Naming Convention

```
HANDOVER_SPRINT_XX.md
```

Replace `XX` with the sprint number (zero-padded, e.g., `01`, `12`).

### 6.2 Template

Use `HANDOVER_TEMPLATE.md` as the base structure.

### 6.3 Fill In

| Section | Source |
|---------|--------|
| **Project Information** | From CURRENT_SPRINT.md or roadmap |
| **Sprint Information** | From CURRENT_SPRINT.md Section 1 |
| **Sprint Objective** | From CURRENT_SPRINT.md Section 2 |
| **Scope Completed** | What was actually completed (checklist) |
| **Files Added** | List files created in this sprint |
| **Files Modified** | List files modified in this sprint |
| **Files Removed** | List files removed in this sprint (if any) |
| **Design Standards Applied** | List design standards used |
| **Acceptance Results** | From Self Review — list each criterion PASS/FAIL |
| **Functional Verification** | From Self Review — each check |
| **Regression Results** | From Self Review — regression checks |
| **Accessibility Results** | From Self Review — a11y checks |
| **Responsive Results** | From Self Review — responsive checks |
| **Performance Results** | Before/after metrics if available |
| **Rollback Status** | "Rollback Available" if feature flag works |
| **Known Issues** | Any issues found (NONE if empty) |
| **Technical Debt** | Any debt introduced (NONE if empty) |
| **Risks** | From CURRENT_SPRINT.md + any new risks |
| **Blockers** | Any blockers (NONE if empty) |
| **Recommended Next Actions** | What the next agent should do |
| **Next Sprint** | From CURRENT_SPRINT.md Section 12 |
| **Required Documents for Next Sprint** | From CURRENT_SPRINT.md Section 6 (adjusted) |
| **AI Continuation Context** | Current migration state, progress metrics |

### 6.4 Important Handover Rules

- The handover MUST be **self-contained**. A new AI agent must be able to continue with just `CURRENT_SPRINT.md` + this handover.
- Do NOT reference chat history. Do NOT say "as discussed earlier".
- Keep reading time under 2 minutes.
- Mark ALL checkboxes appropriately.
- If the sprint is PARTIALLY_COMPLETED, explain exactly what remains.

---

## STEP 7 — UPDATE CURRENT_SPRINT

### 7.1 If Sprint Completed Successfully

1. Open `CURRENT_SPRINT.md`
2. Update Status to `COMPLETED`
3. Mark Section 11 (Sprint Completion Checklist) — all items `[x]`
4. Fill Section 12 (Next Sprint) if not already filled:
   - Sprint ID: `SPRINT_YY` (next number)
   - Sprint Name: From roadmap (or leave as `<TBD>` if not planning ahead)
5. Save

### 7.2 If Sprint Partially Completed

1. Open `CURRENT_SPRINT.md`
2. Update Status to `IN_PROGRESS`
3. Do NOT modify Section 12 (Next Sprint)
4. Add note at top: `PARTIALLY COMPLETED — [X]% done. Remaining: [description]`
5. Save

### 7.3 If Sprint Blocked

1. Open `CURRENT_SPRINT.md`
2. Update Status to `BLOCKED`
3. Add blocking reason in Section 10 (Risks) or as a note at top
4. Do NOT modify Section 12 (Next Sprint)
5. Save

### 7.4 If Sprint Failed

1. Open `CURRENT_SPRINT.md`
2. Update Status to `REVIEW` (if fixable) or `COMPLETED` with note (if abandoned)
3. Document failure reason in the handover
4. Ensure rollback procedures are executed (feature flag = OFF)

---

## STEP 8 — CREATE EXECUTION REPORT

After handover and CURRENT_SPRINT update, create an execution report.

```markdown
# SPRINT EXECUTION REPORT

## Sprint Completed
- **Sprint ID:** SPRINT_XX
- **Sprint Name:** [Name]
- **Status:** COMPLETED / PARTIALLY_COMPLETED / BLOCKED / FAILED

## Files Added
```
path/to/new-file-1.tsx
path/to/new-file-2.tsx
```
NONE

## Files Modified
```
path/to/modified-file-1.tsx
path/to/modified-file-2.tsx
```
NONE

## Files Removed
```
path/to/removed-file-1.tsx
```
NONE

## Acceptance Result
- **PASS / FAIL / PARTIAL PASS**
- Total criteria: [N]
- Passed: [N]
- Failed: [N]

## Regression Result
- **PASS / FAIL**
- Feature flag toggle works: YES / NO
- Legacy UI preserved: YES / NO

## Rollback Status
- **Available / Required / Executed**
- Method: Feature flag toggle / Git revert
- Flag name: `FLAG_<COMPONENT>_V2`
- Flag default: `false`

## Next Sprint
- **Sprint ID:** SPRINT_YY
- **Sprint Name:** [Name]
- **Status:** READY / BLOCKED / TBD

---

## Execution Summary

[1-2 paragraph summary of what was accomplished, any issues, and what the next agent needs to know]
```

---

## STOP RULES

### You MUST Stop When

1. ✅ Handover document created (`SPRINT_XX_HANDOVER.md`)
2. ✅ `CURRENT_SPRINT.md` updated with correct status
3. ✅ Execution report generated

### You MUST NOT

| Forbidden Action | Why |
|-----------------|-----|
| Start the next sprint | One sprint per execution. Period. |
| Continue migration work | Stop. The handover enables the next agent. |
| Do prep work for future sprints | Let the next agent handle it fresh. |
| Modify the roadmap | Roadmap is read-only except for the program manager. |
| Modify design standards | Standards are source of truth, not to be changed. |
| Refactor unrelated code | Stay within sprint scope. |
| Fix bugs found during review | Only fix if CRITICAL to sprint. Otherwise log in Known Issues. |
| Create new documents not in scope | Only create handover + execution report. |

### How To End Your Session

1. Verify all deliverables exist:
   - [ ] `SPRINT_XX_HANDOVER.md`
   - [ ] `CURRENT_SPRINT.md` (updated)
   - [ ] Execution report (in chat or as file)

2. Present final summary to the user:
   - What sprint was executed
   - What was accomplished
   - Where to find the handover
   - What the next agent needs to know

3. Do NOT suggest next steps or offer to continue.

---

## SUCCESS CRITERIA

A sprint is **COMPLETE** only when ALL of these are true:

| # | Criterion | Verification Method |
|---|-----------|-------------------|
| 1 | ✓ Scope fully completed (Section 3 of CURRENT_SPRINT.md) | Compare changes against scope |
| 2 | ✓ Acceptance PASS (Section 7 of CURRENT_SPRINT.md) | Self review — all criteria PASS |
| 3 | ✓ Regression PASS | Legacy UI unaffected, flag toggle works |
| 4 | ✓ Accessibility PASS | Focus, contrast, labels, tab order |
| 5 | ✓ Responsive PASS | Desktop, tablet, mobile breakpoints |
| 6 | ✓ Rollback Available | Feature flag = OFF restores original UI |
| 7 | ✓ Handover Generated | `SPRINT_XX_HANDOVER.md` created |
| 8 | ✓ CURRENT_SPRINT Updated | Status set to COMPLETED |

If ANY criterion is NOT met, the sprint is NOT complete. Fix before proceeding.

---

## APPENDIX A — ACCEPTANCE CRITERIA TABLE

Template for tracking acceptance criteria during execution:

```markdown
### UI Migration Criteria

| # | Criterion | Expected | Actual |
|---|-----------|----------|--------|
| 1 | Component uses Design System tokens (no hardcoded values) | YES | (✓/✗) |
| 2 | Component follows design standard structure | YES | (✓/✗) |
| 3 | All typography uses `var(--text-*)` / `var(--font-*)` tokens | YES | (✓/✗) |
| 4 | All spacing uses `var(--space-*)` tokens | YES | (✓/✗) |
| 5 | All colors use `var(--color-*)` tokens | YES | (✓/✗) |
| 6 | All radii use `var(--radius-*)` tokens | YES | (✓/✗) |
| 7 | All shadows use `var(--shadow-*)` tokens | YES | (✓/✗) |
| 8 | Feature flag wraps component | YES | (✓/✗) |
| 9 | No CSS/className regressions in parent components | YES | (✓/✗) |
| 10 | Component renders without console errors | YES | (✓/✗) |

### Business Logic Integrity Criteria

| # | Criterion | Expected | Actual |
|---|-----------|----------|--------|
| 1 | All existing event handlers preserved | YES | (✓/✗) |
| 2 | State management logic unchanged | YES | (✓/✗) |
| 3 | API calls and data flow unchanged | YES | (✓/✗) |
| 4 | User interaction behavior identical | YES | (✓/✗) |
| 5 | Validation rules unchanged | YES | (✓/✗) |

### Code Quality Criteria

| # | Criterion | Expected | Actual |
|---|-----------|----------|--------|
| 1 | No unused imports or variables | YES | (✓/✗) |
| 2 | No console.log / debugger statements | YES | (✓/✗) |
| 3 | JSX is formatted and readable | YES | (✓/✗) |
| 4 | Component is properly typed | YES | (✓/✗) |
| 5 | No inline styles remain | YES | (✓/✗) |
| 6 | No duplicate CSS declarations | YES | (✓/✗) |

**Overall Acceptance:** PASS / FAIL
```

---

## APPENDIX B — SELF REVIEW CHECKLIST

### Quick Reference for All Review Categories

| # | Category | PASS | FAIL | Action on FAIL |
|---|----------|------|------|----------------|
| 1 | **Design Compliance** | ✓ | ✗ | Fix token usage, restructure to match standard |
| 2 | **Functional Integrity** | ✓ | ✗ | HARD BLOCKER — rollback immediately |
| 3 | **Regression Risk** | ✓ | ✗ | Toggle flag, verify legacy path, fix |
| 4 | **Accessibility** | ✓ | ✗ | Add focus styles, labels, fix contrast |
| 5 | **Responsive** | ✓ | ✗ | Fix layout at breakpoints |
| 6 | **Rollback Safety** | ✓ | ✗ | Ensure flag works, preserve legacy code |

---

## APPENDIX C — FEATURE FLAG PATTERN

### Standard Feature Flag Structure

```ts
// constants.ts
export const FLAG_<COMPONENT>_V2 = false; // ← default OFF for safety
```

### Usage in Component

```tsx
import { FLAG_<COMPONENT>_V2 } from '../constants';

// Inside component render:
{FLAG_<COMPONENT>_V2 ? (
  <NewUI props={existingProps} />
) : (
  <LegacyUI props={existingProps} />  // ← unchanged original
)}
```

### Testing Rollback

```bash
# To test rollback:
# 1. Toggle FLAG_<COMPONENT>_V2 to true → verify new UI renders
# 2. Toggle FLAG_<COMPONENT>_V2 to false → verify old UI renders
# 3. No console errors in either state
```

---

## APPENDIX D — ROLLBACK PROCEDURE

### Emergency Rollback (Immediate)

```bash
# Step 1: Toggle feature flag OFF
# In constants.ts:
export const FLAG_<COMPONENT>_V2 = false;

# Step 2: Verify application works
# Reload / rebuild → confirm legacy UI renders

# Step 3: Git revert (if needed)
git revert <commit-hash>
```

### Checklist for Rollback

- [ ] Feature flag set to `false`
- [ ] Application compiles and runs
- [ ] Legacy UI renders correctly
- [ ] No console errors
- [ ] All tests pass

---

## APPENDIX E — COMMON MISTAKES

### Mistakes AI Agents Frequently Make

| # | Mistake | Prevention |
|---|---------|------------|
| 1 | Modifying business logic while doing UI changes | Only change JSX/className. Never touch handlers. |
| 2 | Removing old code instead of wrapping in flag | Keep legacy code path. Use feature flag pattern. |
| 3 | Hardcoding values instead of using tokens | Check design-tokens.css first. Every value should be a token. |
| 4 | Going beyond sprint scope | Re-read CURRENT_SPRINT.md. Stick to listed files and components. |
| 5 | Skipping handover or doing it poorly | Handover is required. Must be self-contained for next agent. |
| 6 | Starting next sprint prep | STOP after handover. Next agent will handle it. |
| 7 | Adding new features not in original component | Not allowed. UI migration only. |
| 8 | Refactoring code that "looks messy" | Only refactor what's in scope. Not your job to clean everything. |
| 9 | Modifying CSS of parent/shared components | Only modify files listed in CURRENT_SPRINT.md scope. |
| 10 | Creating new design tokens or standards | Tokens and standards are fixed. Use what exists. |

---

## QUICK REFERENCE FLOWCHART

```
START
  │
  ▼
┌─────────────────────────────────────┐
│ STEP 1: READ CURRENT STATE          │
│ • Read CURRENT_SPRINT.md            │
│ • Read previous handover            │
│ • Read required documents           │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ STEP 2: ANALYZE SPRINT              │
│ • Create analysis report            │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ STEP 3: CONFIRM SCOPE BOUNDARIES     │
│ • Declare allowed/forbidden changes │
│ • Verify prerequisites              │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ STEP 4: EXECUTE SPRINT              │
│ • Create/modify files in scope      │
│ • Implement feature flag            │
│ • Follow implementation order       │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ STEP 5: SELF REVIEW                 │
│ • Design Compliance                 │
│ • Functional Integrity              │
│ • Regression Risk                   │
│ • Accessibility                     │
│ • Responsive                        │
│ • Rollback Safety                   │
└─────────────────────────────────────┘
  │
  ▼
  ANY FAIL? ──YES──► FIX → RE-REVIEW
  │
  NO
  │
  ▼
┌─────────────────────────────────────┐
│ STEP 6: CREATE HANDOVER             │
│ • HANDOVER_SPRINT_XX.md             │
│ • Use HANDOVER_TEMPLATE.md          │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ STEP 7: UPDATE CURRENT_SPRINT       │
│ • Set status based on result        │
│ • Update completion checklist       │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ STEP 8: CREATE EXECUTION REPORT     │
│ • Summarize what was done           │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ STOP                                 │
│ • Do NOT start next sprint          │
│ • Do NOT continue migration         │
│ • Present results to user           │
└─────────────────────────────────────┘
```

---

## END OF SPRINT_EXECUTION_PROMPT.md

> **Remember:** One sprint. One execution. One handover. Then STOP.

*Generated for VietSale Pro v7 UI Migration — AI Agent Execution Framework*