# Admin Dashboard — Basejump Enterprise Migration Runbook

## Overview

This runbook tracks the migration of `pages/SystemAdminDashboard.tsx` from a single-file monolith to a Basejump-inspired enterprise admin dashboard.

- **Source plan**: `memory-zone/KE_HOACH/Admin_dashboard/PLAN_BASEJUMP_ADMIN_DASHBOARD_ENTERPRISE_UPGRADE.md`
- **Sub-phase breakdown**: `memory-zone/KE_HOACH/Admin_dashboard/SUB_PHASE_BREAKDOWN_BASEJUMP_ADMIN_DASHBOARD.md`
- **OpenSpec store**: `admin-dashboard` (validate with `openspec validate --changes --store admin-dashboard`)

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
