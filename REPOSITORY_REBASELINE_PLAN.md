# REPOSITORY RE-BASELINE PLAN

**Program:** VietSalePro v7 — Production Deployment Program  
**Date:** 2026-07-19  
**Author:** Engineering Planning Authority  
**Status:** Planning artifact — no implementation is authorized by this document  
**Authority:** `GOVERNANCE_EXCEPTION_REVIEW.md` — Governance Exception APPROVED WITH CONDITIONS

This document is an engineering planning artifact only. It defines the planned reconciliation of the repository migration history with the production migration history. No repository, Git, production, or database changes are to be performed until this plan is reviewed, authorized, and the preconditions listed below are satisfied.

Evidence used as authoritative reference:

- `REPOSITORY_HYGIENE_REVIEW.md`
- `MIGRATION_RECONCILIATION_REPORT.md`
- `MIGRATION_PROVENANCE_INVESTIGATION.md`
- `GOVERNANCE_EXCEPTION_REVIEW.md`

---

## 1. Current State Assessment

| Property | Current Value |
|---|---|
| Repository branch | `master` |
| Repository commit | `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c` |
| Upstream relationship | 20 commits ahead of `origin/master` |
| Working tree | Not clean (governance documents for the Production Deployment Program; no unauthorized source/migration/config changes) |
| Canonical local migrations (`supabase/migrations`) | 138 |
| Applied production migrations | 136 |
| Exact version matches | 127 |
| Divergent migrations (same name, different version) | 9 |
| Local-only migrations | 11 (9 re-timestamped counterparts + 2 genuinely new) |
| Production-only migrations | 9 (original `20260713...` timestamps) |
| Latest local migration | `20260728000000_sp5_6_db_maintenance.sql` |
| Latest production migration | `20260718000000_phase6_3_support_ticket_sla` |
| Non-canonical migration files outside `supabase/migrations` | 17 (`supabase/migration_*.sql`) |
| Deployment freeze | Active; not to be lifted until re-baseline and verification are complete |

**Summary:** The repository and production share identical SQL intent for 127 migrations. Nine migrations are present in both environments but with different `version` timestamps: production applied them with `20260713...` timestamps, while the repository later re-timestamped them to `20260718...` through `20260728...`. Two additional migrations exist only in the repository and have not yet been applied to production. The repository cannot currently serve as the System of Record for migration history.

---

## 2. Re-baseline Objectives

1. Restore the repository as the canonical System of Record for migration history.
2. Preserve the production migration history exactly as it was applied.
3. Eliminate the nine timestamp divergences by adopting the production-applied `version` strings.
4. Preserve SQL integrity — no SQL body changes are expected.
5. Preserve the audit trail by permanently documenting the version-alias mapping.
6. Leave the repository in a state where future `supabase db push` / `supabase migration up` operations are safe against both fresh and production environments.

---

## 3. Scope

### In Scope

- `supabase/migrations` canonical file set (138 files).
- The 9 production-only `version` strings from `supabase_migrations.schema_migrations`.
- The 17 non-canonical `supabase/migration_*.sql` files outside `supabase/migrations`.
- Governance documentation describing the re-baseline, aliases, and authorization.

### Out of Scope

- Any modification to the production database or `supabase_migrations.schema_migrations`.
- Source code, application configuration, or feature changes.
- Actual deployment to production.
- Rewriting Git history.

### Explicit Items

| Category | Identifiers / Notes |
|---|---|
| Canonical migration filenames | All files matching `supabase/migrations/YYYYMMDDHHMMSS_name.sql` (138 files) |
| Divergent migration versions | `20260713053550`, `20260713053608`, `20260713053615`, `20260713053622`, `20260713053644`, `20260713053657`, `20260713053746`, `20260713053807`, `20260713053828` |
| Local-only (re-timestamped) versions | `20260718000002`, `20260719000000`, `20260719000001`, `20260720000000`, `20260720000001`, `20260721000000`, `20260722000000`, `20260723000000`, `20260728000000` |
| Genuinely new local versions | `20260718000001_sp_7_1_set_tenant_subdomain`, `20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions` |
| Governance documentation | This plan, the alias record, authorization, implementation, and verification reports |
| SQL body changes | **None expected** — only filenames / `version` strings change |

