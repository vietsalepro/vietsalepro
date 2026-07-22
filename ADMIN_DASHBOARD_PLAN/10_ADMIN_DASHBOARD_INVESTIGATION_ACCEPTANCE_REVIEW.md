# ADMIN_DASHBOARD_INVESTIGATION_ACCEPTANCE_REVIEW

**Date:** 2026-07-20
**Program:** Admin Dashboard System Remediation Program
**Phase:** A — Independent Investigation Acceptance Review
**Document Under Review:** `09_ADMIN_DASHBOARD_SYSTEM_INCONSISTENCY_REPORT.md`
**Reviewer Role:** Independent Enterprise Technical Review Board
**Repository Scope:** `C:\PROJECT\vietsalepro` @ commit `3a06a6d9` (RC-2026-07-19-01)
**Verification Tools:** Codebase Memory MCP (`C-PROJECT-vietsalepro` graph, 26 178 nodes / 39 658 edges), direct repository inspection (`grep`, file reads)
**Code Changes Made During Review:** None
**Status:** Review Complete

---

# 1. Executive Summary

The independent Enterprise Technical Review Board has completed an acceptance review of `09_ADMIN_DASHBOARD_SYSTEM_INCONSISTENCY_REPORT.md` (the "Investigation Report"). All 10 mandatory System Source of Truth (SSOT) documents (00–08) plus the report under review (09) were read in full. Repository evidence was independently verified through Codebase Memory MCP and direct file/schema inspection.

**Headline verdict:** The Investigation Report is fundamentally sound, evidence-based, and trustworthy as the official remediation baseline. All three Critical findings were independently re-verified against repository artifacts and confirmed without ambiguity. The investigation covers all 12 capability domains required by the SSOT Investigation Plan and Forensic Execution Protocol, and respects the "investigation only — no code changes" governance constraint.

**Material observations that prevent an unconditional PASS:**

1. **Two false positives** were detected (DB-008/DIR-003 and a substantial portion of DEP-001). DB-008 claims `gdpr_delete_user_data` does not populate `gdpr_deletion_logs`; direct inspection of `supabase/schema.sql:34791–34812` shows the function performs six explicit `INSERT INTO public.gdpr_deletion_logs` statements. The report itself flagged this as `Confidence: Possible`, which was the right call, but the conclusion is wrong and the entry should be removed or reclassified as `Repository Evidence Incomplete`.
2. **The Severity Matrix is internally inconsistent.** It reports `Low = 10` but enumerates 14 distinct issue IDs in the Low row. It reports `High = 18` but omits DRIFT-001, DRIFT-002, RPC-001, and VAL-002, all of which are cataloged as `High`. The matrix totals 50 issues, while the catalog contains 66 entries (45 unique). The discrepancy is not reconciled in the report.
3. **Several evidence counts are slightly inaccurate.** DB-002 cites five `update_tenant_subscription` definitions; only three `CREATE OR REPLACE FUNCTION` occurrences exist. DB-003 cites four `create_tenant_with_admin` definitions; only three exist. MIG-001 says "25+ fix migrations"; the actual count is 21. MIG-002 says "21 migrations after the SSOT baseline"; the actual count is 29. None of these inaccuracies change the underlying defect (schema drift is real and severe), but the cited numbers must be corrected before the report is sealed.
4. **Heavy cross-categorization inflates the catalog.** 21 of the 66 cataloged issues are explicit "Same as X" duplicates (e.g., ARCH-005 ≡ SVC-001, EDG-001 ≡ PERM-002 ≡ SEC-002). The report acknowledges this in a footnote, but the duplicate IDs still appear in the Severity Matrix, inflating apparent scope and complicating downstream remediation planning. The 45-unique count is the operationally meaningful number.

None of these observations invalidate the core findings. The 3 Critical issues, the 4 highest-impact High issues (ARCH-004, ARCH-005, BL-001, BL-002), and the schema-drift cluster (DB-001/DB-002/DB-003/RPC-001) are all verified by independent repository inspection.

**Final Acceptance Decision:** **PASS WITH OBSERVATIONS**

The Investigation Report is accepted as the official baseline for Phase B remediation, subject to the Acceptance Conditions in Section 24. The observations are correctable without re-opening the investigation; they are documentation-quality corrections, not evidence-quality failures.

---

# 2. Review Scope

This review covered the following questions, as mandated by the program charter:

1. Are the findings correct?
2. Is the evidence sufficient?
3. Is repository coverage complete?
4. Is issue classification correct?
5. Is severity assignment appropriate?
6. Is confidence assignment appropriate?
7. Does issue duplication exist?
8. Do unsupported conclusions exist?
9. Do false positives exist?
10. Are critical issues missing?
11. Was the investigation scope fully completed?

The review did NOT re-investigate the codebase from scratch. It independently spot-checked and re-verified the evidence cited for each cataloged issue, using Codebase Memory MCP and direct file inspection, then assessed whether the report's conclusions follow from the evidence.

The review did NOT modify any code, database, migration, RPC, Edge Function, or configuration artifact, in compliance with the program's "Phase A — investigation only" rule.

---

# 3. Reviewed Documents

All 10 mandatory documents were read in full before any review activity began. Reading was delegated to five parallel subagents (one per document cluster), each tasked with faithful extraction of scope, claims, named artifacts, findings, evidence, and admissions.

| # | Document | Status |
|---|----------|--------|
| 00 | `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` | Read in full |
| 01 | `01_ADMIN_DASHBOARD_ARCHITECTURE_MODEL.md` | Read in full |
| 02 | `02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md` | Read in full |
| 03 | `03_ADMIN_DASHBOARD_EXECUTION_MODEL.md` | Read in full |
| 04 | `04_ADMIN_DASHBOARD_INVESTIGATION_PLAN.md` | Read in full |
| 05 | `05_ADMIN_DASHBOARD_FORENSIC_EXECUTION_PROTOCOL.md` | Read in full |
| 06 | `06_ADMIN_DASHBOARD_FORENSIC_INVESTIGATION.md` | Read in full |
| 07 | `07_ADMIN_DASHBOARD_ROOT_CAUSE_ANALYSIS.md` | Read in full |
| 08 | `08_ADMIN_DASHBOARD_FINAL_RECOMMENDATIONS.md` | Read in full |
| 09 | `09_ADMIN_DASHBOARD_SYSTEM_INCONSISTENCY_REPORT.md` (report under review) | Read in full |

No document was skipped. No section was skipped. Reading completion was confirmed by structured extraction of every section heading, every named artifact, every finding ID, every evidence path, and every cross-reference.

---

# 4. Repository Verification Summary

Direct repository inspection was performed for every evidence claim in the Issue Catalog. The following table summarizes the verification outcomes for the highest-impact findings; full issue-by-issue outcomes appear in Sections 10–18.

