# Repository Hygiene Decision Register

**Program:** Admin Dashboard System Remediation Program  
**Date:** 2026-07-21  
**Purpose:** Central register for repository hygiene decisions made during Wave-03 closeout.

---

## Registered Decisions

| # | Artifact | Decision | Status | Classification | Reason | Future Review Rule |
|---|----------|----------|--------|----------------|--------|--------------------|
| 1 | `services/admin/permissions.ts` | REMOVE | Completed | Dead Artifact | Legacy wrapper superseded by `lib/permissions.ts`. | N/A |
| 2 | `supabase/functions/admin-health-check` | KEEP | Verified | Production Infrastructure Artifact | Active external monitoring endpoint. | Always verify Production before cleanup. |
| 3 | `supabase/functions/deliver-webhook` | REMOVE | Completed | Dead Artifact | No repository callers; no production invocations; `webhook-delivery` is the hardened replacement and remains active. | N/A |

---

## Notes

- `admin-health-check` must never be classified as a Dead Artifact solely by repository search. It is actively called by an external monitoring service on production approximately every 5 minutes.
- `deliver-webhook` has been removed from production and the repository after verification. `webhook-delivery` remains the active replacement.
