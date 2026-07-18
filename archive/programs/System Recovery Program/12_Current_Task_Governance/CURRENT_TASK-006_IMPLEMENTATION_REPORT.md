# CURRENT_TASK-006 — Implementation Report (G1)

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 3 — RPC Contract Reconciliation  
**Task:** G1 — Subscription Canonical Contract Implementation  
**Date:** 2026-07-14  
**Decision:** APPROVE Option A — Extend Existing Canonical Function `update_tenant_subscription`

---

## 1. Executive Summary

Implemented the approved Option A for Gap G1:

- Added `max_storage_gb` to `public.tenant_subscriptions`.
- Evolved the canonical function `public.update_tenant_subscription` to accept, validate, persist, and return `p_max_storage_gb`.
- Regenerated `supabase/schema.sql` (canonical migration-chain concatenation) and `supabase/generated/database.types.ts` (Supabase CLI local generation).
- Removed the service-layer dependency on the non-canonical RPC `admin_update_subscription`; both `updateSubscriptionLimits` and `updateTenantSubscription` now call `update_tenant_subscription`.
- No new RPC was created. No G2–G6 work was performed.

---

## 2. Files Changed

| File | Change Type | Purpose |
|------|-------------|---------|
| `supabase/migrations/20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.sql` | New | Forward migration: schema + canonical function evolution. |
| `supabase/migrations/rollback/20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.reverse.sql` | New | Reverse migration restoring pre-G1 schema/function. |
| `supabase/schema.sql` | Regenerated | Concatenation of 138 canonical forward migrations. |
| `supabase/generated/database.types.ts` | Regenerated | CLI-generated TypeScript types from local DB. |
| `services/tenantService.ts` | Modified | `updateSubscriptionLimits` now calls `update_tenant_subscription`; both service functions forward `p_max_storage_gb`. |
| `docs/admin-dashboard/RPC_CONTRACTS.md` | Modified | Removed stale `admin_update_subscription` row and updated `update_tenant_subscription` signature in the contract table and auto-generated appendix. |

---

## 3. Schema Changes

### 3.1 Table `public.tenant_subscriptions`

Added:

```sql
ALTER TABLE public.tenant_subscriptions
  ADD COLUMN IF NOT EXISTS max_storage_gb integer NOT NULL DEFAULT 1;
```

- **Name:** `max_storage_gb`
- **Type:** `integer`
- **Nullable:** `NOT NULL`
- **Default:** `1`
- **Backward compatible:** existing rows receive `1`; inserts may omit the column.

### 3.2 Location in canonical schema artifact

- Migration block: `supabase/schema.sql` lines **36414–36512**
- Column definition: line **36421**

---

## 4. Function Changes

### 4.1 `public.update_tenant_subscription`

**New signature (canonical):**

```text
update_tenant_subscription(
  p_tenant_id UUID,
  p_plan TEXT DEFAULT NULL,
  p_max_users INTEGER DEFAULT NULL,
  p_max_products INTEGER DEFAULT NULL,
  p_max_orders_per_month INTEGER DEFAULT NULL,
  p_max_storage_gb INTEGER DEFAULT NULL,        -- NEW
  p_billing_status TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS public.tenant_subscriptions
```

**Behavior changes:**

- Drops the prior 7-parameter overload so the canonical contract remains a single function.
- Validates `p_max_storage_gb` via the same `> 0` guard as the other numeric limits.
- When a plan change occurs and no custom storage limit is supplied, falls back to the existing row value (default-plan JSON does not yet carry `max_storage_gb`, so the current value is preserved).
- Persists `max_storage_gb` in `UPDATE public.tenant_subscriptions`.
- Returns the full `public.tenant_subscriptions` row, now including `max_storage_gb`.

### 4.2 Location in canonical schema artifact

- Final definition: `supabase/schema.sql` lines **36429–36509**

### 4.3 Service-layer call sites

`services/tenantService.ts`:

- `updateSubscriptionLimits` — RPC changed from `admin_update_subscription` to `update_tenant_subscription`.
- `updateTenantSubscription` — now forwards `p_max_storage_gb: input.maxStorageGb ?? null`.

Both functions continue to use the same domain type `UpdateSubscriptionInput` and the same return mapper `mapSubscriptionFromDB`.

---

## 5. Generated Artifacts