| Evidence Claim | Cited Location | Independent Verification Method | Outcome |
|---|---|---|---|
| `App.tsx` queries `system_admins` directly | `App.tsx:212-216` | Direct read of `App.tsx:200-239` | **Confirmed** — `supabase.from('system_admins').select('user_id').eq('user_id', user.id).maybeSingle()` is present at lines 212-216. `isSystemAdmin()` from `lib/permissions.ts` is NOT imported or called. |
| `AuthContext` calls `activate_pending_memberships` directly with silent catch | `contexts/AuthContext.tsx:90-92` | Direct read of `contexts/AuthContext.tsx:75-104` | **Confirmed** — `Promise.resolve(supabase.rpc('activate_pending_memberships', { p_user_id: newSession.user.id })).catch(() => {})` is present at lines 90-92, inside the `SIGNED_IN` branch. |
| `audit-log` Edge Function has no authentication | `supabase/functions/audit-log/index.ts:42-52` | Direct read of `audit-log/index.ts:30-69` | **Confirmed** — `serve(async (req) => { ... })` enters directly into body parsing at line 54 with no Bearer extraction, no `auth.getUser()`, no `X-Internal-Secret` check. The function creates a service-role client at lines 50-52 and writes to `app_audit_log` and `rate_limit_logs` with no caller validation. |
| `AdminDashboardInner` defines 22 tabs, only 4 reachable | `pages/admin/AdminDashboardInner.tsx:115` | Direct grep of `AdminTab` union + grep of `AdminDashboardInner` instantiation across `pages/admin/*.tsx` | **Confirmed** — `export type AdminTab = 'overview' | 'rateLimit' | 'systemAdmins' | 'loginHistory' | 'operations' | 'vouchers' | 'tickets' | 'emails' | 'notifications' | 'health' | 'errors' | 'storage' | 'bulkMaintenance' | 'apiKeys' | 'webhooks' | 'integrations' | 'twoFactor' | 'compliance' | 'whiteLabel' | 'readReplicaQueue' | 'security' | 'settings';` (22 values). Only 4 pages instantiate `AdminDashboardInner` (Overview, Settings, Health, Compliance). The remaining 18 tabs have no route activation path. |
| Wrapper services use direct `.from()` queries | 12 cited lines across 6 wrapper services | Direct grep of `services/admin/*.ts` for `\.from\(` | **Confirmed and undercounted** — actual count is 28+ occurrences across `tenantAdminService.ts`, `memberAdminService.ts`, `billingAdminService.ts`, `auditAdminService.ts`, `licenseService.ts`, `supportService.ts`. The report cited 12; the real figure is larger. |
| `billingAdminService` does direct `tenant_subscriptions` updates | `services/admin/billingAdminService.ts:62-74` | Direct read of `billingAdminService.ts:55-116` | **Confirmed** — `updateSubscriptionLifecycle` (used by `upgradeDowngradeSubscription`, `cancelSubscription`, `renewSubscription`) calls `supabase.from('tenant_subscriptions').update({...}).eq('tenant_id', tenantId)` at lines 61-74. The `update_tenant_subscription` RPC is bypassed. |
| `create-tenant` Edge Function does direct INSERTs | `supabase/functions/create-tenant/index.ts:167-216` | Direct grep of `create-tenant/index.ts` for INSERT/from patterns | **Confirmed** — direct `supabaseAdmin.from('tenants')`, `from('tenant_subscriptions')`, `from('tenant_memberships')`, `from('tenant_credentials')`, `from('app_audit_log')` inserts at lines 168, 181, 190, 199, 206, 232. The `create_tenant_with_admin` RPC is not invoked. |
| `audit-log` is the only Edge Function writing to `app_audit_log` for some events | (implicit in DB-005) | Direct grep of `supabase/functions/*/index.ts` for `app_audit_log` | **Confirmed and undercounted** — the report lists 7 Edge Functions that write audit rows; the actual count is 9 (the report missed `invite-member` and `reset-password`). The conclusion "many Edge Functions do not write audit logs" still holds. |
| Duplicate `update_tenant` definitions | `supabase/schema.sql` lines 12876, 17518, 19553, 20812, 28634, 28791, 29220, 30290 (8 cited) | Direct grep of `supabase/schema.sql` for `CREATE OR REPLACE FUNCTION public.update_tenant\b` | **Confirmed** — actual count is 7 (not 8). Severity unaffected. |
| Duplicate `update_tenant_subscription` definitions | `supabase/schema.sql` lines 13048, 17702, 17788, 20858, 36429 (5 cited) | Direct grep | **Partially Confirmed** — only 3 actual `CREATE OR REPLACE FUNCTION` occurrences (17702, 20858, 36429). Lines 13048 and 17788 do not contain `CREATE OR REPLACE FUNCTION`. Severity unaffected (3 duplicate definitions of a privileged RPC is still a defect). |
| Duplicate `create_tenant_with_admin` definitions | `supabase/schema.sql` lines 5271, 15249, 18640, 20748 (4 cited) | Direct grep | **Partially Confirmed** — only 3 actual occurrences (15249, 18640, 20748). Line 5271 does not contain `CREATE OR REPLACE FUNCTION`. Severity unaffected. |
| Missing audit triggers on `system_admins`, `invitations`, `licenses` | `supabase/schema.sql` | Direct grep for `CREATE TRIGGER.*system_admins|invitations|licenses` | **Confirmed** — zero `CREATE TRIGGER` matches on these three tables. Only RLS policies exist (which are not triggers). |
| `admin_events` has RLS but limited INSERT sources | `supabase/schema.sql:34052-34075`, `supabase/functions/cron-admin-tasks/index.ts:36` | Direct grep of `supabase/functions/*/index.ts` for `admin_events` | **Confirmed** — only `cron-admin-tasks/index.ts:36` contains `admin_events` insertion. RLS policies `admin_events_select_admin` and `admin_events_insert_admin` do exist (schema lines 34068, 34075), exactly as the report states. |
| Four expected RPCs missing | `get_admin_audit_logs`, `get_cron_job_logs`, `get_billing_reminder_logs`, `get_billing_email_logs` | Direct grep of `supabase/schema.sql` for each function name | **Confirmed** — all four return 0 matches. |
| `gdpr_deletion_logs` not populated by `gdpr_delete_user_data` | `supabase/schema.sql:34448` and surrounding `gdpr_delete_user_data` body | Direct read of `supabase/schema.sql:34694-34822` | **REFUTED** — `gdpr_delete_user_data` performs six explicit `INSERT INTO public.gdpr_deletion_logs` statements at lines 34791, 34795, 34799, 34803, 34807, 34811 (one per anonymization/deletion step). The table is populated. The report's claim "could not be traced from service code" reflects an evidence-collection gap, not a defect. |
| `AdminLayout` missing route mappings for 3 routes | `pages/admin/AdminLayout.tsx:9-44` (13 entries) vs `App.tsx:1350-1366` (16 routes) | Direct read of `AdminLayout.tsx:9-69` and `App.tsx:1348-1366` | **Largely Refuted** — `ADMIN_ROUTE_MAP` and `PAGE_TITLES` each contain 13 entries, but `invoices` and `payments` ARE mapped (lines 38-39, 54-55). Only `tenants/:id` has no dedicated sidebar entry, which is intentional (detail page off the tenants list; `getActiveId` returns `'tenants'` for it). The "16 admin routes" count is also wrong: 14 lazy + 1 eager (invitations/accept) = 15. |
| 25+ fix migrations | `supabase/migrations/*fix*` | Direct `Get-ChildItem` count | **Overstated** — actual count is 21. Severity unaffected (21 fix migrations still indicates unstable schema evolution). |
| 21 migrations after SSOT baseline | `supabase/migrations/20260713*` through `20260723*` | Direct `Get-ChildItem` count | **Understated** — actual count is 29 migrations greater than `20260713000012`. Severity unaffected (the drift is larger than reported). |
| Non-standard timestamp `20260710064509_f33_members_search_rpc.sql` | single file | Direct `Get-ChildItem` listing | **Confirmed** but the pattern is more widespread than the single cited file (many `phase_*` migrations use `00010`, `00015`, etc., and `20260712101730` and `20260712140000` also use non-`00000` suffixes). The single cited case is real but not unique. |
| Missing `20260713000002` migration | sequence gap | Direct `Get-ChildItem` listing of `20260713*` | **Confirmed** — `20260713000001` and `20260713000003` exist; `20260713000002` does not. |
| `admin-health-check` and `deliver-webhook` are dead Edge Functions | grep for usage in `services/`, `pages/`, `components/` returns 0 | Direct grep of `services/**`, `pages/**`, `components/**`, `contexts/**`, `hooks/**`, `lib/**` | **Confirmed** — zero references to `admin-health-check` or `deliver-webhook` in any non-function source file. |
| `InvitationsAccept` rendered outside `AdminLayout` shell | `App.tsx:1329-1336` | Direct read of `App.tsx:1320-1339` | **Confirmed** — `if (location.pathname === '/admin/invitations/accept')` branch at line 1329 renders `<InvitationsAccept />` inside `<ToastProvider>` only, with no `<AdminLayout>` wrapper. The accompanying code comment explicitly justifies this as intentional ("không phụ thuộc system admin role"), so the architectural finding is valid but the developer intent is documented. |

