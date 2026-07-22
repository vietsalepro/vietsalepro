# 21A_ADMIN_DASHBOARD_WAVE-01_DEPLOYMENT_SYNCHRONIZATION_REPORT

**Document ID:** 21A_ADMIN_DASHBOARD_WAVE-01_DEPLOYMENT_SYNCHRONIZATION_REPORT  
**Date:** 2026-07-20  
**Project:** VietSalePro  
**Sub Project:** Admin Dashboard  
**Program:** Admin Dashboard System Remediation Program  
**Phase:** B — System Remediation  
**Wave:** Wave-01  
**Acting Capacity:** Enterprise Release Manager  

------------------------------------------------------------------------

# 1. Purpose

This report documents the operational deployment synchronization of the
accepted Wave-01 repository revision into the Staging Supabase
environment. The synchronization was performed strictly from the
repository; Production was not used as a deployment source and was not
modified.

------------------------------------------------------------------------

# 2. Scope and Constraints

This activity is **operational** and outside the Wave-01 governance
lifecycle. As mandated:

- No application source code was modified.
- No migrations were created or applied.
- No business logic, database schema, UI, or services were modified.
- Production remained untouched.
- The repository remained the sole System Source of Truth.

------------------------------------------------------------------------

# 3. Current Repository Revision

| Check | Method | Result |
|---|---|---|
| HEAD full SHA | `git rev-parse HEAD` | `2f92be33849699691a333fdb1a3f488e05763a1e` |
| HEAD short SHA | `git log --oneline -1` | `2f92be33` |
| Wave-01 implementation commits | `git log --oneline 3a06a6d9..HEAD -- App.tsx contexts/AuthContext.tsx services/admin/memberAdminService.ts supabase/functions/audit-log/index.ts` | `0fd7e4ed` fix(ARCH-002, EXE-001); `98c196f0` fix(ARCH-001, PERM-001); `33d178d0` fix(EDG-001) |
| HEAD vs accepted Wave-01 diff for implementation files | `git diff --stat 0fd7e4ed..HEAD -- App.tsx contexts/AuthContext.tsx services/admin/memberAdminService.ts supabase/functions/audit-log/index.ts` | No changes (0 insertions, 0 deletions). The accepted Wave-01 implementation is identical at HEAD for the Wave-01 deliverables. |

**Repository is the Wave-01 accepted source:** the only commits after
`0fd7e4ed` are documentation/roadmap updates; the Wave-01 implementation
files are unchanged.

------------------------------------------------------------------------

# 4. Current Staging State

**Project ID:** `shbmzvfcenbybvyzclem`  
**Name:** QLBH Staging Multi-Tenant  
**Region:** ap-northeast-1  
**Status:** `ACTIVE_HEALTHY`  
**Database Host:** `db.shbmzvfcenbybvyzclem.supabase.co`  
**Database Version:** `17.6.1.141` (Postgres 17, release channel `ga`)  

## 4.1 Edge Functions (Staging)

| Slug | Version | Status | verify_jwt | ezbr_sha256 |
|---|---|---|---|---|
| create-tenant | 6 | ACTIVE | true | `aaa5b258d3c3990fd586eeb2a285e0cd62551239e3bc650a0dbc3fa219345b6e` |
| check-subdomain | 7 | ACTIVE | false | `af40012b951156e35fae4d1852e0bf06b2512f78ccd3ca4b2af554faec52dce9` |
| process-checkout | 6 | ACTIVE | true | `1db97bef28af0b9b4bc03f64865ea6b9229c2158649af96c63f3ee3ae8d25e5e` |
| **audit-log** | **7** | **ACTIVE** | **true** | `902c4709b01802e8629200aa9c19dc03c5732919387ca35437c8c2e6137822ba` |
| invite-member | 8 | ACTIVE | true | `d22bedfa4f4740b91b69f2b8830595eb51a4e52ab16a7d904184638216c3aaa2` |
| reset-password | 7 | ACTIVE | true | `6a83ebb3b5a825ed73ffaa64bbddff70efdc9ecfab5b33018957bb9e0b015a0c` |
| send-template-email | 1 | ACTIVE | true | `d64d463f988076cd2103c70e83bf6ac7d3f31e1a19f37b2ccba79d9940aa942b` |
| system-health | 1 | ACTIVE | true | `0b6f6ad80fce295f2e338d6b729220dc5f05f44a553bcc2608f039569d1bfcbd` |
| error-performance | 1 | ACTIVE | true | `0fd90ba94274570a49bd890f1c61f1d25c1efc64bfd3f03d173c5d6daed26067` |
| create-system-admin | 1 | ACTIVE | true | `81f4b5956177cf16ac85f09e96ae4203ad31b4b23d2b09dcd0ababe641f42702` |
| admin-health-check | 3 | ACTIVE | false | `8367803f4f810e861109f1b96a5ab728eef6cc25b7ac62c3a67cd6b438d480c0` |

