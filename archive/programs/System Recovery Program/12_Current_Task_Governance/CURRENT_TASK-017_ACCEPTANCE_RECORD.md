# CURRENT_TASK-017 — Acceptance Record

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3b — Domain H5 — Customers Mock Coverage  
**Document Type:** Program Manager Acceptance Record (Independent Acceptance Review)  
**Date:** 2026-07-15  
**Status:** Accepted with Minor Notes  
**Authorizing CURRENT_TASK:** CURRENT_TASK-017 — Customers Mock Coverage (Wave 3b / TASK-H5)  
**Architecture Decision:** `CURRENT_TASK-017_ARCHITECTURE_DECISION.md`  
**Engineering Kickoff:** `CURRENT_TASK-017_ENGINEERING_KICKOFF.md`  
**Implementation Report:** `CURRENT_TASK-017_IMPLEMENTATION_REPORT.md`  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `CURRENT_TASK-017_ARCHITECTURE_DECISION.md`, `CURRENT_TASK-017_ENGINEERING_KICKOFF.md`, `CURRENT_TASK-017_IMPLEMENTATION_REPORT.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_M3.md`, `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` (canonical source)

---

> **This is an Independent Acceptance Review.** All conclusions are based on evidence independently reproduced by the Program Manager. No conclusion relies on the Engineering Team's self-assessment.

---

## 1. Objective

Independently verify that CURRENT_TASK-017 — Domain H5 — Customers Mock Coverage — was implemented in full conformance with `CURRENT_TASK-017_ARCHITECTURE_DECISION.md`, raising mock coverage from **57.4%** to **60.7%** with zero regression and zero contract impact.

---

## 2. Scope

| Dimension | Authorized Scope | Verified Scope |
|---|---|---|
| Domain | Domain H5 — Customers only | Domain H5 only — confirmed |
| RPC count | Exactly 6 unique RPCs | 6 unique RPCs — confirmed |
| Files permitted to change | `tests/mocks/supabase.ts` (+ optional `tests/**`) | `tests/mocks/supabase.ts` and `tests/mocks/customer-rpc-handlers.test.ts` — confirmed |
| Change nature | Additive only (no existing handler modified/removed) | Additive only — confirmed (see §5) |
| Out of scope | Production code, migrations, schema, types, audit script, CI, `package.json`, new files | None touched by this task — confirmed (see §5) |

---

## 3. Evidence Reviewed

| # | Evidence | Source | Independently Reproduced |
|---|---|---|---|
| 1 | `SYSTEM_RECOVERY_MASTER_PLAN.md` | Program governance | Read in full |
| 2 | `CURRENT_PHASE.md` | Phase 4 governance | Read in full |
| 3 | `CURRENT_TASK-017_ARCHITECTURE_DECISION.md` | Task authorization | Read in full |
| 4 | `CURRENT_TASK-017_ENGINEERING_KICKOFF.md` | Engineering readiness | Read in full |
| 5 | `CURRENT_TASK-017_IMPLEMENTATION_REPORT.md` | Engineering self-report | Read in full (not relied upon for conclusions) |
| 6 | `tests/mocks/supabase.ts` (lines 57–58, 2884–3074) | Implementation | Read in full; all 6 handlers and store additions inspected |
| 7 | `tests/mocks/customer-rpc-handlers.test.ts` | Self-check test | Read in full; 6/6 handler paths exercised |
| 8 | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | Canonical source | Read at the 6 function locations defining the H5 RPCs |
| 9 | `npx tsx scripts/audit-rpc-contracts.ts` | Audit gate | Independently executed — exit 0, stale mock = 0, duplicate = 0, coverage = 60.7% |
| 10 | `npx tsc --noEmit` | Type gate | Independently executed — exit 0, no errors |
| 11 | `npx vitest run` | Test gate | Independently executed — 69 files, 395 tests, all PASS |
| 12 | Service call-site grep | Call-site verification | Independently executed — all 6 call-sites confirmed in `services/supabaseService.ts` |
| 13 | `PHASE4_COVERAGE_ROADMAP.md` | Roadmap conformance | Read; Domain H5 / Wave 3b / 6 RPCs / 57.4% → 60.7% confirmed |

