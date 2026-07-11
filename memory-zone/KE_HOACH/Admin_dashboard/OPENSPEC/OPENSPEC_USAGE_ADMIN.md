# Hướng dẫn sử dụng OpenSpec — Basejump Admin Dashboard Enterprise Upgrade

> OpenSpec store: `admin-dashboard`
> Schema: `admin-dashboard`
> Source plan: `memory-zone/KE_HOACH/Admin_dashboard/SUB_PHASE_BREAKDOWN_BASEJUMP_ADMIN_DASHBOARD.md`

## Cấu trúc OpenSpec cho plan này

```text
C:\Users\SUACAUBA\openspec-stores\admin-dashboard\openspec\changes\
├── basejump-admin-dashboard-phase-0-1/      # Phase 0.1: Build & Foundation
│   ├── .openspec.yaml
│   ├── proposal.md
│   ├── design.md
│   ├── specs/
│   │   ├── admin-dashboard-foundation/spec.md
│   │   └── admin-dashboard-runbook/spec.md
│   ├── tasks.md
│   └── ...
├── basejump-admin-dashboard-phase-1-1/      # Phase 1.1: Tách monolith → pages
│   ├── .openspec.yaml
│   ├── proposal.md
│   ├── design.md
│   ├── specs/
│   │   ├── admin-dashboard-routing/spec.md
│   │   └── admin-dashboard-pages/spec.md
│   ├── tasks.md
│   └── ...
├── basejump-admin-dashboard-phase-1-2/      # Phase 1.2: Code splitting + UI patterns
│   ├── .openspec.yaml
│   ├── proposal.md
│   ├── design.md
│   ├── specs/
│   │   ├── admin-dashboard-ui-patterns/spec.md
│   │   ├── admin-dashboard-code-splitting/spec.md
│   │   └── admin-dashboard-onboarding/spec.md
│   ├── tasks.md
│   └── ...
├── basejump-admin-dashboard-phase-2-1/      # Phase 2.1: Service layer
│   ├── .openspec.yaml
│   ├── proposal.md
│   ├── design.md
│   ├── specs/admin-dashboard-services/spec.md
│   ├── tasks.md
│   └── ...
├── basejump-admin-dashboard-phase-2-2/      # Phase 2.2: useAdminList hook + RPC contracts
│   ├── .openspec.yaml
│   ├── proposal.md
│   ├── design.md
│   ├── specs/
│   │   ├── admin-dashboard-list-hook/spec.md
│   │   └── admin-dashboard-rpc-contracts/spec.md
│   ├── tasks.md
│   └── ...
├── basejump-admin-dashboard-phase-3-1/      # Phase 3.1: Schema + DB helpers
│   ├── .openspec.yaml
│   ├── proposal.md
│   ├── design.md
│   ├── specs/
│   │   ├── admin-dashboard-tenant-schema/spec.md
│   │   ├── admin-dashboard-rls-helpers/spec.md
│   │   └── admin-dashboard-user-triggers/spec.md
│   ├── tasks.md
│   └── ...
├── basejump-admin-dashboard-phase-3-2/      # Phase 3.2: RLS policies + permissions
│   ├── .openspec.yaml
│   ├── proposal.md
│   ├── design.md
│   ├── specs/
│   │   ├── admin-dashboard-rls-policies/spec.md
│   │   └── admin-dashboard-permissions/spec.md
│   ├── tasks.md
│   └── ...
├── basejump-admin-dashboard-phase-3-3/      # Phase 3.3: Tenant-scoped RLS + tracking
│   ├── .openspec.yaml
│   ├── proposal.md
│   ├── design.md
│   ├── specs/
│   │   ├── admin-dashboard-tenant-scoped-rls/spec.md
│   │   └── admin-dashboard-user-tracking/spec.md
│   ├── tasks.md
│   └── ...
├── basejump-admin-dashboard-phase-4-1/      # Phase 4.1: Billing schema + UI
│   ├── .openspec.yaml
│   ├── proposal.md
│   ├── design.md
│   ├── specs/
│   │   ├── admin-dashboard-billing-schema/spec.md
│   │   ├── admin-dashboard-subscription-manager/spec.md
│   │   └── admin-dashboard-payment-manager/spec.md
│   ├── tasks.md
│   └── ...
├── basejump-admin-dashboard-phase-4-2/      # Phase 4.2: Billing providers + feature gating
│   ├── .openspec.yaml
│   ├── proposal.md
│   ├── design.md
│   ├── specs/
│   │   ├── admin-dashboard-billing-providers/spec.md
│   │   └── admin-dashboard-feature-gating/spec.md
│   ├── tasks.md
│   └── ...
├── basejump-admin-dashboard-phase-5-1/      # Phase 5.1: Invitations + RBAC
│   ├── .openspec.yaml
│   ├── proposal.md
│   ├── design.md
│   ├── specs/
│   │   ├── admin-dashboard-invitations/spec.md
│   │   └── admin-dashboard-rbac/spec.md
│   ├── tasks.md
│   └── ...
├── basejump-admin-dashboard-phase-5-2/      # Phase 5.2: Audit log + Security
│   ├── .openspec.yaml
│   ├── proposal.md
│   ├── design.md
│   ├── specs/
│   │   ├── admin-dashboard-audit-log/spec.md
│   │   └── admin-dashboard-security-settings/spec.md
│   ├── tasks.md
│   └── ...
├── basejump-admin-dashboard-phase-6-1/      # Phase 6.1: pgtap DB tests
│   ├── .openspec.yaml
│   ├── proposal.md
│   ├── design.md
│   ├── specs/admin-dashboard-db-tests/spec.md
│   ├── tasks.md
│   └── ...
├── basejump-admin-dashboard-phase-6-2/      # Phase 6.2: Vitest UI tests + CI
│   ├── .openspec.yaml
│   ├── proposal.md
│   ├── design.md
│   ├── specs/
│   ├── tasks.md
│   └── ...
├── basejump-admin-dashboard-phase-7-1/      # Phase 7.1: Real-time + cron
│   ├── .openspec.yaml
│   ├── proposal.md
│   ├── design.md
│   ├── specs/
│   ├── tasks.md
│   └── ...
└── basejump-admin-dashboard-phase-7-2/      # Phase 7.2: Analytics + GDPR
    ├── .openspec.yaml
    ├── proposal.md
    ├── design.md
    ├── specs/
    ├── tasks.md
    └── ...
```