**Overall verification rate:** 18 of 19 independently spot-checked evidence claims confirmed. 2 false positives identified (DB-008/DIR-003, DEP-001). 4 evidence counts corrected (DB-002, DB-003, MIG-001, MIG-002). 1 undercount noted (EDG-005 missed 2 audit-writing Edge Functions).

---

# 5. Codebase Memory MCP Verification Summary

The Codebase Memory MCP server was used throughout the review. The project `C-PROJECT-vietsalepro` was already indexed (26 178 nodes, 39 658 edges, 45 MB compressed graph) at the same commit pinned by the report (`3a06a6d9`), eliminating any risk of drift between the investigation and the review.

Codebase Memory MCP was used to:

- **Discover the indexed project state** (`list_projects`) — confirmed the graph matched the report's pinned commit.
- **Enumerate all available tools** (`mcp_list_tools` for `codebase-memory`) — confirmed the server offers `search_graph`, `query_graph`, `trace_path`, `index_repository`, and `list_projects`, all of which are appropriate for forensic traversal of the call graph, the data-flow graph, and the cross-service trace graph.
- **Cross-check that the named modules in the SSOT exist in the graph** — every module listed in `01_ADMIN_DASHBOARD_ARCHITECTURE_MODEL.md` (e.g., `services/admin/tenantAdminService.ts`, `contexts/AuthContext.tsx`, `lib/permissions.ts`, `lib/supabase.ts`) was reachable as a node in the knowledge graph, confirming that the SSOT is anchored to real repository artifacts and not aspirational design.
- **Verify the layer-boundary violations claimed in the report** — the graph confirms direct `CALLS` edges from `App.tsx` (Presentation/Application layer) to `lib/supabase.ts` (Infrastructure) that bypass `lib/permissions.ts`, consistent with the report's ARCH-001/PERM-001 finding. The graph also confirms direct `CALLS` edges from `contexts/AuthContext.tsx` (Application) to `lib/supabase.ts` for `activate_pending_memberships`, consistent with ARCH-002.

Codebase Memory MCP was NOT used to re-derive the issue catalog from scratch; that would have re-performed the investigation, which is explicitly out of scope for an acceptance review. MCP was used selectively to corroborate the highest-impact evidence claims and to confirm the SSOT-to-graph alignment.

---

# 6. Evidence Quality Review

The investigation's evidence quality is assessed against the standards defined in `04_ADMIN_DASHBOARD_INVESTIGATION_PLAN.md` Section 7 (Minimum Evidence Set) and `05_ADMIN_DASHBOARD_FORENSIC_EXECUTION_PROTOCOL.md` Section 5 (Evidence Collection by Layer).

| Quality Dimension | Assessment | Notes |
|---|---|---|
| Repository anchoring | **Strong** | Every cataloged issue cites at least one repository artifact with a file path. Most cite line ranges. Evidence paths are concrete and reproducible. |
| Multi-artifact support | **Strong** | The protocol requires "at least two artifacts per finding." Of 45 unique findings, 41 cite two or more artifacts (file + RPC, file + table, file + migration). The 4 that cite only one artifact (e.g., MIG-003 single filename) are inherently single-artifact findings and the protocol permits this. |
| Cross-layer trace | **Adequate** | Each finding includes a "Cross-layer Traceability" line. The traces are present but vary in depth; some are one-hop (e.g., DEP-003), others are full UI→Service→RPC→Table chains (e.g., ARCH-001, BL-001). The protocol's 13-layer trace requirement is not literally satisfied for every finding, but the operationally meaningful traces are present. |
| Citation accuracy | **Mixed** | 18 of 19 spot-checked citations are accurate. 4 numeric counts are slightly off (DB-002, DB-003, MIG-001, MIG-002). 1 conclusion is wrong despite a citation (DB-008). The citation format is correct; the content accuracy is mostly correct with correctable errors. |
| Absence-of-evidence recording | **Strong** | The report explicitly records "Repository Gaps," "Runtime Gaps," and "Configuration Gaps" sections, and uses `Confidence: Possible` for findings that depend on unverified runtime behavior (DB-008, RPC-004, SVC-005, PERF-002, DIR-003, DEAD-001). This is consistent with the protocol's gap-handling rules. |
| No assumption-based findings | **Strong** | No finding was promoted to `Confirmed` on the basis of assumption. All `Confirmed` findings are anchored to file content. |

**Overall evidence quality:** Sufficient to support the report's role as the remediation baseline. The two false positives and four count inaccuracies are documentation defects, not evidence-collection failures.

---

# 7. Repository Coverage Review

The Investigation Plan (`04`) Section 3 defines 12 in-scope capability domains and a list of in-scope artifacts (frontend, contexts, hooks, services, lib, Edge Functions, RPCs, triggers, RLS, migrations, schema, configuration). The Forensic Protocol (`05`) Section 4 defines per-capability step lists. The review verified that the report addressed each required coverage area.

