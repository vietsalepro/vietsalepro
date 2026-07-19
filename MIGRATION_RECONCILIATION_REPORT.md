# MIGRATION RECONCILIATION REPORT

## Investigation Summary

- Production project: `rsialbfjswnrkzcxarnj` (QLBH)
- Local canonical migration directory: `supabase/migrations`
- Local canonical migration files: 138
- Applied production migrations: 136
- Matched versions: 127
- Local-only versions: 11
- Production-only versions: 9
- Version mismatches (same version, different name): 0
- Latest local migration: 20260728000000
- Latest production migration: 20260718000000

## Local Repository Note

The `supabase/migrations` directory contains 138 canonical, timestamped migration files that the Supabase migration runner would recognise. An additional 17 files with the `migration_` prefix were found in `supabase/` (not inside `supabase/migrations`) and do not use the `YYYYMMDDHHMMSS_name.sql` convention; they are not tracked in `schema_migrations` and are excluded from the reconciliation matrix. The Repository Hygiene Review figure of 138 therefore matches the canonical `supabase/migrations` entries.

## Complete Local Migration List (canonical)

| Version | Local Filename (name part) |
| --- | --- |
| 20250703000000 | baseline_pre_tenant_schema |
| 20250704000000 | phase2_tenant_foundation |
| 20250704000001 | phase3_1_core_business_tenant_id |
| 20250704000002 | phase3_2_inventory_stock_tenant_id |
| 20250704000003 | phase3_3_config_misc_tenant_id |
| 20250704000004 | phase4_1_first_tenant_backfill_core |
| 20250704000005 | phase4_2_backfill_remaining_tables_orphan_cleanup_fk |
| 20250704000006 | phase5_1_current_tenant_id |
| 20250704000007 | phase5_2_rls_policies_core_tables |
| 20250705000000 | phase5_3_rls_policies_remaining_tables_unique_indexes |
| 20250705000001 | phase7_subscription_limits |
| 20250705000002 | phase8_admin_dashboard_rpc |
| 20250705000003 | phase9_1_create_tenant_edge_function |
| 20250705000004 | phase9_5_process_checkout |
| 20250705000005 | phase9_5_process_checkout_ledger_fixes |
| 20250705000006 | phase9_5_safeupdate_fix |
| 20250705000007 | phase9_6_audit_log_rate_limit |
| 20250705000008 | phase10_1_db_policies_theo_role |
| 20250705000009 | phase11_audit_log_triggers |
| 20250705000010 | phase14_cleanup_backup_tables |
| 20250705000015 | phase15_staging_fixes |
| 20250705000016 | phase16_storage_rls_tenant_assets |
| 20250705000017 | phase17_long_term_operations |
| 20250706000000 | phase_p1_tenant_list_core_management |
| 20250706000001 | phase_p2_subscription_usage |
| 20250706000002 | phase_p3_member_management |
| 20250706000003 | phase_p4_system_analytics |
| 20250706000004 | phase_p5_audit_security |
| 20250706000005 | phase_p6_operations_support |
| 20250706000006 | phase_p7_0_read_only_tenant_infra |
| 20250706000007 | phase_p7_1_billing_schema_bank_config |
| 20250706000008 | phase_p7_2_invoice_create_pricing |
| 20250706000009 | phase_p7_3_payment_confirm_lifecycle |
| 20250706000010 | phase_p7_5_expiry_renewal_cron |
| 20250706000011 | phase_p8_1_plan_builder_schema |
| 20250706000012 | phase_p8_2_feature_flags |
| 20250707000000 | phase_p9_1_billing_reminders |
| 20250707000001 | phase_p9_1_1_billing_reminders_fix |
| 20250707000002 | phase_p9_2_billing_automation_dashboard |
| 20250707000003 | phase_p10_1_voucher_promotion_schema |
| 20250707000004 | phase_p10_2_voucher_invoice_apply |
| 20250707000005 | phase_p11_1_ticket_schema_backend |
| 20250707000006 | phase_p11_3_impersonation |
| 20250707000007 | phase_p12_1_announcements |
| 20250707000008 | phase_p12_2_email_templates |
| 20250708000000 | phase_p12_3_notification_log |
| 20250708000001 | phase_p13_2_error_performance |
| 20250708000002 | phase_p13_3_storage_backup |
| 20250708000003 | phase_p13_4_bulk_maintenance |
| 20250708000004 | phase_p14_1_tenant_backup |
| 20250708000005 | phase_p14_2_restore_archive |
| 20250708000006 | phase_p14_3_migration_reset |
| 20250708000007 | phase_p15_1_api_keys |
| 20250708000008 | phase_p15_2_webhooks |
| 20250708000009 | phase_p15_3_integrations |
| 20250708000010 | phase_p16_1_revenue_metrics |
| 20250708000011 | phase_p16_2_churn_cohort |
| 20250708000013 | phase_p17_1_2fa_totp |
| 20250708000014 | phase_p17_2_login_history |
| 20250709000000 | phase_p17_3_data_export_terms |
| 20250709000001 | phase_p17_4_fraud_retention |
| 20250711000001 | phase_5_long_term_explicit_grants |
| 20250711000002 | phase_5_long_term_admin_feature_flags |
| 20250713000022 | phase3_subscription_lifecycle_rpc |
| 20260708000000 | phase_p18_1_tenant_isolation |
| 20260708000001 | phase_p18_2_white_label |
| 20260708000002 | phase_p18_3_read_replica_queue |
| 20260708000003 | fix_update_tenant_overload |
| 20260708000004 | fix_system_admin_rls |
| 20260709000000 | bootstrap_system_admin |
| 20260709000001 | fix_security_definer_search_path |
| 20260710000001 | add_tenant_credentials_template |
| 20260710000002 | allow_email_failed_audit_action |
| 20260710064509 | f33_members_search_rpc |
| 20260711000001 | add_tenant_credentials_table |
| 20260711000002 | remove_tenant_credentials_password |
| 20260711000003 | f33_members_foundation |
| 20260711000004 | f33_members_search_rpc |
| 20260711000005 | f33_members_guardrails |
| 20260711000006 | f33_invite_rate_limit_tenant |
| 20260711000007 | f33_members_status_activation |
| 20260711000008 | fix_rate_limit_logs_action_check |
| 20260711000009 | fix_tenant_delete_cascade_guardrail |
| 20260711000010 | fix_invite_seat_limit_and_plan_sync |
| 20260711000011 | fix_edge_functions_auth_query |
| 20260712000001 | fix_remove_tenant_member_rpc |
| 20260712000002 | fix_update_tenant_member_role_rpc |
| 20260712000003 | fix_toggle_tenant_member_active_rpc |
| 20260712000004 | fix_remove_system_admin_security_definer |
| 20260712000005 | fix_guardrail_trigger_status_active_filter |
| 20260712000006 | add_soft_delete_columns |
| 20260712000007 | add_rls_policies_tenant_memberships |
| 20260712000008 | add_audit_log_triggers |
| 20260712000009 | add_advisory_lock_function |
| 20260712000010 | fix_get_tenant_usage_summary_tenant_admin |
| 20260712000011 | fix_is_system_admin_service_role |
| 20260712000012 | add_system_admin_for_edge |
| 20260712000013 | add_viewer_role |
| 20260712101730 | sp3_4_usage_metering |
| 20260712140000 | sp1_4_missing_rls_policies |
| 20260713000001 | standardize_tenants_and_memberships |
| 20260713000003 | create_rls_helper_functions |
| 20260713000004 | create_user_tracking_triggers |
| 20260713000005 | enable_rls_tenants |
| 20260713000006 | enable_rls_tenant_scoped_tables |
| 20260713000007 | create_user_tracking_triggers |
| 20260713000008 | update_billing_schema |
| 20260713000009 | create_plan_features |
| 20260713000010 | add_role_enum |
| 20260713000011 | create_invitations_table |
| 20260714000001 | accept_invitation_rpc |
| 20260715000001 | create_audit_log_table |
| 20260715000002 | create_audit_triggers |
| 20260715000003 | admin_security_settings |
| 20260715000004 | login_audit_triggers |
| 20260715000005 | install_pgtap |
| 20260715000006 | fix_handle_new_user_create_subscription |
| 20260715000007 | fix_audit_log_trigger_tenant_id |
| 20260715000008 | fix_audit_log_trigger_tenant_id_v2 |
| 20260715000009 | fix_tenant_memberships_audit_action |
| 20260715000010 | fix_rls_helpers_enum_compare |
| 20260715000011 | fix_audit_log_trigger_tenant_delete |
| 20260716000000 | admin_realtime_broadcast |
| 20260716000001 | admin_cron_jobs |
| 20260716000002 | gdpr_export_functions |
| 20260717000000 | fix_admin_tenant_rpc_signatures |
| 20260718000000 | phase6_3_support_ticket_sla |
| 20260718000001 | sp_7_1_set_tenant_subdomain |
| 20260718000002 | sp1_6_expand_audit_log_event_types |
| 20260719000000 | sp2_4_announcement_audience_active_range |
| 20260719000001 | sp_7_2_custom_domain_verification |
| 20260720000000 | sp2_6_global_config_rpc |
| 20260720000001 | sp_7_3_licenses |
| 20260721000000 | sp2_7_user_management_rpc |
| 20260722000000 | sp2_8_role_management_rpc |
| 20260723000000 | sp3_1_plans_crud_features |
| 20260723000001 | g1_add_max_storage_gb_to_tenant_subscriptions |
| 20260728000000 | sp5_6_db_maintenance |

