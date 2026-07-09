# KẾ HOẠCH SUB-PHASE — XỬ LÝ LỖI ADMIN DASHBOARD (AI Session / aisess)

> **Handoff type:** AI Session (aisess) — mỗi mục là **1 task chat**  
> **Ngày lập:** 2026-07-09  
> **Nguồn:** `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_XU_LY_LOI_ADMIN_DASHBOARD.md`  
> **Mục tiêu:** Chia 7 phase lớn thành **26 sub-phase / 26 task chat**, mỗi chat được thiết kế để vừa trong **~200K context**, độc lập, testable, rollback rõ ràng.  
> **Nguyên tắc:** critical → high → medium, ưu tiên migration + security trước, mỗi chat pass `npm run lint` + `npm run build` trước khi handoff sang chat tiếp theo.

---

## 0. Quy tắc 200K context & cách handoff

### Context bị tiêu ở đâu

Mỗi chat có ~200K context. Ngưỡng bị phình nhanh nhất:

1. Đọc file lớn (ví dụ `pages/SystemAdminDashboard.tsx` ~2.456 dòng / ~112KB).
2. Đọc nhiều migration SQL dài trong 1 chat.
3. Output lỗi `npm run lint` / `npm run build` dài, đặc biệt TypeScript.
4. Nhiều vòng lặp sửa lỗi → mỗi vòng lại đọc lại file + output.

### Phân loại tải context

| Mức | File cần chạm | Khuyến nghị |
|-----|---------------|-------------|
| **Nhẹ** | 1 file nhỏ (<200 dòng) hoặc 2-3 file trung bình | 1 chat đủ |
| **Vừa** | 1-2 migration / 1-2 component / 1 service vừa | 1 chat đủ, cẩn thận |
| **Nặng** | File lớn (`SystemAdminDashboard.tsx`) hoặc 3+ migration | Có thể 1 chat, nhưng **không gộp thêm việc** |
| **Rất nặng** | RLS cross-cutting + nhiều bảng, hoặc 5+ migration | **Bắt buộc chia** |

### Luật chuyển chat khi context đầy

- Nếu chat đang làm **chưa xong** mà context sắp đầy → **dừng ở điểm tự nhiên** (ví dụ: xong 1 file, còn 1 file chưa xong), lưu trạng thái vào handoff, chat tiếp theo đọc handoff đó.
- Nếu chat **xong sub-phase** → handoff sang sub-phase kế tiếp.
- Mỗi chat **phải** để lại: (a) những gì đã làm, (b) file nào đã sửa, (c) lỗi/limit còn tồn, (d) sub-phase tiếp theo.

---

## 1. Bảng tổng hợp 26 sub-phase (task chat)

