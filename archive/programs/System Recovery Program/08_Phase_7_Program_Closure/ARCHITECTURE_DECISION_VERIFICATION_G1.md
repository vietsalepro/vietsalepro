# ARCHITECTURE DECISION VERIFICATION — G1

**Program:** VietSalePro v7 — System Recovery Program  
**Type:** Program Review — Architecture Decision Verification  
**Gap:** G1 — `admin_update_subscription` vs `update_tenant_subscription`  
**Date:** 2026-07-14  
**Decision Authority:** Program Manager, with required input from Architecture Authority  
**Verifier Role:** Principal Software Architect / Database Architect / PostgreSQL Architect / Technical Program Manager  
**Status:** Complete  

---

## 1. Executive Summary

This verification validates the canonical-schema assumption underlying **CURRENT_TASK-006 — Subscription Canonical Contract Decision (G1)**. The Program Manager has approved **Option A — Extend Existing Canonical Function `update_tenant_subscription`**. Before implementation is authorized, this review confirms whether the canonical schema already supports the `max_storage_gb` field that Option A implies.

**Verification Decision:** **B — Schema Extension Required**.

The canonical schema does **not** currently contain a `max_storage_gb` column on `public.tenant_subscriptions`. The canonical function `public.update_tenant_subscription` does not accept, read, or write `max_storage_gb`. Generated types derived from the canonical schema are consistent with this absence. The service layer, however, already assumes the field exists. Therefore the implementation work following Option A must include canonical schema evolution, not only a function signature change.

This document is a **Program Review**, not a `CURRENT_TASK` or implementation plan.

---

## 2. Verification Scope

Only the following items are verified:

1. **Canonical Schema:** Does `public.tenant_subscriptions` contain `max_storage_gb`? Data type, nullability, default, and constraints if present.
2. **Canonical Function:** Does `public.update_tenant_subscription` accept, read, or ignore `max_storage_gb`?
3. **Generated Types:** Does `supabase/generated/database.types.ts` expose `max_storage_gb`? Is it consistent with the schema?
4. **Service Layer:** Does `types/tenant.ts` / `services/tenantService.ts` assume `max_storage_gb` exists?
5. **Cross-Consistency:** Are schema, function, generated types, and service layer mutually consistent?

Out of scope: implementation, migration authoring, SQL generation, service refactoring, `CURRENT_TASK` creation, and advancement to any other phase or gate.

---

## 3. Schema Verification

**Source:** canonical schema artifact `supabase/schema.sql`.

The `public.tenant_subscriptions` table is defined in two equivalent locations in the canonical schema artifact:

- <ref_snippet file="C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/supabase/schema.sql" lines="133-144" />
- <ref_snippet file="C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/supabase/schema.sql" lines="11385-11396" />

**Current columns:**

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| tenant_id | uuid | NOT NULL | — |
| plan | text | NOT NULL | `'free'` |
| max_users | integer | NOT NULL | `1` |
| max_products | integer | NOT NULL | `50` |
| max_orders_per_month | integer | NOT NULL | `300` |
| current_month_orders | integer | NOT NULL | `0` |
| current_month_start | date | NOT NULL | `CURRENT_DATE` |
| billing_status | text | nullable | `'ok'` |
| expires_at | timestamp with time zone | nullable | — |
| updated_at | timestamp with time zone | nullable | `now()` |

**Result:** The column `max_storage_gb` is **absent** from `public.tenant_subscriptions`.

A full-text search of `supabase/schema.sql` for `max_storage_gb`, `maxStorageGb`, or `max_storage` returned **zero matches**, confirming that no canonical column, function parameter, or default-limit reference for storage exists in the current canonical schema artifact.

---

## 4. Canonical Function Verification

**Source:** canonical schema artifact `supabase/schema.sql`, final definition at lines 20824–20900.

The final canonical definition of `public.update_tenant_subscription` is:

<ref_snippet file="C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/supabase/schema.sql" lines="20824-20900" />

### 4.1 Signature