---

## 4. Canonical Migration Strategy

**Decision:** The production-applied `version` strings become the canonical versions for the 9 divergent migrations.

**Rationale:**

- Production is the runtime source of truth for what has actually been executed.
- `MIGRATION_PROVENANCE_INVESTIGATION.md` confirmed the SQL content of the 9 divergent repository files is byte-for-byte identical to the `statements` recorded in `schema_migrations` for the production versions.
- Supabase CLI uses the `version` prefix to determine whether a migration has been applied; a `supabase db push` from the current repository would attempt to re-execute migrations already applied under different versions.
- The repository is the only Git-versioned artifact and is therefore the correct long-term System of Record, but only after it records the actual production-applied versions.

**Historical aliases:** The current repository timestamps (`20260718...` through `20260728...`) for these 9 migrations are non-canonical historical aliases. They will be removed from `supabase/migrations` and recorded in `MIGRATION_VERSION_ALIASES.md` together with the original author (`suacauba@gmail.com` / `phatnt056`), commit references, and the provenance evidence.

**Permanent mapping:** The mapping in this plan and in `MIGRATION_VERSION_ALIASES.md` must remain part of the repository baseline permanently. It supplies the audit trail for the provenance of each re-timestamped migration and protects future maintainers from reintroducing the same divergence.

---

## 5. Migration Mapping Plan

### 5.1 Matched migrations (no change)

The 127 version-matched migrations are already canonical. No filename, version, or SQL changes are required. The complete list is the `MATCH` entries in `MIGRATION_RECONCILIATION_REPORT.md`.

### 5.2 Migrations requiring a mapping decision

| Current Repository Version | Production Version | Migration Name | Planned Canonical Version | Planned Action |
|---|---|---|---|---|
| `20260718000002` | `20260713053550` | `sp1_6_expand_audit_log_event_types` | `20260713053550` | Rename |
| `20260719000000` | `20260713053608` | `sp2_4_announcement_audience_active_range` | `20260713053608` | Rename |
| `20260719000001` | `20260713053615` | `sp_7_2_custom_domain_verification` | `20260713053615` | Rename |
| `20260720000000` | `20260713053622` | `sp2_6_global_config_rpc` | `20260713053622` | Rename |
| `20260720000001` | `20260713053644` | `sp_7_3_licenses` | `20260713053644` | Rename |
| `20260721000000` | `20260713053657` | `sp2_7_user_management_rpc` | `20260713053657` | Rename |
| `20260722000000` | `20260713053746` | `sp2_8_role_management_rpc` | `20260713053746` | Rename |
| `20260723000000` | `20260713053807` | `sp3_1_plans_crud_features` | `20260713053807` | Rename |
| `20260728000000` | `20260713053828` | `sp5_6_db_maintenance` | `20260713053828` | Rename |
| `20260718000001` | — | `sp_7_1_set_tenant_subdomain` | `20260718000001` | Preserve |
| `20260723000001` | — | `g1_add_max_storage_gb_to_tenant_subscriptions` | `20260723000001` | Preserve |

**Actions defined:**

- **Rename** — the repository file is renamed from the current timestamp to the production-applied timestamp. The old timestamp becomes a documented alias.
- **Preserve** — the repository file and timestamp are kept unchanged because no production version exists.
- **No Change** — applies to the 127 matched migrations (current version = production version = planned canonical version).

---

## 6. Local-only Migration Review

