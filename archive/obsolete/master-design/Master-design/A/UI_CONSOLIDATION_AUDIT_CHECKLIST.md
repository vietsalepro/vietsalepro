# UI CONSOLIDATION AUDIT CHECKLIST — VietSale Pro v7

> **Version:** 1.0
> **Date:** 2026-06-25
> **Document Type:** Operational (Audit Execution Layer)
> **Program:** UI Consolidation Program
> **Derived From:**
> - `UI_CONSOLIDATION_MASTER_ROADMAP.md` (Version 1.1 — FROZEN)
> - `UI_CONSOLIDATION_ACCEPTANCE_CRITERIA.md` (Version 1.0 — FROZEN)
> **Single Source of Truth:** `UI_CONSOLIDATION_MASTER_ROADMAP.md`
> **Acceptance Authority:** `UI_CONSOLIDATION_ACCEPTANCE_CRITERIA.md`
> **Status:** ACTIVE — Audit Procedure
> **Owner:** UI Quality Engineering / Design System Governance

---

## DOCUMENT CONTRACT

This document is an **operational checklist only**. It answers exactly one question:

> **"What exactly must an auditor verify during a UI Consolidation audit, and in what order?"**

This document:

- Derives **every** checklist item from the two frozen governance documents named above. It introduces **no new governance**, **no new scope**, **no new severities**, **no new gates**, **no new feature flags**, and **no new coverage model**.
- Does **not** decide PASS or FAIL. PASS/FAIL is governed **exclusively** by `UI_CONSOLIDATION_ACCEPTANCE_CRITERIA.md`. This checklist only ensures the audit is *executed* consistently so that the acceptance authority can be applied to its outputs.
- Is **not** a Master Roadmap, Acceptance Criteria, Audit Report, Audit Template, Report Template, Sprint Plan, Remediation Plan, Implementation Guide, or Source Code Guidance.
- Does **not** modify or authorize any change to source code, TSX, CSS, business logic, API, validation, routing, workflow, state, or feature flags (Roadmap Immutable Rules 1–3, 7).

If this checklist ever conflicts with the Acceptance Criteria, **the Acceptance Criteria governs acceptance**. If either governance document conflicts, **the Master Roadmap wins** (Roadmap Section 20; Acceptance Criteria Document Contract). Corrections to this checklist follow the Amendment Process (Roadmap Section 18.3).

### How To Read This Checklist

- **`[ ]`** denotes a verification step the auditor must perform and mark complete.
- Each checklist item states **what to verify** and **what evidence to capture**. It never states how to implement, fix, or remediate.
- Every item is **evidence-oriented**: the auditor records the concrete artifact (location + standard clause), never an opinion (Roadmap G2, Section 8.4; Acceptance Criteria EP1, Section 5).
- Traceability tags (e.g. *Roadmap QG-1*, *AC §6.2*) are mandatory and appear inline. An item with no governance trace is invalid and must be removed by amendment.
- The auditor records observations only. The auditor does **not** stamp PASS/FAIL; that determination is made by applying the Acceptance Criteria to the captured evidence.

---

## SECTION 1 — PURPOSE

This checklist exists to make every UI Consolidation audit **deterministic, reproducible, sequential, and evidence-oriented**, so that:

- [ ] Every auditor inspects the project in the **same order** (Section 6 Execution Order).
- [ ] Every auditor captures the **same evidence fields** for every observation (Section 5).
- [ ] No required verification step is **skipped** (Section 19 gating between phases).
- [ ] Two independent auditors auditing the same surface produce the **same set of observations** (Roadmap Section 8.5; AC EP3, §5.4).

This checklist does **not**:

- [ ] Decide PASS or FAIL (governed by `UI_CONSOLIDATION_ACCEPTANCE_CRITERIA.md`).
- [ ] Produce findings text, coverage numbers, or remediation plans (later, separate artifacts — Roadmap Section 13).

---

## SECTION 2 — RELATIONSHIP TO GOVERNANCE DOCUMENTS

This checklist sits beneath both frozen governance documents in the authority hierarchy (Roadmap Section 7.1; AC Section 2.1):

```
UI_CONSOLIDATION_MASTER_ROADMAP.md            (governs the program — SSOT)
            ↓
UI_CONSOLIDATION_ACCEPTANCE_CRITERIA.md       (governs PASS/FAIL judgement)
            ↓
UI_CONSOLIDATION_AUDIT_CHECKLIST.md           (this document — governs audit execution)
            ↓
/Master-design/ MASTER_* standards            (define UI correctness)
            ↓
Audit artifacts produced in later steps        (must conform to all of the above)
```

| Document | Answers | This Checklist's Relationship |
|----------|---------|-------------------------------|
| Master Roadmap (v1.1) | *How the program operates* | Supplies scope, dimensions, severities, gates, coverage model, exit criteria that this checklist verifies. |
| Acceptance Criteria (v1.0) | *How quality is judged (PASS/FAIL)* | Consumes the evidence this checklist collects to render verdicts. |
| **This Checklist (v1.0)** | *How the audit is executed* | Defines the exact, ordered verification steps and required evidence. |

- [ ] Confirm both governance documents referenced are the **frozen versions** (Roadmap v1.1, AC v1.0). If either version differs, **stop** — this checklist may be out of date and must be re-validated by amendment.

---

## SECTION 3 — AUDIT PREPARATION

Complete **all** preparation steps before touching any surface. Preparation produces no verdicts.

