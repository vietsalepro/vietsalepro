# CURRENT_TASK-014 — Architecture Decision

**Program:** VietSalePro v7 — System Recovery Program
**Phase:** Phase 4 — Derived Validation Layer Realignment
**Document Type:** Architecture Decision (Program Manager Decision — no implementation)
**Date:** 2026-07-15
**Status:** Architecture Decision Draft — Awaiting Program Manager Approval
**Authorizing CURRENT_TASK:** CURRENT_TASK-014 — Auth, Identity & Security Mock Coverage (Wave 1 / TASK-A)
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `CURRENT_TASK-013_ACCEPTANCE_RECORD.md`, `PHASE4_COVERAGE_ROADMAP.md`, `D-P3-01_Reconciled_RPC_Contract.md`, `D-P4-02_CANONICAL_AUDIT_GATE_DEFINITION.md`

---

> **No implementation. No code change. No migration. No schema change. No generated type. No mock RPC written by this document.**
> This document is a Program Manager architecture decision deliverable only. It approves the Coverage Roadmap strategy, selects the first domain, and defines the architecture of CURRENT_TASK-014. No implementation may begin until the Program Manager approves this decision and a separate Implementation/Kickoff authorization is issued.

---

## 1. Objective

Authorize the first domain-scoped coverage task of the Phase 4 Coverage Roadmap and define its architecture.

Concretely, CURRENT_TASK-014 shall mock the **20 uncovered RPCs of Domain A — Auth, Identity & Security** in `tests/mocks/supabase.ts`, following the existing `if (name === '...')` dispatch pattern, with each mock's return shape derived from the canonical migration chain. The task raises mock coverage from **37.2% (68/183)** to **48.1% (88/183)** — a **+10.9 percentage-point** delta — and unblocks the auth-guard execution path that every other domain's service code traverses before reaching the RPC under test.

This decision also formally **approves the Coverage Roadmap strategy** (Wave / Domain / Dependency / Milestone) defined in `PHASE4_COVERAGE_ROADMAP.md`, and confirms Domain A as the first domain per the roadmap's dependency-driven ordering.

---

## 2. Scope

### 2.1 In Scope

The 20 uncovered Domain A RPCs, organized into 5 sub-groups:

| Sub-group | RPCs | Source Files |
|---|---|---|
| Permissions & Roles | `can_use_feature`, `has_tenant_role`, `is_system_admin`, `is_tenant_owner` | `lib/permissions.ts`, `services/tenantService.ts` |
| Tenant Context | `get_tenant_by_subdomain` | `lib/tenant.ts` |
| Two-Factor Auth | `delete_2fa_backup_codes`, `generate_2fa_backup_codes`, `is_2fa_enabled`, `list_2fa_backup_codes`, `verify_2fa_backup_code` | `services/twoFactorService.ts` |
| System-Admin Security | `get_locked_emails`, `get_login_attempts`, `get_tenant_security_settings`, `record_login_attempt`, `unlock_login_attempts`, `update_tenant_ip_allowlist`, `update_tenant_session_timeout` | `services/systemAdminService.ts` |
| Login History | `get_admin_login_alerts`, `get_admin_login_history`, `record_admin_login` | `services/loginHistoryService.ts` |

**Count: 20 unique RPCs.** (`is_system_admin` is called from two files but counted once.)

**Files permitted to change:**
- `tests/mocks/supabase.ts` — add 20 handler blocks.
- Test files under `tests/` that exercise the newly-mocked auth paths (encouraged, not mandatory for coverage-only acceptance).

### 2.2 Out of Scope

- All other domains (B, C, D, E, F, G, H and H1–H9).
- Any production code (`services/`, `lib/`, `utils/`, UI, components, pages).
- Any migration, `supabase/schema.sql`, or generated types.
- The audit script `scripts/audit-rpc-contracts.ts` (accepted and frozen in CURRENT_TASK-013).
- CI workflow (`.github/workflows/ci.yml`) and `package.json`.
- Any new file, script, or governance artifact.
- Mock behavioral shape-validation gate (noted as a possible Phase 4+ hardening task in Roadmap §8; explicitly deferred).
- Refactor of `tests/mocks/supabase.ts` to a Map-based dispatch (Roadmap §8 risk note; explicitly deferred).

