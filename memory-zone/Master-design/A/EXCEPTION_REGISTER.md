# UI CONSOLIDATION EXCEPTION REGISTER — VietSale Pro v7

> **Version:** 1.0
> **Date:** 2026-06-26
> **Document Type:** Governance Artifact — Exception Register
> **Program:** UI Consolidation Program
> **Phase:** P5 — Gate Verification
> **Derived From:**
> - `UI_CONSOLIDATION_MASTER_ROADMAP.md` (Version 1.1 — FROZEN)
> - `UI_CONSOLIDATION_ACCEPTANCE_CRITERIA.md` (Version 1.0 — FROZEN)
> - `UI_CONSOLIDATION_REPORT.md` (Version 1.4 — Report ID: `UICONS-AUDIT-2026-06-26-01`)
> **Single Source Of Truth:** `UI_CONSOLIDATION_MASTER_ROADMAP.md`
> **Status:** ACTIVE — Gate Verification Artifact
> **Owner:** UI Quality Engineering / Design System Governance

---

## DOCUMENT CONTRACT

This register records accepted governance exceptions for the UI Consolidation Program. It is produced during Phase P5 — Gate Verification. It introduces no new governance, scope, severities, gates, flags, or coverage model. It does not modify or authorize any change to source code, TSX, CSS, business logic, API, validation, routing, workflow, state, or feature flags.

Every entry in this register is derived solely from deviations already documented in `UI_CONSOLIDATION_REPORT.md` v1.4. No new findings were created, no severities were changed, no PASS/FAIL verdicts were reclassified, and no scope was redefined.

This register is not a remediation plan, a sprint plan, an implementation guide, a refactoring plan, or an audit report.

---

## GOVERNANCE RULES APPLIED

The following rules from the frozen governance documents determine eligibility and acceptance status:

- **Only accepted S3/S4 items may persist into UI LOCK.** (Roadmap Section 16.3; AC Section 15.1)
- **Open S0 or S1 findings may never persist into a PASS verdict.** (AC Section 15.2)
- **S2 findings may persist only where the applicable gate explicitly tolerates them as tracked and gated; otherwise they force FAIL.** (AC Section 15.2)
- **A Tracked Exception is accepted only when it is recorded in the Exception Register, assigned a severity (S3 or S4 for persistence), and assigned an owner.** (Roadmap Section 24.2; AC Section 15.3)
- **Out-of-scope items are never a PASS/FAIL factor within UI Consolidation; they are tagged and handed off.** (Roadmap Section 6; AC Section EP7)

---

## EXCEPTION REGISTER