- [ ] **P-1 — Obtain governance set.** Confirm read access to `UI_CONSOLIDATION_MASTER_ROADMAP.md` (v1.1) and `UI_CONSOLIDATION_ACCEPTANCE_CRITERIA.md` (v1.0). *Roadmap Section 7.1; AC Section 2.*
- [ ] **P-2 — Obtain the relevant `MASTER_*` standards.** Confirm access to every standard that the audit will reference (component standards, `MASTER_DESIGN_TOKENS_V1.md`, `MASTER_TYPOGRAPHY_V1.md`, `MASTER_MOTION_ANIMATION_STANDARD_V1.md`, `MASTER_ICON_STANDARD_V1.md`, `MASTER_ELEVATION_ZINDEX_STANDARD_V1.md`). *Roadmap Section 5; AC Section 6.3.*
- [ ] **P-3 — Obtain the frozen Audit Universe.** Confirm the versioned, frozen Audit Universe / Surface Inventory for this coverage cycle exists and record its **version identifier**. *Roadmap Section 22.5, 22.7; AC §4.5.*
- [ ] **P-4 — Obtain the Applicability Matrix.** Confirm access to the Design System Applicability Matrix for the surfaces to be audited. *Roadmap Section 23; AC §4.4.*
- [ ] **P-5 — Obtain the Exception Register.** Confirm access to the current Exception Register so that existing tracked exceptions can be cross-referenced. *Roadmap Section 13, 19; AC §15.3.*
- [ ] **P-6 — Confirm role independence.** Confirm the auditor is **not** also the approver/reviewer of this surface (Audit Independence). *Roadmap Section 7.4 AI-1, AI-2.*
- [ ] **P-7 — Confirm read-only posture.** Acknowledge that the audit modifies **no** source, TSX, CSS, logic, API, validation, routing, workflow, state, or feature flags. *Roadmap Immutable Rules 1, 3, 7.*
- [ ] **P-8 — Prepare evidence capture template.** Confirm the evidence fields of Section 5 are ready to be recorded for every observation.

---

## SECTION 4 — AUDIT PRECONDITIONS

The audit may **not** begin until every precondition below is satisfied. If any precondition fails, **halt** and escalate; do not proceed to surface inspection.

- [ ] **PRE-1 — Frozen Universe present.** A frozen, versioned Audit Universe exists and its version is recorded. No coverage may be computed without it. *Roadmap Section 22.7; AC §4.5.*
- [ ] **PRE-2 — Surface is in the Universe.** Each surface to be audited appears in the frozen Audit Universe. A surface not in the inventory cannot be audited. *Roadmap Section 22.2.*
- [ ] **PRE-3 — Surface is in scope.** Each surface is in scope per Roadmap Section 5 and not excluded per Section 6. *Roadmap Section 22.4.*
- [ ] **PRE-4 — Surface is auditable.** Each surface is a discrete, identifiable region with a known location and is in active use / reachable. *Roadmap Section 22.4; §24.2 "Active Use".*
- [ ] **PRE-5 — Applicability available.** The Applicability Matrix provides a level for each (component, surface-type) pair to be judged. *Roadmap Section 23.3.*
- [ ] **PRE-6 — Standards available.** Every `MASTER_*` standard needed for the audited dimensions is accessible. *Roadmap G8 "Read Before Judging".*
- [ ] **PRE-7 — Independence confirmed.** Reviewer is independent of the executor for this surface. *Roadmap Section 7.4 AI-2.*

---

## SECTION 5 — EVIDENCE COLLECTION

Every observation recorded during this audit — for every dimension and every component — **must** carry the following evidence fields. An observation missing any mandatory field is **invalid** and cannot be passed to the acceptance authority. *Roadmap Section 8.4; AC Section 5.1.*

For **each** observation, record:

- [ ] **EV-1 — Location.** File path + line range, or route + component identifier, of the surface/component observed. *Roadmap Section 8.4; AC §5.1.*
- [ ] **EV-2 — Standard clause.** The specific `MASTER_*` standard clause the observation is judged against. *Roadmap Section 8.4, G8; AC §5.1.*
- [ ] **EV-3 — Classification.** Marked as **Compliant** or **Deviation**. *Roadmap Section 8.3; AC §5.1.*
- [ ] **EV-4 — Severity.** Exactly one of S0, S1, S2, S3, S4 assigned to every deviation. Mandatory; an unclassified deviation is invalid. *Roadmap Section 9, Immutable Rule 5; AC §5.1, Section 14.*
- [ ] **EV-5 — Scope tag.** Marked **IN-SCOPE** or **OUT-OF-SCOPE**. Out-of-scope items are tagged and handed off, never actioned here. *Roadmap Section 6, 7.3; AC §5.1, EP7.*
- [ ] **EV-6 — Coverage contribution.** Marked as one of: **compliant usage**, **non-compliant usage**, or **missed adoption**. *Roadmap Section 10.2; AC §5.1.*
- [ ] **EV-7 — Audit Universe version reference.** Every coverage-relevant observation cites the frozen Audit Universe version it was measured against. *Roadmap Section 22.7; AC §13.4.*

Evidence integrity checks (apply continuously):

- [ ] **EV-8 — No opinion-only observations.** Reject any observation stated as "looks fine" / "seems consistent" with no location and clause. *Roadmap G2; AC §5.2.*
- [ ] **EV-9 — Coverage traces to evidence.** Any coverage-relevant tally traces to the same evidence set used for observations. *Roadmap Section 10.4; AC §5.3.*
- [ ] **EV-10 — Reproducibility.** Each observation is recorded so that an independent reviewer can reproduce it from the cited evidence alone. *Roadmap Section 8.5; AC §5.4.*

