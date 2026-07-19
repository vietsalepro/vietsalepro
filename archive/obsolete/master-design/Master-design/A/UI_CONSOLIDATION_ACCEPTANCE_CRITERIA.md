# UI CONSOLIDATION ACCEPTANCE CRITERIA — VietSale Pro v7

> **Version:** 1.0
> **Date:** 2026-06-25
> **Document Type:** Governance (Quality Judgement Layer)
> **Program:** UI Consolidation Program
> **Derived From:** `UI_CONSOLIDATION_MASTER_ROADMAP.md` (Version 1.1 — FROZEN)
> **Single Source of Truth:** `UI_CONSOLIDATION_MASTER_ROADMAP.md`
> **Status:** ACTIVE — Acceptance Baseline
> **Owner:** UI Quality Engineering / Design System Governance

---

## DOCUMENT CONTRACT

This document is **governance only**. It defines **how quality is judged** in the UI Consolidation Program. It does not define how the program operates — that is governed exclusively by `UI_CONSOLIDATION_MASTER_ROADMAP.md` (the "Master Roadmap").

This document:

- Derives **every** rule from the Master Roadmap. It introduces **no new governance**, **no new scope**, **no new severities**, **no new gates**, **no new feature flags**, and **no new coverage model**.
- Is **not** an Audit Checklist, an Audit Template, a Report Template, an Audit Report, a Sprint Plan, a Remediation Plan, a Fix Strategy, an Implementation Guide, or Source Code Guidance. Those artifacts are produced in later, separate steps and must conform to both the Master Roadmap and these criteria.
- Does **not** modify or authorize any change to source code, TSX, CSS, business logic, API, validation, routing, workflow, state, or feature flags.

If any later artifact conflicts with this document, this document governs **acceptance**. If this document ever conflicts with the Master Roadmap, **the Master Roadmap wins** (per Roadmap Section 7.1 Authority Hierarchy and the Document Contract therein), and this document must be corrected through the Amendment Process (Roadmap Section 18.3).

---

## SECTION 1 — PURPOSE

### 1.1 What This Document Decides

This document defines, objectively and reproducibly, **exactly when** each of the following is judged **PASS** or **FAIL**:

- A **standardized component**.
- A **UI surface** (screen, page, modal, panel, form, table, control region).
- A **domain**.
- The **entire UI Consolidation Program** (UI LOCK readiness).

### 1.2 Why It Exists

The Master Roadmap establishes *how the program works* — its objectives, principles, immutable rules, scope, severities, coverage model, gates, phases, and exit criteria. It does not, by itself, state the precise pass/fail line an auditor applies at the moment of judgement.

This document supplies that line. It converts the Roadmap's gates, severities, and exit criteria into **measurable acceptance rules** so that **every auditor reviewing the same surface reaches the same conclusion** (Roadmap G2, G3; Risk R3 mitigation).

### 1.3 What It Deliberately Does Not Do

It does not perform audits, produce findings, produce coverage numbers, plan remediation, or recommend fixes. It states only the conditions under which a result — once produced elsewhere — is accepted as PASS or rejected as FAIL.

---

## SECTION 2 — RELATIONSHIP TO MASTER ROADMAP

### 2.1 Authority

The Master Roadmap is the Single Source of Truth. This document sits beneath it in the authority hierarchy (Roadmap Section 7.1):

```
UI_CONSOLIDATION_MASTER_ROADMAP.md            (governs the program — SSOT)
            ↓
UI_CONSOLIDATION_ACCEPTANCE_CRITERIA.md       (this document — governs PASS/FAIL judgement)
            ↓
/Master-design/ MASTER_* standards            (define UI correctness)
            ↓
Audit artifacts produced in later steps        (must conform to both)
```

### 2.2 Traceability Rule

Every acceptance rule in this document **must trace** to a clause in the Master Roadmap. The cross-reference is mandatory and is shown inline (e.g. "Roadmap QG-1", "Roadmap Section 15", "Roadmap S1"). A rule that cannot be traced to the Roadmap is invalid and must be removed by amendment.

### 2.3 No Expansion Rule

This document **must not**:

- Add or alter program objectives (Roadmap Section 2).
- Add or alter scope (Roadmap Sections 5, 6).
- Add, remove, or re-weight severities (Roadmap Section 9).
- Add or change Quality Gates (Roadmap Section 12).
- Redefine the Coverage Model or its formula (Roadmap Section 10).
- Introduce feature flags (Roadmap Immutable Rule 2).
- Redefine UI LOCK (Roadmap Section 16).

