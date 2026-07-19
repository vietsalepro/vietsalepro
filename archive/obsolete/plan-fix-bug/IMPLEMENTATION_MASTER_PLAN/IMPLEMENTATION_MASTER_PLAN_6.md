# IMPLEMENTATION_MASTER_PLAN_6.md

**Document 6 / 8 — Phase 3: Frontend Hardening**

**VietSale Pro v7 — Admin Dashboard Enterprise Stabilization**

| Field | Value |
| --- | --- |
| **Document Position** | 6 / 8 |
| **Document Type** | Execution |
| **Phase** | Phase 3 — Frontend Hardening |
| **Issues Covered** | MED-4, MED-5, MED-6, LOW-1 |
| **Estimated Effort** | 4–5 days |
| **Priority** | P1 |
| **Deployment Window** | Standard Deploy — Any time (frontend only, admin-only users affected) |

---

## Document Purpose

This document covers **Phase 3: Frontend Hardening**. It hardens the admin dashboard against unauthorized access by replacing client-side-only admin checks with a server-side RPC verification guard, eliminates race conditions and memory leaks from unmanaged async loaders, enforces input validation on sensitive admin forms using Zod, replaces unsafe `as any` casts with typed Supabase responses, and replaces empty catch blocks with proper error logging. All changes are frontend-only — no database migrations required.

---

## Scope

- Replace direct `system_admins` table query with `isSystemAdmin()` RPC call in `App.tsx` (MED-4)
- Create `<RequireSystemAdmin>` guard component (MED-4)
- Update `AdminLayout.tsx` with server-side role check (MED-4)
- Add `AbortController` / `cancelled` flags to all admin page `useEffect` loaders (MED-5)
- Add Zod schema validation to company info and bank account forms (MED-6)
- Replace `as any` casts with typed Supabase responses in services (MED-6)
- Replace empty catch blocks with proper error logging in `AuthContext.tsx` (LOW-1)

## Covered Phases

Phase 3 — Frontend Hardening

## Covered Issues

| Issue | Title | Severity |
| --- | --- | --- |
| MED-4 | Client-side admin checks rely only on RLS/local state | MEDIUM |
| MED-5 | Admin dashboard loaders lack cancellation/race protection | MEDIUM |
| MED-6 | Unsafe `as any` casts and missing validation on sensitive forms | MEDIUM |
| LOW-1 | Empty catch blocks hide auth errors | LOW |

## Dependencies

- **Doc 5 (Phase 2)** must be complete with PASS outcome
- Phase 1 (Docs 2–4) backend security grants must be hardened (MED-4 depends on CRIT-3 + HIGH-4 resolution; frontend guard is secondary to backend enforcement)
- Schema must be stable (no `import_history` crashes to interfere with testing)

## Prerequisites

- [ ] Doc 5 / 8 Transition Checklist complete (PASS)
- [ ] Phase 1 PASS confirmed (backend security hardened)
- [ ] `lib/permissions.ts` and `isSystemAdmin()` RPC function available and callable
- [ ] Zod installed in project (`npm list zod`)
- [ ] React DevTools available for testing unmounted component warnings

## Required Skills

- React TypeScript (hooks, context, AbortController pattern)
- Zod schema validation
- Supabase typed client responses (removing `as any`)
- React Router v6 route guards

## Required MCP

None — this is a pure frontend change. No Supabase DB or edge function access needed.

---

## Why These Issues Belong Together

All four issues share the same affected layer (frontend React components) and the same code patterns. MED-4, MED-5, and LOW-1 all touch `App.tsx`, `AuthContext.tsx`, and admin pages. MED-6 touches the same service files that feed the admin dashboard. Fixing them together avoids repeated re-deployment of the same components and ensures consistent patterns applied across the entire admin surface in a single pass.

---

## Required Files

