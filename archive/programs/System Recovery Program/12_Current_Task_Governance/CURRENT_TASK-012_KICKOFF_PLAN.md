# CURRENT_TASK-012 — Phase 4 Kickoff Plan

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Document Type:** Kickoff Plan / CURRENT_TASK Proposal  
**Date:** 2026-07-14  
**Status:** READY FOR PROGRAM MANAGER REVIEW  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `SCAR_PHASE4_REPORT.md`, `PHASE3_ACCEPTANCE_RECORD.md`, `PHASE4_REAUTHORIZATION_REVIEW.md`

---

> **No implementation. No code change. No migration. No schema change. No generated type. No Architecture Decision.**  
> This document is a planning deliverable only. It inventories SCAR Phase 4 findings, maps them to Phase 4 objectives, prioritizes them, and proposes the first `CURRENT_TASK-012` for Program Manager approval.  
> No implementation may begin until the Program Manager approves `CURRENT_TASK-012`.

---

## 1. Phase 4 Confirmation

### 1.1 Phase 4 Objective

**Purpose (Master Plan §4, Phase 4):** Rebuild the test and audit layers so that they validate the real canonical contract rather than a fictional or derived one.

**Strategic Objective (CURRENT_PHASE.md §1):** With the canonical migration chain stabilized in Phase 2 and the service-layer RPC contract reconciled and formally accepted in Phase 3, the program now restores trust in the derived validation layer. This phase realigns test mocks and assertions that currently implement or assume missing RPCs, redirects operational audit tooling that compares code against a markdown contract document instead of the migration chain, and establishes continuous integration gates that compare derived artifacts against the canonical source. The result is a validation layer whose passing state implies the real production contract holds, not a fictional one.

### 1.2 Phase 4 Scope

