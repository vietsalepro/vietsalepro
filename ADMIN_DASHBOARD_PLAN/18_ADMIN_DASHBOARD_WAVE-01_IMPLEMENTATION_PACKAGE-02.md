# 18_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION_PACKAGE-02

**Document ID:** 18_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION_PACKAGE-02  
**Date:** 2026-07-20  
**Project:** VietSalePro  
**Sub Project:** Admin Dashboard  
**Program:** Admin Dashboard System Remediation Program  
**Phase:** B — System Remediation  
**Wave:** Wave-01  
**Package:** Package-02  
**Issues:** ARCH-001, PERM-001  
**Acting Capacity:** Wave-01 Implementation Engineer  
**Baseline:** AD-Baseline-1.0  
**Repository Scope:** `C:\PROJECT\vietsalepro` @ commit `33d178d0` (current `master`)  
**Status:** Package-02 COMPLETE — Implementation Decision: PASS

------------------------------------------------------------------------

# 1. Initial Verification

| Verification Check | Method | Result |
|---|---|---|
| Package-01 complete | Review `17_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION.md` Section 12 | **COMPLETE** |
| Execution Contract unchanged | `16_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION_READINESS_REVIEW.md` Section 5 | **FROZEN** |
| Repository clean (within scope) | `git status` and `git diff -- App.tsx` before edit | **CLEAN for authorized scope** |
| Current implementation status consistent with roadmap | `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` Section 10 | **CONSISTENT** |

------------------------------------------------------------------------

# 2. Implementation Package Scope

This implementation executed **Package-02** — issues **ARCH-001** and **PERM-001** only.

| Scope Item | Status |
|---|---|
| ARCH-001 | **IMPLEMENTED** |
| PERM-001 | **IMPLEMENTED** |
| ARCH-002 | NOT STARTED |
| EXE-001 | NOT STARTED |

No other issue was implemented.

------------------------------------------------------------------------

# 3. Implementation Objectives

## 3.1 ARCH-001 — Remove direct `system_admins` authorization path from `App.tsx`

`App.tsx` previously queried the `system_admins` table directly:

``` tsx
const { data } = await supabase
  .from('system_admins')
  .select('user_id')
  .eq('user_id', user.id)
  .maybeSingle();
```

This direct query has been replaced by a single call to `isSystemAdmin()` from `lib/permissions.ts`, which invokes the `is_system_admin` RPC.

## 3.2 PERM-001 — Eliminate duplicate permission enforcement

`App.tsx` no longer contains independent authorization logic for system-admin checks. The only enforcement path is the `isSystemAdmin` state populated by `lib/permissions.ts`, guarded by `if (!isSystemAdmin) return <TenantForbiddenPage />` before rendering the `/admin` route tree.

`lib/permissions.ts` was already the single source of truth for the `is_system_admin` RPC and required no changes.

------------------------------------------------------------------------

# 4. Files Changed

| File | Change | Issue |
|---|---|---|
| `App.tsx` | Replaced direct `system_admins` table query with `isSystemAdmin()` from `lib/permissions.ts` | ARCH-001, PERM-001 |

`lib/permissions.ts` was inspected and confirmed to already expose `isSystemAdmin()` backed by the `is_system_admin` RPC; no modification was required.

------------------------------------------------------------------------

# 5. Repository Diff

``` diff
App.tsx | 7 +++----
1 file changed, 4 insertions(+), 3 deletions(-)

 import { supabase } from './lib/supabase';
+import { isSystemAdmin as checkSystemAdmin } from './lib/permissions';
 import { offlineCache, offlineQueue, isOnline, isNetworkError, CheckoutOp, generateOpId } from './utils/offlineManager';

@@ -209,12 +210,7 @@ function AppContent() {
     const check = async () => {
       setIsAdminLoading(true);
       try {
-        const { data } = await supabase
-          .from('system_admins')
-          .select('user_id')
-          .eq('user_id', user.id)
-          .maybeSingle();
-        if (!cancelled) setIsSystemAdmin(!!data);
+        if (!cancelled) setIsSystemAdmin(await checkSystemAdmin());
       } catch (e) {
         if (!cancelled) setIsSystemAdmin(false);
       } finally {
```

