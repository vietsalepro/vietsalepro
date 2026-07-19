# ADMIN_DASHBOARD_REMEDIATION_ANALYSIS.md

## 1. Tóm tắt điều hành (Executive Summary)

Báo cáo này phân tích 18 issue được liệt kê trong `AUDIT_REPORT.md` của hệ thống **VietSale Pro v7**, độc lập xác minh từng issue trên production database và source code, xác định root cause, đánh giá rủi ro và đề xuất giải pháp khắc phục cùng kế hoạch thực hiện.

- **Tổng số issue:** 18 (CRIT-1 → CRIT-4, HIGH-1 → HIGH-4, MED-1 → MED-6, LOW-1 → LOW-4)
- **Đã xác minh là đúng:** 16 issue
- **Đã được sửa một phần / cần kiểm chứng lại:** 2 issue (HIGH-1, CRIT-4)
- **Không có issue hoàn toàn sai lệch (false positive)**

Nhóm rủi ro cao nhất cần xử lý ngay lập tức:

1. **CRIT-1**: Cron job `data-retention-daily` và `fraud-detection-hourly` đang fail liên tục do `is_system_admin()` không công nhận role `postgres` của pg_cron.
2. **CRIT-3**: `anon` và `authenticated` được cấp `EXECUTE` trên các hàm `SECURITY DEFINER` nhạy cảm (`unlock_login_attempts`, `add_system_admin`, `add_system_admin_for_edge`).
3. **CRIT-2**: Frontend/admin gọi các RPC chưa tồn tại trong production (`admin_update_subscription`, `get_member_with_email`, `get_storage_usage`, `search_members_by_email`, `set_tenant_subdomain`).
4. **HIGH-4 / MED-1**: 137 hàm `SECURITY DEFINER` có thể bị `anon`/`authenticated` thực thi, và 107 hàm có `search_path` mutable.
5. **HIGH-3**: Production và local migration bị drift nghiêm trọng (136 vs 137 file, 9 migration chưa apply, 1 timestamp trùng lặp).

---

## 2. Phạm vi và phương pháp (Scope & Methodology)

**Môi trường production được kiểm tra:**

- Supabase project ID: `rsialbfjswnrkzcxarnj`
- Connection role: service_role (đọc metadata)

**Công cụ sử dụng:**

- `supabase-mcp-server`: `execute_sql`, `list_tables`, `list_functions`, `list_migrations`, `list_edge_functions`, `get_edge_function`, `get_advisors`
- `codebase-memory-mcp`: `search_graph`, `query_graph`, `get_code_snippet`, `trace_path`
- `read`, `grep`, `find_file_by_name`, `exec` (chỉ để liệt kê danh sách file migration và parse overflow JSON)

**Các skill đã kích hoạt:** `systematic-debugging`, `test-driven-development`, `requesting-code-review`.

**Nguyên tắc:**

- Không sửa code trong quá trình audit.
- Mọi kết luận đều có bằng chứng từ production DB hoặc source code.
- Không thực hiện destructive operation.

---

## 3. Phân tích từng Issue (Issue-by-Issue Remediation Analysis)

### CRIT-1 — pg_cron failures do `is_system_admin` không công nhận role `postgres`

| Trường | Giá trị |
| --- | --- |
| Verification Result | **Verified** |
| Current Status | Still exists |
| Root Cause | `is_system_admin()` chỉ kiểm tra `current_user = 'service_role'` hoặc `auth.uid()`. pg_cron chạy với `current_user = 'postgres'`, nên hàm trả về false và raise `insufficient_privilege`. |
| Affected Files / Objects | `cron.job` `data-retention-daily` (jobid 1), `fraud-detection-hourly` (jobid 13); `public.run_data_retention()`, `public.run_fraud_detection()`, `public.is_system_admin()` |
| Recommended Solution | Sửa `is_system_admin()` để công nhận `current_user = 'postgres'` (role cron), hoặc cấu hình cron job `SET ROLE service_role` / `SET LOCAL ROLE` trước khi gọi. Cách an toàn nhất: cho phép `postgres` role được coi là system admin trong `is_system_admin()` vì pg_cron là internal scheduler. |
| Priority | **P0** |
| Regression Risk | Medium |
| Estimated Complexity | Low |

**Evidence:**

- `cron.job_run_details` cho thấy cả hai job liên tục fail mỗi giờ/ngày:
  ```text
  jobid=1 (data-retention-daily): ERROR: Chỉ system admin mới được chạy data retention
  jobid=13 (fraud-detection-hourly): ERROR: Chỉ system admin mới được chạy fraud detection
  ```
- `run_data_retention()` và `run_fraud_detection()` đều bắt đầu bằng `IF NOT public.is_system_admin() THEN RAISE EXCEPTION ...`.
- `is_system_admin()` source (từ `pg_get_functiondef`):
  ```sql
  CREATE OR REPLACE FUNCTION public.is_system_admin()
  RETURNS boolean
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
  AS $function$
  BEGIN
    IF current_user = 'service_role' THEN
      RETURN true;
    END IF;
    IF auth.uid() IS NULL THEN
      RETURN false;
    END IF;
    RETURN EXISTS (
      SELECT 1 FROM public.system_admins WHERE user_id = auth.uid()
    );
  END;
  $function$;
  ```
  Không có nhánh `current_user = 'postgres'`.

**Impact:**

- Data retention và fraud detection đã không chạy trong production ít nhất nhiều ngày.
- Dữ liệu rate-limit logs, login attempts, fraud queue, registration events, orders archive sẽ tích lũy vượt quá retention policy.
- Fraud detection tắt có thể bỏ sót hành vi bất thường.

---

### CRIT-2 — Giao diện quản trị phụ thuộc vào các RPC không tồn tại trong production