## Các lệnh CLI hữu ích

```powershell
# Kiểm tra trạng thái một change
openspec status --change basejump-admin-dashboard-phase-0-1 --store admin-dashboard

# Validate toàn bộ change
openspec validate --changes --store admin-dashboard

# Validate một change
openspec validate basejump-admin-dashboard-phase-0-1 --type change --store admin-dashboard

# Liệt kê các change
openspec list --store admin-dashboard

# Xem chi tiết change
openspec show basejump-admin-dashboard-phase-0-1 --store admin-dashboard

# Xem instructions cho tasks
openspec instructions tasks --change basejump-admin-dashboard-phase-0-1 --store admin-dashboard --json
```

## Nguyên tắc chia chat

Mỗi chat chỉ làm **một sub-phase** (một OpenSpec change). Không gộp nhiều sub-phase lớn vào một chat vì lịch sử sẽ cộng dồn và nhanh vượt 250K context.

Thứ tự thực hiện theo dependency graph:

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 + Phase 5 (song song) → Phase 6 → Phase 7
```

| Phase | Sub-phase | Change ID | Ghi chú |
|-------|-----------|-----------|---------|
| 0 | 0.1 | `basejump-admin-dashboard-phase-0-1` | Build ổn định, foundation components |
| 1 | 1.1 | `basejump-admin-dashboard-phase-1-1` | Tách monolith → 13 pages + routing |
| 1 | 1.2 | `basejump-admin-dashboard-phase-1-2` | Code splitting (React.lazy), Basejump UI patterns, Onboarding |
| 2 | 2.1 | `basejump-admin-dashboard-phase-2-1` | Service layer (6 service files), migrate queries |
| 2 | 2.2 | `basejump-admin-dashboard-phase-2-2` | useAdminList hook, RPC contracts docs |
| 3 | 3.1 | `basejump-admin-dashboard-phase-3-1` | Migration schema, DB helper functions, triggers |
| 3 | 3.2 | `basejump-admin-dashboard-phase-3-2` | RLS policies, permissions.ts, edge functions |
| 3 | 3.3 | `basejump-admin-dashboard-phase-3-3` | Tenant-scoped RLS, user tracking triggers |
| 4 | 4.1 | `basejump-admin-dashboard-phase-4-1` | Billing schema, SubscriptionManager, PaymentManager |
| 4 | 4.2 | `basejump-admin-dashboard-phase-4-2` | Billing providers (Stripe, Momo, VNPay, bank), feature gating |
| 5 | 5.1 | `basejump-admin-dashboard-phase-5-1` | Invitations flow, RBAC matrix |
| 5 | 5.2 | `basejump-admin-dashboard-phase-5-2` | Audit log, security hardening (2FA, IP allowlist) |
| 6 | 6.1 | `basejump-admin-dashboard-phase-6-1` | pgtap DB tests (helpers, RLS, billing, audit) |
| 6 | 6.2 | `basejump-admin-dashboard-phase-6-2` | Vitest UI tests, CI pipeline |
| 7 | 7.1 | `basejump-admin-dashboard-phase-7-1` | Real-time notifications, cron jobs |
| 7 | 7.2 | `basejump-admin-dashboard-phase-7-2` | Analytics dashboard, GDPR compliance |

## Các bước lặp lại cho mỗi chat

1. **Mở chat mới** trong Windsurf.
2. **Dán prompt mẫu** tương ứng bên dưới.
3. **Để AI thực hiện**. AI sẽ đọc plan, tasks.md, sửa code, đánh dấu task.
4. **Kiểm tra sau khi AI báo xong**:
   ```powershell
   npm run build
   ```
5. **Sau khi hoàn thành sub-phase:** Đánh dấu sub-phase đã xong và checkout nhánh mới cho sub-phase tiếp theo.

---

## Prompt mẫu — Copy toàn bộ đoạn tương ứng

### Phase 0.1 — Build & Foundation

```text
Thực hiện Sub-Phase 0.1 — Build & Lint & TypeScript & Foundation Components cho kế hoạch Basejump Admin Dashboard Enterprise Upgrade.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/SUB_PHASE_BREAKDOWN_BASEJUMP_ADMIN_DASHBOARD.md`, section Sub-Phase 0.1 (lines 40-75).
- Đọc OpenSpec change `basejump-admin-dashboard-phase-0-1` tại `C:\Users\SUACAUBA\openspec-stores\admin-dashboard\openspec\changes\basejump-admin-dashboard-phase-0-1\`.
- Thực hiện các bước trong tasks.md của change này:
  - Audit build config (vercel.json, vite.config.ts, package.json, tsconfig.json)
  - Chạy `npm run build` baseline
  - Fix lỗi build/lint/TypeScript
  - Cập nhật `memory-zone/AGENTS.md`
  - Tạo foundation components: ErrorBoundary, LoadingState, EmptyState, SkeletonCard
  - Tạo `docs/admin-dashboard/MIGRATION_RUNBOOK.md`
- Chạy `npm run build` cuối cùng để verify.
- Basejump reference: Không cần (Phase 0 là ổn định build, chưa học Basejump patterns).
```

