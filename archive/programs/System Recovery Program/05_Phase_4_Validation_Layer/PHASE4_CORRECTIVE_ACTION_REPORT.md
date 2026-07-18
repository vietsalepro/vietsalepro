# Phase 4 Corrective Action Report — EC-3 / EC-4 Remediation

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Document Type:** Corrective Action Report  
**Date:** 2026-07-16  
**Scope:** EC-3 and EC-4 only  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 4, `CURRENT_PHASE.md` §4, `D-P4-02_CANONICAL_AUDIT_GATE_DEFINITION.md`, `PHASE4_EXIT_REVIEW.md`, `CURRENT_TASK-012_IMPLEMENTATION_REPORT.md`

---

## 1. Problem Statement

`PHASE4_EXIT_REVIEW.md` §1 identified the committed `scripts/audit-rpc-contracts.ts` as diverging from the approved canonical audit gate design in `D-P4-02_CANONICAL_AUDIT_GATE_DEFINITION.md`:

| Approved Design (D-P4-02) | Committed Script |
|---|---|
| Canonical source: `supabase/migrations/*.sql` (top-level, excluding `rollback/`) | Read `docs/admin-dashboard/RPC_CONTRACTS.md` (derived markdown) |
| Scan scope: `services/`, `lib/`, `utils/` | Scan scope: `services/`, `lib/` only |
| Exclusions: none | Excluded `services/supabaseService.ts` |
| Compare: code RPCs ⊆ migration RPCs | Compare: code RPCs ↔ markdown RPCs (both directions) |

This caused **EC-3** and **EC-4** to be recorded as **FAIL** in the Phase 4 Exit Review.

---

## 2. Corrective Action Scope

- **Exit criteria addressed:** EC-3, EC-4 only.
- **Files changed:** `scripts/audit-rpc-contracts.ts` only.
- **Files not changed:** No production code, migrations, tests, docs, CI, or package configuration were modified.
- **Not in scope:** Phase 5 authorization, new `CURRENT_TASK`s, Exit Review closeout, D-P4-04 traceability report, or any other Phase 4 observation.

---

## 3. Implementation

The audit script was rewritten to match the approved `D-P4-02` design.

### 3.1 Canonical Source

- Input directory: `supabase/migrations`
- Reads only top-level `*.sql` files (non-recursive), automatically excluding the `rollback/` subdirectory and any other subdirectories.
- No reference to `docs/admin-dashboard/RPC_CONTRACTS.md` remains in the script.

### 3.2 RPC Extraction from Migrations

```typescript
const FN_RE = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+"?public"?\."?([a-z_][a-z_0-9]*)"?\s*\(/gi;
```

This regex matches both unquoted declarations used in later migrations and the double-quoted `"public"."name"` declarations used in the baseline migration.

### 3.3 Code Scan Scope

```typescript
const CODE_DIRS = ['services', 'lib', 'utils'];
```

All three directories are scanned recursively. `services/supabaseService.ts` is no longer excluded.

### 3.4 Comparison Logic

The audit checks one direction only:

```
missingFromMigrations = codeRpcs - migrationRpcs
```

If `missingFromMigrations` is non-empty, the script exits with code `1` and lists each missing RPC with its calling file(s). Otherwise it exits with code `0`.

---

## 4. Verification

Command executed:

```bash
npx tsx scripts/audit-rpc-contracts.ts
```

Output:

```text
Migration RPCs: 300
Code RPCs      : 183

All service-layer RPC calls are defined in the canonical migration chain.

Exit code: 0
```

This matches the expected canonical comparison documented in `D-P4-02` §2 and `CURRENT_TASK-012_IMPLEMENTATION_REPORT.md` §3.2.

---

## 5. Exit Criteria Status

| Exit Criterion | Requirement | Status |
|---|---|---|
| **EC-3** | The operational audit script compares service-layer RPC calls against the canonical migration chain, not against another derived document. | **PASS** |
| **EC-4** | CI gates fail when a derived artifact diverges from the canonical source (the audit script exits non-zero on missing RPCs; `package.json` and `.github/workflows/ci.yml` already invoke it). | **PASS** |

---

## 6. Summary

The committed audit script has been realigned with the approved canonical audit gate design. The audit now reads the canonical forward migration chain (`supabase/migrations/*.sql`), scans `services/`, `lib/`, and `utils/` with no file exclusions, and reports divergence with a non-zero exit code. Verification confirms the script passes against the canonical source.

No further Phase 4, Phase 5, or `CURRENT_TASK` actions were performed.
