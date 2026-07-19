# REPOSITORY RE-BASELINE IMPLEMENTATION RESUME

**Program:** VietSalePro v7 — Production Deployment Program
**Date:** 2026-07-19
**Executor:** Engineering Implementation Authority
**Authority:** `REPOSITORY_REBASELINE_AUTHORIZATION_ADDENDUM.md` — AUTHORIZED WITH CONDITIONS

---

## Objective

Resume the interrupted Repository Re-baseline Implementation from the authorized stop point. Execute only the approved scope from the Authorization Addendum and record every action.

---

## Authoritative Inputs

- `REPOSITORY_REBASELINE_PLAN.md`
- `REPOSITORY_REBASELINE_IMPLEMENTATION.md`
- `NON_CANONICAL_MIGRATION_FORENSIC_INVESTIGATION.md`
- `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md`
- `GOVERNANCE_EXCEPTION_REVIEW_ADDENDUM.md`
- `REPOSITORY_REBASELINE_AUTHORIZATION_ADDENDUM.md`

---

## Phase 1 — Pre-Implementation Conditions

| Mandatory Condition | Result | Evidence |
|---|---|---|
| Rollback tag `pre-rebaseline-2026-07-19` points to baseline `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c` | PASS | `git rev-parse pre-rebaseline-2026-07-19^{commit}` = `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c` |
| Engineering object-equivalence attestations | PASS | See Section 3.4 |
| Partial-duplicate reconciliation | PASS WITH CONDITIONS | See Section 3.5 |
| Anonymous DO-block engineering review | PASS | `get_product_stock_balance` only defined, not called, in canonical chain; `calc_qty_after_transaction` is used |
| Governance document consistency | PASS | All required governance artifacts present |

**Phase 1 result:** PASS

---

## Phase 2 — Repository Baseline Recovery

Restored `supabase/migrations` to the approved pre-rebaseline baseline from tag `pre-rebaseline-2026-07-19` (`6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c`).

```text
git reset HEAD -- supabase/migrations
git clean -fd supabase/migrations
git checkout HEAD -- supabase/migrations
```

Verification:

- Rollback tag: `pre-rebaseline-2026-07-19` -> `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c`
- Baseline commit: `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c`
- `supabase/migrations` restored to 138 files before renames

---

## Phase 3 — Execute Approved Repository Re-baseline

### 3.1 Canonical Migration Renames

