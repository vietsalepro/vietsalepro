# Sub-Phase Breakdown: Basejump Admin Dashboard Enterprise Upgrade

> **Mục tiêu:** Chia mỗi Phase (0–7) trong `PLAN_BASEJUMP_ADMIN_DASHBOARD_ENTERPRISE_UPGRADE.md` thành các sub-phase nhỏ, mỗi sub-phase ≤ 180K tokens context khi implement (để đảm bảo an toàn trong giới hạn 220K của AI Agent).

> **Nguyên tắc đánh giá context:**
> - 1 token ≈ 4 bytes code (TypeScript/React/SQL)
> - 1 token ≈ 5 bytes văn bản (Markdown/docs)
> - System prompt + instruction overhead: ~20K tokens
> - Plan section overhead: ~15K tokens
> - Tool call history overhead: ~10K tokens
> - **Do đó, code budget thực tế ≈ 220K - 40K = 180K tokens**
> - Mỗi file cần đọc đều được tính vào budget này

> **Lưu ý:** Khi thực hiện mỗi sub-phase, Agent cần được yêu cầu:
> - Tham khảo code pattern, migration SQL, trigger, RLS function, billing wrapper, testing helpers từ basejump (nếu sub-phase có liên quan)
> - Kiểm tra build sau mỗi task
> - Chỉ implement đúng scope của sub-phase, không làm thêm

---

## Phân tích kích thước file quan trọng

| File | Kích thước (bytes) | ~Tokens |
|------|-------------------|---------|
| `pages/SystemAdminDashboard.tsx` | 125,755 | ~31,500 |
| `App.tsx` | 66,012 | ~16,500 |
| `services/supabaseService.ts` | 147,011 | ~36,750 |
| `services/tenantService.ts` | 30,909 | ~7,700 |
| Các migration SQL hiện có | 347 – 36,288 | ~85 – 9,000 |
| Baseline migration | 525,665 | ~131,500 ⚠️ |
| `components/AdminShell.tsx` | 5,988 | ~1,500 |
| `components/AdminSidebar.tsx` | 8,763 | ~2,200 |

---

## Phase 0 — Ổn định build & test hiện tại

**Tổng context estimate:** ~50K tokens → **1 sub-phase** là đủ.

### Sub-Phase 0.1: Build & Lint & TypeScript & Foundation Components

**Scope:** Tất cả 6 tasks của Phase 0 (Task 0.1 → 0.6)

**Files cần đọc:**
- `vercel.json` (<1KB)
- `vite.config.ts` (~2KB)
- `package.json` (~3KB)
- `tsconfig.json` (~1KB)
- `memory-zone/AGENTS.md` (để biết build/test commands)
- **Không cần đọc** `SystemAdminDashboard.tsx` (chỉ kiểm tra build)

**Files cần tạo/sửa:**
- `vercel.json` (sửa nhẹ)
- `vite.config.ts` (sửa nhẹ)
- `package.json` (sửa nhẹ)
- `memory-zone/AGENTS.md` (sửa)
- `docs/admin-dashboard/MIGRATION_RUNBOOK.md` (tạo mới)
- `components/ErrorBoundary.tsx` (tạo mới)
- `components/LoadingState.tsx` (tạo mới)
- `components/EmptyState.tsx` (tạo mới)
- `components/SkeletonCard.tsx` (tạo mới)
- OpenSpec files nếu cần

**Context consumption estimate:**
- Đọc code hiện tại: ~10KB → ~2.5K tokens
- Tạo/sửa 10 files: ~30KB → ~7.5K tokens  
- Plan section + system overhead: ~40K tokens
- **Tổng: ~50K tokens** ✅ An toàn

**Basejump reference:** Không cần (Phase 0 là ổn định build, chưa học Basejump patterns)

**Thứ tự thực hiện:**
1. Task 0.1 → 0.2 → 0.3 → 0.6 → 0.4 → 0.5 (theo đúng thứ tự trong plan gốc)
2. Kiểm tra build cuối cùng

---

## Phase 1 — Tách layout & routing

**Tổng context estimate:** ~140K tokens → **2 sub-phases** (1.1–1.4 + 1.5–1.7)

### Sub-Phase 1.1: Tách monolith thành pages (Tasks 1.1 → 1.4)

**Scope:** Tạo route structure, tách Overview, Tenants/TenantDetail, Members/Billing/Audit/Settings từ `SystemAdminDashboard.tsx`