---

## 4. Architecture Compliance

Each requirement from `CURRENT_TASK-017_ARCHITECTURE_DECISION.md` §5 Constraints, independently verified:

| # | Requirement | PASS / FAIL | Independent Evidence |
|---|---|---|---|
| 1 | No feature development / architecture redesign / scope expansion | **PASS** | Only mock handler blocks added to `tests/mocks/supabase.ts`; no production logic touched. |
| 2 | No modification of production code, migrations, schema, generated types, CI, `package.json` | **PASS** | The only files attributable to CURRENT_TASK-017 are `tests/mocks/supabase.ts` and `tests/mocks/customer-rpc-handlers.test.ts`. Other modified files in the working tree predate or are outside this task's scope. |
| 3 | No new files / scripts / governance artifacts (report excepted) | **PASS** | One optional self-check test file added under `tests/mocks/`; no new scripts or governance artifacts introduced. |
| 4 | Implementation inside an approved CURRENT_TASK | **PASS** | CURRENT_TASK-017 authorized by `CURRENT_TASK-017_ARCHITECTURE_DECISION.md` and `CURRENT_TASK-017_ENGINEERING_KICKOFF.md`. |
| 5 | Mock handlers follow the existing `if (name === '...')` dispatch pattern | **PASS** | All 6 handlers use `if (name === '<rpc>')`. No Map dispatch or new abstraction introduced. |
| 6 | Mock return shapes match canonical migration function signatures (RETURNS + params) | **PASS** | All 6 RPCs independently verified against canonical migration `RETURNS` clauses, parameter lists, and `json_build_object` keys (see §6). |
| 7 | Additive only — no modification/removal of existing handlers | **PASS** | 6 new handler blocks are insertions before the fallback. Audit gate confirms 112 total handlers, 0 duplicates. The fallback `return { data: null, error: { code: 'PGRST116', message: 'RPC not found' } }` remains intact. |
| 8 | Audit script frozen (not modified) | **PASS** | `scripts/audit-rpc-contracts.ts` was not modified by CURRENT_TASK-017. |
| 9 | No mock for an RPC not in the canonical migration chain | **PASS** | Audit stale-mock gate: "All mock RPC handlers are defined in the canonical migration chain." 0 stale mocks. |
| 10 | No duplicate handler for an already-mocked RPC | **PASS** | Audit duplicate-handler gate: "No duplicate mock RPC handlers." 0 duplicates. |

**Architecture Compliance: PASS (10/10 constraints honored)**

---

## 5. Scope Compliance

| Check | Result | Evidence |
|---|---|---|
| Only Domain H5 | **PASS** | All 6 mocked RPCs belong to Domain H5 — Customers. No RPC from domains A, B, C–G, H1, H2–H9 added. |
| Exactly 6 RPCs | **PASS** | 6 unique `if (name === '...')` blocks added: `search_customers_rpc` (line 2886), `filter_customers_rpc` (line 2903), `get_customer_stats` (line 2945), `get_customer_report` (line 2957), `get_customer_debt_ledger` (line 3007), `adjust_customer_debt` (line 3041). |
| Additive-only | **PASS** | 6 new handler blocks + 2 new store keys (`customers`, `customer_payment_ledger`) are all insertions. No existing handler block modified by this task. |
| No existing handler modified | **PASS** | Audit confirms 112 handlers, 0 duplicates. The 6 new handlers are positioned after prior handlers, before the fallback. |
| No dispatch reorder | **PASS** | Same `if (name === '...')` dispatch pattern; no Map refactor, no new abstraction. Fallback block intact. |
| No scope expansion | **PASS** | No production code, migrations, schema, types, audit script, CI, or `package.json` modified by this task. |