| Original filename | New filename | SHA-256 before | SHA-256 after | Identical? |
|---|---|---|---|---|
| `supabase/migrations/20260718000002_sp1_6_expand_audit_log_event_types.sql` | `supabase/migrations/20260713053550_sp1_6_expand_audit_log_event_types.sql` | `16BAAADABA73AC873C446776399C64DA91C6B03BB842FFFB5AB05D90F742B475` | `16BAAADABA73AC873C446776399C64DA91C6B03BB842FFFB5AB05D90F742B475` | YES |
| `supabase/migrations/20260719000000_sp2_4_announcement_audience_active_range.sql` | `supabase/migrations/20260713053608_sp2_4_announcement_audience_active_range.sql` | `AE570C99AA5023655ACC737C6D7A12E5A4551E89CA744D916053F0065C42EBB4` | `AE570C99AA5023655ACC737C6D7A12E5A4551E89CA744D916053F0065C42EBB4` | YES |
| `supabase/migrations/20260719000001_sp_7_2_custom_domain_verification.sql` | `supabase/migrations/20260713053615_sp_7_2_custom_domain_verification.sql` | `E53B2A6D1722799FC2F364893B09113BA33A0E5DDCA13221F163A03FD6F8E91A` | `E53B2A6D1722799FC2F364893B09113BA33A0E5DDCA13221F163A03FD6F8E91A` | YES |
| `supabase/migrations/20260720000000_sp2_6_global_config_rpc.sql` | `supabase/migrations/20260713053622_sp2_6_global_config_rpc.sql` | `43F3B24DE7DF3917C9534560691DBFB1B0EC4CFDD4901D0536B1501758913526` | `43F3B24DE7DF3917C9534560691DBFB1B0EC4CFDD4901D0536B1501758913526` | YES |
| `supabase/migrations/20260720000001_sp_7_3_licenses.sql` | `supabase/migrations/20260713053644_sp_7_3_licenses.sql` | `6AC6547075ABCCD63FB379F8B0E34EA020158C08C975727DC0E69476746F5E95` | `6AC6547075ABCCD63FB379F8B0E34EA020158C08C975727DC0E69476746F5E95` | YES |
| `supabase/migrations/20260721000000_sp2_7_user_management_rpc.sql` | `supabase/migrations/20260713053657_sp2_7_user_management_rpc.sql` | `E2002BB71B546B9C656D1990C2D2790A95B9AB6E2597B5CBA6B304D0F5A49D1E` | `E2002BB71B546B9C656D1990C2D2790A95B9AB6E2597B5CBA6B304D0F5A49D1E` | YES |
| `supabase/migrations/20260722000000_sp2_8_role_management_rpc.sql` | `supabase/migrations/20260713053746_sp2_8_role_management_rpc.sql` | `BDA0E9FDC5C08585318F6B29BDAE5984BADEACD8C470008B368B0D3E64C960F1` | `BDA0E9FDC5C08585318F6B29BDAE5984BADEACD8C470008B368B0D3E64C960F1` | YES |
| `supabase/migrations/20260723000000_sp3_1_plans_crud_features.sql` | `supabase/migrations/20260713053807_sp3_1_plans_crud_features.sql` | `D3991CAE102A27C51E1AA41CB459DEA5929413A62B29E1DB4703A616D3ED756F` | `D3991CAE102A27C51E1AA41CB459DEA5929413A62B29E1DB4703A616D3ED756F` | YES |
| `supabase/migrations/20260728000000_sp5_6_db_maintenance.sql` | `supabase/migrations/20260713053828_sp5_6_db_maintenance.sql` | `0DCCACE9B74C67D64D842B8F0999A35B0F582CDFC856C76AB3E8DE262B3187C4` | `0DCCACE9B74C67D64D842B8F0999A35B0F582CDFC856C76AB3E8DE262B3187C4` | YES |

### 3.2 Preserve Approved Migrations

The 2 genuinely new local migrations remain unchanged:

| Filename | Version | SHA-256 |
|---|---|---|
| `20260718000001_sp_7_1_set_tenant_subdomain.sql` | `20260718000001` | `1120DE0BCB6B31BDE29ADA279DC2F530EA58C1E66EA6DB944ACF8B2BD26778A1` |
| `20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.sql` | `20260723000001` | `258ACCC09C85716F29B7955312EF5593A9EE0A5B79F6BDEB1F85D41BF29ABAC3` |

### 3.3 Exact Duplicate Archive

| Source | Destination | SHA-256 before | SHA-256 after | Duplicate of | Match (LF-normalized) |
|---|---|---|---|---|---|
| `supabase/migration_f33_invite_rate_limit_tenant.sql` | `archive/supabase/non_canonical_migrations/migration_f33_invite_rate_limit_tenant.sql` | `641429E83F8B5AC9143A5F01EA9413F5E68E49988D51B0EC5672EF047C049ECB` | `641429E83F8B5AC9143A5F01EA9413F5E68E49988D51B0EC5672EF047C049ECB` | `20260711000006_f33_invite_rate_limit_tenant.sql` | YES |
| `supabase/migration_f33_members_guardrails.sql` | `archive/supabase/non_canonical_migrations/migration_f33_members_guardrails.sql` | `4E34C1EDE876796C671EAB7644BF72EC0F35AA58486DEFFE31479A9CCC289932` | `4E34C1EDE876796C671EAB7644BF72EC0F35AA58486DEFFE31479A9CCC289932` | `20260711000005_f33_members_guardrails.sql` | YES |
| `supabase/migration_f33_members_status_activation.sql` | `archive/supabase/non_canonical_migrations/migration_f33_members_status_activation.sql` | `5CB8745379A3A9E194847D694BF07659D0016645F59DB91BC05129E6191DD89D` | `5CB8745379A3A9E194847D694BF07659D0016645F59DB91BC05129E6191DD89D` | `20260711000007_f33_members_status_activation.sql` | YES |