## Complete Production Migration List

| Version | Production Name |
| --- | --- |
| 20250703000000 | baseline_pre_tenant_schema |
| 20250704000000 | phase2_tenant_foundation |
| 20250704000001 | phase3_1_core_business_tenant_id |
| 20250704000002 | phase3_2_inventory_stock_tenant_id |
| 20250704000003 | phase3_3_config_misc_tenant_id |
| 20250704000004 | phase4_1_first_tenant_backfill_core |
| 20250704000005 | phase4_2_backfill_remaining_tables_orphan_cleanup_fk |
| 20250704000006 | phase5_1_current_tenant_id |
| 20250704000007 | phase5_2_rls_policies_core_tables |
| 20250705000000 | phase5_3_rls_policies_remaining_tables_unique_indexes |
| 20250705000001 | phase7_subscription_limits |
| 20250705000002 | phase8_admin_dashboard_rpc |
| 20250705000003 | phase9_1_create_tenant_edge_function |
| 20250705000004 | phase9_5_process_checkout |
| 20250705000005 | phase9_5_process_checkout_ledger_fixes |
| 20250705000006 | phase9_5_safeupdate_fix |
| 20250705000007 | phase9_6_audit_log_rate_limit |
| 20250705000008 | phase10_1_db_policies_theo_role |
| 20250705000009 | phase11_audit_log_triggers |
| 20250705000010 | phase14_cleanup_backup_tables |
| 20250705000015 | phase15_staging_fixes |
| 20250705000016 | phase16_storage_rls_tenant_assets |
| 20250705000017 | phase17_long_term_operations |
| 20250706000000 | phase_p1_tenant_list_core_management |
| 20250706000001 | phase_p2_subscription_usage |
| 20250706000002 | phase_p3_member_management |
| 20250706000003 | phase_p4_system_analytics |
| 20250706000004 | phase_p5_audit_security |
| 20250706000005 | phase_p6_operations_support |
| 20250706000006 | phase_p7_0_read_only_tenant_infra |
| 20250706000007 | phase_p7_1_billing_schema_bank_config |
| 20250706000008 | phase_p7_2_invoice_create_pricing |
| 20250706000009 | phase_p7_3_payment_confirm_lifecycle |
| 20250706000010 | phase_p7_5_expiry_renewal_cron |
| 20250706000011 | phase_p8_1_plan_builder_schema |
| 20250706000012 | phase_p8_2_feature_flags |
| 20250707000000 | phase_p9_1_billing_reminders |
| 20250707000001 | phase_p9_1_1_billing_reminders_fix |
| 20250707000002 | phase_p9_2_billing_automation_dashboard |
| 20250707000003 | phase_p10_1_voucher_promotion_schema |
| 20250707000004 | phase_p10_2_voucher_invoice_apply |
| 20250707000005 | phase_p11_1_ticket_schema_backend |
| 20250707000006 | phase_p11_3_impersonation |
| 20250707000007 | phase_p12_1_announcements |
| 20250707000008 | phase_p12_2_email_templates |
| 20250708000000 | phase_p12_3_notification_log |
| 20250708000001 | phase_p13_2_error_performance |
| 20250708000002 | phase_p13_3_storage_backup |
| 20250708000003 | phase_p13_4_bulk_maintenance |
| 20250708000004 | phase_p14_1_tenant_backup |
| 20250708000005 | phase_p14_2_restore_archive |
| 20250708000006 | phase_p14_3_migration_reset |
| 20250708000007 | phase_p15_1_api_keys |
| 20250708000008 | phase_p15_2_webhooks |
| 20250708000009 | phase_p15_3_integrations |
| 20250708000010 | phase_p16_1_revenue_metrics |
| 20250708000011 | phase_p16_2_churn_cohort |
| 20250708000013 | phase_p17_1_2fa_totp |
| 20250708000014 | phase_p17_2_login_history |
| 20250709000000 | phase_p17_3_data_export_terms |
| 20250709000001 | phase_p17_4_fraud_retention |
| 20250711000001 | phase_5_long_term_explicit_grants |
| 20250711000002 | phase_5_long_term_admin_feature_flags |
| 20250713000022 | phase3_subscription_lifecycle_rpc |
| 20260708000000 | phase_p18_1_tenant_isolation |
| 20260708000001 | phase_p18_2_white_label |
| 20260708000002 | phase_p18_3_read_replica_queue |
| 20260708000003 | fix_update_tenant_overload |
| 20260708000004 | fix_system_admin_rls |
| 20260709000000 | bootstrap_system_admin |
| 20260709000001 | fix_security_definer_search_path |
| 20260710000001 | add_tenant_credentials_template |
| 20260710000002 | allow_email_failed_audit_action |
| 20260710064509 | f33_members_search_rpc |
| 20260711000001 | add_tenant_credentials_table |
| 20260711000002 | remove_tenant_credentials_password |
| 20260711000003 | f33_members_foundation |
| 20260711000004 | f33_members_search_rpc |
| 20260711000005 | f33_members_guardrails |
| 20260711000006 | f33_invite_rate_limit_tenant |
| 20260711000007 | f33_members_status_activation |
| 20260711000008 | fix_rate_limit_logs_action_check |
| 20260711000009 | fix_tenant_delete_cascade_guardrail |
| 20260711000010 | fix_invite_seat_limit_and_plan_sync |
| 20260711000011 | fix_edge_functions_auth_query |
| 20260712000001 | fix_remove_tenant_member_rpc |
| 20260712000002 | fix_update_tenant_member_role_rpc |
| 20260712000003 | fix_toggle_tenant_member_active_rpc |
| 20260712000004 | fix_remove_system_admin_security_definer |
| 20260712000005 | fix_guardrail_trigger_status_active_filter |
| 20260712000006 | add_soft_delete_columns |
| 20260712000007 | add_rls_policies_tenant_memberships |
| 20260712000008 | add_audit_log_triggers |
| 20260712000009 | add_advisory_lock_function |
| 20260712000010 | fix_get_tenant_usage_summary_tenant_admin |
| 20260712000011 | fix_is_system_admin_service_role |
| 20260712000012 | add_system_admin_for_edge |
| 20260712000013 | add_viewer_role |
| 20260712101730 | sp3_4_usage_metering |
| 20260712140000 | sp1_4_missing_rls_policies |
| 20260713000001 | standardize_tenants_and_memberships |
| 20260713000003 | create_rls_helper_functions |
| 20260713000004 | create_user_tracking_triggers |
| 20260713000005 | enable_rls_tenants |
| 20260713000006 | enable_rls_tenant_scoped_tables |
| 20260713000007 | create_user_tracking_triggers |
| 20260713000008 | update_billing_schema |
| 20260713000009 | create_plan_features |
| 20260713000010 | add_role_enum |
| 20260713000011 | create_invitations_table |
| 20260713053550 | sp1_6_expand_audit_log_event_types |
| 20260713053608 | sp2_4_announcement_audience_active_range |
| 20260713053615 | sp_7_2_custom_domain_verification |
| 20260713053622 | sp2_6_global_config_rpc |
| 20260713053644 | sp_7_3_licenses |
| 20260713053657 | sp2_7_user_management_rpc |
| 20260713053746 | sp2_8_role_management_rpc |
| 20260713053807 | sp3_1_plans_crud_features |
| 20260713053828 | sp5_6_db_maintenance |
| 20260714000001 | accept_invitation_rpc |
| 20260715000001 | create_audit_log_table |
| 20260715000002 | create_audit_triggers |
| 20260715000003 | admin_security_settings |
| 20260715000004 | login_audit_triggers |
| 20260715000005 | install_pgtap |
| 20260715000006 | fix_handle_new_user_create_subscription |
| 20260715000007 | fix_audit_log_trigger_tenant_id |
| 20260715000008 | fix_audit_log_trigger_tenant_id_v2 |
| 20260715000009 | fix_tenant_memberships_audit_action |
| 20260715000010 | fix_rls_helpers_enum_compare |
| 20260715000011 | fix_audit_log_trigger_tenant_delete |
| 20260716000000 | admin_realtime_broadcast |
| 20260716000001 | admin_cron_jobs |
| 20260716000002 | gdpr_export_functions |
| 20260717000000 | fix_admin_tenant_rpc_signatures |
| 20260718000000 | phase6_3_support_ticket_sla |

