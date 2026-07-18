# Canonical Migration Chain Definition (D-P2-01)

**Program:** VietSalePro v7 — System Recovery Program
**Deliverable ID:** D-P2-01
**Title:** Canonical Migration Chain Definition
**Phase:** Phase 2 — Canonical Migration Chain Stabilization
**Version:** 1.0
**Date:** 2026-07-14
**Status:** Proposed — Pending Program Manager Approval
**Authorizing CURRENT_TASK:** *To be recorded upon approval*

---

## 1. Purpose and Scope

This document defines the single, ordered, canonical forward-migration chain for the VietSalePro v7 database contract.
It records the chain as it exists in the repository at the time of analysis; it does not modify, rename, reorder, or generate any migration file.

### 1.1 In Scope
- Forward-migration inventory and deterministic execution order.
- Gap analysis against `MIGRATION_NAMING_AND_ORDERING_STANDARD.md`.
- Hotfix-readiness assessment.
- Reference to SQL files outside the canonical chain (orphan files).

### 1.2 Out of Scope
- Writing, editing, renaming, or reordering migration files.
- Generating `schema.sql`, TypeScript types, or any derived artifact.
- RPC-contract reconciliation, service-code changes, test changes, or UI changes.
- Creation of engineering work packages or `CURRENT_TASK` documents.

## 2. Chain Authority and Ownership

| Role | Responsibility |
|---|---|
| Architecture Authority | Owns canonical-source decisions, including migration ordering, naming exceptions, and chain integrity. |
| Program Manager | Accepts this Canonical Migration Chain Definition. |
| Engineering Team | Executes subsequent approved migration work in accordance with this definition and the naming/ordering standard. |

No derived document, generated artifact, test mock, or governance artifact may override the ordered migration chain without Architecture Authority approval.

## 3. Canonical Migrations Directory Declaration

- Canonical forward-migrations directory: `supabase/migrations`
- Declared rollback directory: `supabase/migrations/rollback`
- Ordering rule: Forward migrations are applied in ascending lexicographic order of their full file names, per `MIGRATION_NAMING_AND_ORDERING_STANDARD.md` section 5.
- No other directory or SQL file is part of the canonical chain unless it is formally absorbed through the Orphan SQL Triage Record (D-P2-02).

## 4. Migration Inventory

This inventory lists every forward migration in the canonical chain. Reverse files are listed as attributes of their corresponding forward migration and are not ordered chain entries.

