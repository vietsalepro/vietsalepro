# M1 — Local Supabase/Postgres Connectivity
## Root Cause Analysis

**Program:** VietSalePro v7 — Production Deployment Program  
**RC ID:** `RC-2026-07-19-01`  
**Frozen Commit:** `04d41a474d63337f933f33ddd9185fb0d596fab5`  
**Date:** 2026-07-19  
**Investigator:** Database Engineer / DevOps Lead / Release Engineer  

---

## Executive Summary

Observation `M1` reported that the local Supabase/Postgres environment could not complete the required CLI gates:

- `npx supabase migration list --local`
- `npx supabase db lint`
- `npx supabase db diff`

The investigation found that the local Supabase service stack was not running. Once the stack was started with `npx supabase start --yes`, all three CLI commands connected to the local database and completed successfully. The root cause was environmental, not a migration or repository defect.

---

## Investigation

### Environment verified

| Item | Value | Status |
|---|---|---|
| Supabase CLI | `2.109.1` | Present |
| Docker Desktop / Engine | `29.6.1` | Running |
| Docker context | `desktop-linux` | Active |
| Local project ID | `rsialbfjswnrkzcxarnj` | From `supabase/config.toml` |
| Local DB port | `54322` | From `supabase/config.toml` |
| Canonical migration count | `138` | Confirmed in `supabase/migrations` |
| `.env` | Contains production `VITE_SUPABASE_URL` only | No local config conflict |

### Initial diagnostic commands

| Command | Result |
|---|---|
| `npx supabase status` | `failed to inspect container health: Error response from daemon: No such container: supabase_db_rsialbfjswnrkzcxarnj` |
| `npx supabase migration list --local` | `Connecting to local database... failed to connect to postgres: effect/sql/SqlError: PgClient: Failed to connect` |
| `npx supabase db lint` | `Connecting to local database... failed to connect to postgres: effect/sql/SqlError: PgClient: Failed to connect` |
| `npx supabase db diff` | `Creating shadow database...` applied migrations, then `Diffing schemas... connect ECONNREFUSED 127.0.0.1:54322` |

### Supporting observations

- `docker ps` initially showed **zero** containers.
- `docker info` confirmed the Docker daemon was reachable.
- No Windows firewall, WSL, or port-conflict errors were observed.
- The `supabase/config.toml` was intact and configured for major version `17`.

---

## Root Cause

The local Supabase Postgres container (`supabase_db_rsialbfjswnrkzcxarnj`) and the rest of the local service stack were not running. The Supabase CLI commands that require a live local database were attempting to connect to `127.0.0.1:54322` and failing because nothing was listening on that port.

- **Category:** Environmental / Infrastructure (local Docker services)
- **Severity:** Medium
- **Impact:** Blocked local CLI gate execution; did not affect repository or migration integrity.

---

## Evidence

### 1. Missing local containers before remediation

```text
=== DOCKER PS ===
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

### 2. `supabase status` before remediation

```text
failed to inspect container health: Error response from daemon: No such container: supabase_db_rsialbfjswnrkzcxarnj
```

### 3. Connection failure on the three gates

```text
Connecting to local database...
failed to connect to postgres: effect/sql/SqlError: PgClient: Failed to connect
```

### 4. `db diff` shadow success but local connection refused

```text
Applying migration 20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.sql...
Diffing schemas...
connect ECONNREFUSED 127.0.0.1:54322
```

### 5. Successful `supabase start` remediation

`npx supabase start --yes` pulled required images and started the local development setup:

```text
Started supabase local development setup.

Database
URL │ postgresql://postgres:postgres@127.0.0.1:54322/postgres

Project URL    │ http://127.0.0.1:54321
REST           │ http://127.0.0.1:54321/rest/v1
Studio         │ http://127.0.0.1:54323
```

### 6. Containers after remediation

```text
NAMES                                        STATUS
supabase_db_rsialbfjswnrkzcxarnj             Up 2 minutes (healthy)   0.0.0.0:54322->5432/tcp
supabase_kong_rsialbfjswnrkzcxarnj           Up About a minute (healthy)
supabase_auth_rsialbfjswnrkzcxarnj           Up About a minute (healthy)
supabase_rest_rsialbfjswnrkzcxarnj           Up About a minute
supabase_realtime_rsialbfjswnrkzcxarnj       Up About a minute (healthy)
supabase_storage_rsialbfjswnrkzcxarnj        Up About a minute (healthy)
supabase_pg_meta_rsialbfjswnrkzcxarnj        Up About a minute (healthy)
supabase_studio_rsialbfjswnrkzcxarnj        Up About a minute (healthy)
supabase_inbucket_rsialbfjswnrkzcxarnj      Up About a minute (healthy)
supabase_analytics_rsialbfjswnrkzcxarnj      Up About a minute (healthy)
```

The `supabase_vector` container was observed restarting and `supabase_pooler` / `supabase_imgproxy` were not started, but these are not required for the M1 gates.

---

## Remediation

Safe local remediation performed:

1. Verified Docker Desktop was running and the daemon was reachable.
2. Started the local Supabase stack:

   ```bash
   npx supabase start --yes
   ```

3. Waited for images to pull and for the database health check to pass.
4. Re-ran the three CLI gates.

No production systems, migrations, source code, or repository history were modified.

---

## Validation Results

| Gate | Command | Result | Notes |
|---|---|---|---|
| Migration list | `npx supabase migration list --local` | **PASS** | 138 migrations listed; Local and Remote versions match for all entries. |
| Database lint | `npx supabase db lint` | **PASS (connectivity)** | Connected and completed (exit 0). The report contains pre-existing lint findings in `extensions` (pgtap) and `public` functions; these are code-quality issues, not connectivity blockers. |
| Database diff | `npx supabase db diff` | **PASS** | Shadow database created, all 138 migrations applied, diff completed with `No schema changes found`. |

The local environment is now operational and the M1 connectivity observation is resolved.

---

## Final Recommendation

- **M1 Decision:** `M1 CLOSED`
- **Reasoning:** The root cause (local Supabase stack not running) was identified, the stack was started, and all three CLI gates now complete successfully.
- **Class:** Environmental / Docker / Local infrastructure.
- **Follow-up:** The `db lint` findings are pre-existing and out of scope for M1. If governance requires a clean lint report, open a separate code-quality remediation task and do not block M1 closure on those findings.