## Reconciliation Matrix

| Migration Version | Local | Production | Status |
| --- | --- | --- | --- |
| 20250703000000 | baseline_pre_tenant_schema | baseline_pre_tenant_schema | MATCH |
| 20250704000000 | phase2_tenant_foundation | phase2_tenant_foundation | MATCH |
| 20250704000001 | phase3_1_core_business_tenant_id | phase3_1_core_business_tenant_id | MATCH |
| 20250704000002 | phase3_2_inventory_stock_tenant_id | phase3_2_inventory_stock_tenant_id | MATCH |
| 20250704000003 | phase3_3_config_misc_tenant_id | phase3_3_config_misc_tenant_id | MATCH |
| 20250704000004 | phase4_1_first_tenant_backfill_core | phase4_1_first_tenant_backfill_core | MATCH |
| 20250704000005 | phase4_2_backfill_remaining_tables_orphan_cleanup_fk | phase4_2_backfill_remaining_tables_orphan_cleanup_fk | MATCH |
| 20250704000006 | phase5_1_current_tenant_id | phase5_1_current_tenant_id | MATCH |
| 20250704000007 | phase5_2_rls_policies_core_tables | phase5_2_rls_policies_core_tables | MATCH |
| 20250705000000 | phase5_3_rls_policies_remaining_tables_unique_indexes | phase5_3_rls_policies_remaining_tables_unique_indexes | MATCH |
| 20250705000001 | phase7_subscription_limits | phase7_subscription_limits | MATCH |
| 20250705000002 | phase8_admin_dashboard_rpc | phase8_admin_dashboard_rpc | MATCH |
| 20250705000003 | phase9_1_create_tenant_edge_function | phase9_1_create_tenant_edge_function | MATCH |
| 20250705000004 | phase9_5_process_checkout | phase9_5_process_checkout | MATCH |
| 20250705000005 | phase9_5_process_checkout_ledger_fixes | phase9_5_process_checkout_ledger_fixes | MATCH |
| 20250705000006 | phase9_5_safeupdate_fix | phase9_5_safeupdate_fix | MATCH |
| 20250705000007 | phase9_6_audit_log_rate_limit | phase9_6_audit_log_rate_limit | MATCH |
| 20250705000008 | phase10_1_db_policies_theo_role | phase10_1_db_policies_theo_role | MATCH |
| 20250705000009 | phase11_audit_log_triggers | phase11_audit_log_triggers | MATCH |
| 20250705000010 | phase14_cleanup_backup_tables | phase14_cleanup_backup_tables | MATCH |
| 20250705000015 | phase15_staging_fixes | phase15_staging_fixes | MATCH |
| 20250705000016 | phase16_storage_rls_tenant_assets | phase16_storage_rls_tenant_assets | MATCH |
| 20250705000017 | phase17_long_term_operations | phase17_long_term_operations | MATCH |
| 20250706000000 | phase_p1_tenant_list_core_management | phase_p1_tenant_list_core_management | MATCH |
| 20250706000001 | phase_p2_subscription_usage | phase_p2_subscription_usage | MATCH |
| 20250706000002 | phase_p3_member_management | phase_p3_member_management | MATCH |
| 20250706000003 | phase_p4_system_analytics | phase_p4_system_analytics | MATCH |
| 20250706000004 | phase_p5_audit_security | phase_p5_audit_security | MATCH |
| 20250706000005 | phase_p6_operations_support | phase_p6_operations_support | MATCH |
| 20250706000006 | phase_p7_0_read_only_tenant_infra | phase_p7_0_read_only_tenant_infra | MATCH |
| 20250706000007 | phase_p7_1_billing_schema_bank_config | phase_p7_1_billing_schema_bank_config | MATCH |
| 20250706000008 | phase_p7_2_invoice_create_pricing | phase_p7_2_invoice_create_pricing | MATCH |
| 20250706000009 | phase_p7_3_payment_confirm_lifecycle | phase_p7_3_payment_confirm_lifecycle | MATCH |
| 20250706000010 | phase_p7_5_expiry_renewal_cron | phase_p7_5_expiry_renewal_cron | MATCH |
| 20250706000011 | phase_p8_1_plan_builder_schema | phase_p8_1_plan_builder_schema | MATCH |
| 20250706000012 | phase_p8_2_feature_flags | phase_p8_2_feature_flags | MATCH |
| 20250707000000 | phase_p9_1_billing_reminders | phase_p9_1_billing_reminders | MATCH |
| 20250707000001 | phase_p9_1_1_billing_reminders_fix | phase_p9_1_1_billing_reminders_fix | MATCH |
| 20250707000002 | phase_p9_2_billing_automation_dashboard | phase_p9_2_billing_automation_dashboard | MATCH |
| 20250707000003 | phase_p10_1_voucher_promotion_schema | phase_p10_1_voucher_promotion_schema | MATCH |
| 20250707000004 | phase_p10_2_voucher_invoice_apply | phase_p10_2_voucher_invoice_apply | MATCH |
| 20250707000005 | phase_p11_1_ticket_schema_backend | phase_p11_1_ticket_schema_backend | MATCH |
| 20250707000006 | phase_p11_3_impersonation | phase_p11_3_impersonation | MATCH |
| 20250707000007 | phase_p12_1_announcements | phase_p12_1_announcements | MATCH |
| 20250707000008 | phase_p12_2_email_templates | phase_p12_2_email_templates | MATCH |
| 20250708000000 | phase_p12_3_notification_log | phase_p12_3_notification_log | MATCH |
| 20250708000001 | phase_p13_2_error_performance | phase_p13_2_error_performance | MATCH |
| 20250708000002 | phase_p13_3_storage_backup | phase_p13_3_storage_backup | MATCH |
| 20250708000003 | phase_p13_4_bulk_maintenance | phase_p13_4_bulk_maintenance | MATCH |
| 20250708000004 | phase_p14_1_tenant_backup | phase_p14_1_tenant_backup | MATCH |
| 20250708000005 | phase_p14_2_restore_archive | phase_p14_2_restore_archive | MATCH |
| 20250708000006 | phase_p14_3_migration_reset | phase_p14_3_migration_reset | MATCH |
| 20250708000007 | phase_p15_1_api_keys | phase_p15_1_api_keys | MATCH |
| 20250708000008 | phase_p15_2_webhooks | phase_p15_2_webhooks | MATCH |
| 20250708000009 | phase_p15_3_integrations | phase_p15_3_integrations | MATCH |
| 20250708000010 | phase_p16_1_revenue_metrics | phase_p16_1_revenue_metrics | MATCH |
| 20250708000011 | phase_p16_2_churn_cohort | phase_p16_2_churn_cohort | MATCH |
| 20250708000013 | phase_p17_1_2fa_totp | phase_p17_1_2fa_totp | MATCH |
| 20250708000014 | phase_p17_2_login_history | phase_p17_2_login_history | MATCH |
| 20250709000000 | phase_p17_3_data_export_terms | phase_p17_3_data_export_terms | MATCH |
| 20250709000001 | phase_p17_4_fraud_retention | phase_p17_4_fraud_retention | MATCH |
| 20250711000001 | phase_5_long_term_explicit_grants | phase_5_long_term_explicit_grants | MATCH |
| 20250711000002 | phase_5_long_term_admin_feature_flags | phase_5_long_term_admin_feature_flags | MATCH |
| 20250713000022 | phase3_subscription_lifecycle_rpc | phase3_subscription_lifecycle_rpc | MATCH |
| 20260708000000 | phase_p18_1_tenant_isolation | phase_p18_1_tenant_isolation | MATCH |
| 20260708000001 | phase_p18_2_white_label | phase_p18_2_white_label | MATCH |
| 20260708000002 | phase_p18_3_read_replica_queue | phase_p18_3_read_replica_queue | MATCH |
| 20260708000003 | fix_update_tenant_overload | fix_update_tenant_overload | MATCH |
| 20260708000004 | fix_system_admin_rls | fix_system_admin_rls | MATCH |
| 20260709000000 | bootstrap_system_admin | bootstrap_system_admin | MATCH |
| 20260709000001 | fix_security_definer_search_path | fix_security_definer_search_path | MATCH |
| 20260710000001 | add_tenant_credentials_template | add_tenant_credentials_template | MATCH |
| 20260710000002 | allow_email_failed_audit_action | allow_email_failed_audit_action | MATCH |
| 20260710064509 | f33_members_search_rpc | f33_members_search_rpc | MATCH |
| 20260711000001 | add_tenant_credentials_table | add_tenant_credentials_table | MATCH |
| 20260711000002 | remove_tenant_credentials_password | remove_tenant_credentials_password | MATCH |
| 20260711000003 | f33_members_foundation | f33_members_foundation | MATCH |
| 20260711000004 | f33_members_search_rpc | f33_members_search_rpc | MATCH |
| 20260711000005 | f33_members_guardrails | f33_members_guardrails | MATCH |
| 20260711000006 | f33_invite_rate_limit_tenant | f33_invite_rate_limit_tenant | MATCH |
| 20260711000007 | f33_members_status_activation | f33_members_status_activation | MATCH |
| 20260711000008 | fix_rate_limit_logs_action_check | fix_rate_limit_logs_action_check | MATCH |
| 20260711000009 | fix_tenant_delete_cascade_guardrail | fix_tenant_delete_cascade_guardrail | MATCH |
| 20260711000010 | fix_invite_seat_limit_and_plan_sync | fix_invite_seat_limit_and_plan_sync | MATCH |
| 20260711000011 | fix_edge_functions_auth_query | fix_edge_functions_auth_query | MATCH |
| 20260712000001 | fix_remove_tenant_member_rpc | fix_remove_tenant_member_rpc | MATCH |
| 20260712000002 | fix_update_tenant_member_role_rpc | fix_update_tenant_member_role_rpc | MATCH |
| 20260712000003 | fix_toggle_tenant_member_active_rpc | fix_toggle_tenant_member_active_rpc | MATCH |
| 20260712000004 | fix_remove_system_admin_security_definer | fix_remove_system_admin_security_definer | MATCH |
| 20260712000005 | fix_guardrail_trigger_status_active_filter | fix_guardrail_trigger_status_active_filter | MATCH |
| 20260712000006 | add_soft_delete_columns | add_soft_delete_columns | MATCH |
| 20260712000007 | add_rls_policies_tenant_memberships | add_rls_policies_tenant_memberships | MATCH |
| 20260712000008 | add_audit_log_triggers | add_audit_log_triggers | MATCH |
| 20260712000009 | add_advisory_lock_function | add_advisory_lock_function | MATCH |
| 20260712000010 | fix_get_tenant_usage_summary_tenant_admin | fix_get_tenant_usage_summary_tenant_admin | MATCH |
| 20260712000011 | fix_is_system_admin_service_role | fix_is_system_admin_service_role | MATCH |
| 20260712000012 | add_system_admin_for_edge | add_system_admin_for_edge | MATCH |
| 20260712000013 | add_viewer_role | add_viewer_role | MATCH |
| 20260712101730 | sp3_4_usage_metering | sp3_4_usage_metering | MATCH |
| 20260712140000 | sp1_4_missing_rls_policies | sp1_4_missing_rls_policies | MATCH |
| 20260713000001 | standardize_tenants_and_memberships | standardize_tenants_and_memberships | MATCH |
| 20260713000003 | create_rls_helper_functions | create_rls_helper_functions | MATCH |
| 20260713000004 | create_user_tracking_triggers | create_user_tracking_triggers | MATCH |
| 20260713000005 | enable_rls_tenants | enable_rls_tenants | MATCH |
| 20260713000006 | enable_rls_tenant_scoped_tables | enable_rls_tenant_scoped_tables | MATCH |
| 20260713000007 | create_user_tracking_triggers | create_user_tracking_triggers | MATCH |
| 20260713000008 | update_billing_schema | update_billing_schema | MATCH |
| 20260713000009 | create_plan_features | create_plan_features | MATCH |
| 20260713000010 | add_role_enum | add_role_enum | MATCH |
| 20260713000011 | create_invitations_table | create_invitations_table | MATCH |
| 20260713053550 |  | sp1_6_expand_audit_log_event_types | PRODUCTION ONLY |
| 20260713053608 |  | sp2_4_announcement_audience_active_range | PRODUCTION ONLY |
| 20260713053615 |  | sp_7_2_custom_domain_verification | PRODUCTION ONLY |
| 20260713053622 |  | sp2_6_global_config_rpc | PRODUCTION ONLY |
| 20260713053644 |  | sp_7_3_licenses | PRODUCTION ONLY |
| 20260713053657 |  | sp2_7_user_management_rpc | PRODUCTION ONLY |
| 20260713053746 |  | sp2_8_role_management_rpc | PRODUCTION ONLY |
| 20260713053807 |  | sp3_1_plans_crud_features | PRODUCTION ONLY |
| 20260713053828 |  | sp5_6_db_maintenance | PRODUCTION ONLY |
| 20260714000001 | accept_invitation_rpc | accept_invitation_rpc | MATCH |
| 20260715000001 | create_audit_log_table | create_audit_log_table | MATCH |
| 20260715000002 | create_audit_triggers | create_audit_triggers | MATCH |
| 20260715000003 | admin_security_settings | admin_security_settings | MATCH |
| 20260715000004 | login_audit_triggers | login_audit_triggers | MATCH |
| 20260715000005 | install_pgtap | install_pgtap | MATCH |
| 20260715000006 | fix_handle_new_user_create_subscription | fix_handle_new_user_create_subscription | MATCH |
| 20260715000007 | fix_audit_log_trigger_tenant_id | fix_audit_log_trigger_tenant_id | MATCH |
| 20260715000008 | fix_audit_log_trigger_tenant_id_v2 | fix_audit_log_trigger_tenant_id_v2 | MATCH |
| 20260715000009 | fix_tenant_memberships_audit_action | fix_tenant_memberships_audit_action | MATCH |
| 20260715000010 | fix_rls_helpers_enum_compare | fix_rls_helpers_enum_compare | MATCH |
| 20260715000011 | fix_audit_log_trigger_tenant_delete | fix_audit_log_trigger_tenant_delete | MATCH |
| 20260716000000 | admin_realtime_broadcast | admin_realtime_broadcast | MATCH |
| 20260716000001 | admin_cron_jobs | admin_cron_jobs | MATCH |
| 20260716000002 | gdpr_export_functions | gdpr_export_functions | MATCH |
| 20260717000000 | fix_admin_tenant_rpc_signatures | fix_admin_tenant_rpc_signatures | MATCH |
| 20260718000000 | phase6_3_support_ticket_sla | phase6_3_support_ticket_sla | MATCH |
| 20260718000001 | sp_7_1_set_tenant_subdomain |  | LOCAL ONLY |
| 20260718000002 | sp1_6_expand_audit_log_event_types |  | LOCAL ONLY |
| 20260719000000 | sp2_4_announcement_audience_active_range |  | LOCAL ONLY |
| 20260719000001 | sp_7_2_custom_domain_verification |  | LOCAL ONLY |
| 20260720000000 | sp2_6_global_config_rpc |  | LOCAL ONLY |
| 20260720000001 | sp_7_3_licenses |  | LOCAL ONLY |
| 20260721000000 | sp2_7_user_management_rpc |  | LOCAL ONLY |
| 20260722000000 | sp2_8_role_management_rpc |  | LOCAL ONLY |
| 20260723000000 | sp3_1_plans_crud_features |  | LOCAL ONLY |
| 20260723000001 | g1_add_max_storage_gb_to_tenant_subscriptions |  | LOCAL ONLY |
| 20260728000000 | sp5_6_db_maintenance |  | LOCAL ONLY |