---

## SECTION 6 — AUDIT EXECUTION ORDER

Every auditor **must** follow this exact order. A later phase may not begin until the prior phase's checklist items are complete and their evidence is recorded. This ordering exists to prevent skipped steps and to guarantee reproducibility.

```
[A] Preparation (Section 3)
        ↓
[B] Preconditions (Section 4)
        ↓
[C] Freeze / Confirm Audit Universe (Section 7)
        ↓
[D] Verify Scope & Applicability (Section 8)
        ↓
[E] Collect Evidence baseline (Section 5 fields ready)
        ↓
[F] Component Audit (Section 9)
        ↓
[G] CSS Audit (Section 10)
        ↓
[H] Responsive Audit (Section 11)
        ↓
[I] Accessibility Audit (Section 12)
        ↓
[J] UI Consistency Audit (Section 13)
        ↓
[K] Legacy UI Audit (Section 14)
        ↓
[L] Feature Flag Audit (Section 15)
        ↓
[M] Coverage Verification (Section 16)
        ↓
[N] Severity Verification (Section 17)
        ↓
[O] Exception Verification (Section 18)
        ↓
[P] Domain Completion check (Section 20)
        ↓
[Q] Program Completion check (Section 21)
        ↓
[R] Audit Completion (Section 22)
        ↓
[S] Reviewer Validation (Section 23)
```

- [ ] **ORD-1** — Confirm each phase A→S is executed in sequence; record the completion timestamp of each phase.
- [ ] **ORD-2** — Confirm no dimension audit (F→L) was started before Scope & Applicability (D) was confirmed. *Roadmap Section 23.3.*
- [ ] **ORD-3** — Confirm Coverage Verification (M) was not performed before all dimension audits (F→L) were complete. *Roadmap Section 10.4.*
- [ ] **ORD-4** — The seven scope dimensions audited in F→L are exactly: **Adoption, CSS, Responsive, Accessibility, Consistency, Legacy, Feature Flags** — no more, no fewer. *Roadmap Section 8.1; AC §16.1(1).*

---

## SECTION 7 — FREEZE / CONFIRM AUDIT UNIVERSE

- [ ] **AU-1 — Record Universe version.** Capture the exact frozen Audit Universe version identifier driving this audit. *Roadmap Section 22.5.*
- [ ] **AU-2 — Confirm freeze.** Confirm the Audit Universe is frozen for this coverage cycle and will not change mid-audit. *Roadmap Section 22.5, 22.7.*
- [ ] **AU-3 — Enumerate surfaces.** From the frozen Universe, list every auditable surface (page, screen, modal, panel, form, table, control region) in this audit's domain. *Roadmap Section 22.2, 22.4.*
- [ ] **AU-4 — Confirm denominator basis.** Confirm this Universe is the denominator for all coverage in this cycle. *Roadmap Section 22.7; AC §13.4.*
- [ ] **AU-5 — Record non-auditable surfaces.** Capture any surfaces marked non-auditable with their recorded reason. *Roadmap Section 22.4.*

---

## SECTION 8 — VERIFY SCOPE & APPLICABILITY

For **each** surface enumerated in Section 7:

- [ ] **SCP-1 — In-scope confirmation.** Confirm the surface is in scope (Roadmap Section 5) and not in the Out-Of-Scope list (Roadmap Section 6). *Roadmap Section 22.4.*
- [ ] **SCP-2 — Out-of-scope tagging.** If any aspect touches an out-of-scope area (logic, API, DB, perf, security, etc.), tag it **OUT-OF-SCOPE** and mark for hand-off; do not action it. *Roadmap Section 6; AC EP7.*
- [ ] **SCP-3 — Surface type classification.** Classify the surface as **Primary** or **Secondary** per the glossary. *Roadmap §24.2.*
- [ ] **APP-1 — Read applicability per component.** For every standardized component, read its applicability level (Mandatory / Recommended / Optional / Not Applicable) for this surface type from the matrix **before** judging adoption. *Roadmap Section 23.2, 23.3; AC §4.4.*
- [ ] **APP-2 — Not Applicable handling.** Where applicability is **Not Applicable**, record that the component's absence is **not** an observation. *Roadmap Section 23.2; AC §4.4.*
- [ ] **APP-3 — Mandatory targeting.** Identify every **Mandatory** component for the surface; these are the adoption-critical targets. *Roadmap Section 23.2.*
- [ ] **APP-4 — Recommended targeting.** Identify every **Recommended** component; record whether a deviation has documented justification. *Roadmap Section 23.2.*
- [ ] **APP-5 — Dispute deferral.** Where applicability is disputed, record the dispute for the Design System Steward; do not resolve it by auditor opinion. *Roadmap Section 23.3, 7.2.*

---

## SECTION 9 — COMPONENT AUDIT CHECKLIST

For **each** standardized component on **each** surface where the matrix marks it **Mandatory** or **unjustified Recommended**, verify the seven Universal Component conditions (Roadmap Section 11; AC §6.2). This checklist defines **what to verify**, never implementation.

### 9.1 Per-Component Universal Verification

For the component under audit:

- [ ] **CMP-1 — Adoption.** Verify whether the component is used where applicable, and record the coverage contribution (compliant / non-compliant / missed adoption). *Roadmap Section 11.1, 10.2; AC §6.2(1).*
- [ ] **CMP-2 — S0/S1 scan.** Verify whether any S0 or S1 deviation is present against the component. *Roadmap Section 11.2, 9; AC §6.2(2).*
- [ ] **CMP-3 — CSS compliance.** Verify the component is token-driven and CSS-first per its standard (cross-reference Section 10). *Roadmap Section 11.3; AC §6.2(3).*
- [ ] **CMP-4 — Consistency.** Verify typography, spacing, radius, shadow, motion, icon, color conform (cross-reference Section 13). *Roadmap Section 11.4; AC §6.2(4).*
- [ ] **CMP-5 — Responsive.** Verify desktop/tablet/mobile rendering with no overflow defects (cross-reference Section 11). *Roadmap Section 11.5; AC §6.2(5).*
- [ ] **CMP-6 — Accessibility.** Verify keyboard/focus/ARIA/label/role baseline (cross-reference Section 12). *Roadmap Section 11.6; AC §6.2(6).*
- [ ] **CMP-7 — Feature flags.** Verify any flag affecting the component is in a defined, consistent, documented state; record "no flag" where none applies. *Roadmap Section 11.7; AC §6.2(7), §6.4.*
- [ ] **CMP-8 — Standard clause anchor.** Record the specific `MASTER_*` clause(s) the component was judged against (per the anchor table in 9.2). *Roadmap G8; AC §6.3.*

### 9.2 Component Acceptance Anchors

For each component, verify against its named standard. Record the standard and the specific clause for every observation. *(AC §6.3; Roadmap Section 5.1.)*

| Component | Verify Against (`MASTER_*` standard) | Done |
|-----------|---------------------------------------|------|
| `ActionButton` | `MASTER_ACTION_BUTTON_STANDARD_V1.md` | [ ] |
| `TextInput` | `MASTER_INPUT_STANDARD_V1.md` | [ ] |
| `SelectInput` | `MASTER_INPUT_STANDARD_V1.md` | [ ] |
| `FormField` | `MASTER_FORM_STANDARD.md` | [ ] |
| `SectionBox` | `MASTER_SECTION_BOX_STANDARD_V1.md` | [ ] |
| `StatusBadge` | `MASTER_STATUS_BADGE_STANDARD.md` | [ ] |
| `NotificationSystem` | `MASTER_NOTIFICATION_STANDARD.md` | [ ] |
| `Picker` | `MASTER_PICKER_STANDARD_V1.md` | [ ] |
| `MasterModal` | `MASTER_MODAL_BLUEPRINT_V1.md` | [ ] |
| `DataGrid` | `MASTER_DATA_GRID_STANDARD_V1.md` | [ ] |
| `AppShell` | `MASTER_APP_SHELL_STANDARD.md` | [ ] |
| `SplitPane` | `MASTER_SPLIT_PANE_STANDARD_V1.md` | [ ] |
| `Dashboard` | `MASTER_DASHBOARD_STANDARD.md` | [ ] |
| `Tabs` | `MASTER_TABS_STANDARD_V1.md` | [ ] |
| **Every other standardized component from UI Migration** | Its corresponding `MASTER_*` standard | [ ] |

- [ ] **CMP-9 — No component exempt.** Confirm every standardized component present on the surface — including any beyond the named list — was checked against its standard. *Roadmap Section 5.1; AC §6.4.*

---

## SECTION 10 — CSS AUDIT CHECKLIST

For each audited surface/component, verify each CSS dimension and capture evidence. *(AC Section 7; Roadmap Scope 5.2, gates QG-2, QG-3.)*

- [ ] **CSS-1 — CSS First.** Verify styling lives in CSS per the component standard, and that no styling responsibility is placed inline unaccounted-for. *AC CSS-1; Roadmap 5.2, QG-2.*
- [ ] **CSS-2 — Component CSS organization.** Verify the component's CSS is organized per its `MASTER_*` standard. *AC CSS-2; Roadmap 5.2.*
- [ ] **CSS-3 — Design Tokens.** Verify color, size, and spacing values derive from tokens in `MASTER_DESIGN_TOKENS_V1.md`. Record any value hardcoded where a token exists. *AC CSS-3; Roadmap 5.2, QG-2.*
- [ ] **CSS-4 — Inline Style.** Verify inline styles are zero or each is explicitly accounted for. Record any unaccounted inline style. *AC CSS-4; Roadmap 5.2, QG-2.*
- [ ] **CSS-5 — Hardcoded values.** Verify there are zero hardcoded color/size/spacing values where a token exists. *AC CSS-5; Roadmap QG-2.*
- [ ] **CSS-6 — Typography.** Verify conformance to `MASTER_TYPOGRAPHY_V1.md`. Note: this dimension admits **no numeric tolerance** (100% required); record any deviation. *AC CSS-6; Roadmap QG-3, 5.2.*
- [ ] **CSS-7 — Evidence per CSS observation.** Confirm each CSS observation carries location + clause + classification + severity. *Roadmap Section 8.4.*

---

## SECTION 11 — RESPONSIVE AUDIT CHECKLIST

For each audited surface, verify each breakpoint with per-breakpoint evidence. *(AC Section 8; Roadmap Scope 5.3, gate QG-5.)*