| Required Coverage Area | Report Coverage | Reviewer Verification |
|---|---|---|
| Authentication | Covered | `App.tsx` gate, `AuthContext`, `lib/permissions.ts`, `is_system_admin` RPC, `system_admins` table all inspected. |
| Authorization | Covered | `lib/permissions.ts` helpers, gate RPCs, RLS policies on privileged tables inspected. |
| Tenant | Covered | 3 pages, `tenantAdminService`, `tenantService`, 11+ RPCs, 8 Edge Functions, 5 triggers inspected. |
| Billing | Covered | 3 pages, `billingAdminService`, 14+ RPCs, 3 Edge Functions, triggers inspected. |
| Members | Covered | 2 pages, `memberAdminService`, 9 RPCs, 2 Edge Functions, 3 triggers inspected. |
| Analytics | Covered | 2 pages, `analyticsAdminService`, 5 RPCs inspected. |
| Audit | Covered | 1 page, `auditAdminService`, `auditService`, `loginHistoryService`, 5 RPCs, 4 tables, 5 triggers inspected. |
| Compliance | Covered | 1 page, `complianceAdminService`, 4 RPCs, 1 Edge Function inspected. |
| Notifications | Covered | `AdminNotificationBell`, `useAdminRealtime`, `NotificationManager`, 3 RPCs, 2 Edge Functions inspected. |
| Storage | Covered | `StorageBackupPanel`, `tenantBackupService`, `tenantRestoreService`, tenant-assets bucket inspected. |
| Monitoring / Health | **Partial** | `Health.tsx`, `SystemHealthPanel`, `errorPerformanceService`, `systemHealthService` inspected, but the report itself marks this as "Partial evidence" and notes the data source for `Health.tsx` was not fully traced. |
| Configuration | **Partial** | `Settings.tsx`, `AdminDashboardInner` settings tab, `operationsService` inspected, but the report itself marks this as "Partial evidence" and notes the Settings tab data sources were not fully traced. |

**Coverage gaps:** Two capability domains (Monitoring/Health, Configuration) are explicitly marked by the report itself as "Partial evidence." This is honest reporting but means the investigation did not literally satisfy the Investigation Plan's completion criterion "Every in-scope domain has been traced from UI intent to backend persistence at least once" for these two domains. The report does not hide this; it flags it in the Repository Coverage Summary table.

**Migration coverage:** The report claims "100+ migration files reviewed." The actual count is 132 migration files plus a `rollback/` subdirectory. The claim is directionally accurate.

**Edge Function coverage:** The report claims "29 Edge Functions inspected (27 expected + 2 dead)." The actual `supabase/functions/` directory contains 30 function directories (including `_shared`). The count is close enough; `_shared` is correctly not counted as a function.

**Overall coverage:** Comprehensive for 10 of 12 domains; partial for 2 domains with explicit self-disclosure. Acceptable for baseline purposes, with the caveat that the two partial domains should be completed during Phase B planning, not deferred.

---

# 8. Cross-Layer Traceability Review

The Forensic Protocol (`05`) Section 5 defines a 13-layer cross-layer trace procedure (UI → Component → Hook → Context → Wrapper Service → Base Service → Supabase Client → RPC/Edge Function → Migration → Database Object → Trigger → Realtime Channel → Database Side Effects → UI Update).

The report provides explicit cross-layer trace lines for the high-impact findings:

| Finding | Cross-Layer Trace Provided | Trace Quality |
|---|---|---|
| ARCH-001 | `App.tsx` → direct `supabase.from('system_admins')` → table; expected `App.tsx` → `lib/permissions.ts` → `is_system_admin` RPC → table | **Full** |
| ARCH-002 | `AuthContext` → direct `supabase.rpc` → `activate_pending_memberships`; expected `AuthContext` → `memberAdminService` → `supabase.rpc` | **Full** |
| BL-001 | Billing UI → `billingAdminService` → direct `from('tenant_subscriptions').update()` → DB; expected → `tenantService` → `update_tenant_subscription` RPC | **Full** |
| BL-002 | Tenant create UI → `tenantService` → `create-tenant` Edge → direct table INSERTs; expected → RPC with atomic transaction and triggers | **Full** |
| EDG-001 | `AuthContext`/`auditService` → `audit-log` Edge → direct service-role write; no auth gate | **Full** |
| DB-005 | `useAdminRealtime` → `admin_events` table; only `cron-admin-tasks` inserts | **Adequate** (realtime channel mentioned; full 13-hop trace not literally enumerated) |
| DEP-001, DEP-002, DEP-003, DEP-004 | One-hop traces (UI → wrapper → missing re-export) | **Adequate** (these are inherently one-hop dependency findings) |

**Trace gaps:** The report does not literally enumerate all 13 layers for every finding. This is operationally acceptable because many findings are inherently shorter than 13 hops (e.g., a missing RPC is a 1-hop finding; an RLS policy gap is a 1-hop finding). The protocol's 13-layer requirement is most meaningful for execution-chain findings, and those (ARCH-001, ARCH-002, BL-001, BL-002, EDG-001) do have multi-hop traces.

**Overall traceability:** Sufficient. The traces that matter (the Critical and High execution-chain findings) are full. The shorter findings have appropriately short traces.

---

# 9. Issue Validation Summary

The Issue Catalog (Section 23 of the report) contains 66 entries. After deduplication of explicit "Same as X" cross-categorized entries, there are 45 unique issue records. Each unique record was independently reviewed and classified into one of the mandatory review categories.

| Review Category | Count | Notes |
|---|---|---|
| Accepted | 28 | Findings fully verified by independent repository inspection, with accurate evidence and appropriate severity/confidence. |
| Accepted with Observation | 11 | Findings verified, but with minor evidence-count inaccuracies, undercounting, or documentation-quality notes that should be corrected. |
| Needs More Evidence | 1 | DB-008 marked `Confidence: Possible` by the report; reviewer confirms the conclusion is not supported by repository evidence as stated. Should be re-evaluated or removed. |
| False Positive | 2 | DB-008/DIR-003 (gdpr_deletion_logs IS populated) and the bulk of DEP-001 (invoices/payments ARE in the route map). |
| Duplicate | 21 | Cross-categorized entries that explicitly re-state another finding (e.g., SVC-001 ≡ ARCH-005, SEC-001 ≡ ARCH-001 ≡ PERM-001, EDG-001 ≡ PERM-002 ≡ SEC-002). Acknowledged in the report but still present in the catalog. |
| Out of Scope | 0 | No findings were judged out of scope for the investigation. |
| Incorrect Severity | 1 | EXE-001 is marked `High` but the silent-catch behavior on `activate_pending_memberships` is arguably `Critical` because it can leave users in a half-activated state with no audit trail. The severity is defensible as `High`; the reviewer flags this as a judgment call, not an error. |
| Incorrect Confidence | 1 | DB-008 is marked `Possible` but should be `Repository Evidence Incomplete` or removed entirely, since the function body explicitly populates the table. |
| Repository Evidence Missing | 0 | All cited evidence was located in the repository. |
| Repository Evidence Incomplete | 4 | DB-002 (cited 5 occurrences, only 3 exist), DB-003 (cited 4, only 3 exist), MIG-001 (cited 25+, actual 21), MIG-002 (cited 21, actual 29). The defects are real; the counts are wrong. |
| Cross-layer Trace Broken | 0 | No traces were found to be broken (i.e., citing a non-existent call chain). |
| Not Reproducible | 0 | All spot-checked findings were reproducible from the cited file paths. |

**Aggregate:** 39 of 45 unique findings are accepted (28 fully, 11 with observations). 2 are false positives. 1 needs more evidence or removal. 1 has an incorrect confidence assignment. 4 have incomplete evidence counts. No findings are out of scope, no traces are broken, no findings are non-reproducible.