It only states the **acceptance thresholds and evidence conditions** that operationalize those existing rules.

---

## SECTION 3 — EVALUATION PHILOSOPHY

These principles are inherited directly from the Roadmap's Guiding Principles (Section 3) and Audit Methodology (Section 8).

| # | Principle | Acceptance Meaning | Roadmap Source |
|---|-----------|--------------------|----------------|
| EP1 | **Evidence over opinion** | No PASS or FAIL is valid without evidence. | G2, Section 8.4 |
| EP2 | **Measurable or it didn't happen** | Every criterion resolves to a number or a defined binary gate. | G3, Section 12 |
| EP3 | **Reproducible** | An independent Reviewer following the same steps must reach the same verdict. | Section 8.5 |
| EP4 | **Standard is the truth** | Compliance is judged against the relevant `MASTER_*` standard, not auditor taste. | G4, G8 |
| EP5 | **Severity decides weight** | The severity of a deviation — not its fix effort — determines whether it blocks. | G5, Section 9 |
| EP6 | **No silent drift** | Any deviation is either fixed under separate authorization or a Tracked Exception. | G6, Section 24.2 |
| EP7 | **Bounded judgement** | Out-of-scope items (Roadmap Section 6) are never a PASS/FAIL factor; they are tagged and handed off. | Section 6 |

---

## SECTION 4 — PASS / FAIL PRINCIPLES

### 4.1 The Binary Rule

Every acceptance evaluation resolves to exactly one of two outcomes: **PASS** or **FAIL**. There is no partial pass. A "mostly compliant" surface is **FAIL** unless every open deviation is an accepted, registered S3/S4 Tracked Exception (Roadmap Section 12 closing rule; Section 15.3).

### 4.2 The Severity-Gated Rule

PASS/FAIL is governed by severity (Roadmap Section 9):

- Any open **S0** or **S1** finding on the unit under evaluation forces **FAIL**. (Roadmap Section 9 — S0/S1 "Blocks LOCK"; Section 15.2.)
- **S2** findings force **FAIL** unless the applicable gate explicitly tolerates them as tracked and gated. (Roadmap Section 9 — S2 "Must be tracked; gated".)
- **S3** findings are permitted **only** as accepted Tracked Exceptions in the Exception Register. (Roadmap Section 9 — S3 "Allowed as tracked exception".)
- **S4** findings do not affect PASS/FAIL. (Roadmap Section 9 — S4 "Does not block LOCK".)

### 4.3 The Evidence Precondition

A PASS or FAIL verdict is only **valid** when it cites evidence (Section 5). A verdict without evidence is not "PASS by default" and not "FAIL by default" — it is **invalid** and must be re-evaluated (Roadmap Section 8.4; Decision Rule in Section 7.3).

### 4.4 The Applicability Precondition

Before any adoption-related PASS/FAIL judgement, the auditor must read the applicability level for the (component, surface-type) pair from the Applicability Matrix (Roadmap Section 23). Absence of a **Not Applicable** component is never a FAIL (Roadmap Section 23.2). PASS/FAIL for adoption applies only where applicability is **Mandatory** or unjustified **Recommended** (Roadmap Section 23.3).

### 4.5 The Frozen-Universe Precondition

No coverage-based PASS/FAIL is valid unless it was measured against a frozen, versioned Audit Universe (Roadmap Section 22.7). A coverage verdict that does not cite its inventory version is invalid.

---

## SECTION 5 — EVIDENCE REQUIREMENTS

### 5.1 Mandatory Evidence Fields

Every PASS and every FAIL must carry evidence meeting the Roadmap Evidence Standard (Section 8.4). To be accepted, evidence must include:

| Field | Requirement | Roadmap Source |
|-------|-------------|----------------|
| **Location** | File path and line range (or route + component) of the surface/component. | Section 8.4 |
| **Standard clause** | The specific `MASTER_*` standard clause satisfied or violated. | Section 8.4, G8 |
| **Classification** | Compliant / Deviation. | Section 8.3 |
| **Severity** | One of S0–S4 (Roadmap Section 9). Mandatory. | Section 9, Immutable Rule 5 |
| **Scope tag** | IN-SCOPE or OUT-OF-SCOPE. | Section 7.3, Section 6 |
| **Coverage contribution** | Whether it counts as compliant / non-compliant / missed adoption. | Section 10.2 |

