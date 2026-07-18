# RECOVERY WAVE-05 AUTHORIZATION

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Wave:** Recovery Wave-05  
**Domain:** H9 — Reports & Dashboard  
**Document Type:** Recovery Wave Authorization  
**Authorization Date:** 2026-07-16  
**Authority:** Program Recovery Authorization Review  
**Status:** PASS — Authorized to proceed  

---

## 1. Executive Summary

Recovery Wave-05 is authorized to implement mock handlers for the **2 remaining uncovered code RPCs in Domain H9 — Reports & Dashboard**: `get_dashboard_summary` and `get_profit_report`.

This authorization is based **exclusively** on the accepted Wave-04 baseline recorded in `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` and `RECOVERY_WAVE_04_ACCEPTANCE_REVIEW.md`. No historical CURRENT_TASK coverage numbers, Phase 4 acceptance records, or unverified cumulative arithmetic were used.

All mandatory authorization checks pass:

- Exactly **2** uncovered RPCs remain.
- Both RPCs belong **only** to Domain H9.
- Both exist in the canonical migration chain.
- Both have active production call sites.
- Neither is duplicated, already implemented, or outside H9.
- No unresolved mapping issue remains after the approved Errata.

If both authorized RPCs are implemented successfully and independently verified without regression, the expected verification target is **184 covered RPCs**. Final coverage shall be determined only by `RECOVERY_WAVE_05_VERIFICATION_REPORT.md`.

This document does not implement code, modify mocks, or change production files.

---

## 2. Accepted Recovery Baseline

The following baseline is accepted as the authoritative starting point for Wave-05. These values were independently verified in Wave-04 and are not recalculated here.

| Metric | Value | Source |
|---|---|---|
| Code RPCs | **184** | `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` §3 |
| Covered RPCs | **182** | `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` §3 |
| Remaining RPCs | **2** | `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` §3 |
| Coverage | **98.91%** | `182 / 184` |
| Wave-04 Status | **FORMALLY ACCEPTED** | `RECOVERY_WAVE_04_ACCEPTANCE_REVIEW.md` §1 |
| Recovery Program Status | **READY FOR RECOVERY WAVE-05** | `RECOVERY_WAVE_04_ACCEPTANCE_REVIEW.md` §1 |

The remaining 2 RPCs are the two Domain H9 functions listed below.

<ref_snippet file="c:/PROJECT/vietsalepro/RECOVERY_WAVE_04_VERIFICATION_REPORT.md" lines="511-520" />

---

## 3. Mapping Validation Reference

Domain H9 mapping was cross-checked against the governance priority chain:

| Source | `get_dashboard_summary` | `get_profit_report` | Verdict |
|---|---|---|---|
| Canonical Migration | ✅ `20250703000000_baseline_pre_tenant_schema.sql:7090` | ✅ `20250703000000_baseline_pre_tenant_schema.sql:8151` | Match |
| `PHASE4_COVERAGE_ROADMAP.md` §2 Domain H9 | ✅ Listed | ✅ Listed | Match |
| `CURRENT_TASK-024_ARCHITECTURE_DECISION.md` §3 | ✅ Authorized (2 RPCs) | ✅ Authorized (2 RPCs) | Match |
| `PHASE4_RECOVERY_MAPPING_VALIDATION.md` §3 | ✅ MATCH | ✅ MATCH | Match |

`PHASE4_RECOVERY_MAPPING_VALIDATION.md` §9 records the final decision:

> **RECOVERY MAPPING VALIDATED WITH ERRATA**
>
> H9 — Reports & Dashboard : MATCH
>
> MISMATCH unresolved: 0

The approved Errata (`PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md`) corrected Domain A/B mapping errors only. H9 is unaffected.

<ref_snippet file="c:/PROJECT/vietsalepro/PHASE4_RECOVERY_MAPPING_VALIDATION.md" lines="215-222" />
<ref_snippet file="c:/PROJECT/vietsalepro/PHASE4_RECOVERY_MAPPING_VALIDATION.md" lines="320-357" />

---

## 4. Mandatory Authorization Review

| # | Check | Evidence | Result |
|---|---|---|---|
| 1 | Remaining uncovered RPC inventory contains exactly 2 RPCs | `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` §3: Missing RPCs = 2 | ✅ PASS |
| 2 | Both RPCs belong to Domain H9 — Reports & Dashboard | `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` §8; `PHASE4_COVERAGE_ROADMAP.md` §2; `CURRENT_TASK-024_ARCHITECTURE_DECISION.md` §3 | ✅ PASS |
| 3 | No additional uncovered RPC has appeared | Wave-04 acceptance and verification show no new missing RPCs | ✅ PASS |
| 4 | No previously covered RPC has disappeared | Wave-04 regression comparison: matched RPCs increased from 170 to 182 only by the 12 authorized additions | ✅ PASS |
| 5 | No unresolved mapping issue exists after the approved Errata | `PHASE4_RECOVERY_MAPPING_VALIDATION.md` §9: MISMATCH unresolved = 0 | ✅ PASS |
| 6 | H9 mapping is consistent with Canonical Migration, Roadmap, CURRENT_TASK-024 Architecture, and Recovery Mapping Validation | See §3 above | ✅ PASS |