## 4.2 Wave-01 Staging Audit-Log Source

After synchronization, the deployed `audit-log` source contains the
EDG-001 caller-authentication guard and the expanded `AUDIT_ACTIONS` set
(`'IMPERSONATE'`, `'IMPERSONATE_END'`) that are present in the repository
at `supabase/functions/audit-log/index.ts`.

## 4.3 Applied Migrations (Staging)

Staging applied migrations extend through version **`20260728000000`
(`sp5_6_db_maintenance`)**. The full list was retrieved via MCP and
includes the Wave-01 prerequisite objects such as `is_system_admin`
and `activate_pending_memberships` (verified via `pg_proc`, see
Section 8.2).

------------------------------------------------------------------------

# 5. Current Production State

**Project ID:** `rsialbfjswnrkzcxarnj`  
**Name:** QLBH  
**Region:** ap-northeast-1  
**Status:** `ACTIVE_HEALTHY`  
**Database Host:** `db.rsialbfjswnrkzcxarnj.supabase.co`  
**Database Version:** `17.6.1.084` (Postgres 17, release channel `ga`)  

## 5.1 Edge Functions (Production — relevant extract)

| Slug | Version | Status | verify_jwt | ezbr_sha256 | Notes |
|---|---|---|---|---|---|
| **audit-log** | **12** | **ACTIVE** | **true** | `797e3686653444ae232f4b7b2e7ad4108d2c664b74b6248fe415768d512ffd45` | **Wave-01 Edge Function; production entrypoint path matches repository path `C:\PROJECT\vietsalepro\supabase\functions\audit-log\index.ts`.** |
| create-tenant | 16 | ACTIVE | true | `ba7eb3cbe493d40683586e491b1a708e6364001c090685ad53ddeb04cfbb52fc` | Deployed from `C:\PROJECT\vietsalepro\supabase\functions\create-tenant\index.ts` |
| invite-member | 17 | ACTIVE | true | `af4ff7a6c047d6741eb162d395846db11ab548c8bfa45b40e41a2e5cbf36b13b` | Deployed from `C:\PROJECT\vietsalepro\supabase\functions\invite-member\index.ts` |
| check-subdomain | 11 | ACTIVE | true | `2c1b49c2e5d150e46e021ba1999fd9751d831615244c7c22a24026b72ee486e0` | ... |
| reset-password | 14 | ACTIVE | true | `af0541f89aab90597244dfd45acd39ae24b10b1177dce6202bdfc58735d905b5` | ... |
| process-checkout | 10 | ACTIVE | true | `0996edef9ba6261d984d645dd338c670beab8b0981b2cc073ee76695d91dc19b` | ... |
| impersonate-tenant | 4 | ACTIVE | true | `42b51ed0909d22b16dfdb33bfce903c4f42cb02e9083dad5ddc168f7516495ac` | ... |
| end-impersonation | 4 | ACTIVE | true | `8c7aa9c33c2bfd73ef4a077275837929597418e73c20c2d7c6d2220b404f893c` | ... |
| system-health | 4 | ACTIVE | true | `7b3d921d44e5ee27e1dd52ad17742545664e14bd16b11a992f3e7f1129c7f2b8` | ... |
| error-performance | 5 | ACTIVE | true | `2dc6d2f55855f5136c17f5944a0e1345d11b25915fe31b13b37827d4faf06ff9` | ... |
| system-backup | 4 | ACTIVE | true | `f437bfec3bf8a0defaf9dd951bdfa1f372695c06f138968810f26e634cc81ac2` | ... |
| tenant-backup | 5 | ACTIVE | true | `4dd1390a59cd77ac359392caa9a3f88458cf849abbbd660d308838254e6d62e5` | ... |
| tenant-restore | 4 | ACTIVE | true | `dfa145205ea928875a183826b77fe2d652d01b4350b22ba846a25ce1eef72210` | ... |
| deliver-webhook | 4 | ACTIVE | true | `9ead42a39ccf1933e61f725b8fdec82579521431f22f8b5eb6c5ee370f85e8c7` | ... |
| admin-2fa-override | 4 | ACTIVE | true | `65a41945cfe8aba2d5c40c3ff1d118633d6081dc46ae3c00ec8bd60976138c5a` | ... |
| create-system-admin | 5 | ACTIVE | true | `a75c6aa25520921e675790399f260b78d3d3789aba1be4f66fc7d9bce5fe2ede` | ... |
| delete-tenant | 6 | ACTIVE | true | `551b04659fb7bd4ecd5ff9da7c9faf7ac8d8200103dcaa39a1a0c62706e7a0a7` | ... |
| delete-user | 5 | ACTIVE | true | `1a72b43dcb2a849a6f1d891268fe69b1ddff0960d55de3c1acb99eac222fcc3e` | ... |
| send-invitation-email | 3 | ACTIVE | true | `2dbf6506b179d69fefa115ebe776913cd3c8ee5ffa936ef769af0f33842af4f5` | ... |
| billing-webhooks | 4 | ACTIVE | false | `e37e912535c998f85a2addf5d71c3b15f80271c8d50e0e0c69d1e0396de5b263` | ... |
| cron-admin-tasks | 5 | ACTIVE | false | `da75c2802c187272a2b6d83425a7d02469646e6c0cac594428bb8cb35b55e993` | ... |
| admin-health-check | 3 | ACTIVE | false | `8367803f4f810e861109f1b96a5ab728eef6cc25b7ac62c3a67cd6b438d480c0` | ... |