Exactly as defined in `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 and `CURRENT_PHASE.md` §2:

| # | Scope Item |
|---|---|
| S1 | Test mocks and test assertions that currently implement or assume missing RPCs. |
| S2 | Operational audit tooling that compares code against a markdown contract document instead of the migration chain. |
| S3 | Continuous integration gates that must compare derived artifacts against the canonical source. |

### 1.3 Phase 4 Deliverables

| ID | Deliverable | Master Plan Ref |
|---|---|---|
| D-P4-01 | Validated Test Base | §4 Phase 4 Deliverables #1 |
| D-P4-02 | Canonical Audit Gate Definition | §4 Phase 4 Deliverables #2 |
| D-P4-03 | CI Gate Evidence | §4 Phase 4 Deliverables #3 |
| D-P4-04 | Test-Audit Traceability Report | §4 Phase 4 Deliverables #4 |

### 1.4 Phase 4 Exit Criteria

| ID | Exit Criterion | Master Plan Ref |
|---|---|---|
| EC-1 | Test mocks are derived from or validated against the canonical migration contract. | §4 Phase 4 Exit Criteria #1 |
| EC-2 | Passing tests imply that the corresponding production path will not fail on the previously known contract breaks. | §4 Phase 4 Exit Criteria #2 |
| EC-3 | The operational audit script compares service-layer RPC calls against the canonical migration chain, not against another derived document. | §4 Phase 4 Exit Criteria #3 |
| EC-4 | CI gates fail when a derived artifact diverges from the canonical source. | §4 Phase 4 Exit Criteria #4 |

### 1.5 Phase 4 Validation Rules

| ID | Validation Rule | Master Plan Ref |
|---|---|---|
| V-1 | A deliberate injection of a non-existent RPC call is caught by the audit gate and by the test base. | §4 Phase 4 Validation #1 |
| V-2 | The audit gate reports zero missing RPCs against the canonical migration chain. | §4 Phase 4 Validation #2 |

### 1.6 Phase 4 Constraints

From `CURRENT_PHASE.md` §5 — the following are explicitly prohibited during Phase 4:

- No feature development.
- No architecture redesign.
- No scope expansion beyond the Recovery Program charter.
- No unrelated bug fixes.
- No implementation outside an approved `CURRENT_TASK`.
- No new master plans, new program hierarchies, or competing sources of program status.
- No modification of code, migrations, or tests to advance this phase except through an authorized `CURRENT_TASK`.
- No generation of implementation tasks other than through the Phase 4 `CURRENT_TASK` rule defined in `CURRENT_PHASE.md` §8.

### 1.7 CURRENT_TASK Generation Rule

From `CURRENT_PHASE.md` §8 — `CURRENT_TASK` documents may only be generated when:

- The task maps directly to one Phase 4 objective.
- The task remains strictly inside Phase 4 scope as defined in §1.2 above.
- The task satisfies Phase 4 constraints as defined in §1.6 above.
- The task produces evidence required by the Phase 4 exit criteria.

### 1.8 Phase 4 Entry Status

All Phase 4 entry criteria are satisfied. Confirmed in `PHASE4_REAUTHORIZATION_REVIEW.md` §4–§5:

| Entry Criterion | Evidence |
|---|---|
| Phase 3 exit criteria are satisfied | `PHASE3_ACCEPTANCE_RECORD.md` — Status: Accepted, 2026-07-14; all Phase 3 exit criteria EC-1…EC-5 recorded as PASS. |
| Canonical migration chain, schema artifact, and reconciled RPC contract are accepted | `PHASE3_ACCEPTANCE_RECORD.md` §6 accepts D-P3-01…04; `supabase/schema.sql` (1,357,565 bytes), `supabase/generated/database.types.ts`, and `D-P3-01_Reconciled_RPC_Contract.md` are present and accepted. |
| Test and audit tooling inventory from SCAR Phase 4 is available | `SCAR_PHASE4_REPORT.md` is present in the repository working tree. |

Phase Entry Gate: **PASS** — 0 Critical / 0 Major risks; no unresolved critical blocker.

---

## 2. SCAR Phase 4 Findings Inventory

### 2.1 Canonical Sources Assessed

| Source | Path | Classification |
|---|---|---|
| Database migrations | `supabase/migrations/*.sql` | **Canonical** |
| Generated schema artifact | `supabase/schema.sql` | **Canonical-derived** (Phase 2 accepted) |
| Generated type artifact | `supabase/generated/database.types.ts` | **Canonical-derived** (Phase 2 accepted) |
| Reconciled RPC contract | `D-P3-01_Reconciled_RPC_Contract.md` | **Canonical-derived** (Phase 3 accepted) |
| RPC contract doc | `docs/admin-dashboard/RPC_CONTRACTS.md` | **Derived but treated as canonical by audit script** |
| Service layer | `services/**/*.ts` | **Derived consumer** |
| Test mocks | `tests/mocks/supabase.ts` | **Derived validation + shadow implementation** |
| Audit script | `scripts/audit-rpc-contracts.ts` | **Operational** (checks wrong source) |
| CI workflow | `.github/workflows/ci.yml` | **Operational** |
| CI audit script invocation | `package.json` → `audit:rpc` | **Operational** |

### 2.2 Full SCAR Evidence Matrix

The following table reproduces all 14 findings from `SCAR_PHASE4_REPORT.md` §SSOT Evidence Matrix, with current status verified against the repository as of 2026-07-14.

| # | Finding | Severity | Phase 4 Scope | Current Status |
|---|---|---|---|---|
| 1 | `services/tenantService.ts` calls `admin_update_subscription` — not defined in migrations | **Critical** | N/A (Phase 3) | **RESOLVED** — CURRENT_TASK-006 aligned service to canonical `update_tenant_subscription`. Verified: grep of `services/` returns 0 matches for `admin_update_subscription`. |
| 2 | `services/tenantService.ts` calls `get_member_with_email` — migrations define `get_tenant_members_with_email` | **Critical** | N/A (Phase 3) | **RESOLVED** — CURRENT_TASK-007 aligned service to canonical `get_tenant_members_with_email`. Verified: grep of `services/` returns 0 matches for `get_member_with_email`. |
| 3 | `services/tenantService.ts` calls `search_members_by_email` — migrations define `search_tenant_members` | **Critical** | N/A (Phase 3) | **RESOLVED** — CURRENT_TASK-007 aligned service to canonical `search_tenant_members`. Verified: grep of `services/` returns 0 matches for `search_members_by_email`. |
| 4 | `services/tenantService.ts` calls `get_storage_usage` — not defined in migrations | **Critical** | N/A (Phase 3) | **RESOLVED** — CURRENT_TASK-008 aligned service to canonical `get_tenant_storage_usage`. Verified: grep of `services/` returns 0 matches for `get_storage_usage`. |
| 5 | `PLAN_AdminDashboard_SubPhases.md` marks SP-2.2, SP-2.7, SP-2.8 Done while required RPCs were missing | **High** | N/A (Phase 5 — Documentation) | **PARTIALLY RESOLVED** — RPCs now exist in code/migrations. Document staleness remains for Phase 5 reconciliation. |
| 6 | `SP-1.0-20260712_123800.md` claims `tests/test-helpers.ts` and `tests/test-helpers.test.ts` were created — files do not exist | **High** | N/A (Phase 5 — Documentation) | **OPEN** — False completion log. Phase 5 scope. |
| 7 | `PLAN_AdminDashboard_SubPhases.md` expects `ADMIN_PERMISSIONS` in `services/admin/permissions.ts` — file is thin re-export | **Medium** | N/A (Phase 5 — Documentation) | **OPEN** — Implementation pattern divergence. Phase 5 scope. |
| 8 | `ADMIN_DASHBOARD_PHASE_1_SQL_FIX.md` states 3 RPCs missing/broken — migration defines all three | **Medium** | N/A (Phase 5 — Documentation) | **OPEN** — Stale doc. Phase 5 scope. |
| 9 | Two governance tracks (`Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN` vs `Plan/PLAN_AdminDashboard_SubPhases.md`) report contradictory completion states | **High** | N/A (Phase 1 — Governance) | **RESOLVED** — Phase 1 established unified program state (`UNIFIED_PROGRAM_STATE.md`). |
| 10 | `RPC_CONTRACTS.md` lists `admin_update_subscription`, `get_storage_usage`, `search_members_by_email`, `get_member_with_email` as valid RPCs | **High** | S2 (derived doc used as audit source) | **PARTIALLY RESOLVED** — Verified: grep of `RPC_CONTRACTS.md` returns 0 matches for the 4 old RPC names. However, `RPC_CONTRACTS.md` is still a derived document; the audit script still uses it as its source of truth instead of the canonical migration chain. The doc's role as audit canonical source remains a Phase 4 issue. |
| 11 | `tests/mocks/supabase.ts` implements RPCs that migrations omit (e.g., `get_storage_usage`) | **High** | S1 (Test mocks) | **PARTIALLY RESOLVED** — Verified: grep of `tests/mocks/supabase.ts` returns 0 matches for the 4 old RPC names. The mock now implements 86 RPC handlers. However, there is no mechanism to validate that all 86 handlers correspond to migration-defined functions. Mock-to-canonical validation remains a Phase 4 issue. |
| 12 | `scripts/audit-rpc-contracts.ts` compares code RPCs to `RPC_CONTRACTS.md` instead of `supabase/migrations/*.sql` | **High** | S2 (Audit tooling) | **OPEN** — Verified: `audit-rpc-contracts.ts` line 7 sets `CONTRACT_PATH = path.resolve('docs/admin-dashboard/RPC_CONTRACTS.md')`. The script extracts RPC names from a markdown table, not from `CREATE FUNCTION` statements in migrations. This is the root cause of false quality signals. |
| 13 | `AUDIT_REPORT.md` CRIT-2 lists `set_tenant_subdomain` as missing — migration defines it | **Medium** | N/A (Phase 5 — Documentation) | **OPEN** — Stale audit report. Phase 5 scope. |
| 14 | `CURRENT_TASK-005.md` assumes 9 migrations are missing from production — local repo contains them | **Medium** | N/A (Phase 1 — Governance) | **RESOLVED** — Phase 1 governance convergence superseded the Fix-Bug track. |

### 2.3 Current State of Key Artifacts

| Artifact | Path | Current State | Phase 4 Relevance |
|---|---|---|---|
| Audit script | `scripts/audit-rpc-contracts.ts` (104 lines) | Reads `docs/admin-dashboard/RPC_CONTRACTS.md` as canonical source. Extracts RPC names from markdown table rows matching `` `identifier` ``. Compares against `supabase.rpc('...')` calls in `services/` and `lib/`. Reports `missingFromContract` and `staleInContract`. | **S2 — Primary target.** Must be realigned to extract RPC names from `CREATE FUNCTION` / `CREATE OR REPLACE FUNCTION` statements in `supabase/migrations/*.sql`. |
| Test mock | `tests/mocks/supabase.ts` (~2,500 lines) | Implements 86 RPC handlers via `if (name === '...')` switch. Returns `{ data: null, error: { code: 'PGRST116', message: 'RPC not found' } }` for unrecognized names. | **S1 — Secondary target.** Must be validated against canonical migration chain. Mock handlers for non-existent RPCs must be removed or flagged. |
| RPC contract doc | `docs/admin-dashboard/RPC_CONTRACTS.md` (18,994 bytes) | Derived markdown document. No longer lists the 4 old RPC names (cleaned in Phase 3). Still used as audit script's source of truth. | **S2 — Tertiary.** The doc itself is a Phase 5 documentation deliverable. Its role as audit source is the Phase 4 issue; once the audit script reads migrations directly, this doc becomes purely informational. |
| CI workflow | `.github/workflows/ci.yml` (36 lines) | Runs `npm run audit:rpc` as final step. No gate compares derived artifacts against canonical migration chain. | **S3 — CI gate target.** Must fail when service code invokes an RPC not defined in the canonical migration chain. |
| Package script | `package.json` → `audit:rpc` | `npx tsx scripts/audit-rpc-contracts.ts` | **S3 — Invocation point.** The script it calls is the S2 target. |
| Pre-commit hook | `package.json` → `pre-commit` | `npm run lint && npx vitest run && npm run build && npm run audit:rpc` | **S3 — Local gate.** Already invokes audit; will benefit from S2 realignment. |
| Canonical schema | `supabase/schema.sql` (1,357,565 bytes) | Phase 2 accepted generated artifact. | **Canonical source for audit.** Contains all `CREATE FUNCTION` definitions. |
| Canonical types | `supabase/generated/database.types.ts` | Phase 2 accepted generated artifact. | **Canonical-derived.** Contains RPC type signatures. |
| Reconciled RPC contract | `D-P3-01_Reconciled_RPC_Contract.md` (81,326 bytes) | Phase 3 accepted deliverable. | **Canonical-derived reference.** Documents the reconciled RPC surface. |

---

## 3. SCAR Findings → Phase 4 Objectives Mapping

### 3.1 Mapping Matrix

| SCAR # | Severity | Phase 4 Scope Item | Phase 4 Exit Criterion | Phase 4 Deliverable | Status |
|---|---|---|---|---|---|
| #12 | High | S2 — Audit tooling | EC-3 | D-P4-02 | **OPEN** — Root cause of false quality signals |
| #11 | High | S1 — Test mocks | EC-1, EC-2 | D-P4-01, D-P4-04 | **PARTIALLY OPEN** — 4 critical RPCs removed; 86 handlers not validated against canonical chain |
| #10 | High | S2 — Audit tooling (derived doc as source) | EC-3 | D-P4-02 | **PARTIALLY OPEN** — Old RPC names removed from doc; doc still used as audit source |
| CI gap | High | S3 — CI gates | EC-4 | D-P4-03 | **OPEN** — No CI gate compares derived artifacts against canonical source |
| #5 | High | N/A (Phase 5) | — | — | Phase 5 scope |
| #6 | High | N/A (Phase 5) | — | — | Phase 5 scope |
| #7 | Medium | N/A (Phase 5) | — | — | Phase 5 scope |
| #8 | Medium | N/A (Phase 5) | — | — | Phase 5 scope |
| #13 | Medium | N/A (Phase 5) | — | — | Phase 5 scope |
| #1–4 | Critical | N/A (Phase 3) | — | — | **RESOLVED** in Phase 3 |
| #9 | High | N/A (Phase 1) | — | — | **RESOLVED** in Phase 1 |
| #14 | Medium | N/A (Phase 1) | — | — | **RESOLVED** in Phase 1 |

### 3.2 Phase 4 In-Scope Findings (Open)

Only 4 findings remain in Phase 4 scope. All other SCAR findings are either resolved or belong to Phase 5.

| Priority | ID | Finding | Scope | Exit Criterion |
|---|---|---|---|---|
| **High** | P4-H1 | Audit script canonical source realignment (SCAR #12) | S2 | EC-3 |
| **High** | P4-H2 | Test mock canonical validation (SCAR #11) | S1 | EC-1, EC-2 |
| **High** | P4-H3 | CI gate against canonical source (SCAR #12 + #10 + CI gap) | S3 | EC-4 |
| **High** | P4-H4 | RPC_CONTRACTS.md role demotion (SCAR #10) | S2 | EC-3 |

---

## 4. Prioritization

### 4.1 Priority Ranking

| Rank | ID | Finding | Rationale |
|---|---|---|---|
| 1 | P4-H1 | Audit script canonical source realignment | **Foundation for all Phase 4 validation.** The audit script is the operational quality gate. Once it compares against migrations, it becomes the tool that validates test mocks (P4-H2) and enforces CI gates (P4-H3). Without this, no other Phase 4 work can be objectively verified. Directly enables V-2: "audit gate reports zero missing RPCs against the canonical migration chain." |
| 2 | P4-H3 | CI gate against canonical source | **Depends on P4-H1.** Once the audit script reads migrations, the CI workflow must fail on divergence. This is the automated enforcement layer. Directly enables EC-4. |
| 3 | P4-H2 | Test mock canonical validation | **Depends on P4-H1.** Once the audit script can extract migration-defined RPCs, the test mock's 86 handlers can be validated against that set. Directly enables EC-1, EC-2, V-1. |
| 4 | P4-H4 | RPC_CONTRACTS.md role demotion | **Consequence of P4-H1.** Once the audit script no longer reads `RPC_CONTRACTS.md`, the doc's role changes from "audit canonical source" to "informational derived document." The doc content itself is a Phase 5 deliverable; only its role demotion is Phase 4 scope. |

### 4.2 Dependency Chain

```text
P4-H1 (Audit script realignment)
  ├── P4-H3 (CI gate enforcement)     — depends on H1
  ├── P4-H2 (Test mock validation)    — depends on H1
  └── P4-H4 (RPC_CONTRACTS.md demotion) — consequence of H1
```

### 4.3 Severity Summary

| Severity | Count | Phase 4 Scope | Status |
|---|---|---|---|
| **Critical** | 0 | — | All 4 Critical RPCs resolved in Phase 3 |
| **High** | 4 | S1, S2, S3 | Open — Phase 4 targets |
| **Medium** | 5 | N/A (Phase 5) | Open — Phase 5 scope |
| **Low** | 0 | — | None identified |

---

## 5. CURRENT_TASK-012 Proposal

### CURRENT_TASK-012 — Canonical Audit Gate Realignment

#### 5.1 Objective

Realign `scripts/audit-rpc-contracts.ts` to extract the canonical RPC surface from `CREATE FUNCTION` / `CREATE OR REPLACE FUNCTION` statements in the canonical migration chain (`supabase/migrations/*.sql`) instead of from the derived markdown document (`docs/admin-dashboard/RPC_CONTRACTS.md`), and wire the CI workflow to fail when service-layer code invokes an RPC not defined in the canonical migration chain.

This is the foundational Phase 4 task. It addresses SCAR finding #12 (High) — the root cause of false quality signals — and produces the Canonical Audit Gate Definition (D-P4-02) that all subsequent Phase 4 tasks depend on.

#### 5.2 Scope

| Item | Detail |
|---|---|
| **In Scope** | See §5.3 |
| **Out of Scope** | See §5.4 |
| **Phase 4 Scope Items** | S2 (Audit tooling), S3 (CI gates) |
| **Phase 4 Exit Criteria Addressed** | EC-3, EC-4 |
| **Phase 4 Validation Rules Addressed** | V-2 |
| **Phase 4 Deliverables Produced** | D-P4-02 (Canonical Audit Gate Definition), partial D-P4-03 (CI Gate Evidence) |

#### 5.3 In Scope

1. **Audit script canonical source realignment.** Modify `scripts/audit-rpc-contracts.ts` to extract RPC names from `CREATE FUNCTION` / `CREATE OR REPLACE FUNCTION` statements in `supabase/migrations/*.sql` instead of from `docs/admin-dashboard/RPC_CONTRACTS.md`.
2. **Audit script comparison logic.** The script must compare service-layer `supabase.rpc('...')` call sites (in `services/` and `lib/`) against the migration-defined RPC set. It must report:
   - RPCs called by code but not defined in migrations (`missingFromMigrations`).
   - RPCs defined in migrations but not called by code (`unusedRpcDefinitions`) — informational, not a failure condition.
3. **Audit script exit code.** The script must exit with code 1 (failure) if any `missingFromMigrations` RPC is found. Exit 0 only when zero missing RPCs.
4. **CI workflow gate.** The existing `Audit RPC contracts` step in `.github/workflows/ci.yml` must fail the CI build when the audit script reports missing RPCs. This is already wired via `npm run audit:rpc` exit code; verify and document.
5. **Canonical Audit Gate Definition document.** Produce `D-P4-02_Canonical_Audit_Gate_Definition.md` documenting:
   - The canonical source (`supabase/migrations/*.sql`).
   - The extraction method (regex for `CREATE [OR REPLACE] FUNCTION`).
   - The comparison logic (code RPCs ⊆ migration RPCs).
   - The pass/fail criteria.
   - The CI integration point.
6. **Validation evidence.** Run the realigned audit script and record the output. The output must show zero missing RPCs against the canonical migration chain (V-2).
7. **Injection test.** Deliberately inject a non-existent RPC call in a temporary test file, run the audit script, confirm it is caught, then remove the injection. Record the evidence. (Partial V-1 — audit gate side.)

#### 5.4 Out of Scope

1. **Test mock realignment (P4-H2).** The test mock `tests/mocks/supabase.ts` is not modified in this task. It is the target of a subsequent CURRENT_TASK.
2. **RPC_CONTRACTS.md content update (Phase 5).** The markdown document's content is a Phase 5 documentation deliverable. Only its role as audit source is removed in this task; the file itself is not deleted or modified.
3. **Test-Audit Traceability Report (D-P4-04).** This is a subsequent task that depends on both the audit gate (this task) and test mock validation (P4-H2).
4. **Validated Test Base (D-P4-01).** This is a subsequent task (P4-H2).
5. **Any migration, schema, or generated-type change.** The canonical migration chain is accepted from Phase 2 and is not modified.
6. **Any service-layer code change.** The reconciled RPC contract is accepted from Phase 3 and is not modified.
7. **Any feature development, architecture redesign, or unrelated bug fix.** Prohibited by Phase 4 constraints.

#### 5.5 Dependencies

| Dependency | Type | Evidence |
|---|---|---|
| Phase 2 — Canonical Migration Chain | Predecessor phase | `D-P2-01_Canonical_Migration_Chain_Definition.md`, `supabase/schema.sql`, `supabase/generated/database.types.ts` — all accepted |
| Phase 3 — RPC Contract Reconciliation | Predecessor phase | `D-P3-01_Reconciled_RPC_Contract.md`, `D-P3-03_RPC_Coverage_Validation_Evidence.md` — all accepted; `PHASE3_ACCEPTANCE_RECORD.md` Status: Accepted |
| SCAR Phase 4 — Test/audit findings | Input inventory | `SCAR_PHASE4_REPORT.md` §SSOT Evidence Matrix #10, #12 |
| Existing audit script | Modification target | `scripts/audit-rpc-contracts.ts` (104 lines) |
| Existing CI workflow | Modification target | `.github/workflows/ci.yml` (36 lines) |
| Existing package script | Invocation point | `package.json` → `audit:rpc` → `npx tsx scripts/audit-rpc-contracts.ts` |

#### 5.6 Required Evidence

| ID | Evidence | Source |
|---|---|---|
| E-1 | Audit script reads `supabase/migrations/*.sql` as canonical source | Modified `scripts/audit-rpc-contracts.ts` source code |
| E-2 | Audit script extracts RPC names from `CREATE [OR REPLACE] FUNCTION` statements | Modified script source + sample extraction output |
| E-3 | Audit script reports zero missing RPCs against canonical migration chain (V-2) | Audit script stdout capture |
| E-4 | Audit script exits 1 when a missing RPC is detected | Injection test output |
| E-5 | CI workflow fails on audit failure | `.github/workflows/ci.yml` step configuration + local simulation |
| E-6 | No service-layer code, migration, schema, or generated-type was modified | `git diff` scope verification |

#### 5.7 Expected Deliverables

| ID | Deliverable | Format |
|---|---|---|
| D-P4-02 | Canonical Audit Gate Definition | `D-P4-02_Canonical_Audit_Gate_Definition.md` |
| D-P4-03 (partial) | CI Gate Evidence | Section within D-P4-02 or standalone `D-P4-03_CI_Gate_Evidence.md` |
| — | Modified audit script | `scripts/audit-rpc-contracts.ts` (realigned) |
| — | CI workflow (if modification needed) | `.github/workflows/ci.yml` (verified or updated) |
| — | Implementation report | `CURRENT_TASK-012_IMPLEMENTATION_REPORT.md` |

#### 5.8 Success Criteria

| ID | Criterion | Verification |
|---|---|---|
| SC-1 | The audit script extracts RPC names from `supabase/migrations/*.sql`, not from `docs/admin-dashboard/RPC_CONTRACTS.md` | Source code inspection: no reference to `RPC_CONTRACTS.md` in the script |
| SC-2 | The audit script reports zero missing RPCs against the canonical migration chain | Audit script stdout: `Missing from migrations: 0` |
| SC-3 | The audit script exits 1 when a non-existent RPC is injected | Injection test: script catches the injected RPC, exits 1 |
| SC-4 | The CI workflow's `Audit RPC contracts` step fails on audit failure | CI step uses `npm run audit:rpc` which exits 1 on failure; GitHub Actions fails the step |
| SC-5 | No service-layer code, migration, schema, or generated-type was modified | `git diff --stat` shows changes only in `scripts/`, `.github/`, and new deliverable files |
| SC-6 | The Canonical Audit Gate Definition document is produced and accepted | `D-P4-02_Canonical_Audit_Gate_Definition.md` exists and is reviewed |

#### 5.9 Validation Plan

| Step | Action | Expected Result | Evidence Captured |
|---|---|---|---|
| 1 | Run `npm run audit:rpc` with realigned script | Exit 0; output shows `Missing from migrations: 0` | E-3 |
| 2 | Inject a temporary `supabase.rpc('nonexistent_test_rpc')` call in a scratch service file | Run `npm run audit:rpc` | Exit 1; output lists `nonexistent_test_rpc` as missing | E-4 |
| 3 | Remove the injection | Run `npm run audit:rpc` | Exit 0 | — |
| 4 | Verify CI workflow step | Inspect `.github/workflows/ci.yml` line 35-36 | Step runs `npm run audit:rpc`; failure exits non-zero | E-5 |
| 5 | Verify scope | `git diff --stat` | Only `scripts/audit-rpc-contracts.ts`, `.github/workflows/ci.yml` (if needed), and deliverable `.md` files changed | E-6 |
| 6 | Run full test suite | `npx vitest run` | All existing tests pass (no test mock changes in this task) | — |

#### 5.10 Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| **Regex extraction misses RPC definitions with non-standard formatting** | Medium | Low | The canonical migration chain uses consistent `CREATE [OR REPLACE] FUNCTION` syntax. Test extraction against `supabase/schema.sql` (which contains all definitions) as a cross-check. If regex is insufficient, fall back to parsing `schema.sql` which is the generated artifact from the same chain. |
| **Audit script reports false positives (RPCs defined in migrations but with different naming patterns)** | Medium | Low | The reconciled RPC contract (`D-P3-01`) already verified that all service-layer RPC calls map to migration-defined functions. The audit script should report zero missing RPCs post-Phase-3. If false positives appear, investigate before suppressing. |
| **CI workflow modification breaks existing pipeline** | Low | Low | The CI step already runs `npm run audit:rpc`. If the script's exit code behavior is preserved (exit 1 on missing, exit 0 on clean), no CI workflow change is needed. Only verify, not modify, unless the step needs explicit `continue-on-error: false`. |
| **Scope creep into test mock modification** | Medium | Medium | Explicitly out of scope (§5.4 #1). The test mock is a separate task (P4-H2). If the audit script reveals mock issues, record them as findings for the next task; do not fix in this task. |
| **RPC_CONTRACTS.md deletion temptation** | Low | Low | Explicitly out of scope (§5.4 #2). The doc is not deleted or modified. Only the audit script's reference to it is removed. The doc's content reconciliation is Phase 5. |

---

## 6. Subsequent CURRENT_TASK Roadmap (Preview)

The following tasks are previewed for planning context only. They are NOT authorized for execution. Each requires separate Program Manager approval.

| Task | Title | Scope | Dependencies | Deliverables |
|---|---|---|---|---|
| CURRENT_TASK-013 (proposed) | Test Mock Canonical Validation | S1 — Test mocks | CURRENT_TASK-012 | D-P4-01 (Validated Test Base), partial D-P4-04 |
| CURRENT_TASK-014 (proposed) | CI Gate Evidence & Traceability Report | S3 — CI gates, traceability | CURRENT_TASK-012, CURRENT_TASK-013 | D-P4-03 (CI Gate Evidence, complete), D-P4-04 (Test-Audit Traceability Report) |

This roadmap is indicative only. The Program Manager may reorder, split, or merge tasks. No CURRENT_TASK beyond 012 is authorized by this document.

---

## 7. Kickoff Confirmation

| Item | Status |
|---|---|
| Phase 4 objective confirmed | Yes — §1.1 |
| Phase 4 scope confirmed | Yes — §1.2 |
| Phase 4 deliverables confirmed | Yes — §1.3 |
| Phase 4 exit criteria confirmed | Yes — §1.4 |
| Phase 4 validation rules confirmed | Yes — §1.5 |
| Phase 4 constraints confirmed | Yes — §1.6 |
| CURRENT_TASK generation rule confirmed | Yes — §1.7 |
| Phase 4 entry status confirmed | Yes — §1.8 (PASS) |
| SCAR Phase 4 findings inventoried | Yes — §2 |
| SCAR findings mapped to Phase 4 objectives | Yes — §3 |
| Findings prioritized (Critical/High/Medium/Low) | Yes — §4 |
| CURRENT_TASK-012 proposed with all required sections | Yes — §5 |
| No implementation performed | Confirmed |
| No code changes made | Confirmed |
| No migration changes made | Confirmed |
| No schema changes made | Confirmed |
| No generated types changed | Confirmed |
| No Architecture Decision produced | Confirmed |
| No additional CURRENT_TASK generated | Confirmed |

---

## 8. Approval Request

**CURRENT_TASK-012 — Canonical Audit Gate Realignment** is presented for Program Manager review.

Awaiting approval before any implementation begins.

---

*Basis: `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 4, §7 Quality Gates; `CURRENT_PHASE.md` §1–§8; `SCAR_PHASE4_REPORT.md` §SSOT Evidence Matrix #10–12; `PHASE3_ACCEPTANCE_RECORD.md`; `PHASE4_REAUTHORIZATION_REVIEW.md` §4–§5.*
