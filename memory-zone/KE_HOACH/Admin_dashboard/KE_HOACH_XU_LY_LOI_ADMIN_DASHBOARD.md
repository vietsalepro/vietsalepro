# Kế hoạch xử lý lỗi Admin dashboard

> Mục đích: lên lịch trình chi tiết để fix toàn bộ lỗi code, logic và migration SQL của Admin dashboard đã phát hiện trong audit.
> Nguyên tắc: mỗi phase nhỏ, testable, rollback rõ ràng, ưu tiên critical → high → medium → low.

---

## 1. Tổng quan lỗi đã phát hiện

| Nhóm | Số lượng ước tính | Mức độ cao nhất |
|---|---|---|
| Migration SQL | 12+ | CRITICAL |
| Type / API query | 5+ | HIGH |
| React logic / state | 8+ | HIGH |
| Billing / subscription | 5+ | HIGH |
| Security / RLS | 6+ | HIGH |
| UI/UX (confirm/alert) | 10+ | MEDIUM |
| Polish / tech debt | 8+ | LOW |

---

## 2. Roadmap tổng thể

```
Phase 1 — Migration SQL an toàn (CRITICAL)
Phase 2 — Type safety & API query (HIGH)
Phase 3 — React logic / state management (HIGH)
Phase 4 — Billing / subscription logic (HIGH)
Phase 5 — Security / RLS / bootstrap (HIGH)
Phase 6 — UI/UX polish (MEDIUM)
Phase 7 — Testing, verification & sign-off
```

Mỗi phase được chia thành **sub-plan** nhỏ (1-3 ngày làm việc). Khuyến nghị chạy `npm run lint` và test migration trên staging sau mỗi phase.

---

## 3. Phase chi tiết

### Phase 1 — Migration SQL an toàn (CRITICAL)

**Mục tiêu:** loại bỏ các lỗi migration có thể gây mất dữ liệu hoặc bảo mật.

#### 1.1. Sửa logic drop CHECK constraint trong P1 / P7.0 / P18.1
- **File liên quan:**
  - `supabase/migrations/20250706000000_phase_p1_tenant_list_core_management.sql`
  - `supabase/migrations/20250706000006_phase_p7_0_read_only_tenant_infra.sql`
  - `supabase/migrations/20260708000000_phase_p18_1_tenant_isolation.sql`
- **Công việc:**
  - Thay vòng lặp drop mọi CHECK constraint trên `tenants.status`, chỉ drop constraint có tên cụ thể hoặc kiểm tra tên chứa `status`.
  - Đảm bảo `tenants_status_check` được tạo lại với đúng enum (`active, suspended, trial, pending, archived, read_only`).
- **Acceptance:** migration chạy idempotent, không drop constraint khác ngoài `tenants_status_check`.

#### 1.2. Thêm kiểm tra quyền cho `purge_archived_tenants()`
- **File liên quan:** `supabase/migrations/20250706000000_phase_p1_tenant_list_core_management.sql`
- **Công việc:**
  - Đổi procedure thành function hoặc thêm `IF NOT is_system_admin() THEN RAISE EXCEPTION ... END IF;` đầu hàm.
  - Đảm bảo chỉ system admin mới có thể xóa cứng tenant.
- **Acceptance:** user thường gọi function bị từ chối quyền.

#### 1.3. An toàn hóa restore tenant (P14.2)
- **File liên quan:** `supabase/migrations/20250708000005_phase_p14_2_restore_archive.sql`
- **Công việc:**
  - Trước khi DELETE dữ liệu cũ, tạo snapshot/backup của tenant hiện tại (insert vào bảng tạm hoặc export JSON).
  - Hoặc thêm parameter `p_confirm_overwrite BOOLEAN` bắt buộc `true` mới thực hiện.
  - Thực hiện DELETE + INSERT trong một transaction.
- **Acceptance:** restore accidental không làm mất dữ liệu cũ vĩnh viễn.

#### 1.4. Tăng entropy backup code 2FA
- **File liên quan:** `supabase/migrations/20250708000013_phase_p17_1_2fa_totp.sql`
- **Công việc:**
  - Đổi `gen_random_bytes(4)` thành `gen_random_bytes(16)` (128-bit entropy).
  - Cập nhật UI / validation cho phép nhập chuỗi dài hơn.
  - Cân nhắc thêm rate limit brute-force trên `verify_backup_code`.
- **Acceptance:** backup code có ít nhất 16 ký tự hex / 8 bytes entropy.

