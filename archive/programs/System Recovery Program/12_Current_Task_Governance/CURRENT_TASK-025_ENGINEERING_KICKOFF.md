# CURRENT_TASK-025 — Engineering Kickoff

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 4a — Domain D — Integrations & Partners Mock Coverage  
**Document Type:** Engineering Readiness  
**Date:** 2026-07-15  
**Status:** Engineering Ready  

---

## Engineering Kickoff

This document confirms engineering readiness for CURRENT_TASK-025. It records architecture approval, scope, dependencies, canonical source, target files, engineering strategy, constraints, and validation gates. Implementation is **not** authorized by this document and requires separate approval after this kickoff is accepted.

---

## Objective

Add mock coverage for the **8** uncovered Domain D — Integrations & Partners RPCs in `tests/mocks/supabase.ts`, deriving each handler's return shape and parameter contract from the canonical migration chain. This task begins Milestone M6 — Cross-Cutting Services (Wave 4a) and targets raising mock coverage from **~83.1% (152/183)** to approximately **~87.4% (160/183)**.

---

## Current Program Status

| Item | Value |
|---|---|
| Active phase | Phase 4 — Derived Validation Layer Realignment |
| Current milestone | M5 — Commerce Complete: **COMPLETE**; M6 — Cross-Cutting Services: **IN PROGRESS** |
| Current wave | Wave 3i complete; Wave 4a ready |
| Current coverage | **~83.1% (152 / 183)** |
| Uncovered RPCs | **31** |
| Most recent accepted task | CURRENT_TASK-024 — Domain H9: Reports & Dashboard |
| Program health | HEALTHY — on track, no blockers |

Phase 4 exit criteria EC-3 (canonical audit gate alignment) and EC-4 (CI divergence gate) remain open as known residuals. EC-1 and EC-2 continue to progress with each coverage wave.

---

## Authorized Scope

### In Scope

- Add exactly **8** mock handlers to `tests/mocks/supabase.ts` for Domain D — Integrations & Partners.
- Derive each mock's return shape and parameter contract from the canonical migration chain.
- Preserve the existing `if (name === "...")` dispatch pattern.
- Extend the in-memory `store` with `partners` and `integrations` arrays only.
- Additive changes only; no refactor, redesign, or abstraction.

### Out of Scope

- Production code changes (`services/`, `lib/`, `utils/`, UI, components, pages).
- Migration, schema, or generated type modifications.
- Changes to `scripts/audit-rpc-contracts.ts`, CI workflows, or `package.json`.
- New governance artifacts, post-implementation artifacts, acceptance records, or CURRENT_TASK-026.
- Re-ordering, re-classifying, or expanding the Coverage Roadmap.

---

## Authorized RPCs

The following **8** RPCs are authorized for mock coverage. No additional RPCs may be added.

| # | RPC | Canonical Migration File | Canonical Line | RETURNS | Calling Code Location |
|---|---|---|---|---:|---|
| 1 | `create_integration` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 4315 | `json` | `services/integrationService.ts` line 105 |
| 2 | `create_partner` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 4480 | `json` | `services/integrationService.ts` line 47 |
| 3 | `delete_integration` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 5555 | `void` | `services/integrationService.ts` line 145 |
| 4 | `delete_partner` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 5705 | `void` | `services/integrationService.ts` line 86 |
| 5 | `list_integrations` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 9940 | `json` | `services/integrationService.ts` line 91 |
| 6 | `list_partners` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 9972 | `json` | `services/integrationService.ts` line 34 |
| 7 | `update_integration` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 12667 | `json` | `services/integrationService.ts` line 130 |
| 8 | `update_partner` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 12766 | `json` | `services/integrationService.ts` line 71 |

**Authorized RPC Count: 8 / 8**

### Canonical signatures