### 2.3 Governance Boundary

CURRENT_TASK-014 processes **exactly one domain** (Domain A). It does not exceed the ~20-RPC task-sizing ceiling (it is exactly 20). It satisfies the Phase 4 CURRENT_TASK Generation Rule (`CURRENT_PHASE.md` §8): maps to the Phase 4 objective "test mocks derived from / validated against the canonical migration contract"; stays inside Phase 4 scope; honors Phase 4 constraints; produces Phase 4 exit evidence (coverage delta + audit gate green).

---

## 3. Canonical Source

| Artifact | Path | Classification | Authority |
|---|---|---|---|
| Forward migration chain | `supabase/migrations/*.sql` (top-level, non-recursive, excluding `rollback/`) | **Canonical** | Master Plan §2.1; reaffirmed in CURRENT_TASK-012 and CURRENT_TASK-013. |

The canonical source for the 20 Domain A RPCs is the set of `CREATE [OR REPLACE] FUNCTION public.<name>` declarations for those 20 names in the forward migration chain. Each mock handler's return shape must be derivable from the corresponding migration function's `RETURNS` clause and parameter list.

**Canonical-derived references (acceptable, one step removed):**
- `supabase/schema.sql` (Phase 2 accepted) — final-state function definitions.
- `supabase/generated/database.types.ts` (Phase 2 accepted) — typed `Functions` block.
- `D-P3-01_Reconciled_RPC_Contract.md` (Phase 3 accepted) — reconciled service call-sites.

**Non-canonical (must not override):** `docs/admin-dashboard/RPC_CONTRACTS.md` and any other hand-maintained derived document. The audit script no longer reads it (CURRENT_TASK-012); this task must not reintroduce it as a reference.

**Verification mechanism:** `npx tsx scripts/audit-rpc-contracts.ts` — the same gate accepted in CURRENT_TASK-013. It enforces mock ⊆ migrations (stale-mock hard fail), duplicate-handler hard fail, and reports coverage informationally. The coverage line is the milestone metric.

---

## 4. Constraints

Inherited from `CURRENT_PHASE.md` §5 and the Roadmap §6.4 per-task acceptance template:

1. No feature development, no architecture redesign, no scope expansion.
2. No modification of production code, migrations, schema, generated types, CI workflow, or `package.json`.
3. No new files. No new scripts. No new governance artifacts.
4. No implementation outside an approved CURRENT_TASK.
5. Mock handlers must follow the existing `if (name === '...')` dispatch pattern already present in `tests/mocks/supabase.ts`.
6. Mock return shapes must match the canonical migration function signatures (return type + parameter set). A mock that returns a shape inconsistent with its migration function is a defect, even if tests pass.
7. Handlers are **additive only** — no modification or removal of the existing 69 handlers (68 covering code RPCs + 1 accepted orphan `update_tenant_status`).
8. The audit script `scripts/audit-rpc-contracts.ts` is frozen; this task must not modify it.
9. The task must not introduce a mock for an RPC not defined in the canonical migration chain (the stale-mock gate would hard-fail).
10. The task must not introduce a duplicate handler for an already-mocked RPC (the duplicate-handler gate would hard-fail).

---

## 5. Architecture Decision

### 5.1 Strategy Approval (Program Manager Decision)

The Program Manager **approves** the Coverage Roadmap strategy as defined in `PHASE4_COVERAGE_ROADMAP.md`:

| Strategy Element | Decision | Basis |
|---|---|---|
| **Wave** | Approved — 4 waves, sequential, one CURRENT_TASK authorized at a time. | Roadmap §6.2; preserves Phase 1–4 governance pattern (one task accepted before the next is generated). |
| **Domain** | Approved — 8 domains (A–H), with H sub-divided into 9 sub-domains (H1–H9). 16 proposed domain-scoped tasks. | Roadmap §2; classification derived from calling service file + RPC semantics, cross-checked against the canonical migration chain grouping. |
| **Dependency** | Approved — dependency-driven ordering: A (foundational) → B → H entity leaves (H1, H5, H6) → H transactions (H2, H3, H4, H7) → H residuals (H8, H9) → cross-cutting (D, E, C, F, G). | Roadmap §3; derived from runtime call-flow analysis (which domain's mocks must exist for another's service code to pass its auth guard and reach the RPC under test). |
| **Milestone** | Approved — M0 (37.2%) → M7 (100.0%), with M4 (80.3%) as the recommended intermediate acceptance floor. Full 100% target preferred unless a residual proves disproportionately expensive. | Roadmap §7; every milestone verifiable by a single deterministic command (`npx tsx scripts/audit-rpc-contracts.ts`). |

### 5.2 First Domain Selection (Program Manager Decision)

**Selected domain: Domain A — Auth, Identity & Security (20 RPCs, Wave 1 / TASK-A).**

| Criterion | Assessment |
|---|---|
| **Why selected** | Highest Priority Score in the Roadmap Priority Matrix (13/15). Domain A is a **hard prerequisite** for all other domains: every domain's service code calls `lib/permissions.ts` (`can_use_feature`, `has_tenant_role`, `is_system_admin`, `is_tenant_owner`) before reaching the RPC under test. Mocking A first maximizes test-path unblocking per RPC and removes the most common failure mode — "test fails at the auth guard before reaching the RPC under test." |
| **Dependency** | None upstream (foundational). All 7 other domains and all 9 H sub-domains depend on A. |
| **Risk** | Medium-High. 12 of 20 RPCs are Medium-complexity (stateful login/lock state, 2FA backup-code lifecycle, IP-allowlist/session-timeout mutation). Additive-only constraint mitigates regression risk to the existing 389 passing tests. |
| **Estimated Scope** | 20 RPCs; ~300 handler lines; 8 Simple + 12 Medium + 0 Complex. Effort class: Medium-High. |
| **Expected Coverage Increase** | 37.2% → 48.1% (+10.9pp; 68/183 → 88/183 covered). |

### 5.3 Architecture Decision for CURRENT_TASK-014

**Decision: Extend `tests/mocks/supabase.ts` with 20 additive handler blocks for the Domain A RPCs, each following the existing `if (name === '...')` dispatch pattern, with return shapes derived from the canonical migration chain.**

