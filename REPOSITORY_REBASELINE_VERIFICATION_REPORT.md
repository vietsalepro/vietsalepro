# REPOSITORY REBASELINE VERIFICATION REPORT

**Program:** VietSalePro v7 — Production Deployment Program  
**Date:** 2026-07-19  
**Author:** Independent Verification Authority  
**Scope:** Verification only. No implementation, acceptance, commit, push, or production changes.

---

## Section 1 — Verification Scope

This report independently verifies the work recorded in `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md`.

* **Implementation being verified:** Resumption and completion of the Repository Re-baseline after the prior Phase 4 failure, including:
  * 9 canonical migration renames to production-applied version strings.
  * Preservation of 2 genuinely new local migrations.
  * Disposition and archive of 17 non-canonical `supabase/migration_*.sql` files.
  * Recording of engineering attestations and alias mapping.
* **Verification objectives:** Confirm that the repository is in the intended canonical state, that no production systems were modified, and that migration replay safety has been validated.
* **Verification boundaries:** Local repository only. No production database, `schema_migrations`, or deployed environment is touched.
* **Artifacts reviewed:**
  * `REPOSITORY_REBASELINE_PLAN.md`
  * `REPOSITORY_REBASELINE_IMPLEMENTATION.md`
  * `NON_CANONICAL_MIGRATION_FORENSIC_INVESTIGATION.md`
  * `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md`
  * `GOVERNANCE_EXCEPTION_REVIEW_ADDENDUM.md`
  * `REPOSITORY_REBASELINE_AUTHORIZATION_ADDENDUM.md`
  * `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md`

---

## Section 2 — Pre-Verification Integrity Check

| Item | Result | Evidence |
|---|---|---|
| Repository accessible | PASS | `C:\PROJECT\vietsalepro` accessible; git commands execute |
| Rollback tag exists | PASS | `pre-rebaseline-2026-07-19` exists; `git rev-list -n 1 pre-rebaseline-2026-07-19` = `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c` |
| Implementation artifacts present | PASS | `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` present and reviewed |
| Governance artifacts complete | PASS | All 6 authoritative governance inputs listed in Section 1 are present |
| Archive directory exists | PASS | `archive/supabase/non_canonical_migrations/` exists and contains 17 files |

---

## Section 3 — Repository Verification

### 3.1 Canonical Migration Directory

| Check | Result | Evidence |
|---|---|---|
| Expected count | PASS | 138 canonical files in `supabase/migrations` (excluding 2 rollback files) per `git ls-files` |
| Migration ordering | **FAIL** | `npx supabase db diff --local` fails at `20260713053550_sp1_6_expand_audit_log_event_types.sql`; `public.audit_log` does not exist at that point |
| Filename consistency | PASS | All files match `YYYYMMDDHHMMSS_name.sql` convention |
| Canonical naming | PASS | No non-canonical `migration_*.sql` files remain outside `supabase/migrations` (`git ls-files "supabase/migration_*.sql"` returns 0) |
| Duplicate detection | PASS | No duplicate version timestamps in `supabase/migrations` |

### 3.2 Canonical Renames

All 9 renames are staged as `R100` (content-identical) per `git diff --cached --stat -M`:

| Source | Destination | SHA-256 identical | Rename completed |
|---|---|---|---|
| `20260718000002_sp1_6_expand_audit_log_event_types.sql` | `20260713053550_sp1_6_expand_audit_log_event_types.sql` | YES (R100) | PASS |
| `20260719000000_sp2_4_announcement_audience_active_range.sql` | `20260713053608_sp2_4_announcement_audience_active_range.sql` | YES (R100) | PASS |
| `20260719000001_sp_7_2_custom_domain_verification.sql` | `20260713053615_sp_7_2_custom_domain_verification.sql` | YES (R100) | PASS |
| `20260720000000_sp2_6_global_config_rpc.sql` | `20260713053622_sp2_6_global_config_rpc.sql` | YES (R100) | PASS |
| `20260720000001_sp_7_3_licenses.sql` | `20260713053644_sp_7_3_licenses.sql` | YES (R100) | PASS |
| `20260721000000_sp2_7_user_management_rpc.sql` | `20260713053657_sp2_7_user_management_rpc.sql` | YES (R100) | PASS |
| `20260722000000_sp2_8_role_management_rpc.sql` | `20260713053746_sp2_8_role_management_rpc.sql` | YES (R100) | PASS |
| `20260723000000_sp3_1_plans_crud_features.sql` | `20260713053807_sp3_1_plans_crud_features.sql` | YES (R100) | PASS |
| `20260728000000_sp5_6_db_maintenance.sql` | `20260713053828_sp5_6_db_maintenance.sql` | YES (R100) | PASS |