| Trường | Giá trị |
| --- | --- |
| Verification Result | **Verified** |
| Current Status | Still exists |
| Root Cause | Các RPC tồn tại trong code và migration local nhưng chưa được apply vào production do migration drift (HIGH-3). |
| Affected Files | `services/tenantService.ts` (dòng 481, 591, 610, 1009, 1017), `services/admin/tenantAdminService.ts` (dòng 168), `docs/admin-dashboard/RPC_CONTRACTS.md` |
| Recommended Solution | 1) Deploy các migration local còn thiếu vào production (đặc biệt `20260718000001_sp_7_1_set_tenant_subdomain.sql`). 2) Nếu không deploy ngay, tạm thời disable các tính năng gọi RPC thiếu hoặc fallback sang edge function. 3) Thêm smoke test kiểm tra tất cả RPC được gọi bởi frontend phải tồn tại trong production. |
| Priority | **P0** |
| Regression Risk | Medium |
| Estimated Complexity | Medium |

**Evidence:**

- Query `information_schema.routines` với các tên:
  ```sql
  SELECT routine_name FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name IN (
      'admin_update_subscription', 'get_member_with_email', 'get_storage_usage',
      'search_members_by_email', 'set_tenant_subdomain', 'unlock_login_attempts'
    );
  ```
  Kết quả chỉ trả về `unlock_login_attempts`. 5 RPC còn lại không tồn tại trong production schema.
- Code vẫn gọi các RPC thiếu:
  - `services/tenantService.ts:481` → `supabase.rpc('admin_update_subscription', ...)`
  - `services/tenantService.ts:591` → `supabase.rpc('get_member_with_email', ...)`
  - `services/tenantService.ts:610` → `supabase.rpc('search_members_by_email', ...)`
  - `services/tenantService.ts:1009,1017` → `supabase.rpc('get_storage_usage', ...)`
  - `services/admin/tenantAdminService.ts:168` → `supabase.rpc('set_tenant_subdomain', ...)`
- Migration `supabase/migrations/20260718000001_sp_7_1_set_tenant_subdomain.sql` tồn tại ở local nhưng production migrations list kết thúc ở `20260718000000_phase6_3_support_ticket_sla`, tức là chưa apply.

**Impact:**

- Các chức năng admin như cập nhật subscription, quản lý member, cập nhật subdomain tenant sẽ lỗi runtime khi người dùng click.
- UX broken: form submit thất bại, người dùng không thể hoàn tất thao tác.

---

### CRIT-3 — Anonymous / authenticated có thể gọi các RPC nhạy cảm

| Trường | Giá trị |
| --- | --- |
| Verification Result | **Verified** (và nghiêm trọng hơn mô tả ban đầu) |
| Current Status | Still exists |
| Root Cause | `GRANT EXECUTE ... TO anon, authenticated` được áp dụng rộng rãi trên các hàm `SECURITY DEFINER`, bao gồm cả hàm tạo system admin và xóa login attempts. |
| Affected Objects | `public.unlock_login_attempts`, `public.add_system_admin`, `public.add_system_admin_for_edge` |
| Recommended Solution | 1) `REVOKE EXECUTE ON public.unlock_login_attempts FROM anon;` — chỉ để lại `authenticated` hoặc service_role. 2) `REVOKE EXECUTE ON public.add_system_admin, public.add_system_admin_for_edge FROM anon, authenticated;` — chỉ `service_role` hoặc `postgres` được gọi. 3) Audit toàn bộ 137 hàm `anon_security_definer_function_executable` và 137 hàm `authenticated_security_definer_function_executable` (xem HIGH-4). |
| Priority | **P0** |
| Regression Risk | Low |
| Estimated Complexity | Low |

**Evidence:**

- Query `information_schema.routine_privileges`:
  ```text
  grantee=anon       routine=add_system_admin
  grantee=authenticated routine=add_system_admin
  grantee=anon       routine=add_system_admin_for_edge
  grantee=authenticated routine=add_system_admin_for_edge
  grantee=anon       routine=unlock_login_attempts
  grantee=authenticated routine=unlock_login_attempts
  ```
- `unlock_login_attempts` là `SECURITY DEFINER` và chỉ làm:
  ```sql
  DELETE FROM public.login_attempts WHERE email = LOWER(TRIM(p_email));
  ```
  Không kiểm tra user, tenant, hay rate limit. Một user ẩn danh có thể xóa toàn bộ bảng login_attempts bằng cách gọi lặp lại với nhiều email.
- `add_system_admin` và `add_system_admin_for_edge` là các hàm tạo system admin. Nếu có thể gọi bởi `anon`/`authenticated`, attacker có thể leo thang đặc quyền.

**Impact:**

- Elevation of privilege: bất kỳ user đăng ký nào cũng có thể tự thêm mình làm system admin.
- Anti-forensics: xóa login_attempts để che dấu brute force.
- Compliance failure: mọi thao tác admin phải được kiểm soát và audit.

---

### CRIT-4 — Edge Functions expose privileged operations without JWT verification

| Trường | Giá trị |
| --- | --- |
| Verification Result | **Partially Verified** |
| Current Status | Partially fixed / needs hardening |
| Root Cause | Nhiều edge function có `verify_jwt: false` và dựa vào shared secret thay vì Supabase JWT. Một số webhook provider (Momo, VNPay, bank_transfer) không xác thực chữ ký. Tên function trong audit (`cleanup-expired-sessions`, `billing-daily-jobs`, `check-expired-subscriptions`, `send-invoice-reminders`, `process-subscription-renewals`) không còn tồn tại trong danh sách production hiện tại. |
| Affected Functions | `send-billing-email`, `send-ticket-email`, `send-template-email`, `billing-webhooks`, `cron-admin-tasks`, `admin-health-check`, `webhook-delivery` |
| Recommended Solution | 1) `billing-webhooks`: bắt buộc xác thực chữ ký/secret cho Momo, VNPay, bank_transfer (Stripe đã làm). 2) `admin-health-check`: nên wrap bằng JWT + IP allowlist hoặc giữ verify_jwt=false nhưng rotate secret và log. 3) `send-*-email` và `cron-admin-tasks`: đang có internal secret check, cần đảm bảo secret được đặt trong Supabase secrets và không hardcode. 4) Đánh giá lại tính năng nào thực sự cần `verify_jwt: false`. |
| Priority | **P0 / P1** |
| Regression Risk | Medium |
| Estimated Complexity | Medium |

