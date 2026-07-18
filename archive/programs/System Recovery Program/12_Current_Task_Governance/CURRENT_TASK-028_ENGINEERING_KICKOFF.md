# CURRENT_TASK-028 Engineering Kickoff

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Milestone:** M6 — Cross-Cutting Services  
**Domain:** F — Notifications  
**Wave:** 4d  
**CURRENT_TASK:** 028  
**Document Type:** Engineering Kickoff  
**Date:** 2026-07-16  
**Authoring Role:** Engineering Lead  
**Status:** READY  

**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `CURRENT_TASK-027_PROGRAM_STATUS_REVIEW.md`, `CURRENT_TASK-028_PROGRAM_AUTHORIZATION.md`, `CURRENT_TASK-028_ARCHITECTURE_DECISION.md`

---

## 1. Program Context

| Attribute | Value |
|---|---|
| Phase | Phase 4 — ACTIVE |
| Milestone | M6 — Cross-Cutting Services: **IN PROGRESS** |
| Previous Task | CURRENT_TASK-027 — **CLOSED** |
| Current Task | CURRENT_TASK-028 — Wave 4d: Domain F (Notifications) |
| Program Health | HEALTHY |
| Current Coverage | 177 / 183 (~96.7%) |
| Remaining Uncovered RPCs | 6 |

---

## 2. Engineering Readiness Checklist

### 2.1 Architecture Readiness

| Item | Status | Evidence |
|---|---|---|
| Architecture Decision exists and is **APPROVED** | PASS | `CURRENT_TASK-028_ARCHITECTURE_DECISION.md` §11: `APPROVED` |
| Architecture Decision authorizes mock coverage only | PASS | Document limits scope to additive mock handlers in `tests/mocks/supabase.ts` |
| No implementation was performed before kickoff | PASS | No source modifications exist for CURRENT_TASK-028; `git status` shows no pending changes |
| Constraints preserved | PASS | Additive only, no refactor, no redesign, no abstraction, no production/migration/schema/CI changes |

### 2.2 Canonical Source Completeness

| Item | Status | Evidence |
|---|---|---|
| Canonical migration file exists | PASS | `supabase/migrations/20250708000000_phase_p12_3_notification_log.sql` is present |
| All 3 RPCs defined in canonical source | PASS | `send_in_app_message` (line 111), `get_in_app_messages_for_tenant` (line 159), `mark_in_app_message_read` (line 222) |
| Canonical signatures captured | PASS | `CURRENT_TASK-028_ARCHITECTURE_DECISION.md` §4 reproduces the exact SQL signatures |
| Table `notification_logs` defined canonically | PASS | Migration §1 defines columns `id`, `tenant_id`, `channel`, `title`, `content`, `status`, `error_message`, `metadata`, `sent_by`, `created_at`, `updated_at` |

### 2.3 Target File Readiness

| Item | Status | Evidence |
|---|---|---|
| Target file exists | PASS | `tests/mocks/supabase.ts` exists and is the only authorized change target |
| Existing dispatch pattern confirmed | PASS | File uses the `if (name === "...")` chain inside the `rpc` function |
| Store object extensible | PASS | `store` is a `Record<string, Row[]>` with existing arrays (e.g. `gdpr_requests`, `terms_acceptance`, `gdpr_deletion_logs`) added in prior waves |
| Helper utilities available | PASS | `uuid()`, `currentUserId`, `currentTenantId`, `isSystemAdmin`, `setCurrentUserId`, `setCurrentTenantId`, `setSystemAdmin`, `addMockRow`, `getMockRows` are all present |

### 2.4 Mock Store Addition Readiness

| Item | Status | Evidence |
|---|---|---|
| Required new store array identified | PASS | `notification_logs: []` (no seed data required) |
| Column shape aligned with canonical table | PASS | `id`, `tenant_id`, `channel`, `title`, `content`, `status`, `error_message`, `metadata`, `sent_by`, `created_at`, `updated_at` |

### 2.5 Dispatch Pattern Readiness

| Item | Status | Evidence |
|---|---|---|
| Pattern to preserve | PASS | Existing `if (name === '...')` handlers in `tests/mocks/supabase.ts` |
| Handler insertion point | PASS | New handlers will be appended immediately before the final `return { data: null, error: { code: 'PGRST116', message: 'RPC not found' } };` fallback |
| No new abstraction introduced | PASS | Engineering approach matches prior waves (e.g. CURRENT_TASK-027) |