| Seq | File Name | Timestamp | Semantic Slug | Reverse File | Authority | Notes |
|---|---|---|---|---|---|---|
| 1 | 20250703000000_baseline_pre_tenant_schema.sql | 20250703000000 | baseline_pre_tenant_schema | none (irreversibility not formally accepted) | original |  |
| 2 | 20250704000000_phase2_tenant_foundation.sql | 20250704000000 | phase2_tenant_foundation | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 3 | 20250704000001_phase3_1_core_business_tenant_id.sql | 20250704000001 | phase3_1_core_business_tenant_id | none (irreversibility not formally accepted) | original |  |
| 4 | 20250704000002_phase3_2_inventory_stock_tenant_id.sql | 20250704000002 | phase3_2_inventory_stock_tenant_id | none (irreversibility not formally accepted) | original |  |
| 5 | 20250704000003_phase3_3_config_misc_tenant_id.sql | 20250704000003 | phase3_3_config_misc_tenant_id | none (irreversibility not formally accepted) | original |  |
| 6 | 20250704000004_phase4_1_first_tenant_backfill_core.sql | 20250704000004 | phase4_1_first_tenant_backfill_core | none (irreversibility not formally accepted) | original |  |
| 7 | 20250704000005_phase4_2_backfill_remaining_tables_orphan_cleanup_fk.sql | 20250704000005 | phase4_2_backfill_remaining_tables_orphan_cleanup_fk | none (irreversibility not formally accepted) | original |  |
| 8 | 20250704000006_phase5_1_current_tenant_id.sql | 20250704000006 | phase5_1_current_tenant_id | none (irreversibility not formally accepted) | original |  |
| 9 | 20250704000007_phase5_2_rls_policies_core_tables.sql | 20250704000007 | phase5_2_rls_policies_core_tables | none (irreversibility not formally accepted) | original |  |
| 10 | 20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql | 20250705000000 | phase5_3_rls_policies_remaining_tables_unique_indexes | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 11 | 20250705000001_phase7_subscription_limits.sql | 20250705000001 | phase7_subscription_limits | none (irreversibility not formally accepted) | original |  |
| 12 | 20250705000002_phase8_admin_dashboard_rpc.sql | 20250705000002 | phase8_admin_dashboard_rpc | none (irreversibility not formally accepted) | original |  |
| 13 | 20250705000003_phase9_1_create_tenant_edge_function.sql | 20250705000003 | phase9_1_create_tenant_edge_function | none (irreversibility not formally accepted) | original |  |
| 14 | 20250705000004_phase9_5_process_checkout.sql | 20250705000004 | phase9_5_process_checkout | none (irreversibility not formally accepted) | original |  |
| 15 | 20250705000005_phase9_5_process_checkout_ledger_fixes.sql | 20250705000005 | phase9_5_process_checkout_ledger_fixes | none (irreversibility not formally accepted) | original |  |
| 16 | 20250705000006_phase9_5_safeupdate_fix.sql | 20250705000006 | phase9_5_safeupdate_fix | none (irreversibility not formally accepted) | original |  |
| 17 | 20250705000007_phase9_6_audit_log_rate_limit.sql | 20250705000007 | phase9_6_audit_log_rate_limit | none (irreversibility not formally accepted) | original |  |
| 18 | 20250705000008_phase10_1_db_policies_theo_role.sql | 20250705000008 | phase10_1_db_policies_theo_role | none (irreversibility not formally accepted) | original |  |
| 19 | 20250705000009_phase11_audit_log_triggers.sql | 20250705000009 | phase11_audit_log_triggers | none (irreversibility not formally accepted) | original |  |
| 20 | 20250705000010_phase14_cleanup_backup_tables.sql | 20250705000010 | phase14_cleanup_backup_tables | none (irreversibility not formally accepted) | original |  |
| 21 | 20250705000015_phase15_staging_fixes.sql | 20250705000015 | phase15_staging_fixes | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 22 | 20250705000016_phase16_storage_rls_tenant_assets.sql | 20250705000016 | phase16_storage_rls_tenant_assets | none (irreversibility not formally accepted) | original |  |
| 23 | 20250705000017_phase17_long_term_operations.sql | 20250705000017 | phase17_long_term_operations | none (irreversibility not formally accepted) | original |  |
| 24 | 20250706000000_phase_p1_tenant_list_core_management.sql | 20250706000000 | phase_p1_tenant_list_core_management | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 25 | 20250706000001_phase_p2_subscription_usage.sql | 20250706000001 | phase_p2_subscription_usage | none (irreversibility not formally accepted) | original |  |
| 26 | 20250706000002_phase_p3_member_management.sql | 20250706000002 | phase_p3_member_management | none (irreversibility not formally accepted) | original |  |
| 27 | 20250706000003_phase_p4_system_analytics.sql | 20250706000003 | phase_p4_system_analytics | none (irreversibility not formally accepted) | original |  |
| 28 | 20250706000004_phase_p5_audit_security.sql | 20250706000004 | phase_p5_audit_security | none (irreversibility not formally accepted) | original |  |
| 29 | 20250706000005_phase_p6_operations_support.sql | 20250706000005 | phase_p6_operations_support | none (irreversibility not formally accepted) | original |  |
| 30 | 20250706000006_phase_p7_0_read_only_tenant_infra.sql | 20250706000006 | phase_p7_0_read_only_tenant_infra | none (irreversibility not formally accepted) | original |  |
| 31 | 20250706000007_phase_p7_1_billing_schema_bank_config.sql | 20250706000007 | phase_p7_1_billing_schema_bank_config | none (irreversibility not formally accepted) | original |  |
| 32 | 20250706000008_phase_p7_2_invoice_create_pricing.sql | 20250706000008 | phase_p7_2_invoice_create_pricing | none (irreversibility not formally accepted) | original |  |
| 33 | 20250706000009_phase_p7_3_payment_confirm_lifecycle.sql | 20250706000009 | phase_p7_3_payment_confirm_lifecycle | none (irreversibility not formally accepted) | original |  |
| 34 | 20250706000010_phase_p7_5_expiry_renewal_cron.sql | 20250706000010 | phase_p7_5_expiry_renewal_cron | none (irreversibility not formally accepted) | original |  |
| 35 | 20250706000011_phase_p8_1_plan_builder_schema.sql | 20250706000011 | phase_p8_1_plan_builder_schema | none (irreversibility not formally accepted) | original |  |
| 36 | 20250706000012_phase_p8_2_feature_flags.sql | 20250706000012 | phase_p8_2_feature_flags | none (irreversibility not formally accepted) | original |  |
| 37 | 20250707000000_phase_p9_1_billing_reminders.sql | 20250707000000 | phase_p9_1_billing_reminders | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 38 | 20250707000001_phase_p9_1_1_billing_reminders_fix.sql | 20250707000001 | phase_p9_1_1_billing_reminders_fix | none (irreversibility not formally accepted) | original |  |
| 39 | 20250707000002_phase_p9_2_billing_automation_dashboard.sql | 20250707000002 | phase_p9_2_billing_automation_dashboard | none (irreversibility not formally accepted) | original |  |
| 40 | 20250707000003_phase_p10_1_voucher_promotion_schema.sql | 20250707000003 | phase_p10_1_voucher_promotion_schema | none (irreversibility not formally accepted) | original |  |
| 41 | 20250707000004_phase_p10_2_voucher_invoice_apply.sql | 20250707000004 | phase_p10_2_voucher_invoice_apply | none (irreversibility not formally accepted) | original |  |
| 42 | 20250707000005_phase_p11_1_ticket_schema_backend.sql | 20250707000005 | phase_p11_1_ticket_schema_backend | none (irreversibility not formally accepted) | original |  |
| 43 | 20250707000006_phase_p11_3_impersonation.sql | 20250707000006 | phase_p11_3_impersonation | none (irreversibility not formally accepted) | original |  |
| 44 | 20250707000007_phase_p12_1_announcements.sql | 20250707000007 | phase_p12_1_announcements | none (irreversibility not formally accepted) | original |  |
| 45 | 20250707000008_phase_p12_2_email_templates.sql | 20250707000008 | phase_p12_2_email_templates | none (irreversibility not formally accepted) | original |  |
| 46 | 20250708000000_phase_p12_3_notification_log.sql | 20250708000000 | phase_p12_3_notification_log | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 47 | 20250708000001_phase_p13_2_error_performance.sql | 20250708000001 | phase_p13_2_error_performance | none (irreversibility not formally accepted) | original |  |
| 48 | 20250708000002_phase_p13_3_storage_backup.sql | 20250708000002 | phase_p13_3_storage_backup | none (irreversibility not formally accepted) | original |  |
| 49 | 20250708000003_phase_p13_4_bulk_maintenance.sql | 20250708000003 | phase_p13_4_bulk_maintenance | none (irreversibility not formally accepted) | original |  |
| 50 | 20250708000004_phase_p14_1_tenant_backup.sql | 20250708000004 | phase_p14_1_tenant_backup | none (irreversibility not formally accepted) | original |  |
| 51 | 20250708000005_phase_p14_2_restore_archive.sql | 20250708000005 | phase_p14_2_restore_archive | none (irreversibility not formally accepted) | original |  |
| 52 | 20250708000006_phase_p14_3_migration_reset.sql | 20250708000006 | phase_p14_3_migration_reset | none (irreversibility not formally accepted) | original |  |
| 53 | 20250708000007_phase_p15_1_api_keys.sql | 20250708000007 | phase_p15_1_api_keys | none (irreversibility not formally accepted) | original |  |
| 54 | 20250708000008_phase_p15_2_webhooks.sql | 20250708000008 | phase_p15_2_webhooks | none (irreversibility not formally accepted) | original |  |
| 55 | 20250708000009_phase_p15_3_integrations.sql | 20250708000009 | phase_p15_3_integrations | none (irreversibility not formally accepted) | original |  |
| 56 | 20250708000010_phase_p16_1_revenue_metrics.sql | 20250708000010 | phase_p16_1_revenue_metrics | none (irreversibility not formally accepted) | original |  |
| 57 | 20250708000011_phase_p16_2_churn_cohort.sql | 20250708000011 | phase_p16_2_churn_cohort | none (irreversibility not formally accepted) | original |  |
| 58 | 20250708000013_phase_p17_1_2fa_totp.sql | 20250708000013 | phase_p17_1_2fa_totp | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 59 | 20250708000014_phase_p17_2_login_history.sql | 20250708000014 | phase_p17_2_login_history | none (irreversibility not formally accepted) | original |  |
| 60 | 20250709000000_phase_p17_3_data_export_terms.sql | 20250709000000 | phase_p17_3_data_export_terms | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 61 | 20250709000001_phase_p17_4_fraud_retention.sql | 20250709000001 | phase_p17_4_fraud_retention | none (irreversibility not formally accepted) | original |  |
| 62 | 20250711000001_phase_5_long_term_explicit_grants.sql | 20250711000001 | phase_5_long_term_explicit_grants | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 63 | 20250711000002_phase_5_long_term_admin_feature_flags.sql | 20250711000002 | phase_5_long_term_admin_feature_flags | none (irreversibility not formally accepted) | original |  |
| 64 | 20250713000022_phase3_subscription_lifecycle_rpc.sql | 20250713000022 | phase3_subscription_lifecycle_rpc | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 65 | 20260708000000_phase_p18_1_tenant_isolation.sql | 20260708000000 | phase_p18_1_tenant_isolation | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 66 | 20260708000001_phase_p18_2_white_label.sql | 20260708000001 | phase_p18_2_white_label | none (irreversibility not formally accepted) | original |  |
| 67 | 20260708000002_phase_p18_3_read_replica_queue.sql | 20260708000002 | phase_p18_3_read_replica_queue | none (irreversibility not formally accepted) | original |  |
| 68 | 20260708000003_fix_update_tenant_overload.sql | 20260708000003 | fix_update_tenant_overload | none (irreversibility not formally accepted) | original |  |
| 69 | 20260708000004_fix_system_admin_rls.sql | 20260708000004 | fix_system_admin_rls | none (irreversibility not formally accepted) | original |  |
| 70 | 20260709000000_bootstrap_system_admin.sql | 20260709000000 | bootstrap_system_admin | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 71 | 20260709000001_fix_security_definer_search_path.sql | 20260709000001 | fix_security_definer_search_path | none (irreversibility not formally accepted) | original |  |
| 72 | 20260710000001_add_tenant_credentials_template.sql | 20260710000001 | add_tenant_credentials_template | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 73 | 20260710000002_allow_email_failed_audit_action.sql | 20260710000002 | allow_email_failed_audit_action | none (irreversibility not formally accepted) | original |  |
| 74 | 20260710064509_f33_members_search_rpc.sql | 20260710064509 | f33_members_search_rpc | none (irreversibility not formally accepted) | original | Duplicate semantic slug (2 occurrences). Timestamp jump from previous migration. |
| 75 | 20260711000001_add_tenant_credentials_table.sql | 20260711000001 | add_tenant_credentials_table | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 76 | 20260711000002_remove_tenant_credentials_password.sql | 20260711000002 | remove_tenant_credentials_password | none (irreversibility not formally accepted) | original |  |
| 77 | 20260711000003_f33_members_foundation.sql | 20260711000003 | f33_members_foundation | none (irreversibility not formally accepted) | original |  |
| 78 | 20260711000004_f33_members_search_rpc.sql | 20260711000004 | f33_members_search_rpc | none (irreversibility not formally accepted) | original | Duplicate semantic slug (2 occurrences).  |
| 79 | 20260711000005_f33_members_guardrails.sql | 20260711000005 | f33_members_guardrails | none (irreversibility not formally accepted) | original |  |
| 80 | 20260711000006_f33_invite_rate_limit_tenant.sql | 20260711000006 | f33_invite_rate_limit_tenant | none (irreversibility not formally accepted) | original |  |
| 81 | 20260711000007_f33_members_status_activation.sql | 20260711000007 | f33_members_status_activation | none (irreversibility not formally accepted) | original |  |
| 82 | 20260711000008_fix_rate_limit_logs_action_check.sql | 20260711000008 | fix_rate_limit_logs_action_check | none (irreversibility not formally accepted) | original |  |
| 83 | 20260711000009_fix_tenant_delete_cascade_guardrail.sql | 20260711000009 | fix_tenant_delete_cascade_guardrail | none (irreversibility not formally accepted) | original |  |
| 84 | 20260711000010_fix_invite_seat_limit_and_plan_sync.sql | 20260711000010 | fix_invite_seat_limit_and_plan_sync | none (irreversibility not formally accepted) | original |  |
| 85 | 20260711000011_fix_edge_functions_auth_query.sql | 20260711000011 | fix_edge_functions_auth_query | none (irreversibility not formally accepted) | original |  |
| 86 | 20260712000001_fix_remove_tenant_member_rpc.sql | 20260712000001 | fix_remove_tenant_member_rpc | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 87 | 20260712000002_fix_update_tenant_member_role_rpc.sql | 20260712000002 | fix_update_tenant_member_role_rpc | none (irreversibility not formally accepted) | original |  |
| 88 | 20260712000003_fix_toggle_tenant_member_active_rpc.sql | 20260712000003 | fix_toggle_tenant_member_active_rpc | none (irreversibility not formally accepted) | original |  |
| 89 | 20260712000004_fix_remove_system_admin_security_definer.sql | 20260712000004 | fix_remove_system_admin_security_definer | none (irreversibility not formally accepted) | original |  |
| 90 | 20260712000005_fix_guardrail_trigger_status_active_filter.sql | 20260712000005 | fix_guardrail_trigger_status_active_filter | none (irreversibility not formally accepted) | original |  |
| 91 | 20260712000006_add_soft_delete_columns.sql | 20260712000006 | add_soft_delete_columns | none (irreversibility not formally accepted) | original |  |
| 92 | 20260712000007_add_rls_policies_tenant_memberships.sql | 20260712000007 | add_rls_policies_tenant_memberships | none (irreversibility not formally accepted) | original |  |
| 93 | 20260712000008_add_audit_log_triggers.sql | 20260712000008 | add_audit_log_triggers | none (irreversibility not formally accepted) | original |  |
| 94 | 20260712000009_add_advisory_lock_function.sql | 20260712000009 | add_advisory_lock_function | none (irreversibility not formally accepted) | original |  |
| 95 | 20260712000010_fix_get_tenant_usage_summary_tenant_admin.sql | 20260712000010 | fix_get_tenant_usage_summary_tenant_admin | none (irreversibility not formally accepted) | original |  |
| 96 | 20260712000011_fix_is_system_admin_service_role.sql | 20260712000011 | fix_is_system_admin_service_role | none (irreversibility not formally accepted) | original |  |
| 97 | 20260712000012_add_system_admin_for_edge.sql | 20260712000012 | add_system_admin_for_edge | none (irreversibility not formally accepted) | original |  |
| 98 | 20260712000013_add_viewer_role.sql | 20260712000013 | add_viewer_role | none (irreversibility not formally accepted) | original |  |
| 99 | 20260712101730_sp3_4_usage_metering.sql | 20260712101730 | sp3_4_usage_metering | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 100 | 20260712140000_sp1_4_missing_rls_policies.sql | 20260712140000 | sp1_4_missing_rls_policies | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 101 | 20260713000001_standardize_tenants_and_memberships.sql | 20260713000001 | standardize_tenants_and_memberships | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 102 | 20260713000003_create_rls_helper_functions.sql | 20260713000003 | create_rls_helper_functions | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 103 | 20260713000004_create_user_tracking_triggers.sql | 20260713000004 | create_user_tracking_triggers | none (irreversibility not formally accepted) | original | Duplicate semantic slug (2 occurrences).  |
| 104 | 20260713000005_enable_rls_tenants.sql | 20260713000005 | enable_rls_tenants | none (irreversibility not formally accepted) | original |  |
| 105 | 20260713000006_enable_rls_tenant_scoped_tables.sql | 20260713000006 | enable_rls_tenant_scoped_tables | none (irreversibility not formally accepted) | original |  |
| 106 | 20260713000007_create_user_tracking_triggers.sql | 20260713000007 | create_user_tracking_triggers | none (irreversibility not formally accepted) | original | Duplicate semantic slug (2 occurrences).  |
| 107 | 20260713000008_update_billing_schema.sql | 20260713000008 | update_billing_schema | none (irreversibility not formally accepted) | original |  |
| 108 | 20260713000009_create_plan_features.sql | 20260713000009 | create_plan_features | none (irreversibility not formally accepted) | original |  |
| 109 | 20260713000010_add_role_enum.sql | 20260713000010 | add_role_enum | none (irreversibility not formally accepted) | original |  |
| 110 | 20260713000011_create_invitations_table.sql | 20260713000011 | create_invitations_table | none (irreversibility not formally accepted) | original |  |
| 111 | 20260714000001_accept_invitation_rpc.sql | 20260714000001 | accept_invitation_rpc | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 112 | 20260715000001_create_audit_log_table.sql | 20260715000001 | create_audit_log_table | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 113 | 20260715000002_create_audit_triggers.sql | 20260715000002 | create_audit_triggers | none (irreversibility not formally accepted) | original |  |
| 114 | 20260715000003_admin_security_settings.sql | 20260715000003 | admin_security_settings | none (irreversibility not formally accepted) | original |  |
| 115 | 20260715000004_login_audit_triggers.sql | 20260715000004 | login_audit_triggers | none (irreversibility not formally accepted) | original |  |
| 116 | 20260715000005_install_pgtap.sql | 20260715000005 | install_pgtap | none (irreversibility not formally accepted) | original |  |
| 117 | 20260715000006_fix_handle_new_user_create_subscription.sql | 20260715000006 | fix_handle_new_user_create_subscription | none (irreversibility not formally accepted) | original |  |
| 118 | 20260715000007_fix_audit_log_trigger_tenant_id.sql | 20260715000007 | fix_audit_log_trigger_tenant_id | none (irreversibility not formally accepted) | original |  |
| 119 | 20260715000008_fix_audit_log_trigger_tenant_id_v2.sql | 20260715000008 | fix_audit_log_trigger_tenant_id_v2 | none (irreversibility not formally accepted) | original |  |
| 120 | 20260715000009_fix_tenant_memberships_audit_action.sql | 20260715000009 | fix_tenant_memberships_audit_action | none (irreversibility not formally accepted) | original |  |
| 121 | 20260715000010_fix_rls_helpers_enum_compare.sql | 20260715000010 | fix_rls_helpers_enum_compare | none (irreversibility not formally accepted) | original |  |
| 122 | 20260715000011_fix_audit_log_trigger_tenant_delete.sql | 20260715000011 | fix_audit_log_trigger_tenant_delete | none (irreversibility not formally accepted) | original |  |
| 123 | 20260716000000_admin_realtime_broadcast.sql | 20260716000000 | admin_realtime_broadcast | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 124 | 20260716000001_admin_cron_jobs.sql | 20260716000001 | admin_cron_jobs | none (irreversibility not formally accepted) | original |  |
| 125 | 20260716000002_gdpr_export_functions.sql | 20260716000002 | gdpr_export_functions | none (irreversibility not formally accepted) | original |  |
| 126 | 20260717000000_fix_admin_tenant_rpc_signatures.sql | 20260717000000 | fix_admin_tenant_rpc_signatures | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 127 | 20260718000000_phase6_3_support_ticket_sla.sql | 20260718000000 | phase6_3_support_ticket_sla | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 128 | 20260718000001_sp_7_1_set_tenant_subdomain.sql | 20260718000001 | sp_7_1_set_tenant_subdomain | none (irreversibility not formally accepted) | original |  |
| 129 | 20260718000002_sp1_6_expand_audit_log_event_types.sql | 20260718000002 | sp1_6_expand_audit_log_event_types | none (irreversibility not formally accepted) | original |  |
| 130 | 20260719000000_sp2_4_announcement_audience_active_range.sql | 20260719000000 | sp2_4_announcement_audience_active_range | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 131 | 20260719000001_sp_7_2_custom_domain_verification.sql | 20260719000001 | sp_7_2_custom_domain_verification | none (irreversibility not formally accepted) | original |  |
| 132 | 20260720000000_sp2_6_global_config_rpc.sql | 20260720000000 | sp2_6_global_config_rpc | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 133 | 20260720000001_sp_7_3_licenses.sql | 20260720000001 | sp_7_3_licenses | none (irreversibility not formally accepted) | original |  |
| 134 | 20260721000000_sp2_7_user_management_rpc.sql | 20260721000000 | sp2_7_user_management_rpc | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 135 | 20260722000000_sp2_8_role_management_rpc.sql | 20260722000000 | sp2_8_role_management_rpc | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 136 | 20260723000000_sp3_1_plans_crud_features.sql | 20260723000000 | sp3_1_plans_crud_features | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |
| 137 | 20260728000000_sp5_6_db_maintenance.sql | 20260728000000 | sp5_6_db_maintenance | none (irreversibility not formally accepted) | original | Timestamp jump from previous migration. |