#### 1.5. Khống chế SSRF trong billing reminder
- **File liên quan:** `supabase/migrations/20250707000000_phase_p9_1_billing_reminders.sql`
- **Công việc:**
  - Validate `function_url` phải bắt đầu bằng `https://` và thuộc whitelist domain.
  - Chặn IP nội mạng, localhost, metadata URL.
- **Acceptance:** chỉ domain/platform được phép mới được gọi.

#### 1.6. Fix `system_admins` RLS / function overload
- **File liên quan:** `supabase/migrations/20260708000004_fix_system_admin_rls.sql`
- **Công việc:**
  - Thêm `SET search_path = public` cho các function `SECURITY DEFINER` liên quan system admin.
  - Sửa `ON CONFLICT ... DO UPDATE SET user_id = EXCLUDED.user_id` thành cập nhật `updated_at` hoặc bỏ upsert dư thừa.
- **Acceptance:** function chạy đúng, không có no-op.

---

### Phase 2 — Type safety & API query (HIGH)

**Mục tiêu:** loại bỏ `any` ép kiểu và fix truy vấn Supabase sai.

#### 2.1. Chuyển `TenantPlan` thành union type
- **File liên quan:** `types/tenant.ts`, `pages/SystemAdminDashboard.tsx`
- **Công việc:**
  - Đổi `export type TenantPlan = string;` thành `export type TenantPlan = 'free' | 'vip';` (hoặc thêm `'enterprise'` nếu có).
  - Cập nhật `PLANS` array, `planLabel`, và các select option.
- **Acceptance:** `tsc --noEmit` pass, không còn `as TenantPlan` tùy tiện.

#### 2.2. Sửa truy vấn `getCurrentUserTenants`
- **File liên quan:** `services/tenantService.ts`
- **Công việc:**
  - Thay `.select('tenant_id (*)')` bằng cú pháp embedded resource đúng: `.select('tenant_id, tenants(*)')` hoặc join explicit.
  - Xử lý trường hợp user chưa đăng nhập (throw hoặc return `[]`).
- **Acceptance:** trả về đúng danh sách tenant object, không phải row rỗng.

#### 2.3. Type hóa `supabase.functions.invoke`
- **File liên quan:** `services/tenantService.ts`, `services/operationsService.ts`, `services/tenantBackupService.ts`, `services/tenantRestoreService.ts`
- **Công việc:**
  - Cấu hình typed Supabase client hoặc dùng `supabase.functions.invoke<ResponseType>(...)`.
  - Xóa các ép kiểu `(supabase as any)`.
- **Acceptance:** không còn `(supabase as any)` trong codebase.

#### 2.4. Validate response shape trong service
- **File liên quan:** `services/systemAdminService.ts`, `services/loginHistoryService.ts`
- **Công việc:**
  - Kiểm tra `data.success`, `data.userId`, `data.email` tồn tại trước khi return.
  - Thêm runtime validation cho date string trong `getAdminLoginAlerts`.
- **Acceptance:** service throw error rõ ràng khi backend trả về cấu trúc không mong muốn.

---

### Phase 3 — React logic / state management (HIGH)

**Mục tiêu:** fix các lỗi state, effect, validation trên `SystemAdminDashboard`.

#### 3.1. Tách thông báo success/error
- **File liên quan:** `pages/SystemAdminDashboard.tsx`
- **Công việc:**
  - Thêm state `success: string | null`.
  - `handleRestoreSubmit`, `handleResetDemo` gán `setSuccess(...)` thay vì `setError(...)`.
  - Render success banner màu xanh, error banner màu đỏ.
- **Acceptance:** thao tác thành công hiển thị màu xanh, thất bại hiển thị màu đỏ.

#### 3.2. Fix useEffect dependency array
- **File liên quan:** `pages/SystemAdminDashboard.tsx`
- **Công việc:**
  - Đưa `load`, `loadMembers`, `loadOverview`, `loadRateLimitLogs`, `loadSystemAdmins`, `loadLoginHistory`, `loadOperations` vào dependency array HOẶC bọc trong `useCallback` với đúng deps.
  - Hoặc refactor thành `useEffect` inline call để tránh stale closure.
- **Acceptance:** ESLint exhaustive-deps không còn warning trên file này.

#### 3.3. Validate subdomain / tenant form client-side
- **File liên quan:** `pages/SystemAdminDashboard.tsx`
- **Công việc:**
  - Validate subdomain: chỉ chữ thường, số, dấu gạch ngang; độ dài 3-63; không bắt đầu/kết thúc bằng dấu gạch.
  - Tích hợp `checkSubdomain` hoặc `subdomainCheck` state vào form create.
  - Disable submit nếu subdomain không hợp lệ hoặc đã tồn tại.
- **Acceptance:** form không submit nếu subdomain không hợp lệ.

