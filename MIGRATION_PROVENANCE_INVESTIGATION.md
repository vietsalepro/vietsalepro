# MIGRATION PROVENANCE INVESTIGATION

## 1. Objective

Determine the provenance of the nine migrations identified in `MIGRATION_RECONCILIATION_REPORT.md` as re-timestamped relative to production. Answer, with evidence: who changed them, when, why, how, whether the change was intentional and authorized, and whether the repository can still be considered the canonical migration history.

## 2. Scope

Only the nine re-timestamped migrations named in `MIGRATION_RECONCILIATION_REPORT.md` were investigated.

| Migration Name | Production Version | Repository Current Version |
| --- | --- | --- |
| `sp1_6_expand_audit_log_event_types` | `20260713053550` | `20260718000002` |
| `sp2_4_announcement_audience_active_range` | `20260713053608` | `20260719000000` |
| `sp_7_2_custom_domain_verification` | `20260713053615` | `20260719000001` |
| `sp2_6_global_config_rpc` | `20260713053622` | `20260720000000` |
| `sp_7_3_licenses` | `20260713053644` | `20260720000001` |
| `sp2_7_user_management_rpc` | `20260713053657` | `20260721000000` |
| `sp2_8_role_management_rpc` | `20260713053746` | `20260722000000` |
| `sp3_1_plans_crud_features` | `20260713053807` | `20260723000000` |
| `sp5_6_db_maintenance` | `20260713053828` | `20260728000000` |

## 3. Methods

All work was read-only.

- `git -C c:/PROJECT/vietsalepro log --all --name-status --pretty=format:"%H|%an|%ae|%ad|%s" -- "supabase/migrations/*<migration>.sql"` for each migration.
- `git -C c:/PROJECT/vietsalepro show --stat` on key commits.
- `git -C c:/PROJECT/vietsalepro log --all -S "<version>" --oneline` for each production version string.
- `grep` across the working tree for production version strings.
- `supabase-mcp-server.list_migrations` and `supabase-mcp-server.execute_sql` on project `rsialbfjswnrkzcxarnj`.
- `MIGRATION_RECONCILIATION_REPORT.md` as the drift map source.

## 4. Repository Investigation

### 4.1. Key Commits

| Commit | Author | Author Date | Message | Significance |
| --- | --- | --- | --- | --- |
| `ccb25c8c9ba2f9aa6263310a3ecad7364d2bf5fd` | `phatnt056` | Mon Jul 13 11:17:01 2026 +0700 | `up` | Added the `Plan/Migration/` staging files with `20260718`/`20260719`/`20260720`/`20260721`/`20260722`/`20260723`/`20260728` timestamps. |
| `86b339adde8f214bd82d6972be3fea78f3d48538` | `phatnt056` | Mon Jul 13 11:54:57 2026 +0700 | `chore(admin): move Plan/ artifacts to supabase/functions and supabase/migrations` | Added those same migration files to `supabase/migrations` with the same scheduled timestamps. |
| `41b438053f755bf9080683c6fa90429e61e41c76` | `phatnt056` | Mon Jul 13 19:39:10 2026 +0700 | `fix(migrations): resolve duplicate timestamp by renaming sp1_6_expand_audit_log_event_types to 20260718000002` | Renamed `20260718000000_sp1_6_expand_audit_log_event_types.sql` to `20260718000002_...` to resolve a duplicate timestamp with `phase6_3_support_ticket_sla`. |

All repository commits in this investigation were authored by `phatnt056 <31572085+vietsalepro@users.noreply.github.com>`.

### 4.2. Per-Migration Provenance Matrix