**Inventory Summary:**
- Total forward migrations: 137
- Forward migrations with corresponding reverse file: 1
- Forward migrations without reverse file: 136

## 5. Ordered Chain Table

The authoritative execution order is ascending lexicographic order of the full file name. This table presents each migration with its immediate predecessor and successor.

| Seq | File Name | Timestamp | Semantic Slug | Predecessor | Successor |
|---|---|---|---|---|---|
| 1 | 20250703000000_baseline_pre_tenant_schema.sql | 20250703000000 | baseline_pre_tenant_schema | none | 20250704000000_phase2_tenant_foundation.sql |
| 2 | 20250704000000_phase2_tenant_foundation.sql | 20250704000000 | phase2_tenant_foundation | 20250703000000_baseline_pre_tenant_schema.sql | 20250704000001_phase3_1_core_business_tenant_id.sql |
| 3 | 20250704000001_phase3_1_core_business_tenant_id.sql | 20250704000001 | phase3_1_core_business_tenant_id | 20250704000000_phase2_tenant_foundation.sql | 20250704000002_phase3_2_inventory_stock_tenant_id.sql |
| 4 | 20250704000002_phase3_2_inventory_stock_tenant_id.sql | 20250704000002 | phase3_2_inventory_stock_tenant_id | 20250704000001_phase3_1_core_business_tenant_id.sql | 20250704000003_phase3_3_config_misc_tenant_id.sql |
| 5 | 20250704000003_phase3_3_config_misc_tenant_id.sql | 20250704000003 | phase3_3_config_misc_tenant_id | 20250704000002_phase3_2_inventory_stock_tenant_id.sql | 20250704000004_phase4_1_first_tenant_backfill_core.sql |
| 6 | 20250704000004_phase4_1_first_tenant_backfill_core.sql | 20250704000004 | phase4_1_first_tenant_backfill_core | 20250704000003_phase3_3_config_misc_tenant_id.sql | 20250704000005_phase4_2_backfill_remaining_tables_orphan_cleanup_fk.sql |
| 7 | 20250704000005_phase4_2_backfill_remaining_tables_orphan_cleanup_fk.sql | 20250704000005 | phase4_2_backfill_remaining_tables_orphan_cleanup_fk | 20250704000004_phase4_1_first_tenant_backfill_core.sql | 20250704000006_phase5_1_current_tenant_id.sql |
| 8 | 20250704000006_phase5_1_current_tenant_id.sql | 20250704000006 | phase5_1_current_tenant_id | 20250704000005_phase4_2_backfill_remaining_tables_orphan_cleanup_fk.sql | 20250704000007_phase5_2_rls_policies_core_tables.sql |
| 9 | 20250704000007_phase5_2_rls_policies_core_tables.sql | 20250704000007 | phase5_2_rls_policies_core_tables | 20250704000006_phase5_1_current_tenant_id.sql | 20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql |
| 10 | 20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql | 20250705000000 | phase5_3_rls_policies_remaining_tables_unique_indexes | 20250704000007_phase5_2_rls_policies_core_tables.sql | 20250705000001_phase7_subscription_limits.sql |
| 11 | 20250705000001_phase7_subscription_limits.sql | 20250705000001 | phase7_subscription_limits | 20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql | 20250705000002_phase8_admin_dashboard_rpc.sql |
| 12 | 20250705000002_phase8_admin_dashboard_rpc.sql | 20250705000002 | phase8_admin_dashboard_rpc | 20250705000001_phase7_subscription_limits.sql | 20250705000003_phase9_1_create_tenant_edge_function.sql |
| 13 | 20250705000003_phase9_1_create_tenant_edge_function.sql | 20250705000003 | phase9_1_create_tenant_edge_function | 20250705000002_phase8_admin_dashboard_rpc.sql | 20250705000004_phase9_5_process_checkout.sql |
| 14 | 20250705000004_phase9_5_process_checkout.sql | 20250705000004 | phase9_5_process_checkout | 20250705000003_phase9_1_create_tenant_edge_function.sql | 20250705000005_phase9_5_process_checkout_ledger_fixes.sql |
| 15 | 20250705000005_phase9_5_process_checkout_ledger_fixes.sql | 20250705000005 | phase9_5_process_checkout_ledger_fixes | 20250705000004_phase9_5_process_checkout.sql | 20250705000006_phase9_5_safeupdate_fix.sql |
| 16 | 20250705000006_phase9_5_safeupdate_fix.sql | 20250705000006 | phase9_5_safeupdate_fix | 20250705000005_phase9_5_process_checkout_ledger_fixes.sql | 20250705000007_phase9_6_audit_log_rate_limit.sql |
| 17 | 20250705000007_phase9_6_audit_log_rate_limit.sql | 20250705000007 | phase9_6_audit_log_rate_limit | 20250705000006_phase9_5_safeupdate_fix.sql | 20250705000008_phase10_1_db_policies_theo_role.sql |
| 18 | 20250705000008_phase10_1_db_policies_theo_role.sql | 20250705000008 | phase10_1_db_policies_theo_role | 20250705000007_phase9_6_audit_log_rate_limit.sql | 20250705000009_phase11_audit_log_triggers.sql |
| 19 | 20250705000009_phase11_audit_log_triggers.sql | 20250705000009 | phase11_audit_log_triggers | 20250705000008_phase10_1_db_policies_theo_role.sql | 20250705000010_phase14_cleanup_backup_tables.sql |
| 20 | 20250705000010_phase14_cleanup_backup_tables.sql | 20250705000010 | phase14_cleanup_backup_tables | 20250705000009_phase11_audit_log_triggers.sql | 20250705000015_phase15_staging_fixes.sql |
| 21 | 20250705000015_phase15_staging_fixes.sql | 20250705000015 | phase15_staging_fixes | 20250705000010_phase14_cleanup_backup_tables.sql | 20250705000016_phase16_storage_rls_tenant_assets.sql |
| 22 | 20250705000016_phase16_storage_rls_tenant_assets.sql | 20250705000016 | phase16_storage_rls_tenant_assets | 20250705000015_phase15_staging_fixes.sql | 20250705000017_phase17_long_term_operations.sql |
| 23 | 20250705000017_phase17_long_term_operations.sql | 20250705000017 | phase17_long_term_operations | 20250705000016_phase16_storage_rls_tenant_assets.sql | 20250706000000_phase_p1_tenant_list_core_management.sql |
| 24 | 20250706000000_phase_p1_tenant_list_core_management.sql | 20250706000000 | phase_p1_tenant_list_core_management | 20250705000017_phase17_long_term_operations.sql | 20250706000001_phase_p2_subscription_usage.sql |
| 25 | 20250706000001_phase_p2_subscription_usage.sql | 20250706000001 | phase_p2_subscription_usage | 20250706000000_phase_p1_tenant_list_core_management.sql | 20250706000002_phase_p3_member_management.sql |
| 26 | 20250706000002_phase_p3_member_management.sql | 20250706000002 | phase_p3_member_management | 20250706000001_phase_p2_subscription_usage.sql | 20250706000003_phase_p4_system_analytics.sql |
| 27 | 20250706000003_phase_p4_system_analytics.sql | 20250706000003 | phase_p4_system_analytics | 20250706000002_phase_p3_member_management.sql | 20250706000004_phase_p5_audit_security.sql |
| 28 | 20250706000004_phase_p5_audit_security.sql | 20250706000004 | phase_p5_audit_security | 20250706000003_phase_p4_system_analytics.sql | 20250706000005_phase_p6_operations_support.sql |
| 29 | 20250706000005_phase_p6_operations_support.sql | 20250706000005 | phase_p6_operations_support | 20250706000004_phase_p5_audit_security.sql | 20250706000006_phase_p7_0_read_only_tenant_infra.sql |
| 30 | 20250706000006_phase_p7_0_read_only_tenant_infra.sql | 20250706000006 | phase_p7_0_read_only_tenant_infra | 20250706000005_phase_p6_operations_support.sql | 20250706000007_phase_p7_1_billing_schema_bank_config.sql |
| 31 | 20250706000007_phase_p7_1_billing_schema_bank_config.sql | 20250706000007 | phase_p7_1_billing_schema_bank_config | 20250706000006_phase_p7_0_read_only_tenant_infra.sql | 20250706000008_phase_p7_2_invoice_create_pricing.sql |
| 32 | 20250706000008_phase_p7_2_invoice_create_pricing.sql | 20250706000008 | phase_p7_2_invoice_create_pricing | 20250706000007_phase_p7_1_billing_schema_bank_config.sql | 20250706000009_phase_p7_3_payment_confirm_lifecycle.sql |
| 33 | 20250706000009_phase_p7_3_payment_confirm_lifecycle.sql | 20250706000009 | phase_p7_3_payment_confirm_lifecycle | 20250706000008_phase_p7_2_invoice_create_pricing.sql | 20250706000010_phase_p7_5_expiry_renewal_cron.sql |
| 34 | 20250706000010_phase_p7_5_expiry_renewal_cron.sql | 20250706000010 | phase_p7_5_expiry_renewal_cron | 20250706000009_phase_p7_3_payment_confirm_lifecycle.sql | 20250706000011_phase_p8_1_plan_builder_schema.sql |
| 35 | 20250706000011_phase_p8_1_plan_builder_schema.sql | 20250706000011 | phase_p8_1_plan_builder_schema | 20250706000010_phase_p7_5_expiry_renewal_cron.sql | 20250706000012_phase_p8_2_feature_flags.sql |
| 36 | 20250706000012_phase_p8_2_feature_flags.sql | 20250706000012 | phase_p8_2_feature_flags | 20250706000011_phase_p8_1_plan_builder_schema.sql | 20250707000000_phase_p9_1_billing_reminders.sql |
| 37 | 20250707000000_phase_p9_1_billing_reminders.sql | 20250707000000 | phase_p9_1_billing_reminders | 20250706000012_phase_p8_2_feature_flags.sql | 20250707000001_phase_p9_1_1_billing_reminders_fix.sql |
| 38 | 20250707000001_phase_p9_1_1_billing_reminders_fix.sql | 20250707000001 | phase_p9_1_1_billing_reminders_fix | 20250707000000_phase_p9_1_billing_reminders.sql | 20250707000002_phase_p9_2_billing_automation_dashboard.sql |
| 39 | 20250707000002_phase_p9_2_billing_automation_dashboard.sql | 20250707000002 | phase_p9_2_billing_automation_dashboard | 20250707000001_phase_p9_1_1_billing_reminders_fix.sql | 20250707000003_phase_p10_1_voucher_promotion_schema.sql |
| 40 | 20250707000003_phase_p10_1_voucher_promotion_schema.sql | 20250707000003 | phase_p10_1_voucher_promotion_schema | 20250707000002_phase_p9_2_billing_automation_dashboard.sql | 20250707000004_phase_p10_2_voucher_invoice_apply.sql |
| 41 | 20250707000004_phase_p10_2_voucher_invoice_apply.sql | 20250707000004 | phase_p10_2_voucher_invoice_apply | 20250707000003_phase_p10_1_voucher_promotion_schema.sql | 20250707000005_phase_p11_1_ticket_schema_backend.sql |
| 42 | 20250707000005_phase_p11_1_ticket_schema_backend.sql | 20250707000005 | phase_p11_1_ticket_schema_backend | 20250707000004_phase_p10_2_voucher_invoice_apply.sql | 20250707000006_phase_p11_3_impersonation.sql |
| 43 | 20250707000006_phase_p11_3_impersonation.sql | 20250707000006 | phase_p11_3_impersonation | 20250707000005_phase_p11_1_ticket_schema_backend.sql | 20250707000007_phase_p12_1_announcements.sql |
| 44 | 20250707000007_phase_p12_1_announcements.sql | 20250707000007 | phase_p12_1_announcements | 20250707000006_phase_p11_3_impersonation.sql | 20250707000008_phase_p12_2_email_templates.sql |
| 45 | 20250707000008_phase_p12_2_email_templates.sql | 20250707000008 | phase_p12_2_email_templates | 20250707000007_phase_p12_1_announcements.sql | 20250708000000_phase_p12_3_notification_log.sql |
| 46 | 20250708000000_phase_p12_3_notification_log.sql | 20250708000000 | phase_p12_3_notification_log | 20250707000008_phase_p12_2_email_templates.sql | 20250708000001_phase_p13_2_error_performance.sql |
| 47 | 20250708000001_phase_p13_2_error_performance.sql | 20250708000001 | phase_p13_2_error_performance | 20250708000000_phase_p12_3_notification_log.sql | 20250708000002_phase_p13_3_storage_backup.sql |
| 48 | 20250708000002_phase_p13_3_storage_backup.sql | 20250708000002 | phase_p13_3_storage_backup | 20250708000001_phase_p13_2_error_performance.sql | 20250708000003_phase_p13_4_bulk_maintenance.sql |
| 49 | 20250708000003_phase_p13_4_bulk_maintenance.sql | 20250708000003 | phase_p13_4_bulk_maintenance | 20250708000002_phase_p13_3_storage_backup.sql | 20250708000004_phase_p14_1_tenant_backup.sql |
| 50 | 20250708000004_phase_p14_1_tenant_backup.sql | 20250708000004 | phase_p14_1_tenant_backup | 20250708000003_phase_p13_4_bulk_maintenance.sql | 20250708000005_phase_p14_2_restore_archive.sql |
| 51 | 20250708000005_phase_p14_2_restore_archive.sql | 20250708000005 | phase_p14_2_restore_archive | 20250708000004_phase_p14_1_tenant_backup.sql | 20250708000006_phase_p14_3_migration_reset.sql |
| 52 | 20250708000006_phase_p14_3_migration_reset.sql | 20250708000006 | phase_p14_3_migration_reset | 20250708000005_phase_p14_2_restore_archive.sql | 20250708000007_phase_p15_1_api_keys.sql |
| 53 | 20250708000007_phase_p15_1_api_keys.sql | 20250708000007 | phase_p15_1_api_keys | 20250708000006_phase_p14_3_migration_reset.sql | 20250708000008_phase_p15_2_webhooks.sql |
| 54 | 20250708000008_phase_p15_2_webhooks.sql | 20250708000008 | phase_p15_2_webhooks | 20250708000007_phase_p15_1_api_keys.sql | 20250708000009_phase_p15_3_integrations.sql |
| 55 | 20250708000009_phase_p15_3_integrations.sql | 20250708000009 | phase_p15_3_integrations | 20250708000008_phase_p15_2_webhooks.sql | 20250708000010_phase_p16_1_revenue_metrics.sql |
| 56 | 20250708000010_phase_p16_1_revenue_metrics.sql | 20250708000010 | phase_p16_1_revenue_metrics | 20250708000009_phase_p15_3_integrations.sql | 20250708000011_phase_p16_2_churn_cohort.sql |
| 57 | 20250708000011_phase_p16_2_churn_cohort.sql | 20250708000011 | phase_p16_2_churn_cohort | 20250708000010_phase_p16_1_revenue_metrics.sql | 20250708000013_phase_p17_1_2fa_totp.sql |
| 58 | 20250708000013_phase_p17_1_2fa_totp.sql | 20250708000013 | phase_p17_1_2fa_totp | 20250708000011_phase_p16_2_churn_cohort.sql | 20250708000014_phase_p17_2_login_history.sql |
| 59 | 20250708000014_phase_p17_2_login_history.sql | 20250708000014 | phase_p17_2_login_history | 20250708000013_phase_p17_1_2fa_totp.sql | 20250709000000_phase_p17_3_data_export_terms.sql |
| 60 | 20250709000000_phase_p17_3_data_export_terms.sql | 20250709000000 | phase_p17_3_data_export_terms | 20250708000014_phase_p17_2_login_history.sql | 20250709000001_phase_p17_4_fraud_retention.sql |
| 61 | 20250709000001_phase_p17_4_fraud_retention.sql | 20250709000001 | phase_p17_4_fraud_retention | 20250709000000_phase_p17_3_data_export_terms.sql | 20250711000001_phase_5_long_term_explicit_grants.sql |
| 62 | 20250711000001_phase_5_long_term_explicit_grants.sql | 20250711000001 | phase_5_long_term_explicit_grants | 20250709000001_phase_p17_4_fraud_retention.sql | 20250711000002_phase_5_long_term_admin_feature_flags.sql |
| 63 | 20250711000002_phase_5_long_term_admin_feature_flags.sql | 20250711000002 | phase_5_long_term_admin_feature_flags | 20250711000001_phase_5_long_term_explicit_grants.sql | 20250713000022_phase3_subscription_lifecycle_rpc.sql |
| 64 | 20250713000022_phase3_subscription_lifecycle_rpc.sql | 20250713000022 | phase3_subscription_lifecycle_rpc | 20250711000002_phase_5_long_term_admin_feature_flags.sql | 20260708000000_phase_p18_1_tenant_isolation.sql |
| 65 | 20260708000000_phase_p18_1_tenant_isolation.sql | 20260708000000 | phase_p18_1_tenant_isolation | 20250713000022_phase3_subscription_lifecycle_rpc.sql | 20260708000001_phase_p18_2_white_label.sql |
| 66 | 20260708000001_phase_p18_2_white_label.sql | 20260708000001 | phase_p18_2_white_label | 20260708000000_phase_p18_1_tenant_isolation.sql | 20260708000002_phase_p18_3_read_replica_queue.sql |
| 67 | 20260708000002_phase_p18_3_read_replica_queue.sql | 20260708000002 | phase_p18_3_read_replica_queue | 20260708000001_phase_p18_2_white_label.sql | 20260708000003_fix_update_tenant_overload.sql |
| 68 | 20260708000003_fix_update_tenant_overload.sql | 20260708000003 | fix_update_tenant_overload | 20260708000002_phase_p18_3_read_replica_queue.sql | 20260708000004_fix_system_admin_rls.sql |
| 69 | 20260708000004_fix_system_admin_rls.sql | 20260708000004 | fix_system_admin_rls | 20260708000003_fix_update_tenant_overload.sql | 20260709000000_bootstrap_system_admin.sql |
| 70 | 20260709000000_bootstrap_system_admin.sql | 20260709000000 | bootstrap_system_admin | 20260708000004_fix_system_admin_rls.sql | 20260709000001_fix_security_definer_search_path.sql |
| 71 | 20260709000001_fix_security_definer_search_path.sql | 20260709000001 | fix_security_definer_search_path | 20260709000000_bootstrap_system_admin.sql | 20260710000001_add_tenant_credentials_template.sql |
| 72 | 20260710000001_add_tenant_credentials_template.sql | 20260710000001 | add_tenant_credentials_template | 20260709000001_fix_security_definer_search_path.sql | 20260710000002_allow_email_failed_audit_action.sql |
| 73 | 20260710000002_allow_email_failed_audit_action.sql | 20260710000002 | allow_email_failed_audit_action | 20260710000001_add_tenant_credentials_template.sql | 20260710064509_f33_members_search_rpc.sql |
| 74 | 20260710064509_f33_members_search_rpc.sql | 20260710064509 | f33_members_search_rpc | 20260710000002_allow_email_failed_audit_action.sql | 20260711000001_add_tenant_credentials_table.sql |
| 75 | 20260711000001_add_tenant_credentials_table.sql | 20260711000001 | add_tenant_credentials_table | 20260710064509_f33_members_search_rpc.sql | 20260711000002_remove_tenant_credentials_password.sql |
| 76 | 20260711000002_remove_tenant_credentials_password.sql | 20260711000002 | remove_tenant_credentials_password | 20260711000001_add_tenant_credentials_table.sql | 20260711000003_f33_members_foundation.sql |
| 77 | 20260711000003_f33_members_foundation.sql | 20260711000003 | f33_members_foundation | 20260711000002_remove_tenant_credentials_password.sql | 20260711000004_f33_members_search_rpc.sql |
| 78 | 20260711000004_f33_members_search_rpc.sql | 20260711000004 | f33_members_search_rpc | 20260711000003_f33_members_foundation.sql | 20260711000005_f33_members_guardrails.sql |
| 79 | 20260711000005_f33_members_guardrails.sql | 20260711000005 | f33_members_guardrails | 20260711000004_f33_members_search_rpc.sql | 20260711000006_f33_invite_rate_limit_tenant.sql |
| 80 | 20260711000006_f33_invite_rate_limit_tenant.sql | 20260711000006 | f33_invite_rate_limit_tenant | 20260711000005_f33_members_guardrails.sql | 20260711000007_f33_members_status_activation.sql |
| 81 | 20260711000007_f33_members_status_activation.sql | 20260711000007 | f33_members_status_activation | 20260711000006_f33_invite_rate_limit_tenant.sql | 20260711000008_fix_rate_limit_logs_action_check.sql |
| 82 | 20260711000008_fix_rate_limit_logs_action_check.sql | 20260711000008 | fix_rate_limit_logs_action_check | 20260711000007_f33_members_status_activation.sql | 20260711000009_fix_tenant_delete_cascade_guardrail.sql |
| 83 | 20260711000009_fix_tenant_delete_cascade_guardrail.sql | 20260711000009 | fix_tenant_delete_cascade_guardrail | 20260711000008_fix_rate_limit_logs_action_check.sql | 20260711000010_fix_invite_seat_limit_and_plan_sync.sql |
| 84 | 20260711000010_fix_invite_seat_limit_and_plan_sync.sql | 20260711000010 | fix_invite_seat_limit_and_plan_sync | 20260711000009_fix_tenant_delete_cascade_guardrail.sql | 20260711000011_fix_edge_functions_auth_query.sql |
| 85 | 20260711000011_fix_edge_functions_auth_query.sql | 20260711000011 | fix_edge_functions_auth_query | 20260711000010_fix_invite_seat_limit_and_plan_sync.sql | 20260712000001_fix_remove_tenant_member_rpc.sql |
| 86 | 20260712000001_fix_remove_tenant_member_rpc.sql | 20260712000001 | fix_remove_tenant_member_rpc | 20260711000011_fix_edge_functions_auth_query.sql | 20260712000002_fix_update_tenant_member_role_rpc.sql |
| 87 | 20260712000002_fix_update_tenant_member_role_rpc.sql | 20260712000002 | fix_update_tenant_member_role_rpc | 20260712000001_fix_remove_tenant_member_rpc.sql | 20260712000003_fix_toggle_tenant_member_active_rpc.sql |
| 88 | 20260712000003_fix_toggle_tenant_member_active_rpc.sql | 20260712000003 | fix_toggle_tenant_member_active_rpc | 20260712000002_fix_update_tenant_member_role_rpc.sql | 20260712000004_fix_remove_system_admin_security_definer.sql |
| 89 | 20260712000004_fix_remove_system_admin_security_definer.sql | 20260712000004 | fix_remove_system_admin_security_definer | 20260712000003_fix_toggle_tenant_member_active_rpc.sql | 20260712000005_fix_guardrail_trigger_status_active_filter.sql |
| 90 | 20260712000005_fix_guardrail_trigger_status_active_filter.sql | 20260712000005 | fix_guardrail_trigger_status_active_filter | 20260712000004_fix_remove_system_admin_security_definer.sql | 20260712000006_add_soft_delete_columns.sql |
| 91 | 20260712000006_add_soft_delete_columns.sql | 20260712000006 | add_soft_delete_columns | 20260712000005_fix_guardrail_trigger_status_active_filter.sql | 20260712000007_add_rls_policies_tenant_memberships.sql |
| 92 | 20260712000007_add_rls_policies_tenant_memberships.sql | 20260712000007 | add_rls_policies_tenant_memberships | 20260712000006_add_soft_delete_columns.sql | 20260712000008_add_audit_log_triggers.sql |
| 93 | 20260712000008_add_audit_log_triggers.sql | 20260712000008 | add_audit_log_triggers | 20260712000007_add_rls_policies_tenant_memberships.sql | 20260712000009_add_advisory_lock_function.sql |
| 94 | 20260712000009_add_advisory_lock_function.sql | 20260712000009 | add_advisory_lock_function | 20260712000008_add_audit_log_triggers.sql | 20260712000010_fix_get_tenant_usage_summary_tenant_admin.sql |
| 95 | 20260712000010_fix_get_tenant_usage_summary_tenant_admin.sql | 20260712000010 | fix_get_tenant_usage_summary_tenant_admin | 20260712000009_add_advisory_lock_function.sql | 20260712000011_fix_is_system_admin_service_role.sql |
| 96 | 20260712000011_fix_is_system_admin_service_role.sql | 20260712000011 | fix_is_system_admin_service_role | 20260712000010_fix_get_tenant_usage_summary_tenant_admin.sql | 20260712000012_add_system_admin_for_edge.sql |
| 97 | 20260712000012_add_system_admin_for_edge.sql | 20260712000012 | add_system_admin_for_edge | 20260712000011_fix_is_system_admin_service_role.sql | 20260712000013_add_viewer_role.sql |
| 98 | 20260712000013_add_viewer_role.sql | 20260712000013 | add_viewer_role | 20260712000012_add_system_admin_for_edge.sql | 20260712101730_sp3_4_usage_metering.sql |
| 99 | 20260712101730_sp3_4_usage_metering.sql | 20260712101730 | sp3_4_usage_metering | 20260712000013_add_viewer_role.sql | 20260712140000_sp1_4_missing_rls_policies.sql |
| 100 | 20260712140000_sp1_4_missing_rls_policies.sql | 20260712140000 | sp1_4_missing_rls_policies | 20260712101730_sp3_4_usage_metering.sql | 20260713000001_standardize_tenants_and_memberships.sql |
| 101 | 20260713000001_standardize_tenants_and_memberships.sql | 20260713000001 | standardize_tenants_and_memberships | 20260712140000_sp1_4_missing_rls_policies.sql | 20260713000003_create_rls_helper_functions.sql |
| 102 | 20260713000003_create_rls_helper_functions.sql | 20260713000003 | create_rls_helper_functions | 20260713000001_standardize_tenants_and_memberships.sql | 20260713000004_create_user_tracking_triggers.sql |
| 103 | 20260713000004_create_user_tracking_triggers.sql | 20260713000004 | create_user_tracking_triggers | 20260713000003_create_rls_helper_functions.sql | 20260713000005_enable_rls_tenants.sql |
| 104 | 20260713000005_enable_rls_tenants.sql | 20260713000005 | enable_rls_tenants | 20260713000004_create_user_tracking_triggers.sql | 20260713000006_enable_rls_tenant_scoped_tables.sql |
| 105 | 20260713000006_enable_rls_tenant_scoped_tables.sql | 20260713000006 | enable_rls_tenant_scoped_tables | 20260713000005_enable_rls_tenants.sql | 20260713000007_create_user_tracking_triggers.sql |
| 106 | 20260713000007_create_user_tracking_triggers.sql | 20260713000007 | create_user_tracking_triggers | 20260713000006_enable_rls_tenant_scoped_tables.sql | 20260713000008_update_billing_schema.sql |
| 107 | 20260713000008_update_billing_schema.sql | 20260713000008 | update_billing_schema | 20260713000007_create_user_tracking_triggers.sql | 20260713000009_create_plan_features.sql |
| 108 | 20260713000009_create_plan_features.sql | 20260713000009 | create_plan_features | 20260713000008_update_billing_schema.sql | 20260713000010_add_role_enum.sql |
| 109 | 20260713000010_add_role_enum.sql | 20260713000010 | add_role_enum | 20260713000009_create_plan_features.sql | 20260713000011_create_invitations_table.sql |
| 110 | 20260713000011_create_invitations_table.sql | 20260713000011 | create_invitations_table | 20260713000010_add_role_enum.sql | 20260714000001_accept_invitation_rpc.sql |
| 111 | 20260714000001_accept_invitation_rpc.sql | 20260714000001 | accept_invitation_rpc | 20260713000011_create_invitations_table.sql | 20260715000001_create_audit_log_table.sql |
| 112 | 20260715000001_create_audit_log_table.sql | 20260715000001 | create_audit_log_table | 20260714000001_accept_invitation_rpc.sql | 20260715000002_create_audit_triggers.sql |
| 113 | 20260715000002_create_audit_triggers.sql | 20260715000002 | create_audit_triggers | 20260715000001_create_audit_log_table.sql | 20260715000003_admin_security_settings.sql |
| 114 | 20260715000003_admin_security_settings.sql | 20260715000003 | admin_security_settings | 20260715000002_create_audit_triggers.sql | 20260715000004_login_audit_triggers.sql |
| 115 | 20260715000004_login_audit_triggers.sql | 20260715000004 | login_audit_triggers | 20260715000003_admin_security_settings.sql | 20260715000005_install_pgtap.sql |
| 116 | 20260715000005_install_pgtap.sql | 20260715000005 | install_pgtap | 20260715000004_login_audit_triggers.sql | 20260715000006_fix_handle_new_user_create_subscription.sql |
| 117 | 20260715000006_fix_handle_new_user_create_subscription.sql | 20260715000006 | fix_handle_new_user_create_subscription | 20260715000005_install_pgtap.sql | 20260715000007_fix_audit_log_trigger_tenant_id.sql |
| 118 | 20260715000007_fix_audit_log_trigger_tenant_id.sql | 20260715000007 | fix_audit_log_trigger_tenant_id | 20260715000006_fix_handle_new_user_create_subscription.sql | 20260715000008_fix_audit_log_trigger_tenant_id_v2.sql |
| 119 | 20260715000008_fix_audit_log_trigger_tenant_id_v2.sql | 20260715000008 | fix_audit_log_trigger_tenant_id_v2 | 20260715000007_fix_audit_log_trigger_tenant_id.sql | 20260715000009_fix_tenant_memberships_audit_action.sql |
| 120 | 20260715000009_fix_tenant_memberships_audit_action.sql | 20260715000009 | fix_tenant_memberships_audit_action | 20260715000008_fix_audit_log_trigger_tenant_id_v2.sql | 20260715000010_fix_rls_helpers_enum_compare.sql |
| 121 | 20260715000010_fix_rls_helpers_enum_compare.sql | 20260715000010 | fix_rls_helpers_enum_compare | 20260715000009_fix_tenant_memberships_audit_action.sql | 20260715000011_fix_audit_log_trigger_tenant_delete.sql |
| 122 | 20260715000011_fix_audit_log_trigger_tenant_delete.sql | 20260715000011 | fix_audit_log_trigger_tenant_delete | 20260715000010_fix_rls_helpers_enum_compare.sql | 20260716000000_admin_realtime_broadcast.sql |
| 123 | 20260716000000_admin_realtime_broadcast.sql | 20260716000000 | admin_realtime_broadcast | 20260715000011_fix_audit_log_trigger_tenant_delete.sql | 20260716000001_admin_cron_jobs.sql |
| 124 | 20260716000001_admin_cron_jobs.sql | 20260716000001 | admin_cron_jobs | 20260716000000_admin_realtime_broadcast.sql | 20260716000002_gdpr_export_functions.sql |
| 125 | 20260716000002_gdpr_export_functions.sql | 20260716000002 | gdpr_export_functions | 20260716000001_admin_cron_jobs.sql | 20260717000000_fix_admin_tenant_rpc_signatures.sql |
| 126 | 20260717000000_fix_admin_tenant_rpc_signatures.sql | 20260717000000 | fix_admin_tenant_rpc_signatures | 20260716000002_gdpr_export_functions.sql | 20260718000000_phase6_3_support_ticket_sla.sql |
| 127 | 20260718000000_phase6_3_support_ticket_sla.sql | 20260718000000 | phase6_3_support_ticket_sla | 20260717000000_fix_admin_tenant_rpc_signatures.sql | 20260718000001_sp_7_1_set_tenant_subdomain.sql |
| 128 | 20260718000001_sp_7_1_set_tenant_subdomain.sql | 20260718000001 | sp_7_1_set_tenant_subdomain | 20260718000000_phase6_3_support_ticket_sla.sql | 20260718000002_sp1_6_expand_audit_log_event_types.sql |
| 129 | 20260718000002_sp1_6_expand_audit_log_event_types.sql | 20260718000002 | sp1_6_expand_audit_log_event_types | 20260718000001_sp_7_1_set_tenant_subdomain.sql | 20260719000000_sp2_4_announcement_audience_active_range.sql |
| 130 | 20260719000000_sp2_4_announcement_audience_active_range.sql | 20260719000000 | sp2_4_announcement_audience_active_range | 20260718000002_sp1_6_expand_audit_log_event_types.sql | 20260719000001_sp_7_2_custom_domain_verification.sql |
| 131 | 20260719000001_sp_7_2_custom_domain_verification.sql | 20260719000001 | sp_7_2_custom_domain_verification | 20260719000000_sp2_4_announcement_audience_active_range.sql | 20260720000000_sp2_6_global_config_rpc.sql |
| 132 | 20260720000000_sp2_6_global_config_rpc.sql | 20260720000000 | sp2_6_global_config_rpc | 20260719000001_sp_7_2_custom_domain_verification.sql | 20260720000001_sp_7_3_licenses.sql |
| 133 | 20260720000001_sp_7_3_licenses.sql | 20260720000001 | sp_7_3_licenses | 20260720000000_sp2_6_global_config_rpc.sql | 20260721000000_sp2_7_user_management_rpc.sql |
| 134 | 20260721000000_sp2_7_user_management_rpc.sql | 20260721000000 | sp2_7_user_management_rpc | 20260720000001_sp_7_3_licenses.sql | 20260722000000_sp2_8_role_management_rpc.sql |
| 135 | 20260722000000_sp2_8_role_management_rpc.sql | 20260722000000 | sp2_8_role_management_rpc | 20260721000000_sp2_7_user_management_rpc.sql | 20260723000000_sp3_1_plans_crud_features.sql |
| 136 | 20260723000000_sp3_1_plans_crud_features.sql | 20260723000000 | sp3_1_plans_crud_features | 20260722000000_sp2_8_role_management_rpc.sql | 20260728000000_sp5_6_db_maintenance.sql |
| 137 | 20260728000000_sp5_6_db_maintenance.sql | 20260728000000 | sp5_6_db_maintenance | 20260723000000_sp3_1_plans_crud_features.sql | none |