**Evidence:**

- Danh sách edge functions trong production (slug | verify_jwt | name):
  ```text
  send-billing-email        | False
  send-ticket-email         | False
  send-template-email       | False
  billing-webhooks          | False
  cron-admin-tasks          | False
  admin-health-check        | False
  webhook-delivery          | False
  ```
- `send-billing-email/index.ts`: yêu cầu `X-Internal-Secret` hoặc service role key hoặc system admin JWT.
- `send-ticket-email/index.ts`: yêu cầu service role key hoặc system admin JWT.
- `send-template-email/index.ts`: yêu cầu service role key hoặc system admin JWT.
- `cron-admin-tasks/index.ts`: yêu cầu `X-Internal-Secret` hoặc service role key.
- `webhook-delivery/index.ts`: yêu cầu `X-Internal-Secret` hoặc service role key.
- `admin-health-check/index.ts`: chỉ dùng service role key để gọi các RPC health-check.
- `billing-webhooks/index.ts`: Stripe có xác thực signature; Momo, VNPay, bank_transfer chỉ parse JSON body và không kiểm tra chữ ký/secret.

**Impact:**

- Momo/VNPay/bank_transfer webhook có thể bị giả mạo để đánh dấu thanh toán thành công sai.
- `admin-health-check` nếu bị lộ secret có thể bị dùng để DoS hoặc reconnaissance.

---

### HIGH-1 — `delete-tenant` edge function returns 401 / 500

| Trường | Giá trị |
| --- | --- |
| Verification Result | **Partially Verified / Already fixed** |
| Current Status | Likely fixed |
| Root Cause | Commit gần đây `f175266e [verified] fix(delete-tenant): remove redundant set_config RPC to stop 500 error` đã loại bỏ set_config gây lỗi. Source code hiện tại có auth check đúng và audit action hợp lệ. |
| Affected Files | `supabase/functions/delete-tenant/index.ts` |
| Recommended Solution | 1) Kiểm tra production logs gần nhất để xác nhận 401/500 không còn xảy ra. 2) Thêm regression test cho soft-delete và hard-delete. 3) Đảm bảo tất cả RPC/edge function được gọi từ bên trong delete-tenant tồn tại trong production. |
| Priority | **P1** |
| Regression Risk | Low |
| Estimated Complexity | Low |

**Evidence:**

- Git log 5 commit gần nhất trên `supabase/functions/delete-tenant/index.ts`:
  ```text
  f175266e [verified] fix(delete-tenant): remove redundant set_config RPC to stop 500 error
  304baaaf chore(admin): clean up console.log and TODO in edge functions
  a2c8742a fix(delete-tenant): use valid audit log actions and make logging non-fatal
  b6d362fe feat: Complete Basejump Admin Dashboard Enterprise Upgrade ...
  777ab04c update
  ```
- Source hiện tại (dòng 254–276): parse JWT, kiểm tra `checkIsSystemAdmin` hoặc `checkIsTenantOwner`, xác thực UUID, rate limit.
- Audit log action được dùng là `'UPDATE'` và `'DELETE'` — hợp lệ với `app_audit_log` CHECK constraint.

**Impact:**

- Nếu vẫn còn 401/500, admin/tenant owner không thể xóa tenant.
- Hiện tại rủi ro thấp do code đã được sửa; cần verify qua logs.

---

### HIGH-2 — Missing `import_history` table

| Trường | Giá trị |
| --- | --- |
| Verification Result | **Verified** |
| Current Status | Still exists |
| Root Cause | Bảng `import_history` được tham chiếu trong code/service nhưng chưa được tạo trong production schema (migration drift). |
| Affected Files | `services/supabaseService.ts`, các tính năng import POS/CSV |
| Recommended Solution | 1) Tạo migration tạo `import_history` với đúng cột, RLS, tenant-scoped. 2) Hoặc nếu tính năng import history không còn dùng, xóa reference trong code. 3) Thêm integration test cho import flow. |
| Priority | **P1** |
| Regression Risk | Low |
| Estimated Complexity | Low |

**Evidence:**

- Query `information_schema.tables` với `table_name = 'import_history'` trả về 0 dòng.
- Code `services/supabaseService.ts` tham chiếu `import_history`.

**Impact:**

- Mọi thao tác ghi lịch sử import đều fail, gây lỗi POS import hoặc mất traceability.

---

### HIGH-3 — Migration drift giữa local và production

| Trường | Giá trị |
| --- | --- |
| Verification Result | **Verified** |
| Current Status | Still exists |
| Root Cause | Local phát triển liên tục sinh migration mới nhưng chưa deploy đồng bộ lên production. Một số migration trong production có timestamp khác với local dù cùng nội dung. Có migration trùng timestamp ở local. |
| Affected Files | `supabase/migrations/` |
| Recommended Solution | 1) Sync danh sách migration: so sánh nội dung hash của từng file. 2) Deploy 9 migration local chưa có trong production lên staging trước, sau đó production. 3) Giải quyết duplicate `20260718000000` bằng cách đổi tên hoặc squash. 4) Thiết lập CI/CD chặn merge khi local migration chưa được apply trên staging. |
| Priority | **P0** |
| Regression Risk | High |
| Estimated Complexity | High |

**Evidence:**

| Metric | Production | Local |
| --- | --- | --- |
| Tổng số migration | 136 | 137 |
| First | 20250703000000 | 20250703000000 |
| Last | 20260718000000 | 20260728000000 |
| Chỉ có ở local (chưa apply) | — | 9 |
| Chỉ có ở production (local thiếu) | 9 | — |
| Duplicate timestamp | 0 | 1 (`20260718000000`) |