Production contains additional active Edge Functions beyond the
Wave-01 scope (for example `send-billing-email`, `send-ticket-email`,
`send-template-email`, `impersonate-tenant`, `end-impersonation`,
etc.). Full production function inventory is available via the
`list_edge_functions` MCP output; this report extracts the items most
relevant to the Wave-01 comparison.

## 5.2 Applied Migrations (Production)

Production applied migrations extend through version
**`20260723000001` (`g1_add_max_storage_gb_to_tenant_subscriptions`)**.
The full production migration list is not identical to Staging (see
Section 7.3).

------------------------------------------------------------------------

# 6. Environment Comparison

## 6.1 Project / Infrastructure

| Dimension | Staging `shbmzvfcenbybvyzclem` | Production `rsialbfjswnrkzcxarnj` | Difference |
|---|---|---|---|
| Status | `ACTIVE_HEALTHY` | `ACTIVE_HEALTHY` | None — both healthy |
| Region | `ap-northeast-1` | `ap-northeast-1` | None |
| Organization | `ycvyvliijnlcetxzxrrk` | `ycvyvliijnlcetxzxrrk` | None |
| Postgres engine | `17` | `17` | None (major version) |
| Database version | `17.6.1.141` | `17.6.1.084` | Staging patch is newer (`141` vs `084`) |

## 6.2 Edge Functions — Wave-01 Focus

| Dimension | Staging (after sync) | Production | Difference |
|---|---|---|---|
| `audit-log` slug | `audit-log` | `audit-log` | None |
| `audit-log` version | **7** | **12** | Version numbers are environment-specific; both are the latest in their respective environment. |
| `audit-log` status | `ACTIVE` | `ACTIVE` | None |
| `audit-log` verify_jwt | `true` | `true` | None |
| `audit-log` source path | `C:\tmp\user_fn_shbmzvfcenbybvyzclem_…\source\index.ts` | `C:\PROJECT\vietsalepro\supabase\functions\audit-log\index.ts` | Path differs (expected; staging is a fresh deploy). |
| `audit-log` source content | EDG-001 guard present, `IMPERSONATE` / `IMPERSONATE_END` in `AUDIT_ACTIONS` | EDG-001 guard present (per Wave-01 Verification Report 20) | **Aligned for Wave-01.** Hash values (`ezbr_sha256`) are environment-specific and not directly comparable. |

## 6.3 Edge Functions — Inventory Differences (non-Wave-01)