### 3.4 Canonicalized-Elsewhere Files

| File | Engineering attestation | Action | Evidence |
|---|---|---|---|
| `supabase/migration_fix_stock_ledger_phase2_backfill_v2.sql` | All top-level objects present in canonical chain: `insert_stock_ledger_entry, backfill_v2_resolve_lot, backfill_v2_allocate_variance, backfill_v2_ensure_lot, backfill_stock_ledger_v2` | Archive | SHA `899BB22B799D79DFB534D420A4114F6136E8E3E47D0213F07768DBBF044D881D` -> `899BB22B799D79DFB534D420A4114F6136E8E3E47D0213F07768DBBF044D881D` |
| `supabase/migration_phase10_reports.sql` | All top-level objects present in canonical chain: `get_sales_report, get_profit_report, get_inventory_report, get_supplier_report` | Archive | SHA `BF792FD19879B43E5EEA6E6D3FF82DABF8131BB5528E5EF81EEA8E4995BE9C57` -> `BF792FD19879B43E5EEA6E6D3FF82DABF8131BB5528E5EF81EEA8E4995BE9C57` |
| `supabase/migration_phase1_security_cleanup.sql` | All top-level objects present in canonical chain: `authenticated_full_access_temp` | Archive | SHA `A920E3B52F509A854FB2E53B691D5F3AAD3F3DEDE9DCFBC6BCBBA860DC072455` -> `A920E3B52F509A854FB2E53B691D5F3AAD3F3DEDE9DCFBC6BCBBA860DC072455` |
| `supabase/migration_phase3a_import_cost_ssot.sql` | All top-level objects present in canonical chain: `import_items_backup_phase3a, import_receipts_backup_phase3a, products_backup_phase3a, product_lots_backup_phase3a, adjusted_cost, process_import_v2, delete_import_v2, update_import_v2` | Archive | SHA `2E15B5DB6354DFB8BFD71F8BDFB8D837A787F3CA658F5C342A913030CA70ED45` -> `2E15B5DB6354DFB8BFD71F8BDFB8D837A787F3CA658F5C342A913030CA70ED45` |
| `supabase/migration_phase6_stock_ledger_hardening_part2.sql` | All top-level objects present in canonical chain: `insert_stock_ledger_entry` | Archive | SHA `7D88624576C4F9F1E9CC375509805B7DDCEE99125A8C5C4E2E5624C7486C805E` -> `7D88624576C4F9F1E9CC375509805B7DDCEE99125A8C5C4E2E5624C7486C805E` |
| `supabase/migration_phase6_stock_ledger_hardening_part3.sql` | All top-level objects present in canonical chain: `trg_stock_movements_calc_qty_after` | Archive | SHA `789F34BE30A28DB5483FBB748584EEF670E9DD2810AFE5E4B29081AE7D303017` -> `789F34BE30A28DB5483FBB748584EEF670E9DD2810AFE5E4B29081AE7D303017` |
| `supabase/migration_phase6_stock_ledger_hardening_part4.sql` | All top-level objects present in canonical chain: `check_stock_ledger_drift` | Archive | SHA `53F7E6DDB1D8A7CED72382DF40A9EC8D724F328C3A44D752D34A0A9A3CF54D1B` -> `53F7E6DDB1D8A7CED72382DF40A9EC8D724F328C3A44D752D34A0A9A3CF54D1B` |

### 3.5 Partially Duplicated Files