------------------------------------------------------------------------

# 6. Self Verification

| Check | Result | Notes |
|---|---|---|
| `App.tsx` no longer queries `system_admins` directly | **PASS** | `grep 'system_admins' App.tsx` returns no matches |
| `App.tsx` uses only `isSystemAdmin()` from `lib/permissions.ts` | **PASS** | Imported as `checkSystemAdmin` and awaited in the admin check effect |
| `lib/permissions.ts` uses `is_system_admin` RPC | **PASS** | `isSystemAdmin()` calls `supabase.rpc('is_system_admin')` |
| Only one enforcement path remains | **PASS** | Single `if (!isSystemAdmin) return <TenantForbiddenPage />` guard for `/admin` routes |
| Build passes | **PASS** | `npm run build` completed successfully |
| Relevant checks pass | **PASS WITH OBSERVATION** | `npm run lint` (`tsc --noEmit`) reports one pre-existing error in `archive/temporary/memory-zone/scripts/migrate_capitalize_product_names.ts` (missing `../../utils/stringHelper`), outside Wave-01 scope. `App.tsx` is type-clean. |

------------------------------------------------------------------------

# 7. Evidence Collection

## 7.1 Direct `system_admins` query removed from `App.tsx`

``` text
> grep -n "system_admins" App.tsx
(no output)
```

## 7.2 Only `isSystemAdmin()` / `is_system_admin` RPC used

`lib/permissions.ts`:

``` tsx
export async function isSystemAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_system_admin');
  if (error) {
    // ponytail: fail closed on permission check errors.
    return false;
  }
  return !!data;
}
```

`App.tsx` consumption:

``` text
> grep -n "isSystemAdmin\|checkSystemAdmin" App.tsx
59:import { isSystemAdmin as checkSystemAdmin } from './lib/permissions';
116:  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
213:        if (!cancelled) setIsSystemAdmin(await checkSystemAdmin());
1340:    if (!isSystemAdmin) return <TenantForbiddenPage />;
```

## 7.3 Single enforcement path in `App.tsx`

``` tsx
if (subdomain === 'admin' || isAdminPath) {
  if (!user) return <Login />;
  if (!isSystemAdmin) return <TenantForbiddenPage />;
  return (
    <ToastProvider>
      <Routes>
        <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
        ...
      </Routes>
    </ToastProvider>
  );
}
```

## 7.4 Build and lint results

- `npm run build` — completed successfully.
- `npm run lint` — only the pre-existing `archive/temporary/memory-zone/scripts/migrate_capitalize_product_names.ts` error remains; `App.tsx` is unaffected.

------------------------------------------------------------------------

# 8. Commit

One focused commit was prepared referencing ARCH-001 and PERM-001.

Commit message:

``` text
fix(ARCH-001, PERM-001): route App.tsx system-admin check through lib/permissions

Remove the direct system_admins table query in App.tsx and use
isSystemAdmin() from lib/permissions.ts, which calls the is_system_admin
RPC. This leaves a single enforcement path for the /admin route tree.

SSOT: 03_ADMIN_DASHBOARD_EXECUTION_MODEL.md (trust boundary)
```

The repository was not pushed.

------------------------------------------------------------------------

# 9. Program Status Synchronization

`00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` Section 10 updated to:

``` text
Implementation                           : ACTIVE
Wave-01 Progress                         : IN PROGRESS
  Package-01                             : COMPLETE
  Package-02                             : COMPLETE
  Package-03                             : NOT STARTED
Program Status                           : ACTIVE
(Updated by 18_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION_PACKAGE-02.md, 2026-07-20)
```

No other governance document was modified.

------------------------------------------------------------------------

# 10. Implementation Decision

**PASS**

ARCH-001 and PERM-001 are fully implemented within the frozen scope. `App.tsx` no longer queries `system_admins` directly; it delegates the system-admin authorization decision to `lib/permissions.ts` via the `is_system_admin` RPC. Only one enforcement path remains for the `/admin` route tree, the build succeeds, and the roadmap is synchronized. The only observed `npm run lint` failure is a pre-existing error in an archived temporary script outside the Wave-01 file scope.