**Scope Compliance: PASS**

---

## 6. Traceability Review

All 6 new mock handlers are traced to their canonical `CREATE [OR REPLACE] FUNCTION public.<name>` declaration in `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`. Independently verified by reading each function declaration and comparing `RETURNS` clauses, `json_build_object` keys, parameter lists, and guard chains against the mock implementation.

| Mock RPC | Service (call-site) | Canonical Migration File | Migration Line | RETURNS | Mock Shape | Verified |
|---|---|---|---|---|---|---|
| `search_customers_rpc` | `services/supabaseService.ts:581` | `20250703000000_baseline_pre_tenant_schema.sql` | 11884 | `SETOF public.customers` | Array of customer rows; case-insensitive unaccent search on `name`, `phone`, `code`; sort by `name` ASC; limit 500. | **PASS** |
| `filter_customers_rpc` | `services/supabaseService.ts:659` | `20250703000000_baseline_pre_tenant_schema.sql` | 6027 | `JSON` | `{ customers: [...], totalCount: number }` with search, points range, debt boolean, sort, and pagination. | **PASS** |
| `get_customer_stats` | `services/supabaseService.ts:814` | `20250703000000_baseline_pre_tenant_schema.sql` | 7062 | `JSON` | `{ total, vip, debt, totalSpent }` aggregated from `store.customers`. | **PASS** |
| `get_customer_report` | `services/supabaseService.ts:3942` | `20250703000000_baseline_pre_tenant_schema.sql` | 7005 | `JSON` | `{ summary, topCustomers, customerGrowth }` computed from `store.customers` and `store.orders`. | **PASS** |
| `get_customer_debt_ledger` | `services/supabaseService.ts:1533` | `20250703000000_baseline_pre_tenant_schema.sql` | 6990 | `JSON` | `{ customer_id, current_balance, total_entries, entries: [...] }` from `store.customer_payment_ledger`. | **PASS** |
| `adjust_customer_debt` | `services/supabaseService.ts:1447` | `20250703000000_baseline_pre_tenant_schema.sql` | 1611 | `JSONB` | Mutates `customers.debt`, appends ledger entry, returns canonical JSONB shape `{ ok, customer_id, adjustment_amount, new_customer_debt, ledger_balance_after, reason }`. | **PASS** |

**Traceability: 6 / 6 PASS**

---

## 7. Store Validation

| Check | Result | Evidence |
|---|---|---|
| `customers` added to `store` initializer | **PASS** | Line 57 of `tests/mocks/supabase.ts`. |
| `customer_payment_ledger` added to `store` initializer | **PASS** | Line 58 of `tests/mocks/supabase.ts`. |
| Additive only; no existing key altered | **PASS** | `resetMockData` iterates `Object.keys(store)` and resets every key to `[]`. Adding new keys does not change iteration order or behavior of existing keys. |
| No existing test or handler behavior changed | **PASS** | 395 tests pass; audit reports 0 stale mocks and 0 duplicates. |

**Store Validation: PASS**

---

## 8. Validation Results

| Gate | Command | Expected | Actual | Result |
|---|---|---|---|---|
| Canonical audit gate | `npx tsx scripts/audit-rpc-contracts.ts` | Exit 0; no stale mocks; no duplicates; coverage = 60.7% | Exit 0; "All mock RPC handlers are defined in the canonical migration chain"; "No duplicate mock RPC handlers"; Coverage 60.7% (111/183) | **PASS** |
| Type gate | `npx tsc --noEmit` | Exit 0 | Exit 0; no TypeScript errors | **PASS** |
| Test gate | `npx vitest run` | PASS; 395 tests | 69 files, 395 tests, all PASS | **PASS** |

**Validation: PASS**

---

## 9. Coverage

| Metric | Before | After | Delta |
|---|---|---|---|
| Covered RPCs | 105 / 183 | 111 / 183 | +6 |
| Coverage | 57.4% | 60.7% | +3.3 pp |

