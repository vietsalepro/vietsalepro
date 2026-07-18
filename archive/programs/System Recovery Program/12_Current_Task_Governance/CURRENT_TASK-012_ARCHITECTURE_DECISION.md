# CURRENT_TASK-012 — Architecture Decision

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Document Type:** Architecture Decision  
**Date:** 2026-07-14  
**Status:** Approved — Implemented  
**Authorizing CURRENT_TASK:** CURRENT_TASK-012 — Canonical Audit Gate Realignment  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `CURRENT_TASK-012_KICKOFF_PLAN.md`, `D-P3-01_Reconciled_RPC_Contract.md`, `SCAR_PHASE4_REPORT.md`, `PHASE3_ACCEPTANCE_RECORD.md`

---

> **No implementation. No code change. No migration. No schema change. No generated type.**  
> This document is an architecture decision deliverable only. It analyzes the canonical audit gate realignment, evaluates options, and recommends a decision. No implementation may begin until the Program Manager approves this decision.

---

## 1. Current State

### 1.1 Audit Script

**File:** `scripts/audit-rpc-contracts.ts` (104 lines)

**Current behavior:**
- Reads `docs/admin-dashboard/RPC_CONTRACTS.md` as its canonical source (line 7: `CONTRACT_PATH = path.resolve('docs/admin-dashboard/RPC_CONTRACTS.md')`).
- Extracts RPC names from markdown table rows matching `` `identifier` `` via regex `/^\|\s*`([^`\s]+)`/` (function `extractContractRpcs`, lines 24–38).
- Extracts code RPCs from `services/` and `lib/` via regex `/supabase\.rpc\('([a-z_0-9]+)'/g` (function `extractCodeRpcs`, lines 40–55).
- **Excludes** `services/supabaseService.ts` from scanning (line 9: `EXCLUDED_FILES = ['services/supabaseService.ts']`).
- Reports two sets: `missingFromContract` (code RPCs not in doc) and `staleInContract` (doc RPCs not in code).
- Exits 1 if either set is non-empty; exits 0 only when both are empty.

**Critical observation:** The script validates code ↔ markdown symmetry. It does **not** validate code ↔ canonical migration chain. A passing audit proves the code and the markdown agree; it does **not** prove the code and the database agree.

### 1.2 RPC_CONTRACTS.md

**File:** `docs/admin-dashboard/RPC_CONTRACTS.md` (18,994 bytes)

**Current state:** Derived markdown document. The 4 stale RPC names from Phase 3 (`admin_update_subscription`, `get_storage_usage`, `search_members_by_email`, `get_member_with_email`) have been removed. The doc is clean relative to current code. However, it is a **hand-maintained derived document** — it has no generation link to the canonical migration chain. Its correctness depends on a human updating it whenever code or migrations change.

**Phase 4 relevance:** The doc's *content* is a Phase 5 documentation deliverable. The doc's *role as audit canonical source* is the Phase 4 issue. Once the audit script reads migrations directly, this doc becomes purely informational.

### 1.3 Canonical Migration Chain

**Directory:** `supabase/migrations/`

**Verified state (2026-07-14):**
| Metric | Value |
|---|---|
| Forward migration files (top-level `*.sql`) | 138 |
| Rollback files (`rollback/*.sql`) | 2 |
| `CREATE [OR REPLACE] FUNCTION public.<name>` in forward migrations | 284 occurrences |
| Unique public function names in forward migrations | **220** |
| Unique public function names in `supabase/schema.sql` | **220** (identical — 0 divergence) |

**Format consistency:** All forward migration function declarations use `CREATE OR REPLACE FUNCTION public.<name>(` syntax. Zero occurrences of `CREATE FUNCTION public.` without `OR REPLACE` at line start. The format is uniform across the chain.

**Rollback subdirectory:** `supabase/migrations/rollback/` contains 2 reverse-migration files. One (`20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.reverse.sql`) contains a `CREATE OR REPLACE FUNCTION public.update_tenant_subscription(` declaration — the **old** signature (pre-`p_max_storage_gb`). These are **not** canonical forward migrations. A recursive glob of `supabase/migrations/**/*.sql` would incorrectly include them.

### 1.4 Generated Schema Artifact

**File:** `supabase/schema.sql` (1,357,565 bytes, Phase 2 accepted)

Contains 283 `CREATE [OR REPLACE] FUNCTION public.` lines yielding **220 unique public function names** — byte-for-byte consistent with the forward migration chain for public function names. The schema artifact is the generated final state where `OR REPLACE` semantics are already resolved (last definition wins).

### 1.5 Generated Type Artifact

**File:** `supabase/generated/database.types.ts` (Phase 2 accepted)

Contains a structured `Functions: { <name>: { Args, Returns } }` block under `public:` (line 4296). Verified: **261** unique RPC entries in the `Functions` block — **41 more** than the 220 migration-defined public functions. The type generator exposes functions beyond the `public.` schema RPC surface (e.g., non-public functions reachable via postgrest, or functions the generator classifies differently). This means the type artifact's RPC set is **not a clean match** for the migration-defined public function set.

### 1.6 Test Mock Validation

**File:** `tests/mocks/supabase.ts` (~2,500 lines)

Implements **86** RPC handlers via `if (name === '...')` switch logic. Returns `{ data: null, error: { code: 'PGRST116', message: 'RPC not found' } }` for unrecognized names. The 4 critical stale RPCs were removed in Phase 3. However, there is **no mechanism** to validate that the 86 handlers correspond to migration-defined functions. A handler can exist for a non-existent RPC, or a migration-defined RPC can lack a handler, and no gate catches either condition.

### 1.7 CI Gate

**File:** `.github/workflows/ci.yml` (36 lines)

The `Audit RPC contracts` step (line 35–36) runs `npm run audit:rpc` as the final CI step. The step fails if the script exits non-zero. The `package.json` script `audit:rpc` invokes `npx tsx scripts/audit-rpc-contracts.ts`. The pre-commit hook (`package.json` → `pre-commit`) also runs `npm run audit:rpc`.

**Current gap:** The CI gate enforces code ↔ markdown symmetry. It does **not** enforce code ↔ canonical migration chain parity. There is no CI step that compares any derived artifact against the canonical migration source.

### 1.8 Service-Layer RPC Call-Site Inventory

| Directory | RPC call sites | Reconciled in Phase 3 (D-P3-01) | Scanned by current audit |
|---|---|---|---|
| `services/` (total) | 185 | Yes | Yes |
| `services/supabaseService.ts` | 57 | Yes | **No (excluded)** |
| `services/` (minus supabaseService.ts) | 128 | Yes | Yes |
| `lib/` | 7 | **No** | Yes |
| `utils/` | 1 | Yes | **No (not scanned)** |

**Boundary inconsistencies:**
1. `services/supabaseService.ts` — the file with the **most** RPC calls (57) — is excluded from the audit. D-P3-01 reconciled it and confirmed its RPCs map to canonical functions. The exclusion has no documented rationale in the script.
2. `utils/` has 1 RPC call (`get_order_auto_code` in `utils/invoiceNumber.ts`) that D-P3-01 reconciled but the audit does not scan.
3. `lib/` has 7 RPC calls that the audit scans but D-P3-01 did **not** reconcile.

---

## 2. Boundary Analysis

### 2.1 Canonical Source

| Source | Path | Classification | Authority |
|---|---|---|---|
| Forward migration chain | `supabase/migrations/*.sql` (top-level, excluding `rollback/`) | **Canonical** | Master Plan §2.1: "The ordered migration chain is the only acceptable canonical source for the database schema, RPC surface, RLS policies, triggers, and indexes." |

The canonical source for the RPC surface is the set of `CREATE [OR REPLACE] FUNCTION public.<name>` declarations in the 138 forward migration files. The `rollback/` subdirectory is explicitly **not** canonical — it contains reverse migrations that recreate prior function states.

### 2.2 Canonical-Derived Sources

| Source | Path | Classification | Generation Link |
|---|---|---|---|
| Generated schema artifact | `supabase/schema.sql` | **Canonical-derived** (Phase 2 accepted) | Generated by concatenating the 138 forward migrations per `D-P2-01`. SHA-256 verified. |
| Generated type artifact | `supabase/generated/database.types.ts` | **Canonical-derived** (Phase 2 accepted) | Generated from `schema.sql` via Supabase type codegen. SHA-256 verified. |
| Reconciled RPC contract | `D-P3-01_Reconciled_RPC_Contract.md` | **Canonical-derived** (Phase 3 accepted) | Derived by reconciling service call-sites against `schema.sql`. |

Canonical-derived sources are acceptable as references but are **one step removed** from the canonical source. They carry a staleness risk: if the generation step is not run after a migration change, the derived artifact diverges from the canonical chain.

### 2.3 Derived (Non-Canonical) Sources

| Source | Path | Classification | Issue |
|---|---|---|---|
| RPC contract doc | `docs/admin-dashboard/RPC_CONTRACTS.md` | **Derived** (hand-maintained) | Currently treated as canonical by the audit script. No generation link to migrations. Correctness depends on manual updates. |

### 2.4 Operational Sources

| Source | Path | Classification |
|---|---|---|
| Audit script | `scripts/audit-rpc-contracts.ts` | **Operational** — the quality gate itself |
| CI workflow | `.github/workflows/ci.yml` | **Operational** — CI enforcement |
| Package script | `package.json` → `audit:rpc` | **Operational** — invocation point |
| Pre-commit hook | `package.json` → `pre-commit` | **Operational** — local enforcement |

### 2.5 Derived Consumers

| Source | Path | Classification |
|---|---|---|
| Service layer | `services/**/*.ts` | **Derived consumer** — invokes RPCs |
| Lib utilities | `lib/**/*.ts` | **Derived consumer** — invokes RPCs |
| Utils utilities | `utils/**/*.ts` | **Derived consumer** — invokes RPCs |
| Test mocks | `tests/mocks/supabase.ts` | **Derived validation + shadow implementation** |

### 2.6 Boundary Summary

The audit gate currently compares a **derived consumer** (service code) against a **derived non-canonical document** (RPC_CONTRACTS.md). It must instead compare the **derived consumer** against the **canonical source** (forward migration chain). The operational sources (audit script, CI) must be realigned to read from the canonical source. The canonical-derived sources (schema.sql, database.types.ts) are available as cross-checks but should not be the primary audit source unless the canonical source is impractical to parse.

---

## 3. Root Cause

### 3.1 Why the Current Audit Gate Produces False Quality Signals

The audit script (`scripts/audit-rpc-contracts.ts`) reads `docs/admin-dashboard/RPC_CONTRACTS.md` as its source of truth. This document is a **hand-maintained derived artifact** with no generation link to the canonical migration chain. The audit therefore validates the wrong invariant:

| What the audit checks | What it should check |
|---|---|
| `code RPCs ⊆ RPC_CONTRACTS.md RPCs` | `code RPCs ⊆ migration-defined RPCs` |
| `RPC_CONTRACTS.md RPCs ⊆ code RPCs` | (informational) `migration-defined RPCs ⊇ code RPCs` |

**Failure mode 1 — False pass:** If a developer adds an RPC call to service code and adds the same RPC name to `RPC_CONTRACTS.md`, the audit passes. But if the RPC was never defined in a migration (or was renamed in a migration without updating the doc), the production path will fail at runtime with `PGRST116` (function not found). The audit reports "in sync" while the production contract is broken.

**Failure mode 2 — False fail:** If a migration defines an RPC and service code calls it, but `RPC_CONTRACTS.md` was not updated, the audit reports "missing from contract" — a false quality signal. The RPC is valid; the doc is stale. Engineers may waste time investigating a non-issue, or worse, "fix" the audit by removing a valid RPC call.

**Failure mode 3 — Missing coverage:** The audit excludes `services/supabaseService.ts` (57 RPC calls — the highest-density file) and does not scan `utils/` (1 RPC call). Even if the audit compared against the correct source, it would miss 58 call sites. A passing audit does not imply all service-layer RPC calls are valid.

### 3.2 Root Cause Statement

The audit gate's canonical source is a derived document, not the canonical migration chain. This means the audit validates code-to-document symmetry rather than code-to-database parity. A passing audit is a **fictional quality signal**: it proves the code and the markdown agree, not that the code and the database agree. The exclusion of `supabaseService.ts` and the omission of `utils/` compound the problem by leaving 58 call sites entirely unaudited.

---

## 4. Option Analysis

Three options are evaluated for the canonical RPC extraction source. All three assume the same comparison logic (code RPCs ⊆ canonical RPCs) and the same exit-code behavior (exit 1 on missing, exit 0 on clean).

### Option A — Extract from Forward Migration Files

**Architecture:**  
The audit script reads the 138 forward migration files in `supabase/migrations/` (top-level `*.sql`, excluding the `rollback/` subdirectory). It extracts RPC names via regex matching `CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+public\.([a-z_][a-z_0-9]*)\s*\(`. Names are collected into a `Set<string>` (deduplication is automatic — `OR REPLACE` redefinitions collapse to one entry). The script then compares service-layer `supabase.rpc('...')` call sites against this set.

**Extraction target:** 220 unique public function names (verified).

**Advantages:**
- Reads the **true canonical source** per Master Plan §2.1. No derivation step, no staleness risk.
- Catches migration-level issues directly — if a migration file is malformed or a function is accidentally removed, the audit reflects it immediately.
- Zero divergence from `schema.sql` verified (220 = 220, 0 in either direction) — the migration chain is self-consistent.
- No dependency on any generation tool or CI pre-step.
- Satisfies the Master Plan principle "canonical source first" in its strictest form.

**Disadvantages:**
- Requires reading 138 files instead of 1 — slightly more I/O (trivial for a CI script; ~1.3 MB total).
- Must explicitly exclude the `rollback/` subdirectory to avoid picking up reverse-migration function definitions.
- Regex parsing of SQL is inherently fragile to formatting variations. However, the current chain uses uniform `CREATE OR REPLACE FUNCTION public.<name>(` syntax (verified: 0 occurrences of non-`OR REPLACE` format at line start).
- Does not capture signature information (only names). Signature drift detection would require a future enhancement. This is acceptable for Phase 4 scope (EC-3 requires name-level parity, not signature-level).

**Compatibility:**
- Fully compatible with the Master Plan canonical-source-first principle.
- Compatible with Phase 2 (canonical migration chain accepted) and Phase 3 (reconciled RPC contract accepted).
- Compatible with the existing CI workflow structure (same `npm run audit:rpc` invocation, same exit-code contract).

**Backward compatibility:**
- Breaks the current `RPC_CONTRACTS.md`-based audit behavior — this is the **intended** change.
- The `RPC_CONTRACTS.md` file is not deleted or modified; it simply ceases to be the audit source.
- The `npm run audit:rpc` command, CI step, and pre-commit hook continue to work unchanged (same script path, same exit-code semantics).

**Risk:** Medium-Low.  
Primary risk is regex fragility. Mitigated by: (1) verified format consistency across the chain, (2) cross-check against `schema.sql` during implementation (both yield 220 names), (3) the injection test (V-1) will catch extraction gaps. Secondary risk is the `rollback/` exclusion — mitigated by explicit non-recursive glob or directory filter.

**Scope impact:**  
Modifies `scripts/audit-rpc-contracts.ts` only. No migration, schema, type, service, or test changes.

**Validation impact:**  
Directly enables V-2 ("audit gate reports zero missing RPCs against the canonical migration chain") and the audit-gate side of V-1.

---

### Option B — Extract from Generated Schema Artifact

**Architecture:**  
The audit script reads the single file `supabase/schema.sql` and extracts RPC names via the same regex. `schema.sql` is the Phase 2 accepted generated artifact — the final canonical state where `OR REPLACE` semantics are already resolved (last definition per name wins). No deduplication needed (each name appears once in its final form, though `OR REPLACE` may still produce duplicate lines — the `Set` handles this).

**Extraction target:** 220 unique public function names (verified — identical to Option A).

**Advantages:**
- Single file, simplest I/O — no multi-file walk, no `rollback/` exclusion needed (schema.sql contains only forward-applied final state).
- `D-P3-01` already used `schema.sql` as its extraction source (§3.1) — precedent established.
- Phase 2 enforces byte-for-byte reproducibility from the canonical chain, so `schema.sql` is a faithful representation.
- Simpler regex application (one pass over one file).

**Disadvantages:**
- `schema.sql` is **canonical-derived**, not canonical. The audit would validate against a derived artifact, one step removed from the true source.
- **Staleness risk:** if a migration is added but `schema.sql` is not regenerated, the audit validates against a stale artifact. This requires either (a) a CI pre-step that regenerates `schema.sql` before the audit, or (b) a separate gate that verifies `schema.sql` ↔ migrations parity. Neither currently exists in the CI workflow.
- Introduces a generation dependency into the audit gate — the audit's correctness now depends on the schema generation step being run and committed.
- Contradicts the strict reading of Master Plan §2.1 ("the ordered migration chain is the only acceptable canonical source") — `schema.sql` is derived from the chain, not the chain itself.

**Compatibility:**
- Compatible with Phase 2 and Phase 3 accepted artifacts.
- Introduces a soft dependency on Phase 6 (deployment validation gate) to ensure `schema.sql` freshness. This is a scope coupling that Phase 4 should avoid.

**Backward compatibility:** Same as Option A.

**Risk:** Medium.  
Primary risk is staleness — `schema.sql` divergence from migrations. This is the exact class of problem the Recovery Program exists to eliminate (SSOT fragmentation). Using a derived artifact as the audit source recreates the pattern at a different level. Mitigated if a freshness gate exists, but that gate is Phase 6 scope, not Phase 4.

**Scope impact:**  
Modifies `scripts/audit-rpc-contracts.ts`. Potentially requires CI workflow modification to add a schema regeneration or freshness-check step before the audit (scope expansion risk).

**Validation impact:**  
Enables V-2, but the evidence is "zero missing RPCs against `schema.sql`" rather than "against the canonical migration chain." The validation rule's wording ("against the canonical migration chain") favors Option A.

---

### Option C — Extract from Generated Type Artifact

**Architecture:**  
The audit script reads `supabase/generated/database.types.ts` and extracts RPC names from the structured `Functions: { <name>: { Args, Returns } }` block under `public:`. Parsing is TypeScript-native (no SQL regex) — match entries within the `Functions` block.

**Extraction target:** 261 unique RPC entries (verified).

**Advantages:**
- TypeScript-native parsing — no SQL regex fragility.
- Structured `Args` and `Returns` available, enabling future signature-level drift detection without re-parsing SQL.
- Type-safe extraction — the artifact is already TypeScript.

**Disadvantages:**
- `database.types.ts` is **canonical-derived twice** (migrations → schema → types). Two derivation steps from the canonical source.
- **Coverage mismatch:** 261 entries vs 220 migration-defined public functions — 41 extra entries. The type generator exposes functions beyond the `public.` schema RPC surface. Using this as the audit source would treat 41 non-canonical-public entries as valid RPCs, potentially masking real issues or producing false "unused" reports.
- **Staleness risk:** same as Option B, compounded by the additional derivation step.
- Format couples to the Supabase type codegen output — if the codegen format changes, the parser breaks.
- The type generator may filter or transform function names (e.g., omit trigger functions, include non-public functions) — the extracted set is not a clean representation of the migration-defined public RPC surface.

**Compatibility:**
- Compatible with Phase 2 accepted artifacts.
- Introduces the same staleness dependency as Option B, plus a codegen-format coupling.

**Backward compatibility:** Same as Option A.

**Risk:** Medium-High.  
Coverage mismatch (261 vs 220) is the primary risk — the audit would validate against a superset of the canonical public RPC surface. Staleness and format coupling add further risk. The 41 extra entries would need to be investigated and either excluded or accepted, adding scope.

**Scope impact:**  
Modifies `scripts/audit-rpc-contracts.ts`. Requires investigation of the 41-entry discrepancy (scope expansion risk).

**Validation impact:**  
Enables V-2 against the type artifact, not against the canonical migration chain. The 41-entry discrepancy means "zero missing RPCs" would be measured against a set that does not match the canonical public function surface.

---

### Option Comparison Matrix

| Criterion | Option A (Migrations) | Option B (schema.sql) | Option C (database.types.ts) |
|---|---|---|---|
| Canonical authority | **Canonical** (source) | Canonical-derived (1 step) | Canonical-derived (2 steps) |
| Extraction target | 220 unique names | 220 unique names | 261 entries (41 extra) |
| Match to canonical public RPC surface | **Exact** | Exact | **Superset** (mismatch) |
| Staleness risk | **None** | Medium | Medium-High |
| Regex/parsing fragility | Medium (SQL regex) | Medium (SQL regex) | Low (TS structured) |
| Files to read | 138 | 1 | 1 |
| rollback/ exclusion needed | Yes | No | No |
| Generation dependency | **None** | Yes (schema regen) | Yes (schema + codegen) |
| Master Plan §2.1 strict compliance | **Yes** | Soft (derived) | No (twice-derived) |
| V-2 wording match ("canonical migration chain") | **Direct** | Indirect | Indirect |
| Scope expansion risk | Low | Medium (freshness gate) | High (41-entry investigation) |
| Future signature drift detection | No (names only) | No (names only) | Yes (Args/Returns available) |

---

## 5. Contract Impact

### 5.1 Impact Summary

| Layer | Impact | Explanation |
|---|---|---|
| **RPC** | **No impact** | No RPC definition is created, modified, or deleted. The audit reads existing RPCs; it does not change them. |
| **Migration** | **No impact** | No migration file is created, modified, or deleted. The audit reads existing migrations as read-only input. |
| **Schema** | **No impact** | `supabase/schema.sql` is not modified. It may be used as a cross-check during implementation but is not the audit source (Option A) and is not regenerated. |
| **Generated Types** | **No impact** | `supabase/generated/database.types.ts` is not modified. It is not the audit source (Option A). |
| **Service Layer** | **No impact** | No `services/**/*.ts`, `lib/**/*.ts`, or `utils/**/*.ts` file is modified. The audit reads service code as read-only input. |
| **Tests** | **No impact** | `tests/mocks/supabase.ts` is not modified in this task (P4-H2, out of scope). Existing tests continue to run unchanged. |
| **RPC_CONTRACTS.md** | **No impact** | The file is not deleted or modified. Only the audit script's reference to it is removed. Content reconciliation is Phase 5. |

### 5.2 Confirmation

This task modifies **only** the operational validation layer (audit script + CI workflow verification). It does not touch any canonical source, canonical-derived artifact, service code, or test code. The contract surface is unchanged — the task changes **what the audit compares against**, not **what the contract is**.

---

## 6. Implementation Scope

### 6.1 Files Expected to Change

| File | Change | Rationale |
|---|---|---|
| `scripts/audit-rpc-contracts.ts` | **Modify** | Replace `RPC_CONTRACTS.md` extraction with forward-migration extraction (Option A). Update comparison logic, scan scope, and output labels. |
| `.github/workflows/ci.yml` | **Verify / minor update if needed** | The `Audit RPC contracts` step already runs `npm run audit:rpc`. Verify that the step fails on non-zero exit. No change needed unless `continue-on-error` is set (it is not). |
| `D-P4-02_Canonical_Audit_Gate_Definition.md` | **Create** | Deliverable document defining the canonical audit gate. |
| `CURRENT_TASK-012_IMPLEMENTATION_REPORT.md` | **Create** | Implementation report with evidence (E-1 through E-6). |

### 6.2 Files That MUST NOT Change

| File / Directory | Reason |
|---|---|
| `supabase/migrations/*.sql` | Canonical source — read-only input. Phase 2 accepted. |
| `supabase/migrations/rollback/*.sql` | Non-canonical reverse migrations — excluded from audit, not modified. |
| `supabase/schema.sql` | Canonical-derived artifact — Phase 2 accepted. Not modified. |
| `supabase/generated/database.types.ts` | Canonical-derived artifact — Phase 2 accepted. Not modified. |
| `services/**/*.ts` | Service layer — Phase 3 reconciled. Read-only input. |
| `lib/**/*.ts` | Derived consumer — read-only input. |
| `utils/**/*.ts` | Derived consumer — read-only input. |
| `tests/mocks/supabase.ts` | Test mock — P4-H2 scope (subsequent CURRENT_TASK). Not modified in this task. |
| `tests/**` (all other test files) | Test base — not modified in this task. |
| `docs/admin-dashboard/RPC_CONTRACTS.md` | Derived document — Phase 5 scope. Not deleted or modified. |
| `D-P3-01_Reconciled_RPC_Contract.md` | Phase 3 accepted deliverable. Not modified. |
| `package.json` (audit:rpc script) | Invocation point — `npx tsx scripts/audit-rpc-contracts.ts` unchanged. No modification needed. |

### 6.3 Scan Scope Decision

The realigned audit script should scan **all directories containing `supabase.rpc()` call sites**:

| Directory | Include | Rationale |
|---|---|---|
| `services/` | **Yes (all files, including `supabaseService.ts`)** | 185 call sites. `supabaseService.ts` has 57 — the highest density. Excluding it leaves the largest RPC consumer unaudited. The exclusion has no documented rationale and contradicts D-P3-01 which reconciled this file. |
| `lib/` | **Yes** | 7 call sites. Currently scanned; continue scanning. D-P3-01 did not reconcile `lib/`, but the audit should cover all call sites. Any `lib/` RPC not in migrations will be flagged — this is correct behavior. |
| `utils/` | **Yes** | 1 call site (`get_order_auto_code`). D-P3-01 reconciled `utils/`. Currently not scanned — this is a gap. Add to scan scope. |

**`supabaseService.ts` exclusion:** The current `EXCLUDED_FILES = ['services/supabaseService.ts']` should be **removed**. The file is a business-logic service (imports types, has mappers, calls 57 RPCs for products/customers/orders/inventory). It is not a low-level Supabase client wrapper — the actual client wrapper is `lib/supabase.ts`. Excluding it defeats the purpose of the audit. D-P3-01 already reconciled its 57 RPC calls against canonical functions; the audit should verify this ongoing.

---

## 7. Validation Plan

### 7.1 Required Evidence

| ID | Evidence | Capture Method |
|---|---|---|
| E-1 | Audit script reads `supabase/migrations/*.sql` (forward, excluding `rollback/`) as canonical source | Source code inspection: no reference to `RPC_CONTRACTS.md` in the script; migration directory read confirmed |
| E-2 | Audit script extracts 220 unique public function names from `CREATE [OR REPLACE] FUNCTION public.<name>` statements | Script output: `Migration RPCs: 220` (or equivalent) |
| E-3 | Audit script reports zero missing RPCs against the canonical migration chain (V-2) | Script stdout: `Missing from migrations: 0`; exit code 0 |
| E-4 | Audit script exits 1 when a non-existent RPC is injected | Injection test: add temporary `supabase.rpc('nonexistent_test_rpc')` to a scratch file, run audit, confirm exit 1 and `nonexistent_test_rpc` listed, then remove injection |
| E-5 | CI workflow `Audit RPC contracts` step fails on audit failure | `.github/workflows/ci.yml` step configuration inspection + local simulation (exit 1 propagates to step failure) |
| E-6 | No service-layer code, migration, schema, or generated-type was modified | `git diff --stat` shows changes only in `scripts/`, `.github/` (if needed), and new deliverable `.md` files |
| E-7 | `supabaseService.ts` is included in scan scope | Script output: code RPC count includes supabaseService.ts call sites (185+ total from services alone) |
| E-8 | `utils/` is included in scan scope | Script output: code RPC count includes `get_order_auto_code` from `utils/invoiceNumber.ts` |

### 7.2 Validation Steps

| Step | Action | Expected Result | Evidence |
|---|---|---|---|
| 1 | Run `npm run audit:rpc` with realigned script | Exit 0; output shows `Missing from migrations: 0` | E-3 |
| 2 | Inject temporary `supabase.rpc('nonexistent_test_rpc')` in a scratch service file; run `npm run audit:rpc` | Exit 1; output lists `nonexistent_test_rpc` as missing | E-4 |
| 3 | Remove injection; run `npm run audit:rpc` | Exit 0 | — |
| 4 | Inspect `.github/workflows/ci.yml` lines 35–36 | Step runs `npm run audit:rpc`; no `continue-on-error`; failure exits non-zero | E-5 |
| 5 | Run `git diff --stat` | Only `scripts/audit-rpc-contracts.ts`, `.github/workflows/ci.yml` (if needed), and deliverable `.md` files | E-6 |
| 6 | Run `npx vitest run` | All existing tests pass (no test mock changes in this task) | — |
| 7 | Cross-check: run extraction against `supabase/schema.sql` separately | Yields 220 unique names — matches migration extraction (consistency proof) | E-2 |

### 7.3 Exit Criteria Addressed

| Exit Criterion | How Satisfied |
|---|---|
| EC-3 | The audit script compares service-layer RPC calls against `supabase/migrations/*.sql`, not against `RPC_CONTRACTS.md` or any other derived document. |
| EC-4 (partial) | The CI workflow's `Audit RPC contracts` step fails when the audit script reports missing RPCs (exit 1). Full EC-4 (all derived artifacts) is completed in CURRENT_TASK-014. |
| V-2 | The audit script reports `Missing from migrations: 0` against the canonical migration chain. |
| V-1 (audit side) | The injection test confirms the audit catches a non-existent RPC. The test-base side of V-1 is completed in CURRENT_TASK-013. |

---

## 8. Risk Assessment

### 8.1 Critical Risks

**None identified.** This task modifies only the operational validation layer. No canonical source, service code, or test code is touched. The worst-case failure mode is a false audit failure (blocking CI), which is recoverable by fixing the script.

### 8.2 Major Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| **Regex extraction misses RPC definitions with non-standard formatting** | Major | Low | The canonical migration chain uses uniform `CREATE OR REPLACE FUNCTION public.<name>(` syntax (verified). Cross-check against `schema.sql` during implementation (both yield 220). The injection test (V-1) catches extraction gaps. If a formatting edge case is found, the regex is adjusted — no canonical source change needed. |
| **Including `supabaseService.ts` reveals RPCs not in migrations** | Major | Low | D-P3-01 already reconciled `supabaseService.ts` and confirmed its 57 RPCs map to canonical functions (4 stale ones were fixed in Phase 3). If the audit reveals new mismatches, they are recorded as findings for a subsequent CURRENT_TASK — not fixed in this task (scope constraint). |
| **`lib/` RPCs not reconciled by D-P3-01 cause audit failures** | Major | Low | D-P3-01 did not reconcile `lib/`. If `lib/` contains RPCs not in migrations, the audit will flag them. This is **correct behavior** — the audit is doing its job. Findings are recorded, not fixed in this task. If they block CI, escalate to Program Manager. |

### 8.3 Minor Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| **CI workflow modification breaks existing pipeline** | Minor | Low | The CI step already runs `npm run audit:rpc`. If the script's exit-code behavior is preserved (exit 1 on missing, exit 0 on clean), no CI workflow change is needed. Only verify. |
| **Scope creep into test mock modification** | Minor | Medium | Explicitly out of scope (§6.2). The test mock is CURRENT_TASK-013 (P4-H2). If the audit reveals mock issues, record them — do not fix. |
| **`RPC_CONTRACTS.md` deletion temptation** | Minor | Low | Explicitly out of scope (§6.2). The doc is not deleted or modified. Only the audit script's reference to it is removed. Content reconciliation is Phase 5. |
| **`rollback/` files accidentally included** | Minor | Low | Explicit non-recursive glob (`supabase/migrations/*.sql`) or directory filter excludes `rollback/`. Verified: 2 rollback files exist; excluding them yields 220 names (correct). |

---

## 9. Architecture Decision

### 9.1 Recommended Option

**Option A — Extract from Forward Migration Files.**

### 9.2 Justification

1. **Canonical authority.** Option A reads the true canonical source — the forward migration chain — per Master Plan §2.1: "The ordered migration chain is the only acceptable canonical source for the database schema, RPC surface, RLS policies, triggers, and indexes." Options B and C read canonical-derived artifacts, introducing staleness risk and derivation dependencies that contradict the Recovery Program's core principle of restoring trust in the canonical contract.

2. **Zero staleness risk.** Option A has no generation dependency. The audit's correctness depends only on the migration files, which are the canonical source. Options B and C require `schema.sql` / `database.types.ts` to be regenerated and verified fresh before the audit — a dependency that is Phase 6 scope, not Phase 4. Using a derived artifact as the audit source recreates the SSOT fragmentation pattern the program exists to eliminate.

3. **Exact canonical match.** Option A yields 220 unique public function names — the exact canonical public RPC surface. Option B yields the same 220 (verified identical). Option C yields 261 — a superset with 41 extra entries that do not match the canonical public function surface, requiring investigation and filtering (scope expansion).

4. **V-2 wording compliance.** The Phase 4 validation rule V-2 states: "The audit gate reports zero missing RPCs against the canonical migration chain." Option A measures directly against the migration chain. Options B and C measure against derived artifacts — the evidence would be "zero missing against schema.sql / types" rather than "against the canonical migration chain."

5. **Verified feasibility.** The forward migration chain uses uniform `CREATE OR REPLACE FUNCTION public.<name>(` syntax (verified: 0 formatting variations). The extraction is a single regex over 138 files (~1.3 MB total) — trivial for a CI script. The `rollback/` exclusion is a simple non-recursive glob or directory filter.

6. **Minimal scope.** Option A modifies only `scripts/audit-rpc-contracts.ts`. No CI pre-step, no generation dependency, no discrepancy investigation. Option B potentially requires a schema freshness gate (scope expansion). Option C requires investigating 41 extra entries (scope expansion).

7. **Consistency with D-P3-01.** D-P3-01 used `schema.sql` as its extraction source because it needed signature information for reconciliation. The Phase 4 audit gate needs only **name-level parity** (EC-3), not signature-level reconciliation. For name-level extraction, the migration chain is sufficient and canonical. `schema.sql` remains available as a cross-check during implementation (both yield 220 — a consistency proof).

### 9.3 Scan Scope Decision

The realigned audit must scan **all directories with `supabase.rpc()` call sites**: `services/` (including `supabaseService.ts`), `lib/`, and `utils/`. The `supabaseService.ts` exclusion is removed — it has 57 RPC calls (the most of any file) and was already reconciled in D-P3-01. The `utils/` directory is added — D-P3-01 reconciled it but the current audit omits it.

### 9.4 Fallback Provision

If regex extraction from migration files proves insufficient during implementation (e.g., an edge-case formatting variation is discovered that the regex cannot handle), **Option B (schema.sql)** is the approved fallback. Both options yield identical results (220 unique names, 0 divergence), and `schema.sql` is a single file with no `rollback/` exclusion needed. The fallback is documented in the implementation report if invoked. Option C is **not** an approved fallback due to the 41-entry coverage mismatch.

### 9.5 Boundary Corrections

The implementation must address three boundary issues discovered during this analysis:

1. **Remove `supabaseService.ts` exclusion.** The file with the most RPC calls (57) must not be excluded from the audit. D-P3-01 reconciled it; the audit must verify it ongoing.
2. **Add `utils/` to scan scope.** D-P3-01 reconciled `utils/`; the audit must scan it. One RPC call (`get_order_auto_code`) is currently unaudited.
3. **Exclude `rollback/` subdirectory.** The audit must read only forward migrations (`supabase/migrations/*.sql` non-recursive, or explicit `rollback/` filter). Reverse migrations are not canonical.

### 9.6 Decision Statement

> **The canonical audit gate shall extract the RPC surface from `CREATE [OR REPLACE] FUNCTION public.<name>` declarations in the forward migration files (`supabase/migrations/*.sql`, excluding `rollback/`), compare all service-layer `supabase.rpc()` call sites in `services/`, `lib/`, and `utils/` against that set, and fail (exit 1) when any called RPC is not defined in the canonical migration chain. `services/supabaseService.ts` is included in the scan. `docs/admin-dashboard/RPC_CONTRACTS.md` is no longer referenced by the audit script. The generated schema artifact (`supabase/schema.sql`) is available as a cross-check but is not the primary audit source.**

---

## 10. Approval Request

**CURRENT_TASK-012 — Canonical Audit Gate Realignment** architecture decision is presented for Program Manager review.

**Recommended option:** Option A — Extract from Forward Migration Files.  
**Fallback:** Option B — Extract from `schema.sql` (if regex proves insufficient).  
**Rejected:** Option C — Extract from `database.types.ts` (coverage mismatch: 261 vs 220).

**Status: Approved — Implemented.**

Implementation completed in `CURRENT_TASK-012_IMPLEMENTATION_REPORT.md`. Deliverable `D-P4-02_CANONICAL_AUDIT_GATE_DEFINITION.md` created. All validations PASS.

**Implementation note:** The Architecture Decision's expected canonical RPC count of 220 was corrected to 300 during implementation. The baseline migration file uses double-quoted identifiers (`"public"."function_name"`) that the original regex did not match. The regex was extended to handle both quoted and unquoted formats, yielding 300 unique public function names — consistent with D-P3-01. See `CURRENT_TASK-012_IMPLEMENTATION_REPORT.md` §2 for details.

---

*Basis: `SYSTEM_RECOVERY_MASTER_PLAN.md` §2.1, §4 Phase 4, §7 Quality Gates; `CURRENT_PHASE.md` §1–§8; `CURRENT_TASK-012_KICKOFF_PLAN.md` §2–§5; `D-P3-01_Reconciled_RPC_Contract.md` §1–§4; `SCAR_PHASE4_REPORT.md` §SSOT Evidence Matrix #10–12; `PHASE3_ACCEPTANCE_RECORD.md`; `PHASE4_REAUTHORIZATION_REVIEW.md` §4–§5.*
