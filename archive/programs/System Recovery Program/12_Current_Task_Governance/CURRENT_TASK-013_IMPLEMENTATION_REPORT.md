# CURRENT_TASK-013 — Implementation Report

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Document Type:** Implementation Report  
**Date:** 2026-07-15  
**Status:** Complete — Pending Program Manager Review  
**Authorizing CURRENT_TASK:** CURRENT_TASK-013 — Test Mock Canonical Validation  
**Architecture Decision:** `CURRENT_TASK-013_TEST_MOCK_CANONICAL_VALIDATION_ARCHITECTURE_DECISION.md` — Option A (Recommended)  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `CURRENT_TASK-013_TEST_MOCK_CANONICAL_VALIDATION_ARCHITECTURE_DECISION.md`, `CURRENT_TASK-012_ARCHITECTURE_DECISION.md`, `D-P4-02_CANONICAL_AUDIT_GATE_DEFINITION.md`

---

## 1. Objective

Implement **Option A — Extend Audit Script with Mock Validation** as defined in the CURRENT_TASK-013 Architecture Decision. Extend `scripts/audit-rpc-contracts.ts` to validate the test mock layer (`tests/mocks/supabase.ts`) against the canonical migration chain, adding three new validation passes:

1. **Stale-mock gate (hard fail):** mock RPCs ⊆ migration RPCs.
2. **Duplicate-handler detection (hard fail):** no duplicate `if (name === '...')` blocks for the same RPC.
3. **Coverage-gap report (informational):** code RPCs vs mock RPCs — report only, no fail.

The existing validation (code RPCs ⊆ migration RPCs) is preserved unchanged.

---

## 2. Scope

### 2.1 In Scope

| Item | Status |
|---|---|
| Extend `scripts/audit-rpc-contracts.ts` with mock validation | Done |
| Remove dead-code duplicate handler in `tests/mocks/supabase.ts` | Done |
| Preserve existing code ↔ migrations validation | Done |
| Preserve `npm run audit:rpc` entry point | Done |
| No CI workflow change | Done |
| No new files | Done |

### 2.2 Out of Scope

| Item | Rationale |
|---|---|
| Business logic | Not modified |
| Production code | Not modified |
| Service layer | Not modified |
| Database / migration / schema | Not modified |
| Generated types | Not modified |
| UI | Not modified |
| CI workflow | Not modified |
| Governance | Not modified |
| Coverage gap closure (115 unmocked RPCs) | Follow-up implementation task |
| Coverage gap hard-fail upgrade | Follow-up after coverage threshold reached |

---

## 3. Files Changed

| File | Change | Lines |
|---|---|---|
| `scripts/audit-rpc-contracts.ts` | Extended with mock validation pass (stale-mock gate, duplicate detection, coverage report) | +166 / -78 (net from git index; includes CURRENT_TASK-012 baseline) |
| `tests/mocks/supabase.ts` | Removed dead-code duplicate `get_tenant_members_with_email` handler block (old lines 2005–2018) | -15 lines, 0 additions |

### 3.1 No Other Files Modified

All other files in the working tree were already modified prior to CURRENT_TASK-013 and are outside this task's scope.

---

## 4. Architecture Compliance

### 4.1 Decision Implemented

**Option A — Extend Audit Script with Mock Validation** (Architecture Decision §5, §10 Recommendation).

| Architecture Decision Requirement | Implementation |
|---|---|
| Stale-mock gate: mock RPCs ⊆ migration RPCs, hard fail | `extractMockRpcs()` + `mockNotInMigrations` check, exit 1 on violation |
| Duplicate-handler detection: hard fail | `mockCount` map tracks line numbers per RPC name, exit 1 on duplicates |
| Coverage-gap report: informational, no fail | `covered` / `uncovered` computed and printed, does not affect exit code |
| Same canonical source as CURRENT_TASK-012 | `extractMigrationRpcs()` reads `supabase/migrations/*.sql` (top-level, excluding rollback/) |
| No new files | Single script extended, no new scripts created |
| No CI workflow change | `npm run audit:rpc` invocation unchanged |
| No package.json change | `audit:rpc` script unchanged |