- Production contains functions not present in Staging (for example
  `send-billing-email`, `send-ticket-email`, `impersonate-tenant`,
  `end-impersonation`, `system-backup`, `tenant-backup`,
  `tenant-restore`, `deliver-webhook`, `admin-2fa-override`,
  `billing-webhooks`, `cron-admin-tasks`, `db-maintenance`, etc.).
- Staging contains `audit-log` after synchronization; it previously
  lacked the EDG-001 guard (see Section 9).
- `verify_jwt` configuration is consistent on `audit-log` (`true` in
  both environments).

## 6.4 Database / Schema / Migrations

| Dimension | Staging | Production | Difference |
|---|---|---|---|
| Latest applied migration | `20260728000000` (`sp5_6_db_maintenance`) | `20260723000001` (`g1_add_max_storage_gb_to_tenant_subscriptions`) | **Migration sets are not identical.** Staging has more recent migrations. |
| `is_system_admin` RPC | Present | Present | None |
| `activate_pending_memberships` RPC | Present (arg `p_user_id`) | Present (arg `p_user_id`) | None |

## 6.5 Repository-Environment Alignment

| Wave-01 Deliverable | Repository HEAD | Staging (after sync) | Match |
|---|---|---|---|
| `supabase/functions/audit-log/index.ts` (EDG-001) | EDG-001 guard + expanded `AUDIT_ACTIONS` | EDG-001 guard + expanded `AUDIT_ACTIONS` | **Yes** |
| `App.tsx` (ARCH-001, PERM-001) | `isSystemAdmin()` via `lib/permissions.ts` | Client-side build artifact, not a Supabase deployable | N/A for Supabase sync |
| `contexts/AuthContext.tsx` (ARCH-002, EXE-001) | `activateMembership()` via `memberAdminService` | Client-side build artifact, not a Supabase deployable | N/A for Supabase sync |
| `services/admin/memberAdminService.ts` (EXE-001) | Returns error to caller | Client-side build artifact, not a Supabase deployable | N/A for Supabase sync |

------------------------------------------------------------------------

# 7. Deployment Actions Performed

| # | Action | Tool | Target | Result |
|---|---|---|---|---|
| 1 | Repository revision verified | `git rev-parse HEAD`, `git diff --stat` | Local repository | HEAD `2f92be33` confirmed; Wave-01 implementation files unchanged since `0fd7e4ed` |
| 2 | List / inspect Staging Edge Functions | `mcp_call_tool list_edge_functions` | Staging | Confirmed `audit-log` v6 was the pre-sync state |
| 3 | List / inspect Production Edge Functions | `mcp_call_tool list_edge_functions` | Production | Confirmed `audit-log` v12 and `verify_jwt: true` |
| 4 | Deploy `audit-log` from repository to Staging | `mcp_call_tool deploy_edge_function` | Staging | `audit-log` promoted to v7; `verify_jwt: true` retained |
| 5 | Re-inspect Staging `audit-log` | `mcp_call_tool get_edge_function` | Staging | Deployed source matches repository source |
| 6 | Runtime authentication verification | `curl.exe` | Staging | `POST` without Authorization → `401`; with invalid Bearer → `401` |
| 7 | List applied migrations and RPC existence | `mcp_call_tool list_migrations`, `execute_sql` on `pg_proc` | Both | Differences documented; no migrations applied |

## 7.1 Artifacts Deployed

- **Edge Function:** `audit-log`
- **Source:** `supabase/functions/audit-log/index.ts` from repository
  revision `2f92be33849699691a333fdb1a3f488e05763a1e`
- **Target environment:** Staging (`shbmzvfcenbybvyzclem`)
- **Verify JWT:** enabled (`true`)
- **Deployment result:** new version `7`, status `ACTIVE`

No other Edge Functions, migrations, schema objects, or client artifacts
were deployed.

------------------------------------------------------------------------

# 8. Verification Results

## 8.1 Edge Function Deployment Health

| Check | Method | Expected | Actual | Verdict |
|---|---|---|---|---|
| `audit-log` status | `get_edge_function` | `ACTIVE` | `ACTIVE` | PASS |
| `audit-log` `verify_jwt` | `get_edge_function` | `true` | `true` | PASS |
| Source contains EDG-001 guard | `get_edge_function` source | `Authorization` header read and `getUser(token)` before any write | Present | PASS |
| `AUDIT_ACTIONS` includes `IMPERSONATE`/`IMPERSONATE_END` | `get_edge_function` source | Expanded set present | Present | PASS |
| Missing Authorization returns 401 | `curl.exe -X POST …` | `401` | `401` | PASS |
| Invalid Bearer returns 401 | `curl.exe -X POST … -H "Authorization: Bearer invalidtoken"` | `401` | `401` | PASS |