### 5.2 Evidence Sufficiency Rule

Opinion alone is **never** sufficient for PASS or FAIL (Roadmap G2). A statement such as "looks consistent" or "seems fine" is rejected. Acceptance requires the concrete location and the standard clause it is judged against.

### 5.3 Evidence Integrity Rule

A coverage figure used in an acceptance decision must trace to the same evidence set used for findings (Roadmap Section 10.4). A coverage number with no underlying evidence list is invalid and cannot support PASS or FAIL.

### 5.4 Reviewer Reproducibility Rule

A verdict is accepted only if an independent Reviewer can reproduce it from the cited evidence (Roadmap Section 8.5, AI-3). Non-reproducible verdicts are invalid regardless of their stated outcome.

---

## SECTION 6 — COMPONENT ACCEPTANCE CRITERIA

### 6.1 Scope Of This Section

This section defines **PASS conditions only** for the standardized components governed by the Roadmap (Section 5.1). It does **not** define implementation. A component is judged solely against its corresponding `MASTER_*` standard and the Roadmap's gates and severities.

### 6.2 Universal Component PASS Definition

A standardized component is judged **PASS** when **all** conditions of the Roadmap "consolidated component" definition (Section 11) hold:

1. **Adoption Coverage** meets its quality gate threshold (Roadmap QG-1, Section 12).
2. **No open S0/S1 findings** against it (Roadmap Section 11.2, Section 9).
3. **CSS compliance** — token-driven and CSS-first per its standard (Roadmap QG-2, Section 11.3).
4. **Consistency** — typography, spacing, radius, shadow, motion, icon, and color conform (Roadmap QG-3, QG-4, Section 11.4).
5. **Responsive** — verified across desktop, tablet, mobile with no overflow defects (Roadmap QG-5, Section 11.5).
6. **Accessibility** — meets the keyboard/focus/ARIA/label/role baseline (Roadmap QG-6, Section 11.6).
7. **Feature flags** (if any) are in a correct, consistent, documented state (Roadmap QG-8, Section 11.7).

A component **FAILS** when any one of the above is not satisfied and the failure is not an accepted, tracked S3/S4 exception (Roadmap Section 12 closing rule).

### 6.3 Per-Component Acceptance Anchors

Each component is judged against its named standard (Roadmap Section 5.1). The component PASSES only when the Universal Component PASS Definition (6.2) is met **and** the cited standard's clauses are satisfied with evidence.

| Component | Acceptance Anchor (`MASTER_*` standard) |
|-----------|------------------------------------------|
| `ActionButton` | `MASTER_ACTION_BUTTON_STANDARD_V1.md` |
| `TextInput` | `MASTER_INPUT_STANDARD_V1.md` |
| `SelectInput` | `MASTER_INPUT_STANDARD_V1.md` |
| `FormField` | `MASTER_FORM_STANDARD.md` |
| `SectionBox` | `MASTER_SECTION_BOX_STANDARD_V1.md` |
| `StatusBadge` | `MASTER_STATUS_BADGE_STANDARD.md` |
| `NotificationSystem` | `MASTER_NOTIFICATION_STANDARD.md` |
| `Picker` | `MASTER_PICKER_STANDARD_V1.md` |
| `MasterModal` | `MASTER_MODAL_BLUEPRINT_V1.md` |
| `DataGrid` | `MASTER_DATA_GRID_STANDARD_V1.md` |
| `AppShell` | `MASTER_APP_SHELL_STANDARD.md` |
| `SplitPane` | `MASTER_SPLIT_PANE_STANDARD_V1.md` |
| `Dashboard` | `MASTER_DASHBOARD_STANDARD.md` |
| `Tabs` | `MASTER_TABS_STANDARD_V1.md` |
| **Every other standardized component created during the UI Migration Program** | Its corresponding `MASTER_*` standard (Roadmap Section 5.1). |

### 6.4 Component Acceptance Notes

- The list above is the Roadmap's own enumeration (Section 5.1). The "every other standardized component" clause means no standardized component is exempt from acceptance.
- Where a component has **no** feature flag, criterion 6.2(7) is satisfied by default (vacuously true); it is not a FAIL to lack a flag.
- Applicability per surface is governed by the Applicability Matrix (Roadmap Section 23), not by this section.

