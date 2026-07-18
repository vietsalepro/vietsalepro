# CURRENT_TASK-013 — Architecture Decision

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Document Type:** Architecture Decision  
**Date:** 2026-07-14  
**Status:** REQUIRES PROGRAM MANAGER DECISION  
**Authorizing CURRENT_TASK:** CURRENT_TASK-013 — Test Mock Canonical Validation  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `CURRENT_TASK-012_ARCHITECTURE_DECISION.md`, `CURRENT_TASK-012_IMPLEMENTATION_REPORT.md`, `D-P4-02_CANONICAL_AUDIT_GATE_DEFINITION.md`, `SCAR_PHASE4_REPORT.md`

---

> **No implementation. No code change. No migration. No schema change. No generated type. No test change. No mock change.**  
> This document is an architecture decision deliverable only. It analyzes the test mock validation layer, evaluates options, and recommends a decision. No implementation may begin until the Program Manager approves this decision.

---

## 1. Current State

### 1.1 Mock File

**File:** `tests/mocks/supabase.ts` (2,338 lines, 111,119 bytes)

The mock is a hand-maintained in-memory Supabase simulation. It provides:

- An in-memory `store` with 35 tables (lines 13–51).
- Seed data for `system_settings`, `plans`, and `error_logs` via `resetMockData()` (lines 53–82).
- A query builder that simulates `select`, `insert`, `update`, `delete`, `upsert` with filtering, RLS enforcement, ordering, and pagination (lines 154–413).
- An `rpc` function that dispatches `supabase.rpc(name, params)` calls (lines 415–2069).
- A `functionsInvoke` function that dispatches `supabase.functions.invoke(name, { body })` calls (lines 2071–2461).
- An exported `mockSupabase` object wired with `vi.fn()` wrappers (lines 2463–2497).

### 1.2 RPC Handler Inventory

The `rpc` function uses sequential `if (name === '...') { ... return ... }` blocks — not a switch, not `else if`. Each block returns on match. An unrecognized name falls through to the final return at line 2468.

| Metric | Value |
|---|---|
| RPC handler blocks (snake_case, in `rpc` function) | 70 |
| Unique RPC handler names | 69 |
| Duplicate RPC handlers | 1 (`get_tenant_members_with_email` — lines 721 and 2005) |
| Edge function handler blocks (kebab-case, in `functionsInvoke`) | 16 |
| Total `if (name === ...)` blocks | 86 |

**Note on CURRENT_TASK-012 Architecture Decision §1.6:** That document stated "86 RPC handlers." This conflated the 70 RPC handlers (snake_case, `supabase.rpc()`) with the 16 edge function handlers (kebab-case, `supabase.functions.invoke()`). The actual RPC handler count is 70 blocks / 69 unique. This conflation does not affect CURRENT_TASK-012's conclusions (the audit script scans `supabase.rpc()` call sites, not `functions.invoke()`), but it is recorded here for accuracy.

### 1.3 Unknown RPC Handling

When the `rpc` function receives a name that matches no handler block, it returns:

```typescript
return { data: null, error: { code: 'PGRST116', message: 'RPC not found' } };
```

This is the same error code that PostgREST returns for an undefined function. The mock faithfully simulates the real database's "function not found" behavior — but only for RPCs that have no handler. RPCs that **do** have a handler return mock-specific data that may or may not match the real database's response shape.

### 1.4 Mock Injection Pattern

The mock is injected into tests via Vitest's `vi.mock()`:

```typescript
vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});
```

This pattern appears in **47 test files** across `tests/`, `tests/smoke/`, `tests/services/`, `tests/integration/`, and `tests/admin-dashboard/`. The mock replaces the real `supabase` client at the module level, so all service-layer code that imports from `lib/supabase` receives the mock during test execution.

### 1.5 Canonical Migration Chain (Post-CURRENT_TASK-012)

| Metric | Value | Source |
|---|---|---|
| Forward migration files | 138 | `supabase/migrations/*.sql` (top-level, excluding `rollback/`) |
| Unique public function names in migrations | 300 | `D-P4-02` §2, `CURRENT_TASK-012_IMPLEMENTATION_REPORT` §3.2 |
| Unique public function names in `schema.sql` | 300 | Cross-check, 0 divergence |
| Unique RPCs invoked by service code | 183 | `D-P4-02` §1, audit script output |
| Missing from canonical migrations | 0 | Audit PASS (exit 0) |

### 1.6 Audit Gate (Post-CURRENT_TASK-012)