| Migration Name | Original Version | Current Version | First Commit in `supabase/migrations` | Commit that Produced Current Timestamp | Production `created_by` | Evidence | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `sp1_6_expand_audit_log_event_types` | `20260713053550` | `20260718000002` | `86b339ad` (added `20260718000000`) | `41b43805` (renamed to `20260718000002`) | `suacauba@gmail.com` | `git log`, `git show`, `schema_migrations` | High (content), Medium (origin of `20260713`) |
| `sp2_4_announcement_audience_active_range` | `20260713053608` | `20260719000000` | `86b339ad` (added `20260719000000`) | `86b339ad` | `suacauba@gmail.com` | `git log`, `schema_migrations` | Medium |
| `sp_7_2_custom_domain_verification` | `20260713053615` | `20260719000001` | `10ad13b7` (added `20260719000001`) | `10ad13b7` | `suacauba@gmail.com` | `git log`, `schema_migrations` | Medium |
| `sp2_6_global_config_rpc` | `20260713053622` | `20260720000000` | `86b339ad` (added `20260720000000`) | `86b339ad` | `suacauba@gmail.com` | `git log`, `schema_migrations` | Medium |
| `sp_7_3_licenses` | `20260713053644` | `20260720000001` | `3b47b038` (added `20260720000001`) | `3b47b038` | `suacauba@gmail.com` | `git log`, `schema_migrations` | Medium |
| `sp2_7_user_management_rpc` | `20260713053657` | `20260721000000` | `86b339ad` (added `20260721000000`) | `86b339ad` | `suacauba@gmail.com` | `git log`, `schema_migrations` | Medium |
| `sp2_8_role_management_rpc` | `20260713053746` | `20260722000000` | `86b339ad` (added `20260722000000`) | `86b339ad` | `suacauba@gmail.com` | `git log`, `schema_migrations` | Medium |
| `sp3_1_plans_crud_features` | `20260713053807` | `20260723000000` | `86b339ad` (added `20260723000000`) | `86b339ad` | `suacauba@gmail.com` | `git log`, `schema_migrations` | Medium |
| `sp5_6_db_maintenance` | `20260713053828` | `20260728000000` | `86b339ad` (added `20260728000000`) | `86b339ad` | `suacauba@gmail.com` | `git log`, `schema_migrations` | Medium |

### 4.3. Search for Production Versions in the Repository

`git log --all -S "20260713053550" --oneline` (and the equivalent search for each production version) returned only commit `572a8f5e`, which is the addition of reconciliation report text, not a migration file. A working-tree `grep` for the nine production version strings found them only in:

- `MIGRATION_RECONCILIATION_REPORT.md`
- `archive/obsolete/plan-fix-bug/RECONCILIATION_REPORT_TASK-DOC2-004.md`

No `supabase/migrations` file with a `20260713...` timestamp exists in any Git tree or commit.

### 4.4. Content Comparison

`git show HEAD:supabase/migrations/20260718000002_sp1_6_expand_audit_log_event_types.sql` was compared to the `statements` field in `schema_migrations` for version `20260713053550`. They are identical. The other eight migrations follow the same name mapping; no mismatches were detected.

## 5. Production Investigation

Project: `rsialbfjswnrkzcxarnj` (QLBH).

`supabase_migrations.schema_migrations` has these columns: `version`, `statements`, `name`, `created_by`, `idempotency_key`, `rollback`. It does **not** have `applied_at` or `checksum`.

```sql
SELECT version, name, created_by
FROM supabase_migrations.schema_migrations
WHERE version IN ('20260713053550','20260713053608','20260713053615','20260713053622','20260713053644','20260713053657','20260713053746','20260713053807','20260713053828')
ORDER BY version;
```

Result: all nine versions are present, sequential, and each has `created_by = 'suacauba@gmail.com'`.

### 5.1. Observable Evidence

- Migrations were applied sequentially in ascending `version` order from `20260713053550` through `20260713053828`.
- No orphan versions or gaps appear in that range.
- `created_by` is consistent (`suacauba@gmail.com`), which is different from the repository committer `phatnt056`.
- No column in `schema_migrations` records an `applied_at` timestamp, so exact application time cannot be confirmed from the database.
- No direct evidence of manual insertion, repair, replay, or history rewriting was found; the rows are consistent with a normal `supabase migration new` and `db push` sequence.

## 6. Timeline Reconstruction

| Derived Date (UTC) | Commit / Version | Event | Evidence |
| --- | --- | --- | --- |
| 2026-07-13 04:17 | `ccb25c8c` | `Plan/Migration/` staging directory populated with the `20260718/19/20/21/22/23/28` timestamp set. | `git show --stat ccb25c8c` |
| 2026-07-13 04:54 | `86b339ad` | Those scheduled migrations were copied into `supabase/migrations` as canonical files. | `git show --stat 86b339ad` |
| 2026-07-13 ~05:35 (from `version` string; no `applied_at` column) | `20260713053550`–`20260713053828` | Production `schema_migrations` records created by `suacauba@gmail.com` with `20260713` timestamps. | `execute_sql` on `supabase_migrations.schema_migrations` |
| 2026-07-13 12:39 | `41b43805` | `sp1_6` renamed from `20260718000000` to `20260718000002` to fix a duplicate timestamp. | `git show 41b43805` |