## 6. Gap Analysis

A gap is any missing timestamp sequence that would force a future hotfix to be assigned a non-real or non-unique timestamp when inserted at the logically required position, per `MIGRATION_NAMING_AND_ORDERING_STANDARD.md` sections 5 and 6.

### 6.1 Timestamp Jumps (greater than 1 second between adjacent ordered migrations)

Count: 31

- `20250703000000_baseline_pre_tenant_schema.sql` (20250703000000) -> `20250704000000_phase2_tenant_foundation.sql` (20250704000000)
- `20250704000007_phase5_2_rls_policies_core_tables.sql` (20250704000007) -> `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` (20250705000000)
- `20250705000010_phase14_cleanup_backup_tables.sql` (20250705000010) -> `20250705000015_phase15_staging_fixes.sql` (20250705000015)
- `20250705000017_phase17_long_term_operations.sql` (20250705000017) -> `20250706000000_phase_p1_tenant_list_core_management.sql` (20250706000000)
- `20250706000012_phase_p8_2_feature_flags.sql` (20250706000012) -> `20250707000000_phase_p9_1_billing_reminders.sql` (20250707000000)
- `20250707000008_phase_p12_2_email_templates.sql` (20250707000008) -> `20250708000000_phase_p12_3_notification_log.sql` (20250708000000)
- `20250708000011_phase_p16_2_churn_cohort.sql` (20250708000011) -> `20250708000013_phase_p17_1_2fa_totp.sql` (20250708000013)
- `20250708000014_phase_p17_2_login_history.sql` (20250708000014) -> `20250709000000_phase_p17_3_data_export_terms.sql` (20250709000000)
- `20250709000001_phase_p17_4_fraud_retention.sql` (20250709000001) -> `20250711000001_phase_5_long_term_explicit_grants.sql` (20250711000001)
- `20250711000002_phase_5_long_term_admin_feature_flags.sql` (20250711000002) -> `20250713000022_phase3_subscription_lifecycle_rpc.sql` (20250713000022)
- `20250713000022_phase3_subscription_lifecycle_rpc.sql` (20250713000022) -> `20260708000000_phase_p18_1_tenant_isolation.sql` (20260708000000)
- `20260708000004_fix_system_admin_rls.sql` (20260708000004) -> `20260709000000_bootstrap_system_admin.sql` (20260709000000)
- `20260709000001_fix_security_definer_search_path.sql` (20260709000001) -> `20260710000001_add_tenant_credentials_template.sql` (20260710000001)
- `20260710000002_allow_email_failed_audit_action.sql` (20260710000002) -> `20260710064509_f33_members_search_rpc.sql` (20260710064509)
- `20260710064509_f33_members_search_rpc.sql` (20260710064509) -> `20260711000001_add_tenant_credentials_table.sql` (20260711000001)
- `20260711000011_fix_edge_functions_auth_query.sql` (20260711000011) -> `20260712000001_fix_remove_tenant_member_rpc.sql` (20260712000001)
- `20260712000013_add_viewer_role.sql` (20260712000013) -> `20260712101730_sp3_4_usage_metering.sql` (20260712101730)
- `20260712101730_sp3_4_usage_metering.sql` (20260712101730) -> `20260712140000_sp1_4_missing_rls_policies.sql` (20260712140000)
- `20260712140000_sp1_4_missing_rls_policies.sql` (20260712140000) -> `20260713000001_standardize_tenants_and_memberships.sql` (20260713000001)
- `20260713000001_standardize_tenants_and_memberships.sql` (20260713000001) -> `20260713000003_create_rls_helper_functions.sql` (20260713000003)
- `20260713000011_create_invitations_table.sql` (20260713000011) -> `20260714000001_accept_invitation_rpc.sql` (20260714000001)
- `20260714000001_accept_invitation_rpc.sql` (20260714000001) -> `20260715000001_create_audit_log_table.sql` (20260715000001)
- `20260715000011_fix_audit_log_trigger_tenant_delete.sql` (20260715000011) -> `20260716000000_admin_realtime_broadcast.sql` (20260716000000)
- `20260716000002_gdpr_export_functions.sql` (20260716000002) -> `20260717000000_fix_admin_tenant_rpc_signatures.sql` (20260717000000)
- `20260717000000_fix_admin_tenant_rpc_signatures.sql` (20260717000000) -> `20260718000000_phase6_3_support_ticket_sla.sql` (20260718000000)
- `20260718000002_sp1_6_expand_audit_log_event_types.sql` (20260718000002) -> `20260719000000_sp2_4_announcement_audience_active_range.sql` (20260719000000)
- `20260719000001_sp_7_2_custom_domain_verification.sql` (20260719000001) -> `20260720000000_sp2_6_global_config_rpc.sql` (20260720000000)
- `20260720000001_sp_7_3_licenses.sql` (20260720000001) -> `20260721000000_sp2_7_user_management_rpc.sql` (20260721000000)
- `20260721000000_sp2_7_user_management_rpc.sql` (20260721000000) -> `20260722000000_sp2_8_role_management_rpc.sql` (20260722000000)
- `20260722000000_sp2_8_role_management_rpc.sql` (20260722000000) -> `20260723000000_sp3_1_plans_crud_features.sql` (20260723000000)
- `20260723000000_sp3_1_plans_crud_features.sql` (20260723000000) -> `20260728000000_sp5_6_db_maintenance.sql` (20260728000000)