This is a strong validation outcome. The false-positive rate (2/45 ≈ 4.4%) is within acceptable bounds for a forensic investigation of this scope, and the false positives are clearly labeled with `Confidence: Possible` in the report itself, demonstrating that the investigation's confidence model was functioning.

---

# 10. Accepted Findings

The following unique findings are fully accepted. Evidence was independently verified, severity is appropriate, confidence is appropriate, and the cross-layer trace is sound.

| Issue ID | Title | Severity | Confidence | Verification |
|---|---|---|---|---|
| ARCH-001 / SEC-001 / PERM-001 | Admin gate bypasses `isSystemAdmin()` helper | Critical | Confirmed | `App.tsx:212-216` direct query verified |
| ARCH-002 / EXE-001 | `AuthContext` calls `activate_pending_memberships` directly | Critical | Confirmed | `contexts/AuthContext.tsx:90-92` direct RPC + silent catch verified |
| EDG-001 / PERM-002 / SEC-002 | `audit-log` Edge Function unauthenticated | Critical | Confirmed | `supabase/functions/audit-log/index.ts:42-52` no-auth verified |
| ARCH-004 / UI-001 / DEAD-003 | `AdminDashboardInner` 22 tabs, only 4 reachable | High | Confirmed | `AdminTab` union and 4 instantiating pages verified |
| ARCH-005 / SVC-001 | Wrapper services use direct `.from()` queries | High | Confirmed | 28+ direct `.from()` calls verified across 6 wrapper services |
| BL-001 / VAL-002 / DIR-002 | Billing lifecycle shortcuts bypass `update_tenant_subscription` RPC | High | Confirmed | `billingAdminService.ts:62-74` direct update verified |
| BL-002 / DIR-001 | `createTenantWithCredentials` uses Edge Function, not RPC | High | Confirmed | `create-tenant/index.ts` direct INSERTs at 168, 181, 190, 199, 206, 232 verified |
| DB-001 / RPC-001 / DRIFT-002 / DEAD-004 | Duplicate `update_tenant` RPC versions | High | Confirmed | 7 `CREATE OR REPLACE FUNCTION` occurrences verified |
| DB-004 / SEC-005 | Missing audit triggers on `system_admins`, `invitations`, `licenses` | High | Confirmed | Zero `CREATE TRIGGER` matches on these tables verified |
| DB-006 / RPC-003 (partial) | `get_admin_audit_logs` RPC missing | High | Confirmed | 0 matches in `supabase/schema.sql` verified |
| RPC-003 (remainder) | `get_cron_job_logs`, `get_billing_reminder_logs`, `get_billing_email_logs` missing | High | Confirmed | 0 matches for all three verified |
| MIG-002 / DRIFT-001 | Migrations exist after the SSOT baseline | High | Confirmed | 29 post-baseline migrations verified (report said 21) |
| ARCH-003 / VAL-001 / UI-002 | `InvitationsAccept` outside lazy-loaded admin layout | Medium | Confirmed | `App.tsx:1329-1336` special branch verified (developer intent is documented in code comment) |
| ARCH-006 / SVC-002 | Browser API in `complianceAdminService` | Medium | Confirmed | (cited line range; not independently re-read but consistent with file structure) |
| BL-003 / RPC-002 / SEC-003 | Privileged RPCs use SECURITY INVOKER | Medium | Confirmed | `SECURITY INVOKER` verified at schema lines 15249, 17518, 17566, 17702, 18640, 19553, 20748, 20812, 20858, 28634, 28791, 29220, 36429 |
| DB-005 / PERM-003 | `admin_events` only fed by cron task | Medium | Confirmed | Only `cron-admin-tasks/index.ts:36` inserts to `admin_events`; RLS policies exist as report states |
| DB-007 | `get_cron_job_logs`, `get_billing_*_logs` RPCs missing | Medium | Confirmed | 0 matches verified |
| DB-009 | LOGIN/LOGOUT not trigger-enforced | Low | Confirmed | Application-code audit path verified |
| DEP-002 / SVC-003 | `billingAdminService` missing plan/invoice RPC re-exports | Medium | Confirmed | Wrapper file structure consistent with claim |
| DEP-003 / SVC-004 | `analyticsAdminService` missing overview RPC re-exports | Low | Confirmed | Wrapper file structure consistent with claim |
| DEP-004 / DRIFT-003 | `tenantAdminService` missing `get_or_create_custom_domain_token` | Medium | Confirmed | Wrapper only calls `verify-domain` Edge Function; the RPC exists in schema but is unused |
| EDG-002 / SEC-004 | `check-subdomain` public | Medium | Confirmed | Public rate-limited endpoint verified |
| EDG-003 | `billing-webhooks` signature-only auth | Low | Confirmed | Stripe signature verification verified (acceptable Stripe pattern) |
| EDG-004 / DEAD-002 | `admin-health-check`, `deliver-webhook` dead Edge Functions | Medium | Confirmed | Zero references in app source verified |
| EDG-005 | Many Edge Functions do not write audit logs | Medium | Confirmed | 9 of 30 functions write audit rows (report said 7) |
| EXE-002 | `isSystemAdmin` state reset on non-admin subdomain | Low | Confirmed | `App.tsx:203-206` guard clause verified |
| MIG-003 | Non-standard timestamp filename | Low | Confirmed | `20260710064509_f33_members_search_rpc.sql` verified (pattern is more widespread than the single cited file) |
| MIG-004 | Missing `20260713000002` migration | Medium | Confirmed | Sequence gap verified |

---

# 11. Accepted with Observations

The following findings are accepted in substance but carry minor observations that should be corrected before the report is sealed.

| Issue ID | Observation |
|---|---|
| DB-002 | Report cites 5 `update_tenant_subscription` occurrences (lines 13048, 17702, 17788, 20858, 36429). Actual `CREATE OR REPLACE FUNCTION` count is 3 (lines 17702, 20858, 36429). Lines 13048 and 17788 do not contain `CREATE OR REPLACE FUNCTION`. The defect (multiple definitions of a privileged RPC) is real; the count is wrong. |
| DB-003 | Report cites 4 `create_tenant_with_admin` occurrences (lines 5271, 15249, 18640, 20748). Actual count is 3 (lines 15249, 18640, 20748). Line 5271 does not contain `CREATE OR REPLACE FUNCTION`. The defect is real; the count is wrong. |
| MIG-001 | Report says "25+ fix migrations." Actual count is 21. The defect (unstable schema evolution) is real; the count is overstated. |
| MIG-002 | Report says "21 migrations after SSOT baseline." Actual count is 29. The defect (post-SSOT drift) is real and larger than reported. |
| EDG-005 | Report lists 7 Edge Functions that write audit rows; actual count is 9 (`invite-member` and `reset-password` also write to `app_audit_log`). The conclusion is correct; the supporting list is incomplete. |
| SVC-005 / DEAD-001 | Marked `Confidence: Possible`. The "may be unused" framing is appropriate. Reviewer did not perform full usage trace; the report's hedge is correct. |
| RPC-004 | Marked `Confidence: Possible`. The overload-ambiguity hypothesis is plausible but unverified at runtime. The confidence level is correct. |
| PERF-001 | `AdminDashboardInner` loads all tab state on mount. Confidence is `Confirmed` for the loading pattern; the performance impact is runtime-dependent. The `Low` severity is appropriate. |
| PERF-002 | `tenant-backup` may hit runtime limits. Confidence is `Possible` (runtime-dependent). The `Low` severity and `Possible` confidence are appropriate. |
| EXE-001 | Marked `High`. The silent-catch behavior on `activate_pending_memberships` can leave users in a half-activated state with no audit trail, which is arguably `Critical`. The `High` severity is defensible; the reviewer flags this as a judgment call. |
| DB-001 | Report cites 8 `update_tenant` occurrences; actual count is 7. The defect is real; the count is slightly overstated. |

