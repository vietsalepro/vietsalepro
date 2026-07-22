# ADMIN_HEALTH_CHECK_GOVERNANCE_DECISION.md

**Decision ID:** ADM-HEALTH-CHECK-GOV-001
**Date:** 2026-07-21
**Program:** Admin Dashboard System Remediation Program
**Artifact:** `supabase/functions/admin-health-check`
**Decision Owner:** Enterprise Governance / Repository Hygiene Program

---

## Executive Summary

The `admin-health-check` Edge Function was flagged as a potential Dead Artifact during repository hygiene review because it has zero inbound callers in the React application and zero references in the application source tree. Supabase production verification has since refuted that assumption. The function is deployed and actively invoked by an external monitoring service. This decision record formalizes the KEEP decision and updates future governance rules for production-coupled artifacts.

---

## Artifact

- **Name:** `admin-health-check`
- **Path:** `supabase/functions/admin-health-check/`
- **Type:** Supabase Edge Function
- **Runtime:** Deno
- **Purpose:** External uptime / health monitoring endpoint

---

## Current Classification

Production Infrastructure Artifact

---

## Verification Evidence

### Supabase MCP

- `list_edge_functions` for project `rsialbfjswnrkzcxarnj` (production) returned `admin-health-check` as `ACTIVE`.
- `get_edge_function` for production confirmed the deployed source matches the repository file.
- `get_logs` for production `edge-function` service shows continuous `HEAD` requests.

### Production Logs

Most recent retrieved invocations:

- `2026-07-21T09:37:30.050000` — `HEAD | 200`
- `2026-07-21T09:32:23.784000` — `HEAD | 200`
- `2026-07-21T09:27:18.891000` — `HEAD | 200`
- `2026-07-21T09:22:10.435000` — `HEAD | 200`

Pattern: `HEAD` request approximately every 5 minutes with `200` responses.

### External Dependency

- Source comment: `// Called by Uptime Robot / Better Stack every few minutes.`
- `verify_jwt` is `false` to allow unauthenticated external monitoring calls.
- Public production URL is listed in runbooks:
  `https://rsialbfjswnrkzcxarnj.supabase.co/functions/v1/admin-health-check`
- Staging logs show no `admin-health-check` invocations, confirming production-specific external monitoring.

---

## Repository Findings

- `grep -r "admin-health-check"` in `services/`, `lib/`, `hooks/`, `pages/`, `components/`, `contexts/`, and `utils/` returned **0 matches**.
- `codebase-memory trace_path(admin-health-check, direction=inbound, depth=3)` returned:

```json
{
  "function": "admin-health-check",
  "callers": [],
  "callees": []
}
```

- `npm run build` passes independently of the function's deployment state.
- No database trigger, migration, or SQL file references `admin-health-check`.
- No cron or scheduler in the repository references `admin-health-check`.

---

## Production Findings

- **Production project ref:** `rsialbfjswnrkzcxarnj`
- **Production project name:** QLBH
- **Deployed version:** `3`
- **Status:** `ACTIVE`
- **Verify JWT:** `false`
- **Recent invocation cadence:** `HEAD` request approximately every 5 minutes
- **Response status:** `200`
- **Staging project ref:** `shbmzvfcenbybvyzclem`
- **Staging status:** `ACTIVE` but no invocations in the observed window

---

## Reason For KEEP Decision

The function has no in-repository callers but is an active, externally monitored production health endpoint. Removing it would cause the external uptime monitor to receive `404` or `40x` responses and would likely trigger false-positive production alerts. The absence of repository references is not evidence of disuse because the artifact is designed for out-of-band monitoring.

---

## Risk Analysis

| Area | Impact if deleted |
|------|-------------------|
| **Production** | Uptime monitor would receive `404`/`40x` responses; alerting would likely fire. |
| **Deployment** | `supabase functions delete admin-health-check` would undeploy the active endpoint; subsequent deployments would not restore it unless explicitly re-deployed. |
| **Monitoring** | Direct loss of the external health-check signal that the runbooks depend on. |
| **Admin Dashboard UI** | No runtime impact (no source callers). |
| **Tenant App** | No direct impact. |
| **Background Jobs** | No impact; no cron or queue references the function. |
| **Supabase Infrastructure** | Edge Function slot would be freed, but the external monitor would continue hitting the now-missing URL. |

---

## Governance Decision

- **Decision:** KEEP
- **Decision Type:** Governance Decision
- **Classification:** Production Infrastructure Artifact
- **Repository Caller Count:** 0
- **Production Dependency:** Confirmed
- **Removal Allowed:** NO
- **Removal Preconditions:**

A future program must first verify:

- production deployment
- external monitoring
- invocation history
- scheduler
- operational dependency

before any deletion is considered.

---

## Future Governance Rules

1. An Edge Function with zero repository callers must not be classified as a Dead Artifact until production deployment, external usage, and invocation history have been verified.
2. Any cleanup program that targets `supabase/functions/admin-health-check` must obtain explicit operational sign-off confirming that the external uptime monitor has been re-pointed or decommissioned.
3. Repository hygiene reviews must distinguish between *unused application code* and *production infrastructure endpoints* that are invoked by external systems.

---

## Program Impact

- `ISSUES_BEFORE_CLOSEOUT.md` has been updated to remove the deletion recommendation for `admin-health-check`.
- `REPOSITORY_HYGIENE_DECISION_REGISTER.md` has been updated to register `admin-health-check` as KEEP.
- The Wave-03 closeout tracking has been updated to record this artifact as reviewed and retained.
- No source code, Edge Function, deployment, or undeployment action was performed as part of this governance update.

---

## Decision Traceability

| Field | Value |
|-------|-------|
| Decision ID | ADM-HEALTH-CHECK-GOV-001 |
| Verification Report | `ADMIN_HEALTH_CHECK_ARTIFACT_VERIFICATION_REPORT.md` |
| Verification Date | 2026-07-21 |
| Evidence Source | Supabase MCP (`list_edge_functions`, `get_edge_function`, `get_logs`) |
| Classification | Production Infrastructure Artifact |
| Decision | KEEP |
| Removal Allowed | NO |
| Related Artifacts | `services/admin/permissions.ts` (REMOVE), `supabase/functions/deliver-webhook` (PENDING) |
| Governance Record | `REPOSITORY_HYGIENE_DECISION_REGISTER.md` |