---

## SECTION 7 — CSS ACCEPTANCE CRITERIA

These criteria operationalize Roadmap Scope 5.2 and gates QG-2, QG-3.

| ID | Dimension | PASS Condition | FAIL Condition | Roadmap Source |
|----|-----------|----------------|----------------|----------------|
| CSS-1 | **CSS First** | Styling lives in CSS per the component standard; no styling responsibility is placed inline. | Styling that should be in CSS is implemented inline without being accounted for. | 5.2, QG-2 |
| CSS-2 | **Component CSS** | Each component's CSS is organized per its `MASTER_*` standard. | CSS organization deviates from the standard. | 5.2 |
| CSS-3 | **Design Tokens** | Color, size, and spacing values derive from tokens in `MASTER_DESIGN_TOKENS_V1.md`. | A value is hardcoded where a token exists. | 5.2, QG-2 |
| CSS-4 | **Inline Style** | Inline styles are zero or each is explicitly accounted for. | An unaccounted inline style is present. | 5.2, QG-2 |
| CSS-5 | **Hardcoded values** | Zero hardcoded values where a token exists. | Any hardcoded color/size/spacing where a token exists. | QG-2 |
| CSS-6 | **Typography** | 100% conformance to `MASTER_TYPOGRAPHY_V1.md`. | Any typography deviation from the standard. | QG-3, 5.2 |

**CSS Acceptance Rule:** The CSS dimension PASSES only when CSS-1 … CSS-6 all pass, or each failure is an accepted, tracked S3/S4 exception (Roadmap Section 12). Typography (CSS-6 / QG-3) requires **100%** conformance and admits no numeric tolerance.

---

## SECTION 8 — RESPONSIVE ACCEPTANCE CRITERIA

These criteria operationalize Roadmap Scope 5.3 and gate QG-5.

| ID | Dimension | PASS Condition | FAIL Condition | Roadmap Source |
|----|-----------|----------------|----------------|----------------|
| RSP-1 | **Desktop** | Layout renders correctly on desktop with no breakage. | Layout breakage on desktop. | 5.3, QG-5 |
| RSP-2 | **Tablet** | Layout renders correctly on tablet with no breakage. | Layout breakage on tablet. | 5.3, QG-5 |
| RSP-3 | **Mobile** | Layout renders correctly on mobile with no breakage. | Layout breakage on mobile. | 5.3, QG-5 |
| RSP-4 | **Overflow** | No content overflow defects on any breakpoint. | Any overflow defect. | 5.3, QG-5 |
| RSP-5 | **Layout integrity** | Layout remains consistent across breakpoints. | Inconsistent layout across breakpoints. | 5.3, QG-5 |

**Responsive Acceptance Rule:** The responsive dimension PASSES only when there is **no overflow or layout breakage on desktop, tablet, and mobile** (Roadmap QG-5), verified with evidence per breakpoint. Any breakage is FAIL unless registered as an accepted S3/S4 exception.

---

## SECTION 9 — ACCESSIBILITY ACCEPTANCE CRITERIA

These criteria operationalize Roadmap Scope 5.4 and gate QG-6. They apply to interactive elements.

| ID | Dimension | PASS Condition | FAIL Condition | Roadmap Source |
|----|-----------|----------------|----------------|----------------|
| A11Y-1 | **Keyboard** | All interactive elements are keyboard reachable. | Any interactive element unreachable by keyboard. | 5.4, QG-6 |
| A11Y-2 | **Focus** | Focus is visible on interactive elements. | Missing or invisible focus state. | 5.4, QG-6 |
| A11Y-3 | **Labels** | Interactive elements have correct labels. | Missing or incorrect labels. | 5.4, QG-6 |
| A11Y-4 | **Roles** | Correct roles are present. | Missing or incorrect roles. | 5.4, QG-6 |
| A11Y-5 | **ARIA** | Correct ARIA attributes are present where required. | Missing or incorrect ARIA where required. | 5.4, QG-6 |

**Accessibility Acceptance Rule:** The accessibility dimension PASSES only when interactive elements are keyboard reachable, have visible focus, and carry correct ARIA, labels, and roles (Roadmap QG-6). This is the defined baseline; this document does not raise or lower it.

---

## SECTION 10 — UI CONSISTENCY ACCEPTANCE CRITERIA

These criteria operationalize Roadmap Scope 5.5 and gates QG-3, QG-4.