All checks pass. Wave-05 may be authorized.

---

## 5. Authorized Domain

### Domain H9 — Reports & Dashboard

**Authorized RPC count: 2**

This is the final business domain remaining in the Recovery Program. Both RPCs are cross-cutting aggregate reports called from `services/supabaseService.ts`.

---

## 6. Authorized RPC Inventory

| # | Domain | RPC | Canonical Migration | Production Call Site | Currently Missing? |
|---|---|---|---|---|---|
| 1 | H9 | `get_dashboard_summary` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:7090` | `services/supabaseService.ts:777` — `getDashboardSummary` | ✅ Yes |
| 2 | H9 | `get_profit_report` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:8151` | `services/supabaseService.ts:3827` — `getProfitReport` | ✅ Yes |

**Total authorized RPCs: 2.**

<ref_file file="c:/PROJECT/vietsalepro/services/supabaseService.ts" />
<ref_file file="c:/PROJECT/vietsalepro/supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql" />

---

## 7. Canonical Migration References

Both functions are defined in `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`.

### 7.1 `get_dashboard_summary`

```sql
CREATE OR REPLACE FUNCTION "public"."get_dashboard_summary"(
  "p_from" "date" DEFAULT NULL::"date",
  "p_to" "date" DEFAULT NULL::"date"
) RETURNS json
```

- **Migration file:** `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`
- **Line:** 7090

### 7.2 `get_profit_report`

```sql
CREATE OR REPLACE FUNCTION "public"."get_profit_report"(
  "p_start_date" "date",
  "p_end_date" "date",
  "p_status" "text" DEFAULT 'all'::"text",
  "p_payment_method" "text" DEFAULT ''::"text",
  "p_product_keyword" "text" DEFAULT ''::"text",
  "p_customer_keyword" "text" DEFAULT ''::"text",
  "p_compare_mode" "text" DEFAULT 'prev'::"text"
) RETURNS json
```

- **Migration file:** `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`
- **Line:** 8151

<ref_snippet file="c:/PROJECT/vietsalepro/supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql" lines="7090-7091" />
<ref_snippet file="c:/PROJECT/vietsalepro/supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql" lines="8151-8152" />

---

## 8. Production Call-Site References

Both RPCs are invoked from `services/supabaseService.ts`.

### 8.1 `get_dashboard_summary`

<ref_snippet file="c:/PROJECT/vietsalepro/services/supabaseService.ts" lines="776-780" />

- **Call site:** `services/supabaseService.ts:777`
- **Caller:** `getDashboardSummary(from?: string, to?: string)`
- **Argument mapping:**
  - `p_from` ← `from || null`
  - `p_to` ← `to || null`

### 8.2 `get_profit_report`

<ref_snippet file="c:/PROJECT/vietsalepro/services/supabaseService.ts" lines="3822-3835" />

- **Call site:** `services/supabaseService.ts:3827`
- **Caller:** `getProfitReport(startDate, endDate, filters?)`
- **Argument mapping:**
  - `p_start_date` ← `startDate`
  - `p_end_date` ← `endDate`
  - `p_status` ← `filters?.status || 'all'`
  - `p_payment_method` ← `filters?.paymentMethod || ''`
  - `p_product_keyword` ← `filters?.productKeyword || ''`
  - `p_customer_keyword` ← `filters?.customerKeyword || ''`
  - `p_compare_mode` ← `filters?.compareMode || 'prev'`

No other production call sites for these RPCs were found in `services/`, `lib/`, or `utils/`.

---

## 9. Scope Boundary

### 9.1 In scope for Recovery Wave-05

- Add mock handlers for exactly the **2 RPCs** listed in §6.
- Target file: `tests/mocks/supabase.ts`.
- Derive handler shapes, parameters, and return types exclusively from the canonical migration chain.
- Preserve the existing flat `if (name === '...')` / `else if (name === '...')` dispatch pattern.
- Changes must be additive only; no existing handler may be removed or altered in a way that changes current test behavior.
- Produce `RECOVERY_WAVE_05_IMPLEMENTATION_REPORT.md` and `RECOVERY_WAVE_05_VERIFICATION_REPORT.md` as evidence.

### 9.2 Out of scope (not authorized)

- Any domain other than H9.
- Any RPC other than `get_dashboard_summary` and `get_profit_report`.
- Production code changes (`services/`, `lib/`, `utils/`, UI components).
- Database schema or migration changes.
- Generated types (`database.types.ts`).
- `package.json`, CI workflows, or infrastructure changes.
- Cleanup, refactoring, duplicate removal, dead-handler cleanup, audit script improvements, helper refactoring, or store refactoring.

---

## 10. Explicit Out-of-Scope Items