### 6.2 Adjacent Migrations with No Timestamp Space

Count of adjacent pairs with no available integer timestamp between them: 105

This means a hotfix whose real creation timestamp falls between such a pair cannot be assigned a real, unique timestamp without renumbering one of the existing migrations.

### 6.3 Date-Range Discontinuities

- First migration timestamp: 20250703000000
- Last migration timestamp: 20260728000000
- The chain spans from 2025-07-03 to 2026-07-28, with several intra-day and multi-day jumps.

## 7. Hotfix Readiness Statement

The canonical chain, as currently defined, cannot reliably accept a real-timestamp hotfix between many adjacent migrations without using a synthetic timestamp or renumbering existing files.

- Hotfixes placed after the last migration (`20260728000000_sp5_6_db_maintenance.sql`) can use a real timestamp greater than `20260728000000` without conflict.
- Hotfixes that must be inserted between existing migrations frequently have no available real timestamp because adjacent migrations are packed at 1-second intervals.
- The standard permits the smallest unused timestamp fallback, but this would introduce non-real timestamps and reduce traceability.

No Program Manager exception for hotfix handling has been recorded in this analysis.

## 8. Orphan-File Reference

Total SQL files known to be outside the canonical chain: 57

None of these files have been absorbed into the canonical chain. Their disposition is governed by the **Orphan SQL Triage Record** (D-P2-02).