| Local Version | Migration Name | Production Counterpart | Intended Purpose | Dependencies | Correct Chronological Position | Deployment Readiness |
|---|---|---|---|---|---|---|
| `20260718000002` | `sp1_6_expand_audit_log_event_types` | `20260713053550` | Add additional `audit_log` event type values / handling. | `public.audit_log` table, existing event-type infrastructure. | Between `20260713000011` and `20260714000001` (after production `20260713000011`, before `20260714000001`). | Blocked until re-baselined to `20260713053550`; SQL content is identical to production, so safe after rename. |
| `20260719000000` | `sp2_4_announcement_audience_active_range` | `20260713053608` | Extend announcement audience targeting with active date range logic. | `public.announcements` and related audience tables. | Between `20260713053550` and `20260713053615`. | Blocked until re-baselined to `20260713053608`; content verified identical. |
| `20260719000001` | `sp_7_2_custom_domain_verification` | `20260713053615` | Add storage / support for tenant custom-domain verification records. | `public.tenants` and domain-validation infrastructure. | Between `20260713053608` and `20260713053622`. | Blocked until re-baselined to `20260713053615`; content verified identical. |
| `20260720000000` | `sp2_6_global_config_rpc` | `20260713053622` | Provide an RPC for reading global configuration values. | Existing `public` functions and config tables. | Between `20260713053615` and `20260713053644`. | Blocked until re-baselined to `20260713053622`; content verified identical. |
| `20260720000001` | `sp_7_3_licenses` | `20260713053644` | Add license-related schema or management functions. | `public.tenants`, `public.tenant_subscriptions`, or license tables. | Between `20260713053622` and `20260713053657`. | Blocked until re-baselined to `20260713053644`; content verified identical. |
| `20260721000000` | `sp2_7_user_management_rpc` | `20260713053657` | Add RPC functions for managing tenant users. | User/membership tables and existing `is_system_admin` helpers. | Between `20260713053644` and `20260713053746`. | Blocked until re-baselined to `20260713053657`; content verified identical. |
| `20260722000000` | `sp2_8_role_management_rpc` | `20260713053746` | Add RPC functions for role management. | Membership / role tables. | Between `20260713053657` and `20260713053807`. | Blocked until re-baselined to `20260713053746`; content verified identical. |
| `20260723000000` | `sp3_1_plans_crud_features` | `20260713053807` | Add plan CRUD features / functions. | Billing / plan tables. | Between `20260713053746` and `20260713053828`. | Blocked until re-baselined to `20260713053807`; content verified identical. |
| `20260728000000` | `sp5_6_db_maintenance` | `20260713053828` | Add database maintenance utilities / procedures. | Existing operational tables / functions. | Between `20260713053807` and `20260714000001`. | Blocked until re-baselined to `20260713053828`; content verified identical. |
| `20260718000001` | `sp_7_1_set_tenant_subdomain` | — | New RPC to allow a system admin to set and validate a tenant `subdomain`. | `public.tenants`, `public.is_system_admin()`, `public.audit_log`, `auth.uid()`, `public.is_valid_plan` indirectly. | Immediately after `20260718000000_phase6_3_support_ticket_sla` and before any `20260719...` migrations. | Not yet applied to production; ready after verification that `public.tenants` and `audit_log` exist. Must be staged to a non-production environment before production deployment. |
| `20260723000001` | `g1_add_max_storage_gb_to_tenant_subscriptions` | — | Extend `tenant_subscriptions` with `max_storage_gb` and update `update_tenant_subscription` canonical signature. | `public.tenant_subscriptions`, `public.tenants`, `public.is_system_admin()`, `public.is_valid_plan()`, `public.get_default_plan_limit_values()`. | Immediately after `20260723000000_sp3_1_plans_crud_features` and before any later `20260724...`/`20260728...` migrations. | Not yet applied to production; ready after fresh-environment validation. The `DROP FUNCTION IF EXISTS` of the 7-parameter overload must be confirmed safe. |

---

## 7. Non-canonical File Strategy

The following 17 files are outside the canonical `supabase/migrations` directory and are not recognized by the Supabase CLI migration runner:

- `supabase/migration_f33_invite_rate_limit_tenant.sql`
- `supabase/migration_f33_members_guardrails.sql`
- `supabase/migration_f33_members_status_activation.sql`
- `supabase/migration_fix_stock_ledger_phase2_backfill_v2.sql`
- `supabase/migration_phase10_reports.sql`
- `supabase/migration_phase1_security_cleanup.sql`
- `supabase/migration_phase3a_import_cost_ssot.sql`
- `supabase/migration_phase6_stock_ledger_hardening.sql`
- `supabase/migration_phase6_stock_ledger_hardening_part1.sql`
- `supabase/migration_phase6_stock_ledger_hardening_part2.sql`
- `supabase/migration_phase6_stock_ledger_hardening_part3.sql`
- `supabase/migration_phase6_stock_ledger_hardening_part4.sql`
- `supabase/migration_phase6_stock_ledger_hardening_part5.sql`
- `supabase/migration_phase6_stock_ledger_hardening_part5a.sql`
- `supabase/migration_phase6_stock_ledger_hardening_part5b.sql`
- `supabase/migration_phase6_stock_ledger_hardening_part5c.sql`
- `supabase/migration_phase6_stock_ledger_hardening_part6.sql`

**Planned action:** Archive.

**Rationale:**

- Files not in `supabase/migrations` are ignored by `supabase migration up` and `supabase db push`.
- Several filenames correspond to migrations that already exist in `supabase/migrations` (for example, `f33_invite_rate_limit_tenant`, `f33_members_guardrails`, `f33_members_status_activation`) and are therefore historical duplicates or working drafts.
- Any unique SQL in these files that is not already in the canonical set would need to be converted into the `YYYYMMDDHHMMSS_name.sql` convention and inserted into `supabase/migrations` at the correct chronological position. The initial review found no evidence that these files contain SQL that must supersede the canonical set.

**Execution details:**

1. Before the re-baseline, compare the SHA-256 hash (or content) of each `supabase/migration_*.sql` file against the canonical `supabase/migrations` files.
2. If a non-canonical file is an exact duplicate of a canonical migration, move it to `archive/supabase/non_canonical_migrations/`.
3. If a non-canonical file contains unique SQL, raise a blocking exception; the Governance Authority must decide whether to convert it to a canonical migration or archive it.
4. After the re-baseline, `supabase/` must contain no `migration_*.sql` files outside `supabase/migrations/`.

---

## 8. Engineering Execution Plan

### Phase 0 — Authorization and Baseline Backup

| Item | Definition |
|---|---|
| Objective | Secure authorization, freeze confirmation, and recoverable baseline. |
| Inputs | This plan; `GOVERNANCE_EXCEPTION_REVIEW.md`; `MIGRATION_RECONCILIATION_REPORT.md`; `MIGRATION_PROVENANCE_INVESTIGATION.md` |
| Outputs | Signed/recorded `REPOSITORY_REBASELINE_AUTHORIZATION.md`; git tag `pre-rebaseline-2026-07-19`; `schema_migrations` export; non-canonical file inventory |
| Verification | Authorization present; git tag points to `6f7c5dd...`; production `schema_migrations` snapshot saved and readable |
| Rollback trigger | Missing authorization, failed backup, or working tree contains uncommitted source/migration/config changes |
| Completion criteria | All preconditions satisfied; no changes yet applied to `supabase/migrations` |

### Phase 1 — Canonical Migration Re-baseline

| Item | Definition |
|---|---|
| Objective | Rename the 9 divergent repository migrations to their production-applied `version` strings and keep the 2 new migrations unchanged. |
| Inputs | Mapping table; current `supabase/migrations` directory; production `schema_migrations` snapshot |
| Outputs | 138 canonical files with correct timestamps; 9 old timestamps removed from `supabase/migrations`; alias record updated |
| Verification | `git status` shows only renames and no unintended modifications; `supabase migration list` expected versions present; no duplicate `version` strings |
| Rollback trigger | Any rename error, duplicate timestamp collision, or content mismatch between renamed file and production `statements` |
| Completion criteria | Every production-applied version `20260713053550`–`20260713053828` is present as a filename; the 2 new local versions remain at `20260718000001` and `20260723000001` |

### Phase 2 — Non-canonical File Archive

