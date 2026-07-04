# UI CONSOLIDATION MASTER ROADMAP — VietSale Pro v7

> **Version:** 1.1
> **Date:** 2026-06-25
> **Document Type:** Governance (Single Source of Truth)
> **Program:** UI Consolidation Program
> **Predecessor Program:** UI Migration Program (COMPLETE — 35 sprints)
> **Single Source of Truth:** `/Master-design/`
> **Status:** ACTIVE — Governance Baseline
> **Owner:** UI Quality Engineering / Design System Governance

---

## DOCUMENT CONTRACT

This document is **governance only**. It defines *how* the UI Consolidation Program operates. It is intentionally **not** an implementation document, **not** an audit report, **not** an acceptance checklist, and **not** a sprint plan. Those artifacts are produced in later, separate steps and must conform to the rules established here.

This document does not modify, prescribe, or authorize any changes to source code, TSX, CSS, business logic, API, validation, routing, workflow, state, or feature flags. It establishes the rules under which future audit and consolidation work will be governed.

If any later artifact conflicts with this roadmap, **this roadmap wins** until it is formally amended through the Review Process defined in Section 18.

---

## SECTION 1 — PROGRAM VISION

### 1.1 Vision Statement

The UI Migration Program rebuilt the VietSale Pro v7 interface on a standardized Master Design System. The migration answered the question *"Can the Design System exist?"* — and the answer was yes.

The UI Consolidation Program answers a different and harder question:

> **"Has the Design System actually been adopted — completely, consistently, and verifiably — across the entire product?"**

The vision is a product where every screen, modal, form, table, and control is provably built from the shared Design System, where no legacy UI survives unaccounted for, and where the entire UI surface can be declared stable enough to enter a formal **UI LOCK** state.

### 1.2 Why This Program Exists

Migration proves *capability*. Consolidation proves *adoption*. These are not the same thing. A migration can be reported as "complete" while the codebase still contains:

- Screens that bypass standardized components.
- Inline styles and hardcoded values that drift from Design Tokens.
- Legacy components that were superseded but never removed.
- Inconsistent typography, spacing, motion, and iconography.
- Feature flags left in ambiguous or contradictory states.

The Consolidation Program exists to close the gap between *"migration sprints were executed"* and *"the Design System is the only way the UI is built."*

### 1.3 What "Good" Looks Like

The program succeeds when the UI surface is **consistent, measurable, and locked** — meaning consistency is not an opinion but a measured fact, and any deviation is a tracked exception with a known severity and owner.

---

## SECTION 2 — PROGRAM OBJECTIVES

| # | Objective | Description |
|---|-----------|-------------|
| O1 | **Verify Adoption** | Confirm every standardized component produced during UI Migration is actually used wherever it should be used. |
| O2 | **Measure Coverage** | Express Design System adoption as a measurable percentage per component, per screen, and per domain. |
| O3 | **Detect Legacy** | Identify all remaining legacy UI that should already have been replaced. |
| O4 | **Enforce Consistency** | Verify typography, spacing, radius, shadow, motion, icons, and color are uniform and token-driven. |
| O5 | **Validate Responsiveness** | Confirm desktop, tablet, and mobile behavior is consistent and overflow-safe. |
| O6 | **Validate Accessibility** | Confirm keyboard, focus, ARIA, labels, and roles meet the defined baseline. |
| O7 | **Audit Feature Flags** | Verify existing migration feature flags are used correctly and consistently. |
| O8 | **Define UI LOCK** | Establish and reach the objective criteria under which the UI can be formally locked. |

> **Non-Objective:** This program does not aim to add features, refactor logic, or improve performance. See Section 6.

---

## SECTION 3 — GUIDING PRINCIPLES

| # | Principle | Meaning |
|---|-----------|---------|
| G1 | **Verify, Don't Migrate** | The migration is over. This program observes, measures, and reports — it does not rebuild. |
| G2 | **Evidence Over Opinion** | Every conclusion must be backed by reproducible evidence (file paths, line references, measured coverage). |
| G3 | **Measurable Or It Didn't Happen** | "Consistent" must be expressed as a number or a defined pass/fail gate, never a vibe. |
| G4 | **One Source Of Truth** | `/Master-design/` standards define correctness. This roadmap governs the program. |
| G5 | **Severity Before Effort** | Findings are ranked by severity first; remediation planning happens in later programs/steps. |
| G6 | **No Silent Drift** | Any deviation from the Design System is either fixed under a separate authorized step or recorded as a tracked exception. |
| G7 | **Stable Surface** | Governance favors a freezable, lockable UI over continuous change. |
| G8 | **Read Before Judging** | Audits reference the relevant `MASTER_*` standard before declaring compliance or violation. |

