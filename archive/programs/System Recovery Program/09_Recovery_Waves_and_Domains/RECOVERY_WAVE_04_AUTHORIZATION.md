# RECOVERY WAVE-04 AUTHORIZATION

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Wave:** Recovery Wave-04  
**Domains:** H7 — Imports, H8 — Disposals  
**Document Type:** Recovery Wave Authorization  
**Authorization Date:** 2026-07-16  
**Authority:** Program Recovery Authorization Review  
**Status:** PASS — Authorized to proceed  

---

## 1. Executive Summary

Recovery Wave-04 is authorized to implement mock handlers for the **12 remaining uncovered RPCs in Domains H7 — Imports and H8 — Disposals**, as identified by the Wave-03 independent verification.

This authorization is based **solely** on the verified measurements in `RECOVERY_WAVE_03_VERIFICATION_REPORT.md` and the cross-domain mapping validation in `PHASE4_RECOVERY_MAPPING_VALIDATION.md`. Previous implementation reports are not used as evidence.

All required authorization checks pass:

- Every authorized RPC exists in the canonical migration chain.
- Every authorized RPC has at least one production call site in `services/`, `lib/`, or `utils/`.
- Every authorized RPC is currently missing a mock handler.
- No RPC is duplicated in the authorized inventory.
- No unauthorized RPC is included.

This document does **not** implement any code, modify mocks, or change production files. It authorizes the next recovery wave to proceed.

---

## 2. Recovery Baseline

The authoritative baseline is taken directly from the Wave-03 Verification Report:

| Metric | Value | Source |
|---|---|---|
| Unique code RPCs | **184** | Direct, multi-line `.rpc(` aware scan of `services/`, `lib/`, `utils/` |
| Code RPCs (canonical audit script) | **183** | `npx tsx scripts/audit-rpc-contracts.ts` |
| Covered RPCs | **170** | Code RPCs with a matching mock handler |
| Missing RPCs | **14** | Code RPCs without a matching mock handler |
| Coverage | **92.4%** | `170 / 184` |
| Verification Status | **PASS WITH OBSERVATIONS** | `RECOVERY_WAVE_03_VERIFICATION_REPORT.md` §13 |

Wave-03 changed the baseline from:

| Metric | BEFORE Wave-03 | AFTER Wave-03 | Delta |
|---|---|---|---|
| Matched | 150 | 170 | **+20** |
| Missing | 34 | 14 | **-20** |
| Coverage | 81.5% | 92.4% | **+10.9 pp** |

The `+20` delta matches the authorized Wave-03 scope exactly (H4/H5/H6 = 7 + 6 + 7 RPCs). The remaining **14 missing RPCs** are grouped as H7 (8), H8 (4), and H9 (2).

<ref_snippet file="c:/PROJECT/vietsalepro/RECOVERY_WAVE_03_VERIFICATION_REPORT.md" lines="213-230" />

---

## 3. Verification Reference

### 3.1 Documents reviewed (required reading order)

1. `PHASE4_FORENSIC_INVESTIGATION_REPORT.md` — Root cause and Git evidence.
2. `GIT_FORENSIC_INVESTIGATION_REPORT.md` — Branch, stash, and dangling-commit evidence.
3. `PHASE4_INTEGRATION_AND_COVERAGE_INVENTORY.md` — Statistical inventory across all git sources and working tree.
4. `PROGRAM_RECOVERY_AUTHORIZATION.md` — Phase 4 recovery authorization framework.
5. `PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md` — Domain B mapping correction.
6. `PHASE4_RECOVERY_MAPPING_VALIDATION.md` — Cross-domain mapping validation.
7. `RECOVERY_WAVE_03_VERIFICATION_REPORT.md` — **Authoritative baseline for this authorization.**

### 3.2 Supporting architecture decisions

- `CURRENT_TASK-022_ARCHITECTURE_DECISION.md` — Domain H7: Imports (8 RPCs).
- `CURRENT_TASK-023_ARCHITECTURE_DECISION.md` — Domain H8: Disposals (3 RPCs; note: omits `complete_disposal`, which the Wave-03 baseline and mapping validation include).

### 3.3 Checks performed

| Check | Method | Result |
|---|---|---|
| RPC exists in canonical migration chain | Search `supabase/migrations/*.sql` for `CREATE [OR REPLACE] FUNCTION public.<rpc>` | ✅ All 12 found |
| RPC has production call site | Multi-line `.rpc(` aware search of `services/`, `lib/`, `utils/` | ✅ All 12 found in `services/supabaseService.ts` |
| RPC is currently uncovered | Search `tests/mocks/supabase.ts` for `if (name === '<rpc>')` / `else if (name === '<rpc>')` | ✅ None found (all 12 missing) |
| No duplication in authorized inventory | Compare authorized list against itself | ✅ 12 unique names |
| No unauthorized RPC included | Compare authorized list to Wave-03 missing list | ✅ Only H7/H8 RPCs; H9 excluded |