## Drift Analysis

### Local-Only Migrations

These migrations are in the repository but not applied to production. Nine of them are re-timestamped counterparts of production migrations; two (`sp_7_1_set_tenant_subdomain`, `g1_add_max_storage_gb_to_tenant_subscriptions`) are genuinely new repository migrations.

| Local Version | Local Name | Production Counterpart | Probable Cause | Confidence | Deployment Risk | Blocks Deployment |
| --- | --- | --- | --- | --- | --- | --- |
| 20260718000001 | sp_7_1_set_tenant_subdomain | — | New migration in the repository, not yet applied to production. | High | High | Yes |
| 20260718000002 | sp1_6_expand_audit_log_event_types | 20260713053550 | Migration re-timestamped in the repository compared to the production-applied version. | High | High | Yes |
| 20260719000000 | sp2_4_announcement_audience_active_range | 20260713053608 | Migration re-timestamped in the repository compared to the production-applied version. | High | High | Yes |
| 20260719000001 | sp_7_2_custom_domain_verification | 20260713053615 | Migration re-timestamped in the repository compared to the production-applied version. | High | High | Yes |
| 20260720000000 | sp2_6_global_config_rpc | 20260713053622 | Migration re-timestamped in the repository compared to the production-applied version. | High | High | Yes |
| 20260720000001 | sp_7_3_licenses | 20260713053644 | Migration re-timestamped in the repository compared to the production-applied version. | High | High | Yes |
| 20260721000000 | sp2_7_user_management_rpc | 20260713053657 | Migration re-timestamped in the repository compared to the production-applied version. | High | High | Yes |
| 20260722000000 | sp2_8_role_management_rpc | 20260713053746 | Migration re-timestamped in the repository compared to the production-applied version. | High | High | Yes |
| 20260723000000 | sp3_1_plans_crud_features | 20260713053807 | Migration re-timestamped in the repository compared to the production-applied version. | High | High | Yes |
| 20260723000001 | g1_add_max_storage_gb_to_tenant_subscriptions | — | New migration in the repository, not yet applied to production. | High | High | Yes |
| 20260728000000 | sp5_6_db_maintenance | 20260713053828 | Migration re-timestamped in the repository compared to the production-applied version. | High | High | Yes |

