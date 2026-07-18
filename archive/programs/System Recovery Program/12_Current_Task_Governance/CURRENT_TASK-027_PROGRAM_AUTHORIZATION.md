# CURRENT_TASK-027 Program Authorization

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Milestone:** M6 — Cross-Cutting Services  
**Document Type:** Program Authorization  
**Date:** 2026-07-15  
**Status:** **APPROVED**  
**Authorizing Role:** Program Manager  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `CURRENT_TASK-026_PROGRAM_STATUS_REVIEW.md`

---

## 1. Program State Confirmation

| Item | State |
|---|---|
| **Phase** | Phase 4 — ACTIVE |
| **Milestone** | M6 — Cross-Cutting Services: **IN PROGRESS** |
| **Previous Task** | CURRENT_TASK-026 — **CLOSED** |
| **Program Health** | HEALTHY |
| **Current Coverage** | **170 / 183 (~92.9%)** |
| **Remaining Uncovered RPCs** | **13** |

Verification:

- `CURRENT_TASK-026_PROGRAM_STATUS_REVIEW.md` records CURRENT_TASK-026 as **CLOSED**.
- `CURRENT_TASK-026_PROGRAM_STATUS_REVIEW.md` §8 records **PROGRAM STATUS: PASS**.
- `CURRENT_PHASE.md` §1 records Phase 4 as the active phase.
- Milestone M6 remains **IN PROGRESS** with 13 RPCs left to cover.

The program is eligible to open CURRENT_TASK-027.

---

## 2. Authorization Decision

| Item | Value |
|---|---|
| **CURRENT_TASK** | CURRENT_TASK-027 |
| **Authorized Wave** | **Wave 4c** |
| **Domain** | **C — Compliance & GDPR** |
| **Target File** | `tests/mocks/supabase.ts` |
| **Change Type** | Additive mock coverage only |
| **Implementation** | **NOT AUTHORIZED** by this document |
| **Architecture Decision** | **NOT AUTHORIZED** by this document |

This document authorizes **one** CURRENT_TASK and **one** wave only. No other work is approved.

---

## 3. Authorized RPCs

The following **7 RPCs** are the complete and exclusive scope of Wave 4c:

| # | RPC Name | Canonical Source Location | Calling Code Location |
|---|---|---|---|
| 1 | `create_gdpr_request` | `supabase/migrations/20260716000002_gdpr_export_functions.sql` line 95 | `services/admin/complianceAdminService.ts` line 93 |
| 2 | `get_gdpr_requests` | `supabase/migrations/20260716000002_gdpr_export_functions.sql` line 141 | `services/admin/complianceAdminService.ts` line 77 |
| 3 | `gdpr_export_user_data` | `supabase/migrations/20260716000002_gdpr_export_functions.sql` line 199 | `services/admin/complianceAdminService.ts` line 104 |
| 4 | `gdpr_delete_user_data` | `supabase/migrations/20260716000002_gdpr_export_functions.sql` line 311 | `services/admin/complianceAdminService.ts` line 113 |
| 5 | `export_tenant_data` | `supabase/migrations/20250709000000_phase_p17_3_data_export_terms.sql` line 175 | `services/complianceService.ts` line 68 |
| 6 | `get_terms_acceptances` | `supabase/migrations/20250709000000_phase_p17_3_data_export_terms.sql` line 119 | `services/complianceService.ts` line 53 |
| 7 | `record_terms_acceptance` | `supabase/migrations/20250709000000_phase_p17_3_data_export_terms.sql` line 58 | `services/complianceService.ts` line 39 |

These RPCs are the next cross-cutting service domain in Wave 4 after Domain E. They are confined to two service files (`services/admin/complianceAdminService.ts` and `services/complianceService.ts`) and have no downstream dependencies on other remaining domains.

---

## 4. Canonical Source

All authorized RPCs derive from the canonical migration chain:

```text
supabase/migrations/20250709000000_phase_p17_3_data_export_terms.sql
supabase/migrations/20260716000002_gdpr_export_functions.sql
```

Canonical signatures:

```sql
CREATE OR REPLACE FUNCTION public.create_gdpr_request(
  p_user_id UUID,
  p_type TEXT,
  p_reason TEXT DEFAULT NULL,
  p_dry_run BOOLEAN DEFAULT false
) RETURNS UUID
```

```sql
CREATE OR REPLACE FUNCTION public.get_gdpr_requests(
  p_status TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS JSON
```

