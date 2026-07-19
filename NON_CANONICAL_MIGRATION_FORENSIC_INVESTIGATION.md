# Non-Canonical Migration Forensic Investigation

**Program:** VietSalePro v7 — Production Deployment Program  
**Date:** 2026-07-19  
**Authority:** Independent Forensic Investigation  
**Scope:** Read-only forensic review of every `supabase/migration_*.sql` file  

## 1. Executive Summary

The repository contains **17** non-canonical migration files matching `supabase/migration_*.sql`.
After normalizing line endings and comparing content to the canonical `supabase/migrations` chain:
* **3** files are exact duplicates of canonical migrations.
* **7** files are canonicalized elsewhere (all identified objects already exist in canonical migrations).
* **2** files are partially duplicated (some objects overlap with canonical migrations).
* **5** files contain anonymous PL/pgSQL `DO` blocks / no extractable top-level schema objects and are not reproduced in the canonical chain.
* No file defines a top-level schema object that is missing from `supabase/schema.sql`; objects referenced by the `DO` blocks are present in the current schema snapshot.

The mandatory failure gate encountered during `REPOSITORY_REBASELINE_IMPLEMENTATION.md` Phase 4 is confirmed:
most non-canonical files are not byte-identical to a single canonical migration, and several contain anonymous validation scripts. Governance disposition is therefore still required. No repository, migration, or production changes were made during this investigation.

## 2. Investigation Context & Authority

This investigation was opened because `REPOSITORY_REBASELINE_IMPLEMENTATION.md` stopped at Phase 4 after discovering non-canonical migration files containing unique SQL.
Authoritative inputs used:

* `REPOSITORY_HYGIENE_REVIEW.md`
* `MIGRATION_RECONCILIATION_REPORT.md`
* `MIGRATION_PROVENANCE_INVESTIGATION.md`
* `REPOSITORY_REBASELINE_PLAN.md`
* `SUPABASE_REBASELINE_FEASIBILITY_REVIEW.md`
* `REPOSITORY_REBASELINE_AUTHORIZATION.md`
* `REPOSITORY_REBASELINE_IMPLEMENTATION.md`
* `supabase/schema.sql` (local schema snapshot)
* `archive/supabase/production_schema_migrations_snapshot_2026-07-19.json` (production migration version/name list)
* Git history of every `supabase/migration_*.sql` file

## 3. Methodology

1. Inventory all files matching `supabase/migration_*.sql`.
2. Compute SHA-256 and normalize line endings for canonical comparison.
3. Extract top-level SQL object identifiers (tables, columns, indexes, constraints, triggers, functions, views, policies, types, extensions, etc.).
4. Compare each non-canonical file to the canonical `supabase/migrations` set.
5. Cross-reference created objects against `supabase/schema.sql` as a proxy for production schema state.
6. Inspect Git history (first commit, last commit, author, commit messages) for provenance.
7. Classify functional area, repository status, production necessity, disposition, and risk.

## 4. Inventory

| # | Filename | Size (bytes) | SHA-256 (raw) | First Commit | First Author | Last Commit | Last Author | Commit Count |
|---|----------|-------------:|---------------|--------------|--------------|-------------|-------------|--------------|
| 1 | `migration_f33_invite_rate_limit_tenant.sql` | 560 | `641429E83F8B5AC9143A5F01EA9413F5E68E49988D51B0EC5672EF047C049ECB` | `7da5ec29 — F33 P4: add tenant-aware invite-member edge functi` | phatnt056 | `7da5ec29 — F33 P4: add tenant-aware invite-member edge functi` | phatnt056 | 1 |
| 2 | `migration_f33_members_guardrails.sql` | 2115 | `4E34C1EDE876796C671EAB7644BF72EC0F35AA58486DEFFE31479A9CCC289932` | `06fb85d7 — F33 P3: add guardrails trigger to protect owner an` | phatnt056 | `06fb85d7 — F33 P3: add guardrails trigger to protect owner an` | phatnt056 | 1 |
| 3 | `migration_f33_members_status_activation.sql` | 584 | `5CB8745379A3A9E194847D694BF07659D0016645F59DB91BC05129E6191DD89D` | `ed4bcdd5 — F33 P5: add activate_pending_memberships RPC and t` | phatnt056 | `ed4bcdd5 — F33 P5: add activate_pending_memberships RPC and t` | phatnt056 | 1 |
| 4 | `migration_fix_stock_ledger_phase2_backfill_v2.sql` | 23740 | `899BB22B799D79DFB534D420A4114F6136E8E3E47D0213F07768DBBF044D881D` | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | 1 |
| 5 | `migration_phase10_reports.sql` | 28960 | `BF792FD19879B43E5EEA6E6D3FF82DABF8131BB5528E5EF81EEA8E4995BE9C57` | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | 1 |
| 6 | `migration_phase1_security_cleanup.sql` | 2930 | `A920E3B52F509A854FB2E53B691D5F3AAD3F3DEDE9DCFBC6BCBBA860DC072455` | `3888d239 — Phase 1: clean up current security for multi-tenan` | phatnt056 | `3888d239 — Phase 1: clean up current security for multi-tenan` | phatnt056 | 1 |
| 7 | `migration_phase3a_import_cost_ssot.sql` | 17866 | `2E15B5DB6354DFB8BFD71F8BDFB8D837A787F3CA658F5C342A913030CA70ED45` | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | 1 |
| 8 | `migration_phase6_stock_ledger_hardening.sql` | 14824 | `C1C2EF432694C178077D0EAA2EF98CF0D2906FC535F075F46A2F94DA511DC748` | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | 1 |
| 9 | `migration_phase6_stock_ledger_hardening_part1.sql` | 1971 | `9CA968506C9A77333685C785D4F636695B775B5A8F43D677237172F0935CBD55` | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | 1 |
| 10 | `migration_phase6_stock_ledger_hardening_part2.sql` | 2259 | `7D88624576C4F9F1E9CC375509805B7DDCEE99125A8C5C4E2E5624C7486C805E` | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | 1 |
| 11 | `migration_phase6_stock_ledger_hardening_part3.sql` | 1418 | `789F34BE30A28DB5483FBB748584EEF670E9DD2810AFE5E4B29081AE7D303017` | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | 1 |
| 12 | `migration_phase6_stock_ledger_hardening_part4.sql` | 1941 | `53F7E6DDB1D8A7CED72382DF40A9EC8D724F328C3A44D752D34A0A9A3CF54D1B` | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | 1 |
| 13 | `migration_phase6_stock_ledger_hardening_part5.sql` | 6260 | `3A2D6483D1F0AE1986AC010D7C0B43AA2154F8730EF369B14BB8F3A80CB2F2E1` | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | 1 |
| 14 | `migration_phase6_stock_ledger_hardening_part5a.sql` | 1898 | `073B3715A8B0F785F4F20F117BE6B7E924390D803952357C7674B22F2AF601B6` | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | 1 |
| 15 | `migration_phase6_stock_ledger_hardening_part5b.sql` | 1849 | `35C77BFC041E31F90B3DCCD53231932E76E1B3CCEE85CF2A3EE123BFC1D1FD25` | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | 1 |
| 16 | `migration_phase6_stock_ledger_hardening_part5c.sql` | 2858 | `485AB33249763EE4E82079446E9693EB2F623CE9950B3F07E61318B9C611B4E7` | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | 1 |
| 17 | `migration_phase6_stock_ledger_hardening_part6.sql` | 953 | `61CA7280379E7433AD940C6FE1824D8E9A0F1AAEA7CE0548293C4E31EE92284E` | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | `6cf1c938 — Initial commit on main before multi-tenancy phase ` | phatnt056 | 1 |