### 4.2 Canonical Source

| Property | Value |
|---|---|
| Canonical source | `supabase/migrations/*.sql` (138 top-level forward migration files) |
| Extraction regex | `CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+"?public"?\."?([a-z_][a-z_0-9]*)"?\s*\(` |
| Unique public function names | 300 |
| Non-canonical sources excluded | `RPC_CONTRACTS.md`, `schema.sql`, `generated/database.types.ts` — none read |

### 4.3 Mock Extraction

| Property | Value |
|---|---|
| Mock file | `tests/mocks/supabase.ts` |
| Extraction regex | `if \(name === '([a-z_0-9]+)'\)` |
| Snake_case only | Yes — kebab-case edge function handlers (`-` character) naturally excluded |
| Handler blocks extracted | 69 (after duplicate removal) |
| Unique RPC names | 69 |
| Line numbers tracked | Yes — each handler records its source line |

---

## 5. Implementation Summary

### 5.1 Audit Script Extension

The audit script (`scripts/audit-rpc-contracts.ts`) was extended with three new validation passes while preserving the existing code ↔ migrations validation:

**New function: `extractMockRpcs(filePath)`**
- Reads `tests/mocks/supabase.ts` line by line.
- Matches `if (name === 'rpc_name')` patterns.
- Returns an array of `{ name, line }` objects.
- Snake_case character class `[a-z_0-9]+` naturally excludes kebab-case edge function handlers.

**New validation 1 — Stale-mock gate (hard fail):**
- Computes `mockNotInMigrations = mockNames - migrationNames`.
- If non-empty, prints each mock RPC not in migrations with its line number, and exits 1.

**New validation 2 — Duplicate-handler detection (hard fail):**
- Builds a `Map<string, number[]>` mapping each RPC name to its handler line numbers.
- Filters for names with >1 line.
- If non-empty, prints each duplicate with all lines and occurrence count, and exits 1.

**New validation 3 — Coverage-gap report (informational):**
- Computes `covered = codeNames ∩ mockNames` and `uncovered = codeNames - mockNames`.
- Prints total code RPCs, total mock RPCs, covered count, uncovered count, coverage %, and lists all uncovered RPCs.
- Does NOT affect exit code.

**Exit code logic:**
- Exit 1 if any of: `missingFromMigrations` (code ⊄ migrations), `mockNotInMigrations` (mock ⊄ migrations), `duplicateHandlers` (duplicate mock handlers).
- Exit 0 only when all three hard-fail checks pass.

### 5.2 Dead-Code Duplicate Removal

The mock file (`tests/mocks/supabase.ts`) contained a duplicate `get_tenant_members_with_email` handler block:

| Block | Line | Authorization Logic | Status |
|---|---|---|---|
| First | 721 | System admin only | **Preserved** (active handler) |
| Second | 2005 | System admin OR tenant owner | **Removed** (dead code — unreachable) |

The mock's `rpc` function uses sequential `if` blocks (not `else if`), so the first matching block always returns. The second block at line 2005 was dead code — it could never execute. Removing it changes no test behavior (confirmed: 389/389 tests pass).

This removal was required by Architecture Decision §7.3 Acceptance Criteria #7: "The duplicate `get_tenant_members_with_email` handler is resolved — the dead-code block at line 2005 is removed, preserving the authorization logic from the first block (line 721)."

**Scope justification:** Removing dead code is not modifying "mock implementation logic" — the behavioral logic is unchanged (the first block at line 721 was already the active handler). This is dead-code removal to satisfy the validation gate, not a logic change.

---

## 6. Validation Evidence

### 6.1 TypeScript

| Validation | Command | Result |
|---|---|---|
| V-TS | `npx tsc --noEmit` | Exit 0 — PASS |

### 6.2 Audit — Clean State

| Validation | Command | Result |
|---|---|---|
| V-AU | `npm run audit:rpc` | Exit 0 — PASS |

**Full output:**