| ID | Dimension | PASS Condition | FAIL Condition | Roadmap Source |
|----|-----------|----------------|----------------|----------------|
| CON-1 | **Typography** | 100% conformance to `MASTER_TYPOGRAPHY_V1.md`. | Any typography deviation. | QG-3 |
| CON-2 | **Colors** | Colors conform to their standard and tokens. | Non-conforming or hardcoded color. | QG-4, 5.2 |
| CON-3 | **Spacing** | Spacing conforms to its standard. | Non-conforming spacing. | QG-4 |
| CON-4 | **Radius** | Border radius conforms to its standard. | Non-conforming radius. | QG-4 |
| CON-5 | **Motion** | Motion conforms to `MASTER_MOTION_ANIMATION_STANDARD_V1.md`. | Non-conforming motion. | QG-4, 5.5 |
| CON-6 | **Shadows** | Shadow/elevation conforms to `MASTER_ELEVATION_ZINDEX_STANDARD_V1.md`. | Non-conforming shadow/elevation. | QG-4, 5.5 |
| CON-7 | **Icons** | Icons conform to `MASTER_ICON_STANDARD_V1.md`. | Non-conforming icon usage. | QG-4, 5.5 |
| CON-8 | **Component behavior** | Component behavior conforms to its `MASTER_*` standard. | Behavior deviates from the standard. | QG-4, 5.5 |

**UI Consistency Acceptance Rule:** Consistency PASSES only when CON-1 … CON-8 conform to their standards (Roadmap QG-3, QG-4). Typography requires 100% (no tolerance). Other consistency dimensions PASS when they conform or each deviation is an accepted, tracked S3/S4 exception.

---

## SECTION 11 — LEGACY UI ACCEPTANCE CRITERIA

These criteria operationalize Roadmap Scope 5.6, gate QG-7, and definitions in Section 24.2.

### 11.1 Definitions Used

- **Legacy UI** — UI that predates or bypasses the Design System and should already have been replaced (Roadmap Section 24.2).
- **Active Use** — reachable and used in the running product (Roadmap Section 24.2).
- **Tracked Exception** — a deviation formally recorded in the Exception Register with severity and owner (Roadmap Section 24.2).

### 11.2 Legacy Acceptance States

| State | Condition | Verdict | Roadmap Source |
|-------|-----------|---------|----------------|
| **Acceptable** | Legacy UI **not** in active use, or legacy UI in active use that is a registered, accepted S3/S4 Tracked Exception. | PASS | QG-7, Section 9 (S3), Section 15.4 |
| **Violation** | Legacy UI in active use **without** a Tracked Exception. | FAIL | QG-7, Section 15.4 |
| **Tracked Exception** | Legacy UI in active use that is recorded in the Exception Register at accepted S3/S4. | PASS (conditionally) | Section 16.3, Section 24.2 |

### 11.3 Legacy Acceptance Rule

The legacy dimension PASSES only when there are **zero legacy components in active use without a tracked exception** (Roadmap QG-7, Section 15.4). Legacy UI in active use that is **not** tracked is a FAIL and, where it bypasses a standardized component on a primary surface, is classified **S1** (Roadmap Section 9) and therefore blocks LOCK.

---

## SECTION 12 — FEATURE FLAG ACCEPTANCE CRITERIA

These criteria operationalize Roadmap Scope 5.7, Immutable Rule 2, and gate QG-8.

### 12.1 No New Flags

This document **introduces no feature flags** (Roadmap Immutable Rule 2). Acceptance applies only to the **existing** feature flags created during the UI Migration Program.

### 12.2 Feature Flag PASS Definition

| ID | Condition | PASS | FAIL | Roadmap Source |
|----|-----------|------|------|----------------|
| FF-1 | **Defined state** | Every migration flag is in a defined (non-ambiguous) state. | Flag in ambiguous/contradictory state. | QG-8, Section 15.5 |
| FF-2 | **Consistent** | Flag usage is consistent across surfaces. | Inconsistent usage of the same flag. | QG-8 |
| FF-3 | **Documented** | The flag's state is documented. | Undocumented flag state. | QG-8, Section 15.5 |

**Feature Flag Acceptance Rule:** The feature-flag dimension PASSES only when **all** migration flags are in a defined, consistent, documented state (Roadmap QG-8, Section 15.5). 100% of migration flags must meet this (Roadmap Section 20 success metric).

---