**Files cần đọc:**
- `pages/SystemAdminDashboard.tsx` (125KB → **phải đọc toàn bộ để refactor** → ~31K tokens) ⚠️
- `App.tsx` (66KB → phải đọc router → ~16K tokens) ⚠️
- `components/AdminShell.tsx` (~1.5K tokens)
- `components/AdminSidebar.tsx` (~2.2K tokens)
- `components/AdminTabs.tsx` (nếu có)
- `components/AdminKpiCards.tsx` (nếu có)

**Files cần tạo/sửa:**
- `App.tsx` (sửa routing)
- `pages/admin/Onboarding.tsx` (tạo mới)
- `pages/admin/Overview.tsx` (tạo mới)
- `pages/admin/Tenants.tsx` (tạo mới)
- `pages/admin/TenantDetail.tsx` (tạo mới)
- `pages/admin/Members.tsx` (tạo mới)
- `pages/admin/Billing.tsx` (tạo mới)
- `pages/admin/BillingInvoices.tsx` (tạo mới)
- `pages/admin/BillingPayments.tsx` (tạo mới)
- `pages/admin/Audit.tsx` (tạo mới)
- `pages/admin/Settings.tsx` (tạo mới)
- `pages/admin/Security.tsx` (tạo mới)
- `pages/admin/Health.tsx` (tạo mới)
- `pages/SystemAdminDashboard.tsx` (sửa — giảm dòng)

**Context consumption estimate:**
- Đọc `SystemAdminDashboard.tsx`: 125KB → ~31K tokens
- Đọc `App.tsx`: 66KB → ~16K tokens
- Đọc AdminShell + AdminSidebar: ~14KB → ~3.5K tokens
- Tạo 13 page files + sửa 2 files: ~80KB → ~20K tokens
- Plan section + system overhead: ~40K tokens
- **Tổng: ~110K tokens** ✅ An toàn (dưới 180K)

**Cảnh báo:** Task 1.4 ("Large — cần chia nhỏ") chiếm nhiều nhất. Nếu trong quá trình implement thấy quá tải, Agent có thể tách Members/Billing/Audit/Settings thành từng commit riêng trong cùng session.

**Basejump reference:** Chưa cần (Phase 1 chỉ là tách file, chưa áp dụng patterns mới)

---

### Sub-Phase 1.2: Code splitting & Basejump UI components & Onboarding (Tasks 1.5 → 1.7)

**Scope:** React.lazy(), tạo AccountSelector, UserAccountButton, AdminDashboardHeader, AdminSettingsNav, Onboarding flow

**Files cần đọc:**
- `App.tsx` (đã đọc ở sub-phase 1.1, có thể dùng lại context)
- `components/AdminShell.tsx` (đã đọc ở sub-phase 1.1)
- `components/LoadingState.tsx` (đã tạo ở Phase 0)

**Files cần tạo/sửa:**
- `App.tsx` (sửa — thêm React.lazy)
- `components/admin/AccountSelector.tsx` (tạo mới)
- `components/admin/UserAccountButton.tsx` (tạo mới)
- `components/admin/AdminDashboardHeader.tsx` (tạo mới)
- `components/admin/AdminSettingsNav.tsx` (tạo mới)
- `components/AdminShell.tsx` (sửa — tích hợp component mới)
- `pages/admin/Onboarding.tsx` (tạo mới — nếu chưa xong ở sub-phase 1.1)
- `services/admin/tenantAdminService.ts` (tạo mới)

**Context consumption estimate:**
- Đọc App.tsx + AdminShell: ~20K tokens (có thể dùng lại từ sub-phase 1.1 nếu session liên tục)
- Tạo 7 files mới + sửa 2 files: ~40KB → ~10K tokens
- Plan section + overhead: ~40K tokens
- **Tổng: ~70K tokens** ✅ An toàn

**Basejump reference:** Cần tham khảo Section 3.9 trong plan gốc:
- Basejump UI patterns (AccountSelector, UserAccountButton, DashboardHeader)
- Chuyển thể sang VietSale: `tenants` → `accounts`, `tenant_memberships` → `account_user`

---

## Phase 2 — Chuẩn hóa service layer theo Basejump

**Tổng context estimate:** ~200K tokens → **2 sub-phases** (2.1–2.3 + 2.4–2.5)

### Sub-Phase 2.1: Service layer structure & migrate queries (Tasks 2.1 → 2.3)