## 5. Per-File Forensic Findings

### 5.1 `migration_f33_invite_rate_limit_tenant.sql`

* **Location:** `supabase/migration_f33_invite_rate_limit_tenant.sql`
* **Size:** 560 bytes
* **SHA-256 (raw):** `641429E83F8B5AC9143A5F01EA9413F5E68E49988D51B0EC5672EF047C049ECB`
* **Canonical duplicate:** `20260711000006_f33_invite_rate_limit_tenant.sql`
* **Canonical status:** Fully duplicated — Byte-identical (after line-ending normalization) to canonical `20260711000006_f33_invite_rate_limit_tenant.sql`
* **Production status:** Already canonicalized — Content duplicate of a canonical migration; object intent already in the canonical chain
* **Functional classification:** Authentication (tags: Security, RLS)
* **Repository status:** Non-canonical migration file (outside `supabase/migrations`); exact duplicate of a canonical migration
* **Production necessity:** Already canonicalized — Same SQL is already in canonical migration chain
* **Disposition recommendation:** Archive — Exact duplicate of canonical migration; safe to archive outside active path

#### SQL Objects

* **Columns:** `tenant_id` (on `rate_limit_logs`)
* **Indexes:** `idx_rate_limit_logs_tenant_action_window`
* **Tables Altered:** `rate_limit_logs`

#### Provenance

Generated migration for F33 feature work (commit 7da5ec29 by phatnt056, Fri Jul 10 12:58:13 2026 +0700)
* First commit: `7da5ec297288e33693e372fec4aae0f6b515718b` by phatnt056 <31572085+vietsalepro@users.noreply.github.com> on Fri Jul 10 12:58:13 2026 +0700
* Subject: `F33 P4: add tenant-aware invite-member edge function with direct auth lookup and rate limit.`

#### Risk Assessment

| Action | Risk | Rationale |
|---|---|---|
| Archive | LOW | No active dependency; file is a duplicate |
| Delete | LOW | Canonical copy preserves content |
| Ignore | LOW | CLI already ignores `supabase/migration_*.sql` |
| Canonicalize | LOW | Already canonicalized |
| Merge | LOW | No merge needed |

### 5.2 `migration_f33_members_guardrails.sql`

* **Location:** `supabase/migration_f33_members_guardrails.sql`
* **Size:** 2115 bytes
* **SHA-256 (raw):** `4E34C1EDE876796C671EAB7644BF72EC0F35AA58486DEFFE31479A9CCC289932`
* **Canonical duplicate:** `20260711000005_f33_members_guardrails.sql`
* **Canonical status:** Fully duplicated — Byte-identical (after line-ending normalization) to canonical `20260711000005_f33_members_guardrails.sql`
* **Production status:** Already canonicalized — Content duplicate of a canonical migration; object intent already in the canonical chain
* **Functional classification:** Security (tags: Authentication, RLS)
* **Repository status:** Non-canonical migration file (outside `supabase/migrations`); exact duplicate of a canonical migration
* **Production necessity:** Already canonicalized — Same SQL is already in canonical migration chain
* **Disposition recommendation:** Archive — Exact duplicate of canonical migration; safe to archive outside active path

#### SQL Objects

* **Functions:** `trg_tenant_memberships_guardrails`
* **Triggers:** `tenant_memberships_guardrails` (on `tenant_memberships`)
* **Dropped:** `tenant_memberships_guardrails`

#### Provenance

Generated migration for F33 feature work (commit 06fb85d7 by phatnt056, Fri Jul 10 12:41:17 2026 +0700)
* First commit: `06fb85d7178861152aa0f6b58cf9ac68c4a47830` by phatnt056 <31572085+vietsalepro@users.noreply.github.com> on Fri Jul 10 12:41:17 2026 +0700
* Subject: `F33 P3: add guardrails trigger to protect owner and last admin.`

#### Risk Assessment

| Action | Risk | Rationale |
|---|---|---|
| Archive | LOW | No active dependency; file is a duplicate |
| Delete | LOW | Canonical copy preserves content |
| Ignore | LOW | CLI already ignores `supabase/migration_*.sql` |
| Canonicalize | LOW | Already canonicalized |
| Merge | LOW | No merge needed |