| # | Mã | Sub-phase | Mục (gốc) | Mức độ | Tải context | Files chính |
|---|----|-----------|-----------|--------|-------------|-------------|
| 1 | **F1** | P1.1a — Constraint & purge permission | 1.1 (P1+P18.1), 1.2, 1.6 | CRITICAL | Vừa | `20250706000000_phase_p1…`, `20260708000000_phase_p18_1…`, `20260708000004_fix_system_admin_rls.sql` |
| 2 | **F2** | P1.1b — Read-only tenant infra constraint | 1.1 (P7.0) | CRITICAL | Vừa | `20250706000006_phase_p7_0_read_only_tenant_infra.sql` |
| 3 | **F3** | P1.2a — Restore tenant snapshot | 1.3 | CRITICAL | Nhẹ | `20250708000005_phase_p14_2_restore_archive.sql` |
| 4 | **F4** | P1.2b — 2FA backup code entropy | 1.4 | CRITICAL | Nhẹ | `20250708000013_phase_p17_1_2fa_totp.sql` + UI validation |
| 5 | **F5** | P1.2c — Billing reminder SSRF | 1.5 | CRITICAL | Nhẹ | `20250707000000_phase_p9_1_billing_reminders.sql` |
| 6 | **F6** | P2.1 — TenantPlan union & tenant query | 2.1, 2.2 | HIGH | Vừa | `types/tenant.ts`, `services/tenantService.ts`, `pages/SystemAdminDashboard.tsx` (phần PLANS) |
| 7 | **F7** | P2.2 — Type invoke & response validation | 2.3, 2.4 | HIGH | Vừa | `services/systemAdminService.ts`, `loginHistoryService.ts`, `operationsService.ts`, `tenantBackupService.ts`, `tenantRestoreService.ts` |
| 8 | **F8** | P3.1a — React success/error & dead state | 3.1, 3.4 | HIGH | Nặng | `pages/SystemAdminDashboard.tsx` |
| 9 | **F9** | P3.1b — React useEffect dependencies | 3.2 | HIGH | Nặng | `pages/SystemAdminDashboard.tsx` |
| 10 | **F10** | P3.2 — Subdomain & proration | 3.3, 3.5 | HIGH | Nặng | `pages/SystemAdminDashboard.tsx` |
| 11 | **F11** | P4.1 — Dynamic pricing | 4.1 | HIGH | Nhẹ | `20250706000008_phase_p7_2_invoice_create_pricing.sql`, `20250706000010_phase_p7_5_expiry_renewal_cron.sql` |
| 12 | **F12** | P4.2 — Atomic expire/renewal | 4.2 | HIGH | Vừa | `20250706000010_phase_p7_5_expiry_renewal_cron.sql`, `20250707000002_phase_p9_2_billing_automation_dashboard.sql` |
| 13 | **F13** | P4.3 — Usage counter & custom limits | 4.3, 4.4 | HIGH | Nhẹ | `20250706000001_phase_p2_subscription_usage.sql` |
| 14 | **F14** | P4.4 — Voucher fixes | 4.5 | HIGH | Vừa | `20250707000003_phase_p10_1_voucher_promotion_schema.sql`, `20250707000004_phase_p10_2_voucher_invoice_apply.sql` |
| 15 | **F15** | P5.1a — Ticket policy | 5.1 | HIGH | Vừa | `20250707000005_phase_p11_1_ticket_schema_backend.sql` |
| 16 | **F16** | P5.1b — system_settings updated_by trigger | 5.2 | HIGH | Vừa | `20250706000005_phase_p6_operations_support.sql`, `20250706000007_phase_p7_1_billing_schema_bank_config.sql` |
| 17 | **F17** | P5.1c — search_path audit (core/security) | 5.3 (phần) | HIGH | Vừa | Các migration P1, P2, P3, P5, P7.0, P18.1, fix_system_admin_rls |
| 18 | **F18** | P5.1d — search_path audit (billing/ops/2FA/webhook) | 5.3 (phần) | HIGH | Nặng | Các migration P6, P7.1, P9.1, P9.2, P10.1, P10.2, P11.1, P12.3, P14.2, P15.2, P17.1 |
| 19 | **F19** | P5.1e — Notification logs & webhook URL | 5.5, 5.6 | HIGH | Vừa | `20250708000000_phase_p12_3_notification_log.sql`, `20250708000008_phase_p15_2_webhooks.sql` |
| 20 | **F20** | P5.2 — Bootstrap system admin | 5.4 | HIGH | Nhẹ | `20250704000000_phase2_tenant_foundation.sql` |
| 21 | **F21** | P6.1a — SystemAdminDashboard confirm/alert | 6.1, 6.2 (phần) | MEDIUM | Nặng | `pages/SystemAdminDashboard.tsx` |
| 22 | **F22** | P6.1b — BillingConfig & TwoFactorManager confirm/alert | 6.1, 6.2 (phần) | MEDIUM | Vừa | `components/BillingConfig.tsx`, `components/TwoFactorManager.tsx` |
| 23 | **F23** | P6.1c — VoucherManager & WebhookManager confirm/alert | 6.1, 6.2 (phần) | MEDIUM | Vừa | `components/VoucherManager.tsx`, `components/WebhookManager.tsx` |
| 24 | **F24** | P6.2 — Shell components polish | 6.3, 6.4, 6.5, 6.6 | MEDIUM | Nhẹ | `components/AdminShell.tsx`, `AdminSidebar.tsx`, `AdminTabs.tsx`, `AdminKpiCards.tsx` |
| 25 | **F25** | P7.1 — Tests & type check | 7.1, 7.2 | MEDIUM | Vừa | Tests + code đã sửa |
| 26 | **F26** | P7.2 — Migration QA & security review | 7.3, 7.4, 7.5 | MEDIUM | Vừa | Toàn bộ migrations + UI |

---

## 2. Thứ tự thực hiện & dependency

```
F1  → F2  → F3  → F4  → F5
│
└── F15 → F16 → F17 → F18 → F19 → F20

Sau security foundation:
F6  → F7  → F8  → F9  → F10

Sau React fixes:
F11 → F12 → F13 → F14

Sau billing fixes:
F21 → F22 → F23 → F24

Cuối:
F25 → F26
```

**Có thể chạy song song:**
- F1–F5 (migration CRITICAL) có thể chạy song song với F15–F20 (security) vì đụng file migration khác nhau.
- F6/F7 (type/API) có thể chạy song song với F17/F18 (search_path) nếu đủ chat.

**Không chạy song song:**
- F6/F7 phải xong trước F8–F10 (React logic).
- F1/F2 phải xong trước F11–F14 (billing dùng `tenants.status`).
- F20 (bootstrap) nên xong trước F26 (security review cần test admin).

---

## 3. Chi tiết từng task chat (handoff)

> Mỗi mục dưới đây là nội dung cho **1 task chat**.  
> Khi bắt đầu chat, đọc mục tương ứng, chạy theo steps, rồi handoff sang mục tiếp theo.

---

### F1 — P1.1a: Constraint & purge permission

**Từ:** Khởi đầu (hoặc từ master plan).  
**Mục gốc:** 1.1 (phần P1 + P18.1), 1.2, 1.6.