### Phase 1.1 — Tách monolith thành pages

```text
Thực hiện Sub-Phase 1.1 — Tách monolith `pages/SystemAdminDashboard.tsx` (125KB) thành các page riêng biệt cho kế hoạch Basejump Admin Dashboard Enterprise Upgrade.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/SUB_PHASE_BREAKDOWN_BASEJUMP_ADMIN_DASHBOARD.md`, section Sub-Phase 1.1 (lines 82-120).
- Đọc OpenSpec change `basejump-admin-dashboard-phase-1-1` tại `C:\Users\SUACAUBA\openspec-stores\admin-dashboard\openspec\changes\basejump-admin-dashboard-phase-1-1\`.
- Thực hiện các bước trong tasks.md:
  - Tạo route structure trong App.tsx cho admin pages
  - Tách `SystemAdminDashboard.tsx` thành 13 page files: Overview, Tenants, TenantDetail, Members, Billing, BillingInvoices, BillingPayments, Audit, Settings, Security, Health, Onboarding
  - Giảm dòng `SystemAdminDashboard.tsx` xuống còn shell/wrapper
- Chạy `npm run build` sau mỗi task.
- Basejump reference: Chưa cần (Phase 1 chỉ là tách file, chưa áp dụng patterns mới).
```

### Phase 1.2 — Code splitting & Basejump UI components & Onboarding

