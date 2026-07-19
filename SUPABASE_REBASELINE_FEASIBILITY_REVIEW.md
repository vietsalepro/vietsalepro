# SUPABASE REBASELINE FEASIBILITY REVIEW

**Program:** VietSalePro v7 — Production Deployment Program  
**Date:** 2026-07-19  
**Reviewer:** Engineering Feasibility Authority  
**Scope:** Read-only evaluation of the `REPOSITORY_REBASELINE_PLAN.md` against official Supabase migration behavior.  
**Status:** No repository, Git, production, or database modifications were performed.

---

## 1. Objective

Determine whether the `REPOSITORY_REBASELINE_PLAN.md` strategy (rename 9 divergent repository migrations to the production-applied `version` strings and preserve the repository as the canonical migration source) is technically feasible using supported Supabase behavior, and identify any unsupported assumptions or safer official alternatives.

---

## 2. Constraints Confirmation

This review does **not**:

- rename migrations
- edit SQL
- modify the repository
- modify production
- execute migration commands
- commit
- push
- deploy

It creates only this feasibility review document.

---

## 3. Inputs and References

### 3.1 Repository Evidence

- `REPOSITORY_HYGIENE_REVIEW.md`
- `MIGRATION_RECONCILIATION_REPORT.md`
- `MIGRATION_PROVENANCE_INVESTIGATION.md`
- `GOVERNANCE_EXCEPTION_REVIEW.md`
- `REPOSITORY_REBASELINE_PLAN.md`

### 3.2 Official Supabase Documentation