**Files cần đọc / sửa:**
- `supabase/migrations/20250706000000_phase_p1_tenant_list_core_management.sql` (251 dòng)
- `supabase/migrations/20260708000000_phase_p18_1_tenant_isolation.sql` (156 dòng)
- `supabase/migrations/20260708000004_fix_system_admin_rls.sql` (53 dòng)

**Công việc:**
1. Thay vòng lặp drop mọi CHECK constraint trên `tenants.status` bằng drop constraint có tên cụ thể (`tenants_status_check`).
2. Recreate `tenants_status_check` với enum `active, suspended, trial, pending, archived, read_only`.
3. Thêm `IF NOT is_system_admin() THEN RAISE EXCEPTION ...` đầu `purge_archived_tenants()` trong P1.
4. Thêm `SET search_path = public` cho các function `SECURITY DEFINER` trong `fix_system_admin_rls.sql`; sửa `ON CONFLICT ... DO UPDATE SET user_id = EXCLUDED.user_id` thành cập nhật `updated_at` hoặc bỏ upsert dư thừa.

**Acceptance:**
- Migration chạy idempotent; không drop constraint khác ngoài `tenants_status_check`.
- User thường gọi `purge_archived_tenants()` bị từ chối quyền.
- Không còn function SD thiếu `search_path` trong các file trên.
- `npm run lint` + `npm run build` pass.

**Rollback:** Backup 3 file migration gốc; nếu lỗi, revert và chạy lại trên local/staging.

**Handoff sang:** F2.

---

### F2 — P1.1b: Read-only tenant infra constraint

**Từ:** F1.  
**Mục gốc:** 1.1 (phần P7.0).

**Files cần đọc / sửa:**
- `supabase/migrations/20250706000006_phase_p7_0_read_only_tenant_infra.sql` (825 dòng)

**Công việc:**
1. Sửa logic drop CHECK constraint trong P7.0: chỉ drop `tenants_status_check`, không drop mọi constraint.
2. Đảm bảo `read_only` có trong enum của `tenants_status_check`.

**Acceptance:**
- Migration chạy idempotent; không drop constraint khác.
- Enum đúng: `active, suspended, trial, pending, archived, read_only`.
- `npm run lint` + `npm run build` pass.

**Rollback:** Backup P7.0 migration; revert nếu lỗi.

**Handoff sang:** F3.

---

### F3 — P1.2a: Restore tenant snapshot

**Từ:** F2.  
**Mục gốc:** 1.3.

**Files cần đọc / sửa:**
- `supabase/migrations/20250708000005_phase_p14_2_restore_archive.sql` (180 dòng)

**Công việc:**
1. Trước khi `DELETE` dữ liệu cũ trong restore, tạo snapshot JSON hoặc insert vào bảng tạm.
2. Thêm parameter `p_confirm_overwrite BOOLEAN` bắt buộc `true` mới thực hiện.
3. Thực hiện `DELETE + INSERT` trong một transaction.

**Acceptance:**
- Restore accidental không làm mất dữ liệu cũ vĩnh viễn.
- `npm run lint` + `npm run build` pass.

**Rollback:** Backup P14.2 migration; revert nếu lỗi.

**Handoff sang:** F4.

---

### F4 — P1.2b: 2FA backup code entropy

**Từ:** F3.  
**Mục gốc:** 1.4.

**Files cần đọc / sửa:**
- `supabase/migrations/20250708000013_phase_p17_1_2fa_totp.sql` (239 dòng)
- UI input validation nếu cần (tìm trong `pages/SystemAdminDashboard.tsx` / `components/TwoFactorManager.tsx`)

**Công việc:**
1. Đổi `gen_random_bytes(4)` thành `gen_random_bytes(16)` (128-bit entropy).
2. Cập nhật UI / validation cho phép nhập chuỗi dài hơn.
3. Cân nhắc thêm rate limit brute-force trên `verify_backup_code`.

**Acceptance:**
- Backup code có ít nhất 16 ký tự hex / 8 bytes entropy (khuyến nghị 32 ký tự).
- `npm run lint` + `npm run build` pass.

**Rollback:** Backup P17.1 migration; revert nếu lỗi.

**Handoff sang:** F5.

---

### F5 — P1.2c: Billing reminder SSRF

**Từ:** F4.  
**Mục gốc:** 1.5.

**Files cần đọc / sửa:**
- `supabase/migrations/20250707000000_phase_p9_1_billing_reminders.sql` (269 dòng)

**Công việc:**
1. Validate `function_url` phải bắt đầu bằng `https://` và thuộc whitelist domain.
2. Chặn IP nội mạng, localhost, metadata URL.

**Acceptance:**
- Chỉ domain/platform được phép mới được gọi.
- `npm run lint` + `npm run build` pass.

**Rollback:** Backup P9.1 migration; revert nếu lỗi.

**Handoff sang:** F15 (song song với F1–F5) hoặc F6 (nếu đã xong security).

---

### F6 — P2.1: TenantPlan union & tenant query

**Từ:** F5 (hoặc bắt đầu sau khi migration CRITICAL xong).  
**Mục gốc:** 2.1, 2.2.