#### 3.4. Fix `impersonatingTenantId` / loading state
- **File liên quan:** `pages/SystemAdminDashboard.tsx`
- **Công việc:**
  - Kiểm tra lại `impersonatingTenantId` có được dùng đúng (disabled button) hay là dead code.
  - Nếu dead code, xóa.
- **Acceptance:** không còn state không được sử dụng.

#### 3.5. `calculateProration` chính xác theo ngày thực
- **File liên quan:** `pages/SystemAdminDashboard.tsx`
- **Công việc:**
  - Tính số ngày còn lại dựa trên số ngày thực tế của tháng hiện tại thay vì cố định 30.
  - Cập nhật comment giải thích rõ tính toán.
- **Acceptance:** proration hiển thị đúng với tháng 28/31 ngày.

---

### Phase 4 — Billing / subscription logic (HIGH)

**Mục tiêu:** đọc giá động, đồng bộ counter, tránh ghi đè limits tùy chỉnh.

#### 4.1. Đọc giá từ bảng `plans`
- **File liên quan:**
  - `supabase/migrations/20250706000008_phase_p7_2_invoice_create_pricing.sql`
  - `supabase/migrations/20250706000010_phase_p7_5_expiry_renewal_cron.sql`
- **Công việc:**
  - Thay `69000`, `59000` hardcode bằng `SELECT monthly_price FROM plans WHERE key = 'vip'`.
  - Xử lý fallback nếu bảng `plans` chưa có dữ liệu.
- **Acceptance:** đổi giá trong bảng `plans` thì invoice và renewal tự động cập nhật.

#### 4.2. Atomic expire/renewal invoice
- **File liên quan:** `supabase/migrations/20250706000010_phase_p7_5_expiry_renewal_cron.sql`, `20250707000002_phase_p9_2_billing_automation_dashboard.sql`
- **Công việc:**
  - Gộp update `status` và `billing_status` vào một `UPDATE ... FROM` hoặc dùng trigger.
  - Thêm advisory lock hoặc `SELECT ... FOR UPDATE` để tránh race condition cron chạy đồng thời.
- **Acceptance:** chạy 2 instance cron cùng lúc không xử lý trùng invoice.

#### 4.3. Bảo toàn custom limits khi đổi gói
- **File liên quan:** `supabase/migrations/20250706000001_phase_p2_subscription_usage.sql`
- **Công việc:**
  - Chỉ áp default limits khi admin explicit đổi plan **và** không truyền custom limits; nếu truyền custom limits thì giữ nguyên.
  - Hoặc tách endpoint "đổi gói" và "cập nhật limits".
- **Acceptance:** đổi từ VIP về Free với custom limits vẫn giữ được custom limits.

#### 4.4. Đồng bộ `current_month_orders`
- **File liên quan:** `supabase/migrations/20250706000001_phase_p2_subscription_usage.sql`
- **Công việc:**
  - Nếu `current_month_start` khác tháng hiện tại, cập nhật DB về 0 và tháng hiện tại.
  - Hoặc tách logic reset ra trigger/cron chạy đầu tháng.
- **Acceptance:** usage hiển thị đúng ngay cả khi chưa có đơn hàng tháng mới.

#### 4.5. Voucher / promotion fixes
- **File liên quan:** `supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql`, `20250707000004_phase_p10_2_voucher_invoice_apply.sql`
- **Công việc:**
  - Không cho apply voucher sau khi invoice đã paid.
  - Áp dụng `max_discount_amount` khi tính % discount.
  - Xử lý bonus months không chồng chéo expiry hiện tại.
- **Acceptance:** voucher không thể áp sau thanh toán, discount bị giới hạn đúng.

---

### Phase 5 — Security / RLS / bootstrap (HIGH)

**Mục tiêu:** chặn leo thang đặc quyền, đảm bảo admin bootstrap.

#### 5.1. Fix `support_tickets_update` policy
- **File liên quan:** `supabase/migrations/20250707000005_phase_p11_1_ticket_schema_backend.sql`
- **Công việc:**
  - Tách policy: creator chỉ được update `content`/`title`; chỉ admin/assigned mới được update `assigned_to`, `status`, `priority`.
- **Acceptance:** user tạo ticket không thể tự đổi status thành `resolved`.

#### 5.2. Fix `system_settings.updated_by` bypass
- **File liên quan:** `supabase/migrations/20250706000005_phase_p6_operations_support.sql`, `20250706000007_phase_p7_1_billing_schema_bank_config.sql`
- **Công việc:**
  - Thay `DEFAULT auth.uid()` bằng trigger `BEFORE INSERT OR UPDATE` set `updated_by = auth.uid()`.