- [ ] **RSP-1 — Desktop.** Verify layout renders correctly on desktop with no breakage. *AC RSP-1; Roadmap 5.3, QG-5.*
- [ ] **RSP-2 — Tablet.** Verify layout renders correctly on tablet with no breakage. *AC RSP-2; Roadmap 5.3, QG-5.*
- [ ] **RSP-3 — Mobile.** Verify layout renders correctly on mobile with no breakage. *AC RSP-3; Roadmap 5.3, QG-5.*
- [ ] **RSP-4 — Overflow.** Verify there is no content overflow defect on any breakpoint. *AC RSP-4; Roadmap 5.3, QG-5.*
- [ ] **RSP-5 — Layout integrity.** Verify layout remains consistent across breakpoints. *AC RSP-5; Roadmap 5.3, QG-5.*
- [ ] **RSP-6 — Per-breakpoint evidence.** Confirm a separate evidence record exists for desktop, tablet, and mobile. *AC §8 Responsive Acceptance Rule.*

---

## SECTION 12 — ACCESSIBILITY AUDIT CHECKLIST

For each interactive element on the audited surface, verify the accessibility baseline. *(AC Section 9; Roadmap Scope 5.4, gate QG-6.)*

- [ ] **A11Y-1 — Keyboard.** Verify all interactive elements are keyboard reachable. *AC A11Y-1; Roadmap 5.4, QG-6.*
- [ ] **A11Y-2 — Focus.** Verify focus is visible on interactive elements. *AC A11Y-2; Roadmap 5.4, QG-6.*
- [ ] **A11Y-3 — Labels.** Verify interactive elements have correct labels. *AC A11Y-3; Roadmap 5.4, QG-6.*
- [ ] **A11Y-4 — Roles.** Verify correct roles are present. *AC A11Y-4; Roadmap 5.4, QG-6.*
- [ ] **A11Y-5 — ARIA.** Verify correct ARIA attributes are present where required. *AC A11Y-5; Roadmap 5.4, QG-6.*
- [ ] **A11Y-6 — Baseline only.** Confirm verification was against the defined baseline only — neither raised nor lowered. *AC §9 Accessibility Acceptance Rule.*

---

## SECTION 13 — UI CONSISTENCY CHECKLIST

For each audited surface/component, verify each consistency dimension against its standard. *(AC Section 10; Roadmap Scope 5.5, gates QG-3, QG-4.)*

- [ ] **CON-1 — Typography.** Verify conformance to `MASTER_TYPOGRAPHY_V1.md` (100% required, no tolerance). *AC CON-1; Roadmap QG-3.*
- [ ] **CON-2 — Colors.** Verify colors conform to their standard and tokens; record non-conforming/hardcoded colors. *AC CON-2; Roadmap QG-4, 5.2.*
- [ ] **CON-3 — Spacing.** Verify spacing conforms to its standard. *AC CON-3; Roadmap QG-4.*
- [ ] **CON-4 — Radius.** Verify border radius conforms to its standard. *AC CON-4; Roadmap QG-4.*
- [ ] **CON-5 — Shadows.** Verify shadow/elevation conforms to `MASTER_ELEVATION_ZINDEX_STANDARD_V1.md`. *AC CON-6; Roadmap QG-4, 5.5.*
- [ ] **CON-6 — Motion.** Verify motion conforms to `MASTER_MOTION_ANIMATION_STANDARD_V1.md`. *AC CON-5; Roadmap QG-4, 5.5.*
- [ ] **CON-7 — Icons.** Verify icons conform to `MASTER_ICON_STANDARD_V1.md`. *AC CON-7; Roadmap QG-4, 5.5.*
- [ ] **CON-8 — Component behavior.** Verify component behavior conforms to its `MASTER_*` standard. *AC CON-8; Roadmap QG-4, 5.5.*

---

## SECTION 14 — LEGACY UI CHECKLIST

For each audited surface, detect remaining legacy UI and classify each instance. *(AC Section 11; Roadmap Scope 5.6, gate QG-7, §24.2.)*

### 14.1 Legacy Detection

Verify the presence/absence of, and record evidence for, each legacy category:

- [ ] **LEG-1 — Legacy controls.** Identify remaining legacy controls (buttons, inputs, selects) that bypass standardized components. *Roadmap 5.6; AC §11.*
- [ ] **LEG-2 — Legacy layouts.** Identify remaining legacy layouts. *Roadmap 5.6.*
- [ ] **LEG-3 — Legacy modals.** Identify remaining legacy modals bypassing `MasterModal`. *Roadmap 5.6.*
- [ ] **LEG-4 — Legacy tables.** Identify remaining legacy tables bypassing `DataGrid`. *Roadmap 5.6.*
- [ ] **LEG-5 — Legacy tabs.** Identify remaining legacy tabs bypassing the `Tabs` standard. *Roadmap 5.6.*
- [ ] **LEG-6 — Legacy utility classes.** Identify remaining legacy utility classes. *Roadmap 5.6.*
- [ ] **LEG-7 — Prohibited inline styles.** Identify remaining inline styles where prohibited by the standard. *Roadmap 5.6, 5.2.*

### 14.2 Legacy Classification (Violation vs Accepted Exception)

For **each** legacy instance found, classify it using the governance documents (do not invent states):

- [ ] **LEG-8 — Active-use determination.** Verify whether the legacy UI is in **Active Use** (reachable/used in the running product). *Roadmap §24.2.*
- [ ] **LEG-9 — Exception cross-reference.** Cross-reference the instance against the Exception Register to determine if it is a registered, accepted S3/S4 Tracked Exception. *AC §11.2; Roadmap §16.3, 24.2.*
- [ ] **LEG-10 — State labelling.** Label the instance as exactly one of:
  - **Acceptable** — not in active use, OR in active use AND a registered accepted S3/S4 exception. *AC §11.2.*
  - **Violation** — in active use WITHOUT a tracked exception. *AC §11.2.*
  - **Tracked Exception** — in active use and recorded in the Exception Register at accepted S3/S4. *AC §11.2.*