**Scope:** Tạo services/admin/*.ts, migrate queries từ UI vào service layer

**Files cần đọc:**
- `services/supabaseService.ts` (147KB → ~37K tokens) ⚠️ **Đây là file rất lớn**
- `services/tenantService.ts` (31KB → ~7.7K tokens)
- `services/auditService.ts` (~1K tokens)
- `services/subscriptionService.ts` (~0.6K tokens)
- `services/systemAdminService.ts` (~0.6K tokens)
- `pages/admin/*.tsx` (các page vừa tạo ở Phase 1)
- `lib/supabase.ts` (~0.3K tokens)
- `contexts/AuthContext.tsx`
- `contexts/TenantContext.tsx`

**Files cần tạo/sửa:**
- `services/admin/tenantAdminService.ts` (tạo mới)
- `services/admin/memberAdminService.ts` (tạo mới)
- `services/admin/billingAdminService.ts` (tạo mới)
- `services/admin/auditAdminService.ts` (tạo mới)
- `services/admin/systemAdminService.ts` (tạo mới)
- `services/admin/permissions.ts` (tạo mới)
- Các page components (sửa — gọi service thay vì query trực tiếp)

**Context consumption estimate:**
- Đọc `supabaseService.ts`: 147KB → ~37K tokens ⚠️ **Critical!**
- Đọc `tenantService.ts` + các service khác: ~40KB → ~10K tokens
- Đọc các page components: ~30KB → ~7.5K tokens
- Tạo 6 service files + sửa pages: ~50KB → ~12.5K tokens
- Plan section + overhead: ~40K tokens
- **Tổng: ~107K tokens** ✅ An toàn (nếu chỉ đọc một phần supabaseService.ts)

> ⚠️ **Lưu ý:** `supabaseService.ts` (147KB) là file cực lớn. Agent cần đọc có chọn lọc:
> - Chỉ đọc các phần liên quan đến admin (tenant, billing, member, audit, system)
> - Không cần đọc phần POS, inventory, orders, customers
> - Hoặc chia nhỏ: đọc từng service function khi cần

**Basejump reference:** Tham khảo pattern:
- Basejump service layer pattern: mỗi domain một service file riêng
- RPC-first: gọi RPC thay vì query trực tiếp
- Type-safe functions, không export raw Supabase client
- Error handling tập trung

---

### Sub-Phase 2.2: useAdminList hook & API contracts (Tasks 2.4 → 2.5)

**Scope:** Tạo generic `useAdminList` hook, RPC contracts documentation

**Files cần đọc:**
- `pages/admin/Tenants.tsx` (để hiểu pattern list/search/pagination)
- `pages/admin/Members.tsx`
- `pages/admin/Audit.tsx`
- `pages/admin/Billing.tsx`
- `hooks/useDebounce.ts` (nếu có)
- `hooks/useClickOutside.ts` (nếu có)

**Files cần tạo/sửa:**
- `hooks/useAdminList.ts` (tạo mới)
- `pages/admin/Tenants.tsx` (sửa — dùng useAdminList)
- `pages/admin/Members.tsx` (sửa)
- `pages/admin/Audit.tsx` (sửa)
- `pages/admin/Billing.tsx` (sửa)
- `docs/admin-dashboard/RPC_CONTRACTS.md` (tạo mới)

**Context consumption estimate:**
- Đọc 4 page components: ~40KB → ~10K tokens
- Tạo hook + sửa pages + docs: ~30KB → ~7.5K tokens
- Plan section + overhead: ~40K tokens
- **Tổng: ~57K tokens** ✅ An toàn

**Basejump reference:** Tham khảo:
- Basejump `useList` pattern (nếu có)
- RPC contract documentation pattern
- API versioning best practices

---

## Phase 3 — Áp dụng Basejump account/team model & RLS

**Tổng context estimate:** ~230K tokens → **3 sub-phases** (3.1–3.2, 3.3–3.5, 3.6–3.7)

### Sub-Phase 3.1: Migration chuẩn hóa schema & DB helper functions (Tasks 3.1 → 3.2)

**Scope:** Migration chuẩn hóa tenants/tenant_memberships, tạo DB helper functions cho RLS

**Files cần đọc:**
- Migration files hiện có (để hiểu schema hiện tại):
  - `20250704000000_phase2_tenant_foundation.sql` (7KB)
  - `20250712000013_add_viewer_role.sql` (~3.6KB)
  - `20250712000007_add_rls_policies_tenant_memberships.sql` (~1.4KB)
- `supabase/seed.sql` (nếu có)
- **Không đọc** baseline migration (525KB — quá lớn, chỉ đọc các migration nhỏ liên quan)

**Files cần tạo/sửa:**
- `supabase/migrations/xxxx_standardize_tenants_and_memberships.sql` (tạo mới)
- `supabase/migrations/xxxx_standardize_tenants_and_memberships_down.sql` (tạo mới)
- `supabase/migrations/xxxx_create_rls_helper_functions.sql` (tạo mới)

**Context consumption estimate:**
- Đọc 3 migration files hiện có: ~12KB → ~3K tokens
- Tạo 3 migration files mới: ~30KB → ~7.5K tokens
- Plan section + overhead: ~40K tokens
- **Tổng: ~50K tokens** ✅ An toàn

**Basejump reference:** Cần tham khảo Section 3.1, 3.2, 3.4 trong plan gốc:
- ⚡ **Migration SQL:** Section 3.1 — standardize tenants & tenant_memberships
- ⚡ **Helper functions:** Section 3.2 — `has_tenant_role()`, `get_tenants_for_user()`, `is_tenant_owner()`
- ⚡ **Personal tenant trigger:** Section 3.4 — `handle_new_user()`
- ⚡ **User tracking trigger:** Section 3.5 — `set_tenant_record_user_tracking()`

---

### Sub-Phase 3.2: RLS policies + permissions.ts + Edge functions (Tasks 3.3 → 3.5)

**Scope:** Bật RLS trên tenants/tenant_memberships, tạo lib/permissions.ts, sửa edge functions

**Files cần đọc:**
- `supabase/migrations/xxxx_enable_rls_tenants.sql` (vừa tạo ở sub-phase 3.1)
- `lib/permissions.ts` (nếu đã có)
- `supabase/functions/**/*.ts` (các edge functions — xem từng file)
- `services/admin/permissions.ts` (đã tạo ở Phase 2)

**Files cần tạo/sửa:**
- `supabase/migrations/xxxx_enable_rls_tenants.sql` (tạo mới)
- `lib/permissions.ts` (tạo mới)
- Các edge functions (sửa)
- `services/admin/permissions.ts` (sửa)

**Context consumption estimate:**
- Đọc edge functions: ~50KB → ~12.5K tokens
- Tạo migration + sửa files: ~20KB → ~5K tokens
- Plan section + overhead: ~40K tokens
- **Tổng: ~57K tokens** ✅ An toàn

**Basejump reference:** Cần tham khảo Section 3.3 trong plan gốc:
- ⚡ **RLS policies:** Section 3.3 — pattern cho mọi bảng tenant-scoped
- RLS pattern: `select` → members, `update/insert` → admins, `delete` → owners + system_admin fallback

---

### Sub-Phase 3.3: RLS cho tenant-scoped tables & User tracking triggers (Tasks 3.6 → 3.7)

**Scope:** Áp dụng RLS cho tất cả bảng tenant-scoped (products, orders, customers, ...), thêm user tracking triggers

**Files cần đọc:**
- `supabase/migrations/` — các migration đã có để biết bảng nào cần tenant_id
- `services/admin/permissions.ts` (đã tạo ở sub-phase 3.2)
- Các migration hiện có về RLS:
  - `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` (~20KB)
  - `20260708000003_fix_update_tenant_overload.sql`
  - Các migration phase5_2, phase5_3

**Files cần tạo/sửa:**
- `supabase/migrations/xxxx_enable_rls_tenant_scoped_tables.sql` (tạo mới)
- `supabase/migrations/xxxx_create_user_tracking_triggers.sql` (tạo mới)

**Context consumption estimate:**
- Đọc migration hiện có về RLS: ~30KB → ~7.5K tokens
- Tạo 2 migration files: ~25KB → ~6K tokens
- Plan + overhead: ~40K tokens
- **Tổng: ~53K tokens** ✅ An toàn

**Basejump reference:** Cần tham khảo Section 3.3 và 3.5 trong plan gốc:
- ⚡ **RLS pattern:** Section 3.3 — áp dụng cho products, orders, customers, suppliers, categories, brands
- ⚡ **User tracking trigger:** Section 3.5 — `set_tenant_record_user_tracking()`

---

## Phase 4 — Billing & Subscription enterprise

**Tổng context estimate:** ~160K tokens → **2 sub-phases** (4.1–4.3 + 4.4–4.5)

### Sub-Phase 4.1: Billing schema + UI components + Lifecycle (Tasks 4.1 → 4.3)

**Scope:** Cập nhật `tenant_subscriptions` schema, tách UI billing components, subscription lifecycle

**Files cần đọc:**
- `services/subscriptionService.ts`
- `services/billingAutomationService.ts`
- `services/billingReminderService.ts`
- `pages/admin/Billing.tsx` (đã tạo ở Phase 1)
- `components/BillingAutomationDashboard.tsx` (nếu có)
- `components/BillingConfig.tsx` (nếu có)
- `components/BillingReminderConfig.tsx` (nếu có)
- Các migration billing hiện có:
  - `20250706000006_phase_p7_0_read_only_tenant_infra.sql` (~36KB)
  - `20250706000007_phase_p7_1_billing_schema_bank_config.sql` (~8KB)
  - `20250706000008_phase_p7_2_invoice_create_pricing.sql` (~4.6KB)
  - `20250706000009_phase_p7_3_payment_confirm_lifecycle.sql` (~4.2KB)

**Files cần tạo/sửa:**
- `supabase/migrations/xxxx_update_billing_schema.sql` (tạo mới)
- `components/SubscriptionManager.tsx` (tạo mới)
- `components/InvoiceManager.tsx` (sửa)
- `components/PaymentManager.tsx` (tạo mới)
- `pages/admin/Billing.tsx` (sửa)
- `services/admin/billingAdminService.ts` (sửa)

**Context consumption estimate:**
- Đọc billing services + pages + migrations: ~80KB → ~20K tokens
- Tạo/sửa 6 files: ~40KB → ~10K tokens
- Plan + overhead: ~40K tokens
- **Tổng: ~70K tokens** ✅ An toàn

**Basejump reference:** Tham khảo:
- Basejump billing schema: `billing_customers`, `billing_subscriptions`
- Subscription lifecycle: `trialing` → `active` → `past_due` → `suspended` → `cancelled`

---

### Sub-Phase 4.2: Billing provider abstraction & Feature gating (Tasks 4.4 → 4.5)

**Scope:** Tạo BillingProvider interface + 4 providers (Stripe, Momo, VNPay, bank transfer), plan_features + can_use_feature

**Files cần đọc:**
- `types.ts` (types hiện có)
- `services/admin/billingAdminService.ts` (đã tạo ở sub-phase 4.1)
- `supabase/functions/_shared/` (các shared utilities cho edge functions)
- `supabase/config.toml`

**Files cần tạo/sửa:**
- `types/billing.ts` (tạo mới)
- `services/admin/billingProviderRegistry.ts` (tạo mới)
- `services/admin/providers/stripeProvider.ts` (tạo mới)
- `services/admin/providers/momoProvider.ts` (tạo mới)
- `services/admin/providers/vnpayProvider.ts` (tạo mới)
- `services/admin/providers/bankTransferProvider.ts` (tạo mới)
- `supabase/functions/billing-webhooks/index.ts` (tạo mới)
- `supabase/config.toml` (sửa)
- `supabase/migrations/xxxx_create_plan_features.sql` (tạo mới)
- `services/admin/permissions.ts` (sửa — thêm feature gating)
- `lib/permissions.ts` (sửa — thêm can_use_feature)

**Context consumption estimate:**
- Đọc types + config: ~10KB → ~2.5K tokens
- Tạo 8 files mới + sửa 3 files: ~60KB → ~15K tokens
- Plan + overhead: ~40K tokens
- **Tổng: ~57K tokens** ✅ An toàn

**Basejump reference:** Cần tham khảo Section 3.6 và 3.7 trong plan gốc:
- ⚡ **Billing provider abstraction:** Section 3.6 — `BillingProvider` interface, registry, edge function wrapper, webhook handler
- ⚡ **Feature gating:** Section 3.7 — `can_use_feature()`, `plan_features` table
- Basejump pattern: `billingFunctionsWrapper`, `stripeFunctionHandler`, `stripeWebhookHandler`

---

## Phase 5 — RBAC, invitations, audit logs, security hardening

**Tổng context estimate:** ~140K tokens → **2 sub-phases**

### Sub-Phase 5.1: Invitations & RBAC (Tasks 5.1 → 5.2)

**Scope:** Flow mời thành viên + phân quyền chi tiết theo role

**Files cần đọc:**
- `components/MemberManagement/MemberInviteModal.tsx` (nếu có)
- `services/admin/memberAdminService.ts` (đã tạo ở Phase 2)
- `lib/permissions.ts` (đã tạo ở Phase 3)
- `types.ts` (role types hiện có)
- `components/MemberManagement/` (cả thư mục)
- Các migration member hiện có:
  - `20260711000003_f33_members_foundation.sql`
  - `20260711000004_f33_members_search_rpc.sql`
  - `20260711000005_f33_members_guardrails.sql`
  - `20260711000006_f33_invite_rate_limit_tenant.sql`
  - `20260711000007_f33_members_status_activation.sql`
  - `20260712000013_add_viewer_role.sql`

**Files cần tạo/sửa:**
- `supabase/migrations/xxxx_create_invitations_table.sql` (tạo mới)
- `supabase/functions/send-invitation-email/index.ts` (tạo mới)
- `components/MemberManagement/MemberInviteModal.tsx` (sửa)
- `services/admin/memberAdminService.ts` (sửa — thêm invitation logic)
- `lib/permissions.ts` (sửa — thêm RBAC matrix)
- `types.ts` (sửa — thêm role enum)
- `supabase/migrations/xxxx_add_role_enum.sql` (tạo mới — nếu cần)

**Context consumption estimate:**
- Đọc member components + services + migrations: ~50KB → ~12.5K tokens
- Tạo/sửa 7 files: ~35KB → ~8.5K tokens
- Plan + overhead: ~40K tokens
- **Tổng: ~61K tokens** ✅ An toàn

**Basejump reference:** Tham khảo:
- `basejump-invitations` pattern (flow mời thành viên)
- Basejump permissions matrix
- Role-based access control

---

### Sub-Phase 5.2: Audit log & Security hardening (Tasks 5.3 → 5.4)

**Scope:** Audit log triggers, security hardening (2FA, IP allowlist, session timeout, brute-force)

**Files cần đọc:**
- `services/auditService.ts`
- `services/twoFactorService.ts`
- `services/loginHistoryService.ts`
- `pages/admin/Audit.tsx` (đã tạo ở Phase 1)
- `pages/admin/Security.tsx` (đã tạo ở Phase 1)
- `components/TwoFactorManager.tsx`
- `components/MfaChallenge.tsx`
- Các migration audit/security hiện có:
  - `20250708000013_phase_p17_1_2fa_totp.sql`
  - `20250708000014_phase_p17_2_login_history.sql`
  - `20250705000009_phase11_audit_log_triggers.sql`
  - `20250712000008_add_audit_log_triggers.sql`

**Files cần tạo/sửa:**
- `supabase/migrations/xxxx_create_audit_log_table.sql` (tạo mới)
- `supabase/migrations/xxxx_create_audit_triggers.sql` (tạo mới)
- `supabase/migrations/xxxx_admin_security_settings.sql` (tạo mới)
- `supabase/migrations/xxxx_login_audit_triggers.sql` (tạo mới)
- `services/admin/auditAdminService.ts` (sửa)
- `pages/admin/Audit.tsx` (sửa)
- `components/TwoFactorManager.tsx` (sửa)
- `pages/admin/Security.tsx` (sửa)
- `services/admin/systemAdminService.ts` (sửa)

**Context consumption estimate:**
- Đọc audit/security services + migrations: ~60KB → ~15K tokens
- Tạo 4 migrations + sửa 5 files: ~50KB → ~12.5K tokens
- Plan + overhead: ~40K tokens
- **Tổng: ~67K tokens** ✅ An toàn

**Basejump reference:** Tham khảo:
- Basejump audit triggers pattern
- Basejump security best practices (2FA, IP allowlist)

---

## Phase 6 — Testing & CI

**Tổng context estimate:** ~130K tokens → **2 sub-phases** (6.1–6.2 + 6.3–6.5)

### Sub-Phase 6.1: pgtap tests cho DB (Tasks 6.1 → 6.2 + 6.5)

**Scope:** Cài đặt pgtap, viết DB tests cho helper functions, RLS, billing, audit log

**Files cần đọc:**
- `supabase/migrations/` — các migration đã tạo ở Phase 3, 4, 5
- Các RPC functions đã tạo
- `supabase/seed.sql` (nếu có)

**Files cần tạo/sửa:**
- `supabase/migrations/xxxx_install_pgtap.sql` (tạo mới)
- `supabase/tests/admin/000_helpers.sql` (tạo mới)
- `supabase/tests/admin/test_helper_functions.sql` (tạo mới)
- `supabase/tests/admin/test_rls_policies.sql` (tạo mới)
- `supabase/tests/admin/test_billing.sql` (tạo mới)
- `supabase/tests/admin/test_audit_log.sql` (tạo mới)
- `memory-zone/AGENTS.md` (sửa — thêm DB test commands)

**Context consumption estimate:**
- Đọc SQL functions + migrations: ~40KB → ~10K tokens
- Tạo 7 test files: ~30KB → ~7.5K tokens
- Plan + overhead: ~40K tokens
- **Tổng: ~57K tokens** ✅ An toàn

**Basejump reference:** Cần tham khảo Section 3.8 trong plan gốc:
- ⚡ **Testing helpers:** Section 3.8 — `tests.create_supabase_user()`, `tests.authenticate_as()`
- ⚡ **Ví dụ test RLS:** Section 3.8 — `test_tenant_rls.sql`
- Basejump pattern: `basejump-supabase_test_helpers`

---

### Sub-Phase 6.2: Vitest UI tests & CI pipeline (Tasks 6.3 → 6.4)

**Scope:** Viết Vitest tests cho UI components, CI pipeline, pre-commit hooks

**Files cần đọc:**
- `vitest.config.ts`
- `package.json` (test scripts)
- Các page components đã tạo
- `.github/workflows/` (nếu có)
- `workflow.yml`

**Files cần tạo/sửa:**
- `tests/admin-dashboard/Overview.test.tsx` (tạo mới)
- `tests/admin-dashboard/Tenants.test.tsx` (tạo mới)
- `tests/admin-dashboard/Members.test.tsx` (tạo mới)
- `tests/admin-dashboard/Billing.test.tsx` (tạo mới)
- `tests/admin-dashboard/Audit.test.tsx` (tạo mới)
- `tests/admin-dashboard/Security.test.tsx` (tạo mới)
- `.github/workflows/ci.yml` (tạo mới)
- `package.json` (sửa — thêm pre-commit script)

**Context consumption estimate:**
- Đọc config + pages: ~50KB → ~12.5K tokens
- Tạo 6 test files + CI config: ~40KB → ~10K tokens
- Plan + overhead: ~40K tokens
- **Tổng: ~62K tokens** ✅ An toàn

**Basejump reference:** Không cần (UI tests + CI là generic, không phụ thuộc Basejump patterns)

---

## Phase 7 — Enterprise nâng cao

**Tổng context estimate:** ~100K tokens → **2 sub-phases** (7.1–7.2 + 7.3–7.4)

### Sub-Phase 7.1: Real-time notifications & Background jobs (Tasks 7.1 → 7.2)

**Scope:** Supabase Realtime cho admin events, cron jobs cho billing reminders, audit log retention

**Files cần đọc:**
- `components/NotificationManager.tsx`
- `services/notificationService.ts`
- `pages/admin/Health.tsx`
- `components/SystemHealthPanel.tsx`
- `supabase/config.toml`

**Files cần tạo/sửa:**
- `supabase/migrations/xxxx_admin_realtime_broadcast.sql` (tạo mới)
- `hooks/useAdminRealtime.ts` (tạo mới)
- `components/AdminNotificationBell.tsx` (tạo mới)
- `supabase/migrations/xxxx_admin_cron_jobs.sql` (tạo mới)
- `supabase/functions/cron-admin-tasks/index.ts` (tạo mới)
- `pages/admin/Health.tsx` (sửa)
- `components/SystemHealthPanel.tsx` (sửa)

**Context consumption estimate:**
- Đọc components + services + config: ~30KB → ~7.5K tokens
- Tạo 5 files mới + sửa 2 files: ~35KB → ~8.5K tokens
- Plan + overhead: ~40K tokens
- **Tổng: ~56K tokens** ✅ An toàn

**Basejump reference:** Không cần thiết (real-time và cron là Supabase built-in features)

---

### Sub-Phase 7.2: Advanced analytics & GDPR compliance (Tasks 7.3 → 7.4)

**Scope:** Analytics dashboard (churn, cohort, revenue), GDPR export/data deletion

**Files cần đọc:**
- `components/RevenueMetrics.tsx`
- `components/ChurnCohortMetrics.tsx`
- `components/ComplianceManager.tsx`
- `services/complianceService.ts`
- `services/analyticsAdminService.ts` (nếu đã có)

**Files cần tạo/sửa:**
- `pages/admin/Analytics.tsx` (tạo mới)
- `services/admin/analyticsAdminService.ts` (tạo mới)
- `supabase/migrations/xxxx_gdpr_export_functions.sql` (tạo mới)
- `pages/admin/Compliance.tsx` (sửa)
- `services/admin/complianceAdminService.ts` (tạo mới)

**Context consumption estimate:**
- Đọc analytics + compliance components: ~30KB → ~7.5K tokens
- Tạo 3 files mới + sửa 2 files: ~30KB → ~7.5K tokens
- Plan + overhead: ~40K tokens
- **Tổng: ~55K tokens** ✅ An toàn

**Basejump reference:** Không cần thiết (analytics và GDPR là tính năng riêng, không copy từ Basejump)

---

## Tổng quan Sub-Phases

| Sub-Phase | Tasks gốc | Mô tả | ~Tokens | Basejump pattern cần tham khảo |
|-----------|-----------|-------|---------|-------------------------------|
| **0.1** | 0.1 → 0.6 | Build, lint, TypeScript, foundation components | ~50K | Không cần |
| **1.1** | 1.1 → 1.4 | Tách monolith thành pages | ~110K | Không cần |
| **1.2** | 1.5 → 1.7 | Code splitting, Basejump UI, Onboarding | ~70K | Section 3.9 (UI patterns) |
| **2.1** | 2.1 → 2.3 | Service layer structure, migrate queries | ~107K | Service layer pattern |
| **2.2** | 2.4 → 2.5 | useAdminList hook, API contracts | ~57K | RPC contracts pattern |
| **3.1** | 3.1 → 3.2 | Migration schema, DB helper functions | ~50K | Section 3.1, 3.2, 3.4, 3.5 |
| **3.2** | 3.3 → 3.5 | RLS policies, permissions.ts, edge functions | ~57K | Section 3.3 (RLS) |
| **3.3** | 3.6 → 3.7 | RLS cho tenant-scoped tables, tracking triggers | ~53K | Section 3.3, 3.5 |
| **4.1** | 4.1 → 4.3 | Billing schema, UI components, lifecycle | ~70K | Billing schema (Basejump) |
| **4.2** | 4.4 → 4.5 | Billing provider abstraction, feature gating | ~57K | Section 3.6, 3.7 |
| **5.1** | 5.1 → 5.2 | Invitations, RBAC | ~61K | basejump-invitations |
| **5.2** | 5.3 → 5.4 | Audit log, security hardening | ~67K | Audit triggers pattern |
| **6.1** | 6.1 → 6.2 + 6.5 | pgtap tests, DB test helpers | ~57K | Section 3.8 (testing helpers) |
| **6.2** | 6.3 → 6.4 | Vitest UI tests, CI pipeline | ~62K | Không cần |
| **7.1** | 7.1 → 7.2 | Real-time notifications, cron jobs | ~56K | Không cần |
| **7.2** | 7.3 → 7.4 | Analytics, GDPR compliance | ~55K | Không cần |

**Tổng số sub-phases: 16**

Mỗi sub-phase đều ≤ **110K tokens** (rất an toàn, dưới giới hạn 220K).

---

## Hướng dẫn sử dụng cho AI Agent

Khi thực hiện bất kỳ sub-phase nào, hãy include đoạn instruction sau vào prompt:

```
## Yêu cầu khi thực hiện sub-phase này