**Files cần đọc / sửa:**
- `types/tenant.ts` (575 dòng)
- `services/tenantService.ts` (546 dòng)
- `pages/SystemAdminDashboard.tsx` (chỉ phần `PLANS`, `planLabel`, select option)

**Công việc:**
1. Đổi `export type TenantPlan = string;` thành `export type TenantPlan = 'free' | 'vip';` (hoặc thêm `'enterprise'` nếu có).
2. Cập nhật `PLANS` array, `planLabel`, các select option.
3. Sửa `getCurrentUserTenants`: `.select('tenant_id, tenants(*)')` hoặc join explicit; xử lý user chưa đăng nhập (throw hoặc return `[]`).

**Acceptance:**
- `tsc --noEmit` pass.
- Không còn `as TenantPlan` tùy tiện.
- `getCurrentUserTenants` trả về đúng danh sách tenant object.
- `npm run lint` + `npm run build` pass.

**Rollback:** Revert `types/tenant.ts` và `services/tenantService.ts`; kiểm tra tất cả caller của `TenantPlan`.

**Handoff sang:** F7.

---

### F7 — P2.2: Type invoke & response validation

**Từ:** F6.  
**Mục gốc:** 2.3, 2.4.

**Files cần đọc / sửa:**
- `services/tenantService.ts`
- `services/operationsService.ts` (87 dòng)
- `services/tenantBackupService.ts` (23 dòng)
- `services/tenantRestoreService.ts` (63 dòng)
- `services/systemAdminService.ts` (93 dòng)
- `services/loginHistoryService.ts` (154 dòng)

**Công việc:**
1. Cấu hình typed Supabase client hoặc dùng `supabase.functions.invoke<ResponseType>(...)`.
2. Xóa các ép kiểu `(supabase as any)`.
3. Validate `data.success`, `data.userId`, `data.email` tồn tại trước khi return.
4. Thêm runtime validation cho date string trong `getAdminLoginAlerts`.

**Acceptance:**
- Không còn `(supabase as any)` trong codebase.
- Service throw lỗi rõ ràng khi backend trả cấu trúc không mong muốn.
- `npm run lint` + `npm run build` pass.

**Rollback:** Revert các service; kiểm tra lỗi compile nếu type thay đổi.

**Handoff sang:** F8.

---

### F8 — P3.1a: React success/error & dead state

**Từ:** F7.  
**Mục gốc:** 3.1, 3.4.

**Files cần đọc / sửa:**
- `pages/SystemAdminDashboard.tsx` (2.456 dòng — file lớn, chỉ đọc phần state + handlers)

**Công việc:**
1. Thêm state `success: string | null`.
2. `handleRestoreSubmit`, `handleResetDemo` gán `setSuccess(...)` thay vì `setError(...)`.
3. Render success banner màu xanh, error banner màu đỏ.
4. Kiểm tra `impersonatingTenantId` có dùng đúng hay là dead code; nếu dead thì xóa.

**Acceptance:**
- Thao tác thành công hiển thị banner xanh, thất bại banner đỏ.
- Không còn state không được sử dụng.
- `npm run lint` + `npm run build` pass.

**Rollback:** Revert `SystemAdminDashboard.tsx` nếu lỗi UI.

**Handoff sang:** F9.

---

### F9 — P3.1b: React useEffect dependencies

**Từ:** F8.  
**Mục gốc:** 3.2.

**Files cần đọc / sửa:**
- `pages/SystemAdminDashboard.tsx` (chỉ phần `useEffect` và các hàm `load*`, `loadMembers`, `loadOverview`, `loadRateLimitLogs`, `loadSystemAdmins`, `loadLoginHistory`, `loadOperations`)

**Công việc:**
1. Đưa các hàm `load*` vào dependency array HOẶC bọc trong `useCallback` với đúng deps.
2. Hoặc refactor thành `useEffect` inline call để tránh stale closure.

**Acceptance:**
- ESLint `exhaustive-deps` không còn warning trên file này.
- Không gây infinite loop sau khi fix deps.
- `npm run lint` + `npm run build` pass.

**Rollback:** Revert `SystemAdminDashboard.tsx` nếu lỗi.

**Handoff sang:** F10.

---

### F10 — P3.2: Subdomain & proration

**Từ:** F9.  
**Mục gốc:** 3.3, 3.5.

**Files cần đọc / sửa:**
- `pages/SystemAdminDashboard.tsx` (phần form tạo tenant + tính proration)
- `services/tenantService.ts` (nếu cần gọi `checkSubdomain`)

**Công việc:**
1. Validate subdomain: chỉ chữ thường, số, dấu gạch ngang; độ dài 3–63; không bắt đầu/kết thúc bằng dấu gạch.
2. Tích hợp `checkSubdomain` / `subdomainCheck` state vào form create.
3. Disable submit nếu subdomain không hợp lệ hoặc đã tồn tại.
4. Tính số ngày còn lại dựa trên số ngày thực tế của tháng hiện tại (không cố định 30); cập nhật comment.