```text
Thực hiện Sub-Phase 1.2 — Code splitting, Basejump UI components, Onboarding flow cho kế hoạch Basejump Admin Dashboard Enterprise Upgrade.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/SUB_PHASE_BREAKDOWN_BASEJUMP_ADMIN_DASHBOARD.md`, section Sub-Phase 1.2 (lines 124-153).
- Đọc OpenSpec change `basejump-admin-dashboard-phase-1-2` tại `C:\Users\SUACAUBA\openspec-stores\admin-dashboard\openspec\changes\basejump-admin-dashboard-phase-1-2\`.
- Thực hiện các bước trong tasks.md:
  - Thêm React.lazy() trong App.tsx
  - Tạo `components/admin/AccountSelector.tsx`, `UserAccountButton.tsx`, `AdminDashboardHeader.tsx`, `AdminSettingsNav.tsx`
  - Sửa `AdminShell.tsx` tích hợp component mới
  - Hoàn thiện `pages/admin/Onboarding.tsx` (nếu chưa xong)
  - Tạo `services/admin/tenantAdminService.ts`
- Chạy `npm run build` sau mỗi task.
- Basejump reference: Tham khảo Section 3.9 trong plan gốc — Basejump UI patterns (AccountSelector, UserAccountButton, DashboardHeader). Chuyển thể sang VietSale: `tenants` → `accounts`, `tenant_memberships` → `account_user`.
```

### Phase 2.1 — Service layer structure

```text
Thực hiện Sub-Phase 2.1 — Service layer structure & migrate queries từ UI vào service layer cho kế hoạch Basejump Admin Dashboard Enterprise Upgrade.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/SUB_PHASE_BREAKDOWN_BASEJUMP_ADMIN_DASHBOARD.md`, section Sub-Phase 2.1 (lines 159-201).
- Đọc OpenSpec change `basejump-admin-dashboard-phase-2-1` tại `C:\Users\SUACAUBA\openspec-stores\admin-dashboard\openspec\changes\basejump-admin-dashboard-phase-2-1\`.
- Thực hiện các bước trong tasks.md:
  - Tạo `services/admin/tenantAdminService.ts`, `memberAdminService.ts`, `billingAdminService.ts`, `auditAdminService.ts`, `systemAdminService.ts`, `permissions.ts`
  - Migrate queries từ page components vào service layer
- Lưu ý: `supabaseService.ts` (147KB) là file cực lớn, chỉ đọc phần liên quan đến admin.
- Chạy `npm run build` sau mỗi task.
- Basejump reference: Service layer pattern (mỗi domain một service file riêng), RPC-first, type-safe functions, error handling tập trung.
```

### Phase 2.2 — useAdminList hook & RPC contracts

```text
Thực hiện Sub-Phase 2.2 — useAdminList hook & RPC contracts documentation cho kế hoạch Basejump Admin Dashboard Enterprise Upgrade.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/SUB_PHASE_BREAKDOWN_BASEJUMP_ADMIN_DASHBOARD.md`, section Sub-Phase 2.2 (lines 204-234).
- Đọc OpenSpec change `basejump-admin-dashboard-phase-2-2` tại `C:\Users\SUACAUBA\openspec-stores\admin-dashboard\openspec\changes\basejump-admin-dashboard-phase-2-2\`.
- Thực hiện các bước trong tasks.md:
  - Tạo `hooks/useAdminList.ts` (generic hook với loading, search, pagination, filters, debounce)
  - Sửa `pages/admin/Tenants.tsx`, `Members.tsx`, `Audit.tsx`, `Billing.tsx` để dùng useAdminList
  - Tạo `docs/admin-dashboard/RPC_CONTRACTS.md`
- Chạy `npm run build` sau mỗi task.
- Basejump reference: useList pattern, RPC contract documentation pattern, API versioning best practices.
```

### Phase 3.1 — Schema migration & DB helper functions