1. **Tham khảo Basejump patterns:** Trước khi code, đọc lại Section tương ứng trong 
   `PLAN_BASEJUMP_ADMIN_DASHBOARD_ENTERPRISE_UPGRADE.md` để hiểu pattern cần copy.
   Các section cần tham khảo được liệt kê trong cột "Basejump pattern cần tham khảo"
   ở file SUB_PHASE_BREAKDOWN_BASEJUMP_ADMIN_DASHBOARD.md.

2. **Sinh code theo pattern:**
   - Migration SQL: theo mẫu Section 3.1–3.5
   - RLS function: theo mẫu Section 3.2–3.3
   - Trigger: theo mẫu Section 3.4–3.5
   - Billing wrapper: theo mẫu Section 3.6
   - Testing helpers: theo mẫu Section 3.8

3. **Kiểm soát context:** Sub-phase này đã được thiết kế để ≤ 110K tokens.
   Nếu thấy sắp vượt quá, hãy:
   - Chia nhỏ thành 2 commit trong cùng session
   - Chỉ đọc file thực sự cần thiết
   - Dùng search_files thay vì read_file khi có thể

4. **Kiểm tra build sau mỗi task:** 
   - `npm run build` sau mỗi task hoàn thành
   - Chỉ chuyển sang task tiếp theo khi build xanh

