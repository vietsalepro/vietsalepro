## Context

VietSale Pro v7 is a React SPA with Vite, TypeScript, and Supabase. The current codebase is single-tenant: all authenticated users share the same business tables, and RLS policies are either public or grant full access to authenticated users. The multi-tenancy migration is defined in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, which splits the work into 18 phases and 36 sub-phases to stay within the 250K context limit per chat.

## Goals / Non-Goals

**Goals:**
- Introduce tenant-aware data isolation at the database level using RLS and `tenant_id` columns.
- Resolve tenant from subdomain at runtime without storing `tenant_id` in `localStorage`.
- Enforce role-based access control in both DB policies and UI.
- Provide subscription limits (Free/VIP) and system-admin capabilities.
- Add audit logging, rate limiting, and Edge Functions for secure cross-tenant operations.
- Migrate the codebase to TypeScript strict mode.
- Deploy to production with wildcard subdomain DNS and Storage RLS.

**Non-Goals:**
- Re-architecting the entire application away from Supabase.
- Building a full billing/payment system.
- Supporting real-time cross-tenant features.

## Decisions

- **Subdomain-based tenant resolution**: `lib/tenant.ts` parses `window.location.host`; `localhost` defaults to `main` for development. No `localStorage` caching of `tenant_id` to prevent cross-tenant leakage when switching subdomains.
- **Custom fetch wrapper**: `lib/supabase.ts` injects `x-tenant-id` header into every Supabase request. `current_tenant_id()` reads the header inside PostgreSQL.
- **Foundation-first schema**: Create `tenants`, `tenant_memberships`, `tenant_subscriptions`, `system_admins` before adding `tenant_id` to business tables.
- **Backfill single initial tenant**: Existing data is migrated into a `main` tenant with VIP limits to avoid breaking existing users.
- **RLS layering**: Phase 5 adds generic tenant isolation policies; Phase 10 replaces generic insert/update/delete policies on tables that need role-based restrictions because PostgreSQL combines policies with OR.
- **Edge Functions for sensitive operations**: `create-tenant`, `invite-member`, `reset-password` use `SUPABASE_SERVICE_ROLE_KEY` in a secure environment, never exposed to the frontend.
- **Shared storage bucket with tenant folder**: `tenant-assets` bucket stores files under `tenant_id/...` for scalability; physical isolation can be added later for VIP tenants if needed.
- **TypeScript strict phased fix**: Fix core services/types first, then pages, then components, to keep builds green incrementally.

## Risks / Trade-offs

- [High] Backfill and `NOT NULL` migrations on 32 tables can fail if orphan records exist. Mitigation: backup orphan records before deleting and add missing FKs after cleanup.
- [High] RLS policies on 32 tables × 4 operations generate a large migration; one mistake can block all queries. Mitigation: apply in small sub-phases (core, remaining, unique indexes) and test with a non-admin user after each batch.
- [High] `supabaseService.ts` is ~138K chars; injecting `tenant_id` into every CRUD function is error-prone. Mitigation: modify only mapper functions and standard CRUD helpers; keep business logic untouched.
- [Medium] `App.tsx` is ~60K chars and global data loading may break when tenant changes. Mitigation: add `tenantId` to dependency arrays and guard loads until tenant is resolved.
- [Medium] Subscription limit triggers use count-then-compare, which can race under concurrent inserts. Mitigation: acceptable for Free/VIP MVP; switch to advisory locks or serializable transactions if strict limits become required.
- [Medium] Rate limiting for login is hard because Supabase Auth client-side cannot be intercepted. Mitigation: implement custom `login` Edge Function if strict lockout is required; otherwise use frontend tracking + Cloudflare edge rate limiting.
- [Low] Wildcard SSL on Cloudflare Pages requires Universal SSL; custom edge rules may be needed for advanced routing. Mitigation: verify DNS resolution and SSL after deploy.

## Migration / Rollback

**Migration:**
1. Run Phases 0–2 in staging.
2. Run Phases 3.1–3.3 and 4.1–4.2 to add `tenant_id` and backfill.
3. Run Phases 5.1–5.3 for RLS foundation.
4. Run Phases 6.1–6.4 for frontend tenant context.
5. Run Phases 7–11 for limits, admin dashboard, Edge Functions, RBAC, and audit log.
6. Run Phases 12.1–12.3 for TypeScript strict.
7. Run Phases 13.1–13.3 for tests.
8. Run Phases 14–17 for cleanup, staging, deploy, and operations.

**Rollback:**
- Restore project folder from the timestamped backup.
- Restore database from the pre-migration dump.
- For partial rollback, drop added columns/policies/triggers in reverse order.

## Open Questions

- Which Cloudflare plan and email provider will be used for production?
- Will the custom `login` Edge Function be implemented, or is Cloudflare rate limiting sufficient?
- Should reporting data use separate views/RPCs with strict role policies, or rely on UI guards?