## SECTION 13 — COVERAGE ACCEPTANCE CRITERIA

This section states **PASS conditions** using the Roadmap Coverage Model. It does **not** redefine that model (Roadmap Section 10 governs the formula and granularity).

### 13.1 Coverage Is Read, Not Redefined

Coverage is computed per the Roadmap formula (Section 10.2) at the three granularities of Section 10.3 (per component, per screen/domain, program-wide). This document only states when a coverage figure is **accepted as PASS**.

### 13.2 When 95% Is Acceptable

A coverage figure of **≥ 95%** is the acceptance threshold for **Adoption Coverage** under gate QG-1, **provided** there is **no missed adoption on primary surfaces** (Roadmap QG-1; "Primary Surface" per Section 24.2). The program-wide success target is also **≥ 95% measured coverage** (Roadmap Section 20).

So **95% is acceptable** for adoption when:

1. Per-component coverage is ≥ 95% (Roadmap QG-1), **and**
2. There is zero missed adoption on any primary surface (Roadmap QG-1).

### 13.3 When 100% Is Required

**100% is required** — no numeric tolerance — for the dimensions the Roadmap states as absolute:

- **Typography** — 100% conformance to `MASTER_TYPOGRAPHY_V1.md` (Roadmap QG-3).
- **Open S0 findings** — must be 0 (Roadmap Section 20, Section 15.2).
- **Open S1 findings** — must be 0 (Roadmap Section 20, Section 15.2).
- **Untracked legacy UI in active use** — must be 0 (Roadmap QG-7, Section 20).
- **Quality Gates passing** — 100% pass or accepted exception (Roadmap Section 20).
- **Migration feature flags in defined state** — 100% (Roadmap Section 20).
- **Coverage figures backed by evidence** — 100% (Roadmap Section 20, Section 10.4).
- **Reviewer reproducibility of findings** — 100% (Roadmap Section 20, Section 8.5).

### 13.4 How Coverage Is Interpreted For Acceptance

- A coverage figure is accepted only if it cites the **frozen Audit Universe version** it was measured against (Roadmap Section 22.7). Otherwise it is invalid.
- A coverage figure is accepted only if it traces to its **evidence set** (Roadmap Section 10.4).
- Coverage at or above QG-1 with an open S0/S1 finding is still **FAIL** for the unit, because severity gating (Section 4.2) overrides the numeric threshold.

### 13.5 Coverage Acceptance Rule

Adoption Coverage PASSES at **≥ 95% with no primary-surface missed adoption** (QG-1). The dimensions in 13.3 PASS only at **100%**. No coverage verdict is valid without a cited Audit Universe version and a traceable evidence set.

---

## SECTION 14 — SEVERITY ACCEPTANCE CRITERIA

This section states how each severity affects acceptance. It uses the Roadmap severities exactly (Section 9) and adds no new ones.

| Severity | Roadmap Definition | Acceptance Effect | Roadmap Source |
|----------|--------------------|--------------------|----------------|
| **S0 — Blocker** | Breaks core UI integrity or contradicts an Immutable Rule. | Any open S0 ⇒ **FAIL**. Blocks LOCK. | Section 9, 15.2 |
| **S1 — Critical** | Legacy UI in active use, or standardized component bypassed on a primary surface. | Any open S1 ⇒ **FAIL**. Blocks LOCK. | Section 9, 15.2 |
| **S2 — Major** | Token/typography/consistency violation visible to users. | Open S2 ⇒ **FAIL** unless tracked and gated. Must be tracked. | Section 9, 12 |
| **S3 — Minor** | Localized inconsistency, limited impact. | Permitted **only** as an accepted Tracked Exception; otherwise **FAIL**. | Section 9, 12, 16.3 |
| **S4 — Cosmetic / Info** | Negligible or stylistic note. | Does **not** affect PASS/FAIL; does not block LOCK. | Section 9 |

**Severity Acceptance Rule:** Every finding entering an acceptance decision must carry a severity (Roadmap Immutable Rule 5). An unclassified finding is invalid and the acceptance decision cannot be made until it is classified. Severity — not fix effort — determines blocking weight (Roadmap G5, Section 9).

---

## SECTION 15 — EXCEPTION HANDLING

This section states how exceptions affect acceptance. It uses the Roadmap exception model (Sections 9, 16.3, 24.2) and adds nothing.

### 15.1 What May Persist

