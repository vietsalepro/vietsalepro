# KẾ HOẠCH SUB-PHASE — ADMIN DASHBOARD (chia theo giới hạn 200K context)

> **Ngày lập:** 2026-07-06
> **Nguồn:** Chia nhỏ từ `KE_HOACH_ADMIN_DASHBOARD.md` (18 phase, 4 giai đoạn).
> **Lý do:** Mỗi phiên Devin (Windsurf) chỉ có **~200K context limit**. Phase nào khi implement vượt quá 200K sẽ được chia thành nhiều **sub-phase**, mỗi sub-phase gọn để một phiên làm xong (đọc code → viết code → `npm run lint` + `npm run build` pass → handoff).
> **Nguyên tắc:** Mỗi sub-phase phải **tự đứng độc lập** (lint + build pass), có **backup trước khi sửa**, và để lại **handoff** cho sub-phase kế tiếp.

---

## 0. Cách ước lượng "vượt 200K context"

Context của một phiên bị tiêu bởi: prompt hệ thống + tool (~15K), đọc file kế hoạch/handoff, đọc code hiện có để nắm pattern, viết migration + component mới, **output của lint/build (đặc biệt lỗi TS thường rất dài)**, và **số vòng lặp sửa lỗi** (mỗi lần build lại đọc lại output).

Yếu tố làm phình context nhanh nhất:
1. **Số file phải chạm** (mỗi read + edit tốn context, iterate thì re-read).
2. **Thay đổi cross-cutting** (ví dụ sửa RLS trên nhiều bảng → phải đọc nhiều migration cũ).
3. **Tạo nhiều bảng DB mới + RLS + nhiều RPC cùng lúc.**
4. **Tính năng cần dependency mới** (PDF, email) → đọc docs + thử nghiệm.
5. **File hiện có lớn** (ví dụ `pages/Dashboard.tsx` 954 dòng).

Quy ước đánh giá: **Nhẹ / Vừa / Nặng / Rất nặng**.
- **Nhẹ–Vừa** → 1 phiên đủ → **giữ nguyên 1 sub-phase**.
- **Nặng / Rất nặng** → **chia sub-phase**.

Trạng thái codebase hiện tại (tham chiếu để ước lượng):
`SystemAdminDashboard.tsx` 193 dòng · `tenantService.ts` 209 · `subscriptionService.ts` 64 · `auditService.ts` 85 · `Dashboard.tsx` 954 · `AuditLog.tsx` 189 · Edge Functions sẵn có: `audit-log, check-subdomain, create-tenant, invite-member, process-checkout, reset-password` · 22 migration.

---

## 1. Bảng tổng hợp phân bổ sub-phase

| Phase | Tên | Tải context | Chia? | Số sub-phase |
|---|---|---|---|---|
| P1 | Tenant list & core management | Vừa | Không | 1 |
| P2 | Subscription & usage | Vừa | Không | 1 |
| P3 | Member management | Vừa | Không | 1 |
| P4 | System analytics | Vừa | Không | 1 |
| P5 | Audit & security | Vừa (giáp ngưỡng) | Không | 1 |
| P6 | Operations & support cơ bản | Vừa | Không | 1 |
| **P7** | **Invoicing & payment** | **Rất nặng** | **Có** | **6** |
| P8 | Plan builder & feature flags (YAGNI) | Vừa | Có (nhẹ) | 2 |
| P9 | Billing automation & reminders | Vừa | Có (nhẹ) | 2 |
| **P10** | **Refund/credit/proration & promotions** | **Nặng** | **Có** | **3** |
| **P11** | **Support tickets & KB** | **Nặng** | **Có** | **3** |
| **P12** | **Communications & announcements** | **Nặng** | **Có** | **3** |
| **P13** | **System observability & health** | **Rất nặng** | **Có** | **4** |
| **P14** | **Tenant data operations** | **Nặng** | **Có** | **3** |
| P15 | API platform & webhooks (YAGNI) | Nặng | Có | 3 |
| P16 | Advanced analytics & BI (YAGNI) | Vừa | Có (nhẹ) | 2 |
| **P17** | **Compliance & security hardening** | **Nặng** | **Có** | **4** |
| P18 | Multi-region & enterprise (YAGNI) | Nặng | Có | 3 |