**Acceptance:**
- Form không submit nếu subdomain không hợp lệ.
- Proration hiển thị đúng với tháng 28/31 ngày.
- `npm run lint` + `npm run build` pass.

**Rollback:** Revert các hàm validate/proration trong `SystemAdminDashboard.tsx`.

**Handoff sang:** F11.

---

### F11 — P4.1: Dynamic pricing

**Từ:** F10 (hoặc sau F5 nếu chạy song song).  
**Mục gốc:** 4.1.

**Files cần đọc / sửa:**
- `supabase/migrations/20250706000008_phase_p7_2_invoice_create_pricing.sql` (153 dòng)
- `supabase/migrations/20250706000010_phase_p7_5_expiry_renewal_cron.sql` (148 dòng)

**Công việc:**
1. Thay `69000`, `59000` hardcode bằng `SELECT monthly_price FROM plans WHERE key = 'vip'`.
2. Xử lý fallback nếu bảng `plans` chưa có dữ liệu.

**Acceptance:**
- Đổi giá trong bảng `plans` thì invoice và renewal tự động cập nhật.
- `npm run lint` + `npm run build` pass.

**Rollback:** Backup 2 migration; revert nếu lỗi.

**Handoff sang:** F12.

---

### F12 — P4.2: Atomic expire/renewal

**Từ:** F11.  
**Mục gốc:** 4.2.

**Files cần đọc / sửa:**
- `supabase/migrations/20250706000010_phase_p7_5_expiry_renewal_cron.sql` (148 dòng)
- `supabase/migrations/20250707000002_phase_p9_2_billing_automation_dashboard.sql` (459 dòng)

**Công việc:**
1. Gộp update `status` và `billing_status` vào một `UPDATE ... FROM` hoặc dùng trigger.
2. Thêm advisory lock hoặc `SELECT ... FOR UPDATE` để tránh race condition cron chạy đồng thời.

**Acceptance:**
- Chạy 2 instance cron cùng lúc không xử lý trùng invoice.
- `npm run lint` + `npm run build` pass.

**Rollback:** Backup 2 migration; revert nếu lỗi.

**Handoff sang:** F13.

---

### F13 — P4.3: Usage counter & custom limits

**Từ:** F12.  
**Mục gốc:** 4.3, 4.4.

**Files cần đọc / sửa:**
- `supabase/migrations/20250706000001_phase_p2_subscription_usage.sql` (187 dòng)

**Công việc:**
1. Chỉ áp default limits khi admin explicit đổi plan **và** không truyền custom limits; nếu truyền custom limits thì giữ nguyên. Hoặc tách endpoint.
2. Nếu `current_month_start` khác tháng hiện tại, cập nhật DB về 0 và tháng hiện tại. Hoặc tách logic reset ra trigger/cron đầu tháng.

**Acceptance:**
- Đổi từ VIP về Free với custom limits vẫn giữ được custom limits.
- Usage hiển thị đúng ngay cả khi chưa có đơn hàng tháng mới.
- `npm run lint` + `npm run build` pass.

**Rollback:** Backup P2 migration; revert nếu lỗi.

**Handoff sang:** F14.

---

### F14 — P4.4: Voucher fixes

**Từ:** F13.  
**Mục gốc:** 4.5.

**Files cần đọc / sửa:**
- `supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql` (253 dòng)
- `supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql` (336 dòng)

**Công việc:**
1. Không cho apply voucher sau khi invoice đã paid.
2. Áp dụng `max_discount_amount` khi tính % discount.
3. Xử lý bonus months không chồng chéo expiry hiện tại.

**Acceptance:**
- Voucher không thể áp sau thanh toán.
- Discount bị giới hạn đúng `max_discount_amount`.
- Bonus months không chồng chéo.
- `npm run lint` + `npm run build` pass.

**Rollback:** Backup 2 migration; revert nếu lỗi.

**Handoff sang:** F21 (nếu UI billing confirm/alert cần xử lý) hoặc F25 (nếu đến giai đoạn test).

---

### F15 — P5.1a: Ticket policy

**Từ:** F5 (hoặc song song với F1–F5).  
**Mục gốc:** 5.1.

**Files cần đọc / sửa:**
- `supabase/migrations/20250707000005_phase_p11_1_ticket_schema_backend.sql` (302 dòng)

**Công việc:**
1. Tách `support_tickets_update` policy: creator chỉ được update `content`/`title`; chỉ admin/assigned mới được update `assigned_to`, `status`, `priority`.

**Acceptance:**
- User tạo ticket không thể tự đổi status thành `resolved`.
- `npm run lint` + `npm run build` pass.

**Rollback:** Backup P11.1 migration; revert nếu lỗi.

**Handoff sang:** F16.

---

### F16 — P5.1b: system_settings updated_by trigger

**Từ:** F15.  
**Mục gốc:** 5.2.

**Files cần đọc / sửa:**
- `supabase/migrations/20250706000005_phase_p6_operations_support.sql` (415 dòng)
- `supabase/migrations/20250706000007_phase_p7_1_billing_schema_bank_config.sql` (198 dòng)

