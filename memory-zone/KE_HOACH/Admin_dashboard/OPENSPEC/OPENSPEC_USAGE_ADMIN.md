# Hướng dẫn sử dụng OpenSpec — Admin Dashboard Upgrade

> OpenSpec store: `admin-dashboard`
> Schema: `admin-dashboard`
> Source plan: `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`

## Cấu trúc OpenSpec cho plan này

```text
OPENSPEC/openspec/
├── config.yaml                         # schema: admin-dashboard
├── schemas/
│   └── admin-dashboard/
│       ├── schema.yaml
│       └── templates/
│           ├── proposal.md
│           ├── design.md
│           ├── spec.md
│           ├── review.md
│           ├── rollback.md
│           ├── tasks.md
│           └── handoff.md
├── specs/
│   └── .gitkeep
└── changes/
    ├── admin-dashboard-p1-tenant-list-core-management/       # P1
    ├── admin-dashboard-p2-subscription-usage/              # P2
    ├── admin-dashboard-p3-member-management/               # P3
    ├── admin-dashboard-p4-system-analytics/                # P4
    ├── admin-dashboard-p5-audit-security/                  # P5
    ├── admin-dashboard-p6-operations-support/              # P6
    ├── admin-dashboard-p7-0-read-only-tenant-infra/        # P7.0
    ├── admin-dashboard-p7-1-billing-schema-bank-config/    # P7.1
    ├── admin-dashboard-p7-2-invoice-create-pricing/        # P7.2
    ├── admin-dashboard-p7-3-payment-confirm-lifecycle/     # P7.3
    ├── admin-dashboard-p7-4-invoice-ui-pdf/                # P7.4
    ├── admin-dashboard-p7-5-expiry-cron-renewal-email/     # P7.5
    ├── admin-dashboard-p8-1-plan-builder-schema/           # P8.1 (YAGNI)
    ├── admin-dashboard-p8-2-feature-flags/                 # P8.2 (YAGNI)
    ├── admin-dashboard-p9-1-billing-reminders/             # P9.1
    ├── admin-dashboard-p9-2-automation-dashboard/          # P9.2
    ├── admin-dashboard-p10-1-voucher-promotion-schema/       # P10.1
    ├── admin-dashboard-p10-2-voucher-invoice-apply/        # P10.2
    ├── admin-dashboard-p10-3-voucher-ui-expiry/              # P10.3
    ├── admin-dashboard-p11-1-ticket-schema-backend/        # P11.1
    ├── admin-dashboard-p11-2-ticket-inbox-email/           # P11.2
    ├── admin-dashboard-p11-3-impersonation/                # P11.3
    ├── admin-dashboard-p12-1-announcements/                  # P12.1
    ├── admin-dashboard-p12-2-email-templates/              # P12.2
    ├── admin-dashboard-p12-3-notification-log/               # P12.3
    ├── admin-dashboard-p13-1-system-health/                  # P13.1
    ├── admin-dashboard-p13-2-error-performance/            # P13.2
    ├── admin-dashboard-p13-3-storage-backup/               # P13.3
    ├── admin-dashboard-p13-4-bulk-maintenance/             # P13.4
    ├── admin-dashboard-p14-1-tenant-backup/                  # P14.1
    ├── admin-dashboard-p14-2-restore-archive/              # P14.2
    ├── admin-dashboard-p14-3-migration-reset/                # P14.3
    ├── admin-dashboard-p15-1-api-keys/                       # P15.1 (YAGNI)
    ├── admin-dashboard-p15-2-webhooks/                       # P15.2 (YAGNI)
    ├── admin-dashboard-p15-3-integrations/                   # P15.3 (YAGNI)
    ├── admin-dashboard-p16-1-mrr-arr/                      # P16.1 (YAGNI)
    ├── admin-dashboard-p16-2-churn-cohort/                   # P16.2 (YAGNI)
    ├── admin-dashboard-p17-1-2fa-totp/                     # P17.1
    ├── admin-dashboard-p17-2-login-history/                  # P17.2
    ├── admin-dashboard-p17-3-data-export-terms/            # P17.3
    ├── admin-dashboard-p17-4-fraud-retention/                # P17.4
    ├── admin-dashboard-p18-1-multi-region/                   # P18.1 (YAGNI)
    ├── admin-dashboard-p18-2-white-label/                  # P18.2 (YAGNI)
    └── admin-dashboard-p18-3-read-replica-queue/             # P18.3 (YAGNI)
```

## Các lệnh CLI hữu ích

