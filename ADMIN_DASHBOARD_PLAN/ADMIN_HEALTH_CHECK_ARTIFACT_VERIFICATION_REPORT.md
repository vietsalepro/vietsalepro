# ADMIN_HEALTH_CHECK_ARTIFACT_VERIFICATION_REPORT.md

**Artifact:** `supabase/functions/admin-health-check`  
**Verification date:** 2026-07-21  
**Scope:** Repository, Supabase (production & staging), Git history, external usage  
**Constraint:** No source-code changes, no deletions, no undeployments.

---

## Executive Summary

The `admin-health-check` Edge Function is **NOT a dead artifact**. It is deployed and **actively invoked** on the production Supabase project by an external monitoring service. Removing it would break production uptime checks and likely trigger false-positive alerts.

**Final Recommendation: KEEP**

---

## Repository Evidence

### Source-code callers

Searches for the string `admin-health-check` in the application source trees returned **zero matches**:

| Directory | Result |
|-----------|--------|
| `services/` | No matches |
| `lib/` | No matches |
| `hooks/` | No matches |
| `pages/` | No matches |
| `components/` | No matches |
| `contexts/` | No matches |
| `utils/` | No matches |

References were found only in governance documents, runbooks, and archived plans (`ADMIN_DASHBOARD_PLAN/`, `docs/admin-dashboard/`, `PDP-*/`, `archive/`, `memory-zone/`).

### Codebase Memory graph

`codebase-memory trace_path(admin-health-check, direction=both, mode=calls, depth=3)` returned:

```json
{
  "function": "admin-health-check",
  "callers": [],
  "callees": []
}
```

`codebase-memory search_graph(query="admin-health-check")` located the function itself and related `system-health`/`check-subdomain` code, but no inbound application callers.

### Outbound dependencies

The function file (`supabase/functions/admin-health-check/index.ts`) has no internal callees. It depends on:

- Runtime imports:
  - `https://esm.sh/@supabase/supabase-js@2.97.0`
  - `https://deno.land/std@0.177.0/http/server.ts`
- Environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- PostgREST RPCs exercised by the health checks:
  - `is_system_admin`
  - `is_tenant_admin`
  - `is_tenant_member`
  - `has_tenant_role`
  - `get_tenant_by_subdomain`

---

## Supabase Evidence

### Project mapping

| Environment | Supabase project ref | Project name |
|-------------|----------------------|--------------|
| Production | `rsialbfjswnrkzcxarnj` | QLBH |
| Staging | `shbmzvfcenbybvyzclem` | QLBH Staging Multi-Tenant |

`supabase/config.toml` and `.env` confirm `rsialbfjswnrkzcxarnj` as the configured local/default project.

### Deployment status

`list_edge_functions` for both projects returned `admin-health-check` with status `ACTIVE`:

| Project | Slug | Version | Status | `verify_jwt` |
|---------|------|---------|--------|--------------|
| `rsialbfjswnrkzcxarnj` (prod) | `admin-health-check` | `3` | `ACTIVE` | `false` |
| `shbmzvfcenbybvyzclem` (staging) | `admin-health-check` | `3` | `ACTIVE` | `false` |

`get_edge_function` for production confirms the deployed source matches the repository file.

### Recent logs / last invocation

`get_logs(project_id=rsialbfjswnrkzcxarnj, service=edge-function)` shows continuous `HEAD` requests to the function URL. The most recent entries at the time of retrieval:

- `2026-07-21T09:37:30.050000` — `HEAD | 200 | https://rsialbfjswnrkzcxarnj.supabase.co/functions/v1/admin-health-check`
- `2026-07-21T09:32:23.784000` — `HEAD | 200 | ...`
- `2026-07-21T09:27:18.891000` — `HEAD | 200 | ...`
- `2026-07-21T09:22:10.435000` — `HEAD | 200 | ...`

The log stream is large and truncated in the MCP response; the visible pattern is a `HEAD` call every ~5 minutes with `200` responses. This indicates an ongoing external uptime/health ping.

`get_logs(project_id=shbmzvfcenbybvyzclem, service=edge-function)` returned an empty result set for `admin-health-check`, consistent with staging not being actively monitored.