---

## SECTION 4 — IMMUTABLE RULES

These rules cannot be overridden by any sprint, audit, or later artifact. They may only be changed through a formal amendment (Section 18).

1. **No source code is modified under this roadmap.** This document and the program it governs are verification-first.
2. **No new feature flags are introduced.** Only feature flags created during the UI Migration Program are evaluated.
3. **No business behavior is changed** — not logic, API, validation, routing, workflow, or state.
4. **The Master Design System is the standard of correctness.** Compliance is measured against `/Master-design/` documents.
5. **Every finding carries a severity.** Unclassified findings are invalid.
6. **Coverage is reported as a number.** Adoption claims without a coverage figure are invalid.
7. **Audit artifacts are read-only with respect to the product.** They describe state; they do not change it.
8. **UI LOCK is a governed state**, entered only when the Exit Criteria (Section 15) and UI LOCK Definition (Section 16) are fully satisfied.
9. **Scope is bounded.** Anything in Section 6 is explicitly out of scope and must be deferred to a future program.

---

## SECTION 5 — SCOPE

The program governs verification of the following, and only the following, dimensions of the existing UI.

### 5.1 Design System Adoption

Governance covers verification that the following standardized components are adopted wherever applicable:

- `ActionButton`
- `TextInput`
- `SelectInput`
- `FormField`
- `SectionBox`
- `StatusBadge`
- `NotificationSystem`
- `Picker`
- `MasterModal`
- `DataGrid`
- `AppShell`
- `SplitPane`
- `Dashboard`
- `Tabs`
- **every other standardized component created during the UI Migration Program**

Each component has a corresponding standard in `/Master-design/` (e.g. `MASTER_ACTION_BUTTON_STANDARD_V1.md`, `MASTER_INPUT_STANDARD_V1.md`, `MASTER_MODAL_BLUEPRINT_V1.md`, `MASTER_DATA_GRID_STANDARD_V1.md`, `MASTER_APP_SHELL_STANDARD.md`, `MASTER_SPLIT_PANE_STANDARD_V1.md`, `MASTER_DASHBOARD_STANDARD.md`, `MASTER_TABS_STANDARD_V1.md`, `MASTER_SECTION_BOX_STANDARD_V1.md`, `MASTER_STATUS_BADGE_STANDARD.md`, `MASTER_PICKER_STANDARD_V1.md`, `MASTER_NOTIFICATION_STANDARD.md`, `MASTER_FORM_STANDARD.md`). Verification is performed against those standards.

### 5.2 CSS Compliance

- **CSS First** — styling lives in CSS, not inline.
- **Component CSS organization** — each component's CSS is structured per the standard.
- **Design Tokens** — values derive from tokens (`MASTER_DESIGN_TOKENS_V1.md`).
- **Inline Style usage** — inline styles are flagged and accounted for.
- **Hardcoded values** — hardcoded colors/sizes/spacing are flagged against tokens.
- **Typography consistency** — typography follows `MASTER_TYPOGRAPHY_V1.md`.

### 5.3 Responsive

- Desktop, Tablet, and Mobile behavior.
- Overflow handling.
- Layout consistency across breakpoints.

### 5.4 Accessibility

- Keyboard navigation.
- Focus visibility.
- ARIA attributes.
- Labels.
- Roles.

### 5.5 UI Consistency

- Typography, Spacing, Border Radius, Shadows, Motion, Icons, Colors, and Component behaviors — measured against the relevant `MASTER_*` standards (including `MASTER_MOTION_ANIMATION_STANDARD_V1.md`, `MASTER_ICON_STANDARD_V1.md`, `MASTER_ELEVATION_ZINDEX_STANDARD_V1.md`).

### 5.6 Legacy UI Detection

Governance for identifying UI that should already have been replaced by the Design System but still exists in the product surface.