| # | Item | Reason |
|---|---|---|
| 1 | Domain F — Notifications | Not H9 |
| 2 | Domain A, B, C, D, E, G, H1–H8 | Already covered or not part of Wave-05 |
| 3 | Any RPC other than `get_dashboard_summary` and `get_profit_report` | Scope lock |
| 4 | Notifications implementation | Out of scope |
| 5 | Cleanup of extra / dead edge-function handlers | Out of scope; pre-existing |
| 6 | Duplicate handler removal (e.g., `get_tenant_members_with_email`) | Out of scope; pre-existing |
| 7 | Dead-handler cleanup | Out of scope |
| 8 | Audit script improvements | Out of scope |
| 9 | Helper refactoring | Out of scope |
| 10 | Store refactoring | Out of scope |
| 11 | Technical debt remediation | Out of scope; reserved for future governance |
| 12 | Production code, migrations, schema, generated types, package.json, CI | Out of scope |

---

## 11. Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | `get_dashboard_summary` returns a large JSON aggregate; a naive mock may omit nested keys used by the call site. | Low | Derive the handler return shape from the canonical migration body and the `getDashboardSummary` return mapping at `services/supabaseService.ts:782-809`. |
| 2 | `get_profit_report` has multiple filter parameters and compare modes; an incomplete mock may not cover all call-site branches. | Low | Map all seven parameters from the `getProfitReport` call at `services/supabaseService.ts:3827-3834` and support both `prev` and `samePeriod` `p_compare_mode` values. |
| 3 | Scope creep could introduce out-of-scope RPCs or cleanup work. | Medium | Verification gate must reject any change outside the 2 authorized RPCs and `tests/mocks/supabase.ts`. |
| 4 | A regression could remove or alter existing handlers. | Low | Additive-only requirement; verification must confirm matched RPC count increases by exactly 2. |
| 5 | Working tree remains uncommitted; final recovery state depends on future commit actions. | Low | This authorization does not alter git state; commit remains a separate program decision. |

---

## 12. Acceptance Criteria

### 12.1 Authorization acceptance (this document)

The authorization is **PASS** only if all of the following are true:

- Exactly **2 RPCs** are authorized.
- Both belong **only** to Domain H9 — Reports & Dashboard.
- Both remain **uncovered** (no handler exists in `tests/mocks/supabase.ts`).
- Both exist in the **canonical migration chain**.
- Both have **active production call sites**.
- No unauthorized RPC is included.
- The authorization is fully traceable to the accepted Wave-04 baseline.

### 12.2 Wave-05 implementation acceptance

Recovery Wave-05 implementation is **PASS** only if all of the following are true:

- Mock handlers exist for both authorized RPCs in `tests/mocks/supabase.ts`.
- No existing handler is removed or changed in behavior.
- No handler is added for an unauthorized RPC.
- `npx tsx scripts/audit-rpc-contracts.ts` exits 0 with 0 missing code RPCs from migrations.
- `npx tsc --noEmit` exits 0 with no TypeScript errors.
- `npx vitest run` passes with no regressions.
- Direct measurement shows **184 / 184** code RPCs covered, with zero remaining uncovered.
- `RECOVERY_WAVE_05_VERIFICATION_REPORT.md` is produced and independently confirms the above.

Final coverage shall be determined only by `RECOVERY_WAVE_05_VERIFICATION_REPORT.md`.

---

## 13. Exit Criteria

Recovery Wave-05 may be closed when:

1. Both authorized RPCs are implemented in `tests/mocks/supabase.ts`.
2. Independent verification confirms **184 / 184** direct coverage and zero remaining missing RPCs.
3. The three required gates (audit, type, test) pass with no regressions.
4. No production code, migrations, schema, generated types, package files, or CI are modified.
5. No unauthorized RPC is added.
6. Pre-existing duplicates, dead handlers, and other technical debt remain untouched.
7. `RECOVERY_WAVE_05_VERIFICATION_REPORT.md` is approved.

---

## 14. Final Authorization Decision

**Recovery Wave-05 is AUTHORIZED to proceed.**

| Field | Value |
|---|---|
| Authorized Domain | H9 — Reports & Dashboard |
| Authorized RPCs | **2** (`get_dashboard_summary`, `get_profit_report`) |
| Baseline Coverage | **182 / 184 (98.91%)** from `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` |
| Expected Coverage After Wave-05 | **184 / 184 (100%)**, subject to independent verification |
| Remaining After Wave-05 | **0 RPCs**, if both authorized RPCs are successfully implemented and verified |
| Recovery Objective | Complete Recovery coverage |
| Final Coverage Determined By | `RECOVERY_WAVE_05_VERIFICATION_REPORT.md` |
| Decision | **PASS / APPROVED** |
| Conditions | Scope lock enforced; additive changes only; derive from canonical migrations; preserve existing dispatch pattern; no production or governance file changes |

This authorization is effective on **2026-07-16** and is limited to the scope described above.

---

*No source code, mock, migration, production file, generated type, package file, or CI workflow was modified to produce this authorization document.*
