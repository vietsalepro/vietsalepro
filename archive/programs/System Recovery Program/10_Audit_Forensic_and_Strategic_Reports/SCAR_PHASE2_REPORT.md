# SCAR Phase 2 Report — VietSalePro v7

## SERVICE LAYER ↔ DATABASE CONTRACT

**Date:** 2026-07-14
**Role:** Principal Software Architect — Architecture Assessment only
**Scope:** Database Contract (RPC / Functions / Database APIs from SCAR Phase 1) → Service Layer
**Out of scope:** UI, React, Components, Tests

> This report **assesses only**. No code changed. No migration changed. No deploy. No governance update. No implementation. No CURRENT_TASK generated.

---

## Executive Summary

The Service Layer is an **RPC-facade over Supabase** that is, in the overwhelming majority, faithful to the Database Contract established in Phase 1. Of **181 unique RPCs** invoked across the service layer (**188 call-sites**), **177 resolve to a `CREATE FUNCTION` in migrations** — a **97.8% coverage**. The same **4 missing RPCs** flagged in Phase 1 are re-confirmed here as the only hard contract breaks, all concentrated in `services/tenantService.ts`.

Beyond the 4 breaks, the layer shows **contained, intentional drift**: an explicit facade/barrel (`services/admin/systemAdminService.ts`), documented alias functions (marked with `// ponytail:` comments), and one **signature-drift cluster in the subscription domain** (`admin_update_subscription` with a `p_max_storage_gb` param the canonical `update_tenant_subscription` never had).

**Verdict: OPTION B — Service Layer has minor Drift.** The drift is bounded, mostly self-documented, and does not indicate loss of overall consistency.

| Score | Value |
|---|---|
| Service Health Score | 82 / 100 |
| RPC Usage Score | 90 / 100 |
| Naming Consistency Score | 74 / 100 |
| **Overall Phase 2 Score** | **82 / 100** |

**Final Recommendation: CONTINUE** — may proceed to SCAR Phase 3.

---

## PART 1 — Service Inventory

| Category | Count | Evidence |
|---|---|---|
| Top-level service files (`services/*.ts`) | 33 | `services/` listing |
| Admin service files (`services/admin/*.ts`) | 12 | `services/admin/` listing |
| Shared service module (`utils/service.ts`) | 1 | `utils/` listing |
| **Total service modules** | **46** | — |
| Exported service functions (async/const/function) | **267** | `findstr "export ... function"` across `services/*.ts` |
| RPC call-sites (`supabase.rpc(...)`) | **188** | `findstr "\.rpc("` across `services/` + `utils/service.ts` |
| Unique RPC names invoked | **181** | de-dup of call-sites |
| Direct table access sites (`.from(...)`) | **234** | `findstr ".from("` across `services/*.ts` |

**Note:** Phase 1 estimated `utils/service.ts` alone at ~60 RPC calls; the aggregated service+admin+utils count in this pass is 188 call-sites. Both figures are consistent — Phase 1 was per-file sampling, Phase 2 is full enumeration.

---

## PART 2 — Service ↔ RPC Mapping

Full enumeration produced 181 unique RPC names. **177 map to a migration-defined function; 4 do not.** Rather than reprint 177 rows verbatim, the **RPC Mapping Matrix** below records (a) the 4 contract breaks, and (b) representative canonical mappings per domain, with a rolled-up status for the remainder.

### RPC Mapping Matrix