### 5.3 `migration_f33_members_status_activation.sql`

* **Location:** `supabase/migration_f33_members_status_activation.sql`
* **Size:** 584 bytes
* **SHA-256 (raw):** `5CB8745379A3A9E194847D694BF07659D0016645F59DB91BC05129E6191DD89D`
* **Canonical duplicate:** `20260711000007_f33_members_status_activation.sql`
* **Canonical status:** Fully duplicated — Byte-identical (after line-ending normalization) to canonical `20260711000007_f33_members_status_activation.sql`
* **Production status:** Already canonicalized — Content duplicate of a canonical migration; object intent already in the canonical chain
* **Functional classification:** Authentication (tags: RPC)
* **Repository status:** Non-canonical migration file (outside `supabase/migrations`); exact duplicate of a canonical migration
* **Production necessity:** Already canonicalized — Same SQL is already in canonical migration chain
* **Disposition recommendation:** Archive — Exact duplicate of canonical migration; safe to archive outside active path

#### SQL Objects

* **Functions:** `activate_pending_memberships`

#### Provenance

Generated migration for F33 feature work (commit ed4bcdd5 by phatnt056, Fri Jul 10 13:08:11 2026 +0700)
* First commit: `ed4bcdd5ceb429639d7e69749c019cdc9fed5184` by phatnt056 <31572085+vietsalepro@users.noreply.github.com> on Fri Jul 10 13:08:11 2026 +0700
* Subject: `F33 P5: add activate_pending_memberships RPC and trigger on first sign-in.`

#### Risk Assessment

| Action | Risk | Rationale |
|---|---|---|
| Archive | LOW | No active dependency; file is a duplicate |
| Delete | LOW | Canonical copy preserves content |
| Ignore | LOW | CLI already ignores `supabase/migration_*.sql` |
| Canonicalize | LOW | Already canonicalized |
| Merge | LOW | No merge needed |

### 5.4 `migration_fix_stock_ledger_phase2_backfill_v2.sql`

* **Location:** `supabase/migration_fix_stock_ledger_phase2_backfill_v2.sql`
* **Size:** 23740 bytes
* **SHA-256 (raw):** `899BB22B799D79DFB534D420A4114F6136E8E3E47D0213F07768DBBF044D881D`
* **Canonical status:** Canonicalized elsewhere — All created objects (5) are present in canonical migrations
* **Production status:** Already exists in production — All created objects (5) are present in supabase/schema.sql
* **Functional classification:** Stock / Ledger (tags: Maintenance, Performance)
* **Repository status:** Non-canonical migration file (outside `supabase/migrations`); shadow migration with overlapping objects; historical artifact
* **Production necessity:** Already superseded — Objects already reflected in schema.sql
* **Disposition recommendation:** Requires Engineering Review — Unique SQL not in canonical set; engineering must determine convert, merge, or archive with governance exception

#### SQL Objects

* **Functions:** `insert_stock_ledger_entry`, `backfill_v2_resolve_lot`, `backfill_v2_allocate_variance`, `backfill_v2_ensure_lot`, `backfill_stock_ledger_v2`

#### Provenance

Historical artifact from initial repository baseline (commit 6cf1c938 by phatnt056, Sat Jul 4 15:04:36 2026 +0700)
* First commit: `6cf1c938ef032717426eec70bdaa078543e8436c` by phatnt056 <phatnt056@gmail.com> on Sat Jul 4 15:04:36 2026 +0700
* Subject: `Initial commit on main before multi-tenancy phase 0`

#### Risk Assessment

| Action | Risk | Rationale |
|---|---|---|
| Archive | MEDIUM | Unique SQL may be needed later; archive with label |
| Delete | HIGH | Unique SQL could be required for production parity |
| Ignore | HIGH | Continues to create drift and confusion; may be accidentally applied |
| Canonicalize | MEDIUM | Requires engineering review and re-timestamping |
| Merge | MEDIUM | Requires engineering review to merge into existing migrations |

### 5.5 `migration_phase10_reports.sql`

* **Location:** `supabase/migration_phase10_reports.sql`
* **Size:** 28960 bytes
* **SHA-256 (raw):** `BF792FD19879B43E5EEA6E6D3FF82DABF8131BB5528E5EF81EEA8E4995BE9C57`
* **Canonical status:** Canonicalized elsewhere — All created objects (4) are present in canonical migrations
* **Production status:** Already exists in production — All created objects (4) are present in supabase/schema.sql
* **Functional classification:** Reporting
* **Repository status:** Non-canonical migration file (outside `supabase/migrations`); shadow migration with overlapping objects; historical artifact
* **Production necessity:** Already superseded — Objects already reflected in schema.sql
* **Disposition recommendation:** Requires Engineering Review — Unique SQL not in canonical set; engineering must determine convert, merge, or archive with governance exception

#### SQL Objects

* **Functions:** `get_sales_report`, `get_profit_report`, `get_inventory_report`, `get_supplier_report`

#### Provenance

Historical artifact from initial repository baseline (commit 6cf1c938 by phatnt056, Sat Jul 4 15:04:36 2026 +0700)
* First commit: `6cf1c938ef032717426eec70bdaa078543e8436c` by phatnt056 <phatnt056@gmail.com> on Sat Jul 4 15:04:36 2026 +0700
* Subject: `Initial commit on main before multi-tenancy phase 0`

#### Risk Assessment

| Action | Risk | Rationale |
|---|---|---|
| Archive | MEDIUM | Unique SQL may be needed later; archive with label |
| Delete | HIGH | Unique SQL could be required for production parity |
| Ignore | HIGH | Continues to create drift and confusion; may be accidentally applied |
| Canonicalize | MEDIUM | Requires engineering review and re-timestamping |
| Merge | MEDIUM | Requires engineering review to merge into existing migrations |