| Artifact | Generation Method | Lines | SHA-256 |
|----------|-------------------|-------|---------|
| `supabase/schema.sql` | Python concatenation of all canonical forward migrations (138 total) | 36,814 | `C3738BCBEAABA04D8FE7C86FEB1F89C19BD0E6B8F50E865F58CE235A24EC3689` |
| `supabase/generated/database.types.ts` | `supabase gen types typescript --local --schema public` | 6,720 | `6C8767DDE630FC0A8F33DF955EAC468BB84DEF6119545B581ADF06C23CD81C8A` |

The generated types now expose:

- `tenant_subscriptions.Row.max_storage_gb: number`
- `tenant_subscriptions.Insert.max_storage_gb?: number`
- `tenant_subscriptions.Update.max_storage_gb?: number`
- `Functions.update_tenant_subscription.Args.p_max_storage_gb?: number`
- `Functions.update_tenant_subscription.Returns.max_storage_gb: number`

---

## 6. Validation Results

| Validation | Command | Result |
|------------|---------|--------|
| Migration applies cleanly | `supabase db reset` | PASS — all 138 migrations applied, including G1 migration. |
| TypeScript compilation | `npm run lint` (`tsc --noEmit`) | PASS — no type errors. |
| RPC contract audit | `npm run audit:rpc` | PASS — 127 code RPCs match 127 contract RPCs; `admin_update_subscription` no longer appears in code or contract. |
| Generated types consistency | Manual inspection of `database.types.ts` | PASS — `max_storage_gb` / `p_max_storage_gb` present and consistent with schema. |
| No G1 signature drift | Grep for `admin_update_subscription` in `services/` | PASS — no remaining references. |

### 6.1 Evidence: migration applied

```text
Applying migration 20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.sql...
```

### 6.2 Evidence: type check

```text
> tsc --noEmit
(exit code 0)
```

### 6.3 Evidence: RPC audit

```text
Contract RPCs : 127
Code RPCs     : 127
RPC contracts and service code are in sync.
```

---

## 7. Backward Compatibility Assessment

| Aspect | Assessment |
|--------|------------|
| Existing rows | `ALTER TABLE ... ADD COLUMN ... DEFAULT 1` populates all existing rows; no nulls. |
| Existing inserts | `tenant_subscriptions` inserts that omit `max_storage_gb` continue to work via default. |
| Existing callers of `update_tenant_subscription` | All parameters are `DEFAULT NULL`; old call sites that omit `p_max_storage_gb` continue to work. |
| Return shape | Return row now includes `max_storage_gb`; existing mappers already read `row.max_storage_gb`. |
| Service-layer consumers | `updateTenantSubscription` and `updateSubscriptionLimits` now use the same canonical RPC with the same input type. |
| Downstream function `create_tenant_with_admin` | Inserts subscription with explicit column list; new column uses default and is unaffected. |

---

## 8. Remaining Phase 3 Gaps

G1 is fully closed. The following gaps remain in Phase 3 and were intentionally not touched:

- **G2** — `get_member_with_email` vs `get_tenant_members_with_email` (naming drift)
- **G3** — `search_members_by_email` vs `search_tenant_members` (naming drift)
- **G4** — `get_storage_usage` (missing RPC / contract ambiguity)
- **G5** — `getUsageSummary` / `getTenantUsageSummary` wrapper duplication
- **G6** — Aliases / facade-barrel cleanup

---

## 9. Evidence

### 9.1 Migration file hash

```text
SHA-256: 258ACCC09C85716F29B7955312EF5593A9EE0A5B79F6BDEB1F85D41BF29ABAC3
supabase/migrations/20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.sql
```

### 9.2 Canonical function final definition

<ref_snippet file="C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/supabase/schema.sql" lines="36429-36509" />

### 9.3 Service-layer call sites

<ref_snippet file="C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/services/tenantService.ts" lines="477-525" />

### 9.4 Generated types excerpt

<ref_snippet file="C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/supabase/generated/database.types.ts" lines="6438-6472" />

---

## 10. Decision Conformance Statement

This implementation conforms to:

- `CURRENT_TASK-006_SUBSCRIPTION_CANONICAL_CONTRACT_DECISION.md` — Option A approved.
- `ARCHITECTURE_DECISION_VERIFICATION_G1.md` — Schema extension required and completed.
- `CURRENT_PHASE.md` — Strictly within Phase 3 scope, G1 only.
- `MIGRATION_NAMING_AND_ORDERING_STANDARD.md` — Forward migration timestamp ordering preserved; reverse file provided.

No new RPC was created, no G2–G6 work was performed, and no Phase 4 activity was started.