**File:** `scripts/audit-rpc-contracts.ts` (90 lines)

The audit script validates one direction: **code RPCs ⊆ migration-defined RPCs**. It scans `services/`, `lib/`, and `utils/` for `supabase.rpc('...')` call sites and checks each against the 300 canonical migration function names. It does **not** scan `tests/mocks/supabase.ts`. The mock layer is entirely outside the audit's scope.

### 1.7 CI Gate

**File:** `.github/workflows/ci.yml` (36 lines)

CI runs four steps in order: Lint/Typecheck → Tests → Build → Audit RPC contracts. The audit step (`npm run audit:rpc`) is the final gate. There is no CI step that validates the mock layer against any source.

---

## 2. Mock Coverage Analysis

### 2.1 Methodology

A read-only analysis script compared three sets:
- **Migration RPCs** (300): extracted from `supabase/migrations/*.sql` using the same regex as the audit script.
- **Code RPCs** (183): extracted from `services/`, `lib/`, `utils/` using `supabase.rpc('...')` regex.
- **Mock RPCs** (69 unique): extracted from `tests/mocks/supabase.ts` using `if (name === '...')` regex (snake_case only, excluding edge function handlers).

### 2.2 Results

| Comparison | Count | Detail |
|---|---|---|
| Mock RPCs NOT in canonical migrations | **0** | All 69 mock RPC names exist in the 300 canonical migration functions. |
| Code RPCs NOT mocked | **115** | 115 of 183 code-invoked RPCs have no mock handler. Only 68/183 (37%) are mocked. |
| Mocked RPCs NOT called by code | **1** | `update_tenant_status` — mocked but no service code calls it. |
| Code RPCs fully covered (mocked + in migrations) | **68** | 68/183 (37%). |
| Duplicate mock handlers | **1** | `get_tenant_members_with_email` (lines 721 and 2005). |

### 2.3 The 115 Unmocked Code RPCs

The 115 code-invoked RPCs with no mock handler span all major functional areas:

| Area | Sample unmocked RPCs |
|---|---|
| Orders/Checkout | `process_checkout`, `cancel_order`, `delete_order`, `get_order_auto_code`, `search_orders_rpc` |
| Products/Inventory | `get_product_stats`, `search_products_rpc`, `filter_products_rpc`, `check_product_code_exists`, `increment_product_quantity`, `get_stock_ledger`, `check_stock_ledger_drift` |
| Customers/Suppliers | `get_customer_report`, `get_customer_stats`, `search_customers_rpc`, `get_supplier_report`, `adjust_customer_debt`, `pay_supplier_debt` |
| Reports/Analytics | `get_dashboard_summary`, `get_sales_report`, `get_revenue_metrics`, `get_profit_report`, `get_inventory_report`, `get_churn_cohort_metrics` |
| Security/Auth | `is_2fa_enabled`, `verify_2fa_backup_code`, `generate_2fa_backup_codes`, `get_login_attempts`, `record_login_attempt`, `unlock_login_attempts`, `get_tenant_security_settings` |
| GDPR/Compliance | `create_gdpr_request`, `gdpr_delete_user_data`, `gdpr_export_user_data`, `get_gdpr_requests` |
| Integrations/Webhooks | `create_integration`, `list_integrations`, `create_tenant_webhook`, `trigger_webhook_event`, `retry_webhook_delivery` |
| Licensing | `generate_tenant_license`, `validate_tenant_license` |
| Imports/Returns | `process_import_v2`, `create_return_order`, `cancel_return_order_v2`, `get_import_stats` |

(Full list in §2.2 output — 115 entries.)

### 2.4 Duplicate Handler: `get_tenant_members_with_email`

Two handler blocks exist for the same RPC name:

| Block | Line | Authorization Logic |
|---|---|---|
| First | 721 | `if (!isSystemAdmin)` → reject. Only system admin. |
| Second | 2005 | `if (!isSystemAdmin && !isTenantOwner(tenantId))` → reject. System admin OR tenant owner. |

Because the `rpc` function uses sequential `if` blocks (not `else if`), the first matching block executes and returns. The second block is **dead code** — it can never execute. The mock therefore enforces stricter authorization (system admin only) than the second block intended (system admin or owner). No gate catches this. This is a latent bug in the mock layer.

---

## 3. Boundary Analysis

### 3.1 Current Boundary