| File | Decision | Action | Rationale |
|---|---|---|---|
| `supabase/migration_phase6_stock_ledger_hardening.sql` | Archive after engineering review | Archive | calc_qty_after_transaction is already canonical; stock_movements_backup_phase6 is a transient backup (dropped in canonical) and idx_stock_movements_product_lot_cancelled is not retained; both not required. |
| `supabase/migration_phase6_stock_ledger_hardening_part1.sql` | Archive after engineering review | Archive | calc_qty_after_transaction is already canonical; stock_movements_backup_phase6 is a transient backup (dropped in canonical) and idx_stock_movements_product_lot_cancelled is not retained; both not required. |

### 3.6 Anonymous DO Block Files

| File | Required? | Action | Rationale |
|---|---|---|---|
| `supabase/migration_phase6_stock_ledger_hardening_part5.sql` | Not required for deployment or historical replay | Archive | Anonymous DO-block RPC patches are already reflected in the canonical chain (get_product_stock_balance is defined but no longer called by the patched business functions; calc_qty_after_transaction is used). |
| `supabase/migration_phase6_stock_ledger_hardening_part5a.sql` | Not required for deployment or historical replay | Archive | Anonymous DO-block RPC patches are already reflected in the canonical chain (get_product_stock_balance is defined but no longer called by the patched business functions; calc_qty_after_transaction is used). |
| `supabase/migration_phase6_stock_ledger_hardening_part5b.sql` | Not required for deployment or historical replay | Archive | Anonymous DO-block RPC patches are already reflected in the canonical chain (get_product_stock_balance is defined but no longer called by the patched business functions; calc_qty_after_transaction is used). |
| `supabase/migration_phase6_stock_ledger_hardening_part5c.sql` | Not required for deployment or historical replay | Archive | Anonymous DO-block RPC patches are already reflected in the canonical chain (get_product_stock_balance is defined but no longer called by the patched business functions; calc_qty_after_transaction is used). |
| `supabase/migration_phase6_stock_ledger_hardening_part6.sql` | Not required for deployment or historical replay | Archive | Anonymous DO-block RPC patches are already reflected in the canonical chain (get_product_stock_balance is defined but no longer called by the patched business functions; calc_qty_after_transaction is used). |

---

## Phase 4 — Repository Integrity Review

- `supabase/migrations` contains **138** canonical migration files.
- No `supabase/migration_*.sql` files remain outside `supabase/migrations`: **True**.
- `archive/supabase/non_canonical_migrations/` contains **17** archived files.
- The 2 genuinely new migrations are preserved with unchanged hashes: **['20260718000001_sp_7_1_set_tenant_subdomain.sql', '20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.sql']**.
- Canonical migration chain is ordered by production-applied version strings after the 9 renames.
- Rollback tag remains intact and points to the baseline commit.

### Migration Version Aliases

| Non-canonical alias (removed) | Canonical version (retained) | Migration name |
|---|---|---|
| `20260718000002` | `20260713053550` | `sp1_6_expand_audit_log_event_types` |
| `20260719000000` | `20260713053608` | `sp2_4_announcement_audience_active_range` |
| `20260719000001` | `20260713053615` | `sp_7_2_custom_domain_verification` |
| `20260720000000` | `20260713053622` | `sp2_6_global_config_rpc` |
| `20260720000001` | `20260713053644` | `sp_7_3_licenses` |
| `20260721000000` | `20260713053657` | `sp2_7_user_management_rpc` |
| `20260722000000` | `20260713053746` | `sp2_8_role_management_rpc` |
| `20260723000000` | `20260713053807` | `sp3_1_plans_crud_features` |
| `20260728000000` | `20260713053828` | `sp5_6_db_maintenance` |

---

## Phase 5 — Implementation Summary