```powershell
# Kiểm tra trạng thái một change
openspec status --change admin-dashboard-p1-tenant-list-core-management --store admin-dashboard

# Validate toàn bộ change
openspec validate --changes --store admin-dashboard

# Validate một change
openspec validate admin-dashboard-p1-tenant-list-core-management --type change --store admin-dashboard

# Liệt kê các change
openspec list --store admin-dashboard

# Xem chi tiết change
openspec show admin-dashboard-p1-tenant-list-core-management --store admin-dashboard

# Xem instructions cho tasks
openspec instructions tasks --change admin-dashboard-p1-tenant-list-core-management --store admin-dashboard --json
```

## Nguyên tắc chia chat

Mỗi chat chỉ làm **một sub-phase** (một OpenSpec change). Không gộp nhiều sub-phase lớn vào một chat vì lịch sử sẽ cộng dồn và nhanh vượt 250K context.

| Phase | Sub-phase | Change ID | Ghi chú |
|-------|-----------|-----------|---------|
| P1 | Tenant list & core management | `admin-dashboard-p1-tenant-list-core-management` | Search/filter/pagination, soft delete, KPI cards (giáp ngưỡng trên) |
| P2 | Subscription & usage | `admin-dashboard-p2-subscription-usage` | Usage summary, plan upgrade/downgrade, custom limits |
| P3 | Member management | `admin-dashboard-p3-member-management` | Invite, change role, remove, reset password per tenant |
| P4 | System analytics | `admin-dashboard-p4-system-analytics` | System overview, top tenants, tenant growth charts |
| P5 | Audit & security | `admin-dashboard-p5-audit-security` | Audit log filters, rate limit logs, system admin CRUD (giáp ngưỡng) |
| P6 | Operations & support | `admin-dashboard-p6-operations-support` | Data retention, default plan limits, maintenance mode, CSV export |
| P7.0 | Read-only tenant infra | `admin-dashboard-p7-0-read-only-tenant-infra` | Bắt buộc trước P7.1–P7.5; RLS + is_tenant_writable + TENANT_READ_ONLY |
| P7.1 | Billing schema + bank config | `admin-dashboard-p7-1-billing-schema-bank-config` | invoices, invoice_items, payments, bank_accounts + RLS |
| P7.2 | Invoice create + pricing | `admin-dashboard-p7-2-invoice-create-pricing` | Auto numbering, monthly/yearly/prepaid, Asia/Ho_Chi_Minh |
| P7.3 | Payment confirm + lifecycle | `admin-dashboard-p7-3-payment-confirm-lifecycle` | pending/paid/overdue/cancelled/expired; confirm expired |
| P7.4 | Invoice UI + PDF | `admin-dashboard-p7-4-invoice-ui-pdf` | Invoice list/detail, countdown, client-side PDF export |
| P7.5 | Expiry cron + renewal email | `admin-dashboard-p7-5-expiry-cron-renewal-email` | pg_cron, Resend billing reminders/confirmations |
| P8.1 | Plan builder schema | `admin-dashboard-p8-1-plan-builder-schema` | YAGNI — chỉ làm khi cần thêm gói |
| P8.2 | Feature flags | `admin-dashboard-p8-2-feature-flags` | YAGNI — tenants.settings JSONB toggle |
| P9.1 | Billing reminders | `admin-dashboard-p9-1-billing-reminders` | T-7/T-3/T-1 reminders + billing email templates |
| P9.2 | Automation dashboard | `admin-dashboard-p9-2-automation-dashboard` | Dunning, expiring/overdue list, job log |
| P10.1 | Voucher/promotion schema | `admin-dashboard-p10-1-voucher-promotion-schema` | promo_codes, promotion_rules, usage tracking + RLS |
| P10.2 | Voucher invoice apply | `admin-dashboard-p10-2-voucher-invoice-apply` | Apply voucher + promotion limits, per-tenant/global conditions |
| P10.3 | Voucher UI + expiry | `admin-dashboard-p10-3-voucher-ui-expiry` | Voucher management, expiry warnings, tenant input |
| P11.1 | Ticket schema + backend | `admin-dashboard-p11-1-ticket-schema-backend` | support_tickets, ticket_replies, templates, assignee |
| P11.2 | Ticket inbox + email | `admin-dashboard-p11-2-ticket-inbox-email` | Inbox, reply, templates, Resend notifications |
| P11.3 | Impersonation | `admin-dashboard-p11-3-impersonation` | Login as tenant admin, service-role Edge Function, audit log |
| P12.1 | Announcements | `admin-dashboard-p12-1-announcements` | announcements table + scheduling + in-app display |
| P12.2 | Email templates | `admin-dashboard-p12-2-email-templates` | email_templates + composer logo/color/signature |
| P12.3 | Notification log | `admin-dashboard-p12-3-notification-log` | notification_logs + in-app message composer |
| P13.1 | System health | `admin-dashboard-p13-1-system-health` | DB/storage/edge function status cards |
| P13.2 | Error + performance | `admin-dashboard-p13-2-error-performance` | Error aggregation, P95/P99, RPS charts |
| P13.3 | Storage + backup | `admin-dashboard-p13-3-storage-backup` | Per-tenant storage size, PITR/backup status |
| P13.4 | Bulk + maintenance | `admin-dashboard-p13-4-bulk-maintenance` | Bulk operations, maintenance_windows + calendar |
| P14.1 | Tenant backup | `admin-dashboard-p14-1-tenant-backup` | Dump tenant data + download |
| P14.2 | Restore + archive | `admin-dashboard-p14-2-restore-archive` | Restore, archive tenant, import workflow |
| P14.3 | Migration + reset | `admin-dashboard-p14-3-migration-reset` | Cross-env migration, reset demo data |
| P15.1 | API keys | `admin-dashboard-p15-1-api-keys` | YAGNI — tenant_api_keys + auth middleware |
| P15.2 | Webhooks | `admin-dashboard-p15-2-webhooks` | YAGNI — tenant_webhooks + deliveries + retry |
| P15.3 | Integrations | `admin-dashboard-p15-3-integrations` | YAGNI — marketplace + partner portal |
| P16.1 | MRR/ARR | `admin-dashboard-p16-1-mrr-arr` | YAGNI — revenue by plan RPC + KPI cards |
| P16.2 | Churn + cohort | `admin-dashboard-p16-2-churn-cohort` | YAGNI — churn, LTV, funnel charts |
| P17.1 | 2FA TOTP | `admin-dashboard-p17-1-2fa-totp` | Supabase Auth MFA, backup codes, manual override |
| P17.2 | Login history | `admin-dashboard-p17-2-login-history` | admin_login_history + suspicious alerts |
| P17.3 | Data export + terms | `admin-dashboard-p17-3-data-export-terms` | GDPR/Nghị định 13 export, terms_acceptance |
| P17.4 | Fraud + retention | `admin-dashboard-p17-4-fraud-retention` | Fraud heuristic queue, data retention cron |
| P18.1 | Multi-region | `admin-dashboard-p18-1-multi-region` | YAGNI — multi-schema isolation for VIP |
| P18.2 | White-label | `admin-dashboard-p18-2-white-label` | YAGNI — custom domain for VIP |
| P18.3 | Read replica + queue | `admin-dashboard-p18-3-read-replica-queue` | YAGNI — connection pooling, QStash/Inngest |

