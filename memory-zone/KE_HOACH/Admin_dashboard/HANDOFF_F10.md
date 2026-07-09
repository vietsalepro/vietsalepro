# Handoff — Admin Dashboard Sub-phases F10..F15

> Chat date: 2026-07-09
> Source: `KE_HOACH_XU_LY_LOI_ADMIN_DASHBOARD_SUB_PHASE.md`
> Tiếp theo: **F10 — P3.2: Subdomain & proration** + **F11 — P4.1: Dynamic pricing** + **F12 — P4.2: Atomic expire/renewal** + **F13 — P4.3: Usage counter & custom limits** + **F14 — P4.4: Voucher fixes** + **F15 — P5.1a: Ticket policy**
> Context: **~197.7 KB** — đã gộp F10..F15 để tận dụng 200K context trong 1 task chat. **Không gộp F16**.

---

## Đã làm xong (F9)

### F9 — P3.1b: React useEffect dependencies

- `pages/SystemAdminDashboard.tsx`
  - Bọc các hàm `load*` trong `useCallback` với đúng dependency.
  - Cập nhật dependency array của các `useEffect` tương ứng.
  - Xóa các comment bỏ qua `exhaustive-deps` không còn cần thiết.
- `npm run lint`: PASS
- `npm run build`: PASS

---

## Sub-phases tiếp theo (gộp F10..F15)

### F10 — P3.2: Subdomain & proration

Files cần đọc/sửa:
- `pages/SystemAdminDashboard.tsx` (phần form tạo tenant + tính proration)
- `services/tenantService.ts` (nếu cần gọi `checkSubdomain`)

Công việc:
1. Validate subdomain: chỉ chữ thường, số, dấu gạch ngang; độ dài 3–63; không bắt đầu/kết thúc bằng dấu gạch.
2. Tích hợp `checkSubdomain` / `subdomainCheck` state vào form create.
3. Disable submit nếu subdomain không hợp lệ hoặc đã tồn tại.
4. Tính số ngày còn lại dựa trên số ngày thực tế của tháng hiện tại (không cố định 30); cập nhật comment.

Acceptance:
- Form không submit nếu subdomain không hợp lệ.
- Proration hiển thị đúng với tháng 28/31 ngày.
- `npm run lint` + `npm run build` pass.

Rollback: Revert các hàm validate/proration trong `SystemAdminDashboard.tsx`.

---

### F11 — P4.1: Dynamic pricing

Files cần đọc/sửa:
- `supabase/migrations/20250706000008_phase_p7_2_invoice_create_pricing.sql` (153 dòng, ~4.3 KB)
- `supabase/migrations/20250706000010_phase_p7_5_expiry_renewal_cron.sql` (148 dòng, ~5.7 KB)

Công việc:
1. Thay `69000`, `59000` hardcode bằng `SELECT monthly_price FROM plans WHERE key = 'vip'`.
2. Xử lý fallback nếu bảng `plans` chưa có dữ liệu.

Acceptance:
- Đổi giá trong bảng `plans` thì invoice và renewal tự động cập nhật.
- `npm run lint` + `npm run build` pass.

Rollback: Backup 2 migration; revert nếu lỗi.

---

### F12 — P4.2: Atomic expire/renewal

Files cần đọc/sửa:
- `supabase/migrations/20250706000010_phase_p7_5_expiry_renewal_cron.sql` (~5.7 KB)
- `supabase/migrations/20250707000002_phase_p9_2_billing_automation_dashboard.sql` (459 dòng, ~15 KB)

Công việc:
1. Gộp update `status` và `billing_status` vào một `UPDATE ... FROM` hoặc dùng trigger.
2. Thêm advisory lock hoặc `SELECT ... FOR UPDATE` để tránh race condition cron chạy đồng thời.

Acceptance:
- Chạy 2 instance cron cùng lúc không xử lý trùng invoice.
- `npm run lint` + `npm run build` pass.

Rollback: Backup 2 migration; revert nếu lỗi.

---

### F13 — P4.3: Usage counter & custom limits

Files cần đọc/sửa:
- `supabase/migrations/20250706000001_phase_p2_subscription_usage.sql` (187 dòng, ~7.1 KB)

Công việc:
1. Chỉ áp default limits khi admin explicit đổi plan **và** không truyền custom limits; nếu truyền custom limits thì giữ nguyên. Hoặc tách endpoint.
2. Nếu `current_month_start` khác tháng hiện tại, cập nhật DB về 0 và tháng hiện tại. Hoặc tách logic reset ra trigger/cron đầu tháng.

Acceptance:
- Đổi từ VIP về Free với custom limits vẫn giữ được custom limits.
- Usage hiển thị đúng ngay cả khi chưa có đơn hàng tháng mới.
- `npm run lint` + `npm run build` pass.

Rollback: Backup P2 migration; revert nếu lỗi.

---

### F14 — P4.4: Voucher fixes

Files cần đọc/sửa:
- `supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql` (~10 KB)
- `supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql` (~11.7 KB)

Công việc:
1. Không cho apply voucher sau khi invoice đã paid.
2. Áp dụng `max_discount_amount` khi tính % discount.
3. Xử lý bonus months không chồng chéo expiry hiện tại.

Acceptance:
- Voucher không thể áp sau thanh toán.
- Discount bị giới hạn đúng `max_discount_amount`.
- Bonus months không chồng chéo.
- `npm run lint` + `npm run build` pass.

Rollback: Backup 2 migration; revert nếu lỗi.

---

### F15 — P5.1a: Ticket policy

Files cần đọc/sửa:
- `supabase/migrations/20250707000005_phase_p11_1_ticket_schema_backend.sql` (~10.7 KB)

Công việc:
1. Tách `support_tickets_update` policy: creator chỉ được update `content`/`title`; chỉ admin/assigned mới được update `assigned_to`, `status`, `priority`.

Acceptance:
- User tạo ticket không thể tự đổi status thành `resolved`.
- `npm run lint` + `npm run build` pass.

Rollback: Backup P11.1 migration; revert nếu lỗi.

---

## Verification tổng hợp (F10..F15)

- `npm run lint`: PASS
- `npm run build`: PASS
- Subdomain validation hoạt động đúng trên form create tenant.
- Proration tính đúng ngày thực tế của tháng hiện tại.
- Các migration billing/voucher/ticket đã được cập nhật và backup.

---

## Context assessment

- F10 đơn lẻ chỉ ~127.5 KB (SystemAdminDashboard.tsx + tenantService.ts), dưới ngưỡng 200K context.
- Đã gộp F10..F15 để tận dụng context (~197.7 KB), bao gồm 1 frontend fix + 5 backend migration fixes.
- F16 (P5.1b: system_settings updated_by trigger) nếu gộp thêm sẽ vượt 200K, nên để riêng cho task chat sau.
- Handoff sang: **F16**.