- **Completed actions:** rollback to `pre-rebaseline-2026-07-19`; 9 canonical renames; 2 new-migration preservation; archive of 17 non-canonical files; object-equivalence and engineering-review records.
- **Deferred actions:** verification gates, acceptance review, deployment, push, release.
- **Files changed:** 9 canonical migration renames and 17 non-canonical archives (staged, uncommitted).
- **Files archived:** 17 `supabase/migration_*.sql` files moved to `archive/supabase/non_canonical_migrations/`.
- **Files preserved:** 2 new local migrations and 127 previously matched canonical migrations.
- **Engineering decisions applied:** all 7 canonicalized-elsewhere files archived with object-equivalence attestations; 2 partial-duplicate and 5 anonymous-DO files reviewed and archived after determining their unique objects/scripts are not required for the canonical chain.
- **Remaining work:** execute `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md` as the next authorized step.

---

## Implementation Decision

```text
Repository Re-baseline Implementation Resume:

IMPLEMENTATION COMPLETED WITH OBSERVATIONS
```

**Justification:**

All mandatory pre-implementation conditions were satisfied. The 9 canonical migration renames were re-executed, the 2 genuinely new migrations were preserved, and all 17 non-canonical files were dispositioned and archived in accordance with the Authorization Addendum. The only observations are the engineering determinations that the unique objects in the 2 partially-duplicated files and the anonymous validation scripts in the 5 DO-block files are not required for deployment or canonical replay, so they were archived rather than converted.

---

## Next Authorized Step

```text
REPOSITORY_REBASELINE_VERIFICATION_REPORT.md
```

Verification, acceptance, deployment, push, and release remain out of scope.

---

## Git Status Summary

