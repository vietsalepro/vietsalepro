# D-P4-02 — Canonical Audit Gate Definition

**Program:** VietSalePro v7 — System Recovery Program  
**Deliverable ID:** D-P4-02  
**Title:** Canonical Audit Gate Definition  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Version:** 1.0  
**Date:** 2026-07-14  
**Status:** Implemented — Pending Program Manager Review  
**Authorizing CURRENT_TASK:** CURRENT_TASK-012 — Canonical Audit Gate Realignment  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `CURRENT_TASK-012_ARCHITECTURE_DECISION.md`, `CURRENT_TASK-012_IMPLEMENTATION_REPORT.md`, `D-P3-01_Reconciled_RPC_Contract.md`

---

## 1. Executive Summary

This deliverable defines the canonical audit gate that enforces parity between service-layer RPC call sites and the canonical migration chain. The audit script (`scripts/audit-rpc-contracts.ts`) now reads `CREATE [OR REPLACE] FUNCTION public.<name>` declarations from the 138 forward migration files in `supabase/migrations/` (top-level, excluding `rollback/`) and compares all `supabase.rpc()` call sites in `services/`, `lib/`, and `utils/` against that canonical set.

| Metric | Value |
|---|---|
| Canonical source | `supabase/migrations/*.sql` (top-level, excluding `rollback/`) |
| Forward migration files scanned | 138 |
| Unique public function names extracted | 300 |
| Service-layer RPC call directories | `services/`, `lib/`, `utils/` |
| Unique RPCs invoked by service layer | 183 |
| Missing from canonical migrations | 0 |
| Audit result | PASS (exit 0) |

---

## 2. Canonical Source

### 2.1 Authority

Per `SYSTEM_RECOVERY_MASTER_PLAN.md` §2.1: "The ordered migration chain is the only acceptable canonical source for the database schema, RPC surface, RLS policies, triggers, and indexes."

### 2.2 Scope

| Included | Excluded |
|---|---|
| `supabase/migrations/*.sql` (138 top-level forward migration files) | `supabase/migrations/rollback/*.sql` (2 reverse-migration files) |

The `rollback/` subdirectory contains reverse migrations that recreate prior function states. These are not canonical and are excluded via non-recursive directory reading.

### 2.3 Extraction

**Regex:** `CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+"?public"?\."?([a-z_][a-z_0-9]*)"?\s*\(`

This handles both identifier formats present in the migration chain:
- **Unquoted** (later migrations): `CREATE OR REPLACE FUNCTION public.function_name(`
- **Quoted** (baseline migration `20250703000000_baseline_pre_tenant_schema.sql`): `CREATE OR REPLACE FUNCTION "public"."function_name"(`

Names are collected into a `Set<string>` — `OR REPLACE` redefinitions collapse to one entry (last definition wins in PostgreSQL, but the name set is identical).

### 2.4 Cross-Check

The generated schema artifact `supabase/schema.sql` (Phase 2 accepted) yields the same 300 unique public function names with the identical regex. Divergence: 0. This confirms the migration chain is self-consistent.

---

## 3. Scan Scope

### 3.1 Directories

| Directory | Include | Rationale |
|---|---|---|
| `services/` | Yes (all `.ts` files, recursive) | 185 call sites across all service files including `supabaseService.ts` (57 RPCs — highest density) |
| `lib/` | Yes (all `.ts` files, recursive) | 7 call sites |
| `utils/` | Yes (all `.ts` files, recursive) | 1 call site (`get_order_auto_code` in `utils/invoiceNumber.ts`) |

### 3.2 Exclusions

**None.** The previous `EXCLUDED_FILES = ['services/supabaseService.ts']` was removed. `supabaseService.ts` is a business-logic service with 57 RPC calls — excluding it left the largest RPC consumer unaudited. D-P3-01 already reconciled its RPCs against canonical functions.

### 3.3 Code RPC Extraction

**Regex:** `supabase\.rpc\('([a-z_0-9]+)'`

Matches all `supabase.rpc('function_name')` call sites in `.ts` files within the scan scope.

---

## 4. Comparison Logic