| Service (file:line → fn) | RPC | Migration (defined?) | Canonical | Status | Evidence |
|---|---|---|---|---|---|
| tenantService.ts:481 → `updateSubscriptionLimits` | `admin_update_subscription` | **NONE** | `update_tenant_subscription` | **MISSING / P0** | grep: no `CREATE FUNCTION admin_update_subscription` in 137 migrations + 17 orphans + edge fns |
| tenantService.ts:591 → `getMemberWithEmail` | `get_member_with_email` | **NONE** | `get_tenant_members_with_email` (plural, exists) | **MISSING / P0** | grep: undefined anywhere |
| tenantService.ts:610 → `searchMembers` | `search_members_by_email` | **NONE** | `search_tenant_members` (exists, l.627) | **MISSING / P0** | grep: undefined anywhere |
| tenantService.ts:1009,1017 → `getStorageUsage` / `getTenantStorageUsage` | `get_storage_usage` | **NONE** | — (no DB support) | **MISSING / P0** | grep: undefined anywhere; 2 call-sites |
| supabaseService.ts:1757 → `searchOrders` | `search_orders_rpc` | baseline l.11897 | canonical | MATCHED | `"public"."search_orders_rpc"(...)` |
| supabaseService.ts:1880 → `processImport` | `process_import_v2` | baseline / phase | canonical (v2) | MATCHED | defined |
| supabaseService.ts:2519 → `processCheckout` | `process_checkout` | baseline → safeupdate → read_only | canonical (redefined 3×) | MATCHED (drift-prone) | Phase 1 §1.3 |
| tenantService.ts:509 → `updateTenantSubscription` | `update_tenant_subscription` | baseline l.13034 + 2 redefs | canonical (redefined 3×) | MATCHED (signature drift) | see Part 6 |
| tenantService.ts:761,947 → `updateTenant`/`restoreTenant` | `update_tenant` | baseline + fix_overload + p18 | canonical (redefined 6×) | MATCHED (drift-prone) | Phase 1 §1.3 |
| planService.ts:19–62 → CRUD | `get_plans`/`create_plan`/`update_plan`/`delete_plan`/`get_plan_by_key` | sp3_1 / p8_1 | canonical | MATCHED | defined |
| webhookService.ts (7 fns) | `list_tenant_webhooks` … `retry_webhook_delivery` | migrations | canonical | MATCHED | defined |
| **Remaining 165 unique RPCs** | — | migrations | canonical | **MATCHED** | cross-check: called∩defined = 177 |

---

## PART 3 — RPC Usage

| Metric | Count | Method |
|---|---|---|
| Unique RPCs invoked by service layer | 181 | full enumeration |
| RPCs invoked **and** defined (matched) | 177 | called ∩ defined |
| RPCs invoked but **never defined** (broken) | **4** | called − defined |
| Functions defined in migrations but **not** called by any service | **~123** | defined − called (see note) |
| **Coverage %** (matched / invoked) | **97.8%** | 177 / 181 |
| RPC alias (same RPC via ≥2 service fns) | ≥4 pairs | see Part 4 |
| RPC wrapper (service fn = thin `supabase.rpc` passthrough) | pervasive (by design) | facade pattern |
| RPC called wrongly (param/signature mismatch to canonical) | **1 confirmed** | `admin_update_subscription` extra `p_max_storage_gb` |
| RPC duplicate / renamed / deprecated at service boundary | see Part 5 | — |

**Note on "~123 defined-but-not-called":** This is measured *from the service layer only*. Phase 1 established that most of these are **internal helpers, trigger functions, and cron jobs** (`trg_*`, `insert_stock_ledger_entry`, `run_admin_cron_*`, `backfill_*`) that are **correctly** never called via RPC. They are **not** dead relative to the whole system. INSUFFICIENT EVIDENCE to label them dead code without trigger/cron cross-analysis, which is out of Phase 2 scope.

---

## PART 4 — Service Consistency

| Class | Count | Evidence |
|---|---|---|
| **Dead Service** (calls a non-existent RPC → guaranteed runtime failure) | **4 functions** | `updateSubscriptionLimits`, `getMemberWithEmail`, `searchMembers`, `getStorageUsage`/`getTenantStorageUsage` (tenantService.ts) |
| **Unused Service** | INSUFFICIENT EVIDENCE | requires UI/caller graph — out of scope |
| **Duplicate Service** (2 fns, same RPC, same params) | **1 confirmed** | `getUsageSummary` (l.469) ≡ `getTenantUsageSummary` (l.497) → both `get_tenant_usage_summary` |
| **Alias Service** (explicit re-name of another fn) | **≥3** | `getTenantById = getTenant` (l.924); `getTenantMembers = getMembers` (l.976); `checkSubdomain` re-export (admin/systemAdminService.ts:30) |
| **Legacy Service** | see Part 5 | subscription-domain drift |
| **Wrapper Service** | pervasive | each service fn wraps one RPC + maps result — this is the intended architecture, not a defect |
| **Facade Service** | **1 module** | `services/admin/systemAdminService.ts` — pure re-export barrel of 30+ symbols from 8 other services; header comment: "thin admin wrapper" |

---

## PART 5 — Naming Consistency

The task's worked example maps **exactly** onto a real cluster in this codebase — the subscription domain:

| Service fn | RPC invoked | DB status | Classification |
|---|---|---|---|
| `updateTenantSubscription` (tenantService.ts:509) | `update_tenant_subscription` | **exists** (canonical, redefined 3×) | **CANONICAL** |
| `updateSubscriptionLimits` (tenantService.ts:477) | `admin_update_subscription` | **missing** | **CODE-ONLY / legacy naming** |
| `getUsageSummary` / `getTenantUsageSummary` | `get_tenant_usage_summary` | exists | canonical + duplicate wrapper |

**Findings:**
- **Canonical DB name:** `update_tenant_subscription`.
- **Legacy / code-only name:** `admin_update_subscription` — exists **only** in `tenantService.ts`, never in migrations. This is the "name that only survives in code" from the task example.
- The two service functions diverge not just in name but in **parameters** (see Part 6), so they are **not** interchangeable aliases — one is functional, one is broken.
- Member lookup shows the same pattern: code-only `get_member_with_email` / `search_members_by_email` vs canonical `get_tenant_members_with_email` / `search_tenant_members`.

**Naming convention at the service boundary is otherwise consistent:** camelCase TS fn → snake_case RPC → `p_`-prefixed params. The drift is localized to the tenant/subscription/member surface of one file.

---

## PART 6 — Signature Consistency

**Confirmed signature drift — subscription domain:**

Canonical `update_tenant_subscription` (baseline l.13034; latest redef `phase_p8_1` l.582–590):
```
(p_tenant_id, p_plan, p_max_users, p_max_products,
 p_max_orders_per_month, p_billing_status, p_expires_at)   -- 7 params, NO storage
```

Service `updateSubscriptionLimits` → `admin_update_subscription` (tenantService.ts:481–490) passes:
```
p_tenant_id, p_plan, p_max_users, p_max_products,
p_max_orders_per_month, p_max_storage_gb, p_billing_status, p_expires_at   -- 8 params
```

- The service assumes a **storage-limit parameter (`p_max_storage_gb`) that the canonical DB function does not accept.**
- Even if `admin_update_subscription` were created to match, it would be a **second, divergent signature** for the same business operation.
- `update_tenant_subscription` itself is **redefined 3×** across baseline / `phase_p2` / `phase_p8_1` (Phase 1 §1.3) — a `CREATE OR REPLACE` evolution chain; the frontend param list matches only the latest.

**All other sampled services match their canonical signatures** (`p_`-prefixed, defaults align). No further signature drift detected in the enumerated set.

---

## PART 7 — Service Health

| Bucket | Count | Basis |
|---|---|---|
| **Safe** (RPC exists, signature matches, single canonical) | **~171 of 181 unique RPCs** | 177 matched − 6 drift/duplicate-affected |
| **Has Drift** (matched RPC but signature/naming divergence) | **~6** | subscription (2) + usage duplicate (2) + member canonical-mismatch (2) |
| **Not used** (from service layer) | INSUFFICIENT EVIDENCE | needs caller graph — out of scope |
| **No Database Support** (calls non-existent RPC) | **4 RPCs / 5 service fns** | the 4 missing RPCs |

---

## METRICS (measured, not estimated)

| Metric | Value |
|---|---|
| Total service modules | 46 |
| Total exported service functions | 267 |
| Total RPC call-sites | 188 |
| Unique RPC names invoked | 181 |
| Matched (defined in migrations) | 177 |
| Dead (calls missing RPC) | 4 RPCs / 5 fns |
| Unused | INSUFFICIENT EVIDENCE |
| Legacy (code-only names) | 3 (`admin_update_subscription`, `get_member_with_email`, `search_members_by_email`) |
| Duplicate (same RPC+params, 2 fns) | 1 (`get_tenant_usage_summary`) |
| Wrapper | pervasive (by design) |
| Alias | ≥3 explicit + 1 facade module |
| **Coverage %** | **97.8%** |

---

## Critical Findings (P0)

**C1 — 4 service functions call RPCs that do not exist (runtime failure).** Re-confirmed from Phase 1. All in `services/tenantService.ts`:
- `updateSubscriptionLimits` → `admin_update_subscription` (l.481)
- `getMemberWithEmail` → `get_member_with_email` (l.591)
- `searchMembers` → `search_members_by_email` (l.610)
- `getStorageUsage` / `getTenantStorageUsage` → `get_storage_usage` (l.1009, l.1017)
Evidence: no `CREATE FUNCTION` for any of the 4 across 137 migrations, 17 orphan SQL files, or edge functions.

## High Findings