### 5.7 Feature Flag Adoption

Verification that **existing** UI Migration feature flags are used correctly and consistently. No new flags are created.

---

## SECTION 6 — OUT OF SCOPE

The following are explicitly **excluded** from this program and belong to future programs:

- Business Logic Refactoring
- API Refactoring
- Database Changes
- Service Layer Refactoring
- TypeScript Cleanup
- Folder Structure Cleanup
- Performance Optimization
- Testing Infrastructure
- Build System
- CI/CD
- Security
- Feature Development

Any finding that touches these areas is recorded, tagged as **OUT-OF-SCOPE**, and handed off to the appropriate future program. It is never actioned within UI Consolidation.

---

## SECTION 7 — GOVERNANCE MODEL

### 7.1 Authority Hierarchy

```
UI_CONSOLIDATION_MASTER_ROADMAP.md   (this document — governs the program)
            ↓
/Master-design/ MASTER_* standards    (define UI correctness)
            ↓
Audit Methodology & Quality Gates      (defined here, applied later)
            ↓
Audit Sprints / Reports                (produced later, must conform)
            ↓
Findings + Coverage + Severity         (evidence)
            ↓
Exit Criteria → UI LOCK                (governed end-state)
```

### 7.2 Roles

| Role | Responsibility |
|------|----------------|
| **Program Owner** | Owns this roadmap; approves amendments; declares UI LOCK. |
| **Audit Executor** | Runs audit sprints against this governance; produces evidence-backed findings. |
| **Reviewer** | Independently validates findings, severity, and coverage. |
| **Design System Steward** | Confirms interpretation of `MASTER_*` standards in disputes. |

### 7.3 Decision Rules

- A finding is valid only if it has **evidence**, a **severity**, and a **scope tag** (IN-SCOPE / OUT-OF-SCOPE).
- A component is "adopted" only when its coverage meets its quality gate (Section 12).
- UI LOCK is declared only by the Program Owner and only when Section 15 and Section 16 are satisfied.

### 7.4 Audit Independence Policy

To protect audit credibility, the program enforces separation between execution and validation. No actor may both produce and approve the same audit result.

| # | Rule |
|---|------|
| AI-1 | **The Audit Executor cannot approve their own audit.** Execution and approval are separate roles. |
| AI-2 | **The Reviewer must be independent** of the Audit Executor for the surface under review. |
| AI-3 | **Findings require Reviewer validation** before they count toward coverage, gates, or Exit Criteria. |
| AI-4 | **UI LOCK approval remains under the Program Owner** and is never delegated to the Audit Executor or Reviewer. |

This policy exists solely to improve audit credibility and reproducibility. It defines independence only; escalation, sampling, and operational workflows are intentionally deferred (Section 6 and the deferral note in Section 24).

---

## SECTION 8 — AUDIT METHODOLOGY

This section defines *how* audits will be conducted later. It does not perform an audit.

### 8.1 Audit Dimensions

Every audit evaluates a target against the seven scope dimensions: **Adoption, CSS Compliance, Responsive, Accessibility, Consistency, Legacy, Feature Flags.**

### 8.2 Audit Unit

The atomic unit of audit is the **screen/component pair**: a given UI surface (page, modal, panel) evaluated for its use of a given standardized component or standard.

### 8.3 Audit Flow

```
Select target  →  Read relevant MASTER_* standard  →  Inspect implementation
      →  Record evidence (path + line)  →  Classify (compliant / deviation)
      →  Assign severity  →  Tag scope  →  Record coverage contribution
```

### 8.4 Evidence Standard

Every finding must cite concrete evidence: file path, line range, and the specific standard clause it satisfies or violates. Findings without evidence are rejected by the Reviewer.

### 8.5 Reproducibility

An audit result must be reproducible by an independent Reviewer following the same steps to the same conclusion. Non-reproducible findings are invalid.

---

## SECTION 9 — SEVERITY CLASSIFICATION