```sql
-- create_integration
CREATE OR REPLACE FUNCTION "public"."create_integration"(
  "p_partner_id" "uuid",
  "p_name" "text",
  "p_slug" "text" DEFAULT NULL::"text",
  "p_description" "text" DEFAULT NULL::"text",
  "p_category" "text" DEFAULT NULL::"text",
  "p_status" "text" DEFAULT 'active'::"text",
  "p_documentation_url" "text" DEFAULT NULL::"text"
) RETURNS json

-- create_partner
CREATE OR REPLACE FUNCTION "public"."create_partner"(
  "p_name" "text",
  "p_slug" "text" DEFAULT NULL::"text",
  "p_description" "text" DEFAULT NULL::"text",
  "p_website" "text" DEFAULT NULL::"text",
  "p_contact_email" "text" DEFAULT NULL::"text",
  "p_logo_url" "text" DEFAULT NULL::"text"
) RETURNS json

-- delete_integration
CREATE OR REPLACE FUNCTION "public"."delete_integration"(
  "p_integration_id" "uuid"
) RETURNS "void"

-- delete_partner
CREATE OR REPLACE FUNCTION "public"."delete_partner"(
  "p_partner_id" "uuid"
) RETURNS "void"

-- list_integrations
CREATE OR REPLACE FUNCTION "public"."list_integrations"() RETURNS json

-- list_partners
CREATE OR REPLACE FUNCTION "public"."list_partners"() RETURNS json

-- update_integration
CREATE OR REPLACE FUNCTION "public"."update_integration"(
  "p_integration_id" "uuid",
  "p_partner_id" "uuid" DEFAULT NULL::"uuid",
  "p_name" "text" DEFAULT NULL::"text",
  "p_slug" "text" DEFAULT NULL::"text",
  "p_description" "text" DEFAULT NULL::"text",
  "p_category" "text" DEFAULT NULL::"text",
  "p_status" "text" DEFAULT NULL::"text",
  "p_documentation_url" "text" DEFAULT NULL::"text"
) RETURNS json

-- update_partner
CREATE OR REPLACE FUNCTION "public"."update_partner"(
  "p_partner_id" "uuid",
  "p_name" "text" DEFAULT NULL::"text",
  "p_slug" "text" DEFAULT NULL::"text",
  "p_description" "text" DEFAULT NULL::"text",
  "p_website" "text" DEFAULT NULL::"text",
  "p_contact_email" "text" DEFAULT NULL::"text",
  "p_logo_url" "text" DEFAULT NULL::"text",
  "p_status" "text" DEFAULT NULL::"text"
) RETURNS json
```

### Service call sites

All 8 RPCs are invoked from `services/integrationService.ts`:

- `getPartners()` → `list_partners()` (line 34), expects `Partner[]` mapped from camelCase fields.
- `createPartner(input)` → `create_partner(...)` (line 47), returns a single `Partner`.
- `updatePartner(partnerId, input)` → `update_partner(...)` (line 71), returns a single `Partner`.
- `deletePartner(partnerId)` → `delete_partner(...)` (line 86), returns `void`.
- `getIntegrations()` → `list_integrations()` (line 91), expects `Integration[]` mapped from camelCase fields, including `partnerName`.
- `createIntegration(input)` → `create_integration(...)` (line 105), returns a single `Integration`.
- `updateIntegration(integrationId, input)` → `update_integration(...)` (line 130), returns a single `Integration`.
- `deleteIntegration(integrationId)` → `delete_integration(...)` (line 145), returns `void`.

`services/integrationService.ts` is a read-only call-site reference for this task and must not be modified.

---

## Dependency Verification