**Tổng:** 6 phase giữ nguyên + 12 phase chia → **~44 sub-phase**.
**Chốt:** Các phase **vượt 200K rõ rệt cần chia bắt buộc: P7, P10, P11, P12, P13, P14, P17.** (P8/P15/P16/P18 là YAGNI/tầm nhìn — chia sẵn để tham chiếu, chỉ làm khi có nhu cầu thực.)

---

## GIAI ĐOẠN 1: FOUNDATION (P1–P6) — giữ nguyên, mỗi phase 1 phiên

> Các phase này **không cần chia**. Mỗi phase chạm 3–6 file, thêm vài RPC + 1 vùng UI trong dashboard, 1 migration. Một phiên đủ.

### P1 — Tenant list & core management *(giữ nguyên, giáp ngưỡng trên)*
- **Backend:** RPC `search_tenants`, `update_tenant`, `delete_tenant_safe` (**soft delete** — set `status='archived'`, KHÔNG hard delete, theo §21.2); migration thêm `archived` (+ `archived_at`) vào CHECK constraint `tenants.status`; cron purge tenant `archived` > 30 ngày.
- **Frontend:** KPI cards, thanh tìm kiếm, filter status/plan, bảng phân trang, modal edit, nút xóa (soft) + khôi phục.
- **Verification:** lint + build; test tạo/sửa/xóa/khôi phục/tìm kiếm/phân trang.
- ⚠️ **Lưu ý ngưỡng:** nếu trong lúc làm thấy phình context (do sửa constraint + cron + UI), tách frontend thành phiên riêng.

### P2 — Subscription & usage *(giữ nguyên)*
- **Backend:** RPC `get_tenant_usage_summary`, `update_tenant_subscription`, `reset_monthly_order_counter`.
- **Frontend:** expand row usage, progress bar user/product/order, badge cảnh báo >80%, form nâng/hạ gói + custom limits + `billing_status` + `expires_at`.
- **Verification:** test nâng/hạ gói, cảnh báo gần giới hạn, trigger `check_tenant_limits` vẫn chạy.

### P3 — Member management *(giữ nguyên)*
- **Backend:** dùng lại Edge Function `invite-member`, `reset-password`; `tenantService.updateMemberRole/removeMember`.
- **Frontend:** tab "Thành viên", bảng member, form mời, dropdown đổi role, xóa member, reset password.
- **Verification:** test mời/đổi role/xóa/reset; không vượt giới hạn user của gói.
- **Ghi chú:** Impersonation (§21.3) **KHÔNG** làm ở đây — đã dời sang **P11.3** để P3 gọn.

### P4 — System analytics *(giữ nguyên)*
- **Backend:** RPC `get_system_overview`, `get_top_tenants`, `get_tenant_growth`.
- **Frontend:** tab "Tổng quan", KPI cards (tái dùng component từ `Dashboard.tsx`), chart tenant mới, bảng top tenant, tenant sắp hết hạn/giới hạn.
- **Verification:** test RPC với dữ liệu lớn; system admin xem toàn bộ tenant.

### P5 — Audit & security *(giữ nguyên, giáp ngưỡng)*
- **Backend:** mở rộng `getAuditLogs` (filter tenant/user/action/table/date); RPC `get_rate_limit_logs`; RPC `add_system_admin`, `remove_system_admin`.
- **Frontend:** tab "Audit log" (tái dùng `AuditLog.tsx`), tab "Rate limit", tab "System admins".
- **Verification:** test filter audit; rate-limit chỉ system admin; thêm/xóa system admin.