```text
Thực hiện Sub-Phase 3.1 — Migration chuẩn hóa tenants/tenant_memberships & tạo DB helper functions cho RLS (kế hoạch Basejump Admin Dashboard Enterprise Upgrade).

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/SUB_PHASE_BREAKDOWN_BASEJUMP_ADMIN_DASHBOARD.md`, section Sub-Phase 3.1 (lines 241-268).
- Đọc OpenSpec change `basejump-admin-dashboard-phase-3-1` tại `C:\Users\SUACAUBA\openspec-stores\admin-dashboard\openspec\changes\basejump-admin-dashboard-phase-3-1\`.
- Thực hiện các bước trong tasks.md:
  - Tạo migration chuẩn hóa tenants/tenant_memberships (có up + down)
  - Tạo migration cho RLS helper functions (`has_tenant_role()`, `get_tenants_for_user()`, `is_tenant_owner()`)
  - Tạo migration cho user tracking triggers (`handle_new_user()`, `set_tenant_record_user_tracking()`)
- Chạy `npm run build` sau mỗi task.
- Basejump reference: Section 3.1 (standardize tenants), 3.2 (helper functions), 3.4 (personal tenant trigger), 3.5 (user tracking trigger).
```

### Phase 3.2 — RLS policies & permissions

```text
Thực hiện Sub-Phase 3.2 — Bật RLS trên tenants/tenant_memberships, tạo lib/permissions.ts, sửa edge functions (kế hoạch Basejump Admin Dashboard Enterprise Upgrade).

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/SUB_PHASE_BREAKDOWN_BASEJUMP_ADMIN_DASHBOARD.md`, section Sub-Phase 3.2 (lines 272-297).
- Đọc OpenSpec change `basejump-admin-dashboard-phase-3-2` tại `C:\Users\SUACAUBA\openspec-stores\admin-dashboard\openspec\changes\basejump-admin-dashboard-phase-3-2\`.
- Thực hiện các bước trong tasks.md:
  - Tạo migration enable RLS trên `tenants` và `tenant_memberships`
  - Tạo `lib/permissions.ts` với role-checking functions
  - Sửa edge functions để inject permissions
  - Sửa `services/admin/permissions.ts` nếu cần
- Chạy `npm run build` sau mỗi task.
- Basejump reference: Section 3.3 (RLS policies pattern — `select` → members, `update/insert` → admins, `delete` → owners + system_admin fallback).
```

### Phase 3.3 — RLS cho tenant-scoped tables & User tracking triggers

```text
Thực hiện Sub-Phase 3.3 — Áp dụng RLS cho tất cả bảng tenant-scoped & thêm user tracking triggers (kế hoạch Basejump Admin Dashboard Enterprise Upgrade).

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/SUB_PHASE_BREAKDOWN_BASEJUMP_ADMIN_DASHBOARD.md`, section Sub-Phase 3.3 (lines 300-325).
- Đọc OpenSpec change `basejump-admin-dashboard-phase-3-3` tại `C:\Users\SUACAUBA\openspec-stores\admin-dashboard\openspec\changes\basejump-admin-dashboard-phase-3-3\`.
- Thực hiện các bước trong tasks.md:
  - Tạo migration RLS cho các bảng tenant-scoped (products, orders, customers, suppliers, categories, brands, ...)
  - Tạo migration user tracking triggers
- Chạy `npm run build` sau mỗi task.
- Basejump reference: Section 3.3 (RLS pattern), Section 3.5 (user tracking trigger `set_tenant_record_user_tracking()`).
```

### Phase 4.1 — Billing schema & UI components & Lifecycle

```text
Thực hiện Sub-Phase 4.1 — Cập nhật billing schema, tách UI components, subscription lifecycle (kế hoạch Basejump Admin Dashboard Enterprise Upgrade).

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/SUB_PHASE_BREAKDOWN_BASEJUMP_ADMIN_DASHBOARD.md`, section Sub-Phase 4.1 (lines 333-368).
- Đọc OpenSpec change `basejump-admin-dashboard-phase-4-1` tại `C:\Users\SUACAUBA\openspec-stores\admin-dashboard\openspec\changes\basejump-admin-dashboard-phase-4-1\`.
- Thực hiện các bước trong tasks.md:
  - Tạo migration cập nhật billing schema
  - Tạo `components/SubscriptionManager.tsx`, `PaymentManager.tsx`
  - Sửa `components/InvoiceManager.tsx`, `pages/admin/Billing.tsx`
  - Sửa `services/admin/billingAdminService.ts`
- Chạy `npm run build` sau mỗi task.
- Basejump reference: Billing schema (`billing_customers`, `billing_subscriptions`), subscription lifecycle (`trialing` → `active` → `past_due` → `suspended` → `cancelled`).
```

### Phase 4.2 — Billing provider abstraction & Feature gating

