# Admin Dashboard — Basejump Enterprise Migration Runbook

## Overview

This runbook tracks the migration of `pages/SystemAdminDashboard.tsx` from a single-file monolith to a Basejump-inspired enterprise admin dashboard.

- **Canonical migration chain**: `supabase/migrations/*.sql` (138 files, ascending lexicographic order) — single source of schema/RPC truth
- **Generated schema artifact**: `supabase/schema.sql` (SHA-256 `C3738BCBEAABA04D8FE7C86FEB1F89C19BD0E6B8F50E865F58CE235A24EC3689`)
- **Generated type artifact**: `supabase/generated/database.types.ts` (SHA-256 `6C8767DDE630FC0A8F33DF955EAC468BB84DEF6119545B581ADF06C23CD81C8A`)
- **Reconciled RPC contract**: `D-P3-01_Reconciled_RPC_Contract.md`
- **Deployment validation gate**: `D-034-01_Deployment_Validation_Gate_Definition.md`
- **Deployment validation evidence checklist**: `D-034-02_Deployment_Validation_Evidence_Checklist.md`
- **Deployment readiness evidence**: `D-035-01_Deployment_Readiness_Evidence.md`
- **Staging canonicalization report**: `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md`

## Build / Test Commands

Run these after every sub-phase to verify stability:

```bash
npm run lint      # TypeScript type check (tsc --noEmit)
npm run build     # Vite production build
npx vitest run    # Unit + integration tests
```

## Phase Overview

| Phase | Goal | Tasks | Basejump Reference |
|-------|------|-------|-------------------|
| 0 | Build stability & foundation components | 0.1–0.6 | None |
| 1 | Layout & routing | 1.1–1.7 | UI patterns (Section 3.9) |
| 2 | Service layer standardization | 2.1–2.5 | RPC service pattern |
| 3 | Account / team model & RLS | 3.1–3.7 | Account model, permission helpers, RLS policies |
| 4 | Billing & subscriptions | 4.1–4.5 | Billing provider abstraction |
| 5 | RBAC, invitations, audit logs, security | 5.1–5.4 | User tracking triggers, audit patterns |
| 6 | Testing & CI | 6.1–6.5 | pgtap test helpers |
| 7 | Enterprise advanced | 7.1–7.4 | Advanced patterns |

## Phase Details

### Phase 0 — Build Stability & Foundation

- Audit build config (`vercel.json`, `vite.config.ts`, `package.json`, `tsconfig.json`).
- Establish `npm run build` baseline and record any errors.
- Fix build / lint / TypeScript errors in config files.
- Create reusable foundation components in `components/`:
  - `ErrorBoundary.tsx`
  - `LoadingState.tsx`
  - `EmptyState.tsx`
  - `SkeletonCard.tsx`
- Update `memory-zone/AGENTS.md` with build / test commands and Admin Dashboard workflow.
- Create this runbook.
- **Verification**: `npm run lint` PASS, `npm run build` PASS.

### Phase 1 — Layout & Routing

- Split `pages/SystemAdminDashboard.tsx` into focused pages under `pages/admin/`.
  - **Close-out note (2026-07-18):** This split is planned but not yet complete. `pages/SystemAdminDashboard.tsx` still exists as a separate monolith alongside the new `pages/admin/*.tsx` pages.
- Introduce `/admin/*` route structure in `App.tsx`.
- Keep existing `AdminShell`, `AdminSidebar`, `AdminTabs` but make them composable.
- **Basejump reference**: UI patterns (`AccountSelector`, `UserAccountButton`, `DashboardHeader`) from Section 3.9.
- **Verification**: `npm run build` PASS, manual smoke test of admin routes.

### Phase 2 — Service Layer Standardization

- Define type-safe RPC contracts per admin domain.
- Move direct Supabase queries into dedicated service files.
- **Basejump reference**: RPC `SECURITY INVOKER` / `SECURITY DEFINER` service pattern.
- **Verification**: `npm run lint` PASS, `npm run build` PASS, smoke tests for new services.

### Phase 3 — Account / Team Model & RLS

- Standardize `public.tenants` and `public.tenant_memberships`.
- Add `has_tenant_role`, `get_tenants_for_user`, `is_tenant_owner` helpers.
- Apply RLS policies to tenant-scoped tables.
- Add auto-create personal tenant trigger on new user signup.
- **Basejump reference**: Account model + permission helpers + RLS policies.
- **Verification**: DB migration applied to staging, RLS smoke tests PASS.

### Phase 4 — Billing & Subscriptions

- Refactor `tenant_subscriptions` into subscription / customer model.
- Introduce `BillingProvider` interface with adapters for Stripe, bank transfer, Momo, VNPay.
- **Basejump reference**: Billing provider abstraction (`billingFunctionsWrapper`).
- **Verification**: `npm run build` PASS, billing smoke tests PASS.

### Phase 5 — RBAC, Invitations, Audit Logs, Security

- Implement role-based access control and invitation flow.
- Add audit logging and security hardening.
- **Basejump reference**: User tracking triggers + invitation patterns.
- **Verification**: `npm run build` PASS, security smoke tests PASS.

### Phase 6 — Testing & CI

- Add `supabase/tests/` with pgtap tests for core admin functions and RLS.
- Set up CI checks for build, lint, and tests.
- **Basejump reference**: `basejump-supabase_test_helpers`.
- **Verification**: `npx vitest run` PASS, pgtap tests PASS.

### Phase 7 — Enterprise Advanced

- Advanced enterprise features (optional after production launch).
- **Verification**: `npm run build` PASS, feature-specific tests PASS.

---

## Phase 5 — Long-term Hardening (ongoing)

### RPC Contract Compliance