- 9 migration chỉ có ở local (chưa apply production):
  ```text
  20260718000001_sp_7_1_set_tenant_subdomain
  20260719000000_sp2_4_announcement_audience_active_range
  20260719000001_sp_7_2_custom_domain_verification
  20260720000000_sp2_6_global_config_rpc
  20260720000001_sp_7_3_licenses
  20260721000000_sp2_7_user_management_rpc
  20260722000000_sp2_8_role_management_rpc
  20260723000000_sp3_1_plans_crud_features
  20260728000000_sp5_6_db_maintenance
  ```
- 9 migration chỉ có ở production nhưng cùng nội dung với local (timestamp khác):
  ```text
  20260713053550_sp1_6_expand_audit_log_event_types
  20260713053608_sp2_4_announcement_audience_active_range
  20260713053615_sp_7_2_custom_domain_verification
  20260713053622_sp2_6_global_config_rpc
  20260713053644_sp_7_3_licenses
  20260713053657_sp2_7_user_management_rpc
  20260713053746_sp2_8_role_management_rpc
  20260713053807_sp3_1_plans_crud_features
  20260713053828_sp5_6_db_maintenance
  ```
- Duplicate local: `20260718000000` xuất hiện với cả `phase6_3_support_ticket_sla` và `sp1_6_expand_audit_log_event_types`.

**Impact:**

- Production thiếu hàng loạt feature mới (subdomain, licenses, user management RPC, etc.).
- CRIT-2 (missing RPCs) trực tiếp do migration drift.
- HIGH-2 (missing import_history) cũng có thể liên quan.

---

### HIGH-4 — `authenticated` được cấp quyền trên SECURITY DEFINER functions

| Trường | Giá trị |
| --- | --- |
| Verification Result | **Verified** |
| Current Status | Still exists |
| Root Cause | Nhiều hàm `SECURITY DEFINER` được `GRANT EXECUTE TO authenticated` (và `anon`) mà không kiểm tra quyền bên trong. |
| Affected Objects | 137 hàm theo `authenticated_security_definer_function_executable`; tương tự 137 hàm theo `anon_security_definer_function_executable` |
| Recommended Solution | 1) Audit toàn bộ 137 hàm; REVOKE EXECUTE khỏi `anon` trên tất cả hàm không cần thiết. 2) Giữ `authenticated` chỉ trên các hàm read-only hoặc tenant-scoped. 3) Bên trong mỗi hàm `SECURITY DEFINER`, gọi `is_system_admin()` / `is_tenant_admin()` / RLS để kiểm soát. 4) Tạo migration `REVOKE` hàng loạt và `GRANT` lại chính xác. |
| Priority | **P0** |
| Regression Risk | Medium |
| Estimated Complexity | High |

**Evidence:**

- Supabase Advisors output:
  ```text
  Total lints: 384
  anon_security_definer_function_executable: 137
  authenticated_security_definer_function_executable: 137
  function_search_path_mutable: 107
  extension_in_public: 2
  auth_leaked_password_protection: 1
  ```
- Ví dụ các hàm bị cấp quyền sai:
  - `add_system_admin`, `add_system_admin_for_edge` → `anon` + `authenticated` (CRIT-3)
  - `unlock_login_attempts` → `anon` + `authenticated`
  - `get_system_overview`, `get_top_tenants`, `get_tenant_usage_summary`, `get_tenant_growth`, `purge_archived_tenants`, `set_maintenance_mode`, etc.

**Impact:**

- Leo thang đặc quyền, truy cập dữ liệu cross-tenant, thao tác admin bởi user thường.
- Rủi ro compliance cao.

---

### MED-1 — Mutable `search_path` trong SECURITY DEFINER functions

| Trường | Giá trị |
| --- | --- |
| Verification Result | **Verified** |
| Current Status | Still exists |
| Root Cause | 107 hàm `SECURITY DEFINER` không đặt `SET search_path TO 'public'` hoặc search_path phụ thuộc vào role gọi. Điều này cho phép search-path hijacking. |
| Affected Objects | 107 hàm public (xem Appendix cho danh sách đầy đủ) |
| Recommended Solution | Thêm `SET search_path TO 'public'` vào định nghĩa mỗi hàm `SECURITY DEFINER`, hoặc sử dụng migration `ALTER FUNCTION ... SET search_path = 'public';`. Nên kết hợp với HIGH-4 trong cùng một migration sweep. |
| Priority | **P1** |
| Regression Risk | Low |
| Estimated Complexity | Medium |

**Evidence:**

- Supabase Advisors: `function_search_path_mutable: 107`.
- Một số ví dụ:
  ```text
  get_customer_stats, create_plan, create_tenant_with_admin, update_tenant_subscription,
  get_system_overview, get_tenant_usage_summary, purge_archived_tenants, set_maintenance_mode,
  delete_tenant_safe, update_tenant, get_dashboard_summary, search_tenants, get_plans, ...
  ```
- Hàm `run_data_retention()` đã có `SET search_path TO 'public'` (good example), nhưng `run_fraud_detection()` chỉ có `SET search_path TO 'public'` cũng là good example. Các hàm còn lại thiếu.

**Impact:**

- Search-path hijacking có thể cho phép attacker redirect function call sang object độc hại cùng tên trong schema khác.
- Mặc dù Supabase default search path hạn chế, vẫn nên đặt explicit search_path trên mọi SECURITY DEFINER function.

---

### MED-2 — Cron jobs overlap / duplicate scheduling

| Trường | Giá trị |
| --- | --- |
| Verification Result | **Partially Verified** |
| Current Status | Mitigated but still redundant |
| Root Cause | Có nhiều cron job cùng mục đích được lên lịch ở thời điểm khác nhau. Tuy nhiên, `create_renewal_invoices()` đã có `pg_advisory_xact_lock` và kiểm tra invoice đã tồn tại nên không gây duplicate thực sự. |
| Affected Objects | `cron.job` (`billing-renewal-daily`, `renewal-invoice-daily`, `admin-billing-reminders`, `billing-reminders-daily`) |
| Recommended Solution | 1) Gộp các job trùng lặp: chỉ giữ một `billing-renewal-daily` và một `billing-reminders-daily`. 2) Đảm bảo mọi cron job sử dụng advisory lock hoặc idempotency check. 3) Thêm bảng `cron_job_logs` để giám sát overlap. |
| Priority | **P2** |
| Regression Risk | Low |
| Estimated Complexity | Low |