| Item | Definition |
|---|---|
| Objective | Remove the 17 non-canonical `supabase/migration_*.sql` files from the active path after duplicate/unique-content review. |
| Inputs | Non-canonical file inventory; canonical `supabase/migrations` set |
| Outputs | `supabase/migration_*.sql` files moved to `archive/supabase/non_canonical_migrations/`; an index file describing each archived item and the disposition decision |
| Verification | `find supabase -maxdepth 1 -name 'migration_*.sql'` returns no results; archive directory exists with the 17 files and an index |
| Rollback trigger | A non-canonical file is found to contain unique, production-necessary SQL that has no canonical equivalent and cannot be archived without replacement |
| Completion criteria | No `migration_*.sql` files outside `supabase/migrations`; all archived files are listed with rationale |

### Phase 3 — Verification

| Item | Definition |
|---|---|
| Objective | Prove the re-baselined repository is safe and correct. |
| Inputs | Re-baselined `supabase/migrations`; production `schema_migrations` snapshot; fresh Supabase environment (local or dedicated staging) |
| Outputs | `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md`; fresh-environment `schema_migrations` dump; `supabase db lint` report |
| Verification | Repository verification, migration verification, Supabase verification, fresh database verification, deployment safety verification, audit verification, acceptance verification (see Section 9) |
| Rollback trigger | Any verification sub-step FAIL; fresh database `supabase migration up` fails; schema diff against production is non-empty for reasons not caused by the 2 new migrations |
| Completion criteria | All PASS criteria in Section 9 satisfied |

### Phase 4 — Documentation and Acceptance

| Item | Definition |
|---|---|
| Objective | Commit the re-baseline, publish the alias record, and request formal acceptance. |
| Inputs | Verified migration set; `MIGRATION_VERSION_ALIASES.md`; `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md` |
| Outputs | A single commit (or a small, reviewable commit set) containing only the planned changes; clean working tree; acceptance record |
| Verification | `git diff --name-status` matches the planned renames and archive moves; `git status` is clean; `origin/master` push is approved separately |
| Rollback trigger | Governance Acceptance Authority rejects the re-baseline or requests material changes |
| Completion criteria | All acceptance criteria in Section 13 are satisfied |

---

## 9. Verification Plan

### 9.1 Repository Verification

- `supabase/migrations` contains exactly 138 files.
- Every filename matches `^[0-9]{14}_[a-z0-9_]+\.sql$`.
- No `migration_*.sql` file exists outside `supabase/migrations`.
- No duplicate version strings exist.
- `git diff` is limited to planned renames, archive moves, and governance documents.

**PASS criterion:** All checks above return the expected result.

### 9.2 Migration Verification

- For each of the 136 production-applied versions, the canonical file `version_name.sql` exists in `supabase/migrations` and its content matches the `statements` field in `schema_migrations`.
- The 9 re-timestamped migrations have been renamed to their production `version` strings.
- The 2 genuinely new migrations are present and not yet in production.

**PASS criterion:** 136/136 production versions are present and content-identical; 2 new migrations are staged for future deployment.

### 9.3 Supabase Verification

- `supabase migration list` runs without error.
- `supabase db lint` reports no blocking issues in the canonical migration set.
- A `supabase migration up --dry-run` (or equivalent CLI dry-run) reports that it would apply only the 2 new local migrations to a database whose `schema_migrations` matches production.

**PASS criterion:** CLI tooling recognizes all canonical migrations and does not attempt to re-apply the 9 production-applied migrations.

### 9.4 Fresh Database Verification

- Run `supabase db reset` (or equivalent full replay) against a fresh database.
- Confirm the migration sequence completes without error.
- Confirm `schema_migrations` in the fresh database contains exactly the 138 planned canonical versions.
- Confirm the resulting schema is equivalent to the production schema plus the 2 new migrations.

**PASS criterion:** Fresh replay succeeds and produces the expected `schema_migrations` set.

### 9.5 Deployment Safety Verification

- Compare the re-baselined repository against production using `supabase db diff` (or equivalent) and confirm no unexpected destructive changes.
- The 2 new migrations must be reviewed for safety: `g1` must be confirmed to safely drop the old `update_tenant_subscription` overload and `sp_7_1` must not conflict with existing tenant constraints.