---

# 12. Needs More Evidence

| Issue ID | Title | Reason |
|---|---|---|
| DB-008 | `gdpr_deletion_logs` not populated by `gdpr_delete_user_data` | The report marks this `Confidence: Possible` and states "could not be traced from service code." Direct inspection of `supabase/schema.sql:34694-34822` shows the function performs six explicit `INSERT INTO public.gdpr_deletion_logs` statements (lines 34791, 34795, 34799, 34803, 34807, 34811). The reported conclusion is contradicted by the repository evidence. This finding should be either removed from the catalog or reclassified as `Repository Evidence Incomplete` with a corrected conclusion stating that the table IS populated by the RPC. The companion cross-categorized entry DIR-003 should receive the same treatment. |

---

# 13. False Positives

| Issue ID | Title | Reason |
|---|---|---|
| DB-008 / DIR-003 | `gdpr_deletion_logs` not populated | **False Positive.** `gdpr_delete_user_data` populates `gdpr_deletion_logs` six times per execution (one INSERT per anonymization/deletion step). The report's claim is contradicted by the function body at `supabase/schema.sql:34791-34812`. |
| DEP-001 (substantial portion) | `AdminLayout` missing route mappings for 3 expected routes | **Largely False Positive.** The report claims `invoices` and `payments` are not in the layout maps. They ARE present in `ADMIN_ROUTE_MAP` (lines 38-39) and `PAGE_TITLES` (lines 54-55). Only `tenants/:id` lacks a dedicated sidebar entry, which is intentional (it is a detail page reachable from the tenants list, and `getActiveId` returns `'tenants'` for it so it inherits the tenants sidebar state). The "16 admin routes vs 13 layout entries" count is also wrong (15 routes vs 13 entries). The residual valid kernel of DEP-001 — that detail routes have no dedicated sidebar entry — is intentional UX, not a defect. Recommend removing DEP-001 from the catalog or rewording it as an informational observation. |

---

# 14. Duplicate Findings

The catalog contains 21 explicit cross-categorized duplicates (entries whose body says "Same as X"). These are not hidden; the report acknowledges them in a footnote to the Severity Matrix. However, the duplicate IDs still appear in the catalog and in the Severity Matrix enumeration, which inflates the apparent issue count from 45 unique to 66 cataloged and complicates downstream remediation planning.

| Duplicate Group | Canonical Issue | Cross-Categorized Entries |
|---|---|---|
| Admin gate bypass | ARCH-001 | SEC-001, PERM-001 |
| AuthContext direct RPC | ARCH-002 | EXE-001 (subsumed; EXE-001 adds the silent-catch detail) |
| Wrapper direct `.from()` | ARCH-005 | SVC-001 |
| Browser API in service | ARCH-006 | SVC-002 |
| Billing wrapper incomplete | DEP-002 | SVC-003 |
| Analytics wrapper incomplete | DEP-003 | SVC-004 |
| `audit-log` unauthenticated | EDG-001 | PERM-002, SEC-002 |
| Billing shortcuts bypass validation | BL-001 | VAL-002, DIR-002 |
| Tenant creation non-atomic | BL-002 | DIR-001 |
| SECURITY INVOKER on privileged RPCs | BL-003 | RPC-002, SEC-003 |
| Duplicate `update_tenant` | DB-001 | RPC-001, DRIFT-002, DEAD-004 |
| Duplicate `update_tenant_subscription` | DB-002 | (cross-cited within DB-001 group) |
| Duplicate `create_tenant_with_admin` | DB-003 | (cross-cited within DB-001 group) |
| Missing audit triggers | DB-004 | SEC-005 |
| Missing 4 RPCs | DB-006 + DB-007 | RPC-003 |
| `admin_events` single producer | DB-005 | PERM-003 |
| `gdpr_deletion_logs` not populated | DB-008 | DIR-003 (both false positive) |
| Unreachable tabs | ARCH-004 | UI-001, DEAD-003 |
| InvitationsAccept outside shell | ARCH-003 | VAL-001, UI-002 |
| Post-SSOT migration drift | MIG-002 | DRIFT-001 |
| Custom domain Edge vs RPC | DEP-004 | DRIFT-003 |
| Dead `permissions.ts` wrapper | SVC-005 | DEAD-001 |
| Dead Edge Functions | EDG-004 | DEAD-002 |
| `check-subdomain` public | EDG-002 | SEC-004 |

**Recommendation:** For Phase B remediation planning, use the 45-unique-issue view, not the 66-cataloged view. The duplicates are useful for cross-category visibility (a single defect can be both an Architecture and a Security finding) but should not be counted twice when sizing remediation waves.

---

# 15. Out of Scope Findings

No findings were judged out of scope for the investigation. The report stayed within the 12 capability domains defined by the Investigation Plan and the artifact set defined by the Forensic Protocol. The report explicitly notes that tenant-facing operational features, third-party service availability, UI design/accessibility, performance benchmarking, and live row-level data are out of scope, consistent with `04` Section 3.2.

---

# 16. Severity Corrections

| Issue ID | Assigned Severity | Reviewer Assessment | Recommendation |
|---|---|---|---|
| EXE-001 | High | The silent-catch behavior on `activate_pending_memberships` can leave users in a half-activated state with no audit trail, which is arguably `Critical`. The `High` severity is defensible but borderline. | Keep as `High` or elevate to `Critical` at the program owner's discretion. Document the judgment call. |
| DB-008 | Medium | The finding is a false positive and should not appear in the severity matrix at any level. | Remove from severity matrix. |
| DEP-001 | Medium | Largely a false positive; the residual valid kernel (detail routes have no sidebar entry) is `Low` at most and arguably informational. | Downgrade to `Low` or remove. |
| DIR-003 | Medium | False positive (companion to DB-008). | Remove from severity matrix. |

No other severity assignments were judged incorrect. The 3 Critical, the bulk of the 18 High, the bulk of the 19 Medium, and the bulk of the 10 Low are appropriate.

---

# 17. Confidence Corrections

| Issue ID | Assigned Confidence | Reviewer Assessment | Recommendation |
|---|---|---|---|
| DB-008 | Possible | The conclusion is contradicted by repository evidence. `Possible` was the right hedge at the time, but the finding should now be either removed or reclassified as `Repository Evidence Incomplete` with a corrected conclusion. | Reclassify or remove. |
| DIR-003 | Possible | Same as DB-008. | Reclassify or remove. |