### P6 — Operations & support cơ bản *(giữ nguyên)*
- **Backend:** RPC `get_data_retention_status`, `get_default_plan_limits`, `set_default_plan_limits`, `set_maintenance_mode`.
- **Frontend:** tab "Vận hành" (retention cron, cấu hình giới hạn mặc định Free/VIP, maintenance toggle + message), export CSV tenant, kiểm tra subdomain trong form tạo.
- **Verification:** test export CSV, maintenance mode.

---

## GIAI ĐOẠN 2: BILLING & MONETIZATION (P7–P10)

### P7 — Invoicing & payment records — **RẤT NẶNG → CHIA 6 SUB-PHASE**

> Lý do vượt 200K: 4–6 bảng mới + RLS, nhiều RPC, PDF (dep mới), Edge Function Resend, 2 cron, timezone, **cộng thêm việc rework RLS read-only trên TẤT CẢ bảng nghiệp vụ (§18.6)**. Không thể làm 1 phiên.

#### P7.0 — Hạ tầng read-only tenant (§18.6) — *BẮT BUỘC làm trước tiên*
- **Backend:** migration thêm `read_only` vào CHECK `tenants.status`; helper `public.is_tenant_writable(p_tenant_id UUID) RETURNS BOOLEAN` (`STABLE, SECURITY DEFINER`); sửa RLS **INSERT/UPDATE/DELETE** thêm `is_tenant_writable(tenant_id)` cho các bảng nghiệp vụ (orders, order_items, products, product_lots, customers, import_receipts, …) — **SELECT giữ nguyên**; guard `is_tenant_writable` đầu `process_checkout` + các RPC ghi, trả lỗi `TENANT_READ_ONLY`.
- **Frontend:** banner "Tài khoản hết hạn — vui lòng thanh toán" + disable nút tạo/sửa khi `status='read_only'` hoặc gặp lỗi `TENANT_READ_ONLY`.
- **Verification:** user tenant read-only: SELECT pass, INSERT/UPDATE/DELETE bị chặn.
- ⚠️ Phiên này nặng vì phải đọc nhiều migration RLS cũ → **không gộp thêm việc khác**.

#### P7.1 — Schema billing + cấu hình ngân hàng/công ty
- **Backend:** bảng `invoices`, `invoice_items`, `payments`, `bank_accounts` + RLS + số hóa đơn (cột + sequence chuẩn bị cho quy tắc `INV-2026-0001`); `bankAccountService`.
- **Frontend:** trang cấu hình ngân hàng (tên TK, số TK, ngân hàng, nội dung CK) + thông tin công ty/thương hiệu/MST (admin tự nhập, §17.1).
- **Verification:** CRUD bank account + company info; lint + build.

#### P7.2 — RPC tạo hóa đơn + đánh số + tính giá
- **Backend:** RPC tạo hóa đơn (manual + chuẩn bị cho cron), đánh số tự động `INV-YYYY-####`, tính giá theo chu kỳ tháng/năm (69k/tháng, 59k/tháng khi mua năm) + `bonus_months`, cho phép trả trước tự do (cộng dồn `expires_at`); **mọi mốc thời gian theo Asia/Ho_Chi_Minh**.
- **Frontend:** form tạo hóa đơn thủ công cho 1 tenant.
- **Verification:** tạo hóa đơn tháng/năm/trả trước; số hóa đơn không trùng.

#### P7.3 — Xác nhận thanh toán + vòng đời trạng thái
- **Backend:** RPC `confirm_payment` (ghi `payments`, cập nhật `billing_status` + `expires_at` + cộng `bonus_months`, chuyển `read_only → active`); trạng thái hóa đơn `pending/paid/overdue/cancelled/expired`; **cho phép confirm trên hóa đơn `expired`** → kích hoạt lại ngay (§21.1).
- **Frontend:** nút "Xác nhận thanh toán" trên chi tiết hóa đơn.
- **Verification:** confirm hóa đơn pending & expired → tenant active lại + ghi được dữ liệu.

