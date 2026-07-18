# D-P2-02 — Orphan SQL Triage Record

**Program:** VietSalePro v7 — System Recovery Program  
**Deliverable ID:** D-P2-02  
**Title:** Orphan SQL Triage Record  
**Phase:** Phase 2 — Canonical Migration Chain Stabilization  
**Version:** 1.0  
**Date:** 2026-07-14  
**Status:** Proposed — Pending Program Manager Approval  
**Authorizing CURRENT_TASK:** To be recorded upon approval  

---

## 1. Executive Summary

This document records the triage of every SQL file in the repository that resides outside the canonical forward-migration directory `supabase/migrations`.  

- **D-P2-01 reported orphan count:** 57 files.  
- **Actual orphan count in repository at triage:** 59 files.  
- The discrepancy is due to two additional files under `.temp/` that were not accounted for in D-P2-01.

All 59 files have been classified as **Absorb**, **Archive**, or **Delete**. No file is recommended for the **Canonical** chain because every migration-worthy artifact is already represented in the canonical chain. No file is marked **Unknown** because repository evidence (file location, content, and canonical cross-references) supports a classification for each.

| Classification | Count | Disposition |
|---|---|---|
| Absorb | 29 | Content absorbed into canonical migrations; independent file no longer needed. |
| Archive | 28 | Historical artifact, test fixture, diagnostic script, or backup; retain. |
| Delete | 2 | Redundant temporary test scripts; safe to remove. |
| Canonical | 0 | Not applicable. |
| Unknown | 0 | Not applicable. |
| **Total** | **59** | |

**Decision:** **PASS WITH OBSERVATIONS** — the triage is complete, but the orphan inventory in D-P2-01 under-counted by two files, and several orphan files mirror canonical migration names, creating latent authority-confusion risk until they are removed or archived.

---

## 2. Scope

### 2.1 In Scope

- Every `.sql` file whose path is **not** inside `supabase/migrations`.
- Determining, per file, whether it is:
  - **Canonical** — belongs in the canonical chain but was omitted;
  - **Absorb** — content already merged into a canonical migration;
  - **Archive** — historical artifact worth preserving;
  - **Delete** — redundant and safe to remove;
  - **Unknown** — insufficient evidence to classify.

### 2.2 Out of Scope

- Writing, editing, renaming, reordering, or deleting any file.
- Generating `schema.sql`, TypeScript types, or derived artifacts.
- RPC/UI/service reconciliation.
- Creation of engineering work packages or `CURRENT_TASK` documents.

---

## 3. Assessment Method

1. **Inventory generation:** `Get-ChildItem <repo> -Recurse -Filter *.sql | Where-Object { $_.FullName -notlike "*\supabase\migrations\*" }` produced the authoritative orphan list.  
2. **Hash comparison:** SHA-256 hashes of each orphan were compared against canonical migrations to detect exact duplicates. No orphan was identical to a canonical migration.  
3. **Content cross-reference:** Object names (functions, tables, triggers, policies) defined in each orphan were searched in `supabase/migrations` to determine absorption.  
4. **Context classification:** File location (`.temp/`, `backups/`, `memory-zone/`, `Plan/Migration/`, `scripts/`, `supabase/tests/admin/`) was used to determine artifact type.  
5. **No inference rule:** Where evidence was incomplete, the file would have been marked **Unknown**. In this repository, every file had sufficient evidence for a definitive classification.

---

## 4. Triage Table

### 4.1 Delete — 2 files

| # | File | Timestamp | Location | Type | Why Orphan | Repository Evidence | Canonical Relationship | Impact | Recommendation | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `test_auth.sql` | none | `.temp/` | Temporary test snippet | Outside `supabase/migrations`; not a migration. | 3-line script that sets `request.jwt.claims` and selects `auth.uid()`; no references in codebase. | None. Not migration content. | None. | Delete | High |
| 2 | `test_p10_2.sql` | none | `.temp/` | Temporary self-check script | Outside `supabase/migrations`; not a migration. | End-to-end self-check for voucher + promotion logic; content covered by canonical P10.2 migrations (`20250707000003_phase_p10_1_voucher_promotion_schema.sql`, `20250707000004_phase_p10_2_voucher_invoice_apply.sql`). | Content absorbed into canonical Phase 10 migrations. | Low — temp file, not referenced. | Delete | High |