**Công việc:**
1. Thay `DEFAULT auth.uid()` bằng trigger `BEFORE INSERT OR UPDATE` set `updated_by = auth.uid()`.

**Acceptance:**
- Insert/update không thể giả mạo `updated_by`.
- `npm run lint` + `npm run build` pass.

**Rollback:** Backup 2 migration; revert nếu lỗi.

**Handoff sang:** F17.

---

### F17 — P5.1c: search_path audit (core / security)

**Từ:** F16.  
**Mục gốc:** 5.3 (phần core / tenant / security).

**Files cần đọc / sửa:**
- `supabase/migrations/20250706000000_phase_p1_tenant_list_core_management.sql`
- `supabase/migrations/20250706000001_phase_p2_subscription_usage.sql`
- `supabase/migrations/20250706000002_phase_p3_member_management.sql`
- `supabase/migrations/20250706000004_phase_p5_audit_security.sql`
- `supabase/migrations/20250706000006_phase_p7_0_read_only_tenant_infra.sql`
- `supabase/migrations/20260708000000_phase_p18_1_tenant_isolation.sql`
- `supabase/migrations/20260708000004_fix_system_admin_rls.sql`

**Công việc:**
1. Thêm `SET search_path = public` vào mọi function `SECURITY DEFINER` trong các migration core/security.
2. Kiểm tra các function dùng `auth.users`.

**Acceptance:**
- Không còn function SD thiếu `search_path` trong các file trên.
- `npm run lint` + `npm run build` pass.

**Rollback:** Backup các migration; revert nếu lỗi.

**Handoff sang:** F18.

---

### F18 — P5.1d: search_path audit (billing / ops / 2FA / webhook / notification)

**Từ:** F17.  
**Mục gốc:** 5.3 (phần còn lại).

**Files cần đọc / sửa:**
- `supabase/migrations/20250706000005_phase_p6_operations_support.sql`
- `supabase/migrations/20250706000007_phase_p7_1_billing_schema_bank_config.sql`
- `supabase/migrations/20250706000008_phase_p7_2_invoice_create_pricing.sql`
- `supabase/migrations/20250706000010_phase_p7_5_expiry_renewal_cron.sql`
- `supabase/migrations/20250707000000_phase_p9_1_billing_reminders.sql`
- `supabase/migrations/20250707000002_phase_p9_2_billing_automation_dashboard.sql`
- `supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql`
- `supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql`
- `supabase/migrations/20250707000005_phase_p11_1_ticket_schema_backend.sql`
- `supabase/migrations/20250708000000_phase_p12_3_notification_log.sql`
- `supabase/migrations/20250708000005_phase_p14_2_restore_archive.sql`
- `supabase/migrations/20250708000008_phase_p15_2_webhooks.sql`
- `supabase/migrations/20250708000013_phase_p17_1_2fa_totp.sql`
- `supabase/migrations/20250708000014_phase_p17_2_login_history.sql`

**Công việc:**
1. Thêm `SET search_path = public` vào mọi function `SECURITY DEFINER` trong các migration còn lại.
2. Dùng grep `SECURITY DEFINER` để tìm toàn bộ, chỉ sửa những hàm thiếu.

**Acceptance:**
- Không còn function SD thiếu `search_path` trong toàn bộ codebase migration.
- `npm run lint` + `npm run build` pass.

**Rollback:** Backup các migration; revert nếu lỗi.

**Handoff sang:** F19.

---

### F19 — P5.1e: Notification logs & webhook URL

**Từ:** F18.  
**Mục gốc:** 5.5, 5.6.

**Files cần đọc / sửa:**
- `supabase/migrations/20250708000000_phase_p12_3_notification_log.sql` (254 dòng)
- `supabase/migrations/20250708000008_phase_p15_2_webhooks.sql` (547 dòng)

**Công việc:**
1. Policy `SELECT` của `notification_logs` thêm điều kiện `is_tenant_member(tenant_id)`.
2. Webhook URL chặn nội mạng / metadata; chỉ cho public HTTPS.

**Acceptance:**
- User không thuộc tenant không đọc được log.
- Webhook URL phải là public domain HTTPS.
- `npm run lint` + `npm run build` pass.

**Rollback:** Backup 2 migration; revert nếu lỗi.

**Handoff sang:** F20.

---

### F20 — P5.2: Bootstrap system admin

**Từ:** F19.  
**Mục gốc:** 5.4.

**Files cần đọc / sửa:**
- `supabase/migrations/20250704000000_phase2_tenant_foundation.sql` (182 dòng)
- (Tùy chọn) Edge function `create-system-admin` đã có sẵn — có thể dùng lại.

**Công việc:**
1. Thêm seed SQL hoặc gọi Edge Function để tạo system admin đầu tiên từ biến môi trường / service role.
2. Hoặc tạo migration seed placeholder email cần thay đổi sau deploy.

**Acceptance:**
- Sau deploy lần đầu, có ít nhất 1 system admin hợp lệ.
- Không hardcode password/secret trong migration.
- `supabase migration up` pass.