#### P7.4 — UI quản lý hóa đơn + xuất PDF
- **Frontend:** danh sách + chi tiết hóa đơn, đếm ngược 48 giờ, badge trạng thái; **xuất PDF client-side** (jsPDF/pdfmake — theo §21.1, ưu tiên tái dùng pattern export Excel sẵn có).
- **Backend:** không (dùng lại RPC P7.1–P7.3).
- **Verification:** render + export PDF đúng thông tin ngân hàng/công ty/countdown.

#### P7.5 — Cron hết hạn + cron tạo hóa đơn gia hạn + email Resend
- **Backend:** `pg_cron` chuyển hóa đơn `pending` quá 48h → `expired` + tenant → `read_only`; cron tạo hóa đơn gia hạn **N=7 ngày** trước `expires_at`; Edge Function gửi email qua **Resend** (nhắc thanh toán + xác nhận), API key trong Supabase secrets.
- **Verification:** giả lập hóa đơn quá hạn → tenant read-only; email gửi thành công (test).
- **Ghi chú:** `promo_codes`/`promotion_rules` **KHÔNG** tạo ở P7 (dời sang P10 để tránh phình). Trong P7 chỉ để **cột giảm giá nullable** trên `invoices` sẵn sàng cho voucher.

---

### P8 — Plan builder & feature flags — **YAGNI (hoãn vô thời hạn, §13)** — chia sẵn 2 sub-phase
> Đã chốt chỉ Free/VIP hardcode. **KHÔNG tạo bảng `plans` trước.** Chỉ làm khi cần thêm gói mới.
- **P8.1** — schema `plans` + CRUD backend + migrate Free/VIP sang bảng.
- **P8.2** — feature flags qua `tenants.settings` JSONB (không tạo bảng `tenant_features`) + toggle UI theo tenant.

---

### P9 — Billing automation & reminders — **Vừa → chia nhẹ 2 sub-phase**
> Phần tối thiểu (cron hết hạn + cron gia hạn) đã kéo vào **P7.5**. P9 là phần nâng cao.
- **P9.1** — Lịch nhắc nhiều mốc (T-7/T-3/T-1) + email template billing (tái dùng Resend P7.5); cấu hình reminder.
- **P9.2** — Dashboard automation trạng thái billing (danh sách sắp hết hạn/quá hạn, dunning), log job chạy.

---

### P10 — Refund/credit/proration & promotions — **NẶNG → CHIA 3 SUB-PHASE**
> Đã chốt **KHÔNG hoàn tiền** (§21.3): bỏ refund/negative payment; credit hoãn. Trọng tâm còn lại: **voucher/promotion**.

#### P10.1 — Schema voucher/promotion + CRUD backend
- **Backend:** bảng `promo_codes`, `promotion_rules`, bảng theo dõi lượt dùng (per-tenant + global) + RLS; service.
- **Verification:** CRUD voucher/promotion; lint + build.

#### P10.2 — RPC áp dụng voucher/promotion vào hóa đơn
- **Backend:** RPC apply voucher (mỗi hóa đơn 1 voucher, có thể kết hợp voucher + promotion "mua năm tặng x tháng"); enforce giới hạn per-tenant + tổng số lần; điều kiện đối tượng (tenant mới N ngày / gói cụ thể / tenant cụ thể); nối vào cột giảm giá của `invoices` (P7).
- **Verification:** voucher 10% + tặng tháng tính đúng; vượt giới hạn bị chặn.

#### P10.3 — UI voucher + cảnh báo hết hạn (+ proration review)
- **Frontend:** quản lý voucher/promotion, badge/danh sách voucher sắp hết hạn (7 ngày) + đã hết hạn; ô nhập voucher khi thanh toán (tenant); form proration khi đổi gói (admin review thủ công — nhẹ).
- **Verification:** nhập voucher → hóa đơn tự tính lại; cảnh báo hiển thị đúng.