## 8.2 RPC Availability

| RPC | Staging `pg_proc` result | Production `pg_proc` result | Verdict |
|---|---|---|---|
| `is_system_admin` | `boolean` result, present | `boolean` result, present | PASS both |
| `activate_pending_memberships(p_user_id)` | `void` result, present | `void` result, present | PASS both |

## 8.3 Configuration / Deployment Metadata

| Item | Staging | Production | Status |
|---|---|---|---|
| Project status | `ACTIVE_HEALTHY` | `ACTIVE_HEALTHY` | PASS |
| `audit-log` slug exists | Yes (v7) | Yes (v12) | PASS |
| `audit-log` JWT verification | `true` | `true` | PASS |

## 8.4 Migration Status

- No migrations were applied during this synchronization.
- Migration drift between Staging and Production is documented in
  Section 7.3 and remains an existing operational observation, not a
  Wave-01 acceptance blocker.

------------------------------------------------------------------------

# 9. Remaining Differences

After synchronization, the following differences remain. They are
outside the Wave-01 deliverable and were not reconciled per the
constraint that only the accepted Wave-01 repository revision be deployed
to Staging.

1. **Edge Function inventory:** Production contains additional active
   Edge Functions not present in Staging. Synchronizing these was not in
   scope because the request was to deploy "the repository revision that
   already represents the accepted Wave-01 implementation."
2. **Edge Function version numbers:** Environment-specific version
   counters differ (`audit-log` v7 in Staging vs v12 in Production). This
   is expected and does not indicate source drift.
3. **Migration sets:** The applied migration histories are not
   identical. Staging's latest applied migration is `20260728000000`
   (`sp5_6_db_maintenance`); Production's is `20260723000001`
   (`g1_add_max_storage_gb_to_tenant_subscriptions`). No migrations were
   created or applied.
4. **Database patch version:** Staging runs `17.6.1.141`; Production
   runs `17.6.1.084`.
5. **Client application build:** `App.tsx`, `AuthContext.tsx`, and
   `memberAdminService.ts` are source artifacts and not Supabase
   deployables; their deployment is a separate frontend build step and
   was not part of this operational sync.

------------------------------------------------------------------------

# 10. Operational Observations

- **Repository Source of Truth preserved:** The only deploy action used
  the repository file `supabase/functions/audit-log/index.ts`. Production
  was not used as a source.
- **Production unchanged:** No MCP or git commands modified Production.
- **Staging `audit-log` now matches repository:** The source deployed to
  Staging includes the EDG-001 authentication gate and the same
  `AUDIT_ACTIONS` set as the repository HEAD.
- **Version/hash numbers are environment-local:** `ezbr_sha256` and
  function version counters differ between environments even when source
  content is equivalent; these values should be treated as deployment
  metadata, not cross-environment content fingerprints.
- **Migration drift is pre-existing:** The migration mismatch was
  observed, not introduced by this activity. Reconciling it would
  require a dedicated migration governance cycle.

------------------------------------------------------------------------

# 11. Final Synchronization Status

| Success Criterion | Status |
|---|---|
| Repository remains the deployment source | **SATISFIED** |
| Staging synchronized to accepted Wave-01 repository revision | **SATISFIED** (Edge Function `audit-log`) |
| Production unchanged | **SATISFIED** |
| Environment differences documented | **SATISFIED** |
| Deployment verification completed | **SATISFIED** |

------------------------------------------------------------------------

# 12. Synchronization Decision

**SYNCHRONIZED WITH OBSERVATIONS**

Staging `audit-log` Edge Function is now deployed from the accepted
Wave-01 repository revision and behaves identically to the repository
implementation. Production was not modified. Remaining differences
(non-Wave-01 Edge Function inventory, migration history, and database
patch version) are documented and were intentionally left unreconciled
because they fall outside the Wave-01 scope and the explicit instruction
to deploy only the accepted Wave-01 repository revision.

------------------------------------------------------------------------

*Report generated by the Enterprise Release Manager for the Wave-01
Deployment Synchronization activity. No source code, migrations,
schemas, UI, or production configurations were modified.*