| Severity | Label | Definition | Impact on UI LOCK |
|----------|-------|------------|-------------------|
| **S0** | Blocker | Breaks core UI integrity or contradicts an Immutable Rule. | Blocks LOCK |
| **S1** | Critical | Legacy UI in active use, or a standardized component bypassed on a primary surface. | Blocks LOCK |
| **S2** | Major | Token/typography/consistency violation visible to users. | Must be tracked; gated |
| **S3** | Minor | Localized inconsistency with limited user impact. | Allowed as tracked exception |
| **S4** | Cosmetic / Informational | Negligible or stylistic note. | Does not block LOCK |

> Severity is assigned per finding and is mandatory. A finding's severity, not its effort to fix, determines its weight in gates and exit criteria.

---

## SECTION 10 — COVERAGE MEASUREMENT MODEL

### 10.1 Coverage Question

For each standardized component and standard, coverage answers: *"Of all the places this should be used, how many actually use it correctly?"*

### 10.2 Coverage Formula

```
Coverage(component) =
    (compliant usages) / (compliant usages + non-compliant usages + missed adoptions)
```

Where:
- **Compliant usage** — the standardized component is used and conforms to its standard.
- **Non-compliant usage** — the component is used but violates its standard.
- **Missed adoption** — a surface that should use the component but uses legacy/adhoc UI instead.

### 10.3 Coverage Granularity

Coverage is reported at three levels:

1. **Per Component** (e.g. `ActionButton` adoption %).
2. **Per Screen / Domain** (e.g. Customers page, POS, Inventory).
3. **Program-wide** (aggregate Design System adoption %).

### 10.4 Coverage Integrity

Coverage figures must be derived from the same evidence used for findings. A coverage number with no underlying evidence list is invalid.

---

## SECTION 11 — DESIGN SYSTEM COVERAGE DEFINITION

A component is considered **consolidated** when **all** of the following hold:

1. **Adoption Coverage** meets its quality gate threshold (Section 12).
2. **No S0/S1 findings** are open against it.
3. **CSS compliance** — it is token-driven and CSS-first per its standard.
4. **Consistency** — typography, spacing, radius, shadow, motion, icon, and color conform.
5. **Responsive** — verified across desktop, tablet, mobile with no overflow defects.
6. **Accessibility** — meets the keyboard/focus/ARIA/label/role baseline.
7. **Feature flags** (if any) are in a correct, consistent, documented state.

The **Design System** is considered consolidated when every in-scope component meets the above and the program-wide aggregate satisfies the Exit Criteria.

---

## SECTION 12 — UI QUALITY GATES

Gates are pass/fail thresholds applied during later audits. The numeric targets below are governance defaults and may be tuned only via amendment.

| Gate | Dimension | Pass Condition |
|------|-----------|----------------|
| **QG-1** | Adoption Coverage | Per-component coverage ≥ 95%; no missed adoption on primary surfaces. |
| **QG-2** | CSS Compliance | Zero hardcoded values where a token exists; CSS-first; no unaccounted inline styles. |
| **QG-3** | Typography | 100% conformance to `MASTER_TYPOGRAPHY_V1.md`. |
| **QG-4** | Consistency | Spacing/radius/shadow/motion/icon/color conform to their standards. |
| **QG-5** | Responsive | No overflow or layout breakage on desktop/tablet/mobile. |
| **QG-6** | Accessibility | Keyboard reachable, visible focus, correct ARIA/labels/roles on interactive elements. |
| **QG-7** | Legacy | Zero legacy components in active use without a tracked exception. |
| **QG-8** | Feature Flags | All migration flags in a defined, consistent, documented state. |

A surface **passes** only when every applicable gate passes or every failure is an accepted, tracked S3/S4 exception.

---

## SECTION 13 — DELIVERABLES

The program produces governance and verification artifacts only. The expected artifact lineage (created in later steps, not here):

| Artifact | Purpose | Created In |
|----------|---------|------------|
| **This Roadmap** | Program governance (SSOT). | Step 01 (now) |
| **Audit Checklist** | Operational checklist derived from this roadmap. | Later step |
| **Coverage Baseline** | First measured adoption snapshot. | Later step |
| **Audit Reports** | Evidence-backed findings per domain. | Audit sprints |
| **Exception Register** | Tracked, accepted deviations (S3/S4). | Ongoing |
| **Consolidation Readiness Report** | Aggregate state vs Exit Criteria. | Pre-LOCK |
| **UI LOCK Declaration** | Formal lock record. | At LOCK |

> None of these are produced by this document. This section only defines what governance expects them to be.