**PASS criterion:** Diff is limited to the 2 new, intended migrations; no destructive or unintended changes are detected.

### 9.6 Audit Verification

- `MIGRATION_VERSION_ALIASES.md` exists and maps every old repository version to its canonical production version.
- The identity relationship between `phatnt056` (Git) and `suacauba@gmail.com` (Supabase `created_by`) is documented in governance records.
- Every re-baseline commit references this plan and the alias record.

**PASS criterion:** Alias and identity documentation is complete and committed.

### 9.7 Acceptance Verification

- The Governance Authority reviews the `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md` and confirms all PASS criteria.

**PASS criterion:** Acceptance Authority records approval and authorizes the next step.

---

## 10. Rollback Strategy

### Repository / Git Rollback

- A pre-rebaseline git tag `pre-rebaseline-2026-07-19` will be created before any file changes.
- If the re-baseline must be undone before acceptance, reset the working tree to the tag using `git checkout pre-rebaseline-2026-07-19` or `git reset --hard pre-rebaseline-2026-07-19` on a dedicated recovery branch.
- If the re-baseline has already been committed, revert the commits or checkout a recovery branch from the tag.

### Migration Rollback

- Production `schema_migrations` is not modified by this plan; no production migration rollback is required.
- If the re-baselined set is applied to a fresh or staging database and fails, destroy and recreate the fresh environment from the production baseline.

### Documentation Rollback

- If governance rejects the re-baseline, delete or revert `MIGRATION_VERSION_ALIASES.md` and any related governance records to the pre-rebaseline tag.

### Conditions that Require Rollback

- Any verification sub-step fails.
- Duplicate version string collision is discovered.
- A renamed migration's content does not match the production `statements`.
- A non-canonical file is found to contain unique, required SQL that cannot be safely archived.
- Governance Acceptance Authority rejects the change.

### Conditions that Prohibit Rollback

- Production `schema_migrations` has been modified (this plan forbids such modification; if it occurs, rollback is no longer a simple repository operation and requires a dedicated incident response).
- The re-baseline commit has been pushed to `origin/master` and other users have based work on it; in that case, a forward-fix strategy must be used instead of a simple rollback.

---

## 11. Risk Assessment

| Risk | Likelihood | Impact | Mitigation | Residual Risk |
|---|---|---|---|---|
| Repository corruption during rename (wrong filename, lost file) | Low | High | Use scripted rename with pre-checks; verify SHA-256 before and after; keep `pre-rebaseline` tag. | Low |
| Timestamp collision after rename | Low | High | Pre-compute the new filename set and confirm no duplicates or existing file overwrites. | Low |
| Production `schema_migrations` is accidentally modified | Very Low | Critical | No production SQL execution is in scope; separate, explicit authorization is required for any production operation. | Very Low |
| 2 new migrations fail on fresh replay | Medium | High | Run `supabase db reset` in a fresh environment; fix any dependency issues before acceptance. | Low |
| Non-canonical files contain unreleased, necessary SQL | Low | Medium | Compare each non-canonical file against canonical set; flag unique content for Governance Authority decision. | Low |
| Audit gap due to identity mismatch (`phatnt056` vs `suacauba@gmail.com`) | Medium | Medium | Document the identity relationship in `MIGRATION_VERSION_ALIASES.md` and governance records. | Low |
| Deployment freeze lifted prematurely | Low | High | Tie freeze lift to explicit acceptance of `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md`. | Low |

---

## 12. Acceptance Criteria

The repository re-baseline is complete only when all of the following are true:

1. `supabase/migrations` contains exactly 138 canonical migration files.
2. The 136 production-applied migration versions are present as filenames and are byte-identical to the `statements` recorded in `schema_migrations`.
3. The 2 genuinely new local migrations (`20260718000001_sp_7_1_set_tenant_subdomain` and `20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions`) are preserved unchanged and validated in a fresh environment.
4. No `migration_*.sql` files remain outside `supabase/migrations`.
5. No duplicate `version` strings exist in `supabase/migrations`.
6. `MIGRATION_VERSION_ALIASES.md` documents every re-timestamped migration and the identity reconciliation.
7. `supabase migration list` and `supabase db lint` succeed without errors.
8. A fresh `supabase db reset` (or equivalent full replay) completes successfully and produces the expected `schema_migrations` set.
9. `supabase db diff` against production shows only the 2 new, intended migrations.
10. The working tree is clean and the re-baseline is committed with a reference to this plan.
11. The Governance Acceptance Authority records approval.