5. **Không vượt scope:** Chỉ implement đúng các task được liệt kê trong sub-phase này.
   Các task khác sẽ được xử lý ở sub-phase riêng.

6. **Sau khi hoàn thành:** Đánh dấu sub-phase đã xong và checkout nhánh mới cho sub-phase tiếp theo.
```

---

## Lưu ý đặc biệt

1. **`supabaseService.ts` (147KB):** File cực lớn, khi cần đọc file này (Sub-Phase 2.1), Agent nên:
   - Dùng `search_files` với regex để tìm function cụ thể thay vì đọc toàn bộ
   - Hoặc dùng `read_file` với start_line/end_line để đọc từng phần
   - Hoặc dùng `codebase-memory-mcp` `get_code_snippet` để lấy function cụ thể

2. **`SystemAdminDashboard.tsx` (125KB):** File này cần đọc toàn bộ ở Sub-Phase 1.1 (~31K tokens).
   Budget vẫn còn dư (~110K), nên an toàn.

3. **Baseline migration (525KB):** Không bao giờ đọc file này toàn bộ (~131K tokens).
   Nếu cần tham khảo, chỉ đọc vài dòng đầu + dùng search_files.

4. **Thứ tự thực hiện:** Luôn theo dependency graph:
   ```
   Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 + Phase 5 (song song) → Phase 6 → Phase 7
   ```

5. **Checkpoint:** Sau mỗi Phase (khi đã hoàn thành tất cả sub-phases của Phase đó),
   dừng lại review với human trước khi sang Phase tiếp theo.