| File | Action | Issue |
| --- | --- | --- |
| `components/admin/RequireSystemAdmin.tsx` | CREATE — new guard component | MED-4 |
| `App.tsx` (lines 194–224, 1338–1347) | UPDATE — replace direct `system_admins` query with `isSystemAdmin()` RPC; wrap admin routes in `<RequireSystemAdmin>` | MED-4 |
| `pages/admin/AdminLayout.tsx` (lines 71–89) | UPDATE — add system admin role check before rendering `<Outlet />` | MED-4 |
| `pages/admin/AdminDashboardInner.tsx` (lines 162–269, 370–393) | UPDATE — add `AbortController` / `cancelled` flag to all `useEffect` loaders | MED-5 |
| `pages/admin/Security.tsx` (lines 34–70, 36) | UPDATE — add `AbortController` / `cancelled` flag; replace `pageSize: 1000` with paginated `listAccounts` | MED-5 |
| `pages/admin/Billing.tsx` (lines 127–160, 215–294) | UPDATE — add Zod schema for company info and bank account forms | MED-6 |
| `services/admin/memberAdminService.ts` (line 232) | UPDATE — replace `as any[]` with typed response | MED-6 |
| `services/admin/complianceAdminService.ts` (lines 39–45, 85) | UPDATE — replace `as any` with typed response | MED-6 |
| `contexts/AuthContext.tsx` (lines 35, 48, 83, 89, 92, 107–109) | UPDATE — replace empty catch blocks with `console.error` / toast | LOW-1 |

---

## Required UI Changes

### 1. `<RequireSystemAdmin>` Guard Component (MED-4)

```typescript
// components/admin/RequireSystemAdmin.tsx
// - Calls isSystemAdmin() RPC on render
// - While loading: renders loading spinner
// - If admin: renders children
// - If not admin: redirects to /forbidden (or /403 page)
// - If RPC error: FAIL-CLOSED → redirects to /forbidden
```

### 2. Admin Route Wrapping in App.tsx (MED-4)

Replace the current direct `system_admins` table query pattern with `<RequireSystemAdmin>` wrapping admin routes:
```typescript
// BEFORE: direct system_admins table query in useEffect / auth context
// AFTER:
<Route path="/admin/*" element={<RequireSystemAdmin><AdminLayout /></RequireSystemAdmin>} />
```

### 3. AdminLayout Gated Render (MED-4)

```typescript
// AdminLayout.tsx
// Replace passive <Outlet /> with:
// - Check isSystemAdmin() result from context or route guard
// - Render <Outlet /> only if confirmed admin
// - Redirect to /forbidden if not admin
```

### 4. AbortController Pattern for All Admin useEffect Loaders (MED-5)

Apply this pattern to every `useEffect` that loads data in all admin pages:

```typescript
useEffect(() => {
  const controller = new AbortController();
  let cancelled = false;

  const loadData = async () => {
    try {
      const data = await fetchAdminData({ signal: controller.signal });
      if (!cancelled) {
        setData(data);
      }
    } catch (error) {
      if (!cancelled) {
        // handle error
      }
    }
  };

  loadData();

  return () => {
    cancelled = true;
    controller.abort();
  };
}, [dependencies]);
```

Apply to:
- `AdminDashboardInner.tsx` (all loaders at lines 162–269, 370–393)
- `Security.tsx` (lines 34–70)
- Any other admin pages with `useEffect` data loaders not covered by the above

### 5. Zod Schemas for Sensitive Forms (MED-6)

```typescript
// Billing.tsx — company info form
const companyInfoSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  // ... other fields per form
});

// Billing.tsx — bank account form
const bankAccountSchema = z.object({
  accountNumber: z.string().min(1, 'Account number is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  // ... other fields per form
});
```

### 6. Replace `as any` Casts (MED-6)

- `memberAdminService.ts` line 232: replace `as any[]` with proper Supabase typed response
- `complianceAdminService.ts` lines 39–45, 85: replace `as any` with typed response