- [ ] **LEG-11 — Severity for untracked active legacy.** For legacy in active use without exception that bypasses a standardized component on a **primary** surface, record severity **S1**. *AC §11.3; Roadmap Section 9.*
- [ ] **LEG-12 — No silent drift.** Confirm every legacy instance is either recorded for separate authorized fixing or recorded as a tracked exception — none left undocumented. *Roadmap G6; AC §15.2.*

---

## SECTION 15 — FEATURE FLAG CHECKLIST

Verify **only** the existing migration feature flags. Introduce **no** new flags. *(AC Section 12; Roadmap Scope 5.7, Immutable Rule 2, gate QG-8.)*

- [ ] **FF-0 — Existing flags only.** Confirm the audit evaluates only feature flags created during the UI Migration Program; no new flag is defined or assumed. *Roadmap Immutable Rule 2; AC §12.1.*
- [ ] **FF-1 — Defined state.** For each migration flag affecting the surface, verify it is in a defined, non-ambiguous state. *AC FF-1; Roadmap QG-8, 15.5.*
- [ ] **FF-2 — Consistency.** Verify the same flag is used consistently across surfaces. *AC FF-2; Roadmap QG-8.*
- [ ] **FF-3 — Documented.** Verify the flag's state is documented. *AC FF-3; Roadmap QG-8, 15.5.*
- [ ] **FF-4 — Evidence.** Confirm each flag observation carries location + state + documentation reference. *Roadmap Section 8.4.*

---

## SECTION 16 — COVERAGE VERIFICATION CHECKLIST

Coverage is **read using** the Roadmap model; it is **not redefined** here. *(AC Section 13; Roadmap Section 10, 22.7.)*

- [ ] **COV-1 — Universe version cited.** Verify every coverage tally cites the frozen Audit Universe version it was measured against. A tally without it is invalid. *Roadmap Section 22.7; AC §13.4.*
- [ ] **COV-2 — Baseline reference.** Verify the coverage tally references the established Coverage Baseline / inventory it is measured against. *Roadmap §24.2 "Coverage Baseline"; AC §13.1.*
- [ ] **COV-3 — Evidence-backed.** Verify every coverage figure traces to the same evidence set used for observations (no orphan numbers). *Roadmap Section 10.4; AC §5.3, §13.4.*
- [ ] **COV-4 — Traceability per granularity.** Verify coverage is traceable at all three Roadmap granularities used: per-component, per-screen/domain, program-wide. *Roadmap Section 10.3; AC §13.1.*
- [ ] **COV-5 — Formula inputs captured.** Verify the compliant / non-compliant / missed-adoption counts feeding each coverage figure are each recorded with evidence. *Roadmap Section 10.2; AC §5.1(coverage contribution).*
- [ ] **COV-6 — Primary-surface missed adoption flagged.** Verify any missed adoption on a primary surface is explicitly recorded (it is decisive for acceptance). *Roadmap QG-1; AC §13.2.*
- [ ] **COV-7 — No model redefinition.** Confirm the audit did **not** redefine the coverage formula, granularity, or denominator. *AC §13.1; Roadmap Section 10.*

---

## SECTION 17 — SEVERITY VERIFICATION CHECKLIST

Verify that every recorded deviation carries a correct severity using the Roadmap scale exactly. No new severities. *(AC Section 14; Roadmap Section 9.)*

- [ ] **SEV-1 — Every deviation classified.** Verify every deviation has a severity S0–S4; an unclassified deviation is invalid. *Roadmap Immutable Rule 5; AC Section 14 rule.*
- [ ] **SEV-2 — S0 criteria.** Verify each S0 is "breaks core UI integrity or contradicts an Immutable Rule." *Roadmap Section 9; AC Section 14.*
- [ ] **SEV-3 — S1 criteria.** Verify each S1 is "legacy UI in active use, or standardized component bypassed on a primary surface." *Roadmap Section 9; AC Section 14.*
- [ ] **SEV-4 — S2 criteria.** Verify each S2 is a "token/typography/consistency violation visible to users." *Roadmap Section 9; AC Section 14.*
- [ ] **SEV-5 — S3 criteria.** Verify each S3 is a "localized inconsistency with limited impact." *Roadmap Section 9; AC Section 14.*
- [ ] **SEV-6 — S4 criteria.** Verify each S4 is "negligible / stylistic / informational." *Roadmap Section 9; AC Section 14.*
- [ ] **SEV-7 — Severity not effort.** Confirm severity was assigned by impact, not by fix effort. *Roadmap G5; AC Section 14 rule.*
- [ ] **SEV-8 — No new severities.** Confirm no severity outside S0–S4 was introduced. *AC Section 14 intro.*

---

## SECTION 18 — EXCEPTION VERIFICATION CHECKLIST

Verify how exceptions are recorded against the Exception Register. The audit records exceptions; it does not grant acceptance. *(AC Section 15; Roadmap Section 13, 16.3, 24.2.)*