## Các bước lặp lại cho mỗi chat

1. **Tạo backup** (quan trọng vì không có git):
   ```powershell
   Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_<PHASE>_<YYYYMMDD_HHMMSS>" -Recurse
   ```
2. **Mở chat mới** trong Windsurf.
3. **Dán prompt mẫu** tương ứng bên dưới.
4. **Để AI thực hiện**. AI sẽ đọc plan, tasks.md, sửa code, đánh dấu task.
5. **Kiểm tra sau khi AI báo xong**:
   ```powershell
   npm run lint
   ```
   Nếu chat này là **cuối phase lớn** (P1, P2, P3, P4, P5, P6, P7.5, P10.3, P11.3, P17.2), thêm:
   ```powershell
   npm run build
   ```
6. **Archive** (tùy chọn sau mỗi phase lớn):
   ```powershell
   openspec archive <change-id> --store admin-dashboard
   ```
   > Lưu ý: archive sẽ merge delta specs vào baseline. Nếu muốn giữ change active để tiếp tục, đừng archive quá sớm.
7. **Lưu lại backup path** và mở chat mới cho sub-phase kế tiếp.

## Prompt mẫu — Copy toàn bộ đoạn tương ứng

### P1 — Tenant list & core management

```text
Thực hiện P1 — Tenant list & core management cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P1.
- Đọc OpenSpec change `admin-dashboard-p1-tenant-list-core-management`.
- Backend: tạo RPC `search_tenants`, `update_tenant`, `delete_tenant_safe` (soft delete → status='archived', không hard delete).
- Migration: thêm `archived` (+ `archived_at`) vào CHECK `tenants.status`; cron purge archived > 30 ngày.
- Frontend: KPI cards, search/filter status/plan, pagination table, edit modal, soft delete + restore button.
- Kiểm thử: tạo, sửa, xóa/khôi phục, tìm kiếm, phân trang; `npm run lint` + `npm run build` pass.
```