- **Acceptance:** insert/update không thể giả mạo `updated_by`.

#### 5.3. Fix `search_path` cho SECURITY DEFINER
- **File liên quan:** nhiều migration (P3, P17.1, fix_system_admin_rls, v.v.)
- **Công việc:**
  - Thêm `SET search_path = public` vào mọi function `SECURITY DEFINER`.
  - Kiểm tra lại các function dùng `auth.users`.
- **Acceptance:** không còn function SECURITY DEFINER thiếu `search_path`.

#### 5.4. Bootstrap system admin đầu tiên
- **File liên quan:** `supabase/migrations/20250704000000_phase2_tenant_foundation.sql`
- **Công việc:**
  - Thêm seed SQL hoặc edge function để tạo system admin đầu tiên từ biến môi trường / service role.
  - Hoặc tạo migration seed mặc định với placeholder email cần thay đổi sau deploy.
- **Acceptance:** sau khi deploy lần đầu, có ít nhất 1 system admin hợp lệ.

#### 5.5. Fix `notification_logs` RLS
- **File liên quan:** `supabase/migrations/20250708000000_phase_p12_3_notification_log.sql`
- **Công việc:**
  - Policy SELECT thêm điều kiện `is_tenant_member(tenant_id)`.
- **Acceptance:** user không thuộc tenant không đọc được log.

#### 5.6. Webhook URL validation
- **File liên quan:** `supabase/migrations/20250708000008_phase_p15_2_webhooks.sql`
- **Công việc:**
  - Chặn URL nội mạng / metadata, chỉ cho public HTTPS.
- **Acceptance:** webhook URL phải là public domain HTTPS.

---

### Phase 6 — UI/UX polish (MEDIUM)

**Mục tiêu:** thay `confirm`/`alert`, cải thiện shell components.

#### 6.1. Thay `window.confirm()` bằng ConfirmDialog
- **File liên quan:** `pages/SystemAdminDashboard.tsx`, `components/BillingConfig.tsx`, `components/VoucherManager.tsx`, `components/WebhookManager.tsx`, v.v.
- **Công việc:**
  - Dùng component `ConfirmDialog` hoặc `MasterModal` có sẵn trong project.
  - Truyền title, description, confirmText, cancelText, onConfirm.
- **Acceptance:** không còn `window.confirm()` trong Admin dashboard.

#### 6.2. Thay `alert()` bằng toast / modal
- **File liên quan:** `pages/SystemAdminDashboard.tsx` (reset password), `components/WebhookManager.tsx`, `components/TwoFactorManager.tsx`
- **Công việc:**
  - Dùng `ToastContainer` hoặc inline modal để hiển thị kết quả.
- **Acceptance:** không còn `window.alert()` trong Admin dashboard.

#### 6.3. Fix `AdminShell` page header
- **File liên quan:** `components/AdminShell.tsx`
- **Công việc:**
  - Xóa empty `admin-shell__topbar-center` nếu không dùng.
  - Render `pageTitle` trong `admin-shell__page-header`.
- **Acceptance:** page title hiển thị đúng 2 vị trí (topbar + page header).

#### 6.4. Fix `AdminSidebar` responsive
- **File liên quan:** `components/AdminSidebar.tsx`
- **Công việc:**
  - Thay `window.innerWidth` + resize listener bằng `window.matchMedia('(max-width: 767px)')` với listener thay đổi.
  - Thêm debounce nếu vẫn cần resize listener.
- **Acceptance:** sidebar phản ứng đúng trên mobile/tablet, không re-render liên tục khi resize.

#### 6.5. Fix `AdminTabs` refs
- **File liên quan:** `components/AdminTabs.tsx`
- **Công việc:**
  - Reset `tabRefs.current` khi `tabs` thay đổi, hoặc dùng Map thay vì array.
  - Xóa ref cũ khi tab bị xóa.
- **Acceptance:** thêm/xóa tab không gây lỗi focus.

#### 6.6. Fix `AdminKpiCards` trend zero
- **File liên quan:** `components/AdminKpiCards.tsx`
- **Công việc:**
  - Khi `trend === 0`, render icon neutral (—) thay vì mũi tên lên.
  - Đổi `key={index}` thành `key={card.label}`.
- **Acceptance:** trend 0 hiển thị đúng.

---

### Phase 7 — Testing, verification & sign-off

#### 7.1. Unit / integration test
- Viết test cho:
  - `calculateProration`
  - `mapTenantFromDB`
  - `planLabel`
  - `validateBackup` (nếu cần)
- Chạy `npm run test` (vitest) pass.