- [ ] **EXC-1 — Register entry.** Verify each claimed exception is recorded in the Exception Register. *AC §15.3(1); Roadmap Section 13, 19.*
- [ ] **EXC-2 — Severity + owner.** Verify each tracked exception has a severity (S3 or S4 for persistence) and an owner. *AC §15.3(2); Roadmap §24.2.*
- [ ] **EXC-3 — Evidence-backed.** Verify each exception is backed by evidence like any other observation. *AC §15.3(3); Roadmap Section 8.4.*
- [ ] **EXC-4 — Persistence eligibility.** Verify only S3/S4 items are claimed as eligible to persist; flag any S0/S1/S2 claimed as a persisting exception. *AC §15.1, §15.2.*
- [ ] **EXC-5 — No untracked deviation persisted.** Confirm no deviation is left untracked ("no silent drift"). *Roadmap G6; AC §15.2.*

---

## SECTION 19 — PHASE GATING (ANTI-SKIP CONTROL)

This section guarantees no required step is skipped. Each gate must be confirmed before the next phase begins.

- [ ] **GATE-1 — Prep→Pre.** All Section 3 prep items complete before preconditions checked.
- [ ] **GATE-2 — Pre→Universe.** All Section 4 preconditions satisfied before the Universe is confirmed.
- [ ] **GATE-3 — Universe→Scope.** Universe frozen + version recorded before scope/applicability.
- [ ] **GATE-4 — Scope→Dimensions.** Applicability read for all components before any dimension audit begins. *Roadmap Section 23.3.*
- [ ] **GATE-5 — Dimensions→Coverage.** All seven dimension audits (Sections 9–15) complete before coverage verification. *Roadmap Section 10.4.*
- [ ] **GATE-6 — Coverage→Severity→Exception.** Coverage, then severity, then exception verification performed in order.
- [ ] **GATE-7 — Audit→Reviewer.** Audit completion (Section 22) confirmed before reviewer validation (Section 23). *Roadmap Section 7.4 AI-1, AI-3.*
- [ ] **GATE-8 — Evidence completeness.** No phase is marked complete while any observation in it lacks a mandatory evidence field (Section 5).

---

## SECTION 20 — DOMAIN COMPLETION CHECKLIST

Verify a domain has been fully **audited** (this is execution completeness, not a PASS verdict). *(AC Section 16; Roadmap Section 10.3.)*

- [ ] **DOM-1 — All surfaces audited.** Verify every auditable surface in the domain (per the frozen Universe) was audited across all seven dimensions. *AC §16.1(1); Roadmap Section 8.1.*
- [ ] **DOM-2 — Per-surface records exist.** Verify each surface in the domain has a complete observation record. *AC §16.1(2); Section 5.*
- [ ] **DOM-3 — Per-domain coverage computed.** Verify per-domain coverage was computed with cited Universe version + evidence. *AC §16.1(3); Roadmap Section 10.3.*
- [ ] **DOM-4 — S0/S1 inventory.** Verify all S0/S1 observations in the domain are recorded for the acceptance authority. *AC §16.1(4); Roadmap Section 15.2.*
- [ ] **DOM-5 — Gate evidence assembled.** Verify evidence for every applicable Quality Gate (QG-1…QG-8) was assembled for the domain. *AC §16.1(5); Roadmap Section 12.*
- [ ] **DOM-6 — No unaudited in-scope surface.** Confirm no in-scope surface in the domain was left unaudited. *AC §16.2.*

---

## SECTION 21 — PROGRAM COMPLETION CHECKLIST

Verify that the evidence required for the acceptance authority to assess **UI LOCK readiness** has been collected program-wide. The auditor assembles evidence; the Program Owner declares LOCK. *(AC Section 18.4, 20; Roadmap Section 15, 16.)*

- [ ] **PRG-1 — Component coverage assembled.** Verify every in-scope component has a measured coverage figure backed by evidence. *Roadmap 15.1; AC §18.4(1).*
- [ ] **PRG-2 — S0/S1 program scan recorded.** Verify open S0/S1 observations across the in-scope surface are fully recorded. *Roadmap 15.2; AC §18.4(2).*
- [ ] **PRG-3 — Gate status assembled.** Verify pass/fail evidence for QG-1…QG-8, with exceptions cross-referenced, is assembled. *Roadmap 15.3; AC §18.4(3).*
- [ ] **PRG-4 — Legacy status assembled.** Verify legacy-in-active-use instances are all recorded with their Exception Register status. *Roadmap 15.4; AC §18.4(4).*
- [ ] **PRG-5 — Flag status assembled.** Verify all migration feature flags' states are recorded. *Roadmap 15.5; AC §18.4(5).*
- [ ] **PRG-6 — Baseline + readiness inputs.** Verify the Coverage Baseline and Readiness Report inputs are available for approval. *Roadmap 15.6; AC §18.4(6).*
- [ ] **PRG-7 — Reproducibility inputs.** Verify the evidence supports reviewer reproducibility sign-off. *Roadmap 15.7; AC §18.4(7).*
- [ ] **PRG-8 — LOCK declaration deferral.** Confirm the auditor does **not** declare UI LOCK; that is the Program Owner's action. *Roadmap Section 7.3, AI-4, 16.2; AC §18.4.*

---

## SECTION 22 — AUDIT COMPLETION CHECKLIST

Confirm the audit itself is executed completely and consistently before handing to the reviewer.