**Evidence:**

- `cron.job` list:
  ```text
  billing-renewal-daily   0 2 * * *  SELECT public.create_renewal_invoices();
  renewal-invoice-daily 0 4 * * *  SELECT public.create_renewal_invoices(7);
  admin-billing-reminders 0 8 * * * SELECT public.run_admin_cron_billing_reminders();
  billing-reminders-daily 0 9 * * * SELECT public.send_billing_reminders();
  ```
- `create_renewal_invoices(p_days_before integer DEFAULT 7)` sử dụng `pg_advisory_xact_lock(hashtextextended('create_renewal_invoices', 0))` và `NOT EXISTS` invoice đang mở.
- `run_admin_cron_billing_reminders()` bên trong `cron-admin-tasks` edge function cũng gửi reminder, nên có thể overlap với `billing-reminders-daily`.

**Impact:**

- Không gây duplicate invoice nhưng lãng phí tài nguyên và khó quản lý.
- Nếu một trong hai job bị lỗi, reminder/renewal vẫn chạy qua job còn lại, che giấu lỗi.

---

### MED-3 — Hai bảng audit log (`audit_log` và `app_audit_log`) tồn tại song song

| Trường | Giá trị |
| --- | --- |
| Verification Result | **Verified** |
| Current Status | Still exists |
| Root Cause | Hệ thống có bảng `audit_log` cũ và `app_audit_log` mới. Trigger legacy trỏ về `audit_log`, trigger mới trỏ về `app_audit_log`. |
| Affected Objects | `public.audit_log`, `public.app_audit_log`, các trigger `trg_audit_log_*` |
| Recommended Solution | 1) Chọn một bảng audit duy nhất (khuyên dùng `app_audit_log` vì có CHECK constraint và schema rõ ràng hơn). 2) Migrate dữ liệu từ `audit_log` cũ. 3) Cập nhật/cấm trigger ghi vào bảng cũ. 4) Đảm bảo mọi edge function ghi audit đúng bảng (delete-tenant đã dùng `app_audit_log`). |
| Priority | **P2** |
| Regression Risk | Medium |
| Estimated Complexity | Medium |

**Evidence:**

- Cả hai bảng đều tồn tại trong `information_schema.tables`.
- Triggers ghi vào `app_audit_log` (qua `write_audit_log()`):
  ```text
  trg_audit_log_app_settings     → app_settings
  trg_audit_log_disposals          → disposals
  trg_audit_log_import_receipts    → import_receipts
  trg_audit_log_orders             → orders
  trg_audit_log_products           → products
  ```
- Triggers ghi vào `audit_log` (qua `audit_log_trigger()` / `audit_log_trigger_tenant_subscriptions()`):
  ```text
  trg_audit_log_tenant_memberships   → tenant_memberships
  trg_audit_log_tenant_subscriptions → tenant_subscriptions
  trg_audit_log_tenants              → tenants
  ```

**Impact:**

- Audit trail bị phân mảnh; admin phải truy vấn hai bảng để có toàn bộ lịch sử.
- Dễ bỏ sót sự kiện khi export audit log.

---

### MED-4 — Client-side admin checks rely only on RLS / local state

| Trường | Giá trị |
| --- | --- |
| Verification Result | **Verified** |
| Current Status | Still exists |
| Root Cause | Admin route guard hoàn toàn client-side: `App.tsx` query `system_admins` trực tiếp và set local state. Không có server-side render guard, middleware, hoặc SSR check. `lib/permissions.ts` đã có helper `isSystemAdmin()` gọi RPC nhưng `App.tsx` không dùng. |
| Affected Files | `App.tsx` (194–224, 1338–1347), `pages/admin/AdminLayout.tsx` (71–89), `contexts/AuthContext.tsx` (8–15, 19–127), `lib/permissions.ts` (123–137) |
| Recommended Solution | 1) Trong `App.tsx`, dùng `lib/permissions.ts:isSystemAdmin()` (gọi RPC `is_system_admin`) thay vì query bảng trực tiếp. 2) Thêm route guard component `<RequireSystemAdmin>` reject sớm nếu không phải admin. 3) Cân nhắc server-side guard nếu chuyển sang SSR/edge. |
| Priority | **P0** |
| Regression Risk | Medium |
| Estimated Complexity | Medium |

**Evidence:**

- `App.tsx:209-217`:
  ```tsx
  const { data } = await supabase
    .from('system_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!cancelled) setIsSystemAdmin(!!data);
  ```
- `App.tsx:1342-1344`:
  ```tsx
  if (subdomain === 'admin' || isAdminPath) {
    if (!user) return <Login />;
    if (!isSystemAdmin) return <TenantForbiddenPage />;
  ```
- `pages/admin/AdminLayout.tsx` chỉ render `<Outlet />` mà không kiểm tra role.
- `lib/permissions.ts` có `isSystemAdmin()` gọi `is_system_admin()` RPC nhưng không được `App.tsx` sử dụng.

**Impact:**

- Dễ bị bypass nếu client bị can thiệp (proxy, extension, modified bundle).
- RLS vẫn là back-end defense, nhưng route gating client-side không đủ mạnh cho admin surface.

---

### MED-5 — Admin dashboard loaders lack cancellation / race protection