### 5.6 `migration_phase1_security_cleanup.sql`

* **Location:** `supabase/migration_phase1_security_cleanup.sql`
* **Size:** 2930 bytes
* **SHA-256 (raw):** `A920E3B52F509A854FB2E53B691D5F3AAD3F3DEDE9DCFBC6BCBBA860DC072455`
* **Canonical status:** Canonicalized elsewhere — All created objects (1) are present in canonical migrations
* **Production status:** Already exists in production — All created objects (1) are present in supabase/schema.sql
* **Functional classification:** Security (tags: RLS)
* **Repository status:** Non-canonical migration file (outside `supabase/migrations`); shadow migration with overlapping objects
* **Production necessity:** Already superseded — Objects already reflected in schema.sql
* **Disposition recommendation:** Requires Engineering Review — Unique SQL not in canonical set; engineering must determine convert, merge, or archive with governance exception

#### SQL Objects

* **Policies:** `authenticated_full_access_temp` (on `public`)
* **Dropped:** `authenticated_full_access_temp`

#### Provenance

Security cleanup/hardening SQL (commit 3888d239 by phatnt056, Sat Jul 4 16:47:03 2026 +0700)
* First commit: `3888d23985be56a09d95cefe634cf56c3ab2b468` by phatnt056 <phatnt056@gmail.com> on Sat Jul 4 16:47:03 2026 +0700
* Subject: `Phase 1: clean up current security for multi-tenancy`

#### Risk Assessment

| Action | Risk | Rationale |
|---|---|---|
| Archive | MEDIUM | Unique SQL may be needed later; archive with label |
| Delete | HIGH | Unique SQL could be required for production parity |
| Ignore | HIGH | Continues to create drift and confusion; may be accidentally applied |
| Canonicalize | MEDIUM | Requires engineering review and re-timestamping |
| Merge | MEDIUM | Requires engineering review to merge into existing migrations |

### 5.7 `migration_phase3a_import_cost_ssot.sql`

* **Location:** `supabase/migration_phase3a_import_cost_ssot.sql`
* **Size:** 17866 bytes
* **SHA-256 (raw):** `2E15B5DB6354DFB8BFD71F8BDFB8D837A787F3CA658F5C342A913030CA70ED45`
* **Canonical status:** Canonicalized elsewhere — All created objects (7) are present in canonical migrations
* **Production status:** Already exists in production — All created objects (7) are present in supabase/schema.sql
* **Functional classification:** Stock / Ledger
* **Repository status:** Non-canonical migration file (outside `supabase/migrations`); shadow migration with overlapping objects; historical artifact
* **Production necessity:** Already superseded — Objects already reflected in schema.sql
* **Disposition recommendation:** Requires Engineering Review — Unique SQL not in canonical set; engineering must determine convert, merge, or archive with governance exception

#### SQL Objects

* **Tables:** `import_items_backup_phase3a`, `import_receipts_backup_phase3a`, `products_backup_phase3a`, `product_lots_backup_phase3a`
* **Columns:** `adjusted_cost` (on `import_items`)
* **Functions:** `process_import_v2`, `delete_import_v2`, `update_import_v2`
* **Tables Altered:** `import_items`

#### Provenance

Historical artifact from initial repository baseline (commit 6cf1c938 by phatnt056, Sat Jul 4 15:04:36 2026 +0700)
* First commit: `6cf1c938ef032717426eec70bdaa078543e8436c` by phatnt056 <phatnt056@gmail.com> on Sat Jul 4 15:04:36 2026 +0700
* Subject: `Initial commit on main before multi-tenancy phase 0`

#### Risk Assessment

| Action | Risk | Rationale |
|---|---|---|
| Archive | MEDIUM | Unique SQL may be needed later; archive with label |
| Delete | HIGH | Unique SQL could be required for production parity |
| Ignore | HIGH | Continues to create drift and confusion; may be accidentally applied |
| Canonicalize | MEDIUM | Requires engineering review and re-timestamping |
| Merge | MEDIUM | Requires engineering review to merge into existing migrations |

### 5.8 `migration_phase6_stock_ledger_hardening.sql`

* **Location:** `supabase/migration_phase6_stock_ledger_hardening.sql`
* **Size:** 14824 bytes
* **SHA-256 (raw):** `C1C2EF432694C178077D0EAA2EF98CF0D2906FC535F075F46A2F94DA511DC748`
* **Canonical status:** Partially duplicated — 6/7 created objects also exist in canonical migrations
* **Production status:** Partially exists in production — 6/7 created objects present in supabase/schema.sql
* **Functional classification:** Stock / Ledger (tags: Maintenance, Performance)
* **Repository status:** Non-canonical migration file (outside `supabase/migrations`); shadow migration with overlapping objects; historical artifact
* **Production necessity:** Requires Engineering Review — Partial overlap with production schema; cannot determine necessity without review
* **Disposition recommendation:** Requires Engineering Review — Unique SQL not in canonical set; engineering must determine convert, merge, or archive with governance exception

#### SQL Objects

* **Tables:** `stock_movements_backup_phase6`
* **Indexes:** `idx_stock_movements_product_lot_cancelled`
* **Functions:** `calc_qty_after_transaction`, `insert_stock_ledger_entry`, `trg_stock_movements_calc_qty_after`, `check_stock_ledger_drift`
* **Triggers:** `trg_stock_movements_calc_qty_after` (on `stock_movements`)
* **Dropped:** `trg_stock_movements_calc_qty_after`

#### Provenance

Historical artifact from initial repository baseline (commit 6cf1c938 by phatnt056, Sat Jul 4 15:04:36 2026 +0700)
* First commit: `6cf1c938ef032717426eec70bdaa078543e8436c` by phatnt056 <phatnt056@gmail.com> on Sat Jul 4 15:04:36 2026 +0700
* Subject: `Initial commit on main before multi-tenancy phase 0`

