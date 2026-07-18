# CURRENT_TASK-017 — Implementation Report

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3b — Domain H5 — Customers Mock Coverage  
**Document Type:** Implementation Report  
**Date:** 2026-07-15  
**Status:** Engineering Complete — Ready for Independent Program Manager Acceptance Review  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `CURRENT_TASK-017_ARCHITECTURE_DECISION.md`, `CURRENT_TASK-017_ENGINEERING_KICKOFF.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_M3.md`, `CURRENT_TASK-016_ACCEPTANCE_RECORD.md`

---

## Implementation Summary

**PASS**

Engineering has implemented the 6 Domain H5 — Customers RPC mock handlers in `tests/mocks/supabase.ts` and added a minimal self-check test file. All canonical contract shapes are derived directly from `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`. No production code, migration, schema, generated types, audit script, CI configuration, `package.json`, or governance document was modified.

---

## Files Changed

| File | Change | Notes |
|---|---|---|
| `tests/mocks/supabase.ts` | Added `customers: []` and `customer_payment_ledger: []` to the `store` initializer; added 6 additive `if (name === '...')` handler blocks. | Domains H5 RPCs only. |
| `tests/mocks/customer-rpc-handlers.test.ts` | Added a minimal self-check exercising all 6 handlers end-to-end. | Optional per scope; aligns with ponytail runnable-check rule. |

---

## RPC Traceability

| # | RPC | Migration File | Migration Line | RETURNS | Mock Strategy |
|---|---|---|---|---|---|
| 1 | `search_customers_rpc` | `20250703000000_baseline_pre_tenant_schema.sql` | 11884 | `SETOF customers` | Case-insensitive substring search on `name`, `phone`, `code`; sort by `name` ASC; limit 500. |
| 2 | `filter_customers_rpc` | `20250703000000_baseline_pre_tenant_schema.sql` | 6027 | `JSON` | Search + points range + debt boolean + sort (`name`, `points`, `debt`, `spent`, `created_at`) + pagination. |
| 3 | `get_customer_stats` | `20250703000000_baseline_pre_tenant_schema.sql` | 7062 | `JSON` | Aggregate `{ total, vip, debt, totalSpent }`. |
| 4 | `get_customer_report` | `20250703000000_baseline_pre_tenant_schema.sql` | 7005 | `JSON` | Summary aggregates, top customers with order counts, daily new-customer growth in date range. |
| 5 | `get_customer_debt_ledger` | `20250703000000_baseline_pre_tenant_schema.sql` | 6990 | `JSON` | Filter ledger by `customer_id`; compute running balance; sort `created_at DESC, id DESC`; paginate. |
| 6 | `adjust_customer_debt` | `20250703000000_baseline_pre_tenant_schema.sql` | 1611 | `JSONB` | Mutate `customers.debt`; append ledger entry; return canonical JSONB shape. |

**Traceability: 6 / 6**

---

## Validation

| Gate | Command | Result | Evidence |
|---|---|---|---|
| Canonical audit gate | `npx tsx scripts/audit-rpc-contracts.ts` | **PASS** | Exit 0; no missing RPCs; no stale mocks; no duplicate handlers; coverage = **60.7%**. |
| Type gate | `npx tsc --noEmit` | **PASS** | Exit 0; no TypeScript errors. |
| Test gate | `npx vitest run` | **PASS** | 68 test files, 395 tests, 0 failures. |

---

## Coverage

```text
57.4% (105/183 covered)
       ↓
60.7% (111/183 covered)
```

**Delta:** +6 covered RPCs, +3.3 percentage points.

---

## Regression

**PASS**

All existing tests continue to pass. No existing mock handler was modified. The only store initializer additions are new keys (`customers`, `customer_payment_ledger`), which do not alter iteration or behavior over existing keys.

---

## Contract Impact

**None**

No production service call-site, migration, schema, generated type, or RPC contract was changed. The implementation only adds derived validation-layer mocks that mirror the canonical migration contract.

---

## Governance

**PASS**

- Scope remained strictly within `tests/mocks/supabase.ts` and optional `tests/**`.
- No production code, migration, schema, generated types, audit script, CI, or `package.json` changes.
- No new module, abstraction, Map, switch, registry, or factory dispatch was introduced.
- No `CURRENT_TASK-018` or acceptance review artifacts were created.

---

## IMPLEMENTATION SUMMARY

**Implementation:** PASS  
**Validation:** PASS  
**Coverage:** 57.4% → 60.7%  
**Files Changed:** `tests/mocks/supabase.ts`, `tests/mocks/customer-rpc-handlers.test.ts`  
**Traceability:** 6 / 6  
**Regression:** PASS  
**Contract Impact:** None  
**Governance:** PASS

**Decision:** READY FOR PROGRAM MANAGER ACCEPTANCE REVIEW