- [Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations) — migration tracking, `db push`, `migration repair`
- [Database migrations (local)](https://supabase.com/docs/guides/local-development/database-migrations) — `migration new`, `db reset`
- [CLI workflows](https://supabase.com/docs/guides/local-development/cli-workflows) — command overview, `migration list`, `db diff`, `db reset`, `db push`
- [CLI Reference — `supabase-migration-repair`](https://supabase.com/docs/reference/cli/supabase-migration-repair)
- [CLI Reference — `supabase-migration-squash`](https://supabase.com/docs/reference/cli/supabase-migration-squash)
- [CLI Reference — `supabase-db-push`](https://supabase.com/docs/reference/cli/supabase-db-push)
- [CLI Reference — `supabase-db-reset`](https://supabase.com/docs/reference/cli/supabase-db-reset)

### 3.3 Community / Observed Evidence (clearly distinguished)

- supabase/cli issue #4406 — describes timestamp-mismatch behavior and confirms version-only matching.
- `MIGRATION_PROVENANCE_INVESTIGATION.md` — confirms production `schema_migrations` columns (`version`, `statements`, `name`, `created_by`, `idempotency_key`, `rollback`) and absence of `applied_at` or `checksum`.

---

## 4. Engineering Assumption Review

| # | Assumption | Supported by official docs? | Supported by CLI behavior? | Supported by observed production state? | Confidence |
|---|-----------|-----------------------------|----------------------------|------------------------------------------|------------|
| 1 | Supabase identifies migrations by the `YYYYMMDDHHMMSS` prefix (`version`) of the filename. | **Yes**. Docs state `supabase/migrations/<timestamp>_<name>.sql` and that `db push` compares the local folder against `supabase_migrations.schema_migrations`. | **Yes**. CLI only accepts files matching `<timestamp>_name.sql`; `migration list` compares timestamps. | **Yes**. Production `schema_migrations.version` contains the same timestamp strings as the planned filenames. <ref_file file="c:/PROJECT/vietsalepro/MIGRATION_PROVENANCE_INVESTIGATION.md" /> | **High** |
| 2 | If a migration file `version` already exists in `schema_migrations`, `db push` skips it. | **Yes**. Official docs: "compares your local `supabase/migrations` folder against that table and runs only the ones not yet applied, in order." | **Yes**. This is the observed `db push` behavior; community report #4406 confirms skipping when `version` matches. | **Yes**. Production already has the 9 `20260713...` versions; the current repository `20260718/19/20/21/22/23/28` versions are not in production, so they would be applied. | **High** |
| 3 | The migration name suffix does not affect whether a migration is considered applied. | **Yes**. Docs and CLI only reference the `timestamp`/`version` prefix; the `name` part is descriptive. | **Yes**. CLI error messages refer to "file name must match pattern `<timestamp>_name.sql`"; tracking is by `version`. | **Yes**. Production `name` values correspond to the same logical names; the plan preserves the same `name` parts. | **High** |
| 4 | `schema_migrations` does not store a SQL checksum; content is not re-verified on `db push`. | **Partially**. Official docs do not describe a checksum mechanism; they describe version-only comparison. | **Partially**. CLI `db push` does not fail when content differs if the `version` is already applied (see #4406). | **Partially**. The table stores `statements` (SQL array) but the reconciliation investigation found no `checksum` column. <ref_file file="c:/PROJECT/vietsalepro/MIGRATION_PROVENANCE_INVESTIGATION.md" /> | **Medium** |
| 5 | Renaming the 9 repository files to the production timestamps will make the CLI consider them already applied against production. | **Partially**. Docs describe resolving divergence by renaming; they do not explicitly address renaming to an *older* timestamp. The identity model supports it. | **Yes**. `db push` will see the new filenames in `schema_migrations` and skip them. | **Yes**. The production-applied versions are already present; no SQL will run for those 9 after rename. | **High** |
| 6 | The 2 genuinely new local migrations (`20260718000001`, `20260723000001`) will be applied to production after the 136 existing versions. | **Yes**. They are not in `schema_migrations`, and their versions are numerically after the latest production version `20260718000000`. | **Yes**. `db push` applies missing migrations in ascending version order. | **Yes**. No collisions or duplicate keys for these versions were found. | **High** |
| 7 | Non-canonical `supabase/migration_*.sql` files outside `supabase/migrations` are ignored by the CLI. | **Yes**. Docs state migrations must live in `supabase/migrations` and match the naming pattern; files outside the directory are not processed. | **Yes**. CLI `migration list` and `db push` scan only `supabase/migrations` for canonical files. | **Not verified** against production, but the files are not referenced in `schema_migrations`. | **Medium** |
| 8 | `supabase db reset` in a fresh environment will replay all 138 migrations in the new order without errors. | **Partially**. Official docs describe `db reset` as recreating the database and applying all migrations; success depends on SQL correctness and ordering, not a guarantee. | **Partially**. `db reset` applies files in version order; it will fail if dependencies are violated. | **Not observed** in this review; must be verified in a fresh environment before authorization. | **Medium** |
| 9 | Staging, CI/CD, and developer local behavior matches the local CLI `db push`/`db reset` behavior described. | **Partially**. Docs and the CLI support this for local and linked remote; hosted/Branching CLI may differ (see #5127). | **Partially**. Local `db push` has been observed to skip already-applied versions; hosted Branching CLI has reported divergence (#5127). | **Not verified** in this review. | **Medium** |
| 10 | `supabase migration list` can be used to confirm local/remote alignment after the rename. | **Yes**. Official docs describe `migration list` as showing which migrations are applied locally and remotely and where they diverge. | **Yes**. `migration list` compares local filenames against `schema_migrations` versions. | **Not verified** in this review. | **High** |

---

## 5. Migration Engine Review

### 5.1 Identity Model

Supabase's migration engine uses a **version-based identity model**:

- Each migration file must be named `<YYYYMMDDHHMMSS>_<name>.sql` in `supabase/migrations`.
- The `YYYYMMDDHHMMSS` prefix is the **version**.
- Applied versions are recorded in `supabase_migrations.schema_migrations.version`.
- When `supabase db push` runs, it compares the set of versions in the local `supabase/migrations` directory with the set of `version` values already in `schema_migrations` and executes, in ascending version order, only those that are missing.

This means the **filename version is the primary migration identifier**; the `name` suffix is human-readable but is not used for matching.

### 5.2 What Is Not Tracked

- **No checksum column** is present in `schema_migrations` according to the provenance investigation (<ref_file file="c:/PROJECT/vietsalepro/MIGRATION_PROVENANCE_INVESTIGATION.md" />).
- **`applied_at` timestamp** is absent; only `version`, `statements`, `name`, `created_by`, `idempotency_key`, and `rollback` are recorded.
- **No content hash validation** on `db push`; if the version is already applied, the file content is not re-checked.

### 5.3 Ordering

Migrations are applied in **lexicographic/ascending `version` order**. The 9 production versions (`20260713...`) sort before the 127 matched versions that follow them, and the 2 new local-only versions (`20260718000001`, `20260723000001`) sort after the latest production version `20260718000000`.

### 5.4 Replay Detection

A migration is considered "already replayed" solely when its `version` exists in `schema_migrations`. There is no duplicate-execution guard beyond the primary-key uniqueness of `version`. If a file with a new `version` contains SQL for an object that already exists, the database (not the CLI) will raise the error.

---

## 6. CLI Capability Review

| Capability | Status | Evidence |
|------------|--------|----------|
| Repository re-baseline | **Not Supported** as a single CLI command. No `supabase migration rebase` or `rebaseline` command exists. The planned file rename is a manual/Git operation. | CLI reference; no such command documented. |
| Migration repair | **Supported**. `supabase migration repair --status applied|reverted <version>` inserts or deletes rows in `schema_migrations` without running SQL. | [Database Migrations docs](https://supabase.com/docs/guides/deployment/database-migrations); CLI reference `supabase-migration-repair`. |
| Migration reconciliation | **Partially Supported**. `supabase migration list` shows divergence; actual reconciliation requires manual file changes or `migration repair`. | Official docs describe `migration list` and `migration repair` together. |
| Migration version repair | **Supported** (same as migration repair, operates on `version`). | CLI reference. |
| Migration history repair | **Partially Supported**. `migration repair` can add/remove `schema_migrations` rows, but it does not replay or roll back SQL. | Official caution: "updates the tracking table only." |
| Migration rename support | **Not Supported**. CLI has no `migration rename` command. Renames are done via the OS/Git. | No such command in CLI reference. |
| Migration alias support | **Not Supported**. No alias or mapping table exists. Aliases must be documented outside the engine. | No such command or table. |
| Migration mapping | **Not Supported**. No native `version` mapping mechanism between repo and remote. | N/A |
| Migration ignore | **Not Supported** for individual migrations. The CLI ignores files that do not match `<timestamp>_name.sql` or are outside `supabase/migrations`. | Issue #3884 and CLI source show nested/non-canonical files are skipped. |
| Migration squash | **Supported**. `supabase migration squash` combines migrations into a single file. Not appropriate here because it would lose production history. | [CLI reference `supabase-migration-squash`](https://supabase.com/docs/reference/cli/supabase-migration-squash). |
| Migration baseline | **Not Supported**. There is no formal "baseline" concept separate from a `db pull` initial migration. | N/A |
| Migration reset | **Supported**. `supabase db reset` (local) and `supabase db reset --linked` (destructive) replay migrations. `supabase migration up` applies pending local migrations. | CLI workflows docs. |
| Migration replay | **Partially Supported**. `db reset` replays all; `db push` replays only missing. Targeted replay of one migration is not supported directly. | N/A |
| Migration verification | **Partially Supported**. `supabase migration list`, `db push --dry-run`, and `db lint` give visibility but do not verify content equality against `schema_migrations.statements`. | Official docs. |

---

## 7. Rename Feasibility Review

### 7.1 Planned Rename

The plan proposes renaming 9 repository files from their current `20260718/19/20/21/22/23/28` timestamps to the 9 production-applied `20260713...` timestamps:

| Current Repository Version | Production Version | Migration Name |
|---------------------------|--------------------|----------------|
| `20260718000002` | `20260713053550` | `sp1_6_expand_audit_log_event_types` |
| `20260719000000` | `20260713053608` | `sp2_4_announcement_audience_active_range` |
| `20260719000001` | `20260713053615` | `sp_7_2_custom_domain_verification` |
| `20260720000000` | `20260713053622` | `sp2_6_global_config_rpc` |
| `20260720000001` | `20260713053644` | `sp_7_3_licenses` |
| `20260721000000` | `20260713053657` | `sp2_7_user_management_rpc` |
| `20260722000000` | `20260713053746` | `sp2_8_role_management_rpc` |
| `20260723000000` | `20260713053807` | `sp3_1_plans_crud_features` |
| `20260728000000` | `20260713053828` | `sp5_6_db_maintenance` |

### 7.2 How the CLI Will Interpret the Renamed Files

#### Against Existing Production Database

- `supabase db push` will compare the new local filenames with `schema_migrations`.
- The 9 renamed `version` values already exist in production.
- The CLI will classify those 9 as **already applied** and skip them.
- The 2 genuinely new versions are absent from `schema_migrations`; the CLI will classify them as **new migrations** and apply them in ascending order after `20260718000000`.

#### Against Fresh Database

- A fresh database has an empty `schema_migrations` table.
- All 138 files will be classified as **new migrations** and applied in ascending `version` order.
- The 9 renamed `20260713...` files will run earlier in the sequence, before `20260714000001` and the later matched versions, exactly as they ran in production.

#### Against Existing Staging or Developer Local Database

- If the database has the old repository timestamps (`20260718/19...`) already applied, those `version` rows will remain as historical artifacts, but the corresponding files will no longer exist in `supabase/migrations`.
- This creates a divergence that should be resolved by resetting the local/staging database (`supabase db reset`) so it is rebuilt from the new canonical file set.
- The repository should not leave stale `schema_migrations` rows unaccounted for in long-lived environments.

### 7.3 Will the CLI Consider Them Already Applied, New, Conflicting, or Duplicate?

| Environment | Classification of the 9 renamed files | Reason |
|---------------|----------------------------------------|--------|
| Production | **Already applied** | Their `version` strings exist in `schema_migrations`. |
| Fresh database | **New migrations** | `schema_migrations` is empty. |
| Staging with old timestamps | **Already applied (old rows)** / **new on reset** | Old rows remain until reset; after `db reset` they are applied as new `20260713...` versions. |
| If the old `20260718...` files are kept alongside the new ones | **Conflicting / duplicate** | Duplicate `version` strings in `supabase/migrations` are not allowed and would cause a collision. |

---

## 8. Fresh Environment Review

### 8.1 Fresh Database

- `supabase db reset` (or `supabase start` on a new project) will apply all 138 migrations from `supabase/migrations` in ascending version order.
- The 9 renamed `20260713...` versions will be applied where they belong chronologically.
- The 2 genuinely new migrations will be applied after `20260718000000`.
- **Expected behavior:** A clean build that mirrors the intended full migration history, assuming the SQL statements are valid when run in that order and dependencies are satisfied.

### 8.2 Existing Production Database

- `supabase db push` will skip the 136 versions already in `schema_migrations` and apply only the 2 new versions.
- **Expected behavior:** No re-execution of the 9 renamed migrations; only `20260718000001` and `20260723000001` run.

### 8.3 Existing Staging Database

- Same as production if staging's `schema_migrations` matches production.
- If staging was built from the old repository timestamps, `db push` may attempt to apply the 9 renamed `20260713...` versions as new migrations, which will fail because their SQL creates objects that already exist.
- **Recommendation:** Reset staging from the re-baselined repository or use `migration repair --status applied` on the 9 `20260713...` versions in staging **only** after confirming the SQL is already present.

### 8.4 Developer Local Database

- If a developer has run `supabase db reset` with the old files, their `schema_migrations` contains the old `20260718/19...` versions.
- After the rename, `db reset` should be run to rebuild the local database from the canonical set; otherwise `migration list` will show local-only old versions that have no corresponding files.

---

## 9. Alternative Strategy Review

| Alternative | Official Support | Feasibility for This Scenario | Recommendation |
|-------------|------------------|-------------------------------|----------------|
| `supabase migration repair --status applied` on production for the 9 missing `20260713...` versions | Officially supported | **Not recommended** for this plan. It would modify `schema_migrations` on production, which the plan explicitly forbids, and it would not create the files in `supabase/migrations` needed for fresh environments. | Do not use on production. |
| `supabase db pull` to capture remote schema as a new migration | Officially supported | **Not recommended**. It would create a `_remote_schema.sql` file representing the current schema, but it would not reconcile the 138 individual migration histories; it would collapse history and break the audit trail. | Not suitable. |
| `supabase migration squash` | Officially supported | **Not recommended**. It would combine migrations into a single file, losing the production `schema_migrations` rows and the per-migration audit trail; fresh environments would no longer match production history. | Not suitable. |
| Rename repository files to production timestamps (the plan) | Not a CLI feature, but consistent with the migration identity model | **Recommended with modifications**. Aligns repository with `schema_migrations` without touching production. | Primary approach. |
| Add a `_remote_schema.sql` baseline and archive historical migrations | Partially supported (`db pull`) | **Not recommended**. Would abandon the 127 matched versions and the 9 renamed ones; future `db push` history would diverge from production. | Not suitable. |

---

## 10. Risk Review

| Risk | Likelihood | Impact | Classification | Mitigation |
|------|------------|--------|----------------|------------|
| Repository rename misapplied (wrong file, lost file, duplicate `version`) | Low | High — could corrupt the canonical set | **HIGH** | Use a scripted rename with pre-checks; compute SHA-256 before/after; create the `pre-rebaseline` Git tag. |
| 9 migrations re-executed on production because `version` not aligned | Low if rename correct | Critical — duplicate object errors or data loss | **CRITICAL** | Verify `supabase migration list` and `db push --dry-run` against production before actual push; never modify `schema_migrations` manually. |
| Fresh `db reset` fails due to dependency/order errors from new `20260713...` positions | Medium | High | **HIGH** | Run `supabase db reset` in an isolated fresh environment; fix SQL before acceptance. |
| Staging/local `schema_migrations` retains old `20260718/19...` rows | Medium | Medium | **MEDIUM** | Reset fresh or document expected divergence; do not push from mixed state. |
| Non-canonical `supabase/migration_*.sql` files accidentally included | Low | Medium | **MEDIUM** | Archive them before re-baseline; verify `supabase migration list` shows only the 138 canonical files. |
| Audit gap from `phatnt056` vs `suacauba@gmail.com` identity | Existing | Medium | **MEDIUM** | Record identity reconciliation in `MIGRATION_VERSION_ALIASES.md`. |
| Future hosted/Branching CLI diverges from local CLI behavior | Low | High | **HIGH** | Test `db push --dry-run` in the same CI/branching pipeline; do not rely solely on local CLI behavior. |
| Rollback of a committed re-baseline becomes difficult if others base work on it | Low | Medium | **MEDIUM** | Keep the `pre-rebaseline-2026-07-19` tag; do not push until verified; treat any post-push correction as a forward fix. |

---

## 11. Compatibility Review

| Component | Compatibility | Notes |
|-----------|---------------|-------|
| Supabase CLI | **Compatible** | `migration list`, `db push`, `db reset`, `migration repair` all understand the `version`-based identity model. |
| Supabase Dashboard | **Compatible** | Dashboard displays `schema_migrations` contents; production `schema_migrations` is not modified, so Dashboard history remains unchanged. |
| `schema_migrations` | **Compatible** | No changes to the table are required; the primary key is `version`, and the planned `version` strings already exist in production. |
| Future CLI upgrades | **Likely compatible** | Supabase has used the `version` identity model for multiple CLI releases, but no formal compatibility guarantee exists. The alias document provides a recovery reference. |
| CI/CD pipelines using `supabase db push` | **Compatible after verification** | A `db push` from the re-baselined repo will skip the 9 already-applied versions and apply the 2 new ones. |
| Fresh environment deployment | **Compatible after verification** | `db reset`/`supabase start` will replay all 138 migrations in order. |
| Production deployment | **Compatible after verification** | No remote `schema_migrations` changes; only the 2 new migrations run. |

---

## 12. Decision Matrix

| Criterion | Current Re-baseline Plan (rename to production versions) | Official `migration repair` approach on production | `db pull` + new baseline alternative |
|-----------|----------------------------------------------------------|----------------------------------------------------|--------------------------------------|
| **Technical Safety** | High — no production mutation; content verified identical. | Lower — modifies `schema_migrations` on production. | Lower — collapses history and audit trail. |
| **Operational Complexity** | Medium — 9 file renames, alias doc, fresh validation. | Medium — must run 9 repair commands and sync every environment. | Low — one `db pull`, but high long-term cost. |
| **Audit Preservation** | High — all original versions preserved; alias record adds traceability. | Medium — preserves versions but loses clean repository trace for those 9. | Low — loses per-migration history. |
| **Official Support** | Partially supported — file rename is manual; behavior aligns with documented identity model. | Supported command, but it modifies the remote tracking table. | Supported command, not suitable for this reconciliation goal. |
| **Recommendation** | **Proceed with modifications** | Not recommended for production in this plan. | Not recommended. |

---

## 13. Final Engineering Decision

```text
Repository Re-baseline Strategy:

SUPPORTED WITH MODIFICATIONS
```

### Justification

The planned rename is consistent with the Supabase migration identity model: the `version` timestamp in the filename is the key the CLI uses to match `schema_migrations`. Because the 9 production-applied `version` strings already exist in production, renaming the repository files to those strings will cause `supabase db push` to skip them. The 2 genuinely new versions will be applied as normal pending migrations. A fresh `supabase db reset` will replay all 138 migrations in the correct ascending order.

The strategy is **not** a single officially supported CLI command; it relies on a manual file rename and careful verification. Therefore it is "supported with modifications" rather than "fully supported."

---

## 14. Engineering Recommendations

Do **not** modify `REPOSITORY_REBASELINE_PLAN.md`. The following modifications and verification steps should be reflected in the authorization/implementation artifacts:

1. **Add explicit pre-rename verification commands:**
   - `supabase migration list` to confirm current divergence.
   - `git tag pre-rebaseline-2026-07-19` and verify it exists before any file renames.

2. **Add a pre-rename collision check:**
   - List all planned new filenames and confirm no duplicate `version` strings in `supabase/migrations`.
   - Confirm the 2 genuinely new versions (`20260718000001`, `20260723000001`) do not collide with any existing file or production row.

3. **Add content verification on the 9 renamed files:**
   - Compute SHA-256 before and after rename (the SQL body does not change).
   - Compare each file's contents to the corresponding `statements` array in production `schema_migrations` (already done by the provenance investigation; re-verify during implementation).

4. **Add `MIGRATION_VERSION_ALIASES.md` content:**
   - Include the 9 old→new `version` mappings.
   - Include the identity reconciliation note (`phatnt056` / `suacauba@gmail.com`).
   - Include commit references (`86b339ad`, `41b43805`, etc.) and production `created_by` evidence.

5. **Add CLI verification gates:**
   - After rename, run `supabase migration list` and confirm all 138 rows show as expected.
   - Run `supabase db reset` in a fresh local environment and confirm it completes.
   - Run `supabase db push --dry-run` against production/staging and confirm only the 2 new migrations would run.

6. **Archive the 17 non-canonical `supabase/migration_*.sql` files** before re-baseline acceptance so they cannot be picked up by any future tool.

7. **Do not run `supabase migration repair` on production.** Any use of `migration repair` should be limited to local or staging validation, because it mutates `schema_migrations`, which the plan forbids for production.

8. **Document the hosted/Branching CLI caveat.** If the project uses Supabase Branching or the hosted GitHub App for `db push`, verify the same `--dry-run` behavior there; issue #5127 shows that local CLI and hosted CLI can diverge.

### Impact and Risk Reduction

These modifications reduce the risk of accidental duplicate execution, file loss, and environment drift while preserving the production `schema_migrations` table and the audit trail.

---

## 15. Next Authorized Step

```text
REPOSITORY_REBASELINE_PLAN_REVISION.md
```

The `REPOSITORY_REBASELINE_PLAN.md` should be revised to incorporate the verification gates and checklist items above, after which the program may proceed to `REPOSITORY_REBASELINE_AUTHORIZATION.md` and then implementation.

---

## 16. References

- <ref_file file="c:/PROJECT/vietsalepro/REPOSITORY_REBASELINE_PLAN.md" />
- <ref_file file="c:/PROJECT/vietsalepro/MIGRATION_RECONCILIATION_REPORT.md" />
- <ref_file file="c:/PROJECT/vietsalepro/MIGRATION_PROVENANCE_INVESTIGATION.md" />
- <ref_file file="c:/PROJECT/vietsalepro/GOVERNANCE_EXCEPTION_REVIEW.md" />
- <https://supabase.com/docs/guides/deployment/database-migrations>
- <https://supabase.com/docs/guides/local-development/database-migrations>
- <https://supabase.com/docs/guides/local-development/cli-workflows>
- <https://supabase.com/docs/reference/cli/supabase-migration-repair>
- <https://supabase.com/docs/reference/cli/supabase-migration-squash>
- <https://supabase.com/docs/reference/cli/supabase-db-push>
- <https://supabase.com/docs/reference/cli/supabase-db-reset>