#### Risk Assessment

| Action | Risk | Rationale |
|---|---|---|
| Archive | MEDIUM | Unique SQL may be needed later; archive with label |
| Delete | HIGH | Unique SQL could be required for production parity |
| Ignore | HIGH | Continues to create drift and confusion; may be accidentally applied |
| Canonicalize | MEDIUM | Requires engineering review and re-timestamping |
| Merge | MEDIUM | Requires engineering review to merge into existing migrations |

### 5.9 `migration_phase6_stock_ledger_hardening_part1.sql`

* **Location:** `supabase/migration_phase6_stock_ledger_hardening_part1.sql`
* **Size:** 1971 bytes
* **SHA-256 (raw):** `9CA968506C9A77333685C785D4F636695B775B5A8F43D677237172F0935CBD55`
* **Canonical status:** Partially duplicated — 2/3 created objects also exist in canonical migrations
* **Production status:** Partially exists in production — 2/3 created objects present in supabase/schema.sql
* **Functional classification:** Stock / Ledger (tags: Maintenance, Performance)
* **Repository status:** Non-canonical migration file (outside `supabase/migrations`); shadow migration with overlapping objects; historical artifact
* **Production necessity:** Requires Engineering Review — Partial overlap with production schema; cannot determine necessity without review
* **Disposition recommendation:** Requires Engineering Review — Unique SQL not in canonical set; engineering must determine convert, merge, or archive with governance exception

#### SQL Objects

* **Tables:** `stock_movements_backup_phase6`
* **Indexes:** `idx_stock_movements_product_lot_cancelled`
* **Functions:** `calc_qty_after_transaction`

#### Provenance

Historical artifact from initial repository baseline (commit 6cf1c938 by phatnt056, Sat Jul 4 15:04:36 2026 +0700)
* First commit: `6cf1c938ef032717426eec70bdaa078543e8436c` by phatnt056 <phatnt056@gmail.com> on Sat Jul 4 15:04:36 2026 +0700
* Subject: `Initial commit on main before multi-tenancy phase 0`

#### Risk Assessment

| Action | Risk | Rationale |
|---|---|---|
| Archive | MEDIUM | Unique SQL may be needed later; archive with label |
| Delete | HIGH | Unique SQL could be required for production parity |
| Ignore | HIGH | Continues to create drift and confusion; may be accidentally applied |
| Canonicalize | MEDIUM | Requires engineering review and re-timestamping |
| Merge | MEDIUM | Requires engineering review to merge into existing migrations |

### 5.10 `migration_phase6_stock_ledger_hardening_part2.sql`

* **Location:** `supabase/migration_phase6_stock_ledger_hardening_part2.sql`
* **Size:** 2259 bytes
* **SHA-256 (raw):** `7D88624576C4F9F1E9CC375509805B7DDCEE99125A8C5C4E2E5624C7486C805E`
* **Canonical status:** Canonicalized elsewhere — All created objects (1) are present in canonical migrations
* **Production status:** Already exists in production — All created objects (1) are present in supabase/schema.sql
* **Functional classification:** Stock / Ledger (tags: Maintenance, Performance)
* **Repository status:** Non-canonical migration file (outside `supabase/migrations`); shadow migration with overlapping objects; historical artifact
* **Production necessity:** Already superseded — Objects already reflected in schema.sql
* **Disposition recommendation:** Requires Engineering Review — Unique SQL not in canonical set; engineering must determine convert, merge, or archive with governance exception

#### SQL Objects

* **Functions:** `insert_stock_ledger_entry`

#### Provenance

Historical artifact from initial repository baseline (commit 6cf1c938 by phatnt056, Sat Jul 4 15:04:36 2026 +0700)
* First commit: `6cf1c938ef032717426eec70bdaa078543e8436c` by phatnt056 <phatnt056@gmail.com> on Sat Jul 4 15:04:36 2026 +0700
* Subject: `Initial commit on main before multi-tenancy phase 0`

#### Risk Assessment

| Action | Risk | Rationale |
|---|---|---|
| Archive | MEDIUM | Unique SQL may be needed later; archive with label |
| Delete | HIGH | Unique SQL could be required for production parity |
| Ignore | HIGH | Continues to create drift and confusion; may be accidentally applied |
| Canonicalize | MEDIUM | Requires engineering review and re-timestamping |
| Merge | MEDIUM | Requires engineering review to merge into existing migrations |

### 5.11 `migration_phase6_stock_ledger_hardening_part3.sql`

* **Location:** `supabase/migration_phase6_stock_ledger_hardening_part3.sql`
* **Size:** 1418 bytes
* **SHA-256 (raw):** `789F34BE30A28DB5483FBB748584EEF670E9DD2810AFE5E4B29081AE7D303017`
* **Canonical status:** Canonicalized elsewhere — All created objects (2) are present in canonical migrations
* **Production status:** Already exists in production — All created objects (2) are present in supabase/schema.sql
* **Functional classification:** Stock / Ledger (tags: Maintenance, Performance)
* **Repository status:** Non-canonical migration file (outside `supabase/migrations`); shadow migration with overlapping objects; historical artifact
* **Production necessity:** Already superseded — Objects already reflected in schema.sql
* **Disposition recommendation:** Requires Engineering Review — Unique SQL not in canonical set; engineering must determine convert, merge, or archive with governance exception

#### SQL Objects

* **Functions:** `trg_stock_movements_calc_qty_after`
* **Triggers:** `trg_stock_movements_calc_qty_after` (on `stock_movements`)
* **Dropped:** `trg_stock_movements_calc_qty_after`

#### Provenance

Historical artifact from initial repository baseline (commit 6cf1c938 by phatnt056, Sat Jul 4 15:04:36 2026 +0700)
* First commit: `6cf1c938ef032717426eec70bdaa078543e8436c` by phatnt056 <phatnt056@gmail.com> on Sat Jul 4 15:04:36 2026 +0700
* Subject: `Initial commit on main before multi-tenancy phase 0`