### P2 — Subscription & usage

```text
Thực hiện P2 — Subscription & usage cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P2.
- Đọc OpenSpec change `admin-dashboard-p2-subscription-usage`.
- Backend: RPC `get_tenant_usage_summary`, `update_tenant_subscription`, `reset_monthly_order_counter`.
- Frontend: expand row usage panel, progress bars user/product/order, badge >80%, plan upgrade/downgrade form, custom limits, billing_status, expires_at.
- Kiểm thử: nâng/hạ gói, cảnh báo gần giới hạn, trigger `check_tenant_limits` vẫn chạy; lint + build pass.
```

### P3 — Member management

```text
Thực hiện P3 — Member management cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P3.
- Đọc OpenSpec change `admin-dashboard-p3-member-management`.
- Backend: dùng lại Edge Function `invite-member`, `reset-password`; `tenantService.updateMemberRole`, `tenantService.removeMember`.
- Frontend: tab "Thành viên", bảng members (email, role, invited_by, created_at), form mời, dropdown đổi role, xóa member, reset password.
- Kiểm thử: mời/đổi role/xóa/reset; không vượt giới hạn user của gói; lint + build pass.
```

### P4 — System analytics

```text
Thực hiện P4 — System analytics cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P4.
- Đọc OpenSpec change `admin-dashboard-p4-system-analytics`.
- Backend: RPC `get_system_overview`, `get_top_tenants`, `get_tenant_growth`.
- Frontend: tab "Tổng quan", KPI cards (tái dùng từ `Dashboard.tsx`), chart tenant mới, bảng top tenant, tenant sắp hết hạn/giới hạn.
- Kiểm thử: RPC với dữ liệu lớn, system admin xem toàn bộ tenant; lint + build pass.
```

### P5 — Audit & security

```text
Thực hiện P5 — Audit & security cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P5.
- Đọc OpenSpec change `admin-dashboard-p5-audit-security`.
- Backend: mở rộng `services/auditService.ts` filter theo tenant/user/action/table/date; RPC `get_rate_limit_logs`; RPC `add_system_admin`, `remove_system_admin`.
- Frontend: tab "Audit log" (tái dùng `AuditLog.tsx`), tab "Rate limit", tab "System admins".
- Kiểm thử: filter audit, rate limit chỉ system admin, thêm/xóa system admin; lint + build pass.
```

### P6 — Operations & support

```text
Thực hiện P6 — Operations & support cơ bản cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P6.
- Đọc OpenSpec change `admin-dashboard-p6-operations-support`.
- Backend: RPC `get_data_retention_status`, `get_default_plan_limits`, `set_default_plan_limits`, `set_maintenance_mode`.
- Frontend: tab "Vận hành" (retention cron, default Free/VIP limits, maintenance toggle + message), export CSV tenant, kiểm tra subdomain trong form tạo.
- Kiểm thử: export CSV, maintenance mode; lint + build pass.
```

### P7.0 — Read-only tenant infrastructure

```text
Thực hiện P7.0 — Read-only tenant infrastructure cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P7.0.
- Đọc OpenSpec change `admin-dashboard-p7-0-read-only-tenant-infra`.
- Migration: thêm `read_only` vào CHECK `tenants.status`; helper `public.is_tenant_writable(p_tenant_id UUID)` (STABLE, SECURITY DEFINER).
- Sửa RLS INSERT/UPDATE/DELETE trên các bảng nghiệp vụ (orders, order_items, products, product_lots, customers, import_receipts, …) thêm `is_tenant_writable(tenant_id)`. SELECT giữ nguyên.
- Guard `is_tenant_writable` đầu `process_checkout` + các RPC ghi, trả lỗi `TENANT_READ_ONLY`.
- Frontend: banner "Tài khoản hết hạn — vui lòng thanh toán", disable nút tạo/sửa khi status='read_only'.
- Kiểm thử: user tenant read-only SELECT pass, INSERT/UPDATE/DELETE bị chặn; lint + build pass.
```

### P7.1 — Billing schema + bank/company config

