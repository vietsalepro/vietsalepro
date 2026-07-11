# Admin Dashboard — RPC Contracts

Tài liệu này liệt kê các Supabase RPC functions được gọi bởi admin dashboard và các service phía sau nó.

> ponytail: Chỉ bao gồm các RPC thực sự xuất hiện trong `services/` dưới dạng `supabase.rpc(...)`. Các thao tác đọc/ghi bảng thông thường (ví dụ `bank_accounts`, `app_audit_log` qua `.from(...)`) không nằm trong danh sách này.

## Tổng quan

| RPC | Mục đích | Tham số chính | Trả về | File/service sử dụng |
|-----|----------|---------------|--------|----------------------|
| `is_system_admin` | Kiểm tra user hiện tại có phải system admin | — | `boolean` | `services/admin/permissions.ts`, `services/tenantService.ts` |
| `has_tenant_role` | Kiểm tra role của user trên một tenant | `p_tenant_id`, `p_role` | `boolean` | `services/admin/permissions.ts` |
| `get_tenants_admin` | Lấy danh sách tenants (admin) | `p_page`, `p_limit`, `p_search` | `{ items: Tenant[], total: number }` | `services/tenantService.ts` |
| `search_tenants` | Tìm kiếm tenants | `p_search_term`, `p_status`, `p_plan`, `p_page`, `p_page_size` | `SearchTenantsResult` | `services/tenantService.ts` |
| `create_tenant_with_admin` | Tạo tenant + admin | `p_name`, `p_subdomain`, `p_plan`, `p_owner_id` | `Tenant` | `services/tenantService.ts` |
| `update_tenant` | Cập nhật tenant | `p_tenant_id`, `p_name`, `p_plan`, `p_status`, ... | `Tenant` | `services/tenantService.ts` |
| `delete_tenant_safe` | Lưu trữ (soft-delete) tenant | `p_tenant_id` | `Tenant` | `services/tenantService.ts` |
| `get_current_user_tenants` | Lấy tenants của user hiện tại | — | `Tenant[]` | `services/tenantService.ts` |
| `get_tenant_usage_summary` | Tổng hợp usage của tenant | `p_tenant_id` | `UsageSummary` | `services/tenantService.ts` |
| `admin_update_subscription` | Cập nhật subscription (admin) | `p_tenant_id`, `p_plan`, `p_max_users`, ... | `TenantSubscription` | `services/tenantService.ts` |
| `update_tenant_subscription` | Cập nhật subscription | `p_tenant_id`, `p_plan`, `p_max_users`, ... | `TenantSubscription` | `services/tenantService.ts` |
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

## Ghi chú

- Các RPC trong `services/tenantService.ts` được re-export qua `services/admin/tenantAdminService.ts` và `services/admin/memberAdminService.ts` để admin dashboard sử dụng.
- `services/auditService.ts` hiện đọc `app_audit_log` qua `.from(...).select(...)` thay vì gọi RPC `get_audit_logs`.
- `services/bankAccountService.ts` hiện đọc/ghi `bank_accounts` và `system_settings` qua `.from(...)` thay vì RPC `get_bank_accounts`.