### 4.2 Archive — 28 files

| # | File | Timestamp | Location | Type | Why Orphan | Repository Evidence | Canonical Relationship | Impact | Recommendation | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 3 | `backup_20260713_190149_schema.sql` | 2026-07-13 19:01 | `backups/` | Database dump / backup | Outside `supabase/migrations`. | File name indicates schema backup. | Not a migration; historical snapshot. | Low — large dump, must not be treated as schema authority. | Archive | High |
| 4 | `vietsale_pro_pre_basejump_20260711_172754.sql` | 2026-07-11 17:27 | `backups/` | Database dump / backup | Outside `supabase/migrations`. | File name indicates pre-migration backup. | Not a migration; historical snapshot. | Low — large dump, must not be treated as schema authority. | Archive | High |
| 5 | `01_process_import_v2.sql` | none | `memory-zone/.temp/phase7c_sections/` | Development snippet | Outside `supabase/migrations`. | Defines `process_import_v2`; same function exists in canonical baseline `20250703000000_baseline_pre_tenant_schema.sql`. | Content absorbed; snippet retained as development history. | Low. | Archive | High |
| 6 | `02_delete_import_v2.sql` | none | `memory-zone/.temp/phase7c_sections/` | Development snippet | Outside `supabase/migrations`. | Defines `delete_import_v2`; same function exists in canonical baseline `20250703000000_baseline_pre_tenant_schema.sql`. | Content absorbed; snippet retained as development history. | Low. | Archive | High |
| 7 | `03_update_import_v2.sql` | none | `memory-zone/.temp/phase7c_sections/` | Development snippet | Outside `supabase/migrations`. | Defines `update_import_v2`; same function exists in canonical baseline `20250703000000_baseline_pre_tenant_schema.sql`. | Content absorbed; snippet retained as development history. | Low. | Archive | High |
| 8 | `04_create_return_order.sql` | none | `memory-zone/.temp/phase7c_sections/` | Development snippet | Outside `supabase/migrations`. | Defines `create_return_order`; same function exists in canonical baseline `20250703000000_baseline_pre_tenant_schema.sql`. | Content absorbed; snippet retained as development history. | Low. | Archive | High |
| 9 | `05_cancel_return_order_v2.sql` | none | `memory-zone/.temp/phase7c_sections/` | Development snippet | Outside `supabase/migrations`. | Defines `cancel_return_order_v2`; same function exists in canonical baseline `20250703000000_baseline_pre_tenant_schema.sql`. | Content absorbed; snippet retained as development history. | Low. | Archive | High |
| 10 | `06_create_exchange_transaction.sql` | none | `memory-zone/.temp/phase7c_sections/` | Development snippet | Outside `supabase/migrations`. | Defines `create_exchange_transaction`; same function exists in canonical baseline `20250703000000_baseline_pre_tenant_schema.sql`. | Content absorbed; snippet retained as development history. | Low. | Archive | High |
| 11 | `07_complete_disposal.sql` | none | `memory-zone/.temp/phase7c_sections/` | Development snippet | Outside `supabase/migrations`. | Defines `complete_disposal`; same function exists in canonical baseline `20250703000000_baseline_pre_tenant_schema.sql`. | Content absorbed; snippet retained as development history. | Low. | Archive | High |
| 12 | `08_delete_disposal_with_restore.sql` | none | `memory-zone/.temp/phase7c_sections/` | Development snippet | Outside `supabase/migrations`. | Defines `delete_disposal_with_restore`; same function exists in canonical baseline `20250703000000_baseline_pre_tenant_schema.sql`. | Content absorbed; snippet retained as development history. | Low. | Archive | High |
| 13 | `09_get_stock_ledger.sql` | none | `memory-zone/.temp/phase7c_sections/` | Development snippet | Outside `supabase/migrations`. | Defines `get_stock_ledger`; same function exists in canonical baseline `20250703000000_baseline_pre_tenant_schema.sql`. | Content absorbed; snippet retained as development history. | Low. | Archive | High |
| 14 | `10_get_stock_balance.sql` | none | `memory-zone/.temp/phase7c_sections/` | Development snippet | Outside `supabase/migrations`. | Defines `get_stock_balance`; same function exists in canonical baseline `20250703000000_baseline_pre_tenant_schema.sql`. | Content absorbed; snippet retained as development history. | Low. | Archive | High |
| 15 | `deploy_return_exchange.sql` | none | `memory-zone/.temp/phase7c_sections/` | Development deployment helper | Outside `supabase/migrations`. | Helper to deploy the phase 7c snippets; not a forward migration. | Orchestrates content already in canonical baseline. | Low. | Archive | High |
| 16 | `migration_phase3a_import_cost_ssot.sql` | none | `memory-zone/archive/` | Archived migration copy | Outside `supabase/migrations`. | Contains `process_import_v2` and related cost logic; identical to `supabase/migration_phase3a_import_cost_ssot.sql`. Content exists in canonical baseline. | Content absorbed into canonical baseline. | Low. | Archive | High |
| 17 | `20250706000000_phase_p1_tenant_list_core_management.sql` | 2025-07-06 | `memory-zone/backup/f1/` | Backup copy of canonical migration | Outside `supabase/migrations`. | File name matches canonical migration; stored as backup. | Mirror of canonical `supabase/migrations/20250706000000_phase_p1_tenant_list_core_management.sql`. | Low — backup copy can cause name-confusion. | Archive | High |
| 18 | `20260708000000_phase_p18_1_tenant_isolation.sql` | 2026-07-08 | `memory-zone/backup/f1/` | Backup copy of canonical migration | Outside `supabase/migrations`. | File name matches canonical migration; stored as backup. | Mirror of canonical `supabase/migrations/20260708000000_phase_p18_1_tenant_isolation.sql`. | Low — backup copy can cause name-confusion. | Archive | High |
| 19 | `20260708000004_fix_system_admin_rls.sql` | 2026-07-08 | `memory-zone/backup/f1/` | Backup copy of canonical migration | Outside `supabase/migrations`. | File name matches canonical migration; stored as backup. | Mirror of canonical `supabase/migrations/20260708000004_fix_system_admin_rls.sql`. | Low — backup copy can cause name-confusion. | Archive | High |
| 20 | `20250706000006_phase_p7_0_read_only_tenant_infra.sql` | 2025-07-06 | `memory-zone/backup/f2/` | Backup copy of canonical migration | Outside `supabase/migrations`. | File name matches canonical migration; stored as backup. | Mirror of canonical `supabase/migrations/20250706000006_phase_p7_0_read_only_tenant_infra.sql`. | Low — backup copy can cause name-confusion. | Archive | High |
| 21 | `20250708000005_phase_p14_2_restore_archive.sql` | 2025-07-08 | `memory-zone/backup/f3/` | Backup copy of canonical migration | Outside `supabase/migrations`. | File name matches canonical migration; stored as backup. | Mirror of canonical `supabase/migrations/20250708000005_phase_p14_2_restore_archive.sql`. | Low — backup copy can cause name-confusion. | Archive | High |
| 22 | `20250708000013_phase_p17_1_2fa_totp.sql` | 2025-07-08 | `memory-zone/backup/f4/` | Backup copy of canonical migration | Outside `supabase/migrations`. | File name matches canonical migration; stored as backup. | Mirror of canonical `supabase/migrations/20250708000013_phase_p17_1_2fa_totp.sql`. | Low — backup copy can cause name-confusion. | Archive | High |
| 23 | `20250707000000_phase_p9_1_billing_reminders.sql` | 2025-07-07 | `memory-zone/backup/f5/` | Backup copy of canonical migration | Outside `supabase/migrations`. | File name matches canonical migration; stored as backup. | Mirror of canonical `supabase/migrations/20250707000000_phase_p9_1_billing_reminders.sql`. | Low — backup copy can cause name-confusion. | Archive | High |
| 24 | `audit-grants.sql` | none | `scripts/` | Diagnostic / utility script | Outside `supabase/migrations`. | Queries `pg_proc`/`aclexplode` to audit function grants; not a schema migration. | Not a migration. | Low. | Archive | High |
| 25 | `migration_phase1_security_cleanup.sql` | none | `supabase/` | Temporary security-bridge script | Outside `supabase/migrations`. | Creates temporary `authenticated_full_access_temp` policies on business tables; comment states these are temporary until tenant-scoped RLS arrives. | Superseded by canonical tenant-scoped RLS migrations (Phases 5, 9, 11, 12, etc.). | Low — historical bridge policy, must not be reapplied. | Archive | High |
| 26 | `000_helpers.sql` | none | `supabase/tests/admin/` | pgTAP test fixture | Outside `supabase/migrations`. | Part of admin dashboard test suite; sets up `tests.create_supabase_user()` and `tests.authenticate_as()`. | Not a migration; test infrastructure. | Low. | Archive | High |
| 27 | `test_audit_log.sql` | none | `supabase/tests/admin/` | pgTAP test | Outside `supabase/migrations`. | Tests audit-log policies/RPCs. | Not a migration; test infrastructure. | Low. | Archive | High |
| 28 | `test_billing.sql` | none | `supabase/tests/admin/` | pgTAP test | Outside `supabase/migrations`. | Tests billing RPCs. | Not a migration; test infrastructure. | Low. | Archive | High |
| 29 | `test_helper_functions.sql` | none | `supabase/tests/admin/` | pgTAP test | Outside `supabase/migrations`. | Tests helper functions. | Not a migration; test infrastructure. | Low. | Archive | High |
| 30 | `test_rls_policies.sql` | none | `supabase/tests/admin/` | pgTAP test | Outside `supabase/migrations`. | Tests RLS policies. | Not a migration; test infrastructure. | Low. | Archive | High |