### Production-Only Migrations

These migrations are applied in production but absent from the local `supabase/migrations` directory. Each one corresponds to a local migration that uses the same name but a later `version` timestamp, which means the files were re-timestamped/renamed in the repository.

| Production Version | Production Name | Local Counterpart | Probable Cause | Confidence | Deployment Risk | Blocks Deployment |
| --- | --- | --- | --- | --- | --- | --- |
| 20260713053550 | sp1_6_expand_audit_log_event_types | 20260718000002 | Original timestamp of a migration that was re-timestamped in the repository. | High | High | Yes |
| 20260713053608 | sp2_4_announcement_audience_active_range | 20260719000000 | Original timestamp of a migration that was re-timestamped in the repository. | High | High | Yes |
| 20260713053615 | sp_7_2_custom_domain_verification | 20260719000001 | Original timestamp of a migration that was re-timestamped in the repository. | High | High | Yes |
| 20260713053622 | sp2_6_global_config_rpc | 20260720000000 | Original timestamp of a migration that was re-timestamped in the repository. | High | High | Yes |
| 20260713053644 | sp_7_3_licenses | 20260720000001 | Original timestamp of a migration that was re-timestamped in the repository. | High | High | Yes |
| 20260713053657 | sp2_7_user_management_rpc | 20260721000000 | Original timestamp of a migration that was re-timestamped in the repository. | High | High | Yes |
| 20260713053746 | sp2_8_role_management_rpc | 20260722000000 | Original timestamp of a migration that was re-timestamped in the repository. | High | High | Yes |
| 20260713053807 | sp3_1_plans_crud_features | 20260723000000 | Original timestamp of a migration that was re-timestamped in the repository. | High | High | Yes |
| 20260713053828 | sp5_6_db_maintenance | 20260728000000 | Original timestamp of a migration that was re-timestamped in the repository. | High | High | Yes |