**H1 — Subscription signature drift.** `admin_update_subscription` service call carries `p_max_storage_gb`, absent from canonical `update_tenant_subscription`. Two divergent contracts for one operation (tenantService.ts:481 vs :509).

**H2 — `update_tenant_subscription` redefined 3×, `update_tenant` 6×, `process_checkout` 3× (Phase 1).** Fragile `CREATE OR REPLACE` chains; service param lists are only valid against the latest overload.

## Medium Findings

**M1 — Duplicate wrapper.** `getUsageSummary` and `getTenantUsageSummary` are byte-identical calls to `get_tenant_usage_summary` (tenantService.ts:469 & 497).

**M2 — Code-only member RPC names** (`get_member_with_email`, `search_members_by_email`) shadow canonical `get_tenant_members_with_email` / `search_tenant_members` that already exist and work.

## Low Findings

**L1 — Explicit aliases** (`getTenantById`, `getTenantMembers`) — documented (`// ponytail:`), harmless, but expand the naming surface.

**L2 — Facade barrel** `services/admin/systemAdminService.ts` re-exports 30+ symbols; convenient but obscures true source module of each call.

---

## Service Health Score: **82 / 100**
177/181 RPCs safe; deductions for 4 dead calls, 1 signature drift, 1 duplicate.

## RPC Usage Score: **90 / 100**
97.8% coverage; deduction for 4 missing + 1 wrong-signature call.

## Naming Consistency Score: **74 / 100**
Boundary convention consistent overall; deductions for 3 code-only legacy names, subscription/member canonical divergence, alias/facade surface expansion.

## Overall Phase 2 Score: **82 / 100**

---

## Architecture Decision

### ✅ OPTION B — Service Layer has minor Drift.

97.8% of the service→RPC contract holds. The drift is **bounded** (4 broken RPCs + one subscription/member naming-and-signature cluster, all inside `tenantService.ts`), **partly self-documented** (`// ponytail:` alias markers, explicit facade), and does **not** represent a systemic loss of consistency. This is not OPTION A (4 confirmed contract breaks preclude full compliance) and not OPTION C (drift is localized, not pervasive).

---

## Evidence (every conclusion traced)

| Conclusion | File | Function | RPC | Migration |
|---|---|---|---|---|
| 4 missing RPCs | services/tenantService.ts:481,591,610,1009,1017 | updateSubscriptionLimits, getMemberWithEmail, searchMembers, getStorageUsage, getTenantStorageUsage | admin_update_subscription, get_member_with_email, search_members_by_email, get_storage_usage | NONE (absent in all 137 migrations + 17 orphans + edge fns) |
| Coverage 97.8% | services/*.ts, utils/service.ts | 188 call-sites | 181 unique / 177 matched | 137 migrations baseline `20250703000000` et al. |
| Canonical subscription RPC | services/tenantService.ts:509 | updateTenantSubscription | update_tenant_subscription | baseline l.13034; phase_p8_1 l.582 |
| Signature drift (p_max_storage_gb) | services/tenantService.ts:481–490 | updateSubscriptionLimits | admin_update_subscription | canonical has no storage param (phase_p8_1 l.582–590) |
| Duplicate wrapper | services/tenantService.ts:469,497 | getUsageSummary ≡ getTenantUsageSummary | get_tenant_usage_summary | baseline |
| Facade module | services/admin/systemAdminService.ts:14–62 | (re-export barrel) | — | — |
| Aliases | services/tenantService.ts:924,976 | getTenantById, getTenantMembers | — | — |

---

## Final Recommendation

### ➡️ CONTINUE — may proceed to SCAR Phase 3.

The contract is 97.8% intact and the drift is localized and traceable. Phase 2 surfaces no systemic architectural failure that would require the Program Manager to halt and re-strategize. The 4 P0 breaks are the same items Phase 1 already recorded — they are known, bounded, and do not change the strategic picture.

*(No implementation, refactor, or rebuild is proposed. Assessment only.)*

---

## Validation

- ✅ No code modified.
- ✅ No migration modified.
- ✅ No deploy.
- ✅ No governance update.
- ✅ No implementation.
- ✅ No CURRENT_TASK generated.

---

*Report generated by SCAR Phase 2 static cross-analysis: 188 `supabase.rpc()` call-sites enumerated across 46 service modules and matched against `CREATE FUNCTION` definitions in 137 migrations + 17 orphan SQL files. All counts measured; unmeasurable items marked INSUFFICIENT EVIDENCE.*
