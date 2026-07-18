# D-P5-02 — Architecture Authority Acceptance

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 5 — Documentation & Derived Artifact Reconciliation  
**Milestone:** M5.2 — Regenerated RPC Contract Documentation  
**Deliverable:** D-P5-02 — Regenerated RPC Contract Documentation  
**Document Type:** Architecture Authority Acceptance Review  
**Date:** 2026-07-18  
**Reviewer Role:** Architecture Authority  
**Decision:** **PASS**  

---

## 1. Executive Summary

This Architecture Authority Acceptance Review evaluates **D-P5-02 — Regenerated RPC Contract Documentation**, comprising the regenerated `D-P3-01_Reconciled_RPC_Contract.md` and `docs/admin-dashboard/RPC_CONTRACTS.md`.

Independent verification confirms:

- The ordered `supabase/migrations/*.sql` chain is the **only** source used to regenerate the contract documents.
- **138** forward-migration files contain **516** `CREATE [OR REPLACE] FUNCTION` declarations, representing **300** unique canonical function names.
- **183** unique RPCs are invoked by the service layer (`services/`, `lib/`, `utils/`), and **all 183** are defined in the canonical migration chain.
- The regenerated `D-P3-01_Reconciled_RPC_Contract.md` and `docs/admin-dashboard/RPC_CONTRACTS.md` list the same set of **183** service-layer RPC names, with no RPC name invented or missing.
- **0** signature mismatches and **0** missing RPCs remain.
- No source code, migration, database, test, or RPC implementation file was modified to produce the regenerated contract.

**Decision: PASS.**

The **Architecture Authority formally accepts D-P5-02 — Regenerated RPC Contract Documentation**. **Governance Gate #2 is CLOSED.**

With `M5_1_PROGRAM_MANAGER_ACCEPTANCE.md` already closing Governance Gate #1, **M5.2 is now formally complete**.

---

## 2. Evidence Reviewed