```text
Thực hiện Sub-Phase 4.2 — Tạo BillingProvider interface + 4 providers & feature gating (kế hoạch Basejump Admin Dashboard Enterprise Upgrade).

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/SUB_PHASE_BREAKDOWN_BASEJUMP_ADMIN_DASHBOARD.md`, section Sub-Phase 4.2 (lines 370-403).
- Đọc OpenSpec change `basejump-admin-dashboard-phase-4-2` tại `C:\Users\SUACAUBA\openspec-stores\admin-dashboard\openspec\changes\basejump-admin-dashboard-phase-4-2\`.
- Thực hiện các bước trong tasks.md:
  - Tạo `types/billing.ts`, `services/admin/billingProviderRegistry.ts`
  - Tạo 4 providers: `stripeProvider.ts`, `momoProvider.ts`, `vnpayProvider.ts`, `bankTransferProvider.ts`
  - Tạo `supabase/functions/billing-webhooks/index.ts`
  - Tạo migration `xxxx_create_plan_features.sql`
  - Sửa `supabase/config.toml`, `services/admin/permissions.ts`, `lib/permissions.ts`
- Chạy `npm run build` sau mỗi task.
- Basejump reference: Section 3.6 (Billing provider abstraction — `BillingProvider` interface, registry, webhook handler), Section 3.7 (Feature gating — `can_use_feature()`, `plan_features` table).
```

### Phase 5.1 — Invitations & RBAC

```text
Thực hiện Sub-Phase 5.1 — Flow mời thành viên & phân quyền chi tiết theo role (kế hoạch Basejump Admin Dashboard Enterprise Upgrade).

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/SUB_PHASE_BREAKDOWN_BASEJUMP_ADMIN_DASHBOARD.md`, section Sub-Phase 5.1 (lines 411-447).
- Đọc OpenSpec change `basejump-admin-dashboard-phase-5-1` tại `C:\Users\SUACAUBA\openspec-stores\admin-dashboard\openspec\changes\basejump-admin-dashboard-phase-5-1\`.
- Thực hiện các bước trong tasks.md:
  - Tạo migration `xxxx_create_invitations_table.sql`
  - Tạo `supabase/functions/send-invitation-email/index.ts`
  - Sửa `components/MemberManagement/MemberInviteModal.tsx`
  - Sửa `services/admin/memberAdminService.ts` (thêm invitation logic)
  - Sửa `lib/permissions.ts` (thêm RBAC matrix)
  - Sửa `types.ts` (thêm role enum)
- Chạy `npm run build` sau mỗi task.
- Basejump reference: `basejump-invitations` pattern (flow mời thành viên), Basejump permissions matrix, role-based access control.
```

### Phase 5.2 — Audit log & Security hardening

```text
Thực hiện Sub-Phase 5.2 — Audit log triggers & security hardening (2FA, IP allowlist, session timeout, brute-force) cho kế hoạch Basejump Admin Dashboard Enterprise Upgrade.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/SUB_PHASE_BREAKDOWN_BASEJUMP_ADMIN_DASHBOARD.md`, section Sub-Phase 5.2 (lines 450-488).
- Đọc OpenSpec change `basejump-admin-dashboard-phase-5-2` tại `C:\Users\SUACAUBA\openspec-stores\admin-dashboard\openspec\changes\basejump-admin-dashboard-phase-5-2\`.
- Thực hiện các bước trong tasks.md:
  - Tạo 4 migration files: audit_log_table, audit triggers, admin_security_settings, login_audit_triggers
  - Sửa `services/admin/auditAdminService.ts`, `pages/admin/Audit.tsx`
  - Sửa `components/TwoFactorManager.tsx`, `pages/admin/Security.tsx`
  - Sửa `services/admin/systemAdminService.ts`
- Chạy `npm run build` sau mỗi task.
- Basejump reference: Basejump audit triggers pattern, Basejump security best practices (2FA, IP allowlist).
```

### Phase 6.1 — pgtap DB tests

