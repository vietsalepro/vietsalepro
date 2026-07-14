# Admin Dashboard — RPC Contracts

Tài liệu này liệt kê các Supabase RPC functions được gọi bởi admin dashboard và các service phía sau nó.

> ponytail: Chỉ bao gồm các RPC thực sự xuất hiện trong `services/` dưới dạng `supabase.rpc(...)`. Các thao tác đọc/ghi bảng thông thường (ví dụ `bank_accounts`, `app_audit_log` qua `.from(...)`) không nằm trong danh sách này.

## Tổng quan

| RPC | Mục đích | Tham số chính | Trả về | File/service sử dụng |
|-----|----------|---------------|--------|----------------------|
| `is_system_admin` | Kiểm tra user hiện tại có phải system admin | — | `boolean` | `services/admin/permissions.ts`, `services/tenantService.ts` |
| `has_tenant_role` | Kiểm tra role của user trên một tenant | `p_tenant_id`, `p_role` | `boolean` | `services/admin/permissions.ts` |
| `get_tenants_admin` | Lấy danh sách tenants (admin) | `p_page`, `p_limit`, `p_search`, `p_status`, `p_plan`, `p_sort_by`, `p_sort_order` | `{ items: Tenant[], total: number }` | `services/tenantService.ts` |
| `search_tenants` | Tìm kiếm tenants | `p_search_term`, `p_status`, `p_plan`, `p_page`, `p_page_size` | `SearchTenantsResult` | `services/tenantService.ts` |
| `create_tenant_with_admin` | Tạo tenant + admin | `p_name`, `p_subdomain`, `p_plan`, `p_owner_id` | `Tenant` | `services/tenantService.ts` |
| `update_tenant` | Cập nhật tenant | `p_tenant_id`, `p_name`, `p_plan`, `p_status`, ... | `Tenant` | `services/tenantService.ts` |
| `delete_tenant_safe` | Lưu trữ (soft-delete) tenant | `p_tenant_id` | `Tenant` | `services/tenantService.ts` |
| `get_current_user_tenants` | Lấy tenants của user hiện tại | — | `Tenant[]` | `services/tenantService.ts` |
| `get_tenant_usage_summary` | Tổng hợp usage của tenant | `p_tenant_id` | `UsageSummary` | `services/tenantService.ts` |
| `update_tenant_subscription` | Cập nhật subscription | `p_tenant_id`, `p_plan`, `p_max_users`, `p_max_products`, `p_max_orders_per_month`, `p_max_storage_gb`, `p_billing_status`, `p_expires_at` | `TenantSubscription` | `services/tenantService.ts` |
| `reset_monthly_order_counter` | Reset counter đơn hàng tháng | `p_tenant_id` | `TenantSubscription` | `services/tenantService.ts` |
| `get_tenant_feature_flags` | Lấy feature flags | `p_tenant_id` | `TenantFeatureFlags` | `services/tenantService.ts` |
| `update_tenant_feature_flags` | Cập nhật feature flags | `p_tenant_id`, `p_features` | `TenantFeatureFlags` | `services/tenantService.ts` |
| `get_tenant_members_with_email` | Lấy members kèm email | `p_tenant_id` | `MemberWithEmail[]` | `services/tenantService.ts` |
| `search_tenant_members` | Tìm members trong tenant | `p_tenant_id`, `p_search`, `p_role`, `p_status`, `p_page`, `p_page_size` | `SearchMembersResult` | `services/tenantService.ts` |
| `search_members_by_email` | Tìm members theo email | `p_tenant_id`, `p_query`, `p_page`, `p_page_size` | `SearchMembersResult` | `services/tenantService.ts` |
| `get_member_with_email` | Lấy một member kèm email | `p_tenant_id`, `p_user_id` | `MemberWithEmail` | `services/tenantService.ts` |
| `update_tenant_member_role` | Cập nhật role member | `p_tenant_id`, `p_user_id`, `p_role` | `TenantMembership` | `services/tenantService.ts` |
| `toggle_tenant_member_active` | Bật/tắt trạng thái member | `p_tenant_id`, `p_user_id`, `p_is_active` | `TenantMembership` | `services/tenantService.ts` |
| `remove_tenant_member` | Xóa member khỏi tenant | `p_tenant_id`, `p_user_id` | — | `services/tenantService.ts` |
| `get_storage_usage` | Lấy thông tin storage | `p_tenant_id` | `StorageUsage` | `services/tenantService.ts` |
| `get_system_overview` | Tổng quan hệ thống | — | `SystemOverview` | `services/tenantService.ts` |
| `get_top_tenants` | Top tenants theo usage | `p_limit`, `p_offset` | `{ data: TopTenant[], count: number }` | `services/tenantService.ts` |
| `get_tenant_growth` | Tăng trưởng tenants theo tháng | `p_months` | `TenantGrowthPoint[]` | `services/tenantService.ts` |
| `get_rate_limit_logs` | Lấy rate-limit logs | `p_limit`, `p_offset` | `{ data: RateLimitLog[], count: number }` | `services/systemAdminService.ts` |
| `get_system_admins` | Lấy danh sách system admins | — | `SystemAdmin[]` | `services/systemAdminService.ts` |
| `add_system_admin` | Thêm system admin | `p_user_id` | `SystemAdmin` | `services/systemAdminService.ts` |
| `remove_system_admin` | Xóa system admin | `p_user_id` | — | `services/systemAdminService.ts` |
| `record_admin_login` | Ghi lại lần đăng nhập admin | `p_user_id`, `p_email`, `p_ip_address`, `p_user_agent`, `p_status`, `p_failure_reason` | `string | null` | `services/loginHistoryService.ts` |
| `get_admin_login_history` | Lịch sử đăng nhập admin | `p_limit`, `p_offset`, `p_status`, `p_date_from`, `p_date_to` | `{ data: AdminLoginHistoryEntry[], count: number }` | `services/loginHistoryService.ts` |
| `get_admin_login_alerts` | Cảnh báo đăng nhập bất thường | `p_hours_ago` | `AdminLoginAlert[]` | `services/loginHistoryService.ts` |
| `get_data_retention_status` | Trạng thái lưu trữ dữ liệu | — | `DataRetentionStatus` | `services/operationsService.ts` |
| `get_default_plan_limits` | Lấy giới hạn plan mặc định | — | `DefaultPlanLimits` | `services/operationsService.ts` |
| `set_default_plan_limits` | Cập nhật giới hạn plan | `p_plan`, `p_max_users`, `p_max_products`, ... | `PlanLimits` | `services/operationsService.ts` |
| `get_maintenance_mode` | Lấy trạng thái maintenance | — | `MaintenanceMode` | `services/operationsService.ts` |
| `set_maintenance_mode` | Bật/tắt maintenance | `p_enabled`, `p_message` | `MaintenanceMode` | `services/operationsService.ts` |
| `generate_2fa_backup_codes` | Sinh backup codes 2FA | `p_user_id`, `p_count` | `{ codes: string[] }` | `services/twoFactorService.ts` |
| `list_2fa_backup_codes` | Liệt kê backup codes | `p_user_id` | `number` | `services/twoFactorService.ts` |
| `verify_2fa_backup_code` | Xác thực backup code | `p_user_id`, `p_code` | `boolean` | `services/twoFactorService.ts` |
| `is_2fa_enabled` | Kiểm tra 2FA đã bật | `p_user_id` | `boolean` | `services/twoFactorService.ts` |
| `delete_2fa_backup_codes` | Xóa backup codes | `p_user_id` | — | `services/twoFactorService.ts` |
| `reset_demo_data` | Reset dữ liệu demo | `p_tenant_id` | `ResetDemoResult` | `services/tenantMigrationService.ts` |
| `migrate_tenant_data` | Migrate dữ liệu giữa tenants | `p_source_tenant_id`, `p_target_tenant_id` | `MigrateTenantResult` | `services/tenantMigrationService.ts` |
| `is_tenant_owner` | Kiểm tra user hiện tại có phải owner của tenant | `p_tenant_id` | `boolean` | `lib/permissions.ts` |
| `can_use_feature` | Kiểm tra tenant có thể dùng một feature | `p_tenant_id`, `p_feature_key`, `p_current_usage` | `boolean` | `lib/permissions.ts` |
| `get_tenant_security_settings` | Lấy cấu hình bảo mật tenant | `p_tenant_id` | `SecuritySettings` | `services/systemAdminService.ts` |
| `update_tenant_ip_allowlist` | Cập nhật IP allowlist tenant | `p_tenant_id`, `p_allowed_ips` | `void` | `services/systemAdminService.ts` |
| `update_tenant_session_timeout` | Cập nhật thời gian timeout session | `p_tenant_id`, `p_minutes` | `void` | `services/systemAdminService.ts` |
| `record_login_attempt` | Ghi nhận lần đăng nhập | `p_email`, `p_ip_address`, `p_success` | `string \| null` | `services/systemAdminService.ts` |
| `get_login_attempts` | Lấy lịch sử đăng nhập | `p_email?`, `p_limit`, `p_offset` | `{ data, count }` | `services/systemAdminService.ts` |
| `get_locked_emails` | Lấy email bị khóa | — | `LockedEmail[]` | `services/systemAdminService.ts` |
| `unlock_login_attempts` | Mở khóa đăng nhập cho email | `p_email` | `void` | `services/systemAdminService.ts` |
| `get_gdpr_requests` | Lấy danh sách yêu cầu GDPR | `p_status?`, `p_type?`, `p_limit`, `p_offset` | `{ data, count }` | `services/admin/complianceAdminService.ts` |
| `create_gdpr_request` | Tạo yêu cầu GDPR | `p_user_id`, `p_type`, `p_reason?`, `p_dry_run` | `string` | `services/admin/complianceAdminService.ts` |
| `gdpr_export_user_data` | Xuất dữ liệu GDPR của user | `p_user_id` | `GdprExportData` | `services/admin/complianceAdminService.ts` |
| `gdpr_delete_user_data` | Xóa dữ liệu GDPR của user | `p_user_id`, `p_dry_run` | `GdprDeleteResult` | `services/admin/complianceAdminService.ts` |
| `get_revenue_metrics` | Lấy revenue metrics | `p_start_date?`, `p_end_date?` | `RevenueMetrics` | `services/admin/analyticsAdminService.ts` |
| `get_churn_cohort_metrics` | Lấy churn & cohort metrics | `p_start_date?`, `p_end_date?`, `p_cohort_months?` | `ChurnCohortMetrics` | `services/admin/analyticsAdminService.ts` |
| `lookup_invitation` | Tra cứu lời mời theo token | `p_token` | `{...}[]` | `services/admin/memberAdminService.ts` |
| `accept_invitation` | Chấp nhận lời mời | `p_token` | `TenantMembership` | `services/admin/memberAdminService.ts` |
| `create_invoice` | Tạo hóa đơn | (theo `InvoiceInput`) | `Invoice` | `services/invoiceService.ts` |
| `confirm_payment` | Xác nhận thanh toán | (theo `PaymentInput`) | `Payment` | `services/invoiceService.ts` |
| `list_tenant_webhooks` | Lấy webhooks của tenant | `p_tenant_id` | `TenantWebhook[]` | `services/webhookService.ts` |
| `create_tenant_webhook` | Tạo webhook | `p_tenant_id`, `p_name`, `p_url`, `p_events`, `p_secret?` | `TenantWebhook` | `services/webhookService.ts` |
| `update_tenant_webhook` | Cập nhật webhook | `p_webhook_id`, ... | `TenantWebhook` | `services/webhookService.ts` |
| `delete_tenant_webhook` | Xóa webhook | `p_webhook_id` | `void` | `services/webhookService.ts` |
| `list_webhook_deliveries` | Lấy lịch sử giao hàng webhook | `p_tenant_id`, `p_limit`, `p_offset` | `{ data, count }` | `services/webhookService.ts` |
| `trigger_webhook_event` | Kích hoạt webhook event | `p_tenant_id`, `p_event_type`, `p_payload` | `WebhookDelivery` | `services/webhookService.ts` |
| `retry_webhook_delivery` | Retry giao hàng webhook | `p_delivery_id` | `WebhookDelivery` | `services/webhookService.ts` |