| # | Evidence | Role |
|---|---|---|
| 1 | `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 5 | Phase 5 scope, deliverables, exit criteria |
| 2 | `CURRENT_PHASE.md` §1, §3, §6 | Active phase marker and Phase 5 deliverable list |
| 3 | `UNIFIED_PROGRAM_STATE.md` §3, §5, §8, §10 | Program state, approved documents, architecture-authority role |
| 4 | `PHASE5_OPENING_AUTHORIZATION.md` §7 | Milestone M5.2 definition |
| 5 | `CURRENT_TASK-031_PROGRAM_AUTHORIZATION.md` §2, §5, §8 | M5.2 scope and acceptance criteria |
| 6 | `CURRENT_TASK-031_ENGINEERING_KICKOFF.md` §2–§8 | Canonical-source rules and engineering method |
| 7 | `CURRENT_TASK-031_RPC_CROSSCHECK_REPORT.md` §1–§5 | Cross-check results |
| 8 | `CURRENT_TASK-031_RECONCILIATION_NOTE.md` §2–§5 | Regeneration method and drift summary |
| 9 | `D-P3-01_Reconciled_RPC_Contract.md` §1, §4, §6, RPC Mapping Matrix | Regenerated RPC contract content |
| 10 | `docs/admin-dashboard/RPC_CONTRACTS.md` | Regenerated admin-facing RPC contract content |
| 11 | `M5_1_PROGRAM_MANAGER_ACCEPTANCE.md` §1, §7 | Gate #1 closure evidence |
| 12 | `CURRENT_TASK-031_ACCEPTANCE_REVIEW.md` | Independent acceptance findings |
| 13 | `CURRENT_TASK-031_PROGRAM_STATUS_REVIEW.md` | Program status and repository-impact findings |
| 14 | `tmp_verify_rpc.mjs` / `tmp_verify_docs.mjs` / `scripts/audit-rpc-contracts.ts` | Reproducible verification tooling |
| 15 | `git diff --name-only` / `git status --short` | Repository impact boundary |

---

## 3. Canonical Source Verification

The canonical source for all RPC definitions is the ordered forward-migration chain `supabase/migrations/*.sql`.

| Check | Command / Evidence | Result |
|---|---|---|
| Forward migration file count | `powershell -Command "(Get-ChildItem 'supabase/migrations/*.sql').Count"` | **138** |
| `CREATE [OR REPLACE] FUNCTION` declarations | `node tmp_verify_rpc.mjs` | **516** declarations, **300** unique names |
| Unique canonical function names | `node tmp_verify_rpc.mjs` | **300** |
| Service-layer RPC existence | `npx tsx scripts/audit-rpc-contracts.ts` | **300** migration RPCs, **183** code RPCs; *"All service-layer RPC calls are defined in the canonical migration chain."* |
| Source/migration/test file changes | `git diff --name-only -- services/ lib/ utils/ supabase/migrations/ tests/ src/ pages/ components/` | **empty** |

<ref_snippet file="c:/PROJECT/vietsalepro/D-P3-01_Reconciled_RPC_Contract.md" lines="17-28" />

The canonical-source discipline is intact: the migration chain is the single source of truth; no derived document was used to seed the regenerated contract.

---

## 4. RPC Contract Verification

### 4.1 D-P3-01_Reconciled_RPC_Contract.md

- Status: **Regenerated from canonical migration chain** <ref_file file="c:/PROJECT/vietsalepro/D-P3-01_Reconciled_RPC_Contract.md" />
- Version: 1.1
- Metrics table reports 138 migration files, 516 `CREATE FUNCTION` declarations, 300 unique canonical function names, 183 unique RPCs invoked, 183 matched, 0 missing, 100.0% coverage, 0 signature mismatches.

The document also records 117 canonical functions that are defined but not currently invoked by the service layer.

### 4.2 docs/admin-dashboard/RPC_CONTRACTS.md

- Regenerated from the same canonical inventory.
- Lists the same 183 service-layer RPCs with Vietnamese-purpose descriptions, main parameters, return types, and consuming service files.
- Contains a `ponytail` note clarifying that only real `supabase.rpc(...)` calls are included <ref_file file="c:/PROJECT/vietsalepro/docs/admin-dashboard/RPC_CONTRACTS.md" />.

### 4.3 Consistency Between the Two Documents

`node tmp_verify_docs.mjs` produced:

```text
migration unique=300
D-P3-01 names=187
admin names=183
D-P3-01 not in migrations: 4 Category,Item,Metric,RPC
admin not in migrations: 0
admin not in D-P3-01: 0
migration missing in D-P3-01: 117
```

The 4 "D-P3-01 not in migrations" entries are the table-header words `Category`, `Item`, `Metric`, and `RPC`, not RPC names. Excluding those headers, both documents contain exactly the same 183 service-layer RPC names, all present in the canonical migration chain.

**Conclusion:** The two regenerated contract documents are internally consistent and consistent with the canonical migration source.

---

## 5. Cross-check Verification

`CURRENT_TASK-031_RPC_CROSSCHECK_REPORT.md` records the service-layer cross-check:

<ref_snippet file="c:/PROJECT/vietsalepro/CURRENT_TASK-031_RPC_CROSSCHECK_REPORT.md" lines="13-26" />

- **Migration RPC names:** 300
- **Code RPC names:** 183
- **Missing from migrations:** None
- **Signature mismatches:** 0

`CURRENT_TASK-031_RECONCILIATION_NOTE.md` further explains the drift between the previous contract version (v1.0) and the regenerated version (v1.1):

- v1.0 used `supabase/schema.sql` (a generated artifact) and reported 4 missing RPCs.
- v1.1 uses `supabase/migrations/*.sql` (canonical chain) and reports 0 missing RPCs.
- Notable canonical signature corrections include `update_tenant_subscription` (added `p_max_storage_gb`), `get_top_tenants`, `get_current_user_tenants()`, and `get_tenants_admin(...)`.

<ref_snippet file="c:/PROJECT/vietsalepro/CURRENT_TASK-031_RECONCILIATION_NOTE.md" lines="28-45" />

No unresolved critical or high-severity contract mismatch remains.

---

## 6. Repository Impact

`git diff --name-only` shows only documentation files:

- `CURRENT_PHASE.md`
- `UNIFIED_PROGRAM_STATE.md`
- `docs/admin-dashboard/RPC_CONTRACTS.md`

The `CURRENT_PHASE.md` and `UNIFIED_PROGRAM_STATE.md` modifications are pre-existing Phase 5 governance-transition edits and are outside the scope of D-P5-02.

`git diff --name-only -- services/ lib/ utils/ supabase/migrations/ tests/ src/ pages/ components/` returned **empty**, confirming:

- No source code changes.
- No migration file changes.
- No database changes.
- No test changes.
- No RPC implementation changes.

The new/updated D-P5-02 artifacts are:

- `D-P3-01_Reconciled_RPC_Contract.md` (new / regenerated)
- `docs/admin-dashboard/RPC_CONTRACTS.md` (modified / regenerated)
- `CURRENT_TASK-031_RPC_CROSSCHECK_REPORT.md` (new evidence)
- `CURRENT_TASK-031_RECONCILIATION_NOTE.md` (new evidence)
- `D_P5_02_ARCHITECTURE_AUTHORITY_ACCEPTANCE.md` (this acceptance record)

**Repository impact: Documentation only.**

---

## 7. Acceptance Decision

| Item | Finding |
|---|---|
| D-P3-01 and `docs/admin-dashboard/RPC_CONTRACTS.md` consistency | **PASS** — same 183 service-layer RPC names, all in canonical migrations |
| Regeneration from canonical source | **PASS** — derived only from `supabase/migrations/*.sql` |
| Cross-check metrics (138 migrations, 300 canonical functions, 183 invoked RPCs, 0 missing, 0 mismatches) | **PASS** — independently reproduced |
| No RPC contract drift | **PASS** — zero mismatches in cross-check register |
| No source/migration/database/test/RPC changes | **PASS** — `git diff` confirms no changes in those areas |
| Repository impact | **PASS** — documentation only |
| Alignment with `CURRENT_PHASE.md` and `UNIFIED_PROGRAM_STATE.md` | **PASS** — D-P5-02 is the Phase 5 deliverable for M5.2 and supports Phase 5 EC-2 |

**Decision: PASS.**

The **Architecture Authority formally accepts D-P5-02 — Regenerated RPC Contract Documentation**.

**Governance Gate #2 is CLOSED.**

With `M5_1_PROGRAM_MANAGER_ACCEPTANCE.md` having closed Governance Gate #1, **M5.2 — Regenerated RPC Contract Documentation is now formally complete**, and the program may proceed to the next milestone (M5.3) through the already-prepared `CURRENT_TASK-032` authorization and kickoff documents.

---

## 8. Conditions

1. **Canonical-source validity.** D-P5-02 remains valid only as long as `supabase/migrations/*.sql` remains unchanged. Any future migration or RPC change requires regeneration of D-P5-02 from the canonical migration chain.
2. **Derived-artifact status.** D-P5-02 is a derived document and must never be treated as the canonical source of truth for the RPC contract.
3. **No hand-maintenance.** Future updates to `D-P3-01_Reconciled_RPC_Contract.md` and `docs/admin-dashboard/RPC_CONTRACTS.md` must be generated from the canonical migration chain, not edited by hand.
4. **Governance-transition files.** The pre-existing modifications to `CURRENT_PHASE.md` and `UNIFIED_PROGRAM_STATE.md` are outside the scope of this acceptance and must be resolved by the governance step that owns them.
5. **Next milestone readiness.** M5.3 may proceed once the Program Manager accepts `CURRENT_TASK-032_PROGRAM_AUTHORIZATION.md`, as described in `CURRENT_TASK-032_ENGINEERING_KICKOFF.md` §2 and §7.

---

*This acceptance review does not modify source code, migrations, database, tests, RPC implementations, `CURRENT_PHASE.md`, or `UNIFIED_PROGRAM_STATE.md`. It creates only this acceptance record and performs no commit or push.*