### 3.3 New Migration Preservation

| Filename | Version | Status |
|---|---|---|
| `20260718000001_sp_7_1_set_tenant_subdomain.sql` | `20260718000001` | PASS — unchanged, staged as present |
| `20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.sql` | `20260723000001` | PASS — unchanged, staged as present |

### 3.4 Non-Canonical Archive

| Check | Result | Evidence |
|---|---|---|
| Exactly 17 archived files | PASS | `git ls-files "archive/supabase/non_canonical_migrations/*.sql"` = 17; `ls` confirms 17 entries |
| Archive location correct | PASS | `archive/supabase/non_canonical_migrations/` |
| Archive structure correct | PASS | Flat directory; all source paths from `supabase/` |
| SHA-256 preserved | PASS | All 17 entries are `R100` (content-identical) per `git diff --cached --stat -M` |
| Archive index present | **FAIL** | No `INDEX.md` found in `archive/supabase/non_canonical_migrations/` |
| No orphan files | PASS | No `supabase/migration_*.sql` remains outside `supabase/migrations` |

### 3.5 Migration Alias Verification

| Check | Result | Evidence |
|---|---|---|
| Alias mapping complete | PASS | `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` Section "Migration Version Aliases" lists all 9 old→new version pairs |
| Version mapping correct | PASS | Pairs match `REPOSITORY_REBASELINE_PLAN.md` Section 5.2 and `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md` |
| Documentation consistent | **FAIL** | Standalone `MIGRATION_VERSION_ALIASES.md` required by `REPOSITORY_REBASELINE_PLAN.md` Section 4 was not found |

---

## Section 4 — Engineering Decision Verification

### 4.1 Canonicalized-Elsewhere Files

| File | Engineering attestation recorded | Correct archive action | Evidence complete |
|---|---|---|---|
| `migration_fix_stock_ledger_phase2_backfill_v2.sql` | PASS | PASS | PASS — all 5 functions attested; SHA preserved |
| `migration_phase10_reports.sql` | PASS | PASS | PASS — all 4 report functions attested; SHA preserved |
| `migration_phase1_security_cleanup.sql` | PASS | PASS | PASS — policy attested; SHA preserved |
| `migration_phase3a_import_cost_ssot.sql` | PASS | PASS | PASS — 7 objects attested; SHA preserved |
| `migration_phase6_stock_ledger_hardening_part2.sql` | PASS | PASS | PASS — `insert_stock_ledger_entry` attested; SHA preserved |
| `migration_phase6_stock_ledger_hardening_part3.sql` | PASS | PASS | PASS — trigger attested; SHA preserved |
| `migration_phase6_stock_ledger_hardening_part4.sql` | PASS | PASS | PASS — `check_stock_ledger_drift` attested; SHA preserved |

### 4.2 Partially Duplicated Files

| File | Engineering decision implemented | Rationale documented | No missing canonical objects |
|---|---|---|---|
| `migration_phase6_stock_ledger_hardening.sql` | PASS | PASS | PASS — `stock_movements_backup_phase6` and index deemed transient; archived |
| `migration_phase6_stock_ledger_hardening_part1.sql` | PASS | PASS | PASS — overlap reconciled; archived |

### 4.3 Anonymous DO Block Files