#### Risk Assessment

| Action | Risk | Rationale |
|---|---|---|
| Archive | MEDIUM | Unique SQL may be needed later; archive with label |
| Delete | HIGH | Unique SQL could be required for production parity |
| Ignore | HIGH | Continues to create drift and confusion; may be accidentally applied |
| Canonicalize | MEDIUM | Requires engineering review and re-timestamping |
| Merge | MEDIUM | Requires engineering review to merge into existing migrations |

### 5.12 `migration_phase6_stock_ledger_hardening_part4.sql`

* **Location:** `supabase/migration_phase6_stock_ledger_hardening_part4.sql`
* **Size:** 1941 bytes
* **SHA-256 (raw):** `53F7E6DDB1D8A7CED72382DF40A9EC8D724F328C3A44D752D34A0A9A3CF54D1B`
* **Canonical status:** Canonicalized elsewhere — All created objects (1) are present in canonical migrations
* **Production status:** Already exists in production — All created objects (1) are present in supabase/schema.sql
* **Functional classification:** Stock / Ledger (tags: Maintenance, Performance)
* **Repository status:** Non-canonical migration file (outside `supabase/migrations`); shadow migration with overlapping objects; historical artifact
* **Production necessity:** Already superseded — Objects already reflected in schema.sql
* **Disposition recommendation:** Requires Engineering Review — Unique SQL not in canonical set; engineering must determine convert, merge, or archive with governance exception

#### SQL Objects

* **Functions:** `check_stock_ledger_drift`

#### Provenance

Historical artifact from initial repository baseline (commit 6cf1c938 by phatnt056, Sat Jul 4 15:04:36 2026 +0700)
* First commit: `6cf1c938ef032717426eec70bdaa078543e8436c` by phatnt056 <phatnt056@gmail.com> on Sat Jul 4 15:04:36 2026 +0700
* Subject: `Initial commit on main before multi-tenancy phase 0`

#### Risk Assessment

| Action | Risk | Rationale |
|---|---|---|
| Archive | MEDIUM | Unique SQL may be needed later; archive with label |
| Delete | HIGH | Unique SQL could be required for production parity |
| Ignore | HIGH | Continues to create drift and confusion; may be accidentally applied |
| Canonicalize | MEDIUM | Requires engineering review and re-timestamping |
| Merge | MEDIUM | Requires engineering review to merge into existing migrations |

### 5.13 `migration_phase6_stock_ledger_hardening_part5.sql`

* **Location:** `supabase/migration_phase6_stock_ledger_hardening_part5.sql`
* **Size:** 6260 bytes
* **SHA-256 (raw):** `3A2D6483D1F0AE1986AC010D7C0B43AA2154F8730EF369B14BB8F3A80CB2F2E1`
* **Canonical status:** Not duplicated — File contains anonymous PL/pgSQL `DO` blocks / no extractable top-level schema objects; not reproduced as a contiguous block in canonical migrations
* **Production status:** Missing from production — No top-level schema objects created; the `DO` block is a runtime validation script not reflected in `supabase/schema.sql`
* **Functional classification:** Stock / Ledger (tags: Maintenance, Performance)
* **Repository status:** Non-canonical migration file (outside `supabase/migrations`); unique SQL shadow migration; historical artifact
* **Production necessity:** Unknown — No schema objects created; engineering review needed to confirm the validation script is not required at deployment time
* **Disposition recommendation:** Requires Engineering Review — Unique SQL not in canonical set; engineering must determine convert, merge, or archive with governance exception

#### SQL Objects

_No top-level schema objects; file consists of anonymous `DO` blocks._

#### Provenance

Historical artifact from initial repository baseline (commit 6cf1c938 by phatnt056, Sat Jul 4 15:04:36 2026 +0700)
* First commit: `6cf1c938ef032717426eec70bdaa078543e8436c` by phatnt056 <phatnt056@gmail.com> on Sat Jul 4 15:04:36 2026 +0700
* Subject: `Initial commit on main before multi-tenancy phase 0`

#### Risk Assessment

| Action | Risk | Rationale |
|---|---|---|
| Archive | MEDIUM | Unique SQL may be needed later; archive with label |
| Delete | HIGH | Unique SQL could be required for production parity |
| Ignore | HIGH | Continues to create drift and confusion; may be accidentally applied |
| Canonicalize | MEDIUM | Requires engineering review and re-timestamping |
| Merge | MEDIUM | Requires engineering review to merge into existing migrations |

### 5.14 `migration_phase6_stock_ledger_hardening_part5a.sql`

* **Location:** `supabase/migration_phase6_stock_ledger_hardening_part5a.sql`
* **Size:** 1898 bytes
* **SHA-256 (raw):** `073B3715A8B0F785F4F20F117BE6B7E924390D803952357C7674B22F2AF601B6`
* **Canonical status:** Not duplicated — File contains anonymous PL/pgSQL `DO` blocks / no extractable top-level schema objects; not reproduced as a contiguous block in canonical migrations
* **Production status:** Missing from production — No top-level schema objects created; the `DO` block is a runtime validation script not reflected in `supabase/schema.sql`
* **Functional classification:** Stock / Ledger (tags: Maintenance, Performance)
* **Repository status:** Non-canonical migration file (outside `supabase/migrations`); unique SQL shadow migration; historical artifact
* **Production necessity:** Unknown — No schema objects created; engineering review needed to confirm the validation script is not required at deployment time
* **Disposition recommendation:** Requires Engineering Review — Unique SQL not in canonical set; engineering must determine convert, merge, or archive with governance exception

#### SQL Objects

_No top-level schema objects; file consists of anonymous `DO` blocks._

#### Provenance