**Rollback:** Xóa seed nếu tạo user sai; cập nhật email/password qua Supabase dashboard.

**Handoff sang:** F6 (hoặc F21 nếu F6–F10 đã xong).

---

### F21 — P6.1a: SystemAdminDashboard confirm/alert

**Từ:** F10 (hoặc F20).  
**Mục gốc:** 6.1, 6.2 (trong `SystemAdminDashboard.tsx`).

**Files cần đọc / sửa:**
- `pages/SystemAdminDashboard.tsx` (tìm `confirm(` và `alert(`)

**Công việc:**
1. Thay `window.confirm()` bằng `ConfirmDialog` / `MasterModal` có sẵn.
2. Thay `window.alert()` bằng toast / inline modal.
3. Giữ logic xác nhận async; chỉ đổi UI.

**Acceptance:**
- Không còn `window.confirm()` / `window.alert()` trong `SystemAdminDashboard.tsx`.
- Các flow async vẫn chờ user confirm trước khi thực hiện.
- `npm run lint` + `npm run build` pass.

**Rollback:** Revert `SystemAdminDashboard.tsx` nếu modal gây lỗi flow.

**Handoff sang:** F22.

---

### F22 — P6.1b: BillingConfig & TwoFactorManager confirm/alert

**Từ:** F21.  
**Mục gốc:** 6.1, 6.2 (trong 2 component này).

**Files cần đọc / sửa:**
- `components/BillingConfig.tsx` (380 dòng)
- `components/TwoFactorManager.tsx` (422 dòng)

**Công việc:**
1. Thay `window.confirm()` / `window.alert()` trong 2 component bằng component/modal/toast có sẵn.

**Acceptance:**
- Không còn `confirm`/`alert` trong 2 file.
- `npm run lint` + `npm run build` pass.

**Rollback:** Revert 2 file nếu lỗi.

**Handoff sang:** F23.

---

### F23 — P6.1c: VoucherManager & WebhookManager confirm/alert

**Từ:** F22.  
**Mục gốc:** 6.1, 6.2 (trong 2 component này).

**Files cần đọc / sửa:**
- `components/VoucherManager.tsx` (758 dòng)
- `components/WebhookManager.tsx` (501 dòng)

**Công việc:**
1. Thay `window.confirm()` / `window.alert()` trong 2 component bằng component/modal/toast có sẵn.

**Acceptance:**
- Không còn `confirm`/`alert` trong 2 file.
- `npm run lint` + `npm run build` pass.

**Rollback:** Revert 2 file nếu lỗi.

**Handoff sang:** F24.

---

### F24 — P6.2: Shell components polish

**Từ:** F23.  
**Mục gốc:** 6.3, 6.4, 6.5, 6.6.

**Files cần đọc / sửa:**
- `components/AdminShell.tsx` (193 dòng)
- `components/AdminSidebar.tsx` (239 dòng)
- `components/AdminTabs.tsx` (93 dòng)
- `components/AdminKpiCards.tsx` (100 dòng)

**Công việc:**
1. 6.3: Xóa empty `admin-shell__topbar-center`; render `pageTitle` trong `admin-shell__page-header`.
2. 6.4: Thay `window.innerWidth` + resize listener bằng `window.matchMedia('(max-width: 767px)')`; thêm debounce nếu cần.
3. 6.5: Reset `tabRefs.current` khi `tabs` thay đổi, hoặc dùng Map; xóa ref cũ khi tab bị xóa.
4. 6.6: Khi `trend === 0`, render icon neutral (`—`); đổi `key={index}` thành `key={card.label}`.

**Acceptance:**
- Page title hiển thị đúng 2 vị trí.
- Sidebar responsive, không re-render liên tục khi resize.
- Thêm/xóa tab không lỗi focus.
- Trend 0 hiển thị neutral.
- `npm run lint` + `npm run build` pass.

**Rollback:** Revert 4 component nếu layout bị vỡ.

**Handoff sang:** F25.

---

### F25 — P7.1: Tests & type check

**Từ:** F24 (hoặc bất kỳ lúc nào code đã ổn định).  
**Mục gốc:** 7.1, 7.2.

**Files cần đọc / sửa:**
- `tests/` — tạo hoặc bổ sung test file.
- Hàm `calculateProration`, `mapTenantFromDB`, `planLabel`, `validateBackup` (nếu có).

**Công việc:**
1. Viết test cho `calculateProration`, `mapTenantFromDB`, `planLabel`, `validateBackup` (nếu cần).
2. Chạy `npm run test` (vitest) pass.
3. Chạy `npm run lint` (tsc) pass, không warning mới.

**Acceptance:**
- `npx vitest run` pass.
- `npm run lint` pass.
- `npm run build` pass.

**Rollback:** Xóa/bỏ qua test nếu gây lỗi build; ưu tiên fix code.

**Handoff sang:** F26.

---

### F26 — P7.2: Migration QA & security review

**Từ:** F25.  
**Mục gốc:** 7.3, 7.4, 7.5.