---

## SECTION 14 — PROGRAM PHASES

The program proceeds through governed phases. Each phase has an entry and exit condition. Phases are governance stages, not sprint plans.

| Phase | Name | Purpose | Exit Condition |
|-------|------|---------|----------------|
| **P0** | Governance Baseline | Establish this roadmap. | This roadmap approved. |
| **P1** | Audit Framework | Derive checklist, severity, coverage tooling rules. | Framework approved against this roadmap. |
| **P2** | Coverage Baseline | Produce first measured adoption snapshot. | Baseline coverage recorded with evidence. |
| **P3** | Domain Audits | Audit each domain/screen against all dimensions. | All in-scope surfaces audited. |
| **P4** | Findings Consolidation | Classify, deduplicate, and prioritize findings. | All findings classified + severity-assigned. |
| **P5** | Gate Verification | Verify each component/screen against Quality Gates. | All gates evaluated; exceptions registered. |
| **P6** | Readiness Review | Compare aggregate state to Exit Criteria. | Readiness Report approved. |
| **P7** | UI LOCK | Declare and record UI LOCK. | LOCK criteria met and declared. |

> Remediation of in-scope deviations, if required, is authorized as separate steps under their own governance and is never assumed by this roadmap.

---

## SECTION 15 — EXIT CRITERIA

The program may move toward UI LOCK only when all of the following are true:

1. **Every in-scope component** has a measured coverage figure backed by evidence.
2. **No open S0 or S1 findings** remain anywhere in the in-scope surface.
3. **All Quality Gates (QG-1 … QG-8)** pass, or every failure is a registered, accepted S3/S4 exception.
4. **Zero legacy UI in active use** without an entry in the Exception Register.
5. **All migration feature flags** are in a defined, consistent, documented state.
6. **Coverage Baseline and Readiness Report** are produced and approved.
7. **Reviewer sign-off** confirms findings and coverage are reproducible.

---

## SECTION 16 — UI LOCK DEFINITION

### 16.1 What UI LOCK Means

**UI LOCK** is a formally declared state in which the UI surface is considered consolidated, consistent, and stable enough to freeze. In UI LOCK:

- The Design System is the only sanctioned way to build or alter UI.
- No new visual patterns, components, or styles may be introduced without amendment.
- Any UI change requires an explicit unlock or a governed exception.

### 16.2 Conditions To Enter UI LOCK

UI LOCK is entered only when:

1. **Section 15 Exit Criteria** are fully satisfied.
2. The **Program Owner** formally declares LOCK and records it in the UI LOCK Declaration.
3. The **Exception Register** contains only accepted S3/S4 items.

### 16.3 What UI LOCK Is Not

UI LOCK is not a code freeze of the whole product, not a ban on bug fixes, and not a permanent state — it is a governed UI-surface stability state that can be amended via Section 18.

---

## SECTION 17 — RISKS

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | "Migration complete" mistaken for "adoption complete." | High | High | Coverage measured, not assumed (Section 10). |
| R2 | Scope creep into refactoring/perf/logic. | High | High | Immutable Rules + Out Of Scope tagging (Sections 4, 6). |
| R3 | Subjective consistency calls. | Medium | Medium | Gates expressed as measurable thresholds (Section 12). |
| R4 | Hidden legacy UI not detected. | Medium | High | Dedicated Legacy Detection dimension (Section 5.6). |
| R5 | Feature flags left ambiguous. | Medium | Medium | Flag audit gate QG-8; no new flags allowed. |
| R6 | Findings without evidence. | Medium | High | Evidence + reproducibility standard (Section 8). |
| R7 | Premature UI LOCK. | Low | High | Owner-only declaration + Exit Criteria gate. |
| R8 | Governance drift across many sprints. | Medium | Medium | This roadmap is SSOT; amendments only via Section 18. |

---

## SECTION 18 — REVIEW PROCESS

### 18.1 Finding Review

Every finding is independently reviewed for evidence, correct severity, and scope tagging before it counts toward coverage or gates.

### 18.2 Coverage Review

Coverage figures are reviewed for integrity: each number must trace to its evidence set.

### 18.3 Amendment Process

This roadmap may be changed only by:

1. A written amendment proposal stating the change and rationale.
2. Program Owner approval.
3. A version bump in this document's header and a changelog entry (Section 21).

No sprint, audit, or report may silently override this roadmap.

---

## SECTION 19 — REPORTING STRATEGY

| Report | Cadence | Content |
|--------|---------|---------|
| **Coverage Snapshot** | Per phase | Per-component, per-domain, and aggregate coverage. |
| **Findings Report** | Per audit sprint | Evidence-backed findings with severity + scope tags. |
| **Gate Status** | Per phase | Pass/fail per QG-1 … QG-8. |
| **Exception Register** | Continuous | All accepted S3/S4 deviations. |
| **Readiness Report** | Pre-LOCK | Aggregate state vs Exit Criteria. |
| **UI LOCK Declaration** | Once | Formal lock record + sign-off. |

All reports are evidence-traceable and stored under `/Master-design/`. Reports describe state; they never authorize source changes.

---

## SECTION 20 — SUCCESS METRICS

| Metric | Target |
|--------|--------|
| Program-wide Design System adoption | ≥ 95% measured coverage |
| Open S0 findings | 0 |
| Open S1 findings | 0 |
| Legacy UI in active use (untracked) | 0 |
| Quality Gates passing (QG-1 … QG-8) | 100% pass or accepted exception |
| Migration feature flags in defined state | 100% |
| Coverage figures backed by evidence | 100% |
| Reviewer reproducibility of findings | 100% |
| UI LOCK declared | Yes (end-state) |

---

## SECTION 21 — CHANGELOG

| Version | Date | Change | Author |
|---------|------|--------|--------|
| 1.0 | 2026-06-25 | Initial governance baseline for the UI Consolidation Program. | UI Quality Engineering |
| 1.1 | 2026-06-25 | Controlled governance upgrade (Conditional Approval follow-up). Added Audit Independence Policy (Section 7.4) and three new governance sections: Audit Universe / Surface Inventory (22), Design System Applicability Matrix (23), and Glossary & Definitions (24). No existing section was rewritten, removed, or renumbered. | UI Quality Engineering |

---

## SECTION 22 — AUDIT UNIVERSE / SURFACE INVENTORY

### 22.1 Purpose

This section defines how the **complete auditable UI surface** is established *before* any audit begins. No audit, coverage figure, or gate evaluation is valid unless it is measured against an established Audit Universe. This inventory is the **denominator** of every coverage metric defined in Section 10.

### 22.2 Authoritative UI Inventory

The **Authoritative UI Inventory** is the single, agreed enumeration of every UI surface (page, screen, modal, panel, form, table, and control region) that exists in the product and is subject to this program. It is the canonical list against which adoption, legacy, and coverage are judged. A surface that is not in the inventory cannot be audited, and a surface in the inventory cannot be silently excluded.

### 22.3 Audit Universe

The **Audit Universe** is the Authoritative UI Inventory **scoped to this program's dimensions** (Section 5) and reduced to only those surfaces that are in scope (Section 6 exclusions removed). The Audit Universe is the definitive set of auditable surfaces for a given coverage cycle.

### 22.4 Auditable Surface Definition

A surface qualifies as an **auditable surface** when it is:

- A discrete, identifiable UI region with a known location (file path / route / component);
- In active use or reachable in the product (not dead/removed code); and
- In scope per Section 5 and not excluded per Section 6.

Surfaces that do not meet this definition are recorded but marked non-auditable, with a reason.

### 22.5 Versioned Inventory

The Audit Universe is **versioned and frozen** per coverage cycle. Each coverage calculation references the exact inventory version it was computed against. When the inventory changes, a new version is issued; prior coverage figures remain bound to the inventory version under which they were produced. This prevents a moving denominator from invalidating historical coverage.

### 22.6 Ownership

The Audit Universe is **owned by the Program Owner** and curated with the Design System Steward. Additions, removals, and version increments to the inventory are governance actions, not audit actions, and follow the Amendment Process (Section 18.3) where they affect program scope.

### 22.7 Relationship With Coverage Calculation

Coverage (Section 10) is meaningless without a frozen Audit Universe. Therefore:

- **Coverage must never be calculated without a frozen Audit Universe.**
- The Audit Universe supplies the denominator; findings supply the numerator and the non-compliant/missed-adoption terms.
- A coverage figure must cite the inventory version it was measured against, or it is invalid.