```text
Canonical Migration Chain (300 RPCs)
        │
        │  ← audit:rpc validates this arrow (CURRENT_TASK-012)
        ↓
Service Code (183 RPCs)
        │
        │  ← vi.mock replaces supabase with mockSupabase
        ↓
Mock Layer (69 unique RPC handlers)
        │
        │  ← no validation link exists
        ↓
Tests (47 test files)
```

### 3.2 Boundary Assessment

| Boundary | Validated? | By What? | Status |
|---|---|---|---|
| Canonical Migrations → Service Code | **Yes** | `scripts/audit-rpc-contracts.ts` (code ⊆ migrations) | **PASS** (CURRENT_TASK-012) |
| Canonical Migrations → Mock Layer | **No** | Nothing | **GAP** — no gate checks mock ⊆ migrations |
| Service Code → Mock Layer | **No** | Nothing | **GAP** — no gate checks code ⊆ mock (coverage) |
| Mock Layer → Tests | **Implicit** | Test execution (tests call mock, mock returns data) | **Partial** — tests only exercise paths they cover |

### 3.3 Boundary Verdict

The boundary is **incorrect**. The audit gate (CURRENT_TASK-012) closed the Canonical → Service Code boundary, but the Mock Layer sits outside all validation. The mock layer is a **derived validation artifact** per Master Plan §2 ("derived artifacts are regenerated from the canonical source; they are not maintained by manual copying") and per SCAR Phase 4 (classified as "Derived validation + shadow implementation"). It must be validated against the canonical source.

---

## 4. Root Cause

### 4.1 Why the Mock Layer Drifted

The mock layer is hand-maintained. Handlers are added when a developer writes a test that exercises a new RPC. No mechanism ensures:
1. Every mock handler corresponds to a canonical migration function (stale mock prevention).
2. Every code-invoked RPC has a mock handler (coverage gap detection).

The 4 critical stale RPCs identified by SCAR Phase 4 (`admin_update_subscription`, `get_member_with_email`, `search_members_by_email`, `get_storage_usage`) were **removed from the mock** during Phase 3. This resolved Drift Mode 1 (stale mocks) for those 4 RPCs. The current analysis confirms: **0 mock RPCs are absent from canonical migrations**. The stale-mock direction is clean.

However, Drift Mode 2 (coverage gap) was never addressed. 115 of 183 code-invoked RPCs have no mock handler. This gap accumulated because:
- Developers add RPC calls to service code without adding mock handlers.
- No gate detects the gap.
- Tests that would exercise the unmocked RPCs are either not written, or they encounter the mock's `PGRST116` fallback and are marked as "mock limitation" or skipped.

### 4.2 Why the Audit Gate Does Not Detect Mock Drift

The audit script (`scripts/audit-rpc-contracts.ts`, post-CURRENT_TASK-012) scans `services/`, `lib/`, and `utils/` for `supabase.rpc()` call sites. It does **not** scan `tests/mocks/supabase.ts`. The mock layer is invisible to the audit. Even if a mock handler implemented a non-existent RPC (Drift Mode 1), the audit would not catch it — the audit only checks code call sites, not mock handler names.

### 4.3 Why There Is a False Quality Signal

The test suite passes (green CI) because:

1. **68 mocked RPCs** work correctly in tests — these are real, hand-crafted simulations that exercise the service layer meaningfully.
2. **115 unmocked RPCs** are either:
   - **Not exercised by any test** — the gap is invisible. Tests pass because the unmocked path is never hit.
   - **Exercised but the `PGRST116` error is not caught** — the test may check only the happy path of a different RPC, or the error is swallowed by the service layer's error handling.
3. **No gate** checks that mock coverage matches code coverage.

The net result: **a passing test suite does not imply that the mock layer validates the real canonical contract.** It implies that the 68 mocked RPCs work in the mock environment. The other 115 code-invoked RPCs — 63% of the service-layer RPC surface — are untested via mock, and their production behavior is unvalidated by the test layer.