| Prerequisite | Status | Evidence |
|---|---|---|
| CURRENT_TASK-024 closed | Yes | `CURRENT_TASK-024_ACCEPTANCE_REVIEW_V2.md` accepted; `CURRENT_TASK-025_PROGRAM_AUTHORIZATION.md` §1 |
| Architecture Decision approved | Yes | `CURRENT_TASK-025_ARCHITECTURE_DECISION.md` Status: **APPROVED (Architecture)** |
| Program Authorization approved | Yes | `CURRENT_TASK-025_PROGRAM_AUTHORIZATION.md` Status: **APPROVED** |
| Canonical migration chain available | Yes | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` present and verified |
| Target file exists | Yes | `tests/mocks/supabase.ts` exists and contains the existing `if (name === "...")` dispatch chain |
| No technical blocker | Yes | Domain D has no downstream dependencies on remaining uncovered domains; all 8 RPCs are confined to `services/integrationService.ts` |
| Domain D can deploy independently | Yes | Wave 4a is explicitly scoped as independent cross-cutting service coverage in `PHASE4_COVERAGE_ROADMAP.md` |

---

## Canonical Source

| Artifact | Path | Classification | Authority |
|---|---|---|---|
| Forward migration chain | `supabase/migrations/*.sql` (top-level, non-recursive, excluding `rollback/`) | Canonical | `SYSTEM_RECOVERY_MASTER_PLAN.md` §2.1; `CURRENT_TASK-012`; `CURRENT_TASK-013` |

The canonical source for RPC names, parameter lists, and return shapes is the `CREATE [OR REPLACE] FUNCTION public.<name>` declaration for each authorized RPC in the forward migration chain. Engineering must not use derived documents, service call sites, or previous mock patterns as the contract authority.

### Handler return-shape requirements

Per the canonical migration and the approved Architecture Decision:

- `create_partner` / `update_partner` return a camelCase JSON object with keys: `id`, `name`, `slug`, `description`, `website`, `contactEmail`, `logoUrl`, `status`, `createdBy`, `createdAt`, `updatedAt`.
- `create_integration` / `update_integration` return a camelCase JSON object with keys: `id`, `partnerId`, `name`, `slug`, `description`, `category`, `status`, `documentationUrl`, `createdBy`, `createdAt`, `updatedAt`.
- `list_partners` returns a JSON array of camelCase partner objects ordered by `createdAt` descending.
- `list_integrations` returns a JSON array of camelCase integration objects with an additional `partnerName` from a left join to `partners`, ordered by `createdAt` descending.
- `delete_partner` and `delete_integration` return `void` (`{ data: null, error: null }` in the mock). Missing records on delete must return `PGRST116` / `Not found`.

---

## Engineering Approach

### Store Additions

Extend the `store` record in `tests/mocks/supabase.ts` with exactly:

```text
partners: []
integrations: []
```

No seed data is required; both arrays start empty after `resetMockData`.

### Handler Additions

Add one minimal `if (name === "...")` block per authorized RPC, placed adjacent to existing sibling handlers in the dispatch chain. Each handler must:

1. Mirror the canonical function signature (parameter names and optionality).
2. Guard with `if (!isSystemAdmin)` and return `{ data: null, error: { code: '42501', message: '<canonical message>' } }`.
3. Return `PGRST116` / `Not found` for missing records on update/delete.
4. Return camelCase JSON objects matching the canonical `json_build_object` output.
5. For `create_integration`, validate that `p_name` is non-empty and that `p_partner_id` (when provided) references an existing partner in `store.partners`.
6. For `create_partner`, validate that `p_name` is non-empty.
7. For `list_integrations`, join each integration with `store.partners` on `partner_id` to produce `partnerName`, ordered by `created_at DESC`.
8. For `list_partners`, return all partners ordered by `created_at DESC`.
9. For updates, apply `COALESCE` semantics: explicit non-null/non-empty parameters overwrite the existing row value.
10. Use `crypto.randomUUID()` for generated `id`, `new Date().toISOString()` for timestamps, and `currentUserId` for `created_by`.

The existing dispatch pattern in `tests/mocks/supabase.ts` must remain unchanged.

---

## Coverage Objective

| Metric | Before CURRENT_TASK-025 | After CURRENT_TASK-025 |
|---|---|---|
| Covered RPCs | 152 / 183 | **160 / 183** |
| Uncovered RPCs | 31 | **23** |
| Coverage | ~83.1% | **~87.4%** |
| Delta | — | **+8 RPCs, +~4.3 percentage points** |

---

## Validation Gates

The completed engineering work shall satisfy all of the following validation gates:

### Canonical Audit Gate

```text
npx tsx scripts/audit-rpc-contracts.ts
```

Expected:

```text
Exit 0

125 / 125 RPC contracts in sync

0 duplicate handler

0 stale mock
```

### Type Gate

```text
npx tsc --noEmit
```

Expected:

```text
PASS
```

### Test Gate

```text
npx vitest run
```

Expected:

```text
68 files

389 tests

PASS
```

No regression is permitted. Test file count and passing test count must not decrease.

---

## Constraints Confirmation

Engineering confirms the following constraints from the Program Authorization and Architecture Decision:

| Constraint | Confirmed |
|---|---|
| Additive only | Yes |
| No refactor | Yes |
| No redesign | Yes |
| No abstraction | Yes |
| Preserve `if (name === "...")` dispatch pattern | Yes |
| Preserve existing handler conventions | Yes |
| CURRENT_TASK boundary: 8 RPCs, 1 wave, 1 domain | Yes |
| No duplicate handler | Yes |
| No stale mock | Yes |
| No production code changes | Yes |
| No migration/schema/generated-type changes | Yes |
| No CI/workflow changes | Yes |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Store field naming mismatch with `mapPartnerFromDB` / `mapIntegrationFromDB` | Low | Medium | Derive store row fields directly from the canonical `RETURNING *` row shape; keep camelCase mapping in returned JSON only. |
| `partnerName` left-join semantics differ from canonical function | Low | Low | Match the canonical SQL: `LEFT JOIN public.partners p ON p.id = i.partner_id`, exposing `p.name AS partnerName`. |
| `delete_*` return shape mismatch (void vs null data) | Low | Low | Return `{ data: null, error: null }` consistent with existing void-returning RPC handlers. |
| Handler placement causing duplicate `if` block collisions | Very Low | Low | Insert new handlers in an unused location in the dispatch chain; verify with audit script. |

No unresolved blockers. Engineering readiness is confirmed.

---

## Engineering Lead Readiness Statement

Engineering confirms that:

- All required program documents have been read and understood.
- The 8 authorized RPCs, their canonical signatures, and their service-layer call sites are identified.
- The target file `tests/mocks/supabase.ts` exists and uses the required dispatch pattern.
- Dependencies are satisfied and no technical blockers remain.
- The implementation approach is additive, bounded to the 8 authorized RPCs, and preserves existing architecture.
- Validation gates and acceptance criteria are understood and achievable.

**Engineering is ready to proceed to CURRENT_TASK-025 Engineering Implementation upon approval of this kickoff.**

---

## Deliverable

This document authorizes preparation only. The sole deliverable of this step is:

```text
CURRENT_TASK-025_ENGINEERING_KICKOFF.md
```

---

## Next Step

Upon acceptance of this Engineering Kickoff, the Engineering Lead may begin **CURRENT_TASK-025 Engineering Implementation** under the approved Architecture Decision and Program Authorization.

---

*Basis: `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `CURRENT_TASK-025_PROGRAM_AUTHORIZATION.md`, `CURRENT_TASK-025_ARCHITECTURE_DECISION.md`, `services/integrationService.ts`, `tests/mocks/supabase.ts`, `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`.*