```
Migration RPCs : 300
Code RPCs      : 183
Mock RPCs      : 69 (69 handler blocks)

All service-layer RPC calls are defined in the canonical migration chain.

All mock RPC handlers are defined in the canonical migration chain.

No duplicate mock RPC handlers.

Mock coverage report (informational — does not fail):
  Total code RPCs : 183
  Total mock RPCs : 69
  Covered         : 68
  Uncovered       : 115
  Coverage        : 37.2%
  Uncovered RPCs:
    - accept_invitation
    - adjust_customer_debt
    - [... 113 more ...]
    - verify_2fa_backup_code

Audit PASSED.
```

### 6.3 Existing Validation Preserved

| Validation | Result | Evidence |
|---|---|---|
| Code RPCs ⊆ migration RPCs | PASS | `Migration RPCs: 300`, `Code RPCs: 183`, 0 missing, "All service-layer RPC calls are defined in the canonical migration chain." |
| Canonical source unchanged | PASS | `supabase/migrations/*.sql` (top-level, excluding rollback/) — same as CURRENT_TASK-012 |
| Scan scope unchanged | PASS | `services/`, `lib/`, `utils/` — same as CURRENT_TASK-012 |

### 6.4 Mock Canonical Validation

| Validation | Result | Evidence |
|---|---|---|
| Mock RPCs ⊆ migration RPCs | PASS | `Mock RPCs: 69`, 0 missing, "All mock RPC handlers are defined in the canonical migration chain." |

### 6.5 Duplicate Detection

| Validation | Result | Evidence |
|---|---|---|
| No duplicate mock handlers | PASS | "No duplicate mock RPC handlers." (after dead-code removal) |

### 6.6 Coverage Report

| Validation | Result | Evidence |
|---|---|---|
| Coverage report generated | PASS | Total code: 183, Total mock: 69, Covered: 68, Uncovered: 115, Coverage: 37.2% |
| Coverage gap does not fail | PASS | Exit 0 despite 115 uncovered RPCs |

### 6.7 Exit Code

| Condition | Exit Code |
|---|---|
| All checks pass (clean state) | 0 |
| Mock RPC not in migrations | 1 |
| Duplicate mock handler | 1 |
| Code RPC not in migrations | 1 |
| Migrations directory not found | 1 |
| Mock file not found | 1 |

### 6.8 No Regression

| Validation | Command | Result |
|---|---|---|
| Test suite | `npx vitest run` | 68 test files, 389 tests — all PASS |
| TypeScript | `npx tsc --noEmit` | Exit 0 — PASS |
| Audit | `npm run audit:rpc` | Exit 0 — PASS |

---

## 7. Injection Test Evidence

Three injection tests were performed to verify the new validation gates work correctly. Each test temporarily modified `tests/mocks/supabase.ts`, ran the audit, verified the expected failure, then restored the file.

### 7.1 Injection Test 1 — Fake Mock RPC → Audit FAIL

**Injection:** Added `if (name === 'nonexistent_test_mock_rpc') { return { data: null, error: null }; }` to the mock file.

**Result:**

```
Mock RPCs not in canonical migrations (1):
  - nonexistent_test_mock_rpc  (line 2005)
Audit FAILED: mock RPCs missing from migrations
AUDIT EXIT: 1
```

**Verdict:** PASS — stale-mock gate correctly detected the non-existent RPC and exited 1.

### 7.2 Injection Test 2 — Duplicate Handler → Audit FAIL

**Injection:** Added a second `if (name === 'update_tenant_status') { return { data: null, error: null }; }` block (the original handler is at line 474).

**Result:**

```
Duplicate mock RPC handlers (1):
  - update_tenant_status  (lines 474, 2005 — 2 occurrences)
Audit FAILED: duplicate mock handlers
AUDIT EXIT: 1
```

**Verdict:** PASS — duplicate-handler detection correctly identified the duplicate with both line numbers and exited 1.

### 7.3 Injection Test 3 — Coverage Gap → Report Only, No FAIL

**Observation:** The coverage gap (115 uncovered RPCs) is always present in the current state. The audit reports it but does not fail.

**Result:**

```
Mock coverage report (informational — does not fail):
  Total code RPCs : 183
  Total mock RPCs : 69
  Covered         : 68
  Uncovered       : 115
  Coverage        : 37.2%

Audit PASSED.
AUDIT EXIT: 0
```