<ref_snippet file="c:/PROJECT/vietsalepro/RECOVERY_WAVE_03_VERIFICATION_REPORT.md" lines="91-98" />
<ref_snippet file="c:/PROJECT/vietsalepro/PHASE4_RECOVERY_MAPPING_VALIDATION.md" lines="185-211" />

---

## 4. Authorized Domains

### 4.1 H7 — Imports

**Authorized RPC count: 8**

All 8 Import RPCs are currently uncovered and are called by `services/supabaseService.ts`.

### 4.2 H8 — Disposals

**Authorized RPC count: 4**

All 4 Disposal RPCs are currently uncovered and are called by `services/supabaseService.ts`.

---

## 5. Authorized RPC Inventory

| # | Domain | RPC | Canonical Migration | Production Call Site | Currently Missing? |
|---|---|---|---|---|---|
| 1 | H7 | `delete_import_v2` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:5384` | `services/supabaseService.ts:1955` — `deleteImportReceipt` | ✅ Yes |
| 2 | H7 | `filter_import_receipts_rpc` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:6170` and `:6208` (two overloaded signatures) | `services/supabaseService.ts:1830` — `filterImportReceiptsPaginated` | ✅ Yes |
| 3 | H7 | `get_import_receipt_count_by_date` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:7570` | `services/supabaseService.ts:1690` — `getImportReceiptCountByDate` | ✅ Yes |
| 4 | H7 | `get_import_receipts_by_product_and_lot` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:7578` | `services/supabaseService.ts:1748` — `getImportReceiptsByProductAndLot` | ✅ Yes |
| 5 | H7 | `get_import_receipts_by_supplier_id` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:7618` | `services/supabaseService.ts:1739` — `getImportReceiptsBySupplierId` | ✅ Yes |
| 6 | H7 | `get_import_stats` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:7644` | `services/supabaseService.ts:1675` — `getImportStats` | ✅ Yes |
| 7 | H7 | `process_import_v2` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:10865` | `services/supabaseService.ts:1880` — `createImportReceipt` | ✅ Yes |
| 8 | H7 | `update_import_v2` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:12649` | `services/supabaseService.ts:1937` — `updateImportReceipt` | ✅ Yes |
| 9 | H8 | `complete_disposal` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:3463` | `services/supabaseService.ts:3520` — `completeDisposal` | ✅ Yes |
| 10 | H8 | `delete_disposal_with_restore` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:5355` | `services/supabaseService.ts:3587` — `deleteDisposal` | ✅ Yes |
| 11 | H8 | `filter_disposals_rpc` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:6093` | `services/supabaseService.ts:3437` — `filterDisposalsPaginated` | ✅ Yes |
| 12 | H8 | `get_disposal_auto_code` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:7347` | `services/supabaseService.ts:3454` — `createDisposal` | ✅ Yes |

**Total authorized RPCs: 12.**

Notes:

- `filter_import_receipts_rpc` has two overloaded canonical signatures; one handler block must be reachable by the service call pattern.
- `complete_disposal` is invoked with a multi-line `.rpc(` call (`.rpc(` is on a separate line from `supabase`), which is why the canonical audit script undercounts it.
- `complete_disposal` was not listed in `CURRENT_TASK-023_ARCHITECTURE_DECISION.md` or `CURRENT_TASK-023_PROGRAM_AUTHORIZATION.md`, but it is included in the Wave-03 missing list and in `PHASE4_RECOVERY_MAPPING_VALIDATION.md` as a required H8 RPC. The Wave-03 baseline is authoritative for this authorization.

<ref_file file="c:/PROJECT/vietsalepro/services/supabaseService.ts" />
<ref_file file="c:/PROJECT/vietsalepro/supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql" />

---

## 6. Scope Boundary

### 6.1 In scope for Recovery Wave-04

- Add mock handlers for exactly the **12 RPCs** listed above.
- Target file: `tests/mocks/supabase.ts`.
- Derive handler shapes, parameters, and return types exclusively from the canonical migration chain.
- Preserve the existing flat `if (name === '...')` / `else if (name === '...')` dispatch pattern.
- Changes must be **additive only**; no existing handler may be removed or altered in a way that changes current test behavior.
- Produce `RECOVERY_WAVE_04_IMPLEMENTATION_REPORT.md` and `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` as evidence.

### 6.2 Allowed changes only if required to maintain D-P4-02

- `scripts/audit-rpc-contracts.ts` may be adjusted to correctly count multi-line `.rpc(` calls, subject to architecture authority approval.

### 6.3 Out of scope (not authorized)

- H9 — Reports & Dashboard (`get_dashboard_summary`, `get_profit_report`).
- Reports, Dashboard, Domain F (Notifications), or any other domain.
- Any RPC not listed in the Authorized RPC Inventory.
- Production code changes (`services/`, `lib/`, `utils/`, UI, etc.).
- Database schema or migration changes.
- Generated types (`database.types.ts`).
- `package.json`, CI workflows, or infrastructure changes.
- Cleanup, refactoring, or duplicate removal (e.g., the pre-existing duplicate `get_tenant_members_with_email`).