---

## GIAI ĐOẠN 3: SUPPORT & SCALE (P11–P14)

### P11 — Support tickets & knowledge base — **NẶNG → CHIA 3 SUB-PHASE**
> KB là **YAGNI** (hoãn Giai đoạn 3, §14.2) → không làm trong P11.

#### P11.1 — Schema ticket + backend
- **Backend:** bảng `support_tickets`, `ticket_replies`, `ticket_reply_templates` + RLS; status `open/in_progress/waiting_customer/resolved/closed`; phân loại `bug/billing/support/feature_request`; gán admin phụ trách; service.
- **Verification:** CRUD ticket + reply + template; lint + build.

#### P11.2 — UI ticket inbox + reply + email
- **Frontend:** inbox, chi tiết, assign, reply, template reply, link ticket ↔ tenant; email thông báo cập nhật ticket (tái dùng Resend).
- **Verification:** tạo/gán/trả lời ticket; email gửi.

#### P11.3 — Impersonation "Login as tenant admin" (§21.3)
- **Backend:** Edge Function service-role tạo phiên impersonate; audit log đầy đủ (ai, tenant nào, lúc nào, bao lâu).
- **Frontend:** nút "Login as", **banner cảnh báo rõ ràng** khi đang impersonate.
- **Verification:** impersonate ghi audit; thoát impersonate về admin.
- **Ghi chú:** tách riêng vì đụng service-role + auth flow, dễ phình nếu gộp.

---

### P12 — Communications & announcements — **NẶNG → CHIA 3 SUB-PHASE**

#### P12.1 — Announcements
- **Backend:** bảng `announcements` + RLS + API hiển thị + scheduling.
- **Frontend:** tạo/schedule announcement, hiển thị in-app cho tenant.
- **Verification:** tạo + lên lịch + hiển thị đúng đối tượng.

#### P12.2 — Email templates + trình soạn
- **Backend:** bảng `email_templates`; tích hợp Resend.
- **Frontend:** trình soạn template (logo, màu chủ đạo, chữ ký — §19.5) + mặc định + tùy chỉnh.
- **Verification:** lưu template + gửi thử.

#### P12.3 — Notification log + in-app messages
- **Backend:** bảng `notification_logs` + `message` API.
- **Frontend:** log viewer + message composer.
- **Verification:** log ghi mỗi lần gửi; message hiển thị trong app tenant.

---

### P13 — System observability & health — **RẤT NẶNG → CHIA 4 SUB-PHASE**
> Gom quá nhiều tính năng rời rạc; bắt buộc chia.

- **P13.1** — System health dashboard: trạng thái DB/storage/edge functions (Supabase API) + health cards.
- **P13.2** — Error log aggregation + performance metrics (`pg_stat_statements`, P95/P99, RPS) + charts.
- **P13.3** — Storage usage per tenant (RPC size) + backup status card (PITR/Supabase CLI).
- **P13.4** — Bulk operations (RPC bulk update nhiều tenant) + maintenance scheduler (bảng `maintenance_windows` + calendar UI).

---

### P14 — Tenant data operations — **NẶNG → CHIA 3 SUB-PHASE**

- **P14.1** — Backup per tenant: RPC/Edge Function dump toàn bộ dữ liệu 1 tenant + nút tải về.
- **P14.2** — Restore per tenant + archive tenant (tái dùng `archived` từ §18.6/P1) + import workflow.
- **P14.3** — Data migration giữa môi trường + reset demo data (RPC reset).

---

## GIAI ĐOẠN 4: ADVANCED (P15–P18) — **YAGNI / TẦM NHÌN DÀI HẠN**

> **CẢNH BÁO (§13):** KHÔNG tạo schema, KHÔNG viết code chuẩn bị trước cho Giai đoạn 4 (trừ phần 2FA/login history của P17 đã kéo vào Milestone 1). Các sub-phase dưới đây **chỉ để tham chiếu khi thực sự có nhu cầu**.