- Canonical RPC contract: `D-P3-01_Reconciled_RPC_Contract.md` (reconciled from `supabase/migrations/`).
- Audit script: `scripts/audit-rpc-contracts.ts` (run via `npm run audit:rpc`); validates service-layer RPCs against `D-P3-01`.
- CI runs the audit after every build.
- When adding a new admin dashboard RPC, add it to the canonical migration chain under `supabase/migrations/`; `npm run audit:rpc` validates parity with `D-P3-01`.
- Reference artifact checksums: `D-035-01_Deployment_Readiness_Evidence.md` §6.1.
- Staging canonicalization evidence: `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md`.

### Explicit Function Grants

- Every migration that creates a public function must include:

  ```sql
  REVOKE ALL ON FUNCTION public.xxx(...) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.xxx(...) TO authenticated;
  GRANT EXECUTE ON FUNCTION public.xxx(...) TO service_role;
  ```

- Backfill migration: `supabase/migrations/20250711000001_phase_5_long_term_explicit_grants.sql`.
- Audit query: `scripts/audit-grants.sql`.
- `supabase/config.toml` must not set `auto_expose_new_tables = true`.

### Defensive Service Mapping

- Service layer never trusts backend shape blindly.
- Shared helpers: `utils/service.ts` (`normalizeRpcArray`, `normalizeRpcPaginated`, `normalizeRpcObject`).
- Applied to `services/tenantService.ts`, `services/systemAdminService.ts`, `services/auditService.ts`.

### Feature Flags

- Admin dashboard feature gates are stored in `tenants.settings->features`:
  - `adminGdprEnabled`
  - `adminAuditRealtimeEnabled`
  - `adminAdvancedAnalyticsEnabled`
  - `adminImpersonationEnabled`
  - `adminReadReplicaQueueEnabled`
- Hook: `hooks/useAdminFeatureFlags.ts`.
- Migration: `supabase/migrations/20250711000002_phase_5_long_term_admin_feature_flags.sql`.

### Health Check Endpoint

- Edge Function: `supabase/functions/admin-health-check/index.ts`.
- Exercises key RPCs with the service role and returns `{ ok, checkedAt, checks }`.
- Production URL: `https://rsialbfjswnrkzcxarnj.supabase.co/functions/v1/admin-health-check`
- Staging URL: `https://shbmzvfcenbybvyzclem.supabase.co/functions/v1/admin-health-check`
- Monitoring: configure Uptime Robot to ping the production endpoint every 5 minutes.
- Alert channel: email `vietsalepro86@gmail.com` (update in Uptime Robot dashboard).
- Alert when `ok: false`.

---

## Multi-Environment Deployment Workflow

Projects:

- **Staging**: `shbmzvfcenbybvyzclem`
- **Production**: `rsialbfjswnrkzcxarnj`

```
local dev → supabase migration up / test
    ↓
staging  → supabase db push --project-ref shbmzvfcenbybvyzclem
    ↓
production → supabase db push --project-ref rsialbfjswnrkzcxarnj (only after staging PASS)
```

Workflow steps:

1. Run local verification: `npm run lint`, `npm run build`, `npx vitest run`, `npm run audit:rpc`.
2. Apply migrations to staging via Supabase CLI/MCP.
3. Run pgtap smoke tests on staging (`npx supabase db test` or `execute_sql` health checks).
4. Call the `admin-health-check` edge function on staging and confirm `ok: true`.
5. Only after staging PASS, apply the same migrations to production.
6. Deploy/redeploy `admin-health-check` edge function on production if needed.
7. Re-run health-check on production and configure Uptime Robot to ping it every 5 minutes.

All promotion steps are governed by `D-034-01_Deployment_Validation_Gate_Definition.md` and recorded in `D-034-02_Deployment_Validation_Evidence_Checklist.md`. The canonical migration source is `supabase/migrations/*.sql`; reference artifact checksums are captured in `D-035-01_Deployment_Readiness_Evidence.md` §6.1; Staging canonicalization evidence is in `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md`.

### Production Deploy Checklist

- [ ] `npm run lint` PASS
- [ ] `npm run build` PASS
- [ ] `npx vitest run` PASS
- [ ] `npx supabase db test` PASS (pgtap)
- [ ] `npm run audit:rpc` PASS
- [ ] Smoke test on staging PASS
- [ ] Recent production backup available
- [ ] Deploy production only after staging tests PASS (timing decided by owner — see Component Ownership below).
- [ ] `D-034-01` deployment validation gate PASS
- [ ] `D-035-01` reference artifact checksums verified (`supabase/schema.sql`, `supabase/generated/database.types.ts`)
- [ ] `D-P6-03` Staging canonicalization evidence reviewed

---

## Component Ownership

| Component | Owner | Contact | Notes |
|-----------|-------|---------|-------|
| Admin Dashboard UI | VietSale Pro | vietsalepro86@gmail.com | React/Vite SPA under `pages/admin/`, `components/admin/` |
| RPC Functions | VietSale Pro | vietsalepro86@gmail.com | `supabase/migrations/` (canonical chain), `D-P3-01_Reconciled_RPC_Contract.md` |
| Edge Functions | VietSale Pro | vietsalepro86@gmail.com | `supabase/functions/` |
| Supabase Project | VietSale Pro | vietsalepro86@gmail.com | migrations, backups, monitoring |
| Feature Flags | VietSale Pro | vietsalepro86@gmail.com | `tenants.settings->features`, `useAdminFeatureFlags` |
| Audit & Compliance | VietSale Pro | vietsalepro86@gmail.com | `app_audit_log`, GDPR RPCs |

> Owner/contact managed by AI Agent. Update manually when team structure changes.

