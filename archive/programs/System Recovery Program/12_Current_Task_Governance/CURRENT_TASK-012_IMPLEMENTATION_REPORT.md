# CURRENT_TASK-012 — Implementation Report

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Document Type:** Implementation Report  
**Date:** 2026-07-14  
**Authorizing CURRENT_TASK:** CURRENT_TASK-012 — Canonical Audit Gate Realignment  
**Architecture Decision:** Option A — Extract from Forward Migration Files (APPROVED)  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `CURRENT_TASK-012_ARCHITECTURE_DECISION.md`, `CURRENT_TASK-012_KICKOFF_PLAN.md`, `D-P3-01_Reconciled_RPC_Contract.md`

---

## 1. Implementation Summary

The audit script `scripts/audit-rpc-contracts.ts` was realigned to read from the canonical forward migration chain (`supabase/migrations/*.sql`, top-level, excluding `rollback/`) instead of the derived markdown document `docs/admin-dashboard/RPC_CONTRACTS.md`. The scan scope was expanded to include `utils/` and the `services/supabaseService.ts` exclusion was removed.

### 1.1 Changes Made

| File | Change | Lines |
|---|---|---|
| `scripts/audit-rpc-contracts.ts` | Rewritten: canonical source → migrations; scan scope → services+lib+utils; EXCLUDED_FILES removed; extraction regex handles both quoted and unquoted SQL identifiers | 104 → 90 |

### 1.2 Files NOT Changed (per §6.2 of Architecture Decision)

| File / Directory | Status |
|---|---|
| `supabase/migrations/*.sql` | Not modified — read-only canonical input |
| `supabase/migrations/rollback/*.sql` | Not modified — excluded from audit |
| `supabase/schema.sql` | Not modified — used as cross-check only |
| `supabase/generated/database.types.ts` | Not modified |
| `services/**/*.ts` | Not modified — read-only scan input |
| `lib/**/*.ts` | Not modified — read-only scan input |
| `utils/**/*.ts` | Not modified — read-only scan input |
| `tests/**` | Not modified |
| `docs/admin-dashboard/RPC_CONTRACTS.md` | Not modified — no longer referenced by audit |
| `package.json` | Not modified — `audit:rpc` script unchanged |
| `.github/workflows/ci.yml` | Not modified — `Audit RPC contracts` step unchanged |

---

## 2. Architecture Decision Deviation

### 2.1 Canonical RPC Count: 300, not 220

The Architecture Decision (§1.3, §1.4) stated that the forward migration chain and `schema.sql` each yield **220** unique public function names. During implementation, the initial regex `CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+public\.([a-z_][a-z_0-9]*)\s*\(` produced 220 names but the audit reported **52 RPCs** called in code but missing from migrations — including RPCs that D-P3-01 had already reconciled (e.g., `get_order_auto_code`, `get_dashboard_summary`, `cancel_order`).

**Root cause:** The baseline migration file `20250703000000_baseline_pre_tenant_schema.sql` uses **double-quoted identifiers** for function declarations:

```sql
CREATE OR REPLACE FUNCTION "public"."get_order_auto_code"() RETURNS "text"
CREATE OR REPLACE FUNCTION "public"."get_dashboard_summary"("p_from" "date", ...) RETURNS json
```

Later migration files use the **unquoted** format:

```sql
CREATE OR REPLACE FUNCTION public.function_name(...)
```

The Architecture Decision's format verification (§1.3: "All forward migration function declarations use `CREATE OR REPLACE FUNCTION public.<name>(` syntax") was incomplete — it did not account for the quoted format in the baseline file. D-P3-01 (§1, Executive Summary) already recorded the correct count: **300** unique canonical function names.

### 2.2 Corrective Action

The extraction regex was extended to handle both formats:

```
CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+"?public"?\."?([a-z_][a-z_0-9]*)"?\s*\(
```

This matches:
- `CREATE OR REPLACE FUNCTION public.function_name(` (unquoted — later migrations)
- `CREATE OR REPLACE FUNCTION "public"."function_name"(` (quoted — baseline migration)

With the corrected regex, the audit extracts **300** unique public function names — consistent with D-P3-01. All 52 previously-missing RPCs are now found in the canonical migration chain.

### 2.3 Impact on Evidence

The Architecture Decision's expected evidence E-2 ("220 RPCs extracted") and V-5 ("220 canonical public RPC names") are superseded by the corrected count of **300**. The 0-divergence property (V-5) still holds: both migration extraction and schema.sql extraction yield 300. This deviation is documented here per the Architecture Decision §9.4 fallback provision, though the fix was a regex extension (staying on Option A) rather than a fallback to Option B.

---

## 3. Validation Results

### 3.1 V-1: Injection Test — PASS

| Step | Action | Result |
|---|---|---|
| 1 | Created `services/_injection_test_scratch.ts` with `supabase.rpc('nonexistent_test_rpc')` | File created |
| 2 | Ran `npx tsx scripts/audit-rpc-contracts.ts` | Exit 1; output: `nonexistent_test_rpc (services/_injection_test_scratch.ts)` listed as missing |
| 3 | Deleted `services/_injection_test_scratch.ts` | File removed |
| 4 | Ran `npx tsx scripts/audit-rpc-contracts.ts` | Exit 0; `All service-layer RPC calls are defined in the canonical migration chain.` |