Rationale:
- Reuses the existing dispatch pattern (no new abstraction, no new file, no new dependency) — satisfies the ponytail "reuse the helper already here" rung.
- Additive-only: zero risk to the 69 existing handlers and the 389 passing tests they support.
- The audit gate (accepted in CURRENT_TASK-013) already enforces the three required invariants for free: mock ⊆ migrations (stale-mock hard fail), no duplicate handlers (hard fail), coverage delta reportable (informational). No new validation machinery is needed.
- Return-shape fidelity to the canonical migration function is enforced by review (Constraint #6), not by an automated gate. An automated shape-validation gate is explicitly deferred to a possible Phase 4+ hardening task (Roadmap §8) and is out of scope for this task.

**Rejected alternatives (not chosen, recorded for traceability):**
- *Generate mocks from the canonical source.* Rejected in Roadmap §8 and not revisited: the codegen path is disproportionate to the coverage goal and risks introducing a new derived artifact whose own correctness would then need validation — a recursion the program has explicitly avoided since Phase 2.
- *Refactor `tests/mocks/supabase.ts` to a Map-based dispatch first.* Explicitly deferred (Roadmap §8 risk note). The file is already a single dispatch function; the roadmap does not require the refactor and CURRENT_TASK-014 must not expand scope to include it.

---

## 6. Acceptance Criteria

CURRENT_TASK-014 is accepted only when ALL of the following hold, independently verified:

1. **Mock presence.** All 20 Domain A RPCs (`can_use_feature`, `has_tenant_role`, `is_system_admin`, `is_tenant_owner`, `get_tenant_by_subdomain`, `delete_2fa_backup_codes`, `generate_2fa_backup_codes`, `is_2fa_enabled`, `list_2fa_backup_codes`, `verify_2fa_backup_code`, `get_locked_emails`, `get_login_attempts`, `get_tenant_security_settings`, `record_login_attempt`, `unlock_login_attempts`, `update_tenant_ip_allowlist`, `update_tenant_session_timeout`, `get_admin_login_alerts`, `get_admin_login_history`, `record_admin_login`) have exactly one `if (name === '...')` handler block in `tests/mocks/supabase.ts`.
2. **Audit gate green.** `npx tsx scripts/audit-rpc-contracts.ts` exits 0 — zero stale mocks, zero duplicate handlers, zero code-RPCs-missing-from-migrations.
3. **Coverage delta.** The audit coverage report shows covered count = 88 (was 68) and uncovered count = 95 (was 115), i.e. coverage = 48.1% (was 37.2%), with exactly +20 newly covered RPCs and 0 new uncovered RPCs.
4. **TypeScript.** `npx tsc --noEmit` exits 0.
5. **Test suite.** `npx vitest run` passes with no regression versus the CURRENT_TASK-013 accepted baseline (68 files, 389 tests). A higher pass count is acceptable (new tests exercising the newly-mocked auth paths are encouraged but not mandatory).
6. **Scope integrity.** `git diff --stat` shows changes only in `tests/mocks/supabase.ts` and (optionally) `tests/**`. Zero diff in `services/`, `lib/`, `utils/`, `supabase/`, `scripts/`, `.github/`, `package.json`, or any governance document.
7. **Additive-only.** The 69 existing handlers are unchanged (verified by diff: no removals, no edits to existing handler blocks).
8. **Shape fidelity (review-enforced).** Each new handler's return shape is consistent with its canonical migration function's `RETURNS` clause and parameter list. Verified by inspection against `supabase/migrations/*.sql` (or `supabase/schema.sql` as canonical-derived reference), not by an automated gate.

---

## 7. Exit Criteria

CURRENT_TASK-014 is closed when ALL of the following hold:

1. All Acceptance Criteria (§6) are independently verified and recorded in a `CURRENT_TASK-014_ACCEPTANCE_RECORD.md`.
2. The coverage milestone **M1 — Auth Foundation (48.1%)** is reached and evidenced by an independent run of the audit gate.
3. No Critical or Major risk from §9 remains open.
4. The task's diff is committed and the audit gate is green on the committed state.
5. The Program Manager signs the Acceptance Record.

Exit from CURRENT_TASK-014 does **not** exit Phase 4. Phase 4 exit requires the full Phase 4 exit criteria (`CURRENT_PHASE.md` §4) to be met and recorded in `PHASE4_ACCEPTANCE_RECORD.md`. CURRENT_TASK-014 contributes to, but does not satisfy, those criteria.

---

## 8. Deliverables

| # | Deliverable | Owner | Form |
|---|---|---|---|
| 1 | Extended `tests/mocks/supabase.ts` with 20 Domain A handler blocks | Engineering team (within authorized CURRENT_TASK-014 implementation) | Code diff, additive-only |
| 2 | `CURRENT_TASK-014_IMPLEMENTATION_REPORT.md` | Engineering team | Markdown report |
| 3 | `CURRENT_TASK-014_ACCEPTANCE_RECORD.md` | Program Manager | Markdown acceptance record with independent verification evidence |
| 4 | Coverage milestone M1 evidence | Program Manager | Audit gate output snippet in the Acceptance Record |

**Not a deliverable of this task:** any change to production code, migrations, schema, generated types, CI, `package.json`, the audit script, or any governance/planning document. Any such change is a scope violation.

---

## 9. Risk Assessment

| # | Risk | Severity | Mitigation | Residual |
|---|---|---|---|---|
| 1 | **Mock behavioral fidelity** — a Domain A mock returns a shape inconsistent with its canonical migration function, tests pass against a fictional contract (the exact failure mode Phase 4 exists to eliminate). | **High** | Constraint #6 + Acceptance Criterion #8 require review-enforced shape fidelity against `supabase/migrations/*.sql`. The audit gate already enforces mock ⊆ migrations. An automated shape-validation gate is explicitly deferred to a possible Phase 4+ hardening task. | Medium — review-enforced, not gate-enforced. |
| 2 | **Regression of the 389 passing tests** — auth mocks sit on the execution path of nearly every other domain's tests; a malformed auth mock could break unrelated tests. | Medium | Acceptance Criterion #5 requires `npx vitest run` to pass with no regression. Acceptance Criterion #7 requires additive-only (existing 69 handlers unchanged). Auth mocks are new handlers, not modifications. | Low — additive-only constraint + full test-suite gate. |
| 3 | **Stateful auth mock bugs** — login-attempt locking, 2FA backup-code lifecycle, and IP-allowlist/session-timeout mutation carry stateful semantics that a naive mock could misrepresent. | Medium | 12 Medium-complexity handlers require careful state modeling. Per the ponytail rule, non-trivial stateful logic should leave at least one runnable check (a test exercising the happy path and one error/rollback path) for the stateful handlers (`record_login_attempt`/`unlock_login_attempts`, `generate_2fa_backup_codes`/`verify_2fa_backup_code`, `update_tenant_ip_allowlist`/`update_tenant_session_timeout`). | Low-Medium. |
| 4 | **`tests/mocks/supabase.ts` growth** — adding ~300 lines brings the file from ~2,482 to ~2,782 lines, further from the Map-based-dispatch refactor noted in the existing `ponytail:` comment. | Low | The refactor is explicitly deferred (Roadmap §8). The file remains a single dispatch function; growth is linear and bounded by the roadmap's total ~2,080-line ceiling. | Low. |
| 5 | **Scope creep** — the task expands beyond Domain A (e.g., mocking a permission RPC's downstream effect on a commerce flow). | Low | Acceptance Criterion #6 prohibits touching files outside `tests/mocks/supabase.ts` + `tests/**`. The audit gate's stale-mock and duplicate-handler detection provide an automated guard against accidental cross-domain additions. | Low. |
| 6 | **Cross-file shared RPC `is_system_admin`** — called from both `services/tenantService.ts` and `lib/permissions.ts`; a single mock must satisfy both call-site contracts. | Low | The mock is keyed by RPC name, not call-site; one handler serves both. Verified by Acceptance Criterion #1 (exactly one handler) and #2 (audit green). | Low. |

**No Critical risks identified.** Risk #1 is the highest residual and is structural to Phase 4 (mock fidelity is the phase's core concern); it is mitigated to Medium by review-enforced shape fidelity and the existing audit gate, with an automated shape gate deferred to Phase 4+.

---

## 10. Governance Confirmation

- CURRENT_TASK-014 processes **exactly one domain** (Domain A — Auth, Identity & Security).
- CURRENT_TASK-014 covers **20 RPCs**, within the ~20-RPC task-sizing ceiling.
- CURRENT_TASK-014 follows the four-step task lifecycle: **Architecture Decision** (this document) → **Implementation** (authorized separately) → **Acceptance** (`CURRENT_TASK-014_ACCEPTANCE_RECORD.md`) → **Close**.
- No subsequent CURRENT_TASK (CURRENT_TASK-015 / TASK-B) is generated by this document. The next task is generated only after CURRENT_TASK-014 is accepted and closed.

---

CURRENT_TASK-014
Status:
Architecture Decision Draft

Awaiting Program Manager Approval