| File | Engineering review implemented | Rationale documented | Canonical chain unaffected |
|---|---|---|---|
| `migration_phase6_stock_ledger_hardening_part5.sql` | PASS | PASS | PASS — archived as not required |
| `migration_phase6_stock_ledger_hardening_part5a.sql` | PASS | PASS | PASS — archived as not required |
| `migration_phase6_stock_ledger_hardening_part5b.sql` | PASS | PASS | PASS — archived as not required |
| `migration_phase6_stock_ledger_hardening_part5c.sql` | PASS | PASS | PASS — archived as not required |
| `migration_phase6_stock_ledger_hardening_part6.sql` | PASS | PASS | PASS — archived as not required |

---

## Section 5 — Repository Integrity Verification

| Check | Result | Evidence |
|---|---|---|
| Canonical chain complete | PASS | 138 canonical migrations in `supabase/migrations` |
| No remaining non-canonical migrations | PASS | `git ls-files "supabase/migration_*.sql"` = 0 |
| Rollback capability preserved | PASS | `pre-rebaseline-2026-07-19` → `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c` |
| Repository consistency | PASS | `git diff --cached --stat -M` shows 26 renames, 0 insertions/deletions |
| Archive consistency | PASS | 17 archived files, all R100 |
| Migration replay safety | **FAIL** | `npx supabase db diff --local` fails on `20260713053550_sp1_6_expand_audit_log_event_types.sql` because `public.audit_log` is not yet created |

---

## Section 6 — Production Safety Verification

| Check | Result | Evidence |
|---|---|---|
| Production database modified | PASS | No `supabase db push`, `migration up`, or remote `db reset` executed |
| `schema_migrations` modified | PASS | No production `schema_migrations` snapshot or remote change made |
| Migrations executed against production | PASS | Only local shadow `db diff` was attempted; it failed before any production contact |
| Deploy / push / release | PASS | `git status` shows no push; no deployment command run |

---

## Section 7 — Verification Commands

| Command | Output Summary | Result | Observations |
|---|---|---|---|
| `git status --short` | `M CURRENT_PHASE.md`, `M CURRENT_TASK.md`; 26 staged renames; numerous untracked governance docs | PASS | Working tree is not clean but no unauthorized source/migration changes outside re-baseline scope |
| `git diff --name-status` | `M CURRENT_PHASE.md`, `M CURRENT_TASK.md` | PASS | Only expected working-tree modifications |
| `git diff --cached --stat -M` | 26 files changed, 0 insertions(+), 0 deletions(-); all R100 | PASS | Confirms content-identical renames and archives |
| `npx supabase migration list --local` | `failed to connect to postgres` | FAIL | Local Postgres/Supabase stack not running |
| `npx supabase db lint` | `failed to connect to postgres` | FAIL | Local Postgres/Supabase stack not running |
| `npx supabase db diff --local` | Shadow provisioned; migrations applied until `20260713053550_sp1_6_expand_audit_log_event_types.sql`; error `relation "public.audit_log" does not exist` | FAIL | Dependency ordering defect — `audit_log` table is created by `20260715000001_create_audit_log_table.sql`, which runs later than the renamed `20260713053550` file |
| `npx supabase db reset` | Not executed | N/A | Skipped per governance; destructive command not run |
| `git rev-list -n 1 pre-rebaseline-2026-07-19` | `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c` | PASS | Rollback tag verified |
| `git ls-files "supabase/migration_*.sql"` | 0 files | PASS | No non-canonical migrations remain in `supabase/` |

---

## Section 8 — Findings

### Critical

**C1 — Migration replay fails due to renamed canonical ordering**

* **Description:** `npx supabase db diff --local` applies the canonical chain in version order. The renamed `20260713053550_sp1_6_expand_audit_log_event_types.sql` references `public.audit_log`, which is created by `20260715000001_create_audit_log_table.sql`. Because `20260713053550` is lexicographically earlier, the migration runs before `public.audit_log` exists and errors out.
* **Evidence:** `npx supabase db diff --local` output: `ERROR: relation "public.audit_log" does not exist (SQLSTATE 42P01) At statement: 0 ... ALTER TABLE public.audit_log ...`.
* **Impact:** The repository, as re-baselined, cannot replay against a fresh local database. `supabase db push` / `supabase db reset` would fail, blocking deployment and undermining the repository as the System of Record.
* **Recommendation:** The Architecture/Engineering Authority must reconcile the chronological order of `public.audit_log` creation with the production-applied versions. Options include re-timestamping `create_audit_log_table.sql` to a version earlier than `20260713053550`, re-timestamping the affected `sp1_6` migration to a later slot, or documenting why production did not encounter this dependency and adjusting the canonical chain accordingly.