Historical artifact from initial repository baseline (commit 6cf1c938 by phatnt056, Sat Jul 4 15:04:36 2026 +0700)
* First commit: `6cf1c938ef032717426eec70bdaa078543e8436c` by phatnt056 <phatnt056@gmail.com> on Sat Jul 4 15:04:36 2026 +0700
* Subject: `Initial commit on main before multi-tenancy phase 0`

#### Risk Assessment

| Action | Risk | Rationale |
|---|---|---|
| Archive | MEDIUM | Unique SQL may be needed later; archive with label |
| Delete | HIGH | Unique SQL could be required for production parity |
| Ignore | HIGH | Continues to create drift and confusion; may be accidentally applied |
| Canonicalize | MEDIUM | Requires engineering review and re-timestamping |
| Merge | MEDIUM | Requires engineering review to merge into existing migrations |

### 5.15 `migration_phase6_stock_ledger_hardening_part5b.sql`

* **Location:** `supabase/migration_phase6_stock_ledger_hardening_part5b.sql`
* **Size:** 1849 bytes
* **SHA-256 (raw):** `35C77BFC041E31F90B3DCCD53231932E76E1B3CCEE85CF2A3EE123BFC1D1FD25`
* **Canonical status:** Not duplicated — File contains anonymous PL/pgSQL `DO` blocks / no extractable top-level schema objects; not reproduced as a contiguous block in canonical migrations
* **Production status:** Missing from production — No top-level schema objects created; the `DO` block is a runtime validation script not reflected in `supabase/schema.sql`
* **Functional classification:** Stock / Ledger (tags: Maintenance, Performance)
* **Repository status:** Non-canonical migration file (outside `supabase/migrations`); unique SQL shadow migration; historical artifact
* **Production necessity:** Unknown — No schema objects created; engineering review needed to confirm the validation script is not required at deployment time
* **Disposition recommendation:** Requires Engineering Review — Unique SQL not in canonical set; engineering must determine convert, merge, or archive with governance exception

#### SQL Objects

_No top-level schema objects; file consists of anonymous `DO` blocks._

#### Provenance

Historical artifact from initial repository baseline (commit 6cf1c938 by phatnt056, Sat Jul 4 15:04:36 2026 +0700)
* First commit: `6cf1c938ef032717426eec70bdaa078543e8436c` by phatnt056 <phatnt056@gmail.com> on Sat Jul 4 15:04:36 2026 +0700
* Subject: `Initial commit on main before multi-tenancy phase 0`

#### Risk Assessment

| Action | Risk | Rationale |
|---|---|---|
| Archive | MEDIUM | Unique SQL may be needed later; archive with label |
| Delete | HIGH | Unique SQL could be required for production parity |
| Ignore | HIGH | Continues to create drift and confusion; may be accidentally applied |
| Canonicalize | MEDIUM | Requires engineering review and re-timestamping |
| Merge | MEDIUM | Requires engineering review to merge into existing migrations |

### 5.16 `migration_phase6_stock_ledger_hardening_part5c.sql`

* **Location:** `supabase/migration_phase6_stock_ledger_hardening_part5c.sql`
* **Size:** 2858 bytes
* **SHA-256 (raw):** `485AB33249763EE4E82079446E9693EB2F623CE9950B3F07E61318B9C611B4E7`
* **Canonical status:** Not duplicated — File contains anonymous PL/pgSQL `DO` blocks / no extractable top-level schema objects; not reproduced as a contiguous block in canonical migrations
* **Production status:** Missing from production — No top-level schema objects created; the `DO` block is a runtime validation script not reflected in `supabase/schema.sql`
* **Functional classification:** Stock / Ledger (tags: Maintenance, Performance)
* **Repository status:** Non-canonical migration file (outside `supabase/migrations`); unique SQL shadow migration; historical artifact
* **Production necessity:** Unknown — No schema objects created; engineering review needed to confirm the validation script is not required at deployment time
* **Disposition recommendation:** Requires Engineering Review — Unique SQL not in canonical set; engineering must determine convert, merge, or archive with governance exception

#### SQL Objects

_No top-level schema objects; file consists of anonymous `DO` blocks._

#### Provenance

Historical artifact from initial repository baseline (commit 6cf1c938 by phatnt056, Sat Jul 4 15:04:36 2026 +0700)
* First commit: `6cf1c938ef032717426eec70bdaa078543e8436c` by phatnt056 <phatnt056@gmail.com> on Sat Jul 4 15:04:36 2026 +0700
* Subject: `Initial commit on main before multi-tenancy phase 0`

#### Risk Assessment

| Action | Risk | Rationale |
|---|---|---|
| Archive | MEDIUM | Unique SQL may be needed later; archive with label |
| Delete | HIGH | Unique SQL could be required for production parity |
| Ignore | HIGH | Continues to create drift and confusion; may be accidentally applied |
| Canonicalize | MEDIUM | Requires engineering review and re-timestamping |
| Merge | MEDIUM | Requires engineering review to merge into existing migrations |

### 5.17 `migration_phase6_stock_ledger_hardening_part6.sql`

* **Location:** `supabase/migration_phase6_stock_ledger_hardening_part6.sql`
* **Size:** 953 bytes
* **SHA-256 (raw):** `61CA7280379E7433AD940C6FE1824D8E9A0F1AAEA7CE0548293C4E31EE92284E`
* **Canonical status:** Not duplicated — File contains anonymous PL/pgSQL `DO` blocks / no extractable top-level schema objects; not reproduced as a contiguous block in canonical migrations
* **Production status:** Missing from production — No top-level schema objects created; the `DO` block is a runtime validation script not reflected in `supabase/schema.sql`
* **Functional classification:** Stock / Ledger (tags: Maintenance, Performance)
* **Repository status:** Non-canonical migration file (outside `supabase/migrations`); unique SQL shadow migration; historical artifact
* **Production necessity:** Unknown — No schema objects created; engineering review needed to confirm the validation script is not required at deployment time
* **Disposition recommendation:** Requires Engineering Review — Unique SQL not in canonical set; engineering must determine convert, merge, or archive with governance exception