Only **accepted S3/S4 items recorded in the Exception Register** may persist into a PASS verdict and into UI LOCK (Roadmap Section 16.3, Section 12 closing rule).

### 15.2 What May Never Persist

- Open **S0** or **S1** findings may never persist into a PASS verdict (Roadmap Section 9, Section 15.2).
- **S2** findings may persist only where the applicable gate explicitly tolerates them as tracked and gated; otherwise they force FAIL (Roadmap Section 9).
- **Untracked** deviations may never persist; "no silent drift" (Roadmap G6).

### 15.3 Exception Validity Conditions

A Tracked Exception is accepted into a PASS decision only when it is:

1. Recorded in the **Exception Register** (Roadmap Section 13, Section 19).
2. Assigned a **severity** (S3 or S4 for persistence) and an **owner** (Roadmap Section 24.2 "Tracked Exception").
3. Backed by **evidence** like any other finding (Roadmap Section 8.4).

### 15.4 Exception Acceptance Rule

A surface or component with open deviations PASSES **only** when every such deviation is an accepted, registered S3/S4 Tracked Exception (Roadmap Section 12 closing rule, Section 16.3). Any open S0/S1/S2 not satisfying 15.2 forces FAIL.

---

## SECTION 16 — DOMAIN ACCEPTANCE

A **domain** is a screen/domain grouping for which coverage is reported (Roadmap Section 10.3).

### 16.1 Domain PASS Definition

A domain is judged **PASS** when **all** of the following hold:

1. **Every auditable surface** in the domain (per the frozen Audit Universe, Roadmap Section 22) has been audited across all seven scope dimensions (Roadmap Section 8.1).
2. **Every surface** in the domain individually PASSES (Section 17 below).
3. **Per-domain coverage** meets QG-1 (≥ 95% adoption, no primary-surface missed adoption) (Roadmap QG-1, Section 10.3).
4. **No open S0/S1 findings** remain in the domain (Roadmap Section 15.2).
5. **All applicable Quality Gates pass** for the domain, or each failure is an accepted S3/S4 exception (Roadmap Section 12, Section 15.3).

### 16.2 Domain FAIL Definition

A domain **FAILS** when any in-scope surface is unaudited, any surface FAILs, per-domain coverage is below QG-1, any open S0/S1 exists, or any gate fails without an accepted exception.

---

## SECTION 17 — SURFACE (SCREEN) ACCEPTANCE

A **surface** is an auditable UI region (page, screen, modal, panel, form, table, control region) per Roadmap Section 22.4.

### 17.1 Surface PASS Definition

A surface is judged **PASS** when, for every component the Applicability Matrix marks **Mandatory** or unjustified **Recommended** on that surface type (Roadmap Section 23):

1. Every applicable Quality Gate (QG-1 … QG-8) passes, **or** each failure is an accepted, tracked S3/S4 exception (Roadmap Section 12 closing rule).
2. There are **no open S0/S1 findings** on the surface (Roadmap Section 9, Section 15.2).
3. Adoption on the surface shows **no missed adoption** where the matrix marks the component Mandatory (Roadmap QG-1, Section 23.2).
4. CSS (Section 7), Responsive (Section 8), Accessibility (Section 9), Consistency (Section 10), Legacy (Section 11), and Feature Flag (Section 12) acceptance rules all PASS for the surface.

### 17.2 Surface FAIL Definition

A surface **FAILS** when any applicable gate fails without an accepted exception, any open S0/S1 exists, a Mandatory component is a missed adoption, or any dimension acceptance rule fails.

---

## SECTION 18 — PASS DECISION RULES

The following are the authoritative PASS rules. Each unit PASSES only when **all** of its conditions hold, with evidence.

### 18.1 Component PASS

A component PASSES when the Universal Component PASS Definition (Section 6.2 / Roadmap Section 11) holds and its `MASTER_*` standard clauses are satisfied with evidence.

### 18.2 Surface PASS

A surface PASSES per Section 17.1.

### 18.3 Domain PASS

A domain PASSES per Section 16.1.

### 18.4 Program PASS (UI LOCK Readiness)

The program PASSES — i.e. is ready for UI LOCK — only when **all** Roadmap Exit Criteria (Section 15) are satisfied:

1. Every in-scope component has a measured coverage figure backed by evidence (Roadmap 15.1).
2. No open S0 or S1 findings remain anywhere in the in-scope surface (Roadmap 15.2).
3. All Quality Gates (QG-1 … QG-8) pass, or every failure is a registered, accepted S3/S4 exception (Roadmap 15.3).
4. Zero legacy UI in active use without an Exception Register entry (Roadmap 15.4).
5. All migration feature flags are in a defined, consistent, documented state (Roadmap 15.5).
6. Coverage Baseline and Readiness Report are produced and approved (Roadmap 15.6).
7. Reviewer sign-off confirms findings and coverage are reproducible (Roadmap 15.7).

UI LOCK itself is **declared only by the Program Owner** (Roadmap Section 7.3, AI-4, Section 16.2) when, additionally, the Exception Register contains only accepted S3/S4 items (Roadmap Section 16.2). This document defines program PASS readiness; it does not declare LOCK.

---

## SECTION 19 — FAIL DECISION RULES

A unit FAILS when **any** of the following is true. FAIL is the default for any unmet PASS condition.

### 19.1 Universal FAIL Triggers (Any Unit)

- Any open **S0** or **S1** finding (Roadmap Section 9, Section 15.2).
- An **S2** finding not tolerated by its gate as tracked-and-gated (Roadmap Section 9).
- An **S3** deviation that is **not** an accepted, registered Tracked Exception (Roadmap Section 9, Section 12).
- A verdict lacking **evidence**, **severity**, or a **scope tag** (Roadmap Section 7.3, Section 8.4) — such a verdict is invalid and treated as not-PASS.
- A coverage-based judgement lacking a cited **frozen Audit Universe version** (Roadmap Section 22.7) or a traceable evidence set (Roadmap Section 10.4).

### 19.2 Component FAIL

Any one of the seven Universal Component conditions (Section 6.2) unmet, without an accepted exception.

### 19.3 Surface FAIL

Per Section 17.2.

### 19.4 Domain FAIL

Per Section 16.2.

### 19.5 Program FAIL (Not Ready For UI LOCK)

Any one of the seven Exit Criteria (Section 18.4) unmet. In particular, **any** open S0 or S1 finding anywhere in the in-scope surface makes the program FAIL for LOCK readiness (Roadmap Section 15.2).

---

## SECTION 20 — COMPLETION REQUIREMENTS

### 20.1 Component Completion

A component is **complete (consolidated)** when it PASSES per Section 18.1 and has no open S0/S1 findings (Roadmap Section 11).

### 20.2 Screen / Surface Completion

A surface is **complete** when it PASSES per Section 18.2.

### 20.3 Domain Completion

A domain is **complete** when it PASSES per Section 18.3.

### 20.4 Program Completion

The UI Consolidation Program is **complete** when:

1. The program PASSES LOCK readiness per Section 18.4 (all Roadmap Exit Criteria, Section 15), **and**
2. The Program Owner formally declares **UI LOCK** and records it in the UI LOCK Declaration (Roadmap Section 16.2), **and**
3. The Exception Register contains only accepted S3/S4 items (Roadmap Section 16.2).

### 20.5 Alignment Statement

These completion requirements are fully aligned with `UI_CONSOLIDATION_MASTER_ROADMAP.md` Sections 11, 12, 15, and 16. They restate the Roadmap's end-state as acceptance verdicts; they do not extend or alter it.

### 20.6 Success Metric Alignment

A complete program satisfies the Roadmap Success Metrics (Section 20): program-wide adoption ≥ 95%; 0 open S0; 0 open S1; 0 untracked legacy in active use; 100% gates passing or accepted exception; 100% migration flags defined; 100% coverage evidence-backed; 100% reviewer reproducibility; UI LOCK declared.

---

## SECTION 21 — CHANGELOG

| Version | Date | Change | Author |
|---------|------|--------|--------|
| 1.0 | 2026-06-25 | Initial Acceptance Criteria, derived entirely from `UI_CONSOLIDATION_MASTER_ROADMAP.md` v1.1. Defines objective PASS/FAIL rules for components, surfaces, domains, and the program. Introduces no new governance, scope, severities, gates, flags, or coverage model. | UI Quality Engineering |

---

> **End of Acceptance Criteria.** The Master Roadmap defines **how the program operates**; this document defines **how the program is judged**. Together they form the governance foundation of the UI Consolidation Program. This document creates no implementation, no audit result, and no checklist, and modifies no source code, CSS, logic, API, data, validation, routing, workflow, state, or feature flags.