### 4.3 Absorb — 29 files

| # | File | Timestamp | Location | Type | Why Orphan | Repository Evidence | Canonical Relationship | Impact | Recommendation | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 31 | `20250713000022_phase3_subscription_lifecycle_rpc.sql` | 2025-07-13 | `Plan/Migration/` | Draft migration | Outside `supabase/migrations`. | Defines `create_subscription`, `upgrade_subscription`, `downgrade_subscription`, `cancel_subscription`. | Absorbed into canonical `supabase/migrations/20250713000022_phase3_subscription_lifecycle_rpc.sql`. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 32 | `20260712101730_sp3_4_usage_metering.sql` | 2026-07-12 10:17 | `Plan/Migration/` | Draft migration | Outside `supabase/migrations`. | Defines `tenant_usage_records` table, index, and RLS policies. | Absorbed into canonical `supabase/migrations/20260712101730_sp3_4_usage_metering.sql`. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 33 | `20260712140000_sp1_4_missing_rls_policies.sql` | 2026-07-12 14:00 | `Plan/Migration/` | Draft migration | Outside `supabase/migrations`. | Adds missing RLS policies for archive/audit tables. | Absorbed into canonical `supabase/migrations/20260712140000_sp1_4_missing_rls_policies.sql`. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 34 | `20260718000000_phase6_3_support_ticket_sla.sql` | 2026-07-18 | `Plan/Migration/` | Draft migration | Outside `supabase/migrations`. | Adds `sla_target_at` column and index to `support_tickets`. | Absorbed into canonical `supabase/migrations/20260718000000_phase6_3_support_ticket_sla.sql`. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 35 | `20260718000000_sp1_6_expand_audit_log_event_types.sql` | 2026-07-18 | `Plan/Migration/` | Draft migration | Outside `supabase/migrations`. | Expands `audit_log.action` check constraint. | Absorbed into canonical `supabase/migrations/20260718000002_sp1_6_expand_audit_log_event_types.sql` (renamed to resolve duplicate timestamp). | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 36 | `20260719000000_sp2_4_announcement_audience_active_range.sql` | 2026-07-19 | `Plan/Migration/` | Draft migration | Outside `supabase/migrations`. | Adds `audience`, `active_from`, `active_to` to `announcements` and updates `get_current_announcements_for_tenant`. | Absorbed into canonical `supabase/migrations/20260719000000_sp2_4_announcement_audience_active_range.sql`. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 37 | `20260719000001_sp_7_2_custom_domain_verification.sql` | 2026-07-19 | `Plan/Migration/` | Draft migration | Outside `supabase/migrations`. | Adds `custom_domain_verification_token`, `custom_domain_verified_at`, and `get_or_create_custom_domain_token`. | Absorbed into canonical `supabase/migrations/20260719000001_sp_7_2_custom_domain_verification.sql`. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 38 | `20260720000000_sp2_6_global_config_rpc.sql` | 2026-07-20 | `Plan/Migration/` | Draft migration | Outside `supabase/migrations`. | Defines `get_global_config` and `set_global_config`. | Absorbed into canonical `supabase/migrations/20260720000000_sp2_6_global_config_rpc.sql`. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 39 | `20260720000001_sp_7_3_licenses.sql` | 2026-07-20 | `Plan/Migration/` | Draft migration | Outside `supabase/migrations`. | Defines `licenses` table and `generate_tenant_license` / `validate_tenant_license`. | Absorbed into canonical `supabase/migrations/20260720000001_sp_7_3_licenses.sql`. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 40 | `20260721000000_sp2_7_user_management_rpc.sql` | 2026-07-21 | `Plan/Migration/` | Draft migration | Outside `supabase/migrations`. | Defines `get_users` and `update_user_status`. | Absorbed into canonical `supabase/migrations/20260721000000_sp2_7_user_management_rpc.sql`. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 41 | `20260722000000_sp2_8_role_management_rpc.sql` | 2026-07-22 | `Plan/Migration/` | Draft migration | Outside `supabase/migrations`. | Defines `admin_roles`, `admin_role_assignments`, and CRUD RPCs. | Absorbed into canonical `supabase/migrations/20260722000000_sp2_8_role_management_rpc.sql`. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 42 | `20260723000000_sp3_1_plans_crud_features.sql` | 2026-07-23 | `Plan/Migration/` | Draft migration | Outside `supabase/migrations`. | Adds `features`, `seat_limit`, `usage_limits` to `plans` and updates plan CRUD RPCs. | Absorbed into canonical `supabase/migrations/20260723000000_sp3_1_plans_crud_features.sql`. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 43 | `20260728000000_sp5_6_db_maintenance.sql` | 2026-07-28 | `Plan/Migration/` | Draft migration | Outside `supabase/migrations`. | Defines `db_maintenance_jobs`, `run_db_maintenance_job`, `list_db_maintenance_jobs`, `get_db_table_stats`. | Absorbed into canonical `supabase/migrations/20260728000000_sp5_6_db_maintenance.sql`. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 44 | `migration_f33_invite_rate_limit_tenant.sql` | none | `supabase/` | Draft migration | Outside `supabase/migrations`. | Adds `tenant_id` to `rate_limit_logs` and index. | Absorbed into canonical `supabase/migrations/20260711000006_f33_invite_rate_limit_tenant.sql`. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 45 | `migration_f33_members_guardrails.sql` | none | `supabase/` | Draft migration | Outside `supabase/migrations`. | Defines `trg_tenant_memberships_guardrails` trigger. | Absorbed into canonical `supabase/migrations/20260711000005_f33_members_guardrails.sql`. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 46 | `migration_f33_members_status_activation.sql` | none | `supabase/` | Draft migration | Outside `supabase/migrations`. | Defines `activate_pending_memberships`. | Absorbed into canonical `supabase/migrations/20260711000007_f33_members_status_activation.sql`. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 47 | `migration_fix_stock_ledger_phase2_backfill_v2.sql` | none | `supabase/` | Draft one-time backfill | Outside `supabase/migrations`. | Defines `backfill_v2_resolve_lot`, `backfill_v2_allocate_variance`, `backfill_v2_ensure_lot`, and rebuild logic. | Absorbed into canonical baseline `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` (functions present) and superseded by later canonical stock migrations. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 48 | `migration_phase10_reports.sql` | none | `supabase/` | Draft migration | Outside `supabase/migrations`. | Defines `get_sales_report`, `get_inventory_report`, `get_profit_report`, `get_supplier_report`. | Absorbed into canonical baseline `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` (report functions present). | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 49 | `migration_phase3a_import_cost_ssot.sql` | none | `supabase/` | Draft migration | Outside `supabase/migrations`. | Defines import-cost SSOT logic and `process_import_v2`. | Absorbed into canonical baseline `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` (import functions present). | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 50 | `migration_phase6_stock_ledger_hardening.sql` | none | `supabase/` | Draft migration | Outside `supabase/migrations`. | Defines `calc_qty_after_transaction`, `insert_stock_ledger_entry`, `trg_stock_movements_calc_qty_after`, `check_stock_ledger_drift`. | Absorbed into canonical baseline `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` and `supabase/migrations/20250705000004_phase9_5_process_checkout.sql`. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 51 | `migration_phase6_stock_ledger_hardening_part1.sql` | none | `supabase/` | Draft migration (part) | Outside `supabase/migrations`. | Defines `calc_qty_after_transaction` and index. | Absorbed into canonical baseline / Phase 9.5 migrations. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 52 | `migration_phase6_stock_ledger_hardening_part2.sql` | none | `supabase/` | Draft migration (part) | Outside `supabase/migrations`. | Stock-ledger hardening fragment. | Absorbed into canonical baseline / Phase 9.5 migrations. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 53 | `migration_phase6_stock_ledger_hardening_part3.sql` | none | `supabase/` | Draft migration (part) | Outside `supabase/migrations`. | Stock-ledger hardening fragment. | Absorbed into canonical baseline / Phase 9.5 migrations. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 54 | `migration_phase6_stock_ledger_hardening_part4.sql` | none | `supabase/` | Draft migration (part) | Outside `supabase/migrations`. | Stock-ledger hardening fragment. | Absorbed into canonical baseline / Phase 9.5 migrations. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 55 | `migration_phase6_stock_ledger_hardening_part5.sql` | none | `supabase/` | Draft migration (part) | Outside `supabase/migrations`. | Stock-ledger hardening fragment. | Absorbed into canonical baseline / Phase 9.5 migrations. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 56 | `migration_phase6_stock_ledger_hardening_part5a.sql` | none | `supabase/` | Draft migration (part) | Outside `supabase/migrations`. | Stock-ledger hardening fragment. | Absorbed into canonical baseline / Phase 9.5 migrations. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 57 | `migration_phase6_stock_ledger_hardening_part5b.sql` | none | `supabase/` | Draft migration (part) | Outside `supabase/migrations`. | Stock-ledger hardening fragment. | Absorbed into canonical baseline / Phase 9.5 migrations. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 58 | `migration_phase6_stock_ledger_hardening_part5c.sql` | none | `supabase/` | Draft migration (part) | Outside `supabase/migrations`. | Stock-ledger hardening fragment. | Absorbed into canonical baseline / Phase 9.5 migrations. | Low — draft copy; canonical version is authoritative. | Absorb | High |
| 59 | `migration_phase6_stock_ledger_hardening_part6.sql` | none | `supabase/` | Draft migration (part) | Outside `supabase/migrations`. | Verification script for phase 6 hardening. | Absorbed into canonical baseline / Phase 9.5 migrations. | Low — draft copy; canonical version is authoritative. | Absorb | High |