### P15 — API platform & webhooks — **NẶNG → chia 3 (YAGNI)**
- **P15.1** — `tenant_api_keys` schema + tạo/revoke + auth middleware + versioning.
- **P15.2** — `tenant_webhooks` + `webhook_deliveries` + delivery log + retry idempotent.
- **P15.3** — Integration marketplace (`integrations`) + partner portal (`partners`).

### P16 — Advanced analytics & BI — **Vừa → chia nhẹ 2 (YAGNI)**
- **P16.1** — MRR/ARR + revenue by plan RPC + KPI cards (cần dữ liệu thanh toán từ P7).
- **P16.2** — Churn + cohort + tenant LTV + sales funnel + charts.

### P17 — Compliance & security hardening — **NẶNG → CHIA 4 SUB-PHASE**
> **P17.1 + P17.2 thuộc Milestone 1 (launch).** P17.3 + P17.4 làm sau.

#### P17.1 — 2FA Google Authenticator (Milestone 1)
- **Backend:** dùng **Supabase Auth MFA native (TOTP)** — enroll → QR → verify → challenge (KHÔNG tự viết TOTP); bảng `admin_2fa_backup_codes` (**lưu hash**, mỗi code 1 lần); Edge Function **manual override** (unenroll factor của admin khác bằng service role + audit log).
- **Frontend:** trang bật 2FA (tùy chọn), quét QR, **bắt buộc hiển thị + xác nhận đã lưu backup codes** trước khi bật; nhập mã 6 số khi đăng nhập.
- **Verification:** bật/tắt 2FA; đăng nhập bằng mã + backup code; manual override cần ≥2 system admin.

#### P17.2 — Login history + suspicious activity (Milestone 1)
- **Backend:** bảng `admin_login_history` + rule cảnh báo bất thường.
- **Frontend:** xem login history + alert panel.

#### P17.3 — Data export per tenant + terms acceptance *(sau)*
- Bảng `terms_acceptance` + RPC export dữ liệu tenant (GDPR / Nghị định 13/2023) — chỉ khi chốt compliance (§14.5).

#### P17.4 — Fraud detection + data retention policy *(sau)*
- Heuristic phát hiện spam/tạo nhiều account + fraud queue; cron + config data retention.

### P18 — Multi-region & enterprise — **NẶNG → chia 3 (YAGNI, tầm nhìn)**
- **P18.1** — Multi-schema/multi-project isolation cho tenant VIP (khi ~1000 tenant).
- **P18.2** — White-label / custom domain cho tenant VIP.
- **P18.3** — Read replica + connection pooling + queue system (QStash/Inngest) cho heavy ops.

---

## 2. Thứ tự thực hiện đề xuất (Milestone 1 = launch)

Theo §18.5, Milestone 1 gồm: **P1 → P2 → P3 → P4 → P5 → P6 → P7 (7.0→7.5) → P10 (10.1→10.3) → P11 (11.1→11.3) → P17.1 → P17.2**.

Thứ tự trong P7 **không đảo được**: `P7.0` (read-only infra) phải xong trước; sau đó `P7.1 → P7.2 → P7.3` (schema → tạo hóa đơn → confirm), rồi `P7.4` (UI/PDF) và `P7.5` (cron/email) có thể làm song song ở 2 phiên khác nhau.

## 3. Checklist mỗi sub-phase (bắt buộc)

- [ ] Tạo **backup** folder trước khi sửa.
- [ ] Viết **1 test nhỏ** (failing trước, fix sau) cho logic không tầm thường.
- [ ] `npm run lint` (tsc --noEmit) **pass**.
- [ ] `npm run build` **pass**.
- [ ] Deploy migration (nếu có) và kiểm thử trên DB thật.
- [ ] Ghi **handoff** cho sub-phase kế tiếp + cập nhật `AGENTS.md`.
- [ ] Không để lộ service role key — thao tác nhạy cảm qua Edge Function.