**Verdict:** PASS — coverage gap is reported as informational output, exit code remains 0.

### 7.4 File Restoration

After each injection test, the mock file was restored to its pre-injection state. Final verification:

```
git diff --stat tests/mocks/supabase.ts
 tests/mocks/supabase.ts | 15 ---------------
 1 file changed, 15 deletions(+)
```

Only the intended dead-code duplicate removal remains.

---

## 8. CI Impact

### 8.1 Entry Point

| Property | Value |
|---|---|
| npm script | `audit:rpc` → `npx tsx scripts/audit-rpc-contracts.ts` (unchanged) |
| CI workflow step | `Audit RPC contracts` → `npm run audit:rpc` (unchanged) |
| Pre-commit hook | `pre-commit` → `npm run lint && npx vitest run && npm run build && npm run audit:rpc` (unchanged) |

### 8.2 CI Behavior

The CI step `Audit RPC contracts` now enforces three hard-fail conditions:
1. Code RPCs must be defined in canonical migrations (existing).
2. Mock RPCs must be defined in canonical migrations (new).
3. No duplicate mock RPC handlers (new).

The coverage-gap report is informational and does not affect CI pass/fail.

### 8.3 No Workflow Change

`.github/workflows/ci.yml` was not modified. No new CI steps were added. No new jobs were created.

---

## 9. Contract Impact

**None.**

- No migration, schema, type, RPC, service, or production code changes.
- The canonical migration chain is read-only.
- The mock file change (dead-code removal) does not alter the mock's behavioral contract — the removed block was unreachable.
- The audit script change extends validation scope but does not change the canonical source or the existing validation invariant.

---

## 10. Risks

### 10.1 Identified Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Mock extraction regex may miss handlers if dispatch pattern changes (e.g., Map-based dispatch) | Minor | Regex is simple and dispatch pattern is uniform across the file. `ponytail:` comment documents the assumption and upgrade path. |
| Coverage gap (115 unmocked RPCs) persists — CI does not enforce coverage | Minor | Intentional per Architecture Decision. Closing the gap is follow-up implementation work. The report serves as a visible progress indicator. |
| `update_tenant_status` is mocked but not called by code — orphan mock handler | Minor | Informational. Harmless (no test exercises it via code). Future cleanup task can remove it. |

### 10.2 Resolved Risks

| Risk | Resolution |
|---|---|
| Duplicate `get_tenant_members_with_email` handler — dead code with different authorization logic | Resolved — dead-code block at line 2005 removed. First block (line 721, system admin only) preserved as the active handler. |

---

## 11. Conclusion

CURRENT_TASK-013 implements Option A (Recommended) from the Architecture Decision. The audit script (`scripts/audit-rpc-contracts.ts`) now validates the test mock layer against the canonical migration chain with three new passes: stale-mock gate (hard fail), duplicate-handler detection (hard fail), and coverage-gap report (informational). The existing code ↔ migrations validation is preserved unchanged. The dead-code duplicate `get_tenant_members_with_email` handler was removed.

All validation evidence confirms:
- TypeScript: PASS
- Audit (clean state): PASS (exit 0)
- Existing validation: PASS (unchanged)
- Mock canonical validation: PASS (0 missing)
- Duplicate detection: PASS (0 duplicates after removal)
- Coverage report: PASS (115 uncovered, informational, no fail)
- Injection tests: 3/3 PASS
- Test suite: 389/389 PASS (no regression)
- CI entry point: unchanged

The implementation is complete and awaits Program Manager review.

---

*Basis: `SYSTEM_RECOVERY_MASTER_PLAN.md` §2.1, §4 Phase 4; `CURRENT_PHASE.md` §1–§8; `CURRENT_TASK-013_TEST_MOCK_CANONICAL_VALIDATION_ARCHITECTURE_DECISION.md` §5 Option A, §7, §10; `CURRENT_TASK-012_ARCHITECTURE_DECISION.md` §4; `D-P4-02_CANONICAL_AUDIT_GATE_DEFINITION.md` §1–§8.*