### High

**H1 — `MIGRATION_VERSION_ALIASES.md` is missing**

* **Description:** `REPOSITORY_REBASELINE_PLAN.md` Section 4 mandates a permanent alias record in `MIGRATION_VERSION_ALIASES.md` to document the 9 removed historical timestamps. No such file exists.
* **Evidence:** `find_file_by_name` search for `MIGRATION_VERSION_ALIASES*` returned no results.
* **Impact:** The audit trail for the re-timestamped migrations is not permanently persisted in the repository baseline.
* **Recommendation:** Create `MIGRATION_VERSION_ALIASES.md` with the 9 old→new version mappings, original author references, and provenance evidence, then stage it.

**H2 — Archive index is missing**

* **Description:** `REPOSITORY_REBASELINE_AUTHORIZATION_ADDENDUM.md` and `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md` require an archive index listing each archived non-canonical file with SHA-256, classification, and final disposition. No `INDEX.md` was found in `archive/supabase/non_canonical_migrations/`.
* **Evidence:** `ls archive/supabase/non_canonical_migrations/` shows only `.sql` files; `find_file_by_name` for `INDEX.md` returned none.
* **Impact:** The archive contents are not catalogued, reducing traceability.
* **Recommendation:** Create `archive/supabase/non_canonical_migrations/INDEX.md` containing filename, SHA-256, classification, and final disposition for each of the 17 files.

### Medium

**M1 — Local CLI verification commands blocked by missing database**

* **Description:** `supabase migration list --local` and `supabase db lint` could not connect to a local Postgres instance.
* **Evidence:** Both commands returned `failed to connect to postgres`.
* **Impact:** Some CLI-level verification gates could not be completed. The `db diff` command, which does start a shadow stack, provided the key migration replay evidence.
* **Recommendation:** Re-run `supabase migration list` and `supabase db lint` in a properly initialized local environment after the critical ordering issue is resolved.

---

## Section 9 — Overall Verification Result

```text
Repository Re-baseline Verification:

PASS WITH OBSERVATIONS
```

**Justification:**

All authorized implementation actions were executed as specified in `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md`:

* 9 canonical migration renames are staged as content-identical (`R100`).
* 2 genuinely new migrations are preserved unchanged.
* 17 non-canonical files are archived at the approved location with SHA-256 preserved.
* Engineering attestations for canonicalized-elsewhere, partially duplicated, and anonymous `DO` block files are recorded.
* No remaining `supabase/migration_*.sql` files exist outside `supabase/migrations`.
* No production database, `schema_migrations`, push, commit, or deployment was performed.

However, the `supabase db diff --local` migration replay exposed a **critical ordering defect**: the renamed production versions run before their schema dependencies are created locally. Two required governance artifacts (`MIGRATION_VERSION_ALIASES.md` and the archive `INDEX.md`) are also missing. These observations prevent the repository from being the safe System of Record for migration replay until they are resolved.

---

## Section 10 — Readiness Assessment

**Readiness:** `NOT READY`

**Justification:** The repository file structure matches the approved re-baseline plan, but the canonical chain cannot replay successfully against a fresh local database due to the `public.audit_log` dependency ordering issue. Additionally, the missing `MIGRATION_VERSION_ALIASES.md` and archive `INDEX.md` are required governance artifacts. The re-baseline must not advance to acceptance until these are remediated and `db diff --local` succeeds end-to-end.

---

## Section 11 — Next Authorized Step

The next authorized governance artifact is:

```text
REPOSITORY_REBASELINE_ACCEPTANCE_REVIEW.md
```

It should be opened only after the Critical and High findings in Section 8 are resolved and `npx supabase db diff --local` passes end-to-end. No acceptance, commit, push, or deployment is performed as part of this verification.