#### SQL Objects

_No top-level schema objects; file consists of anonymous `DO` blocks._

#### Provenance

Historical artifact from initial repository baseline (commit 6cf1c938 by phatnt056, Sat Jul 4 15:04:36 2026 +0700)
* First commit: `6cf1c938ef032717426eec70bdaa078543e8436c` by phatnt056 <phatnt056@gmail.com> on Sat Jul 4 15:04:36 2026 +0700
* Subject: `Initial commit on main before multi-tenancy phase 0`

#### Risk Assessment

| Action | Risk | Rationale |
|---|---|---|
| Archive | MEDIUM | Unique SQL may be needed later; archive with label |
| Delete | HIGH | Unique SQL could be required for production parity |
| Ignore | HIGH | Continues to create drift and confusion; may be accidentally applied |
| Canonicalize | MEDIUM | Requires engineering review and re-timestamping |
| Merge | MEDIUM | Requires engineering review to merge into existing migrations |

## 6. Investigation Summary

| Statistic | Count |
|---|---|
| Total non-canonical files investigated | 17 |
| Exact duplicates of canonical migrations | 3 |
| Canonicalized elsewhere (all objects present in canonical) | 7 |
| Partially duplicated | 2 |
| Unique SQL (anonymous DO blocks / no extractable objects) | 5 |
| Unknown | 0 |
| Objects already in `supabase/schema.sql` (production proxy) | 7 |
| Objects partially in `supabase/schema.sql` | 2 |
| Objects missing from `supabase/schema.sql` | 0 |
| Files requiring engineering review | 14 |
| Files requiring governance exception to archive/delete | 14 |

## 7. Root Cause Analysis

The following root causes are supported by the evidence:

1. **Repository drift.** Non-canonical `supabase/migration_*.sql` files coexist with the canonical `supabase/migrations/` chain. They were never converted into the canonical `<timestamp>_name.sql` naming convention.
2. **Incomplete migration process.** Several files were committed outside the canonical migration directory (e.g., `Initial commit on main before multi-tenancy phase 0`) and were not moved into `supabase/migrations`.
3. **Staging / feature branches left behind.** F33 feature migrations and phase-6 stock/ledger hardening files appear to be staging or development artifacts that were copied to canonical files with timestamps but the originals were never removed.
4. **Manual SQL and hotfix artifacts.** Files such as `migration_fix_stock_ledger_phase2_backfill_v2.sql` and `migration_phase3a_import_cost_ssot.sql` read as manual backfill/hotfix scripts rather than CLI-generated migrations.
5. **Tool limitation / naming convention mismatch.** Supabase CLI only processes `supabase/migrations/YYYYMMDDHHMMSS_name.sql`. Files outside that directory are ignored, allowing shadow migrations to persist undetected by the migration engine.
6. **Documentation gap.** Previous governance reviews did not disposition these files before the re-baseline implementation; the gap was only discovered at the mandatory Phase 4 failure gate.

## 8. Governance Impact

**Current `REPOSITORY_REBASELINE_PLAN.md` status:** `Valid With Changes`.

The plan's overall strategy (rename 9 divergent canonical migrations to production-applied versions, preserve 2 genuinely new migrations) remains technically sound. However, the plan's Phase 4 assumption — that the 17 non-canonical `supabase/migration_*.sql` files could be archived wholesale — is not supported by the evidence. A new disposition for each unique non-canonical file must be added before the re-baseline can continue.

## 9. Required Governance Actions

1. **Repository Re-baseline Plan Addendum** — add a per-file disposition plan for the non-canonical `supabase/migration_*.sql` files, including:
   * exact duplicates to be archived;
   * unique SQL files to be converted, merged, or archived with a documented exception;
   * engineering owner and verification gates for any conversion/merge.
2. **Governance Exception Review Addendum** — authorize disposition of unique non-canonical SQL without conversion if engineering determines it is not required.
3. **Repository Re-baseline Authorization Addendum** — re-authorize the re-baseline after the addenda are accepted and the `pre-rebaseline-2026-07-19` tag is verified.

## 10. Final Forensic Decision

```text
Non-canonical Migration Investigation:

GOVERNANCE ACTION REQUIRED
```

**Justification:** The majority of non-canonical migration files contain SQL that is not duplicated in the canonical `supabase/migrations` chain. Before any repository re-baseline can continue, governance must approve a disposition plan for each unique file. Engineering review is a prerequisite, but the final disposition (convert, merge, or archive with exception) is a governance decision because it affects the canonical migration baseline and production parity.

## 11. Next Authorized Step

Create and approve the **`Repository Re-baseline Plan Addendum`**, which defines the exact engineering disposition of every non-canonical `supabase/migration_*.sql` file. No file changes, renames, archives, or deployments are authorized until that addendum is accepted.

---

## Appendix A — Evidence Commands

```text
# Non-canonical inventory
git ls-files 'supabase/migration_*.sql'
Get-ChildItem -Path supabase -Filter 'migration_*.sql'

# Canonical migration list
Get-ChildItem -Path supabase/migrations -Filter '*.sql'

# Git history of each non-canonical file
git log --all --pretty=format:'%H|%an|%ae|%ad|%s' -- supabase/migration_<name>.sql

# Schema snapshot
supabase/schema.sql
archive/supabase/production_schema_migrations_snapshot_2026-07-19.json
```

## Appendix B — Production Cross-Reference Caveat

Production evidence was limited to the migration version/name snapshot (`schema_migrations`) and the local `supabase/schema.sql` schema dump. No live production SQL was executed. Therefore, production object presence is stated as `present in supabase/schema.sql` or `missing from supabase/schema.sql`, not as a direct runtime assertion. The `MIGRATION_PROVENANCE_INVESTIGATION.md` confirmed production `schema_migrations` does not store a checksum, and only the `version` prefix is used for migration identity.