```text
 M CURRENT_PHASE.md
 M CURRENT_TASK.md
R  supabase/migration_f33_invite_rate_limit_tenant.sql -> archive/supabase/non_canonical_migrations/migration_f33_invite_rate_limit_tenant.sql
R  supabase/migration_f33_members_guardrails.sql -> archive/supabase/non_canonical_migrations/migration_f33_members_guardrails.sql
R  supabase/migration_f33_members_status_activation.sql -> archive/supabase/non_canonical_migrations/migration_f33_members_status_activation.sql
R  supabase/migration_fix_stock_ledger_phase2_backfill_v2.sql -> archive/supabase/non_canonical_migrations/migration_fix_stock_ledger_phase2_backfill_v2.sql
R  supabase/migration_phase10_reports.sql -> archive/supabase/non_canonical_migrations/migration_phase10_reports.sql
R  supabase/migration_phase1_security_cleanup.sql -> archive/supabase/non_canonical_migrations/migration_phase1_security_cleanup.sql
R  supabase/migration_phase3a_import_cost_ssot.sql -> archive/supabase/non_canonical_migrations/migration_phase3a_import_cost_ssot.sql
R  supabase/migration_phase6_stock_ledger_hardening.sql -> archive/supabase/non_canonical_migrations/migration_phase6_stock_ledger_hardening.sql
R  supabase/migration_phase6_stock_ledger_hardening_part1.sql -> archive/supabase/non_canonical_migrations/migration_phase6_stock_ledger_hardening_part1.sql
R  supabase/migration_phase6_stock_ledger_hardening_part2.sql -> archive/supabase/non_canonical_migrations/migration_phase6_stock_ledger_hardening_part2.sql
R  supabase/migration_phase6_stock_ledger_hardening_part3.sql -> archive/supabase/non_canonical_migrations/migration_phase6_stock_ledger_hardening_part3.sql
R  supabase/migration_phase6_stock_ledger_hardening_part4.sql -> archive/supabase/non_canonical_migrations/migration_phase6_stock_ledger_hardening_part4.sql
R  supabase/migration_phase6_stock_ledger_hardening_part5.sql -> archive/supabase/non_canonical_migrations/migration_phase6_stock_ledger_hardening_part5.sql
R  supabase/migration_phase6_stock_ledger_hardening_part5a.sql -> archive/supabase/non_canonical_migrations/migration_phase6_stock_ledger_hardening_part5a.sql
R  supabase/migration_phase6_stock_ledger_hardening_part5b.sql -> archive/supabase/non_canonical_migrations/migration_phase6_stock_ledger_hardening_part5b.sql
R  supabase/migration_phase6_stock_ledger_hardening_part5c.sql -> archive/supabase/non_canonical_migrations/migration_phase6_stock_ledger_hardening_part5c.sql
R  supabase/migration_phase6_stock_ledger_hardening_part6.sql -> archive/supabase/non_canonical_migrations/migration_phase6_stock_ledger_hardening_part6.sql
R  supabase/migrations/20260718000002_sp1_6_expand_audit_log_event_types.sql -> supabase/migrations/20260713053550_sp1_6_expand_audit_log_event_types.sql
R  supabase/migrations/20260719000000_sp2_4_announcement_audience_active_range.sql -> supabase/migrations/20260713053608_sp2_4_announcement_audience_active_range.sql
R  supabase/migrations/20260719000001_sp_7_2_custom_domain_verification.sql -> supabase/migrations/20260713053615_sp_7_2_custom_domain_verification.sql
R  supabase/migrations/20260720000000_sp2_6_global_config_rpc.sql -> supabase/migrations/20260713053622_sp2_6_global_config_rpc.sql
R  supabase/migrations/20260720000001_sp_7_3_licenses.sql -> supabase/migrations/20260713053644_sp_7_3_licenses.sql
R  supabase/migrations/20260721000000_sp2_7_user_management_rpc.sql -> supabase/migrations/20260713053657_sp2_7_user_management_rpc.sql
R  supabase/migrations/20260722000000_sp2_8_role_management_rpc.sql -> supabase/migrations/20260713053746_sp2_8_role_management_rpc.sql
R  supabase/migrations/20260723000000_sp3_1_plans_crud_features.sql -> supabase/migrations/20260713053807_sp3_1_plans_crud_features.sql
R  supabase/migrations/20260728000000_sp5_6_db_maintenance.sql -> supabase/migrations/20260713053828_sp5_6_db_maintenance.sql
?? CURRENT_TASK-001_ACCEPTANCE.md
?? CURRENT_TASK-001_ENGINEERING_KICKOFF.md
?? CURRENT_TASK-001_IMPLEMENTATION.md
?? CURRENT_TASK-001_PROGRAM_AUTHORIZATION.md
?? CURRENT_TASK-001_PROGRAM_STATUS_REVIEW.md
?? CURRENT_TASK-001_VERIFICATION.md
?? CURRENT_TASK-002_ENGINEERING_KICKOFF.md
?? CURRENT_TASK-002_IMPLEMENTATION.md
?? CURRENT_TASK-002_PROGRAM_AUTHORIZATION.md
?? CURRENT_TASK-002_VERIFICATION.md
?? GOVERNANCE_EXCEPTION_REVIEW.md
?? GOVERNANCE_EXCEPTION_REVIEW_ADDENDUM.md
?? MIGRATION_PROVENANCE_INVESTIGATION.md
?? MIGRATION_RECONCILIATION_REPORT.md
?? NON_CANONICAL_MIGRATION_FORENSIC_INVESTIGATION.md
?? PRODUCTION_DEPLOYMENT_MASTER_PLAN.md
?? PRODUCTION_DEPLOYMENT_PROGRAM_CHARTER.md
?? PRODUCTION_PROGRAM_AUTHORIZATION.md
?? REPOSITORY_HYGIENE_REVIEW.md
?? REPOSITORY_REBASELINE_AUTHORIZATION.md
?? REPOSITORY_REBASELINE_AUTHORIZATION_ADDENDUM.md
?? REPOSITORY_REBASELINE_IMPLEMENTATION.md
?? REPOSITORY_REBASELINE_PLAN.md
?? REPOSITORY_REBASELINE_PLAN_ADDENDUM.md
?? SUPABASE_REBASELINE_FEASIBILITY_REVIEW.md
?? archive/supabase/production_schema_migrations_snapshot_2026-07-19.json

```