#### 7.2. Type check
- `npm run lint` pass không warning mới.

#### 7.3. Migration test
- Chạy migration trên Supabase local / staging từ đầu.
- Kiểm tra `supabase migration up` không lỗi.
- Kiểm tra RLS bằng test user thường và system admin.

#### 7.4. Manual QA checklist
- [ ] Tạo tenant với subdomain hợp lệ / không hợp lệ.
- [ ] Archive và restore tenant.
- [ ] Đổi gói subscription, kiểm tra custom limits.
- [ ] Backup / restore tenant.
- [ ] Reset demo data.
- [ ] Impersonate tenant active.
- [ ] Apply voucher trước/sau thanh toán.
- [ ] 2FA setup + backup code.
- [ ] Create / remove system admin.
- [ ] Test các modal confirm và toast.

#### 7.5. Security review
- Kiểm tra lại tất cả function `SECURITY DEFINER` có `search_path`.
- Kiểm tra SSRF / internal URL bị chặn.
- Kiểm tra bootstrap system admin.

---

## 4. Thứ tự ưu tiên thực hiện

1. **Phase 1** (migration CRITICAL) trước tiên — vì ảnh hưởng dữ liệu & bảo mật.
2. **Phase 5** (security/bootstrap) song song với Phase 1 — cùng nhóm migration.
3. **Phase 2** (type/API) — nền tảng cho các phase sau.
4. **Phase 4** (billing) — logic kinh doanh nhạy cảm.
5. **Phase 3** (React logic) — UI chính.
6. **Phase 6** (UI/UX) — trải nghiệm.
7. **Phase 7** — test & sign-off.

---

## 5. Rủi ro & rollback

| Rủi ro | Giảm thiểu |
|---|---|
| Migration sửa constraint gây lỗi constraint hiện tại | Chạy trên local/staging trước, backup schema |
| Restore tenant xóa nhầm dữ liệu | Thêm confirm + snapshot trước DELETE |
| Đổi `TenantPlan` thành union gây lỗi compile ở chỗ khác | Chạy `tsc` sau mỗi bước, thêm plan vào union nếu cần |
| Thay `window.confirm()` gây lỗi flow async | Giữ logic xác nhận, chỉ đổi UI |
| Billing atomic update phức tạp | Test với nhiều invoice concurrent |

---

## 6. File liên quan cần thay đổi

### SQL Migration
- `supabase/migrations/20250706000000_phase_p1_tenant_list_core_management.sql`
- `supabase/migrations/20250706000001_phase_p2_subscription_usage.sql`
- `supabase/migrations/20250706000002_phase_p3_member_management.sql`
- `supabase/migrations/20250706000003_phase_p4_system_analytics.sql`
- `supabase/migrations/20250706000004_phase_p5_audit_security.sql`
- `supabase/migrations/20250706000005_phase_p6_operations_support.sql`
- `supabase/migrations/20250706000006_phase_p7_0_read_only_tenant_infra.sql`
- `supabase/migrations/20250706000007_phase_p7_1_billing_schema_bank_config.sql`
- `supabase/migrations/20250706000008_phase_p7_2_invoice_create_pricing.sql`
- `supabase/migrations/20250706000010_phase_p7_5_expiry_renewal_cron.sql`
- `supabase/migrations/20250707000000_phase_p9_1_billing_reminders.sql`
- `supabase/migrations/20250707000005_phase_p11_1_ticket_schema_backend.sql`
- `supabase/migrations/20250708000000_phase_p12_3_notification_log.sql`
- `supabase/migrations/20250708000013_phase_p17_1_2fa_totp.sql`
- `supabase/migrations/20250708000014_phase_p17_2_login_history.sql`
- `supabase/migrations/20250708000005_phase_p14_2_restore_archive.sql`
- `supabase/migrations/20260708000004_fix_system_admin_rls.sql`
- `supabase/migrations/20250708000008_phase_p15_2_webhooks.sql`

### Frontend
- `pages/SystemAdminDashboard.tsx`
- `services/tenantService.ts`
- `services/systemAdminService.ts`
- `services/loginHistoryService.ts`
- `services/operationsService.ts`
- `services/tenantBackupService.ts`
- `services/tenantRestoreService.ts`
- `types/tenant.ts`
- `components/AdminShell.tsx`
- `components/AdminSidebar.tsx`
- `components/AdminTabs.tsx`
- `components/AdminKpiCards.tsx`
- `components/BillingConfig.tsx`
- `components/VoucherManager.tsx`
- `components/WebhookManager.tsx`
- `components/TwoFactorManager.tsx`

---

*Lập kế hoạch: Devin*
*Ngày: 2026-07-09*