```sql
CREATE OR REPLACE FUNCTION public.gdpr_export_user_data(
  p_user_id UUID
) RETURNS JSON
```

```sql
CREATE OR REPLACE FUNCTION public.gdpr_delete_user_data(
  p_user_id UUID,
  p_dry_run BOOLEAN DEFAULT true
) RETURNS JSON
```

```sql
CREATE OR REPLACE FUNCTION public.export_tenant_data(
  p_tenant_id UUID
) RETURNS JSON
```

```sql
CREATE OR REPLACE FUNCTION public.get_terms_acceptances(
  p_tenant_id UUID DEFAULT NULL,
  p_terms_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS JSON
```

```sql
CREATE OR REPLACE FUNCTION public.record_terms_acceptance(
  p_user_id UUID,
  p_tenant_id UUID DEFAULT NULL,
  p_terms_version TEXT DEFAULT '1.0',
  p_terms_type TEXT DEFAULT 'tos',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID
```

No RPC outside this list is authorized for CURRENT_TASK-027.

---

## 5. Constraints

The following constraints from Phase 4 and the Coverage Roadmap are confirmed for this authorization:

| Constraint | Required | Authorized |
|---|---|---|
| Additive only | Yes | Yes |
| No refactor | Yes | Yes |
| No redesign | Yes | Yes |
| No abstraction | Yes | Yes |
| Preserve `if (name === "...")` dispatch pattern | Yes | Yes |
| Preserve existing handler conventions | Yes | Yes |
| CURRENT_TASK boundary: 7 RPCs, 1 wave, 1 domain | Yes | Yes |
| No duplicate handler | Yes | Yes |
| No stale mock | Yes | Yes |
| No production code changes | Yes | Yes |
| No migration/schema/generated-type changes | Yes | Yes |
| No CI/workflow changes | Yes | Yes |

---

## 6. Coverage Impact

| Metric | Before CURRENT_TASK-027 | After CURRENT_TASK-027 |
|---|---|---|
| Covered RPCs | 170 / 183 | **177 / 183** |
| Uncovered RPCs | 13 | **6** |
| Coverage | ~92.9% | **~96.7%** |
| Delta | — | **+7 RPCs, +~3.8 percentage points** |

Calculation basis: total code RPCs remain 183. Wave 4c adds 7 covered RPCs. Remaining uncovered RPCs after this wave: 6.

Remaining coverage work after CURRENT_TASK-027:

| Wave | Domain | RPCs | Cumulative Coverage |
|---|---|---|---|
| Wave 4d | F — Notifications | 3 | 180 / 183 (~98.4%) |
| Wave 4e | G — Promotions | 3 | 183 / 183 (100.0%) |

---

## 7. Validation Plan

The following gates must remain green for CURRENT_TASK-027 acceptance. They are the same gates used for CURRENT_TASK-026:

### 7.1 Canonical Audit Gate

```text
npx tsx scripts/audit-rpc-contracts.ts
```

Expected:

```text
Exit 0

RPC contracts and service code are in sync.
```

### 7.2 Type Gate

```text
npx tsc --noEmit
```

Expected:

```text
PASS
```

### 7.3 Test Gate

```text
npx vitest run
```

Expected:

```text
PASS
```

No regression is permitted. Test file count and passing test count must not decrease.

---

## 8. Exclusions

This authorization explicitly does **NOT** authorize:

- `CURRENT_TASK-027_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-027_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-027_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-027_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-027_PROGRAM_STATUS_REVIEW.md`
- `CURRENT_TASK-028` or any subsequent CURRENT_TASK
- Any implementation, code change, or test modification prior to approved Engineering Kickoff
- Any production code, business logic, database, migration, schema, or generated-type changes

---

## 9. Program Manager Sign-Off

| | |
|---|---|
| **Authorized by** | Program Manager |
| **Date** | 2026-07-15 |
| **Decision** | **APPROVE CURRENT_TASK-027 — Wave 4c: Domain C Compliance & GDPR** |
| **Next Step** | Await Program Authorization approval before generating `CURRENT_TASK-027_ARCHITECTURE_DECISION.md` |

---

## 10. Conclusion

```text
AUTHORIZED
```

CURRENT_TASK-027 is authorized to proceed to Architecture Decision. Scope is locked to the 7 RPCs, 1 wave, and 1 domain listed above.

---

*Approved scope is locked. Any deviation from the 7 authorized RPCs requires a new Program Authorization.*
