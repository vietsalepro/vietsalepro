# CURRENT_TASK-015 — Architecture Decision

**Program:** VietSalePro v7 — System Recovery Program
**Phase:** Phase 4 — Derived Validation Layer Realignment
**Document Type:** Architecture Decision (Program Manager Decision — no implementation)
**Date:** 2026-07-15
**Status:** Architecture Decision Draft — Awaiting Program Manager Approval
**Authorizing CURRENT_TASK:** CURRENT_TASK-015 — Tenant Administration & Licensing Mock Coverage (Wave 2 / TASK-B)
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_M1.md`, `CURRENT_TASK-014_ACCEPTANCE_RECORD.md`, `CURRENT_TASK-014_ARCHITECTURE_DECISION.md`, `D-P3-01_Reconciled_RPC_Contract.md`, `D-P4-02_CANONICAL_AUDIT_GATE_DEFINITION.md`

---

> **No implementation. No code change. No migration. No schema change. No generated type. No mock RPC written by this document.**
> This document is a Program Manager architecture decision deliverable only. It selects the next domain per the already-approved Coverage Roadmap and defines the architecture of CURRENT_TASK-015. No implementation may begin until the Program Manager approves this decision and a separate Implementation/Kickoff authorization is issued.

---

## 1. Objective

Authorize the second domain-scoped coverage task of the Phase 4 Coverage Roadmap and define its architecture.

Concretely, CURRENT_TASK-015 shall mock the **6 uncovered RPCs of Domain B — Tenant Administration & Licensing** in `tests/mocks/supabase.ts`, following the existing `if (name === '...')` dispatch pattern, with each mock's return shape derived from the canonical migration chain. The task raises mock coverage from **48.1% (88/183)** to **51.4% (94/183)** — a **+3.3 percentage-point** delta — and unblocks the license-validation gate (`validate_tenant_license`) that commerce feature-access test paths call in later waves.

This decision does **not** re-open the Coverage Roadmap. The Roadmap strategy (Wave / Domain / Dependency / Milestone) was already approved in `CURRENT_TASK-014_ARCHITECTURE_DECISION.md` §5.1 and re-validated against the post-M1 state in `PHASE4_PROGRAM_STATUS_AFTER_M1.md` §4 with no change. This document only confirms Domain B as the next domain per the roadmap's dependency-driven ordering (Wave 2), now that its sole prerequisite (Domain A — Auth) is mocked and accepted.

---

## 2. Background

| Item | State | Source |
|---|---|---|
| Phase 4 status | Active, in good standing | `CURRENT_PHASE.md` §1; `PHASE4_PROGRAM_STATUS_AFTER_M1.md` §2 |
| Last closed CURRENT_TASK | CURRENT_TASK-014 — Auth, Identity & Security Mock Coverage — Accepted with Minor Notes (2026-07-15) | `CURRENT_TASK-014_ACCEPTANCE_RECORD.md` §14 |
| Coverage milestone reached | **M1 — Auth Foundation (48.1%)** — 88/183 code RPCs covered, independently reproduced | `PHASE4_PROGRAM_STATUS_AFTER_M1.md` §3.1 |
| Coverage Roadmap status | Valid; wave ordering, domain classification, dependencies, and priority re-confirmed post-M1 with no change | `PHASE4_PROGRAM_STATUS_AFTER_M1.md` §4 |
| Next domain per roadmap | Wave 2 — Domain B: Tenant Administration & Licensing (6 RPCs, 48.1% → 51.4%, Low effort) | `PHASE4_COVERAGE_ROADMAP.md` §6.2; `PHASE4_PROGRAM_STATUS_AFTER_M1.md` §6 |
| Domain B prerequisite | Domain A (Auth) — **satisfied** (M1 complete, accepted) | `PHASE4_PROGRAM_STATUS_AFTER_M1.md` §4.3 |
| Audit gate | Frozen and accepted (CURRENT_TASK-012/013); independently re-run green 2026-07-15 | `PHASE4_PROGRAM_STATUS_AFTER_M1.md` §3.1 |
| Phase 4 exit criteria | EC-3, EC-4 DONE; EC-1, EC-2 PARTIAL (progress-bound on remaining coverage waves) | `PHASE4_PROGRAM_STATUS_AFTER_M1.md` §5 |

CURRENT_TASK-014 is closed. No CURRENT_TASK-015 existed prior to this document. Phase 4 remains active.

---

## 3. Authorized Scope

### 3.1 In Scope

The 6 uncovered Domain B RPCs, organized into 3 sub-groups:

| Sub-group | RPCs | Source Files |
|---|---|---|
| Licensing | `generate_tenant_license`, `validate_tenant_license` | `services/admin/licenseService.ts` |
| Member Invitations | `accept_invitation`, `lookup_invitation` | `services/admin/memberAdminService.ts` |
| Program Analytics | `get_churn_cohort_metrics`, `get_revenue_metrics` | `services/admin/analyticsAdminService.ts`, `services/billingAutomationService.ts` |

**Count: 6 unique RPCs.** (`get_revenue_metrics` and `get_churn_cohort_metrics` are each called from two files — `services/admin/analyticsAdminService.ts` and `services/billingAutomationService.ts` — but counted once each, per the roadmap's cross-file-shared counting convention. A single handler per name serves both call sites.)

**Files permitted to change:**
- `tests/mocks/supabase.ts` — add 6 handler blocks.
- Test files under `tests/` that exercise the newly-mocked tenant-admin paths (encouraged, not mandatory for coverage-only acceptance).

### 3.2 Out of Scope

- All other domains: A (complete), C, D, E, F, G, H and H1–H9.
- Any production code (`services/`, `lib/`, `utils/`, UI, components, pages).
- Any migration, `supabase/schema.sql`, or generated types.
- The audit script `scripts/audit-rpc-contracts.ts` (accepted and frozen in CURRENT_TASK-013).
- CI workflow (`.github/workflows/ci.yml`) and `package.json`.
- Any new file, script, or governance artifact.
- Mock behavioral shape-validation gate (deferred to a possible Phase 4+ hardening task per Roadmap §8).
- Refactor of `tests/mocks/supabase.ts` to a Map-based dispatch (Roadmap §8 risk note; explicitly deferred).
- Re-opening, re-ordering, or re-classifying the Coverage Roadmap.

### 3.3 Governance Boundary

CURRENT_TASK-015 processes **exactly one domain** (Domain B). It is well under the ~20-RPC task-sizing ceiling (6 RPCs). It satisfies the Phase 4 CURRENT_TASK Generation Rule (`CURRENT_PHASE.md` §8): maps to the Phase 4 objective "test mocks derived from / validated against the canonical migration contract"; stays inside Phase 4 scope; honors Phase 4 constraints; produces Phase 4 exit evidence (coverage delta + audit gate green).

---

## 4. Domain Confirmation (Roadmap Cross-Check)

Domain B is confirmed against `PHASE4_COVERAGE_ROADMAP.md`:

| Attribute | Roadmap Value (§2 Domain B, §4, §5.1, §6.2) | Confirmed |
|---|---|---|
| Domain | B — Tenant Administration & Licensing | YES |
| Wave | Wave 2 | YES |
| RPC count | 6 unique RPCs | YES |
| Sub-groups | Licensing (2), Member Invitations (2), Program Analytics (2) | YES |
| Source files | `services/admin/licenseService.ts`, `services/admin/memberAdminService.ts`, `services/admin/analyticsAdminService.ts`, `services/billingAutomationService.ts` | YES |
| Dependency | Depends on A (Auth) | YES — A complete (M1) |
| Priority Score | 9/15 (Medium business criticality, Medium dependency depth — H license gates, Medium test-path unblock, Low mock complexity, 6 RPCs) | YES |
| Priority rank | 3rd (A → H → B → E → D → C → G → F); A complete, H deferred to Wave 3 per roadmap, so B is next | YES |
| Estimated complexity | Low — 4 Simple, 2 Medium, 0 Complex | YES |
| Estimated handler lines | ~90 | YES |
| Estimated effort | Low — one focused session | YES |
| Expected coverage increase | 48.1% → 51.4% (+3.3 pp; 88 → 94 covered) | YES |
| Risk | Low — no stateful transactions; mostly read/validate; analytics RPCs are cross-file shared but counted once | YES |

**No deviation from the approved Roadmap.** The Roadmap is not modified by this document.

---

## 5. Canonical Source

| Artifact | Path | Classification | Authority |
|---|---|---|---|
| Forward migration chain | `supabase/migrations/*.sql` (top-level, non-recursive, excluding `rollback/`) | **Canonical** | Master Plan §2.1; reaffirmed in CURRENT_TASK-012 and CURRENT_TASK-013. |

The canonical source for the 6 Domain B RPCs is the set of `CREATE [OR REPLACE] FUNCTION public.<name>` declarations for those 6 names in the forward migration chain. Each mock handler's return shape must be derivable from the corresponding migration function's `RETURNS` clause and parameter list.

**Canonical-derived references (acceptable, one step removed):**
- `supabase/schema.sql` (Phase 2 accepted) — final-state function definitions.
- `supabase/generated/database.types.ts` (Phase 2 accepted) — typed `Functions` block.
- `D-P3-01_Reconciled_RPC_Contract.md` (Phase 3 accepted) — reconciled service call-sites.

**Non-canonical (must not override):** `docs/admin-dashboard/RPC_CONTRACTS.md` and any other hand-maintained derived document. The audit script no longer reads it (CURRENT_TASK-012); this task must not reintroduce it as a reference.

**Verification mechanism:** `npx tsx scripts/audit-rpc-contracts.ts` — the same gate accepted in CURRENT_TASK-013. It enforces mock ⊆ migrations (stale-mock hard fail), duplicate-handler hard fail, and reports coverage informationally. The coverage line is the milestone metric.

---

## 6. Domain Inventory

Inventory of the 6 Domain B RPCs: service call-site, canonical migration file, and canonical `RETURNS` clause. Independently verified by reading the migration files and grepping the service layer.

| # | RPC | Service (call-site) | Canonical Migration File | Canonical RETURNS | Complexity |
|---|---|---|---|---|---|
| 1 | `generate_tenant_license` | `services/admin/licenseService.ts:89` | `20260720000001_sp_7_3_licenses.sql` (line 37) | `public.licenses` (single row) | Medium — inserts a license row + audit log; `is_system_admin()` guard; returns structured payload |
| 2 | `validate_tenant_license` | `services/admin/licenseService.ts:107` | `20260720000001_sp_7_3_licenses.sql` (line 106) | `TABLE(valid BOOLEAN, license_id UUID, tenant_id UUID, plan TEXT, reason TEXT)` | Simple — read/validate; returns a small typed row with a `reason` discriminator (`not_found` / `revoked` / `expired` / null) |
| 3 | `lookup_invitation` | `services/admin/memberAdminService.ts:229` | `20260714000001_accept_invitation_rpc.sql` (line 17) | `TABLE(tenant_id UUID, tenant_name TEXT, tenant_subdomain TEXT, tenant_custom_domain TEXT, role TEXT, email TEXT, active BOOLEAN, expired BOOLEAN)` | Simple — read-only join `invitations` × `tenants` by token |
| 4 | `accept_invitation` | `services/admin/memberAdminService.ts:247` | `20260714000001_accept_invitation_rpc.sql` (line 53) | `public.tenant_memberships` (single row) | Medium — mutates `invitations` (status → accepted) + inserts `tenant_memberships` + audit log; multi-guard (auth, existence, status, expiry, email match, duplicate membership) |
| 5 | `get_revenue_metrics` | `services/admin/analyticsAdminService.ts:25` + `services/billingAutomationService.ts:83` (cross-file shared) | `20250708000010_phase_p16_1_revenue_metrics.sql` (line 4) | `JSON` | Simple — read-only aggregate; `is_system_admin()` guard; returns computed MRR/ARR/revenue-by-plan JSON |
| 6 | `get_churn_cohort_metrics` | `services/admin/analyticsAdminService.ts:52` + `services/billingAutomationService.ts:150` (cross-file shared) | `20250708000011_phase_p16_2_churn_cohort.sql` (line 5) | `JSON` | Simple — read-only aggregate; `is_system_admin()` guard; returns churn/cohort/LTV JSON |

**Inventory totals:**
- 6 unique RPCs.
- 4 service files contain call-sites (`services/admin/licenseService.ts`, `services/admin/memberAdminService.ts`, `services/admin/analyticsAdminService.ts`, `services/billingAutomationService.ts`).
- 4 canonical migration files define the 6 RPCs (`20260720000001_sp_7_3_licenses.sql` defines 2; `20260714000001_accept_invitation_rpc.sql` defines 2; `20250708000010_phase_p16_1_revenue_metrics.sql` defines 1; `20250708000011_phase_p16_2_churn_cohort.sql` defines 1).
- 2 RPCs are cross-file shared (`get_revenue_metrics`, `get_churn_cohort_metrics`); each is served by a single handler keyed by name.
- Complexity distribution: 4 Simple (`validate_tenant_license`, `lookup_invitation`, `get_revenue_metrics`, `get_churn_cohort_metrics`), 2 Medium (`generate_tenant_license`, `accept_invitation`), 0 Complex. Matches Roadmap §5.1.

---

## 7. Architecture Decision

### 7.1 Strategy Confirmation (Program Manager Decision)

The Coverage Roadmap strategy was approved in `CURRENT_TASK-014_ARCHITECTURE_DECISION.md` §5.1 and re-validated post-M1 in `PHASE4_PROGRAM_STATUS_AFTER_M1.md` §4. This decision does **not** re-approve the strategy; it confirms Domain B as the next domain under the already-approved strategy.

| Strategy Element | Status | Basis |
|---|---|---|
| **Wave** | Unchanged — 4 waves, sequential, one CURRENT_TASK authorized at a time. | Roadmap §6.2; CURRENT_TASK-014 §5.1. |
| **Domain** | Unchanged — 8 domains (A–H), H sub-divided into 9 sub-domains. | Roadmap §2. |
| **Dependency** | Unchanged — A → B → H entity leaves → H transactions → H residuals → cross-cutting. | Roadmap §3; post-M1 re-validation §4.3. |
| **Milestone** | Unchanged — M0 (37.2%) → M7 (100.0%), M4 (80.3%) intermediate floor available. | Roadmap §7. |

### 7.2 Next Domain Selection (Program Manager Decision)

**Selected domain: Domain B — Tenant Administration & Licensing (6 RPCs, Wave 2 / TASK-B).**

| Criterion | Assessment |
|---|---|
| **Why selected** | Next domain on the approved Roadmap's Wave 2. Domain A (Wave 1) is complete and accepted; B's sole prerequisite (A) is satisfied. The post-M1 status review (`PHASE4_PROGRAM_STATUS_AFTER_M1.md` §6) independently recommended B as the next task. |
| **Why B and not H** | Although H has a higher raw priority score (12 vs B's 9), the roadmap deliberately orders B before H: (1) B's `validate_tenant_license` mock unblocks commerce feature-access test paths that H flows call; (2) B is small (6 RPCs, Low effort) and clears the entire tenant-administration surface in one task, reducing later wave interference; (3) H is large (58 RPCs across 9 sub-domains) and is wave-internal-ordered by entity-before-transaction dependencies — it does not benefit from being started before B. This is the roadmap's own ordering (§6.1 item 2), re-confirmed post-M1. |
| **Dependency** | Depends on A (Auth) — **satisfied** (M1 complete, accepted). Member invitation + license validation require auth context (`is_system_admin`, tenant resolution), now mocked. |
| **Risk** | Low. No stateful transactions; mostly read/validate. `accept_invitation` and `generate_tenant_license` mutate but are bounded single-entity inserts with clear guard chains. The two analytics RPCs are cross-file shared but counted once — one handler per name serves both call sites. |
| **Estimated Scope** | 6 RPCs; ~90 handler lines; 4 Simple + 2 Medium + 0 Complex. Effort class: Low. |
| **Expected Coverage Increase** | 48.1% → 51.4% (+3.3 pp; 88/183 → 94/183 covered; 95 → 89 uncovered). Reaches milestone **M2 — Tenant Admin**. |

### 7.3 Architecture Decision for CURRENT_TASK-015

**Decision: Extend `tests/mocks/supabase.ts` with 6 additive handler blocks for the Domain B RPCs, each following the existing `if (name === '...')` dispatch pattern, with return shapes derived from the canonical migration chain.**

| Decision Element | Definition |
|---|---|
| **Mock Strategy** | Additive-only insertion of 6 `if (name === '<rpc>')` handler blocks into the existing single dispatch function in `tests/mocks/supabase.ts`. No new file, no new abstraction, no Map dispatch, no new dependency. Reuses the helper/pattern already present (ponytail "reuse the helper already here" rung). |
| **Return Shape Strategy** | Each handler's return shape is derived directly from its canonical migration function's `RETURNS` clause and parameter list: `generate_tenant_license` → `{ data: license\|null, error }` shaped as a `licenses` row; `validate_tenant_license` → `{ data: { valid, license_id, tenant_id, plan, reason }, error }` (single-row TABLE return modeled as one object); `lookup_invitation` → `{ data: { tenant_id, tenant_name, tenant_subdomain, tenant_custom_domain, role, email, active, expired }, error }`; `accept_invitation` → `{ data: membership\|null, error }` shaped as a `tenant_memberships` row; `get_revenue_metrics` → `{ data: <revenue-json>, error }`; `get_churn_cohort_metrics` → `{ data: <churn-json>, error }`. Authorization guards present in the canonical functions (`is_system_admin()` in `generate_tenant_license`, `get_revenue_metrics`, `get_churn_cohort_metrics`; `auth.uid()` + email-match in `accept_invitation`) are mirrored via the existing mock store / `isSystemAdmin` state established in CURRENT_TASK-014. |
| **Canonical Source** | `supabase/migrations/*.sql` forward chain — specifically `20260720000001_sp_7_3_licenses.sql`, `20260714000001_accept_invitation_rpc.sql`, `20250708000010_phase_p16_1_revenue_metrics.sql`, `20250708000011_phase_p16_2_churn_cohort.sql`. `supabase/schema.sql` and `supabase/generated/database.types.ts` are acceptable canonical-derived references. No hand-maintained derived document may override the chain. |
| **Dispatch Pattern** | The existing `if (name === '...')` chain already present in `tests/mocks/supabase.ts`. The 6 new blocks are inserted additively; no existing handler is modified, reordered, or removed. No Map refactor. |
| **Validation Strategy** | Three gates, all independently re-runnable: (1) `npx tsx scripts/audit-rpc-contracts.ts` exit 0 (stale-mock ⊆ migrations, no duplicates, no code-RPC-missing-from-migrations; coverage line = milestone metric); (2) `npx tsc --noEmit` exit 0; (3) `npx vitest run` all pass with no regression vs the CURRENT_TASK-014 accepted baseline (68 files, 389 tests). Return-shape fidelity to canonical `RETURNS` is enforced by review (Constraint #6), not by an automated gate — the automated shape-validation gate remains explicitly deferred to a possible Phase 4+ hardening task. |
| **Traceability Requirement** | 6/6 RPCs must be traced to their canonical `CREATE [OR REPLACE] FUNCTION public.<name>` declaration (migration file + line) in the Implementation Report and independently re-verified in the Acceptance Record. Each trace records: RPC name, service call-site, canonical migration file, `RETURNS` clause, mock return shape, and PASS/FAIL. |

**Affirmations:**
- **Additive-only.** The 89 existing handlers (88 covering code RPCs + 1 accepted orphan `update_tenant_status`) are unchanged: no modification, no removal, no reorder.
- **No handler rewrite.** Each of the 6 new handlers is a fresh `if (name === '...')` block; no existing handler is split, merged, or renamed.
- **`if (name === '...')` dispatch.** No Map dispatch, no switch, no new abstraction. The existing pattern is reused verbatim.
- **Derived directly from `supabase/migrations/*.sql`.** Every return shape is derivable from the canonical migration function's `RETURNS` clause and parameter list. No derived markdown contract is referenced.

**Rejected alternatives (not chosen, recorded for traceability):**
- *Generate mocks from the canonical source.* Rejected in Roadmap §8 and not revisited: the codegen path is disproportionate to the coverage goal and risks introducing a new derived artifact whose own correctness would then need validation.
- *Refactor `tests/mocks/supabase.ts` to a Map-based dispatch first.* Explicitly deferred (Roadmap §8 risk note). The file is already a single dispatch function; the roadmap does not require the refactor and CURRENT_TASK-015 must not expand scope to include it.
- *Merge B with a later domain to reduce task count.* Rejected — the roadmap's task-sizing principle (§6.3) deliberately keeps each task small and single-domain for risk isolation and objective acceptance. B is already small (6 RPCs); merging would violate the one-domain-per-task pattern established in CURRENT_TASK-014.

---

## 8. Constraints

Inherited from `CURRENT_PHASE.md` §5 and the Roadmap §6.4 per-task acceptance template:

1. No feature development, no architecture redesign, no scope expansion.
2. No modification of production code, migrations, schema, generated types, CI workflow, or `package.json`.
3. No new files. No new scripts. No new governance artifacts.
4. No implementation outside an approved CURRENT_TASK.
5. Mock handlers must follow the existing `if (name === '...')` dispatch pattern already present in `tests/mocks/supabase.ts`.
6. Mock return shapes must match the canonical migration function signatures (return type + parameter set). A mock that returns a shape inconsistent with its migration function is a defect, even if tests pass.
7. Handlers are **additive only** — no modification or removal of the existing 89 handlers (88 covering code RPCs + 1 accepted orphan `update_tenant_status`).
8. The audit script `scripts/audit-rpc-contracts.ts` is frozen; this task must not modify it.
9. The task must not introduce a mock for an RPC not defined in the canonical migration chain (the stale-mock gate would hard-fail).
10. The task must not introduce a duplicate handler for an already-mocked RPC (the duplicate-handler gate would hard-fail).

---

## 9. Acceptance Criteria

CURRENT_TASK-015 is accepted only when ALL of the following hold, independently verified:

1. **Mock presence.** All 6 Domain B RPCs (`generate_tenant_license`, `validate_tenant_license`, `accept_invitation`, `lookup_invitation`, `get_churn_cohort_metrics`, `get_revenue_metrics`) have exactly one `if (name === '...')` handler block in `tests/mocks/supabase.ts`.
2. **Audit gate green.** `npx tsx scripts/audit-rpc-contracts.ts` exits 0 — zero stale mocks, zero duplicate handlers, zero code-RPCs-missing-from-migrations.
3. **Coverage delta.** The audit coverage report shows covered count = 94 (was 88) and uncovered count = 89 (was 95), i.e. coverage = 51.4% (was 48.1%), with exactly +6 newly covered RPCs and 0 new uncovered RPCs.
4. **TypeScript.** `npx tsc --noEmit` exits 0.
5. **Test suite.** `npx vitest run` passes with no regression versus the CURRENT_TASK-014 accepted baseline (68 files, 389 tests). A higher pass count is acceptable (new tests exercising the newly-mocked tenant-admin paths are encouraged but not mandatory).
6. **Scope integrity.** `git diff --stat` shows changes only in `tests/mocks/supabase.ts` and (optionally) `tests/**`. Zero diff in `services/`, `lib/`, `utils/`, `supabase/`, `scripts/`, `.github/`, `package.json`, or any governance document.
7. **Additive-only.** The 89 existing handlers are unchanged (verified by diff: no removals, no edits to existing handler blocks).
8. **Shape fidelity (review-enforced).** Each new handler's return shape is consistent with its canonical migration function's `RETURNS` clause and parameter list. Verified by inspection against `supabase/migrations/*.sql` (or `supabase/schema.sql` as canonical-derived reference), not by an automated gate.
9. **Traceability.** 6/6 RPCs are traced to their canonical `CREATE [OR REPLACE] FUNCTION public.<name>` declaration (migration file + line) in the Implementation Report, and independently re-verified in the Acceptance Record.

---

## 10. Exit Criteria

CURRENT_TASK-015 is closed when ALL of the following hold:

1. All Acceptance Criteria (§9) are independently verified and recorded in a `CURRENT_TASK-015_ACCEPTANCE_RECORD.md`.
2. The coverage milestone **M2 — Tenant Admin (51.4%)** is reached and evidenced by an independent run of the audit gate.
3. No Critical or Major risk from §12 remains open.
4. The task's diff is committed and the audit gate is green on the committed state.
5. The Program Manager signs the Acceptance Record.

Exit from CURRENT_TASK-015 does **not** exit Phase 4. Phase 4 exit requires the full Phase 4 exit criteria (`CURRENT_PHASE.md` §4) to be met and recorded in `PHASE4_ACCEPTANCE_RECORD.md`. CURRENT_TASK-015 contributes to, but does not satisfy, those criteria.

---

## 11. Deliverables

| # | Deliverable | Owner | Form |
|---|---|---|---|
| 1 | Extended `tests/mocks/supabase.ts` with 6 Domain B handler blocks | Engineering team (within authorized CURRENT_TASK-015 implementation) | Code diff, additive-only |
| 2 | `CURRENT_TASK-015_IMPLEMENTATION_REPORT.md` | Engineering team | Markdown report (defined here; not generated by this document) |
| 3 | `CURRENT_TASK-015_ACCEPTANCE_RECORD.md` | Program Manager | Markdown acceptance record with independent verification evidence (defined here; not generated by this document) |
| 4 | Coverage milestone M2 evidence | Program Manager | Audit gate output snippet in the Acceptance Record |

**Deliverable definitions (not generated at this step):**

- **`CURRENT_TASK-015_IMPLEMENTATION_REPORT.md`** — Engineering self-report. Must contain: (a) the 6 handler blocks added (diff summary); (b) the 6/6 traceability table (RPC → service call-site → canonical migration file + line → `RETURNS` clause → mock return shape); (c) the three validation gate outputs (audit, tsc, vitest); (d) confirmation of additive-only and scope integrity; (e) any `ponytail:` ceiling notes for intentional simplifications (e.g., analytics mocks returning fixed aggregate shapes).
- **`CURRENT_TASK-015_ACCEPTANCE_RECORD.md`** — Program Manager independent acceptance review. Must contain: (a) objective; (b) scope verification; (c) evidence reviewed (independently reproduced); (d) architecture compliance (10/10 constraints); (e) scope compliance; (f) traceability review (6/6 independently re-verified); (g) validation result (3/3 gates green, independently executed); (h) coverage result (48.1% → 51.4%, exact match); (i) regression result; (j) contract impact (= None); (k) governance compliance; (l) risks; (m) final decision; (n) Program Manager signature.

**Not a deliverable of this task:** any change to production code, migrations, schema, generated types, CI, `package.json`, the audit script, or any governance/planning document. Any such change is a scope violation.

---

## 12. Risk Assessment

| # | Risk | Severity | Mitigation | Residual |
|---|---|---|---|---|
| 1 | **Mock behavioral fidelity** — a Domain B mock returns a shape inconsistent with its canonical migration function, tests pass against a fictional contract (the exact failure mode Phase 4 exists to eliminate). | **High** | Constraint #6 + Acceptance Criterion #8 require review-enforced shape fidelity against `supabase/migrations/*.sql`. The audit gate already enforces mock ⊆ migrations. Automated shape-validation gate explicitly deferred to a possible Phase 4+ hardening task. | Medium — review-enforced, not gate-enforced. |
| 2 | **`accept_invitation` stateful mutation** — the canonical function mutates `invitations` (status → accepted) and inserts `tenant_memberships` + audit log under a multi-guard chain (auth, existence, status, expiry, email match, duplicate membership). A naive mock could misrepresent the guard order or skip the invitation-status transition. | Medium | The mock must mirror the canonical guard chain using the existing mock store (auth.uid via current user state, invitation lookup by token, status/expiry/email checks). Per the ponytail rule, this non-trivial stateful handler should leave at least one runnable check (a test exercising the happy path and one error path, e.g. expired-token rejection). Acceptance Criterion #5 (vitest green) + #8 (shape fidelity) enforce this. | Low-Medium. |
| 3 | **`generate_tenant_license` audit-log side effect** — the canonical function inserts an `audit_log` row in addition to the `licenses` row. A mock that omits the audit-log side effect is acceptable for coverage (the audit_log table is not under test here) but should be marked with a `ponytail:` ceiling note naming the omitted side effect and the upgrade path. | Low | `ponytail:` comment on the handler documenting the omitted audit-log side effect. The audit gate does not test side effects; coverage acceptance is on the RPC return shape only. | Low. |
| 4 | **Cross-file shared analytics RPCs** — `get_revenue_metrics` and `get_churn_cohort_metrics` are each called from two service files (`analyticsAdminService.ts` + `billingAutomationService.ts`). A single mock per name must satisfy both call-site contracts. | Low | The mock is keyed by RPC name, not call-site; one handler serves both. Both call-sites pass the same parameter shape (`{ p_start_date?, p_end_date?, ... }`). Verified by Acceptance Criterion #1 (exactly one handler per name) and #2 (audit green). | Low. |
| 5 | **`tests/mocks/supabase.ts` growth** — adding ~90 lines brings the file from ~2,782 (post-CURRENT_TASK-014) to ~2,872 lines, further from the Map-based-dispatch refactor noted in the existing `ponytail:` comment. | Low | The refactor is explicitly deferred (Roadmap §8). The file remains a single dispatch function; growth is linear and bounded by the roadmap's total ~2,080-line ceiling. | Low. |
| 6 | **Scope creep** — the task expands beyond Domain B (e.g., mocking a downstream commerce flow that `validate_tenant_license` gates). | Low | Acceptance Criterion #6 prohibits touching files outside `tests/mocks/supabase.ts` + `tests/**`. The audit gate's stale-mock and duplicate-handler detection provide an automated guard against accidental cross-domain additions. | Low. |
| 7 | **Working-tree governance gap** — uncommitted changes from prior tasks (CURRENT_TASK-010…014) remain in the working tree (last commit `afdef607`); `git diff HEAD` will show changes outside CURRENT_TASK-015's scope. | Low (informational) | Independent verification in the Acceptance Record must attribute out-of-scope diffs to prior accepted tasks, not CURRENT_TASK-015 (mirroring CURRENT_TASK-014 §13 Minor Note 1). Recommendation: commit accepted tasks after each acceptance review. Does not block M2 authorization. | Low. |

**No Critical risks identified.** Risk #1 (mock fidelity) is the inherent Phase 4 risk and is mitigated by review-enforced shape fidelity plus the audit stale-mock gate; it is common to every coverage task and tracked at the program level (`PHASE4_PROGRAM_STATUS_AFTER_M1.md` §7).

---

## 13. Governance Compliance

| Governance Principle | Compliance | Evidence |
|---|---|---|
| **Scope Lock** | PASS | Exactly Domain B, exactly 6 RPCs, no scope expansion. Task-sizing ceiling (~20 RPCs) not exceeded (6 << 20). Out-of-scope list (§3.2) explicitly excludes all other domains and all production/migration/schema/type/audit/CI surfaces. |
| **Canonical-first** | PASS | All 6 mock return shapes to be derived from canonical migration `RETURNS` clauses (§6 inventory). No derived document overrides the canonical chain. Audit stale-mock gate enforces mock ⊆ migrations. |
| **Additive-only** | PASS | 6 new handler blocks inserted; 89 existing handlers unchanged (Constraint #7, Acceptance Criterion #7). No dispatch change, no new file, no new abstraction. |
| **Phase 4 Alignment** | PASS | Task maps to Phase 4 objective ("test mocks derived from / validated against the canonical migration contract"); stays inside Phase 4 scope; honors Phase 4 constraints (`CURRENT_PHASE.md` §5); produces Phase 4 exit evidence (coverage delta + audit gate green). |
| **CURRENT_TASK Generation Rule** | PASS | Satisfies `CURRENT_PHASE.md` §8: maps to a Phase 4 objective, inside Phase 4 scope, satisfies Phase 4 constraints, produces Phase 4 exit evidence. |
| **Roadmap Conformance** | PASS | Domain B is Wave 2 / TASK-B exactly as defined in `PHASE4_COVERAGE_ROADMAP.md` §6.2; no reordering, no reclassification, no priority change. Post-M1 status review (`PHASE4_PROGRAM_STATUS_AFTER_M1.md` §6) independently recommended B as the next task. |
| **One-task-at-a-time** | PASS | CURRENT_TASK-014 is closed and accepted; no other CURRENT_TASK is open. CURRENT_TASK-015 is the sole next task; CURRENT_TASK-016 is not created by this document. |
| **No implementation by this document** | PASS | This document authorizes no code change. Implementation requires a separate Program Manager approval after this Architecture Decision is approved. |

---

## 14. Scope Lock (Restated)

CURRENT_TASK-015 must **not**:

- Modify production code (`services/`, `lib/`, `utils/`, UI, components, pages).
- Modify services (including `services/admin/licenseService.ts`, `services/admin/memberAdminService.ts`, `services/admin/analyticsAdminService.ts`, `services/billingAutomationService.ts` — these are call-sites only, read-only references for inventory).
- Modify migrations (`supabase/migrations/*.sql`).
- Modify schema (`supabase/schema.sql`).
- Modify generated types (`supabase/generated/database.types.ts`).
- Modify the audit gate (`scripts/audit-rpc-contracts.ts` — frozen).
- Modify CI (`.github/workflows/ci.yml`) or `package.json`.
- Expand into any other domain (A, C, D, E, F, G, H, H1–H9).
- Create any new file, script, or governance artifact (the Implementation Report and Acceptance Record are the only new documents, generated at their respective later steps, not by this document).
- Re-open, re-order, or re-classify the Coverage Roadmap.

The only file this task is permitted to change is `tests/mocks/supabase.ts` (additive handler blocks) and, optionally, `tests/**` test files that exercise the newly-mocked paths.

---

## 15. Final Decision Block

```text
PROGRAM MANAGER DECISION

Architecture Compliance
PASS

Scope Definition
PASS

Governance Compliance
PASS

Decision

CURRENT_TASK-015

Architecture Decision
COMPLETED

Implementation
NOT AUTHORIZED

Awaiting Program Manager Approval
```

---

*This document is an Architecture Decision only. It creates no mock, writes no code, modifies no source file, and authorizes no implementation. Implementation of CURRENT_TASK-015 requires a separate Program Manager approval issued after this Architecture Decision is accepted. CURRENT_TASK-016 is not created by this document.*