## Repository Analysis

- **Directory inspected:** `supabase/migrations`
- **Canonical files:** 138
- **Malformed / non-conforming filenames:** 0
- **Duplicate timestamps:** 0 (none detected)
- **Latest file:** `20260728000000`
- **Timestamp gaps in local sequence:** 31
  - 20250703000000 -> 20250704000000
  - 20250704000007 -> 20250705000000
  - 20250705000010 -> 20250705000015
  - 20250705000017 -> 20250706000000
  - 20250706000012 -> 20250707000000
  - 20250707000008 -> 20250708000000
  - 20250708000011 -> 20250708000013
  - 20250708000014 -> 20250709000000
  - 20250709000001 -> 20250711000001
  - 20250711000002 -> 20250713000022
  - 20250713000022 -> 20260708000000
  - 20260708000004 -> 20260709000000
  - 20260709000001 -> 20260710000001
  - 20260710000002 -> 20260710064509
  - 20260710064509 -> 20260711000001
  - 20260711000011 -> 20260712000001
  - 20260712000013 -> 20260712101730
  - 20260712101730 -> 20260712140000
  - 20260712140000 -> 20260713000001
  - 20260713000001 -> 20260713000003
  - 20260713000011 -> 20260714000001
  - 20260714000001 -> 20260715000001
  - 20260715000011 -> 20260716000000
  - 20260716000002 -> 20260717000000
  - 20260717000000 -> 20260718000000
  - 20260718000002 -> 20260719000000
  - 20260719000001 -> 20260720000000
  - 20260720000001 -> 20260721000000
  - 20260721000000 -> 20260722000000
  - 20260722000000 -> 20260723000000
  - 20260723000001 -> 20260728000000