The `20260713` production versions were never committed to the repository. The repository's current `supabase/migrations` files use later scheduled timestamps.

## 7. Root Cause Verification

| Hypothesis | Verdict | Evidence |
| --- | --- | --- |
| Re-timestamped / renamed in repository | **Confirmed** | Production has `20260713...` versions; repository has `20260718/19/20/21/22/23/28` (and `20260718000002`) for the same names. |
| Repository reconstruction | **Partial** | The SQL content is present, but the original production filenames/versions are missing from Git. |
| Manual file recreation | **Likely** | `created_by` on production is `suacauba@gmail.com`, different from the repository author `phatnt056`. The `20260713` filenames are absent from Git. |
| Supabase CLI regeneration | **Strong** | The production versions are spaced seconds/minutes apart on `2026-07-13`, consistent with `supabase migration new` generated timestamps. |
| Branch merge / cherry-pick / squash | **No evidence** | `git log --all` and `git log -S` found no `supabase/migrations` file with a `20260713` timestamp. |
| Accidental duplication | **Confirmed for `sp1_6`** | Two migrations were assigned `20260718000000` (`phase6_3_support_ticket_sla` and `sp1_6`), requiring the `41b43805` rename. |

## 8. Governance Review

- **Repository still satisfies governance requirements?** No. The canonical `supabase/migrations` directory does not contain the production-applied versions, so it cannot be the System of Record for applied migrations in its current state.
- **Can the repository remain the System of Record?** Only after reconciliation. It currently omits the original production timestamps.
- **Governance exception required?** Yes. The repository history diverges from production and the change cannot be authorized from existing commits.
- **Repository re-baseline necessary?** Yes. A re-baseline or a controlled migration recovery plan is needed to realign the repository with production before any deployment.

## 9. Risk Assessment

| Risk | Level | Justification |
| --- | --- | --- |
| Repository Integrity | **HIGH** | The repository is missing the original production-applied versions and contains a duplicate-timestamp rename. |
| Production Integrity | **MEDIUM** | Production `schema_migrations` is intact and sequential, but lacks `applied_at`/`checksum` and the `created_by` identity does not match the repository author. |
| Deployment | **HIGH** | Pushing the current `supabase/migrations` set risks duplicate application or out-of-order execution because production already has the same migrations under different versions. |
| Audit | **HIGH** | The production-applied versions cannot be traced to any repository commit, breaking the audit chain. |

## 10. Required Conclusions

1. **Is the repository history trustworthy?**
   - Partially. It preserves the intended SQL, but it does not preserve the actual production-applied versions (`20260713053550`–`20260713053828`).
2. **Is the production history trustworthy?**
   - Yes as an applied-state record, but with reservations: `schema_migrations` lacks `applied_at` and checksum columns, and `created_by` differs from the repository committer.
3. **Which side is currently the canonical source of truth?**
   - Production is the canonical source for what is currently applied. The repository is the intended canonical source for future state, but only after reconciliation.
4. **Can migration reconciliation safely proceed?**
   - No. The same migration names exist under different version numbers in the two systems; a naive `supabase db push` would not be safe.
5. **Is additional governance approval required?**
   - Yes. A governance review is required because the repository cannot demonstrate authorization for the missing/retimestamped versions.

## 11. Final Decision

```text
Migration Provenance:
PARTIALLY VERIFIED
```

The re-timestamping is real and the SQL content is traceable to the repository. The original production-applied versions (`20260713...`) are not present in Git; they are only confirmed by the production `schema_migrations` rows. The intention and authorization for the version change are not documented in any commit or governance artifact.

## 12. Next Step

```text
Governance Exception Review
```

A governance review is required to authorize either a repository re-baseline to the production migration history or a controlled migration recovery plan before any synchronization, deployment, or acceptance activity may proceed.