- [ ] **FIN-1 — Execution order honored.** Confirm phases A→R (Section 6) were executed in sequence with timestamps. *Section 6, 19.*
- [ ] **FIN-2 — All dimensions covered.** Confirm all seven dimensions were audited for every in-scope surface. *Roadmap Section 8.1.*
- [ ] **FIN-3 — Evidence complete.** Confirm every observation carries all mandatory evidence fields EV-1…EV-7. *Section 5.*
- [ ] **FIN-4 — Severity complete.** Confirm every deviation is severity-classified. *Section 17.*
- [ ] **FIN-5 — Coverage traceable.** Confirm every coverage figure cites a Universe version and traces to evidence. *Section 16.*
- [ ] **FIN-6 — Scope tags complete.** Confirm every observation is tagged IN-SCOPE / OUT-OF-SCOPE. *Section 5 EV-5.*
- [ ] **FIN-7 — No verdict stamped.** Confirm the audit recorded observations only and did **not** stamp PASS/FAIL. *Document Contract.*
- [ ] **FIN-8 — No source modified.** Confirm no source/TSX/CSS/logic/API/state/flag was changed during the audit. *Roadmap Immutable Rules 1, 3, 7.*
- [ ] **FIN-9 — Hand-off package assembled.** Confirm the complete evidence package is ready for reviewer validation and for the acceptance authority. *Roadmap Section 7.4 AI-3.*

---

## SECTION 23 — REVIEWER CHECKLIST

The independent reviewer validates the audit **without re-performing the entire audit**, by sampling and verifying integrity. The reviewer must be independent of the executor for the surface under review. *(Roadmap Section 7.4 AI-2, AI-3, Section 18; AC §5.4.)*

- [ ] **REV-1 — Independence confirmed.** Confirm the reviewer did not execute this surface's audit. *Roadmap AI-1, AI-2.*
- [ ] **REV-2 — Audit completeness.** Confirm all seven dimensions were audited for all in-scope surfaces in the frozen Universe. *Roadmap Section 8.1; AC §16.1.*
- [ ] **REV-3 — Evidence quality.** Sample observations and confirm each carries location + clause + classification + severity + scope tag + coverage contribution. *Roadmap Section 8.4; AC Section 5.*
- [ ] **REV-4 — Reproducibility.** Reproduce a sample of observations from cited evidence alone and confirm the same result. Non-reproducible observations are invalid. *Roadmap Section 8.5; AC §5.4.*
- [ ] **REV-5 — Severity correctness.** Confirm sampled severities match the Roadmap Section 9 definitions. *Roadmap Section 9; AC Section 14.*
- [ ] **REV-6 — Coverage correctness.** Confirm sampled coverage figures cite the Universe version and trace to evidence. *Roadmap Section 10.4, 22.7; AC §13.4.*
- [ ] **REV-7 — Acceptance consistency.** Confirm the captured evidence is sufficient and structured for the Acceptance Criteria to render PASS/FAIL — without the audit itself having pre-judged. *AC Document Contract, Section 4.*
- [ ] **REV-8 — Governance compliance.** Confirm the audit introduced no new governance, scope, severities, gates, flags, or coverage model. *AC Section 2.3; Roadmap Immutable Rules.*
- [ ] **REV-9 — Out-of-scope discipline.** Confirm out-of-scope items were tagged and handed off, never actioned. *Roadmap Section 6; AC EP7.*
- [ ] **REV-10 — Exception integrity.** Confirm every claimed exception is in the Exception Register with severity + owner + evidence. *AC §15.3.*
- [ ] **REV-11 — No source change.** Confirm no source artifact was modified by the audit. *Roadmap Immutable Rules 1, 3, 7.*
- [ ] **REV-12 — Sign-off scope.** The reviewer validates reproducibility and integrity only; the reviewer does **not** declare UI LOCK. *Roadmap AI-4, Section 16.2.*

---

## SECTION 24 — DEFINITIONS REFERENCE

This checklist uses the authoritative definitions from `UI_CONSOLIDATION_MASTER_ROADMAP.md` Section 24 and does **not** redefine them locally. Key terms used above:

| Term | Source |
|------|--------|
| Primary Surface / Secondary Surface | Roadmap §24.2 |
| Legacy UI | Roadmap §24.2 |
| Active Use | Roadmap §24.2 |
| Missed Adoption | Roadmap §24.2 |
| Audit Universe | Roadmap §22, §24.2 |
| Coverage / Coverage Baseline | Roadmap §10, §24.2 |
| Exception / Tracked Exception | Roadmap §24.2 |
| Compliance / Deviation | Roadmap §24.2 |
| UI LOCK | Roadmap §16, §24.2 |

For any term not listed, defer to Roadmap Section 24. Do not invent definitions.

---

## SECTION 25 — CHANGELOG

| Version | Date | Change | Author |
|---------|------|--------|--------|
| 1.0 | 2026-06-25 | Initial operational Audit Checklist, derived entirely from `UI_CONSOLIDATION_MASTER_ROADMAP.md` v1.1 and `UI_CONSOLIDATION_ACCEPTANCE_CRITERIA.md` v1.0. Defines the exact, ordered, evidence-oriented verification procedure for a UI Consolidation audit. Introduces no new governance, scope, severities, gates, flags, or coverage model. Decides no PASS/FAIL. | UI Quality Engineering |

---

> **End of Audit Checklist.** The Master Roadmap defines **how the program operates**; the Acceptance Criteria defines **how quality is judged**; this document defines **how the audit is executed**. This checklist creates no audit result, no report, no template, no plan, and modifies no source code, CSS, logic, API, data, validation, routing, workflow, state, or feature flags. PASS/FAIL is decided exclusively by `UI_CONSOLIDATION_ACCEPTANCE_CRITERIA.md`.