**Files cần đọc / sửa:**
- Toàn bộ `supabase/migrations/`
- `pages/SystemAdminDashboard.tsx` (nếu QA phát hiện lỗi nhỏ)

**Công việc:**
1. 7.3: Chạy `supabase migration up` từ đầu trên local/staging; kiểm tra RLS bằng test user thường và system admin.
2. 7.4: Manual QA checklist:
   - Tạo tenant với subdomain hợp lệ / không hợp lệ.
   - Archive và restore tenant.
   - Đổi gói subscription, kiểm tra custom limits.
   - Backup / restore tenant.
   - Reset demo data.
   - Impersonate tenant active.
   - Apply voucher trước/sau thanh toán.
   - 2FA setup + backup code.
   - Create / remove system admin.
   - Test các modal confirm và toast.
3. 7.5: Security review: tất cả `SECURITY DEFINER` có `search_path`; SSRF / internal URL bị chặn; bootstrap system admin hoạt động.

**Acceptance:**
- `supabase migration up` không lỗi.
- QA checklist hoàn thành, không còn lỗi nghiêm trọng.
- Security review không còn lỗi HIGH.

**Rollback:** Nếu phát hiện lỗi nghiêm trọng, quay lại sub-phase tương ứng và sửa; không merge production cho đến khi pass.

**Handoff sang:** Kết thúc kế hoạch. Nếu còn lỗi phát sinh, tạo sub-phase F27

F27 — P7.6: Migration
Chạy `supabase migration up` từ đầu trên Production
---

## 4. Xử lý khi chat bị đầy context (contingency)

| Tình huống | Cách xử lý |
|------------|------------|
| Đang sửa `SystemAdminDashboard.tsx` (F8/F9/F10/F21) mà context đầy | Dừng ở 1 mục nhỏ (ví dụ: xong success banner, chưa xong dead state). Handoff ghi rõ phần đã xong / chưa xong. |
| Đang sửa nhiều migration SQL (F17/F18) mà context đầy | Chia theo file: chat này xong những migration đã đọc, chat sau tiếp tục các migration còn lại. |
| `npm run lint` trả về lỗi rất dài | Chỉ copy phần lỗi đầu tiên vào handoff; chat tiếp theo tập trung fix lỗi đó. |
| 1 sub-phase có vẻ quá nhẹ | Có thể gộp 2 sub-phase liên tiếp trong 1 chat, nhưng **không gộp 2 sub-phase nặng**. |

---

## 5. Files liên quan cần thay đổi (tổng hợp)

### SQL Migration
- `supabase/migrations/20250704000000_phase2_tenant_foundation.sql`
- `supabase/migrations/20250706000000_phase_p1_tenant_list_core_management.sql`
- `supabase/migrations/20250706000001_phase_p2_subscription_usage.sql`
- `supabase/migrations/20250706000002_phase_p3_member_management.sql`
- `supabase/migrations/20250706000004_phase_p5_audit_security.sql`
- `supabase/migrations/20250706000005_phase_p6_operations_support.sql`
- `supabase/migrations/20250706000006_phase_p7_0_read_only_tenant_infra.sql`
- `supabase/migrations/20250706000007_phase_p7_1_billing_schema_bank_config.sql`
- `supabase/migrations/20250706000008_phase_p7_2_invoice_create_pricing.sql`
- `supabase/migrations/20250706000010_phase_p7_5_expiry_renewal_cron.sql`
- `supabase/migrations/20250707000000_phase_p9_1_billing_reminders.sql`
- `supabase/migrations/20250707000002_phase_p9_2_billing_automation_dashboard.sql`
- `supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql`
- `supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql`
- `supabase/migrations/20250707000005_phase_p11_1_ticket_schema_backend.sql`
- `supabase/migrations/20250708000000_phase_p12_3_notification_log.sql`
- `supabase/migrations/20250708000005_phase_p14_2_restore_archive.sql`
- `supabase/migrations/20250708000008_phase_p15_2_webhooks.sql`
- `supabase/migrations/20250708000013_phase_p17_1_2fa_totp.sql`
- `supabase/migrations/20250708000014_phase_p17_2_login_history.sql`
- `supabase/migrations/20260708000000_phase_p18_1_tenant_isolation.sql`
- `supabase/migrations/20260708000004_fix_system_admin_rls.sql`

### Frontend
- `pages/SystemAdminDashboard.tsx`
- `types/tenant.ts`
- `services/tenantService.ts`
- `services/systemAdminService.ts`
- `services/loginHistoryService.ts`
- `services/operationsService.ts`
- `services/tenantBackupService.ts`
- `services/tenantRestoreService.ts`
- `components/AdminShell.tsx`
- `components/AdminSidebar.tsx`
- `components/AdminTabs.tsx`
- `components/AdminKpiCards.tsx`
- `components/BillingConfig.tsx`
- `components/VoucherManager.tsx`
- `components/WebhookManager.tsx`
- `components/TwoFactorManager.tsx`

---

*Lập kế hoạch sub-phase cho AI Session: Devin*  
*Ngày: 2026-07-09*