**Coverage: PASS**

---

## 10. Regression

| Check | Result | Evidence |
|---|---|---|
| All existing tests continue to pass | **PASS** | `npx vitest run` — 395 passed, 0 failed. |
| No existing mock handler modified or removed | **PASS** | Audit reports 0 stale mocks, 0 duplicates; `git diff` of the customer additions shows only insertions. |
| No production call-site, migration, schema, or generated type changed | **PASS** | No such files modified by CURRENT_TASK-017. |

**Regression: PASS**

---

## 11. Contract Impact

**None**

No production service call-site, migration, schema, generated type, or RPC contract was changed. The implementation only adds derived validation-layer mocks that mirror the canonical migration contract.

---

## 12. Governance

| Check | Result | Evidence |
|---|---|---|
| Additive only | **PASS** | Only new handler blocks and new store keys added. |
| No refactor / redesign | **PASS** | Existing dispatch pattern preserved; no Map/switch/registry introduced. |
| No new abstraction | **PASS** | No helpers beyond a local `unaccent` function and `buildCustomerRow` (local row builder consistent with prior domain mocks). |
| No dispatch pattern change | **PASS** | `if (name === '...')` chain unchanged. |
| Within CURRENT_TASK boundary | **PASS** | Domain H5 only; 6 RPCs; coverage target 60.7% met. |
| No `CURRENT_TASK-018` created | **PASS** | Confirmed; no CURRENT_TASK-018 file exists. |

**Governance: PASS**

---

## 13. Decision

**ACCEPTED WITH MINOR NOTES**

CURRENT_TASK-017 is accepted. The 6 Domain H5 — Customers RPC mock handlers are correctly implemented, traceable to the canonical migration chain, and raise coverage to 60.7% with zero regression and no contract impact.

---

## 14. Deliverables

- `CURRENT_TASK-017_ACCEPTANCE_RECORD.md` (this document)

---

## 15. Minor Notes

- The working tree contains unrelated uncommitted modifications to production and test files (e.g., `components/admin/SecuritySettingsPanel.tsx`, `pages/admin/*`, `services/admin/*`, `scripts/audit-rpc-contracts.ts`, several `tests/admin-dashboard/*` files). These modifications are not attributable to CURRENT_TASK-017 and do not affect the acceptance of this task. They should be reconciled through their own CURRENT_TASK/acceptance workflow or committed separately.
- The canonical audit gate reports **112 mock RPC handlers** while **111 code RPCs are covered**. The one additional mock handler is a pre-existing artifact outside the scope of CURRENT_TASK-017 and is still traced to the canonical migration chain (0 stale mocks).

---

## 16. Next Step

- **CURRENT_TASK-017 → Closed**
- Official coverage = **60.7%**
- Update **M3 milestone status**
- **Return to Program-Level Planning**
- **CURRENT_TASK-018 — NOT CREATED**

The decision to create CURRENT_TASK-018 rests with the Program Manager after evaluating the overall program state and Coverage Roadmap, not within this Acceptance Review.

---

## PROGRAM MANAGER ACCEPTANCE REVIEW — SUMMARY

```text
Architecture Compliance
PASS

Scope Compliance
PASS

Traceability
PASS

Store Validation
PASS

Validation
PASS

Coverage
PASS

Regression
PASS

Contract Impact
None

Governance
PASS

Decision
ACCEPTED WITH MINOR NOTES

Deliverables
- CURRENT_TASK-017_ACCEPTANCE_RECORD.md

Minor Notes
- Unrelated uncommitted working-tree changes exist but are outside CURRENT_TASK-017 scope.
- 112 mock handlers vs 111 covered RPCs is a pre-existing, non-blocking artifact.

Next Step
CURRENT_TASK-017 Closed

Coverage
60.7%

Milestone
M3 Updated

Return to
Program-Level Planning

CURRENT_TASK-018
NOT CREATED
```