---

## SECTION 23 — DESIGN SYSTEM APPLICABILITY MATRIX

### 23.1 Purpose

This section governs **where each Design System component is expected to be used**. It exists to remove subjective, per-auditor judgement such as *"Should this screen use `DataGrid`?"* Applicability is a governed fact, not an opinion.

### 23.2 Applicability Levels

For any (component, surface-type) pair, applicability is classified into exactly one level:

| Level | Meaning |
|-------|---------|
| **Mandatory** | The component **must** be used on this surface type. Absence is a missed adoption (Section 10.2). |
| **Recommended** | The component **should** be used; deviation requires justification and is a tracked exception if unmet. |
| **Optional** | The component **may** be used; either choice is compliant. |
| **Not Applicable** | The component does **not** apply to this surface type; its absence is never a finding. |

### 23.3 Governed By Matrix, Not Opinion

The roadmap establishes that **applicability is determined by the Applicability Matrix, not by auditor opinion.** During audits:

- Auditors read the applicability level from the matrix before judging adoption.
- A surface is only a missed adoption where the matrix marks the component **Mandatory** (or **Recommended** and unjustified).
- Disputes over applicability are resolved by the Design System Steward (Section 7.2), not by the individual auditor.

### 23.4 Scope Of This Section

This section defines **only the governance** of applicability. It does **not** create, populate, or assert the actual matrix contents. The matrix itself is a separate artifact produced in a later step and must conform to the levels and rules defined here.

---

## SECTION 24 — GLOSSARY & DEFINITIONS

### 24.1 Purpose

This section provides the **formal, authoritative definitions** for governance terminology used across this roadmap and all later program artifacts. Future audit documents, checklists, and reports **must reference these definitions** and must not redefine these terms locally.

### 24.2 Definitions

| Term | Definition |
|------|------------|
| **Primary Surface** | A high-visibility, high-traffic UI surface central to a core workflow (e.g. a main page or a primary modal). Adoption failures here carry elevated severity. |
| **Secondary Surface** | A supporting or lower-traffic UI surface that is not central to a core workflow. In scope, but weighted below primary surfaces. |
| **Legacy UI** | UI that predates or bypasses the Design System and should already have been replaced by a standardized component or standard. |
| **Active Use** | A surface or component that is reachable and used in the running product, as opposed to dead, removed, or unreferenced code. |
| **Missed Adoption** | A surface that, per the Applicability Matrix (Section 23), should use a standardized component but uses legacy or adhoc UI instead. |
| **Audit Universe** | The frozen, versioned set of in-scope auditable surfaces that forms the denominator of all coverage calculations (Section 22). |
| **Coverage** | The measured proportion of places a component is used correctly relative to all places it should be used, per the formula in Section 10.2. |
| **Coverage Baseline** | The first measured coverage snapshot for the program, against a specific Audit Universe version (Sections 13, 14 P2). |
| **Design System Coverage** | Aggregate, program-wide coverage of the Design System across all in-scope components and surfaces. |
| **Exception** | A deviation from the Design System or a gate that is not (yet) resolved. |
| **Tracked Exception** | An Exception that has been formally recorded in the Exception Register with severity and owner; only accepted S3/S4 items may persist into UI LOCK. |
| **UI Drift** | Divergence of the UI from the Design System standards over time, in the absence of governance. |
| **UI LOCK** | The formally declared, governed stability state in which the Design System is the only sanctioned way to build or alter UI (Section 16). |
| **Compliance** | Conformance of a surface or component to the relevant `MASTER_*` standard. |
| **Deviation** | Any measured non-conformance to a standard; every deviation carries a severity (Section 9) and is either fixed under separate authorization or recorded as a Tracked Exception. |

### 24.3 Deferred Terminology

Terminology for deferred mechanisms — escalation workflow, exception lifecycle, version pinning, operational KPIs, sampling strategy, evidence storage, and unlock workflow — is intentionally **not** defined in Version 1.1. These are reserved for later roadmap versions.

---

> **End of Governance Document.** This roadmap governs the UI Consolidation Program. It does not implement, audit, or modify anything. All later audit and consolidation artifacts must conform to the rules defined here.