---

## 7. Out-of-Scope Items

The following are explicitly **not authorized** for Recovery Wave-04 and belong to later waves:

| # | Item | Reason |
|---|---|---|
| 1 | H9 — Reports & Dashboard (`get_dashboard_summary`, `get_profit_report`) | Out of scope per Recovery Scope directive |
| 2 | Reports domain | Out of scope |
| 3 | Dashboard domain | Out of scope |
| 4 | Domain F — Notifications | Out of scope |
| 5 | Any additional RPC beyond the 12 listed | Scope lock |
| 6 | Cleanup work | Scope lock |
| 7 | Refactoring | Scope lock |
| 8 | Duplicate handler removal (e.g., `get_tenant_members_with_email`) | Scope lock; pre-existing, not introduced by Wave-03 |

---

## 8. Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | `filter_import_receipts_rpc` has two overloaded canonical signatures; a single handler must satisfy both call patterns. | Low | Derive handler from both signatures; architecture decision already notes this requirement. |
| 2 | `complete_disposal` is called via a multi-line `.rpc(` and was omitted from earlier `CURRENT_TASK-023` documents; implementers must ensure it is not skipped. | Medium | Include `complete_disposal` explicitly in the Wave-04 implementation and verification checklists. |
| 3 | H9 and other out-of-scope items could be accidentally included if scope lock is not enforced. | Medium | Verification gate must reject any change outside the 12 authorized RPCs. |
| 4 | The canonical audit script undercounts code RPCs by one (`complete_disposal`); relying on the script’s denominator could misstate coverage. | Medium | Use direct multi-line `.rpc(` measurement (184 denominator) for coverage verification. |
| 5 | Working tree remains uncommitted; all Phase 4 work is still in working-tree state only. | Low | Recovery Wave-04 implementation should be committed as part of the normal recovery program; this authorization does not alter git state. |
| 6 | Pre-existing duplicate `get_tenant_members_with_email` and orphan `update_tenant_status` remain unchanged. | Low | Explicitly out of scope; no Wave-04 action. |

---

## 9. Acceptance Criteria

### 9.1 Authorization acceptance (this document)

The authorization is **PASS** only if all of the following are true:

- Exactly **12 RPCs** are authorized.
- All 12 RPCs belong **only** to H7 and H8.
- All 12 RPCs are **currently missing** a mock handler.
- All 12 RPCs exist in the canonical migration chain and have at least one production call site.
- No extra RPC is included.
- The authorization is fully traceable to `RECOVERY_WAVE_03_VERIFICATION_REPORT.md`.

### 9.2 Wave-04 implementation acceptance

Recovery Wave-04 implementation is **PASS** only if all of the following are true:

- Mock handlers exist for all 12 authorized RPCs in `tests/mocks/supabase.ts`.
- No existing handler is removed or changed in behavior.
- No handler is added for an unauthorized RPC.
- `npx tsx scripts/audit-rpc-contracts.ts` exits 0 with 0 missing code RPCs from migrations.
- `npx tsc --noEmit` exits 0 with no TypeScript errors.
- `npx vitest run` passes with no regressions.
- Direct measurement shows **182 / 184** code RPCs covered (98.9%), with only the 2 H9 RPCs remaining uncovered.
- `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` is produced and independently confirms the above.

---

## 10. Exit Criteria

Recovery Wave-04 may be closed when:

1. The 12 authorized RPCs are implemented in `tests/mocks/supabase.ts`.
2. Independent verification confirms **182 / 184** direct coverage and only H9 remaining.
3. The three required gates (audit, type, test) pass with no regressions.
4. No production code, migrations, schema, generated types, package files, or CI are modified.
5. No unauthorized RPC is added.
6. The pre-existing duplicate `get_tenant_members_with_email` and any other cleanup remain untouched.
7. `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` is approved.

---

## 11. Final Authorization Decision

**Recovery Wave-04 is AUTHORIZED to proceed.**

| Field | Value |
|---|---|
| Authorized Domains | H7 — Imports, H8 — Disposals |
| Authorized RPCs | **12** (8 H7 + 4 H8) |
| Baseline Coverage | **170 / 184 (92.4%)** from `RECOVERY_WAVE_03_VERIFICATION_REPORT.md` |
| Expected Coverage After Wave-04 | **182 / 184 (98.9%)** |
| Remaining After Wave-04 | **2 RPCs** in H9 — Reports & Dashboard |
| Decision | **PASS / APPROVED** |
| Conditions | Scope lock enforced; additive changes only; derive from canonical migrations; preserve existing dispatch pattern |

This authorization is effective on **2026-07-16** and is limited to the scope described above.

---

*No source code, mock, migration, production file, generated type, package file, or CI workflow was modified to produce this authorization document.*