### 8.1 Orphan File Distribution by Parent Directory

| Directory | File Count |
|---|---|
| `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\supabase` | 17 |
| `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\Plan\Migration` | 13 |
| `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\memory-zone\.temp\phase7c_sections` | 11 |
| `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\supabase\tests\admin` | 5 |
| `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\memory-zone\backup\f1` | 3 |
| `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\backups` | 2 |
| `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\memory-zone\archive` | 1 |
| `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\memory-zone\backup\f2` | 1 |
| `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\memory-zone\backup\f3` | 1 |
| `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\memory-zone\backup\f4` | 1 |
| `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\memory-zone\backup\f5` | 1 |
| `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\scripts` | 1 |

### 8.2 Orphan Files Mirroring Canonical Names

The following orphan files have the same name as a canonical migration file (potential duplicate-authority risk):

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\Plan\Migration\20250713000022_phase3_subscription_lifecycle_rpc.sql`
- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\Plan\Migration\20260712101730_sp3_4_usage_metering.sql`
- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\Plan\Migration\20260712140000_sp1_4_missing_rls_policies.sql`
- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\Plan\Migration\20260718000000_phase6_3_support_ticket_sla.sql`
- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\Plan\Migration\20260719000000_sp2_4_announcement_audience_active_range.sql`
- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\Plan\Migration\20260719000001_sp_7_2_custom_domain_verification.sql`
- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\Plan\Migration\20260720000000_sp2_6_global_config_rpc.sql`
- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\Plan\Migration\20260720000001_sp_7_3_licenses.sql`
- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\Plan\Migration\20260721000000_sp2_7_user_management_rpc.sql`
- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\Plan\Migration\20260722000000_sp2_8_role_management_rpc.sql`
- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\Plan\Migration\20260723000000_sp3_1_plans_crud_features.sql`
- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\Plan\Migration\20260728000000_sp5_6_db_maintenance.sql`
- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\memory-zone\backup\f1\20250706000000_phase_p1_tenant_list_core_management.sql`
- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\memory-zone\backup\f1\20260708000000_phase_p18_1_tenant_isolation.sql`
- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\memory-zone\backup\f1\20260708000004_fix_system_admin_rls.sql`
- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\memory-zone\backup\f2\20250706000006_phase_p7_0_read_only_tenant_infra.sql`
- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\memory-zone\backup\f3\20250708000005_phase_p14_2_restore_archive.sql`
- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\memory-zone\backup\f4\20250708000013_phase_p17_1_2fa_totp.sql`
- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\memory-zone\backup\f5\20250707000000_phase_p9_1_billing_reminders.sql`

### 8.3 Absorbed Orphans

No orphan files have been absorbed into the canonical chain at the time of this definition.

## 9. Validation Evidence

| Evidence ID | Description | Status | Source / Command |
|---|---|---|---|
| E-1 | Migration Inventory | Complete | Section 4 of this document; generated from `Get-ChildItem supabase/migrations -Filter *.sql` |
| E-2 | Ordered Chain Table | Complete | Section 5 of this document; sorted by full file name lexicographically |
| E-3 | Gap Analysis | Complete | Section 6 of this document; timestamp differences computed from file names |
| E-4 | Staging-Environment Application Log | Pending | Not available in this analysis-only task; required before final Phase 2 exit |
| E-5 | Naming and Ordering Compliance Statement | Complete with observations | Section 4; all forward files match `<TIMESTAMP>_<SEMANTIC_SLUG>.sql` |
| E-6 | Orphan-File Cross-Reference | Complete | Section 8 of this document; D-P2-02 to follow |
| E-7 | Authority Acknowledgment | Pending | Requires Architecture Authority and Program Manager sign-off |

## 10. Findings

1. Deterministic ordering is present. All 137 forward migrations in `supabase/migrations` have unique file names and sort unambiguously in ascending lexicographic order.
2. Forward file names conform to the basic naming convention. Every file matches `<TIMESTAMP>_<SEMANTIC_SLUG>.sql`.
3. Reverse-migration coverage is effectively absent. Only one reverse file exists in `supabase/migrations/rollback`: `20260713000002_standardize_tenants_and_memberships_down.sql`. It does not use the required `.reverse.sql` suffix and its timestamp (`20260713000002`) has no corresponding forward migration in the chain (the adjacent forward migrations are `20260713000001` and `20260713000003`).
4. Hotfix gaps exist due to dense timestamp packing. 105 adjacent migration pairs leave zero integer timestamps between them, so a real-timestamp hotfix between them would conflict.
5. Large date-range jumps provide natural hotfix space at the end. The last migration is dated 2026-07-28, so any hotfix created after that date can use its real timestamp.
6. Duplicate semantic slugs appear. The following semantic slugs occur more than once in the canonical chain:

   - `create_user_tracking_triggers` — 2 occurrences
   - `f33_members_search_rpc` — 2 occurrences

   This is permitted by the letter of the naming standard but reduces human traceability.
7. No duplicate timestamps within the canonical chain. All 137 forward-migration timestamps are unique.
8. Orphan SQL files carry authority risk. 57 SQL files exist outside the canonical directories. Several have names/timestamps that overlap or mirror canonical migrations, most notably under `Plan/Migration`, `supabase/`, and `memory-zone/backup/`. These must be triaged in D-P2-02 so that none are treated as schema authority.
9. Rollback convention is not followed. The standard requires reverse files to share the forward file's timestamp and semantic slug and use the `.reverse.sql` extension (or reside in the declared rollback directory with matching name). The single existing rollback file uses `_down.sql` and points to a non-existent forward timestamp.
10. No staging application log is available. Evidence E-4 is pending and must be completed before Phase 2 exit.

## 11. Conclusion

The canonical migration chain is identifiable, deterministic, and name-unique, consisting of 137 forward migrations in `supabase/migrations`.
However, it is not yet ready for unconditional acceptance because of dense timestamp packing that limits real-timestamp hotfix insertion, the absence of reverse files, and the presence of numerous orphan SQL files that must be triaged before Phase 2 exit.

## 12. Acceptance Statement

| Role | Name | Acknowledgment | Date |
|---|---|---|---|
| Program Manager | | Pending | |
| Architecture Authority | | Pending | |
| Engineering Team | | Pending | |

## 13. Change Log

| Version | Date | Author | Reason | Impact |
|---|---|---|---|
| 1.0 | 2026-07-14 | D-P2-01 Analysis | Initial canonical chain definition | Baseline for Phase 2 acceptance |