### 4.1 Failure Condition

The audit fails (exit 1) when any RPC called in code is **not** defined in the canonical migration chain:

```
missingFromMigrations = codeRpcs - migrationRpcs
```

If `missingFromMigrations` is non-empty, the audit reports each missing RPC with its calling file(s) and exits 1.

### 4.2 Non-Failure Direction

The reverse direction (migration-defined RPCs not called by code) is **not** a failure. Many database functions are internal, trigger-related, or called by other means. The audit's purpose is to ensure every called RPC exists in the canonical source, not that every defined RPC is called.

### 4.3 Exit Codes

| Condition | Exit Code |
|---|---|
| All code RPCs defined in migrations | 0 (PASS) |
| One or more code RPCs missing from migrations | 1 (FAIL) |
| Migrations directory not found | 1 (FAIL) |

---

## 5. CI Integration

### 5.1 Invocation

| Entry Point | Command | Location |
|---|---|---|
| npm script | `npm run audit:rpc` → `npx tsx scripts/audit-rpc-contracts.ts` | `package.json` line 12 |
| CI workflow | `Audit RPC contracts` step → `npm run audit:rpc` | `.github/workflows/ci.yml` lines 35–36 |
| Pre-commit hook | `pre-commit` → `npm run lint && npx vitest run && npm run build && npm run audit:rpc` | `package.json` line 13 |

### 5.2 CI Behavior

The CI step fails when the audit script exits non-zero. No `continue-on-error` directive is present. The audit runs as the final CI step, after lint, tests, and build.

---

## 6. Validation Evidence

| Validation | Result | Evidence |
|---|---|---|
| V-1: Injection test | PASS | Temporary `supabase.rpc('nonexistent_test_rpc')` caused exit 1; injection removed; audit returned to exit 0 |
| V-2: Zero missing RPCs | PASS | `Migration RPCs: 300`, `Code RPCs: 183`, 0 missing, exit 0 |
| V-3: TypeScript | PASS | `npx tsc --noEmit` exit 0 |
| V-4: CI entry | PASS | `npm run audit:rpc` works; CI workflow unchanged |
| V-5: Cross-check | PASS | Migrations: 300, schema.sql: 300, divergence: 0 |

---

## 7. Boundary from Previous Audit

| Property | Previous (pre-CURRENT_TASK-012) | Current (post-CURRENT_TASK-012) |
|---|---|---|
| Canonical source | `docs/admin-dashboard/RPC_CONTRACTS.md` (derived markdown) | `supabase/migrations/*.sql` (canonical migration chain) |
| Scan scope | `services/`, `lib/` | `services/`, `lib/`, `utils/` |
| Excluded files | `services/supabaseService.ts` | None |
| Comparison | Code ↔ markdown symmetry (both directions fail) | Code ⊆ migrations (code missing from migrations fails) |
| Validated invariant | Code and markdown agree | Code and database agree |

---

## 8. Maintenance

### 8.1 When to Update

The audit script requires no maintenance when:
- New migrations are added (the script reads all top-level `*.sql` files dynamically).
- New RPC calls are added to `services/`, `lib/`, or `utils/` (the script scans all `.ts` files dynamically).
- RPCs are renamed in migrations (the audit will catch the mismatch if service code is not updated).

### 8.2 Format Assumptions

The regex assumes function declarations use one of two formats:
- `CREATE OR REPLACE FUNCTION public.<name>(`
- `CREATE OR REPLACE FUNCTION "public"."<name>("`

If a future migration introduces a third format (e.g., `CREATE FUNCTION` without `OR REPLACE`, or schema-qualified with a different schema), the regex must be extended. The `ponytail:` comment in the script documents this assumption.

---

*Basis: `SYSTEM_RECOVERY_MASTER_PLAN.md` §2.1, §4 Phase 4; `CURRENT_PHASE.md` §1–§8; `CURRENT_TASK-012_ARCHITECTURE_DECISION.md` §4 Option A, §9; `CURRENT_TASK-012_IMPLEMENTATION_REPORT.md` §2–§5; `D-P3-01_Reconciled_RPC_Contract.md` §1.*