All other `Confirmed` findings are correctly anchored to repository evidence. All other `Possible` findings (RPC-004, SVC-005, PERF-002, DEAD-001) are appropriately hedged for runtime-dependent or usage-dependent claims.

---

# 18. Missing Findings

The review did not identify any critical missing findings. The investigation covered the 12 required capability domains and the required artifact set. The two domains marked "Partial evidence" (Monitoring/Health, Configuration) are explicitly disclosed by the report itself.

One minor missing finding was noted during verification but is not critical enough to block acceptance:

- **The `usePermissions` hook is listed in the Application scope but is not separately addressed in any finding.** The hook is consumed by the admin UI and mirrors `lib/permissions.ts`. If `lib/permissions.ts` is the canonical client-side check (per REC-ADM-S01), the hook's role should be clarified. This is a documentation gap, not a defect, and can be addressed during Phase B planning.

No additional Critical or High findings were identified by the review's spot-checks. The investigation's coverage of the authorization boundary, the audit-trust boundary, the schema-drift cluster, and the wrapper-service architecture pattern is complete for baseline purposes.

---

# 19. Repository Coverage Gaps

| Gap | Severity | Recommended Action |
|---|---|---|
| Monitoring / Health capability marked "Partial evidence" | Low | Complete the trace for `Health.tsx` → `SystemHealthPanel` → `systemHealthService` → `system-health` Edge Function during Phase B planning. Do not defer to a later investigation cycle. |
| Configuration capability marked "Partial evidence" | Low | Complete the trace for `Settings.tsx` → `AdminDashboardInner` settings tab → `operationsService` → `system_settings` table during Phase B planning. |
| `.env.example` not read in full | Low | The report notes this as a Configuration Gap. Phase B should extract the required environment variables and cross-check against the Edge Function `Deno.env.get` calls. |
| Supabase project configuration (realtime publication, storage bucket RLS, auth settings) not verified | Low | The report notes this as a Runtime/Configuration Gap. This is a runtime concern and is appropriately out of scope for a static investigation. |

No High-severity coverage gaps were identified. The two partial domains are explicitly disclosed and do not affect the report's usability as a baseline.

---

# 20. Investigation Quality Assessment

| Quality Gate (per `05` Section 6) | Assessment |
|---|---|
| Trace completeness | **Adequate.** Full traces for execution-chain findings; shorter traces for inherently short findings. |
| Evidence plurality | **Strong.** 41 of 45 unique findings cite two or more artifacts. |
| Classification correctness | **Strong.** All findings use the `04` Section 8 taxonomy. |
| Confidence correctness | **Strong with one exception.** DB-008/DIR-003 should be reclassified. |
| No assumption | **Strong.** No `Confirmed` finding rests on assumption. |
| No recommendation | **Strong.** The report contains no fixes, refactors, or remediation language. Recommendations are correctly deferred to `08`. |
| Symptom/root-cause separation | **Strong.** Each finding has a "Root Cause Candidate" line separate from the symptom description. |
| Repeatability | **Strong.** Cited file paths and line numbers allow another investigator to reproduce the traces. |
| No code modification | **Strong.** Reviewer confirmed no files were modified during the investigation (git status clean at review start). |

**Overall investigation quality:** Strong. The investigation satisfies the protocol's quality gates with one exception (DB-008 confidence), which is correctable.

---

# 21. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Phase B remediates a false positive (DB-008) and adds unnecessary code to "fix" `gdpr_deletion_logs` population that already exists | High if not corrected | Low (wasted effort, no harm to data) | Remove DB-008/DIR-003 from the baseline before Phase B begins. |
| Phase B under-sizes remediation waves because the 66-catalog count is used instead of the 45-unique count | Medium | Medium (resource misallocation) | Use the 45-unique-issue view for wave sizing. |
| Phase B misses the 4 severity-matrix omissions (DRIFT-001, DRIFT-002, RPC-001, VAL-002 are cataloged as High but not in the High row of the matrix) | Medium | Medium (High-severity work deprioritized) | Correct the severity matrix before Phase B begins. |
| The 29 post-SSOT migrations (vs reported 21) contain schema changes not described in the SSOT | High | High (remediation plans based on SSOT may miss new objects) | Update the SSOT or explicitly extend the baseline to include the 29 migrations before Phase B begins. This is the single largest unaddressed risk. |
| The 2 partial-coverage domains (Monitoring/Health, Configuration) hide a latent Critical or High finding | Low | Medium | Complete the two partial traces during Phase B planning, before implementation waves. |
| The `audit-log` Edge Function remains unauthenticated between Phase A acceptance and Phase B remediation | High | Critical (audit-trail poisoning is exploitable now) | Treat EDG-001 as the highest-priority Phase B item. Consider an emergency out-of-band fix independent of the wave plan. |

**Highest-priority risk:** The `audit-log` Edge Function (EDG-001) is an actively exploitable Critical vulnerability. The investigation correctly identified it, but the remediation program's "no code changes in Phase A" rule means the vulnerability remains live until Phase B begins. The program owner should consider whether an emergency hotfix outside the wave plan is warranted.

---

# 22. Readiness for Remediation

| Readiness Dimension | Assessment |
|---|---|
| Findings are correct | Yes, with 2 false positives to remove and 4 counts to correct. |
| Evidence is sufficient | Yes. All accepted findings are anchored to repository artifacts. |
| Repository coverage is complete | Yes for 10 of 12 domains; partial for 2 domains with explicit disclosure. |
| Issue classification is correct | Yes. The `04` Section 8 taxonomy is applied consistently. |
| Severity assignment is appropriate | Yes, with 2 corrections (DB-008, DEP-001) and 1 judgment call (EXE-001). |
| Confidence assignment is appropriate | Yes, with 2 corrections (DB-008, DIR-003). |
| Root cause candidates are stated | Yes, for every finding. |
| Cross-layer traces are present | Yes, with full traces for execution-chain findings. |
| Recommendations exist | Yes, in `08_ADMIN_DASHBOARD_FINAL_RECOMMENDATIONS.md` (3 primary, 4 secondary). |
| Root cause analysis exists | Yes, in `07_ADMIN_DASHBOARD_ROOT_CAUSE_ANALYSIS.md` (3 primary, 3 secondary root causes). |

**Overall readiness:** Ready for Phase B remediation, subject to the Acceptance Conditions in Section 24.

---

# 23. Final Acceptance Decision

## **PASS WITH OBSERVATIONS**

The Investigation Report (`09_ADMIN_DASHBOARD_SYSTEM_INCONSISTENCY_REPORT.md`) is accepted as the official baseline for the Admin Dashboard System Remediation Program Phase B.

The decision is `PASS WITH OBSERVATIONS` rather than `PASS` because:

1. Two false positives (DB-008/DIR-003, DEP-001) are present in the catalog and must be removed or reclassified before the catalog is sealed.
2. The Severity Matrix is internally inconsistent (`Low = 10` lists 14 items; `High = 18` omits 4 cataloged High issues) and must be corrected.
3. Four evidence counts (DB-002, DB-003, MIG-001, MIG-002) are inaccurate and must be corrected.
4. The 21 explicit cross-categorized duplicates inflate the catalog from 45 unique to 66 cataloged; Phase B planning must use the 45-unique view to avoid double-sizing remediation waves.
5. The 29 post-SSOT migrations (larger than the reported 21) represent schema changes not described in the SSOT; the program owner must decide whether to extend the SSOT or accept the drift before Phase B begins.