## Production Analysis

- **Project:** QLBH (`rsialbfjswnrkzcxarnj`)
- **Applied migrations:** 136
- **Latest applied:** `20260718000000` (`phase6_3_support_ticket_sla`)
- **Timestamp gaps in applied sequence:** 34
  - 20250703000000 -> 20250704000000
  - 20250704000007 -> 20250705000000
  - 20250705000010 -> 20250705000015
  - 20250705000017 -> 20250706000000
  - 20250706000012 -> 20250707000000
  - 20250707000008 -> 20250708000000
  - 20250708000011 -> 20250708000013
  - 20250708000014 -> 20250709000000
  - 20250709000001 -> 20250711000001
  - 20250711000002 -> 20250713000022
  - 20250713000022 -> 20260708000000
  - 20260708000004 -> 20260709000000
  - 20260709000001 -> 20260710000001
  - 20260710000002 -> 20260710064509
  - 20260710064509 -> 20260711000001
  - 20260711000011 -> 20260712000001
  - 20260712000013 -> 20260712101730
  - 20260712101730 -> 20260712140000
  - 20260712140000 -> 20260713000001
  - 20260713000001 -> 20260713000003
  - 20260713000011 -> 20260713053550
  - 20260713053550 -> 20260713053608
  - 20260713053608 -> 20260713053615
  - 20260713053615 -> 20260713053622
  - 20260713053622 -> 20260713053644
  - 20260713053644 -> 20260713053657
  - 20260713053657 -> 20260713053746
  - 20260713053746 -> 20260713053807
  - 20260713053807 -> 20260713053828
  - 20260713053828 -> 20260714000001
  - 20260714000001 -> 20260715000001
  - 20260715000011 -> 20260716000000
  - 20260716000002 -> 20260717000000
  - 20260717000000 -> 20260718000000