---

## 5. Classification Summary

| Classification | Count | Rationale |
|---|---|---|
| **Absorb** | 29 | Draft migrations or precursor scripts whose object definitions now exist in the canonical chain. Independent copies are redundant. |
| **Archive** | 28 | Backups, database dumps, test fixtures, diagnostic scripts, temporary security bridge, and development snippets that are not migrations but have historical or operational value. |
| **Delete** | 2 | Temporary `.temp/` test scripts with no migration authority and no active references. |
| **Canonical** | 0 | No orphan was found to be missing from the canonical chain. |
| **Unknown** | 0 | Every file had sufficient repository evidence for classification. |
| **Total** | **59** | |

---

## 6. Evidence Summary

| Evidence ID | Description | Status | Source / Command |
|---|---|---|---|
| E-1 | Orphan SQL inventory | Complete | `Get-ChildItem <repo> -Recurse -Filter *.sql | Where-Object { $_.FullName -notlike "*\supabase\migrations\*" }` |
| E-2 | Hash comparison against canonical migrations | Complete | SHA-256 of each orphan vs. every canonical migration; no exact duplicates found. |
| E-3 | Object-name cross-reference in canonical chain | Complete | `grep` for function/table/trigger names from orphans into `supabase/migrations/*.sql`. |
| E-4 | Canonical counterpart mapping for Plan/Migration files | Complete | File-name/timestamp matching against `supabase/migrations/*.sql`. |
| E-5 | Classification rationale | Complete | Sections 4.1–4.3 of this document. |