### 2.6 Permission Model Readiness

| Item | Status | Evidence |
|---|---|---|
| `send_in_app_message` admin-only guard | PASS | Canonical RLS policy `notification_logs_insert_admin` requires `public.is_system_admin()`; mock uses `isSystemAdmin` |
| `get_in_app_messages_for_tenant` tenant-scoped | PASS | Filter by resolved `tenant_id` and `channel = 'in_app'` only |
| `mark_in_app_message_read` tenant-scoped | PASS | Filter by `id`, resolved `tenant_id`, `channel = 'in_app'`, `status <> 'read'` |
| Error shape for permission denial | PASS | `{ code: '42501', message: 'Chỉ system admin mới được gửi tin nhắn in-app' }` |

### 2.7 Return Shape Readiness

| Item | Status | Evidence |
|---|---|---|
| `send_in_app_message` returns snake_case row | PASS | Architecture Decision §7.3 specifies row with snake_case keys; `services/notificationService.ts` `mapNotificationLogFromDB` maps to camelCase |
| `get_in_app_messages_for_tenant` returns snake_case row array | PASS | Same mapping path as above |
| `mark_in_app_message_read` returns raw boolean | PASS | Service layer coerces with `!!data` |

### 2.8 Error Handling Readiness

| Item | Status | Evidence |
|---|---|---|
| Permission denied code | PASS | `'42501'` used consistently across existing handlers |
| Not found code | PASS | `'PGRST116'` / `'Not found'` used consistently |
| Invalid input / constraint code | PASS | `'23514'` pattern available if needed; the 3 handlers do not require additional constraint errors |

### 2.9 Validation Plan Readiness

| Item | Status | Evidence |
|---|---|---|
| Canonical audit gate | PASS | `npx tsx scripts/audit-rpc-contracts.ts` expected exit `0` with "RPC contracts and service code are in sync." |
| Type gate | PASS | `npx tsc --noEmit` expected exit `0` |
| Test gate | PASS | `npx vitest run` expected exit `0` with no decrease in passing test count |
| Scope gate | PASS | Only `tests/mocks/supabase.ts` modified; exactly one store array and exactly 3 RPC handlers added |

---

## 3. Pre-Implementation Gate Results

| Gate | Command | Baseline Result |
|---|---|---|
| Canonical Audit | `npx tsx scripts/audit-rpc-contracts.ts` | **PASS** — exit 0, contracts in sync |
| Type Check | `npx tsc --noEmit` | **PASS** — exit 0, no TS errors |
| Test Gate | `npx vitest run` | Not run during kickoff; baseline from CURRENT_TASK-027 acceptance is PASS (68 files, 389 tests) |

---

## 4. Scope Lock

| Lock Item | State |
|---|---|
| Authorized RPCs | **3 only**: `send_in_app_message`, `get_in_app_messages_for_tenant`, `mark_in_app_message_read` |
| Authorized source file | `tests/mocks/supabase.ts` |
| Authorized store addition | `notification_logs` |
| Prohibited changes | production code, migrations, schema, generated types, package.json, CI, audit, tests outside target |
| Scope expansion | **Not allowed** without new Program Authorization |

---

## 5. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Mock over-approximates RLS for tenant-scoped reads | Low | Handlers filter by resolved `tenant_id` exactly as canonical functions do; no cross-tenant leakage in in-memory store. |
| Permission guard diverges from future RLS change | Low | Guard mirrors current canonical policy; any migration change requires a new CURRENT_TASK and Program Authorization. |
| Empty store yields zero-row test assertions | Low | Expected; tests must seed rows via `send_in_app_message` or `addMockRow`. |

**Overall Risk:** LOW

---

## 6. Blockers

```text
NONE
```

---

## 7. Engineering Kickoff Decision

```text
READY
```

CURRENT_TASK-028 is approved to proceed to **Engineering Implementation**. The canonical source, target file, store shape, dispatch pattern, permission model, return shapes, error handling, and validation gates are all confirmed and aligned.

---

## 8. Next Step

Engineering team may begin implementation of the 3 authorized mock handlers in `tests/mocks/supabase.ts`, following the constraints and conventions in `CURRENT_TASK-028_ARCHITECTURE_DECISION.md` §6–§7.

---

*No other deliverables (Implementation Report, Acceptance Review, Program Status Review, CURRENT_TASK-029) are authorized by this Engineering Kickoff.*