Use Supabase's generated types where available; define local types where not.

### 7. Replace Empty Catch Blocks (LOW-1)

```typescript
// AuthContext.tsx — replace all occurrences of:
} catch (e) {
  // empty
}

// With:
} catch (error) {
  console.error('[AuthContext] Error:', error);
  // Optionally: toast.error('Authentication error. Please try again.');
}
```

---

## Implementation Order

```
Step 1:  CREATE <RequireSystemAdmin> GUARD COMPONENT
         ├── Create components/admin/RequireSystemAdmin.tsx
         ├── Implement: calls isSystemAdmin() RPC
         ├── Implement: fail-closed (redirect to /forbidden on error)
         └── Unit test: renders children for admin; redirects for non-admin

Step 2:  UPDATE App.tsx TO USE isSystemAdmin() RPC
         ├── Remove direct system_admins table query
         ├── Wrap admin routes in <RequireSystemAdmin>
         └── Verify: admin routes gated

Step 3:  UPDATE AdminLayout.tsx WITH ROLE CHECK
         ├── Add role check using isSystemAdmin() result
         └── Replace passive <Outlet /> with gated render

Step 4:  ADD AbortController TO AdminDashboardInner.tsx
         ├── Apply AbortController pattern to all useEffect loaders (lines 162–269, 370–393)
         └── Test: fast tab switching no longer produces stale data or setState warnings

Step 5:  ADD AbortController TO Security.tsx
         ├── Apply pattern to lines 34–70
         └── Test: no unmounted setState warnings

Step 6:  ADD AbortController TO REMAINING ADMIN PAGES
         ├── Audit all remaining admin pages for bare useEffect data loaders
         └── Apply pattern consistently

Step 7:  ADD ZOD VALIDATION TO Billing.tsx FORMS
         ├── Add companyInfoSchema
         ├── Add bankAccountSchema
         ├── Wire to form submit handlers (reject invalid data before RPC call)
         └── Test: invalid data shows validation error; valid data submits

Step 8:  REPLACE as any CASTS
         ├── memberAdminService.ts line 232: define typed response
         ├── complianceAdminService.ts lines 39–45, 85: define typed response
         └── Verify: grep -r "as any" services/admin/ returns 0 results

Step 9:  REPLACE EMPTY CATCH BLOCKS IN AuthContext.tsx
         ├── Replace each empty catch block with console.error + optional toast
         └── Verify: grep -n "catch" contexts/AuthContext.tsx — all blocks have logging

Step 10: RUN FULL FRONTEND SMOKE TEST
         ├── Non-admin user: attempt /admin/* via URL → must be redirected to /forbidden
         ├── Admin user: /admin/tenants, /admin/billing, /admin/security → all render
         ├── Fast tab switching (5x rapid) → no stale data, no console warnings
         ├── Company info form: submit with missing field → validation error shown
         ├── Bank account form: submit with invalid data → validation error shown
         ├── Trigger auth error → error appears in console
         └── All 36 smoke tests pass
```

---

## Validation Checklist

- [ ] `App.tsx` uses `isSystemAdmin()` RPC instead of direct `system_admins` query
- [ ] Non-admin user accessing `/admin/*` is redirected to /forbidden before admin content renders
- [ ] Admin dashboard loads correctly for system admin users
- [ ] Tab switching in admin dashboard does not produce stale data (race condition fixed)
- [ ] No "Can't perform a React state update on an unmounted component" warnings in console during admin navigation
- [ ] Company info form validates input before submission (Zod)
- [ ] Bank account form validates input before submission (Zod)
- [ ] `grep -r "as any" services/admin/` returns 0 results
- [ ] All auth errors appear in console (no silent failures)
- [ ] Auth errors surface via toast notification to user (where appropriate)
- [ ] `<RequireSystemAdmin>` is in the admin route tree (verify in App.tsx)

## Regression Checklist