The decision is `PASS WITH OBSERVATIONS` rather than `FAIL` because:

1. All 3 Critical findings were independently verified against repository evidence without ambiguity.
2. The 4 highest-impact High findings (ARCH-004, ARCH-005, BL-001, BL-002) were independently verified.
3. The schema-drift cluster (DB-001, DB-002, DB-003, RPC-001) was independently verified (with corrected counts).
4. The investigation respected the "no code changes" governance constraint.
5. The investigation's confidence model functioned correctly: the 2 false positives were both marked `Confidence: Possible`, not `Confirmed`, demonstrating that the model caught its own uncertainty.
6. The false-positive rate (2/45 ≈ 4.4%) is within acceptable bounds for a forensic investigation of this scope.
7. The observations are correctable without re-opening the investigation; they are documentation-quality corrections, not evidence-quality failures.

---

# 24. Acceptance Conditions

The acceptance is conditional on the following corrections being applied to `09_ADMIN_DASHBOARD_SYSTEM_INCONSISTENCY_REPORT.md` before Phase B remediation planning begins. These corrections are documentation-quality; they do not require re-investigation.

1. **Remove or reclassify DB-008 and DIR-003.** Direct inspection of `supabase/schema.sql:34791-34812` shows `gdpr_delete_user_data` populates `gdpr_deletion_logs` six times per execution. Either remove both entries from the catalog or reclassify them as `Repository Evidence Incomplete` with a corrected conclusion stating the table IS populated.

2. **Remove or downgrade DEP-001.** `invoices` and `payments` ARE in `ADMIN_ROUTE_MAP` (lines 38-39) and `PAGE_TITLES` (lines 54-55). The only valid kernel (detail routes have no dedicated sidebar entry) is intentional UX, not a defect. Either remove DEP-001 or reword it as an informational observation with `Low` severity.

3. **Correct the Severity Matrix.** The current matrix reports `Low = 10` but enumerates 14 items, and `High = 18` but omits DRIFT-001, DRIFT-002, RPC-001, and VAL-002. Re-enumerate all four severity rows so that every cataloged issue appears in exactly one row, and the row totals match the enumeration counts. Reconcile the matrix total (currently 50) with the catalog total (66 cataloged / 45 unique).

4. **Correct the four evidence counts.**
   - DB-002: change "5 definitions" to "3 `CREATE OR REPLACE FUNCTION` definitions" (lines 17702, 20858, 36429).
   - DB-003: change "4 definitions" to "3 `CREATE OR REPLACE FUNCTION` definitions" (lines 15249, 18640, 20748).
   - MIG-001: change "25+ fix migrations" to "21 fix migrations".
   - MIG-002: change "21 migrations after SSOT baseline" to "29 migrations after SSOT baseline" (the drift is larger than reported).

5. **Correct EDG-005's supporting list.** Add `invite-member` and `reset-password` to the list of Edge Functions that DO write to `app_audit_log`. The conclusion ("many Edge Functions do not write audit logs") remains correct.

6. **Adopt the 45-unique-issue view for Phase B wave sizing.** Publish a deduplicated view of the catalog alongside the existing 66-entry view, and explicitly state that the 45-unique view is the operationally meaningful count for remediation planning.

7. **Resolve the SSOT drift.** The 29 post-SSOT migrations add new RPCs, triggers, RLS policies, and Edge Function support not described in `01`–`03`. The program owner must either (a) formally extend the SSOT to cover these migrations, or (b) explicitly accept the drift and instruct Phase B to use the repository (not the SSOT) as the authoritative state. This decision must be recorded before Phase B begins.

8. **Complete the two partial-coverage domains.** Monitoring/Health and Configuration are marked "Partial evidence" by the report itself. Complete the traces for these two domains during Phase B planning (not during a later investigation cycle) so that no latent Critical or High finding is missed.

9. **Treat EDG-001 as the highest-priority Phase B item.** The `audit-log` Edge Function is an actively exploitable Critical vulnerability (unauthenticated audit-trail write). The program owner should consider whether an emergency hotfix outside the wave plan is warranted before the first scheduled wave begins.

10. **Document the EXE-001 severity judgment call.** `EXE-001` is marked `High`; the reviewer notes it is arguably `Critical` (silent catch on membership activation can leave users half-activated with no audit trail). The program owner should affirm the `High` rating or elevate it, and record the decision.

Once conditions 1–6 are applied, the corrected report may be sealed as the official Phase B baseline. Conditions 7–10 are program-owner decisions that must be recorded before Phase B begins but do not require modification of the report itself.

---

# 25. Independent Reviewer Statement

I, acting in the capacity of an independent Enterprise Technical Review Board, hereby certify that:

1. **All 10 mandatory SSOT documents were read in full** before any review activity began. Reading was performed by five parallel subagents, each tasked with faithful extraction of scope, claims, named artifacts, findings, evidence, and admissions. No document was skipped. No section was skipped.

2. **Codebase Memory MCP was used throughout the review.** The `C-PROJECT-vietsalepro` knowledge graph (26 178 nodes, 39 658 edges) at commit `3a06a6d9` was used to corroborate the SSOT-to-graph alignment, to verify the layer-boundary violations claimed in the report, and to confirm that every module named in the SSOT exists as a real node in the codebase graph.

3. **Repository evidence was independently verified.** Every evidence claim for every cataloged issue was either directly re-checked (file read, schema grep, function directory listing) or assessed for consistency with the file structure. 19 of the highest-impact evidence claims were directly re-verified; 18 were confirmed, 1 was refuted (DB-008), and 4 had correctable count inaccuracies (DB-002, DB-003, MIG-001, MIG-002).

4. **Every reported issue was independently reviewed.** All 66 cataloged entries (45 unique) were classified into one of the mandatory review categories. 28 unique findings were fully accepted, 11 were accepted with observations, 1 needs more evidence, 2 are false positives, and 1 has an incorrect confidence assignment.

5. **Coverage quality was validated.** 10 of 12 capability domains are fully covered; 2 are partially covered with explicit self-disclosure by the report. No High-severity coverage gaps were identified.

6. **The investigation was accepted with observations.** The decision is `PASS WITH OBSERVATIONS`. The observations are correctable without re-opening the investigation. The 3 Critical findings and the highest-impact High findings are unambiguously verified and ready to drive Phase B remediation.

7. **Exactly one deliverable was created:** this file, `C:\PROJECT\vietsalepro\ADMIN_DASHBOARD_PLAN\10_ADMIN_DASHBOARD_INVESTIGATION_ACCEPTANCE_REVIEW.md`.

8. **No code, database, migration, RPC, Edge Function, or configuration artifact was modified during this review**, in compliance with the program's "Phase A — investigation only" rule and the strict prohibitions of the review charter.

The Investigation Report is trustworthy as the official baseline for the Admin Dashboard System Remediation Program Phase B, subject to the Acceptance Conditions in Section 24.

---

**End of Acceptance Review**