```text
update_tenant_subscription(
  p_tenant_id UUID,
  p_plan TEXT DEFAULT NULL,
  p_max_users INTEGER DEFAULT NULL,
  p_max_products INTEGER DEFAULT NULL,
  p_max_orders_per_month INTEGER DEFAULT NULL,
  p_billing_status TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS public.tenant_subscriptions
```

- Total parameters: **7**.
- Parameter `p_max_storage_gb`: **absent**.

### 4.2 Read Behavior

The function reads `v_sub` from `public.tenant_subscriptions` and computes `v_new_max_users`, `v_new_max_products`, `v_new_max_orders`. It does **not** reference any storage limit.

### 4.3 Write Behavior

The `UPDATE public.tenant_subscriptions` statement sets:

- `plan`
- `max_users`
- `max_products`
- `max_orders_per_month`
- `billing_status`
- `expires_at`
- `updated_at`

It does **not** set `max_storage_gb`.

**Result:** `public.update_tenant_subscription` neither reads nor writes `max_storage_gb`. Extending the function to accept `p_max_storage_gb` without first adding the column would produce a canonical contract that cannot be implemented against the current schema.

---

## 5. Generated Types Verification

**Source:** `supabase/generated/database.types.ts`.

### 5.1 Table Type

<ref_snippet file="C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/supabase/generated/database.types.ts" lines="3782-3833" />

The `tenant_subscriptions` `Row`, `Insert`, and `Update` shapes do **not** contain `max_storage_gb`. They are byte-consistent with the canonical schema columns listed in Section 3.

### 5.2 RPC Type

<ref_snippet file="C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/supabase/generated/database.types.ts" lines="6206-6238" />

The generated type for `update_tenant_subscription` has **7** arguments and a return object with the same 15 fields as the table row. No `p_max_storage_gb` argument and no `max_storage_gb` return field.

**Result:** Generated types are fully consistent with the canonical schema and function. They are not the source of the gap.

---

## 6. Cross-Consistency Analysis

| Layer | Contains `max_storage_gb` / `p_max_storage_gb` | Assessment |
|---|---|---|
| Canonical Schema (`public.tenant_subscriptions`) | No | Schema does not support storage limit. |
| Canonical Function (`update_tenant_subscription`) | No | Function cannot receive or persist storage limit. |
| Generated Types (`database.types.ts`) | No | Mirrors canonical schema exactly. |
| Domain Types (`types/tenant.ts`) | Yes — optional `maxStorageGb?: number` | Service/domain model assumes field exists. |
| Service Calls (`services/tenantService.ts`) | Yes — `updateSubscriptionLimits` forwards `p_max_storage_gb` | Service assumes RPC accepts storage parameter. |

### 6.1 Canonical Stack Internal Consistency

- Schema ↔ Generated Types: **Fully Consistent**.
- Schema ↔ Canonical Function: **Fully Consistent** (both omit storage).
- Generated Types ↔ Canonical Function: **Fully Consistent**.

### 6.2 Service-Layer Divergence

- `TenantSubscription.maxStorageGb?: number` <ref_snippet file="C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/types/tenant.ts" lines="125-144" />
- `UpdateSubscriptionInput.maxStorageGb?: number` <ref_snippet file="C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/types/tenant.ts" lines="164-172" />
- `mapSubscriptionFromDB` reads `row.max_storage_gb` <ref_snippet file="C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/services/tenantService.ts" lines="89-104" />
- `updateSubscriptionLimits` forwards `p_max_storage_gb: input.maxStorageGb` to the non-existent RPC `admin_update_subscription` <ref_snippet file="C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/services/tenantService.ts" lines="477-494" />
- `updateTenantSubscription` calls the canonical function but does **not** forward `maxStorageGb` <ref_snippet file="C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/services/tenantService.ts" lines="505-521" />

### 6.3 Overall Consistency Grade

**Partially Consistent**.

The canonical stack (schema + function + generated types) is internally coherent. The service layer is ahead of the canonical contract. There is no contradiction within the canonical sources themselves, but the canonical contract does not yet satisfy the service-layer assumption.

---

## 7. Verification Decision

The only permitted decision states are:

- **A — Schema Ready**
- **B — Schema Extension Required**
- **C — Evidence Inconsistent**