- [ ] Non-admin users cannot access admin routes (direct URL manipulation blocked)
- [ ] Admin users retain all existing admin functionality
- [ ] All 36 smoke tests pass
- [ ] Build succeeds with 0 TypeScript errors
- [ ] No new TypeScript errors introduced
- [ ] Fast tab switching does not crash admin dashboard

---

## Rollback Plan

1. **Admin guard**: Revert `App.tsx` to use direct `system_admins` query if `isSystemAdmin()` RPC fails in production (git revert)
2. **AbortController**: Remove from individual pages if pattern proves incompatible with specific page behavior (git revert per file)
3. **Zod schemas**: Additive — can be removed without breaking forms functionality
4. **Error logging**: Additive — no functional impact if reverted
5. **Rollback trigger**: Admin dashboard inaccessible to legitimate admins → revert App.tsx immediately
6. **Rollback time estimate**: 5 minutes (Vercel deployment revert)

---

## Expected Outcome

- Admin dashboard routes protected by server-side RPC verification (fail-closed)
- No race conditions when switching admin tabs
- Admin forms validated before submission
- Auth errors visible in console and optionally surfaced via toast
- Clean TypeScript types (no `as any` in services/admin/)
- No "unmounted component" setState warnings

---

## PASS/FAIL Criteria

| Criterion | Threshold | Weight |
| --- | --- | --- |
| Admin guard uses RPC | `isSystemAdmin()` RPC called in App.tsx | MUST PASS |
| Non-admin blocked | 100% redirect to /forbidden | MUST PASS |
| No unmounted setState | 0 warnings in 5-minute manual test | MUST PASS |
| Zod validation active | Form rejects invalid data | MUST PASS |
| No as any casts | 0 in services/admin/ | MUST PASS |
| Error logging | All catch blocks log error | MUST PASS |
| Smoke tests | All 36 pass | MUST PASS |
| Build | 0 TypeScript errors | MUST PASS |

**Phase 3 Outcome: PASS ✅ / FAIL ❌**

---

## Phase 3 Regression Tests (from Global Testing Strategy)

- [ ] Non-admin accessing `/admin/tenants` → redirected to forbidden
- [ ] Admin accessing `/admin/tenants` → page renders
- [ ] Fast tab switching (overview → tenants → billing → security) → no stale data
- [ ] Company info form with valid data → submits successfully
- [ ] Company info form with missing required field → validation error shown
- [ ] Bank account form with valid data → submits successfully
- [ ] Auth error during session init → error logged to console
- [ ] MFA check failure → error surfaced (not silently swallowed)

---

## References to Previous Document

**Doc 5 / 8 — Phase 2: Schema & Data Stability** (`IMPLEMENTATION_MASTER_PLAN_5.md`)

Must be completed (PASS) before this document. Provides stable schema and confirmed import_history resolution that prevents unrelated crashes from interfering with frontend testing.

## References to Next Document

**Doc 7 / 8 — Phase 4: Reliability & Scalability** (`IMPLEMENTATION_MASTER_PLAN_7.md`)

Covers: MED-2, LOW-2, LOW-4
Execution: Cron consolidation, server-side pagination, staging workflow scripts.
**Prerequisite**: This document (Doc 6) must be complete with PASS outcome before Doc 7 begins.

---

## Transition Checklist

Before continuing to Doc 7 / 8, the AI must verify:

- [ ] **PASS** — Phase 3 Validation Checklist complete (all items checked)
- [ ] **Validation Complete** — Non-admin URL manipulation blocked; RPC guard active; no unmounted setState warnings; Zod validation working; 0 `as any` in services/admin/
- [ ] **Review Complete** — All changed files committed; `RequireSystemAdmin.tsx` created; grep checks passed
- [ ] **Regression Complete** — All 36 smoke tests pass; build passes with 0 TypeScript errors; admin users retain full functionality

*Doc 7 must not begin until all four items above are checked.*