---

## 13. Preconditions

Before implementation begins, the following must be true:

1. `REPOSITORY_REBASELINE_PLAN.md` is approved by the Program Manager / Governance Authority.
2. The pre-rebaseline git tag `pre-rebaseline-2026-07-19` is created and verified.
3. A snapshot of production `supabase_migrations.schema_migrations` is exported and stored.
4. The 17 non-canonical `supabase/migration_*.sql` files have been reviewed for unique content.
5. Identity reconciliation documentation (`phatnt056` / `suacauba@gmail.com`) is prepared.
6. Deployment freeze remains in effect; no production deployment is attempted.
7. A fresh Supabase environment is available for verification.

---

## 14. Postconditions

After successful completion:

1. The repository is the canonical System of Record for migration history.
2. `supabase/migrations` contains 138 canonical files aligned with production (136 applied + 2 new).
3. The 9 timestamp divergences are eliminated.
4. The 17 non-canonical files are archived under `archive/supabase/non_canonical_migrations/`.
5. `MIGRATION_VERSION_ALIASES.md` is committed and permanent.
6. The deployment freeze remains in place until the Governance Authority explicitly lifts it after accepting the verification report.

---

## 15. Deliverables

- `REPOSITORY_REBASELINE_AUTHORIZATION.md`
- `REPOSITORY_REBASELINE_IMPLEMENTATION_REPORT.md`
- `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md`
- `MIGRATION_VERSION_ALIASES.md`
- Pre-rebaseline git tag and snapshot logs
- Archive index (`archive/supabase/non_canonical_migrations/INDEX.md`)

---

## 16. Success Metrics

| Metric | Target |
|---|---|
| Repository matches production migration history | 136/136 production versions present and content-identical |
| No duplicate migration versions | 0 duplicates in `supabase/migrations` |
| No timestamp divergence | The 9 divergent versions reconciled to production timestamps |
| Fresh environment deploy succeeds | `supabase db reset` passes and produces 138 `schema_migrations` rows |
| Production remains unchanged | `schema_migrations` in production is not modified during re-baseline |
| Audit chain preserved | `MIGRATION_VERSION_ALIASES.md` committed with provenance and identity notes |
| Verification passes | All PASS criteria in Section 9 satisfied |

---

## 17. Final Recommendation

```text
Repository Re-baseline:

READY WITH PRECONDITIONS
```

**Justification:**

- The `GOVERNANCE_EXCEPTION_REVIEW.md` has approved the exception with conditions, so the re-baseline is a sanctioned activity.
- The technical root cause is understood: 9 migrations were re-timestamped, 2 are genuinely new, and the SQL content is identical for the 9 divergent migrations.
- The plan is clear and the verification steps are defined.
- However, the plan itself, the pre-rebaseline backups, the non-canonical file review, the identity reconciliation document, and the formal authorization must be in place before any file is renamed or archived.
- The 2 genuinely new migrations must be validated in a fresh environment before they can be considered safe for a future production deployment.

Therefore, the re-baseline should proceed only after the preconditions are met and the authorization artifact is produced.

---

## 18. Next Authorized Step

```text
REPOSITORY_REBASELINE_AUTHORIZATION.md
```

This authorization artifact must be produced, reviewed, and approved before any implementation work (Phase 1) begins.

---

## 19. Constraints Confirmation

This plan does **not** authorize any of the following:

- Renaming files
- Modifying the repository
- Modifying Git history
- Modifying production
- Executing SQL
- Committing
- Pushing
- Deploying
- Generating implementation artifacts

All listed actions remain planning-stage descriptions and require separate authorization before execution.