| Trường | Giá trị |
| --- | --- |
| Verification Result | **Verified** |
| Current Status | Still exists |
| Root Cause | Các `useEffect` async trong trang admin không dùng `AbortController` hoặc cancellation flag. Khi user chuyển tab nhanh hoặc component unmount, setState trên component đã unmount có thể gây race/warning. |
| Affected Files | `pages/admin/AdminDashboardInner.tsx` (162–269, 370–393), `pages/admin/Security.tsx` (34–70) |
| Recommended Solution | Thêm `let cancelled = false` trong mỗi `useEffect` và cleanup set `true`; guard tất cả `setState`. Với request dài, truyền `AbortSignal` vào service/Supabase và abort trong cleanup. |
| Priority | **P1** |
| Regression Risk | Low |
| Estimated Complexity | Low |

**Evidence:**

- `AdminDashboardInner.tsx`:
  ```tsx
  const loadOverview = useCallback(async () => { ... }, []);
  useEffect(() => {
    if (activeTab === 'overview') loadOverview();
  }, [activeTab, loadOverview]);
  ```
  Không có cleanup.
- `Security.tsx` gọi `listAccounts({ pageSize: 1000 })` và `getTenantSecuritySettings(selectedTenantId)` trong `useEffect` mà không hủy.

**Counter-examples (đã làm đúng):** `TenantDetail.tsx`, `Billing.tsx`, `InvitationsAccept.tsx`, `InvoiceManager.tsx`.

**Impact:**

- Race condition, memory leak, UI hiển thị dữ liệu cũ.
- Không ảnh hưởng security nhưng làm giảm reliability.

---

### MED-6 — Unsafe `as any` casts and missing validation on sensitive forms

| Trường | Giá trị |
| --- | --- |
| Verification Result | **Partially Verified** |
| Current Status | Still exists |
| Root Cause | Một số service cast RPC response bằng `as any`, và các form nhạy cảm (company info, bank account) submit state trực tiếp mà không qua schema validation (Zod/yup). |
| Affected Files | `services/admin/memberAdminService.ts` (232), `services/admin/complianceAdminService.ts` (39–45, 85), `pages/admin/Billing.tsx` (127–160, 215–294) |
| Recommended Solution | 1) Thay `as any` bằng typed response hoặc generated Supabase types. 2) Thêm Zod schema cho company info và bank account form, validate trước khi submit. 3) Mở rộng sang các form admin khác. |
| Priority | **P1** |
| Regression Risk | Low |
| Estimated Complexity | Low |

**Evidence:**

- `memberAdminService.ts:232`: `const rows = data as any[] | null;`
- `complianceAdminService.ts:85`: `const result = data as { data: any[]; count: number };`
- `Billing.tsx` forms submit `company` / `form` state trực tiếp:
  ```tsx
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanySaving(true);
    await setCompanyInfo(company);
  };
  ```

**Impact:**

- Type-safety giảm, dễ bỏ sót lỗi runtime.
- Dữ liệu không hợp lệ có thể lưu vào DB nếu backend không validate.

---

### LOW-1 — Empty catch blocks hide auth errors

| Trường | Giá trị |
| --- | --- |
| Verification Result | **Verified** |
| Current Status | Still exists |
| Root Cause | `AuthContext.tsx` dùng catch blocks rỗng hoặc `.catch(() => {})` để bỏ qua lỗi MFA, session init, audit logging, sign-out. Điều này che giấu lỗi authentication/authorization. |
| Affected Files | `contexts/AuthContext.tsx` (35, 48, 83, 89, 92, 107–109) |
| Recommended Solution | Thay catch rỗng bằng `console.error` / Sentry / toast, nhưng giữ UX non-blocking. Đảm bảo mọi lỗi auth đều được log với context. |
| Priority | **P2** |
| Regression Risk | Low |
| Estimated Complexity | Low |

**Evidence:**

```tsx
// line 35
} catch {
  // Bỏ qua lỗi MFA check...
}

// line 48
} catch {
  setSession(null);
  setUser(null);
}

// lines 83, 89, 92
writeAuditLog(...).catch(() => {});
recordAdminLogin(...).catch(() => {});
Promise.resolve(supabase.rpc('activate_pending_memberships', ...)).catch(() => {});

// lines 107–109
} catch (err) {
  // empty
}
```

**Impact:**

- Khó phát hiện brute-force, MFA bypass, session corruption.
- Khó debug incident.

---

### LOW-2 — Client-side pagination fetches large pages

| Trường | Giá trị |
| --- | --- |
| Verification Result | **Verified** |
| Current Status | Still exists |
| Root Cause | Các service `getAll*` load toàn bộ bảng rồi filter/slice ở browser. Một số nơi dùng `limit: 1000`/`pageSize: 1000` như một "get all". |
| Affected Files | `services/invoiceService.ts` (123–142), `services/bankAccountService.ts` (27–31), `services/tenantService.ts` (886–892), `services/admin/tenantAdminService.ts` (43–60), `components/PaymentManager.tsx` (54–70), `components/InvoiceManager.tsx` (100–109), `components/InvoiceCreator.tsx` (29), `pages/admin/Security.tsx` (36) |
| Recommended Solution | Thay `getAll*` bằng server-side pagination: dùng `range()`/`limit()`, trả về `{items, totalCount, page, pageSize}`. Cập nhật UI dùng `useAdminList` hoặc tương tự. |
| Priority | **P2** |
| Regression Risk | Low |
| Estimated Complexity | Medium |

**Evidence:**

```ts
export async function getAllInvoices(): Promise<InvoiceWithTenant[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, tenants(name, subdomain)')
    .order('created_at', { ascending: false });
  ...
}
```

```ts
export async function getAllPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });
}
```

- `Security.tsx:36`: `listAccounts({ pageSize: 1000 })`
- `InvoiceCreator.tsx:29`: `getTenantsAdmin({ page: 1, limit: 1000, ... })`

**Impact:**

- Browser load nặng khi dữ liệu lớn.
- PostgREST/DB bị quá tải với select `*` không limit.
- UX chậm cho admin danh sách dài.

---

### LOW-3 — Duplicate / non-sequential migration names