**Selected Decision: B — Schema Extension Required.**

**Reasoning:**

- `max_storage_gb` does **not** exist in `public.tenant_subscriptions`.
- `public.update_tenant_subscription` does **not** read or write `max_storage_gb`.
- `database.types.ts` correctly reflects the absence of the column.
- The service layer already assumes the field exists.
- Therefore, implementing Option A requires canonical schema evolution (`ALTER TABLE ... ADD COLUMN max_storage_gb`) in addition to canonical function evolution.

This is **not** Decision C because the canonical evidence is internally consistent; the gap is a missing schema field, not a contradiction between independent canonical sources.

---

## 8. Evidence References

| Evidence | Path | Relevant Lines / Finding |
|---|---|---|
| Master Plan | `SYSTEM_RECOVERY_MASTER_PLAN.md` | §2.1 Canonical source first; §4 Phase 3 scope |
| Active Phase | `CURRENT_PHASE.md` | Phase 3 — RPC Contract Reconciliation; §8 `CURRENT_TASK` rules |
| Phase 3 Acceptance | `PHASE3_ACCEPTANCE_REVIEW.md` | §5.1 Missing RPCs; §5.2 Signature Drift; EC-3 not satisfied |
| Decision Source | `CURRENT_TASK-006_SUBSCRIPTION_CANONICAL_CONTRACT_DECISION.md` | Option A approved; observation that `max_storage_gb` may need schema support |
| Canonical Schema | `supabase/schema.sql` | 133–144; 11385–11396 (`tenant_subscriptions` definition) |
| Canonical Function | `supabase/schema.sql` | 20824–20900 (`update_tenant_subscription` final definition) |
| Generated Table Types | `supabase/generated/database.types.ts` | 3782–3833 (`tenant_subscriptions` Row/Insert/Update) |
| Generated RPC Type | `supabase/generated/database.types.ts` | 6206–6238 (`update_tenant_subscription` Args/Returns) |
| Domain Types | `types/tenant.ts` | 125–144 (`TenantSubscription`); 164–172 (`UpdateSubscriptionInput`) |
| Service Mapping | `services/tenantService.ts` | 89–104 (`mapSubscriptionFromDB`) |
| Service Callers | `services/tenantService.ts` | 477–494 (`updateSubscriptionLimits`); 505–521 (`updateTenantSubscription`) |

---

## 9. Risk if Implementation Starts Without Schema Extension

If an implementation task extends only the function signature of `update_tenant_subscription` to accept `p_max_storage_gb` while leaving the canonical schema unchanged, the following failures are guaranteed:

1. **Runtime failure on update.** Any `UPDATE public.tenant_subscriptions SET max_storage_gb = ...` will raise `column "max_storage_gb" does not exist`.
2. **Runtime failure on service call.** `updateSubscriptionLimits` calls `admin_update_subscription`, which is still missing from the canonical migration chain.
3. **Silent data loss on read.** `mapSubscriptionFromDB` reads `row.max_storage_gb`, but canonical RPC results will never contain it, so `maxStorageGb` will always be `undefined` even after the field is conceptually supported.
4. **Phase 3 exit-criteria regression.** A partial function-only fix would leave the canonical schema and generated types out of sync with the service contract, violating the program’s canonical-source-first principle.

---

## 10. Recommendation to Program Manager

1. **Do not** authorize a function-only implementation task for Option A.
2. Authorize an implementation task whose scope explicitly includes:
   - Canonical schema evolution for `public.tenant_subscriptions.max_storage_gb` (type, nullability, default, constraint, and default-plan limit propagation if required).
   - Canonical function evolution for `public.update_tenant_subscription` to accept, validate, and persist `p_max_storage_gb`.
   - Regeneration of `supabase/generated/database.types.ts` from the canonical schema.
   - Service-layer cleanup to align `updateSubscriptionLimits` with the single canonical function (per Option A).
3. Require the implementation task to demonstrate end-to-end verification that the canonical schema, canonical function, generated types, and service layer all contain `max_storage_gb` before acceptance.

No `CURRENT_TASK`, migration, SQL, or service change has been produced by this verification.