- **Orphaned migrations:** none detected (all applied versions exist in the migration table).
- **Repeated migration name:** `create_user_tracking_triggers` is present at both `20260713000004` and `20260713000007`; the versions are different but the same DDL intent was applied twice. This is consistent with iterative fixes.

## Root Cause Assessment

The drift is best explained by **renamed / re-timestamped migration files combined with incomplete synchronization**:

1. **Nine migration names appear in both the repository and production, but with different `version` timestamps.** In production these names are applied with timestamps around `20260713053550`–`20260713053828`. In the repository the same names are re-timestamped to `20260718000001`–`20260728000000`. This is strong evidence that the migration files were renamed/renumbered or the repository was reconstructed with new timestamps.
2. **Production still contains the original versions** of these migrations (`20260713053550` etc.), which are reported as `PRODUCTION ONLY` in the matrix. They were applied in production but are absent from the current repository.
3. **The repository contains two genuinely new migrations not yet applied to production:** `sp_7_1_set_tenant_subdomain` and `g1_add_max_storage_gb_to_tenant_subscriptions`.
4. **Both sides share identical gaps** in the `20250705000011-14` and `20250708000012` ranges, suggesting these numbers were deliberately skipped or removed from both the repository and the production history (consistent with a migration squash or renumbering).
5. **No version collisions were detected** in the canonical `supabase/migrations` set; all overlapping versions have identical names. The name `create_user_tracking_triggers` appears at two different production versions (`20260713000004` and `20260713000007`), indicating iterative fixes.
6. **The non-canonical `supabase/migration_*.sql` files outside `supabase/migrations`** are likely historical artifacts or manual scripts and are not the source of the applied `schema_migrations` drift.

Confidence in this root cause: **High**.

## Risk Assessment

**Overall deployment risk:** **HIGH**

- **Impact:** Deploying from the current repository would not reflect the current production schema. The 9 production-only migrations may have already created objects that the repository will try to create again, causing name collisions; conversely, the 11 local-only migrations (including 2 new names) may depend on or overwrite objects whose state is not known in production. Either path can fail or corrupt the production schema.
- **Likelihood:** High. The repository and production have divergent migration histories caused by re-timestamped files.
- **Recommended remediation:** Do not deploy until the repository is brought into sync with production and the source of each production-only migration is verified.

## Remediation Plan

**Recommended remediation:** **governance review required**.

A governance review must be held before any migration replay or repository synchronization, because the origin of the mismatched migrations (renamed/re-timestamped files plus the two new local migrations) is not yet verified and the deployment program has an explicit freeze until the drift is understood. The review should:

1. Confirm whether the production-only migrations were created in a feature branch, applied manually, or generated by a CI/CD or `supabase db push` workflow.
2. Decide whether to backfill the missing migrations into `supabase/migrations` (repository synchronization) or to rebuild the repository from the production schema (repository reconstruction / migration recovery).
3. Resolve the 17 non-canonical `supabase/migration_*.sql` files—either archive, rename, or reformat them into the canonical `supabase/migrations` convention.
4. Authorise a re-baseline of the migration history once the repository matches production, and only then lift the deployment freeze.

No remediation should be performed until the governance review approves the chosen path.

## Final Decision

```text
Migration Drift:
UNDERSTOOD
```

**Justification:** The complete local and production migration histories have been collected and compared. The cause of the drift is identified: the repository and production share the same migration names but divergent `version` timestamps, with 9 original versions applied only in production and 11 re-timestamped/new versions present only in the repository. No version collisions or orphaned migrations were found in the canonical set.

## Next Step

**The Production Deployment Program must NOT proceed until migration reconciliation is completed.** A governance review is required to authorise the repository synchronization (or reconstruction) and to verify the origin of the production-only migrations before any further deployment work.