| Exception ID | Finding Reference | Severity | Scope | Evidence Reference | Current Status | Owner | Acceptance Status | Notes |
|---|---|---|---|---|---|---|---|---|
| **EXC-2026-06-26-01** | `UI_CONSOLIDATION_REPORT.md` v1.4 — Section 10 (CSS-1, CSS-4), Section 16 (deviation group 1) | S2 | IN-SCOPE — CSS Compliance | 341 inline `style={{…}}` occurrences across 28 application files; highest concentrations: `components/MobilePOS.tsx` (161), `components/ProductEditModal.tsx` (44), `pages/ReturnOrders.tsx` (17), `components/MobileSettings.tsx` (15), `components/inventory-count/CountItemsTable.tsx` (15), `pages/Inventory.tsx` (12). | Open | Not Assigned | **NOT ELIGIBLE** | S2 deviations are not eligible to persist as accepted Tracked Exceptions under the CSS Acceptance Rule (AC Section 7). QG-2 (Roadmap Section 12) requires zero unaccounted inline styles, and AC Section 15.2 states that S2 findings may persist only where the applicable gate explicitly tolerates them as tracked and gated. The CSS gate explicitly permits only S3/S4 exceptions. This deviation must be remediated or reduced to S3/S4 before it can be registered. |
| **EXC-2026-06-26-02** | `UI_CONSOLIDATION_REPORT.md` v1.4 — Section 10 (CSS-3, CSS-5), Section 13 (CON-2), Section 16 (deviation group 2) | S2 | IN-SCOPE — CSS Compliance / UI Consistency | Hardcoded color, size, and spacing values inside inline `style={{…}}` blocks (271 in components, 70 in pages) and in component CSS; `design-system-tokens.css` exists and is widely imported. | Open | Not Assigned | **NOT ELIGIBLE** | S2 deviations are not eligible to persist as accepted Tracked Exceptions under the CSS and Consistency Acceptance Rules (AC Section 7, Section 10). QG-2 (Roadmap Section 12) requires zero hardcoded values where a token exists, and QG-4 requires conformance to spacing/radius/shadow/motion/icon/color standards. The gates permit only S3/S4 exceptions. AC Section 15.2 does not permit S2 to persist unless the gate explicitly tolerates it, which these gates do not. This deviation requires remediation or downgrade to S3/S4 before registration. |
| **EXC-2026-06-26-03** | `UI_CONSOLIDATION_REPORT.md` v1.4 — Section 14 (LEG-1, LEG-3, LEG-4, LEG-5), Section 17 (S1), Section 16 (deviation groups 3–4) | S1 | IN-SCOPE — Legacy UI | All 30 UI-Migration activation flags in `features.ts` are observed as `boolean = false`; 609 raw `<button>` / `<table>` matches observed across 81 app files; legacy modal paths activated at `components/PayDebtModal.tsx:287-290`, `components/ProductEditModal.tsx:679-683`; standardized `Tabs` component inactive at `components/Tabs.tsx:13-16`. | Open | Not Assigned | **NOT ELIGIBLE** | S1 deviations (Legacy UI in active use) may never persist as accepted Tracked Exceptions per Roadmap Section 9, AC Section 15.2, and AC Section 11.2. QG-7 (Roadmap Section 12) requires zero legacy components in active use without a tracked exception, and S1 findings block UI LOCK. These deviations must be remediated (flag activation or legacy removal) before gate acceptance. They cannot be registered as exceptions. |
| **EXC-2026-06-26-04** | `UI_CONSOLIDATION_REPORT.md` v1.4 — Section 6 (non-auditable surfaces), Section 17 (S4), Section 16 (deviation group 5) | S4 | OUT-OF-SCOPE — Folder Structure / Non-Production Artifacts | `components/MobilePOS.backup.tsx`, `components/MobilePOS.tsx.tmp` | Open | Not Assigned | **ACCEPTED** | S4 cosmetic/informational items do not block UI LOCK per Roadmap Section 9. These artifacts are non-production source files (backup / temporary) and are not part of the governed Audit Universe. Folder cleanup is explicitly out of scope per Roadmap Section 6, so they are handed off to a future program. Recorded as an accepted S4 Tracked Exception for visibility and governance completeness. |

---

## REGISTER SUMMARY

| Field | Value |
|---|---|
| **Total Entries** | 4 |
| **Accepted Exceptions** | 1 (S4) |
| **Not Eligible Exceptions** | 3 (2 × S2, 1 × S1) |
| **S0 Tracked Exceptions** | 0 |
| **S1 Tracked Exceptions** | 0 |
| **S2 Tracked Exceptions** | 0 |
| **S3 Tracked Exceptions** | 0 |
| **S4 Tracked Exceptions** | 1 |

---

## GOVERNANCE COMPLIANCE STATEMENT

This register:

- Was created only from deviations already documented in `UI_CONSOLIDATION_REPORT.md` v1.4.
- Did not create any new findings, severities, PASS/FAIL verdicts, or scope classifications.
- Did not modify `UI_CONSOLIDATION_MASTER_ROADMAP.md`, `UI_CONSOLIDATION_ACCEPTANCE_CRITERIA.md`, or `UI_CONSOLIDATION_REPORT.md`.
- Did not modify any source code, TSX, CSS, business logic, API, validation, routing, workflow, state, or feature flags.
- Applied the frozen eligibility rules: S0/S1 never accepted; S2 accepted only where the applicable gate explicitly tolerates it; S3/S4 accepted as tracked exceptions.
- Records all deviations from the audit report; none were silently omitted.

---

## CHANGELOG

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | 2026-06-26 | Initial Exception Register created during P5 — Gate Verification. Derived from `UI_CONSOLIDATION_REPORT.md` v1.4. One S4 accepted; three entries (S1, S2 × 2) recorded as NOT ELIGIBLE per frozen governance. | Enterprise Governance Program Maintainer |

---

> **End of Exception Register.** This document records accepted governance exceptions and the eligibility status of all documented deviations. It does not authorize remediation, implementation, or source changes.