### Invocation count

A precise invocation count is not directly exposed by the Supabase MCP. The log stream shows regular, frequent invocations on production; staging has none in the retrieved window.

### Secrets / environment variables

The Supabase MCP does not expose a `list_secrets` tool, so secret names and values were not enumerated. The function code requires:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Successful `200` log responses on production demonstrate these are configured and effective at runtime.

### Scheduled execution (Cron / Scheduler)

- No cron expression or scheduler configuration referencing `admin-health-check` was found in the repository.
- `get_logs` shows `HEAD` requests, which are typical of external uptime-monitor polling rather than an internal cron trigger.
- A dedicated `cron-admin-tasks` Edge Function exists; `admin-health-check` is not referenced inside it.

### Database triggers

No database trigger, migration, or SQL file references `admin-health-check`. Searches in `supabase/migrations/` and `supabase/schema.sql` returned no matches.

### Webhook triggers

No webhook, `supabase functions invoke`, or HTTP client in the source tree calls `admin-health-check`. `trace_path(inbound)` returned empty, confirming no in-repo webhook or function-to-function caller.

---

## External Dependency Verification

The function is explicitly designed for external monitoring:

- Source comment: `// Called by Uptime Robot / Better Stack every few minutes.`
- `verify_jwt = false` so it can be called without a user JWT.
- Production runbooks list the public URL:
  - `https://rsialbfjswnrkzcxarnj.supabase.co/functions/v1/admin-health-check`
- Live `edge-function` logs show repeated `HEAD` calls from an external caller.
- The caller cannot be identified by name from the log fields available (no User-Agent or IP in the returned data), but the invocation pattern and source documentation together confirm an external uptime-monitoring dependency.

This external usage is a hard dependency that prevents safe removal.

---

## Git Evidence

```text
commit d6154b3e260a55c56a3c385a0a6b6ba0c2e0a0f2
Author:     phatnt056 <31572085+vietsalepro@users.noreply.github.com>
AuthorDate: Sun Jul 12 07:39:50 2026 +0700
Message:    Phase 5 long-term hardening: complete manual handoff tasks
```

`git show --stat` on that commit reports:

```text
 supabase/functions/admin-health-check/index.ts | 79 ++++++++++++++++++++++++++
 1 file changed, 79 insertions(+)
```

`git log --all -- supabase/functions/admin-health-check/index.ts` returns only this single commit, indicating the file was added as part of the Phase 5 long-term hardening handoff and has not been modified since.

**Characterization:** The artifact is not abandoned or experimental; it was deliberately added as an external monitoring endpoint and is currently active.

---

## Dependency Analysis

- **Inbound application callers:** None.
- **Inbound function-to-function callers:** None.
- **Inbound database/webhook/cron triggers:** None in repository.
- **Outbound dependencies:** Five PostgREST RPCs plus two Supabase environment variables.
- **External inbound dependency:** An external uptime/health monitoring service calls the public URL on a ~5-minute cadence in production.

The only dependency chain that matters for removal is the external monitoring caller. Despite having no repository callers, the function is a production monitoring endpoint.

---

## Risk Assessment

| Area | Impact if deleted |
|------|-------------------|
| **Production** | Uptime monitor would receive `404`/`40x` responses; alerting would likely fire. |
| **Deployment** | `supabase functions delete admin-health-check` would undeploy the active endpoint; subsequent deployments would not restore it unless explicitly re-deployed. |
| **Monitoring** | Direct loss of the external health-check signal that the runbooks depend on. |
| **Admin Dashboard** | No runtime impact on Admin Dashboard UI (no source callers), but ops runbooks lose a health probe. |
| **Tenant App** | No direct impact. |
| **Background Jobs** | No impact; no cron or queue references the function. |
| **Supabase Infrastructure** | Edge Function slot would be freed, but the external monitor would continue hitting the now-missing URL. |

---

## Final Recommendation

**KEEP**

`admin-health-check` is an active, externally monitored production endpoint. It has no repository callers, but it has a live external dependency. Deletion is unsafe and would break uptime monitoring. No cleanup, undeployment, or source modification was performed.