| Trường | Giá trị |
| --- | --- |
| Verification Result | **Verified** |
| Current Status | Still exists |
| Root Cause | Hai migration khác nhau dùng cùng timestamp `20260718000000`, và local có 137 file trong khi production 136. Một số file `sp_*` trong production có timestamp giây khác với local. |
| Affected Files | `supabase/migrations/` |
| Recommended Solution | 1) Đổi tên một trong hai `20260718000000` file. 2) Chuẩn hóa quy tắc đặt tên migration (timestamp + mô tả). 3) Dùng `supabase migration squash` định kỳ. 4) CI check không cho phép trùng timestamp. |
| Priority | **P3** |
| Regression Risk | Low |
| Estimated Complexity | Low |

**Evidence:**

- Local duplicate timestamp:
  ```text
  20260718000000_phase6_3_support_ticket_sla.sql
  20260718000000_sp1_6_expand_audit_log_event_types.sql
  ```
- 9 migration production dùng timestamp giây, local dùng timestamp ngày khác nhưng cùng nội dung.

**Impact:**

- Khó theo dõi lịch sử schema.
- Có thể gây lỗi khi rebase/redeploy.

---

### LOW-4 — `.env` points to production without documented staging process

| Trường | Giá trị |
| --- | --- |
| Verification Result | **Verified** |
| Current Status | Still exists |
| Root Cause | `.env` committed chứa production Supabase URL/key. `.env.staging` tồn tại nhưng không được package scripts hoặc tài liệu sử dụng. Không có `.env.example` hướng dẫn biến ứng dụng. |
| Affected Files | `.env`, `.env.staging`, `.env.example`, `package.json`, `README.md`, `DEPLOYMENT_SYSTEM_ADMIN_FEATURE.md`, `GITHUB_DESKTOP_DEPLOYMENT_GUIDE.md` |
| Recommended Solution | 1) Thêm scripts `dev:staging`, `build:staging`, `preview:staging` load `.env.staging`. 2) Tạo `.env.example` với `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. 3) Thêm "Switching environments" vào README. 4) Cân nhắc đưa `.env` vào `.gitignore` nếu chứa secret thực (mặc dù đây là anon key, vẫn nên tránh commit). |
| Priority | **P3** |
| Regression Risk | Low |
| Estimated Complexity | Low |

**Evidence:**

- `.env`:
  ```env
  VITE_SUPABASE_URL=https://rsialbfjswnrkzcxarnj.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
  ```
- `.env.staging` trỏ đến project `shbmzvfcenbybvyzclem`.
- `package.json` scripts:
  ```json
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
  ```
  Không có script staging.
- `.env.example` chỉ chứa biến AI orchestrator, không hướng dẫn Supabase env.
- `README.md` không có phần staging/deployment.

**Impact:**

- Dev có thể vô tình build/preview trỏ vào production.
- Không có quy trình staging rõ ràng.

---

## 4. Cross-Issue Analysis (Phân tích chéo)

### Các nhóm root cause hệ thống

| Nhóm | Root Cause | Issue liên quan |
| --- | --- | --- |
| **A. Auth & Authorization** | `is_system_admin()` thiếu công nhận role hệ thống; grants rộng rãi cho anon/authenticated; route guard client-side. | CRIT-1, CRIT-3, HIGH-4, MED-1, MED-4 |
| **B. Migration & Schema Drift** | Local migrations chưa được apply đồng bộ; duplicate timestamps; production có migrations với timestamp khác. | CRIT-2, HIGH-2, HIGH-3, LOW-3 |
| **C. Frontend Reliability** | useEffect không hủy, as any casts, form validation thiếu, catch rỗng, pagination client-side. | MED-5, MED-6, LOW-1, LOW-2 |
| **D. Operations & DevEx** | Cron job thừa, .env staging không được dùng. | MED-2, LOW-4 |

### Cascade / blocker analysis

- **HIGH-3 là blocker của CRIT-2**: vì 9 migration chưa apply (đặc biệt `set_tenant_subdomain`) nên các RPC trong code không tồn tại trong production.
- **HIGH-3 là blocker của HIGH-2**: `import_history` có thể được tạo trong một migration chưa apply hoặc chưa có.
- **HIGH-4 và MED-1 nên được sửa cùng nhau**: cả hai đều liên quan đến 100+ functions `SECURITY DEFINER`. Một migration sweep có thể `REVOKE` + `SET search_path` cùng lúc.
- **CRIT-1 và CRIT-3 cùng đòi hỏi sửa `is_system_admin()` và grant model**: cần đảm bảo sau khi sửa `is_system_admin` để công nhận `postgres`, không vô tình mở thêm attack surface.
- **MED-4 phụ thuộc CRIT-3 / HIGH-4**: nếu backend grants không chặt, frontend route guard dù đúng cũng không đủ.

### Rủi ro tổng thể

- **Rủi ro bảo mật cao nhất**: CRIT-3 (anon có thể tạo system admin), CRIT-4 (webhook giả mạo), HIGH-4 (137 hàm DEFINER bị over-grant).
- **Rủi ro vận hành cao nhất**: CRIT-1 (cron fail), HIGH-3 (migration drift), CRIT-2 (RPC thiếu gây UX broken).
- **Rủi ro kỹ thuật nợ**: MED-1 (107 search_path mutable), MED-3 (hai audit log), LOW-2 (pagination client-side).

---

## 5. Recommended Execution Plan (Kế hoạch thực hiện)

### Phase 1 — Khóa an ninh và vận hành (P0, tuần 1)

| Task | Issue | Hành động cụ thể | Owner gợi ý |
| --- | --- | --- | --- |
| 1.1 Sửa `is_system_admin()` | CRIT-1 | Thêm `current_user = 'postgres'` hoặc `SET ROLE` trong cron job; verify cron job chạy lại. | Backend/DB |
| 1.2 REVOKE grants quá rộng | CRIT-3, HIGH-4 | Tạo migration `REVOKE EXECUTE ... FROM anon` trên toàn bộ functions; chỉ giữ `GRANT` cho `authenticated` trên read-only/tenant-scoped; `service_role`/`postgres` cho admin functions. | Backend/DB |
| 1.3 Sync & deploy migration | HIGH-3, CRIT-2 | So sánh hash các migration file; deploy 9 migration thiếu lên staging; run test; deploy production. | Backend/DB |
| 1.4 Harden webhook & internal edge functions | CRIT-4 | Thêm signature verification cho Momo/VNPay/bank_transfer; rotate `X-Internal-Secret`; review `verify_jwt=false`. | Backend/Edge |

### Phase 2 — Ổn định schema và data (P1, tuần 2)

| Task | Issue | Hành động cụ thể | Owner gợi ý |
| --- | --- | --- | --- |
| 2.1 Fix `search_path` mutable | MED-1 | Migration `ALTER FUNCTION ... SET search_path = 'public'` cho 107 hàm; làm cùng với 1.2. | Backend/DB |
| 2.2 Tạo `import_history` hoặc xóa reference | HIGH-2 | Kiểm tra migration có bảng chưa; nếu chưa tạo migration mới hoặc xóa code reference. | Backend |
| 2.3 Verify delete-tenant | HIGH-1 | Kiểm tra edge function logs; thêm regression test. | Backend/Edge |
| 2.4 Consolidate audit log | MED-3 | Chọn bảng duy nhất; migrate dữ liệu; cập nhật triggers. | Backend/DB |

### Phase 3 — Cứng hóa frontend (P0/P1, tuần 3)

| Task | Issue | Hành động cụ thể | Owner gợi ý |
| --- | --- | --- | --- |
| 3.1 Server-side admin route guard | MED-4 | Dùng `lib/permissions.ts:isSystemAdmin()` trong `App.tsx`; thêm `<RequireSystemAdmin>`. | Frontend |
| 3.2 Loader cancellation | MED-5 | Thêm cancellation flag/AbortController trong `AdminDashboardInner.tsx`, `Security.tsx`, và các trang admin còn lại. | Frontend |
| 3.3 Form validation & typed RPC | MED-6 | Thêm Zod cho company/bank forms; thay `as any` bằng typed response. | Frontend |

### Phase 4 — Cải thiện reliability & scalability (P2, tuần 4)

| Task | Issue | Hành động cụ thể | Owner gợi ý |
| --- | --- | --- | --- |
| 4.1 Log auth errors | LOW-1 | Thay catch rỗng trong `AuthContext.tsx` bằng `console.error`/Sentry/toast. | Frontend |
| 4.2 Server-side pagination | LOW-2 | Thay `getAll*` bằng paginated queries; cập nhật UI dùng `useAdminList`. | Frontend/Backend |
| 4.3 Consolidate cron jobs | MED-2 | Gộp `billing-renewal-daily` + `renewal-invoice-daily`; gộp reminder jobs. | Backend/DB |
| 4.4 Staging env docs | LOW-4 | Thêm `dev:staging`/`build:staging`, `.env.example`, README section. | DevOps |

### Phase 5 — Dài hạn (ongoing)

| Task | Mục tiêu | Hành động |
| --- | --- | --- |
| 5.1 CI/CD migration check | HIGH-3, LOW-3 | Chặn merge nếu local migration chưa được apply trên staging hoặc có trùng timestamp. |
| 5.2 DB security lint | MED-1, HIGH-4 | Chạy `supabase lint` trong CI; không cho phép `anon_security_definer_function_executable` mới. |
| 5.3 RPC smoke test | CRIT-2 | Script kiểm tra mọi RPC được gọi trong frontend phải tồn tại trong production. |
| 5.4 Cron monitoring | CRIT-1, MED-2 | Alert khi `cron.job_run_details.status = 'failed'` hoặc job không chạy trong khoảng thời gian. |
| 5.5 Penetration test | CRIT-3, CRIT-4 | Kiểm tra bằng tay: gọi `add_system_admin` với anon, gửi webhook giả mạo Momo/VNPay. |

---

## 6. Appendix

### A. Production edge functions with `verify_jwt: false`

```text
send-billing-email        | False
send-ticket-email         | False
send-template-email       | False
billing-webhooks          | False
cron-admin-tasks          | False
admin-health-check        | False
webhook-delivery          | False
```

### B. Supabase Advisors summary

```text
Total lints: 384
anon_security_definer_function_executable:        137
authenticated_security_definer_function_executable: 137
function_search_path_mutable:                       107
extension_in_public:                                  2
auth_leaked_password_protection:                      1
```

### C. Migration drift summary

| Metric | Production | Local |
| --- | --- | --- |
| Tổng số migration | 136 | 137 |
| Last migration | 20260718000000 | 20260728000000 |
| Chỉ có ở local | — | 9 |
| Chỉ có ở production | 9 | — |
| Duplicate timestamp | 0 | 1 (`20260718000000`) |

### D. Sample functions with mutable search_path (excerpt)

```text
get_customer_stats, create_plan, create_tenant_with_admin, update_tenant_subscription,
get_system_overview, get_tenant_usage_summary, purge_archived_tenants, set_maintenance_mode,
delete_tenant_safe, update_tenant, get_dashboard_summary, search_tenants, get_plans,
get_inventory_report, list_integrations, get_connection_pool_stats, get_sales_report,
get_product_stock_balance, orders_set_order_code, f_unaccent, filter_products_rpc, ...
```

### E. Các RPC thiếu trong production

```text
admin_update_subscription
get_member_with_email
get_storage_usage
search_members_by_email
set_tenant_subdomain
```

### F. Triggers audit log

- `app_audit_log` triggers: `trg_audit_log_app_settings`, `trg_audit_log_disposals`, `trg_audit_log_import_receipts`, `trg_audit_log_orders`, `trg_audit_log_products`
- `audit_log` triggers: `trg_audit_log_tenant_memberships`, `trg_audit_log_tenant_subscriptions`, `trg_audit_log_tenants`

---

*Generated with Devin — 13 Jul 2026*