### 3.2 V-2: Audit PASS Against Canonical Migration Chain — PASS

```
Migration RPCs: 300
Code RPCs      : 183

All service-layer RPC calls are defined in the canonical migration chain.
```

Exit code: 0. Zero missing RPCs.

### 3.3 V-3: TypeScript — PASS

`npx tsc --noEmit` completed with exit code 0. No type errors.

### 3.4 V-4: CI Verification — PASS

`npm run audit:rpc` runs `npx tsx scripts/audit-rpc-contracts.ts` (package.json line 12, unchanged). The CI workflow `.github/workflows/ci.yml` step "Audit RPC contracts" (lines 35–36) runs `npm run audit:rpc` as the final step. Exit code semantics preserved: exit 0 on clean, exit 1 on missing RPCs. No `continue-on-error` directive.

### 3.5 V-5: Cross-Check — PASS

| Source | Extraction Method | Unique Public Function Names |
|---|---|---|
| Forward migration chain (`supabase/migrations/*.sql`, top-level) | Extended regex | **300** |
| Generated schema artifact (`supabase/schema.sql`) | Extended regex | **300** |
| **Divergence** | — | **0** |

---

## 4. Evidence Summary

| ID | Evidence | Status | Detail |
|---|---|---|---|
| E-1 | Canonical source changed | **PASS** | Script reads `supabase/migrations/*.sql` (top-level, excluding `rollback/`); no reference to `RPC_CONTRACTS.md` remains in the script |
| E-2 | 300 RPCs extracted (corrected from 220) | **PASS** | Script output: `Migration RPCs: 300` — consistent with D-P3-01's count of 300 unique canonical function names |
| E-3 | Audit PASS | **PASS** | Exit code 0; `All service-layer RPC calls are defined in the canonical migration chain.` |
| E-4 | Injection FAIL | **PASS** | Temporary `supabase.rpc('nonexistent_test_rpc')` caused exit 1 with the RPC listed as missing; injection removed after test |
| E-5 | CI verified | **PASS** | `npm run audit:rpc` works; `package.json` and `.github/workflows/ci.yml` unchanged; exit-code semantics preserved |
| E-6 | No service-layer change | **PASS** | `git diff` shows only `scripts/audit-rpc-contracts.ts` modified by this task; all other modified files in the working tree are pre-existing uncommitted changes |
| E-7 | `supabaseService.ts` audited | **PASS** | 57 unique RPCs in `services/supabaseService.ts` are scanned (EXCLUDED_FILES removed); all 57 found in canonical migrations |
| E-8 | `utils/` audited | **PASS** | 1 RPC (`get_order_auto_code`) in `utils/invoiceNumber.ts` is scanned; found in canonical migrations |

---

## 5. Implementation Details

### 5.1 Canonical Source

```typescript
const MIGRATIONS_DIR = path.resolve('supabase/migrations');
```

The script reads only top-level `*.sql` files in `supabase/migrations/` (non-recursive `readdirSync` with `isDirectory()` skip), excluding the `rollback/` subdirectory.

### 5.2 Extraction Regex

```typescript
const rx = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+"?public"?\."?([a-z_][a-z_0-9]*)"?\s*\(/g;
```

Handles both unquoted (`public.name`) and quoted (`"public"."name"`) identifier formats. The baseline migration uses quoted identifiers; later migrations use unquoted.

### 5.3 Scan Scope

```typescript
const CODE_DIRS = ['services', 'lib', 'utils'];
```

All three directories containing `supabase.rpc()` call sites are scanned. No files are excluded.

### 5.4 Comparison Logic

The audit checks one direction: **code RPCs ⊆ migration-defined RPCs**. If any RPC called in code is not defined in the canonical migration chain, the audit fails (exit 1). The reverse direction (migration-defined RPCs not called by code) is not a failure — many database functions are internal, trigger-related, or called by other means.

### 5.5 Exit Code Behavior

| Condition | Exit Code |
|---|---|
| All code RPCs defined in migrations | 0 (PASS) |
| One or more code RPCs missing from migrations | 1 (FAIL) |
| Migrations directory not found | 1 (FAIL) |

---

## 6. Exit Criteria Addressed

| Exit Criterion | Status | How Satisfied |
|---|---|---|
| EC-3 | **PASS** | The audit script compares service-layer RPC calls against `supabase/migrations/*.sql`, not against `RPC_CONTRACTS.md` or any other derived document |
| EC-4 (partial) | **PASS** | The CI workflow's `Audit RPC contracts` step fails when the audit script reports missing RPCs (exit 1). Full EC-4 (all derived artifacts) is completed in a subsequent CURRENT_TASK |
| V-1 (audit side) | **PASS** | The injection test confirms the audit catches a non-existent RPC |
| V-2 | **PASS** | The audit reports zero missing RPCs against the canonical migration chain |

---

## 7. Final Output

```
Implementation: PASS
Validation:     PASS
```

No CURRENT_TASK-013 is started. No new Architecture Decision is created. Awaiting Program Manager review.

---

*Basis: `SYSTEM_RECOVERY_MASTER_PLAN.md` §2.1, §4 Phase 4; `CURRENT_PHASE.md` §1–§8; `CURRENT_TASK-012_ARCHITECTURE_DECISION.md` §4 Option A, §9; `D-P3-01_Reconciled_RPC_Contract.md` §1.*