```text
Thực hiện P7.1 — Billing schema + bank/company config cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P7.1.
- Đọc OpenSpec change `admin-dashboard-p7-1-billing-schema-bank-config`.
- Backend: tạo bảng `invoices`, `invoice_items`, `payments`, `bank_accounts` + RLS; cột số hóa đơn + sequence chuẩn bị `INV-YYYY-####`.
- Tạo `bankAccountService` nếu cần.
- Frontend: trang cấu hình ngân hàng (tên TK, số TK, ngân hàng, nội dung CK) + thông tin công ty/thương hiệu/MST.
- Kiểm thử: CRUD bank account + company info; lint + build pass.
```

### P7.2 — Invoice create + pricing

```text
Thực hiện P7.2 — RPC tạo hóa đơn + đánh số + tính giá cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P7.2.
- Đọc OpenSpec change `admin-dashboard-p7-2-invoice-create-pricing`.
- Backend: RPC tạo hóa đơn (manual + cron-ready), đánh số tự động `INV-YYYY-####`, tính giá tháng/năm (69k/tháng, 59k/tháng khi mua năm) + `bonus_months`, cho phép trả trước tự do cộng dồn `expires_at`. Mọi mốc thời gian theo Asia/Ho_Chi_Minh.
- Frontend: form tạo hóa đơn thủ công cho 1 tenant.
- Kiểm thử: tạo hóa đơn tháng/năm/trả trước; số hóa đơn không trùng; lint + build pass.
```

### P7.3 — Payment confirmation + lifecycle

```text
Thực hiện P7.3 — Xác nhận thanh toán + vòng đời trạng thái hóa đơn cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P7.3.
- Đọc OpenSpec change `admin-dashboard-p7-3-payment-confirm-lifecycle`.
- Backend: RPC `confirm_payment` (ghi `payments`, cập nhật `billing_status` + `expires_at` + cộng `bonus_months`, chuyển read_only → active). Trạng thái hóa đơn: pending/paid/overdue/cancelled/expired. Cho phép confirm trên hóa đơn expired.
- Frontend: nút "Xác nhận thanh toán" trên chi tiết hóa đơn.
- Kiểm thử: confirm hóa đơn pending & expired → tenant active lại + ghi được dữ liệu; lint + build pass.
```

### P7.4 — Invoice UI + PDF

```text
Thực hiện P7.4 — UI quản lý hóa đơn + xuất PDF cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P7.4.
- Đọc OpenSpec change `admin-dashboard-p7-4-invoice-ui-pdf`.
- Frontend: danh sách + chi tiết hóa đơn, đếm ngược 48 giờ, badge trạng thái; xuất PDF client-side (jsPDF/pdfmake, ưu tiên tái dùng pattern export Excel sẵn có).
- Backend: dùng lại RPC P7.1–P7.3.
- Kiểm thử: render + export PDF đúng thông tin ngân hàng/công ty/countdown; lint + build pass.
```

### P7.5 — Expiry cron + renewal + email

```text
Thực hiện P7.5 — Cron hết hạn + cron tạo hóa đơn gia hạn + email Resend cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P7.5.
- Đọc OpenSpec change `admin-dashboard-p7-5-expiry-cron-renewal-email`.
- Backend: `pg_cron` chuyển hóa đơn pending quá 48h → expired + tenant → read_only; cron tạo hóa đơn gia hạn N=7 ngày trước `expires_at`. Edge Function gửi email qua Resend (nhắc thanh toán + xác nhận), API key trong Supabase secrets.
- Kiểm thử: giả lập hóa đơn quá hạn → tenant read-only; email gửi thành công (test). `promo_codes`/`promotion_rules` không tạo ở P7, chỉ để cột giảm giá nullable trên `invoices`.
- lint + build pass.
```

### P8.1 — Plan builder schema (YAGNI)

```text
Thực hiện P8.1 — Plan builder schema cho Admin Dashboard (YAGNI, chỉ khi cần thêm gói).

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P8.1.
- Đọc OpenSpec change `admin-dashboard-p8-1-plan-builder-schema`.
- Backend: tạo bảng `plans` + CRUD; migrate Free/VIP hardcode sang bảng.
- Kiểm thử: CRUD plan; lint + build pass.
```

### P8.2 — Feature flags (YAGNI)

```text
Thực hiện P8.2 — Feature flags cho Admin Dashboard (YAGNI).

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P8.2.
- Đọc OpenSpec change `admin-dashboard-p8-2-feature-flags`.
- Backend: feature flags qua `tenants.settings` JSONB (không tạo bảng `tenant_features`).
- Frontend: toggle UI theo tenant.
- Kiểm thử: bật/tắt feature flag; lint + build pass.
```

### P9.1 — Billing reminders

```text
Thực hiện P9.1 — Billing reminders cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P9.1.
- Đọc OpenSpec change `admin-dashboard-p9-1-billing-reminders`.
- Backend: lịch nhắc nhiều mốc (T-7/T-3/T-1) + email template billing (tái dùng Resend P7.5); cấu hình reminder.
- Kiểm thử: reminder đúng lịch; email gửi; lint + build pass.
```

### P9.2 — Automation dashboard

```text
Thực hiện P9.2 — Billing automation dashboard cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P9.2.
- Đọc OpenSpec change `admin-dashboard-p9-2-automation-dashboard`.
- Frontend: dashboard trạng thái billing (sắp hết hạn/quá hạn, dunning), log job chạy.
- Backend: RPC/lưu log job chạy.
- Kiểm thử: danh sách + log hiển thị đúng; lint + build pass.
```

### P10.1 — Voucher/promotion schema

```text
Thực hiện P10.1 — Schema voucher/promotion cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P10.1.
- Đọc OpenSpec change `admin-dashboard-p10-1-voucher-promotion-schema`.
- Backend: tạo bảng `promo_codes`, `promotion_rules`, bảng theo dõi lượt dùng (per-tenant + global) + RLS; service.
- Kiểm thử: CRUD voucher/promotion; lint + build pass.
```

### P10.2 — Voucher invoice apply

```text
Thực hiện P10.2 — RPC áp dụng voucher/promotion vào hóa đơn cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P10.2.
- Đọc OpenSpec change `admin-dashboard-p10-2-voucher-invoice-apply`.
- Backend: RPC apply voucher (mỗi hóa đơn 1 voucher, kết hợp voucher + promotion "mua năm tặng x tháng"). Enforce giới hạn per-tenant + tổng số lần; điều kiện đối tượng (tenant mới N ngày / gói cụ thể / tenant cụ thể); nối vào cột giảm giá của `invoices` (P7).
- Kiểm thử: voucher 10% + tặng tháng tính đúng; vượt giới hạn bị chặn; lint + build pass.
```

### P10.3 — Voucher UI + expiry

```text
Thực hiện P10.3 — UI voucher + cảnh báo hết hạn cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P10.3.
- Đọc OpenSpec change `admin-dashboard-p10-3-voucher-ui-expiry`.
- Frontend: quản lý voucher/promotion, badge/danh sách voucher sắp hết hạn (7 ngày) + đã hết hạn; ô nhập voucher khi thanh toán (tenant); form proration khi đổi gói (admin review thủ công).
- Kiểm thử: nhập voucher → hóa đơn tự tính lại; cảnh báo hiển thị đúng; lint + build pass.
```

### P11.1 — Ticket schema + backend

```text
Thực hiện P11.1 — Support ticket schema + backend cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P11.1.
- Đọc OpenSpec change `admin-dashboard-p11-1-ticket-schema-backend`.
- Backend: tạo bảng `support_tickets`, `ticket_replies`, `ticket_reply_templates` + RLS; status open/in_progress/waiting_customer/resolved/closed; phân loại bug/billing/support/feature_request; gán admin phụ trách; service.
- Kiểm thử: CRUD ticket + reply + template; lint + build pass.
```

### P11.2 — Ticket inbox + email

```text
Thực hiện P11.2 — Ticket inbox + reply + email cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P11.2.
- Đọc OpenSpec change `admin-dashboard-p11-2-ticket-inbox-email`.
- Frontend: inbox, chi tiết, assign, reply, template reply, link ticket ↔ tenant.
- Backend: email thông báo cập nhật ticket (tái dùng Resend).
- Kiểm thử: tạo/gán/trả lời ticket; email gửi; lint + build pass.
```

### P11.3 — Impersonation

```text
Thực hiện P11.3 — Impersonation "Login as tenant admin" cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P11.3.
- Đọc OpenSpec change `admin-dashboard-p11-3-impersonation`.
- Backend: Edge Function service-role tạo phiên impersonate; audit log đầy đủ (ai, tenant nào, lúc nào, bao lâu).
- Frontend: nút "Login as", banner cảnh báo rõ ràng khi đang impersonate.
- Kiểm thử: impersonate ghi audit; thoát impersonate về admin; lint + build pass.
```

### P12.1 — Announcements

```text
Thực hiện P12.1 — Announcements cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P12.1.
- Đọc OpenSpec change `admin-dashboard-p12-1-announcements`.
- Backend: bảng `announcements` + RLS + API hiển thị + scheduling.
- Frontend: tạo/schedule announcement, hiển thị in-app cho tenant.
- Kiểm thử: tạo + lên lịch + hiển thị đúng đối tượng; lint + build pass.
```

### P12.2 — Email templates

```text
Thực hiện P12.2 — Email templates + trình soạn cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P12.2.
- Đọc OpenSpec change `admin-dashboard-p12-2-email-templates`.
- Backend: bảng `email_templates`; tích hợp Resend.
- Frontend: trình soạn template (logo, màu chủ đạo, chữ ký) + mặc định + tùy chỉnh.
- Kiểm thử: lưu template + gửi thử; lint + build pass.
```

### P12.3 — Notification log + in-app messages

```text
Thực hiện P12.3 — Notification log + in-app messages cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P12.3.
- Đọc OpenSpec change `admin-dashboard-p12-3-notification-log`.
- Backend: bảng `notification_logs` + `message` API.
- Frontend: log viewer + message composer.
- Kiểm thử: log ghi mỗi lần gửi; message hiển thị trong app tenant; lint + build pass.
```

### P13.1 — System health

```text
Thực hiện P13.1 — System health dashboard cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P13.1.
- Đọc OpenSpec change `admin-dashboard-p13-1-system-health`.
- Frontend: trạng thái DB/storage/edge functions (Supabase API) + health cards.
- Kiểm thử: health cards hiển thị đúng; lint + build pass.
```

### P13.2 — Error + performance metrics

```text
Thực hiện P13.2 — Error log aggregation + performance metrics cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P13.2.
- Đọc OpenSpec change `admin-dashboard-p13-2-error-performance`.
- Backend: error log aggregation + `pg_stat_statements` (P95/P99, RPS) + charts.
- Kiểm thử: metrics chính xác; charts render đúng; lint + build pass.
```

### P13.3 — Storage + backup

```text
Thực hiện P13.3 — Storage usage + backup status cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P13.3.
- Đọc OpenSpec change `admin-dashboard-p13-3-storage-backup`.
- Backend: RPC tính storage usage per tenant; backup status card (PITR/Supabase CLI).
- Kiểm thử: size đúng; backup status hiển thị; lint + build pass.
```

### P13.4 — Bulk operations + maintenance

```text
Thực hiện P13.4 — Bulk operations + maintenance scheduler cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P13.4.
- Đọc OpenSpec change `admin-dashboard-p13-4-bulk-maintenance`.
- Backend: RPC bulk update nhiều tenant; bảng `maintenance_windows`.
- Frontend: calendar UI cho maintenance schedule.
- Kiểm thử: bulk update đúng; maintenance window hiển thị; lint + build pass.
```

### P14.1 — Tenant backup

```text
Thực hiện P14.1 — Backup per tenant cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P14.1.
- Đọc OpenSpec change `admin-dashboard-p14-1-tenant-backup`.
- Backend: RPC/Edge Function dump toàn bộ dữ liệu 1 tenant.
- Frontend: nút tải về.
- Kiểm thử: dump đầy đủ; tải về thành công; lint + build pass.
```

### P14.2 — Restore + archive

```text
Thực hiện P14.2 — Restore per tenant + archive tenant cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P14.2.
- Đọc OpenSpec change `admin-dashboard-p14-2-restore-archive`.
- Backend: restore per tenant; archive tenant (tái dùng `archived` từ P1); import workflow.
- Kiểm thử: restore đúng; archive + unarchive; lint + build pass.
```

### P14.3 — Migration + reset demo

```text
Thực hiện P14.3 — Data migration + reset demo data cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P14.3.
- Đọc OpenSpec change `admin-dashboard-p14-3-migration-reset`.
- Backend: RPC migration giữa môi trường; RPC reset demo data.
- Kiểm thử: reset demo đúng; lint + build pass.
```

### P15.1 — API keys (YAGNI)

```text
Thực hiện P15.1 — API platform keys cho Admin Dashboard (YAGNI).

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P15.1.
- Đọc OpenSpec change `admin-dashboard-p15-1-api-keys`.
- Backend: `tenant_api_keys` schema + tạo/revoke + auth middleware + versioning.
- Kiểm thử: API key auth đúng; lint + build pass.
```

### P15.2 — Webhooks (YAGNI)

```text
Thực hiện P15.2 — Webhooks cho Admin Dashboard (YAGNI).

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P15.2.
- Đọc OpenSpec change `admin-dashboard-p15-2-webhooks`.
- Backend: `tenant_webhooks` + `webhook_deliveries` + delivery log + retry idempotent.
- Kiểm thử: webhook delivery + retry đúng; lint + build pass.
```

### P15.3 — Integrations (YAGNI)

```text
Thực hiện P15.3 — Integration marketplace cho Admin Dashboard (YAGNI).

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P15.3.
- Đọc OpenSpec change `admin-dashboard-p15-3-integrations`.
- Backend: `integrations` + `partners`.
- Frontend: marketplace + partner portal.
- Kiểm thử: CRUD integration/partner; lint + build pass.
```

### P16.1 — MRR/ARR (YAGNI)

```text
Thực hiện P16.1 — MRR/ARR + revenue by plan cho Admin Dashboard (YAGNI).

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P16.1.
- Đọc OpenSpec change `admin-dashboard-p16-1-mrr-arr`.
- Backend: RPC MRR/ARR + revenue by plan.
- Frontend: KPI cards.
- Kiểm thử: số liệu đúng; lint + build pass.
```

### P16.2 — Churn + cohort (YAGNI)

```text
Thực hiện P16.2 — Churn + cohort + LTV cho Admin Dashboard (YAGNI).

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P16.2.
- Đọc OpenSpec change `admin-dashboard-p16-2-churn-cohort`.
- Backend: RPC churn, cohort, tenant LTV, sales funnel.
- Frontend: charts.
- Kiểm thử: metrics chính xác; lint + build pass.
```

### P17.1 — 2FA TOTP

```text
Thực hiện P17.1 — 2FA Google Authenticator (TOTP) cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P17.1.
- Đọc OpenSpec change `admin-dashboard-p17-1-2fa-totp`.
- Backend: dùng Supabase Auth MFA native (TOTP) — enroll → QR → verify → challenge. Bảng `admin_2fa_backup_codes` (lưu hash, mỗi code 1 lần). Edge Function manual override (unenroll factor của admin khác bằng service role + audit log).
- Frontend: trang bật 2FA (tùy chọn), quét QR, bắt buộc hiển thị + xác nhận đã lưu backup codes trước khi bật; nhập mã 6 số khi đăng nhập.
- Kiểm thử: bật/tắt 2FA; đăng nhập bằng mã + backup code; manual override cần ≥2 system admin; lint + build pass.
```

### P17.2 — Login history

```text
Thực hiện P17.2 — Login history + suspicious activity cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P17.2.
- Đọc OpenSpec change `admin-dashboard-p17-2-login-history`.
- Backend: bảng `admin_login_history` + rule cảnh báo bất thường.
- Frontend: xem login history + alert panel.
- Kiểm thử: login được ghi; alert khi bất thường; lint + build pass.
```

### P17.3 — Data export + terms

```text
Thực hiện P17.3 — Data export per tenant + terms acceptance cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P17.3.
- Đọc OpenSpec change `admin-dashboard-p17-3-data-export-terms`.
- Backend: bảng `terms_acceptance` + RPC export dữ liệu tenant (GDPR / Nghị định 13/2023).
- Kiểm thử: export đầy đủ; terms acceptance ghi nhận; lint + build pass.
```

### P17.4 — Fraud + retention

```text
Thực hiện P17.4 — Fraud detection + data retention policy cho Admin Dashboard.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P17.4.
- Đọc OpenSpec change `admin-dashboard-p17-4-fraud-retention`.
- Backend: heuristic phát hiện spam/tạo nhiều account + fraud queue; cron + config data retention.
- Kiểm thử: fraud queue đúng; retention cron chạy; lint + build pass.
```

### P18.1 — Multi-region (YAGNI)

```text
Thực hiện P18.1 — Multi-schema/multi-project isolation cho Admin Dashboard (YAGNI).

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P18.1.
- Đọc OpenSpec change `admin-dashboard-p18-1-multi-region`.
- Backend: multi-schema/multi-project isolation cho tenant VIP khi ~1000 tenant.
- Kiểm thử: tenant VIP cô lập đúng; lint + build pass.
```

### P18.2 — White-label (YAGNI)

```text
Thực hiện P18.2 — White-label/custom domain cho Admin Dashboard (YAGNI).

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P18.2.
- Đọc OpenSpec change `admin-dashboard-p18-2-white-label`.
- Backend: custom domain mapping cho tenant VIP.
- Frontend: white-label config.
- Kiểm thử: custom domain hoạt động; lint + build pass.
```

### P18.3 — Read replica + queue (YAGNI)

```text
Thực hiện P18.3 — Read replica + connection pooling + queue cho Admin Dashboard (YAGNI).

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, section P18.3.
- Đọc OpenSpec change `admin-dashboard-p18-3-read-replica-queue`.
- Backend: read replica + connection pooling + queue system (QStash/Inngest) cho heavy ops.
- Kiểm thử: heavy ops hoạt động ổn định; lint + build pass.
```

Apply toàn bộ Admin Dashboard Milestone 1 (P1–P7 + P10 + P11 + P17.1–P17.2) lên Production