## Ghi chú

- Các RPC trong `services/tenantService.ts` được re-export qua `services/admin/tenantAdminService.ts` và `services/admin/memberAdminService.ts` để admin dashboard sử dụng.
- `services/auditService.ts` hiện đọc `app_audit_log` qua `.from(...).select(...)` thay vì gọi RPC `get_audit_logs`.
- `services/bankAccountService.ts` hiện đọc/ghi `bank_accounts` và `system_settings` qua `.from(...)` thay vì RPC `get_bank_accounts`.
- `services/supabaseService.ts` chứa các RPC của ứng dụng POS chính, không nằm trong phạm vi admin dashboard nên không liệt kê ở đây.

---

## Phụ lục — Danh sách đầy đủ các RPC từ mã nguồn

Bảng dưới đây được sinh tự động từ các file `services/**/*.ts` (trừ `services/supabaseService.ts`) và `lib/**/*.ts`. Dùng để đối chiếu với bảng chính ở trên.

| RPC | File/service sử dụng |
|-----|----------------------|
| `accept_invitation` | `services/admin/memberAdminService.ts` |
| `add_system_admin` | `services/systemAdminService.ts` |
| `apply_voucher_to_invoice` | `services/promotionService.ts` |
| `bulk_update_tenants` | `services/maintenanceService.ts` |
| `can_use_feature` | `lib/permissions.ts` |
| `claim_heavy_op_job` | `services/heavyOpsQueueService.ts` |
| `complete_heavy_op_job` | `services/heavyOpsQueueService.ts` |
| `confirm_payment` | `services/invoiceService.ts` |
| `create_gdpr_request` | `services/admin/complianceAdminService.ts` |
| `create_integration` | `services/integrationService.ts` |
| `create_invoice` | `services/invoiceService.ts` |
| `create_maintenance_window` | `services/maintenanceService.ts` |
| `create_partner` | `services/integrationService.ts` |
| `create_plan` | `services/planService.ts` |
| `create_tenant_api_key` | `services/apiKeyService.ts` |
| `create_tenant_webhook` | `services/webhookService.ts` |
| `create_tenant_with_admin` | `services/tenantService.ts` |
| `delete_2fa_backup_codes` | `services/twoFactorService.ts` |
| `delete_integration` | `services/integrationService.ts` |
| `delete_maintenance_window` | `services/maintenanceService.ts` |
| `delete_partner` | `services/integrationService.ts` |
| `delete_plan` | `services/planService.ts` |
| `delete_tenant_safe` | `services/tenantService.ts` |
| `delete_tenant_webhook` | `services/webhookService.ts` |
| `enqueue_heavy_op_job` | `services/heavyOpsQueueService.ts` |
| `export_tenant_data` | `services/complianceService.ts` |
| `gdpr_delete_user_data` | `services/admin/complianceAdminService.ts` |
| `gdpr_export_user_data` | `services/admin/complianceAdminService.ts` |
| `generate_2fa_backup_codes` | `services/twoFactorService.ts` |
| `generate_tenant_license` | `services/admin/licenseService.ts` |
| `get_admin_login_alerts` | `services/loginHistoryService.ts` |
| `get_admin_login_history` | `services/loginHistoryService.ts` |
| `get_billing_automation_status` | `services/billingAutomationService.ts` |
| `get_billing_job_logs` | `services/billingAutomationService.ts` |
| `get_billing_reminder_config` | `services/billingReminderService.ts` |
| `get_churn_cohort_metrics` | `services/admin/analyticsAdminService.ts` |
| `get_connection_pool_stats` | `services/heavyOpsQueueService.ts` |
| `get_current_announcements_for_tenant` | `services/announcementService.ts` |
| `get_current_user_tenants` | `services/tenantService.ts` |
| `get_data_retention_config` | `services/fraudRetentionService.ts` |
| `get_data_retention_status` | `services/operationsService.ts` |
| `get_default_plan_limits` | `services/operationsService.ts` |
| `get_fraud_detection_config` | `services/fraudRetentionService.ts` |
| `get_fraud_queue` | `services/fraudRetentionService.ts` |
| `get_fraud_stats` | `services/fraudRetentionService.ts` |
| `get_gdpr_requests` | `services/admin/complianceAdminService.ts` |
| `get_heavy_op_jobs` | `services/heavyOpsQueueService.ts` |
| `get_in_app_messages_for_tenant` | `services/notificationService.ts` |
| `get_locked_emails` | `services/systemAdminService.ts` |
| `get_login_attempts` | `services/systemAdminService.ts` |
| `get_maintenance_mode` | `services/operationsService.ts` |
| `get_maintenance_windows` | `services/maintenanceService.ts` |
| `get_member_with_email` | `services/tenantService.ts` |
| `get_pending_billing_reminders` | `services/billingReminderService.ts` |
| `get_plan_by_key` | `services/planService.ts` |
| `get_plans` | `services/planService.ts` |
| `get_promo_code_usage_counts` | `services/promotionService.ts` |
| `get_rate_limit_logs` | `services/systemAdminService.ts` |
| `get_read_replica_status` | `services/heavyOpsQueueService.ts` |
| `get_revenue_metrics` | `services/admin/analyticsAdminService.ts` |
| `get_storage_usage` | `services/tenantService.ts` |
| `get_system_admins` | `services/systemAdminService.ts` |
| `get_system_overview` | `services/tenantService.ts` |
| `get_tenant_by_domain` | `lib/tenant.ts` |
| `get_tenant_by_subdomain` | `lib/tenant.ts` |
| `get_tenant_feature_flags` | `services/tenantService.ts` |
| `get_tenant_growth` | `services/tenantService.ts` |
| `get_tenant_members_with_email` | `services/tenantService.ts` |
| `get_tenant_security_settings` | `services/systemAdminService.ts` |
| `get_tenant_usage_summary` | `services/admin/memberAdminService.ts` |
| `get_tenants_admin` | `services/tenantService.ts` |
| `get_terms_acceptances` | `services/complianceService.ts` |
| `get_top_tenants` | `services/tenantService.ts` |
| `has_tenant_role` | `lib/permissions.ts` |
| `is_2fa_enabled` | `services/twoFactorService.ts` |
| `is_system_admin` | `services/tenantService.ts` |
| `is_tenant_owner` | `lib/permissions.ts` |
| `list_2fa_backup_codes` | `services/twoFactorService.ts` |
| `list_integrations` | `services/integrationService.ts` |
| `list_partners` | `services/integrationService.ts` |
| `list_tenant_api_keys` | `services/apiKeyService.ts` |
| `list_tenant_webhooks` | `services/webhookService.ts` |
| `list_webhook_deliveries` | `services/webhookService.ts` |
| `lookup_invitation` | `services/admin/memberAdminService.ts` |
| `mark_in_app_message_read` | `services/notificationService.ts` |
| `migrate_tenant_data` | `services/tenantMigrationService.ts` |
| `record_admin_login` | `services/loginHistoryService.ts` |
| `record_login_attempt` | `services/systemAdminService.ts` |
| `record_terms_acceptance` | `services/complianceService.ts` |
| `remove_system_admin` | `services/systemAdminService.ts` |
| `remove_tenant_member` | `services/tenantService.ts` |
| `reset_demo_data` | `services/tenantMigrationService.ts` |
| `reset_monthly_order_counter` | `services/tenantService.ts` |
| `retry_heavy_op_job` | `services/heavyOpsQueueService.ts` |
| `retry_webhook_delivery` | `services/webhookService.ts` |
| `revoke_tenant_api_key` | `services/apiKeyService.ts` |
| `run_data_retention` | `services/fraudRetentionService.ts` |
| `run_fraud_detection` | `services/fraudRetentionService.ts` |
| `search_members_by_email` | `services/tenantService.ts` |
| `search_tenant_members` | `services/tenantService.ts` |
| `search_tenants` | `services/tenantService.ts` |
| `send_billing_reminders` | `services/billingReminderService.ts` |
| `send_in_app_message` | `services/notificationService.ts` |
| `set_billing_reminder_config` | `services/billingReminderService.ts` |
| `set_data_retention_config` | `services/fraudRetentionService.ts` |
| `set_default_plan_limits` | `services/operationsService.ts` |
| `set_fraud_detection_config` | `services/fraudRetentionService.ts` |
| `set_maintenance_mode` | `services/operationsService.ts` |
| `set_tenant_subdomain` | `services/admin/tenantAdminService.ts` |
| `toggle_tenant_member_active` | `services/tenantService.ts` |
| `trigger_webhook_event` | `services/webhookService.ts` |
| `unlock_login_attempts` | `services/systemAdminService.ts` |
| `update_fraud_queue_status` | `services/fraudRetentionService.ts` |
| `update_integration` | `services/integrationService.ts` |
| `update_maintenance_window` | `services/maintenanceService.ts` |
| `update_partner` | `services/integrationService.ts` |
| `update_plan` | `services/planService.ts` |
| `update_tenant` | `services/tenantService.ts` |
| `update_tenant_feature_flags` | `services/tenantService.ts` |
| `update_tenant_ip_allowlist` | `services/systemAdminService.ts` |
| `update_tenant_member_role` | `services/tenantService.ts` |
| `update_tenant_session_timeout` | `services/systemAdminService.ts` |
| `update_tenant_subscription` | `services/tenantService.ts` |
| `update_tenant_webhook` | `services/webhookService.ts` |
| `validate_promo_code` | `services/promotionService.ts` |
| `validate_tenant_license` | `services/admin/licenseService.ts` |
| `verify_2fa_backup_code` | `services/twoFactorService.ts` |