---

## 7. Findings

1. **Orphan count discrepancy:** D-P2-01 reported 57 orphan SQL files, but the repository currently contains 59. The two files not counted in D-P2-01 are `.temp/test_auth.sql` and `.temp/test_p10_2.sql`.
2. **No canonical gaps:** No orphan file needs to be promoted into the canonical migration chain. Every migration-worthy artifact is already represented in `supabase/migrations/`.
3. **High absorb volume:** 29 files (49%) are draft or precursor versions of canonical migrations. They carry the highest authority-confusion risk because they look like migrations and define the same objects.
4. **Backup mirrors:** 7 files under `memory-zone/backup/f1-f5/` share names with canonical migrations. They are backup copies, not authoritative.
5. **Test fixtures are not migrations:** 5 files under `supabase/tests/admin/` are pgTAP tests. They are intentionally outside the migration chain and should be archived as test infrastructure.
6. **Temporary bridge policy:** `supabase/migration_phase1_security_cleanup.sql` created temporary full-access policies. It is superseded by tenant-scoped RLS in the canonical chain and must not be reapplied.
7. **No unknowns:** All 59 files could be classified with repository evidence.

---

## 8. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Authority confusion — `Plan/Migration/*.sql` and `supabase/migration_*.sql` look like migrations and may be mistaken for canonical source. | Medium | Mark as **Absorb**; recommend removal or relocation to a clearly non-authoritative archive after Program Manager approval. |
| Backup mirrors under `memory-zone/backup/` share names with canonical migrations. | Low | Keep as **Archive**; document that `supabase/migrations/` is the only authoritative directory. |
| `.temp/test_p10_2.sql` contains hard-coded UUIDs and modifies live-looking tables; if executed inadvertently it could leave test data. | Low | Mark as **Delete**; remove after approval. |
| `supabase/migration_phase1_security_cleanup.sql` grants temporary full access; accidental re-run would weaken RLS. | Low | Mark as **Archive**; do not run in production. |
| Large backup dumps in `backups/` are not version-controlled usefully and may be stale. | Low | Archive; consider moving to offline storage. |

---

## 9. Decision

**PASS WITH OBSERVATIONS**

The orphan SQL triage is complete. All 59 orphan files have been classified with repository evidence. The observation is that D-P2-01 under-counted the orphan inventory by two files, and several orphan files mirror canonical migration names, which should be addressed by disposition (Absorb/Delete/Archive) before Phase 2 exit.

---

## 10. Acceptance Statement

| Role | Name | Acknowledgment | Date |
|---|---|---|---|
| Program Manager | | Pending | |
| Architecture Authority | | Pending | |
| Engineering Team | | Pending | |

---

## 11. Change Log

| Version | Date | Author | Reason | Impact |
|---|---|---|---|---|
| 1.0 | 2026-07-14 | D-P2-02 Analysis | Initial orphan SQL triage record | Baseline for Phase 2 orphan disposition |