```text
Thực hiện Sub-Phase 6.1 — pgtap tests cho DB (helper functions, RLS, billing, audit log) cho kế hoạch Basejump Admin Dashboard Enterprise Upgrade.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/SUB_PHASE_BREAKDOWN_BASEJUMP_ADMIN_DASHBOARD.md`, section Sub-Phase 6.1 (lines 496-523).
- Đọc OpenSpec change `basejump-admin-dashboard-phase-6-1` tại `C:\Users\SUACAUBA\openspec-stores\admin-dashboard\openspec\changes\basejump-admin-dashboard-phase-6-1\`.
- Thực hiện các bước trong tasks.md:
  - Tạo `supabase/migrations/xxxx_install_pgtap.sql`
  - Tạo `supabase/tests/admin/000_helpers.sql` (test helpers)
  - Tạo `test_helper_functions.sql`, `test_rls_policies.sql`, `test_billing.sql`, `test_audit_log.sql`
  - Sửa `memory-zone/AGENTS.md` thêm DB test commands
- Chạy `npm run build` sau mỗi task.
- Basejump reference: Section 3.8 (Testing helpers — `tests.create_supabase_user()`, `tests.authenticate_as()`, ví dụ `test_tenant_rls.sql`).
```

### Phase 6.2 — Vitest UI tests & CI pipeline

```text
Thực hiện Sub-Phase 6.2 — Vitest UI tests & CI pipeline cho kế hoạch Basejump Admin Dashboard Enterprise Upgrade.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/SUB_PHASE_BREAKDOWN_BASEJUMP_ADMIN_DASHBOARD.md`, section Sub-Phase 6.2 (lines 526-554).
- Đọc OpenSpec change `basejump-admin-dashboard-phase-6-2` tại `C:\Users\SUACAUBA\openspec-stores\admin-dashboard\openspec\changes\basejump-admin-dashboard-phase-6-2\`.
- Thực hiện các bước trong tasks.md:
  - Tạo `tests/admin-dashboard/Overview.test.tsx`, `Tenants.test.tsx`, `Members.test.tsx`, `Billing.test.tsx`, `Audit.test.tsx`, `Security.test.tsx`
  - Tạo `.github/workflows/ci.yml`
  - Sửa `package.json` thêm pre-commit script
- Chạy `npm run build` sau mỗi task.
- Basejump reference: Không cần (UI tests + CI là generic).
```

### Phase 7.1 — Real-time notifications & Background jobs

```text
Thực hiện Sub-Phase 7.1 — Real-time notifications & background jobs cho kế hoạch Basejump Admin Dashboard Enterprise Upgrade.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/SUB_PHASE_BREAKDOWN_BASEJUMP_ADMIN_DASHBOARD.md`, section Sub-Phase 7.1 (lines 562-588).
- Đọc OpenSpec change `basejump-admin-dashboard-phase-7-1` tại `C:\Users\SUACAUBA\openspec-stores\admin-dashboard\openspec\changes\basejump-admin-dashboard-phase-7-1\`.
- Thực hiện các bước trong tasks.md:
  - Tạo migration `xxxx_admin_realtime_broadcast.sql`
  - Tạo `hooks/useAdminRealtime.ts`, `components/AdminNotificationBell.tsx`
  - Tạo migration `xxxx_admin_cron_jobs.sql`
  - Tạo `supabase/functions/cron-admin-tasks/index.ts`
  - Sửa `pages/admin/Health.tsx`, `components/SystemHealthPanel.tsx`
- Chạy `npm run build` sau mỗi task.
- Basejump reference: Không cần thiết (real-time và cron là Supabase built-in features).
```

### Phase 7.2 — Advanced analytics & GDPR compliance

```text
Thực hiện Sub-Phase 7.2 — Analytics dashboard & GDPR compliance cho kế hoạch Basejump Admin Dashboard Enterprise Upgrade.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/Admin_dashboard/SUB_PHASE_BREAKDOWN_BASEJUMP_ADMIN_DASHBOARD.md`, section Sub-Phase 7.2 (lines 591-615).
- Đọc OpenSpec change `basejump-admin-dashboard-phase-7-2` tại `C:\Users\SUACAUBA\openspec-stores\admin-dashboard\openspec\changes\basejump-admin-dashboard-phase-7-2\`.
- Thực hiện các bước trong tasks.md:
  - Tạo `pages/admin/Analytics.tsx`
  - Tạo `services/admin/analyticsAdminService.ts`
  - Tạo migration `xxxx_gdpr_export_functions.sql`
  - Sửa `pages/admin/Compliance.tsx`
  - Tạo `services/admin/complianceAdminService.ts`
- Chạy `npm run build` sau mỗi task.
- Basejump reference: Không cần thiết (analytics và GDPR là tính năng riêng).