This is the **false quality signal** that SCAR Phase 4 identified: "Tests pass against a fictional DB contract" (SSOT Evidence Matrix #11). CURRENT_TASK-012 resolved the audit-side false signal (audit now reads canonical migrations). The mock-side false signal remains.

### 4.4 Root Cause Statement

The mock layer has no validation link to the canonical migration chain. The audit gate validates code ↔ migrations but not mock ↔ migrations or mock ↔ code. The mock layer is a hand-maintained derived artifact with no generation or validation link to the canonical source. This allows two drift modes: stale mocks (resolved for the 4 critical RPCs in Phase 3, currently 0) and coverage gaps (115 unmocked RPCs, undetected). The coverage gap is the active false quality signal: the test suite is green, but 63% of the RPC surface is unvalidated by the mock layer.

---

## 5. Architecture Options

Three options are evaluated for validating the mock layer against the canonical migration chain. All three assume the same canonical source (forward migration chain, 300 RPCs) and the same mock extraction method (`if (name === '...')` regex on `tests/mocks/supabase.ts`).

### Option A — Extend Audit Script with Mock Validation (Recommended)

**Architecture:**

Extend `scripts/audit-rpc-contracts.ts` with a second validation pass:

1. **Stale-mock gate (hard fail):** Extract mock RPC names from `tests/mocks/supabase.ts`. Check `mock RPCs ⊆ migration RPCs`. If any mock RPC is not defined in canonical migrations, exit 1. This prevents the Phase 3 issue from recurring.

2. **Coverage-gap report (informational, not a hard fail):** Compute `code RPCs − mock RPCs` (the set of code-invoked RPCs with no mock handler). Print the count and list as informational output. Do **not** exit 1 on coverage gap — doing so would immediately break CI with 115 violations, which is implementation work beyond this architecture decision's scope.

3. **Duplicate-handler detection (hard fail):** Detect duplicate `if (name === '...')` blocks for the same RPC name. Exit 1 if any duplicate exists. This catches the `get_tenant_members_with_email` latent bug.

**Validation invariants:**

| Invariant | Gate Type | Current State |
|---|---|---|
| code RPCs ⊆ migration RPCs | Hard fail (existing) | PASS (0 missing) |
| mock RPCs ⊆ migration RPCs | Hard fail (new) | PASS (0 missing) |
| No duplicate mock handlers | Hard fail (new) | FAIL (1 duplicate) |
| code RPCs ⊆ mock RPCs | Informational (new) | 115 gap reported |

**Advantages:**
- Single script, single CI step, no new files — smallest diff, fewest files (ponytail: "Fewest files possible").
- Both validation concerns (code ↔ migrations, mock ↔ migrations) read the same canonical source — no risk of source divergence between two scripts.
- The stale-mock gate directly satisfies Phase 4 exit criterion "Test mocks are derived from or validated against the canonical migration contract."
- The coverage-gap report makes the 115-RPC gap visible without breaking CI — enabling a follow-up implementation task to close the gap incrementally.
- Duplicate-handler detection catches the `get_tenant_members_with_email` latent bug.
- Compatible with existing CI workflow structure (same `npm run audit:rpc` invocation, same exit-code contract).

**Disadvantages:**
- The audit script becomes responsible for two related but distinct concerns (code ↔ migrations and mock ↔ migrations). This is a minor scope expansion, not a separation-of-concerns violation — both concerns validate derived artifacts against the same canonical source.
- The coverage-gap report is informational only — it does not enforce coverage. CI will not fail if the gap grows. This is intentional (closing the gap is implementation work), but it means the gap can persist indefinitely unless a follow-up task is authorized.
- The duplicate-handler detection will immediately fail CI (1 duplicate exists). This requires a one-line fix (remove the dead-code duplicate at line 2005) as part of the implementation task. This is a breaking change to CI on first run — but it is a real bug, not a false positive.

**Risks:**
- **Medium-Low.** Primary risk: the mock extraction regex (`if \(name === '([a-z_0-9]+)'\)`) may miss handlers if the mock's dispatch pattern changes (e.g., switch to a Map-based dispatch). Mitigated by: the regex is simple and the dispatch pattern is uniform across the 2,338-line file. Secondary risk: the duplicate-handler hard-fail breaks CI until the duplicate is fixed. Mitigated by: the fix is a one-line deletion, and the duplicate is dead code (removing it changes no test behavior).

**Long-term maintenance:**
- The script requires no maintenance when new mock handlers are added (it scans `tests/mocks/supabase.ts` dynamically).
- The script requires no maintenance when new migrations are added (it scans `supabase/migrations/*.sql` dynamically).
- The coverage-gap report will shrink as mock handlers are added in future implementation tasks — the report serves as a progress indicator.

**Compatibility with Master Plan:**
- Fully compatible with Master Plan §2.1 ("The ordered migration chain is the only acceptable canonical source").
- Fully compatible with Master Plan §2.6 ("Tool-generated synchronization. Derived artifacts are regenerated from the canonical source; they are not maintained by manual copying") — the mock is hand-maintained, but the validation gate ensures it does not drift from the canonical source.
- Directly satisfies Phase 4 exit criterion: "Test mocks are derived from or validated against the canonical migration contract."
- Directly satisfies Phase 4 exit criterion: "CI gates fail when a derived artifact diverges from the canonical source" — the mock is a derived artifact, and the stale-mock gate fails CI when it diverges.

**Scope impact:**
- Modifies `scripts/audit-rpc-contracts.ts` only (adds mock validation pass).
- No migration, schema, type, service, or test changes.
- The duplicate-handler fix (removing line 2005's dead-code block) is a one-line mock change — required to make the gate pass. This is implementation work for the follow-up CURRENT_TASK, not this architecture decision.

---

### Option B — Dedicated Mock Validation Script (Fallback)

**Architecture:**

Create a separate script `scripts/audit-mock-contracts.ts` that performs the same three checks as Option A (stale-mock gate, coverage-gap report, duplicate-handler detection). Wire it into CI as a new step after the existing `Audit RPC contracts` step. Add a new `package.json` script `audit:mock` → `npx tsx scripts/audit-mock-contracts.ts`.

**Advantages:**
- Separation of concerns: each script has one job (code ↔ migrations vs. mock ↔ migrations).
- Can be enabled, disabled, or evolved independently of the existing audit script.
- The mock validation logic is isolated — no risk of accidentally breaking the existing code ↔ migrations audit.

**Disadvantages:**
- New file, new CI step, new package.json script — more files, more maintenance surface (ponytail: "Fewest files possible").
- Two scripts reading the same canonical source — if the migration extraction regex needs to change (e.g., a new SQL identifier format), both scripts must be updated in lockstep. This is a coupling risk.
- The CI workflow must be modified (new step added) — slightly larger diff than Option A.

**Risks:**
- **Low.** Same regex fragility as Option A, but isolated to a new script. The lockstep-update risk is mitigated by the fact that both scripts use the same regex pattern (copy-paste is obvious and reviewable).

**Long-term maintenance:**
- Two scripts to maintain instead of one.
- The coverage-gap report and stale-mock gate evolve independently — if the mock validation logic needs to change, only the new script is touched.

**Compatibility with Master Plan:**
- Same compatibility as Option A.
- Satisfies the same Phase 4 exit criteria.

**Scope impact:**
- Creates `scripts/audit-mock-contracts.ts` (new file).
- Modifies `.github/workflows/ci.yml` (new CI step).
- Modifies `package.json` (new `audit:mock` script, update `pre-commit`).
- No migration, schema, type, service, or test changes.

---

### Option C — Generate Mock from Canonical Source (Rejected)

**Architecture:**

Generate mock RPC handler stubs from the canonical migration chain. A codegen script reads `supabase/migrations/*.sql`, extracts the 300 public function names, and generates a mock file with a handler stub for each. The generated mock replaces `tests/mocks/supabase.ts`.

**Advantages:**
- Guarantees 1:1 coverage between mock handlers and canonical migration functions by construction.
- No staleness risk — regeneration is deterministic from the canonical source.
- Satisfies Master Plan §2.6 ("Tool-generated synchronization") in its strictest form.

**Disadvantages:**
- **Destroys the mock's value.** The mock's value is in its hand-crafted business logic — each handler simulates the RPC's behavior (authorization checks, data manipulation, error conditions). Auto-generated stubs would be empty no-ops (`return { data: null, error: null }`), providing zero test value. Tests would pass against empty stubs, creating a worse false quality signal than the current gap.
- **Generates 117 unused stubs.** 300 migration-defined RPCs vs. 183 code-invoked RPCs — 117 migration functions are internal, trigger-related, or not called via `supabase.rpc()`. Generating stubs for all 300 creates 117 unused handlers.
- **Breaks all 47 test files.** The generated mock would not have the in-memory store, RLS simulation, seed data, or hand-crafted handler logic that the current mock provides. All existing tests would need to be rewritten.
- **Violates Phase 4 constraints.** Phase 4 scope is "test mocks and test assertions that currently implement or assume missing RPCs" — it is about realigning the mock layer, not replacing it with a codegen artifact. Replacing the mock is an architecture redesign, which Phase 4 §5 prohibits: "No architecture redesign."
- **Conflicts with the ponytail principle.** Generating 300 stubs to replace a 2,338-line hand-maintained mock is the opposite of "Deletion over addition. Boring over clever."

**Risks:**
- **Critical.** Replacing the mock destroys test value, breaks 47 test files, and generates 117 unused stubs. The false quality signal becomes worse, not better.

**Long-term maintenance:**
- The codegen script must be maintained. The generated mock must be regenerated after every migration change. The hand-crafted business logic that makes the mock useful cannot be regenerated — it would need to be maintained separately, recreating the hand-maintenance problem.

**Compatibility with Master Plan:**
- Appears compatible with §2.6 ("Tool-generated synchronization") but fundamentally incompatible with the mock's purpose (the mock is a behavioral simulation, not a type artifact). The Master Plan's tool-generated principle applies to schema artifacts and type artifacts, not to behavioral test mocks.

**Why rejected:**
- Destroys test value (empty stubs).
- Breaks 47 test files.
- Violates Phase 4 constraints (no architecture redesign).
- Generates 117 unused stubs.
- The mock is a behavioral simulation, not a derivable type artifact — codegen is the wrong tool.

---

## 6. Scope Impact

### 6.1 Option A (Recommended)

| Layer | Changed? | Detail |
|---|---|---|
| Migration | **No** | Read-only canonical input |
| Schema | **No** | Not referenced |
| Generated types | **No** | Not referenced |
| RPC | **No** | Not referenced |
| Service layer | **No** | Not modified (scanned read-only by existing audit pass) |
| Production code | **No** | Not modified |
| CI | **No** | `npm run audit:rpc` invocation unchanged; same step, same exit-code contract |
| Tests | **No** | Not modified |
| Mock layer | **No** (by this decision) | The duplicate-handler fix is implementation work for the follow-up CURRENT_TASK, not this architecture decision |
| Audit script | **Yes** | `scripts/audit-rpc-contracts.ts` extended with mock validation pass |
| package.json | **No** | `audit:rpc` script unchanged |

### 6.2 Option B (Fallback)

| Layer | Changed? | Detail |
|---|---|---|
| Migration | **No** | Read-only canonical input |
| Schema | **No** | Not referenced |
| Generated types | **No** | Not referenced |
| RPC | **No** | Not referenced |
| Service layer | **No** | Not modified |
| Production code | **No** | Not modified |
| CI | **Yes** | New `Audit mock contracts` step added |
| Tests | **No** | Not modified |
| Mock layer | **No** (by this decision) | Same as Option A |
| Audit script | **No** | Existing script unchanged |
| New script | **Yes** | `scripts/audit-mock-contracts.ts` created |
| package.json | **Yes** | New `audit:mock` script; `pre-commit` updated |

### 6.3 Option C (Rejected)

| Layer | Changed? | Detail |
|---|---|---|
| All layers | **Yes** | Mock replaced, all 47 test files break, codegen script created |

---

## 7. Validation Strategy

If Option A (or B) is approved for future implementation, the following validation strategy is recommended. **This section is analysis only — no implementation.**

### 7.1 Validation Steps

| ID | Validation | Method | Expected Result |
|---|---|---|---|
| V-1 | Stale-mock gate — clean state | Run extended audit script | Exit 0; `Mock RPCs: 69`; `Mock RPCs not in migrations: 0` |
| V-2 | Stale-mock gate — injection test | Temporarily add `if (name === 'nonexistent_test_mock_rpc')` to `tests/mocks/supabase.ts`; run audit | Exit 1; `nonexistent_test_mock_rpc` listed as mock RPC not in migrations; remove injection; exit 0 |
| V-3 | Duplicate-handler detection — current state | Run extended audit script | Exit 1; `get_tenant_members_with_email` listed as duplicate handler (lines 721, 2005) |
| V-4 | Duplicate-handler detection — after fix | Remove dead-code duplicate at line 2005; run audit | Exit 0; no duplicates reported |
| V-5 | Coverage-gap report | Run extended audit script | Informational output: `Code RPCs not mocked: 115` (or fewer after future mock implementation) |
| V-6 | TypeScript | `npx tsc --noEmit` | Exit 0 |
| V-7 | CI integration | `npm run audit:rpc` | Works unchanged; exit-code semantics preserved |
| V-8 | Existing audit unchanged | Run extended audit script | `Migration RPCs: 300`, `Code RPCs: 183`, 0 missing — existing code ↔ migrations check still passes |

### 7.2 Evidence

| ID | Evidence | Source |
|---|---|---|
| E-1 | Mock RPC extraction | `tests/mocks/supabase.ts` via `if (name === '...')` regex |
| E-2 | Migration RPC extraction | `supabase/migrations/*.sql` via existing regex (300 names) |
| E-3 | Stale-mock check result | `mock RPCs − migration RPCs = ∅` |
| E-4 | Coverage-gap report | `code RPCs − mock RPCs = 115` (current) |
| E-5 | Duplicate-handler detection | `get_tenant_members_with_email` appears at lines 721 and 2005 |
| E-6 | CI behavior | Same `npm run audit:rpc` invocation; exit 0 on clean, exit 1 on violation |

### 7.3 Acceptance Criteria

The implementation is accepted when:

1. The extended audit script validates `mock RPCs ⊆ migration RPCs` and exits 1 on violation (V-1, V-2).
2. The extended audit script detects duplicate mock handlers and exits 1 on violation (V-3, V-4).
3. The extended audit script reports the coverage gap as informational output without exiting 1 (V-5).
4. The existing code ↔ migrations validation is unchanged and still passes (V-8).
5. `npx tsc --noEmit` passes (V-6).
6. `npm run audit:rpc` works in CI with the same invocation and exit-code contract (V-7).
7. The duplicate `get_tenant_members_with_email` handler is resolved (V-4) — the dead-code block at line 2005 is removed, preserving the authorization logic from the first block (line 721) or reconciling with the second block's intent (system admin OR tenant owner). This is an implementation decision for the follow-up CURRENT_TASK.

---

## 8. Risk Assessment

### 8.1 Critical

**None.** No critical risks identified. The mock layer's stale-mock direction is clean (0 mock RPCs absent from migrations). The coverage gap is a quality debt, not a data-loss or security risk.

### 8.2 Major

| Risk | Severity | Mitigation |
|---|---|---|
| 115 unmocked code RPCs — 63% of the RPC surface is unvalidated by the mock layer | **Major** | Option A's coverage-gap report makes the gap visible. A follow-up implementation task can close the gap incrementally. This architecture decision defines the validation gate; closing the gap is implementation work. |
| Duplicate `get_tenant_members_with_email` handler — dead code with different authorization logic | **Major** | Option A's duplicate-handler detection catches this as a hard fail. The fix is a one-line deletion (implementation work for the follow-up CURRENT_TASK). |

### 8.3 Minor

| Risk | Severity | Mitigation |
|---|---|---|
| Mock extraction regex may miss handlers if dispatch pattern changes | **Minor** | The regex is simple and the dispatch pattern is uniform. If the mock switches to a Map-based dispatch, the regex must be updated — this is a one-line change. |
| Coverage-gap report is informational only — gap can persist indefinitely | **Minor** | Intentional. Closing the gap is implementation work. The report serves as a progress indicator and a visible reminder. A future task can upgrade the report to a hard fail once coverage reaches an acceptable threshold. |
| `update_tenant_status` is mocked but not called by code — orphan mock handler | **Minor** | Informational. The handler is harmless (no test exercises it via code). A future cleanup task can remove it. |

### 8.4 Informational

| Risk | Severity | Note |
|---|---|---|
| CURRENT_TASK-012 Architecture Decision §1.6 stated "86 RPC handlers" — actual count is 70 RPC blocks (69 unique) + 16 edge function handlers | **Informational** | Does not affect CURRENT_TASK-012's conclusions. Recorded here for accuracy. The audit script scans `supabase.rpc()` call sites, not `functions.invoke()` call sites, so edge function handlers are correctly outside the audit's scope. |
| The mock's `functionsInvoke` (16 edge function handlers) is entirely outside both the audit gate and this architecture decision's scope | **Informational** | Edge functions are a separate contract surface (`supabase.functions.invoke()` vs. `supabase.rpc()`). SCAR Phase 4 classified edge functions as "Derived / runtime" — they are not part of the canonical migration RPC surface. Validating edge function mocks against canonical migrations is out of scope for Phase 4. |

---

## 9. Program Impact

### 9.1 Contribution to Phase 4

CURRENT_TASK-013 addresses the **second half** of the Phase 4 validation-layer realignment:

| Phase 4 Exit Criterion | Addressed By | Status |
|---|---|---|
| Test mocks are derived from or validated against the canonical migration contract | **CURRENT_TASK-013** (this decision) | Defines the validation gate (mock ⊆ migrations) |
| Passing tests imply that the corresponding production path will not fail on the previously known contract breaks | CURRENT_TASK-013 (coverage-gap report) + follow-up implementation | Makes the 115-RPC coverage gap visible; closing the gap is implementation work |
| The operational audit script compares service-layer RPC calls against the canonical migration chain | CURRENT_TASK-012 (CLOSED) | **DONE** — audit reads canonical migrations |
| CI gates fail when a derived artifact diverges from the canonical source | CURRENT_TASK-012 (code ↔ migrations) + CURRENT_TASK-013 (mock ↔ migrations) | CURRENT_TASK-012 done; CURRENT_TASK-013 extends the gate to the mock layer |

### 9.2 Contribution to Phase 4 Exit Criteria

CURRENT_TASK-013 directly satisfies two of the four Phase 4 exit criteria:

1. **"Test mocks are derived from or validated against the canonical migration contract"** — Option A's stale-mock gate validates `mock RPCs ⊆ migration RPCs`, ensuring no mock handler implements a non-existent RPC. This is the "validated against" form (the mock is hand-maintained but validated, not generated).

2. **"CI gates fail when a derived artifact diverges from the canonical source"** — Option A extends the CI gate to fail when the mock layer (a derived artifact) diverges from the canonical migration chain.

The remaining two criteria are partially addressed:

3. **"Passing tests imply that the corresponding production path will not fail on the previously known contract breaks"** — The coverage-gap report makes the gap visible, but closing the 115-RPC gap is implementation work for a follow-up CURRENT_TASK. This architecture decision recommends that the Program Manager authorize a follow-up task to close the gap incrementally.

4. **"The operational audit script compares service-layer RPC calls against the canonical migration chain"** — Already satisfied by CURRENT_TASK-012 (CLOSED).

### 9.3 Phase 4 Validation (Master Plan §4)

The Master Plan defines Phase 4 validation as: "A deliberate injection of a non-existent RPC call is caught by the audit gate and by the test base; the audit gate reports zero missing RPCs against the canonical migration chain."

CURRENT_TASK-012 satisfied the audit-gate side (injection caught by audit). CURRENT_TASK-013 extends this to the mock side: a deliberately injected non-existent mock handler is caught by the extended audit gate (V-2). The "test base" side — ensuring the test base catches the injection — depends on closing the coverage gap, which is follow-up implementation work.

### 9.4 Deliverable Contribution

CURRENT_TASK-013 contributes to Phase 4 Deliverable 1 (Validated Test Base) by defining the validation gate that ensures the mock layer is validated against the canonical migration contract. The deliverable is not the mock itself (which is implementation) but the **gate** that validates it.

---

## 10. Recommendation

**Option A — Extend Audit Script with Mock Validation** is recommended.

Rationale:
- Smallest diff, fewest files (extends existing script, no new files, no CI workflow change).
- Both validation concerns read the same canonical source — no source divergence risk.
- Directly satisfies two Phase 4 exit criteria.
- The stale-mock gate prevents the Phase 3 issue from recurring.
- The coverage-gap report makes the 115-RPC gap visible without breaking CI.
- The duplicate-handler detection catches a real latent bug.
- Compatible with the ponytail principle (fewest files, smallest working diff).

Option B is a viable fallback if the Program Manager prefers separation of concerns over file minimality. Option C is rejected — it destroys test value and violates Phase 4 constraints.

---

## 11. Follow-Up Recommendation

This architecture decision recommends that the Program Manager consider authorizing a follow-up CURRENT_TASK to:

1. **Implement Option A** (or B) — extend the audit script with mock validation.
2. **Fix the duplicate handler** — remove the dead-code `get_tenant_members_with_email` block at line 2005.
3. **Close the coverage gap incrementally** — add mock handlers for the 115 unmocked code RPCs, prioritized by functional area. This may be a single task or multiple tasks.
4. **Upgrade the coverage-gap report to a hard fail** once coverage reaches an acceptable threshold (e.g., 95% of code-invoked RPCs mocked).

These are implementation tasks and are **not** authorized by this architecture decision. They require separate Program Manager approval.

---

## 12. Constraints Honored

| Constraint | Status |
|---|---|
| No code changes | **Honored** — no code modified |
| No mock changes | **Honored** — `tests/mocks/supabase.ts` not modified |
| No audit changes | **Honored** — `scripts/audit-rpc-contracts.ts` not modified |
| No CI changes | **Honored** — `.github/workflows/ci.yml` not modified |
| No migration changes | **Honored** — `supabase/migrations/` not modified |
| No schema changes | **Honored** — `supabase/schema.sql` not modified |
| No type regeneration | **Honored** — `supabase/generated/database.types.ts` not modified |
| No new CURRENT_TASK created | **Honored** — follow-up recommended in §11, not created |
| No new roadmap created | **Honored** |
| No implementation | **Honored** — analysis and decision only |
| Single deliverable | **Honored** — this document is the only deliverable |

---

## Architecture Decision

REQUIRES PROGRAM MANAGER DECISION
